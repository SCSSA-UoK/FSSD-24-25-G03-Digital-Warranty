package com.warrantrack.controller;

import com.warrantrack.dto.ApiResponse;
import com.warrantrack.dto.PagedResponse;
import com.warrantrack.dto.admin.AuditLogResponse;
import com.warrantrack.dto.admin.CustomerStatusUpdateRequest;
import com.warrantrack.dto.analytics.PlatformAnalyticsResponse;
import com.warrantrack.dto.auth.UserResponse;
import com.warrantrack.dto.claim.ClaimResponse;
import com.warrantrack.dto.retailer.RetailerResponse;
import com.warrantrack.dto.retailer.RetailerStatusUpdateRequest;
import com.warrantrack.model.enums.AccountStatus;
import com.warrantrack.model.enums.ApprovalStatus;
import com.warrantrack.model.enums.ClaimStatus;
import com.warrantrack.security.UserPrincipal;
import com.warrantrack.service.AdminService;
import com.warrantrack.service.AuditService;
import com.warrantrack.service.ClaimService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final AdminService adminService;
    private final ClaimService claimService;
    private final AuditService auditService;

    public AdminController(AdminService adminService, ClaimService claimService, AuditService auditService) {
        this.adminService = adminService;
        this.claimService = claimService;
        this.auditService = auditService;
    }

    @GetMapping("/dashboard")
    public ResponseEntity<ApiResponse<PlatformAnalyticsResponse>> getDashboard() {
        return ResponseEntity.ok(ApiResponse.success(adminService.getPlatformAnalytics()));
    }

    @GetMapping("/retailers")
    public ResponseEntity<ApiResponse<PagedResponse<RetailerResponse>>> getRetailers(
            @RequestParam(required = false) ApprovalStatus status,
            @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(adminService.getRetailers(status, pageable)));
    }

    @GetMapping("/retailers/{id}")
    public ResponseEntity<ApiResponse<RetailerResponse>> getRetailerById(@PathVariable String id) {
        return ResponseEntity.ok(ApiResponse.success(adminService.getRetailerById(id)));
    }

    @PatchMapping("/retailers/{id}/status")
    public ResponseEntity<ApiResponse<RetailerResponse>> updateRetailerStatus(
            @PathVariable String id,
            @Valid @RequestBody RetailerStatusUpdateRequest request,
            @AuthenticationPrincipal UserPrincipal adminPrincipal) {
        RetailerResponse response = adminService.updateRetailerStatus(
                id, request, adminPrincipal.getId(), adminPrincipal.getEmail());
        return ResponseEntity.ok(ApiResponse.success("Retailer status updated to " + request.getStatus(), response));
    }

    @GetMapping("/customers")
    public ResponseEntity<ApiResponse<PagedResponse<UserResponse>>> getCustomers(
            @RequestParam(required = false) AccountStatus status,
            @RequestParam(required = false) String search,
            @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(adminService.getCustomers(status, search, pageable)));
    }

    @PatchMapping("/customers/{id}/status")
    public ResponseEntity<ApiResponse<UserResponse>> updateCustomerStatus(
            @PathVariable String id,
            @Valid @RequestBody CustomerStatusUpdateRequest request,
            @AuthenticationPrincipal UserPrincipal adminPrincipal) {
        UserResponse response = adminService.updateCustomerStatus(
                id, request, adminPrincipal.getId(), adminPrincipal.getEmail());
        return ResponseEntity.ok(ApiResponse.success("Customer account status updated to " + request.getStatus(), response));
    }

    @GetMapping("/claims")
    public ResponseEntity<ApiResponse<PagedResponse<ClaimResponse>>> getAllClaims(
            @RequestParam(required = false) ClaimStatus status,
            @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(claimService.getAllClaimsForAdmin(status, pageable)));
    }

    @GetMapping("/audit-logs")
    public ResponseEntity<ApiResponse<PagedResponse<AuditLogResponse>>> getAuditLogs(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String action,
            @RequestParam(required = false) String entityType,
            @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(auditService.getAuditLogs(search, action, entityType, pageable)));
    }

    @GetMapping("/audit-logs/actions")
    public ResponseEntity<ApiResponse<List<String>>> getAuditLogActions() {
        return ResponseEntity.ok(ApiResponse.success(auditService.getDistinctActions()));
    }

    @GetMapping("/audit-logs/entity-types")
    public ResponseEntity<ApiResponse<List<String>>> getAuditLogEntityTypes() {
        return ResponseEntity.ok(ApiResponse.success(auditService.getDistinctEntityTypes()));
    }
}

