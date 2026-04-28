package com.unichristus.libraryapi.presentation.common;

import org.springframework.http.ResponseEntity;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.net.URI;

public final class CreatedResponses {

    private CreatedResponses() {
    }

    public static <T> ResponseEntity<T> createdCurrentResource(Object resourceId, T body) {
        URI location = ServletUriComponentsBuilder
                .fromCurrentRequest()
                .path("/{id}")
                .buildAndExpand(resourceId)
                .toUri();
        return ResponseEntity.created(location).body(body);
    }
}
