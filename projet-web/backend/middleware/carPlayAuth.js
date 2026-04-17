const carPlayAuthMiddleware = (req, res, next) => {
  try {
    const carPlayToken = req.headers['x-carplay-token'];
    const deviceId = req.headers['x-device-id'];

    if (!carPlayToken || !deviceId) {
      return res.status(401).json({
        success: false,
        message: 'CarPlay authentication required',
      });
    }

    if (!isValidDeviceId(deviceId)) {
      return res.status(401).json({
        success: false,
        message: 'Invalid device ID',
      });
    }

    req.carPlayDevice = {
      token: carPlayToken,
      deviceId,
      authenticatedAt: Date.now(),
    };

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'CarPlay authentication failed',
      error: error.message,
    });
  }
};

const isValidDeviceId = (deviceId) => {
  return deviceId && deviceId.match(/^[a-zA-Z0-9-_]{10,}$/);
};

const validateCarPlayData = (req, res, next) => {
  const { sessionId, data } = req.body;

  if (!sessionId || !data) {
    return res.status(400).json({
      success: false,
      message: 'sessionId and data are required',
    });
  }

  next();
};

module.exports = {
  carPlayAuthMiddleware,
  validateCarPlayData,
  isValidDeviceId,
};
