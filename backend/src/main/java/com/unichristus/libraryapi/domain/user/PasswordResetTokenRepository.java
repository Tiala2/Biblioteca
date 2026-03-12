package com.unichristus.libraryapi.domain.user;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

public interface PasswordResetTokenRepository {

    PasswordResetToken save(PasswordResetToken token);

    Optional<PasswordResetToken> findValidByToken(String token, LocalDateTime now);

    void invalidateActiveByUserId(UUID userId, LocalDateTime now);

    Optional<PasswordResetToken> findLatestByUserId(UUID userId);
}

