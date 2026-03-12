package com.unichristus.libraryapi.application.mapper;

import com.unichristus.libraryapi.application.dto.response.TagResponse;
import com.unichristus.libraryapi.domain.tag.Tag;
import lombok.AccessLevel;
import lombok.NoArgsConstructor;

@NoArgsConstructor(access = AccessLevel.PRIVATE)
public final class TagResponseMapper {

    public static TagResponse toResponse(Tag tag) {
        if (tag == null) return null;
        return new TagResponse(tag.getId(), tag.getName());
    }
}
