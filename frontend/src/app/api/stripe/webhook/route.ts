import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { headers } from 'next/headers';
import { prisma } from '@/lib/prismadb';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia'
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

/**
 * Stripe Webhook Handler
 * Handles subscription events and updates user tiers
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const headersList = await headers();
    const signature = headersList.get('stripe-signature')!;

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error('❌ Webhook signature verification failed:', err);
      return NextResponse.json({ error: 'Webhook signature verification failed' }, { status: 400 });
    }

    console.log(`🎣 Stripe webhook received: ${event.type}`);

    // Handle subscription events
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = parseInt(session.metadata?.userId || '0');
        const tier = session.metadata?.tier as 'PAID' | 'ARCHITECT';

        if (userId && tier) {
          // Upgrade user tier
          await prisma.user.update({
            where: { id: userId },
            data: { 
              tier,
              updatedAt: new Date()
            }
          });

          console.log(`✅ User ${userId} upgraded to ${tier}`);
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = parseInt(subscription.metadata?.userId || '0');
        
        if (userId) {
          // Handle subscription updates (e.g., plan changes, cancellations)
          if (subscription.cancel_at_period_end) {
            console.log(`⚠️  User ${userId} subscription will cancel at period end`);
          }
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = parseInt(subscription.metadata?.userId || '0');
        
        if (userId) {
          // Downgrade user to FREE tier
          await prisma.user.update({
            where: { id: userId },
            data: { 
              tier: 'FREE',
              updatedAt: new Date()
            }
          });

          console.log(`⬇️  User ${userId} downgraded to FREE (subscription ended)`);
        }
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        console.log(`✅ Payment succeeded for invoice ${invoice.id}`);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        console.log(`❌ Payment failed for invoice ${invoice.id}`);
        // TODO: Send notification to user about failed payment
        break;
      }

      default:
        console.log(`⚠️  Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });

  } catch (error) {
    console.error('❌ Webhook handler error:', error);
    return NextResponse.json({ 
      error: 'Webhook handler failed',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
