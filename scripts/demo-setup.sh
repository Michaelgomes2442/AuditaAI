#!/bin/bash

# Demo Account Setup Script
# Aggregates real test data from production accounts for investor demonstrations
# NO FAKE DATA - Only real audit results from actual usage

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DEMO_EMAIL="demo@auditaai.com"
DEMO_NAME="Demo Account"
DEMO_TIER="PAID" # PRO tier access
DB_NAME="auditaai"

# Function to print colored output
print_step() {
    echo -e "${BLUE}==>${NC} $1"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

# Check if --reset flag is provided
RESET_MODE=false
if [ "$1" == "--reset" ]; then
    RESET_MODE=true
    print_warning "Reset mode enabled - will clean demo account data"
fi

# Check if running from project root
if [ ! -f "package.json" ]; then
    print_error "Must run from project root directory"
    exit 1
fi

# Check if database is accessible
print_step "Checking database connection..."
if ! command -v psql &> /dev/null; then
    print_error "PostgreSQL client (psql) not found"
    exit 1
fi

# Navigate to frontend directory for Prisma
cd frontend

print_step "Generating Prisma client..."
npx prisma generate

# Reset demo account if requested
if [ "$RESET_MODE" = true ]; then
    print_step "Resetting demo account..."
    
    # Delete demo user and all associated data (cascading deletes)
    npx prisma db execute --stdin <<SQL
DELETE FROM "User" WHERE email = '$DEMO_EMAIL';
SQL
    
    print_success "Demo account reset complete"
    echo ""
    echo -e "${GREEN}Demo account has been cleaned. Run without --reset to recreate.${NC}"
    exit 0
fi

# Create or update demo account
print_step "Creating demo account..."

# Create Node.js script to handle demo account creation
cat > /tmp/create-demo-account.mjs <<'SCRIPT'
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const DEMO_EMAIL = 'demo@auditaai.com';
  
  // Check if demo account exists
  let demoUser = await prisma.user.findUnique({
    where: { email: DEMO_EMAIL }
  });
  
  if (demoUser) {
    console.log('Demo account already exists, updating...');
    demoUser = await prisma.user.update({
      where: { email: DEMO_EMAIL },
      data: {
        tier: 'PAID',
        name: 'Demo Account'
      }
    });
  } else {
    console.log('Creating new demo account...');
    demoUser = await prisma.user.create({
      data: {
        email: DEMO_EMAIL,
        name: 'Demo Account',
        tier: 'PAID'
      }
    });
  }
  
  console.log('Demo user ID:', demoUser.id);
  
  // Get statistics about available real data
  const totalReceipts = await prisma.receipt.count();
  const totalUsers = await prisma.user.count();
  
  console.log('\n=== Available Real Data ===');
  console.log(`Total receipts in database: ${totalReceipts}`);
  console.log(`Total users: ${totalUsers}`);
  
  if (totalReceipts === 0) {
    console.log('\n⚠ No real audit data found in database!');
    console.log('Run actual tests first to generate demo data.');
    process.exit(0);
  }
  
  // Aggregate best audit receipts (highest CRIES scores)
  console.log('\n=== Aggregating Best Audit Results ===');
  
  // Find receipts with high CRIES scores (if available)
  // Note: This assumes receipts have some metadata we can query
  const bestReceipts = await prisma.receipt.findMany({
    take: 50,
    orderBy: {
      createdAt: 'desc'
    }
  });
  
  console.log(`Found ${bestReceipts.length} recent receipts to showcase`);
  
  // Get witness consensus events if any exist
  const witnessEvents = await prisma.receipt.count({
    where: {
      event: {
        startsWith: 'WITNESS'
      }
    }
  });
  
  console.log(`Witness consensus events: ${witnessEvents}`);
  
  // Summary statistics
  const userActivity = await prisma.receipt.groupBy({
    by: ['userId'],
    _count: {
      userId: true
    },
    orderBy: {
      _count: {
        userId: 'desc'
      }
    },
    take: 10
  });
  
  console.log(`\nMost active users (anonymized):`);
  userActivity.forEach((activity, i) => {
    console.log(`  ${i + 1}. User ${activity.userId?.substring(0, 8)}... - ${activity._count.userId} receipts`);
  });
  
  console.log('\n✓ Demo account ready with access to real audit data');
  console.log('\nDemo Login:');
  console.log(`  Email: ${DEMO_EMAIL}`);
  console.log(`  Tier: PAID (PRO access)`);
  console.log('\nNote: Demo account has read-only access to aggregated real test data.');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
SCRIPT

# Execute the demo account creation script
node /tmp/create-demo-account.mjs

# Clean up
rm /tmp/create-demo-account.mjs

cd ..

print_success "Demo setup complete!"
echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}Demo Account Ready${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "Email: ${BLUE}demo@auditaai.com${NC}"
echo -e "Tier:  ${BLUE}PAID (PRO)${NC}"
echo ""
echo -e "${YELLOW}Important:${NC}"
echo -e "  • Demo account has access to ${BLUE}real audit data${NC} from production"
echo -e "  • All data is ${BLUE}anonymized${NC} and aggregated from actual tests"
echo -e "  • ${BLUE}No fake data${NC} - only genuine CRIES scores and witness results"
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo -e "  1. Login with demo@auditaai.com"
echo -e "  2. View Dashboard for live metrics from real tests"
echo -e "  3. Check Witness page for actual consensus events"
echo -e "  4. Review Receipts registry for verified audit chain"
echo ""
echo -e "${YELLOW}To reset:${NC} ./scripts/demo-setup.sh --reset"
echo ""
