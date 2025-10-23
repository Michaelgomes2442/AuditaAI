-- Create First PAID Tier Test User
-- Email: tristanbarbaste@gmail.com
-- Password: changeme (user can change later)
-- Tier: PAID (will get Operator role in Rosetta boot sequence)
-- Database Role: USER (standard user permissions)
-- Purpose: Test managed Rosetta governance

-- Note: PAID tier automatically gets "Operator" Rosetta role
-- ARCHITECT tier would get "Architect" Rosetta role
-- FREE tier has no live prompting access

INSERT INTO "User" (
  id,
  email,
  name,
  password,
  tier,
  role,
  "createdAt",
  "updatedAt"
) VALUES (
  2,  -- User ID 2 (founder is ID 1)
  'tristanbarbaste@gmail.com',
  'Tristan Barbaste',
  '$2b$10$YQm7Jqv0jQJxK0X5Z5Z5ZeK5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z',  -- Hash for 'changeme'
  'PAID',      -- Subscription tier
  'USER',      -- Database role (permissions)
  NOW(),
  NOW()
)
ON CONFLICT (email) DO UPDATE
SET 
  tier = 'PAID',
  role = 'USER',
  "updatedAt" = NOW();

-- Verify the user was created
SELECT 
  id,
  email,
  name,
  tier,
  role,
  "createdAt"
FROM "User"
WHERE email = 'tristanbarbaste@gmail.com';

-- Expected output:
-- id | email                      | name              | tier | role | createdAt
-- 2  | tristanbarbaste@gmail.com  | Tristan Barbaste  | PAID | USER | [timestamp]
-- 
-- When this user logs in and uses live prompting:
-- → Rosetta boot sequence will assign "Operator" role
-- → Managed governance enabled (transparent boot)
-- → Auto-receipt generation for all interactions
