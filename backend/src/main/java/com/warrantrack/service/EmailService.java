package com.warrantrack.service;

import com.warrantrack.exception.BadRequestException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.mail.MailException;
import org.springframework.stereotype.Service;

import jakarta.mail.internet.MimeMessage;
import jakarta.mail.MessagingException;

@Service
public class EmailService {
    private static final Logger log = LoggerFactory.getLogger(EmailService.class);

    private final ObjectProvider<JavaMailSender> mailSenderProvider;

    @Value("${spring.mail.username:}")
    private String mailUsername;

    public EmailService(ObjectProvider<JavaMailSender> mailSenderProvider) {
        this.mailSenderProvider = mailSenderProvider;
    }

    public boolean sendOtpEmail(String toEmail, String otp, String purpose) {
        JavaMailSender mailSender = mailSenderProvider.getIfAvailable();

        if (mailUsername == null || mailUsername.isBlank() || mailSender == null) {
            log.error("SMTP is not configured. Cannot send {} email to {}", purpose, toEmail);
            return false;
        }

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(mailUsername);
            helper.setTo(toEmail);
            helper.setSubject("WarranTrack Verification Code: " + otp);

            String html = """
                <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">
                    <h2 style="color: #4f46e5; margin-top: 0;">WarranTrack Verification</h2>
                    <p style="color: #334155; font-size: 15px;">Your one-time verification code is:</p>
                    <div style="background: #f8fafc; border: 1px dashed #cbd5e1; padding: 18px; border-radius: 8px; text-align: center; margin: 20px 0;">
                        <span style="font-family: monospace; font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #1e293b;">%s</span>
                    </div>
                    <p style="color: #64748b; font-size: 13px; line-height: 1.5;">
                        This code is valid for 5 minutes and single-use.<br/>
                        If you did not request this verification code, please disregard this email.
                    </p>
                </div>
            """.formatted(otp);

            helper.setText(html, true);
            mailSender.send(message);
            log.info("✅ Verification email successfully sent to {}", toEmail);
            return true;
        } catch (MessagingException | MailException e) {
            String cause = e.getCause() != null ? e.getCause().getMessage() : e.getMessage();
            log.error("SMTP failed to send email to {}: {}. Root cause: {}", toEmail, e.getMessage(), cause);
            return false;
        }
    }

    public boolean sendPasswordResetOtpEmail(String toEmail, String otp) {
        JavaMailSender mailSender = mailSenderProvider.getIfAvailable();

        if (mailUsername == null || mailUsername.isBlank() || mailSender == null) {
            log.warn("⚠️ SMTP not configured. Password reset OTP for primary email {}: {}", toEmail, otp);
            return false;
        }

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(mailUsername);
            helper.setTo(toEmail);
            helper.setSubject("WarranTrack Password Reset Code: " + otp);

            String html = """
                <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">
                    <h2 style="color: #4f46e5; margin-top: 0;">WarranTrack Password Reset</h2>
                    <p style="color: #334155; font-size: 15px;">You requested a password reset for your WarranTrack account.</p>
                    <p style="color: #334155; font-size: 14px;">Your 6-digit verification code is:</p>
                    <div style="background: #f8fafc; border: 1px dashed #cbd5e1; padding: 18px; border-radius: 8px; text-align: center; margin: 20px 0;">
                        <span style="font-family: monospace; font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #1e293b;">%s</span>
                    </div>
                    <p style="color: #64748b; font-size: 13px; line-height: 1.5;">
                        This code is valid for <strong>5 minutes</strong> and single-use.<br/>
                        For security reasons, password reset codes are sent <strong>only to your primary registered account email address</strong>.<br/>
                        If you did not request this verification code, your account is safe and you can safely disregard this email.
                    </p>
                </div>
            """.formatted(otp);

            helper.setText(html, true);
            mailSender.send(message);
            log.info("✅ Password reset OTP email successfully sent to primary email {}", toEmail);
            return true;
        } catch (MessagingException | MailException e) {
            String cause = e.getCause() != null ? e.getCause().getMessage() : e.getMessage();
            log.error("SMTP failed to send password reset OTP to {}: {}. Root cause: {}", toEmail, e.getMessage(), cause);
            return false;
        }
    }

    public boolean sendPasswordResetEmail(String toEmail, String resetToken) {
        JavaMailSender mailSender = mailSenderProvider.getIfAvailable();

        if (mailUsername == null || mailUsername.isBlank() || mailSender == null) {
            log.error("❌ SMTP is not configured. Cannot send password reset email to {}", toEmail);
            throw new BadRequestException("SMTP mail service is not configured. Please set spring.mail.username and password in application.yml.");
        }

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(mailUsername);
            helper.setTo(toEmail);
            helper.setSubject("WarranTrack Password Reset Token");

            String html = """
                <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">
                    <h2 style="color: #4f46e5; margin-top: 0;">WarranTrack Password Reset</h2>
                    <p style="color: #334155; font-size: 15px;">You requested a password reset for your WarranTrack account.</p>
                    <p style="color: #334155; font-size: 14px;">Your reset token is:</p>
                    <div style="background: #f8fafc; border: 1px dashed #cbd5e1; padding: 18px; border-radius: 8px; text-align: center; margin: 20px 0;">
                        <span style="font-family: monospace; font-size: 20px; font-weight: bold; color: #1e293b; word-break: break-all;">%s</span>
                    </div>
                    <p style="color: #64748b; font-size: 13px; line-height: 1.5;">
                        This token is valid for 15 minutes.<br/>
                        Enter this token on the reset password screen to complete your password reset.<br/>
                        If you did not request this, you can safely ignore this email.
                    </p>
                </div>
            """.formatted(resetToken);

            helper.setText(html, true);
            mailSender.send(message);
            log.info("✅ Password reset email successfully sent to {}", toEmail);
            return true;
        } catch (Exception e) {
            log.error("⚠️ SMTP failed to send password reset email to {}: {}", toEmail, e.getMessage(), e);
            throw new BadRequestException("Failed to send password reset email to " + toEmail + ". SMTP error: " + e.getMessage());
        }
    }
}

