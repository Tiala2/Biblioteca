package com.unichristus.libraryapi.domain.reading;

import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;

public interface ReadingGoalRepository {

    ReadingGoal save(ReadingGoal goal);

    Optional<ReadingGoal> findActiveByUserAndPeriod(UUID userId, GoalPeriod period, LocalDate today);
}
