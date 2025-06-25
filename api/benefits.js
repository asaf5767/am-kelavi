const { fetchBenefitsData, enhanceBenefitsForDisplay } = require('../lib/sheets');

module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const benefits = await fetchBenefitsData();
    const enhancedBenefits = enhanceBenefitsForDisplay(benefits);
    res.status(200).json({ 
      success: true, 
      data: enhancedBenefits, 
      count: enhancedBenefits.length 
    });
  } catch (error) {
    console.error('Error in benefits endpoint:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch enhanced benefits data' 
    });
  }
};