require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

const User = require('./models/User');
const Gps = require('./models/Gps');
const Session = require('./models/Session');
const Metadata = require('./models/Metadata');
const Bluetooth = require('./models/Bluetooth');
const { connectDatabase, disconnectDatabase } = require('./config/database');

const seedDatabase = async () => {
  try {
    await connectDatabase();
    console.log('Connected to MongoDB');

    // Clear existing data
    await User.deleteMany();
    await Gps.deleteMany();
    await Session.deleteMany();
    await Metadata.deleteMany();
    await Bluetooth.deleteMany();
    console.log('Cleared existing data');

    // Create fake users
    const usersData = [
      {
        userId: 'jean_dupont',
        email: 'jean.dupont@example.com',
        username: 'jean_dupont',
        firstName: 'Jean',
        lastName: 'Dupont',
        password: 'Password123!',
        carPlayDeviceId: 'DEVICE_001',
        isAdmin: false,
      },
      {
        userId: 'marie_martin',
        email: 'marie.martin@example.com',
        username: 'marie_martin',
        firstName: 'Marie',
        lastName: 'Martin',
        password: 'Password123!',
        carPlayDeviceId: 'DEVICE_002',
        isAdmin: false,
      },
      {
        userId: 'pierre_bernard',
        email: 'pierre.bernard@example.com',
        username: 'pierre_bernard',
        firstName: 'Pierre',
        lastName: 'Bernard',
        password: 'Password123!',
        carPlayDeviceId: 'DEVICE_003',
        isAdmin: false,
      },
      {
        userId: 'admin_user',
        email: 'admin@example.com',
        username: 'admin_user',
        firstName: 'Admin',
        lastName: 'User',
        password: 'AdminPassword123!',
        carPlayDeviceId: null,
        isAdmin: true,
      },
    ];

    // Hash passwords and create users
    const users = [];
    for (const userData of usersData) {
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      const user = new User({
        ...userData,
        password: hashedPassword,
        isActive: true,
        lastLogin: new Date(),
        lastConnectionTime: new Date(),
      });
      await user.save();
      users.push(user);
      console.log(`User created: ${user.username}`);
    }

    // données Bluetooth par utilisateur
    const bluetoothDevices = [
      [
        { deviceName: 'iPhone 15 Pro', macAddress: 'A1:B2:C3:D4:E5:F6', deviceType: 'phone' },
        { deviceName: 'AirPods Pro',   macAddress: 'B2:C3:D4:E5:F6:A1', deviceType: 'headset' },
      ],
      [
        { deviceName: 'Samsung Galaxy S24', macAddress: 'C3:D4:E5:F6:A1:B2', deviceType: 'phone' },
        { deviceName: 'Galaxy Buds',        macAddress: 'D4:E5:F6:A1:B2:C3', deviceType: 'headset' },
      ],
      [
        { deviceName: 'iPhone 14',    macAddress: 'E5:F6:A1:B2:C3:D4', deviceType: 'phone' },
        { deviceName: 'Beats Studio', macAddress: 'F6:A1:B2:C3:D4:E5', deviceType: 'headset' },
      ],
    ];

    for (let userIndex = 0; userIndex < users.length - 1; userIndex++) {
      const user = users[userIndex];
      const devices = bluetoothDevices[userIndex];

      for (let i = 0; i < devices.length; i++) {
        const device = new Bluetooth({
          userId: user._id,
          deviceName: devices[i].deviceName,
          macAddress: devices[i].macAddress,
          deviceType: devices[i].deviceType,
          connectedAt: new Date(Date.now() - i * 86400000), // décalé d'1 jour par appareil
        });
        await device.save();
        console.log(`Bluetooth device created for ${user.username}: ${devices[i].deviceName}`);
      }
    }

    // GPS coordinates for different locations
    const gpsLocations = [
      { latitude: 48.8566, longitude: 2.3522, city: 'Paris', address: 'Eiffel Tower, Paris' },
      { latitude: 48.8603, longitude: 2.2945, city: 'Paris', address: 'Louvre Museum, Paris' },
      { latitude: 48.8404, longitude: 2.5244, city: 'Marne-la-Vallée', address: 'Disneyland Paris' },
      { latitude: 45.5017, longitude: -73.5673, city: 'Montreal', address: 'Downtown Montreal' },
      { latitude: 40.7128, longitude: -74.006, city: 'New York', address: 'Times Square, NYC' },
      { latitude: 51.5074, longitude: -0.1278, city: 'London', address: 'Big Ben, London' },
      { latitude: 52.5200, longitude: 13.4050, city: 'Berlin', address: 'Brandenburg Gate, Berlin' },
      { latitude: 41.9028, longitude: 12.4964, city: 'Rome', address: 'Colosseum, Rome' },
      { latitude: 43.7102, longitude: 7.2620, city: 'Nice', address: 'Promenade des Anglais, Nice' },
      { latitude: 48.2082, longitude: 16.3738, city: 'Vienna', address: 'St. Stephen\'s Cathedral, Vienna' },
    ];

    // Create GPS data for each user
    for (let userIndex = 0; userIndex < users.length - 1; userIndex++) {
      const user = users[userIndex];
      for (let i = 0; i < 3; i++) {
        const locationIndex = (userIndex * 3 + i) % gpsLocations.length;
        const location = gpsLocations[locationIndex];
        const gpsData = new Gps({
          userId: user._id,
          latitude: location.latitude,
          longitude: location.longitude,
          altitude: 100 + Math.random() * 50,
          accuracy: 5 + Math.random() * 10,
          speed: Math.random() * 100,
          heading: Math.random() * 360,
          rawData: JSON.stringify({
            satellites: 10 + Math.floor(Math.random() * 8),
            pdop: 1.5 + Math.random() * 2,
            hdop: 1.0 + Math.random() * 1.5,
            vdop: 1.5 + Math.random() * 2,
          }),
          address: {
            street: location.address,
            city: location.city,
            country: 'France',
            fullAddress: location.address,
          },
          timestamp: new Date(Date.now() - (i + 1) * 86400000),
          source: 'gps',
          provider: 'GPS',
          signalQuality: ['excellent', 'good', 'fair'][Math.floor(Math.random() * 3)],
          satelliteCount: 10 + Math.floor(Math.random() * 8),
        });
        await gpsData.save();
        console.log(`GPS data created for ${user.username}: ${location.address}`);
      }
    }

    // Create sessions for each user
    for (let userIndex = 0; userIndex < users.length - 1; userIndex++) {
      const user = users[userIndex];
      for (let i = 0; i < 2; i++) {
        const startTime = new Date(Date.now() - (i + 1) * 86400000);
        const endTime = new Date(startTime.getTime() + 3600000);
        const session = new Session({
          userId: user._id,
          sessionId: uuidv4(),
          carPlaySessionId: `CARPLAY_${uuidv4().substring(0, 8)}`,
          startTime,
          endTime,
          startLocation: {
            latitude: 48.8566 + Math.random() * 0.5,
            longitude: 2.3522 + Math.random() * 0.5,
            address: 'Paris Region',
          },
          endLocation: {
            latitude: 48.8566 + Math.random() * 0.5,
            longitude: 2.3522 + Math.random() * 0.5,
            address: 'Paris Region',
          },
          carPlayData: { isConnected: true },
          musicData: {
            tracks: [{
              trackName: 'Song ' + (i + 1),
              artistName: 'Artist Name',
              albumName: 'Album Name',
              duration: 180,
              playedAt: startTime,
              playedDuration: 180,
            }],
            totalTracksPlayed: 1,
          },
          navigationData: {
            destination: 'Destination ' + (i + 1),
            distance: 25 + Math.random() * 50,
            estimatedTime: 30 + Math.random() * 40,
            routeType: 'highway',
            waypointsCount: 0,
          },
          status: 'ended',
          notes: 'Session note ' + (i + 1),
        });
        await session.save();
        console.log(`Session created for ${user.username}: Session ${i + 1}`);
      }
    }

    // Create metadata for each user
    for (let userIndex = 0; userIndex < users.length - 1; userIndex++) {
      const user = users[userIndex];
      const metadata = new Metadata({
        userId: user._id,
        lastMusic: {
          trackName: 'Last Track',
          artistName: 'Last Artist',
          albumName: 'Last Album',
          playedAt: new Date(),
          duration: 240,
        },
        musicHistory: [
          { trackName: 'Track 1', artistName: 'Artist 1', albumName: 'Album 1', playedAt: new Date(Date.now() - 86400000), duration: 240 },
          { trackName: 'Track 2', artistName: 'Artist 2', albumName: 'Album 2', playedAt: new Date(Date.now() - 172800000), duration: 220 },
        ],
        lastLocation: { latitude: 48.8566, longitude: 2.3522, timestamp: new Date() },
        lastConnectionTime: new Date(),
        lastSessionDuration: 3600,
        stats: {
          totalSessionsCount: 2,
          totalDrivingTime: 7200,
          totalTracksListened: 5,
          averageSessionDuration: 3600,
        },
        carPlayInfo: {
          connectedDevices: [{
            deviceName: 'iPhone 13',
            deviceType: 'iPhone',
            lastConnectedAt: new Date(),
          }],
        },
        lastActivityType: 'music',
        lastActivityTime: new Date(),
        lastSyncTime: new Date(),
        syncStatus: 'synced',
      });
      await metadata.save();
      console.log(`Metadata created for ${user.username}`);
    }

    console.log('\n✅ Database seeded successfully!');
    console.log('\nSeed Summary:');
    console.log(`- Users created: ${users.length}`);
    console.log(`- GPS points: ${(users.length - 1) * 3}`);
    console.log(`- Sessions: ${(users.length - 1) * 2}`);
    console.log(`- Metadata records: ${users.length - 1}`);
    console.log(`- Bluetooth devices: ${(users.length - 1) * 2}`);
    console.log('\nTest Credentials:');
    console.log('User 1: jean.dupont@example.com / Password123!');
    console.log('User 2: marie.martin@example.com / Password123!');
    console.log('User 3: pierre.bernard@example.com / Password123!');
    console.log('Admin: admin@example.com / AdminPassword123!');
    console.log('\nAdmin Key: x-admin-key = ' + (process.env.ADMIN_KEY || 'admin-secret-key'));

    await disconnectDatabase();
  } catch (error) {
    console.error('❌ Error seeding database:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
};

if (require.main === module) {
  seedDatabase();
}