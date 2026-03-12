package com.unichristus.libraryapi;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class AuthIntegrationTest extends IntegrationTestSupport {

    @Test
    @DisplayName("Deve registrar e fazer login com sucesso")
    void shouldRegisterAndLogin() throws Exception {
        String email = "user" + System.nanoTime() + "@email.com";
        String password = "StrongPass123";

        registerUser("Tester", email, password);
        loginAndGetToken(email, password);
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
    @DisplayName("Deve redefinir senha com token valido")
    void shouldResetPasswordWithValidToken() throws Exception {
        String email = "reset" + System.nanoTime() + "@email.com";
        String oldPassword = "StrongPass123";
        String newPassword = "NewStrongPass456";

        registerUser("Reset User", email, oldPassword);

        mockMvc.perform(post("/api/v1/auth/forgot-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"" + email + "\"}"))
                .andExpect(status().isNoContent());

        var user = userJpaRepository.findByEmail(email).orElseThrow();
        var token = passwordResetTokenJpaRepository.findTopByUserIdOrderByCreatedAtDesc(user.getId()).orElseThrow();

        mockMvc.perform(post("/api/v1/auth/reset-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"token\":\"" + token.getToken() + "\",\"newPassword\":\"" + newPassword + "\"}"))
                .andExpect(status().isNoContent());

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"" + email + "\",\"password\":\"" + oldPassword + "\"}"))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"" + email + "\",\"password\":\"" + newPassword + "\"}"))
                .andExpect(status().isOk());
    }
}
