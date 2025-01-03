require("dotenv").config();

const mysql = require('mysql2/promise');

const config = {
  db: {
    host:  'db', // Default to 'db' if MYSQL_HOST isn't set
    port: process.env.DB_PORT || 3306,    // Use DB_PORT from .env
    user: process.env.MYSQL_USER || 'root',  // Default to 'root' if MYSQL_USER isn't set
    password: process.env.MYSQL_PASS || '',  // Default to empty if MYSQL_PASS isn't set
    database: process.env.MYSQL_DATABASE || '', // Default to empty if MYSQL_DATABASE isn't set
    waitForConnections: true,
    connectionLimit: 2,
    queueLimit: 0,
  },
};

const pool = mysql.createPool(config.db);

// Utility function to query the database
async function query(sql, params) {
  const [rows, fields] = await pool.execute(sql, params);
  return rows;
}

module.exports = {
  query,
};
