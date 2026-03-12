package com.unichristus.libraryapi.application.usecase.engagement;

import com.unichristus.libraryapi.application.annotation.UseCase;
import com.unichristus.libraryapi.application.dto.request.BadgeUpsertRequest;
import com.unichristus.libraryapi.application.dto.response.BadgeDefinitionResponse;
import com.unichristus.libraryapi.domain.engagement.Badge;
import com.unichristus.libraryapi.domain.engagement.BadgeDefinitionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.UUID;

@UseCase
@Service
@RequiredArgsConstructor
public class BadgeAdminUseCase {

    private final BadgeDefinitionRepository badgeDefinitionRepository;

    public Page<BadgeDefinitionResponse> list(Pageable pageable) {
        return badgeDefinitionRepository.findAll(pageable)
                .map(BadgeAdminUseCase::toResponse);
    }

    public BadgeDefinitionResponse create(BadgeUpsertRequest request) {
        validateCriteria(request);
        if (badgeDefinitionRepository.existsByCode(request.getCode())) {
            throw new IllegalArgumentException("Badge code already exists: " + request.getCode());
        }
        Badge entity = toEntity(new Badge(), request);
        return toResponse(save(entity));
    }

    public BadgeDefinitionResponse update(UUID id, BadgeUpsertRequest request) {
        Badge badge = getById(id);
        validateCriteria(request);
        if (!badge.getCode().equals(request.getCode()) && badgeDefinitionRepository.existsByCode(request.getCode())) {
            throw new IllegalArgumentException("Badge code already exists: " + request.getCode());
        }
        toEntity(badge, request);
        return toResponse(save(badge));
    }

    public void delete(UUID id) {
        Badge badge = getById(id);
        badgeDefinitionRepository.delete(badge);
    }

    private Badge getById(UUID id) {
        return badgeDefinitionRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Badge not found: " + id));
    }

    private Badge save(Badge badge) {
        return badgeDefinitionRepository.save(badge);
    }

    private static BadgeDefinitionResponse toResponse(Badge badge) {
        return BadgeDefinitionResponse.builder()
                .id(badge.getId())
                .code(badge.getCode())
                .name(badge.getName())
                .description(badge.getDescription())
                .criteriaType(badge.getCriteriaType())
                .criteriaValue(badge.getCriteriaValue())
                .active(badge.getActive())
                .createdAt(badge.getCreatedAt())
                .updatedAt(badge.getUpdatedAt())
                .build();
    }

    private void validateCriteria(BadgeUpsertRequest request) {
        boolean requiresValue = switch (request.getCriteriaType()) {
            case STREAK_DAYS, TOTAL_BOOKS, TOTAL_PAGES -> true;
            case FIRST_BOOK -> false;
        };
        if (requiresValue && (request.getCriteriaValue() == null || request.getCriteriaValue().isBlank())) {
            throw new IllegalArgumentException("criteriaValue é obrigatório para o tipo " + request.getCriteriaType());
        }
    }

    private static Badge toEntity(Badge badge, BadgeUpsertRequest request) {
        badge.setCode(request.getCode());
        badge.setName(request.getName());
        badge.setDescription(request.getDescription());
        badge.setCriteriaType(request.getCriteriaType());
        badge.setCriteriaValue(request.getCriteriaValue());
        badge.setActive(request.getActive());
        return badge;
    }
}
