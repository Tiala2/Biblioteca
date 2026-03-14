package com.unichristus.libraryapi.engagement;

import com.unichristus.libraryapi.domain.book.Book;
import com.unichristus.libraryapi.domain.book.BookService;
import com.unichristus.libraryapi.domain.engagement.BadgeCode;
import com.unichristus.libraryapi.domain.engagement.EngagementEventPublisher;
import com.unichristus.libraryapi.domain.engagement.BadgeService;
import com.unichristus.libraryapi.domain.engagement.UserBadge;
import com.unichristus.libraryapi.domain.reading.Reading;
import com.unichristus.libraryapi.domain.reading.ReadingRepository;
import com.unichristus.libraryapi.domain.reading.ReadingSession;
import com.unichristus.libraryapi.domain.reading.ReadingSessionRepository;
import com.unichristus.libraryapi.domain.reading.ReadingSessionService;
import com.unichristus.libraryapi.domain.reading.ReadingStatus;
import com.unichristus.libraryapi.domain.user.PasswordHasher;
import com.unichristus.libraryapi.domain.user.User;
import com.unichristus.libraryapi.domain.user.UserService;
import com.unichristus.libraryapi.domain.user.UserRole;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.DockerClientFactory;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
class BadgeIntegrationTest {
    private static final boolean DOCKER_AVAILABLE = isDockerAvailable();
    private static PostgreSQLContainer<?> postgres;

    @BeforeAll
    static void startContainer() {
        if (DOCKER_AVAILABLE) {
            postgres = new PostgreSQLContainer<>("postgres:16-alpine")
                    .withDatabaseName("library")
                    .withUsername("library")
                    .withPassword("library");
            postgres.start();
        }
    }

    @AfterAll
    static void stopContainer() {
        if (postgres != null) {
            postgres.stop();
        }
    }

    @DynamicPropertySource
    static void overrideDatasourceProps(DynamicPropertyRegistry registry) {
        if (postgres != null) {
            registry.add("spring.datasource.url", postgres::getJdbcUrl);
            registry.add("spring.datasource.username", postgres::getUsername);
            registry.add("spring.datasource.password", postgres::getPassword);
        } else {
            registry.add("spring.datasource.url", () -> System.getenv().getOrDefault("DB_URL", "jdbc:postgresql://localhost:5437/library"));
            registry.add("spring.datasource.username", () -> System.getenv().getOrDefault("DB_USERNAME", "library"));
            registry.add("spring.datasource.password", () -> System.getenv().getOrDefault("DB_PASSWORD", "library"));
        }
        registry.add("spring.jpa.hibernate.ddl-auto", () -> "validate");
    }

    @Autowired
    private BadgeService badgeService;

    @Autowired
    private UserService userService;

    @Autowired
    private PasswordHasher passwordHasher;

    @Autowired
    private BookService bookService;

    @Autowired
    private ReadingRepository readingRepository;

    @Autowired
    private ReadingSessionRepository readingSessionRepository;

    @Autowired
    private ReadingSessionService readingSessionService;

    @Autowired
    private EngagementEventPublisher engagementEventPublisher;

    @Test
    void awardsFirstBookOnlyOnce() {
        User user = createUser("first");
        Book book = createBook("first-book");
        createFinishedReading(user, book, 120);

        badgeService.awardOnReadingCompleted(user.getId());
        badgeService.awardOnReadingCompleted(user.getId());

        List<UserBadge> badges = badgeService.findByUser(user.getId());
        assertThat(badges)
                .filteredOn(ub -> ub.getBadge().getCode() == BadgeCode.FIRST_BOOK_FINISHED)
                .hasSize(1);
    }

    @Test
    void awardsStreakBadgeOnlyOnThresholdAndIdempotent() {
        User user = createUser("streak");

        badgeService.awardOnStreakUpdated(user.getId(), 6); // abaixo do limiar
        badgeService.awardOnStreakUpdated(user.getId(), 7); // atinge limiar
        badgeService.awardOnStreakUpdated(user.getId(), 10); // chamadas subsequentes não duplicam

        List<UserBadge> badges = badgeService.findByUser(user.getId());
        assertThat(badges)
                .filteredOn(ub -> ub.getBadge().getCode() == BadgeCode.STREAK_7_DAYS)
                .hasSize(1);
    }

    @Test
    void awardsFirstBookViaPublisherAndIdempotent() {
        User user = createUser("publisher-first");
        Book book = createBook("publisher-first-book");
        createFinishedReading(user, book, 150);

        engagementEventPublisher.readingCompleted(user.getId());
        engagementEventPublisher.readingCompleted(user.getId());

        List<UserBadge> badges = badgeService.findByUser(user.getId());
        assertThat(badges)
                .filteredOn(ub -> ub.getBadge().getCode() == BadgeCode.FIRST_BOOK_FINISHED)
                .hasSize(1);
    }

    @Test
    void awardsStreakViaPublisherAtThreshold() {
        User user = createUser("publisher-streak");

        engagementEventPublisher.streakUpdated(user.getId(), 6);
        engagementEventPublisher.streakUpdated(user.getId(), 7);
        engagementEventPublisher.streakUpdated(user.getId(), 9);

        List<UserBadge> badges = badgeService.findByUser(user.getId());
        assertThat(badges)
                .filteredOn(ub -> ub.getBadge().getCode() == BadgeCode.STREAK_7_DAYS)
                .hasSize(1);
    }

    @Test
    void awardsTotalPagesWhenReachingThresholdOnProgress() {
        User user = createUser("pages");
        Book book = createBook("pages-book");

        // 2 sessões que somam 1000 páginas
        readingSessionService.registerSession(user.getId(), book, 400);
        readingSessionService.registerSession(user.getId(), book, 600);

        List<UserBadge> badges = badgeService.findByUser(user.getId());
        assertThat(badges)
                .filteredOn(ub -> ub.getBadge().getCode() == BadgeCode.TOTAL_PAGES_1000)
                .hasSize(1);
    }

    @Test
    void awardsTotalBooksWhenReachingThresholdOnCompletion() {
        User user = createUser("books");
        for (int i = 0; i < 10; i++) {
            Book book = createBook("book-" + i);
            createFinishedReading(user, book, book.getNumberOfPages());
        }

        badgeService.awardOnReadingCompleted(user.getId());

        List<UserBadge> badges = badgeService.findByUser(user.getId());
        assertThat(badges)
                .filteredOn(ub -> ub.getBadge().getCode() == BadgeCode.TOTAL_BOOKS_10)
                .hasSize(1);
    }

    @Test
    void awardsStreak30AtThresholdOnce() {
        User user = createUser("streak30");

        badgeService.awardOnStreakUpdated(user.getId(), 29);
        badgeService.awardOnStreakUpdated(user.getId(), 30);
        badgeService.awardOnStreakUpdated(user.getId(), 31);

        List<UserBadge> badges = badgeService.findByUser(user.getId());
        assertThat(badges)
                .filteredOn(ub -> ub.getBadge().getCode() == BadgeCode.STREAK_30_DAYS)
                .hasSize(1);
    }

    private User createUser(String prefix) {
        String email = prefix + "+" + UUID.randomUUID() + "@example.com";
        User user = User.builder()
                .name("User " + prefix)
                .email(email)
                .password(passwordHasher.hash("password"))
                .role(UserRole.USER)
                .active(true)
                .leaderboardOptIn(false)
                .build();
        return userService.save(user);
    }

    private Book createBook(String prefix) {
        return bookService.createBook(
                "Book " + prefix,
                UUID.randomUUID().toString().replace("-", "").substring(0, 13),
                200,
                LocalDate.now().minusYears(1),
                "https://example.com/" + prefix,
                Set.of()
        );
    }

    private void createFinishedReading(User user, Book book, int pagesRead) {
        LocalDateTime now = LocalDateTime.now();
        readingRepository.save(Reading.builder()
                .user(user)
                .book(book)
                .status(ReadingStatus.FINISHED)
                .currentPage(book.getNumberOfPages())
                .startedAt(now.minusDays(2))
                .lastReadedAt(now.minusDays(1))
                .finishedAt(now.minusDays(1))
                .build());

        readingSessionRepository.save(ReadingSession.builder()
                .user(user)
                .book(book)
                .pagesRead(pagesRead)
                .loggedAt(now.minusDays(1))
                .build());
    }

    private static boolean isDockerAvailable() {
        try {
            DockerClientFactory.instance().client();
            return true;
        } catch (Throwable ignored) {
            return false;
        }
    }
}

