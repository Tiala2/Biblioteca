package com.unichristus.libraryapi.application.usecase.auth;

import com.unichristus.libraryapi.application.annotation.UseCase;
import com.unichristus.libraryapi.domain.user.PasswordResetToken;
import com.unichristus.libraryapi.domain.user.PasswordResetTokenRepository;
import com.unichristus.libraryapi.domain.user.User;
import com.unichristus.libraryapi.domain.user.UserService;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;

import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;
import java.util.UUID;

@Slf4j
@UseCase
@RequiredArgsConstructor
public class ForgotPasswordUseCase {
    private static final String DEFAULT_FRONTEND_BASE_URL = "http://localhost:5173";

    private final UserService userService;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final ObjectProvider<JavaMailSender> mailSenderProvider;

    @Value("${alerts.email.from:no-reply@library.local}")
    private String from;

    @Value("${app.frontend.base-url:http://localhost:5173}")
    private String frontendBaseUrl;

    @Value("${app.frontend.allowed-reset-base-urls:http://localhost:5173}")
    private String allowedResetBaseUrls;

    @Value("${app.auth.reset-password.token-expiration-minutes:30}")
    private long tokenExpirationMinutes;

    public void sendRecoveryEmail(String email, String requestedBaseUrl) {
        Optional<User> userOpt = userService.findUserByEmail(email);
        if (userOpt.isEmpty()) {
            log.info("Recuperacao de senha solicitada para email nao cadastrado: {}", email);
            return;
        }

        User user = userOpt.get();
        LocalDateTime now = LocalDateTime.now();
        passwordResetTokenRepository.invalidateActiveByUserId(user.getId(), now);
        String token = UUID.randomUUID().toString();
        passwordResetTokenRepository.save(PasswordResetToken.builder()
                .userId(user.getId())
                .token(token)
                .expiresAt(now.plusMinutes(tokenExpirationMinutes))
                .build());
        String resetLink = resolveFrontendBaseUrl(requestedBaseUrl) + "/reset-password/" + token;

        try {
            JavaMailSender mailSender = mailSenderProvider.getIfAvailable();
            if (mailSender == null) {
                log.info("JavaMailSender indisponivel; simulando envio de recuperacao para {}", user.getEmail());
                return;
            }
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, StandardCharsets.UTF_8.name());
            helper.setFrom(from);
            helper.setTo(user.getEmail());
            helper.setSubject("Library - Recuperacao de senha");
            helper.setText(buildPlainBody(user.getName(), resetLink), buildHtmlBody(user.getName(), resetLink));
            mailSender.send(message);
            log.info("Email de recuperacao enviado para {}", user.getEmail());
        } catch (Exception ex) {
            log.warn("Falha ao enviar email de recuperacao para {}: {}", user.getEmail(), ex.getMessage());
        }
    }

    public void sendRecoveryEmail(String email) {
        sendRecoveryEmail(email, null);
    }

    private String resolveFrontendBaseUrl(String requestedBaseUrl) {
        String fallbackBaseUrl = normalizeBaseUrl(frontendBaseUrl).orElse(DEFAULT_FRONTEND_BASE_URL);
        Optional<String> requested = normalizeBaseUrl(requestedBaseUrl);
        if (requested.isEmpty()) {
            return fallbackBaseUrl;
        }

        Set<String> allowedBaseUrls = parseAllowedBaseUrls(allowedResetBaseUrls);
        if (allowedBaseUrls.contains(requested.get())) {
            return requested.get();
        }

        log.warn("Base URL de recuperacao ignorada por nao estar permitida: {}", requested.get());
        return fallbackBaseUrl;
    }

    private Set<String> parseAllowedBaseUrls(String rawAllowedBaseUrls) {
        if (rawAllowedBaseUrls == null || rawAllowedBaseUrls.isBlank()) {
            return Set.of();
        }

        return Arrays.stream(rawAllowedBaseUrls.split(","))
                .map(String::trim)
                .map(this::normalizeBaseUrl)
                .flatMap(Optional::stream)
                .collect(Collectors.toSet());
    }

    private Optional<String> normalizeBaseUrl(String rawBaseUrl) {
        if (rawBaseUrl == null || rawBaseUrl.isBlank()) {
            return Optional.empty();
        }

        String value = rawBaseUrl.trim();
        if (!(value.startsWith("http://") || value.startsWith("https://"))) {
            return Optional.empty();
        }

        while (value.endsWith("/")) {
            value = value.substring(0, value.length() - 1);
        }

        return Optional.of(value);
    }

    private String buildPlainBody(String name, String resetLink) {
        return "Ola, " + name + ".\n\n"
                + "Recebemos uma solicitacao para recuperar sua senha no Library.\n\n"
                + "Clique no link para redefinir sua senha:\n"
                + resetLink + "\n\n"
                + "Se voce nao solicitou, ignore este email.";
    }

    private String buildHtmlBody(String name, String resetLink) {
        return "<html><body style=\"font-family:Arial,sans-serif;color:#111\">"
                + "<p>Ola, " + name + ".</p>"
                + "<p>Recebemos uma solicitacao para recuperar sua senha no Library.</p>"
                + "<p><a href=\"" + resetLink + "\" "
                + "style=\"display:inline-block;padding:10px 16px;background:#111;color:#fff;text-decoration:none;border-radius:6px\">"
                + "Redefinir senha</a></p>"
                + "<p>Se o botao nao abrir, copie e cole este link no navegador:</p>"
                + "<p><a href=\"" + resetLink + "\">" + resetLink + "</a></p>"
                + "<p>Se voce nao solicitou, ignore este email.</p>"
                + "</body></html>";
    }
}
