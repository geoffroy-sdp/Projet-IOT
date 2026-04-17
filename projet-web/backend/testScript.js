require('dotenv').config();
const axios = require('axios');

const API_BASE_URL = process.env.API_URL || 'http://localhost:3000/api';

// Test user credentials
const TEST_USER = {
  email: 'jean.dupont@example.com',
  password: 'Password123!',
};

let userToken = null;
let userId = null;

const api = axios.create({
  baseURL: API_BASE_URL,
  validateStatus: () => true, // Don't throw on any status
});

const log = (title, data) => {
  console.log('\n' + '='.repeat(60));
  console.log(`📌 ${title}`);
  console.log('='.repeat(60));
  console.log(JSON.stringify(data, null, 2));
};

const testUserLogin = async () => {
  console.log('\n🔐 Testing User Login...');
  try {
    const response = await api.post('/users/login', {
      email: TEST_USER.email,
      password: TEST_USER.password,
    });

    if (response.status === 200 && response.data.success) {
      userToken = response.data.data.token;
      userId = response.data.data.userId;
      log('Login Successful', response.data);
      return true;
    } else {
      log('Login Failed', response.data);
      return false;
    }
  } catch (error) {
    log('Login Error', error.message);
    return false;
  }
};

const testGetUserProfile = async () => {
  console.log('\n👤 Testing Get User Profile...');
  try {
    const response = await api.get('/users/profile', {
      headers: { Authorization: `Bearer ${userToken}` },
    });

    if (response.status === 200) {
      log('User Profile Retrieved', response.data);
    } else {
      log('Failed to Get User Profile', response.data);
    }
  } catch (error) {
    log('Get User Profile Error', error.message);
  }
};

const testGetUserGpsData = async () => {
  console.log('\n📍 Testing Get User GPS Data...');
  try {
    const response = await api.get('/users/gps?page=1&limit=50', {
      headers: { Authorization: `Bearer ${userToken}` },
    });

    if (response.status === 200) {
      log('GPS Data Retrieved', {
        totalPoints: response.data.pagination.total,
        currentPage: response.data.data.length,
        data: response.data.data.slice(0, 2), // Show first 2
        pagination: response.data.pagination,
      });
    } else {
      log('Failed to Get GPS Data', response.data);
    }
  } catch (error) {
    log('Get GPS Data Error', error.message);
  }
};

const testGetUserSessions = async () => {
  console.log('\n🚗 Testing Get User Sessions...');
  try {
    const response = await api.get('/users/sessions?page=1&limit=20', {
      headers: { Authorization: `Bearer ${userToken}` },
    });

    if (response.status === 200) {
      log('Sessions Retrieved', {
        totalSessions: response.data.pagination.total,
        currentPage: response.data.data.length,
        sessions: response.data.data.map(s => ({
          id: s._id,
          startTime: s.startTime,
          endTime: s.endTime,
          duration: s.duration,
          status: s.status,
        })),
        pagination: response.data.pagination,
      });
    } else {
      log('Failed to Get Sessions', response.data);
    }
  } catch (error) {
    log('Get Sessions Error', error.message);
  }
};

const testGetUserMetadata = async () => {
  console.log('\n📊 Testing Get User Metadata...');
  try {
    const response = await api.get('/users/metadata', {
      headers: { Authorization: `Bearer ${userToken}` },
    });

    if (response.status === 200) {
      log('Metadata Retrieved', response.data.data);
    } else {
      log('Failed to Get Metadata', response.data);
    }
  } catch (error) {
    log('Get Metadata Error', error.message);
  }
};

const testExportAllUserData = async () => {
  console.log('\n💾 Testing Export All User Data...');
  try {
    const response = await api.get('/users/data/export', {
      headers: { Authorization: `Bearer ${userToken}` },
    });

    if (response.status === 200) {
      const exportData = response.data.data;
      log('Complete User Data Export', {
        user: exportData.user,
        gpsPointsCount: exportData.gps.length,
        sessionsCount: exportData.sessions.length,
        metadata: exportData.metadata ? 'Available' : 'Not Available',
        summary: exportData.summary,
        firstGpsPoint: exportData.gps[0],
        firstSession: exportData.sessions[0],
      });
    } else {
      log('Failed to Export Data', response.data);
    }
  } catch (error) {
    log('Export Data Error', error.message);
  }
};

const testAddGpsData = async () => {
  console.log('\n➕ Testing Add GPS Data...');
  try {
    const newGpsData = {
      latitude: 50.8503,
      longitude: 4.3517,
      altitude: 150,
      accuracy: 8.5,
      speed: 85.3,
      heading: 270,
      rawData: JSON.stringify({
        satellites: 12,
        pdop: 2.1,
        hdop: 1.3,
        vdop: 1.9,
      }),
      address: {
        street: 'Brussels City Center',
        city: 'Brussels',
        zipCode: '1000',
        country: 'Belgium',
        fullAddress: 'Brussels City Center, Belgium',
      },
      source: 'gps',
      provider: 'GPS',
      signalQuality: 'excellent',
      satelliteCount: 12,
    };

    const response = await api.post('/users/gps', newGpsData, {
      headers: { Authorization: `Bearer ${userToken}` },
    });

    if (response.status === 201) {
      log('GPS Data Added Successfully', response.data.data);
    } else {
      log('Failed to Add GPS Data', response.data);
    }
  } catch (error) {
    log('Add GPS Data Error', error.message);
  }
};

const testAdminEndpoints = async () => {
  console.log('\n🔑 Testing Admin Endpoints (with Admin Key)...');

  const adminKey = process.env.ADMIN_KEY || 'admin-secret-key';

  try {
    const response = await api.get('/admin/stats', {
      headers: { 'x-admin-key': adminKey },
    });

    if (response.status === 200) {
      log('Admin Stats Retrieved', response.data.data);
    } else {
      log('Failed to Get Admin Stats', response.data);
    }
  } catch (error) {
    log('Admin Stats Error', error.message);
  }
};

const runAllTests = async () => {
  console.log('\n' + '🧪 '.repeat(30));
  console.log('STARTING COMPLETE USER DATA RETRIEVAL TEST');
  console.log('🧪 '.repeat(30));

  // Step 1: Login
  const loggedIn = await testUserLogin();
  if (!loggedIn) {
    console.log('\n❌ Failed to login. Stopping tests.');
    return;
  }

  // Step 2: Get profile
  await testGetUserProfile();

  // Step 3: Get GPS data
  await testGetUserGpsData();

  // Step 4: Get sessions
  await testGetUserSessions();

  // Step 5: Get metadata
  await testGetUserMetadata();

  // Step 6: Add new GPS data
  await testAddGpsData();

  // Step 7: Export all data
  await testExportAllUserData();

  // Step 8: Test admin endpoints
  await testAdminEndpoints();

  console.log('\n' + '✅ '.repeat(30));
  console.log('TEST SUITE COMPLETED');
  console.log('✅ '.repeat(30) + '\n');
};

// Run tests
runAllTests().catch(error => {
  console.error('Test suite error:', error);
  process.exit(1);
});
