package com.unichristus.libraryapi.infrastructure.config;

import com.fasterxml.jackson.core.JsonGenerator;
import com.fasterxml.jackson.databind.JsonSerializer;
import com.fasterxml.jackson.databind.Module;
import com.fasterxml.jackson.databind.SerializerProvider;
import com.fasterxml.jackson.databind.module.SimpleModule;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.domain.Page;

import java.io.IOException;

@Configuration
public class PageSerializationConfig {

    @Bean
    public Module pageSerializationModule() {
        SimpleModule module = new SimpleModule();
        module.addSerializer(Page.class, new PageJsonSerializer());
        return module;
    }

    private static final class PageJsonSerializer extends JsonSerializer<Page> {

        @Override
        public void serialize(Page value, JsonGenerator gen, SerializerProvider serializers) throws IOException {
            gen.writeStartObject();

            gen.writeFieldName("content");
            serializers.defaultSerializeValue(value.getContent(), gen);

            gen.writeObjectFieldStart("page");
            gen.writeNumberField("size", value.getSize());
            gen.writeNumberField("number", value.getNumber());
            gen.writeNumberField("totalElements", value.getTotalElements());
            gen.writeNumberField("totalPages", value.getTotalPages());
            gen.writeEndObject();

            gen.writeEndObject();
        }
    }
}
