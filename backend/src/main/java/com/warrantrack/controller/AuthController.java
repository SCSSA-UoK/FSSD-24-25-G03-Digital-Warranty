package com.warrantrack.controller;

import com.warrantrack.dto.ApiResponse;
import com.warrantrack.dto.auth.*;
import com.warrantrack.security.UserPrincipal;
import com.warrantrack.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register/customer")
    public ResponseEntity<ApiResponse<AuthResponse>> registerCustomer(@Valid @RequestBody RegisterCustomerRequest request) {
        AuthResponse response = authService.registerCustomer(request);
        return ResponseEntity.ok(ApiResponse.success("Registration successful. Please verify your email with the OTP sent.", response));
    }

    @PostMapping("/register/retailer")
    public ResponseEntity<ApiResponse<AuthResponse>> registerRetailer(@Valid @RequestBody RegisterRetailerRequest request) {
        AuthResponse response = authService.registerRetailer(request);
        return ResponseEntity.ok(ApiResponse.success("Retailer registration submitted. Pending admin approval.", response));
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(@Valid @RequestBody LoginRequest request) {
        AuthResponse response = authService.login(request);
        return ResponseEntity.ok(ApiResponse.success("Login successful", response));
    }

    @PostMapping("/verify-email")
    public ResponseEntity<ApiResponse<String>> verifyEmail(@Valid @RequestBody VerifyEmailOtpRequest request) {
        authService.verifyEmailOtp(request);
        return ResponseEntity.ok(ApiResponse.success("Email verified successfully", null));
    }

    @PostMapping("/resend-otp")
    public ResponseEntity<ApiResponse<String>> resendOtp(@RequestParam String email) {
        AuthService.OtpResult result = authService.sendEmailVerificationOtp(email);
        return ResponseEntity.ok(ApiResponse.success("A verification OTP has been sent to your email address: " + email, null));
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<ApiResponse<String>> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        authService.requestPasswordReset(request);
        return ResponseEntity.ok(ApiResponse.success(
                "A password reset token has been sent to " + request.getEmail() + ". Please check your inbox (and spam folder).",
                null
        ));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<ApiResponse<String>> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        authService.resetPassword(request);
        return ResponseEntity.ok(ApiResponse.success("Password reset successful. You may now log in with your new password.", null));
    }

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<UserResponse>> getCurrentUser(@AuthenticationPrincipal UserPrincipal principal) {
        if (principal == null) {
            throw new com.warrantrack.exception.UnauthorizedException("User not authenticated");
        }
        UserResponse response = authService.getCurrentUser(principal.getId());
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PutMapping("/profile")
    public ResponseEntity<ApiResponse<UserResponse>> updateProfile(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody UpdateProfileRequest request) {
        if (principal == null) {
            throw new com.warrantrack.exception.UnauthorizedException("User not authenticated");
        }
        UserResponse response = authService.updateProfile(principal.getId(), request);
        return ResponseEntity.ok(ApiResponse.success("Profile updated successfully", response));
    }

    @PostMapping("/change-password")
    public ResponseEntity<ApiResponse<String>> changePassword(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody ChangePasswordRequest request) {
        if (principal == null) {
            throw new com.warrantrack.exception.UnauthorizedException("User not authenticated");
        }
        authService.changePassword(principal.getId(), request);
        return ResponseEntity.ok(ApiResponse.success("Password changed successfully", null));
    }

    @PostMapping("/reactivate")
    public ResponseEntity<ApiResponse<AuthResponse>> reactivateAccount(@Valid @RequestBody ReactivateAccountRequest request) {
        AuthResponse response = authService.reactivateAccount(request);
        return ResponseEntity.ok(ApiResponse.success("Account reactivated successfully. Welcome back!", response));
    }

    @PatchMapping("/deactivate")
    public ResponseEntity<ApiResponse<String>> deactivateAccount(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestBody(required = false) java.util.Map<String, String> body) {
        if (principal == null) {
            throw new com.warrantrack.exception.UnauthorizedException("User not authenticated");
        }
        String reason = body != null ? body.get("reason") : null;
        authService.deactivateCustomerAccount(principal.getId(), reason);
        return ResponseEntity.ok(ApiResponse.success("Account deactivated successfully. You may reactivate at any time by logging back in.", null));
    }
}

