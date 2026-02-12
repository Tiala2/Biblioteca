package com.unichristus.libraryapi.application.usecase.category;

import com.unichristus.libraryapi.application.annotation.UseCase;
import com.unichristus.libraryapi.application.dto.request.CategoryRequest;
import com.unichristus.libraryapi.application.dto.response.BookResponse;
import com.unichristus.libraryapi.application.dto.response.CategoryResponse;
import com.unichristus.libraryapi.application.mapper.BookResponseMapper;
import com.unichristus.libraryapi.application.mapper.CategoryResponseMapper;
import com.unichristus.libraryapi.domain.book.Book;
import com.unichristus.libraryapi.domain.book.BookService;
import com.unichristus.libraryapi.domain.category.Category;
import com.unichristus.libraryapi.domain.category.CategoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.UUID;

@UseCase
@RequiredArgsConstructor
public class CategoryUseCase {

    private final CategoryService categoryService;
    private final BookService bookService;

    public List<CategoryResponse> getAllActiveCategories() {
        List<Category> categories = categoryService.findAllActive();
        return categories.stream()
                .map(CategoryResponseMapper::toResponse)
                .toList();
    }

    public CategoryResponse getCategoryById(UUID categoryId) {
        Category category = categoryService.findByIdOrThrow(categoryId);
        return CategoryResponseMapper.toResponse(category);
    }

    public CategoryResponse createCategory(CategoryRequest request) {
        Category category = Category.builder()
                .name(request.name())
                .description(request.description())
                .active(true)
                .build();
        Category savedCategory = categoryService.save(category);
        return CategoryResponseMapper.toResponse(savedCategory);
    }

    public CategoryResponse updateCategory(UUID categoryId, CategoryRequest request) {
        Category existingCategory = categoryService.findByIdOrThrow(categoryId);

        existingCategory.setName(request.name());
        existingCategory.setDescription(request.description());

        Category updatedCategory = categoryService.save(existingCategory);
        return CategoryResponseMapper.toResponse(updatedCategory);
    }

    public void deleteCategory(UUID categoryId) {
        categoryService.deleteCategory(categoryId);
    }

    public Page<BookResponse> getBooksByCategory(UUID categoryId, Pageable pageable) {
        Category category = categoryService.findByIdOrThrow(categoryId);
        Page<Book> books = bookService.findBooksByCategory(category, pageable);
        return books.map(BookResponseMapper::toBookResponse);
    }
}