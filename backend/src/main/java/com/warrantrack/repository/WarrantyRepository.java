package com.warrantrack.repository;

import com.warrantrack.model.Warranty;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface WarrantyRepository extends MongoRepository<Warranty, String> {

    Page<Warranty> findByCustomerId(String customerId, Pageable pageable);

    long countByCustomerId(String customerId);

    Optional<Warranty> findByPurchaseId(String purchaseId);

    Page<Warranty> findByRetailerId(String retailerId, Pageable pageable);

    Optional<Warranty> findByQrToken(String qrToken);

    boolean existsByPurchaseId(String purchaseId);

    long countByRetailerId(String retailerId);

    List<Warranty> findByExpiryDateBetweenAndCustomerIdIsNotNull(java.time.LocalDate startDate, java.time.LocalDate endDate);
}
