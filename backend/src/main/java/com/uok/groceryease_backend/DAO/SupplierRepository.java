package com.uok.groceryease_backend.DAO;

import com.uok.groceryease_backend.entity.Supplier;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface SupplierRepository extends JpaRepository<Supplier, Long> {
    Optional<Supplier> findByCompanyName(String companyName);
//    boolean existsByName(String name);
}
