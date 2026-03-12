package com.unichristus.libraryapi;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class ReadingGoalIntegrationTest extends IntegrationTestSupport {

    @Test
    @DisplayName("Deve criar/atualizar meta e recuperar resumo atual")
    void shouldUpsertAndFetchGoal() throws Exception {
        String email = "goal" + System.nanoTime() + "@email.com";
        String password = "StrongPass123";
        String token = registerAndLogin("Goal User", email, password);

        mockMvc.perform(put("/api/v1/users/me/goals")
                        .header("Authorization", bearer(token))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"period\":\"MONTHLY\",\"targetPages\":120}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.period").value("MONTHLY"))
                .andExpect(jsonPath("$.targetPages").value(120));

        mockMvc.perform(get("/api/v1/users/me/goals")
                        .header("Authorization", bearer(token)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.targetPages").value(120))
                .andExpect(jsonPath("$.period").value("MONTHLY"));
    }
}
