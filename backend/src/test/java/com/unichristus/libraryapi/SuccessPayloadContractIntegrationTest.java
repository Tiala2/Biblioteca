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

class SuccessPayloadContractIntegrationTest extends IntegrationTestSupport {

    @Test
    @DisplayName("Deve manter contrato padrao para respostas paginadas")
    void shouldKeepStandardPagedSuccessPayload() throws Exception {
        String adminToken = registerPromoteAndLoginAdmin("Payload Admin", "payload-admin-" + System.nanoTime() + "@email.com", "StrongPass123");
        String userToken = registerAndLogin("Payload User", "payload-user-" + System.nanoTime() + "@email.com", "StrongPass123");
        UUID bookId = fetchAnyBookId(adminToken);

        mockMvc.perform(post("/api/v1/readings")
                        .header("Authorization", bearer(userToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"bookId\":\"" + bookId + "\",\"currentPage\":10}"))
                .andExpect(status().isOk());

        mockMvc.perform(post("/api/v1/reviews")
                        .header("Authorization", bearer(userToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"bookId\":\"" + bookId + "\",\"rating\":5,\"comment\":\"Contrato de payload\"}"))
                .andExpect(status().isCreated());

        JsonNode booksPayload = parse(mockMvc.perform(get("/api/v1/books").param("size", "2"))
                .andExpect(status().isOk())
                .andReturn());
        assertPagedPayload(booksPayload);

        JsonNode reviewsPayload = parse(mockMvc.perform(get("/api/v1/reviews/me")
                        .header("Authorization", bearer(userToken))
                        .param("size", "2"))
                .andExpect(status().isOk())
                .andReturn());
        assertPagedPayload(reviewsPayload);

        JsonNode adminUsersPayload = parse(mockMvc.perform(get("/api/admin/users")
                        .header("Authorization", bearer(adminToken))
                        .param("size", "2"))
                .andExpect(status().isOk())
                .andReturn());
        assertPagedPayload(adminUsersPayload);
    }

    @Test
    @DisplayName("Deve manter arrays simples nos endpoints de lista nao paginados")
    void shouldKeepSimpleArrayPayloadForNonPagedLists() throws Exception {
        String token = registerAndLogin("Payload Array User", "payload-array-" + System.nanoTime() + "@email.com", "StrongPass123");
        UUID bookId = fetchAnyBookId(token);

        mockMvc.perform(post("/api/v1/users/me/favorites")
                        .header("Authorization", bearer(token))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"bookId\":\"" + bookId + "\"}"))
                .andExpect(status().isCreated());

        JsonNode categoriesPayload = parse(mockMvc.perform(get("/api/v1/categories"))
                .andExpect(status().isOk())
                .andReturn());
        assertThat(categoriesPayload.isArray()).isTrue();

        JsonNode recommendationsPayload = parse(mockMvc.perform(get("/api/v1/books/recommendations"))
                .andExpect(status().isOk())
                .andReturn());
        assertThat(recommendationsPayload.isArray()).isTrue();

        JsonNode favoritesPayload = parse(mockMvc.perform(get("/api/v1/users/me/favorites")
                        .header("Authorization", bearer(token)))
                .andExpect(status().isOk())
                .andReturn());
        assertThat(favoritesPayload.isArray()).isTrue();
        assertThat(favoritesPayload.isEmpty()).isFalse();
    }

    private JsonNode parse(MvcResult result) throws Exception {
        return objectMapper.readTree(result.getResponse().getContentAsString(StandardCharsets.UTF_8));
    }

    private void assertPagedPayload(JsonNode payload) {
        assertThat(payload.path("content").isArray()).isTrue();
        assertThat(payload.path("page").isObject()).isTrue();
        assertThat(payload.path("page").has("size")).isTrue();
        assertThat(payload.path("page").has("number")).isTrue();
        assertThat(payload.path("page").has("totalElements")).isTrue();
        assertThat(payload.path("page").has("totalPages")).isTrue();
    }
}
