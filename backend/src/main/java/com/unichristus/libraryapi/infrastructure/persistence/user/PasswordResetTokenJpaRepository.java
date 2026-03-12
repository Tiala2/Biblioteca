package com.unichristus.libraryapi.infrastructure.persistence.user;

import com.unichristus.libraryapi.domain.user.PasswordResetToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

public interface PasswordResetTokenJpaRepository extends JpaRepository<PasswordResetToken, UUID> {

    @Query("""
            SELECT t
            FROM PasswordResetToken t
            WHERE t.token = :token
              AND t.usedAt IS NULL
              AND t.expiresAt > :now
            """)
    Optional<PasswordResetToken> findValidByToken(@Param("token") String token, @Param("now") LocalDateTime now);

    @Modifying
    @Query("""
            UPDATE PasswordResetToken t
            SET t.usedAt = :now
            WHERE t.userId = :userId
              AND t.usedAt IS NULL
              AND t.expiresAt > :now
            """)
    void invalidateActiveByUserId(@Param("userId") UUID userId, @Param("now") LocalDateTime now);

    Optional<PasswordResetToken> findTopByUserIdOrderByCreatedAtDesc(UUID userId);
}

