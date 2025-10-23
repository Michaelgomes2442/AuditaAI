import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prismadb';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-09-30.clover'
});

/**
 * Create Stripe Checkout Session for PAID tier upgrade
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { tier, billingPeriod } = await request.json();

    if (tier !== 'PAID' && tier !== 'ARCHITECT') {
      return NextResponse.json({ error: 'Invalid tier' }, { status: 400 });
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Pricing (in cents)
    const prices = {
      PAID_monthly: 49900,    // $499/month
      PAID_annual: 499900,    // $4,999/year (17% discount)
      ARCHITECT_monthly: 149900, // $1,499/month
      ARCHITECT_annual: 1499900  // $14,999/year (17% discount)
    };

    const priceKey = `${tier}_${billingPeriod}` as keyof typeof prices;
    const amount = prices[priceKey];

    if (!amount) {
      return NextResponse.json({ error: 'Invalid pricing configuration' }, { status: 400 });
    }

    // Create Stripe Checkout Session
    const checkoutSession = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `AuditaAI ${tier} Tier`,
              description: tier === 'PAID' 
                ? 'Full access: Live testing, Rosetta governance, unlimited API calls' 
                : 'Full access + Manual Rosetta control, enterprise features, priority support',
              images: ['https://auditaai.com/logo.png'] // TODO: Replace with actual logo URL
            },
            unit_amount: amount,
            recurring: {
              interval: billingPeriod === 'monthly' ? 'month' : 'year'
            }
          },
          quantity: 1
        }
      ],
      customer_email: user.email,
      client_reference_id: String(user.id),
      metadata: {
        userId: String(user.id),
        tier,
        billingPeriod
      },
      success_url: `${process.env.NEXTAUTH_URL}/pricing?session_id={CHECKOUT_SESSION_ID}&success=true`,
      cancel_url: `${process.env.NEXTAUTH_URL}/pricing?canceled=true`,
      subscription_data: {
        metadata: {
          userId: String(user.id),
          tier,
          billingPeriod
        }
      }
    });

    return NextResponse.json({ 
      checkoutUrl: checkoutSession.url,
      sessionId: checkoutSession.id
    });

  } catch (error) {
    console.error('❌ Stripe checkout creation failed:', error);
    return NextResponse.json({ 
      error: 'Failed to create checkout session',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
