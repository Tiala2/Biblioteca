package com.unichristus.libraryapi;

import com.fasterxml.jackson.databind.JsonNode;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MvcResult;

import java.nio.charset.StandardCharsets;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class MutationSemanticContractIntegrationTest extends IntegrationTestSupport {

    @Test
    @DisplayName("Deve manter 200 com body nas mutacoes que retornam estado atualizado")
    void shouldKeepOkWithBodyForStateReturningMutations() throws Exception {
        String token = registerAndLogin("Mutation User", "mutation-user-" + System.nanoTime() + "@email.com", "StrongPass123");
        UUID bookId = fetchAnyBookId(token);

        MvcResult readingResult = mockMvc.perform(post("/api/v1/readings")
                        .header("Authorization", bearer(token))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"bookId\":\"" + bookId + "\",\"currentPage\":15}"))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode readingBody = parse(readingResult);
        assertThat(readingBody.path("book").path("id").asText()).isEqualTo(bookId.toString());
        assertThat(readingBody.path("currentPage").asInt()).isEqualTo(15);

        MvcResult goalResult = mockMvc.perform(put("/api/v1/users/me/goals")
                        .header("Authorization", bearer(token))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"period\":\"MONTHLY\",\"targetPages\":240}"))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode goalBody = parse(goalResult);
        assertThat(goalBody.path("period").asText()).isEqualTo("MONTHLY");
        assertThat(goalBody.path("targetPages").asInt()).isEqualTo(240);
    }

    @Test
    @DisplayName("Deve manter 204 sem body nos comandos sem retorno")
    void shouldKeepNoContentWithoutBodyForCommandMutations() throws Exception {
        String email = "mutation-command-" + System.nanoTime() + "@email.com";
        String password = "StrongPass123";
        String token = registerAndLogin("Mutation Command User", email, password);

        MvcResult updateMeResult = mockMvc.perform(put("/api/v1/users/me")
                        .header("Authorization", bearer(token))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"Mutation Command User Atualizado\"}"))
                .andExpect(status().isNoContent())
                .andReturn();
        assertThat(updateMeResult.getResponse().getContentAsString(StandardCharsets.UTF_8)).isEmpty();

        String adminToken = registerPromoteAndLoginAdmin("Mutation Admin", "mutation-admin-" + System.nanoTime() + "@email.com", "StrongPass123");
        String targetEmail = "mutation-target-" + System.nanoTime() + "@email.com";
        registerUser("Mutation Target", targetEmail, "StrongPass123");
        UUID targetUserId = userJpaRepository.findByEmail(targetEmail).orElseThrow().getId();

        MvcResult adminUpdateResult = mockMvc.perform(put("/api/admin/users/{userId}", targetUserId)
                        .header("Authorization", bearer(adminToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "name": "Mutation Target",
                                  "email": "%s",
                                  "leaderboardOptIn": false,
                                  "alertsOptIn": true,
                                  "role": "ADMIN"
                                }
                                """.formatted(targetEmail)))
                .andExpect(status().isNoContent())
                .andReturn();
        assertThat(adminUpdateResult.getResponse().getContentAsString(StandardCharsets.UTF_8)).isEmpty();

        MvcResult forgotPasswordResult = mockMvc.perform(post("/api/v1/auth/forgot-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"" + email + "\"}"))
                .andExpect(status().isNoContent())
                .andReturn();
        assertThat(forgotPasswordResult.getResponse().getContentAsString(StandardCharsets.UTF_8)).isEmpty();

        var user = userJpaRepository.findByEmail(email).orElseThrow();
        var resetToken = passwordResetTokenJpaRepository.findTopByUserIdOrderByCreatedAtDesc(user.getId()).orElseThrow();

        MvcResult resetPasswordResult = mockMvc.perform(post("/api/v1/auth/reset-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"token\":\"" + resetToken.getToken() + "\",\"newPassword\":\"NewStrongPass456\"}"))
                .andExpect(status().isNoContent())
                .andReturn();
        assertThat(resetPasswordResult.getResponse().getContentAsString(StandardCharsets.UTF_8)).isEmpty();
    }

    private JsonNode parse(MvcResult result) throws Exception {
        return objectMapper.readTree(result.getResponse().getContentAsString(StandardCharsets.UTF_8));
    }
}
