package com.uok.groceryease_backend.DAO;

import com.uok.groceryease_backend.entity.Product;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProductRepository extends JpaRepository<Product, Long> {

}
