package com.warrantrack.dto.product;

import com.warrantrack.model.enums.WarrantyUnit;
import jakarta.validation.constraints.NotBlank;

public class ProductRequest {
    @NotBlank(message = "Product name is required")
    private String name;

    @NotBlank(message = "Brand is required")
    private String brand;

    @NotBlank(message = "Model is required")
    private String model;

    @NotBlank(message = "Category is required")
    private String category;

    private String description;

    private Boolean hasWarranty = true;

    private Double price = 0.0;

    private Integer stockQuantity = 0;

    private Integer warrantyDuration;

    private WarrantyUnit warrantyUnit;

    private String warrantyTerms;


    public ProductRequest() {
    }

    public String getName() {
        return this.name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getBrand() {
        return this.brand;
    }

    public void setBrand(String brand) {
        this.brand = brand;
    }

    public String getModel() {
        return this.model;
    }

    public void setModel(String model) {
        this.model = model;
    }

    public String getCategory() {
        return this.category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public String getDescription() {
        return this.description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public Boolean getHasWarranty() {
        return this.hasWarranty;
    }

    public void setHasWarranty(Boolean hasWarranty) {
        this.hasWarranty = hasWarranty != null ? hasWarranty : true;
    }

    public Double getPrice() {
        return this.price;
    }

    public void setPrice(Double price) {
        this.price = price != null ? price : 0.0;
    }

    public Integer getStockQuantity() {
        return this.stockQuantity != null ? this.stockQuantity : 0;
    }

    public void setStockQuantity(Integer stockQuantity) {
        this.stockQuantity = stockQuantity != null ? stockQuantity : 0;
    }

    public Integer getWarrantyDuration() {
        return this.warrantyDuration;
    }

    public void setWarrantyDuration(Integer warrantyDuration) {
        this.warrantyDuration = warrantyDuration;
    }

    public WarrantyUnit getWarrantyUnit() {
        return this.warrantyUnit;
    }

    public void setWarrantyUnit(WarrantyUnit warrantyUnit) {
        this.warrantyUnit = warrantyUnit;
    }

    public String getWarrantyTerms() {
        return this.warrantyTerms;
    }

    public void setWarrantyTerms(String warrantyTerms) {
        this.warrantyTerms = warrantyTerms;
    }

}
