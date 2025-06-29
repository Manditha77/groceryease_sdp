package com.uok.groceryease_backend.controller;

import com.uok.groceryease_backend.DTO.UserRegistrationDTO;
import com.uok.groceryease_backend.service.SupplierService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@CrossOrigin(origins = "*")
@RestController
@RequestMapping("/api/supplier")
public class SupplierController {

    @Autowired
    private SupplierService supplierService;

    @PostMapping("/add")
    public ResponseEntity<UserRegistrationDTO> addSupplier(@RequestBody UserRegistrationDTO userDTO) {
        UserRegistrationDTO createdUser = supplierService.addSupplier(userDTO);
        return ResponseEntity.status(201).body(createdUser);
    }

    @GetMapping("/all")
    public ResponseEntity<List<UserRegistrationDTO>> getAllSuppliers() {
        List<UserRegistrationDTO> suppliers = supplierService.getAllSuppliers();
        return ResponseEntity.ok(suppliers);
    }

    @PutMapping("/update/{supplierId}")
    public ResponseEntity<UserRegistrationDTO> updateSupplier(@PathVariable Long supplierId, @RequestBody UserRegistrationDTO userDTO) {
        UserRegistrationDTO updatedSupplier = supplierService.updateSupplier(supplierId, userDTO);
        if (updatedSupplier != null) {
            return ResponseEntity.ok(updatedSupplier);
        }
        return ResponseEntity.notFound().build();
    }

    @DeleteMapping("/delete/{supplierId}")
    public ResponseEntity<Void> deleteSupplier(@PathVariable Long supplierId) {
        supplierService.deleteSupplier(supplierId);
        return ResponseEntity.noContent().build();
    }
}