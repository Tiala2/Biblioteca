package com.unichristus.libraryapi.domain.engagement;

import com.unichristus.libraryapi.domain.reading.ReadingRepository;
import com.unichristus.libraryapi.domain.reading.ReadingSessionRepository;
import com.unichristus.libraryapi.domain.reading.ReadingStatus;
import com.unichristus.libraryapi.domain.user.User;
import io.micrometer.core.instrument.MeterRegistry;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class BadgeService {

    private static final Logger log = LoggerFactory.getLogger(BadgeService.class);

    private final BadgeDefinitionRepository badgeDefinitionRepository;
    private final UserBadgeRepository userBadgeRepository;
    private final ReadingRepository readingRepository;
    private final ReadingSessionRepository readingSessionRepository;
    private final MeterRegistry meterRegistry;

    @Transactional
    public void awardOnReadingCompleted(UUID userId) {
        int totalPages = readingSessionRepository.sumPagesByUser(userId);
        long totalBooksFinished = readingRepository.countByUserIdAndStatus(userId, ReadingStatus.FINISHED);

        evaluateFirstBook(userId, totalBooksFinished);
        evaluateThresholdBadges(userId, BadgeCriteriaType.TOTAL_BOOKS, (int) totalBooksFinished, "READING_COMPLETED",
                "{\"totalBooksFinished\":" + totalBooksFinished + "}");
        evaluateThresholdBadges(userId, BadgeCriteriaType.TOTAL_PAGES, totalPages, "READING_COMPLETED",
            "{\"totalPagesRead\":" + totalPages + "}");
    }

        @Transactional
        public void awardOnReadingProgress(UUID userId) {
        int totalPages = readingSessionRepository.sumPagesByUser(userId);
        evaluateThresholdBadges(userId, BadgeCriteriaType.TOTAL_PAGES, totalPages, "READING_PROGRESS",
            "{\"totalPagesRead\":" + totalPages + "}");
        }

    @Transactional(readOnly = true)
    public List<UserBadge> findByUser(UUID userId) {
        return userBadgeRepository.findByUser(userId);
    }

    @Transactional(readOnly = true)
    public org.springframework.data.domain.Page<UserBadge> findByUser(UUID userId, org.springframework.data.domain.Pageable pageable) {
        return userBadgeRepository.findByUser(userId, pageable);
    }

    @Transactional
    public void awardOnStreakUpdated(UUID userId, int streakDays) {
        if (streakDays <= 0) {
            return;
        }
        evaluateThresholdBadges(userId, BadgeCriteriaType.STREAK_DAYS, streakDays, "STREAK_UPDATED",
                "{\"streakDays\":" + streakDays + "}");
    }

    private void evaluateFirstBook(UUID userId, long totalBooksFinished) {
        List<Badge> badges = badgeDefinitionRepository.findActiveByCriteriaType(BadgeCriteriaType.FIRST_BOOK);
        if (badges.isEmpty()) {
            log.debug("Badge evaluation skipped: no active FIRST_BOOK badges");
            return;
        }
        boolean condition = totalBooksFinished >= 1;
        String metadata = "{\"totalBooksFinished\":" + totalBooksFinished + "}";
        for (Badge badge : badges) {
            awardIfEligible(userId, badge, condition, "READING_COMPLETED", metadata);
        }
    }

    private void evaluateThresholdBadges(UUID userId, BadgeCriteriaType criteriaType, int actualValue, String sourceEvent, String metadata) {
        List<Badge> badges = badgeDefinitionRepository.findActiveByCriteriaType(criteriaType);
        if (badges.isEmpty()) {
            return;
        }
        for (Badge badge : badges) {
            Integer threshold = parseIntSafe(badge.getCriteriaValue());
            if (threshold == null) {
                log.warn("Badge skipped: missing numeric criteria_value for code={}", badge.getCode());
                continue;
            }
            boolean condition = actualValue >= threshold;
            awardIfEligible(userId, badge, condition, sourceEvent, enrichMetadata(metadata, threshold));
        }
    }

    private String enrichMetadata(String base, Integer threshold) {
        if (base == null) {
            return "{\"threshold\":" + threshold + "}";
        }
        // Simple merge without JSON dependencies
        if (base.endsWith("}")) {
            return base.substring(0, base.length() - 1) + ",\"threshold\":" + threshold + "}";
        }
        return base + ",\"threshold\":" + threshold;
    }

    private Integer parseIntSafe(String value) {
        if (value == null) {
            return null;
        }
        try {
            return Integer.parseInt(value);
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private void awardIfEligible(UUID userId, Badge badgeDefinition, boolean condition, String sourceEvent, String metadata) {
        if (!condition) {
            log.debug("Badge condition not met: code={} userId={}", badgeDefinition.getCode(), userId);
            return;
        }
        if (badgeDefinition == null || Boolean.FALSE.equals(badgeDefinition.getActive())) {
            log.debug("Badge inactive or null: code={} userId={}", badgeDefinition != null ? badgeDefinition.getCode() : null, userId);
            return;
        }
        BadgeCode code = badgeDefinition.getCode();
        if (userBadgeRepository.existsByUserAndBadgeCode(userId, code)) {
            log.debug("Badge already awarded: code={} userId={}", code, userId);
            return;
        }
        UserBadge userBadge = UserBadge.builder()
                .user(User.builder().id(userId).build())
                .badge(badgeDefinition)
                .awardedAt(LocalDateTime.now())
                .sourceEvent(sourceEvent)
                .metadata(metadata)
                .build();
        userBadgeRepository.save(userBadge);
        meterRegistry.counter("badges.awarded", "code", code.name()).increment();
        log.info("Badge awarded: code={} userId={} sourceEvent={}", code, userId, sourceEvent);
    }
}
