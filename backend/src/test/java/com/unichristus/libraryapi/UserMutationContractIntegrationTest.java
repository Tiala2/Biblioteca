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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class UserMutationContractIntegrationTest extends IntegrationTestSupport {

    @Test
    @DisplayName("Deve manter 201 com body e Location nas criacoes de favorite e review")
    void shouldKeepCreatedWithBodyAndLocationForUserCreates() throws Exception {
        String token = registerAndLogin("User Mutation Contract", "user-mutation-contract-" + System.nanoTime() + "@email.com", "StrongPass123");
        UUID bookId = fetchAnyBookId(token);

        MvcResult favoriteResult = mockMvc.perform(post("/api/v1/users/me/favorites")
                        .header("Authorization", bearer(token))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"bookId\":\"" + bookId + "\"}"))
                .andExpect(status().isCreated())
                .andExpect(header().string("Location", "http://localhost/api/v1/users/me/favorites/" + bookId))
                .andReturn();

        JsonNode favoriteBody = parse(favoriteResult);
        assertThat(favoriteBody.path("bookId").asText()).isEqualTo(bookId.toString());
        assertThat(favoriteBody.path("bookTitle").asText()).isNotBlank();

        mockMvc.perform(post("/api/v1/readings")
                        .header("Authorization", bearer(token))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"bookId\":\"" + bookId + "\",\"currentPage\":12}"))
                .andExpect(status().isOk());

        MvcResult reviewResult = mockMvc.perform(post("/api/v1/reviews")
                        .header("Authorization", bearer(token))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"bookId\":\"" + bookId + "\",\"rating\":5,\"comment\":\"Contrato de review\"}"))
                .andExpect(status().isCreated())
                .andExpect(header().exists("Location"))
                .andReturn();

        JsonNode reviewBody = parse(reviewResult);
        String reviewId = reviewBody.path("id").asText();
        assertThat(reviewId).isNotBlank();
        assertThat(reviewResult.getResponse().getHeader("Location"))
                .isEqualTo("http://localhost/api/v1/reviews/" + reviewId);
        assertThat(reviewBody.path("bookId").asText()).isEqualTo(bookId.toString());
        assertThat(reviewBody.path("rating").asInt()).isEqualTo(5);
        assertThat(reviewBody.path("comment").asText()).isEqualTo("Contrato de review");
    }

    @Test
    @DisplayName("Deve manter 200 com body no patch de review e 204 vazio nos deletes")
    void shouldKeepPatchAndDeleteMutationSemanticsForUserFlows() throws Exception {
        String token = registerAndLogin("User Mutation Commands", "user-mutation-commands-" + System.nanoTime() + "@email.com", "StrongPass123");
        UUID bookId = fetchAnyBookId(token);

        MvcResult favoriteResult = mockMvc.perform(post("/api/v1/users/me/favorites")
                        .header("Authorization", bearer(token))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"bookId\":\"" + bookId + "\"}"))
                .andExpect(status().isCreated())
                .andReturn();
        assertThat(parse(favoriteResult).path("bookId").asText()).isEqualTo(bookId.toString());

        mockMvc.perform(post("/api/v1/readings")
                        .header("Authorization", bearer(token))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"bookId\":\"" + bookId + "\",\"currentPage\":18}"))
                .andExpect(status().isOk());

        MvcResult reviewCreateResult = mockMvc.perform(post("/api/v1/reviews")
                        .header("Authorization", bearer(token))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"bookId\":\"" + bookId + "\",\"rating\":4,\"comment\":\"Review inicial\"}"))
                .andExpect(status().isCreated())
                .andReturn();
        String reviewId = parse(reviewCreateResult).path("id").asText();

        MvcResult patchReviewResult = mockMvc.perform(patch("/api/v1/reviews/{reviewId}", reviewId)
                        .header("Authorization", bearer(token))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"rating\":3,\"comment\":\"Review atualizada\"}"))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode patchedReview = parse(patchReviewResult);
        assertThat(patchedReview.path("id").asText()).isEqualTo(reviewId);
        assertThat(patchedReview.path("bookId").asText()).isEqualTo(bookId.toString());
        assertThat(patchedReview.path("rating").asInt()).isEqualTo(3);
        assertThat(patchedReview.path("comment").asText()).isEqualTo("Review atualizada");

        MvcResult deleteFavoriteResult = mockMvc.perform(delete("/api/v1/users/me/favorites/{bookId}", bookId)
                        .header("Authorization", bearer(token)))
                .andExpect(status().isNoContent())
                .andReturn();
        assertThat(deleteFavoriteResult.getResponse().getContentAsString(StandardCharsets.UTF_8)).isEmpty();

        MvcResult deleteReviewResult = mockMvc.perform(delete("/api/v1/reviews/{reviewId}", reviewId)
                        .header("Authorization", bearer(token)))
                .andExpect(status().isNoContent())
                .andReturn();
        assertThat(deleteReviewResult.getResponse().getContentAsString(StandardCharsets.UTF_8)).isEmpty();
    }

    private JsonNode parse(MvcResult result) throws Exception {
        return objectMapper.readTree(result.getResponse().getContentAsString(StandardCharsets.UTF_8));
    }
}
