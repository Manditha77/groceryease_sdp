package com.uok.groceryease_backend.controller;

import com.uok.groceryease_backend.DTO.UserRegistrationDTO;
import com.uok.groceryease_backend.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@CrossOrigin(origins = "*")
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private UserService userService;

    @PostMapping("/login")
    public ResponseEntity<UserRegistrationDTO> loginUser(@RequestBody UserRegistrationDTO userDTO) {
        UserRegistrationDTO authenticatedUser = userService.loginUser(userDTO.getUsername(), userDTO.getPassword());
        if (authenticatedUser != null) {
            return ResponseEntity.ok(authenticatedUser);
        }
        return ResponseEntity.status(401).build(); // Unauthorized
    }

    @PostMapping("/register")
    public ResponseEntity<UserRegistrationDTO> registerUser(@RequestBody UserRegistrationDTO userDTO) {
        UserRegistrationDTO createdUser = userService.registerUser(userDTO);
        return ResponseEntity.status(201).body(createdUser);
    }

    @GetMapping("/users")
    public ResponseEntity<List<UserRegistrationDTO>> getAllUsers() {
        List<UserRegistrationDTO> users = userService.getAllUsers();
        return ResponseEntity.ok(users);
    }

    @PutMapping("/users/{userId}")
    public ResponseEntity<UserRegistrationDTO> updateUser(@PathVariable Long userId, @RequestBody UserRegistrationDTO userDTO) {
        UserRegistrationDTO updatedUser = userService.updateUser(userId, userDTO);
        if (updatedUser != null) {
            return ResponseEntity.ok(updatedUser);
        }
        return ResponseEntity.notFound().build();
    }

    @DeleteMapping("/users/{userId}")
    public ResponseEntity<Void> deleteUser(@PathVariable Long userId) {
        userService.deleteUser(userId);
        return ResponseEntity.noContent().build();           
    }
}