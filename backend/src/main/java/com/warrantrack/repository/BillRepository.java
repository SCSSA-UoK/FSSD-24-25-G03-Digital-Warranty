package com.warrantrack.repository;

import com.warrantrack.model.Bill;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BillRepository extends MongoRepository<Bill, String> {

    Page<Bill> findByRetailerIdOrderByCreatedAtDesc(String retailerId, Pageable pageable);

    Optional<Bill> findByIdAndRetailerId(String id, String retailerId);

    Optional<Bill> findByInvoiceNumber(String invoiceNumber);

    boolean existsByInvoiceNumber(String invoiceNumber);

    List<Bill> findByCustomerEmailOrderByCreatedAtDesc(String customerEmail);

    List<Bill> findByRetailerIdOrderByCreatedAtDesc(String retailerId);
}

