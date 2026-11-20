package com.warrantrack.controller;

import com.warrantrack.dto.ApiResponse;
import com.warrantrack.dto.warranty.PublicWarrantyResponse;
import com.warrantrack.service.WarrantyService;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

@RestController
@RequestMapping("/api/public")
public class PublicController {

    private final WarrantyService warrantyService;

    public PublicController(WarrantyService warrantyService) {
        this.warrantyService = warrantyService;
    }

    @GetMapping("/warranties/verify/{qrToken}")
    public ResponseEntity<ApiResponse<PublicWarrantyResponse>> verifyWarrantyPublicly(@PathVariable String qrToken) {
        PublicWarrantyResponse response = warrantyService.verifyPublicWarranty(qrToken);
        return ResponseEntity.ok(ApiResponse.success("Warranty verified", response));
    }

    @GetMapping("/uploads/evidence/{filename:.+}")
    public ResponseEntity<Resource> getEvidenceFile(@PathVariable String filename) {
        Path filePath = Paths.get("uploads", "evidence").resolve(filename).normalize();
        if (!Files.exists(filePath)) {
            filePath = Paths.get("backend", "uploads", "evidence").resolve(filename).normalize();
        }
        if (!Files.exists(filePath)) {
            return ResponseEntity.notFound().build();
        }
        Resource resource = new FileSystemResource(filePath);
        String contentType = "application/octet-stream";
        try {
            String probed = Files.probeContentType(filePath);
            if (probed != null) {
                contentType = probed;
            } else if (filename.endsWith(".jpg") || filename.endsWith(".jpeg")) {
                contentType = "image/jpeg";
            } else if (filename.endsWith(".png")) {
                contentType = "image/png";
            }
        } catch (IOException ignored) {}

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(contentType))
                .header(HttpHeaders.CACHE_CONTROL, "public, max-age=86400")
                .body(resource);
    }
}


