const express = require('express');
const cors = require('cors');
const path = require('path');

// Import route modules
const benefitsRoutes = require('./routes/benefits');
const categoriesRoutes = require('./routes/categories');
const aiRoutes = require('./routes/ai');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// Import and use our API routes
const audiencesHandler = require('./api/audiences');
const searchHandler = require('./api/search');

// API Routes
app.use('/api/benefits', benefitsRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/ai', aiRoutes);
app.get('/api/audiences', audiencesHandler);
app.get('/api/search', searchHandler);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    message: 'AM-Kelavi Benefits API is running',
    timestamp: new Date().toISOString()
  });
});

// Serve the main page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(500).json({ 
    success: false, 
    error: 'Something went wrong!' 
  });
});

app.listen(PORT, () => {
  console.log(`🚀 AM-Kelavi Benefits server running on port ${PORT}`);
  console.log(`📱 Frontend: http://localhost:${PORT}`);
  console.log(`🔧 API: http://localhost:${PORT}/api`);
  console.log(`❤️ Health: http://localhost:${PORT}/api/health`);
});

module.exports = app;