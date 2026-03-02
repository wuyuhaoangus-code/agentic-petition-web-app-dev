import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'stripe-signature, content-type',
      }
    });
  }

  try {
    // Get the raw body
    const body = await req.text();
    const signature = req.headers.get('stripe-signature');
    
    // Log everything for debugging
    console.log('=== Stripe Webhook Received ===');
    console.log('Signature:', signature);
    console.log('Body:', body);
    
    // Parse the event
    const event = JSON.parse(body);
    console.log('Event Type:', event.type);
    console.log('Event Data:', JSON.stringify(event.data, null, 2));
    
    // Return success response
    return new Response(
      JSON.stringify({ 
        received: true,
        event_type: event.type,
        event_id: event.id
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      }
    );
  } catch (error: any) {
    console.error('Webhook error:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        stack: error.stack
      }),
      {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      }
    );
  }
});
