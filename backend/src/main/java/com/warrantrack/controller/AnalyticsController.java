package com.warrantrack.controller;

import com.warrantrack.dto.ApiResponse;
import com.warrantrack.dto.analytics.PlatformAnalyticsResponse;
import com.warrantrack.dto.analytics.RetailerAnalyticsResponse;
import com.warrantrack.security.UserPrincipal;
import com.warrantrack.service.AnalyticsService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/analytics")
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    public AnalyticsController(AnalyticsService analyticsService) {
        this.analyticsService = analyticsService;
    }

    @GetMapping("/admin")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<PlatformAnalyticsResponse>> getPlatformAnalytics() {
        return ResponseEntity.ok(ApiResponse.success(analyticsService.getPlatformAnalytics()));
    }

    @GetMapping("/retailer")
    @PreAuthorize("hasRole('RETAILER')")
    public ResponseEntity<ApiResponse<RetailerAnalyticsResponse>> getRetailerAnalytics(
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(ApiResponse.success(analyticsService.getRetailerAnalytics(principal.getId())));
    }
}

