package com.warrantrack.controller;

import com.warrantrack.dto.ApiResponse;
import com.warrantrack.dto.PagedResponse;
import com.warrantrack.dto.billing.BillRequest;
import com.warrantrack.dto.billing.BillResponse;
import com.warrantrack.security.UserPrincipal;
import com.warrantrack.service.BillingService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/bills")
public class BillingController {

    private final BillingService billingService;

    public BillingController(BillingService billingService) {
        this.billingService = billingService;
    }

    @PostMapping
    @PreAuthorize("hasRole('RETAILER')")
    public ResponseEntity<ApiResponse<BillResponse>> createBill(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody BillRequest request) {
        BillResponse response = billingService.createBill(principal.getId(), request);
        return ResponseEntity.ok(ApiResponse.success("Bill generated successfully", response));
    }

    @GetMapping
    @PreAuthorize("hasRole('RETAILER')")
    public ResponseEntity<ApiResponse<PagedResponse<BillResponse>>> getRetailerBills(
            @AuthenticationPrincipal UserPrincipal principal,
            @PageableDefault(size = 20) Pageable pageable) {
        PagedResponse<BillResponse> response = billingService.getRetailerBills(principal.getId(), pageable);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('RETAILER')")
    public ResponseEntity<ApiResponse<BillResponse>> getBillById(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable String id) {
        BillResponse response = billingService.getBillById(principal.getId(), id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/invoice/{invoiceNumber}")
    public ResponseEntity<ApiResponse<BillResponse>> getBillByInvoiceNumber(
            @PathVariable String invoiceNumber) {
        BillResponse response = billingService.getBillByInvoiceNumber(invoiceNumber);
        return ResponseEntity.ok(ApiResponse.success("Bill retrieved successfully", response));
    }
}

