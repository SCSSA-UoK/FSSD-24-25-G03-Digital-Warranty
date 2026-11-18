package com.warrantrack.dto.auth;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
public class RegisterRetailerRequest {
    @NotBlank(message = "Representative name is required")
    private String name;

    @NotBlank(message = "Account email is required")
    @Email(message = "Valid email is required")
    private String email;

    @NotBlank(message = "Password is required")
    @Size(min = 6, message = "Password must be at least 6 characters")
    private String password;

    @NotBlank(message = "Business name is required")
    private String businessName;

    @NotBlank(message = "Business registration number is required")
    private String registrationNumber;

    @NotBlank(message = "Business contact email is required")
    @Email(message = "Valid contact email is required")
    private String contactEmail;

    @NotBlank(message = "Business contact phone is required")
    @Pattern(regexp = "^[0-9+()\\-\\s]{7,20}$", message = "Phone number format is invalid")
    private String contactPhone;

    @NotBlank(message = "Business address is required")
    private String address;

    private String description;


    public RegisterRetailerRequest() {
    }

    public String getName() {
        return this.name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getEmail() {
        return this.email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPassword() {
        return this.password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public String getBusinessName() {
        return this.businessName;
    }

    public void setBusinessName(String businessName) {
        this.businessName = businessName;
    }

    public String getRegistrationNumber() {
        return this.registrationNumber;
    }

    public void setRegistrationNumber(String registrationNumber) {
        this.registrationNumber = registrationNumber;
    }

    public String getContactEmail() {
        return this.contactEmail;
    }

    public void setContactEmail(String contactEmail) {
        this.contactEmail = contactEmail;
    }

    public String getContactPhone() {
        return this.contactPhone;
    }

    public void setContactPhone(String contactPhone) {
        this.contactPhone = contactPhone;
    }

    public String getAddress() {
        return this.address;
    }

    public void setAddress(String address) {
        this.address = address;
    }

    public String getDescription() {
        return this.description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

}
