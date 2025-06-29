package com.uok.groceryease_backend.DAO;

import com.uok.groceryease_backend.entity.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ProductRepository extends JpaRepository<Product, Long> {

    Optional<Product> findByBarcode(String barcode);

    boolean existsByProductName(String productName);

    boolean existsByProductNameAndSupplierCompanyName(String productName, String supplierCompanyName);

    Optional<Product> findByProductNameAndSupplierCompanyName(String productName, String supplierCompanyName);

    @Query("SELECT p FROM Product p WHERE p.productName = :productName AND p.category.categoryName = :categoryName")
    List<Product> findByProductNameAndCategoryCategoryName(
            @Param("productName") String productName,
            @Param("categoryName") String categoryName);
}