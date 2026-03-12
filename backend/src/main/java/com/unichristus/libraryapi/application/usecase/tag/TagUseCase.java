package com.unichristus.libraryapi.application.usecase.tag;

import com.unichristus.libraryapi.application.annotation.UseCase;
import com.unichristus.libraryapi.application.dto.response.TagResponse;
import com.unichristus.libraryapi.application.mapper.TagResponseMapper;
import com.unichristus.libraryapi.domain.tag.TagService;
import lombok.RequiredArgsConstructor;

import java.util.List;

@UseCase
@RequiredArgsConstructor
public class TagUseCase {

    private final TagService tagService;

    public List<TagResponse> listTags() {
        return tagService.findAll().stream()
                .map(TagResponseMapper::toResponse)
                .toList();
    }
}
