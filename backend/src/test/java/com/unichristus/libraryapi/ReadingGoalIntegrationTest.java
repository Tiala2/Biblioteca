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

    @Test
    @DisplayName("Deve expor resumo, alertas e streak coerentes antes e depois da leitura")
    void shouldExposeSummaryAlertsAndStreakProgress() throws Exception {
        String email = "goal-summary" + System.nanoTime() + "@email.com";
        String password = "StrongPass123";
        String token = registerAndLogin("Goal Summary User", email, password);

        mockMvc.perform(put("/api/v1/users/me/goals")
                        .header("Authorization", bearer(token))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"period\":\"MONTHLY\",\"targetPages\":120}"))
                .andExpect(status().isOk());

        String beforeSummaryBody = mockMvc.perform(get("/api/v1/users/me/goals/summary?period=MONTHLY")
                        .header("Authorization", bearer(token)))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString(StandardCharsets.UTF_8);

        JsonNode beforeSummary = objectMapper.readTree(beforeSummaryBody);
        assertThat(beforeSummary.path("goal").path("period").asText()).isEqualTo("MONTHLY");
        assertThat(beforeSummary.path("streakDays").asInt()).isZero();
        assertThat(beforeSummary.path("alerts").toString()).contains("NO_STREAK");

        String beforeAlertsBody = mockMvc.perform(get("/api/v1/users/me/alerts?period=MONTHLY")
                        .header("Authorization", bearer(token)))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString(StandardCharsets.UTF_8);

        JsonNode beforeAlerts = objectMapper.readTree(beforeAlertsBody);
        assertThat(beforeAlerts.isArray()).isTrue();
        assertThat(beforeAlerts.toString()).contains("NO_STREAK");

        UUID bookId = fetchAnyBookId(token);

        mockMvc.perform(post("/api/v1/readings")
                        .header("Authorization", bearer(token))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"bookId\":\"" + bookId + "\",\"currentPage\":10}"))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/v1/users/me/streak")
                        .header("Authorization", bearer(token)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.streakDays").value(1));

        String afterSummaryBody = mockMvc.perform(get("/api/v1/users/me/goals/summary?period=MONTHLY")
                        .header("Authorization", bearer(token)))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString(StandardCharsets.UTF_8);

        JsonNode afterSummary = objectMapper.readTree(afterSummaryBody);
        assertThat(afterSummary.path("goal").path("period").asText()).isEqualTo("MONTHLY");
        assertThat(afterSummary.path("goal").path("progressPages").asInt()).isGreaterThan(0);
        assertThat(afterSummary.path("streakDays").asInt()).isEqualTo(1);
        assertThat(afterSummary.path("alerts").toString()).doesNotContain("NO_STREAK");
    }
}
