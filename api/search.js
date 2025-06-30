const { fetchBenefitsData, enhanceBenefitsForDisplay } = require('../lib/sheets');

module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { q: searchQuery = '', category = '', audience = '' } = req.query;
    const benefits = await fetchBenefitsData();
    const enhancedBenefits = enhanceBenefitsForDisplay(benefits);
    
    const filteredBenefits = enhancedBenefits.filter(benefit => {
      let matches = true;
      
      // Text search filtering
      if (searchQuery) {
        const searchableText = `${benefit.organization} ${benefit.details} ${benefit.category} ${benefit.targetAudience}`.toLowerCase();
        if (!searchableText.includes(searchQuery.toLowerCase())) {
          matches = false;
        }
      }
      
      // Category filtering
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
      
      // Target audience filtering
      if (audience) {
        const targetAudience = benefit.targetAudience ? benefit.targetAudience.toLowerCase() : '';
        
        // Handle special cases for target audience matching
        if (audience === 'משרתי מילואים') {
          if (!targetAudience.includes('משרתי מילואים') && !targetAudience.includes('משרת מילואים') && !targetAudience.includes('מילואים')) {
            matches = false;
          }
        } else if (audience === 'עצמאים/ות') {
          if (!targetAudience.includes('עצמאים/ות') && !targetAudience.includes('עצמאיות') && !targetAudience.includes('עצמאי')) {
            matches = false;
          }
        } else if (audience === 'בעלי עסקים') {
          if (!targetAudience.includes('מעסיקים') && !targetAudience.includes('בעלי עסקים') && !targetAudience.includes('בעל עסק')) {
            matches = false;
          }
        } else if (audience === 'נפגעי פעולות איבה') {
          if (!targetAudience.includes('נפגעי פעולות איבה') && !targetAudience.includes('נפגעי איבה')) {
            matches = false;
          }
        } else if (audience === 'נפגעי גוף/נפש') {
          if (!targetAudience.includes('נפגעי גוף / נפש') && !targetAudience.includes('נפגעי גוף') && !targetAudience.includes('נפגעי נפש')) {
            matches = false;
          }
        } else if (audience === 'תקועים בחו"ל') {
          if (!targetAudience.includes('תקועים בחו') && !targetAudience.includes('"תקועים בחו')) {
            matches = false;
          }
        } else if (audience === 'נפגעי רכוש') {
          if (!targetAudience.includes('נפגע בית') && !targetAudience.includes('נפגע רכב') && !targetAudience.includes('נפגע עסק') && !targetAudience.includes('נפגעי רכוש')) {
            matches = false;
          }
        } else {
          // Generic audience matching
          if (!targetAudience.includes(audience.toLowerCase())) {
            matches = false;
          }
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