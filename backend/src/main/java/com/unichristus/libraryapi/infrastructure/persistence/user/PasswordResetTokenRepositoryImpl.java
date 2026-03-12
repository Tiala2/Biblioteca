package com.unichristus.libraryapi.infrastructure.persistence.user;

import com.unichristus.libraryapi.domain.user.PasswordResetToken;
import com.unichristus.libraryapi.domain.user.PasswordResetTokenRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

@Repository
@RequiredArgsConstructor
public class PasswordResetTokenRepositoryImpl implements PasswordResetTokenRepository {

    private final PasswordResetTokenJpaRepository passwordResetTokenJpaRepository;

    @Override
    public PasswordResetToken save(PasswordResetToken token) {
        return passwordResetTokenJpaRepository.save(token);
    }

    @Override
    public Optional<PasswordResetToken> findValidByToken(String token, LocalDateTime now) {
        return passwordResetTokenJpaRepository.findValidByToken(token, now);
    }

    @Override
    @Transactional
    public void invalidateActiveByUserId(UUID userId, LocalDateTime now) {
        passwordResetTokenJpaRepository.invalidateActiveByUserId(userId, now);
    }

    @Override
    public Optional<PasswordResetToken> findLatestByUserId(UUID userId) {
        return passwordResetTokenJpaRepository.findTopByUserIdOrderByCreatedAtDesc(userId);
    }
}

