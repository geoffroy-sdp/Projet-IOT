const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Gps = require('../models/Gps');
const Session = require('../models/Session');
const Metadata = require('../models/Metadatas');
const { generateToken, generateRefreshToken } = require('../middleware/auth');
const { logger } = require('../models/Logger');
const { logAuthSuccess, logLogout, logPasswordChange } = require('../middleware/security');

exports.registerUser = async (req, res) => {
  try {
    const { email, username, password, firstName, lastName } = req.body;

    if (!email || !username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email, username, and password are required',
      });
    }

    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'Email or username already exists',
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      userId: username.toLowerCase(),
      email,
      username,
      password: hashedPassword,
      firstName: firstName || '',
      lastName: lastName || '',
      isActive: true,
    });

    await user.save();

    const token = generateToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    user.refreshToken = refreshToken;
    await user.save();

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        userId: user._id,
        email: user.email,
        username: user.username,
        token,
        refreshToken,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Registration failed',
      error: error.message,
    });
  }
};

exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required',
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    user.lastLogin = new Date();
    user.lastConnectionTime = new Date();
    await user.save();

    const token = generateToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    user.refreshToken = refreshToken;
    await user.save();

    // Logger la connexion réussie
    logAuthSuccess(req, user);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        userId: user._id,
        email: user.email,
        username: user.username,
        token,
        refreshToken,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Login failed',
      error: error.message,
    });
  }
};

exports.getUserProfile = async (req, res) => {
  try {
    const userId = req.user.userId;

    const user = await User.findById(userId).select('-password -refreshToken');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user profile',
      error: error.message,
    });
  }
};

exports.updateUserProfile = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { firstName, lastName, profilePicture, preferences } = req.body;

    const user = await User.findByIdAndUpdate(
      userId,
      {
        firstName,
        lastName,
        profilePicture,
        preferences,
      },
      { new: true, runValidators: true }
    ).select('-password -refreshToken');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update profile',
      error: error.message,
    });
  }
};

exports.updateUserLocation = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { latitude, longitude } = req.body;

    if (latitude === undefined || longitude === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Latitude and longitude are required',
      });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      {
        lastLocation: {
          latitude,
          longitude,
          timestamp: new Date(),
        },
      },
      { new: true }
    ).select('-password -refreshToken');

    res.status(200).json({
      success: true,
      message: 'Location updated successfully',
      data: user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update location',
      error: error.message,
    });
  }
};

exports.updateCarPlayInfo = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { carPlayDeviceId, carModel, carBrand } = req.body;

    const user = await User.findByIdAndUpdate(
      userId,
      {
        carPlayDeviceId,
        carModel,
        carBrand,
      },
      { new: true }
    ).select('-password -refreshToken');

    res.status(200).json({
      success: true,
      message: 'CarPlay info updated successfully',
      data: user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update CarPlay info',
      error: error.message,
    });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required',
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect',
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    // Logger le changement de mot de passe
    logPasswordChange(req, userId);

    res.status(200).json({
      success: true,
      message: 'Password changed successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to change password',
      error: error.message,
    });
  }
};

exports.deleteUserAccount = async (req, res) => {
  try {
    const userId = req.user.userId;

    const user = await User.findByIdAndDelete(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Account deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete account',
      error: error.message,
    });
  }
};

// GPS ENDPOINTS
exports.addGpsData = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { latitude, longitude, altitude, accuracy, speed, heading, rawData, address, source, provider, signalQuality, satelliteCount } = req.body;

    if (latitude === undefined || longitude === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Latitude and longitude are required',
      });
    }

    const gpsData = new Gps({
      userId,
      latitude,
      longitude,
      altitude: altitude || null,
      accuracy: accuracy || null,
      speed: speed || null,
      heading: heading || null,
      rawData: rawData || null,
      address: address || {},
      source: source || 'gps',
      provider: provider || 'GPS',
      signalQuality: signalQuality || 'good',
      satelliteCount: satelliteCount || null,
    });

    await gpsData.save();

    res.status(201).json({
      success: true,
      message: 'GPS data added successfully',
      data: gpsData,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to add GPS data',
      error: error.message,
    });
  }
};

exports.getUserGpsData = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { page = 1, limit = 50, sortBy = '-timestamp' } = req.query;
    const skip = (page - 1) * limit;

    const totalGpsPoints = await Gps.countDocuments({ userId });
    const gpsData = await Gps.find({ userId })
      .skip(skip)
      .limit(parseInt(limit))
      .sort(sortBy)
      .select('-rawData'); // Exclude raw data for list view

    res.status(200).json({
      success: true,
      data: gpsData,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalGpsPoints,
        pages: Math.ceil(totalGpsPoints / limit),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch GPS data',
      error: error.message,
    });
  }
};

exports.getGpsById = async (req, res) => {
  try {
    const { gpsId } = req.params;
    const userId = req.user.userId;

    const gpsData = await Gps.findOne({ _id: gpsId, userId });
    if (!gpsData) {
      return res.status(404).json({
        success: false,
        message: 'GPS data not found',
      });
    }

    res.status(200).json({
      success: true,
      data: gpsData,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch GPS data',
      error: error.message,
    });
  }
};

exports.updateGpsData = async (req, res) => {
  try {
    const { gpsId } = req.params;
    const userId = req.user.userId;
    const updateData = req.body;

    const gpsData = await Gps.findOneAndUpdate(
      { _id: gpsId, userId },
      updateData,
      { new: true, runValidators: true }
    );

    if (!gpsData) {
      return res.status(404).json({
        success: false,
        message: 'GPS data not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'GPS data updated successfully',
      data: gpsData,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update GPS data',
      error: error.message,
    });
  }
};

exports.deleteGpsData = async (req, res) => {
  try {
    const { gpsId } = req.params;
    const userId = req.user.userId;

    const gpsData = await Gps.findOneAndDelete({ _id: gpsId, userId });
    if (!gpsData) {
      return res.status(404).json({
        success: false,
        message: 'GPS data not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'GPS data deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete GPS data',
      error: error.message,
    });
  }
};

// SESSION ENDPOINTS
exports.createSession = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { sessionId, carPlaySessionId, startTime, startLocation } = req.body;

    if (!sessionId) {
      return res.status(400).json({
        success: false,
        message: 'Session ID is required',
      });
    }

    const session = new Session({
      userId,
      sessionId,
      carPlaySessionId: carPlaySessionId || null,
      startTime: startTime || new Date(),
      startLocation: startLocation || {},
    });

    await session.save();

    res.status(201).json({
      success: true,
      message: 'Session created successfully',
      data: session,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create session',
      error: error.message,
    });
  }
};

exports.getUserSessions = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { page = 1, limit = 20, status } = req.query;
    const skip = (page - 1) * limit;

    let query = { userId };
    if (status) {
      query.status = status;
    }

    const totalSessions = await Session.countDocuments(query);
    const sessions = await Session.find(query)
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ startTime: -1 });

    res.status(200).json({
      success: true,
      data: sessions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalSessions,
        pages: Math.ceil(totalSessions / limit),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch sessions',
      error: error.message,
    });
  }
};

exports.getSessionById = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user.userId;

    const session = await Session.findOne({ _id: sessionId, userId })
      .populate({
        path: 'userId',
        select: 'username email',
      });

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found',
      });
    }

    res.status(200).json({
      success: true,
      data: session,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch session',
      error: error.message,
    });
  }
};

exports.updateSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user.userId;
    const updateData = req.body;

    const session = await Session.findOneAndUpdate(
      { _id: sessionId, userId },
      updateData,
      { new: true, runValidators: true }
    );

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Session updated successfully',
      data: session,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update session',
      error: error.message,
    });
  }
};

exports.deleteSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user.userId;

    const session = await Session.findOneAndDelete({ _id: sessionId, userId });
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Session deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete session',
      error: error.message,
    });
  }
};

// METADATA ENDPOINTS
exports.getUserMetadata = async (req, res) => {
  try {
    const userId = req.user.userId;

    const metadata = await Metadata.findOne({ userId })
      .populate({
        path: 'userId',
        select: 'username email firstName lastName',
      });

    if (!metadata) {
      return res.status(404).json({
        success: false,
        message: 'Metadata not found',
      });
    }

    res.status(200).json({
      success: true,
      data: metadata,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch metadata',
      error: error.message,
    });
  }
};

exports.updateMetadata = async (req, res) => {
  try {
    const userId = req.user.userId;
    const updateData = req.body;

    let metadata = await Metadata.findOne({ userId });

    if (!metadata) {
      metadata = new Metadata({ userId, ...updateData });
    } else {
      Object.assign(metadata, updateData);
    }

    await metadata.save();

    res.status(200).json({
      success: true,
      message: 'Metadata updated successfully',
      data: metadata,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update metadata',
      error: error.message,
    });
  }
};

// EXPORT ALL USER DATA
exports.exportAllUserData = async (req, res) => {
  try {
    const userId = req.user.userId;

    // Fetch all user data
    const user = await User.findById(userId).select('-password -refreshToken');
    const gpsData = await Gps.find({ userId });
    const sessions = await Session.find({ userId });
    const metadata = await Metadata.findOne({ userId });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const exportData = {
      user: {
        id: user._id,
        email: user.email,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        isActive: user.isActive,
        carPlayDeviceId: user.carPlayDeviceId,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      gps: gpsData,
      sessions: sessions,
      metadata: metadata || null,
      summary: {
        totalGpsPoints: gpsData.length,
        totalSessions: sessions.length,
        exportDate: new Date(),
      },
    };

    res.status(200).json({
      success: true,
      message: 'User data exported successfully',
      data: exportData,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to export user data',
      error: error.message,
    });
  }
};
