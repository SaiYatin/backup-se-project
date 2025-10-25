// ✅ Better approach using Sequelize directly
const { sequelize } = require('../backend/src/config/database');
const User = require('../backend/src/models/User');
const Event = require('../backend/src/models/Event');
const Pledge = require('../backend/src/models/Pledge');

async function seedDatabase() {
  try {
    console.log('🌱 Seeding database...\n');

    // Sync database
    await sequelize.sync({ force: true });
    console.log('✅ Database synced\n');

    // Create users
    const admin = await User.create({
      name: 'Admin User',
      email: 'admin@test.com',
      password_hash: 'Admin@123',
      role: 'admin',
      is_verified: true
    });

    const organizer = await User.create({
      name: 'John Organizer',
      email: 'organizer@test.com',
      password_hash: 'Organizer@123',
      role: 'organizer',
      is_verified: true
    });

    const donor1 = await User.create({
      name: 'Alice Donor',
      email: 'alice@test.com',
      password_hash: 'Donor@123',
      role: 'donor',
      is_verified: true
    });

    console.log('✅ Users created\n');

    // Create events
    const event1 = await Event.create({
      organizer_id: organizer.id,
      title: 'Build a School in Rural India',
      description: 'Help us build a school...',
      target_amount: 50000,
      current_amount: 0,
      category: 'Education',
      status: 'active',
      end_date: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000)
    });

    console.log('✅ Events created\n');

    // Create pledges
    await Pledge.create({
      event_id: event1.id,
      donor_id: donor1.id,
      amount: 5000,
      is_anonymous: false,
      message: 'Great cause!',
      payment_status: 'completed'
    });

    console.log('✅ Pledges created\n');
    console.log('🎉 Database seeded successfully!\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

seedDatabase();