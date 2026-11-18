package com.warrantrack.controller;

import com.warrantrack.dto.ApiResponse;
import com.warrantrack.dto.PagedResponse;
import com.warrantrack.dto.claim.*;
import com.warrantrack.exception.BadRequestException;
import com.warrantrack.model.enums.ClaimStatus;
import com.warrantrack.security.UserPrincipal;
import com.warrantrack.service.ClaimService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/claims")
public class ClaimController {

    private final ClaimService claimService;

    public ClaimController(ClaimService claimService) {
        this.claimService = claimService;
    }

    @PostMapping
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<ApiResponse<ClaimResponse>> submitClaim(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody ClaimSubmissionRequest request) {
        ClaimResponse response = claimService.submitClaim(principal.getId(), request);
        return ResponseEntity.ok(ApiResponse.success("Warranty claim submitted successfully", response));
    }

    @GetMapping("/customer")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<ApiResponse<PagedResponse<ClaimResponse>>> getCustomerClaims(
            @AuthenticationPrincipal UserPrincipal principal,
            @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(claimService.getCustomerClaims(principal.getId(), pageable)));
    }

    @GetMapping("/retailer")
    @PreAuthorize("hasRole('RETAILER')")
    public ResponseEntity<ApiResponse<PagedResponse<ClaimResponse>>> getRetailerClaims(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(required = false) ClaimStatus status,
            @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(claimService.getRetailerClaims(principal.getId(), status, pageable)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ClaimResponse>> getClaimById(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable String id) {
        return ResponseEntity.ok(ApiResponse.success(claimService.getClaimById(principal.getId(), id)));
    }

    @PatchMapping("/{id}/review")
    @PreAuthorize("hasRole('RETAILER')")
    public ResponseEntity<ApiResponse<ClaimResponse>> startReview(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable String id) {
        return ResponseEntity.ok(ApiResponse.success("Claim moved to UNDER_REVIEW",
                claimService.startReview(principal.getId(), id)));
    }

    @PatchMapping("/{id}/decision")
    @PreAuthorize("hasRole('RETAILER')")
    public ResponseEntity<ApiResponse<ClaimResponse>> makeDecision(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable String id,
            @Valid @RequestBody ClaimDecisionRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Claim decision recorded",
                claimService.makeDecision(principal.getId(), id, request)));
    }

    @PostMapping("/{id}/request-info")
    @PreAuthorize("hasRole('RETAILER')")
    public ResponseEntity<ApiResponse<ClaimResponse>> requestAdditionalInfo(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable String id,
            @Valid @RequestBody AdditionalInfoPromptRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Additional information requested from customer",
                claimService.requestAdditionalInfo(principal.getId(), id, request)));
    }

    @PostMapping("/{id}/provide-info")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<ApiResponse<ClaimResponse>> replyAdditionalInfo(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable String id,
            @Valid @RequestBody AdditionalInfoReplyRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Information submitted. Claim returned to UNDER_REVIEW.",
                claimService.replyAdditionalInfo(principal.getId(), id, request)));
    }

    @PatchMapping("/{id}/cancel")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<ApiResponse<ClaimResponse>> cancelClaim(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable String id,
            @Valid @RequestBody ClaimCancelRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Claim cancelled successfully",
                claimService.cancelClaim(principal.getId(), id, request)));
    }

    @PostMapping("/{id}/service-progress")
    @PreAuthorize("hasRole('RETAILER')")
    public ResponseEntity<ApiResponse<ClaimResponse>> updateServiceProgress(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable String id,
            @Valid @RequestBody ServiceProgressRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Service progress updated",
                claimService.updateServiceProgress(principal.getId(), id, request)));
    }

    @PatchMapping("/{id}/complete")
    @PreAuthorize("hasRole('RETAILER')")
    public ResponseEntity<ApiResponse<ClaimResponse>> completeClaim(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable String id,
            @Valid @RequestBody CompleteClaimRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Claim completed with resolution notes",
                claimService.completeClaim(principal.getId(), id, request)));
    }

    @PostMapping("/{id}/feedback")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<ApiResponse<ClaimResponse>> submitFeedback(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable String id,
            @Valid @RequestBody ClaimFeedbackRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Thank you for your feedback!",
                claimService.submitFeedback(principal.getId(), id, request)));
    }

    @PostMapping(value = "/upload-evidence", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<ApiResponse<Map<String, String>>> uploadEvidence(
            @RequestParam("file") MultipartFile file) {
        if (file.isEmpty()) {
            throw new BadRequestException("Uploaded evidence file cannot be empty");
        }

        String originalFilename = file.getOriginalFilename() != null ? file.getOriginalFilename() : "evidence.jpg";
        String extension = "";
        int dotIndex = originalFilename.lastIndexOf('.');
        if (dotIndex >= 0) {
            extension = originalFilename.substring(dotIndex);
        }

        String storedFilename = UUID.randomUUID().toString() + extension;
        Path uploadDir = Paths.get("uploads", "evidence");

        try {
            if (!Files.exists(uploadDir)) {
                Files.createDirectories(uploadDir);
            }
            Path targetPath = uploadDir.resolve(storedFilename);
            Files.copy(file.getInputStream(), targetPath, StandardCopyOption.REPLACE_EXISTING);

            String fileUrl = "/api/public/uploads/evidence/" + storedFilename;
            return ResponseEntity.ok(ApiResponse.success("Evidence uploaded successfully",
                    Map.of("url", fileUrl, "filename", storedFilename)));
        } catch (IOException e) {
            throw new RuntimeException("Failed to save uploaded evidence: " + e.getMessage(), e);
        }
    }
}

