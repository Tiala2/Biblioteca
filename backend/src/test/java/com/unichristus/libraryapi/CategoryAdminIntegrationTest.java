package com.unichristus.libraryapi;

import com.fasterxml.jackson.databind.JsonNode;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MvcResult;

import java.nio.charset.StandardCharsets;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class CategoryAdminIntegrationTest extends IntegrationTestSupport {

    @Test
    @DisplayName("Deve criar categoria admin com header Location")
    void shouldCreateCategoryWithLocationHeader() throws Exception {
        String adminToken = registerPromoteAndLoginAdmin("Category Admin", "category-admin-" + System.nanoTime() + "@email.com", "StrongPass123");

        MvcResult createResult = mockMvc.perform(post("/api/admin/categories")
                        .header("Authorization", bearer(adminToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"Categoria Contrato " + System.nanoTime() + "\",\"description\":\"categoria de teste\"}"))
                .andExpect(status().isCreated())
                .andExpect(header().exists("Location"))
                .andReturn();

        JsonNode created = objectMapper.readTree(createResult.getResponse().getContentAsString(StandardCharsets.UTF_8));
        String categoryId = created.path("id").asText();
        assertThat(categoryId).isNotBlank();
        assertThat(createResult.getResponse().getHeader("Location"))
                .isEqualTo("http://localhost/api/admin/categories/" + categoryId);

        mockMvc.perform(delete("/api/admin/categories/{categoryId}", categoryId)
                        .header("Authorization", bearer(adminToken)))
                .andExpect(status().isNoContent());
    }

    @Test
    @DisplayName("Deve normalizar espacos em nome e descricao de categoria")
    void shouldNormalizeCategoryTextFields() throws Exception {
        String adminToken = registerPromoteAndLoginAdmin("Category Normalize", "category-normalize-" + System.nanoTime() + "@email.com", "StrongPass123");

        MvcResult createResult = mockMvc.perform(post("/api/admin/categories")
                        .header("Authorization", bearer(adminToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"  Categoria Normalizada  \",\"description\":\"   \"}"))
                .andExpect(status().isCreated())
                .andReturn();

        JsonNode created = objectMapper.readTree(createResult.getResponse().getContentAsString(StandardCharsets.UTF_8));
        String categoryId = created.path("id").asText();
        assertThat(created.path("name").asText()).isEqualTo("Categoria Normalizada");
        assertThat(created.path("description").isNull()).isTrue();

        MvcResult updateResult = mockMvc.perform(put("/api/admin/categories/{categoryId}", categoryId)
                        .header("Authorization", bearer(adminToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"  Categoria Atualizada  \",\"description\":\"  descricao atualizada  \"}"))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode updated = objectMapper.readTree(updateResult.getResponse().getContentAsString(StandardCharsets.UTF_8));
        assertThat(updated.path("name").asText()).isEqualTo("Categoria Atualizada");
        assertThat(updated.path("description").asText()).isEqualTo("descricao atualizada");
    }
}
