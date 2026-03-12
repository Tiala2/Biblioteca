package com.unichristus.libraryapi.domain.engagement;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface BadgeDefinitionRepository {
    Optional<Badge> findByCode(BadgeCode code);
    Optional<Badge> findById(UUID id);
    Page<Badge> findAll(Pageable pageable);
    List<Badge> findActiveByCriteriaType(BadgeCriteriaType criteriaType);
    Badge save(Badge badge);
    void delete(Badge badge);
    boolean existsByCode(BadgeCode code);
}
