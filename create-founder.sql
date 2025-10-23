-- AuditaAI Founder Account Creation
-- Email: founder@auditaai.com
-- Role: ADMIN with ARCHITECT permissions
-- All permissions granted

-- First, let's check if user exists and delete if present
DELETE FROM "User" WHERE email = 'founder@auditaai.com';

-- Create founder account
-- Password: Toby60022006!!! (bcrypt hash generated)
-- Hash generated using: bcrypt.hash('Toby60022006!!!', 10)
INSERT INTO "User" (
  email, 
  password, 
  name, 
  role, 
  permissions, 
  status,
  "createdAt",
  "updatedAt"
) VALUES (
  'founder@auditaai.com',
  '$2a$10$YourBcryptHashWillGoHere',  -- Will be replaced by Node.js script
  'Michael Tobin Gomes (Founder)',
  'ADMIN',
  ARRAY['READ_LOGS', 'WRITE_LOGS', 'MANAGE_USERS', 'MANAGE_TEAMS', 'VERIFY_RECORDS', 'EXPORT_DATA', 'VIEW_ANALYTICS', 'MANAGE_SETTINGS']::"Permission"[],
  'ACTIVE',
  NOW(),
  NOW()
);

-- Grant ARCHITECT role for system configuration
UPDATE "User" 
SET role = 'ARCHITECT'
WHERE email = 'founder@auditaai.com';

-- Verify creation
SELECT id, email, name, role, permissions, status, "createdAt"
FROM "User" 
WHERE email = 'founder@auditaai.com';
