package com.uok.groceryease_backend.DAO;

import com.uok.groceryease_backend.entity.Order;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface OrderRepository extends JpaRepository<Order, Long> {
    @Query("SELECT DISTINCT o FROM Order o LEFT JOIN FETCH o.items oi LEFT JOIN FETCH oi.batch LEFT JOIN FETCH o.user")
    List<Order> findAllWithItems();
    @Query("SELECT o FROM Order o JOIN FETCH o.items i JOIN FETCH i.batch b JOIN FETCH b.product WHERE o.orderId = :orderId")
    Optional<Order> findByIdWithItemsAndBatchAndProduct(@Param("orderId") Long orderId);
}