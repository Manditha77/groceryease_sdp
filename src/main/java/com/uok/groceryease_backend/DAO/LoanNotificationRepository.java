package com.uok.groceryease_backend.DAO;

import com.uok.groceryease_backend.entity.LoanNotification;
import org.springframework.data.jpa.repository.JpaRepository;

public interface LoanNotificationRepository extends JpaRepository<LoanNotification, Long> {
}