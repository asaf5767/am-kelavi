const { fetchBenefitsData } = require('../lib/sheets');

module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const benefits = await fetchBenefitsData();
    const audienceCount = {};
    
    for (const benefit of benefits) {
      if (benefit.targetAudience) {
        // Split target audiences by comma and clean up
        const audiences = benefit.targetAudience
          .split(',')
          .map(audience => audience.trim())
          .filter(audience => audience && audience !== '' && !audience.startsWith('"') || audience.endsWith('"'));
        
        for (let audience of audiences) {
          // Clean up audience names
          audience = audience.replace(/^["']|["']$/g, '').trim();
          
          if (audience && audience.length > 0) {
            audienceCount[audience] = (audienceCount[audience] || 0) + 1;
          }
        }
      }
    }
    
    // Convert to array and sort by frequency
    const audienceList = Object.entries(audienceCount)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
    
    // Add some common consolidated audiences for easier filtering
    const commonAudiences = [
      { name: 'משרתי מילואים', count: audienceList.filter(a => 
        a.name.includes('משרתי מילואים') || a.name.includes('משרת מילואים') || a.name.includes('מילואים')
      ).reduce((sum, a) => sum + a.count, 0) },
      { name: 'עצמאים/ות', count: audienceList.filter(a => 
        a.name.includes('עצמאים') || a.name.includes('עצמאי')
      ).reduce((sum, a) => sum + a.count, 0) },
      { name: 'בעלי עסקים', count: audienceList.filter(a => 
        a.name.includes('מעסיקים') || a.name.includes('בעלי עסקים') || a.name.includes('בעל עסק')
      ).reduce((sum, a) => sum + a.count, 0) },
      { name: 'נפגעי פעולות איבה', count: audienceList.filter(a => 
        a.name.includes('נפגעי פעולות איבה') || a.name.includes('נפגעי איבה')
      ).reduce((sum, a) => sum + a.count, 0) },
      { name: 'נפגעי גוף/נפש', count: audienceList.filter(a => 
        a.name.includes('נפגעי גוף') || a.name.includes('נפגעי נפש')
      ).reduce((sum, a) => sum + a.count, 0) },
      { name: 'תקועים בחו"ל', count: audienceList.filter(a => 
        a.name.includes('תקועים בחו')
      ).reduce((sum, a) => sum + a.count, 0) },
      { name: 'נפגעי רכוש', count: audienceList.filter(a => 
        a.name.includes('נפגע בית') || a.name.includes('נפגע רכב') || a.name.includes('נפגע עסק')
      ).reduce((sum, a) => sum + a.count, 0) }
    ].filter(audience => audience.count > 0);
    
    // Combine common audiences with the most frequent specific ones
    const topSpecificAudiences = audienceList
      .filter(audience => 
        !audience.name.includes('כולם') &&
        !audience.name.includes('אנשים פרטיים') &&
        audience.count >= 3 // Only show audiences that appear in at least 3 benefits
      )
      .slice(0, 15); // Limit to top 15
    
    const finalAudienceList = [
      ...commonAudiences,
      ...topSpecificAudiences.filter(specific => 
        !commonAudiences.some(common => 
          specific.name.includes(common.name.split('/')[0]) || 
          common.name.includes(specific.name)
        )
      )
    ].sort((a, b) => b.count - a.count);
    
    res.status(200).json({ 
      success: true, 
      audiences: finalAudienceList 
    });
  } catch (error) {
    console.error('Error in audiences endpoint:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch audiences' 
    });
  }
};