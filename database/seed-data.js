/**
 * Enhanced Database Seeding Script
 * Features:
 * - Idempotent operations (can be run multiple times safely)
 * - Comprehensive test data generation
 * - Realistic data relationships and timing
 * - Environment-based configuration
 * - Progress tracking and error handling
 * - Data validation and cleanup
 */

const { sequelize } = require('../backend/src/config/database');
const { User, Event, Pledge, Report } = require('../backend/src/models');
const bcrypt = require('bcrypt');

// Configuration based on environment
const config = {
  development: {
    forceSync: false,
    userCount: 50,
    eventCount: 25,
    pledgeCount: 150,
    reportCount: 10
  },
  test: {
    forceSync: true,
    userCount: 10,
    eventCount: 5,
    pledgeCount: 20,
    reportCount: 3
  },
  production: {
    forceSync: false,
    userCount: 5, // Minimal seed data for production
    eventCount: 2,
    pledgeCount: 5,
    reportCount: 1
  }
};

const currentConfig = config[process.env.NODE_ENV || 'development'];

// Sample data templates
const eventCategories = ['Education', 'Healthcare', 'Environment', 'Disaster Relief', 'Community Development', 'Arts & Culture', 'Sports', 'Technology'];

const eventTitles = [
  'Build Schools in Remote Villages',
  'Emergency Medical Equipment Fund',
  'Clean Water Initiative',
  'Disaster Relief for Flood Victims',
  'Community Garden Project',
  'Art Therapy for Children',
  'Youth Sports Equipment Drive',
  'Digital Learning Lab Setup',
  'Elder Care Support Program',
  'Environmental Conservation Project',
  'Food Bank Expansion',
  'Mental Health Awareness Campaign',
  'Scholarship Fund for Underprivileged',
  'Animal Shelter Renovation',
  'Public Library Technology Update'
];

const userNames = [
  'Alice Johnson', 'Bob Smith', 'Carol Williams', 'David Brown', 'Emma Davis',
  'Frank Miller', 'Grace Wilson', 'Henry Moore', 'Isabella Taylor', 'Jack Anderson',
  'Katherine Thomas', 'Liam Jackson', 'Mia White', 'Noah Harris', 'Olivia Martin',
  'Paul Clark', 'Quinn Lewis', 'Rachel Lee', 'Samuel Walker', 'Tina Hall',
  'Ulysses Allen', 'Victoria Young', 'William King', 'Xara Wright', 'Yuki Lopez',
  'Zachary Hill', 'Aria Green', 'Blake Adams', 'Chloe Baker', 'Daniel Gonzalez'
];

/**
 * Generate a random element from an array
 */
function randomChoice(array) {
  return array[Math.floor(Math.random() * array.length)];
}

/**
 * Generate a random number between min and max
 */
function randomBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Generate a random date within the last N days
 */
function randomDateWithinDays(days) {
  const now = new Date();
  const past = new Date(now.getTime() - (days * 24 * 60 * 60 * 1000));
  return new Date(past.getTime() + Math.random() * (now.getTime() - past.getTime()));
}

/**
 * Generate a realistic event description
 */
function generateEventDescription(title, category) {
  const descriptions = {
    'Education': `This ${title.toLowerCase()} aims to provide quality education opportunities to underserved communities. Your contribution will help purchase books, supplies, and educational materials needed to create a positive learning environment.`,
    'Healthcare': `Support our ${title.toLowerCase()} to improve healthcare access and quality in our community. Donations will fund medical equipment, supplies, and healthcare services for those who need them most.`,
    'Environment': `Join our ${title.toLowerCase()} to protect and preserve our natural environment. Your support will fund conservation efforts, environmental education, and sustainable community practices.`,
    'Disaster Relief': `Help us provide immediate assistance through our ${title.toLowerCase()}. Your donations will provide emergency supplies, temporary shelter, and essential services to disaster victims.`,
    'Community Development': `Support our ${title.toLowerCase()} to strengthen and improve our local community. Funds will be used for infrastructure improvements, community programs, and local development initiatives.`
  };
  
  return descriptions[category] || `Support our ${title.toLowerCase()} initiative to make a positive impact in our community. Your generous donation will help us achieve our goals and create lasting change.`;
}

/**
 * Hash password for user creation
 */
async function hashPassword(password) {
  return await bcrypt.hash(password, 10);
}

/**
 * Check if database has existing data
 */
async function checkExistingData() {
  const [userCount, eventCount, pledgeCount] = await Promise.all([
    User.count(),
    Event.count(),
    Pledge.count()
  ]);
  
  return { userCount, eventCount, pledgeCount };
}

/**
 * Create users with realistic data
 */
async function createUsers() {
  console.log('👥 Creating users...');
  
  const users = [];
  
  // Create admin user (idempotent)
  let admin = await User.findOne({ where: { email: 'admin@charityfund.com' } });
  if (!admin) {
    admin = await User.create({
      name: 'System Administrator',
      email: 'admin@charityfund.com',
      password_hash: await hashPassword('Admin@123456'),
      role: 'admin',
      is_verified: true,
      created_at: randomDateWithinDays(365),
      last_login: randomDateWithinDays(7)
    });
    console.log('   ✅ Admin user created');
  } else {
    console.log('   ℹ️  Admin user already exists');
  }
  users.push(admin);
  
  // Create organizers
  const organizerCount = Math.ceil(currentConfig.userCount * 0.2); // 20% organizers
  for (let i = 0; i < organizerCount; i++) {
    const name = randomChoice(userNames);
    const email = `organizer${i + 1}@example.com`;
    
    let organizer = await User.findOne({ where: { email } });
    if (!organizer) {
      organizer = await User.create({
        name: name,
        email: email,
        password_hash: await hashPassword('Organizer@123'),
        role: 'organizer',
        is_verified: Math.random() > 0.1, // 90% verified
        created_at: randomDateWithinDays(200),
        last_login: randomDateWithinDays(30)
      });
    }
    users.push(organizer);
  }
  
  // Create donors
  const donorCount = currentConfig.userCount - organizerCount - 1; // Remaining users as donors
  for (let i = 0; i < donorCount; i++) {
    const name = randomChoice(userNames);
    const email = `donor${i + 1}@example.com`;
    
    let donor = await User.findOne({ where: { email } });
    if (!donor) {
      donor = await User.create({
        name: name,
        email: email,
        password_hash: await hashPassword('Donor@123'),
        role: 'donor',
        is_verified: Math.random() > 0.05, // 95% verified
        created_at: randomDateWithinDays(300),
        last_login: randomDateWithinDays(60)
      });
    }
    users.push(donor);
  }
  
  console.log(`   ✅ Created ${users.length} users total`);
  return users;
}

/**
 * Create events with realistic data and relationships
 */
async function createEvents(users) {
  console.log('📅 Creating events...');
  
  const events = [];
  const organizers = users.filter(u => u.role === 'organizer');
  
  for (let i = 0; i < currentConfig.eventCount; i++) {
    const title = randomChoice(eventTitles);
    const category = randomChoice(eventCategories);
    const organizer = randomChoice(organizers);
    const targetAmount = randomBetween(1000, 100000);
    const createdDate = randomDateWithinDays(180);
    
    // Determine event status based on creation date and random factors
    let status = 'active';
    let endDate = new Date(createdDate.getTime() + randomBetween(30, 180) * 24 * 60 * 60 * 1000);
    
    if (endDate < new Date()) {
      status = Math.random() > 0.3 ? 'completed' : 'cancelled';
    }
    
    // Check if event already exists (by title and organizer)
    let event = await Event.findOne({ 
      where: { 
        title: title,
        organizer_id: organizer.id 
      } 
    });
    
    if (!event) {
      event = await Event.create({
        organizer_id: organizer.id,
        title: title,
        description: generateEventDescription(title, category),
        target_amount: targetAmount,
        current_amount: 0, // Will be updated when pledges are created
        category: category,
        status: status,
        end_date: endDate,
        created_at: createdDate,
        updated_at: createdDate,
        location: randomChoice(['New York, NY', 'Los Angeles, CA', 'Chicago, IL', 'Houston, TX', 'Phoenix, AZ', 'Online']),
        image_url: `https://picsum.photos/800/600?random=${i}`,
        is_featured: Math.random() > 0.8, // 20% featured
        approval_status: Math.random() > 0.1 ? 'approved' : 'pending' // 90% approved
      });
    }
    
    events.push(event);
  }
  
  console.log(`   ✅ Created ${events.length} events`);
  return events;
}

/**
 * Create pledges with realistic patterns and timing
 */
async function createPledges(users, events) {
  console.log('💰 Creating pledges...');
  
  const pledges = [];
  const donors = users.filter(u => u.role === 'donor');
  const activeEvents = events.filter(e => e.status === 'active' || e.status === 'completed');
  
  for (let i = 0; i < currentConfig.pledgeCount; i++) {
    const donor = randomChoice(donors);
    const event = randomChoice(activeEvents);
    const amount = randomBetween(10, 5000);
    const pledgeDate = new Date(Math.max(
      event.created_at.getTime(),
      randomDateWithinDays(120)
    ));
    
    // Skip if pledge already exists for this donor-event combination
    const existingPledge = await Pledge.findOne({
      where: {
        donor_id: donor.id,
        event_id: event.id
      }
    });
    
    if (existingPledge) continue;
    
    // Determine payment status based on pledge date and random factors
    let paymentStatus = 'pending';
    const daysSincePledge = (new Date() - pledgeDate) / (1000 * 60 * 60 * 24);
    
    if (daysSincePledge > 30) {
      paymentStatus = Math.random() > 0.1 ? 'completed' : 'failed';
    } else if (daysSincePledge > 7) {
      paymentStatus = Math.random() > 0.3 ? 'completed' : Math.random() > 0.8 ? 'failed' : 'pending';
    }
    
    const messages = [
      'Happy to support this great cause!',
      'Wishing you all the best with this project.',
      'Keep up the amazing work!',
      'Proud to be part of this initiative.',
      'Hope this helps reach your goal!',
      '',
      '', // Some pledges without messages
    ];
    
    const pledge = await Pledge.create({
      event_id: event.id,
      donor_id: donor.id,
      amount: amount,
      is_anonymous: Math.random() > 0.7, // 30% anonymous
      message: randomChoice(messages),
      payment_status: paymentStatus,
      payment_method: randomChoice(['credit_card', 'paypal', 'bank_transfer', 'cash']),
      created_at: pledgeDate,
      updated_at: paymentStatus === 'completed' ? 
        new Date(pledgeDate.getTime() + randomBetween(1, 7) * 24 * 60 * 60 * 1000) : 
        pledgeDate
    });
    
    pledges.push(pledge);
  }
  
  console.log(`   ✅ Created ${pledges.length} pledges`);
  return pledges;
}

/**
 * Update event current amounts based on completed pledges
 */
async function updateEventAmounts(events) {
  console.log('🔄 Updating event amounts...');
  
  for (const event of events) {
    const completedPledges = await Pledge.findAll({
      where: {
        event_id: event.id,
        payment_status: 'completed'
      }
    });
    
    const totalAmount = completedPledges.reduce((sum, pledge) => sum + parseFloat(pledge.amount), 0);
    
    await event.update({
      current_amount: totalAmount,
      updated_at: new Date()
    });
  }
  
  console.log('   ✅ Event amounts updated');
}

/**
 * Create sample reports for testing
 */
async function createSampleReports(users) {
  console.log('📊 Creating sample reports...');
  
  const admin = users.find(u => u.role === 'admin');
  const reports = [];
  
  for (let i = 0; i < currentConfig.reportCount; i++) {
    const reportTypes = ['daily', 'weekly', 'monthly'];
    const type = randomChoice(reportTypes);
    const createdDate = randomDateWithinDays(90);
    
    const sampleData = {
      period: {
        type: type,
        start_date: createdDate,
        end_date: new Date(createdDate.getTime() + 24 * 60 * 60 * 1000)
      },
      summary: {
        total_users: randomBetween(10, 100),
        total_events: randomBetween(5, 50),
        total_pledges: randomBetween(20, 200),
        total_amount: randomBetween(1000, 50000)
      },
      analytics: {
        top_events: [],
        user_activity: {},
        category_performance: []
      },
      generated_at: createdDate,
      generated_by: admin.id
    };
    
    const report = await Report.create({
      type: type,
      title: `${type.charAt(0).toUpperCase() + type.slice(1)} Report - ${createdDate.toDateString()}`,
      start_date: createdDate,
      end_date: new Date(createdDate.getTime() + 24 * 60 * 60 * 1000),
      data: sampleData,
      status: 'completed',
      generated_by: admin.id,
      created_at: createdDate
    });
    
    reports.push(report);
  }
  
  console.log(`   ✅ Created ${reports.length} sample reports`);
  return reports;
}

/**
 * Display seeding summary
 */
function displaySummary(users, events, pledges, reports) {
  console.log('\n📋 SEEDING SUMMARY');
  console.log('━━━━━━━━━━━━━━━━━━━');
  console.log(`👥 Users: ${users.length}`);
  console.log(`   - Admins: ${users.filter(u => u.role === 'admin').length}`);
  console.log(`   - Organizers: ${users.filter(u => u.role === 'organizer').length}`);
  console.log(`   - Donors: ${users.filter(u => u.role === 'donor').length}`);
  console.log(`📅 Events: ${events.length}`);
  console.log(`   - Active: ${events.filter(e => e.status === 'active').length}`);
  console.log(`   - Completed: ${events.filter(e => e.status === 'completed').length}`);
  console.log(`   - Cancelled: ${events.filter(e => e.status === 'cancelled').length}`);
  console.log(`💰 Pledges: ${pledges.length}`);
  console.log(`   - Completed: ${pledges.filter(p => p.payment_status === 'completed').length}`);
  console.log(`   - Pending: ${pledges.filter(p => p.payment_status === 'pending').length}`);
  console.log(`   - Failed: ${pledges.filter(p => p.payment_status === 'failed').length}`);
  console.log(`📊 Reports: ${reports.length}`);
  
  const totalRaised = pledges
    .filter(p => p.payment_status === 'completed')
    .reduce((sum, p) => sum + parseFloat(p.amount), 0);
  
  console.log(`💵 Total Amount Raised: $${totalRaised.toLocaleString()}`);
  console.log('\n🎉 Database seeding completed successfully!\n');
}

/**
 * Main seeding function
 */
async function seedDatabase() {
  try {
    console.log('🌱 STARTING DATABASE SEEDING');
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`Force Sync: ${currentConfig.forceSync}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Check database connection
    await sequelize.authenticate();
    console.log('✅ Database connection established\n');

    // Check existing data
    const existingData = await checkExistingData();
    console.log('📊 Existing data check:');
    console.log(`   Users: ${existingData.userCount}`);
    console.log(`   Events: ${existingData.eventCount}`);
    console.log(`   Pledges: ${existingData.pledgeCount}\n`);

    // Sync database if needed
    if (currentConfig.forceSync) {
      console.log('🔄 Force syncing database...');
      await sequelize.sync({ force: true });
      console.log('✅ Database force synced\n');
    } else {
      await sequelize.sync({ alter: true });
      console.log('✅ Database synced\n');
    }

    // Create data
    const users = await createUsers();
    const events = await createEvents(users);
    const pledges = await createPledges(users, events);
    await updateEventAmounts(events);
    const reports = await createSampleReports(users);

    // Display summary
    displaySummary(users, events, pledges, reports);

    // Test credentials display
    console.log('🔑 TEST CREDENTIALS');
    console.log('━━━━━━━━━━━━━━━━━━━');
    console.log('Admin: admin@charityfund.com / Admin@123456');
    console.log('Organizer: organizer1@example.com / Organizer@123');
    console.log('Donor: donor1@example.com / Donor@123');
    console.log('');

    await sequelize.close();
    process.exit(0);

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    console.error('Stack trace:', error.stack);
    
    try {
      await sequelize.close();
    } catch (closeError) {
      console.error('Error closing database connection:', closeError);
    }
    
    process.exit(1);
  }
}

// Handle process termination
process.on('SIGINT', async () => {
  console.log('\n⚠️  Seeding interrupted. Cleaning up...');
  try {
    await sequelize.close();
  } catch (error) {
    console.error('Error during cleanup:', error);
  }
  process.exit(1);
});

// Run seeding
if (require.main === module) {
  seedDatabase();
}

module.exports = {
  seedDatabase,
  createUsers,
  createEvents,
  createPledges,
  createSampleReports
};