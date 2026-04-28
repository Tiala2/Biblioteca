package com.unichristus.libraryapi;

import com.fasterxml.jackson.databind.JsonNode;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MvcResult;

import java.nio.charset.StandardCharsets;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class PageableContractIntegrationTest extends IntegrationTestSupport {

    @Test
    @DisplayName("Deve aplicar fallback de sort e limite de pagina no admin de favoritos")
    void shouldFallbackInvalidSortAndClampFavoritesPageSize() throws Exception {
        String adminToken = registerPromoteAndLoginAdmin("Favorite Admin", "favorite-admin-" + System.nanoTime() + "@email.com", "StrongPass123");
        String userToken = registerAndLogin("Favorite User", "favorite-user-" + System.nanoTime() + "@email.com", "StrongPass123");
        UUID anyBookId = fetchAnyBookId(adminToken);

        mockMvc.perform(post("/api/v1/users/me/favorites")
                        .header("Authorization", bearer(userToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"bookId\":\"" + anyBookId + "\"}"))
                .andExpect(status().isCreated());

        MvcResult result = mockMvc.perform(get("/api/admin/favorites")
                        .header("Authorization", bearer(adminToken))
                        .param("size", "999")
                        .param("sort", "unsupportedField,asc"))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode root = objectMapper.readTree(result.getResponse().getContentAsString(StandardCharsets.UTF_8));
        assertThat(root.path("page").path("size").asInt()).isEqualTo(100);
        assertThat(root.path("content").isArray()).isTrue();
        assertThat(root.path("content").isEmpty()).isFalse();
    }

    @Test
    @DisplayName("Deve aplicar fallback de sort e limite de pagina nos badges do usuario")
    void shouldFallbackInvalidSortAndClampUserBadgesPageSize() throws Exception {
        String userToken = registerAndLogin("Badge User", "badge-user-" + System.nanoTime() + "@email.com", "StrongPass123");

        MvcResult result = mockMvc.perform(get("/api/v1/users/me/badges")
                        .header("Authorization", bearer(userToken))
                        .param("size", "999")
                        .param("sort", "unsupportedField,asc"))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode root = objectMapper.readTree(result.getResponse().getContentAsString(StandardCharsets.UTF_8));
        assertThat(root.path("page").path("size").asInt()).isEqualTo(100);
        assertThat(root.path("content").isArray()).isTrue();
    }
}
