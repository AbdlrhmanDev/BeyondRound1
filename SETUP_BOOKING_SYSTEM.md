# Setup Booking System - Complete Guide

## What You Need to Add to Your Database

To make the booking system fully functional, you need to:

### 1. Run Migrations

Make sure all migrations are applied:

```bash
# Using Supabase CLI
npx supabase db push

# Or manually run migrations in order:
# 1. 20260204000000_create_events_bookings_verification.sql
# 2. 20260205000000_add_email_preferences_and_cron.sql
# 3. 20260205000001_setup_events_for_booking.sql (ensures enum exists)
```

### 2. Create Events via API (Recommended)

Events are now created dynamically via API instead of hardcoded SQL:

#### Option A: Using curl/Postman

```bash
# Create events for Berlin (next 4 weekends)
curl -X POST http://localhost:3000/api/events/seed \
  -H "Content-Type: application/json" \
  -d '{
    "city": "Berlin",
    "weeksAhead": 4,
    "neighborhoods": ["mitte", "prenzlauer_berg_friedrichshain", "kreuzberg_neukoelln", "charlottenburg_schoeneberg"],
    "clearExisting": false
  }'
```

#### Option B: Using JavaScript/Fetch

```javascript
// In browser console or Node.js
const response = await fetch('/api/events/seed', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    city: 'Berlin',
    weeksAhead: 4,
    neighborhoods: ['mitte', 'prenzlauer_berg_friedrichshain', 'kreuzberg_neukoelln', 'charlottenburg_schoeneberg'],
    clearExisting: false // Set to true to clear existing events first
  })
});

const result = await response.json();
console.log(result); // { message: "Successfully created X events", created: X, skipped: Y }
```

#### Option C: Using Admin Panel (if you create one)

Add a button that calls the API endpoint.

### 3. API Endpoint Details

**Endpoint**: `POST /api/events/seed`

**Request Body**:
```json
{
  "city": "Berlin",                    // Required: City name
  "weeksAhead": 4,                     // Optional: Number of weekends ahead (default: 4)
  "neighborhoods": [                    // Optional: Array of neighborhood names
    "mitte",
    "prenzlauer_berg_friedrichshain",
    "kreuzberg_neukoelln",
    "charlottenburg_schoeneberg"
  ],
  "clearExisting": false               // Optional: Clear existing events for city (default: false)
}
```

**Response**:
```json
{
  "message": "Successfully created 28 events",
  "created": 28,
  "skipped": 0,
  "events": [...]
}
```

**GET Endpoint**: `GET /api/events/seed?city=Berlin&limit=20`

Returns existing events for a city.

### 4. Verify Events Were Created

Check that events exist:

```sql
SELECT 
  id,
  city,
  meetup_type,
  date_time,
  neighborhood,
  status,
  max_participants
FROM public.events
WHERE status = 'open' 
  AND date_time > NOW()
ORDER BY date_time ASC
LIMIT 20;
```

Or use the GET API:
```bash
curl http://localhost:3000/api/events/seed?city=Berlin&limit=20
```

### 5. Test Booking Flow

1. Go to Dashboard (`/dashboard`)
2. You should see real events (not demo events) in the "Book your next meetup" section
3. Click on an event to book it
4. Complete the booking flow
5. Check Events page (`/events`) - you should see your booking

### 6. Verify Booking Was Created

```sql
-- Check your bookings
SELECT 
  b.id,
  b.status,
  b.paid,
  b.created_at,
  e.meetup_type,
  e.date_time,
  e.city
FROM public.bookings b
JOIN public.events e ON b.event_id = e.id
WHERE b.user_id = auth.uid()  -- Your user ID
ORDER BY b.created_at DESC;
```

## Database Schema Requirements

Your database already has these tables (from your schema):

✅ **events** - Stores meetup events
- Required columns: `id`, `city`, `meetup_type`, `date_time`, `status`
- Status must be: `'open'`, `'full'`, `'closed'`, or `'cancelled'`

✅ **bookings** - Stores user bookings
- Required columns: `id`, `user_id`, `event_id`, `status`, `paid`
- Status must be: `'pending'`, `'confirmed'`, `'cancelled'`, or `'completed'`
- Foreign key: `event_id` references `events(id)`

✅ **RLS Policies** - Already configured
- Users can view their own bookings
- Users can create bookings
- Users can update their own bookings

## Environment Variables Required

Make sure you have these in your `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key  # Required for API endpoint
```

## Common Issues

### Issue: "No upcoming meetups" on Events page

**Solution**: 
- Call the API endpoint to create events: `POST /api/events/seed`
- Events must have `status = 'open'` and `date_time > NOW()`
- Check API response for errors

### Issue: API returns 500 error

**Solution**:
- Ensure `SUPABASE_SERVICE_ROLE_KEY` is set in `.env.local`
- Check that migrations have been run
- Verify the `meetup_type` enum exists

### Issue: Demo events showing instead of real events

**Solution**:
- Real events must exist in the database
- The Dashboard shows demo events only when no real events are found
- Create events using the API endpoint

### Issue: Booking not appearing after creation

**Solution**:
- Check browser console for errors
- Verify RLS policies allow reading bookings
- Ensure `event_id` in booking matches an existing event
- Check that booking `status` is `'pending'` or `'confirmed'`

## Creating Events for Multiple Cities

```bash
# Berlin
curl -X POST http://localhost:3000/api/events/seed \
  -H "Content-Type: application/json" \
  -d '{"city": "Berlin", "weeksAhead": 4}'

# Munich
curl -X POST http://localhost:3000/api/events/seed \
  -H "Content-Type: application/json" \
  -d '{"city": "Munich", "weeksAhead": 4, "neighborhoods": null}'

# Hamburg
curl -X POST http://localhost:3000/api/events/seed \
  -H "Content-Type: application/json" \
  -d '{"city": "Hamburg", "weeksAhead": 4, "neighborhoods": null}'
```

## Automated Event Creation (Future)

You can create a cron job or scheduled function to automatically call the API endpoint weekly to generate events for upcoming weekends. See `supabase/functions/create-match-groups/` for reference on how to set up cron jobs.

## Next Steps

1. ✅ Run migrations
2. ✅ Call API endpoint to create events: `POST /api/events/seed`
3. ✅ Test booking flow
4. ✅ Verify bookings appear on Events page
