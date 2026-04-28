package com.unichristus.libraryapi;

import com.fasterxml.jackson.databind.JsonNode;
import com.unichristus.libraryapi.infrastructure.persistence.book.BookJpaRepository;
import io.minio.MinioClient;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MvcResult;

import java.nio.charset.StandardCharsets;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class AdminBookUploadIntegrationTest extends IntegrationTestSupport {

    @Autowired
    private BookJpaRepository bookJpaRepository;

    @MockitoBean
    private MinioClient minioClient;

    @Test
    @DisplayName("Deve permitir upload de PDF para admin e marcar livro com hasPdf=true")
    void shouldUploadPdfAsAdmin() throws Exception {
        String adminToken = registerPromoteAndLoginAdmin("Admin Upload", "admin-upload" + System.nanoTime() + "@email.com", "StrongPass123");
        UUID bookId = createBookAsAdmin(adminToken);

        MockMultipartFile file = new MockMultipartFile(
                "file",
                "sample.pdf",
                MediaType.APPLICATION_PDF_VALUE,
                "%PDF-1.7 valid-content".getBytes(StandardCharsets.UTF_8)
        );

        mockMvc.perform(multipart("/api/admin/books/{bookId}/upload", bookId)
                        .file(file)
                        .header("Authorization", bearer(adminToken)))
                .andExpect(status().isNoContent());

        boolean hasPdf = bookJpaRepository.findById(bookId).orElseThrow().isHasPdf();
        assertThat(hasPdf).isTrue();
    }

    @Test
    @DisplayName("Deve rejeitar upload com extensao invalida mesmo para admin")
    void shouldRejectUploadWithInvalidExtension() throws Exception {
        String adminToken = registerPromoteAndLoginAdmin("Admin Upload Invalid Extension", "admin-upload-ext" + System.nanoTime() + "@email.com", "StrongPass123");
        UUID bookId = createBookAsAdmin(adminToken);

        MockMultipartFile file = new MockMultipartFile(
                "file",
                "sample.txt",
                MediaType.APPLICATION_PDF_VALUE,
                "%PDF-1.7 fake".getBytes(StandardCharsets.UTF_8)
        );

        mockMvc.perform(multipart("/api/admin/books/{bookId}/upload", bookId)
                        .file(file)
                        .header("Authorization", bearer(adminToken)))
                .andExpect(status().isBadRequest());

        boolean hasPdf = bookJpaRepository.findById(bookId).orElseThrow().isHasPdf();
        assertThat(hasPdf).isFalse();
    }

    @Test
    @DisplayName("Deve rejeitar upload com conteudo que nao seja PDF valido")
    void shouldRejectUploadWithInvalidPdfSignature() throws Exception {
        String adminToken = registerPromoteAndLoginAdmin("Admin Upload Invalid Signature", "admin-upload-signature" + System.nanoTime() + "@email.com", "StrongPass123");
        UUID bookId = createBookAsAdmin(adminToken);

        MockMultipartFile file = new MockMultipartFile(
                "file",
                "sample.pdf",
                MediaType.APPLICATION_PDF_VALUE,
                "not-a-pdf".getBytes(StandardCharsets.UTF_8)
        );

        mockMvc.perform(multipart("/api/admin/books/{bookId}/upload", bookId)
                        .file(file)
                        .header("Authorization", bearer(adminToken)))
                .andExpect(status().isBadRequest());

        boolean hasPdf = bookJpaRepository.findById(bookId).orElseThrow().isHasPdf();
        assertThat(hasPdf).isFalse();
    }

    @Test
    @DisplayName("Deve rejeitar upload com content-type que nao seja PDF")
    void shouldRejectUploadWithInvalidContentType() throws Exception {
        String adminToken = registerPromoteAndLoginAdmin("Admin Upload Invalid Content Type", "admin-upload-content-type" + System.nanoTime() + "@email.com", "StrongPass123");
        UUID bookId = createBookAsAdmin(adminToken);

        MockMultipartFile file = new MockMultipartFile(
                "file",
                "sample.pdf",
                MediaType.TEXT_PLAIN_VALUE,
                "%PDF-1.7 fake".getBytes(StandardCharsets.UTF_8)
        );

        mockMvc.perform(multipart("/api/admin/books/{bookId}/upload", bookId)
                        .file(file)
                        .header("Authorization", bearer(adminToken)))
                .andExpect(status().isBadRequest());

        boolean hasPdf = bookJpaRepository.findById(bookId).orElseThrow().isHasPdf();
        assertThat(hasPdf).isFalse();
    }

    @Test
    @DisplayName("Deve bloquear upload de PDF para usuario comum")
    void shouldForbidUploadPdfForRegularUser() throws Exception {
        String adminToken = registerPromoteAndLoginAdmin("Admin Upload 2", "admin-upload-2" + System.nanoTime() + "@email.com", "StrongPass123");
        UUID bookId = createBookAsAdmin(adminToken);
        String regularToken = registerAndLogin("Regular Upload", "regular-upload" + System.nanoTime() + "@email.com", "StrongPass123");

        MockMultipartFile file = new MockMultipartFile(
                "file",
                "sample.pdf",
                MediaType.APPLICATION_PDF_VALUE,
                "%PDF-1.7 valid-content".getBytes(StandardCharsets.UTF_8)
        );

        mockMvc.perform(multipart("/api/admin/books/{bookId}/upload", bookId)
                        .file(file)
                        .header("Authorization", bearer(regularToken)))
                .andExpect(status().isForbidden());
    }

    private UUID createBookAsAdmin(String adminToken) throws Exception {
        String isbn = String.valueOf(9780000000000L + (System.nanoTime() % 1_000_000L));
        String payload = "{" +
                "\"title\":\"Livro Upload Test\"," +
                "\"author\":\"Autor Upload Test\"," +
                "\"isbn\":\"" + isbn + "\"," +
                "\"numberOfPages\":220," +
                "\"publicationDate\":\"2020-01-01\"," +
                "\"coverUrl\":\"https://example.com/upload-test.jpg\"," +
                "\"categories\":[]" +
                "}";

        MvcResult createBookResult = mockMvc.perform(post("/api/admin/books")
                        .header("Authorization", bearer(adminToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isCreated())
                .andExpect(header().exists("Location"))
                .andReturn();

        JsonNode json = objectMapper.readTree(createBookResult.getResponse().getContentAsString(StandardCharsets.UTF_8));
        String bookId = json.path("id").asText();
        assertThat(bookId).isNotBlank();
        assertThat(createBookResult.getResponse().getHeader("Location"))
                .isEqualTo("http://localhost/api/admin/books/" + bookId);
        return UUID.fromString(bookId);
    }
}
