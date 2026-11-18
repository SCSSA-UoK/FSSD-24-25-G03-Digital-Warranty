package com.warrantrack.model;

import com.warrantrack.model.enums.LinkingStatus;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.time.LocalDate;

@Document(collection = "purchases")
@CompoundIndex(name = "idx_retailer_purchaseRef", def = "{'retailerId': 1, 'purchaseReference': 1}", unique = true)
public class Purchase {

    @Id
    private String id;

    private String retailerId;

    private String productId;

    private String productName;

    private String productBrand;

    private String productModel;

    private Double unitPrice = 0.0;

    private int quantity = 1;

    private boolean hasWarranty = true;

    private String billId;

    private String paymentMethod;

    private String customerId;

    private String customerEmail;

    @Indexed
    private String customerEmailNormalized;

    private LocalDate purchaseDate;

    private String serialNumber;

    private String invoiceNumber;

    private String purchaseReference;

    private LinkingStatus linkingStatus = LinkingStatus.UNCLAIMED;

    private String registeredBy;

    @CreatedDate
    private Instant createdAt;

    @LastModifiedDate
    private Instant updatedAt;

    public Purchase() {
    }

    public Purchase(String id, String retailerId, String productId, String customerId, String customerEmail, String customerEmailNormalized, LocalDate purchaseDate, String serialNumber, String invoiceNumber, String purchaseReference, LinkingStatus linkingStatus, String registeredBy, Instant createdAt, Instant updatedAt) {
        this(id, retailerId, productId, null, null, null, 0.0, 1, true, null, null, customerId, customerEmail, customerEmailNormalized, purchaseDate, serialNumber, invoiceNumber, purchaseReference, linkingStatus, registeredBy, createdAt, updatedAt);
    }

    public Purchase(String id, String retailerId, String productId, String productName, String productBrand, String productModel, Double unitPrice, int quantity, boolean hasWarranty, String billId, String paymentMethod, String customerId, String customerEmail, String customerEmailNormalized, LocalDate purchaseDate, String serialNumber, String invoiceNumber, String purchaseReference, LinkingStatus linkingStatus, String registeredBy, Instant createdAt, Instant updatedAt) {
        this.id = id;
        this.retailerId = retailerId;
        this.productId = productId;
        this.productName = productName;
        this.productBrand = productBrand;
        this.productModel = productModel;
        this.unitPrice = unitPrice != null ? unitPrice : 0.0;
        this.quantity = quantity > 0 ? quantity : 1;
        this.hasWarranty = hasWarranty;
        this.billId = billId;
        this.paymentMethod = paymentMethod;
        this.customerId = customerId;
        this.customerEmail = customerEmail;
        this.customerEmailNormalized = customerEmailNormalized;
        this.purchaseDate = purchaseDate;
        this.serialNumber = serialNumber;
        this.invoiceNumber = invoiceNumber;
        this.purchaseReference = purchaseReference;
        this.linkingStatus = linkingStatus != null ? linkingStatus : LinkingStatus.UNCLAIMED;
        this.registeredBy = registeredBy;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    public String getId() {
        return this.id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getRetailerId() {
        return this.retailerId;
    }

    public void setRetailerId(String retailerId) {
        this.retailerId = retailerId;
    }

    public String getProductId() {
        return this.productId;
    }

    public void setProductId(String productId) {
        this.productId = productId;
    }

    public String getProductName() {
        return this.productName;
    }

    public void setProductName(String productName) {
        this.productName = productName;
    }

    public String getProductBrand() {
        return this.productBrand;
    }

    public void setProductBrand(String productBrand) {
        this.productBrand = productBrand;
    }

    public String getProductModel() {
        return this.productModel;
    }

    public void setProductModel(String productModel) {
        this.productModel = productModel;
    }

    public Double getUnitPrice() {
        return this.unitPrice;
    }

    public void setUnitPrice(Double unitPrice) {
        this.unitPrice = unitPrice != null ? unitPrice : 0.0;
    }

    public int getQuantity() {
        return this.quantity;
    }

    public void setQuantity(int quantity) {
        this.quantity = quantity > 0 ? quantity : 1;
    }

    public boolean isHasWarranty() {
        return this.hasWarranty;
    }

    public void setHasWarranty(boolean hasWarranty) {
        this.hasWarranty = hasWarranty;
    }

    public String getBillId() {
        return this.billId;
    }

    public void setBillId(String billId) {
        this.billId = billId;
    }

    public String getPaymentMethod() {
        return this.paymentMethod;
    }

    public void setPaymentMethod(String paymentMethod) {
        this.paymentMethod = paymentMethod;
    }

    public String getCustomerId() {
        return this.customerId;
    }

    public void setCustomerId(String customerId) {
        this.customerId = customerId;
    }

    public String getCustomerEmail() {
        return this.customerEmail;
    }

    public void setCustomerEmail(String customerEmail) {
        this.customerEmail = customerEmail;
    }

    public String getCustomerEmailNormalized() {
        return this.customerEmailNormalized;
    }

    public void setCustomerEmailNormalized(String customerEmailNormalized) {
        this.customerEmailNormalized = customerEmailNormalized;
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

    public LinkingStatus getLinkingStatus() {
        return this.linkingStatus;
    }

    public void setLinkingStatus(LinkingStatus linkingStatus) {
        this.linkingStatus = linkingStatus;
    }

    public String getRegisteredBy() {
        return this.registeredBy;
    }

    public void setRegisteredBy(String registeredBy) {
        this.registeredBy = registeredBy;
    }

    public Instant getCreatedAt() {
        return this.createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public Instant getUpdatedAt() {
        return this.updatedAt;
    }

    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private String id;
        private String retailerId;
        private String productId;
        private String productName;
        private String productBrand;
        private String productModel;
        private Double unitPrice = 0.0;
        private int quantity = 1;
        private boolean hasWarranty = true;
        private String billId;
        private String paymentMethod;
        private String customerId;
        private String customerEmail;
        private String customerEmailNormalized;
        private LocalDate purchaseDate;
        private String serialNumber;
        private String invoiceNumber;
        private String purchaseReference;
        private LinkingStatus linkingStatus = LinkingStatus.UNCLAIMED;
        private String registeredBy;
        private Instant createdAt;
        private Instant updatedAt;

        public Builder() {}

        public Builder id(String id) {
            this.id = id;
            return this;
        }

        public Builder retailerId(String retailerId) {
            this.retailerId = retailerId;
            return this;
        }

        public Builder productId(String productId) {
            this.productId = productId;
            return this;
        }

        public Builder productName(String productName) {
            this.productName = productName;
            return this;
        }

        public Builder productBrand(String productBrand) {
            this.productBrand = productBrand;
            return this;
        }

        public Builder productModel(String productModel) {
            this.productModel = productModel;
            return this;
        }

        public Builder unitPrice(Double unitPrice) {
            this.unitPrice = unitPrice;
            return this;
        }

        public Builder quantity(int quantity) {
            this.quantity = quantity;
            return this;
        }

        public Builder hasWarranty(boolean hasWarranty) {
            this.hasWarranty = hasWarranty;
            return this;
        }

        public Builder billId(String billId) {
            this.billId = billId;
            return this;
        }

        public Builder paymentMethod(String paymentMethod) {
            this.paymentMethod = paymentMethod;
            return this;
        }

        public Builder customerId(String customerId) {
            this.customerId = customerId;
            return this;
        }

        public Builder customerEmail(String customerEmail) {
            this.customerEmail = customerEmail;
            return this;
        }

        public Builder customerEmailNormalized(String customerEmailNormalized) {
            this.customerEmailNormalized = customerEmailNormalized;
            return this;
        }

        public Builder purchaseDate(LocalDate purchaseDate) {
            this.purchaseDate = purchaseDate;
            return this;
        }

        public Builder serialNumber(String serialNumber) {
            this.serialNumber = serialNumber;
            return this;
        }

        public Builder invoiceNumber(String invoiceNumber) {
            this.invoiceNumber = invoiceNumber;
            return this;
        }

        public Builder purchaseReference(String purchaseReference) {
            this.purchaseReference = purchaseReference;
            return this;
        }

        public Builder linkingStatus(LinkingStatus linkingStatus) {
            this.linkingStatus = linkingStatus;
            return this;
        }

        public Builder registeredBy(String registeredBy) {
            this.registeredBy = registeredBy;
            return this;
        }

        public Builder createdAt(Instant createdAt) {
            this.createdAt = createdAt;
            return this;
        }

        public Builder updatedAt(Instant updatedAt) {
            this.updatedAt = updatedAt;
            return this;
        }

        public Purchase build() {
            return new Purchase(this.id, this.retailerId, this.productId, this.productName, this.productBrand, this.productModel, this.unitPrice, this.quantity, this.hasWarranty, this.billId, this.paymentMethod, this.customerId, this.customerEmail, this.customerEmailNormalized, this.purchaseDate, this.serialNumber, this.invoiceNumber, this.purchaseReference, this.linkingStatus, this.registeredBy, this.createdAt, this.updatedAt);
        }
    }

}
