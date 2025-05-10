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
        Stripe.apiKey = stripeApiKey; // Set your Stripe secret key
    }

    public Map<String, String> createCheckoutSession(Map<String, Object> request) throws StripeException {
        // Validate Stripe API key
        if (stripeApiKey == null || stripeApiKey.isEmpty() || !stripeApiKey.startsWith("sk_test_")) {
            throw new IllegalArgumentException("Stripe API key is invalid or not configured");
        }
        Stripe.apiKey = stripeApiKey;

        // Extract and validate amount
        Number amountObj = (Number) request.get("amount");
        if (amountObj == null) {
            throw new IllegalArgumentException("Amount is required and must be a number");
        }
        long amount = amountObj.longValue();
        if (amount <= 50) { // Minimum amount for most currencies
            throw new IllegalArgumentException("Amount must be greater than 50 cents");
        }

        // Extract currency
        String currency = (String) request.get("currency");
        if (currency == null || currency.isEmpty()) {
            throw new IllegalArgumentException("Currency is required");
        }
        String effectiveCurrency = currency.toLowerCase().equals("lkr") ? "lkr" : "usd";

        // Build Stripe Checkout Session parameters
        SessionCreateParams params = SessionCreateParams.builder()
                .setMode(SessionCreateParams.Mode.PAYMENT)
                .setSuccessUrl("http://localhost:3000/checkout?payment=success&orderId={CHECKOUT_SESSION_ID}")
                .setCancelUrl("http://localhost:3000/checkout?payment=cancel")
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

        // Create the Stripe Checkout Session
        Session session = Session.create(params);
        Map<String, String> response = new HashMap<>();
        response.put("sessionId", session.getId());
        return response;
    }
}