const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { connectDatabase } = require('./config/database');
const userRoutes = require('./routes/users');
const adminRoutes = require('./routes/admin');

const PORT = process.env.PORT || 3000;
const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ success: true, message: 'Server is running' });
});

connectDatabase().then(() => {
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}).catch(error => {
  console.error('Failed to connect database:', error);
  process.exit(1);
});