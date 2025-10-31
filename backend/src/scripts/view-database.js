// ============================================
// FILE: backend/src/scripts/view-database.js
// Quick script to view database contents
// ============================================

const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  logging: false
});

async function viewDatabase() {
  try {
    console.log('🔌 Connecting to database...\n');
    await sequelize.authenticate();
    console.log('✅ Connected successfully!\n');

    // Get all tables
    const [tables] = await sequelize.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);

    console.log('📊 AVAILABLE TABLES:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    tables.forEach((table, index) => {
      console.log(`${index + 1}. ${table.table_name}`);
    });
    console.log('');

    // Count records in each table
    console.log('📈 RECORD COUNTS:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    for (const table of tables) {
      const tableName = table.table_name;
      const [result] = await sequelize.query(`SELECT COUNT(*) as count FROM ${tableName}`);
      console.log(`${tableName.padEnd(20)} : ${result[0].count} records`);
    }
    console.log('');

    // Show sample data from main tables
    const mainTables = ['users', 'events', 'pledges', 'reports'];
    
    for (const tableName of mainTables) {
      const tableExists = tables.some(t => t.table_name === tableName);
      if (!tableExists) continue;

      console.log(`\n🔍 SAMPLE DATA FROM ${tableName.toUpperCase()}:`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      
      const [rows] = await sequelize.query(`SELECT * FROM ${tableName} LIMIT 5`);
      
      if (rows.length === 0) {
        console.log('(No data yet)\n');
      } else {
        console.table(rows);
      }
    }

    // Show some useful queries
    console.log('\n📊 USEFUL STATISTICS:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    // Users by role
    try {
      const [roleStats] = await sequelize.query(`
        SELECT role, COUNT(*) as count 
        FROM users 
        GROUP BY role 
        ORDER BY count DESC
      `);
      console.log('\n👥 Users by Role:');
      console.table(roleStats);
    } catch (e) {
      console.log('No user data yet');
    }

    // Events by status
    try {
      const [eventStats] = await sequelize.query(`
        SELECT status, COUNT(*) as count 
        FROM events 
        GROUP BY status 
        ORDER BY count DESC
      `);
      console.log('\n📅 Events by Status:');
      console.table(eventStats);
    } catch (e) {
      console.log('No event data yet');
    }

    // Pledge statistics
    try {
      const [pledgeStats] = await sequelize.query(`
        SELECT 
          payment_status,
          COUNT(*) as count,
          SUM(amount) as total_amount
        FROM pledges 
        GROUP BY payment_status 
        ORDER BY count DESC
      `);
      console.log('\n💰 Pledge Statistics:');
      console.table(pledgeStats);
    } catch (e) {
      console.log('No pledge data yet');
    }

    console.log('\n✅ Database inspection complete!\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await sequelize.close();
  }
}

// Run the viewer
viewDatabase();