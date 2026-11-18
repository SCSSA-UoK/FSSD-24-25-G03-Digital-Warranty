package com.warrantrack.repository;

import com.warrantrack.model.Claim;
import com.warrantrack.model.enums.ClaimStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ClaimRepository extends MongoRepository<Claim, String> {

    Page<Claim> findByCustomerId(String customerId, Pageable pageable);

    long countByCustomerId(String customerId);

    Page<Claim> findByRetailerId(String retailerId, Pageable pageable);

    Page<Claim> findByCurrentStatus(ClaimStatus currentStatus, Pageable pageable);

    long countByRetailerId(String retailerId);

    long countByCurrentStatus(ClaimStatus currentStatus);

    long countByRetailerIdAndCurrentStatus(String retailerId, ClaimStatus currentStatus);

    boolean existsByWarrantyIdAndCurrentStatusIn(String warrantyId, java.util.Collection<ClaimStatus> currentStatuses);
}
