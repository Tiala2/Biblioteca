package com.unichristus.libraryapi.infrastructure.persistence.engagement;

import com.unichristus.libraryapi.domain.engagement.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
@RequiredArgsConstructor
public class BadgeRepositoryImpl implements BadgeDefinitionRepository, UserBadgeRepository {

    private final BadgeJpaRepository badgeJpaRepository;
    private final UserBadgeJpaRepository userBadgeJpaRepository;

    @Override
    public Optional<Badge> findByCode(BadgeCode code) {
        return badgeJpaRepository.findByCode(code);
    }

    @Override
    public Optional<Badge> findById(UUID id) {
        return badgeJpaRepository.findById(id);
    }

    @Override
    public Page<Badge> findAll(Pageable pageable) {
        return badgeJpaRepository.findAll(pageable);
    }

    @Override
    public List<Badge> findActiveByCriteriaType(BadgeCriteriaType criteriaType) {
        return badgeJpaRepository.findByCriteriaTypeAndActiveTrue(criteriaType);
    }

    @Override
    public Badge save(Badge badge) {
        return badgeJpaRepository.save(badge);
    }

    @Override
    public void delete(Badge badge) {
        badgeJpaRepository.delete(badge);
    }

    @Override
    public boolean existsByCode(BadgeCode code) {
        return badgeJpaRepository.existsByCode(code);
    }

    @Override
    public boolean existsByUserAndBadgeCode(UUID userId, BadgeCode code) {
        return userBadgeJpaRepository.existsByUser_IdAndBadge_Code(userId, code);
    }

    @Override
    public UserBadge save(UserBadge userBadge) {
        return userBadgeJpaRepository.save(userBadge);
    }

    @Override
    public List<UserBadge> findByUser(UUID userId) {
        return userBadgeJpaRepository.findByUser_IdOrderByAwardedAtDesc(userId);
    }

    @Override
    public Page<UserBadge> findByUser(UUID userId, Pageable pageable) {
        return userBadgeJpaRepository.findByUser_Id(userId, pageable);
    }
}
