package com.uok.groceryease_backend.service;

import com.stripe.Stripe;
import com.stripe.exception.StripeException;
import com.stripe.model.checkout.Session;
import com.stripe.param.checkout.SessionCreateParams;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

@Service
public class StripeService {

    @Value("${stripe.api.key}")
    private String stripeApiKey;

    public StripeService() {
        Stripe.apiKey = stripeApiKey;
    }

    public Map<String, String> createCheckoutSession(Map<String, Object> request, String origin) throws StripeException {
        if (stripeApiKey == null || stripeApiKey.isEmpty() || !stripeApiKey.startsWith("sk_test_")) {
            throw new IllegalArgumentException("Stripe API key is invalid or not configured");
        }
        Stripe.apiKey = stripeApiKey;

        Number amountObj = (Number) request.get("amount");
        if (amountObj == null) {
            throw new IllegalArgumentException("Amount is required and must be a number");
        }
        long amount = amountObj.longValue();
        if (amount <= 50) {
            throw new IllegalArgumentException("Amount must be greater than 50 cents");
        }

        String currency = (String) request.get("currency");
        if (currency == null || currency.isEmpty()) {
            throw new IllegalArgumentException("Currency is required");
        }
        String effectiveCurrency = currency.toLowerCase().equals("lkr") ? "lkr" : "usd";

        String successUrl = origin + "/checkout?payment=success";
        String cancelUrl = origin + "/checkout?payment=cancel";

        SessionCreateParams params = SessionCreateParams.builder()
                .setMode(SessionCreateParams.Mode.PAYMENT)
                .setSuccessUrl(successUrl)
                .setCancelUrl(cancelUrl)
                .addPaymentMethodType(SessionCreateParams.PaymentMethodType.CARD)
                .addLineItem(
                        SessionCreateParams.LineItem.builder()
                                .setPriceData(
                                        SessionCreateParams.LineItem.PriceData.builder()
                                                .setCurrency(effectiveCurrency)
                                                .setUnitAmount(amount)
                                                .setProductData(
                                                        SessionCreateParams.LineItem.PriceData.ProductData.builder()
                                                                .setName("GroceryEase Order")
                                                                .build()
                                                )
                                                .build()
                                )
                                .setQuantity(1L)
                                .build()
                )
                .build();

        Session session = Session.create(params);
        System.out.println("Created Stripe Session with ID: " + session.getId());
        System.out.println("Success URL: " + session.getSuccessUrl());
        Map<String, String> response = new HashMap<>();
        response.put("sessionId", session.getId());
        return response;
    }

    public Map<String, String> getSessionStatus(String sessionId) throws StripeException {
        Session session = Session.retrieve(sessionId);
        Map<String, String> response = new HashMap<>();
        response.put("status", session.getStatus());
        response.put("paymentStatus", session.getPaymentStatus());
        return response;
    }
}