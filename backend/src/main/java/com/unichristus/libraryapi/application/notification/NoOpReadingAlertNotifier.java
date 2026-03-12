package com.unichristus.libraryapi.application.notification;

import com.unichristus.libraryapi.application.dto.response.AlertResponse;
import com.unichristus.libraryapi.domain.alert.AlertChannel;
import com.unichristus.libraryapi.domain.alert.AlertDeliveryService;
import com.unichristus.libraryapi.domain.alert.AlertDeliveryStatus;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.UUID;

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
            alertDeliveryService.register(
                    userId,
                    userEmail,
                    alert.type(),
                    AlertChannel.EMAIL,
                    AlertDeliveryStatus.SKIPPED,
                    "alerts.email.enabled=false");
        }
    }
}
