package com.unichristus.libraryapi.presentation.common;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;

import java.util.List;
import java.util.Set;

public final class PageableSanitizer {

    private static final int DEFAULT_MAX_PAGE_SIZE = 100;

    private PageableSanitizer() {
    }

    public static Pageable sanitize(Pageable pageable, Sort defaultSort, Set<String> allowedSortProperties) {
        return sanitize(pageable, defaultSort, allowedSortProperties, DEFAULT_MAX_PAGE_SIZE);
    }

    public static Pageable sanitize(Pageable pageable,
                                    Sort defaultSort,
                                    Set<String> allowedSortProperties,
                                    int maxPageSize) {
        int safePage = Math.max(pageable.getPageNumber(), 0);
        int safeSize = Math.min(Math.max(pageable.getPageSize(), 1), maxPageSize);
        Sort safeSort = sanitizeSort(pageable.getSort(), defaultSort, allowedSortProperties);
        return PageRequest.of(safePage, safeSize, safeSort);
    }

    private static Sort sanitizeSort(Sort requestedSort, Sort defaultSort, Set<String> allowedSortProperties) {
        if (requestedSort == null || requestedSort.isUnsorted()) {
            return defaultSort;
        }

        List<Sort.Order> validOrders = requestedSort.stream()
                .filter(order -> allowedSortProperties.contains(order.getProperty()))
                .toList();

        if (validOrders.isEmpty()) {
            return defaultSort;
        }

        return Sort.by(validOrders);
    }
}
