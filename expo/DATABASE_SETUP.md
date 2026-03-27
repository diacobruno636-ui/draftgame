# Database Setup Guide

## Prerequisites
The database environment variables are already configured in your project.

## Setup Steps

### 1. Generate Prisma Client
This creates the type-safe database client based on your schema:
```bash
npx prisma generate
```

### 2. Push Schema to Database
This creates the tables in your PostgreSQL database:
```bash
npx prisma db push
```

### 3. Verify Setup (Optional)
Check if the database is properly connected:
```bash
npx prisma db pull
```

## Troubleshooting

### Error: "Prisma Client not generated"
Run `npx prisma generate` to generate the Prisma client.

### Error: "Can't reach database server"
- Verify your PRISMA_DATABASE_URL environment variable is correct
- Check if the database server is running
- Verify network connectivity

### Error: "Database schema is out of sync"
Run `npx prisma db push` to sync the schema with the database.

## Current Schema
Your database includes:
- **Room**: Game rooms with unique codes
- **RoomPlayer**: Players in game rooms

## Environment Variables
The following environment variables are already configured:
- `PRISMA_DATABASE_URL`: Prisma Accelerate connection URL
- `DATABASE_URL`: Direct PostgreSQL connection URL

## Next Steps
After running the setup commands above, restart your development server for the changes to take effect.
