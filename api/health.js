module.exports = (req, res) => {
  res.status(200).json({ 
    status: 'healthy', 
    message: 'AM-Kelavi Benefits API is running',
    timestamp: new Date().toISOString()
  });
};