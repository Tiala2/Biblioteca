package com.unichristus.libraryapi.presentation.controller;

import com.unichristus.libraryapi.application.dto.response.HomeResponse;
import com.unichristus.libraryapi.application.usecase.home.HomeResumeUseCase;
import com.unichristus.libraryapi.infrastructure.security.LoggedUser;
import com.unichristus.libraryapi.presentation.common.ServiceURI;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@Tag(name = "Home", description = "Operações relacionadas à página inicial do usuário")
@RestController
@RequiredArgsConstructor
@RequestMapping(ServiceURI.HOME_RESOURCE)
public class HomeController {

    private final HomeResumeUseCase homeResumeUseCase;

    @Operation(summary = "Obter resumo da página inicial", description = "Retorna um resumo personalizado com informacões relevantes para a página inicial do usuário")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Resumo da página inicial retornado com sucesso")
    })
    @GetMapping("resume")
    public HomeResponse resume(@LoggedUser UUID userId) {
        return homeResumeUseCase.resume(userId);
    }
}
