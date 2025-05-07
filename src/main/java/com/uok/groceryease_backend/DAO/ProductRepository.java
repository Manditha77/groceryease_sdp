package com.uok.groceryease_backend.DAO;

import com.uok.groceryease_backend.entity.Product;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ProductRepository extends JpaRepository<Product, Long> {
    boolean existsByProductName(String productName);
    Optional<Product> findByBarcode(String barcode); // New method for barcode lookup
}