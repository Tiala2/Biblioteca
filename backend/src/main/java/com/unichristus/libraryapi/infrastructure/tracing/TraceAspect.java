package com.unichristus.libraryapi.infrastructure.tracing;

import org.aspectj.lang.JoinPoint;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.annotation.Before;
import org.aspectj.lang.reflect.MethodSignature;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;
import org.springframework.stereotype.Component;

import java.util.stream.Collectors;
import java.util.stream.IntStream;

import static com.unichristus.libraryapi.infrastructure.tracing.LoggingFilter.TRACE_ID_KEY;

/**
 * Aspect que intercepta métodos das camadas Controller, Service e Repository
 * e loga automaticamente com o traceId, nome do method e parâmetros.
 * <p>
 * Só loga quando há um traceId no contexto (ou seja, dentro de um request HTTP).
 */
@Aspect
@Component
public class TraceAspect {

    private static final Logger log = LoggerFactory.getLogger(TraceAspect.class);

    /**
     * Intercepta todos os métodos públicos de classes anotadas com:
     * - @RestController
     * - @Controller
     * - @UseCase (anotação personalizada para casos de uso)
     * - @Service
     * - @Repository
     */
    @Before("@within(org.springframework.web.bind.annotation.RestController) || " +
            "@within(com.unichristus.libraryapi.application.annotation.UseCase) || " +
            "@within(org.springframework.stereotype.Service) || " +
            "@within(org.springframework.stereotype.Repository)")
    public void logMethodExecution(JoinPoint joinPoint) {
        // Só loga se estiver dentro de um contexto de request HTTP
        String traceId = MDC.get(TRACE_ID_KEY);

        if (traceId == null) {
            // Não está em contexto HTTP, não loga
            return;
        }

        MethodSignature signature = (MethodSignature) joinPoint.getSignature();
        String className = joinPoint.getTarget().getClass().getSimpleName();
        String methodName = signature.getName();

        // Captura os parâmetros do method
        Object[] args = joinPoint.getArgs();
        String[] paramNames = signature.getParameterNames();
        String parameters = formatParameters(paramNames, args);

        // Log estruturado com traceId, classe, method e parâmetros
        log.debug("{}.{}({})",
                className,
                methodName,
                parameters);
    }

    /**
     * Formata os parâmetros do method de forma legível
     */
    private String formatParameters(String[] paramNames, Object[] args) {
        if (args == null || args.length == 0) {
            return "";
        }

        return IntStream.range(0, args.length)
                .mapToObj(i -> {
                    String name = (paramNames != null && paramNames.length > i)
                            ? paramNames[i]
                            : "arg" + i;
                    Object value = args[i];
                    return name + "=" + (value != null ? value : "null");
                })
                .collect(Collectors.joining(", "));
    }
}

