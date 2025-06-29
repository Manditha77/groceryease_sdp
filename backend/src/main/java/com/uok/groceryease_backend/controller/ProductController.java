package com.uok.groceryease_backend.controller;

import com.uok.groceryease_backend.DTO.ProductDTO;
import com.uok.groceryease_backend.DTO.ProductBatchDTO;
import com.uok.groceryease_backend.service.ProductService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.ClassPathResource;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.List;

@CrossOrigin(origins = "*")
@RestController
@RequestMapping("/api/products")
public class ProductController {

    @Autowired
    private ProductService productService;

    @PostMapping(consumes = {"multipart/form-data"})
    public ResponseEntity<ProductDTO> addProduct(
            @RequestParam("productName") String productName,
            @RequestParam("categoryName") String categoryName,
            @RequestParam("units") double units, // Changed from quantity to units
            @RequestParam("buyingPrice") double buyingPrice,
            @RequestParam("sellingPrice") double sellingPrice,
            @RequestParam("supplierCompanyName") String supplierCompanyName,
            @RequestParam(value = "barcode", required = false) String barcode,
            @RequestParam(value = "unitType", required = false) String unitType, // Added unitType
            @RequestParam(value = "image", required = false) MultipartFile image,
            @RequestParam(value = "expireDate", required = false) String expireDateStr) throws IOException {

        ProductDTO productDTO = new ProductDTO();
        productDTO.setProductName(productName);
        productDTO.setCategoryName(categoryName);
        productDTO.setUnits(units);
        productDTO.setBuyingPrice(buyingPrice);
        productDTO.setSellingPrice(sellingPrice);
        productDTO.setSupplierCompanyName(supplierCompanyName);
        productDTO.setBarcode(barcode);
        productDTO.setUnitType(unitType);
        if (expireDateStr != null && !expireDateStr.isEmpty()) {
            productDTO.setExpireDate(LocalDateTime.parse(expireDateStr)); // Assuming ISO format (e.g., 2025-08-20T00:00:00)
        }

        if (image != null && !image.isEmpty()) {
            productDTO.setImage(image.getBytes());
        } else {
            ClassPathResource defaultImage = new ClassPathResource("static/images/unnamed.jpg");
            byte[] defaultImageBytes = defaultImage.getInputStream().readAllBytes();
            productDTO.setImage(defaultImageBytes);
        }

        ProductDTO createdProduct = productService.addProduct(productDTO);
        return ResponseEntity.ok(createdProduct);
    }

    @GetMapping
    public ResponseEntity<List<ProductDTO>> getAllProducts() {
        List<ProductDTO> products = productService.getAllProducts();
        return ResponseEntity.ok(products);
    }

    @PutMapping(value = "/{productId}", consumes = {"multipart/form-data"})
    public ResponseEntity<ProductDTO> updateProduct(
            @PathVariable Long productId,
            @RequestParam("productName") String productName,
            @RequestParam("categoryName") String categoryName,
            @RequestParam("units") double units, // Changed from quantity to units
            @RequestParam("buyingPrice") double buyingPrice,
            @RequestParam("sellingPrice") double sellingPrice,
            @RequestParam("supplierCompanyName") String supplierCompanyName,
            @RequestParam(value = "barcode", required = false) String barcode,
            @RequestParam(value = "unitType", required = false) String unitType, // Added unitType
            @RequestParam(value = "image", required = false) MultipartFile image,
            @RequestParam(value = "expireDate", required = false) String expireDateStr) throws IOException {

        ProductDTO productDTO = new ProductDTO();
        productDTO.setProductName(productName);
        productDTO.setCategoryName(categoryName);
        productDTO.setUnits(units);
        productDTO.setBuyingPrice(buyingPrice);
        productDTO.setSellingPrice(sellingPrice);
        productDTO.setSupplierCompanyName(supplierCompanyName);
        productDTO.setBarcode(barcode);
        productDTO.setUnitType(unitType);
        if (expireDateStr != null && !expireDateStr.isEmpty()) {
            productDTO.setExpireDate(LocalDateTime.parse(expireDateStr)); // Assuming ISO format
        }

        if (image != null && !image.isEmpty()) {
            productDTO.setImage(image.getBytes());
        } else {
            ClassPathResource defaultImage = new ClassPathResource("static/images/unnamed.jpg");
            byte[] defaultImageBytes = defaultImage.getInputStream().readAllBytes();
            productDTO.setImage(defaultImageBytes);
        }

        ProductDTO updatedProduct = productService.updateProduct(productId, productDTO);
        return ResponseEntity.ok(updatedProduct);
    }

    @PostMapping("/{productId}/restock")
    public ResponseEntity<ProductDTO> restockProduct(
            @PathVariable Long productId,
            @RequestParam("units") double units, // Changed from quantity to units
            @RequestParam("buyingPrice") double buyingPrice,
            @RequestParam("sellingPrice") double sellingPrice,
            @RequestParam(value = "batchId", required = false) Long batchId,
            @RequestParam(value = "expireDate", required = false) String expireDateStr) {

        ProductDTO restockedProduct = productService.restockProduct(productId, units, buyingPrice, sellingPrice, batchId);
        return ResponseEntity.ok(restockedProduct);
    }

    @PutMapping("/batches/{batchId}")
    public ResponseEntity<ProductBatchDTO> updateBatch(
            @PathVariable Long batchId,
            @RequestParam("units") double units, // Changed from quantity to units
            @RequestParam("buyingPrice") double buyingPrice,
            @RequestParam("sellingPrice") double sellingPrice,
            @RequestParam("expireDate") String expireDateStr) {

        LocalDateTime expireDate = LocalDateTime.parse(expireDateStr); // Assuming ISO format
        ProductBatchDTO updatedBatch = productService.updateBatch(batchId, units, buyingPrice, sellingPrice, expireDate);
        return ResponseEntity.ok(updatedBatch);
    }

    @PutMapping("/{productId}/update-prices")
    public ResponseEntity<Void> updateBatchPrices(
            @PathVariable Long productId,
            @RequestParam("buyingPrice") double buyingPrice,
            @RequestParam("sellingPrice") double sellingPrice) {

        productService.updateBatchPrices(productId, buyingPrice, sellingPrice);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/{productId}/batches")
    public ResponseEntity<List<ProductBatchDTO>> getProductBatches(@PathVariable Long productId) {
        List<ProductBatchDTO> batches = productService.getProductBatches(productId);
        return ResponseEntity.ok(batches);
    }

    @DeleteMapping("/batches/{batchId}")
    public ResponseEntity<Void> deleteBatch(@PathVariable Long batchId) {
        productService.deleteBatch(batchId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/expiring-batches")
    public ResponseEntity<List<ProductBatchDTO>> getExpiringBatches() {
        List<ProductBatchDTO> expiringBatches = productService.getExpiringBatches();
        return ResponseEntity.ok(expiringBatches);
    }

    @DeleteMapping("/{productId}")
    public ResponseEntity<Void> deleteProduct(@PathVariable Long productId) {
        productService.deleteProduct(productId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/barcode/{barcode}")
    public ResponseEntity<ProductDTO> getProductByBarcode(@PathVariable String barcode) {
        ProductDTO product = productService.getProductByBarcode(barcode);
        if (product != null) {
            return ResponseEntity.ok(product);
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/name-supplier")
    public ResponseEntity<ProductDTO> getProductByNameAndSupplier(
            @RequestParam("productName") String productName,
            @RequestParam("supplierCompanyName") String supplierCompanyName) {
        ProductDTO product = productService.getProductByNameAndSupplier(productName, supplierCompanyName);
        if (product != null) {
            return ResponseEntity.ok(product);
        } else {
            return ResponseEntity.notFound().build();
        }
    }
}