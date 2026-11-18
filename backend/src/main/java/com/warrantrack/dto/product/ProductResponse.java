package com.warrantrack.dto.product;

import com.warrantrack.model.enums.WarrantyUnit;
import java.time.Instant;

public class ProductResponse {
    private String id;
    private String retailerId;
    private String name;
    private String brand;
    private String model;
    private String category;
    private String description;
    private int warrantyDuration;
    private WarrantyUnit warrantyUnit;
    private String warrantyTerms;
    private boolean hasWarranty = true;
    private Double price = 0.0;
    private Integer stockQuantity = 0;
    private boolean active;
    private Instant createdAt;
    private Instant updatedAt;


    public ProductResponse() {
    }

    public ProductResponse(String id, String retailerId, String name, String brand, String model, String category, String description, int warrantyDuration, WarrantyUnit warrantyUnit, String warrantyTerms, boolean hasWarranty, Double price, boolean active, Instant createdAt, Instant updatedAt) {
        this(id, retailerId, name, brand, model, category, description, warrantyDuration, warrantyUnit, warrantyTerms, hasWarranty, price, 0, active, createdAt, updatedAt);
    }

    public ProductResponse(String id, String retailerId, String name, String brand, String model, String category, String description, int warrantyDuration, WarrantyUnit warrantyUnit, String warrantyTerms, boolean hasWarranty, Double price, Integer stockQuantity, boolean active, Instant createdAt, Instant updatedAt) {
        this.id = id;
        this.retailerId = retailerId;
        this.name = name;
        this.brand = brand;
        this.model = model;
        this.category = category;
        this.description = description;
        this.warrantyDuration = warrantyDuration;
        this.warrantyUnit = warrantyUnit;
        this.warrantyTerms = warrantyTerms;
        this.hasWarranty = hasWarranty;
        this.price = price != null ? price : 0.0;
        this.stockQuantity = stockQuantity != null ? stockQuantity : 0;
        this.active = active;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    public ProductResponse(String id, String retailerId, String name, String brand, String model, String category, String description, int warrantyDuration, WarrantyUnit warrantyUnit, String warrantyTerms, boolean active, Instant createdAt, Instant updatedAt) {
        this(id, retailerId, name, brand, model, category, description, warrantyDuration, warrantyUnit, warrantyTerms, true, 0.0, 0, active, createdAt, updatedAt);
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

    public int getWarrantyDuration() {
        return this.warrantyDuration;
    }

    public void setWarrantyDuration(int warrantyDuration) {
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

    public boolean isHasWarranty() {
        return this.hasWarranty;
    }

    public void setHasWarranty(boolean hasWarranty) {
        this.hasWarranty = hasWarranty;
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

    public boolean isActive() {
        return this.active;
    }

    public void setActive(boolean active) {
        this.active = active;
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
        private String name;
        private String brand;
        private String model;
        private String category;
        private String description;
        private int warrantyDuration;
        private WarrantyUnit warrantyUnit;
        private String warrantyTerms;
        private boolean hasWarranty = true;
        private Double price = 0.0;
        private Integer stockQuantity = 0;
        private boolean active;
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

        public Builder name(String name) {
            this.name = name;
            return this;
        }

        public Builder brand(String brand) {
            this.brand = brand;
            return this;
        }

        public Builder model(String model) {
            this.model = model;
            return this;
        }

        public Builder category(String category) {
            this.category = category;
            return this;
        }

        public Builder description(String description) {
            this.description = description;
            return this;
        }

        public Builder warrantyDuration(int warrantyDuration) {
            this.warrantyDuration = warrantyDuration;
            return this;
        }

        public Builder warrantyUnit(WarrantyUnit warrantyUnit) {
            this.warrantyUnit = warrantyUnit;
            return this;
        }

        public Builder warrantyTerms(String warrantyTerms) {
            this.warrantyTerms = warrantyTerms;
            return this;
        }

        public Builder hasWarranty(boolean hasWarranty) {
            this.hasWarranty = hasWarranty;
            return this;
        }

        public Builder price(Double price) {
            this.price = price != null ? price : 0.0;
            return this;
        }

        public Builder stockQuantity(Integer stockQuantity) {
            this.stockQuantity = stockQuantity != null ? stockQuantity : 0;
            return this;
        }

        public Builder active(boolean active) {
            this.active = active;
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

        public ProductResponse build() {
            return new ProductResponse(this.id, this.retailerId, this.name, this.brand, this.model, this.category, this.description, this.warrantyDuration, this.warrantyUnit, this.warrantyTerms, this.hasWarranty, this.price, this.stockQuantity, this.active, this.createdAt, this.updatedAt);
        }
    }

}
