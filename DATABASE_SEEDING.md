# Database Seeding

This guide explains how to seed the database with sample data for testing.

## Prerequisites

- MongoDB should be running
- `.env` file should be configured with proper database connection string
- All dependencies should be installed (`npm install`)

## Running the Seed Script

To populate the database with sample data, run:

```bash
npm run seed
```

This will:
1. Clear all existing data from the database
2. Create sample users (admin, hotel owners, customers)
3. Create sample hotels with locations
4. Create menus with multiple categories and items
5. Create sample orders
6. Create sample reviews

## Sample Data Created

### Users (5 total)

1. **Admin**
   - Email: `admin@hotel.com`
   - Password: `Password@123`
   - Role: Admin

2. **Hotel Owner 1**
   - Email: `john@hotelowner.com`
   - Password: `Password@123`
   - Role: Hotel Owner
   - Location: New York

3. **Hotel Owner 2**
   - Email: `sarah@hotelowner.com`
   - Password: `Password@123`
   - Role: Hotel Owner
   - Location: Los Angeles

4. **Customer 1**
   - Email: `alice@customer.com`
   - Password: `Password@123`
   - Role: Customer
   - Location: New York

5. **Customer 2**
   - Email: `bob@customer.com`
   - Password: `Password@123`
   - Role: Customer
   - Location: Los Angeles

### Hotels (3 total)

1. **The Grand Palace** (New York) - Owned by John Smith
2. **Coastal Breeze Restaurant** (New York) - Owned by John Smith
3. **Sunset Grill** (Los Angeles) - Owned by Sarah Johnson

### Menus (3 total)

Each hotel has a complete menu with:
- Multiple categories (Appetizers, Main Course, Desserts, Seafood, BBQ Specials)
- Multiple items per category with descriptions and prices
- Food type indicators (veg, non-veg, vegan)

### Orders (2 total)

- 1 delivered order for Alice at The Grand Palace
- 1 preparing order for Bob at Sunset Grill

### Reviews (2 total)

- 5-star review from Alice for The Grand Palace
- 4-star review from Bob for Sunset Grill

## Testing the Data

After seeding, you can:

1. **Test Authentication**
   ```bash
   POST /auth/signin
   {
     "email": "alice@customer.com",
     "password": "Password@123"
   }
   ```

2. **Browse Hotels**
   ```bash
   GET /hotel?city=New York
   ```

3. **View Menus**
   ```bash
   GET /menu/active/:hotelId
   ```

4. **Create Orders** (as customer)
   ```bash
   POST /order
   ```

5. **Manage Hotels** (as hotel owner)
   ```bash
   GET /hotel/mine
   ```

## Important Notes

⚠️ **WARNING**: Running this script will **delete all existing data** in the database. Only use this in development/testing environments.

## Code Formatting

To format the codebase consistently, run:

```bash
npm run format        # Auto-fix formatting issues
npm run format:check  # Check for formatting issues without fixing
```

## Linting

To lint the codebase, run:

```bash
npm run lint          # Auto-fix linting issues
npm run lint:check    # Check for linting issues without fixing
```
