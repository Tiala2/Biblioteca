package com.unichristus.libraryapi.application.validation;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

import java.net.URI;

public class SafeHttpUrlValidator implements ConstraintValidator<SafeHttpUrl, String> {

    @Override
    public boolean isValid(String value, ConstraintValidatorContext context) {
        if (value == null || value.isBlank()) {
            return true;
        }

        try {
            URI uri = URI.create(value.trim());
            String scheme = uri.getScheme();
            if (scheme == null || (!scheme.equalsIgnoreCase("http") && !scheme.equalsIgnoreCase("https"))) {
                return false;
            }

            return uri.getHost() != null && !uri.getHost().isBlank();
        } catch (IllegalArgumentException ex) {
            return false;
        }
    }
}
