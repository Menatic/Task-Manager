require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('./models');
const authRoutes = require('./routes/auth');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use('/api/auth', authRoutes);  // This mounts auth routes at /api/auth

// Test route
app.get('/', (req, res) => {
  res.json({
    status: 'API running',
    database: db.sequelize.config.database,
    dbStatus: db.sequelize.authenticated ? 'connected' : 'disconnected'
  });
});

// Import routes
app.use('/api/tasks', require('./routes/tasks'));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error' });
});

const PORT = process.env.APP_PORT || 5000;

app.use(cors({
  origin: 'http://localhost:3000', // Your frontend URL
  credentials: true
}));

async function startServer() {
  try {
    // Test connection first
    await db.sequelize.authenticate();
    console.log('Database connection established');
    
    // Then sync models with alter option
    await db.sequelize.sync({ alter: true });
    console.log('Database models synchronized');
    
    // Start server
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Connected to database: ${db.sequelize.config.database}`);
    });
  } catch (error) {
    console.error('Failed to initialize:', error);
    process.exit(1);
  }
}

startServer();