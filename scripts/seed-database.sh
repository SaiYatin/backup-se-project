# ✅ scripts/seed-database.sh
#!/bin/bash
set -e

echo "🌱 Seeding database..."
node database/seed-data.js
echo "✅ Database seeded successfully!"