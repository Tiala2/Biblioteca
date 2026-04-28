package com.unichristus.libraryapi.application.validation;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;

import java.lang.annotation.Documented;
import java.lang.annotation.Retention;
import java.lang.annotation.Target;

import static java.lang.annotation.ElementType.FIELD;
import static java.lang.annotation.ElementType.PARAMETER;
import static java.lang.annotation.RetentionPolicy.RUNTIME;

@Documented
@Constraint(validatedBy = SafeHttpUrlValidator.class)
@Target({ FIELD, PARAMETER })
@Retention(RUNTIME)
public @interface SafeHttpUrl {

    String message() default "URL deve usar http ou https";

    Class<?>[] groups() default {};

    Class<? extends Payload>[] payload() default {};
}
