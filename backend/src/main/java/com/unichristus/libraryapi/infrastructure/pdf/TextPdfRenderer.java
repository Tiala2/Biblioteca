package com.unichristus.libraryapi.infrastructure.pdf;

import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.common.PDRectangle;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.apache.pdfbox.pdmodel.font.Standard14Fonts;
import org.springframework.stereotype.Component;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.text.Normalizer;
import java.util.ArrayList;
import java.util.List;

@Component
public class TextPdfRenderer {

    private static final int MAX_TEXT_CHARS = 260_000;
    private static final float MARGIN = 56;
    private static final float FONT_SIZE = 11;
    private static final float TITLE_SIZE = 18;
    private static final float LEADING = 15;
    private static final int MAX_LINE_CHARS = 88;

    public byte[] render(String title, String author, String text) {
        try (PDDocument document = new PDDocument(); ByteArrayOutputStream output = new ByteArrayOutputStream()) {
            PDType1Font regular = new PDType1Font(Standard14Fonts.FontName.TIMES_ROMAN);
            PDType1Font bold = new PDType1Font(Standard14Fonts.FontName.TIMES_BOLD);
            List<String> lines = buildLines(title, author, text);

            int index = 0;
            while (index < lines.size()) {
                PDPage page = new PDPage(PDRectangle.LETTER);
                document.addPage(page);
                try (PDPageContentStream content = new PDPageContentStream(document, page)) {
                    float y = page.getMediaBox().getHeight() - MARGIN;
                    content.beginText();
                    content.setFont(index == 0 ? bold : regular, index == 0 ? TITLE_SIZE : FONT_SIZE);
                    content.newLineAtOffset(MARGIN, y);
                    while (index < lines.size() && y > MARGIN) {
                        String line = lines.get(index);
                        if (line.isBlank()) {
                            content.newLineAtOffset(0, -LEADING);
                            y -= LEADING;
                            index++;
                            continue;
                        }
                        if (index == 2) {
                            content.setFont(regular, FONT_SIZE);
                        }
                        content.showText(toPdfSafeText(line));
                        content.newLineAtOffset(0, -LEADING);
                        y -= LEADING;
                        index++;
                    }
                    content.endText();
                }
            }

            document.save(output);
            return output.toByteArray();
        } catch (IOException ex) {
            throw new IllegalStateException("Nao foi possivel gerar PDF de leitura.", ex);
        }
    }

    private List<String> buildLines(String title, String author, String text) {
        List<String> lines = new ArrayList<>();
        lines.add(title == null || title.isBlank() ? "Livro" : title.trim());
        lines.add(author == null || author.isBlank() ? "Autor nao informado" : author.trim());
        lines.add("");

        String boundedText = text == null ? "" : text.trim();
        if (boundedText.length() > MAX_TEXT_CHARS) {
            boundedText = boundedText.substring(0, MAX_TEXT_CHARS)
                    + "\n\n[Texto reduzido para manter a leitura leve nesta versao do app.]";
        }

        for (String paragraph : boundedText.split("\\n")) {
            String normalized = paragraph.trim().replaceAll("\\s+", " ");
            if (normalized.isBlank()) {
                lines.add("");
                continue;
            }
            lines.addAll(wrap(normalized));
        }
        return lines;
    }

    private List<String> wrap(String paragraph) {
        List<String> lines = new ArrayList<>();
        StringBuilder current = new StringBuilder();
        for (String word : paragraph.split(" ")) {
            if (current.length() == 0) {
                current.append(word);
            } else if (current.length() + 1 + word.length() <= MAX_LINE_CHARS) {
                current.append(' ').append(word);
            } else {
                lines.add(current.toString());
                current.setLength(0);
                current.append(word);
            }
        }
        if (!current.isEmpty()) {
            lines.add(current.toString());
        }
        return lines;
    }

    private String toPdfSafeText(String value) {
        String withoutUnsupportedChars = value.replaceAll("[\\p{Cntrl}&&[^\n\t]]", " ");
        return Normalizer.normalize(withoutUnsupportedChars, Normalizer.Form.NFKD)
                .replaceAll("\\p{M}", "")
                .replaceAll("[^\\x20-\\x7E]", " ");
    }
}
