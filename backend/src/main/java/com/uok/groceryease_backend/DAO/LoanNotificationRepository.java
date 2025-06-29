package com.uok.groceryease_backend.DAO;

import com.uok.groceryease_backend.entity.LoanNotification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface LoanNotificationRepository extends JpaRepository<LoanNotification, Long> {
    List<LoanNotification> findByOrderOrderIdAndNotificationDateAfter(Long orderId, LocalDateTime date);
}