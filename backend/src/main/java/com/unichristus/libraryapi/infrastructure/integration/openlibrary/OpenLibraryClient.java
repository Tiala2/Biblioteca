package com.unichristus.libraryapi.infrastructure.integration.openlibrary;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.Optional;

@Slf4j
@Component
@RequiredArgsConstructor
public class OpenLibraryClient {

    private final ObjectMapper objectMapper;
    private final HttpClient httpClient = HttpClient.newBuilder().build();

    @Value("${app.integrations.open-library.base-url:https://openlibrary.org}")
    private String baseUrl;

    @Value("${app.integrations.open-library.timeout-ms:10000}")
    private int timeoutMs;

    @Value("${app.integrations.open-library.archive-base-url:https://archive.org}")
    private String archiveBaseUrl;

    public OpenLibrarySearchResponse search(String query, int page, int limit) {
        String encodedQuery = URLEncoder.encode(query, StandardCharsets.UTF_8);
        String url = "%s/search.json?q=%s&page=%d&limit=%d".formatted(baseUrl, encodedQuery, page, limit);
        return get(url, OpenLibrarySearchResponse.class);
    }

    public Optional<String> findArchivePdfDownloadUrl(OpenLibraryDoc doc) {
        if (doc == null) {
            return Optional.empty();
        }

        for (String identifier : extractArchiveIdentifiers(doc)) {
            Optional<String> downloadUrl = findPdfDownloadUrlByIdentifier(identifier);
            if (downloadUrl.isPresent()) {
                return downloadUrl;
            }
        }

        return Optional.empty();
    }

    public DownloadedBinary downloadBinary(String url, int maxBytes) {
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(url))
                .timeout(Duration.ofMillis(timeoutMs))
                .GET()
                .build();

        try {
            HttpResponse<byte[]> response = httpClient.send(request, HttpResponse.BodyHandlers.ofByteArray());
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                throw new IllegalStateException("Download failed: HTTP " + response.statusCode());
            }
            byte[] bytes = response.body();
            if (bytes == null || bytes.length == 0) {
                throw new IllegalStateException("Downloaded file is empty");
            }
            if (bytes.length > maxBytes) {
                throw new IllegalStateException("Downloaded file exceeded allowed size");
            }

            String contentType = response.headers().firstValue("Content-Type").orElse("application/pdf");
            return new DownloadedBinary(bytes, contentType);
        } catch (IOException | InterruptedException e) {
            if (e instanceof InterruptedException) {
                Thread.currentThread().interrupt();
            }
            throw new IllegalStateException("Failed to download external file", e);
        }
    }

    private Optional<String> findPdfDownloadUrlByIdentifier(String identifier) {
        String safeIdentifier = identifier == null ? "" : identifier.trim();
        if (safeIdentifier.isBlank()) {
            return Optional.empty();
        }

        String metadataUrl = "%s/metadata/%s".formatted(archiveBaseUrl, encodePathSegment(safeIdentifier));
        try {
            InternetArchiveMetadata metadata = get(metadataUrl, InternetArchiveMetadata.class);
            List<InternetArchiveFile> files = metadata.files() == null ? List.of() : metadata.files();
            Optional<InternetArchiveFile> selected = files.stream()
                    .filter(Objects::nonNull)
                    .filter(file -> file.name() != null && !file.name().isBlank())
                    .filter(this::looksLikePdfFile)
                    .findFirst();

            return selected.map(file -> "%s/download/%s/%s".formatted(
                    archiveBaseUrl,
                    encodePathSegment(safeIdentifier),
                    encodePathSegment(file.name())));
        } catch (IllegalStateException ex) {
            log.debug("Nao foi possivel resolver PDF no Archive para '{}': {}", safeIdentifier, ex.getMessage());
            return Optional.empty();
        }
    }

    private boolean looksLikePdfFile(InternetArchiveFile file) {
        String fileName = file.name().toLowerCase();
        String format = file.format() == null ? "" : file.format().toLowerCase();
        return fileName.endsWith(".pdf")
                || format.contains("pdf")
                || format.contains("text pdf");
    }

    private List<String> extractArchiveIdentifiers(OpenLibraryDoc doc) {
        List<String> identifiers = new ArrayList<>();

        if (doc.availability() != null && doc.availability().identifier() != null && !doc.availability().identifier().isBlank()) {
            identifiers.add(doc.availability().identifier());
        }

        if (doc.ia() != null) {
            for (String iaIdentifier : doc.ia()) {
                if (iaIdentifier != null && !iaIdentifier.isBlank() && !identifiers.contains(iaIdentifier)) {
                    identifiers.add(iaIdentifier);
                }
            }
        }

        return identifiers;
    }

    private String encodePathSegment(String value) {
        return URLEncoder.encode(value, StandardCharsets.UTF_8).replace("+", "%20");
    }

    private <T> T get(String url, Class<T> responseType) {
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(url))
                .timeout(Duration.ofMillis(timeoutMs))
                .GET()
                .build();

        try {
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                throw new IllegalStateException("Open Library request failed: HTTP " + response.statusCode());
            }
            return objectMapper.readValue(response.body(), responseType);
        } catch (IOException | InterruptedException e) {
            if (e instanceof InterruptedException) {
                Thread.currentThread().interrupt();
            }
            throw new IllegalStateException("Failed to call Open Library API", e);
        }
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record OpenLibrarySearchResponse(
            @JsonProperty("numFound") Integer numFound,
            @JsonProperty("docs") List<OpenLibraryDoc> docs
    ) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record OpenLibraryDoc(
            @JsonProperty("title") String title,
            @JsonProperty("author_name") List<String> authorNames,
            @JsonProperty("isbn") List<String> isbn,
            @JsonProperty("number_of_pages_median") Integer numberOfPagesMedian,
            @JsonProperty("first_publish_year") Integer firstPublishYear,
            @JsonProperty("cover_i") Integer coverId,
            @JsonProperty("ia") List<String> ia,
            @JsonProperty("availability") OpenLibraryAvailability availability
    ) {
        public OpenLibraryDoc(String title,
                              List<String> authorNames,
                              List<String> isbn,
                              Integer numberOfPagesMedian,
                              Integer firstPublishYear,
                              Integer coverId) {
            this(title, authorNames, isbn, numberOfPagesMedian, firstPublishYear, coverId, List.of(), null);
        }

        public OpenLibraryDoc(String title,
                              List<String> isbn,
                              Integer numberOfPagesMedian,
                              Integer firstPublishYear,
                              Integer coverId) {
            this(title, List.of(), isbn, numberOfPagesMedian, firstPublishYear, coverId, List.of(), null);
        }
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record OpenLibraryAvailability(
            @JsonProperty("identifier") String identifier
    ) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record InternetArchiveMetadata(
            @JsonProperty("files") List<InternetArchiveFile> files
    ) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record InternetArchiveFile(
            @JsonProperty("name") String name,
            @JsonProperty("format") String format
    ) {
    }

    public record DownloadedBinary(byte[] bytes, String contentType) {
    }
}
