package com.uok.groceryease_backend.DAO;

import com.uok.groceryease_backend.entity.Customer;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CustomerRepository extends JpaRepository<Customer, Long> {
}