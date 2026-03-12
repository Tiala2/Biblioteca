package com.unichristus.libraryapi.application.notification;

import com.unichristus.libraryapi.application.dto.response.AlertResponse;

import java.util.List;
import java.util.UUID;

public interface ReadingAlertNotifier {

    void notifyUser(UUID userId, String userEmail, List<AlertResponse> alerts);
}
