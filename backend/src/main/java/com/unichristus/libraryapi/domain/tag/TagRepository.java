package com.unichristus.libraryapi.domain.tag;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface TagRepository {

    Tag save(Tag tag);

    List<Tag> findAll();

    long count();

    boolean existsById(UUID id);

    Optional<Tag> findById(UUID id);

    Optional<Tag> findByNameIgnoreCase(String name);

    void delete(Tag tag);
}
