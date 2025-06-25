const axios = require('axios');

// Google Sheets URL - convert to CSV export format
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
        // Skip carriage returns and newlines
        continue;
      } else {
        currentField += char;
      }
    }
    
    // End of line
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
    const response = await axios.get(GOOGLE_SHEETS_URL, {
      headers: {
        'User-Agent': 'AM-Kelavi-Benefits/1.0'
      }
    });
    
    const csvData = response.data;
    const rows = parseCSV(csvData);
    
    // Find the header row (contains "Post ID")
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
    
    const headers = rows[headerRowIndex];
    const dataRows = rows.slice(headerRowIndex + 1);
    
    const benefits = [];
    
    for (const row of dataRows) {
      // Skip empty rows
      if (!row || row.length < 8 || !row[0] || !row[0].trim()) {
        continue;
      }
      
      const benefit = {
        id: row[0] ? row[0].trim() : '',
        targetAudience: row[1] ? row[1].trim() : '',  // למי זה
        category: row[2] ? row[2].trim() : '',        // קטגוריה
        subcategory: row[3] ? row[3].trim() : '',     // תת קטגוריה
        organization: row[4] ? row[4].trim() : '',    // שם המשרד/הארגון
        detailsLink: row[5] ? row[5].trim() : '',     // לינק לפרטים
        lastUpdated: row[6] ? row[6].trim() : '',     // מתי עודכן
        details: row[7] ? row[7].trim() : '',         // פרטים (האותיות הקטנות)
        hebrewFieldNames: {
          targetAudience: 'למי זה',
          category: 'קטגוריה',
          subcategory: 'תת קטגוריה',
          organization: 'שם המשרד/הארגון',
          detailsLink: 'לינק לפרטים',
          lastUpdated: 'מתי עודכן',
          details: 'פרטים'
        }
      };
      
      // Only add benefits that have essential information
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

module.exports = {
  fetchBenefitsData,
  enhanceBenefitsForDisplay
};