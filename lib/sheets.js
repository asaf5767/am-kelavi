const fs = require('fs').promises;
const path = require('path');

const CSV_FILE_PATH = path.join(__dirname, '..', 'הקלות והטבות לכולם- מוֹרָן תְּסַדֵּר- עם כלביא_גרסה 25.6 01_00 - מאגר ההטבות 💰 וההקלות.csv');

// Cache mechanism
let cachedData = null;
let cacheTimestamp = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

function cleanText(text) {
  if (!text || typeof text !== 'string') return '';
  
  // Remove multiple quotes and clean up
  return text
    .replace(/"{2,}/g, '"')  // Replace multiple quotes with single quote
    .replace(/^["']|["']$/g, '')  // Remove leading/trailing quotes
    .trim();
}

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
    const csvData = await fs.readFile(CSV_FILE_PATH, 'utf-8');
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
        targetAudience: cleanText(row[1]),
        category: cleanText(row[2]),
        subcategory: cleanText(row[3]),
        organization: cleanText(row[4]),
        detailsLink: row[5] ? row[5].trim() : '',
        lastUpdated: row[6] ? row[6].trim() : '',
        details: cleanText(row[7])
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
    console.error('Error fetching CSV data:', error.message);
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