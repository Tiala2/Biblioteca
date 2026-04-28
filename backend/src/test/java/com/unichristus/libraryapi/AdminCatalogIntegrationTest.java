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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class AdminCatalogIntegrationTest extends IntegrationTestSupport {

    @Test
    @DisplayName("Deve bloquear usuário comum nos endpoints de catálogo admin")
    void shouldForbidCatalogManagementForRegularUser() throws Exception {
        String token = registerAndLogin("Regular", "regular" + System.nanoTime() + "@email.com", "StrongPass123");

        mockMvc.perform(post("/api/admin/tags")
                        .header("Authorization", bearer(token))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"TagSemPermissao\"}"))
                .andExpect(status().isForbidden());

        mockMvc.perform(post("/api/admin/collections")
                        .header("Authorization", bearer(token))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"title\":\"ColecaoSemPermissao\",\"description\":\"x\",\"coverUrl\":\"https://exemplo.com/a.jpg\",\"bookIds\":[]}"))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Deve permitir CRUD admin de tags e coleções")
    void shouldManageTagAndCollectionAsAdmin() throws Exception {
        String adminToken = registerPromoteAndLoginAdmin("Admin", "admin" + System.nanoTime() + "@email.com", "StrongPass123");
        UUID anyBookId = fetchAnyBookId(adminToken);

        MvcResult createTagResult = mockMvc.perform(post("/api/admin/tags")
                        .header("Authorization", bearer(adminToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"TagAdmin" + System.nanoTime() + "\"}"))
                .andExpect(status().isCreated())
                .andExpect(header().exists("Location"))
                .andReturn();

        JsonNode createdTag = objectMapper.readTree(createTagResult.getResponse().getContentAsString(StandardCharsets.UTF_8));
        String tagId = createdTag.path("id").asText();
        assertThat(tagId).isNotBlank();
        assertThat(createTagResult.getResponse().getHeader("Location"))
                .isEqualTo("http://localhost/api/admin/tags/" + tagId);

        mockMvc.perform(put("/api/admin/tags/{tagId}", tagId)
                        .header("Authorization", bearer(adminToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"TagAdminAtualizada\"}"))
                .andExpect(status().isOk());

        MvcResult createCollectionResult = mockMvc.perform(post("/api/admin/collections")
                        .header("Authorization", bearer(adminToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"title\":\"Colecao Admin\",\"description\":\"Colecao de teste\",\"coverUrl\":\"https://exemplo.com/colecao.jpg\",\"bookIds\":[\"" + anyBookId + "\"]}"))
                .andExpect(status().isCreated())
                .andExpect(header().exists("Location"))
                .andReturn();

        JsonNode createdCollection = objectMapper.readTree(createCollectionResult.getResponse().getContentAsString(StandardCharsets.UTF_8));
        String collectionId = createdCollection.path("id").asText();
        assertThat(collectionId).isNotBlank();
        assertThat(createCollectionResult.getResponse().getHeader("Location"))
                .isEqualTo("http://localhost/api/admin/collections/" + collectionId);

        mockMvc.perform(put("/api/admin/collections/{id}", collectionId)
                        .header("Authorization", bearer(adminToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"title\":\"Colecao Admin Atualizada\",\"description\":\"Atualizada\",\"coverUrl\":\"https://exemplo.com/colecao2.jpg\",\"bookIds\":[\"" + anyBookId + "\"]}"))
                .andExpect(status().isOk());

        mockMvc.perform(delete("/api/admin/collections/{id}", collectionId)
                        .header("Authorization", bearer(adminToken)))
                .andExpect(status().isNoContent());

        mockMvc.perform(delete("/api/admin/tags/{tagId}", tagId)
                        .header("Authorization", bearer(adminToken)))
                .andExpect(status().isNoContent());
    }

    @Test
    @DisplayName("Deve validar payload de tag e retornar 400 para nome em branco")
    void shouldValidateTagPayload() throws Exception {
        String adminToken = registerPromoteAndLoginAdmin("Admin Validate", "admin-validate" + System.nanoTime() + "@email.com", "StrongPass123");

        mockMvc.perform(post("/api/admin/tags")
                        .header("Authorization", bearer(adminToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"\"}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("Deve rejeitar coverUrl insegura em livro e colecao do admin")
    void shouldRejectUnsafeCoverUrls() throws Exception {
        String adminToken = registerPromoteAndLoginAdmin("Admin Cover Validate", "admin-cover-validate" + System.nanoTime() + "@email.com", "StrongPass123");
        UUID anyBookId = fetchAnyBookId(adminToken);

        mockMvc.perform(post("/api/admin/books")
                        .header("Authorization", bearer(adminToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"title\":\"Livro Seguro\",\"author\":\"Autor Seguro\",\"isbn\":\"9780000001234\",\"numberOfPages\":220,\"publicationDate\":\"2020-01-01\",\"coverUrl\":\"javascript:alert(1)\",\"categories\":[]}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_ERROR"));

        mockMvc.perform(post("/api/admin/collections")
                        .header("Authorization", bearer(adminToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"title\":\"Colecao Insegura\",\"description\":\"x\",\"coverUrl\":\"data:text/html;base64,PHNjcmlwdD4=\",\"bookIds\":[\"" + anyBookId + "\"]}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_ERROR"));
    }

    @Test
    @DisplayName("Deve retornar 404 ao criar colecao com livro inexistente")
    void shouldReturnNotFoundWhenCreatingCollectionWithUnknownBook() throws Exception {
        String adminToken = registerPromoteAndLoginAdmin("Admin Collection", "admin-collection" + System.nanoTime() + "@email.com", "StrongPass123");
        String unknownBookId = UUID.randomUUID().toString();

        mockMvc.perform(post("/api/admin/collections")
                        .header("Authorization", bearer(adminToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"title\":\"Colecao Livro Inexistente\",\"description\":\"x\",\"coverUrl\":\"https://exemplo.com/a.jpg\",\"bookIds\":[\"" + unknownBookId + "\"]}"))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("Deve normalizar espacos em tag e colecao do admin")
    void shouldNormalizeTagAndCollectionTextFields() throws Exception {
        String adminToken = registerPromoteAndLoginAdmin("Admin Normalize Catalog", "admin-normalize-catalog-" + System.nanoTime() + "@email.com", "StrongPass123");
        UUID anyBookId = fetchAnyBookId(adminToken);

        MvcResult createTagResult = mockMvc.perform(post("/api/admin/tags")
                        .header("Authorization", bearer(adminToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"  Tag Normalizada  \"}"))
                .andExpect(status().isCreated())
                .andReturn();

        JsonNode createdTag = objectMapper.readTree(createTagResult.getResponse().getContentAsString(StandardCharsets.UTF_8));
        assertThat(createdTag.path("name").asText()).isEqualTo("Tag Normalizada");

        MvcResult createCollectionResult = mockMvc.perform(post("/api/admin/collections")
                        .header("Authorization", bearer(adminToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"title\":\"  Colecao Normalizada  \",\"description\":\"   \",\"coverUrl\":\"https://exemplo.com/colecao.jpg\",\"bookIds\":[\"" + anyBookId + "\"]}"))
                .andExpect(status().isCreated())
                .andReturn();

        JsonNode createdCollection = objectMapper.readTree(createCollectionResult.getResponse().getContentAsString(StandardCharsets.UTF_8));
        assertThat(createdCollection.path("title").asText()).isEqualTo("Colecao Normalizada");
        assertThat(createdCollection.path("description").isNull()).isTrue();
    }
}
