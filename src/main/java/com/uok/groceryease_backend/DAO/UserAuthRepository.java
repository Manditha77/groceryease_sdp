package com.uok.groceryease_backend.DAO;

import com.uok.groceryease_backend.entity.User;
import com.uok.groceryease_backend.entity.UserAuth;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserAuthRepository extends JpaRepository<UserAuth, Long> {
    UserAuth findByUser(User user);
    void deleteByUser(User user);
    UserAuth findByUsername(String username);
}