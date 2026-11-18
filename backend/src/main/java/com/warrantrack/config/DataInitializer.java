package com.warrantrack.config;


import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import com.warrantrack.model.User;
import com.warrantrack.model.enums.AccountStatus;
import com.warrantrack.model.enums.Role;
import com.warrantrack.repository.UserRepository;
import com.warrantrack.util.EmailNormalizer;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.beans.factory.annotation.Value;

import java.time.Instant;

@Configuration
public class DataInitializer implements CommandLineRunner {
    private static final Logger log = LoggerFactory.getLogger(DataInitializer.class);


    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final String initialAdminPassword;

    public DataInitializer(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            @Value("${app.initial-admin.password}") String initialAdminPassword) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.initialAdminPassword = initialAdminPassword;
    }

    @Override
    public void run(String... args) {
        String adminEmail = "admin@warrantrack.com";
        String normalizedEmail = EmailNormalizer.normalize(adminEmail);

        if (!userRepository.existsByEmailNormalized(normalizedEmail)) {
            User admin = User.builder()
                    .name("System Administrator")
                    .email(adminEmail)
                    .emailNormalized(normalizedEmail)
                    .phone("+1-555-0100")
                    .passwordHash(passwordEncoder.encode(initialAdminPassword))
                    .role(Role.ADMIN)
                    .emailVerified(true)
                    .accountStatus(AccountStatus.ACTIVE)
                    .createdAt(Instant.now())
                    .updatedAt(Instant.now())
                    .build();

            userRepository.save(admin);
            log.info("Initialized default ADMIN account: {}", adminEmail);
        }
    }
}

