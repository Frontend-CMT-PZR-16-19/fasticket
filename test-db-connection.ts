// Test database connection and tables
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load .env.local file
dotenv.config({ path: resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  console.log('🔍 Testing Supabase connection...\n');

  // Test 1: Check profiles table
  console.log('1. Testing profiles table...');
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('id, fullname')
    .limit(5);
  
  if (profilesError) {
    console.log('❌ Profiles error:', profilesError.message);
  } else {
    console.log('✅ Profiles table OK - Found', profiles?.length, 'users');
  }

  // Test 2: Check organizations table
  console.log('\n2. Testing organizations table...');
  const { data: orgs, error: orgsError } = await supabase
    .from('organizations')
    .select('id, name, slug')
    .limit(5);
  
  if (orgsError) {
    console.log('❌ Organizations error:', orgsError.message);
  } else {
    console.log('✅ Organizations table OK - Found', orgs?.length, 'organizations');
    orgs?.forEach(org => {
      console.log('  -', org.name, '-> slug:', org.slug);
    });
  }

  // Test 3: Check events table
  console.log('\n3. Testing events table...');
  const { data: events, error: eventsError } = await supabase
    .from('events')
    .select('id, title')
    .limit(5);
  
  if (eventsError) {
    console.log('❌ Events error:', eventsError.message);
  } else {
    console.log('✅ Events table OK - Found', events?.length, 'events');
  }

  // Test 4: Check bookings table
  console.log('\n4. Testing bookings table...');
  const { data: bookings, error: bookingsError } = await supabase
    .from('bookings')
    .select('id, booking_code')
    .limit(5);
  
  if (bookingsError) {
    console.log('❌ Bookings error:', bookingsError.message);
  } else {
    console.log('✅ Bookings table OK - Found', bookings?.length, 'bookings');
  }

  // Test 5: Check organization_members table
  console.log('\n5. Testing organization_members table...');
  const { data: members, error: membersError } = await supabase
    .from('organization_members')
    .select('id, role')
    .limit(5);
  
  if (membersError) {
    console.log('❌ Organization members error:', membersError.message);
  } else {
    console.log('✅ Organization members table OK - Found', members?.length, 'members');
  }

  console.log('\n✨ Connection test complete!');
}

testConnection().catch(console.error);
