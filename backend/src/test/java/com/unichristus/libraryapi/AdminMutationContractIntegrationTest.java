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
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class AdminMutationContractIntegrationTest extends IntegrationTestSupport {

    @Autowired
    private BadgeJpaRepository badgeJpaRepository;

    @Test
    @DisplayName("Deve manter 200 com body nas atualizacoes admin que retornam estado")
    void shouldKeepOkWithBodyForAdminStateReturningUpdates() throws Exception {
        String adminToken = registerPromoteAndLoginAdmin("Admin Contract", "admin-contract-" + System.nanoTime() + "@email.com", "StrongPass123");
        UUID anyBookId = fetchAnyBookId(adminToken);

        String tagId = createTag(adminToken, "Tag Contrato " + System.nanoTime());
        MvcResult updateTagResult = mockMvc.perform(put("/api/admin/tags/{tagId}", tagId)
                        .header("Authorization", bearer(adminToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"Tag Contrato Atualizada\"}"))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode updatedTag = parse(updateTagResult);
        assertThat(updatedTag.path("id").asText()).isEqualTo(tagId);
        assertThat(updatedTag.path("name").asText()).isEqualTo("Tag Contrato Atualizada");

        String categoryId = createCategory(adminToken, "Categoria Contrato " + System.nanoTime(), "descricao inicial");
        MvcResult updateCategoryResult = mockMvc.perform(put("/api/admin/categories/{categoryId}", categoryId)
                        .header("Authorization", bearer(adminToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "name": "Categoria Contrato Atualizada",
                                  "description": "descricao atualizada"
                                }
                                """))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode updatedCategory = parse(updateCategoryResult);
        assertThat(updatedCategory.path("id").asText()).isEqualTo(categoryId);
        assertThat(updatedCategory.path("name").asText()).isEqualTo("Categoria Contrato Atualizada");
        assertThat(updatedCategory.path("description").asText()).isEqualTo("descricao atualizada");

        String collectionId = createCollection(adminToken, anyBookId, "Colecao Contrato", "descricao original", "https://example.com/collection-original.jpg");
        MvcResult updateCollectionResult = mockMvc.perform(put("/api/admin/collections/{id}", collectionId)
                        .header("Authorization", bearer(adminToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "title": "Colecao Contrato Atualizada",
                                  "description": "descricao atualizada",
                                  "coverUrl": "https://example.com/collection-updated.jpg",
                                  "bookIds": ["%s"]
                                }
                                """.formatted(anyBookId)))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode updatedCollection = parse(updateCollectionResult);
        assertThat(updatedCollection.path("id").asText()).isEqualTo(collectionId);
        assertThat(updatedCollection.path("title").asText()).isEqualTo("Colecao Contrato Atualizada");
        assertThat(updatedCollection.path("description").asText()).isEqualTo("descricao atualizada");
        assertThat(updatedCollection.path("coverUrl").asText()).isEqualTo("https://example.com/collection-updated.jpg");
        assertThat(updatedCollection.path("books").isArray()).isTrue();
        assertThat(updatedCollection.path("books").isEmpty()).isFalse();

        Badge originalBadge = badgeJpaRepository.findByCode(BadgeCode.TOTAL_PAGES_1000).orElseThrow();
        Badge badgeSnapshot = snapshot(originalBadge);
        try {
            MvcResult updateBadgeResult = mockMvc.perform(put("/api/admin/badges/{id}", originalBadge.getId())
                            .header("Authorization", bearer(adminToken))
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("""
                                    {
                                      "code": "TOTAL_PAGES_1000",
                                      "name": "Badge Contrato Atualizada",
                                      "description": "Badge atualizada para contrato",
                                      "criteriaType": "TOTAL_PAGES",
                                      "criteriaValue": "1200",
                                      "active": true
                                    }
                                    """))
                    .andExpect(status().isOk())
                    .andReturn();

            JsonNode updatedBadge = parse(updateBadgeResult);
            assertThat(updatedBadge.path("id").asText()).isEqualTo(originalBadge.getId().toString());
            assertThat(updatedBadge.path("code").asText()).isEqualTo("TOTAL_PAGES_1000");
            assertThat(updatedBadge.path("name").asText()).isEqualTo("Badge Contrato Atualizada");
            assertThat(updatedBadge.path("description").asText()).isEqualTo("Badge atualizada para contrato");
            assertThat(updatedBadge.path("criteriaType").asText()).isEqualTo("TOTAL_PAGES");
            assertThat(updatedBadge.path("criteriaValue").asText()).isEqualTo("1200");
            assertThat(updatedBadge.path("active").asBoolean()).isTrue();
        } finally {
            restoreBadge(badgeSnapshot);
        }
    }

    @Test
    @DisplayName("Deve manter 204 sem body nos comandos admin sem retorno")
    void shouldKeepNoContentWithoutBodyForAdminCommandMutations() throws Exception {
        String adminToken = registerPromoteAndLoginAdmin("Admin Command", "admin-command-" + System.nanoTime() + "@email.com", "StrongPass123");

        UUID bookId = createBook(adminToken);
        MvcResult patchBookResult = mockMvc.perform(patch("/api/admin/books/{bookId}", bookId)
                        .header("Authorization", bearer(adminToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"title\":\"Livro Contrato Atualizado\"}"))
                .andExpect(status().isNoContent())
                .andReturn();
        assertThat(patchBookResult.getResponse().getContentAsString(StandardCharsets.UTF_8)).isEmpty();

        MvcResult deleteBookResult = mockMvc.perform(delete("/api/admin/books/{bookId}", bookId)
                        .header("Authorization", bearer(adminToken)))
                .andExpect(status().isNoContent())
                .andReturn();
        assertThat(deleteBookResult.getResponse().getContentAsString(StandardCharsets.UTF_8)).isEmpty();

        String targetEmail = "admin-command-target-" + System.nanoTime() + "@email.com";
        registerUser("Admin Command Target", targetEmail, "StrongPass123");
        UUID targetUserId = userJpaRepository.findByEmail(targetEmail).orElseThrow().getId();

        MvcResult invalidateUserResult = mockMvc.perform(delete("/api/admin/users/{userId}", targetUserId)
                        .header("Authorization", bearer(adminToken)))
                .andExpect(status().isNoContent())
                .andReturn();
        assertThat(invalidateUserResult.getResponse().getContentAsString(StandardCharsets.UTF_8)).isEmpty();

        MvcResult reactivateUserResult = mockMvc.perform(patch("/api/admin/users/{userId}/reactivate", targetUserId)
                        .header("Authorization", bearer(adminToken)))
                .andExpect(status().isNoContent())
                .andReturn();
        assertThat(reactivateUserResult.getResponse().getContentAsString(StandardCharsets.UTF_8)).isEmpty();
        assertThat(userJpaRepository.findById(targetUserId).orElseThrow().getActive()).isTrue();

        Badge deletableBadge = badgeJpaRepository.findByCode(BadgeCode.STREAK_30_DAYS).orElseThrow();
        Badge deleteSnapshot = snapshot(deletableBadge);
        try {
            MvcResult deleteBadgeResult = mockMvc.perform(delete("/api/admin/badges/{id}", deletableBadge.getId())
                            .header("Authorization", bearer(adminToken)))
                    .andExpect(status().isNoContent())
                    .andReturn();
            assertThat(deleteBadgeResult.getResponse().getContentAsString(StandardCharsets.UTF_8)).isEmpty();
        } finally {
            restoreBadge(deleteSnapshot);
        }
    }

    private String createTag(String adminToken, String name) throws Exception {
        MvcResult result = mockMvc.perform(post("/api/admin/tags")
                        .header("Authorization", bearer(adminToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"" + name + "\"}"))
                .andExpect(status().isCreated())
                .andReturn();
        return parse(result).path("id").asText();
    }

    private String createCategory(String adminToken, String name, String description) throws Exception {
        MvcResult result = mockMvc.perform(post("/api/admin/categories")
                        .header("Authorization", bearer(adminToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "name": "%s",
                                  "description": "%s"
                                }
                                """.formatted(name, description)))
                .andExpect(status().isCreated())
                .andReturn();
        return parse(result).path("id").asText();
    }

    private String createCollection(String adminToken, UUID bookId, String title, String description, String coverUrl) throws Exception {
        MvcResult result = mockMvc.perform(post("/api/admin/collections")
                        .header("Authorization", bearer(adminToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "title": "%s",
                                  "description": "%s",
                                  "coverUrl": "%s",
                                  "bookIds": ["%s"]
                                }
                                """.formatted(title, description, coverUrl, bookId)))
                .andExpect(status().isCreated())
                .andReturn();
        return parse(result).path("id").asText();
    }

    private UUID createBook(String adminToken) throws Exception {
        String isbn = String.valueOf(9781000000000L + (System.nanoTime() % 1_000_000L));
        MvcResult result = mockMvc.perform(post("/api/admin/books")
                        .header("Authorization", bearer(adminToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "title": "Livro Contrato",
                                  "author": "Autor Contrato",
                                  "isbn": "%s",
                                  "numberOfPages": 320,
                                  "publicationDate": "2020-01-01",
                                  "coverUrl": "https://example.com/book-contract.jpg",
                                  "categories": []
                                }
                                """.formatted(isbn)))
                .andExpect(status().isCreated())
                .andReturn();
        return UUID.fromString(parse(result).path("id").asText());
    }

    private Badge snapshot(Badge original) {
        return Badge.builder()
                .code(original.getCode())
                .name(original.getName())
                .description(original.getDescription())
                .criteriaType(original.getCriteriaType())
                .criteriaValue(original.getCriteriaValue())
                .active(original.getActive())
                .build();
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

    private JsonNode parse(MvcResult result) throws Exception {
        return objectMapper.readTree(result.getResponse().getContentAsString(StandardCharsets.UTF_8));
    }
}
