package com.unichristus.libraryapi.domain.engagement;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.UUID;

public interface UserBadgeRepository {
    boolean existsByUserAndBadgeCode(UUID userId, BadgeCode code);
    UserBadge save(UserBadge userBadge);
    List<UserBadge> findByUser(UUID userId);
    Page<UserBadge> findByUser(UUID userId, Pageable pageable);
}
