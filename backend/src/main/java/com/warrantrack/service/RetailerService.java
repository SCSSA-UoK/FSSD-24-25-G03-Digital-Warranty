package com.warrantrack.service;

import com.warrantrack.dto.retailer.CustomerLookupResponse;
import com.warrantrack.dto.retailer.RetailerResponse;
import com.warrantrack.exception.BadRequestException;
import com.warrantrack.exception.ResourceNotFoundException;
import com.warrantrack.exception.UnauthorizedException;
import com.warrantrack.model.Bill;
import com.warrantrack.model.Retailer;
import com.warrantrack.model.User;
import com.warrantrack.model.enums.ApprovalStatus;
import com.warrantrack.model.enums.Role;
import com.warrantrack.repository.BillRepository;
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

    public RetailerService(RetailerRepository retailerRepository,
                           UserRepository userRepository,
                           BillRepository billRepository,
                           WarrantyRepository warrantyRepository) {
        this.retailerRepository = retailerRepository;
        this.userRepository = userRepository;
        this.billRepository = billRepository;
        this.warrantyRepository = warrantyRepository;
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
        Retailer retailer = getApprovedRetailerByUserId(userId);
        String retailerId = retailer.getId();

        String rawQuery = query != null ? query.trim() : "";
        String cleanQ = rawQuery.toLowerCase();
        String phoneDigits = rawQuery.replaceAll("[^0-9]", "");
        String normalizedEmail = !rawQuery.isBlank() ? EmailNormalizer.normalize(rawQuery) : "";

        DateTimeFormatter dateFormatter = DateTimeFormatter.ofPattern("yyyy-MM-dd")
                .withZone(ZoneId.systemDefault());

        Map<String, CustomerLookupResponse> resultMap = new LinkedHashMap<>();

        List<Bill> retailerBills = billRepository.findByRetailerIdOrderByCreatedAtDesc(retailerId);

        // 1. If query is empty, return recent customers who have transacted with this retailer
        if (cleanQ.isEmpty()) {
            for (Bill bill : retailerBills) {
                if (bill.getCustomerEmail() == null && bill.getCustomerPhone() == null) continue;
                String key = (bill.getCustomerEmail() != null && !bill.getCustomerEmail().isBlank())
                        ? EmailNormalizer.normalize(bill.getCustomerEmail())
                        : bill.getCustomerPhone();
                if (key != null && !resultMap.containsKey(key)) {
                    CustomerLookupResponse item = buildFromBill(bill, retailerBills, dateFormatter);
                    resultMap.put(key, item);
                    if (resultMap.size() >= 8) break;
                }
            }
            return new ArrayList<>(resultMap.values());
        }

        // 2. Search Registered Customers in UserRepository
        List<User> registeredCustomers = userRepository.findByRole(Role.CUSTOMER);
        for (User user : registeredCustomers) {
            String uName = user.getName() != null ? user.getName().toLowerCase() : "";
            String uEmail = user.getEmail() != null ? user.getEmail().toLowerCase() : "";
            String uEmailNorm = user.getEmailNormalized() != null ? user.getEmailNormalized() : "";
            String uPhoneDigits = user.getPhone() != null ? user.getPhone().replaceAll("[^0-9]", "") : "";

            boolean exactEmail = !normalizedEmail.isEmpty() && (uEmailNorm.equals(normalizedEmail) || uEmail.equals(cleanQ));
            boolean exactPhone = !phoneDigits.isEmpty() && uPhoneDigits.equals(phoneDigits);
            boolean emailContains = !cleanQ.isEmpty() && uEmail.contains(cleanQ);
            boolean phoneContains = !phoneDigits.isEmpty() && phoneDigits.length() >= 3 && uPhoneDigits.contains(phoneDigits);
            boolean nameContains = !cleanQ.isEmpty() && uName.contains(cleanQ);

            if (exactEmail || exactPhone || emailContains || phoneContains || nameContains) {
                String matchType = exactPhone ? "EXACT_PHONE"
                        : exactEmail ? "EXACT_EMAIL"
                        : (phoneContains || emailContains) ? "CONTACT_MATCH" : "NAME_MATCH";

                long totalWarranties = warrantyRepository.countByCustomerId(user.getId());

                List<Bill> matchingBills = retailerBills.stream()
                        .filter(b -> (b.getCustomerEmail() != null && EmailNormalizer.normalize(b.getCustomerEmail()).equals(uEmailNorm))
                                || (b.getCustomerPhone() != null && !phoneDigits.isEmpty() && b.getCustomerPhone().replaceAll("[^0-9]", "").equals(uPhoneDigits)))
                        .toList();

                String lastPurchaseDate = null;
                if (!matchingBills.isEmpty() && matchingBills.get(0).getCreatedAt() != null) {
                    lastPurchaseDate = dateFormatter.format(matchingBills.get(0).getCreatedAt());
                }

                CustomerLookupResponse resp = CustomerLookupResponse.builder()
                        .id(user.getId())
                        .name(user.getName())
                        .email(user.getEmail())
                        .phone(user.getPhone())
                        .isRegistered(true)
                        .isEmailVerified(user.isEmailVerified())
                        .accountStatus(user.getAccountStatus() != null ? user.getAccountStatus().name() : "ACTIVE")
                        .totalWarranties(totalWarranties)
                        .previousPurchasesWithRetailer(matchingBills.size())
                        .lastPurchaseDate(lastPurchaseDate)
                        .matchType(matchType)
                        .build();

                String key = !uEmailNorm.isEmpty() ? uEmailNorm : user.getPhone();
                if (key != null) {
                    resultMap.put(key, resp);
                }
            }
        }

        // 3. Search past Bills for this retailer for in-store customers not registered yet
        for (Bill bill : retailerBills) {
            String bName = bill.getCustomerName() != null ? bill.getCustomerName().toLowerCase() : "";
            String bEmail = bill.getCustomerEmail() != null ? bill.getCustomerEmail().toLowerCase() : "";
            String bEmailNorm = bill.getCustomerEmail() != null ? EmailNormalizer.normalize(bill.getCustomerEmail()) : "";
            String bPhoneDigits = bill.getCustomerPhone() != null ? bill.getCustomerPhone().replaceAll("[^0-9]", "") : "";

            String key = !bEmailNorm.isEmpty() ? bEmailNorm : bill.getCustomerPhone();
            if (key == null || resultMap.containsKey(key)) {
                continue;
            }

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

        // 4. Sort results: EXACT matches first, then registered active users, then previous customers
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

