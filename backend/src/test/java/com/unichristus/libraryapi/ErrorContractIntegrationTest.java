package com.unichristus.libraryapi;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class ErrorContractIntegrationTest extends IntegrationTestSupport {

    @Test
    @DisplayName("Deve retornar codigo padrao para autenticacao invalida")
    void shouldReturnStandardCodeForAuthenticationFailure() throws Exception {
        String email = "error-auth-" + System.nanoTime() + "@email.com";
        registerUser("Error Auth", email, "StrongPass123");

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"" + email + "\",\"password\":\"senha-errada\"}"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("AUTHENTICATION_FAILED"))
                .andExpect(jsonPath("$.message").value("Autenticacao obrigatoria ou invalida."));
    }

    @Test
    @DisplayName("Deve retornar codigo padrao para acesso negado")
    void shouldReturnStandardCodeForAccessDenied() throws Exception {
        String token = registerAndLogin("Regular Error", "regular-error-" + System.nanoTime() + "@email.com", "StrongPass123");

        mockMvc.perform(post("/api/admin/tags")
                        .header("Authorization", bearer(token))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"TagSemPermissao\"}"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("ACCESS_DENIED"))
                .andExpect(jsonPath("$.message").value("Acesso negado."));
    }

    @Test
    @DisplayName("Deve retornar codigo padrao para corpo malformado")
    void shouldReturnStandardCodeForMalformedRequest() throws Exception {
        String adminToken = registerPromoteAndLoginAdmin("Admin Malformed", "admin-malformed-" + System.nanoTime() + "@email.com", "StrongPass123");

        mockMvc.perform(post("/api/admin/tags")
                        .header("Authorization", bearer(adminToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("INVALID_REQUEST"))
                .andExpect(jsonPath("$.message").value("Requisicao invalida."));
    }

    @Test
    @DisplayName("Deve manter codigo de validacao com fieldErrors")
    void shouldKeepValidationErrorContract() throws Exception {
        String adminToken = registerPromoteAndLoginAdmin("Admin Validation", "admin-validation-" + System.nanoTime() + "@email.com", "StrongPass123");

        mockMvc.perform(post("/api/admin/tags")
                        .header("Authorization", bearer(adminToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_ERROR"))
                .andExpect(jsonPath("$.fieldErrors[0].field").value("name"));
    }
}
