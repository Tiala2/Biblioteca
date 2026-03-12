package com.unichristus.libraryapi.application.usecase.reading;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.unichristus.libraryapi.application.annotation.UseCase;
import com.unichristus.libraryapi.application.dto.response.NarrativeAchievementResponse;
import com.unichristus.libraryapi.application.dto.response.NarrativeCharacterResponse;
import com.unichristus.libraryapi.application.dto.response.NarrativeQuizResponse;
import com.unichristus.libraryapi.application.dto.response.ReadingNarrativeInsightResponse;
import com.unichristus.libraryapi.domain.book.Book;
import com.unichristus.libraryapi.domain.book.BookService;
import com.unichristus.libraryapi.domain.exception.DomainError;
import com.unichristus.libraryapi.domain.exception.DomainException;
import com.unichristus.libraryapi.domain.narrative.BookNarrativeBeat;
import com.unichristus.libraryapi.domain.narrative.BookNarrativeBeatService;
import com.unichristus.libraryapi.domain.user.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Slf4j
@UseCase
@RequiredArgsConstructor
public class ReadingNarrativeInsightUseCase {

    private static final TypeReference<List<CharacterPayload>> CHARACTER_LIST_TYPE = new TypeReference<>() {};
    private static final TypeReference<List<QuizPayload>> QUIZ_LIST_TYPE = new TypeReference<>() {};

    private final BookService bookService;
    private final UserService userService;
    private final BookNarrativeBeatService beatService;
    private final ObjectMapper objectMapper;

    public ReadingNarrativeInsightResponse getInsight(UUID userId, UUID bookId, Integer currentPage) {
        userService.findUserByIdOrThrow(userId);
        Book book = bookService.findBookByIdOrThrow(bookId);
        validateCurrentPage(book, currentPage);

        List<BookNarrativeBeat> beats = beatService.findByBookId(bookId);
        BookNarrativeBeat currentBeat = beatService.findCurrentBeat(bookId, currentPage).orElse(null);

        String plotState = currentBeat != null
                ? currentBeat.getPlotState()
                : "Sem mapeamento narrativo para este ponto. Continue lendo e registre seu progresso.";

        List<NarrativeCharacterResponse> knownCharacters = currentBeat != null
                ? parseCharacters(currentBeat.getCharactersJson())
                : List.of();

        List<NarrativeQuizResponse> quizzes = currentBeat != null
                ? parseQuizzes(currentBeat.getQuizzesJson())
                : List.of();

        return new ReadingNarrativeInsightResponse(
                bookId,
                currentPage,
                currentBeat != null ? currentBeat.getPhase() : null,
                currentBeat != null ? currentBeat.getBeatTitle() : null,
                plotState,
                knownCharacters,
                quizzes,
                mapAchievements(beats, currentPage)
        );
    }

    private void validateCurrentPage(Book book, Integer currentPage) {
        if (currentPage == null || currentPage < 1) {
            throw new DomainException(DomainError.SEARCH_FILTER_INVALID, "currentPage deve ser maior ou igual a 1");
        }
        if (currentPage > book.getNumberOfPages()) {
            throw new DomainException(
                    DomainError.SEARCH_FILTER_INVALID,
                    "currentPage nao pode exceder o total de paginas do livro (" + book.getNumberOfPages() + ")");
        }
    }

    private List<NarrativeCharacterResponse> parseCharacters(String charactersJson) {
        if (charactersJson == null || charactersJson.isBlank()) {
            return List.of();
        }
        try {
            List<CharacterPayload> payload = objectMapper.readValue(charactersJson, CHARACTER_LIST_TYPE);
            return payload.stream()
                    .map(item -> new NarrativeCharacterResponse(item.name(), item.role(), item.note()))
                    .toList();
        } catch (Exception ex) {
            log.warn("Falha ao desserializar personagens narrativos: {}", ex.getMessage());
            return List.of();
        }
    }

    private List<NarrativeQuizResponse> parseQuizzes(String quizzesJson) {
        if (quizzesJson == null || quizzesJson.isBlank()) {
            return List.of();
        }
        try {
            List<QuizPayload> payload = objectMapper.readValue(quizzesJson, QUIZ_LIST_TYPE);
            return payload.stream()
                    .map(item -> new NarrativeQuizResponse(
                            item.id(),
                            item.question(),
                            item.options() == null ? List.of() : item.options(),
                            item.correctOption(),
                            item.explanation()))
                    .toList();
        } catch (Exception ex) {
            log.warn("Falha ao desserializar quizzes narrativos: {}", ex.getMessage());
            return List.of();
        }
    }

    private List<NarrativeAchievementResponse> mapAchievements(List<BookNarrativeBeat> beats, Integer currentPage) {
        if (beats == null || beats.isEmpty()) {
            return List.of();
        }

        Map<String, NarrativeAchievementResponse> achievements = new LinkedHashMap<>();
        for (BookNarrativeBeat beat : beats) {
            if (beat.getAchievementCode() == null || beat.getAchievementCode().isBlank()) {
                continue;
            }
            NarrativeAchievementResponse response = new NarrativeAchievementResponse(
                    beat.getAchievementCode(),
                    beat.getAchievementTitle(),
                    beat.getAchievementDescription(),
                    beat.getFlashcardSymbol(),
                    beat.getEndPage(),
                    currentPage >= beat.getEndPage()
            );
            achievements.putIfAbsent(beat.getAchievementCode(), response);
        }
        return new ArrayList<>(achievements.values());
    }

    private record CharacterPayload(String name, String role, String note) {
    }

    private record QuizPayload(String id, String question, List<String> options, String correctOption, String explanation) {
    }
}
