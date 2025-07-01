const { fetchBenefitsData, enhanceBenefitsForDisplay } = require('../lib/sheets');

// Shared audience matching logic
const AUDIENCE_MATCHERS = {
  'משרתי מילואים': (targetAudience) => 
    ['משרתי מילואים', 'משרת מילואים', 'מילואים'].some(keyword => 
      targetAudience.includes(keyword)
    ),
  'עצמאים/ות': (targetAudience) => 
    ['עצמאים/ות', 'עצמאיות', 'עצמאי'].some(keyword => 
      targetAudience.includes(keyword)
    ),
  'בעלי עסקים': (targetAudience) => 
    ['מעסיקים', 'בעלי עסקים', 'בעל עסק'].some(keyword => 
      targetAudience.includes(keyword)
    ),
  'נפגעי פעולות איבה': (targetAudience) => 
    ['נפגעי פעולות איבה', 'נפגעי איבה'].some(keyword => 
      targetAudience.includes(keyword)
    ),
  'נפגעי גוף/נפש': (targetAudience) => 
    ['נפגעי גוף / נפש', 'נפגעי גוף', 'נפגעי נפש'].some(keyword => 
      targetAudience.includes(keyword)
    ),
  'תקועים בחו"ל': (targetAudience) => 
    ['תקועים בחו', '"תקועים בחו', '""תקועים בחו'].some(keyword => 
      targetAudience.includes(keyword)
    ),
  'נפגעי רכוש': (targetAudience) => 
    ['נפגע בית', 'נפגע רכב', 'נפגע עסק', 'נפגעי רכוש'].some(keyword => 
      targetAudience.includes(keyword)
    )
};

function matchesCategory(benefit, category) {
  if (!category) return true;
  
  // Handle the unified damage category
  if (category === 'נפגעי רכוש 🏠🚗💼') {
    const targetAudience = benefit.targetAudience ? benefit.targetAudience.toLowerCase() : '';
    return ['נפגע בית', 'נפגע רכב', 'נפגע עסק'].some(keyword => 
      targetAudience.includes(keyword)
    );
  }
  
  // Handle renamed category
  if (category === 'עצמאים/עצמאיות') {
    return ['זכויות והטבות לעצמאים', 'עצמאים/עצמאיות'].includes(benefit.category);
  }
  
  // Standard category matching
  return benefit.category === category;
}

function matchesAudience(benefit, audience) {
  if (!audience) return true;
  
  const targetAudience = benefit.targetAudience ? benefit.targetAudience.toLowerCase() : '';
  
  // Use predefined matchers for common audiences
  if (AUDIENCE_MATCHERS[audience]) {
    return AUDIENCE_MATCHERS[audience](targetAudience);
  }
  
  // Generic audience matching for other cases
  return targetAudience.includes(audience.toLowerCase());
}

function matchesSearchQuery(benefit, searchQuery) {
  if (!searchQuery) return true;
  
  const searchableText = `${benefit.organization} ${benefit.details} ${benefit.category} ${benefit.targetAudience}`.toLowerCase();
  return searchableText.includes(searchQuery.toLowerCase());
}

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
    
    if (!Array.isArray(benefits)) {
      throw new Error('Invalid benefits data received');
    }
    
    const enhancedBenefits = enhanceBenefitsForDisplay(benefits);
    
    const filteredBenefits = enhancedBenefits.filter(benefit => {
      return matchesSearchQuery(benefit, searchQuery) &&
             matchesCategory(benefit, category) &&
             matchesAudience(benefit, audience);
    });
    
    res.status(200).json({ 
      success: true, 
      data: filteredBenefits, 
      count: filteredBenefits.length,
      filters: {
        searchQuery: searchQuery || null,
        category: category || null,
        audience: audience || null
      }
    });
  } catch (error) {
    console.error('Error in search endpoint:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to search benefits',
      message: error.message
    });
  }
};