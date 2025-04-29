package com.uok.groceryease_backend.DAO;

import com.uok.groceryease_backend.entity.Order;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface OrderRepository extends JpaRepository<Order, Long> {
    @Query("SELECT DISTINCT o FROM Order o LEFT JOIN FETCH o.items oi LEFT JOIN FETCH oi.batch")
    List<Order> findAllWithItems();
}