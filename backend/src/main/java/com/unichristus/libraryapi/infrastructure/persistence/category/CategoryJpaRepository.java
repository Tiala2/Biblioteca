package com.unichristus.libraryapi.infrastructure.persistence.category;

import com.unichristus.libraryapi.domain.category.Category;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

public interface CategoryJpaRepository extends JpaRepository<Category, UUID> {

    List<Category> findAllByActiveTrue();

    Optional<Category> findCategoryByNameIgnoreCase(String name);

    Set<Category> findAllByIdIn(List<UUID> ids);
}
