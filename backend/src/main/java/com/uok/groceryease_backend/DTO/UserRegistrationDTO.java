package com.uok.groceryease_backend.DTO;

import com.uok.groceryease_backend.entity.UserType;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;
import lombok.*;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class UserRegistrationDTO {
    private Long userId;
    private String firstName;
    private String lastName;
    private String email;
    private String phoneNo;
    private String address;
    private UserType userType;
    private String username;
    private String password;
    private String companyName;
    private String customerType; // Added for distinguishing between ONLINE and CREDIT
}