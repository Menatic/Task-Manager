const { Sequelize } = require('sequelize');
const config = require('./config/config.json').development;

async function initializeDatabase() {
  // First test root connection without specifying database
  const rootConnection = new Sequelize({
    dialect: 'mysql',
    host: config.host,
    port: config.port,
    username: config.username,
    password: config.password,
    logging: false
  });

  try {
    // Create database if it doesn't exist
    await rootConnection.query(`CREATE DATABASE IF NOT EXISTS ${config.database};`);
    console.log(`Database ${config.database} verified/created`);
    
    // Test application connection
    const sequelize = new Sequelize(config.database, config.username, config.password, {
      host: config.host,
      port: config.port,
      dialect: config.dialect,
      logging: console.log
    });
    
    await sequelize.authenticate();
    console.log('Connection established successfully');
    
    return sequelize;
  } catch (error) {
    console.error('Database initialization failed:', error);
    process.exit(1);
  }
}

initializeDatabase();