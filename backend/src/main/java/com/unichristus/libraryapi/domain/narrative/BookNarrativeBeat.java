package com.unichristus.libraryapi.domain.narrative;

import com.unichristus.libraryapi.domain.book.Book;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EqualsAndHashCode(of = "id")
@Entity
@Table(name = "book_narrative_beats")
public class BookNarrativeBeat {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "book_id", nullable = false)
    private Book book;

    @Column(name = "start_page", nullable = false)
    private Integer startPage;

    @Column(name = "end_page", nullable = false)
    private Integer endPage;

    @Enumerated(EnumType.STRING)
    @Column(name = "phase", nullable = false, length = 20)
    private StoryPhase phase;

    @Column(name = "beat_title", length = 150)
    private String beatTitle;

    @Column(name = "plot_state", nullable = false, length = 1000)
    private String plotState;

    @Column(name = "characters_json", nullable = false, columnDefinition = "TEXT")
    private String charactersJson;

    @Column(name = "quizzes_json", nullable = false, columnDefinition = "TEXT")
    private String quizzesJson;

    @Column(name = "achievement_code", length = 80)
    private String achievementCode;

    @Column(name = "achievement_title", length = 150)
    private String achievementTitle;

    @Column(name = "achievement_description", length = 255)
    private String achievementDescription;

    @Column(name = "flashcard_symbol", length = 50)
    private String flashcardSymbol;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}

