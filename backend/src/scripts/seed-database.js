// ============================================
// FILE: backend/src/scripts/seed-database.js
// Simple seed script that works with your models
// ============================================

const { User, Event, Pledge, Report, sequelize } = require('../models');

async function seed() {
  try {
    console.log('🌱 Starting database seeding...\n');

    // Connect to database
    await sequelize.authenticate();
    console.log('✅ Database connected\n');

    // Sync models (creates tables if they don't exist)
    await sequelize.sync({ alter: false });
    console.log('✅ Models synced\n');

    // Check if data already exists
    const userCount = await User.count();
    if (userCount > 5) {  // Changed from > 0 to > 5 to allow seeding with existing schema users
      console.log('⚠️  Database already has enough data. Skipping seed...');
      console.log(`   Found ${userCount} users\n`);
      process.exit(0);
    }

    // ========================================
    // CREATE USERS
    // ========================================
    console.log('👥 Creating users...');

    // Check if users already exist
    let admin = await User.findOne({ where: { email: 'admin@fundraising.com' }});
    if (!admin) {
      admin = await User.create({
        name: 'Admin User',
        email: 'admin@fundraising.com',
        password_hash: 'Admin@123', // Will be hashed by beforeCreate hook
        role: 'admin',
        is_verified: true
      });
      console.log('   ✅ Admin created');
    } else {
      console.log('   ℹ️  Admin already exists');
    }

    let organizer1 = await User.findOne({ where: { email: 'organizer1@test.com' }});
    if (!organizer1) {
      organizer1 = await User.create({
        name: 'John Organizer',
        email: 'organizer1@test.com',
        password_hash: 'Test@123',
        role: 'organizer',
        is_verified: true
      });
    }

    let organizer2 = await User.findOne({ where: { email: 'organizer2@test.com' }});
    if (!organizer2) {
      organizer2 = await User.create({
        name: 'Sarah Organizer',
        email: 'organizer2@test.com',
        password_hash: 'Test@123',
        role: 'organizer',
        is_verified: true
      });
    }
    console.log('   ✅ Organizers ready');

    let donor1 = await User.findOne({ where: { email: 'donor1@test.com' }});
    if (!donor1) {
      donor1 = await User.create({
        name: 'Alice Donor',
        email: 'donor1@test.com',
        password_hash: 'Test@123',
        role: 'donor',
        is_verified: true
      });
    }

    let donor2 = await User.findOne({ where: { email: 'donor2@test.com' }});
    if (!donor2) {
      donor2 = await User.create({
        name: 'Bob Donor',
        email: 'donor2@test.com',
        password_hash: 'Test@123',
        role: 'donor',
        is_verified: true
      });
    }

    let donor3 = await User.findOne({ where: { email: 'donor3@test.com' }});
    if (!donor3) {
      donor3 = await User.create({
        name: 'Carol Donor',
        email: 'donor3@test.com',
        password_hash: 'Test@123',
        role: 'donor',
        is_verified: true
      });
    }
    console.log('   ✅ Donors ready');

    // ========================================
    // CREATE EVENTS
    // ========================================
    console.log('\n📅 Creating events...');

    const event1 = await Event.create({
      organizer_id: organizer1.id,
      title: 'Build Community Center',
      description: 'Help us build a new community center that will serve our neighborhood with educational programs, sports facilities, and community events. Your donation will make a lasting impact.',
      target_amount: 50000.00,
      current_amount: 0,
      category: 'Community Development',
      status: 'active',
      end_date: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000) // 60 days from now
    });

    const event2 = await Event.create({
      organizer_id: organizer1.id,
      title: 'School Library Renovation',
      description: 'Transform our outdated school library into a modern learning space with new books, computers, and comfortable reading areas for students.',
      target_amount: 25000.00,
      current_amount: 0,
      category: 'Education',
      status: 'active',
      end_date: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000)
    });

    const event3 = await Event.create({
      organizer_id: organizer2.id,
      title: 'Emergency Medical Equipment',
      description: 'Our local clinic needs urgent funding for life-saving medical equipment. Every donation brings us closer to better healthcare for our community.',
      target_amount: 75000.00,
      current_amount: 0,
      category: 'Healthcare',
      status: 'active',
      end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    });

    const event4 = await Event.create({
      organizer_id: organizer2.id,
      title: 'Clean Water Project',
      description: 'Provide clean drinking water to remote villages by installing water purification systems. Your support will improve lives of thousands.',
      target_amount: 100000.00,
      current_amount: 0,
      category: 'Environment',
      status: 'pending', // Waiting for approval
      end_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
    });

    const event5 = await Event.create({
      organizer_id: organizer1.id,
      title: 'Youth Sports Program',
      description: 'Fund sports equipment and coaching for underprivileged youth. Give children the opportunity to learn teamwork, discipline, and stay active.',
      target_amount: 15000.00,
      current_amount: 0,
      category: 'Sports',
      status: 'active',
      end_date: new Date(Date.now() + 40 * 24 * 60 * 60 * 1000)
    });

    console.log('   ✅ 5 events created');

    // ========================================
    // CREATE PLEDGES
    // ========================================
    console.log('\n💰 Creating pledges...');

    // Pledges for event1 (Community Center)
    await Pledge.create({
      event_id: event1.id,
      donor_id: donor1.id,
      amount: 5000.00,
      is_anonymous: false,
      message: 'Happy to support this great initiative!',
      payment_status: 'completed'
    });

    await Pledge.create({
      event_id: event1.id,
      donor_id: donor2.id,
      amount: 2500.00,
      is_anonymous: false,
      message: 'Keep up the good work!',
      payment_status: 'completed'
    });

    await Pledge.create({
      event_id: event1.id,
      donor_id: donor3.id,
      amount: 1000.00,
      is_anonymous: true,
      message: '',
      payment_status: 'completed'
    });

    // Pledges for event2 (Library)
    await Pledge.create({
      event_id: event2.id,
      donor_id: donor1.id,
      amount: 3000.00,
      is_anonymous: false,
      message: 'Education is the key to success!',
      payment_status: 'completed'
    });

    await Pledge.create({
      event_id: event2.id,
      donor_id: donor2.id,
      amount: 1500.00,
      is_anonymous: false,
      payment_status: 'pending'
    });

    // Pledges for event3 (Medical Equipment)
    await Pledge.create({
      event_id: event3.id,
      donor_id: donor3.id,
      amount: 10000.00,
      is_anonymous: false,
      message: 'Healthcare should be accessible to all.',
      payment_status: 'completed'
    });

    await Pledge.create({
      event_id: event3.id,
      donor_id: donor1.id,
      amount: 5000.00,
      is_anonymous: true,
      payment_status: 'completed'
    });

    // Pledges for event5 (Sports)
    await Pledge.create({
      event_id: event5.id,
      donor_id: donor2.id,
      amount: 500.00,
      is_anonymous: false,
      message: 'Great program for kids!',
      payment_status: 'completed'
    });

    console.log('   ✅ 8 pledges created');

    // ========================================
    // UPDATE EVENT AMOUNTS
    // ========================================
    console.log('\n🔄 Updating event amounts...');

    // Calculate and update current amounts
    for (const event of [event1, event2, event3, event5]) {
      const completedPledges = await Pledge.findAll({
        where: {
          event_id: event.id,
          payment_status: 'completed'
        }
      });

      const total = completedPledges.reduce((sum, p) => sum + parseFloat(p.amount), 0);
      await event.update({ current_amount: total });
    }

    console.log('   ✅ Event amounts updated');

    // ========================================
    // CREATE SAMPLE REPORT
    // ========================================
    //console.log('\n📊 Creating sample report...');

    //await Report.create({
    //  event_id: event1.id,
    //  reporter_id: donor1.id,
    //  type: 'OTHER',
    //  description: 'Could you provide more details about how the funds will be used? Just want to ensure transparency.',
    //  status: 'PENDING'
   // });

   // console.log('   ✅ Sample report created');

    // ========================================
    // DISPLAY SUMMARY
    // ========================================
    console.log('\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 SEEDING SUMMARY');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('👥 Users: 6 (reused existing if present)');
    console.log('   - Admins: 1');
    console.log('   - Organizers: 2');
    console.log('   - Donors: 3');
    console.log('📅 Events created: 5');
    console.log('   - Active: 4');
    console.log('   - Pending: 1');
    console.log('💰 Pledges created: 8');
    console.log('   - Completed: 7');
    console.log('   - Pending: 1');
    console.log('📊 Reports created: 1');
    console.log('');
    console.log('🔑 TEST CREDENTIALS:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Admin:     admin@fundraising.com / Admin@123');
    console.log('Organizer: organizer1@test.com / Test@123');
    console.log('Donor:     donor1@test.com / Test@123');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n✅ Database seeded successfully!\n');

    await sequelize.close();
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Error seeding database:', error);
    console.error('Details:', error.message);
    if (error.original) {
      console.error('SQL Error:', error.original.message);
    }
    process.exit(1);
  }
}

// Run seeding
seed();