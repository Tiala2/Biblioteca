package com.unichristus.libraryapi.presentation.controller.admin;

import com.unichristus.libraryapi.application.dto.response.AlertDeliveryResponse;
import com.unichristus.libraryapi.application.dto.response.AlertType;
import com.unichristus.libraryapi.application.usecase.admin.AlertDeliveryAdminUseCase;
import com.unichristus.libraryapi.domain.alert.AlertDeliveryStatus;
import com.unichristus.libraryapi.presentation.common.PageableSanitizer;
import com.unichristus.libraryapi.presentation.common.ServiceURI;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.Set;
import java.util.UUID;

@Tag(name = "[Admin]", description = "Operações administrativas da API")
@RestController
@RequiredArgsConstructor
@RequestMapping(ServiceURI.ALERTS_ADMIN)
public class AlertAdminController {

    private static final Sort DEFAULT_SORT = Sort.by(Sort.Direction.DESC, "createdAt");
    private static final Set<String> ALLOWED_SORTS = Set.of("email", "status", "alertType", "createdAt");

    private final AlertDeliveryAdminUseCase alertDeliveryAdminUseCase;

    @GetMapping("/deliveries")
    @Operation(summary = "Auditoria de alertas enviados", description = "Lista envios de alertas por e-mail com filtros opcionais")
    @ApiResponse(responseCode = "200", description = "Lista retornada")
    public Page<AlertDeliveryResponse> listDeliveries(
            @RequestParam(required = false, name = "q") String query,
            @RequestParam(required = false) UUID userId,
            @RequestParam(required = false) AlertDeliveryStatus status,
            @RequestParam(required = false) AlertType alertType,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime dateFrom,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime dateTo,
            Pageable pageable
    ) {
        Pageable safePageable = PageableSanitizer.sanitize(pageable, DEFAULT_SORT, ALLOWED_SORTS);
        return alertDeliveryAdminUseCase.list(query, userId, status, alertType, dateFrom, dateTo, safePageable);
    }
}
