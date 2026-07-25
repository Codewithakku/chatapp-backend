const { json } = require('express');
const db = require('../config/db');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt')

// 🔐 JWT Secret and Expiry
const JWT_SECRET = 'mySuperSecretKey123'; // Strong secret for signing
const JWT_EXPIRES_IN = '1d'; // Token valid for 1 day


exports.registerUser = async (req, res) => {
  const { username, mobile, email } = req.body;
  const profile_url = req.file ? `/uploads/${req.file.filename}` : null; // Handle profile image upload

  const password = await bcrypt.hash(req.body.password, 10); //direct access for password

  // Check for missing fields
  if (!username || !mobile || !email || !password || !profile_url) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  // Insert user into the database
  const sql = 'INSERT INTO users (username, mobile, email, password, profile_url) VALUES (?, ?, ?, ?, ?)';
  db.query(sql, [username, mobile, email, password, profile_url], (err, result) => {
    if (err) {
      if (err.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({ error: 'Email already exists' });
      }
      return res.status(500).json({ error: 'Database error' });
    }

    // Fetch the newly registered user
    db.query('SELECT id, username, email, profile_url FROM users WHERE id = ?', [result.insertId], (err2, results) => {
      if (err2 || results.length === 0) {
        return res.status(500).json({ error: 'Failed to fetch newly registered user' });
      }

      res.status(201).json({
        message: '✅ Registration successful',
        user: results[0],
      });
    });
  });
};

// ===================== LOGIN =====================
exports.loginUser = (req, res) => {
  const { email, password } = req.body;

  // 1) Validate input
  if (!email || !password) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  // 2) Check user existence
  const query = 'SELECT * FROM users WHERE email = ? LIMIT 1';
  db.query(query, [email], async (err, results) => {
    if (err) {
      console.error('DB error:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }

    if (results.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = results[0];

    // 3) Compare plain password
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // 4) Generate JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email, },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    // 5) Success response with token
    return res.status(200).json({
      message: 'Login successful',
       // Send token to client
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        profile_url:user.profile_url,
        token,
      },
    });
  });
};

// ===================== LOGOUT USER =====================
exports.LogoutUser = (req, res) => {
  // In stateless JWT, logout is handled on client-side by removing the token
  return res.status(200).json({
    message: 'Logout successful'
  });
};


// ===================== GET ALL USERS =====================
exports.getAllUsers = (req, res) => {
  const sql = 'SELECT id, username, email , profile_url FROM users';

  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ error: 'Database error' });

    res.json(results);
  });
};

// ===================== searchUsers =====================
exports.searchUsers = (req, res) => {
  const search = req.query.search;
  if (!search) return res.json([]);

  const query = `SELECT id, username,email,profile_url FROM users WHERE username LIKE ?`;

  db.query(query, [`%${search}%`], (err, results) => {
    if (err) {
      console.error('❌ Search error:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(results);
  });
};

// ===================== updateUser =====================
exports.updateUser = (req, res) => {
  const userId = req.params.id;
  const { username, email, password } = req.body;
  const profile_url = req.file ? `/uploads/${req.file.filename}` : null;

  const fields = [];  //fields and value used for will making query  
  const values = [];

  if (username) {
    fields.push('username = ?');
    values.push(username);
  }
  if (email) {
    fields.push('email = ?');
    values.push(email);
  }
  if (password) {
    fields.push('password = ?');
    values.push(password);
  }
  if (profile_url) {
    fields.push('profile_url = ?');
    values.push(profile_url);
  }

  if (fields.length === 0) {
    return res.status(400).json({ error: 'No fields to update' });
  }

  values.push(userId);

  const sql = `UPDATE users SET ${fields.join(', ')} WHERE id = ?`;     //UPDATE users SET username = ?, email = ? WHERE id = ?


  db.query(sql, values, (err) => {
    if (err) return res.status(500).json({ error: 'Update failed' });

    // Fetch updated user
    db.query('SELECT id, username, email, profile_url FROM users WHERE id = ?', [userId], (err2, results) => {
      if (err2 || results.length === 0) {
        return res.status(500).json({ error: 'Failed to fetch updated user' });
      }

      res.json({ message: 'User updated', user: results[0] });
    });
  });
};


exports.Deactivate = (req, res) => {
  const userId = req.body.userId;

  if (!userId) {
    return res.status(400).json({ error: 'User ID is required' });
  }

  const sql = 'DELETE FROM users WHERE id = ?';

  db.query(sql, [userId], (err, result) => {
    if (err) {
      console.error('Deletion failed:', err);
      return res.status(500).json({ error: 'Failed to delete user' });
    }

    res.json({ message: 'User account Permanent deleted  successfully' });
  });
};


