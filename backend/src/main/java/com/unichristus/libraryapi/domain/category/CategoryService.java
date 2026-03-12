package com.unichristus.libraryapi.domain.category;

import com.unichristus.libraryapi.domain.category.exception.CategoryAlreadyExistsException;
import com.unichristus.libraryapi.domain.category.exception.CategoryNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CategoryService {

    private final CategoryRepository categoryRepository;

    public Category findByIdOrThrow(UUID categoryId) {
        return categoryRepository.findById(categoryId)
                .orElseThrow(CategoryNotFoundException::new);
    }

    public List<Category> findAllActive() {
        return categoryRepository.findAllByActiveTrue();
    }

    public Category save(Category category) {
        categoryRepository.findCategoryByNameIgnoreCase(category.getName())
                .ifPresent(existing -> {
                    if (!existing.getId().equals(category.getId())) {
                        throw new CategoryAlreadyExistsException(category.getName());
                    }
                });
        return categoryRepository.save(category);
    }

    public void deleteCategory(UUID categoryId) {
        Category category = findByIdOrThrow(categoryId);
        categoryRepository.delete(category);
    }

    public Set<Category> findCategoriesByIds(List<UUID> categoryIds) {
        Set<Category> categories = categoryRepository.findAllByIdIn(categoryIds);
        if (categories.size() != categoryIds.size()) {
            throw new CategoryNotFoundException();
        }
        return categories;
    }
}