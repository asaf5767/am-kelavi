const { fetchBenefitsData, enhanceBenefitsForDisplay } = require('../lib/sheets');

module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { q: searchQuery = '', category = '' } = req.query;
    const benefits = await fetchBenefitsData();
    const enhancedBenefits = enhanceBenefitsForDisplay(benefits);
    
    const filteredBenefits = enhancedBenefits.filter(benefit => {
      let matches = true;
      
      if (searchQuery) {
        const searchableText = `${benefit.organization} ${benefit.details} ${benefit.category} ${benefit.targetAudience}`.toLowerCase();
        if (!searchableText.includes(searchQuery.toLowerCase())) {
          matches = false;
        }
      }
      
      if (category && category !== benefit.category) {
        matches = false;
      }
      
      return matches;
    });
    
    res.status(200).json({ 
      success: true, 
      data: filteredBenefits, 
      count: filteredBenefits.length 
    });
  } catch (error) {
    console.error('Error in search endpoint:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to search benefits' 
    });
  }
};