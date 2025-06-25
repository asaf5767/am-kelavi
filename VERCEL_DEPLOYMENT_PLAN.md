# Vercel Deployment Plan - AM Kelavi Benefits

## Problem Summary
- Error: `ENOENT: no such file or directory, stat '/var/task/public/index.html'`
- Root cause: Vercel can't find the frontend files due to incorrect project structure

## Solution Overview
Complete restructure optimized for Vercel's serverless architecture.

## New Project Structure
```
am-kelavi-benefits/
├── index.html              # Frontend (moved to root)
├── api/                    # Serverless functions
│   ├── health.js
│   ├── benefits.js
│   ├── categories.js
│   ├── search.js
│   └── benefits/
│       └── [id].js         # Dynamic route for specific benefit
├── lib/                    # Shared utilities
│   └── sheets.js
├── package.json
├── vercel.json
└── .vercelignore
```

## Step-by-Step Implementation

### Step 1: Create Shared Utilities

**File: `lib/sheets.js`**
```javascript
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
```

### Step 2: Create Individual API Functions

**File: `api/health.js`**
```javascript
module.exports = (req, res) => {
  res.status(200).json({ 
    status: 'healthy', 
    message: 'AM-Kelavi Benefits API is running',
    timestamp: new Date().toISOString()
  });
};
```

**File: `api/benefits.js`**
```javascript
const { fetchBenefitsData, enhanceBenefitsForDisplay } = require('../lib/sheets');

module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const benefits = await fetchBenefitsData();
    const enhancedBenefits = enhanceBenefitsForDisplay(benefits);
    res.status(200).json({ 
      success: true, 
      data: enhancedBenefits, 
      count: enhancedBenefits.length 
    });
  } catch (error) {
    console.error('Error in benefits endpoint:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch enhanced benefits data' 
    });
  }
};
```

**File: `api/categories.js`**
```javascript
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
```

**File: `api/search.js`**
```javascript
const { fetchBenefitsData, enhanceBenefitsForDisplay } = require('../lib/sheets');

module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { q: searchQuery = '', category = '' } = req.query;
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
      
      return matches;
    });
    
    res.status(200).json({ 
      success: true, 
      data: filteredBenefits, 
      count: filteredBenefits.length 
    });
  } catch (error) {
    console.error('Error in search endpoint:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to search benefits' 
    });
  }
};
```

**File: `api/benefits/[id].js`**
```javascript
const { fetchBenefitsData } = require('../../lib/sheets');

module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { id } = req.query;
    const benefits = await fetchBenefitsData();
    const benefit = benefits.find(b => b.id === id);
    
    if (!benefit) {
      return res.status(404).json({ 
        success: false, 
        error: 'Benefit not found' 
      });
    }
    
    res.status(200).json({ 
      success: true, 
      benefit 
    });
  } catch (error) {
    console.error('Error in benefit detail endpoint:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch benefit details' 
    });
  }
};
```

### Step 3: Update Frontend API Calls

In your `index.html`, update all API calls to use the new endpoints:

```javascript
// Old: /api/benefits/enhanced
// New: /api/benefits

// Old: /api/benefits/search?q=xxx&category=yyy  
// New: /api/search?q=xxx&category=yyy

// Old: /api/benefits/${id}
// New: /api/benefits/${id}
```

### Step 4: New Configuration Files

**File: `vercel.json`**
```json
{
  "version": 2,
  "functions": {
    "api/**/*.js": {
      "maxDuration": 10
    }
  }
}
```

**File: `package.json`**
```json
{
  "name": "am-kelavi-benefits",
  "version": "2.0.0",
  "description": "Benefits platform - Vercel optimized",
  "dependencies": {
    "axios": "^1.6.0"
  },
  "engines": {
    "node": "18.x"
  }
}
```

**File: `.vercelignore`**
```
# Old files to ignore
benefits-backend/
benefits-website/
frontend/
server.js
app.py
routes/
utils/

# Development files
node_modules/
*.log
.env
.git/
README.md
*.md

# Keep only what we need
# api/ - NOT ignored
# lib/ - NOT ignored  
# index.html - NOT ignored
# package.json - NOT ignored
```

### Step 5: Update index.html API Endpoints

Update your index.html to use the new API structure:
1. `/api/benefits/enhanced` → `/api/benefits`
2. `/api/benefits/search` → `/api/search`
3. `/api/benefits/${id}` → `/api/benefits/${id}`

## Deployment Steps

1. **Backup current project**
2. **Create new structure** as outlined above
3. **Copy index.html** from `public/index.html` to root `index.html`
4. **Update API calls** in index.html
5. **Test locally** with Vercel CLI: `vercel dev`
6. **Deploy**: `vercel --prod`

## Why This Will Work

1. **Frontend at root**: Vercel automatically serves `index.html` from root
2. **API functions**: Each endpoint is its own serverless function
3. **No Express**: Pure Vercel serverless functions
4. **Proper caching**: Reduces Google Sheets API calls
5. **CORS enabled**: Prevents cross-origin issues
6. **Error handling**: Graceful failures with cached data

## Testing Checklist

- [ ] Homepage loads (`/`)
- [ ] API health check works (`/api/health`)
- [ ] Benefits load (`/api/benefits`)
- [ ] Categories load (`/api/categories`)
- [ ] Search works (`/api/search?q=test`)
- [ ] Individual benefit details work (`/api/benefits/123`)