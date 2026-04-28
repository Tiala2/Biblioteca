package com.unichristus.libraryapi;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.options;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class HttpSecurityIntegrationTest extends IntegrationTestSupport {

    @Test
    @DisplayName("Deve expor headers de seguranca nas respostas")
    void shouldExposeSecurityHeaders() throws Exception {
        mockMvc.perform(get("/actuator/health"))
                .andExpect(status().isOk())
                .andExpect(header().string("Content-Security-Policy", "default-src 'self'; frame-ancestors 'none'; object-src 'none'; base-uri 'self'; form-action 'self'"))
                .andExpect(header().string("Referrer-Policy", "no-referrer"))
                .andExpect(header().string("X-Frame-Options", "DENY"))
                .andExpect(header().string("Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=(), usb=()"))
                .andExpect(header().exists("X-Trace-Id"));
    }

    @Test
    @DisplayName("Deve reutilizar X-Trace-Id valido enviado pelo cliente")
    void shouldReuseIncomingTraceIdHeader() throws Exception {
        mockMvc.perform(get("/actuator/health")
                        .header("X-Trace-Id", "trace-health-1234"))
                .andExpect(status().isOk())
                .andExpect(header().string("X-Trace-Id", "trace-health-1234"));
    }

    @Test
    @DisplayName("Deve responder preflight apenas para origem permitida")
    void shouldHandleCorsPreflightForAllowedOrigin() throws Exception {
        mockMvc.perform(options("/api/v1/auth/login")
                        .header("Origin", "http://localhost:5173")
                        .header("Access-Control-Request-Method", "POST")
                        .header("Access-Control-Request-Headers", "Authorization,Content-Type"))
                .andExpect(status().isOk())
                .andExpect(header().string("Access-Control-Allow-Origin", "http://localhost:5173"))
                .andExpect(header().string("Access-Control-Allow-Credentials", "true"));
    }

    @Test
    @DisplayName("Deve bloquear preflight CORS de origem nao permitida")
    void shouldRejectCorsPreflightForDisallowedOrigin() throws Exception {
        mockMvc.perform(options("/api/v1/auth/login")
                        .header("Origin", "https://evil.example")
                        .header("Access-Control-Request-Method", "POST")
                        .header("Access-Control-Request-Headers", "Authorization,Content-Type"))
                .andExpect(status().isForbidden())
                .andExpect(header().doesNotExist("Access-Control-Allow-Origin"));
    }

    @Test
    @DisplayName("Deve manter documentacao aberta no ambiente de teste")
    void shouldAllowApiDocsInTestProfile() throws Exception {
        mockMvc.perform(get("/v3/api-docs"))
                .andExpect(status().isOk());
    }
}
