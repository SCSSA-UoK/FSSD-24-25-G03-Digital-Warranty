package com.warrantrack.repository;

import com.warrantrack.model.AuditLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AuditLogRepository extends MongoRepository<AuditLog, String> {

    List<AuditLog> findByEntityTypeAndEntityId(String entityType, String entityId);

    Page<AuditLog> findAllByOrderByTimestampDesc(Pageable pageable);
}
