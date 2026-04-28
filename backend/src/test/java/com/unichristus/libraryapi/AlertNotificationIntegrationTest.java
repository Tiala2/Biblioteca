package com.unichristus.libraryapi;

import com.fasterxml.jackson.databind.JsonNode;
import com.unichristus.libraryapi.application.notification.ReadingAlertNotifier;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentMatchers;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;

import java.util.UUID;

import static org.mockito.Mockito.atLeastOnce;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.timeout;
import static org.mockito.Mockito.verify;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class AlertNotificationIntegrationTest extends IntegrationTestSupport {

    @MockitoBean
    private ReadingAlertNotifier readingAlertNotifier;

    @Test
    @DisplayName("Deve notificar quando usuario define meta e possui alertsOptIn=true")
    void shouldNotifyOnGoalUpsertWhenOptInEnabled() throws Exception {
        String token = registerAndLogin("AlertGoal", "alert-goal" + System.nanoTime() + "@email.com", "StrongPass123");

        mockMvc.perform(put("/api/v1/users/me/goals")
                        .header("Authorization", bearer(token))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"period\":\"MONTHLY\",\"targetPages\":300}"))
                .andExpect(status().isOk());

        verify(readingAlertNotifier, timeout(1500).atLeastOnce())
                .notifyUser(ArgumentMatchers.any(UUID.class), ArgumentMatchers.anyString(), ArgumentMatchers.anyList());
    }

    @Test
    @DisplayName("Deve notificar quando sincroniza leitura e possui alertsOptIn=true")
    void shouldNotifyOnReadingSyncWhenOptInEnabled() throws Exception {
        String token = registerAndLogin("AlertRead", "alert-read" + System.nanoTime() + "@email.com", "StrongPass123");
        UUID bookId = fetchAnyBookId(token);

        mockMvc.perform(put("/api/v1/users/me/goals")
                        .header("Authorization", bearer(token))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"period\":\"MONTHLY\",\"targetPages\":500}"))
                .andExpect(status().isOk());

        mockMvc.perform(post("/api/v1/readings")
                        .header("Authorization", bearer(token))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"bookId\":\"" + bookId + "\",\"currentPage\":10}"))
                .andExpect(status().isOk());

        verify(readingAlertNotifier, timeout(1500).atLeastOnce())
                .notifyUser(ArgumentMatchers.any(UUID.class), ArgumentMatchers.anyString(), ArgumentMatchers.anyList());
    }

    @Test
    @DisplayName("Nao deve notificar quando usuario desativa alertsOptIn")
    void shouldNotNotifyWhenOptInDisabled() throws Exception {
        String token = registerAndLogin("AlertOff", "alert-off" + System.nanoTime() + "@email.com", "StrongPass123");
        UUID bookId = fetchAnyBookId(token);

        mockMvc.perform(put("/api/v1/users/me")
                        .header("Authorization", bearer(token))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"alertsOptIn\":false}"))
                .andExpect(status().isNoContent());

        mockMvc.perform(put("/api/v1/users/me/goals")
                        .header("Authorization", bearer(token))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"period\":\"MONTHLY\",\"targetPages\":200}"))
                .andExpect(status().isOk());

        mockMvc.perform(post("/api/v1/readings")
                        .header("Authorization", bearer(token))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"bookId\":\"" + bookId + "\",\"currentPage\":5}"))
                .andExpect(status().isOk());

        verify(readingAlertNotifier, never())
                .notifyUser(ArgumentMatchers.any(UUID.class), ArgumentMatchers.anyString(), ArgumentMatchers.anyList());
    }

    @Test
    @DisplayName("Deve manter sincronizacao de leitura quando notificacao falha")
    void shouldKeepReadingSyncSuccessfulWhenNotificationFails() throws Exception {
        String token = registerAndLogin("AlertFailure", "alert-failure" + System.nanoTime() + "@email.com", "StrongPass123");
        UUID bookId = fetchAnyBookId(token);

        mockMvc.perform(put("/api/v1/users/me/goals")
                        .header("Authorization", bearer(token))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"period\":\"MONTHLY\",\"targetPages\":300}"))
                .andExpect(status().isOk());

        doThrow(new RuntimeException("notifier unavailable"))
                .when(readingAlertNotifier)
                .notifyUser(ArgumentMatchers.any(UUID.class), ArgumentMatchers.anyString(), ArgumentMatchers.anyList());

        mockMvc.perform(post("/api/v1/readings")
                        .header("Authorization", bearer(token))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"bookId\":\"" + bookId + "\",\"currentPage\":10}"))
                .andExpect(status().isOk());

        String summaryBody = mockMvc.perform(get("/api/v1/users/me/goals/summary?period=MONTHLY")
                        .header("Authorization", bearer(token)))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString(java.nio.charset.StandardCharsets.UTF_8);

        JsonNode summary = objectMapper.readTree(summaryBody);
        org.assertj.core.api.Assertions.assertThat(summary.path("goal").path("progressPages").asInt()).isGreaterThan(0);
    }
}
