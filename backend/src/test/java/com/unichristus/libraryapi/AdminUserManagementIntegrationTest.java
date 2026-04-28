package com.unichristus.libraryapi;

import com.fasterxml.jackson.databind.JsonNode;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MvcResult;

import java.nio.charset.StandardCharsets;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class AdminUserManagementIntegrationTest extends IntegrationTestSupport {

    @Test
    @DisplayName("Deve bloquear usuario comum no admin users")
    void shouldForbidRegularUserOnAdminUsers() throws Exception {
        String token = registerAndLogin("Regular User", "regular-admin-users" + System.nanoTime() + "@email.com", "StrongPass123");

        mockMvc.perform(get("/api/admin/users")
                        .header("Authorization", bearer(token)))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Deve filtrar usuarios por nome, status e papel no admin")
    void shouldFilterUsersAsAdmin() throws Exception {
        String adminToken = registerPromoteAndLoginAdmin("Admin Filter", "admin-filter-" + System.nanoTime() + "@email.com", "StrongPass123");

        String activeEmail = "active-filter-" + System.nanoTime() + "@email.com";
        String inactiveEmail = "inactive-filter-" + System.nanoTime() + "@email.com";
        registerUser("Pessoa Alvo Filtro", activeEmail, "StrongPass123");
        registerUser("Pessoa Inativa", inactiveEmail, "StrongPass123");
        userJpaRepository.findByEmail(inactiveEmail).ifPresent(user -> {
            user.setActive(false);
            userJpaRepository.save(user);
        });

        MvcResult filteredResult = mockMvc.perform(get("/api/admin/users")
                        .header("Authorization", bearer(adminToken))
                        .param("q", "alvo filtro")
                        .param("active", "true")
                        .param("role", "USER")
                        .param("page", "0")
                        .param("size", "10")
                        .param("sort", "createdAt,desc"))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode json = objectMapper.readTree(filteredResult.getResponse().getContentAsString(StandardCharsets.UTF_8));
        assertThat(json.path("content").isArray()).isTrue();
        assertThat(json.path("content").size()).isEqualTo(1);
        assertThat(json.path("content").get(0).path("email").asText()).isEqualTo(activeEmail);
        assertThat(json.path("content").get(0).path("active").asBoolean()).isTrue();
        assertThat(json.path("content").get(0).path("role").asText()).isEqualTo("USER");
    }

    @Test
    @DisplayName("Deve aplicar fallback de sort e limite de pagina no admin users")
    void shouldFallbackInvalidSortAndClampUsersPageSize() throws Exception {
        String adminToken = registerPromoteAndLoginAdmin("Admin Sort Users", "admin-sort-users-" + System.nanoTime() + "@email.com", "StrongPass123");
        registerUser("Pessoa Sort Users", "sort-users-" + System.nanoTime() + "@email.com", "StrongPass123");

        MvcResult result = mockMvc.perform(get("/api/admin/users")
                        .header("Authorization", bearer(adminToken))
                        .param("size", "999")
                        .param("sort", "unsupportedField,asc"))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode json = objectMapper.readTree(result.getResponse().getContentAsString(StandardCharsets.UTF_8));
        assertThat(json.path("page").path("size").asInt()).isEqualTo(100);
        assertThat(json.path("content").isArray()).isTrue();
        assertThat(json.path("content").isEmpty()).isFalse();
    }

    @Test
    @DisplayName("Deve permitir listar, buscar e invalidar usuario como admin")
    void shouldListGetAndInvalidateUserAsAdmin() throws Exception {
        String adminToken = registerPromoteAndLoginAdmin("Admin User", "admin-users" + System.nanoTime() + "@email.com", "StrongPass123");

        String targetEmail = "target-user-" + System.nanoTime() + "@email.com";
        registerUser("Target User", targetEmail, "StrongPass123");
        UUID targetUserId = userJpaRepository.findByEmail(targetEmail).orElseThrow().getId();

        MvcResult listResult = mockMvc.perform(get("/api/admin/users")
                        .header("Authorization", bearer(adminToken))
                        .param("page", "0")
                        .param("size", "10")
                        .param("sort", "name,asc"))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode listJson = objectMapper.readTree(listResult.getResponse().getContentAsString(StandardCharsets.UTF_8));
        assertThat(listJson.path("content").isArray()).isTrue();
        assertThat(listJson.path("content").size()).isGreaterThan(0);

        mockMvc.perform(get("/api/admin/users/{userId}", targetUserId)
                        .header("Authorization", bearer(adminToken)))
                .andExpect(status().isOk());

        mockMvc.perform(delete("/api/admin/users/{userId}", targetUserId)
                        .header("Authorization", bearer(adminToken)))
                .andExpect(status().isNoContent());

                mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"" + targetEmail + "\",\"password\":\"StrongPass123\"}"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("Deve permitir promover usuario para admin pelo painel administrativo")
    void shouldPromoteUserToAdmin() throws Exception {
        String adminToken = registerPromoteAndLoginAdmin("Admin User", "admin-promote-" + System.nanoTime() + "@email.com", "StrongPass123");

        String targetEmail = "target-promote-" + System.nanoTime() + "@email.com";
        registerUser("Target Promote", targetEmail, "StrongPass123");
        UUID targetUserId = userJpaRepository.findByEmail(targetEmail).orElseThrow().getId();

        mockMvc.perform(put("/api/admin/users/{userId}", targetUserId)
                        .header("Authorization", bearer(adminToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "name": "Target Promote",
                                  "email": "%s",
                                  "leaderboardOptIn": false,
                                  "alertsOptIn": true,
                                  "role": "ADMIN"
                                }
                                """.formatted(targetEmail)))
                .andExpect(status().isNoContent());

        MvcResult userResult = mockMvc.perform(get("/api/admin/users/{userId}", targetUserId)
                        .header("Authorization", bearer(adminToken)))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode userJson = objectMapper.readTree(userResult.getResponse().getContentAsString(StandardCharsets.UTF_8));
        assertThat(userJson.path("role").asText()).isEqualTo("ADMIN");
    }

    @Test
    @DisplayName("Deve impedir que admin rebaixe o proprio papel pelo painel administrativo")
    void shouldForbidAdminSelfDemotion() throws Exception {
        String adminEmail = "admin-self-demote-" + System.nanoTime() + "@email.com";
        String adminToken = registerPromoteAndLoginAdmin("Admin User", adminEmail, "StrongPass123");
        UUID adminUserId = userJpaRepository.findByEmail(adminEmail).orElseThrow().getId();

        mockMvc.perform(put("/api/admin/users/{userId}", adminUserId)
                        .header("Authorization", bearer(adminToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "name": "Admin User",
                                  "email": "%s",
                                  "leaderboardOptIn": false,
                                  "alertsOptIn": true,
                                  "role": "USER"
                                }
                                """.formatted(adminEmail)))
                .andExpect(status().isForbidden());

        MvcResult userResult = mockMvc.perform(get("/api/admin/users/{userId}", adminUserId)
                        .header("Authorization", bearer(adminToken)))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode userJson = objectMapper.readTree(userResult.getResponse().getContentAsString(StandardCharsets.UTF_8));
        assertThat(userJson.path("role").asText()).isEqualTo("ADMIN");
    }

    @Test
    @DisplayName("Deve tratar invalidacao e reativacao repetidas como operacoes idempotentes")
    void shouldTreatRepeatedInvalidateAndReactivateAsIdempotent() throws Exception {
        String adminToken = registerPromoteAndLoginAdmin("Admin Idempotent", "admin-idempotent-" + System.nanoTime() + "@email.com", "StrongPass123");

        String targetEmail = "target-idempotent-" + System.nanoTime() + "@email.com";
        registerUser("Target Idempotent", targetEmail, "StrongPass123");
        UUID targetUserId = userJpaRepository.findByEmail(targetEmail).orElseThrow().getId();

        mockMvc.perform(delete("/api/admin/users/{userId}", targetUserId)
                        .header("Authorization", bearer(adminToken)))
                .andExpect(status().isNoContent());

        mockMvc.perform(delete("/api/admin/users/{userId}", targetUserId)
                        .header("Authorization", bearer(adminToken)))
                .andExpect(status().isNoContent());

        assertThat(userJpaRepository.findById(targetUserId).orElseThrow().getActive()).isFalse();

        mockMvc.perform(patch("/api/admin/users/{userId}/reactivate", targetUserId)
                        .header("Authorization", bearer(adminToken)))
                .andExpect(status().isNoContent());

        mockMvc.perform(patch("/api/admin/users/{userId}/reactivate", targetUserId)
                        .header("Authorization", bearer(adminToken)))
                .andExpect(status().isNoContent());

        assertThat(userJpaRepository.findById(targetUserId).orElseThrow().getActive()).isTrue();
    }

    @Test
    @DisplayName("Deve normalizar nome no update administrativo do usuario")
    void shouldNormalizeAdminUserNameUpdate() throws Exception {
        String adminToken = registerPromoteAndLoginAdmin("Admin Normalize User", "admin-normalize-user-" + System.nanoTime() + "@email.com", "StrongPass123");

        String targetEmail = "target-normalize-user-" + System.nanoTime() + "@email.com";
        registerUser("Target Normalize", targetEmail, "StrongPass123");
        UUID targetUserId = userJpaRepository.findByEmail(targetEmail).orElseThrow().getId();

        mockMvc.perform(put("/api/admin/users/{userId}", targetUserId)
                        .header("Authorization", bearer(adminToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "name": "  Nome Normalizado  ",
                                  "email": "%s",
                                  "leaderboardOptIn": false,
                                  "alertsOptIn": true,
                                  "role": "USER"
                                }
                                """.formatted(targetEmail)))
                .andExpect(status().isNoContent());

        JsonNode userJson = objectMapper.readTree(mockMvc.perform(get("/api/admin/users/{userId}", targetUserId)
                        .header("Authorization", bearer(adminToken)))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString(StandardCharsets.UTF_8));

        assertThat(userJson.path("name").asText()).isEqualTo("Nome Normalizado");
    }
}
