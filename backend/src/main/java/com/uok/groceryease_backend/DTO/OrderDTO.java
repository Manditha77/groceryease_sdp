package com.uok.groceryease_backend.DTO;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class OrderDTO {
    private Long orderId;
    private String customerName;
    private String paymentMethod;
    private Double totalAmount;
    private String status;
    private LocalDateTime orderDate;
    private List<OrderItemDTO> items;
    private List<String> warnings;
    private Boolean inventoryAdjusted;
    private String orderType;
    private String username;
    private CreditCustomerDetailsDTO creditCustomerDetails;
    private ReceiptDTO receipt;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CreditCustomerDetailsDTO {
        private String firstName;
        private String lastName;
        private String phone;
        private String email;
        private String address;
    }
}