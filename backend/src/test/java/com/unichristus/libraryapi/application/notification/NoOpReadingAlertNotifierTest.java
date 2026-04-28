package com.unichristus.libraryapi.application.notification;

import com.unichristus.libraryapi.application.dto.response.AlertResponse;
import com.unichristus.libraryapi.application.dto.response.AlertSeverity;
import com.unichristus.libraryapi.application.dto.response.AlertType;
import com.unichristus.libraryapi.domain.alert.AlertDeliveryService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.doThrow;

@ExtendWith(MockitoExtension.class)
class NoOpReadingAlertNotifierTest {

    @Mock
    private AlertDeliveryService alertDeliveryService;

    @Test
    void shouldIgnoreAuditRegistrationFailures() {
        NoOpReadingAlertNotifier notifier = new NoOpReadingAlertNotifier(alertDeliveryService);
        AlertResponse alert = new AlertResponse(
                "goal-expiring",
                AlertType.GOAL_EXPIRING,
                AlertSeverity.WARNING,
                "Meta expira em breve",
                12
        );

        doThrow(new RuntimeException("audit unavailable"))
                .when(alertDeliveryService)
                .register(any(), anyString(), any(), any(), any(), anyString());

        assertThatCode(() -> notifier.notifyUser(UUID.randomUUID(), "user@email.com", List.of(alert)))
                .doesNotThrowAnyException();
    }
}
