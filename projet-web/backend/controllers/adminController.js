const User = require('../models/User');
const Session = require('../models/Session');
const Metadata = require('../models/Metadata');

exports.getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10, search } = req.query;
    const skip = (page - 1) * limit;

    let query = {};
    if (search) {
      query = {
        $or: [
          { email: { $regex: search, $options: 'i' } },
          { username: { $regex: search, $options: 'i' } },
          { firstName: { $regex: search, $options: 'i' } },
        ],
      };
    }

    const totalUsers = await User.countDocuments(query);
    const users = await User.find(query)
      .select('-password -refreshToken')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalUsers,
        pages: Math.ceil(totalUsers / limit),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users',
      error: error.message,
    });
  }
};

exports.getUserById = async (req, res) => {
  try {
    const { userId } = req.params;

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
      message: 'Failed to fetch user',
      error: error.message,
    });
  }
};

exports.deactivateUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findByIdAndUpdate(
      userId,
      { isActive: false },
      { new: true }
    ).select('-password -refreshToken');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'User deactivated successfully',
      data: user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to deactivate user',
      error: error.message,
    });
  }
};

exports.activateUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findByIdAndUpdate(
      userId,
      { isActive: true },
      { new: true }
    ).select('-password -refreshToken');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'User activated successfully',
      data: user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to activate user',
      error: error.message,
    });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;

    await User.findByIdAndDelete(userId);
    await Session.deleteMany({ userId });
    await Metadata.deleteMany({ userId });

    res.status(200).json({
      success: true,
      message: 'User and associated data deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete user',
      error: error.message,
    });
  }
};

exports.getSystemStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ isActive: true });
    const totalSessions = await Session.countDocuments();
    const totalMetadata = await Metadata.countDocuments();

    const recentUsers = await User.find()
      .select('-password -refreshToken')
      .sort({ createdAt: -1 })
      .limit(5);

    const sessionsToday = await Session.countDocuments({
      startTime: {
        $gte: new Date(new Date().setHours(0, 0, 0, 0)),
      },
    });

    res.status(200).json({
      success: true,
      data: {
        totalUsers,
        activeUsers,
        inactiveUsers: totalUsers - activeUsers,
        totalSessions,
        sessionsToday,
        totalMetadata,
        recentUsers,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch system stats',
      error: error.message,
    });
  }
};

exports.getUserActivity = async (req, res) => {
  try {
    const { userId } = req.params;
    const { days = 30 } = req.query;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const sessions = await Session.find({
      userId,
      startTime: { $gte: startDate },
    })
      .select('startTime endTime duration status musicData navigationData')
      .sort({ startTime: -1 });

    const stats = {
      totalSessions: sessions.length,
      totalDuration: sessions.reduce((acc, session) => acc + (session.duration || 0), 0),
      averageSessionDuration:
        sessions.length > 0
          ? Math.floor(sessions.reduce((acc, session) => acc + (session.duration || 0), 0) / sessions.length)
          : 0,
      sessions,
    };

    res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user activity',
      error: error.message,
    });
  }
};

exports.exportUserData = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId).select('-password');
    const sessions = await Session.find({ userId });
    const metadata = await Metadata.findOne({ userId });

    const exportData = {
      user,
      sessions,
      metadata,
      exportedAt: new Date(),
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
