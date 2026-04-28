package com.unichristus.libraryapi.application.usecase.admin;

import com.unichristus.libraryapi.application.annotation.UseCase;
import com.unichristus.libraryapi.application.dto.response.AlertDeliveryResponse;
import com.unichristus.libraryapi.application.dto.response.AlertType;
import com.unichristus.libraryapi.domain.alert.AlertDeliveryService;
import com.unichristus.libraryapi.domain.alert.AlertDeliveryStatus;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.LocalDateTime;
import java.util.UUID;

@UseCase
@RequiredArgsConstructor
public class AlertDeliveryAdminUseCase {

    private final AlertDeliveryService alertDeliveryService;

    public Page<AlertDeliveryResponse> list(String query,
                                            UUID userId,
                                            AlertDeliveryStatus status,
                                            AlertType alertType,
                                            LocalDateTime dateFrom,
                                            LocalDateTime dateTo,
                                            Pageable pageable) {
        return alertDeliveryService.search(query, userId, status, alertType, dateFrom, dateTo, pageable)
                .map(delivery -> new AlertDeliveryResponse(
                        delivery.getId(),
                        delivery.getUserId(),
                        delivery.getEmail(),
                        delivery.getAlertType(),
                        delivery.getChannel(),
                        delivery.getStatus(),
                        delivery.getMessage(),
                        delivery.getCreatedAt()
                ));
    }
}
