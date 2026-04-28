package com.unichristus.libraryapi;

import com.unichristus.libraryapi.infrastructure.integration.openlibrary.OpenLibraryClient;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class BookRealtimeSearchIntegrationTest extends IntegrationTestSupport {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private OpenLibraryClient openLibraryClient;

    @Test
    @DisplayName("Deve importar da Open Library em tempo real quando busca local nao retorna resultados")
    void shouldImportFromOpenLibraryOnRealtimeFallback() throws Exception {
        String query = "Realtime Unique Book";
        when(openLibraryClient.search(query, 1, 20))
                .thenReturn(new OpenLibraryClient.OpenLibrarySearchResponse(
                        1,
                        List.of(new OpenLibraryClient.OpenLibraryDoc(
                                "Realtime Unique Book",
                                List.of("Martin Fowler"),
                                List.of("9780134494166"),
                                432,
                                2017,
                                123456
                        ))));

        mockMvc.perform(get("/api/v1/books")
                        .param("q", query)
                        .param("page", "0")
                        .param("size", "12")
                        .param("includeWithoutPdf", "true")
                        .param("sort", "BEST_RATED"))
                        .andExpect(status().isOk())
                        .andExpect(jsonPath("$.content[0].title").value("Realtime Unique Book"))
                        .andExpect(jsonPath("$.content[0].author").value("Martin Fowler"));
    }

    @Test
    @DisplayName("Deve manter busca 200 com lista vazia quando fallback em tempo real falha")
    void shouldKeepSearchStableWhenRealtimeFallbackFails() throws Exception {
        String query = "Realtime Failure Book";
        when(openLibraryClient.search(query, 1, 20))
                .thenThrow(new IllegalStateException("open library unavailable"));

        mockMvc.perform(get("/api/v1/books")
                        .param("q", query)
                        .param("page", "0")
                        .param("size", "12")
                        .param("includeWithoutPdf", "true")
                        .param("sort", "BEST_RATED"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isArray())
                .andExpect(jsonPath("$.content").isEmpty())
                .andExpect(jsonPath("$.page.number").value(0))
                .andExpect(jsonPath("$.page.size").value(12));
    }
}
