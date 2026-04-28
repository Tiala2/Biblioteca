package com.unichristus.libraryapi.application.usecase.tag;

import com.unichristus.libraryapi.application.annotation.UseCase;
import com.unichristus.libraryapi.application.dto.request.TagRequest;
import com.unichristus.libraryapi.application.dto.response.TagResponse;
import com.unichristus.libraryapi.application.mapper.TagResponseMapper;
import com.unichristus.libraryapi.application.util.RequestTextNormalizer;
import com.unichristus.libraryapi.domain.tag.Tag;
import com.unichristus.libraryapi.domain.tag.TagService;
import lombok.RequiredArgsConstructor;

import java.util.List;
import java.util.UUID;

@UseCase
@RequiredArgsConstructor
public class TagAdminUseCase {

    private final TagService tagService;

    public List<TagResponse> listTags() {
        return tagService.findAll().stream()
                .map(TagResponseMapper::toResponse)
                .toList();
    }

    public TagResponse createTag(TagRequest request) {
        Tag tag = new Tag();
        tag.setName(RequestTextNormalizer.normalizeRequired(request.name()));
        return TagResponseMapper.toResponse(tagService.save(tag));
    }

    public TagResponse updateTag(UUID tagId, TagRequest request) {
        Tag tag = tagService.findByIdOrThrow(tagId);
        tag.setName(RequestTextNormalizer.normalizeRequired(request.name()));
        return TagResponseMapper.toResponse(tagService.save(tag));
    }

    public void deleteTag(UUID tagId) {
        tagService.delete(tagId);
    }
}
