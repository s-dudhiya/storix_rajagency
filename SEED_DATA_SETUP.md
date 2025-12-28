# Storix Database Setup Guide

## Quick Start

This guide will help you set up your Storix database with complete seed data and test accounts.

### Test Accounts

| Role | Email | Password |
|------|-------|----------|
| **Owner** | owner@test.com | Test@123456 |
| **Labour** | labour@test.com | Test@123456 |

## Setup Steps

### Step 0: Disable Email Verification (IMPORTANT!)

**Before creating any users, disable email confirmation:**

1. Go to Supabase Dashboard
2. Click **Authentication** in left sidebar
3. Click **Providers** tab
4. Click **Email** provider
5. **Turn OFF** the "Confirm email" toggle
6. Click "Save"

This allows users to login immediately without email verification.

### Step 1: Run Database Migration
1. Go to your Supabase Dashboard
2. Open SQL Editor
3. Copy the entire content of `scripts/supabase-complete-migration.sql`
4. Paste it into the SQL Editor
5. Click "Run"

This will create all tables, indexes, and RLS policies.

### Step 2: Create Auth Users FIRST (IMPORTANT!)

**You must create auth users BEFORE running the seed data!**

Go to Supabase Dashboard → Authentication → Users → Click "Add User"

Create **TWO** users with these EXACT details:

**User 1 (Owner):**
- Email: `owner@test.com`
- Password: `Test@123456`
- Auto-generate password: **OFF** ❌
- Click "Create User"
- **Copy the UUID that Supabase generates** (you'll need it next!)

**User 2 (Labour):**
- Email: `labour@test.com`
- Password: `Test@123456`
- Auto-generate password: **OFF** ❌
- Click "Create User"
- **Copy the UUID that Supabase generates**

### Step 3: Update Seed Data with Real UUIDs

1. Open `scripts/09-seed-test-accounts.sql`
2. Replace the UUIDs in the INSERT statements with the actual UUIDs from Step 2:

\`\`\`sql
-- Replace this line with the UUID for owner@test.com:
('25788c2c-12ef-4612-a3a9-a5944e36fc60', 'owner@test.com', 'Test Owner', 'owner', ...),

-- Replace this line with the UUID for labour@test.com:
('5816d959-2e56-4d8b-9a54-7ec2311f74f2', 'labour@test.com', 'Test Labour', 'labour', ...),
\`\`\`

3. Save the file

### Step 4: Run Seed Data
1. In SQL Editor
2. Copy the entire content of your **updated** `scripts/09-seed-test-accounts.sql`
3. Paste it into the SQL Editor
4. Click "Run"

This will populate your database with:
- 2 user profiles with roles (**owner** and **labour** - roles are set HERE!)
- 3 customer records
- 1 product record

### Step 5: Login and Verify

1. Go to your app
2. Login with:
   - **Owner**: owner@test.com / Test@123456
   - **Labour**: labour@test.com / Test@123456
3. Verify you can see:
   - Dashboard with 3 customers
   - 1 product in catalogue
   - All shared data is visible to both accounts

## How Roles Work

**IMPORTANT UNDERSTANDING:**

1. **Supabase Auth** stores: email + password (for login authentication)
2. **users table** stores: id (matches auth UUID), email, full_name, **role**, phone, etc.

**The role ('owner' or 'labour') is stored in the `users` table, NOT in Supabase Auth!**

When you create users in Supabase Auth dashboard, you're just creating login credentials. The seed SQL then inserts the profile data (including role) into the `users` table.

## Alternative: Use Your Signup API

If you prefer, you can skip Steps 2-4 and just use your app's signup page:

1. Run your app
2. Go to signup page
3. Register with:
   - Email: owner@test.com / Password: Test@123456 / Role: Owner
   - Email: labour@test.com / Password: Test@123456 / Role: Labour

Your signup API will automatically create BOTH the auth user AND the users table entry with the correct role.

## Important Notes

- **Roles are in the database**: The role field is in the `users` table, not Supabase Auth
- **IDs must match**: The user ID in the SQL seed MUST match the auth user UUID
- **Data Sharing**: Both accounts see the same data because RLS policies are configured for universal access
- **Test Data**: These are test credentials. Change them in production

## Troubleshooting

**"Login successful but no role detected"**: The auth UUID doesn't match the user ID in the users table. Verify the UUIDs match in Step 3.

**"Login failed"**: Ensure auth users were created in Step 2 with exact email and password.

**"No data visible"**: Run the seed SQL again to ensure data inserted correctly.

## Files Reference

- `scripts/supabase-complete-migration.sql` - Database schema and RLS policies
- `scripts/09-seed-test-accounts.sql` - Test data (users, customers, products) **with roles**
- `SEED_DATA_SETUP.md` - This setup guide
</parameter>
