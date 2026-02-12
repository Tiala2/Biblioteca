package com.unichristus.libraryapi.application.annotation;

import org.springframework.core.annotation.AliasFor;
import org.springframework.stereotype.Service;

import java.lang.annotation.*;

/**
 * Indica que a classe é um Use Case da camada de aplicação.
 * Use Cases encapsulam a lógica de negócio específica da aplicação.
 */
@Target(ElementType.TYPE)
@Retention(RetentionPolicy.RUNTIME)
@Documented
@Service
public @interface UseCase {
    @AliasFor(annotation = Service.class)
    String value() default "";
}