package com.unichristus.libraryapi.domain.reading;

import com.unichristus.libraryapi.domain.book.Book;
import com.unichristus.libraryapi.domain.engagement.EngagementEventPublisher;
import com.unichristus.libraryapi.domain.user.User;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ReadingSessionService {

    private final ReadingSessionRepository repository;
    private final EngagementEventPublisher engagementEventPublisher;

    @Transactional
    public ReadingSession registerSession(UUID userId, Book book, int pagesRead) {
        if (pagesRead <= 0) {
            return null;
        }
        ReadingSession session = ReadingSession.builder()
                .user(User.builder().id(userId).build())
                .book(book)
                .pagesRead(pagesRead)
                .loggedAt(LocalDateTime.now())
                .build();
        ReadingSession saved = repository.save(session);

        // Após registrar sessão, recalcula streak e emite evento para badges
        int streak = calculateCurrentStreakDays(userId);
        engagementEventPublisher.streakUpdated(userId, streak);
        engagementEventPublisher.readingProgressed(userId);

        return saved;
    }

    public List<ReadingSession> findByUserAfter(UUID userId, LocalDateTime after) {
        return repository.findByUserAfter(userId, after);
    }

    public int sumPagesBetween(UUID userId, LocalDateTime startInclusive, LocalDateTime endExclusive) {
        return repository.sumPagesByUserBetween(userId, startInclusive, endExclusive);
    }

    public List<ReadingSession> findByUserOrdered(UUID userId) {
        return repository.findByUserOrdered(userId);
    }

    public int calculateCurrentStreakDays(UUID userId) {
        List<ReadingSession> sessions = repository.findByUserOrdered(userId);
        if (sessions.isEmpty()) {
            return 0;
        }
        LocalDate today = LocalDate.now();
        int streak = 0;
        LocalDate lastCountedDay = null;

        for (ReadingSession session : sessions) {
            LocalDate day = session.getLoggedAt().toLocalDate();

            // Consolida múltiplas sessões no mesmo dia
            if (lastCountedDay != null && day.isEqual(lastCountedDay)) {
                continue;
            }

            if (streak == 0) {
                // A streak só começa se houve leitura hoje ou ontem
                if (day.isEqual(today) || day.isEqual(today.minusDays(1))) {
                    streak = 1;
                    lastCountedDay = day;
                } else {
                    break; // mais antigo que ontem, streak é zero
                }
                continue;
            }

            // Segue contando apenas se o dia corrente é exatamente o anterior ao último contado
            LocalDate expectedPreviousDay = lastCountedDay.minusDays(1);
            if (day.isEqual(expectedPreviousDay)) {
                streak++;
                lastCountedDay = day;
            } else {
                break; // gap encontrado
            }
        }
        return streak;
    }
}
