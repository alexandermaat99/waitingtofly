import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ 
    message: 'Webhook endpoint is accessible',
    timestamp: new Date().toISOString(),
    url: process.env.NEXT_PUBLIC_SITE_URL || 'localhost:3001'
  });
}

export async function POST() {
  return NextResponse.json({ 
    message: 'Webhook endpoint can receive POST requests',
    timestamp: new Date().toISOString()
  });
}

