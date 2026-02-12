package com.unichristus.libraryapi.presentation.advice;

import com.unichristus.libraryapi.application.dto.response.ErrorResponse;
import com.unichristus.libraryapi.application.dto.response.FieldErrorResponse;
import com.unichristus.libraryapi.application.dto.response.ValidationErrorResponse;
import com.unichristus.libraryapi.domain.exception.DomainError;
import com.unichristus.libraryapi.domain.exception.DomainException;
import com.unichristus.libraryapi.presentation.mapper.HttpErrorMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.List;

@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGenericException(Exception ex) {
        log.error("Generic Exception: {}", ex.getMessage(), ex);
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(new ErrorResponse(HttpStatus.BAD_REQUEST.getReasonPhrase(), ex.getMessage()));
    }

    @ExceptionHandler(DomainException.class)
    public ResponseEntity<ErrorResponse> handleDomainException(DomainException ex) {
        DomainError error = ex.getError();
//        log.error("DomainException [{}]: {}", error.getCode(), ex.getMessage());
        return ResponseEntity
                .status(HttpErrorMapper.map(error))
                .body(new ErrorResponse(error.getCode(), ex.getMessage()));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidationException(MethodArgumentNotValidException ex) {
//        log.error("Validation Exception: {}", ex.getMessage());
        List<FieldErrorResponse> fieldErrors = ex.getBindingResult().getAllErrors().stream()
                .map(error -> {
                    String fieldName = ((org.springframework.validation.FieldError) error).getField();
                    String errorMessage = error.getDefaultMessage();
                    return new FieldErrorResponse(fieldName, errorMessage);
                })
                .toList();
        var validationErrorResponse = new ValidationErrorResponse();
        validationErrorResponse.setCode("VALIDATION_ERROR");
        validationErrorResponse.setMessage("Validation failed");
        validationErrorResponse.setFieldErrors(fieldErrors);
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(validationErrorResponse);
    }

}
