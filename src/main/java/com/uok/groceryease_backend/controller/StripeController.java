package com.uok.groceryease_backend.controller;

import com.uok.groceryease_backend.service.StripeService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;

@RestController
@RequestMapping("/api/stripe")
@CrossOrigin(origins = "*")
public class StripeController {

    @Autowired
    private StripeService stripeService;

    @PostMapping("/create-checkout-session")
    public Map<String, String> createCheckoutSession(@RequestBody Map<String, Object> request) {
        System.out.println("Request body: " + request);

        // Validate request parameters
        if (!request.containsKey("amount") || !request.containsKey("currency")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Missing required fields: amount or currency");
        }

        try {
            return stripeService.createCheckoutSession(request);
        } catch (com.stripe.exception.StripeException e) {
            System.out.println("StripeException: " + e.getStripeError().getMessage());
            System.out.println("Stripe Error Code: " + e.getCode());
            System.out.println("Stripe Request ID: " + e.getRequestId());
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Stripe Error: " + e.getStripeError().getMessage());
        } catch (Exception e) {
            e.printStackTrace();
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to create Stripe Checkout Session: " + e.getMessage());
        }
    }
}