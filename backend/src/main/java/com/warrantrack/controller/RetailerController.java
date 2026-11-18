package com.warrantrack.controller;

import com.warrantrack.dto.ApiResponse;
import com.warrantrack.dto.retailer.CustomerLookupResponse;
import com.warrantrack.dto.retailer.RetailerResponse;
import com.warrantrack.security.UserPrincipal;
import com.warrantrack.service.RetailerService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/retailer")
@PreAuthorize("hasRole('RETAILER')")
public class RetailerController {

    private final RetailerService retailerService;

    public RetailerController(RetailerService retailerService) {
        this.retailerService = retailerService;
    }

    @GetMapping("/profile")
    public ResponseEntity<ApiResponse<RetailerResponse>> getProfile(@AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(ApiResponse.success(retailerService.getProfile(principal.getId())));
    }

    @PutMapping("/profile")
    public ResponseEntity<ApiResponse<RetailerResponse>> updateProfile(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestBody RetailerResponse updateRequest) {
        return ResponseEntity.ok(ApiResponse.success("Profile updated successfully",
                retailerService.updateProfile(principal.getId(), updateRequest)));
    }

    @GetMapping("/customers/lookup")
    public ResponseEntity<ApiResponse<List<CustomerLookupResponse>>> lookupCustomers(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(required = false) String query) {
        return ResponseEntity.ok(ApiResponse.success("Customer lookup completed successfully",
                retailerService.lookupCustomers(principal.getId(), query)));
    }
}

