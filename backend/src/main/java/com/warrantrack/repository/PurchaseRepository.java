package com.warrantrack.repository;

import com.warrantrack.model.Purchase;
import com.warrantrack.model.enums.LinkingStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PurchaseRepository extends MongoRepository<Purchase, String> {

    Page<Purchase> findByRetailerId(String retailerId, Pageable pageable);

    Page<Purchase> findByCustomerId(String customerId, Pageable pageable);

    List<Purchase> findByCustomerEmailNormalized(String customerEmailNormalized);

    List<Purchase> findByCustomerEmailNormalizedAndLinkingStatus(String customerEmailNormalized, LinkingStatus linkingStatus);

    boolean existsByRetailerIdAndPurchaseReference(String retailerId, String purchaseReference);

    boolean existsBySerialNumber(String serialNumber);

    boolean existsBySerialNumberIgnoreCase(String serialNumber);

    List<Purchase> findByBillId(String billId);

    Optional<Purchase> findBySerialNumber(String serialNumber);

    Optional<Purchase> findByRetailerIdAndProductIdAndSerialNumber(String retailerId, String productId, String serialNumber);
}
