package com.warrantrack.service;

import com.warrantrack.dto.PagedResponse;
import com.warrantrack.dto.product.ProductRequest;
import com.warrantrack.dto.product.ProductResponse;
import com.warrantrack.exception.ResourceNotFoundException;
import com.warrantrack.exception.UnauthorizedException;
import com.warrantrack.model.Product;
import com.warrantrack.model.Retailer;
import com.warrantrack.repository.ProductRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;

@Service
public class ProductService {

    private final ProductRepository productRepository;
    private final RetailerService retailerService;

    public ProductService(ProductRepository productRepository, RetailerService retailerService) {
        this.productRepository = productRepository;
        this.retailerService = retailerService;
    }

    public ProductResponse createProduct(String userId, ProductRequest request) {
        Retailer retailer = retailerService.getApprovedRetailerByUserId(userId);

        boolean hasWarranty = request.getHasWarranty() != null ? request.getHasWarranty() : true;
        int duration = hasWarranty ? (request.getWarrantyDuration() != null ? request.getWarrantyDuration() : 12) : 0;
        com.warrantrack.model.enums.WarrantyUnit unit = request.getWarrantyUnit() != null ? request.getWarrantyUnit() : com.warrantrack.model.enums.WarrantyUnit.MONTHS;
        String terms = hasWarranty 
                ? (request.getWarrantyTerms() != null ? request.getWarrantyTerms().trim() : "Standard manufacturer warranty")
                : (request.getWarrantyTerms() != null && !request.getWarrantyTerms().isBlank() ? request.getWarrantyTerms().trim() : "No warranty provided");

        int stockQty = request.getStockQuantity() != null ? Math.max(0, request.getStockQuantity()) : 0;

        Product product = Product.builder()
                .retailerId(retailer.getId())
                .name(request.getName().trim())
                .brand(request.getBrand().trim())
                .model(request.getModel().trim())
                .category(request.getCategory().trim())
                .description(request.getDescription())
                .hasWarranty(hasWarranty)
                .price(request.getPrice() != null ? request.getPrice() : 0.0)
                .stockQuantity(stockQty)
                .warrantyDuration(duration)
                .warrantyUnit(unit)
                .warrantyTerms(terms)
                .active(true)
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();

        product = productRepository.save(product);
        return mapToResponse(product);
    }

    public PagedResponse<ProductResponse> getRetailerProducts(String userId, Boolean activeOnly, Pageable pageable) {
        Retailer retailer = retailerService.getRetailerByUserId(userId);

        Page<Product> page;
        if (Boolean.TRUE.equals(activeOnly)) {
            page = productRepository.findByRetailerIdAndActiveTrue(retailer.getId(), pageable);
        } else {
            page = productRepository.findByRetailerId(retailer.getId(), pageable);
        }

        List<ProductResponse> responses = page.getContent().stream()
                .map(this::mapToResponse)
                .toList();

        return PagedResponse.<ProductResponse>builder()
                .content(responses)
                .page(page.getNumber())
                .size(page.getSize())
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .last(page.isLast())
                .build();
    }

    public ProductResponse getProductById(String userId, String productId) {
        Retailer retailer = retailerService.getRetailerByUserId(userId);
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product", "id", productId));

        if (!product.getRetailerId().equals(retailer.getId())) {
            throw new UnauthorizedException("Cannot access product belonging to another retailer.");
        }

        return mapToResponse(product);
    }

    public ProductResponse updateProduct(String userId, String productId, ProductRequest request) {
        Retailer retailer = retailerService.getApprovedRetailerByUserId(userId);
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product", "id", productId));

        if (!product.getRetailerId().equals(retailer.getId())) {
            throw new UnauthorizedException("Cannot modify product belonging to another retailer.");
        }

        boolean hasWarranty = request.getHasWarranty() != null ? request.getHasWarranty() : product.isHasWarranty();
        product.setName(request.getName().trim());
        product.setBrand(request.getBrand().trim());
        product.setModel(request.getModel().trim());
        product.setCategory(request.getCategory().trim());
        product.setDescription(request.getDescription());
        product.setHasWarranty(hasWarranty);
        if (request.getPrice() != null) {
            product.setPrice(request.getPrice());
        }
        if (request.getStockQuantity() != null) {
            product.setStockQuantity(Math.max(0, request.getStockQuantity()));
        }
        if (hasWarranty) {
            if (request.getWarrantyDuration() != null) {
                product.setWarrantyDuration(request.getWarrantyDuration());
            }
            if (request.getWarrantyUnit() != null) {
                product.setWarrantyUnit(request.getWarrantyUnit());
            }
            if (request.getWarrantyTerms() != null) {
                product.setWarrantyTerms(request.getWarrantyTerms().trim());
            }
        } else {
            product.setWarrantyDuration(0);
            product.setWarrantyTerms(request.getWarrantyTerms() != null ? request.getWarrantyTerms().trim() : "No warranty provided");
        }
        product.setUpdatedAt(Instant.now());

        product = productRepository.save(product);
        return mapToResponse(product);
    }

    public ProductResponse deactivateProduct(String userId, String productId) {
        Retailer retailer = retailerService.getApprovedRetailerByUserId(userId);
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product", "id", productId));

        if (!product.getRetailerId().equals(retailer.getId())) {
            throw new UnauthorizedException("Cannot deactivate product belonging to another retailer.");
        }

        // Soft-delete pattern: mark product as inactive to preserve historical purchase integrity
        product.setActive(false);
        product.setUpdatedAt(Instant.now());
        product = productRepository.save(product);

        return mapToResponse(product);
    }

    public Product getProductEntity(String productId) {
        return productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product", "id", productId));
    }

    public ProductResponse mapToResponse(Product p) {
        return ProductResponse.builder()
                .id(p.getId())
                .retailerId(p.getRetailerId())
                .name(p.getName())
                .brand(p.getBrand())
                .model(p.getModel())
                .category(p.getCategory())
                .description(p.getDescription())
                .warrantyDuration(p.getWarrantyDuration())
                .warrantyUnit(p.getWarrantyUnit())
                .warrantyTerms(p.getWarrantyTerms())
                .hasWarranty(p.isHasWarranty())
                .price(p.getPrice())
                .stockQuantity(p.getStockQuantity() != null ? p.getStockQuantity() : 0)
                .active(p.isActive())
                .createdAt(p.getCreatedAt())
                .updatedAt(p.getUpdatedAt())
                .build();
    }
}

