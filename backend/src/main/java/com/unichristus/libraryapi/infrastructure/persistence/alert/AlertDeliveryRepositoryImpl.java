package com.unichristus.libraryapi.infrastructure.persistence.alert;

import com.unichristus.libraryapi.domain.alert.AlertDelivery;
import com.unichristus.libraryapi.domain.alert.AlertDeliveryRepository;
import com.unichristus.libraryapi.domain.alert.AlertDeliveryStatus;
import com.unichristus.libraryapi.application.dto.response.AlertType;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.TypedQuery;
import jakarta.persistence.criteria.CriteriaBuilder;
import jakarta.persistence.criteria.CriteriaQuery;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.UUID;

@Repository
@RequiredArgsConstructor
public class AlertDeliveryRepositoryImpl implements AlertDeliveryRepository {

    private final AlertDeliveryJpaRepository jpaRepository;
    @PersistenceContext
    private EntityManager entityManager;

    @Override
    public AlertDelivery save(AlertDelivery delivery) {
        return jpaRepository.save(delivery);
    }

    @Override
    public Page<AlertDelivery> findAll(Pageable pageable) {
        Pageable sorted = withDefaultSort(pageable);
        return jpaRepository.findAll(sorted);
    }

    @Override
    public Page<AlertDelivery> findByUserId(UUID userId, Pageable pageable) {
        Pageable sorted = withDefaultSort(pageable);
        return jpaRepository.findByUserId(userId, sorted);
    }

    @Override
    public Page<AlertDelivery> search(UUID userId,
                                      AlertDeliveryStatus status,
                                      AlertType alertType,
                                      LocalDateTime dateFrom,
                                      LocalDateTime dateTo,
                                      Pageable pageable) {
        Pageable sorted = withDefaultSort(pageable);

        CriteriaBuilder cb = entityManager.getCriteriaBuilder();

        CriteriaQuery<AlertDelivery> cq = cb.createQuery(AlertDelivery.class);
        Root<AlertDelivery> root = cq.from(AlertDelivery.class);
        Predicate[] predicates = buildPredicates(userId, status, alertType, dateFrom, dateTo, cb, root);
        cq.where(predicates);
        cq.orderBy(cb.desc(root.get("createdAt")));

        TypedQuery<AlertDelivery> query = entityManager.createQuery(cq);
        query.setFirstResult((int) sorted.getOffset());
        query.setMaxResults(sorted.getPageSize());
        var content = query.getResultList();

        CriteriaQuery<Long> countQuery = cb.createQuery(Long.class);
        Root<AlertDelivery> countRoot = countQuery.from(AlertDelivery.class);
        Predicate[] countPredicates = buildPredicates(userId, status, alertType, dateFrom, dateTo, cb, countRoot);
        countQuery.select(cb.count(countRoot)).where(countPredicates);
        Long total = entityManager.createQuery(countQuery).getSingleResult();

        return new PageImpl<>(content, sorted, total);
    }

    private Pageable withDefaultSort(Pageable pageable) {
        if (pageable.getSort().isSorted()) {
            return pageable;
        }
        return org.springframework.data.domain.PageRequest.of(
                pageable.getPageNumber(),
                pageable.getPageSize(),
                Sort.by(Sort.Direction.DESC, "createdAt"));
    }

    private Predicate[] buildPredicates(UUID userId,
                                        AlertDeliveryStatus status,
                                        AlertType alertType,
                                        LocalDateTime dateFrom,
                                        LocalDateTime dateTo,
                                        CriteriaBuilder cb,
                                        Root<AlertDelivery> root) {
        java.util.List<Predicate> predicates = new java.util.ArrayList<>();
        if (userId != null) {
            predicates.add(cb.equal(root.get("userId"), userId));
        }
        if (status != null) {
            predicates.add(cb.equal(root.get("status"), status));
        }
        if (alertType != null) {
            predicates.add(cb.equal(root.get("alertType"), alertType));
        }
        if (dateFrom != null) {
            predicates.add(cb.greaterThanOrEqualTo(root.get("createdAt"), dateFrom));
        }
        if (dateTo != null) {
            predicates.add(cb.lessThanOrEqualTo(root.get("createdAt"), dateTo));
        }
        return predicates.toArray(new Predicate[0]);
    }
}
