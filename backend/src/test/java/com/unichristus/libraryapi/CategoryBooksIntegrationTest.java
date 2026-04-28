package com.unichristus.libraryapi;

import com.fasterxml.jackson.databind.JsonNode;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.test.web.servlet.MvcResult;

import java.nio.charset.StandardCharsets;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class CategoryBooksIntegrationTest extends IntegrationTestSupport {

    @Test
    @DisplayName("Deve aplicar fallback de sort e limite de pagina nos livros da categoria")
    void shouldClampCategoryBooksPageSizeAndIgnoreUnsupportedSort() throws Exception {
        MvcResult categoriesResult = mockMvc.perform(get("/api/v1/categories"))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode categories = objectMapper.readTree(categoriesResult.getResponse().getContentAsString(StandardCharsets.UTF_8));
        assertThat(categories.isArray()).isTrue();
        assertThat(categories.isEmpty()).isFalse();

        String categoryId = categories.get(0).path("id").asText();
        assertThat(categoryId).isNotBlank();

        MvcResult booksResult = mockMvc.perform(get("/api/v1/categories/{categoryId}/books", categoryId)
                        .param("size", "999")
                        .param("sort", "unsupportedField,asc"))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode root = objectMapper.readTree(booksResult.getResponse().getContentAsString(StandardCharsets.UTF_8));
        assertThat(root.path("page").path("size").asInt()).isEqualTo(100);
        assertThat(root.path("content").isArray()).isTrue();
    }
}
