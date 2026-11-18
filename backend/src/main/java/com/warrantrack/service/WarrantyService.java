package com.warrantrack.service;

import com.warrantrack.dto.PagedResponse;
import com.warrantrack.dto.warranty.PublicWarrantyResponse;
import com.warrantrack.dto.warranty.WarrantyResponse;
import com.warrantrack.exception.ResourceNotFoundException;
import com.warrantrack.model.Product;
import com.warrantrack.model.Purchase;
import com.warrantrack.model.Retailer;
import com.warrantrack.model.Warranty;
import com.warrantrack.model.enums.WarrantyStatus;
import com.warrantrack.repository.ProductRepository;
import com.warrantrack.repository.PurchaseRepository;
import com.warrantrack.repository.RetailerRepository;
import com.warrantrack.repository.WarrantyRepository;
import com.warrantrack.util.DateCalculator;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

@Service
public class WarrantyService {

    private final WarrantyRepository warrantyRepository;
    private final ProductRepository productRepository;
    private final RetailerRepository retailerRepository;
    private final PurchaseRepository purchaseRepository;

    public WarrantyService(WarrantyRepository warrantyRepository, ProductRepository productRepository,
            RetailerRepository retailerRepository, PurchaseRepository purchaseRepository) {
        this.warrantyRepository = warrantyRepository;
        this.productRepository = productRepository;
        this.retailerRepository = retailerRepository;
        this.purchaseRepository = purchaseRepository;
    }

    public PagedResponse<WarrantyResponse> getCustomerWarranties(String customerId, Pageable pageable) {
        Page<Warranty> page = warrantyRepository.findByCustomerId(customerId, pageable);
        List<WarrantyResponse> list = page.getContent().stream()
                .map(this::mapToResponse)
                .toList();

        return PagedResponse.<WarrantyResponse>builder()
                .content(list)
                .page(page.getNumber())
                .size(page.getSize())
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .last(page.isLast())
                .build();
    }

    public WarrantyResponse getWarrantyById(String warrantyId) {
        Warranty warranty = warrantyRepository.findById(warrantyId)
                .orElseThrow(() -> new ResourceNotFoundException("Warranty", "id", warrantyId));
        return mapToResponse(warranty);
    }

    public PublicWarrantyResponse verifyPublicWarranty(String qrToken) {
        Warranty warranty = warrantyRepository.findByQrToken(qrToken)
                .orElseThrow(() -> new ResourceNotFoundException("No valid warranty record found for this QR token"));

        Product product = productRepository.findById(warranty.getProductId()).orElse(null);
        Retailer retailer = retailerRepository.findById(warranty.getRetailerId()).orElse(null);
        Purchase purchase = warranty.getPurchaseId() != null
                ? purchaseRepository.findById(warranty.getPurchaseId()).orElse(null)
                : null;
        String serialNumber = (warranty.getSerialNumber() != null && !warranty.getSerialNumber().isBlank())
                ? warranty.getSerialNumber()
                : (purchase != null ? purchase.getSerialNumber() : null);

        boolean currentlyValid = DateCalculator.isWarrantyValid(warranty.getStartDate(), warranty.getExpiryDate());

        return PublicWarrantyResponse.builder()
                .verificationStatus(currentlyValid ? "VERIFIED_ACTIVE" : "VERIFIED_EXPIRED")
                .productName(product != null ? product.getName() : warranty.getProductName())
                .productBrand(product != null ? product.getBrand() : (purchase != null && purchase.getProductBrand() != null ? purchase.getProductBrand() : "Unknown"))
                .productModel(product != null ? product.getModel() : (purchase != null && purchase.getProductModel() != null ? purchase.getProductModel() : "Unknown"))
                .serialNumber(serialNumber)
                .retailerBusinessName(retailer != null ? retailer.getBusinessName() : "Unknown Retailer")
                .startDate(warranty.getStartDate())
                .expiryDate(warranty.getExpiryDate())
                .status(currentlyValid ? WarrantyStatus.ACTIVE : WarrantyStatus.EXPIRED)
                .currentlyValid(currentlyValid)
                .termsSummary(warranty.getTermsSnapshot())
                .build();
    }

    public Warranty getWarrantyEntity(String warrantyId) {
        return warrantyRepository.findById(warrantyId)
                .orElseThrow(() -> new ResourceNotFoundException("Warranty", "id", warrantyId));
    }

    public WarrantyResponse mapToResponse(Warranty w) {
        Product product = productRepository.findById(w.getProductId()).orElse(null);
        Retailer retailer = retailerRepository.findById(w.getRetailerId()).orElse(null);
        Purchase purchase = w.getPurchaseId() != null
                ? purchaseRepository.findById(w.getPurchaseId()).orElse(null)
                : null;
        String serialNumber = (w.getSerialNumber() != null && !w.getSerialNumber().isBlank())
                ? w.getSerialNumber()
                : (purchase != null ? purchase.getSerialNumber() : null);
        String invoiceNumber = purchase != null ? purchase.getInvoiceNumber() : null;
        boolean eligible = DateCalculator.isWarrantyValid(w.getStartDate(), w.getExpiryDate());

        return WarrantyResponse.builder()
                .id(w.getId())
                .purchaseId(w.getPurchaseId())
                .retailerId(w.getRetailerId())
                .retailerBusinessName(retailer != null ? retailer.getBusinessName() : "Retailer")
                .customerId(w.getCustomerId())
                .productId(w.getProductId())
                .productName(w.getProductName())
                .productBrand(product != null ? product.getBrand() : (purchase != null && purchase.getProductBrand() != null ? purchase.getProductBrand() : ""))
                .productModel(product != null ? product.getModel() : (purchase != null && purchase.getProductModel() != null ? purchase.getProductModel() : ""))
                .serialNumber(serialNumber)
                .invoiceNumber(invoiceNumber)
                .startDate(w.getStartDate())
                .expiryDate(w.getExpiryDate())
                .status(w.getStatus())
                .termsSnapshot(w.getTermsSnapshot())
                .warrantyDurationSnapshot(w.getWarrantyDurationSnapshot())
                .warrantyUnitSnapshot(w.getWarrantyUnitSnapshot())
                .qrToken(w.getQrToken())
                .eligibleForClaim(eligible)
                .createdAt(w.getCreatedAt())
                .build();
    }
}
