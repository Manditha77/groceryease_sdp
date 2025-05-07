package com.uok.groceryease_backend.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Collections;
import java.util.Map;
import java.util.concurrent.atomic.AtomicReference;

@CrossOrigin(origins = "*")
@RestController
@RequestMapping("/api/barcodes")
public class BarcodeController {
    private final AtomicReference<String> latestBarcode = new AtomicReference<>("");

    @PostMapping
    public ResponseEntity<String> saveLatestBarcode(@RequestBody Map<String, String> payload) {
        String barcode = payload.get("barcode");
        if (barcode != null && !barcode.isEmpty()) {
            latestBarcode.set(barcode);
            return ResponseEntity.ok("Barcode saved: " + barcode);
        }
        return ResponseEntity.badRequest().body("Invalid barcode");
    }

    @GetMapping("/latest")
    public ResponseEntity<Map<String, String>> getLatestBarcode() {
        return ResponseEntity.ok(Collections.singletonMap("barcode", latestBarcode.get()));
    }
}