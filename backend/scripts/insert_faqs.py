#File: backend/scripts/insert_faqs.py

import sys
import os

# Add backend root to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from datetime import datetime
from app.db.mongo import faq_collection


FAQ_DATA = [
    # ---------------- GENERAL ----------------
    {
        "question": "How can I create an account?",
        "answer": "Click on Sign Up, enter your details, and verify your email to activate your account.",
        "category": "general",
        "created_at": datetime.utcnow(),
    },
    {
        "question": "I forgot my password, what should I do?",
        "answer": "Click on 'Forgot Password' on the login page and follow the instructions to reset it.",
        "category": "general",
        "created_at": datetime.utcnow(),
    },
    {
        "question": "Can I change my registered email address?",
        "answer": "Yes, go to account settings and update your email after verifying your identity.",
        "category": "general",
        "created_at": datetime.utcnow(),
    },

    # ---------------- PAYMENTS ----------------
    {
        "question": "Why was my payment deducted but order not confirmed?",
        "answer": "This can happen due to payment gateway delays. The amount will be auto-refunded within 3-5 working days.",
        "category": "payments",
        "created_at": datetime.utcnow(),
    },
    {
        "question": "What payment methods are supported?",
        "answer": "We support credit cards, debit cards, UPI, net banking, and selected wallets.",
        "category": "payments",
        "created_at": datetime.utcnow(),
    },
    {
        "question": "Is it safe to save my card details?",
        "answer": "Yes, all payment information is encrypted and stored securely following industry standards.",
        "category": "payments",
        "created_at": datetime.utcnow(),
    },

    # ---------------- BILLING ----------------
    {
        "question": "How can I download my invoice?",
        "answer": "Go to Orders, select the order, and click on 'Download Invoice'.",
        "category": "billing",
        "created_at": datetime.utcnow(),
    },
    {
        "question": "Why was I charged twice?",
        "answer": "Duplicate charges are usually temporary and get reversed automatically within a few days.",
        "category": "billing",
        "created_at": datetime.utcnow(),
    },
    {
        "question": "Can I update my billing address?",
        "answer": "Yes, you can update your billing address in your profile settings.",
        "category": "billing",
        "created_at": datetime.utcnow(),
    },

    # ---------------- SECURITY ----------------
    {
        "question": "How do I secure my account?",
        "answer": "Enable two-factor authentication and use a strong password that you don’t reuse elsewhere.",
        "category": "security",
        "created_at": datetime.utcnow(),
    },
    {
        "question": "I noticed suspicious activity on my account.",
        "answer": "Immediately reset your password and contact support to secure your account.",
        "category": "security",
        "created_at": datetime.utcnow(),
    },
    {
        "question": "Do you support two-factor authentication?",
        "answer": "Yes, you can enable 2FA from your account security settings.",
        "category": "security",
        "created_at": datetime.utcnow(),
    },

    # ---------------- EDGE CASES ----------------
    {
        "question": "My refund is taking too long, it's been 10 days.",
        "answer": "Refunds typically take 5-7 working days. If delayed beyond that, please contact support with your transaction ID.",
        "category": "payments",
        "created_at": datetime.utcnow(),
    },
    {
        "question": "I was charged but my bank says the payment failed.",
        "answer": "This is usually a temporary authorization hold. The amount will be released automatically by your bank.",
        "category": "payments",
        "created_at": datetime.utcnow(),
    },
    {
        "question": "The app is not letting me log in even with correct credentials.",
        "answer": "Try clearing cache or resetting your password. If the issue persists, contact support.",
        "category": "general",
        "created_at": datetime.utcnow(),
    },
]


def insert_faqs():
    if faq_collection.count_documents({}) > 0:
        print("FAQs already exist. Skipping insert.")
        return

    faq_collection.insert_many(FAQ_DATA)
    print(f"Inserted {len(FAQ_DATA)} FAQs successfully.")


if __name__ == "__main__":
    insert_faqs()