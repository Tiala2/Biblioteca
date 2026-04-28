package com.unichristus.libraryapi;

import com.fasterxml.jackson.databind.JsonNode;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MvcResult;

import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class AlertAuditIntegrationTest extends IntegrationTestSupport {

    @Test
    @DisplayName("Deve filtrar auditoria de alertas por userId e status")
    void shouldFilterAlertDeliveriesByUserAndStatus() throws Exception {
        String adminToken = registerPromoteAndLoginAdmin("AuditAdmin", "audit-admin" + System.nanoTime() + "@email.com", "StrongPass123");

        String userEmail = "audit-user" + System.nanoTime() + "@email.com";
        String userToken = registerAndLogin("AuditUser", userEmail, "StrongPass123");
        UUID userId = userJpaRepository.findByEmail(userEmail).orElseThrow().getId();

        mockMvc.perform(put("/api/v1/users/me/goals")
                        .header("Authorization", bearer(userToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"period\":\"MONTHLY\",\"targetPages\":400}"))
                .andExpect(status().isOk());

        JsonNode content = null;
        for (int attempt = 0; attempt < 5; attempt++) {
            MvcResult result = mockMvc.perform(get("/api/admin/alerts/deliveries")
                            .header("Authorization", bearer(adminToken))
                            .param("userId", userId.toString())
                            .param("status", "SKIPPED")
                            .param("page", "0")
                            .param("size", "20"))
                    .andExpect(status().isOk())
                    .andReturn();

            JsonNode root = objectMapper.readTree(result.getResponse().getContentAsString(StandardCharsets.UTF_8));
            content = root.path("content");
            if (content.isArray() && !content.isEmpty()) {
                break;
            }
            Thread.sleep(200);
        }

        assertThat(content.isArray()).isTrue();
        assertThat(content.size()).isGreaterThan(0);

        for (JsonNode item : content) {
            assertThat(item.path("userId").asText()).isEqualTo(userId.toString());
            assertThat(item.path("status").asText()).isEqualTo("SKIPPED");
        }
    }

    @Test
    @DisplayName("Deve retornar 400 para intervalo de datas inválido na auditoria")
    void shouldRejectInvalidDateRangeFilter() throws Exception {
        String adminToken = registerPromoteAndLoginAdmin("AuditAdmin2", "audit-admin2" + System.nanoTime() + "@email.com", "StrongPass123");

        String dateFrom = LocalDateTime.now().plusDays(1).format(DateTimeFormatter.ISO_DATE_TIME);
        String dateTo = LocalDateTime.now().minusDays(1).format(DateTimeFormatter.ISO_DATE_TIME);

        MvcResult result = mockMvc.perform(get("/api/admin/alerts/deliveries")
                        .header("Authorization", bearer(adminToken))
                        .param("dateFrom", dateFrom)
                        .param("dateTo", dateTo))
                .andExpect(status().isBadRequest())
                .andReturn();

        JsonNode body = objectMapper.readTree(result.getResponse().getContentAsString(StandardCharsets.UTF_8));
        assertThat(body.path("code").asText()).isEqualTo("SEARCH_FILTER_INVALID");
    }

    @Test
    @DisplayName("Deve aplicar fallback de sort e limite de pagina na auditoria de alertas")
    void shouldFallbackInvalidSortAndClampAlertPageSize() throws Exception {
        String adminToken = registerPromoteAndLoginAdmin("AuditAdmin Sort", "audit-admin-sort" + System.nanoTime() + "@email.com", "StrongPass123");

        String userEmail = "audit-user-sort" + System.nanoTime() + "@email.com";
        String userToken = registerAndLogin("AuditUserSort", userEmail, "StrongPass123");

        mockMvc.perform(put("/api/v1/users/me/goals")
                        .header("Authorization", bearer(userToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"period\":\"MONTHLY\",\"targetPages\":350}"))
                .andExpect(status().isOk());

        MvcResult result = mockMvc.perform(get("/api/admin/alerts/deliveries")
                        .header("Authorization", bearer(adminToken))
                        .param("size", "999")
                        .param("sort", "unsupportedField,desc"))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode root = objectMapper.readTree(result.getResponse().getContentAsString(StandardCharsets.UTF_8));
        assertThat(root.path("page").path("size").asInt()).isEqualTo(100);
        assertThat(root.path("content").isArray()).isTrue();
        assertThat(root.path("content").isEmpty()).isFalse();
    }
}
