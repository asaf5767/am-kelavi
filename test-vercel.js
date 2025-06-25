// Quick test to verify the Vercel function works
const app = require('./api/index.js');
const request = require('supertest');

// Simple test - you can delete this file after testing
console.log('Testing Vercel function...');

// Test health endpoint
app.get('/test', (req, res) => {
  res.json({ message: 'Vercel function works!' });
});

console.log('Vercel function loaded successfully!');