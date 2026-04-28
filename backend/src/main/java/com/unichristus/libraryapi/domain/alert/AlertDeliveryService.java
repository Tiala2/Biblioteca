package com.unichristus.libraryapi.domain.alert;

import com.unichristus.libraryapi.application.dto.response.AlertType;
import com.unichristus.libraryapi.domain.exception.DomainError;
import com.unichristus.libraryapi.domain.exception.DomainException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AlertDeliveryService {

    private final AlertDeliveryRepository repository;

    @Transactional
    public AlertDelivery register(UUID userId,
                                  String email,
                                  AlertType alertType,
                                  AlertChannel channel,
                                  AlertDeliveryStatus status,
                                  String message) {
        AlertDelivery delivery = AlertDelivery.builder()
                .userId(userId)
                .email(email)
                .alertType(alertType)
                .channel(channel)
                .status(status)
                .message(message)
                .build();
        return repository.save(delivery);
    }

    public Page<AlertDelivery> list(UUID userId, Pageable pageable) {
        if (userId == null) {
            return repository.findAll(pageable);
        }
        return repository.findByUserId(userId, pageable);
    }

    public Page<AlertDelivery> search(String query,
                                      UUID userId,
                                      AlertDeliveryStatus status,
                                      AlertType alertType,
                                      LocalDateTime dateFrom,
                                      LocalDateTime dateTo,
                                      Pageable pageable) {
        if (dateFrom != null && dateTo != null && dateFrom.isAfter(dateTo)) {
            throw new DomainException(DomainError.SEARCH_FILTER_INVALID, "dateFrom nao pode ser apos dateTo");
        }
        String normalizedQuery = query == null || query.isBlank() ? null : query.trim().toLowerCase();
        return repository.search(normalizedQuery, userId, status, alertType, dateFrom, dateTo, pageable);
    }
}
