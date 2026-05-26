package com.unichristus.libraryapi.infrastructure.integration.gutenberg;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Component
public class GutenbergClient {

    private static final List<GutenbergBook> CURATED_BOOKS = List.of(
            new GutenbergBook(84, "Frankenstein", "Mary Shelley", 280, 1818, "https://www.gutenberg.org/cache/epub/84/pg84.cover.medium.jpg"),
            new GutenbergBook(1342, "Pride and Prejudice", "Jane Austen", 279, 1813, "https://www.gutenberg.org/cache/epub/1342/pg1342.cover.medium.jpg"),
            new GutenbergBook(11, "Alice's Adventures in Wonderland", "Lewis Carroll", 96, 1865, "https://www.gutenberg.org/cache/epub/11/pg11.cover.medium.jpg"),
            new GutenbergBook(345, "Dracula", "Bram Stoker", 418, 1897, "https://www.gutenberg.org/cache/epub/345/pg345.cover.medium.jpg"),
            new GutenbergBook(1661, "The Adventures of Sherlock Holmes", "Arthur Conan Doyle", 307, 1892, "https://www.gutenberg.org/cache/epub/1661/pg1661.cover.medium.jpg"),
            new GutenbergBook(174, "The Picture of Dorian Gray", "Oscar Wilde", 254, 1890, "https://www.gutenberg.org/cache/epub/174/pg174.cover.medium.jpg"),
            new GutenbergBook(98, "A Tale of Two Cities", "Charles Dickens", 489, 1859, "https://www.gutenberg.org/cache/epub/98/pg98.cover.medium.jpg"),
            new GutenbergBook(76, "Adventures of Huckleberry Finn", "Mark Twain", 366, 1884, "https://www.gutenberg.org/cache/epub/76/pg76.cover.medium.jpg"),
            new GutenbergBook(5200, "Metamorphosis", "Franz Kafka", 70, 1915, "https://www.gutenberg.org/cache/epub/5200/pg5200.cover.medium.jpg"),
            new GutenbergBook(844, "The Importance of Being Earnest", "Oscar Wilde", 90, 1895, "https://www.gutenberg.org/cache/epub/844/pg844.cover.medium.jpg"),
            new GutenbergBook(1952, "The Yellow Wallpaper", "Charlotte Perkins Gilman", 35, 1892, "https://www.gutenberg.org/cache/epub/1952/pg1952.cover.medium.jpg"),
            new GutenbergBook(46, "A Christmas Carol", "Charles Dickens", 112, 1843, "https://www.gutenberg.org/cache/epub/46/pg46.cover.medium.jpg"),
            new GutenbergBook(1232, "The Prince", "Niccolo Machiavelli", 140, 1532, "https://www.gutenberg.org/cache/epub/1232/pg1232.cover.medium.jpg"),
            new GutenbergBook(408, "The Souls of Black Folk", "W. E. B. Du Bois", 240, 1903, "https://www.gutenberg.org/cache/epub/408/pg408.cover.medium.jpg"),
            new GutenbergBook(2701, "Moby-Dick", "Herman Melville", 635, 1851, "https://www.gutenberg.org/cache/epub/2701/pg2701.cover.medium.jpg")
    );

    private final HttpClient httpClient = HttpClient.newHttpClient();
    private final ObjectMapper objectMapper;

    public GutenbergClient(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    @Value("${app.integrations.gutenberg.base-url:https://www.gutenberg.org}")
    private String baseUrl;

    @Value("${app.integrations.gutendex.base-url:https://gutendex.com}")
    private String gutendexBaseUrl;

    @Value("${app.integrations.gutenberg.timeout-ms:15000}")
    private int timeoutMs;

    @Value("${app.integrations.gutendex.timeout-ms:120000}")
    private int gutendexTimeoutMs;

    public List<GutenbergBook> curatedBooks() {
        return CURATED_BOOKS;
    }

    public List<GutenbergBook> searchReadableBooks(String query, int pages, int targetCount) {
        List<GutenbergBook> books = new ArrayList<>();
        String normalizedQuery = query == null || query.isBlank() || query.equals("project-gutenberg-curated")
                ? "fiction"
                : query.trim();

        for (int page = 1; page <= pages && books.size() < targetCount; page++) {
            try {
                URI uri = URI.create("%s/books/?languages=en&topic=%s&page=%d"
                        .formatted(gutendexBaseUrl, urlEncode(normalizedQuery), page));
                HttpRequest request = HttpRequest.newBuilder(uri)
                        .timeout(Duration.ofMillis(gutendexTimeoutMs))
                        .GET()
                        .build();
                HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
                if (response.statusCode() < 200 || response.statusCode() >= 300) {
                    break;
                }

                JsonNode results = objectMapper.readTree(response.body()).path("results");
                if (!results.isArray() || results.isEmpty()) {
                    break;
                }

                for (JsonNode node : results) {
                    Optional<GutenbergBook> maybeBook = toBook(node);
                    maybeBook.ifPresent(books::add);
                    if (books.size() >= targetCount) {
                        break;
                    }
                }
            } catch (Exception ex) {
                break;
            }
        }

        return books.isEmpty() ? curatedBooks().stream().limit(targetCount).toList() : books;
    }

    public String downloadPlainText(int gutenbergId) {
        List<String> candidates = List.of(
                "%s/files/%d/%d-0.txt".formatted(baseUrl, gutenbergId, gutenbergId),
                "%s/files/%d/%d.txt".formatted(baseUrl, gutenbergId, gutenbergId),
                "%s/cache/epub/%d/pg%d.txt".formatted(baseUrl, gutenbergId, gutenbergId)
        );

        RuntimeException lastError = null;
        for (String url : candidates) {
            try {
                HttpRequest request = HttpRequest.newBuilder(URI.create(url))
                        .timeout(Duration.ofMillis(timeoutMs))
                        .GET()
                        .build();
                HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
                if (response.statusCode() >= 200 && response.statusCode() < 300 && response.body() != null && !response.body().isBlank()) {
                    return cleanGutenbergText(response.body());
                }
            } catch (Exception ex) {
                lastError = new IllegalStateException("Falha ao baixar texto do Gutenberg.", ex);
            }
        }
        throw lastError != null ? lastError : new IllegalStateException("Texto do Project Gutenberg nao encontrado.");
    }

    public String downloadPlainText(String url, int fallbackGutenbergId) {
        if (url != null && !url.isBlank()) {
            try {
                HttpRequest request = HttpRequest.newBuilder(URI.create(url))
                        .timeout(Duration.ofMillis(timeoutMs))
                        .GET()
                        .build();
                HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
                if (response.statusCode() >= 200 && response.statusCode() < 300 && response.body() != null && !response.body().isBlank()) {
                    return cleanGutenbergText(response.body());
                }
            } catch (Exception ignored) {
                // Falls back to standard Project Gutenberg file patterns.
            }
        }
        return downloadPlainText(fallbackGutenbergId);
    }

    private Optional<GutenbergBook> toBook(JsonNode node) {
        int id = node.path("id").asInt(0);
        String title = node.path("title").asText("");
        String author = firstAuthor(node.path("authors"));
        String textUrl = formatUrl(node.path("formats"), "text/plain");
        if (id <= 0 || title.isBlank() || textUrl == null || textUrl.isBlank()) {
            return Optional.empty();
        }

        int year = firstYear(node.path("authors"));
        String coverUrl = formatUrl(node.path("formats"), "image/jpeg");
        int pages = estimatePages(node.path("summaries").isArray() ? node.path("summaries").path(0).asText("") : title);
        return Optional.of(new GutenbergBook(id, title, author, pages, year, coverUrl, textUrl));
    }

    private String firstAuthor(JsonNode authors) {
        if (!authors.isArray() || authors.isEmpty()) {
            return "Autor nao informado";
        }
        String name = authors.path(0).path("name").asText("");
        return name.isBlank() ? "Autor nao informado" : name;
    }

    private int firstYear(JsonNode authors) {
        if (!authors.isArray() || authors.isEmpty()) {
            return 1900;
        }
        int year = authors.path(0).path("birth_year").asInt(0);
        return year > 0 ? year : 1900;
    }

    private String formatUrl(JsonNode formats, String prefix) {
        if (!formats.isObject()) {
            return null;
        }
        var fields = formats.fields();
        while (fields.hasNext()) {
            Map.Entry<String, JsonNode> field = fields.next();
            if (field.getKey().startsWith(prefix)) {
                String url = field.getValue().asText("");
                if (!url.isBlank()) {
                    return url;
                }
            }
        }
        return null;
    }

    private int estimatePages(String value) {
        int words = value == null || value.isBlank() ? 45_000 : Math.max(12_000, value.split("\\s+").length * 8);
        return Math.max(40, Math.min(650, words / 260));
    }

    private String urlEncode(String value) {
        return java.net.URLEncoder.encode(value, java.nio.charset.StandardCharsets.UTF_8);
    }

    private String cleanGutenbergText(String rawText) {
        String text = rawText.replace("\r\n", "\n").replace('\r', '\n');
        int start = text.indexOf("*** START");
        if (start >= 0) {
            int startLineEnd = text.indexOf('\n', start);
            if (startLineEnd >= 0) {
                text = text.substring(startLineEnd + 1);
            }
        }
        int end = text.indexOf("*** END");
        if (end >= 0) {
            text = text.substring(0, end);
        }
        return text.trim();
    }

    public record GutenbergBook(int id, String title, String author, int pages, int year, String coverUrl, String textUrl) {
        public GutenbergBook(int id, String title, String author, int pages, int year, String coverUrl) {
            this(id, title, author, pages, year, coverUrl, null);
        }
    }
}
