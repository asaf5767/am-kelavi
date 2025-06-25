const { fetchBenefitsData } = require('../../lib/sheets');

module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { id } = req.query;
    const benefits = await fetchBenefitsData();
    const benefit = benefits.find(b => b.id === id);
    
    if (!benefit) {
      return res.status(404).json({ 
        success: false, 
        error: 'Benefit not found' 
      });
    }
    
    res.status(200).json({ 
      success: true, 
      benefit 
    });
  } catch (error) {
    console.error('Error in benefit detail endpoint:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch benefit details' 
    });
  }
};