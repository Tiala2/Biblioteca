package com.unichristus.libraryapi;

import com.unichristus.libraryapi.infrastructure.security.LoginRateLimitService;
import com.unichristus.libraryapi.infrastructure.security.ForgotPasswordRateLimitService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.request.RequestPostProcessor;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class AuthIntegrationTest extends IntegrationTestSupport {

    @Autowired
    private LoginRateLimitService loginRateLimitService;

    @Autowired
    private ForgotPasswordRateLimitService forgotPasswordRateLimitService;

    @BeforeEach
    void resetRateLimitState() {
        loginRateLimitService.clearAllForTests();
        forgotPasswordRateLimitService.clearAllForTests();
    }

    @Test
    @DisplayName("Deve registrar e fazer login com sucesso")
    void shouldRegisterAndLogin() throws Exception {
        String email = "user" + System.nanoTime() + "@email.com";
        String password = "StrongPass123";

        registerUser("Tester", email, password);
        mockMvc.perform(post("/api/v1/auth/login")
                        .header("X-Trace-Id", "trace-login-1234")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"" + email + "\",\"password\":\"" + password + "\"}"))
                .andExpect(status().isOk())
                .andExpect(header().string("Cache-Control", "no-store, must-revalidate"))
                .andExpect(header().string("Pragma", "no-cache"))
                .andExpect(header().string("Expires", "0"))
                .andExpect(header().string("X-Trace-Id", "trace-login-1234"))
                .andExpect(jsonPath("$.token").isNotEmpty());
    }

    @Test
    @DisplayName("Deve impedir registro com email duplicado")
    void shouldRejectDuplicateEmail() throws Exception {
        String email = "dup" + System.nanoTime() + "@email.com";
        String password = "StrongPass123";

        registerUser("Dup", email, password);

        mockMvc.perform(post("/api/v1/users")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"Dup2\",\"email\":\"" + email + "\",\"password\":\"" + password + "\"}"))
                .andExpect(status().isConflict());
    }

    @Test
    @DisplayName("Deve falhar login com senha incorreta")
    void shouldFailLoginWithWrongPassword() throws Exception {
        String email = "wrong" + System.nanoTime() + "@email.com";
        String password = "StrongPass123";

        registerUser("Wrong", email, password);

                mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"" + email + "\",\"password\":\"badpass\"}"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("Deve limitar tentativas repetidas de login por cliente")
    void shouldRateLimitRepeatedLoginFailures() throws Exception {
        String email = "rate-limit" + System.nanoTime() + "@email.com";
        String password = "StrongPass123";
        RequestPostProcessor sameClientIp = request -> {
            request.setRemoteAddr("203.0.113.10");
            return request;
        };

        registerUser("Rate Limited", email, password);

        for (int attempt = 0; attempt < 3; attempt++) {
            mockMvc.perform(post("/api/v1/auth/login")
                            .with(sameClientIp)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{\"email\":\"" + email + "\",\"password\":\"badpass\"}"))
                    .andExpect(status().isUnauthorized());
        }

        mockMvc.perform(post("/api/v1/auth/login")
                        .with(sameClientIp)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"" + email + "\",\"password\":\"" + password + "\"}"))
                .andExpect(status().isTooManyRequests())
                .andExpect(jsonPath("$.code").value("RATE_LIMIT_EXCEEDED"));
    }

    @Test
    @DisplayName("Deve redefinir senha com token valido")
    void shouldResetPasswordWithValidToken() throws Exception {
        String email = "reset" + System.nanoTime() + "@email.com";
        String oldPassword = "StrongPass123";
        String newPassword = "NewStrongPass456";

        registerUser("Reset User", email, oldPassword);

        mockMvc.perform(post("/api/v1/auth/forgot-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"" + email + "\"}"))
                .andExpect(status().isNoContent())
                .andExpect(header().string("Cache-Control", "no-store, must-revalidate"))
                .andExpect(header().string("Pragma", "no-cache"))
                .andExpect(header().string("Expires", "0"));

        var user = userJpaRepository.findByEmail(email).orElseThrow();
        var token = passwordResetTokenJpaRepository.findTopByUserIdOrderByCreatedAtDesc(user.getId()).orElseThrow();

        mockMvc.perform(post("/api/v1/auth/reset-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"token\":\"" + token.getToken() + "\",\"newPassword\":\"" + newPassword + "\"}"))
                .andExpect(status().isNoContent())
                .andExpect(header().string("Cache-Control", "no-store, must-revalidate"))
                .andExpect(header().string("Pragma", "no-cache"))
                .andExpect(header().string("Expires", "0"));

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"" + email + "\",\"password\":\"" + oldPassword + "\"}"))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"" + email + "\",\"password\":\"" + newPassword + "\"}"))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("Deve gerar token ao solicitar recuperacao de senha")
    void shouldGenerateResetTokenOnForgotPassword() throws Exception {
        String email = "forgot" + System.nanoTime() + "@email.com";
        String password = "StrongPass123";

        registerUser("Forgot User", email, password);

        mockMvc.perform(post("/api/v1/auth/forgot-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"" + email + "\"}"))
                .andExpect(status().isNoContent())
                .andExpect(header().string("Cache-Control", "no-store, must-revalidate"))
                .andExpect(header().string("Pragma", "no-cache"))
                .andExpect(header().string("Expires", "0"));

        var user = userJpaRepository.findByEmail(email).orElseThrow();
        var token = passwordResetTokenJpaRepository.findTopByUserIdOrderByCreatedAtDesc(user.getId()).orElse(null);
        org.assertj.core.api.Assertions.assertThat(token).isNotNull();
        org.assertj.core.api.Assertions.assertThat(token.getUsedAt()).isNull();
    }

    @Test
    @DisplayName("Deve limitar solicitacoes repetidas de recuperacao por cliente")
    void shouldRateLimitForgotPasswordRequests() throws Exception {
        String email = "forgot-limit" + System.nanoTime() + "@email.com";
        String password = "StrongPass123";
        RequestPostProcessor sameClientIp = request -> {
            request.setRemoteAddr("203.0.113.20");
            return request;
        };

        registerUser("Forgot Limit", email, password);

        for (int attempt = 0; attempt < 2; attempt++) {
            mockMvc.perform(post("/api/v1/auth/forgot-password")
                            .with(sameClientIp)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{\"email\":\"" + email + "\"}"))
                    .andExpect(status().isNoContent());
        }

        mockMvc.perform(post("/api/v1/auth/forgot-password")
                        .with(sameClientIp)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"" + email + "\"}"))
                .andExpect(status().isTooManyRequests())
                .andExpect(jsonPath("$.code").value("RATE_LIMIT_EXCEEDED"));
    }

    @Test
    @DisplayName("Deve rejeitar redefinicao com token invalido")
    void shouldRejectResetPasswordWithInvalidToken() throws Exception {
        mockMvc.perform(post("/api/v1/auth/reset-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"token\":\"00000000-0000-0000-0000-000000000000\",\"newPassword\":\"NewStrongPass456\"}"))
                .andExpect(status().isBadRequest());
    }
}
