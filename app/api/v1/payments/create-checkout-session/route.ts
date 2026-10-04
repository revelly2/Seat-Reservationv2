import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { amount, seatIds, userEmail, eventId, eventTitle, seatsLabel } = body;

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: 'Invalid payment amount specified' },
        { status: 400 }
      );
    }

    const origin = request.headers.get('origin') || 'http://localhost:3000';
    const amountInCents = Math.round(parseFloat(amount) * 100);
    const seatListStr = Array.isArray(seatIds) ? seatIds.join(',') : seatIds || '';

    const session = await stripe.checkout.sessions.create({
      line_items: [
        {
          price_data: {
            currency: 'php',
            product_data: {
              name: eventTitle || 'University of Abra Arena Reservation',
              description: `Reserved Seats: ${seatsLabel || seatListStr}`,
            },
            unit_amount: amountInCents,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      customer_email: userEmail && userEmail.includes('@') ? userEmail : undefined,
      success_url: `${origin}/?session_id={CHECKOUT_SESSION_ID}&checkout_status=success`,
      cancel_url: `${origin}/?checkout_status=cancelled`,
      metadata: {
        eventId: eventId || 'evt-intra-2026',
        userEmail: userEmail || 'guest@abra.edu.ph',
        seatIds: seatListStr,
        seatsLabel: seatsLabel || '',
      },
    });

    return NextResponse.json({
      success: true,
      url: session.url,
      sessionId: session.id,
    });
  } catch (err: any) {
    console.error('Stripe Checkout Session Error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to create Stripe Checkout session' },
      { status: 500 }
    );
  }
}
