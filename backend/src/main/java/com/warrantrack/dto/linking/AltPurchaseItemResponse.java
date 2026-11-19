package com.warrantrack.dto.linking;

import java.time.LocalDate;

public class AltPurchaseItemResponse {

    private String id;
    private String retailerId;
    private String retailerBusinessName;
    private String productId;
    private String productName;
    private String productBrand;
    private String productModel;
    private Double unitPrice;
    private int quantity;
    private LocalDate purchaseDate;
    private String invoiceNumber;
    private String purchaseReference;
    private String serialNumber;
    private boolean hasWarranty;
    private String customerEmail;
    private String linkingStatus; // AVAILABLE_TO_LINK, ALREADY_LINKED, LINKED_TO_OTHER
    private String statusLabel; // Available to Link, Already Linked, Linked to Another Account
    private String statusDescription;
    private boolean canLink;
    private WarrantySummaryResponse warranty;

    public AltPurchaseItemResponse() {
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getRetailerId() {
        return retailerId;
    }

    public void setRetailerId(String retailerId) {
        this.retailerId = retailerId;
    }

    public String getRetailerBusinessName() {
        return retailerBusinessName;
    }

    public void setRetailerBusinessName(String retailerBusinessName) {
        this.retailerBusinessName = retailerBusinessName;
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

    public String getProductBrand() {
        return productBrand;
    }

    public void setProductBrand(String productBrand) {
        this.productBrand = productBrand;
    }

    public String getProductModel() {
        return productModel;
    }

    public void setProductModel(String productModel) {
        this.productModel = productModel;
    }

    public Double getUnitPrice() {
        return unitPrice;
    }

    public void setUnitPrice(Double unitPrice) {
        this.unitPrice = unitPrice;
    }

    public int getQuantity() {
        return quantity;
    }

    public void setQuantity(int quantity) {
        this.quantity = quantity;
    }

    public LocalDate getPurchaseDate() {
        return purchaseDate;
    }

    public void setPurchaseDate(LocalDate purchaseDate) {
        this.purchaseDate = purchaseDate;
    }

    public String getInvoiceNumber() {
        return invoiceNumber;
    }

    public void setInvoiceNumber(String invoiceNumber) {
        this.invoiceNumber = invoiceNumber;
    }

    public String getPurchaseReference() {
        return purchaseReference;
    }

    public void setPurchaseReference(String purchaseReference) {
        this.purchaseReference = purchaseReference;
    }

    public String getSerialNumber() {
        return serialNumber;
    }

    public void setSerialNumber(String serialNumber) {
        this.serialNumber = serialNumber;
    }

    public boolean isHasWarranty() {
        return hasWarranty;
    }

    public void setHasWarranty(boolean hasWarranty) {
        this.hasWarranty = hasWarranty;
    }

    public String getCustomerEmail() {
        return customerEmail;
    }

    public void setCustomerEmail(String customerEmail) {
        this.customerEmail = customerEmail;
    }

    public String getLinkingStatus() {
        return linkingStatus;
    }

    public void setLinkingStatus(String linkingStatus) {
        this.linkingStatus = linkingStatus;
    }

    public String getStatusLabel() {
        return statusLabel;
    }

    public void setStatusLabel(String statusLabel) {
        this.statusLabel = statusLabel;
    }

    public String getStatusDescription() {
        return statusDescription;
    }

    public void setStatusDescription(String statusDescription) {
        this.statusDescription = statusDescription;
    }

    public boolean isCanLink() {
        return canLink;
    }

    public void setCanLink(boolean canLink) {
        this.canLink = canLink;
    }

    public WarrantySummaryResponse getWarranty() {
        return warranty;
    }

    public void setWarranty(WarrantySummaryResponse warranty) {
        this.warranty = warranty;
    }
}
