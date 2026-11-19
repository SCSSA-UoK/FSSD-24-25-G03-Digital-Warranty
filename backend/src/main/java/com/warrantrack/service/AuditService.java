package com.warrantrack.service;

import com.warrantrack.dto.PagedResponse;
import com.warrantrack.dto.admin.AuditLogResponse;
import com.warrantrack.model.AuditLog;
import com.warrantrack.repository.AuditLogRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.regex.Pattern;

@Service
public class AuditService {
    private static final Logger log = LoggerFactory.getLogger(AuditService.class);

    private final AuditLogRepository auditLogRepository;
    private final MongoTemplate mongoTemplate;

    public AuditService(AuditLogRepository auditLogRepository, MongoTemplate mongoTemplate) {
        this.auditLogRepository = auditLogRepository;
        this.mongoTemplate = mongoTemplate;
    }

    public void logAction(String actorId, String actorEmail, String action, String entityType, String entityId, String details) {
        try {
            AuditLog auditLog = AuditLog.builder()
                    .actorId(actorId)
                    .actorEmail(actorEmail)
                    .action(action)
                    .entityType(entityType)
                    .entityId(entityId)
                    .timestamp(Instant.now())
                    .details(details)
                    .build();
            auditLogRepository.save(auditLog);
            log.info("Audit: [{}] by {} on {}:{}", action, actorEmail, entityType, entityId);
        } catch (Exception e) {
            log.error("Failed to write audit log: {}", e.getMessage());
        }
    }

    public PagedResponse<AuditLogResponse> getAuditLogs(String search, String action, String entityType, Pageable pageable) {
        Query query = new Query();
        List<Criteria> criteriaList = new ArrayList<>();

        if (search != null && !search.isBlank()) {
            String pattern = ".*" + Pattern.quote(search.trim()) + ".*";
            Criteria searchCriteria = new Criteria().orOperator(
                    Criteria.where("actorEmail").regex(pattern, "i"),
                    Criteria.where("details").regex(pattern, "i"),
                    Criteria.where("action").regex(pattern, "i"),
                    Criteria.where("entityId").regex(pattern, "i"),
                    Criteria.where("entityType").regex(pattern, "i")
            );
            criteriaList.add(searchCriteria);
        }

        if (action != null && !action.isBlank()) {
            criteriaList.add(Criteria.where("action").is(action.trim()));
        }

        if (entityType != null && !entityType.isBlank()) {
            criteriaList.add(Criteria.where("entityType").is(entityType.trim()));
        }

        if (!criteriaList.isEmpty()) {
            query.addCriteria(new Criteria().andOperator(criteriaList.toArray(new Criteria[0])));
        }

        long totalElements = mongoTemplate.count(query, AuditLog.class);

        Sort sort = Sort.by(Sort.Direction.DESC, "timestamp");
        if (pageable.getSort().isSorted()) {
            sort = pageable.getSort();
        }

        Pageable sortedPageable = PageRequest.of(pageable.getPageNumber(), pageable.getPageSize(), sort);
        query.with(sortedPageable);

        List<AuditLog> list = mongoTemplate.find(query, AuditLog.class);

        List<AuditLogResponse> content = list.stream().map(this::mapToResponse).toList();
        int totalPages = pageable.getPageSize() > 0 ? (int) Math.ceil((double) totalElements / pageable.getPageSize()) : 0;
        boolean isLast = (long) (pageable.getPageNumber() + 1) * pageable.getPageSize() >= totalElements;

        return PagedResponse.<AuditLogResponse>builder()
                .content(content)
                .page(pageable.getPageNumber())
                .size(pageable.getPageSize())
                .totalElements(totalElements)
                .totalPages(totalPages)
                .last(isLast)
                .build();
    }

    public List<String> getDistinctActions() {
        return mongoTemplate.findDistinct(new Query(), "action", AuditLog.class, String.class);
    }

    public List<String> getDistinctEntityTypes() {
        return mongoTemplate.findDistinct(new Query(), "entityType", AuditLog.class, String.class);
    }

    private AuditLogResponse mapToResponse(AuditLog auditLog) {
        return AuditLogResponse.builder()
                .id(auditLog.getId())
                .actorId(auditLog.getActorId())
                .actorEmail(auditLog.getActorEmail())
                .action(auditLog.getAction())
                .entityType(auditLog.getEntityType())
                .entityId(auditLog.getEntityId())
                .timestamp(auditLog.getTimestamp())
                .details(auditLog.getDetails())
                .build();
    }
}
