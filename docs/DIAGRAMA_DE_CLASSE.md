# Diagrama De Classe

Data de referencia: 2026-04-04

Este diagrama representa os principais agregados e relacionamentos do projeto `Library`, mantendo foco no entendimento arquitetural e na manutencao.

```mermaid
classDiagram
    class User {
        UUID id
        String name
        String email
        String password
        Role role
        Boolean leaderboardOptIn
        Boolean alertsOptIn
    }

    class Book {
        UUID id
        String title
        String author
        String isbn
        Integer numberOfPages
        String coverUrl
        String pdfUrl
        String source
    }

    class Category {
        UUID id
        String name
        String description
    }

    class Tag {
        UUID id
        String name
        String description
    }

    class Collection {
        UUID id
        String name
        String description
    }

    class Reading {
        UUID id
        Integer currentPage
        Integer progressPercent
        ReadingStatus status
        LocalDateTime updatedAt
    }

    class ReadingGoal {
        UUID id
        GoalPeriod period
        Integer targetPages
        Integer currentPages
        GoalStatus status
    }

    class Favorite {
        UUID id
        LocalDateTime createdAt
    }

    class Review {
        UUID id
        Integer rating
        String comment
        LocalDateTime createdAt
        LocalDateTime updatedAt
    }

    class Badge {
        UUID id
        String code
        String title
        String description
        String iconUrl
    }

    class UserBadge {
        UUID id
        LocalDateTime earnedAt
    }

    User "1" --> "*" Reading
    User "1" --> "*" Favorite
    User "1" --> "*" Review
    User "1" --> "*" ReadingGoal
    User "1" --> "*" UserBadge
    Book "1" --> "*" Reading
    Book "1" --> "*" Favorite
    Book "1" --> "*" Review
    Book "*" --> "*" Category
    Book "*" --> "*" Tag
    Book "*" --> "*" Collection
    Badge "1" --> "*" UserBadge
```
