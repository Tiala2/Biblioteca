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
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class FavoriteIntegrationTest extends IntegrationTestSupport {

    @Test
    @DisplayName("Deve favoritar, listar e remover favorito")
    void shouldFavoriteAndUnfavorite() throws Exception {
        String email = "fav" + System.nanoTime() + "@email.com";
        String password = "StrongPass123";
        String token = registerAndLogin("Fav User", email, password);

        UUID bookId = fetchAnyBookId(token);

        mockMvc.perform(post("/api/v1/users/me/favorites")
                        .header("Authorization", bearer(token))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"bookId\":\"" + bookId + "\"}"))
                .andExpect(status().isCreated())
                .andExpect(header().string("Location", "http://localhost/api/v1/users/me/favorites/" + bookId));

        MvcResult listAfterCreate = mockMvc.perform(get("/api/v1/users/me/favorites")
                        .header("Authorization", bearer(token)))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode favorites = objectMapper.readTree(listAfterCreate.getResponse().getContentAsString(StandardCharsets.UTF_8));
        assertThat(containsBook(favorites, bookId)).isTrue();

        mockMvc.perform(delete("/api/v1/users/me/favorites/" + bookId)
                        .header("Authorization", bearer(token)))
                .andExpect(status().isNoContent());

        MvcResult listAfterDelete = mockMvc.perform(get("/api/v1/users/me/favorites")
                        .header("Authorization", bearer(token)))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode favoritesAfterDelete = objectMapper.readTree(listAfterDelete.getResponse().getContentAsString(StandardCharsets.UTF_8));
        assertThat(containsBook(favoritesAfterDelete, bookId)).isFalse();
    }

    @Test
    @DisplayName("Deve rejeitar favorito duplicado com conflito")
    void shouldRejectDuplicateFavorite() throws Exception {
        String email = "dup-fav" + System.nanoTime() + "@email.com";
        String password = "StrongPass123";
        String token = registerAndLogin("Dup Fav User", email, password);

        UUID bookId = fetchAnyBookId(token);

        mockMvc.perform(post("/api/v1/users/me/favorites")
                        .header("Authorization", bearer(token))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"bookId\":\"" + bookId + "\"}"))
                .andExpect(status().isCreated());

        mockMvc.perform(post("/api/v1/users/me/favorites")
                        .header("Authorization", bearer(token))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"bookId\":\"" + bookId + "\"}"))
                .andExpect(status().isConflict());
    }

    private boolean containsBook(JsonNode array, UUID bookId) {
        if (!array.isArray()) {
            return false;
        }
        for (JsonNode item : array) {
            if (bookId.toString().equals(item.path("bookId").asText())) {
                return true;
            }
        }
        return false;
    }
}
