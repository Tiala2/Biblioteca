package com.unichristus.libraryapi;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;

import java.util.UUID;

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
}
