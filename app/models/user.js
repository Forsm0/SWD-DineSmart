// Get the functions in the db.js file to use
const { match } = require("assert");
const db = require("../services/db");

const bcrypt = require("bcryptjs");

class User {
  // Id of the user
  id;

  // Email of the user
  email;

  constructor(email) {
    this.email = email;
  }

  // Get an existing user id from an email address, or return false if not found
  async getIdFromEmail() {
    var sql = "SELECT id FROM Users WHERE Users.email = ?";
    const result = await db.query(sql, [this.email]);
    // TODO LOTS OF ERROR CHECKS HERE..
    if (JSON.stringify(result) != "[]") {
      this.id = result[0].id;
      return this.id;
    } else {
      return false;
    }
  }

  // Add a password to an existing user
  async setUserPassword(password) {
    const pw = await bcrypt.hash(password, 10);
    var sql = "UPDATE Users SET password = ? WHERE Users.id = ?";
    const result = await db.query(sql, [pw, this.id]);
    return true;
  }

  // Add a new record to the users table
  async addUser(name, email, password, phone) {
    const pw = await bcrypt.hash(password, 10);
    var sql =
      "INSERT INTO Users (name, email, password, MoblieNumber) VALUES (? , ? , ? , ?)";
    const result = await db.query(sql, [name, email, password, phone]);
    console.log(result.insertId);
    this.id = result.insertId;
    return true;
  }

  // Test a submitted password against a stored password
  async authenticate(password, uId) {
    // Get the stored, hashed password for the user
    var sql = "SELECT password FROM Users WHERE id = ?";
    const result = await db.query(sql, [uId]);
    let passmatch = false;

    // const match = await bcrypt.compare(password, result[0].password);
    if (password === result[0].password) {
      passmatch = true;
    } else {
      passmatch = false;
    }

    if (passmatch == true) {
      return true;
    } else {
      return false;
    }
  }
}

module.exports = {
  User,
};

