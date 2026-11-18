package com.warrantrack.controller;

import com.warrantrack.dto.ApiResponse;
import com.warrantrack.dto.PagedResponse;
import com.warrantrack.dto.purchase.PurchaseRegistrationRequest;
import com.warrantrack.dto.purchase.PurchaseResponse;
import com.warrantrack.security.UserPrincipal;
import com.warrantrack.service.PurchaseService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/purchases")
@PreAuthorize("hasRole('RETAILER')")
public class PurchaseController {

    private final PurchaseService purchaseService;

    public PurchaseController(PurchaseService purchaseService) {
        this.purchaseService = purchaseService;
    }

    @PostMapping
    public ResponseEntity<ApiResponse<PurchaseResponse>> registerPurchase(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody PurchaseRegistrationRequest request) {
        PurchaseResponse response = purchaseService.registerPurchase(principal.getId(), request);
        return ResponseEntity.ok(ApiResponse.success("Purchase and warranty registered successfully", response));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<PagedResponse<PurchaseResponse>>> getPurchases(
            @AuthenticationPrincipal UserPrincipal principal,
            @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(purchaseService.getRetailerPurchases(principal.getId(), pageable)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<PurchaseResponse>> getPurchaseById(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable String id) {
        return ResponseEntity.ok(ApiResponse.success(purchaseService.getPurchaseById(principal.getId(), id)));
    }
}

