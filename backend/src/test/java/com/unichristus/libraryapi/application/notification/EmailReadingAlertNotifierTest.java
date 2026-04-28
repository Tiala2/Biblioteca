package com.unichristus.libraryapi.application.notification;

import com.unichristus.libraryapi.application.dto.response.AlertResponse;
import com.unichristus.libraryapi.application.dto.response.AlertSeverity;
import com.unichristus.libraryapi.application.dto.response.AlertType;
import com.unichristus.libraryapi.domain.alert.AlertDeliveryService;
import jakarta.mail.Session;
import jakarta.mail.internet.MimeMessage;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.List;
import java.util.Properties;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class EmailReadingAlertNotifierTest {

    @Mock
    private JavaMailSender mailSender;

    @Mock
    private AlertDeliveryService alertDeliveryService;

    @Test
    void shouldIgnoreAuditRegistrationFailuresAfterSuccessfulSend() {
        EmailReadingAlertNotifier notifier = new EmailReadingAlertNotifier(mailSender, alertDeliveryService);
        ReflectionTestUtils.setField(notifier, "from", "no-reply@library.local");

        AlertResponse alert = new AlertResponse(
                "pace-warning",
                AlertType.PACE_WARNING,
                AlertSeverity.INFO,
                "Ajuste seu ritmo de leitura",
                8
        );

        when(mailSender.createMimeMessage()).thenReturn(new MimeMessage(Session.getInstance(new Properties())));
        doThrow(new RuntimeException("audit unavailable"))
                .when(alertDeliveryService)
                .register(any(), anyString(), any(), any(), any(), anyString());

        assertThatCode(() -> notifier.notifyUser(UUID.randomUUID(), "user@email.com", List.of(alert)))
                .doesNotThrowAnyException();
    }
}
