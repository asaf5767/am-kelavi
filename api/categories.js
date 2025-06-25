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
    
    for (const benefit of benefits) {
      const category = benefit.category ? benefit.category.trim() : '';
      if (category) {
        categoryCount[category] = (categoryCount[category] || 0) + 1;
      }
    }
    
    const categoryList = Object.entries(categoryCount)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
    
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