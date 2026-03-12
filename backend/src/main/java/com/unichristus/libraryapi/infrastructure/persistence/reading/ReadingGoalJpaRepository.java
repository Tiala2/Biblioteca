package com.unichristus.libraryapi.infrastructure.persistence.reading;

import com.unichristus.libraryapi.domain.reading.GoalPeriod;
import com.unichristus.libraryapi.domain.reading.ReadingGoal;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;

public interface ReadingGoalJpaRepository extends JpaRepository<ReadingGoal, UUID> {

    Optional<ReadingGoal> findFirstByUserIdAndPeriodAndStartDateLessThanEqualAndEndDateGreaterThanEqualOrderByStartDateDesc(
            UUID userId,
            GoalPeriod period,
            LocalDate startDate,
            LocalDate endDate
    );
}
