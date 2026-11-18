package com.warrantrack.controller;

import com.warrantrack.dto.ApiResponse;
import com.warrantrack.dto.purchase.LinkPurchaseRequest;
import com.warrantrack.dto.purchase.PurchaseResponse;
import com.warrantrack.security.UserPrincipal;
import com.warrantrack.service.CustomerLinkingService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/customer/purchases")
@PreAuthorize("hasRole('CUSTOMER')")
public class CustomerLinkingController {

    private final CustomerLinkingService linkingService;

    public CustomerLinkingController(CustomerLinkingService linkingService) {
        this.linkingService = linkingService;
    }

    @GetMapping("/pending")
    public ResponseEntity<ApiResponse<List<PurchaseResponse>>> getPendingPurchases(
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(ApiResponse.success(linkingService.getPendingPurchases(principal.getId())));
    }

    @PostMapping("/{purchaseId}/claim")
    public ResponseEntity<ApiResponse<PurchaseResponse>> claimPurchase(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable String purchaseId) {
        PurchaseResponse response = linkingService.claimPurchase(principal.getId(), purchaseId);
        return ResponseEntity.ok(ApiResponse.success("Purchase and warranty successfully claimed and linked to your account!", response));
    }

    @PostMapping("/{purchaseId}/verify-link")
    public ResponseEntity<ApiResponse<PurchaseResponse>> verifyAndLink(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable String purchaseId,
            @RequestBody(required = false) LinkPurchaseRequest request) {
        PurchaseResponse response = linkingService.claimPurchase(principal.getId(), purchaseId);
        return ResponseEntity.ok(ApiResponse.success("Purchase and warranty successfully claimed and linked to your account!", response));
    }

    @PostMapping("/sync-all")
    public ResponseEntity<ApiResponse<Integer>> syncAllPurchases(
            @AuthenticationPrincipal UserPrincipal principal) {
        int count = linkingService.autoLinkPendingPurchases(principal.getId());
        return ResponseEntity.ok(ApiResponse.success("Successfully synchronized and linked " + count + " purchase(s).", count));
    }

    @PostMapping("/{purchaseId}/request-otp")
    public ResponseEntity<ApiResponse<String>> requestLinkingOtp(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable String purchaseId) {
        return ResponseEntity.ok(ApiResponse.success(
                "Email ownership is verified on your account. You can claim this purchase directly without requiring a secondary OTP.",
                null));
    }
}
