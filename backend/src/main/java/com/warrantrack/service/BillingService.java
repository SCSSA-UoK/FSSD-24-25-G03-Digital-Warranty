package com.warrantrack.service;

import com.warrantrack.dto.PagedResponse;
import com.warrantrack.dto.billing.BillItemRequest;
import com.warrantrack.dto.billing.BillItemResponse;
import com.warrantrack.dto.billing.BillRequest;
import com.warrantrack.dto.billing.BillResponse;
import com.warrantrack.exception.BadRequestException;
import com.warrantrack.exception.DuplicateResourceException;
import com.warrantrack.exception.ResourceNotFoundException;
import com.warrantrack.exception.UnauthorizedException;
import com.warrantrack.model.*;
import com.warrantrack.model.enums.LinkingStatus;
import com.warrantrack.model.enums.NotificationType;
import com.warrantrack.model.enums.PaymentMethod;
import com.warrantrack.model.enums.WarrantyStatus;
import com.warrantrack.model.enums.WarrantyUnit;
import com.warrantrack.repository.BillRepository;
import com.warrantrack.repository.ProductRepository;
import com.warrantrack.repository.PurchaseRepository;
import com.warrantrack.repository.UserRepository;
import com.warrantrack.repository.WarrantyRepository;
import com.warrantrack.util.DateCalculator;
import com.warrantrack.util.EmailNormalizer;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.Instant;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

@Service
public class BillingService {

    private static final Logger log = LoggerFactory.getLogger(BillingService.class);
    private static final SecureRandom RANDOM = new SecureRandom();

    private final BillRepository billRepository;
    private final PurchaseRepository purchaseRepository;
    private final WarrantyRepository warrantyRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final RetailerService retailerService;
    private final NotificationService notificationService;
    private final AuditService auditService;

    public BillingService(BillRepository billRepository,
                          PurchaseRepository purchaseRepository,
                          WarrantyRepository warrantyRepository,
                          ProductRepository productRepository,
                          UserRepository userRepository,
                          RetailerService retailerService,
                          NotificationService notificationService,
                          AuditService auditService) {
        this.billRepository = billRepository;
        this.purchaseRepository = purchaseRepository;
        this.warrantyRepository = warrantyRepository;
        this.productRepository = productRepository;
        this.userRepository = userRepository;
        this.retailerService = retailerService;
        this.notificationService = notificationService;
        this.auditService = auditService;
    }

    @Transactional
    public BillResponse createBill(String userId, BillRequest request) {
        Retailer retailer = retailerService.getApprovedRetailerByUserId(userId);
        String retailerId = retailer.getId();

        if (request.getItems() == null || request.getItems().isEmpty()) {
            throw new BadRequestException("Bill must contain at least one line item.");
        }

        // 1. Generate unique invoice number
        String invoiceNumber = generateInvoiceNumber();

        // 2. Identify customer if email provided
        String customerEmail = (request.getCustomerEmail() != null && !request.getCustomerEmail().isBlank())
                ? request.getCustomerEmail().trim() : null;
        String normalizedCustomerEmail = customerEmail != null ? EmailNormalizer.normalize(customerEmail) : null;
        String customerId = null;
        LinkingStatus linkingStatus = LinkingStatus.UNCLAIMED;

        if (normalizedCustomerEmail != null) {
            Optional<User> matchingCustomer = userRepository.findByEmailNormalized(normalizedCustomerEmail);
            if (matchingCustomer.isPresent()) {
                User customer = matchingCustomer.get();
                if (customer.isEmailVerified()) {
                    customerId = customer.getId();
                    linkingStatus = LinkingStatus.LINKED;
                } else {
                    linkingStatus = LinkingStatus.PENDING_VERIFICATION;
                }
            }
        }

        PaymentMethod paymentMethod = request.getPaymentMethod() != null ? request.getPaymentMethod() : PaymentMethod.CASH;

        // 3. Process each line item
        List<BillItem> billItems = new ArrayList<>();
        List<Purchase> createdPurchases = new ArrayList<>();
        // Validate inventory stock availability before processing sale
        for (BillItemRequest itemReq : request.getItems()) {
            if (itemReq.getProductId() != null && !itemReq.getProductId().isBlank()) {
                Product product = productRepository.findById(itemReq.getProductId()).orElse(null);
                if (product != null) {
                    int requestedQty = Math.max(1, itemReq.getQuantity());
                    int availableStock = product.getStockQuantity() != null ? product.getStockQuantity() : 0;
                    if (availableStock <= 0) {
                        throw new BadRequestException("Product '" + product.getName() + "' is out of stock.");
                    }
                    if (availableStock < requestedQty) {
                        throw new BadRequestException("Requested quantity (" + requestedQty + ") for product '" 
                                + product.getName() + "' exceeds available stock (" + availableStock + ").");
                    }
                }
            }
        }

        // Validate serial number uniqueness: intra-bill duplicates and existing purchases
        Set<String> seenSerials = new HashSet<>();
        for (BillItemRequest itemReq : request.getItems()) {
            if (itemReq.getSerialNumber() != null && !itemReq.getSerialNumber().isBlank()) {
                String sn = itemReq.getSerialNumber().trim();
                if (!seenSerials.add(sn.toLowerCase())) {
                    throw new BadRequestException("Duplicate serial number '" + sn + "' found in this bill. Each physical item must have a unique serial number.");
                }
                if (purchaseRepository.existsBySerialNumber(sn)) {
                    throw new DuplicateResourceException("A purchase with serial number '" + sn + "' already exists. Purchase cannot be completed with duplicate serial number.");
                }
            }
        }

        double subtotal = 0.0;
        int warrantyCount = 0;

        for (BillItemRequest itemReq : request.getItems()) {
            double unitPrice = itemReq.getUnitPrice() != null ? itemReq.getUnitPrice() : 0.0;
            int qty = Math.max(1, itemReq.getQuantity());
            double lineTotal = Math.round(unitPrice * qty * 100.0) / 100.0;
            subtotal += lineTotal;

            // Product lookup if provided
            Product product = null;
            if (itemReq.getProductId() != null && !itemReq.getProductId().isBlank()) {
                product = productRepository.findById(itemReq.getProductId()).orElse(null);
            }

            // Determine if warranty applies
            boolean itemHasWarranty = !Boolean.FALSE.equals(itemReq.getHasWarranty());
            if (product != null && !product.isHasWarranty()) {
                itemHasWarranty = false;
            }

            String purchaseId = null;
            String warrantyId = null;
            String qrToken = null;
            LocalDate expiryDate = null;
            Integer duration = null;
            WarrantyUnit unit = null;
            String terms = null;

            LocalDate startDate = LocalDate.now();

            if (itemHasWarranty) {
                duration = (itemReq.getWarrantyDuration() != null && itemReq.getWarrantyDuration() > 0)
                        ? itemReq.getWarrantyDuration()
                        : (product != null && product.getWarrantyDuration() > 0 ? product.getWarrantyDuration() : 12);

                unit = itemReq.getWarrantyUnit() != null
                        ? itemReq.getWarrantyUnit()
                        : (product != null && product.getWarrantyUnit() != null ? product.getWarrantyUnit() : WarrantyUnit.MONTHS);

                terms = (itemReq.getWarrantyTerms() != null && !itemReq.getWarrantyTerms().isBlank())
                        ? itemReq.getWarrantyTerms().trim()
                        : (product != null && product.getWarrantyTerms() != null ? product.getWarrantyTerms() : "Standard manufacturer warranty");

                expiryDate = DateCalculator.calculateExpiryDate(startDate, duration, unit);
                qrToken = UUID.randomUUID().toString();
            }

            String productIdToSave = (product != null) ? product.getId() : "item-" + UUID.randomUUID().toString().substring(0, 8);
            String serialNum = (itemReq.getSerialNumber() != null && !itemReq.getSerialNumber().isBlank())
                    ? itemReq.getSerialNumber().trim() : null;
            String pName = itemReq.getProductName().trim();
            String pBrand = itemReq.getBrand() != null ? itemReq.getBrand().trim() : (product != null ? product.getBrand() : "");
            String pModel = product != null ? product.getModel() : "";

            // Create Purchase record for every line item (unified sales registry)
            Purchase purchase = Purchase.builder()
                    .retailerId(retailerId)
                    .productId(productIdToSave)
                    .productName(pName)
                    .productBrand(pBrand)
                    .productModel(pModel)
                    .unitPrice(unitPrice)
                    .quantity(qty)
                    .hasWarranty(itemHasWarranty)
                    .paymentMethod(paymentMethod.name())
                    .customerId(customerId)
                    .customerEmail(customerEmail != null ? customerEmail : "")
                    .customerEmailNormalized(normalizedCustomerEmail != null ? normalizedCustomerEmail : "")
                    .purchaseDate(startDate)
                    .serialNumber(serialNum)
                    .invoiceNumber(invoiceNumber)
                    .purchaseReference(generatePurchaseReference())
                    .linkingStatus(linkingStatus)
                    .registeredBy(userId)
                    .createdAt(Instant.now())
                    .updatedAt(Instant.now())
                    .build();

            purchase = purchaseRepository.save(purchase);
            purchaseId = purchase.getId();
            createdPurchases.add(purchase);

            // Deduct inventory stock if catalog product
            if (product != null && product.getStockQuantity() != null && product.getStockQuantity() > 0) {
                product.setStockQuantity(Math.max(0, product.getStockQuantity() - qty));
                productRepository.save(product);
            }

            if (itemHasWarranty) {
                // Create Warranty record
                Warranty warranty = Warranty.builder()
                        .purchaseId(purchase.getId())
                        .retailerId(retailerId)
                        .customerId(customerId)
                        .productId(productIdToSave)
                        .productName(pName)
                        .startDate(startDate)
                        .expiryDate(expiryDate)
                        .status(WarrantyStatus.ACTIVE)
                        .termsSnapshot(terms)
                        .warrantyDurationSnapshot(duration)
                        .warrantyUnitSnapshot(unit)
                        .qrToken(qrToken)
                        .createdAt(Instant.now())
                        .updatedAt(Instant.now())
                        .build();

                warranty = warrantyRepository.save(warranty);
                warrantyId = warranty.getId();
                warrantyCount++;

                // Notify linked customer
                if (customerId != null) {
                    notificationService.sendNotification(
                            customerId,
                            NotificationType.PURCHASE_LINKED,
                            String.format("New purchase '%s' with warranty until %s has been added to your account (Invoice: %s).",
                                    pName, expiryDate, invoiceNumber),
                            warranty.getId(),
                            "Warranty"
                    );
                }
            }

            BillItem billItem = BillItem.builder()
                    .productId(itemReq.getProductId())
                    .productName(pName)
                    .brand(pBrand)
                    .category(itemReq.getCategory() != null ? itemReq.getCategory().trim() : (product != null ? product.getCategory() : null))
                    .serialNumber(serialNum)
                    .quantity(qty)
                    .unitPrice(unitPrice)
                    .lineTotal(lineTotal)
                    .hasWarranty(itemHasWarranty)
                    .warrantyDuration(duration)
                    .warrantyUnit(unit)
                    .warrantyTerms(terms)
                    .purchaseId(purchaseId)
                    .warrantyId(warrantyId)
                    .qrToken(qrToken)
                    .warrantyExpiryDate(expiryDate)
                    .build();

            billItems.add(billItem);
        }

        // 4. Calculate totals
        subtotal = Math.round(subtotal * 100.0) / 100.0;
        double discount = request.getDiscountAmount() != null ? Math.max(0.0, request.getDiscountAmount()) : 0.0;
        double tax = request.getTaxAmount() != null ? Math.max(0.0, request.getTaxAmount()) : 0.0;
        double grandTotal = Math.max(0.0, Math.round((subtotal - discount + tax) * 100.0) / 100.0);

        // 5. Build and save Bill document
        Bill bill = Bill.builder()
                .invoiceNumber(invoiceNumber)
                .retailerId(retailerId)
                .retailerBusinessName(retailer.getBusinessName())
                .retailerContactEmail(retailer.getContactEmail())
                .retailerContactPhone(retailer.getContactPhone())
                .retailerAddress(retailer.getAddress())
                .customerName(request.getCustomerName() != null ? request.getCustomerName().trim() : "Walk-in Customer")
                .customerEmail(customerEmail)
                .customerPhone(request.getCustomerPhone() != null ? request.getCustomerPhone().trim() : null)
                .items(billItems)
                .subtotal(subtotal)
                .discountAmount(discount)
                .taxAmount(tax)
                .grandTotal(grandTotal)
                .paymentMethod(paymentMethod)
                .paymentNotes(request.getPaymentNotes())
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();

        bill = billRepository.save(bill);

        // Link billId back into all purchases in this transaction
        for (Purchase p : createdPurchases) {
            p.setBillId(bill.getId());
            purchaseRepository.save(p);
        }

        auditService.logAction(userId, retailer.getContactEmail(), "BILL_GENERATED", "Bill", bill.getId(),
                String.format("Invoice: %s, Items: %d, Warranties created: %d, Total: %.2f",
                        invoiceNumber, billItems.size(), warrantyCount, grandTotal));

        log.info("Bill created successfully: invoiceNumber={}, retailerId={}, total={}, warrantiesCreated={}",
                invoiceNumber, retailerId, grandTotal, warrantyCount);

        return mapToResponse(bill);
    }

    public PagedResponse<BillResponse> getRetailerBills(String userId, Pageable pageable) {
        Retailer retailer = retailerService.getRetailerByUserId(userId);
        Page<Bill> page = billRepository.findByRetailerIdOrderByCreatedAtDesc(retailer.getId(), pageable);

        List<BillResponse> content = page.getContent().stream()
                .map(this::mapToResponse)
                .toList();

        return PagedResponse.<BillResponse>builder()
                .content(content)
                .page(page.getNumber())
                .size(page.getSize())
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .last(page.isLast())
                .build();
    }

    public BillResponse getBillById(String userId, String billId) {
        Retailer retailer = retailerService.getRetailerByUserId(userId);
        Bill bill = billRepository.findByIdAndRetailerId(billId, retailer.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Bill", "id", billId));

        return mapToResponse(bill);
    }

    public BillResponse getBillByInvoiceNumber(String invoiceNumber) {
        Bill bill = billRepository.findByInvoiceNumber(invoiceNumber.trim().toUpperCase())
                .orElseThrow(() -> new ResourceNotFoundException("Bill", "invoiceNumber", invoiceNumber));

        return mapToResponse(bill);
    }

    public BillResponse mapToResponse(Bill b) {
        List<BillItemResponse> itemResponses = b.getItems().stream()
                .map(i -> BillItemResponse.builder()
                        .productId(i.getProductId())
                        .productName(i.getProductName())
                        .brand(i.getBrand())
                        .category(i.getCategory())
                        .serialNumber(i.getSerialNumber())
                        .quantity(i.getQuantity())
                        .unitPrice(i.getUnitPrice())
                        .lineTotal(i.getLineTotal())
                        .hasWarranty(i.isHasWarranty())
                        .warrantyDuration(i.getWarrantyDuration())
                        .warrantyUnit(i.getWarrantyUnit())
                        .warrantyTerms(i.getWarrantyTerms())
                        .purchaseId(i.getPurchaseId())
                        .warrantyId(i.getWarrantyId())
                        .qrToken(i.getQrToken())
                        .warrantyExpiryDate(i.getWarrantyExpiryDate())
                        .build())
                .toList();

        return BillResponse.builder()
                .id(b.getId())
                .invoiceNumber(b.getInvoiceNumber())
                .retailerId(b.getRetailerId())
                .retailerBusinessName(b.getRetailerBusinessName())
                .retailerContactEmail(b.getRetailerContactEmail())
                .retailerContactPhone(b.getRetailerContactPhone())
                .retailerAddress(b.getRetailerAddress())
                .customerName(b.getCustomerName())
                .customerEmail(b.getCustomerEmail())
                .customerPhone(b.getCustomerPhone())
                .items(itemResponses)
                .subtotal(b.getSubtotal())
                .discountAmount(b.getDiscountAmount())
                .taxAmount(b.getTaxAmount())
                .grandTotal(b.getGrandTotal())
                .paymentMethod(b.getPaymentMethod())
                .paymentNotes(b.getPaymentNotes())
                .createdAt(b.getCreatedAt())
                .updatedAt(b.getUpdatedAt())
                .build();
    }

    private String generateInvoiceNumber() {
        String datePart = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        String invoiceNumber;
        do {
            int randomSuffix = 1000 + RANDOM.nextInt(9000);
            invoiceNumber = "INV-" + datePart + "-" + randomSuffix;
        } while (billRepository.existsByInvoiceNumber(invoiceNumber));
        return invoiceNumber;
    }

    private String generatePurchaseReference() {
        return "PUR-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
    }
}

