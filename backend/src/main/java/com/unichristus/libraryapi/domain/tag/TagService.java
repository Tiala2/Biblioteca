package com.unichristus.libraryapi.domain.tag;

import com.unichristus.libraryapi.domain.tag.exception.TagAlreadyExistsException;
import com.unichristus.libraryapi.domain.tag.exception.TagNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class TagService {

    private final TagRepository tagRepository;

    public List<Tag> findAll() {
        return tagRepository.findAll();
    }

    public long count() {
        return tagRepository.count();
    }

    @Transactional
    public Tag save(Tag tag) {
        tagRepository.findByNameIgnoreCase(tag.getName())
                .ifPresent(existing -> {
                    if (!existing.getId().equals(tag.getId())) {
                        throw new TagAlreadyExistsException(tag.getName());
                    }
                });
        return tagRepository.save(tag);
    }

    public Tag findByIdOrThrow(UUID tagId) {
        return tagRepository.findById(tagId)
                .orElseThrow(() -> new TagNotFoundException(tagId));
    }

    @Transactional
    public void delete(UUID tagId) {
        Tag tag = findByIdOrThrow(tagId);
        tagRepository.delete(tag);
    }
}
