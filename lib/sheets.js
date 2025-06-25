const axios = require('axios');

const GOOGLE_SHEETS_URL = "https://docs.google.com/spreadsheets/d/1-OhoadrXgz-FJZAgB_43Vdm8TXwgzaEL5pZi40pY0-w/export?format=csv&gid=0";

// Cache mechanism
let cachedData = null;
let cacheTimestamp = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

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

async function fetchBenefitsData() {
  // Check cache
  if (cachedData && cacheTimestamp && (Date.now() - cacheTimestamp < CACHE_DURATION)) {
    return cachedData;
  }

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
    
    // Update cache
    cachedData = benefits;
    cacheTimestamp = Date.now();
    
    return benefits;
  } catch (error) {
    console.error('Error fetching Google Sheets data:', error.message);
    // Return cached data if available, even if expired
    if (cachedData) {
      return cachedData;
    }
    throw error;
  }
}

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