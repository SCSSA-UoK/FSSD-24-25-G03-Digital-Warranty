package com.warrantrack.service;


import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import com.warrantrack.dto.PagedResponse;
import com.warrantrack.dto.purchase.PurchaseRegistrationRequest;
import com.warrantrack.dto.purchase.PurchaseResponse;
import com.warrantrack.exception.BadRequestException;
import com.warrantrack.exception.DuplicateResourceException;
import com.warrantrack.exception.ResourceNotFoundException;
import com.warrantrack.model.Product;
import com.warrantrack.model.Purchase;
import com.warrantrack.model.Retailer;
import com.warrantrack.model.User;
import com.warrantrack.model.Warranty;
import com.warrantrack.model.enums.LinkingStatus;
import com.warrantrack.model.enums.NotificationType;
import com.warrantrack.model.enums.WarrantyStatus;
import com.warrantrack.model.Bill;
import com.warrantrack.model.BillItem;
import com.warrantrack.model.enums.PaymentMethod;
import com.warrantrack.repository.BillRepository;
import com.warrantrack.repository.ProductRepository;
import com.warrantrack.repository.PurchaseRepository;
import com.warrantrack.repository.UserRepository;
import com.warrantrack.repository.WarrantyRepository;
import com.warrantrack.util.DateCalculator;
import com.warrantrack.util.EmailNormalizer;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class PurchaseService {
    private static final Logger log = LoggerFactory.getLogger(PurchaseService.class);


    private final PurchaseRepository purchaseRepository;
    private final WarrantyRepository warrantyRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final RetailerService retailerService;
    private final WarrantyService warrantyService;
    private final NotificationService notificationService;
    private final AuditService auditService;
    private final BillRepository billRepository;

    public PurchaseService(PurchaseRepository purchaseRepository, WarrantyRepository warrantyRepository, ProductRepository productRepository, UserRepository userRepository, RetailerService retailerService, WarrantyService warrantyService, NotificationService notificationService, AuditService auditService, BillRepository billRepository) {
        this.purchaseRepository = purchaseRepository;
        this.warrantyRepository = warrantyRepository;
        this.productRepository = productRepository;
        this.userRepository = userRepository;
        this.retailerService = retailerService;
        this.warrantyService = warrantyService;
        this.notificationService = notificationService;
        this.auditService = auditService;
        this.billRepository = billRepository;
    }

    private static final SecureRandom RANDOM = new SecureRandom();

    @Transactional
    public PurchaseResponse registerPurchase(String userId, PurchaseRegistrationRequest request) {
        Retailer retailer = retailerService.getApprovedRetailerByUserId(userId);
        String retailerId = retailer.getId();

        // 1. Idempotency Check: Return existing purchase if reference was already registered
        if (request.getPurchaseReference() != null && !request.getPurchaseReference().isBlank()) {
            Optional<Purchase> existing = purchaseRepository.findAll().stream()
                    .filter(p -> retailerId.equals(p.getRetailerId()) && request.getPurchaseReference().equalsIgnoreCase(p.getPurchaseReference()))
                    .findFirst();
            if (existing.isPresent()) {
                log.info("Idempotent retry for purchaseReference: {}", request.getPurchaseReference());
                return mapToResponse(existing.get());
            }
        }

        // 2. Validate product exists and belongs to this retailer
        Product product = productRepository.findById(request.getProductId())
                .orElseThrow(() -> new ResourceNotFoundException("Product", "id", request.getProductId()));

        if (!product.getRetailerId().equals(retailerId)) {
            throw new BadRequestException("Selected product does not belong to your business");
        }

        // Stock check
        if (product.getStockQuantity() != null && product.getStockQuantity() <= 0) {
            throw new BadRequestException("Product '" + product.getName() + "' is currently out of stock.");
        }

        // 3. Serial Number duplicate check: enforce uniqueness per physical device
        if (request.getSerialNumber() != null && !request.getSerialNumber().isBlank()) {
            String trimmedSerial = request.getSerialNumber().trim();
            if (purchaseRepository.existsBySerialNumber(trimmedSerial)) {
                throw new DuplicateResourceException(String.format(
                        "A purchase with serial number '%s' already exists. Duplicate serial numbers are not allowed and this purchase cannot be completed.",
                        trimmedSerial));
            }
        }

        // 4. Generate unique purchase reference if not provided
        String purchaseRef = (request.getPurchaseReference() != null && !request.getPurchaseReference().isBlank())
                ? request.getPurchaseReference().trim().toUpperCase()
                : generatePurchaseReference();

        // Check uniqueness of reference for this retailer
        if (purchaseRepository.existsByRetailerIdAndPurchaseReference(retailerId, purchaseRef)) {
            throw new DuplicateResourceException("Purchase reference '" + purchaseRef + "' is already in use.");
        }

        // 5. Customer email normalization and account linking check
        String customerEmail = request.getCustomerEmail().trim();
        String normalizedCustomerEmail = EmailNormalizer.normalize(customerEmail);

        Optional<User> matchingCustomer = userRepository.findByEmailNormalized(normalizedCustomerEmail);
        String customerId = null;
        LinkingStatus linkingStatus = LinkingStatus.UNCLAIMED;

        if (matchingCustomer.isPresent()) {
            User customer = matchingCustomer.get();
            if (customer.isEmailVerified()) {
                // Verified customer account exists: auto-link
                customerId = customer.getId();
                linkingStatus = LinkingStatus.LINKED;
            } else {
                linkingStatus = LinkingStatus.PENDING_VERIFICATION;
            }
        }

        // 6. Check if warranty applies
        boolean warrantyApplies = !Boolean.FALSE.equals(request.getHasWarranty()) && product.isHasWarranty();

        // 7. Sync with Bill: Create a Bill record if one doesn't exist for this invoice number
        String invoiceNum = request.getInvoiceNumber().trim();
        Bill bill = billRepository.findByInvoiceNumber(invoiceNum).orElse(null);
        if (bill == null) {
            double price = product.getPrice() != null ? product.getPrice() : 0.0;
            BillItem bItem = BillItem.builder()
                    .productId(product.getId())
                    .productName(product.getName())
                    .brand(product.getBrand())
                    .category(product.getCategory())
                    .serialNumber(request.getSerialNumber() != null ? request.getSerialNumber().trim() : null)
                    .quantity(1)
                    .unitPrice(price)
                    .lineTotal(price)
                    .hasWarranty(warrantyApplies)
                    .warrantyDuration(warrantyApplies ? product.getWarrantyDuration() : 0)
                    .warrantyUnit(warrantyApplies ? product.getWarrantyUnit() : null)
                    .warrantyTerms(warrantyApplies ? product.getWarrantyTerms() : "No warranty provided")
                    .build();

            bill = Bill.builder()
                    .invoiceNumber(invoiceNum)
                    .retailerId(retailerId)
                    .retailerBusinessName(retailer.getBusinessName())
                    .retailerContactEmail(retailer.getContactEmail())
                    .retailerContactPhone(retailer.getContactPhone())
                    .retailerAddress(retailer.getAddress())
                    .customerName(matchingCustomer.map(User::getName).orElse(customerEmail))
                    .customerEmail(customerEmail)
                    .items(new java.util.ArrayList<>(List.of(bItem)))
                    .subtotal(price)
                    .discountAmount(0.0)
                    .taxAmount(0.0)
                    .grandTotal(price)
                    .paymentMethod(PaymentMethod.CASH)
                    .paymentNotes("Direct purchase registration")
                    .createdAt(Instant.now())
                    .updatedAt(Instant.now())
                    .build();
            bill = billRepository.save(bill);
        }

        // 8. Create Purchase document with product snapshots
        Purchase purchase = Purchase.builder()
                .retailerId(retailerId)
                .productId(product.getId())
                .productName(product.getName())
                .productBrand(product.getBrand())
                .productModel(product.getModel())
                .unitPrice(product.getPrice() != null ? product.getPrice() : 0.0)
                .quantity(1)
                .hasWarranty(warrantyApplies)
                .billId(bill.getId())
                .paymentMethod("CASH")
                .customerId(customerId)
                .customerEmail(customerEmail)
                .customerEmailNormalized(normalizedCustomerEmail)
                .purchaseDate(request.getPurchaseDate())
                .serialNumber(request.getSerialNumber() != null ? request.getSerialNumber().trim() : null)
                .invoiceNumber(invoiceNum)
                .purchaseReference(purchaseRef)
                .linkingStatus(linkingStatus)
                .registeredBy(userId)
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();

        purchase = purchaseRepository.save(purchase);

        // Deduct inventory stock
        if (product.getStockQuantity() != null && product.getStockQuantity() > 0) {
            product.setStockQuantity(product.getStockQuantity() - 1);
            productRepository.save(product);
        }

        PurchaseResponse response = mapToResponse(purchase);

        if (warrantyApplies) {
            LocalDate startDate = request.getPurchaseDate(); // Default: purchase date
            LocalDate expiryDate = DateCalculator.calculateExpiryDate(
                    startDate, product.getWarrantyDuration(), product.getWarrantyUnit());

            String qrToken = UUID.randomUUID().toString();

            // 9. Create Warranty document (within same transaction)
            Warranty warranty = Warranty.builder()
                    .purchaseId(purchase.getId())
                    .retailerId(retailerId)
                    .customerId(customerId)
                    .productId(product.getId())
                    .productName(product.getName())
                    .startDate(startDate)
                    .expiryDate(expiryDate)
                    .status(WarrantyStatus.ACTIVE)
                    .termsSnapshot(product.getWarrantyTerms())
                    .warrantyDurationSnapshot(product.getWarrantyDuration())
                    .warrantyUnitSnapshot(product.getWarrantyUnit())
                    .qrToken(qrToken)
                    .createdAt(Instant.now())
                    .updatedAt(Instant.now())
                    .build();

            warranty = warrantyRepository.save(warranty);

            // Update bill item with warranty details
            if (!bill.getItems().isEmpty()) {
                BillItem first = bill.getItems().get(0);
                first.setWarrantyId(warranty.getId());
                first.setQrToken(qrToken);
                first.setWarrantyExpiryDate(expiryDate);
                billRepository.save(bill);
            }

            // 10. Notify customer if linked
            if (customerId != null) {
                notificationService.sendNotification(
                        customerId,
                        NotificationType.PURCHASE_LINKED,
                        String.format("New purchase '%s' has been linked to your account with warranty until %s.",
                                product.getName(), expiryDate),
                        warranty.getId(),
                        "Warranty"
                );
            }

            auditService.logAction(userId, retailer.getContactEmail(), "PURCHASE_REGISTERED", "Purchase", purchase.getId(),
                    "Purchase ref: " + purchaseRef + ", Warranty ID: " + warranty.getId());

            response.setWarranty(warrantyService.mapToResponse(warranty));
        } else {
            auditService.logAction(userId, retailer.getContactEmail(), "NON_WARRANTY_PURCHASE_REGISTERED", "Purchase", purchase.getId(),
                    "Purchase ref: " + purchaseRef + " (Non-warranty product)");
            response.setWarranty(null);
        }

        return response;
    }

    public PagedResponse<PurchaseResponse> getRetailerPurchases(String userId, Pageable pageable) {
        Retailer retailer = retailerService.getRetailerByUserId(userId);
        Page<Purchase> page = purchaseRepository.findByRetailerId(retailer.getId(), pageable);

        List<PurchaseResponse> list = page.getContent().stream()
                .map(this::mapToResponse)
                .toList();

        return PagedResponse.<PurchaseResponse>builder()
                .content(list)
                .page(page.getNumber())
                .size(page.getSize())
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .last(page.isLast())
                .build();
    }

    public PurchaseResponse getPurchaseById(String userId, String purchaseId) {
        Retailer retailer = retailerService.getRetailerByUserId(userId);
        Purchase purchase = purchaseRepository.findById(purchaseId)
                .orElseThrow(() -> new ResourceNotFoundException("Purchase", "id", purchaseId));

        if (!purchase.getRetailerId().equals(retailer.getId())) {
            throw new BadRequestException("Access denied to purchase belonging to another retailer.");
        }

        return mapToResponse(purchase);
    }

    public PurchaseResponse mapToResponse(Purchase p) {
        Product product = (p.getProductId() != null && !p.getProductId().startsWith("item-") && !p.getProductId().startsWith("custom-"))
                ? productRepository.findById(p.getProductId()).orElse(null)
                : null;
        Warranty warranty = warrantyRepository.findByPurchaseId(p.getId()).orElse(null);

        String prodName = (p.getProductName() != null && !p.getProductName().isBlank())
                ? p.getProductName()
                : (product != null ? product.getName() : (warranty != null ? warranty.getProductName() : "Product"));

        String prodBrand = (p.getProductBrand() != null && !p.getProductBrand().isBlank())
                ? p.getProductBrand()
                : (product != null ? product.getBrand() : "");

        String prodModel = (p.getProductModel() != null && !p.getProductModel().isBlank())
                ? p.getProductModel()
                : (product != null ? product.getModel() : "");

        return PurchaseResponse.builder()
                .id(p.getId())
                .retailerId(p.getRetailerId())
                .productId(p.getProductId())
                .productName(prodName)
                .productBrand(prodBrand)
                .productModel(prodModel)
                .unitPrice(p.getUnitPrice())
                .quantity(p.getQuantity())
                .hasWarranty(p.isHasWarranty())
                .billId(p.getBillId())
                .paymentMethod(p.getPaymentMethod())
                .customerId(p.getCustomerId())
                .customerEmail(p.getCustomerEmail())
                .purchaseDate(p.getPurchaseDate())
                .serialNumber(p.getSerialNumber())
                .invoiceNumber(p.getInvoiceNumber())
                .purchaseReference(p.getPurchaseReference())
                .linkingStatus(p.getLinkingStatus())
                .createdAt(p.getCreatedAt())
                .warranty(warranty != null ? warrantyService.mapToResponse(warranty) : null)
                .build();
    }

    private String generatePurchaseReference() {
        int randomNum = 100000 + RANDOM.nextInt(900000);
        return "PUR-" + LocalDate.now().getYear() + "-" + randomNum;
    }
}

