package com.unichristus.libraryapi.application.mapper;

import com.unichristus.libraryapi.application.dto.response.CategoryLowResponse;
import com.unichristus.libraryapi.application.dto.response.CategoryResponse;
import com.unichristus.libraryapi.domain.category.Category;
import lombok.AccessLevel;
import lombok.NoArgsConstructor;

@NoArgsConstructor(access = AccessLevel.PRIVATE)
public final class CategoryResponseMapper {

    public static CategoryResponse toResponse(Category category) {
        if (category == null) return null;
        return new CategoryResponse(
                category.getId(),
                category.getName(),
                category.getDescription(),
                category.getActive(),
                category.getCreatedAt(),
                category.getUpdatedAt()
        );
    }

    public static CategoryLowResponse toLowResponse(Category category) {
        if (category == null) return null;
        return new CategoryLowResponse(
                category.getId(),
                category.getName(),
                category.getDescription()
        );
    }
}
