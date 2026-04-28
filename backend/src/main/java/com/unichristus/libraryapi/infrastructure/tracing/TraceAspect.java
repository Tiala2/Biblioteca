package com.unichristus.libraryapi.infrastructure.tracing;

import org.aspectj.lang.JoinPoint;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.annotation.Before;
import org.aspectj.lang.reflect.MethodSignature;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;
import org.springframework.stereotype.Component;

import java.util.Locale;
import java.util.regex.Pattern;
import java.util.stream.Collectors;
import java.util.stream.IntStream;

import static com.unichristus.libraryapi.infrastructure.tracing.TraceIdFilter.TRACE_ID_KEY;

@Aspect
@Component
public class TraceAspect {

    private static final Logger log = LoggerFactory.getLogger(TraceAspect.class);
    private static final Pattern OBJECT_SENSITIVE_FIELD = Pattern.compile("(?i)\\b(password|newPassword|token|authorization|secret)=[^,\\])}]+");
    private static final Pattern JSON_SENSITIVE_FIELD = Pattern.compile("(?i)\"(password|newPassword|token|authorization|secret)\"\\s*:\\s*\"[^\"]*\"");

    @Before("@within(org.springframework.web.bind.annotation.RestController) || " +
            "@within(com.unichristus.libraryapi.application.annotation.UseCase) || " +
            "@within(org.springframework.stereotype.Service) || " +
            "@within(org.springframework.stereotype.Repository)")
    public void logMethodExecution(JoinPoint joinPoint) {
        String traceId = MDC.get(TRACE_ID_KEY);
        if (traceId == null) {
            return;
        }

        MethodSignature signature = (MethodSignature) joinPoint.getSignature();
        String className = joinPoint.getTarget().getClass().getSimpleName();
        String methodName = signature.getName();
        String parameters = formatParameters(signature.getParameterNames(), joinPoint.getArgs());

        log.debug("{}.{}({})", className, methodName, parameters);
    }

    private String formatParameters(String[] paramNames, Object[] args) {
        if (args == null || args.length == 0) {
            return "";
        }

        return IntStream.range(0, args.length)
                .mapToObj(i -> {
                    String name = (paramNames != null && paramNames.length > i)
                            ? paramNames[i]
                            : "arg" + i;
                    return name + "=" + sanitizeValue(name, args[i]);
                })
                .collect(Collectors.joining(", "));
    }

    private String sanitizeValue(String name, Object value) {
        if (value == null) {
            return "null";
        }

        if (isSensitiveName(name)) {
            return "***";
        }

        String packageName = value.getClass().getPackageName();
        if (packageName.startsWith("jakarta.servlet.") || packageName.startsWith("org.springframework.security.")) {
            return value.getClass().getSimpleName();
        }

        String text = String.valueOf(value);
        text = OBJECT_SENSITIVE_FIELD.matcher(text).replaceAll("$1=***");
        text = JSON_SENSITIVE_FIELD.matcher(text).replaceAll("\"$1\":\"***\"");
        return text;
    }

    private boolean isSensitiveName(String name) {
        String normalized = name == null ? "" : name.toLowerCase(Locale.ROOT);
        return normalized.contains("password")
                || normalized.contains("token")
                || normalized.contains("authorization")
                || normalized.contains("secret");
    }
}
