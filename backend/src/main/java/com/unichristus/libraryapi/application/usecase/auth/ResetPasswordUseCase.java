package com.unichristus.libraryapi.application.usecase.auth;

import com.unichristus.libraryapi.application.annotation.UseCase;
import com.unichristus.libraryapi.domain.exception.DomainError;
import com.unichristus.libraryapi.domain.exception.DomainException;
import com.unichristus.libraryapi.domain.user.PasswordResetTokenRepository;
import com.unichristus.libraryapi.domain.user.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@UseCase
@RequiredArgsConstructor
public class ResetPasswordUseCase {

    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final UserService userService;

    @Transactional
    public void resetPassword(String token, String newPassword) {
        var now = LocalDateTime.now();
        var resetToken = passwordResetTokenRepository.findValidByToken(token, now)
                .orElseThrow(() -> new DomainException(DomainError.PASSWORD_RESET_TOKEN_INVALID));

        userService.updateUser(resetToken.getUserId(), null, null, newPassword, null, null);
        resetToken.setUsedAt(now);
        passwordResetTokenRepository.save(resetToken);
    }
}

