package com.warrantrack.dto.billing;

import com.warrantrack.model.enums.WarrantyUnit;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.List;

public class BillItemRequest {

    private String productId;

    @NotBlank(message = "Product name is required")
    private String productName;

    private String brand;
    private String category;
    private String serialNumber;
    private List<String> serialNumbers;

    @Min(value = 1, message = "Quantity must be at least 1")
    private int quantity = 1;

    @NotNull(message = "Unit price is required")
    @Min(value = 0, message = "Unit price cannot be negative")
    private Double unitPrice = 0.0;

    private Boolean hasWarranty = true;

    private Integer warrantyDuration;
    private WarrantyUnit warrantyUnit;
    private String warrantyTerms;

    public BillItemRequest() {
    }

    public String getProductId() {
        return productId;
    }

    public void setProductId(String productId) {
        this.productId = productId;
    }

    public String getProductName() {
        return productName;
    }

    public void setProductName(String productName) {
        this.productName = productName;
    }

    public String getBrand() {
        return brand;
    }

    public void setBrand(String brand) {
        this.brand = brand;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public String getSerialNumber() {
        return serialNumber;
    }

    public void setSerialNumber(String serialNumber) {
        this.serialNumber = serialNumber;
    }

    public List<String> getSerialNumbers() {
        return serialNumbers;
    }

    public void setSerialNumbers(List<String> serialNumbers) {
        this.serialNumbers = serialNumbers;
    }

    public int getQuantity() {
        return quantity;
    }

    public void setQuantity(int quantity) {
        this.quantity = quantity;
    }

    public Double getUnitPrice() {
        return unitPrice;
    }

    public void setUnitPrice(Double unitPrice) {
        this.unitPrice = unitPrice;
    }

    public Boolean getHasWarranty() {
        return hasWarranty;
    }

    public void setHasWarranty(Boolean hasWarranty) {
        this.hasWarranty = hasWarranty != null ? hasWarranty : true;
    }

    public Integer getWarrantyDuration() {
        return warrantyDuration;
    }

    public void setWarrantyDuration(Integer warrantyDuration) {
        this.warrantyDuration = warrantyDuration;
    }

    public WarrantyUnit getWarrantyUnit() {
        return warrantyUnit;
    }

    public void setWarrantyUnit(WarrantyUnit warrantyUnit) {
        this.warrantyUnit = warrantyUnit;
    }

    public String getWarrantyTerms() {
        return warrantyTerms;
    }

    public void setWarrantyTerms(String warrantyTerms) {
        this.warrantyTerms = warrantyTerms;
    }
}

