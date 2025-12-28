# 🔐 Authentication Setup Guide

## ⚠️ IMPORTANT: Create Auth Users FIRST!

Before running the `DATA-ONLY-SEED.sql` file, you **MUST** create authentication users in Supabase. The `users` table has a foreign key constraint to `auth.users`, so auth users must exist first.

---

## Step-by-Step Instructions

### Step 0: Disable Email Confirmation (Optional but Recommended)
1. Go to **Supabase Dashboard** → **Authentication** → **Providers** → **Email**
2. **Turn OFF** the "Confirm email" toggle
3. Click **Save**

This allows users to login immediately without email verification.

---

### Step 1: Create Auth Users

Go to **Supabase Dashboard** → **Authentication** → **Users** → Click **"Add User"**

Create these 3 users with **EXACT UUIDs** (you can set custom UUID when creating user):

#### User 1: Owner Account
\`\`\`
UUID: 4dc493c7-c84f-4c19-8c7e-f6a0cf1fbb5c
Email: owner@test.com
Password: Test@123456
\`\`\`

#### User 2: Labour Account
\`\`\`
UUID: ea37d5a0-4e91-47e0-8af8-c0ea7ee6eb55
Email: labour@test.com
Password: Test@123456
\`\`\`

#### User 3: Second Owner Account
\`\`\`
UUID: 84c41feb-acfb-499b-a5f4-5cb647bc15a1
Email: b.d811@gmail.com
Password: Test@123456
\`\`\`

**Note:** When adding users in Supabase dashboard, make sure to:
- Uncheck "Auto Confirm User" (if email confirmation is enabled)
- Or ensure email confirmation is disabled in Step 0

---

### Step 2: Run the Seed File

After all 3 auth users are created:

1. Go to **Supabase Dashboard** → **SQL Editor**
2. Click **New query**
3. Copy and paste the contents of `scripts/DATA-ONLY-SEED.sql`
4. Click **Run** (or press Ctrl+Enter)

---

### Step 3: Verify Data

Run these verification queries in SQL Editor:

\`\`\`sql
SELECT COUNT(*) as user_count FROM users;          -- Should return 3
SELECT COUNT(*) as customer_count FROM customers;  -- Should return 3
SELECT COUNT(*) as product_count FROM products;    -- Should return 1
SELECT COUNT(*) as order_count FROM orders;        -- Should return 4
SELECT COUNT(*) as bill_count FROM bills;          -- Should return 4
\`\`\`

---

## 🎉 Done!

You can now login to your application with any of these accounts:

| Role | Email | Password |
|------|-------|----------|
| Owner | owner@test.com | Test@123456 |
| Labour | labour@test.com | Test@123456 |
| Owner | b.d811@gmail.com | Test@123456 |

All users will see the same shared data (3 customers, 1 product, 4 orders, 4 bills) thanks to your universal RLS policies.

---

## Troubleshooting

**Error: "violates foreign key constraint"**
- You forgot to create the auth users first
- Go back to Step 1 and create all 3 auth users with the exact UUIDs listed

**Error: "Email already exists"**
- The email is already registered in auth.users
- Delete the existing user or use different emails

**Can't login after seeding**
- Make sure email confirmation is disabled (Step 0)
- Or manually confirm the users in Authentication dashboard
