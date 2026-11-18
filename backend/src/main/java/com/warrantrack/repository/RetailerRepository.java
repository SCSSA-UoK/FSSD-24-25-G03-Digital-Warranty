package com.warrantrack.repository;

import com.warrantrack.model.Retailer;
import com.warrantrack.model.enums.ApprovalStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface RetailerRepository extends MongoRepository<Retailer, String> {

    Optional<Retailer> findByUserId(String userId);

    Page<Retailer> findByApprovalStatus(ApprovalStatus approvalStatus, Pageable pageable);

    boolean existsByUserId(String userId);
}
