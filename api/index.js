const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Google Sheets utility functions
const GOOGLE_SHEETS_URL = "https://docs.google.com/spreadsheets/d/1-OhoadrXgz-FJZAgB_43Vdm8TXwgzaEL5pZi40pY0-w/export?format=csv&gid=0";

// Parse CSV text into rows
function parseCSV(csvText) {
  const lines = csvText.split('\n');
  const result = [];
  let currentRow = [];
  let inQuotes = false;
  let currentField = '';
  
  for (const line of lines) {
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        currentRow.push(currentField);
        currentField = '';
      } else if (char === '\r' || char === '\n') {
        continue;
      } else {
        currentField += char;
      }
    }
    
    if (!inQuotes) {
      currentRow.push(currentField);
      if (currentRow.length > 0 && currentRow.some(field => field.trim() !== '')) {
        result.push(currentRow);
      }
      currentRow = [];
      currentField = '';
    }
  }
  
  return result;
}

// Fetch and process Google Sheets data
async function fetchBenefitsData() {
  try {
    const response = await axios.get(GOOGLE_SHEETS_URL);
    const csvData = response.data;
    const rows = parseCSV(csvData);
    
    let headerRowIndex = -1;
    for (let i = 0; i < rows.length; i++) {
      if (rows[i].some(cell => cell.includes('Post ID'))) {
        headerRowIndex = i;
        break;
      }
    }
    
    if (headerRowIndex === -1) {
      throw new Error('Could not find header row in CSV data');
    }
    
    const dataRows = rows.slice(headerRowIndex + 1);
    const benefits = [];
    
    for (const row of dataRows) {
      if (!row || row.length < 8 || !row[0] || !row[0].trim()) {
        continue;
      }
      
      const benefit = {
        id: row[0] ? row[0].trim() : '',
        targetAudience: row[1] ? row[1].trim() : '',
        category: row[2] ? row[2].trim() : '',
        subcategory: row[3] ? row[3].trim() : '',
        organization: row[4] ? row[4].trim() : '',
        detailsLink: row[5] ? row[5].trim() : '',
        lastUpdated: row[6] ? row[6].trim() : '',
        details: row[7] ? row[7].trim() : ''
      };
      
      if (benefit.id && (benefit.organization || benefit.details)) {
        benefits.push(benefit);
      }
    }
    
    return benefits;
  } catch (error) {
    console.error('Error fetching Google Sheets data:', error.message);
    throw error;
  }
}

// Enhanced benefits with display features
function enhanceBenefitsForDisplay(benefits) {
  return benefits.map(benefit => {
    const detailsTruncated = benefit.details.length > 200 
      ? benefit.details.substring(0, 200) + "..." 
      : benefit.details;
    
    const targetAudienceArray = benefit.targetAudience
      ? benefit.targetAudience.split(',').map(audience => audience.trim()).filter(Boolean)
      : [];
    
    return {
      ...benefit,
      detailsTruncated,
      hasMoreDetails: benefit.details.length > 200,
      targetAudienceArray,
      targetAudienceDisplayed: targetAudienceArray.slice(0, 3),
      hasMoreAudience: targetAudienceArray.length > 3,
      additionalAudienceCount: Math.max(0, targetAudienceArray.length - 3)
    };
  });
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    message: 'AM-Kelavi Benefits API is running',
    timestamp: new Date().toISOString()
  });
});

// Benefits endpoints
app.get('/api/benefits', async (req, res) => {
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

app.get('/api/benefits/enhanced', async (req, res) => {
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

app.get('/api/benefits/search', async (req, res) => {
  try {
    const { q: searchQuery = '', category = '', audience = '' } = req.query;
    
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
      
      if (audience && !benefit.targetAudience.toLowerCase().includes(audience.toLowerCase())) {
        matches = false;
      }
      
      return matches;
    });
    
    res.json({
      success: true,
      data: filteredBenefits,
      count: filteredBenefits.length,
      filters: { search: searchQuery, category, audience }
    });
  } catch (error) {
    console.error('Error searching benefits:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to search benefits'
    });
  }
});

app.get('/api/benefits/:id', async (req, res) => {
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

// Categories endpoint
app.get('/api/categories', async (req, res) => {
  try {
    const benefits = await fetchBenefitsData();
    
    const categoryCount = {};
    for (const benefit of benefits) {
      const category = benefit.category ? benefit.category.trim() : '';
      if (category && category !== '') {
        categoryCount[category] = (categoryCount[category] || 0) + 1;
      }
    }
    
    const categoryList = Object.entries(categoryCount)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
    
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

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(500).json({ 
    success: false, 
    error: 'Something went wrong!' 
  });
});

// Export for Vercel
module.exports = app;