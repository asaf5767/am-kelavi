const { fetchBenefitsData } = require('../lib/sheets');

// Constants for better maintainability
const MIN_BENEFIT_COUNT = 3;
const MAX_SPECIFIC_AUDIENCES = 15;

// Common audience mappings for better organization
const AUDIENCE_MAPPINGS = {
  'משרתי מילואים': ['משרתי מילואים', 'משרת מילואים', 'מילואים'],
  'עצמאים/ות': ['עצמאים/ות', 'עצמאיות', 'עצמאי'],
  'בעלי עסקים': ['מעסיקים', 'בעלי עסקים', 'בעל עסק'],
  'נפגעי פעולות איבה': ['נפגעי פעולות איבה', 'נפגעי איבה'],
  'נפגעי גוף/נפש': ['נפגעי גוף / נפש', 'נפגעי גוף', 'נפגעי נפש'],
  'תקועים בחו"ל': ['תקועים בחו', '"תקועים בחו', '""תקועים בחו'],
  'נפגעי רכוש': ['נפגע בית', 'נפגע רכב', 'נפגע עסק', 'נפגעי רכוש']
};

function cleanAudienceName(audience) {
  if (!audience || typeof audience !== 'string') {
    return '';
  }
  // Remove leading/trailing quotes and extra quotes inside
  return audience
    .replace(/^["']|["']$/g, '')  // Remove outer quotes
    .replace(/["]{2,}/g, '"')     // Replace multiple quotes with single quote
    .trim();
}

function parseAudiences(targetAudience) {
  if (!targetAudience || typeof targetAudience !== 'string') {
    return [];
  }
  
  return targetAudience
    .split(',')
    .map(audience => cleanAudienceName(audience))
    .filter(audience => audience.length > 0);
}

function calculateConsolidatedCount(audienceList, keywords) {
  return audienceList
    .filter(a => keywords.some(keyword => a.name.includes(keyword)))
    .reduce((sum, a) => sum + a.count, 0);
}

module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const benefits = await fetchBenefitsData();
    
    if (!Array.isArray(benefits)) {
      throw new Error('Invalid benefits data received');
    }
    
    const audienceCount = {};
    
    // Process each benefit and count audiences
    for (const benefit of benefits) {
      if (!benefit || typeof benefit !== 'object') {
        continue;
      }
      
      const audiences = parseAudiences(benefit.targetAudience);
      
      for (const audience of audiences) {
        if (audience.length > 0) {
          audienceCount[audience] = (audienceCount[audience] || 0) + 1;
        }
      }
    }
    
    // Convert to array and sort by frequency
    const audienceList = Object.entries(audienceCount)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
    
    // Create consolidated common audiences
    const commonAudiences = Object.entries(AUDIENCE_MAPPINGS)
      .map(([displayName, keywords]) => ({
        name: displayName,
        count: calculateConsolidatedCount(audienceList, keywords)
      }))
      .filter(audience => audience.count > 0);
    
    // Debug: Log common audiences to see if משרתי מילואים is included
    console.log('Common audiences found:', commonAudiences.map(a => `${a.name}: ${a.count}`));
    
    // Get top specific audiences (excluding generic ones)
    const topSpecificAudiences = audienceList
      .filter(audience => 
        !audience.name.includes('כולם') &&
        !audience.name.includes('אנשים פרטיים') &&
        audience.count >= MIN_BENEFIT_COUNT
      )
      .slice(0, MAX_SPECIFIC_AUDIENCES);
    
    // Debug: Log top specific audiences  
    console.log('Top specific audiences:', topSpecificAudiences.map(a => `${a.name}: ${a.count}`));
    
    // Combine and deduplicate
    const finalAudienceList = [
      ...commonAudiences,
      ...topSpecificAudiences.filter(specific => 
        !commonAudiences.some(common => {
          const commonKeywords = AUDIENCE_MAPPINGS[common.name] || [];
          return commonKeywords.some(keyword => specific.name.includes(keyword));
        })
      )
    ].sort((a, b) => b.count - a.count);
    
    res.status(200).json({ 
      success: true, 
      audiences: finalAudienceList,
      total: finalAudienceList.length
    });
  } catch (error) {
    console.error('Error in audiences endpoint:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch audiences',
      message: error.message
    });
  }
};