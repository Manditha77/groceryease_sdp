package com.uok.groceryease_backend.controller;

import com.uok.groceryease_backend.service.StripeService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/stripe")
@CrossOrigin(origins = "*")
public class StripeController {

    @Autowired
    private StripeService stripeService;

    @PostMapping("/create-checkout-session")
    public Map<String, String> createCheckoutSession(@RequestBody Map<String, Object> request, @RequestHeader(value = "Origin", required = false) String origin) {
        System.out.println("Request body: " + request);
        System.out.println("Origin header: " + origin);

        if (!request.containsKey("amount") || !request.containsKey("currency")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Missing required fields: amount or currency");
        }

        if (origin == null || origin.isEmpty()) {
            origin = "http://localhost:3000"; // Default to port 3000 if origin is not provided
        }

        try {
            return stripeService.createCheckoutSession(request, origin);
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

    @GetMapping("/session-status/{sessionId}")
    public Map<String, String> getSessionStatus(@PathVariable String sessionId) {
        try {
            return stripeService.getSessionStatus(sessionId);
        } catch (com.stripe.exception.StripeException e) {
            System.out.println("StripeException: " + e.getStripeError().getMessage());
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Stripe Error: " + e.getStripeError().getMessage());
        } catch (Exception e) {
            e.printStackTrace();
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to retrieve session status: " + e.getMessage());
        }
    }
}