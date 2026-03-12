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
import java.security.InvalidKeyException;
import java.security.NoSuchAlgorithmException;
import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
public class MinioFileStorageService {

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
        validateFileSize(file);
        uploadFile(file, filesBucket, objectName);
    }

    public void uploadPdf(byte[] content, String objectName, String contentType) {
        if (content == null || content.length == 0) {
            throw new FileStorageException("File content is empty");
        }
        if (content.length > (long) maxFileSizeMb * 1024 * 1024) {
            throw new FileStorageException("File exceeded limit");
        }

        try (InputStream inputStream = new ByteArrayInputStream(content)) {
            checkExists(filesBucket);
            minioClient.putObject(
                    PutObjectArgs.builder()
                            .bucket(filesBucket)
                            .object(objectName)
                            .contentType(contentType == null || contentType.isBlank() ? "application/pdf" : contentType)
                            .stream(inputStream, content.length, -1)
                            .build()
            );
        } catch (Exception e) {
            throw new FileStorageException("Erro ao fazer upload do arquivo: " + e.getMessage());
        }
    }

    private void validateFileSize(MultipartFile file) {
        if (file.getSize() > (long) maxFileSizeMb * 1024 * 1024) {
            throw new FileStorageException("File exceeded limit");
        }
    }

    private void uploadFile(MultipartFile file, String bucket, String objectName) {
        try (InputStream inputStream = file.getInputStream()) {
            checkExists(bucket);
            minioClient.putObject(
                    PutObjectArgs.builder()
                            .bucket(bucket)
                            .object(objectName)
                            .contentType(file.getContentType())
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
