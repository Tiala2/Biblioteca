package com.unichristus.libraryapi;

import com.unichristus.libraryapi.infrastructure.integration.openlibrary.OpenLibraryClient;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;

import java.nio.charset.StandardCharsets;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class AdminBookImportIntegrationTest extends IntegrationTestSupport {

    @MockitoBean
    private OpenLibraryClient openLibraryClient;

    @Test
    @DisplayName("Deve importar livros da Open Library como admin")
    void shouldImportBooksAsAdmin() throws Exception {
        String adminToken = registerPromoteAndLoginAdmin("Admin Import", "admin-import" + System.nanoTime() + "@email.com", "StrongPass123");
        String importedTitle = "Clean Code Import " + System.nanoTime();
        String importedIsbn = "9791234567890";

        OpenLibraryClient.OpenLibraryDoc validDoc = new OpenLibraryClient.OpenLibraryDoc(
                importedTitle,
                List.of("Robert C. Martin"),
                List.of(importedIsbn),
                464,
                2008,
                12345
        );
        OpenLibraryClient.OpenLibraryDoc invalidDocNoIsbn = new OpenLibraryClient.OpenLibraryDoc(
                "Sem Isbn",
                List.of("Autor sem ISBN"),
                List.of(),
                100,
                2010,
                23456
        );
        OpenLibraryClient.OpenLibraryDoc duplicateDoc = new OpenLibraryClient.OpenLibraryDoc(
                importedTitle + " Dup",
                List.of("Robert C. Martin"),
                List.of(importedIsbn),
                200,
                2011,
                34567
        );

        when(openLibraryClient.search(eq("clean code"), eq(1), eq(3)))
                .thenReturn(new OpenLibraryClient.OpenLibrarySearchResponse(
                        3,
                        List.of(validDoc, invalidDocNoIsbn, duplicateDoc)
                ));

        String responseBody = mockMvc.perform(post("/api/admin/books/import/open-library")
                        .header("Authorization", bearer(adminToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "query": "clean code",
                                  "pages": 1,
                                  "pageSize": 3
                                }
                                """))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString(StandardCharsets.UTF_8);

        assertThat(responseBody).contains("\"imported\":1");
        assertThat(responseBody).contains("\"skipped\":2");

        String listBody = mockMvc.perform(get("/api/v1/books")
                        .param("includeWithoutPdf", "true")
                        .param("q", "Clean Code Import"))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString(StandardCharsets.UTF_8);

        assertThat(listBody).contains(importedTitle);
    }

    @Test
    @DisplayName("Deve bloquear importacao para usuario sem role ADMIN")
    void shouldForbidImportForRegularUser() throws Exception {
        String token = registerAndLogin("Regular Import", "regular-import" + System.nanoTime() + "@email.com", "StrongPass123");

        mockMvc.perform(post("/api/admin/books/import/open-library")
                        .header("Authorization", bearer(token))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "query": "software",
                                  "pages": 1,
                                  "pageSize": 2
                                }
                                """))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Deve retornar resultado parcial quando uma pagina externa falha na importacao admin")
    void shouldReturnPartialImportWhenExternalPageFails() throws Exception {
        String adminToken = registerPromoteAndLoginAdmin("Admin Import Partial", "admin-import-partial" + System.nanoTime() + "@email.com", "StrongPass123");
        String importedTitle = "Partial Import Book " + System.nanoTime();
        String importedIsbn = "9791234567001";

        OpenLibraryClient.OpenLibraryDoc validDoc = new OpenLibraryClient.OpenLibraryDoc(
                importedTitle,
                List.of("Grace Hopper"),
                List.of(importedIsbn),
                250,
                2015,
                98765
        );

        when(openLibraryClient.search(eq("partial import"), eq(1), eq(2)))
                .thenReturn(new OpenLibraryClient.OpenLibrarySearchResponse(1, List.of(validDoc)));
        when(openLibraryClient.search(eq("partial import"), eq(2), eq(2)))
                .thenThrow(new IllegalStateException("upstream timeout"));

        String responseBody = mockMvc.perform(post("/api/admin/books/import/open-library")
                        .header("Authorization", bearer(adminToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "query": "partial import",
                                  "pages": 2,
                                  "pageSize": 2
                                }
                                """))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString(StandardCharsets.UTF_8);

        assertThat(responseBody).contains("\"imported\":1");
        assertThat(responseBody).contains("\"failed\":1");
        assertThat(responseBody).contains("Failed fetching Open Library page 2");

        String listBody = mockMvc.perform(get("/api/v1/books")
                        .param("includeWithoutPdf", "true")
                        .param("q", importedTitle))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString(StandardCharsets.UTF_8);

        assertThat(listBody).contains(importedTitle);
    }
}
