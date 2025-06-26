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
    const categoryCount = {};
    let damageCount = 0;
    
    for (const benefit of benefits) {
      let category = benefit.category ? benefit.category.trim() : '';
      if (category) {
        // Rename category as requested
        if (category === 'זכויות והטבות לעצמאים') {
          category = 'עצמאים/עצמאיות';
        }
        categoryCount[category] = (categoryCount[category] || 0) + 1;
      }
      
      // Count benefits that relate to property damage
      const targetAudience = benefit.targetAudience ? benefit.targetAudience.toLowerCase() : '';
      if (targetAudience.includes('נפגע בית') || targetAudience.includes('נפגע רכב') || targetAudience.includes('נפגע עסק')) {
        damageCount++;
      }
    }
    
    const categoryList = Object.entries(categoryCount)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
    
    // Add the unified damage category if it has results
    if (damageCount > 0) {
      categoryList.unshift({ name: 'נפגעי רכוש 🏠🚗💼', count: damageCount });
    }
    
    res.status(200).json({ 
      success: true, 
      categories: categoryList 
    });
  } catch (error) {
    console.error('Error in categories endpoint:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch categories' 
    });
  }
};