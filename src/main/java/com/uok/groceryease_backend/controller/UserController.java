package com.uok.groceryease_backend.controller;

import com.uok.groceryease_backend.DTO.UserRegistrationDTO;
import com.uok.groceryease_backend.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@CrossOrigin(origins = "*")
@RestController
@RequestMapping("/api/auth")
public class UserController {

    @Autowired
    private UserService userService;

    @PostMapping("/login")
    public ResponseEntity<UserRegistrationDTO> login(@RequestBody UserRegistrationDTO userDTO) {
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

    @GetMapping("/customers")
    public ResponseEntity<List<UserRegistrationDTO>> getAllCustomers() {
        List<UserRegistrationDTO> customers = userService.getAllCustomers();
        return ResponseEntity.ok(customers);
    }

    @GetMapping("/employees")
    public ResponseEntity<List<UserRegistrationDTO>> getAllEmployees() {
        List<UserRegistrationDTO> employees = userService.getAllEmployees();
        return ResponseEntity.ok(employees);
    }

    @GetMapping("/owners")
    public ResponseEntity<List<UserRegistrationDTO>> getAllOwners() {
        List<UserRegistrationDTO> owners = userService.getAllOwners();
        return ResponseEntity.ok(owners);
    }

    @GetMapping("/users/{username}")
    public ResponseEntity<UserRegistrationDTO> getUserByUsername(@PathVariable String username) {
        UserRegistrationDTO user = userService.getUserByUsername(username);
        if (user != null) {
            return ResponseEntity.ok(user);
        }
        return ResponseEntity.notFound().build();
    }

    @PutMapping("/users/{userId}")
    public ResponseEntity<UserRegistrationDTO> updateUser(@PathVariable Long userId, @RequestBody UserRegistrationDTO userDTO) {
        UserRegistrationDTO updatedUser = userService.updateUser(userId, userDTO);
        if (updatedUser != null) {
            return ResponseEntity.ok(updatedUser);
        }
        return ResponseEntity.notFound().build();
    }

    @PutMapping("/users/{userId}/reset-password")
    public ResponseEntity<Map<String, String>> resetPassword(@PathVariable Long userId, @RequestBody Map<String, String> request) {
        String oldPassword = request.get("oldPassword");
        String newPassword = request.get("newPassword");
        userService.resetPassword(userId, oldPassword, newPassword);
        Map<String, String> response = new HashMap<>();
        response.put("message", "Password reset successfully.");
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/users/{userId}")
    public ResponseEntity<Void> deleteUser(@PathVariable Long userId) {
        userService.deleteUser(userId);
        return ResponseEntity.noContent().build();
    }
}