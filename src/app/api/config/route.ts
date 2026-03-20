import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    stripe: !!(process.env.STRIPE_SECRET_KEY),
    google_reviews: !!(process.env.GOOGLE_PLACES_API_KEY),
  });
}
