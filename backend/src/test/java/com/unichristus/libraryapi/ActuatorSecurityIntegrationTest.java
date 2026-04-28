package com.unichristus.libraryapi;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class ActuatorSecurityIntegrationTest extends IntegrationTestSupport {

    @Test
    @DisplayName("Deve permitir acesso publico ao health do actuator")
    void shouldAllowPublicHealthEndpoint() throws Exception {
        mockMvc.perform(get("/actuator/health"))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("Deve restringir metricas do actuator para admin")
    void shouldRestrictActuatorMetricsToAdmin() throws Exception {
        String userToken = registerAndLogin("Regular Metrics", "regular-metrics-" + System.nanoTime() + "@email.com", "StrongPass123");
        String adminToken = registerPromoteAndLoginAdmin("Admin Metrics", "admin-metrics-" + System.nanoTime() + "@email.com", "StrongPass123");

        mockMvc.perform(get("/actuator/metrics"))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(get("/actuator/metrics")
                        .header("Authorization", bearer(userToken)))
                .andExpect(status().isForbidden());

        mockMvc.perform(get("/actuator/metrics")
                        .header("Authorization", bearer(adminToken)))
                .andExpect(status().isOk());
    }
}
