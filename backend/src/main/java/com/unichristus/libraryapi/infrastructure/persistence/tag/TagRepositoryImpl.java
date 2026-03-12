package com.unichristus.libraryapi.infrastructure.persistence.tag;

import com.unichristus.libraryapi.domain.tag.Tag;
import com.unichristus.libraryapi.domain.tag.TagRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
@RequiredArgsConstructor
public class TagRepositoryImpl implements TagRepository {

    private final TagJpaRepository tagJpaRepository;

    @Override
    public Tag save(Tag tag) {
        return tagJpaRepository.save(tag);
    }

    @Override
    public List<Tag> findAll() {
        return tagJpaRepository.findAll(Sort.by(Sort.Direction.ASC, "name"));
    }

    @Override
    public long count() {
        return tagJpaRepository.count();
    }

    @Override
    public boolean existsById(UUID id) {
        return tagJpaRepository.existsById(id);
    }

    @Override
    public Optional<Tag> findById(UUID id) {
        return tagJpaRepository.findById(id);
    }

    @Override
    public Optional<Tag> findByNameIgnoreCase(String name) {
        return tagJpaRepository.findByNameIgnoreCase(name);
    }

    @Override
    public void delete(Tag tag) {
        tagJpaRepository.delete(tag);
    }
}
