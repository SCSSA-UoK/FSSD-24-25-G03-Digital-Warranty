package com.warrantrack.dto.purchase;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;

public class PurchaseRegistrationRequest {
    @NotBlank(message = "Product ID is required")
    private String productId;

    @NotBlank(message = "Customer email is required")
    @Email(message = "Valid customer email is required")
    private String customerEmail;

    @NotNull(message = "Purchase date is required")
    private LocalDate purchaseDate;

    private String serialNumber;

    @NotBlank(message = "Invoice number is required")
    private String invoiceNumber;

    private String purchaseReference;

    private Boolean hasWarranty = true;


    public PurchaseRegistrationRequest() {
    }

    public String getProductId() {
        return this.productId;
    }

    public void setProductId(String productId) {
        this.productId = productId;
    }

    public String getCustomerEmail() {
        return this.customerEmail;
    }

    public void setCustomerEmail(String customerEmail) {
        this.customerEmail = customerEmail;
    }

    public LocalDate getPurchaseDate() {
        return this.purchaseDate;
    }

    public void setPurchaseDate(LocalDate purchaseDate) {
        this.purchaseDate = purchaseDate;
    }

    public String getSerialNumber() {
        return this.serialNumber;
    }

    public void setSerialNumber(String serialNumber) {
        this.serialNumber = serialNumber;
    }

    public String getInvoiceNumber() {
        return this.invoiceNumber;
    }

    public void setInvoiceNumber(String invoiceNumber) {
        this.invoiceNumber = invoiceNumber;
    }

    public String getPurchaseReference() {
        return this.purchaseReference;
    }

    public void setPurchaseReference(String purchaseReference) {
        this.purchaseReference = purchaseReference;
    }

    public Boolean getHasWarranty() {
        return this.hasWarranty;
    }

    public void setHasWarranty(Boolean hasWarranty) {
        this.hasWarranty = hasWarranty != null ? hasWarranty : true;
    }

}
