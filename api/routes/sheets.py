import requests
import csv
import io
from flask import Blueprint, jsonify, request
from flask_cors import cross_origin

sheets_bp = Blueprint('sheets', __name__)

# Google Sheets URL - convert to CSV export format
GOOGLE_SHEETS_URL = "https://docs.google.com/spreadsheets/d/1-OhoadrXgz-FJZAgB_43Vdm8TXwgzaEL5pZi40pY0-w/export?format=csv&gid=0"

@sheets_bp.route('/benefits', methods=['GET'])
@cross_origin()
def get_benefits():
    """Fetch all benefits data from Google Sheets"""
    try:
        # Fetch the CSV data from Google Sheets with proper encoding
        response = requests.get(GOOGLE_SHEETS_URL)
        response.raise_for_status()
        response.encoding = 'utf-8'  # Ensure UTF-8 encoding
        
        # Parse CSV data
        csv_data = response.text
        lines = csv_data.split('\n')
        
        # Find the header row (contains "Post ID")
        header_row_index = -1
        for i, line in enumerate(lines):
            if 'Post ID' in line:
                header_row_index = i
                break
        
        if header_row_index == -1:
            return jsonify({
                'success': False,
                'error': 'Could not find header row in CSV data'
            }), 500
        
        # Extract data starting from header row
        csv_content = '\n'.join(lines[header_row_index:])
        csv_reader = csv.reader(io.StringIO(csv_content))
        
        # Get headers
        headers = next(csv_reader)
        
        benefits = []
        for row in csv_reader:
            # Skip empty rows
            if not any(row) or len(row) < 8:
                continue
                
            # Skip rows without Post ID
            if not row[0].strip():
                continue
                
            # Map the CSV columns by index with proper Hebrew field understanding
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
            
            # Only add benefits that have essential information
            if benefit['id'] and (benefit['organization'] or benefit['details']):
                benefits.append(benefit)
        
        return jsonify({
            'success': True,
            'data': benefits,
            'count': len(benefits)
        }), 200, {'Content-Type': 'application/json; charset=utf-8'}
        
    except requests.RequestException as e:
        return jsonify({
            'success': False,
            'error': f'Failed to fetch data from Google Sheets: {str(e)}'
        }), 500
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Error processing data: {str(e)}'
        }), 500

@sheets_bp.route('/benefits/search', methods=['GET'])
@cross_origin()
def search_benefits():
    """Search benefits with query parameters"""
    try:
        # Get query parameters
        search_query = request.args.get('q', '').lower()
        category_filter = request.args.get('category', '')
        audience_filter = request.args.get('audience', '')
        
        # Fetch all benefits first
        response = requests.get(GOOGLE_SHEETS_URL)
        response.raise_for_status()
        response.encoding = 'utf-8'  # Ensure UTF-8 encoding
        
        csv_data = response.text
        lines = csv_data.split('\n')
        
        # Find the header row
        header_row_index = -1
        for i, line in enumerate(lines):
            if 'Post ID' in line:
                header_row_index = i
                break
        
        if header_row_index == -1:
            return jsonify({
                'success': False,
                'error': 'Could not find header row in CSV data'
            }), 500
        
        csv_content = '\n'.join(lines[header_row_index:])
        csv_reader = csv.reader(io.StringIO(csv_content))
        
        # Skip headers
        next(csv_reader)
        
        benefits = []
        for row in csv_reader:
            if not any(row) or len(row) < 8 or not row[0].strip():
                continue
            
            # Map the CSV columns with enhanced display features
            details_full = row[7].strip() if len(row) > 7 else ''
            details_truncated = details_full[:200] + "..." if len(details_full) > 200 else details_full
            
            target_audience_full = row[1].strip() if len(row) > 1 else ''
            target_audience_array = [
                audience.strip() 
                for audience in target_audience_full.split(',') 
                if audience.strip()
            ]
                
            benefit = {
                'id': row[0].strip() if len(row) > 0 else '',
                'targetAudience': target_audience_full,
                'category': row[2].strip() if len(row) > 2 else '',
                'subcategory': row[3].strip() if len(row) > 3 else '',
                'organization': row[4].strip() if len(row) > 4 else '',
                'detailsLink': row[5].strip() if len(row) > 5 else '',
                'lastUpdated': row[6].strip() if len(row) > 6 else '',
                'details': details_full,
                # Enhanced display features
                'detailsTruncated': details_truncated,
                'hasMoreDetails': len(details_full) > 200,
                'targetAudienceArray': target_audience_array,
                'targetAudienceDisplayed': target_audience_array[:3],  # Show first 3
                'hasMoreAudience': len(target_audience_array) > 3,
                'additionalAudienceCount': max(0, len(target_audience_array) - 3),
                # Hebrew field names for frontend
                'hebrewFieldNames': {
                    'targetAudience': 'קהל יעד',
                    'category': 'קטגוריה', 
                    'subcategory': 'תת קטגוריה',
                    'organization': 'ארגון',
                    'detailsLink': 'מעבר לשירות',
                    'lastUpdated': 'עודכן',
                    'details': 'פרטים'
                }
            }
            
            if benefit['id'] and (benefit['organization'] or benefit['details']):
                # Apply filters
                matches = True
                
                # Search query filter
                if search_query:
                    searchable_text = f"{benefit['organization']} {benefit['details']} {benefit['category']} {benefit['targetAudience']}".lower()
                    if search_query not in searchable_text:
                        matches = False
                
                # Category filter
                if category_filter and category_filter != benefit['category']:
                    matches = False
                
                # Audience filter
                if audience_filter and audience_filter not in benefit['targetAudience']:
                    matches = False
                
                if matches:
                    benefits.append(benefit)
        
        return jsonify({
            'success': True,
            'data': benefits,
            'count': len(benefits),
            'filters': {
                'search': search_query,
                'category': category_filter,
                'audience': audience_filter
            }
        }), 200, {'Content-Type': 'application/json; charset=utf-8'}
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Error searching benefits: {str(e)}'
        }), 500

@sheets_bp.route('/categories', methods=['GET'])
@cross_origin()
def get_categories():
    """Get all available categories with counts"""
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
            return jsonify({
                'success': False,
                'error': 'Could not find header row in CSV data'
            }), 500
        
        csv_content = '\n'.join(lines[header_row_index:])
        csv_reader = csv.reader(io.StringIO(csv_content))
        
        # Skip headers
        next(csv_reader)
        
        categories = {}
        for row in csv_reader:
            if not any(row) or len(row) < 8 or not row[0].strip():
                continue
                
            category = row[2].strip() if len(row) > 2 else ''
            if category and category != '':
                if category in categories:
                    categories[category] += 1
                else:
                    categories[category] = 1
        
        # Convert to sorted list
        category_list = [
            {'name': cat, 'count': count} 
            for cat, count in categories.items()
        ]
        category_list.sort(key=lambda x: x['count'], reverse=True)
        
        return jsonify({
            'success': True,
            'categories': category_list,
            'total_categories': len(category_list)
        }), 200, {'Content-Type': 'application/json; charset=utf-8'}
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Error fetching categories: {str(e)}'
        }), 500

@sheets_bp.route('/benefits/<benefit_id>', methods=['GET'])
@cross_origin()
def get_benefit_details(benefit_id):
    """Get full details for a specific benefit"""
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
            return jsonify({
                'success': False,
                'error': 'Could not find header row in CSV data'
            }), 500
        
        csv_content = '\n'.join(lines[header_row_index:])
        csv_reader = csv.reader(io.StringIO(csv_content))
        
        # Skip headers
        next(csv_reader)
        
        for row in csv_reader:
            if not any(row) or len(row) < 8:
                continue
                
            if row[0].strip() == str(benefit_id):
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
                    },
                    # Parse target audience into array
                    'targetAudienceArray': [
                        audience.strip() 
                        for audience in row[1].split(',') 
                        if row[1] and audience.strip()
                    ] if len(row) > 1 else []
                }
                
                return jsonify({
                    'success': True,
                    'benefit': benefit
                }), 200, {'Content-Type': 'application/json; charset=utf-8'}
        
        return jsonify({
            'success': False,
            'error': 'Benefit not found'
        }), 404
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Error fetching benefit details: {str(e)}'
        }), 500

@sheets_bp.route('/benefits/enhanced', methods=['GET'])
@cross_origin()
def get_enhanced_benefits():
    """Fetch all benefits with enhanced display info for frontend"""
    try:
        # Fetch the CSV data from Google Sheets with proper encoding
        response = requests.get(GOOGLE_SHEETS_URL)
        response.raise_for_status()
        response.encoding = 'utf-8'
        
        # Parse CSV data
        csv_data = response.text
        lines = csv_data.split('\n')
        
        # Find the header row (contains "Post ID")
        header_row_index = -1
        for i, line in enumerate(lines):
            if 'Post ID' in line:
                header_row_index = i
                break
        
        if header_row_index == -1:
            return jsonify({
                'success': False,
                'error': 'Could not find header row in CSV data'
            }), 500
        
        # Extract data starting from header row
        csv_content = '\n'.join(lines[header_row_index:])
        csv_reader = csv.reader(io.StringIO(csv_content))
        
        # Get headers
        headers = next(csv_reader)
        
        benefits = []
        for row in csv_reader:
            # Skip empty rows
            if not any(row) or len(row) < 8:
                continue
                
            # Skip rows without Post ID
            if not row[0].strip():
                continue
                
            # Map the CSV columns with enhanced display features
            details_full = row[7].strip() if len(row) > 7 else ''
            details_truncated = details_full[:200] + "..." if len(details_full) > 200 else details_full
            
            target_audience_full = row[1].strip() if len(row) > 1 else ''
            target_audience_array = [
                audience.strip() 
                for audience in target_audience_full.split(',') 
                if audience.strip()
            ]
            
            benefit = {
                'id': row[0].strip() if len(row) > 0 else '',
                'targetAudience': target_audience_full,
                'category': row[2].strip() if len(row) > 2 else '',
                'subcategory': row[3].strip() if len(row) > 3 else '',
                'organization': row[4].strip() if len(row) > 4 else '',
                'detailsLink': row[5].strip() if len(row) > 5 else '',
                'lastUpdated': row[6].strip() if len(row) > 6 else '',
                'details': details_full,
                # Enhanced display features
                'detailsTruncated': details_truncated,
                'hasMoreDetails': len(details_full) > 200,
                'targetAudienceArray': target_audience_array,
                'targetAudienceDisplayed': target_audience_array[:3],  # Show first 3
                'hasMoreAudience': len(target_audience_array) > 3,
                'additionalAudienceCount': max(0, len(target_audience_array) - 3),
                # Hebrew field names for frontend
                'hebrewFieldNames': {
                    'targetAudience': 'קהל יעד',
                    'category': 'קטגוריה', 
                    'subcategory': 'תת קטגוריה',
                    'organization': 'ארגון',
                    'detailsLink': 'מעבר לשירות',
                    'lastUpdated': 'עודכן',
                    'details': 'פרטים'
                }
            }
            
            # Only add benefits that have essential information
            if benefit['id'] and (benefit['organization'] or benefit['details']):
                benefits.append(benefit)
        
        return jsonify({
            'success': True,
            'data': benefits,
            'count': len(benefits)
        }), 200, {'Content-Type': 'application/json; charset=utf-8'}
        
    except requests.RequestException as e:
        return jsonify({
            'success': False,
            'error': f'Failed to fetch data from Google Sheets: {str(e)}'
        }), 500
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Error processing data: {str(e)}'
        }), 500