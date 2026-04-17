# Email Testing Guide

## Overview
Your booking system now sends TWO types of emails:

1. **✅ Verification Email** - Sent when user signs up
2. **✅ Approval Email** - Sent when admin approves a booking

---

## 🧪 How To Test

### **Test 1: Verification Email** (Registration)

1. Visit `http://localhost:3000/auth/signup`
2. Enter your real email address (Gmail/Yahoo)
3. Click Sign Up
4. **Check your inbox** for the verification email with code
5. Copy the code and paste it on the verify page
6. ✅ If you receive the email, SMTP is working!

**What you'll see:**
- Subject: `Email Verification Code - Hike Booking System`
- Contains a 6-digit verification code
- Code expires in 5 minutes

---

### **Test 2: Booking Approval Email** (Complete Flow)

#### **Step A: Create a Booking**
1. Login to your user account
2. Navigate to **Booking Page** (`http://localhost:3000/booking`)
3. Complete the entire booking flow:
   - Select mountain
   - Choose hike type (Day/Overnight/Multi-day)
   - Add participants
   - Select add-ons
   - Enter your contact info
   - Submit booking
4. You should see a confirmation page with a reference number

#### **Step B: Approve the Booking (As Admin)**
1. Login with **Admin account** to `http://localhost:3000/dashboard/admin`
2. Go to **Booking Management** section
3. Find your recent booking (search by name or ID)
4. Click the **✓ Check Mark (Approve)** button
5. **Check your email inbox** for approval notification

**What you'll see:**
- Subject: `🎉 Your Booking is Approved! - Reference: [REF#]`
- Booking details including:
  - Mountain name
  - Hike type
  - Date
  - Number of participants
  - Total price
  - Next steps

---

## 📧 Email Configuration

### Current Setup (Brevo)
```env
BREVO_SMTP_HOST=smtp-relay.brevo.com
BREVO_SMTP_PORT=587
BREVO_SMTP_USER=apikey
BREVO_SMTP_PASSWORD=xsmtpsib-[your-key]
BREVO_FROM_EMAIL=noreply@hikebookingsystem.com
BREVO_FROM_NAME=Ananta Hikes
```

### Check Connection
Visit: `http://localhost:3000/api/debug-email`
- Should show: `✅ Brevo SMTP connected successfully`

---

## 🔍 Troubleshooting

### ❌ Email Not Arriving?

1. **Check logs:**
   - Terminal should show: `[EMAIL SENT] Verification code sent to email@gmail.com: {messageId}`
   - If error appears: `[EMAIL ERROR] Failed to send...`

2. **Check spam folder** in Gmail/Yahoo
   - Mark as "Not Spam" to improve delivery

3. **Verify environment variables:**
   - Check `.env` file has all Brevo credentials
   - No typos in email addresses

4. **Test SMTP connection:**
   - Run: `curl http://localhost:3000/api/debug-email`

5. **Check Brevo dashboard:**
   - Log into https://www.brevo.com
   - Check "Transactional" logs for sent/failed emails
   - Verify SMTP credentials are correct

---

## 📝 Email Types Implemented

### 1. Verification Email (`sendVerificationEmail`)
- **When:** User signs up
- **Content:** 6-digit verification code
- **Expires:** 5 minutes

### 2. Booking Approval (`sendBookingApprovalEmail`)
- **When:** Admin approves a booking
- **Content:** Full booking details with reference number
- **Includes:** Mount name, date, participants, price, next steps

### 3. Password Reset (`sendPasswordResetEmail`)
- **When:** User requests password reset
- **Content:** Reset code and link
- **Expires:** 1 hour

---

## 🎯 Expected Email Flow

```
User Signup
    ↓
[sendVerificationEmail] → Email with verification code
    ↓
User verifies email
    ↓
User books hike
    ↓
[Booking saved as "pending"]
    ↓
Admin approves in dashboard
    ↓
[sendBookingApprovalEmail] → Email with booking confirmation
    ↓
Customer receives approval with all details
```

---

## ✨ Next Steps (Optional Enhancements)

- Add rejection email when booking is rejected
- Add cancellation email when booking is canceled
- Send reminder email before hike date
- Add tour guide assignment notification
- Implement email delivery status tracking

---

## 🚀 Testing Checklist

- [ ] Verification email received during signup
- [ ] Approval email received after booking approval
- [ ] Emails show in correct mailbox (not spam)
- [ ] All booking details display correctly
- [ ] Reference numbers match in email and dashboard
- [ ] Brevo SMTP connection verified

If you encounter any issues, check the server logs for `[EMAIL SENT]` or `[EMAIL ERROR]` messages!
