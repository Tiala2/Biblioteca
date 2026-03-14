package com.unichristus.libraryapi.application.usecase.auth;

import com.unichristus.libraryapi.domain.user.User;
import com.unichristus.libraryapi.domain.user.PasswordResetTokenRepository;
import com.unichristus.libraryapi.domain.user.UserService;
import com.unichristus.libraryapi.domain.user.UserRole;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Optional;
import java.util.UUID;

import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ForgotPasswordUseCaseTest {

    @Mock
    private UserService userService;

    @Mock
    private ObjectProvider<JavaMailSender> mailSenderProvider;

    @Mock
    private PasswordResetTokenRepository passwordResetTokenRepository;

    @Test
    void shouldNotFailWhenMailSenderIsUnavailable() {
        var user = User.builder()
                .id(UUID.randomUUID())
                .name("Test User")
                .email("test@example.com")
                .password("hashed")
                .role(UserRole.USER)
                .build();

        when(userService.findUserByEmail("test@example.com")).thenReturn(Optional.of(user));
        when(mailSenderProvider.getIfAvailable()).thenReturn(null);

        var useCase = new ForgotPasswordUseCase(userService, passwordResetTokenRepository, mailSenderProvider);
        useCase.sendRecoveryEmail("test@example.com");

        verify(mailSenderProvider).getIfAvailable();
        verify(userService).findUserByEmail("test@example.com");
        verify(passwordResetTokenRepository).invalidateActiveByUserId(
                org.mockito.ArgumentMatchers.eq(user.getId()),
                org.mockito.ArgumentMatchers.any()
        );
        verify(passwordResetTokenRepository).save(org.mockito.ArgumentMatchers.any());
        verify(mailSenderProvider, never()).getObject();
    }

    @Test
    void shouldUseRequestedBaseUrlWhenAllowed() {
        var useCase = new ForgotPasswordUseCase(userService, passwordResetTokenRepository, mailSenderProvider);
        ReflectionTestUtils.setField(useCase, "frontendBaseUrl", "http://localhost:5173");
        ReflectionTestUtils.setField(useCase, "allowedResetBaseUrls", "http://localhost:5173,https://library.school.gov");

        String resolved = ReflectionTestUtils.invokeMethod(
                useCase,
                "resolveFrontendBaseUrl",
                "https://library.school.gov/"
        );

        org.junit.jupiter.api.Assertions.assertEquals("https://library.school.gov", resolved);
    }

    @Test
    void shouldFallbackToConfiguredBaseUrlWhenRequestedBaseUrlIsNotAllowed() {
        var useCase = new ForgotPasswordUseCase(userService, passwordResetTokenRepository, mailSenderProvider);
        ReflectionTestUtils.setField(useCase, "frontendBaseUrl", "http://library.local");
        ReflectionTestUtils.setField(useCase, "allowedResetBaseUrls", "http://library.local");

        String resolved = ReflectionTestUtils.invokeMethod(
                useCase,
                "resolveFrontendBaseUrl",
                "https://external.example.com"
        );

        org.junit.jupiter.api.Assertions.assertEquals("http://library.local", resolved);
    }
}

