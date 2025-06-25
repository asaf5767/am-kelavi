const express = require('express');
const { fetchBenefitsData } = require('../utils/sheets');

const router = express.Router();

// Keywords mapping for Hebrew AI suggestions
const KEYWORD_MAPPINGS = {
  // Family and children
  'ילדים': ['ילדים', 'ילד', 'ילדה', 'משפחה', 'הורים', 'חינוך'],
  'משפחה': ['משפחה', 'ילדים', 'הורים', 'זוג', 'נישואין'],
  'הורים': ['הורים', 'אמא', 'אבא', 'ילדים', 'משפחה'],
  
  // Business and employment
  'עסק': ['עסק', 'עסקים', 'עצמאי', 'עצמאים', 'מעסיק', 'עובד', 'תעסוקה'],
  'עבודה': ['עבודה', 'תעסוקה', 'עובד', 'מעסיק', 'משכורת', 'פיטורין'],
  'עצמאי': ['עצמאי', 'עצמאים', 'עסק', 'עסקים', 'פרילנסר'],
  
  // Health and disability
  'בריאות': ['בריאות', 'רפואה', 'רופא', 'בית חולים', 'מחלה', 'טיפול'],
  'נכות': ['נכות', 'נכה', 'נפגע', 'פגיעה', 'נכים', 'נגישות'],
  'נפש': ['נפש', 'נפשי', 'פסיכולוגי', 'דיכאון', 'חרדה', 'טיפול נפשי'],
  
  // Housing and property
  'דיור': ['דיור', 'בית', 'דירה', 'שכירות', 'משכנתא', 'מגורים'],
  'בית': ['בית', 'דירה', 'דיור', 'מגורים', 'נדלן', 'נזק'],
  
  // Financial assistance
  'כסף': ['כסף', 'כספי', 'תשלום', 'מענק', 'הלוואה', 'סיוע כלכלי'],
  'מענק': ['מענק', 'תמיכה', 'סיוע', 'כסף', 'תשלום'],
  'הלוואה': ['הלוואה', 'אשראי', 'כסף', 'מימון', 'בנק'],
  
  // Emergency and war-related
  'מלחמה': ['מלחמה', 'חירום', 'פגיעה', 'נפגע', 'מילואים', 'ביטחון'],
  'חירום': ['חירום', 'מלחמה', 'אסון', 'פגיעה', 'נפגע'],
  'מילואים': ['מילואים', 'מילואימניק', 'צבא', 'שירות', 'חירום'],
  
  // Women and gender
  'נשים': ['נשים', 'אישה', 'נשי', 'אמהות', 'מגדר'],
  'אישה': ['אישה', 'נשים', 'נשי', 'אמא', 'מגדר'],
  
  // Elderly
  'קשישים': ['קשישים', 'קשיש', 'זקנים', 'גיל שלישי', 'פנסיה'],
  'פנסיה': ['פנסיה', 'פנסיונר', 'קשישים', 'זקנה', 'גמלאות'],
  
  // Legal and rights
  'זכויות': ['זכויות', 'חוק', 'משפט', 'תביעה', 'הגנה'],
  'תביעה': ['תביעה', 'תביעות', 'משפט', 'פיצוי', 'זכויות'],
  
  // Education
  'חינוך': ['חינוך', 'לימודים', 'בית ספר', 'סטודנט', 'השכלה'],
  'לימודים': ['לימודים', 'חינוך', 'סטודנט', 'אוניברסיטה', 'השכלה'],
};

// Extract keywords from Hebrew text
function extractKeywords(text) {
  const textLower = text.toLowerCase().trim();
  const foundKeywords = new Set();
  
  // Direct keyword matching
  for (const [keyword, synonyms] of Object.entries(KEYWORD_MAPPINGS)) {
    for (const synonym of synonyms) {
      if (textLower.includes(synonym)) {
        foundKeywords.add(keyword);
      }
    }
  }
  
  return Array.from(foundKeywords);
}

// Score benefit relevance to user query
function scoreBenefitRelevance(benefit, keywords, query) {
  let score = 0;
  const queryLower = query.toLowerCase();
  
  // Check for keyword matches in different fields
  const searchableText = `${benefit.organization} ${benefit.details} ${benefit.category} ${benefit.targetAudience}`.toLowerCase();
  
  // Direct query match (highest score)
  if (searchableText.includes(queryLower)) {
    score += 10;
  }
  
  // Keyword matches
  for (const keyword of keywords) {
    if (searchableText.includes(keyword)) {
      score += 5;
    }
    
    // Check synonyms
    if (KEYWORD_MAPPINGS[keyword]) {
      for (const synonym of KEYWORD_MAPPINGS[keyword]) {
        if (searchableText.includes(synonym)) {
          score += 3;
        }
      }
    }
  }
  
  // Category relevance
  const categoryLower = benefit.category.toLowerCase();
  for (const keyword of keywords) {
    if (categoryLower.includes(keyword)) {
      score += 4;
    }
  }
  
  // Target audience relevance
  const audienceLower = benefit.targetAudience.toLowerCase();
  for (const keyword of keywords) {
    if (audienceLower.includes(keyword)) {
      score += 3;
    }
  }
  
  return score;
}

// Generate explanation for AI suggestions
function generateExplanation(query, keywords, numSuggestions) {
  if (numSuggestions === 0) {
    return `לא מצאתי שירותים רלוונטיים לשאלה '${query}'. נסו לחפש במילים אחרות או בדקו את הקטגוריות השונות.`;
  }
  
  const keywordText = keywords.length > 0 ? keywords.join(", ") : "המילים שלכם";
  
  if (numSuggestions === 1) {
    return `מצאתי שירות אחד רלוונטי לשאלה שלכם על ${keywordText}.`;
  } else {
    return `מצאתי ${numSuggestions} שירותים רלוונטיים לשאלה שלכם על ${keywordText}. השירותים מסודרים לפי רלוונטיות.`;
  }
}

// AI suggestions endpoint
router.post('/suggest', async (req, res) => {
  try {
    const { query } = req.body;
    
    if (!query || !query.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Query is required'
      });
    }
    
    const benefits = await fetchBenefitsData();
    const keywords = extractKeywords(query);
    
    // Score and rank benefits
    const scoredBenefits = [];
    for (const benefit of benefits) {
      const score = scoreBenefitRelevance(benefit, keywords, query);
      if (score > 0) {
        scoredBenefits.push({ benefit, score });
      }
    }
    
    // Sort by score (highest first) and limit to top 5
    scoredBenefits.sort((a, b) => b.score - a.score);
    const topSuggestions = scoredBenefits.slice(0, 5).map(item => item.benefit);
    
    // Generate explanation
    const explanation = generateExplanation(query, keywords, topSuggestions.length);
    
    res.json({
      success: true,
      query,
      keywords,
      suggestions: topSuggestions,
      explanation,
      total_found: scoredBenefits.length
    });
  } catch (error) {
    console.error('Error generating AI suggestions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate suggestions'
    });
  }
});

module.exports = router;