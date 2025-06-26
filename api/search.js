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
      
      if (category) {
        // Handle the unified damage category
        if (category === 'נפגעי רכוש 🏠🚗💼') {
          const targetAudience = benefit.targetAudience ? benefit.targetAudience.toLowerCase() : '';
          if (!targetAudience.includes('נפגע בית') && !targetAudience.includes('נפגע רכב') && !targetAudience.includes('נפגע עסק')) {
            matches = false;
          }
        } 
        // Handle renamed category
        else if (category === 'עצמאים/עצמאיות') {
          if (benefit.category !== 'זכויות והטבות לעצמאים' && benefit.category !== 'עצמאים/עצמאיות') {
            matches = false;
          }
        }
        // Standard category matching
        else if (category !== benefit.category) {
          matches = false;
        }
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