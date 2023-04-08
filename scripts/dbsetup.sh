#!/bin/bash

# Load environment variables from env.local
if [ -f "./env.local" ]; then
  export $(cat .env.local | xargs)
fi

# Check if DATABASE_URL environment variable is set
if [ -z "${DATABASE_URL}" ]; then
  echo "DATABASE_URL environment variable is not set. Please set it in the env.local file."
  exit 1
fi

# Check if the schema exists
if [ ! -f "./prisma/schema.prisma" ]; then
  echo "The schema file is not found. Please make sure the schema.prisma file is in the ./prisma folder."
  exit 1
fi

# Check if MySQL server is running
MYSQL_PROCESS=$(pgrep mysql)
echo "MySQL process: $MYSQL_PROCESS"

if [ -z "$MYSQL_PROCESS" ]; then
  echo "MySQL server is not running. Attempting to start it..."
  brew services start mysql
fi

# Reset the database
npx prisma migrate reset --force

# Apply migrations and create the database if it doesn't exist
npx prisma migrate dev --name init --create-only

# Seed the database if a seed.ts or seed.js file exists
if [ -f "./prisma/seed.ts" ]; then
  tsc prisma/seed.ts
  node prisma/seed.js
elif [ -f "./prisma/seed.js" ]; then
  node prisma/seed.js
else
  echo "No seed file found. Skipping database seeding."
fi

echo "Database setup is complete."
