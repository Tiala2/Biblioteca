package com.unichristus.libraryapi.infrastructure.persistence.reading;

import com.unichristus.libraryapi.domain.reading.GoalPeriod;
import com.unichristus.libraryapi.domain.reading.ReadingGoal;
import com.unichristus.libraryapi.domain.reading.ReadingGoalRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;

@Repository
@RequiredArgsConstructor
public class ReadingGoalRepositoryImpl implements ReadingGoalRepository {

    private final ReadingGoalJpaRepository repository;

    @Override
    public ReadingGoal save(ReadingGoal goal) {
        return repository.save(goal);
    }

    @Override
    public Optional<ReadingGoal> findActiveByUserAndPeriod(UUID userId, GoalPeriod period, LocalDate today) {
        return repository.findFirstByUserIdAndPeriodAndStartDateLessThanEqualAndEndDateGreaterThanEqualOrderByStartDateDesc(
                userId,
                period,
                today,
                today
        );
    }
}
