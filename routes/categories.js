const express = require('express');
const { fetchBenefitsData } = require('../utils/sheets');

const router = express.Router();

// Get all categories with counts
router.get('/', async (req, res) => {
  try {
    const benefits = await fetchBenefitsData();
    
    // Count categories
    const categoryCount = {};
    
    for (const benefit of benefits) {
      const category = benefit.category ? benefit.category.trim() : '';
      if (category && category !== '') {
        if (categoryCount[category]) {
          categoryCount[category] += 1;
        } else {
          categoryCount[category] = 1;
        }
      }
    }
    
    // Convert to sorted list
    const categoryList = Object.entries(categoryCount)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count); // Sort by count, descending
    
    res.json({
      success: true,
      categories: categoryList,
      total_categories: categoryList.length
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch categories'
    });
  }
});

module.exports = router;