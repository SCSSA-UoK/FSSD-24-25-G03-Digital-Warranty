package com.warrantrack.repository;

import com.warrantrack.model.Notification;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

@Repository
public interface NotificationRepository extends MongoRepository<Notification, String> {

    Page<Notification> findByUserIdOrderByCreatedAtDesc(String userId, Pageable pageable);

    @Query(value = "{ 'userId': ?0, '$and': [ { 'isRead': { '$ne': true } }, { 'read': { '$ne': true } } ] }", count = true)
    long countByUserIdAndIsReadFalse(String userId);
}
