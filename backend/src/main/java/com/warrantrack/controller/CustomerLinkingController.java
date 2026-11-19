package com.warrantrack.controller;

import com.warrantrack.dto.ApiResponse;
import com.warrantrack.dto.linking.*;
import com.warrantrack.dto.purchase.LinkPurchaseRequest;
import com.warrantrack.dto.purchase.PurchaseResponse;
import com.warrantrack.security.UserPrincipal;
import com.warrantrack.service.CustomerLinkingService;
import com.warrantrack.service.FindAndLinkPurchasesService;
import jakarta.validation.Valid;
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
    private final FindAndLinkPurchasesService findService;

    public CustomerLinkingController(CustomerLinkingService linkingService,
                                   FindAndLinkPurchasesService findService) {
        this.linkingService = linkingService;
        this.findService = findService;
    }

    // ==========================================
    // Existing Account Purchases & Sync Endpoints
    // ==========================================

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

    // ==========================================
    // "Find & Link Purchases" via Alternative Email
    // ==========================================

    @PostMapping("/find/send-otp")
    public ResponseEntity<ApiResponse<AltEmailOtpResponse>> sendAltEmailOtp(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody SendAltEmailOtpRequest request) {
        AltEmailOtpResponse response = findService.sendOtp(principal.getId(), request.getEmail());
        return ResponseEntity.ok(ApiResponse.success(response.getMessage(), response));
    }

    @PostMapping("/find/verify-otp")
    public ResponseEntity<ApiResponse<AltEmailVerificationResponse>> verifyAltEmailOtp(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody VerifyAltEmailOtpRequest request) {
        AltEmailVerificationResponse response = findService.verifyOtp(principal.getId(), request);
        return ResponseEntity.ok(ApiResponse.success(response.getMessage(), response));
    }

    @GetMapping("/find/results")
    public ResponseEntity<ApiResponse<FindPurchasesResultResponse>> getFoundPurchases(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam String email,
            @RequestParam(required = false) String token) {
        FindPurchasesResultResponse response = findService.getFoundPurchases(principal.getId(), email, token);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping("/find/link")
    public ResponseEntity<ApiResponse<PurchaseResponse>> linkAltPurchase(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody LinkAltEmailPurchaseRequest request) {
        PurchaseResponse response = findService.linkPurchase(principal.getId(), request);
        return ResponseEntity.ok(ApiResponse.success("Purchase and digital warranty successfully linked to your account!", response));
    }

    @PostMapping("/find/link-all")
    public ResponseEntity<ApiResponse<Integer>> linkAllAltPurchases(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody LinkAllAltEmailPurchasesRequest request) {
        int count = findService.linkAllPurchases(principal.getId(), request);
        return ResponseEntity.ok(ApiResponse.success("Successfully linked " + count + " purchase(s) and warranties to your account!", count));
    }

    // ==========================================
    // Verified Secondary Emails Management
    // ==========================================

    @GetMapping("/secondary-emails")
    public ResponseEntity<ApiResponse<List<SecondaryEmailDto>>> getSecondaryEmails(
            @AuthenticationPrincipal UserPrincipal principal) {
        List<SecondaryEmailDto> emails = findService.getSecondaryEmails(principal.getId());
        return ResponseEntity.ok(ApiResponse.success(emails));
    }

    @PostMapping("/secondary-emails")
    public ResponseEntity<ApiResponse<String>> saveSecondaryEmail(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody SaveSecondaryEmailRequest request) {
        findService.saveSecondaryEmail(principal.getId(), request);
        return ResponseEntity.ok(ApiResponse.success("Secondary email saved successfully for future purchase matching.", request.getEmail()));
    }

    @DeleteMapping("/secondary-emails")
    public ResponseEntity<ApiResponse<String>> removeSecondaryEmail(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam String email) {
        findService.removeSecondaryEmail(principal.getId(), email);
        return ResponseEntity.ok(ApiResponse.success("Secondary email removed successfully.", email));
    }
}
