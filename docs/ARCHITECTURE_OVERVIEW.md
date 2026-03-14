# Architecture Overview

## Purpose

Library is a digital public library platform designed for public libraries and educational institutions, with emphasis on low operational cost, reading engagement and future extensibility.

## Current Architecture

The backend follows a layered structure:

- `presentation`: HTTP controllers, request mapping and API contracts
- `application`: use cases, DTOs, mappers and orchestration logic
- `domain`: entities, business services, repository contracts and domain rules
- `infrastructure`: persistence, security, integrations, object storage and runtime configuration

The frontend follows feature-based organization:

- `app`: bootstrap, router and providers
- `features`: business-facing screens and flows
- `shared`: reusable UI, API client, layout and styles

## Architectural Decisions

### 1. Domain-first user model

User role is modeled in the domain layer, reducing coupling between business concepts and security infrastructure.

### 2. Use case orchestration

Controllers stay thin. Business flows such as authentication, import, reading sync, favorites and home summary are executed in use case classes.

### 3. DTO isolation

The API does not expose persistence entities directly. Response mappers build explicit contracts for frontend consumption.

### 4. External-book strategy

Open Library and Internet Archive are treated as low-cost external sources. The application stores normalized metadata locally and only attaches PDFs when legally and technically available.

### 5. Low-cost storage strategy

Local and imported PDFs are stored in MinIO-compatible object storage, which supports local execution and future cloud portability without paid vendor lock-in.

## Future Evolution Paths

The current structure is ready to evolve with low refactor pressure in the following directions:

- recommendation engines
- AI-assisted reading suggestions
- automated catalog ingestion
- richer in-app book reader
- analytics and dashboards
- mobile clients
- multi-library tenancy
- multilingual metadata and UI

Recommended next architectural step for future scale:

- introduce explicit integration ports in `application` for external providers such as Open Library, mail and storage

## Zero-Cost Strategy

To preserve minimal infrastructure cost:

- use Open Library and Internet Archive as open catalog sources
- prefer public-domain and institution-owned PDFs
- keep PostgreSQL + MinIO + Mailpit local in development
- rely on Docker Compose for reproducible environments
- cache imported metadata locally to reduce repeated external calls
- lazy-load frontend routes to reduce bandwidth consumption

## Operational Notes

- Prefer example environment files over real `.env` in version control
- Keep Liquibase as the single source of truth for schema evolution
- Validate new features through unit, integration and smoke flows before merge
