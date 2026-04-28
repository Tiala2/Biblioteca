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

class CollectionPaginationIntegrationTest extends IntegrationTestSupport {

    @Test
    @DisplayName("Deve aplicar fallback de sort e limite de pagina na listagem publica de colecoes")
    void shouldFallbackInvalidSortAndClampCollectionsPageSize() throws Exception {
        String adminToken = registerPromoteAndLoginAdmin("Collection Admin", "collection-admin-" + System.nanoTime() + "@email.com", "StrongPass123");
        UUID anyBookId = fetchAnyBookId(adminToken);

        String collectionTitle = "Colecao Paginacao " + System.nanoTime();

        mockMvc.perform(post("/api/admin/collections")
                        .header("Authorization", bearer(adminToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"title\":\"" + collectionTitle + "\",\"description\":\"colecao de teste\",\"coverUrl\":\"https://exemplo.com/colecao.jpg\",\"bookIds\":[\"" + anyBookId + "\"]}"))
                .andExpect(status().isCreated());

        MvcResult result = mockMvc.perform(get("/api/v1/collections")
                        .param("size", "999")
                        .param("sort", "unsupportedField,asc"))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode root = objectMapper.readTree(result.getResponse().getContentAsString(StandardCharsets.UTF_8));
        assertThat(root.path("page").path("size").asInt()).isEqualTo(100);
        assertThat(root.path("content").isArray()).isTrue();
        assertThat(root.path("content").toString()).contains(collectionTitle);
    }
}
