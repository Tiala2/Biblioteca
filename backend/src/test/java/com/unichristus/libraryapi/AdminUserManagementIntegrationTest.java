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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
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
}

