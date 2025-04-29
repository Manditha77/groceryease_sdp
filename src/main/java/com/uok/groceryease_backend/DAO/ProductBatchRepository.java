package com.uok.groceryease_backend.DAO;

import com.uok.groceryease_backend.entity.ProductBatch;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProductBatchRepository extends JpaRepository<ProductBatch, Long> {
    List<ProductBatch> findByProductProductIdOrderByCreatedDateAsc(Long productId);
}