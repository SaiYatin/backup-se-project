/*
 Improved seed script:
 - supports API_BASE_URL via env
 - retries login when register fails (user exists)
 - robust token extraction from varied response shapes
 - per-request error handling so one failure won't stop the whole run
 - clearer timestamps and helper for days -> ms
 Run with: node database/seed-data.js
*/
require('dotenv').config();
const axios = require('axios');

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:5000/api';
axios.defaults.timeout = 10000; // 10s

const daysToMs = (days) => days * 24 * 60 * 60 * 1000;

function extractToken(resp) {
  // Support common response shapes: { token }, { data: { token } }, { data: { data: { token } } }
  return resp?.data?.token || resp?.data?.data?.token || resp?.token || resp?.data?.data?.data?.token || null;
}

async function registerOrLogin(user) {
  try {
    const res = await axios.post(`${API_BASE_URL}/auth/register`, user);
    const token = extractToken(res);
    return { res, token };
  } catch (err) {
    const status = err.response?.status;
    // If user already exists, try login to obtain token
    if (status === 409 || status === 400 || err.response?.data?.message?.toLowerCase?.().includes('exists') ) {
      try {
        const loginRes = await axios.post(`${API_BASE_URL}/auth/login`, {
          email: user.email,
          password: user.password
        });
        const token = extractToken(loginRes);
        return { res: loginRes, token };
      } catch (loginErr) {
        throw loginErr;
      }
    }
    throw err;
  }
}

async function safePost(url, body, token) {
  try {
    return await axios.post(url, body, token ? { headers: { Authorization: `Bearer ${token}` } } : undefined);
  } catch (err) {
    // return the error so caller can log and decide
    return { error: err };
  }
}

async function seedData() {
  console.log('🌱 Seeding test data...\n');

  try {
    // 1. Create test users
    console.log('Creating test users...');

    const adminUser = { name: 'Admin User', email: 'admin@test.com', password: 'Admin@123', role: 'admin' };
    const organizerUser = { name: 'John Organizer', email: 'organizer@test.com', password: 'Organizer@123', role: 'organizer' };
    const donor1User = { name: 'Alice Donor', email: 'alice@test.com', password: 'Donor@123', role: 'donor' };
    const donor2User = { name: 'Bob Donor', email: 'bob@test.com', password: 'Donor@123', role: 'donor' };

    const { token: adminToken } = await registerOrLogin(adminUser);
    console.log('✅ Admin available:', adminUser.email);

    const organizerResult = await registerOrLogin(organizerUser);
    const organizerToken = organizerResult.token;
    console.log('✅ Organizer available:', organizerUser.email);

    const donor1Result = await registerOrLogin(donor1User);
    const donor1Token = donor1Result.token;
    console.log('✅ Donor available:', donor1User.email);

    const donor2Result = await registerOrLogin(donor2User);
    const donor2Token = donor2Result.token;
    console.log('✅ Donor available:', donor2User.email, '\n');

    // 2. Create test events
    console.log('Creating test events...');

    const event1Body = {
      title: 'Build a School in Rural India',
      description: 'Help us build a school for underprivileged children in rural India. This project will provide education to over 500 children who currently have no access to quality education.',
      targetAmount: 50000,
      category: 'Education',
      endDate: new Date(Date.now() + daysToMs(60)).toISOString(),
      image: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800'
    };

    const event2Body = {
      title: 'Medical Equipment for Local Hospital',
      description: 'Our community hospital needs urgent medical equipment upgrades to serve patients better. Your contribution will directly impact healthcare quality.',
      targetAmount: 30000,
      category: 'Healthcare',
      endDate: new Date(Date.now() + daysToMs(45)).toISOString(),
      image: 'https://images.unsplash.com/photo-1631217868264-e5b90bb7e133?w=800'
    };

    const event3Body = {
      title: 'Emergency Flood Relief Fund',
      description: 'Recent floods have displaced hundreds of families. We need immediate funds for food, shelter, and medical supplies.',
      targetAmount: 75000,
      category: 'Emergency',
      endDate: new Date(Date.now() + daysToMs(30)).toISOString(),
      image: 'https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?w=800'
    };

    const e1 = await safePost(`${API_BASE_URL}/events`, event1Body, organizerToken);
    if (e1.error) console.error('❌ Event1 creation error:', e1.error.response?.data || e1.error.message);
    else console.log('✅ Event created:', event1Body.title);

    const e2 = await safePost(`${API_BASE_URL}/events`, event2Body, organizerToken);
    if (e2.error) console.error('❌ Event2 creation error:', e2.error.response?.data || e2.error.message);
    else console.log('✅ Event created:', event2Body.title);

    const e3 = await safePost(`${API_BASE_URL}/events`, event3Body, organizerToken);
    if (e3.error) console.error('❌ Event3 creation error:', e3.error.response?.data || e3.error.message);
    else console.log('✅ Event created:', event3Body.title, '\n');

    // Extract event IDs safely (if events existed previously, they might be null)
    const event1Id = e1?.data?.data?.id || e1?.data?.id || null;
    const event2Id = e2?.data?.data?.id || e2?.data?.id || null;
    const event3Id = e3?.data?.data?.id || e3?.data?.id || null;

    // 3. Create test pledges
    console.log('Creating test pledges...');

    if (!event1Id) console.warn('⚠️ Skipping some pledges because event1 id not available');
    if (!event2Id) console.warn('⚠️ Skipping some pledges because event2 id not available');
    if (!event3Id) console.warn('⚠️ Skipping some pledges because event3 id not available');

    if (event1Id) {
      const p1 = await safePost(`${API_BASE_URL}/pledges`, {
        eventId: event1Id,
        amount: 5000,
        isAnonymous: false,
        message: 'Education is the key to breaking the cycle of poverty!'
      }, donor1Token);
      if (p1.error) console.error('❌ Pledge1 error:', p1.error.response?.data || p1.error.message);
      else console.log('✅ Pledge created by Alice');

      const p2 = await safePost(`${API_BASE_URL}/pledges`, {
        eventId: event1Id,
        amount: 2500,
        isAnonymous: true,
        message: 'Happy to contribute!'
      }, donor2Token);
      if (p2.error) console.error('❌ Pledge2 error:', p2.error.response?.data || p2.error.message);
      else console.log('✅ Pledge created by Bob (anonymous)');
    }

    if (event2Id) {
      const p3 = await safePost(`${API_BASE_URL}/pledges`, {
        eventId: event2Id,
        amount: 10000,
        isAnonymous: false,
        message: 'Healthcare is a fundamental right.'
      }, donor1Token);
      if (p3.error) console.error('❌ Pledge3 error:', p3.error.response?.data || p3.error.message);
      else console.log('✅ Pledge created by Alice');
    }

    if (event3Id) {
      const p4 = await safePost(`${API_BASE_URL}/pledges`, {
        eventId: event3Id,
        amount: 15000,
        isAnonymous: false,
        message: 'Stay strong! We are with you.'
      }, donor2Token);
      if (p4.error) console.error('❌ Pledge4 error:', p4.error.response?.data || p4.error.message);
      else console.log('✅ Pledge created by Bob');
    }

    console.log('\n🎉 Seed data script finished.\n');
    console.log('📝 Test Accounts:');
    console.log('Admin:     admin@test.com / Admin@123');
    console.log('Organizer: organizer@test.com / Organizer@123');
    console.log('Donor 1:   alice@test.com / Donor@123');
    console.log('Donor 2:   bob@test.com / Donor@123\n');

  } catch (error) {
    console.error('❌ Fatal error seeding data:', error.response?.data || error.message || error);
  }
}

if (require.main === module) {
  seedData();
}

module.exports = seedData;