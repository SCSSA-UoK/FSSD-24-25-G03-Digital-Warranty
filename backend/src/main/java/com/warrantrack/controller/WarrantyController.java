package com.warrantrack.controller;

import com.warrantrack.dto.ApiResponse;
import com.warrantrack.dto.PagedResponse;
import com.warrantrack.dto.warranty.WarrantyResponse;
import com.warrantrack.security.UserPrincipal;
import com.warrantrack.service.WarrantyService;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/customer/warranties")
@PreAuthorize("hasRole('CUSTOMER')")
public class WarrantyController {

    private final WarrantyService warrantyService;

    public WarrantyController(WarrantyService warrantyService) {
        this.warrantyService = warrantyService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<PagedResponse<WarrantyResponse>>> getMyWarranties(
            @AuthenticationPrincipal UserPrincipal principal,
            @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(warrantyService.getCustomerWarranties(principal.getId(), pageable)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<WarrantyResponse>> getWarrantyById(@PathVariable String id) {
        return ResponseEntity.ok(ApiResponse.success(warrantyService.getWarrantyById(id)));
    }
}

