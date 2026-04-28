package com.unichristus.libraryapi.application.notification;

import com.unichristus.libraryapi.application.dto.response.AlertResponse;
import com.unichristus.libraryapi.domain.alert.AlertChannel;
import com.unichristus.libraryapi.domain.alert.AlertDeliveryService;
import com.unichristus.libraryapi.domain.alert.AlertDeliveryStatus;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.mail.MailException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Slf4j
@Component
@RequiredArgsConstructor
@ConditionalOnProperty(name = "alerts.email.enabled", havingValue = "true")
public class EmailReadingAlertNotifier implements ReadingAlertNotifier {

    private final JavaMailSender mailSender;
    private final AlertDeliveryService alertDeliveryService;

    @Value("${alerts.email.from}")
    private String from;

    private final ConcurrentHashMap<UUID, String> lastDigestByUser = new ConcurrentHashMap<>();

    @Override
    public void notifyUser(UUID userId, String userEmail, List<AlertResponse> alerts) {
        if (alerts == null || alerts.isEmpty() || userEmail == null || userEmail.isBlank()) {
            return;
        }

        String digest = alerts.stream().map(a -> a.id() + "|" + a.message()).sorted().reduce("", (a, b) -> a + ";" + b);
        String previous = lastDigestByUser.put(userId, digest);
        if (digest.equals(previous)) {
            for (AlertResponse alert : alerts) {
                safeRegister(
                        userId,
                        userEmail,
                        alert.type(),
                        AlertChannel.EMAIL,
                        AlertDeliveryStatus.SKIPPED,
                        "duplicate-digest");
            }
            return;
        }

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, StandardCharsets.UTF_8.name());
            helper.setFrom(from);
            helper.setTo(userEmail);
            helper.setSubject("Library - Alertas de leitura");
            helper.setText(buildBody(alerts), false);
            mailSender.send(message);
            for (AlertResponse alert : alerts) {
                safeRegister(
                        userId,
                        userEmail,
                        alert.type(),
                        AlertChannel.EMAIL,
                        AlertDeliveryStatus.SENT,
                        alert.message());
            }
        } catch (MessagingException | MailException ex) {
            log.warn("Falha ao enviar alerta de leitura para {}: {}", userEmail, ex.getMessage());
            for (AlertResponse alert : alerts) {
                safeRegister(
                        userId,
                        userEmail,
                        alert.type(),
                        AlertChannel.EMAIL,
                        AlertDeliveryStatus.FAILED,
                        ex.getMessage());
            }
        }
    }

    private void safeRegister(
            UUID userId,
            String userEmail,
            com.unichristus.libraryapi.application.dto.response.AlertType alertType,
            AlertChannel channel,
            AlertDeliveryStatus status,
            String message
    ) {
        try {
            alertDeliveryService.register(userId, userEmail, alertType, channel, status, message);
        } catch (Exception ex) {
            log.warn("Falha ao registrar auditoria de alerta {} para usuario {}: {}", alertType, userId, ex.getMessage());
        }
    }

    private String buildBody(List<AlertResponse> alerts) {
        StringBuilder body = new StringBuilder("Voce possui alertas de leitura no Library:\n\n");
        for (AlertResponse alert : alerts) {
            body.append("- [").append(alert.severity()).append("] ").append(alert.message());
            if (alert.suggestedDailyPages() != null) {
                body.append(" (Sugestao: ").append(alert.suggestedDailyPages()).append(" paginas/dia)");
            }
            body.append('\n');
        }
        body.append("\nAbra a plataforma para acompanhar sua meta e streak.");
        return body.toString();
    }
}
