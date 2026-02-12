package com.unichristus.libraryapi.infrastructure.persistence.category;

import com.unichristus.libraryapi.domain.category.Category;
import com.unichristus.libraryapi.domain.category.CategoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

@Repository
@RequiredArgsConstructor
public class CategoryRepositoryImpl implements CategoryRepository {

    private final CategoryJpaRepository repository;

    @Override
    public Category save(Category category) {
        return repository.save(category);
    }

    @Override
    public void delete(Category entity) {
        repository.delete(entity);
    }

    @Override
    public Optional<Category> findById(UUID categoryId) {
        return repository.findById(categoryId);
    }

    @Override
    public List<Category> findAllByActiveTrue() {
        return repository.findAllByActiveTrue();
    }

    @Override
    public Optional<Category> findCategoryByNameIgnoreCase(String name) {
        return repository.findCategoryByNameIgnoreCase(name);
    }

    @Override
    public Set<Category> findAllByIdIn(List<UUID> ids) {
        return repository.findAllByIdIn(ids);
    }
}
