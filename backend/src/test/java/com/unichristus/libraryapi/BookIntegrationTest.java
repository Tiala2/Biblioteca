package com.unichristus.libraryapi;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class BookIntegrationTest extends IntegrationTestSupport {

    @Test
    @DisplayName("Deve listar livros com paginação")
    void shouldListBooksPaged() throws Exception {
        mockMvc.perform(get("/api/v1/books")
                        .param("size", "3"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isArray());
    }

    @Test
    @DisplayName("Deve limitar o tamanho maximo da paginacao de livros")
    void shouldClampBookPageSize() throws Exception {
        mockMvc.perform(get("/api/v1/books")
                        .param("size", "999"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.page.size").value(100));
    }

    @Test
    @DisplayName("Deve listar livros com ordenacao de negocio sem quebrar SQL nativo")
    void shouldListBooksWithBusinessSortParam() throws Exception {
        mockMvc.perform(get("/api/v1/books")
                        .param("size", "3")
                        .param("sort", "BEST_RATED"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isArray());
    }

    @Test
    @DisplayName("Deve filtrar livros por autor")
    void shouldFilterBooksByAuthor() throws Exception {
        mockMvc.perform(get("/api/v1/books")
                        .param("author", "George Orwell")
                        .param("includeWithoutPdf", "true"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].author").value("George Orwell"));
    }

    @Test
    @DisplayName("Deve retornar recomendações com limite padrão")
    void shouldReturnRecommendations() throws Exception {
        mockMvc.perform(get("/api/v1/books/recommendations"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0]").exists());
    }
}
