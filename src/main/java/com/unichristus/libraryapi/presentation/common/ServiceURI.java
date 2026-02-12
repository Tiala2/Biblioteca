package com.unichristus.libraryapi.presentation.common;

import lombok.NoArgsConstructor;

@NoArgsConstructor(access = lombok.AccessLevel.PRIVATE)
public final class ServiceURI {

    //API Paths
    private static final String V1 = "/v1";
    private static final String API = "/api";
    private static final String BASE_API = API + V1;
    private static final String USERS = "/users";
    private static final String BOOKS = "/books";

    //Resource Paths
    public static final String HOME_RESOURCE = BASE_API + "/home";
    public static final String AUTH_RESOURCE = BASE_API + "/auth";
    public static final String BOOKS_RESOURCE = BASE_API + BOOKS;
    public static final String USERS_RESOURCE = BASE_API + USERS;
    public static final String READINGS_RESOURCE = BASE_API + "/readings";
    public static final String FAVORITES_RESOURCE = BASE_API + USERS + "/me/favorites";
    public static final String REVIEWS_RESOURCE = BASE_API + "/reviews";
    public static final String CATEGORIES_RESOURCE = BASE_API + "/categories";

    //Admin Paths
    public static final String ADMIN = API + "/admin";
    public static final String ADMIN_USERS = ADMIN + USERS;
    public static final String BOOKS_ADMIN = ADMIN + BOOKS;
    public static final String FAVORITES_ADMIN = ADMIN + "/favorites";
    public static final String CATEGORIES_ADMIN = ADMIN + "/categories";
}
