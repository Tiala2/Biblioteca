package com.unichristus.libraryapi.application.notification;

import com.unichristus.libraryapi.application.dto.response.AlertResponse;
import com.unichristus.libraryapi.domain.alert.AlertChannel;
import com.unichristus.libraryapi.domain.alert.AlertDeliveryService;
import com.unichristus.libraryapi.domain.alert.AlertDeliveryStatus;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.UUID;

@Slf4j
@Component
@RequiredArgsConstructor
@ConditionalOnProperty(name = "alerts.email.enabled", havingValue = "false", matchIfMissing = true)
public class NoOpReadingAlertNotifier implements ReadingAlertNotifier {

    private final AlertDeliveryService alertDeliveryService;

    @Override
    public void notifyUser(UUID userId, String userEmail, List<AlertResponse> alerts) {
        if (alerts == null || alerts.isEmpty()) {
            return;
        }
        for (AlertResponse alert : alerts) {
            safeRegister(
                    userId,
                    userEmail,
                    alert.type(),
                    AlertChannel.EMAIL,
                    AlertDeliveryStatus.SKIPPED,
                    "alerts.email.enabled=false");
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
}
