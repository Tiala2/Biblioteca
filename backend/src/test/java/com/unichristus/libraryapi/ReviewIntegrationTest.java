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
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class ReviewIntegrationTest extends IntegrationTestSupport {

    @Test
    @DisplayName("Deve criar avaliação e rejeitar duplicidade para o mesmo usuário/livro")
    void shouldCreateAndRejectDuplicateReview() throws Exception {
        String email = "review" + System.nanoTime() + "@email.com";
        String password = "StrongPass123";
        String token = registerAndLogin("Reviewer", email, password);

        UUID bookId = fetchAnyBookId(token);

        mockMvc.perform(post("/api/v1/readings")
                        .header("Authorization", bearer(token))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"bookId\":\"" + bookId + "\",\"currentPage\":10}"))
                .andExpect(status().isOk());

        mockMvc.perform(post("/api/v1/reviews")
                        .header("Authorization", bearer(token))
                        .contentType(MediaType.APPLICATION_JSON)
                .content("{\"bookId\":\"" + bookId + "\",\"rating\":5,\"comment\":\"Otimo livro\"}"))
                .andExpect(status().isCreated());

        mockMvc.perform(post("/api/v1/reviews")
                        .header("Authorization", bearer(token))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"bookId\":\"" + bookId + "\",\"rating\":4,\"comment\":\"segunda vez\"}"))
                .andExpect(status().isConflict());
    }

    @Test
    @DisplayName("Deve consultar, atualizar e remover a propria avaliacao")
    void shouldManageOwnReviewLifecycle() throws Exception {
        String email = "review-lifecycle" + System.nanoTime() + "@email.com";
        String password = "StrongPass123";
        String token = registerAndLogin("Review Lifecycle", email, password);

        UUID bookId = fetchAnyBookId(token);

        mockMvc.perform(post("/api/v1/readings")
                        .header("Authorization", bearer(token))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"bookId\":\"" + bookId + "\",\"currentPage\":10}"))
                .andExpect(status().isOk());

        MvcResult createResult = mockMvc.perform(post("/api/v1/reviews")
                        .header("Authorization", bearer(token))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"bookId\":\"" + bookId + "\",\"rating\":5,\"comment\":\"Primeira versao\"}"))
                .andExpect(status().isCreated())
                .andReturn();

        JsonNode created = objectMapper.readTree(createResult.getResponse().getContentAsString(StandardCharsets.UTF_8));
        String reviewId = created.path("id").asText();
        assertThat(reviewId).isNotBlank();

        String reviewBody = mockMvc.perform(get("/api/v1/reviews/{reviewId}", reviewId)
                        .header("Authorization", bearer(token)))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString(StandardCharsets.UTF_8);

        JsonNode fetched = objectMapper.readTree(reviewBody);
        assertThat(fetched.path("comment").asText()).isEqualTo("Primeira versao");
        assertThat(fetched.path("rating").asInt()).isEqualTo(5);

        String myReviewsBody = mockMvc.perform(get("/api/v1/reviews/me?page=0&size=10")
                        .header("Authorization", bearer(token)))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString(StandardCharsets.UTF_8);

        JsonNode myReviews = objectMapper.readTree(myReviewsBody).path("content");
        assertThat(myReviews.isArray()).isTrue();
        assertThat(myReviews.toString()).contains(reviewId);

        String updatedBody = mockMvc.perform(patch("/api/v1/reviews/{reviewId}", reviewId)
                        .header("Authorization", bearer(token))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"rating\":4,\"comment\":\"Atualizada\"}"))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString(StandardCharsets.UTF_8);

        JsonNode updated = objectMapper.readTree(updatedBody);
        assertThat(updated.path("comment").asText()).isEqualTo("Atualizada");
        assertThat(updated.path("rating").asInt()).isEqualTo(4);

        mockMvc.perform(delete("/api/v1/reviews/{reviewId}", reviewId)
                        .header("Authorization", bearer(token)))
                .andExpect(status().isNoContent());

        mockMvc.perform(get("/api/v1/reviews/{reviewId}", reviewId)
                        .header("Authorization", bearer(token)))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("Deve impedir que outro usuario altere ou remova a avaliacao")
    void shouldForbidOtherUserFromChangingReview() throws Exception {
        String ownerToken = registerAndLogin("Review Owner", "review-owner" + System.nanoTime() + "@email.com", "StrongPass123");
        String strangerToken = registerAndLogin("Review Stranger", "review-stranger" + System.nanoTime() + "@email.com", "StrongPass123");

        UUID bookId = fetchAnyBookId(ownerToken);

        mockMvc.perform(post("/api/v1/readings")
                        .header("Authorization", bearer(ownerToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"bookId\":\"" + bookId + "\",\"currentPage\":10}"))
                .andExpect(status().isOk());

        MvcResult createResult = mockMvc.perform(post("/api/v1/reviews")
                        .header("Authorization", bearer(ownerToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"bookId\":\"" + bookId + "\",\"rating\":5,\"comment\":\"Review privada\"}"))
                .andExpect(status().isCreated())
                .andReturn();

        String reviewId = objectMapper
                .readTree(createResult.getResponse().getContentAsString(StandardCharsets.UTF_8))
                .path("id")
                .asText();

        mockMvc.perform(patch("/api/v1/reviews/{reviewId}", reviewId)
                        .header("Authorization", bearer(strangerToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"rating\":3,\"comment\":\"Tentativa externa\"}"))
                .andExpect(status().isForbidden());

        mockMvc.perform(delete("/api/v1/reviews/{reviewId}", reviewId)
                        .header("Authorization", bearer(strangerToken)))
                .andExpect(status().isForbidden());
    }
}
