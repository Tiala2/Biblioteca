package com.unichristus.libraryapi;

import com.fasterxml.jackson.databind.JsonNode;
import com.unichristus.libraryapi.domain.book.Book;
import com.unichristus.libraryapi.domain.book.BookService;
import com.unichristus.libraryapi.domain.reading.Reading;
import com.unichristus.libraryapi.domain.reading.ReadingRepository;
import com.unichristus.libraryapi.domain.reading.ReadingSessionService;
import com.unichristus.libraryapi.domain.reading.ReadingStatus;
import com.unichristus.libraryapi.domain.user.PasswordHasher;
import com.unichristus.libraryapi.domain.user.User;
import com.unichristus.libraryapi.domain.user.UserService;
import com.unichristus.libraryapi.domain.user.UserRole;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class LeaderboardIntegrationTest extends IntegrationTestSupport {

    @Autowired
    private ReadingSessionService readingSessionService;

    @Autowired
    private ReadingRepository readingRepository;

    @Autowired
    private UserService userService;

    @Autowired
    private PasswordHasher passwordHasher;

    @Autowired
    private BookService bookService;

    private Book defaultBook;

    @BeforeEach
    void setupBook() {
        defaultBook = createBook("lb-base");
    }

    @Test
    @DisplayName("Deve aceitar limites fora da faixa aplicando clamp e retornar 200")
    void shouldClampLimitAndReturnOk() throws Exception {
        mockMvc.perform(get("/api/v1/users/leaderboard")
                        .param("limit", "0"))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/v1/users/leaderboard")
                        .param("limit", "1000"))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("Deve respeitar opt-in e ordenar por páginas no leaderboard PAGES")
    void shouldHonorOptInAndOrderByPages() throws Exception {
        User optOut = createUser("optout", false);
        readingSessionService.registerSession(optOut.getId(), defaultBook, 1000);

        User userA = createUser("userA", true);
        readingSessionService.registerSession(userA.getId(), defaultBook, 300);
        readingSessionService.registerSession(userA.getId(), defaultBook, 200);

        User userB = createUser("userB", true);
        readingSessionService.registerSession(userB.getId(), defaultBook, 900);

        JsonNode root = objectMapper.readTree(mockMvc.perform(get("/api/v1/users/leaderboard")
                        .param("metric", "PAGES"))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString());

        assertThat(root.isArray()).isTrue();
        assertThat(root).hasSize(2);
        assertThat(root.get(0).path("name").asText()).isEqualTo(userB.getName());
        assertThat(root.get(0).path("value").asLong()).isEqualTo(900L);
        assertThat(root.get(1).path("name").asText()).isEqualTo(userA.getName());
        assertThat(root.get(1).path("value").asLong()).isEqualTo(500L);
    }

    @Test
    @DisplayName("Deve ranquear por livros concluídos no metric=BOOKS e aplicar opt-in")
    void shouldRankByFinishedBooksWithOptIn() throws Exception {
        User optOut = createUser("books-optout", false);
        saveFinishedReading(optOut, createBook("oo1"));
        saveFinishedReading(optOut, createBook("oo2"));

        User userC = createUser("userC", true);
        saveFinishedReading(userC, createBook("c1"));
        saveFinishedReading(userC, createBook("c2"));

        User userD = createUser("userD", true);
        saveFinishedReading(userD, createBook("d1"));

        JsonNode root = objectMapper.readTree(mockMvc.perform(get("/api/v1/users/leaderboard")
                        .param("metric", "BOOKS"))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString());

        assertThat(root).hasSize(2);
        assertThat(root.get(0).path("name").asText()).isEqualTo(userC.getName());
        assertThat(root.get(0).path("value").asLong()).isEqualTo(2L);
        assertThat(root.get(1).path("name").asText()).isEqualTo(userD.getName());
        assertThat(root.get(1).path("value").asLong()).isEqualTo(1L);
    }

    private User createUser(String prefix, boolean optIn) {
        String email = prefix + "+" + UUID.randomUUID() + "@example.com";
        User user = User.builder()
                .name("User " + prefix)
                .email(email)
                .password(passwordHasher.hash("password"))
                .role(UserRole.USER)
                .active(true)
                .leaderboardOptIn(optIn)
                .build();
        return userService.save(user);
    }

    private Book createBook(String prefix) {
        return bookService.createBook(
                "Book " + prefix,
                "Author " + prefix,
                UUID.randomUUID().toString().replace("-", "").substring(0, 13),
                200,
                LocalDate.now().minusYears(1),
                "https://example.com/" + prefix,
                java.util.Set.of()
        );
    }

    private void saveFinishedReading(User user, Book book) {
        LocalDateTime now = LocalDateTime.now();
        readingRepository.save(Reading.builder()
                .user(user)
                .book(book)
                .status(ReadingStatus.FINISHED)
                .currentPage(book.getNumberOfPages())
                .startedAt(now.minusHours(2))
                .lastReadedAt(now.minusMinutes(30))
                .finishedAt(now.minusMinutes(5))
                .build());
    }
}

