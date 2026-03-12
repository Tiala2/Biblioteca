package com.unichristus.libraryapi.infrastructure.persistence.alert;

import com.unichristus.libraryapi.domain.alert.AlertDelivery;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.UUID;

public interface AlertDeliveryJpaRepository extends JpaRepository<AlertDelivery, UUID> {

    Page<AlertDelivery> findByUserId(UUID userId, Pageable pageable);
}
