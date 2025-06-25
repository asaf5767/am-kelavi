import requests
import csv
import io
import re
from flask import Blueprint, jsonify, request
from flask_cors import cross_origin

ai_bp = Blueprint('ai', __name__)

# Google Sheets URL
GOOGLE_SHEETS_URL = "https://docs.google.com/spreadsheets/d/1-OhoadrXgz-FJZAgB_43Vdm8TXwgzaEL5pZi40pY0-w/export?format=csv&gid=0"

# Keywords mapping for Hebrew AI suggestions
KEYWORD_MAPPINGS = {
    # Family and children
    'ילדים': ['ילדים', 'ילד', 'ילדה', 'משפחה', 'הורים', 'חינוך'],
    'משפחה': ['משפחה', 'ילדים', 'הורים', 'זוג', 'נישואין'],
    'הורים': ['הורים', 'אמא', 'אבא', 'ילדים', 'משפחה'],
    
    # Business and employment
    'עסק': ['עסק', 'עסקים', 'עצמאי', 'עצמאים', 'מעסיק', 'עובד', 'תעסוקה'],
    'עבודה': ['עבודה', 'תעסוקה', 'עובד', 'מעסיק', 'משכורת', 'פיטורין'],
    'עצמאי': ['עצמאי', 'עצמאים', 'עסק', 'עסקים', 'פרילנסר'],
    
    # Health and disability
    'בריאות': ['בריאות', 'רפואה', 'רופא', 'בית חולים', 'מחלה', 'טיפול'],
    'נכות': ['נכות', 'נכה', 'נפגע', 'פגיעה', 'נכים', 'נגישות'],
    'נפש': ['נפש', 'נפשי', 'פסיכולוגי', 'דיכאון', 'חרדה', 'טיפול נפשי'],
    
    # Housing and property
    'דיור': ['דיור', 'בית', 'דירה', 'שכירות', 'משכנתא', 'מגורים'],
    'בית': ['בית', 'דירה', 'דיור', 'מגורים', 'נדלן', 'נזק'],
    
    # Financial assistance
    'כסף': ['כסף', 'כספי', 'תשלום', 'מענק', 'הלוואה', 'סיוע כלכלי'],
    'מענק': ['מענק', 'תמיכה', 'סיוע', 'כסף', 'תשלום'],
    'הלוואה': ['הלוואה', 'אשראי', 'כסף', 'מימון', 'בנק'],
    
    # Emergency and war-related
    'מלחמה': ['מלחמה', 'חירום', 'פגיעה', 'נפגע', 'מילואים', 'ביטחון'],
    'חירום': ['חירום', 'מלחמה', 'אסון', 'פגיעה', 'נפגע'],
    'מילואים': ['מילואים', 'מילואימניק', 'צבא', 'שירות', 'חירום'],
    
    # Women and gender
    'נשים': ['נשים', 'אישה', 'נשי', 'אמהות', 'מגדר'],
    'אישה': ['אישה', 'נשים', 'נשי', 'אמא', 'מגדר'],
    
    # Elderly
    'קשישים': ['קשישים', 'קשיש', 'זקנים', 'גיל שלישי', 'פנסיה'],
    'פנסיה': ['פנסיה', 'פנסיונר', 'קשישים', 'זקנה', 'גמלאות'],
    
    # Legal and rights
    'זכויות': ['זכויות', 'חוק', 'משפט', 'תביעה', 'הגנה'],
    'תביעה': ['תביעה', 'תביעות', 'משפט', 'פיצוי', 'זכויות'],
    
    # Education
    'חינוך': ['חינוך', 'לימודים', 'בית ספר', 'סטודנט', 'השכלה'],
    'לימודים': ['לימודים', 'חינוך', 'סטודנט', 'אוניברסיטה', 'השכלה'],
}

def get_benefits_data():
    """Fetch benefits data from Google Sheets"""
    try:
        response = requests.get(GOOGLE_SHEETS_URL)
        response.raise_for_status()
        response.encoding = 'utf-8'
        
        csv_data = response.text
        lines = csv_data.split('\n')
        
        # Find the header row
        header_row_index = -1
        for i, line in enumerate(lines):
            if 'Post ID' in line:
                header_row_index = i
                break
        
        if header_row_index == -1:
            return []
        
        csv_content = '\n'.join(lines[header_row_index:])
        csv_reader = csv.reader(io.StringIO(csv_content))
        
        # Skip headers
        next(csv_reader)
        
        benefits = []
        for row in csv_reader:
            if not any(row) or len(row) < 8 or not row[0].strip():
                continue
                
            benefit = {
                'id': row[0].strip() if len(row) > 0 else '',
                'targetAudience': row[1].strip() if len(row) > 1 else '',  # למי זה
                'category': row[2].strip() if len(row) > 2 else '',        # קטגוריה
                'subcategory': row[3].strip() if len(row) > 3 else '',     # תת קטגוריה
                'organization': row[4].strip() if len(row) > 4 else '',    # שם המשרד/הארגון
                'detailsLink': row[5].strip() if len(row) > 5 else '',     # לינק לפרטים
                'lastUpdated': row[6].strip() if len(row) > 6 else '',     # מתי עודכן
                'details': row[7].strip() if len(row) > 7 else '',         # פרטים (האותיות הקטנות)
                # Additional metadata
                'hebrewFieldNames': {
                    'targetAudience': 'למי זה',
                    'category': 'קטגוריה',
                    'subcategory': 'תת קטגוריה',
                    'organization': 'שם המשרד/הארגון',
                    'detailsLink': 'לינק לפרטים',
                    'lastUpdated': 'מתי עודכן',
                    'details': 'פרטים'
                }
            }
            
            if benefit['id'] and (benefit['organization'] or benefit['details']):
                benefits.append(benefit)
        
        return benefits
    except Exception as e:
        print(f"Error fetching benefits data: {e}")
        return []

def extract_keywords(text):
    """Extract relevant keywords from Hebrew text"""
    text = text.lower().strip()
    found_keywords = set()
    
    # Direct keyword matching
    for keyword, synonyms in KEYWORD_MAPPINGS.items():
        for synonym in synonyms:
            if synonym in text:
                found_keywords.add(keyword)
    
    return list(found_keywords)

def score_benefit_relevance(benefit, keywords, query):
    """Score how relevant a benefit is to the user query"""
    score = 0
    query_lower = query.lower()
    
    # Check for keyword matches in different fields
    searchable_text = f"{benefit['organization']} {benefit['details']} {benefit['category']} {benefit['targetAudience']}".lower()
    
    # Direct query match (highest score)
    if query_lower in searchable_text:
        score += 10
    
    # Keyword matches
    for keyword in keywords:
        if keyword in searchable_text:
            score += 5
        
        # Check synonyms
        if keyword in KEYWORD_MAPPINGS:
            for synonym in KEYWORD_MAPPINGS[keyword]:
                if synonym in searchable_text:
                    score += 3
    
    # Category relevance
    category_lower = benefit['category'].lower()
    for keyword in keywords:
        if keyword in category_lower:
            score += 4
    
    # Target audience relevance
    audience_lower = benefit['targetAudience'].lower()
    for keyword in keywords:
        if keyword in audience_lower:
            score += 3
    
    return score

@ai_bp.route('/suggest', methods=['POST'])
@cross_origin()
def get_ai_suggestions():
    """Get AI-powered suggestions based on user query"""
    try:
        data = request.get_json()
        user_query = data.get('query', '').strip()
        
        if not user_query:
            return jsonify({
                'success': False,
                'error': 'Query is required'
            }), 400
        
        # Get all benefits
        benefits = get_benefits_data()
        if not benefits:
            return jsonify({
                'success': False,
                'error': 'Could not fetch benefits data'
            }), 500
        
        # Extract keywords from user query
        keywords = extract_keywords(user_query)
        
        # Score and rank benefits
        scored_benefits = []
        for benefit in benefits:
            score = score_benefit_relevance(benefit, keywords, user_query)
            if score > 0:
                scored_benefits.append({
                    'benefit': benefit,
                    'score': score
                })
        
        # Sort by score (highest first) and limit to top 5
        scored_benefits.sort(key=lambda x: x['score'], reverse=True)
        top_suggestions = [item['benefit'] for item in scored_benefits[:5]]
        
        # Generate explanation
        explanation = generate_explanation(user_query, keywords, len(top_suggestions))
        
        return jsonify({
            'success': True,
            'query': user_query,
            'keywords': keywords,
            'suggestions': top_suggestions,
            'explanation': explanation,
            'total_found': len(scored_benefits)
        }), 200, {'Content-Type': 'application/json; charset=utf-8'}
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Error generating suggestions: {str(e)}'
        }), 500

def generate_explanation(query, keywords, num_suggestions):
    """Generate a helpful explanation for the AI suggestions"""
    if num_suggestions == 0:
        return f"לא מצאתי שירותים רלוונטיים לשאלה '{query}'. נסו לחפש במילים אחרות או בדקו את הקטגוריות השונות."
    
    keyword_text = ", ".join(keywords) if keywords else "המילים שלכם"
    
    if num_suggestions == 1:
        return f"מצאתי שירות אחד רלוונטי לשאלה שלכם על {keyword_text}."
    else:
        return f"מצאתי {num_suggestions} שירותים רלוונטיים לשאלה שלכם על {keyword_text}. השירותים מסודרים לפי רלוונטיות."