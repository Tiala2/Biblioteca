package com.unichristus.libraryapi.infrastructure.persistence.engagement;

import com.unichristus.libraryapi.domain.engagement.Badge;
import com.unichristus.libraryapi.domain.engagement.BadgeCode;
import com.unichristus.libraryapi.domain.engagement.BadgeCriteriaType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface BadgeJpaRepository extends JpaRepository<Badge, UUID> {
    Optional<Badge> findByCode(BadgeCode code);
    boolean existsByCode(BadgeCode code);
    List<Badge> findByCriteriaTypeAndActiveTrue(BadgeCriteriaType criteriaType);
}
