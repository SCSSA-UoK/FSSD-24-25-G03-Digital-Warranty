package com.warrantrack.service;


import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import com.warrantrack.model.AuditLog;
import com.warrantrack.repository.AuditLogRepository;
import org.springframework.stereotype.Service;

import java.time.Instant;

@Service
public class AuditService {
    private static final Logger log = LoggerFactory.getLogger(AuditService.class);


    private final AuditLogRepository auditLogRepository;

    public AuditService(AuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
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
}

