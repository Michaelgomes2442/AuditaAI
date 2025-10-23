-- Create First PAID Tier Test User
-- Email: tristanbarbaste@gmail.com
-- Tier: PAID → Rosetta boots with "Operator" role (managed governance)
-- Database Role: USER (standard permissions)

INSERT INTO "User" (
  email,
  name,
  tier,
  role,
  "emailVerified",
  "createdAt",
  "updatedAt"
) VALUES (
  'tristanbarbaste@gmail.com',
  'Tristan Barbaste',
  'PAID',
  'USER',
  NOW(),
  NOW(),
  NOW()
)
ON CONFLICT (email) DO UPDATE
SET 
  tier = 'PAID',
  "updatedAt" = NOW();

-- Verify
SELECT id, email, name, tier, role, "createdAt"
FROM "User"
WHERE email = 'tristanbarbaste@gmail.com';
