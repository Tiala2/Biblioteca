package com.unichristus.libraryapi.infrastructure.storage;

import com.unichristus.libraryapi.infrastructure.storage.exception.FileStorageException;
import io.minio.*;
import io.minio.errors.*;
import io.minio.http.Method;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.security.InvalidKeyException;
import java.security.NoSuchAlgorithmException;
import java.util.Locale;
import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
public class MinioFileStorageService {

    private static final String PDF_CONTENT_TYPE = "application/pdf";
    private static final String OCTET_STREAM_CONTENT_TYPE = "application/octet-stream";
    private static final byte[] PDF_SIGNATURE = "%PDF-".getBytes(StandardCharsets.US_ASCII);

    public record StoredFile(InputStream stream, String contentType, long size) {}

    private final MinioClient minioClient;

    @Value("${minio.bucket.files}")
    private String filesBucket;

    @Value("${minio.bucket.max-size-mb}")
    private int maxFileSizeMb;

    @Value("${minio.url}")
    private String internalMinioUrl;

    @Value("${minio.public-url:${minio.url}}")
    private String publicMinioUrl;

    public void uploadPdf(MultipartFile file, String objectName) {
        validatePdfUpload(file, objectName);
        uploadFile(file, filesBucket, objectName);
    }

    public void uploadPdf(byte[] content, String objectName, String contentType) {
        validatePdfBytes(content, contentType, objectName);

        try (InputStream inputStream = new ByteArrayInputStream(content)) {
            checkExists(filesBucket);
            minioClient.putObject(
                    PutObjectArgs.builder()
                            .bucket(filesBucket)
                            .object(objectName)
                            .contentType(normalizeContentType(contentType))
                            .stream(inputStream, content.length, -1)
                            .build()
            );
        } catch (Exception e) {
            throw new FileStorageException("Erro ao fazer upload do arquivo: " + e.getMessage());
        }
    }

    private void validatePdfUpload(MultipartFile file, String objectName) {
        validateObjectName(objectName);
        if (file == null || file.isEmpty()) {
            throw new FileStorageException("Arquivo PDF invalido ou vazio.");
        }
        if (file.getSize() > (long) maxFileSizeMb * 1024 * 1024) {
            throw new FileStorageException("Arquivo PDF excede o tamanho maximo permitido.");
        }

        String originalFilename = file.getOriginalFilename();
        if (originalFilename == null || originalFilename.isBlank() || !originalFilename.toLowerCase(Locale.ROOT).endsWith(".pdf")) {
            throw new FileStorageException("Arquivo PDF deve possuir extensao .pdf.");
        }

        String contentType = normalizeContentType(file.getContentType());
        if (!PDF_CONTENT_TYPE.equals(contentType) && !OCTET_STREAM_CONTENT_TYPE.equals(contentType)) {
            throw new FileStorageException("Tipo de arquivo invalido. Envie um PDF.");
        }

        try {
            byte[] content = file.getBytes();
            validatePdfSignature(content);
        } catch (IOException ex) {
            throw new FileStorageException("Nao foi possivel validar o arquivo PDF enviado.");
        }
    }

    private void uploadFile(MultipartFile file, String bucket, String objectName) {
        try (InputStream inputStream = file.getInputStream()) {
            checkExists(bucket);
            minioClient.putObject(
                    PutObjectArgs.builder()
                            .bucket(bucket)
                            .object(objectName)
                            .contentType(normalizeContentType(file.getContentType()))
                            .stream(inputStream, file.getSize(), -1)
                            .build()
            );
        } catch (Exception e) {
            throw new FileStorageException("Erro ao fazer upload do arquivo: " + e.getMessage());
        }
    }

    public String generatePresignedUrl(String bookKey) {
        try {
            minioClient.statObject(
                    StatObjectArgs.builder()
                            .bucket(filesBucket)
                            .object(bookKey)
                            .build()
            );

            String internalUrl = minioClient.getPresignedObjectUrl(
                    GetPresignedObjectUrlArgs.builder()
                            .method(Method.GET)
                            .bucket(filesBucket)
                            .object(bookKey)
                            .expiry(1, TimeUnit.HOURS)
                            .build()
            );
            return rewriteToPublicUrl(internalUrl);
        } catch (Exception e) {
            throw new RuntimeException("Erro ao gerar URL pre-assinada: " + e.getMessage(), e);
        }
    }

    public StoredFile getPdfObject(String bookKey) {
        try {
            StatObjectResponse stat = minioClient.statObject(
                    StatObjectArgs.builder()
                            .bucket(filesBucket)
                            .object(bookKey)
                            .build()
            );

            GetObjectResponse response = minioClient.getObject(
                    GetObjectArgs.builder()
                            .bucket(filesBucket)
                            .object(bookKey)
                            .build()
            );

            String contentType = stat.contentType();
            if (contentType == null || contentType.isBlank()) {
                contentType = "application/pdf";
            }

            return new StoredFile(response, contentType, stat.size());
        } catch (Exception e) {
            throw new FileStorageException("Erro ao recuperar arquivo no storage: " + e.getMessage());
        }
    }

    private String rewriteToPublicUrl(String internalUrl) {
        if (internalUrl == null || internalUrl.isBlank()) {
            return internalUrl;
        }
        if (publicMinioUrl == null || publicMinioUrl.isBlank() || publicMinioUrl.equals(internalMinioUrl)) {
            return internalUrl;
        }

        try {
            URI original = URI.create(internalUrl);
            URI publicBase = URI.create(publicMinioUrl);

            URI rewritten = new URI(
                    publicBase.getScheme(),
                    original.getUserInfo(),
                    publicBase.getHost(),
                    publicBase.getPort(),
                    original.getPath(),
                    original.getQuery(),
                    original.getFragment()
            );
            return rewritten.toString();
        } catch (Exception ex) {
            return internalUrl;
        }
    }

    private void validatePdfBytes(byte[] content, String contentType, String objectName) {
        validateObjectName(objectName);
        if (content == null || content.length == 0) {
            throw new FileStorageException("Arquivo PDF invalido ou vazio.");
        }
        if (content.length > (long) maxFileSizeMb * 1024 * 1024) {
            throw new FileStorageException("Arquivo PDF excede o tamanho maximo permitido.");
        }

        String normalizedContentType = normalizeContentType(contentType);
        if (!PDF_CONTENT_TYPE.equals(normalizedContentType) && !OCTET_STREAM_CONTENT_TYPE.equals(normalizedContentType)) {
            throw new FileStorageException("Tipo de arquivo invalido. Envie um PDF.");
        }

        validatePdfSignature(content);
    }

    private void validatePdfSignature(byte[] content) {
        if (content.length < PDF_SIGNATURE.length) {
            throw new FileStorageException("Conteudo do arquivo nao corresponde a um PDF valido.");
        }

        for (int index = 0; index < PDF_SIGNATURE.length; index++) {
            if (content[index] != PDF_SIGNATURE[index]) {
                throw new FileStorageException("Conteudo do arquivo nao corresponde a um PDF valido.");
            }
        }
    }

    private void validateObjectName(String objectName) {
        if (objectName == null || objectName.isBlank() || objectName.contains("/") || objectName.contains("\\")) {
            throw new FileStorageException("Identificador de arquivo invalido para upload.");
        }
    }

    private String normalizeContentType(String contentType) {
        if (contentType == null || contentType.isBlank()) {
            return PDF_CONTENT_TYPE;
        }
        return contentType.trim().toLowerCase(Locale.ROOT);
    }

    private void checkExists(String bucket) throws ErrorResponseException, InsufficientDataException, InternalException, InvalidKeyException, InvalidResponseException, IOException, NoSuchAlgorithmException, ServerException, XmlParserException {
        boolean exists = minioClient.bucketExists(
                BucketExistsArgs.builder().bucket(bucket).build()
        );
        if (!exists) {
            minioClient.makeBucket(
                    MakeBucketArgs.builder().bucket(bucket).build()
            );
        }
    }
}
