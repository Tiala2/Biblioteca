package com.unichristus.libraryapi.application.mapper;

import com.unichristus.libraryapi.application.dto.response.FavoriteResponse;
import com.unichristus.libraryapi.domain.favorite.Favorite;
import lombok.AccessLevel;
import lombok.NoArgsConstructor;

@NoArgsConstructor(access = AccessLevel.PRIVATE)
public final class FavoriteResponseMapper {

    public static FavoriteResponse toFavoriteResponse(Favorite favorite) {
        if (favorite == null) return null;
        return new FavoriteResponse(
                favorite.getBook().getId(),
                favorite.getBook().getTitle(),
                favorite.getBook().getIsbn(),
                favorite.getCreatedAt()
        );
    }
}
