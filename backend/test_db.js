const { Sequelize } = require('sequelize');

// Your database URL from .env
const DATABASE_URL = 'postgresql://postgres:yatin1234@db.cfnorbnrgplkiqtwycnu.supabase.co:5432/postgres';

const sequelize = new Sequelize(DATABASE_URL, {
  dialect: 'postgres',
  logging: false, // Set to true if you want to see SQL queries
});

console.log('🔄 Testing database connection...\n');

sequelize.authenticate()
  .then(() => {
    console.log('✅ DATABASE CONNECTION SUCCESSFUL!');
    console.log('✅ Your Supabase database is reachable!');
    console.log('✅ GitHub Actions will work once secrets are added!\n');
  })
  .catch(err => {
    console.error('❌ CONNECTION FAILED!');
    console.error('❌ Error:', err.message);
    console.error('\n🔍 Possible issues:');
    console.error('   1. Wrong password');
    console.error('   2. Database not accessible');
    console.error('   3. Firewall blocking connection\n');
  })
  .finally(() => {
    process.exit();
  });