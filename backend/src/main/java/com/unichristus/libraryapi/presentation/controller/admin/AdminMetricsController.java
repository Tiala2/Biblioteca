package com.unichristus.libraryapi.presentation.controller.admin;

import com.unichristus.libraryapi.application.dto.response.AdminMetricsResponse;
import com.unichristus.libraryapi.application.usecase.admin.AdminMetricsUseCase;
import com.unichristus.libraryapi.presentation.common.ServiceURI;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "[Admin]", description = "Métricas administrativas")
@RestController
@RequiredArgsConstructor
@RequestMapping(ServiceURI.METRICS_ADMIN)
public class AdminMetricsController {

    private final AdminMetricsUseCase adminMetricsUseCase;

    @Operation(summary = "Métricas consolidadas", description = "Retorna contagens agregadas para o painel admin")
    @GetMapping
    public AdminMetricsResponse getMetrics() {
        return adminMetricsUseCase.getMetrics();
    }
}
