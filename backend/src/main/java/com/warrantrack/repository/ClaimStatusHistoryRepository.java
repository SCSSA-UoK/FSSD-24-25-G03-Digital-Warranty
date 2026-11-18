package com.warrantrack.repository;

import com.warrantrack.model.ClaimStatusHistory;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ClaimStatusHistoryRepository extends MongoRepository<ClaimStatusHistory, String> {

    List<ClaimStatusHistory> findByClaimIdOrderByChangedAtAsc(String claimId);
}
