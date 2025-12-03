import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { Model } from 'mongoose';
import { getModelToken } from '@nestjs/mongoose';
import { User, UserRole } from '../user/schema/user.schema';
import { Hotel } from '../hotel/schemas/hotel.schema';
import { Menu } from '../menu/schemas/menu.schema';
import { Order } from '../order/schemas/order.schema';
import { Review } from '../review/schemas/review.schema';
import * as bcrypt from 'bcryptjs';

async function seed() {
  console.log('🌱 Starting database seeding...\n');

  const app = await NestFactory.createApplicationContext(AppModule);

  try {
    // Get models
    const userModel = app.get<Model<User>>(getModelToken(User.name));
    const hotelModel = app.get<Model<Hotel>>(getModelToken(Hotel.name));
    const menuModel = app.get<Model<Menu>>(getModelToken(Menu.name));
    const orderModel = app.get<Model<Order>>(getModelToken(Order.name));
    const reviewModel = app.get<Model<Review>>(getModelToken(Review.name));

    // Clear existing data
    console.log('🗑️  Clearing existing data...');
    await Promise.all([
      userModel.deleteMany({}),
      hotelModel.deleteMany({}),
      menuModel.deleteMany({}),
      orderModel.deleteMany({}),
      reviewModel.deleteMany({}),
    ]);
    console.log('✅ Existing data cleared\n');

    // Create Users
    console.log('👥 Creating users...');
    const hashedPassword = await bcrypt.hash('Password@123', 10);

    const admin = await userModel.create({
      name: 'Admin User',
      email: 'admin@hotel.com',
      password: hashedPassword,
      phoneNo: '+1234567890',
      role: UserRole.ADMIN,
      isEmailVerified: true,
      address: [
        {
          location: {
            type: 'Point',
            coordinates: [-73.935242, 40.73061], // New York
          },
          street: '123 Admin Street',
          city: 'New York',
        },
      ],
    });

    const hotelOwner1 = await userModel.create({
      name: 'John Smith',
      email: 'john@hotelowner.com',
      password: hashedPassword,
      phoneNo: '+1234567891',
      role: UserRole.HOTEL_OWNER,
      isEmailVerified: true,
      address: [
        {
          location: {
            type: 'Point',
            coordinates: [-73.985428, 40.748817], // New York
          },
          street: '456 Owner Avenue',
          city: 'New York',
        },
      ],
    });

    const hotelOwner2 = await userModel.create({
      name: 'Sarah Johnson',
      email: 'sarah@hotelowner.com',
      password: hashedPassword,
      phoneNo: '+1234567892',
      role: UserRole.HOTEL_OWNER,
      isEmailVerified: true,
      address: [
        {
          location: {
            type: 'Point',
            coordinates: [-118.243683, 34.052235], // Los Angeles
          },
          street: '789 Business Blvd',
          city: 'Los Angeles',
        },
      ],
    });

    const customer1 = await userModel.create({
      name: 'Alice Williams',
      email: 'alice@customer.com',
      password: hashedPassword,
      phoneNo: '+1234567893',
      role: UserRole.CUSTOMER,
      isEmailVerified: true,
      address: [
        {
          location: {
            type: 'Point',
            coordinates: [-73.935242, 40.73061],
          },
          street: '321 Customer Lane',
          city: 'New York',
        },
      ],
    });

    const customer2 = await userModel.create({
      name: 'Bob Davis',
      email: 'bob@customer.com',
      password: hashedPassword,
      phoneNo: '+1234567894',
      role: UserRole.CUSTOMER,
      isEmailVerified: true,
      address: [
        {
          location: {
            type: 'Point',
            coordinates: [-118.243683, 34.052235],
          },
          street: '654 Foodie Street',
          city: 'Los Angeles',
        },
      ],
    });

    console.log('✅ Users created\n');

    // Create Hotels
    console.log('🏨 Creating hotels...');

    const hotel1 = await hotelModel.create({
      ownerId: hotelOwner1._id,
      hotelName: 'The Grand Palace',
      description: 'Luxurious dining experience with international cuisine',
      address: {
        street: '100 Fifth Avenue',
        city: 'New York',
        location: {
          type: 'Point',
          coordinates: [-73.985428, 40.748817],
        },
      },
      media: [
        {
          type: 'image',
          label: 'Restaurant Exterior',
          link: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4',
          publicId: 'sample_hotel_1',
        },
      ],
      rating: 4.5,
      totalReviews: 0,
      isActive: true,
      approval: {
        status: 'approved',
      },
    });

    const hotel2 = await hotelModel.create({
      ownerId: hotelOwner1._id,
      hotelName: 'Coastal Breeze Restaurant',
      description: 'Fresh seafood and coastal cuisine',
      address: {
        street: '200 Beach Road',
        city: 'New York',
        location: {
          type: 'Point',
          coordinates: [-73.975428, 40.758817],
        },
      },
      media: [
        {
          type: 'image',
          label: 'Dining Area',
          link: 'https://images.unsplash.com/photo-1552566626-52f8b828add9',
          publicId: 'sample_hotel_2',
        },
      ],
      rating: 4.2,
      totalReviews: 0,
      isActive: true,
      approval: {
        status: 'approved',
      },
    });

    const hotel3 = await hotelModel.create({
      ownerId: hotelOwner2._id,
      hotelName: 'Sunset Grill',
      description: 'California-style BBQ and grilled specialties',
      address: {
        street: '300 Sunset Boulevard',
        city: 'Los Angeles',
        location: {
          type: 'Point',
          coordinates: [-118.243683, 34.052235],
        },
      },
      media: [
        {
          type: 'image',
          label: 'Outdoor Seating',
          link: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0',
          publicId: 'sample_hotel_3',
        },
      ],
      rating: 4.7,
      totalReviews: 0,
      isActive: true,
      approval: {
        status: 'approved',
      },
    });

    console.log('✅ Hotels created\n');

    // Create Menus
    console.log('🍽️  Creating menus...');

    const menu1 = await menuModel.create({
      hotelId: hotel1._id,
      name: 'Grand Palace Main Menu',
      categories: [
        {
          name: 'Appetizers',
          items: [
            {
              name: 'Caesar Salad',
              description: 'Fresh romaine lettuce with parmesan and croutons',
              price: 12.99,
              type: 'veg',
              isAvailable: true,
            },
            {
              name: 'Bruschetta',
              description: 'Toasted bread with tomatoes, basil, and olive oil',
              price: 9.99,
              type: 'veg',
              isAvailable: true,
            },
          ],
        },
        {
          name: 'Main Course',
          items: [
            {
              name: 'Grilled Salmon',
              description: 'Atlantic salmon with seasonal vegetables',
              price: 28.99,
              type: 'non-veg',
              isAvailable: true,
            },
            {
              name: 'Ribeye Steak',
              description: 'Prime ribeye steak with mashed potatoes',
              price: 34.99,
              type: 'non-veg',
              isAvailable: true,
            },
          ],
        },
        {
          name: 'Desserts',
          items: [
            {
              name: 'Tiramisu',
              description: 'Classic Italian coffee-flavored dessert',
              price: 8.99,
              type: 'veg',
              isAvailable: true,
            },
          ],
        },
      ],
      isActive: true,
    });

    const menu2 = await menuModel.create({
      hotelId: hotel2._id,
      name: 'Coastal Breeze Seafood Menu',
      categories: [
        {
          name: 'Seafood',
          items: [
            {
              name: 'Lobster Roll',
              description: 'Fresh lobster with butter on a toasted bun',
              price: 24.99,
              type: 'non-veg',
              isAvailable: true,
            },
            {
              name: 'Fish & Chips',
              description: 'Beer-battered cod with crispy fries',
              price: 18.99,
              type: 'non-veg',
              isAvailable: true,
            },
          ],
        },
      ],
      isActive: true,
    });

    const menu3 = await menuModel.create({
      hotelId: hotel3._id,
      name: 'Sunset BBQ Menu',
      categories: [
        {
          name: 'BBQ Specials',
          items: [
            {
              name: 'BBQ Ribs',
              description: 'Slow-cooked pork ribs with house BBQ sauce',
              price: 26.99,
              type: 'non-veg',
              isAvailable: true,
            },
            {
              name: 'Pulled Pork Sandwich',
              description: 'Tender pulled pork with coleslaw',
              price: 14.99,
              type: 'non-veg',
              isAvailable: true,
            },
          ],
        },
      ],
      isActive: true,
    });

    // Update hotels with menuId
    await hotelModel.findByIdAndUpdate(hotel1._id, { menuId: menu1._id });
    await hotelModel.findByIdAndUpdate(hotel2._id, { menuId: menu2._id });
    await hotelModel.findByIdAndUpdate(hotel3._id, { menuId: menu3._id });

    console.log('✅ Menus created\n');

    // Create Orders
    console.log('📦 Creating orders...');

    const order1 = await orderModel.create({
      customerId: customer1._id,
      hotelId: hotel1._id,
      orderNumber: `ORD-${Date.now()}-1`,
      items: [
        {
          menuItemId: (menu1.categories[1].items[0] as any)._id, // Grilled Salmon
          itemName: 'Grilled Salmon',
          quantity: 1,
          price: 28.99,
        },
        {
          menuItemId: (menu1.categories[2].items[0] as any)._id, // Tiramisu
          itemName: 'Tiramisu',
          quantity: 1,
          price: 8.99,
        },
      ],
      totalAmount: 37.98,
      status: 'delivered',
      deliveryAddress: {
        street: '321 Customer Lane',
        city: 'New York',
        location: {
          type: 'Point',
          coordinates: [-73.935242, 40.73061],
        },
      },
    });

    const order2 = await orderModel.create({
      customerId: customer2._id,
      hotelId: hotel3._id,
      orderNumber: `ORD-${Date.now()}-2`,
      items: [
        {
          menuItemId: (menu3.categories[0].items[0] as any)._id, // BBQ Ribs
          itemName: 'BBQ Ribs',
          quantity: 2,
          price: 26.99,
        },
      ],
      totalAmount: 53.98,
      status: 'preparing',
      deliveryAddress: {
        street: '654 Foodie Street',
        city: 'Los Angeles',
        location: {
          type: 'Point',
          coordinates: [-118.243683, 34.052235],
        },
      },
    });

    console.log('✅ Orders created\n');

    // Create Reviews
    console.log('⭐ Creating reviews...');

    await reviewModel.create({
      customerId: customer1._id,
      hotelId: hotel1._id,
      orderId: order1._id,
      ratingScore: 5,
      reviewMessage: 'Excellent food and service! The grilled salmon was perfect.',
    });

    await reviewModel.create({
      customerId: customer2._id,
      hotelId: hotel3._id,
      ratingScore: 4,
      reviewMessage: 'Great BBQ, would definitely recommend!',
    });

    console.log('✅ Reviews created\n');

    console.log('🎉 Database seeding completed successfully!\n');
    console.log('📝 Summary:');
    console.log(`   - 5 users created (1 admin, 2 hotel owners, 2 customers)`);
    console.log(`   - 3 hotels created`);
    console.log(`   - 3 menus created with multiple items`);
    console.log(`   - 2 orders created`);
    console.log(`   - 2 reviews created`);
    console.log('\n🔑 Login credentials for all users:');
    console.log('   Email: admin@hotel.com, john@hotelowner.com, sarah@hotelowner.com,');
    console.log('          alice@customer.com, bob@customer.com');
    console.log('   Password: Password@123\n');
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  } finally {
    await app.close();
  }
}

seed()
  .then(() => {
    console.log('✅ Seeding process finished');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Seeding process failed:', error);
    process.exit(1);
  });
