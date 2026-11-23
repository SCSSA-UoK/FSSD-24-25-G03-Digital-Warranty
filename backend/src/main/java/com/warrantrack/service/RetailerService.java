package com.warrantrack.service;

import com.warrantrack.dto.retailer.CustomerLookupResponse;
import com.warrantrack.dto.retailer.RetailerResponse;
import com.warrantrack.exception.BadRequestException;
import com.warrantrack.exception.ResourceNotFoundException;
import com.warrantrack.exception.UnauthorizedException;
import com.warrantrack.model.Bill;
import com.warrantrack.model.Purchase;
import com.warrantrack.model.Retailer;
import com.warrantrack.model.SecondaryEmail;
import com.warrantrack.model.User;
import com.warrantrack.model.enums.ApprovalStatus;
import com.warrantrack.model.enums.Role;
import com.warrantrack.repository.BillRepository;
import com.warrantrack.repository.PurchaseRepository;
import com.warrantrack.repository.RetailerRepository;
import com.warrantrack.repository.UserRepository;
import com.warrantrack.repository.WarrantyRepository;
import com.warrantrack.util.EmailNormalizer;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
public class RetailerService {

    private final RetailerRepository retailerRepository;
    private final UserRepository userRepository;
    private final BillRepository billRepository;
    private final WarrantyRepository warrantyRepository;
    private final PurchaseRepository purchaseRepository;

    public RetailerService(RetailerRepository retailerRepository,
                           UserRepository userRepository,
                           BillRepository billRepository,
                           WarrantyRepository warrantyRepository,
                           PurchaseRepository purchaseRepository) {
        this.retailerRepository = retailerRepository;
        this.userRepository = userRepository;
        this.billRepository = billRepository;
        this.warrantyRepository = warrantyRepository;
        this.purchaseRepository = purchaseRepository;
    }

    public Retailer getRetailerByUserId(String userId) {
        return retailerRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Retailer profile not found for user: " + userId));
    }

    public Retailer getApprovedRetailerByUserId(String userId) {
        Retailer retailer = getRetailerByUserId(userId);
        if (retailer.getApprovalStatus() != ApprovalStatus.APPROVED) {
            throw new UnauthorizedException("Retailer account is " + retailer.getApprovalStatus() +
                    ". Only approved retailers can perform this action.");
        }
        return retailer;
    }

    public RetailerResponse getProfile(String userId) {
        Retailer retailer = getRetailerByUserId(userId);
        return mapToResponse(retailer);
    }

    public RetailerResponse updateProfile(String userId, RetailerResponse updateRequest) {
        Retailer retailer = getRetailerByUserId(userId);

        if (updateRequest.getBusinessName() != null && !updateRequest.getBusinessName().isBlank()) {
            retailer.setBusinessName(updateRequest.getBusinessName().trim());
        }
        if (updateRequest.getContactEmail() != null && !updateRequest.getContactEmail().isBlank()) {
            retailer.setContactEmail(updateRequest.getContactEmail().trim());
        }
        if (updateRequest.getContactPhone() != null && !updateRequest.getContactPhone().isBlank()) {
            retailer.setContactPhone(updateRequest.getContactPhone().trim());
        }
        if (updateRequest.getAddress() != null && !updateRequest.getAddress().isBlank()) {
            retailer.setAddress(updateRequest.getAddress().trim());
        }
        if (updateRequest.getDescription() != null) {
            retailer.setDescription(updateRequest.getDescription().trim());
        }

        retailer.setUpdatedAt(Instant.now());
        retailer = retailerRepository.save(retailer);

        return mapToResponse(retailer);
    }

    public List<CustomerLookupResponse> lookupCustomers(String userId, String query) {
        // Enforce multi-tenant isolation: retailer ID is derived from the authenticated session
        Retailer retailer = getApprovedRetailerByUserId(userId);
        String retailerId = retailer.getId();

        String rawQuery = query != null ? query.trim() : "";
        String cleanQ = rawQuery.toLowerCase();
        String phoneDigits = rawQuery.replaceAll("[^0-9]", "");
        String normalizedEmail = !rawQuery.isBlank() ? EmailNormalizer.normalize(rawQuery) : "";

        DateTimeFormatter dateFormatter = DateTimeFormatter.ofPattern("yyyy-MM-dd")
                .withZone(ZoneId.systemDefault());

        Map<String, CustomerLookupResponse> resultMap = new LinkedHashMap<>();

        // Multi-tenant database query: fetch only bills and purchases belonging to THIS retailer
        List<Bill> retailerBills = billRepository.findByRetailerIdOrderByCreatedAtDesc(retailerId);
        List<Purchase> retailerPurchases = purchaseRepository.findByRetailerIdOrderByCreatedAtDesc(retailerId);

        // Extract tenant customer identifiers (strictly from this retailer's own historical sales)
        Set<String> tenantCustomerUserIds = new HashSet<>();
        Set<String> tenantCustomerEmailsNorm = new HashSet<>();
        Set<String> tenantCustomerPhones = new HashSet<>();

        for (Bill b : retailerBills) {
            if (b.getCustomerEmail() != null && !b.getCustomerEmail().isBlank()) {
                tenantCustomerEmailsNorm.add(EmailNormalizer.normalize(b.getCustomerEmail()));
            }
            if (b.getCustomerPhone() != null && !b.getCustomerPhone().isBlank()) {
                tenantCustomerPhones.add(b.getCustomerPhone().trim());
            }
        }

        for (Purchase p : retailerPurchases) {
            if (p.getCustomerId() != null && !p.getCustomerId().isBlank()) {
                tenantCustomerUserIds.add(p.getCustomerId().trim());
            }
            if (p.getCustomerEmailNormalized() != null && !p.getCustomerEmailNormalized().isBlank()) {
                tenantCustomerEmailsNorm.add(p.getCustomerEmailNormalized().trim());
            } else if (p.getCustomerEmail() != null && !p.getCustomerEmail().isBlank()) {
                tenantCustomerEmailsNorm.add(EmailNormalizer.normalize(p.getCustomerEmail()));
            }
        }

        // If this retailer has never had any customer transaction, return empty immediately
        if (tenantCustomerUserIds.isEmpty() && tenantCustomerEmailsNorm.isEmpty() && tenantCustomerPhones.isEmpty()) {
            return Collections.emptyList();
        }

        // Multi-tenant database query: fetch only registered users who match THIS retailer's customer records
        Collection<String> queryUserIds = tenantCustomerUserIds.isEmpty() ? Set.of("__none__") : tenantCustomerUserIds;
        Collection<String> queryEmails = tenantCustomerEmailsNorm.isEmpty() ? Set.of("__none__") : tenantCustomerEmailsNorm;
        Collection<String> queryPhones = tenantCustomerPhones.isEmpty() ? Set.of("__none__") : tenantCustomerPhones;

        List<User> registeredCustomers = userRepository.findRegisteredCustomersByRetailerCustomerIdentifiers(
                queryUserIds, queryEmails, queryPhones
        );

        Set<String> registeredEmailsNormalized = new HashSet<>();
        Set<String> registeredPhoneDigits = new HashSet<>();

        // 1. Process registered customers who have transacted with THIS retailer
        for (User user : registeredCustomers) {
            String uId = user.getId();
            String uName = user.getName() != null ? user.getName().toLowerCase() : "";
            String uEmail = user.getEmail() != null ? user.getEmail().toLowerCase() : "";
            String uEmailNorm = user.getEmailNormalized() != null ? user.getEmailNormalized() : "";
            String uPhone = user.getPhone() != null ? user.getPhone() : "";
            String uPhoneDigits = uPhone.replaceAll("[^0-9]", "");

            Set<String> userEmailsNorm = new HashSet<>();
            if (!uEmailNorm.isBlank()) userEmailsNorm.add(uEmailNorm);
            if (user.getSecondaryEmails() != null) {
                for (SecondaryEmail se : user.getSecondaryEmails()) {
                    if (se != null && se.getEmailNormalized() != null && !se.getEmailNormalized().isBlank()) {
                        userEmailsNorm.add(se.getEmailNormalized());
                    }
                }
            }

            // Find all bills for this user with THIS retailer only
            List<Bill> matchingBills = retailerBills.stream()
                    .filter(b -> {
                        if (b.getCustomerEmail() != null && !b.getCustomerEmail().isBlank()) {
                            if (userEmailsNorm.contains(EmailNormalizer.normalize(b.getCustomerEmail()))) {
                                return true;
                            }
                        }
                        if (b.getCustomerPhone() != null && !b.getCustomerPhone().isBlank() && !uPhoneDigits.isEmpty()) {
                            if (b.getCustomerPhone().replaceAll("[^0-9]", "").equals(uPhoneDigits)) {
                                return true;
                            }
                        }
                        return false;
                    })
                    .toList();

            // Find all purchases for this user with THIS retailer only
            List<Purchase> matchingPurchases = retailerPurchases.stream()
                    .filter(p -> {
                        if (p.getCustomerId() != null && p.getCustomerId().equals(uId)) {
                            return true;
                        }
                        if (p.getCustomerEmailNormalized() != null && userEmailsNorm.contains(p.getCustomerEmailNormalized())) {
                            return true;
                        }
                        if (p.getCustomerEmail() != null && userEmailsNorm.contains(EmailNormalizer.normalize(p.getCustomerEmail()))) {
                            return true;
                        }
                        return false;
                    })
                    .toList();

            // Strictly enforce: customer MUST have previous transactions with this retailer
            if (matchingBills.isEmpty() && matchingPurchases.isEmpty()) {
                continue;
            }

            // Check if matches the search query
            boolean matchesQuery = false;
            String matchType = "PREVIOUS_CUSTOMER";

            if (cleanQ.isEmpty()) {
                matchesQuery = true;
            } else {
                boolean exactEmail = !normalizedEmail.isEmpty() && (userEmailsNorm.contains(normalizedEmail) || uEmail.equals(cleanQ));
                boolean exactPhone = !phoneDigits.isEmpty() && uPhoneDigits.equals(phoneDigits);
                boolean emailContains = !cleanQ.isEmpty() && (uEmail.contains(cleanQ) || userEmailsNorm.stream().anyMatch(e -> e.contains(cleanQ)));
                boolean phoneContains = !phoneDigits.isEmpty() && phoneDigits.length() >= 3 && uPhoneDigits.contains(phoneDigits);
                boolean nameContains = !cleanQ.isEmpty() && uName.contains(cleanQ);

                if (exactEmail || exactPhone || emailContains || phoneContains || nameContains) {
                    matchesQuery = true;
                    matchType = exactPhone ? "EXACT_PHONE"
                            : exactEmail ? "EXACT_EMAIL"
                            : (phoneContains || emailContains) ? "CONTACT_MATCH" : "NAME_MATCH";
                }
            }

            if (matchesQuery) {
                // Strict isolation: count ONLY warranties issued by THIS retailer
                long totalWarranties = warrantyRepository.countByCustomerIdAndRetailerId(user.getId(), retailerId);

                // Transaction count with THIS retailer only
                long billCount = matchingBills.size();
                long standalonePurchases = matchingPurchases.stream()
                        .filter(p -> p.getBillId() == null || p.getBillId().isBlank())
                        .count();
                long previousPurchases = Math.max(1, billCount + standalonePurchases);

                // Last purchase date with THIS retailer only
                Instant latestDate = null;
                if (!matchingBills.isEmpty() && matchingBills.get(0).getCreatedAt() != null) {
                    latestDate = matchingBills.get(0).getCreatedAt();
                }
                if (!matchingPurchases.isEmpty() && matchingPurchases.get(0).getCreatedAt() != null) {
                    Instant pDate = matchingPurchases.get(0).getCreatedAt();
                    if (latestDate == null || pDate.isAfter(latestDate)) {
                        latestDate = pDate;
                    }
                }
                String lastPurchaseDate = latestDate != null ? dateFormatter.format(latestDate) : null;

                CustomerLookupResponse resp = CustomerLookupResponse.builder()
                        .id(user.getId())
                        .name(user.getName())
                        .email(user.getEmail())
                        .phone(user.getPhone())
                        .isRegistered(true)
                        .isEmailVerified(user.isEmailVerified())
                        .accountStatus(user.getAccountStatus() != null ? user.getAccountStatus().name() : "ACTIVE")
                        .totalWarranties(totalWarranties)
                        .previousPurchasesWithRetailer(previousPurchases)
                        .lastPurchaseDate(lastPurchaseDate)
                        .matchType(matchType)
                        .build();

                String key = !uEmailNorm.isEmpty() ? uEmailNorm : user.getPhone();
                if (key != null) {
                    resultMap.put(key, resp);
                    registeredEmailsNormalized.addAll(userEmailsNorm);
                    if (!uPhoneDigits.isEmpty()) {
                        registeredPhoneDigits.add(uPhoneDigits);
                    }
                }
            }
        }

        // 2. Process unregistered in-store customers from past Bills of THIS retailer
        for (Bill bill : retailerBills) {
            String bName = bill.getCustomerName() != null ? bill.getCustomerName().toLowerCase() : "";
            String bEmail = bill.getCustomerEmail() != null ? bill.getCustomerEmail().toLowerCase() : "";
            String bEmailNorm = bill.getCustomerEmail() != null ? EmailNormalizer.normalize(bill.getCustomerEmail()) : "";
            String bPhone = bill.getCustomerPhone() != null ? bill.getCustomerPhone() : "";
            String bPhoneDigits = bPhone.replaceAll("[^0-9]", "");

            // If already included as registered customer, skip to prevent duplicates
            if (!bEmailNorm.isEmpty() && registeredEmailsNormalized.contains(bEmailNorm)) {
                continue;
            }
            if (!bPhoneDigits.isEmpty() && registeredPhoneDigits.contains(bPhoneDigits)) {
                continue;
            }

            String key = !bEmailNorm.isEmpty() ? bEmailNorm : bPhone;
            if (key == null || key.isBlank() || resultMap.containsKey(key)) {
                continue;
            }

            if (cleanQ.isEmpty()) {
                CustomerLookupResponse item = buildFromBill(bill, retailerBills, dateFormatter);
                resultMap.put(key, item);
                if (resultMap.size() >= 10) break;
            } else {
                boolean exactEmail = !normalizedEmail.isEmpty() && (bEmailNorm.equals(normalizedEmail) || bEmail.equals(cleanQ));
                boolean exactPhone = !phoneDigits.isEmpty() && bPhoneDigits.equals(phoneDigits);
                boolean emailContains = !cleanQ.isEmpty() && bEmail.contains(cleanQ);
                boolean phoneContains = !phoneDigits.isEmpty() && phoneDigits.length() >= 3 && bPhoneDigits.contains(phoneDigits);
                boolean nameContains = !cleanQ.isEmpty() && bName.contains(cleanQ);

                if (exactEmail || exactPhone || emailContains || phoneContains || nameContains) {
                    CustomerLookupResponse item = buildFromBill(bill, retailerBills, dateFormatter);
                    item.setMatchType(exactPhone ? "EXACT_PHONE" : exactEmail ? "EXACT_EMAIL" : "PREVIOUS_CUSTOMER");
                    resultMap.put(key, item);
                }
            }
        }

        // 3. Sort results: EXACT matches first, then registered active users, then previous customers
        List<CustomerLookupResponse> list = new ArrayList<>(resultMap.values());
        list.sort((a, b) -> {
            boolean aExact = "EXACT_PHONE".equals(a.getMatchType()) || "EXACT_EMAIL".equals(a.getMatchType());
            boolean bExact = "EXACT_PHONE".equals(b.getMatchType()) || "EXACT_EMAIL".equals(b.getMatchType());
            if (aExact && !bExact) return -1;
            if (!aExact && bExact) return 1;

            if (a.isRegistered() && !b.isRegistered()) return -1;
            if (!a.isRegistered() && b.isRegistered()) return 1;

            return Long.compare(b.getPreviousPurchasesWithRetailer(), a.getPreviousPurchasesWithRetailer());
        });

        if (list.size() > 10) {
            return list.subList(0, 10);
        }
        return list;
    }

    private CustomerLookupResponse buildFromBill(Bill bill, List<Bill> retailerBills, DateTimeFormatter dateFormatter) {
        String bEmailNorm = bill.getCustomerEmail() != null ? EmailNormalizer.normalize(bill.getCustomerEmail()) : "";
        String bPhoneDigits = bill.getCustomerPhone() != null ? bill.getCustomerPhone().replaceAll("[^0-9]", "") : "";

        long previousCount = retailerBills.stream()
                .filter(b -> (!bEmailNorm.isEmpty() && b.getCustomerEmail() != null && EmailNormalizer.normalize(b.getCustomerEmail()).equals(bEmailNorm))
                        || (!bPhoneDigits.isEmpty() && b.getCustomerPhone() != null && b.getCustomerPhone().replaceAll("[^0-9]", "").equals(bPhoneDigits)))
                .count();

        String lastDate = bill.getCreatedAt() != null ? dateFormatter.format(bill.getCreatedAt()) : null;

        return CustomerLookupResponse.builder()
                .id(null)
                .name(bill.getCustomerName())
                .email(bill.getCustomerEmail())
                .phone(bill.getCustomerPhone())
                .isRegistered(false)
                .isEmailVerified(false)
                .accountStatus("UNREGISTERED")
                .totalWarranties(0)
                .previousPurchasesWithRetailer(previousCount)
                .lastPurchaseDate(lastDate)
                .matchType("PREVIOUS_CUSTOMER")
                .build();
    }

    public RetailerResponse mapToResponse(Retailer r) {
        return RetailerResponse.builder()
                .id(r.getId())
                .userId(r.getUserId())
                .businessName(r.getBusinessName())
                .registrationNumber(r.getRegistrationNumber())
                .contactEmail(r.getContactEmail())
                .contactPhone(r.getContactPhone())
                .address(r.getAddress())
                .description(r.getDescription())
                .approvalStatus(r.getApprovalStatus())
                .approvedBy(r.getApprovedBy())
                .approvedAt(r.getApprovedAt())
                .rejectionReason(r.getRejectionReason())
                .suspensionReason(r.getSuspensionReason())
                .createdAt(r.getCreatedAt())
                .updatedAt(r.getUpdatedAt())
                .build();
    }
}

