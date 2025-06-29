package com.uok.groceryease_backend.service;

import com.uok.groceryease_backend.DTO.UserRegistrationDTO;
import com.uok.groceryease_backend.DAO.SupplierRepository;
import com.uok.groceryease_backend.DAO.UserRepository;
import com.uok.groceryease_backend.entity.Supplier;
import com.uok.groceryease_backend.entity.User;
import com.uok.groceryease_backend.entity.UserType;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.beans.factory.annotation.Autowired;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class SupplierService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private SupplierRepository supplierRepository;

    @Transactional
    public UserRegistrationDTO addSupplier(UserRegistrationDTO userDTO) {
        Supplier supplier = new Supplier();
        supplier.setCompanyName(userDTO.getCompanyName());
        supplier.setFirstName(userDTO.getFirstName());
        supplier.setLastName(userDTO.getLastName());
        supplier.setEmail(userDTO.getEmail());
        supplier.setUserType(UserType.SUPPLIER);
        supplier.setPhoneNo(userDTO.getPhoneNo());

        User savedUser = userRepository.save(supplier);

        return convertToDTO(savedUser);
    }

    public List<UserRegistrationDTO> getAllSuppliers() {
        List<Supplier> suppliers = supplierRepository.findAll();
        return suppliers.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public UserRegistrationDTO updateSupplier(Long supplierId, UserRegistrationDTO userDTO) {
        Optional<Supplier> optionalSupplier = supplierRepository.findById(supplierId);
        if (optionalSupplier.isPresent()) {
            Supplier supplier = optionalSupplier.get();
            supplier.setFirstName(userDTO.getFirstName());
            supplier.setLastName(userDTO.getLastName());
            supplier.setEmail(userDTO.getEmail());
            supplier.setPhoneNo(userDTO.getPhoneNo());
            supplier.setCompanyName(userDTO.getCompanyName());

            Supplier updatedSupplier = supplierRepository.save(supplier);
            return convertToDTO(updatedSupplier);
        }
        return null; // or throw an exception
    }

    @Transactional
    public void deleteSupplier(Long supplierId) {
        supplierRepository.deleteById(supplierId);
    }

    private UserRegistrationDTO convertToDTO(User user) {
        UserRegistrationDTO userDTO = new UserRegistrationDTO();
        userDTO.setUserId(user.getUserId());
        userDTO.setFirstName(user.getFirstName());
        userDTO.setLastName(user.getLastName());
        userDTO.setEmail(user.getEmail());
        userDTO.setPhoneNo(user.getPhoneNo());
        userDTO.setUserType(UserType.SUPPLIER);

        Supplier supplier = (Supplier) user;
        userDTO.setCompanyName(supplier.getCompanyName());

        return userDTO;
    }
}