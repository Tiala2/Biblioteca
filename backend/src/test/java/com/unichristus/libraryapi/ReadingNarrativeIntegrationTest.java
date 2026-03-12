package com.unichristus.libraryapi;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class ReadingNarrativeIntegrationTest extends IntegrationTestSupport {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Test
    @DisplayName("Deve retornar estado da trama, personagens, quizzes e conquistas por pagina")
    void shouldReturnNarrativeInsight() throws Exception {
        String email = "narrative" + System.nanoTime() + "@email.com";
        String token = registerAndLogin("Narrative User", email, "StrongPass123");
        UUID bookId = findBookIdByIsbn("9780547928227");

        mockMvc.perform(get("/api/v1/readings/{bookId}/narrative", bookId)
                        .param("currentPage", "90")
                        .header("Authorization", bearer(token)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.bookId").value(bookId.toString()))
                .andExpect(jsonPath("$.currentPage").value(90))
                .andExpect(jsonPath("$.phase").value("BEGINNING"))
                .andExpect(jsonPath("$.plotState").isNotEmpty())
                .andExpect(jsonPath("$.knownCharacters").isArray())
                .andExpect(jsonPath("$.knownCharacters[0].name").isNotEmpty())
                .andExpect(jsonPath("$.quizzes").isArray())
                .andExpect(jsonPath("$.quizzes[0].question").isNotEmpty())
                .andExpect(jsonPath("$.achievements").isArray())
                .andExpect(jsonPath("$.achievements[0].code").isNotEmpty())
                .andExpect(jsonPath("$.achievements[0].unlocked").isBoolean());
    }

    @Test
    @DisplayName("Deve retornar 400 quando currentPage for invalido")
    void shouldReturnBadRequestWhenCurrentPageIsInvalid() throws Exception {
        String email = "narrative-invalid" + System.nanoTime() + "@email.com";
        String token = registerAndLogin("Narrative Invalid", email, "StrongPass123");
        UUID bookId = findBookIdByIsbn("9780547928227");

        mockMvc.perform(get("/api/v1/readings/{bookId}/narrative", bookId)
                        .param("currentPage", "9999")
                        .header("Authorization", bearer(token)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("SEARCH_FILTER_INVALID"));
    }

    private UUID findBookIdByIsbn(String isbn) {
        UUID bookId = jdbcTemplate.queryForObject(
                "SELECT id FROM books WHERE isbn = ? LIMIT 1",
                UUID.class,
                isbn
        );
        assertThat(bookId).isNotNull();
        return bookId;
    }
}
