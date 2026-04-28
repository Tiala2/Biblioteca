package com.unichristus.libraryapi;

import com.fasterxml.jackson.databind.JsonNode;
import com.unichristus.libraryapi.domain.engagement.Badge;
import com.unichristus.libraryapi.domain.engagement.BadgeCode;
import com.unichristus.libraryapi.infrastructure.persistence.engagement.BadgeJpaRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MvcResult;

import java.nio.charset.StandardCharsets;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class BadgeAdminIntegrationTest extends IntegrationTestSupport {

    @Autowired
    private BadgeJpaRepository badgeJpaRepository;

    @Test
    @DisplayName("Deve listar, atualizar, excluir e recriar badge como admin")
    void shouldManageBadgeCatalogAsAdmin() throws Exception {
        String adminToken = registerPromoteAndLoginAdmin("Badge Admin", "badge-admin" + System.nanoTime() + "@email.com", "StrongPass123");

        Badge original = badgeJpaRepository.findByCode(BadgeCode.TOTAL_PAGES_1000).orElseThrow();
        Badge snapshot = Badge.builder()
                .code(original.getCode())
                .name(original.getName())
                .description(original.getDescription())
                .criteriaType(original.getCriteriaType())
                .criteriaValue(original.getCriteriaValue())
                .active(original.getActive())
                .build();

        try {
            String updatedName = "Leitor 1000 atualizado";
            String updatedDescription = "Badge atualizada no teste";

            mockMvc.perform(put("/api/admin/badges/{id}", original.getId())
                            .header("Authorization", bearer(adminToken))
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("""
                                    {
                                      "code": "TOTAL_PAGES_1000",
                                      "name": "%s",
                                      "description": "%s",
                                      "criteriaType": "TOTAL_PAGES",
                                      "criteriaValue": "1000",
                                      "active": true
                                    }
                                    """.formatted(updatedName, updatedDescription)))
                    .andExpect(status().isOk());

            Badge updatedBadge = badgeJpaRepository.findById(original.getId()).orElseThrow();
            assertThat(updatedBadge.getName()).isEqualTo(updatedName);
            assertThat(updatedBadge.getDescription()).isEqualTo(updatedDescription);

            mockMvc.perform(delete("/api/admin/badges/{id}", updatedBadge.getId())
                            .header("Authorization", bearer(adminToken)))
                    .andExpect(status().isNoContent());

            assertThat(badgeJpaRepository.findByCode(BadgeCode.TOTAL_PAGES_1000)).isEmpty();

            MvcResult createResult = mockMvc.perform(post("/api/admin/badges")
                            .header("Authorization", bearer(adminToken))
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("""
                                    {
                                      "code": "TOTAL_PAGES_1000",
                                      "name": "Leitor de 1000 paginas recriado",
                                      "description": "Badge recriada via API",
                                      "criteriaType": "TOTAL_PAGES",
                                      "criteriaValue": "1000",
                                      "active": true
                                    }
                                    """))
                    .andExpect(status().isCreated())
                    .andExpect(header().exists("Location"))
                    .andReturn();

            JsonNode created = objectMapper.readTree(createResult.getResponse().getContentAsString(StandardCharsets.UTF_8));
            String recreatedId = created.path("id").asText();
            assertThat(recreatedId).isNotBlank();
            assertThat(createResult.getResponse().getHeader("Location"))
                    .isEqualTo("http://localhost/api/admin/badges/" + recreatedId);

            String listBody = mockMvc.perform(get("/api/admin/badges?page=0&size=20&sort=code")
                            .header("Authorization", bearer(adminToken)))
                    .andExpect(status().isOk())
                    .andReturn()
                    .getResponse()
                    .getContentAsString(StandardCharsets.UTF_8);

            assertThat(listBody).contains("TOTAL_PAGES_1000");
            assertThat(listBody).contains("Leitor de 1000 paginas recriado");
        } finally {
            restoreBadge(snapshot);
        }
    }

    @Test
    @DisplayName("Deve aplicar fallback de sort e limite de pagina no catalogo de badges")
    void shouldFallbackInvalidSortAndClampBadgePageSize() throws Exception {
        String adminToken = registerPromoteAndLoginAdmin("Badge Admin Sort", "badge-admin-sort" + System.nanoTime() + "@email.com", "StrongPass123");

        MvcResult result = mockMvc.perform(get("/api/admin/badges")
                        .header("Authorization", bearer(adminToken))
                        .param("page", "0")
                        .param("size", "999")
                        .param("sort", "unsupportedField,desc"))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode root = objectMapper.readTree(result.getResponse().getContentAsString(StandardCharsets.UTF_8));
        assertThat(root.path("page").path("size").asInt()).isEqualTo(100);
        assertThat(root.path("content").isArray()).isTrue();
        assertThat(root.path("content").isEmpty()).isFalse();
    }

    @Test
    @DisplayName("Deve normalizar campos textuais de badge")
    void shouldNormalizeBadgeTextFields() throws Exception {
        String adminToken = registerPromoteAndLoginAdmin("Badge Normalize", "badge-normalize-" + System.nanoTime() + "@email.com", "StrongPass123");

        Badge original = badgeJpaRepository.findByCode(BadgeCode.TOTAL_PAGES_1000).orElseThrow();
        Badge snapshot = Badge.builder()
                .code(original.getCode())
                .name(original.getName())
                .description(original.getDescription())
                .criteriaType(original.getCriteriaType())
                .criteriaValue(original.getCriteriaValue())
                .active(original.getActive())
                .build();

        try {
            MvcResult result = mockMvc.perform(put("/api/admin/badges/{id}", original.getId())
                            .header("Authorization", bearer(adminToken))
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("""
                                    {
                                      "code": "TOTAL_PAGES_1000",
                                      "name": "  Badge Normalizada  ",
                                      "description": "   ",
                                      "criteriaType": "TOTAL_PAGES",
                                      "criteriaValue": " 1000 ",
                                      "active": true
                                    }
                                    """))
                    .andExpect(status().isOk())
                    .andReturn();

            JsonNode updated = objectMapper.readTree(result.getResponse().getContentAsString(StandardCharsets.UTF_8));
            assertThat(updated.path("name").asText()).isEqualTo("Badge Normalizada");
            assertThat(updated.path("description").isNull()).isTrue();
            assertThat(updated.path("criteriaValue").asText()).isEqualTo("1000");
        } finally {
            restoreBadge(snapshot);
        }
    }

    private void restoreBadge(Badge snapshot) {
        badgeJpaRepository.findByCode(snapshot.getCode()).ifPresentOrElse(existing -> {
            existing.setName(snapshot.getName());
            existing.setDescription(snapshot.getDescription());
            existing.setCriteriaType(snapshot.getCriteriaType());
            existing.setCriteriaValue(snapshot.getCriteriaValue());
            existing.setActive(snapshot.getActive());
            badgeJpaRepository.save(existing);
        }, () -> badgeJpaRepository.save(Badge.builder()
                .code(snapshot.getCode())
                .name(snapshot.getName())
                .description(snapshot.getDescription())
                .criteriaType(snapshot.getCriteriaType())
                .criteriaValue(snapshot.getCriteriaValue())
                .active(snapshot.getActive())
                .build()));
    }
}
