package com.uok.groceryease_backend.controller;

import com.uok.groceryease_backend.DTO.ProductDTO;
import com.uok.groceryease_backend.service.ProductService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@CrossOrigin (origins = "*")
@RestController
@RequestMapping("/api/products")
public class ProductController {

    @Autowired
    private ProductService productService;

    @PostMapping(consumes = { "multipart/form-data" })
    public ResponseEntity<ProductDTO> addProduct(
            @RequestParam("productName") String productName,
            @RequestParam("categoryName") String categoryName,
            @RequestParam("quantity") int quantity,
            @RequestParam("buyingPrice") double buyingPrice,
            @RequestParam("sellingPrice") double sellingPrice,
            @RequestParam("supplierCompanyName") String supplierCompanyName,
            @RequestParam("image") MultipartFile image) throws IOException {

        ProductDTO productDTO = new ProductDTO();
        productDTO.setProductName(productName);
        productDTO.setCategoryName(categoryName);
        productDTO.setQuantity(quantity);
        productDTO.setBuyingPrice(buyingPrice);
        productDTO.setSellingPrice(sellingPrice);
        productDTO.setSupplierCompanyName(supplierCompanyName);
        productDTO.setImage(image.getBytes()); // Convert image to byte array

        ProductDTO createdProduct = productService.addProduct(productDTO);
        return ResponseEntity.ok(createdProduct);
    }

    @GetMapping
    public ResponseEntity<List<ProductDTO>> getAllProducts() {
        List<ProductDTO> products = productService.getAllProducts();
        return ResponseEntity.ok(products);
    }

    @PutMapping(value = "/{productId}", consumes = { "multipart/form-data" })
    public ResponseEntity<ProductDTO> updateProduct(
            @PathVariable Long productId,
            @RequestParam("productName") String productName,
            @RequestParam("categoryName") String categoryName,
            @RequestParam("quantity") int quantity,
            @RequestParam("buyingPrice") double buyingPrice,
            @RequestParam("sellingPrice") double sellingPrice,
            @RequestParam("supplierCompanyName") String supplierCompanyName,
            @RequestParam(value = "image", required = false) MultipartFile image) throws IOException {

        ProductDTO productDTO = new ProductDTO();
        productDTO.setProductName(productName);
        productDTO.setCategoryName(categoryName);
        productDTO.setQuantity(quantity);
        productDTO.setBuyingPrice(buyingPrice);
        productDTO.setSellingPrice(sellingPrice);
        productDTO.setSupplierCompanyName(supplierCompanyName);
        if (image != null) {
            productDTO.setImage(image.getBytes()); // Update image if provided
        }

        ProductDTO updatedProduct = productService.updateProduct(productId, productDTO);
        return ResponseEntity.ok(updatedProduct);
    }

    @DeleteMapping("/{productId}")
    public ResponseEntity<Void> deleteProduct(@PathVariable Long productId) {
        productService.deleteProduct(productId);
        return ResponseEntity.noContent().build();
    }
}