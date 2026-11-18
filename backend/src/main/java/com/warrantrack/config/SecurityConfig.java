package com.warrantrack.config;

import com.warrantrack.security.JwtAuthenticationFilter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

/**
 * Security Configuration for WarranTrack Platform.
 * 
 * Configures:
 * 1. Stateless Session Management: Uses JSON Web Tokens (JWT) instead of HTTP sessions.
 * 2. Cross-Origin Resource Sharing (CORS): Allows frontend SPA (http://localhost:5173).
 * 3. Role-Based Access Control (RBAC): Fine-grained endpoint authorization for ADMIN, RETAILER, and CUSTOMER.
 * 4. Password Hashing: BCrypt one-way password hashing algorithm.
 */
@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    public SecurityConfig(JwtAuthenticationFilter jwtAuthenticationFilter) {
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .cors(cors -> cors.configurationSource(request -> {
                var config = new org.springframework.web.cors.CorsConfiguration();
                config.addAllowedOrigin("http://localhost:5173");
                config.addAllowedMethod("*");
                config.addAllowedHeader("*");
                config.setAllowCredentials(true);
                return config;
            }))
            .csrf(csrf -> csrf.disable())
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                // Public endpoints
                .requestMatchers("/api/auth/**").permitAll()
                .requestMatchers("/api/public/**").permitAll()
                .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()

                // Admin endpoints
                .requestMatchers("/api/admin/**").hasRole("ADMIN")

                // Retailer endpoints
                .requestMatchers("/api/retailer/**").hasRole("RETAILER")
                .requestMatchers("/api/products/**").hasRole("RETAILER")
                .requestMatchers("/api/purchases/**").hasRole("RETAILER")
                .requestMatchers("/api/bills/invoice/**").permitAll()
                .requestMatchers("/api/bills/**").hasRole("RETAILER")

                // Customer endpoints
                .requestMatchers("/api/customer/**").hasRole("CUSTOMER")

                // Claims - both retailer and customer
                .requestMatchers("/api/claims/**").authenticated()

                // Notifications & analytics
                .requestMatchers("/api/notifications/**").authenticated()
                .requestMatchers("/api/analytics/**").authenticated()

                // Everything else requires authentication
                .anyRequest().authenticated()
            )
            .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }
}

