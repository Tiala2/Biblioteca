package com.unichristus.libraryapi.infrastructure.storage;

import com.unichristus.libraryapi.infrastructure.storage.exception.FileStorageException;
import io.minio.*;
import io.minio.errors.*;
import io.minio.http.Method;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.security.InvalidKeyException;
import java.security.NoSuchAlgorithmException;
import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
public class MinioFileStorageService {

    private final MinioClient minioClient;

    @Value("${minio.bucket.files}")
    private String filesBucket;

    @Value("${minio.bucket.max-size-mb}")
    private int maxFileSizeMb;

    public void uploadPdf(MultipartFile file, String objectName) {
        validateFileSize(file);
        uploadFile(file, filesBucket, objectName);
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
            throw new RuntimeException("Erro ao fazer upload do arquivo: " + e.getMessage(), e);
        }
    }

    public String generatePresignedUrl(String bookKey) {
        try {
            return minioClient.getPresignedObjectUrl(
                    GetPresignedObjectUrlArgs.builder()
                            .method(Method.GET)
                            .bucket(filesBucket)
                            .object(bookKey)
                            .expiry(1, TimeUnit.HOURS)
                            .build()
            );
        } catch (Exception e) {
            throw new RuntimeException("Erro ao gerar URL pré-assinada: " + e.getMessage(), e);
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
