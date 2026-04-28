package com.unichristus.libraryapi.presentation.advice;

import com.unichristus.libraryapi.application.dto.response.ErrorResponse;
import com.unichristus.libraryapi.application.dto.response.FieldErrorResponse;
import com.unichristus.libraryapi.application.dto.response.ValidationErrorResponse;
import com.unichristus.libraryapi.domain.exception.DomainError;
import com.unichristus.libraryapi.domain.exception.DomainException;
import com.unichristus.libraryapi.infrastructure.security.RateLimitExceededException;
import com.unichristus.libraryapi.infrastructure.storage.exception.FileStorageException;
import com.unichristus.libraryapi.presentation.mapper.HttpErrorMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.multipart.MaxUploadSizeExceededException;
import org.springframework.web.multipart.MultipartException;
import org.springframework.web.multipart.support.MissingServletRequestPartException;

import java.util.List;

@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final String AUTHENTICATION_FAILED_CODE = "AUTHENTICATION_FAILED";
    private static final String ACCESS_DENIED_CODE = "ACCESS_DENIED";
    private static final String INVALID_REQUEST_CODE = "INVALID_REQUEST";
    private static final String INTERNAL_ERROR_CODE = "INTERNAL_ERROR";

    @ExceptionHandler(AuthenticationException.class)
    public ResponseEntity<ErrorResponse> handleAuthenticationException(AuthenticationException ex) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(new ErrorResponse(AUTHENTICATION_FAILED_CODE, "Autenticacao obrigatoria ou invalida."));
    }

    @ExceptionHandler(RateLimitExceededException.class)
    public ResponseEntity<ErrorResponse> handleRateLimitExceeded(RateLimitExceededException ex) {
        return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                .body(new ErrorResponse("RATE_LIMIT_EXCEEDED", ex.getMessage()));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGenericException(Exception ex) {
        log.error("Generic Exception: {}", ex.getMessage(), ex);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new ErrorResponse(INTERNAL_ERROR_CODE, "Unexpected internal error"));
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

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ErrorResponse> handleAccessDenied(AccessDeniedException ex) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(new ErrorResponse(ACCESS_DENIED_CODE, "Acesso negado."));
    }

    @ExceptionHandler({
            HttpMessageNotReadableException.class,
            MethodArgumentTypeMismatchException.class,
            MissingServletRequestParameterException.class,
            MissingServletRequestPartException.class,
            MultipartException.class,
            DataIntegrityViolationException.class,
            FileStorageException.class
    })
    public ResponseEntity<ErrorResponse> handleBadRequest(Exception ex) {
        String message = ex instanceof FileStorageException
                ? ex.getMessage()
                : "Requisicao invalida.";
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(new ErrorResponse(INVALID_REQUEST_CODE, message));
    }

    @ExceptionHandler(MaxUploadSizeExceededException.class)
    public ResponseEntity<ErrorResponse> handleMaxUploadSize(MaxUploadSizeExceededException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(new ErrorResponse("UPLOAD_SIZE_EXCEEDED", "Arquivo excede o tamanho maximo permitido"));
    }

}
