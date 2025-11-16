-- Quick fix: Update all draft events to published
-- Run this in Supabase SQL Editor

-- 1. First, check current status of events
SELECT 
  id, 
  title, 
  status, 
  start_date,
  end_date,
  CASE 
    WHEN start_date > NOW() THEN '✅ UPCOMING'
    WHEN end_date < NOW() THEN '❌ PAST'
    ELSE '🔄 ONGOING'
  END as time_status
FROM events
ORDER BY start_date DESC;

-- 2. Update all events to published status
UPDATE events 
SET status = 'published'
WHERE status != 'published';

-- 3. Verify the update
SELECT 
  status, 
  COUNT(*) as count,
  COUNT(CASE WHEN start_date > NOW() THEN 1 END) as upcoming_count
FROM events
GROUP BY status;

-- 4. If you need to create future dates for testing, update existing events:
-- This will set start_date to 30 days from now, end_date to 32 days from now
/*
UPDATE events
SET 
  start_date = NOW() + INTERVAL '30 days',
  end_date = NOW() + INTERVAL '32 days',
  status = 'published'
WHERE id IN (
  SELECT id FROM events LIMIT 3
);
*/

-- 5. Final verification - show upcoming published events
SELECT 
  title,
  status,
  start_date,
  organization_id,
  'Should appear on /events?filter=upcoming' as note
FROM events
WHERE status = 'published' 
  AND start_date > NOW()
ORDER BY start_date ASC;
