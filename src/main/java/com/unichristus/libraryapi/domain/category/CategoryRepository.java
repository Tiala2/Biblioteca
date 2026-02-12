package com.unichristus.libraryapi.domain.category;

import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

public interface CategoryRepository {

    Category save(Category category);

    Optional<Category> findById(UUID categoryId);

    List<Category> findAllByActiveTrue();

    Optional<Category> findCategoryByNameIgnoreCase(String name);

    Set<Category> findAllByIdIn(List<UUID> ids);

    void delete(Category category);

}
