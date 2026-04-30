// Netlify Serverless Function: check-availability
// This function proxies availability requests to the booking API
// without exposing API keys to the client-side frontend.
//
// Usage: GET /.netlify/functions/check-availability?date=2026-05-15&resource=single-cage
//
// When connecting a real booking API (Hapio, Future Ticketing, etc.),
// replace the mock response below with an actual API call using
// the BOOKING_API_KEY environment variable stored in Netlify.

exports.handler = async function (event, context) {
  // CORS headers for frontend requests
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Content-Type': 'application/json',
  };

  // Handle preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }

  // Only allow GET
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const { date, resource } = event.queryStringParameters || {};

    if (!date || !resource) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'Missing required parameters: date and resource',
        }),
      };
    }

    // ============================================================
    // TODO: Replace this mock with a real booking API integration
    //
    // Example with Hapio:
    //   const BOOKING_API_KEY = process.env.BOOKING_API_KEY;
    //   const response = await fetch(
    //     `https://api.hapio.io/v1/availability?date=${date}&resource=${resource}`,
    //     { headers: { 'Authorization': `Bearer ${BOOKING_API_KEY}` } }
    //   );
    //   const data = await response.json();
    //   return { statusCode: 200, headers, body: JSON.stringify(data) };
    // ============================================================

    // Mock availability data
    const timeSlots = [
      '6:00 AM', '7:00 AM', '8:00 AM', '9:00 AM', '10:00 AM',
      '11:00 AM', '12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM',
      '4:00 PM', '5:00 PM', '6:00 PM', '7:00 PM', '8:00 PM', '9:00 PM',
    ];

    // Generate deterministic mock availability based on date + resource
    const dateHash = date.split('-').reduce((acc, val) => acc + parseInt(val, 10), 0);
    const resourceHash = resource.length;
    const seed = dateHash + resourceHash;

    const slots = timeSlots.map((time, index) => ({
      time,
      available: ((seed + index * 7) % 10) > 3,
      price: resource.includes('turf')
        ? resource === 'full-turf' ? 250 : 150
        : resource === 'two-cage' ? 80 : 50,
    }));

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        date,
        resource,
        facility: 'The Training Yard',
        slots,
      }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Internal server error',
        message: error.message,
      }),
    };
  }
};
