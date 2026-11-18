package com.warrantrack.controller;

import com.warrantrack.dto.ApiResponse;
import com.warrantrack.dto.PagedResponse;
import com.warrantrack.dto.product.ProductRequest;
import com.warrantrack.dto.product.ProductResponse;
import com.warrantrack.security.UserPrincipal;
import com.warrantrack.service.ProductService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/products")
@PreAuthorize("hasRole('RETAILER')")
public class ProductController {

    private final ProductService productService;

    public ProductController(ProductService productService) {
        this.productService = productService;
    }

    @PostMapping
    public ResponseEntity<ApiResponse<ProductResponse>> createProduct(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody ProductRequest request) {
        ProductResponse response = productService.createProduct(principal.getId(), request);
        return ResponseEntity.ok(ApiResponse.success("Product created successfully", response));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<PagedResponse<ProductResponse>>> getProducts(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(required = false) Boolean activeOnly,
            @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(productService.getRetailerProducts(principal.getId(), activeOnly, pageable)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ProductResponse>> getProductById(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable String id) {
        return ResponseEntity.ok(ApiResponse.success(productService.getProductById(principal.getId(), id)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<ProductResponse>> updateProduct(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable String id,
            @Valid @RequestBody ProductRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Product updated successfully",
                productService.updateProduct(principal.getId(), id, request)));
    }

    @PatchMapping("/{id}/deactivate")
    public ResponseEntity<ApiResponse<ProductResponse>> deactivateProduct(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable String id) {
        return ResponseEntity.ok(ApiResponse.success("Product deactivated successfully",
                productService.deactivateProduct(principal.getId(), id)));
    }
}

