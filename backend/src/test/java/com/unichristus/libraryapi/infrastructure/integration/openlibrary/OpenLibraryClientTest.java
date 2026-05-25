package com.unichristus.libraryapi.infrastructure.integration.openlibrary;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sun.net.httpserver.HttpServer;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.parallel.Execution;
import org.junit.jupiter.api.parallel.ExecutionMode;
import org.springframework.test.util.ReflectionTestUtils;

import java.io.IOException;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.atomic.AtomicInteger;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@Execution(ExecutionMode.SAME_THREAD)
class OpenLibraryClientTest {

    private HttpServer server;

    @AfterEach
    void stopServer() {
        if (server != null) {
            server.stop(0);
        }
    }

    @Test
    void shouldRetryTemporaryOpenLibraryFailures() throws IOException {
        AtomicInteger attempts = new AtomicInteger();
        server = HttpServer.create(new InetSocketAddress(0), 0);
        server.createContext("/search.json", exchange -> {
            int currentAttempt = attempts.incrementAndGet();
            if (currentAttempt == 1) {
                exchange.sendResponseHeaders(503, -1);
                exchange.close();
                return;
            }

            byte[] body = "{\"numFound\":1,\"docs\":[{\"title\":\"Readable Book\",\"isbn\":[\"9780000000001\"]}]}".getBytes(StandardCharsets.UTF_8);
            exchange.getResponseHeaders().add("Content-Type", "application/json");
            exchange.sendResponseHeaders(200, body.length);
            exchange.getResponseBody().write(body);
            exchange.close();
        });
        server.start();

        OpenLibraryClient client = clientFor(server);

        OpenLibraryClient.OpenLibrarySearchResponse response = client.search("fiction", 1, 10);

        assertThat(attempts).hasValue(2);
        assertThat(response.docs()).hasSize(1);
        assertThat(response.docs().getFirst().title()).isEqualTo("Readable Book");
    }

    @Test
    void shouldNotRetryPermanentClientErrors() throws IOException {
        AtomicInteger attempts = new AtomicInteger();
        server = HttpServer.create(new InetSocketAddress(0), 0);
        server.createContext("/search.json", exchange -> {
            attempts.incrementAndGet();
            exchange.sendResponseHeaders(404, -1);
            exchange.close();
        });
        server.start();

        OpenLibraryClient client = clientFor(server);

        assertThatThrownBy(() -> client.search("missing", 1, 10))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("Open Library request failed: HTTP 404");
        assertThat(attempts).hasValue(1);
    }

    private OpenLibraryClient clientFor(HttpServer server) {
        OpenLibraryClient client = new OpenLibraryClient(new ObjectMapper());
        ReflectionTestUtils.setField(client, "baseUrl", "http://localhost:%d".formatted(server.getAddress().getPort()));
        ReflectionTestUtils.setField(client, "timeoutMs", 2000);
        ReflectionTestUtils.setField(client, "retryAttempts", 2);
        ReflectionTestUtils.setField(client, "retryBackoffMs", 1L);
        return client;
    }
}
