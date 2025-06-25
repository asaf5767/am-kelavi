const express = require('express');
const { fetchBenefitsData, enhanceBenefitsForDisplay } = require('../utils/sheets');

const router = express.Router();

// Get all benefits
router.get('/', async (req, res) => {
  try {
    const benefits = await fetchBenefitsData();
    res.json({
      success: true,
      data: benefits,
      count: benefits.length
    });
  } catch (error) {
    console.error('Error fetching benefits:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch benefits data'
    });
  }
});

// Get enhanced benefits for display
router.get('/enhanced', async (req, res) => {
  try {
    const benefits = await fetchBenefitsData();
    const enhancedBenefits = enhanceBenefitsForDisplay(benefits);
    
    res.json({
      success: true,
      data: enhancedBenefits,
      count: enhancedBenefits.length
    });
  } catch (error) {
    console.error('Error fetching enhanced benefits:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch enhanced benefits data'
    });
  }
});

// Search benefits with filters
router.get('/search', async (req, res) => {
  try {
    const { q: searchQuery = '', category = '', audience = '' } = req.query;
    
    const benefits = await fetchBenefitsData();
    const enhancedBenefits = enhanceBenefitsForDisplay(benefits);
    
    // Apply filters
    const filteredBenefits = enhancedBenefits.filter(benefit => {
      let matches = true;
      
      // Search query filter
      if (searchQuery) {
        const searchableText = `${benefit.organization} ${benefit.details} ${benefit.category} ${benefit.targetAudience}`.toLowerCase();
        if (!searchableText.includes(searchQuery.toLowerCase())) {
          matches = false;
        }
      }
      
      // Category filter
      if (category && category !== benefit.category) {
        matches = false;
      }
      
      // Audience filter
      if (audience && !benefit.targetAudience.toLowerCase().includes(audience.toLowerCase())) {
        matches = false;
      }
      
      return matches;
    });
    
    res.json({
      success: true,
      data: filteredBenefits,
      count: filteredBenefits.length,
      filters: {
        search: searchQuery,
        category,
        audience
      }
    });
  } catch (error) {
    console.error('Error searching benefits:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to search benefits'
    });
  }
});

// Get specific benefit by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const benefits = await fetchBenefitsData();
    
    const benefit = benefits.find(b => b.id === id);
    
    if (!benefit) {
      return res.status(404).json({
        success: false,
        error: 'Benefit not found'
      });
    }
    
    // Add target audience array for detailed view
    const detailedBenefit = {
      ...benefit,
      targetAudienceArray: benefit.targetAudience
        ? benefit.targetAudience.split(',').map(audience => audience.trim()).filter(Boolean)
        : []
    };
    
    res.json({
      success: true,
      benefit: detailedBenefit
    });
  } catch (error) {
    console.error('Error fetching benefit details:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch benefit details'
    });
  }
});

module.exports = router;