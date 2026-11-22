package com.warrantrack.model;

import com.warrantrack.model.enums.PaymentMethod;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Document(collection = "bills")
public class Bill {

    @Id
    private String id;

    @Indexed(unique = true)
    private String invoiceNumber;

    @Indexed
    private String retailerId;

    private String retailerBusinessName;
    private String retailerContactEmail;
    private String retailerContactPhone;
    private String retailerAddress;

    private String customerName;

    @Indexed
    private String customerEmail;

    private String customerPhone;

    private List<BillItem> items = new ArrayList<>();

    private Double subtotal = 0.0;
    private Double discountAmount = 0.0;
    private Double taxAmount = 0.0;
    private Double grandTotal = 0.0;
    private Double receivedAmount = 0.0;
    private Double changeAmount = 0.0;

    private PaymentMethod paymentMethod = PaymentMethod.CASH;
    private String paymentNotes;

    @CreatedDate
    private Instant createdAt;

    @LastModifiedDate
    private Instant updatedAt;

    public Bill() {
    }

    public Bill(String id, String invoiceNumber, String retailerId, String retailerBusinessName, String retailerContactEmail, String retailerContactPhone, String retailerAddress, String customerName, String customerEmail, String customerPhone, List<BillItem> items, Double subtotal, Double discountAmount, Double taxAmount, Double grandTotal, PaymentMethod paymentMethod, String paymentNotes, Instant createdAt, Instant updatedAt) {
        this(id, invoiceNumber, retailerId, retailerBusinessName, retailerContactEmail, retailerContactPhone, retailerAddress, customerName, customerEmail, customerPhone, items, subtotal, discountAmount, taxAmount, grandTotal, grandTotal, 0.0, paymentMethod, paymentNotes, createdAt, updatedAt);
    }

    public Bill(String id, String invoiceNumber, String retailerId, String retailerBusinessName, String retailerContactEmail, String retailerContactPhone, String retailerAddress, String customerName, String customerEmail, String customerPhone, List<BillItem> items, Double subtotal, Double discountAmount, Double taxAmount, Double grandTotal, Double receivedAmount, Double changeAmount, PaymentMethod paymentMethod, String paymentNotes, Instant createdAt, Instant updatedAt) {
        this.id = id;
        this.invoiceNumber = invoiceNumber;
        this.retailerId = retailerId;
        this.retailerBusinessName = retailerBusinessName;
        this.retailerContactEmail = retailerContactEmail;
        this.retailerContactPhone = retailerContactPhone;
        this.retailerAddress = retailerAddress;
        this.customerName = customerName;
        this.customerEmail = customerEmail;
        this.customerPhone = customerPhone;
        this.items = items != null ? items : new ArrayList<>();
        this.subtotal = subtotal != null ? subtotal : 0.0;
        this.discountAmount = discountAmount != null ? discountAmount : 0.0;
        this.taxAmount = taxAmount != null ? taxAmount : 0.0;
        this.grandTotal = grandTotal != null ? grandTotal : 0.0;
        this.receivedAmount = receivedAmount != null ? receivedAmount : (grandTotal != null ? grandTotal : 0.0);
        this.changeAmount = changeAmount != null ? changeAmount : 0.0;
        this.paymentMethod = paymentMethod != null ? paymentMethod : PaymentMethod.CASH;
        this.paymentNotes = paymentNotes;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getInvoiceNumber() {
        return invoiceNumber;
    }

    public void setInvoiceNumber(String invoiceNumber) {
        this.invoiceNumber = invoiceNumber;
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

    public String getRetailerContactEmail() {
        return retailerContactEmail;
    }

    public void setRetailerContactEmail(String retailerContactEmail) {
        this.retailerContactEmail = retailerContactEmail;
    }

    public String getRetailerContactPhone() {
        return retailerContactPhone;
    }

    public void setRetailerContactPhone(String retailerContactPhone) {
        this.retailerContactPhone = retailerContactPhone;
    }

    public String getRetailerAddress() {
        return retailerAddress;
    }

    public void setRetailerAddress(String retailerAddress) {
        this.retailerAddress = retailerAddress;
    }

    public String getCustomerName() {
        return customerName;
    }

    public void setCustomerName(String customerName) {
        this.customerName = customerName;
    }

    public String getCustomerEmail() {
        return customerEmail;
    }

    public void setCustomerEmail(String customerEmail) {
        this.customerEmail = customerEmail;
    }

    public String getCustomerPhone() {
        return customerPhone;
    }

    public void setCustomerPhone(String customerPhone) {
        this.customerPhone = customerPhone;
    }

    public List<BillItem> getItems() {
        return items;
    }

    public void setItems(List<BillItem> items) {
        this.items = items;
    }

    public Double getSubtotal() {
        return subtotal;
    }

    public void setSubtotal(Double subtotal) {
        this.subtotal = subtotal;
    }

    public Double getDiscountAmount() {
        return discountAmount;
    }

    public void setDiscountAmount(Double discountAmount) {
        this.discountAmount = discountAmount;
    }

    public Double getTaxAmount() {
        return taxAmount;
    }

    public void setTaxAmount(Double taxAmount) {
        this.taxAmount = taxAmount;
    }

    public Double getGrandTotal() {
        return grandTotal;
    }

    public void setGrandTotal(Double grandTotal) {
        this.grandTotal = grandTotal;
    }

    public Double getReceivedAmount() {
        return receivedAmount;
    }

    public void setReceivedAmount(Double receivedAmount) {
        this.receivedAmount = receivedAmount;
    }

    public Double getChangeAmount() {
        return changeAmount;
    }

    public void setChangeAmount(Double changeAmount) {
        this.changeAmount = changeAmount;
    }

    public PaymentMethod getPaymentMethod() {
        return paymentMethod;
    }

    public void setPaymentMethod(PaymentMethod paymentMethod) {
        this.paymentMethod = paymentMethod;
    }

    public String getPaymentNotes() {
        return paymentNotes;
    }

    public void setPaymentNotes(String paymentNotes) {
        this.paymentNotes = paymentNotes;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private String id;
        private String invoiceNumber;
        private String retailerId;
        private String retailerBusinessName;
        private String retailerContactEmail;
        private String retailerContactPhone;
        private String retailerAddress;
        private String customerName;
        private String customerEmail;
        private String customerPhone;
        private List<BillItem> items = new ArrayList<>();
        private Double subtotal = 0.0;
        private Double discountAmount = 0.0;
        private Double taxAmount = 0.0;
        private Double grandTotal = 0.0;
        private Double receivedAmount = 0.0;
        private Double changeAmount = 0.0;
        private PaymentMethod paymentMethod = PaymentMethod.CASH;
        private String paymentNotes;
        private Instant createdAt;
        private Instant updatedAt;

        public Builder id(String id) {
            this.id = id;
            return this;
        }

        public Builder invoiceNumber(String invoiceNumber) {
            this.invoiceNumber = invoiceNumber;
            return this;
        }

        public Builder retailerId(String retailerId) {
            this.retailerId = retailerId;
            return this;
        }

        public Builder retailerBusinessName(String retailerBusinessName) {
            this.retailerBusinessName = retailerBusinessName;
            return this;
        }

        public Builder retailerContactEmail(String retailerContactEmail) {
            this.retailerContactEmail = retailerContactEmail;
            return this;
        }

        public Builder retailerContactPhone(String retailerContactPhone) {
            this.retailerContactPhone = retailerContactPhone;
            return this;
        }

        public Builder retailerAddress(String retailerAddress) {
            this.retailerAddress = retailerAddress;
            return this;
        }

        public Builder customerName(String customerName) {
            this.customerName = customerName;
            return this;
        }

        public Builder customerEmail(String customerEmail) {
            this.customerEmail = customerEmail;
            return this;
        }

        public Builder customerPhone(String customerPhone) {
            this.customerPhone = customerPhone;
            return this;
        }

        public Builder items(List<BillItem> items) {
            this.items = items;
            return this;
        }

        public Builder subtotal(Double subtotal) {
            this.subtotal = subtotal;
            return this;
        }

        public Builder discountAmount(Double discountAmount) {
            this.discountAmount = discountAmount;
            return this;
        }

        public Builder taxAmount(Double taxAmount) {
            this.taxAmount = taxAmount;
            return this;
        }

        public Builder grandTotal(Double grandTotal) {
            this.grandTotal = grandTotal;
            return this;
        }

        public Builder receivedAmount(Double receivedAmount) {
            this.receivedAmount = receivedAmount;
            return this;
        }

        public Builder changeAmount(Double changeAmount) {
            this.changeAmount = changeAmount;
            return this;
        }

        public Builder paymentMethod(PaymentMethod paymentMethod) {
            this.paymentMethod = paymentMethod;
            return this;
        }

        public Builder paymentNotes(String paymentNotes) {
            this.paymentNotes = paymentNotes;
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

        public Bill build() {
            return new Bill(id, invoiceNumber, retailerId, retailerBusinessName, retailerContactEmail, retailerContactPhone, retailerAddress, customerName, customerEmail, customerPhone, items, subtotal, discountAmount, taxAmount, grandTotal, receivedAmount, changeAmount, paymentMethod, paymentNotes, createdAt, updatedAt);
        }
    }
}

