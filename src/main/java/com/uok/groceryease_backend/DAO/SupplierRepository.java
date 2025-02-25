package com.uok.groceryease_backend.DAO;

import com.uok.groceryease_backend.entity.Supplier;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SupplierRepository extends JpaRepository<Supplier, Long> {
}
