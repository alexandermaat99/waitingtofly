import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const { email, name, source = 'website' } = await request.json();

    // Validate required fields
    if (!email || !name) {
      return NextResponse.json(
        { error: 'Email and name are required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Check if email already exists
    const { data: existingSubscriber, error: checkError } = await supabase
      .from('mailing_list')
      .select('id, status')
      .eq('email', email)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      // PGRST116 is "not found" error, which is what we want
      console.error('Error checking existing subscriber:', checkError);
      return NextResponse.json(
        { error: 'Database error' },
        { status: 500 }
      );
    }

    // If subscriber exists and is active, return success
    if (existingSubscriber && existingSubscriber.status === 'active') {
      return NextResponse.json(
        { 
          message: 'You are already subscribed to our mailing list!',
          alreadySubscribed: true 
        },
        { status: 200 }
      );
    }

    // If subscriber exists but is unsubscribed, reactivate them
    if (existingSubscriber && existingSubscriber.status === 'unsubscribed') {
      const { error: updateError } = await supabase
        .from('mailing_list')
        .update({
          status: 'active',
          unsubscribed_at: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingSubscriber.id);

      if (updateError) {
        console.error('Error reactivating subscriber:', updateError);
        return NextResponse.json(
          { error: 'Failed to reactivate subscription' },
          { status: 500 }
        );
      }

      return NextResponse.json(
        { 
          message: 'Welcome back! You have been re-subscribed to our mailing list.',
          reactivated: true 
        },
        { status: 200 }
      );
    }

    // Split name into first and last name
    const nameParts = name.trim().split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    // Insert new subscriber
    const { data, error } = await supabase
      .from('mailing_list')
      .insert({
        email,
        first_name: firstName,
        last_name: lastName,
        source,
        status: 'active'
      })
      .select()
      .single();

    if (error) {
      console.error('Error inserting subscriber:', error);
      return NextResponse.json(
        { error: 'Failed to subscribe to mailing list' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { 
        message: 'Successfully subscribed to our mailing list!',
        subscriber: data 
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('Mailing list subscription error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Handle GET requests (for testing)
export async function GET() {
  return NextResponse.json(
    { message: 'Mailing list API is working' },
    { status: 200 }
  );
}
