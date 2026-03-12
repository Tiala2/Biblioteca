package com.unichristus.libraryapi.domain.alert;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import com.unichristus.libraryapi.application.dto.response.AlertType;
import java.time.LocalDateTime;
import java.util.UUID;

public interface AlertDeliveryRepository {

    AlertDelivery save(AlertDelivery delivery);

    Page<AlertDelivery> findAll(Pageable pageable);

    Page<AlertDelivery> findByUserId(UUID userId, Pageable pageable);

    Page<AlertDelivery> search(UUID userId,
                               AlertDeliveryStatus status,
                               AlertType alertType,
                               LocalDateTime dateFrom,
                               LocalDateTime dateTo,
                               Pageable pageable);
}
