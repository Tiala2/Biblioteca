package com.unichristus.libraryapi.infrastructure.persistence.engagement;

import com.unichristus.libraryapi.domain.engagement.BadgeCode;
import com.unichristus.libraryapi.domain.engagement.UserBadge;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface UserBadgeJpaRepository extends JpaRepository<UserBadge, UUID> {
    boolean existsByUser_IdAndBadge_Code(UUID userId, BadgeCode code);
    List<UserBadge> findByBadge_Id(UUID badgeId);

    @EntityGraph(attributePaths = {"badge"})
    List<UserBadge> findByUser_IdOrderByAwardedAtDesc(UUID userId);

    @EntityGraph(attributePaths = {"badge"})
    Page<UserBadge> findByUser_Id(UUID userId, Pageable pageable);
}
