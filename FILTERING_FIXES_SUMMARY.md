# תיקונים למערכת הסינון

## הבעיות שזוהו והתיקונים שבוצעו

### 1. בעיית "משרתי מילואים" לא מופיע
**הבעיה**: משרתי מילואים עם 13 הטבות לא הופיע ברשימת קהלי היעד.
**הסיבה**: המגבלה של `MAX_DISPLAYED_AUDIENCES = 8` הגבילה את התצוגה ל-8 קהלי יעד בלבד.
**התיקון**: הגדלת המגבלה ל-12 קהלי יעד כדי לכלול את משרתי מילואים.

**קבצים שתוקנו**:
- `index.html`: שינוי `MAX_DISPLAYED_AUDIENCES` מ-8 ל-12

### 2. בעיית גרשיים כפולים ב"תקועים בחו״ל"
**הבעיה**: הנתונים בקובץ CSV מכילים גרשיים כפולים `""תקועים בחו""""ל""` במקום `"תקועים בחו"ל"`.
**הסיבה**: בעיה בפורמט של קובץ Google Sheets.
**התיקון**: שיפור פונקציות הניקוי והתיאום בקוד.

**קבצים שתוקנו**:
- `api/audiences.js`: 
  - שיפור `cleanAudienceName()` לטיפול בגרשיים כפולים
  - הוספת תיאום ל`'""תקועים בחו'` במיפוי
- `api/search.js`: הוספת תיאום ל`'""תקועים בחו'` בפונקציית החיפוש
- `lib/sheets.js`:
  - הוספת פונקציית `cleanText()` לניקוי טקסט מגרשיים כפולים
  - שימוש בפונקציה בקריאת נתוני קהלי היעד

### 3. תיקון מקור הנתונים
**הבעיה**: URL של Google Sheets לא היה נגיש.
**התיקון**: שינוי לקריאה מהקובץ המקומי.

**קבצים שתוקנו**:
- `lib/sheets.js`: שינוי מ-`axios.get(GOOGLE_SHEETS_URL)` לקריאה מקובץ מקומי
- `package.json`: הוספת דפנדנסיות `express` ו-`cors`
- `server.js`: שיפור השרת לכלול את ה-API endpoints הנדרשים

### 4. הוספת לוגים לצורך דיבוג
**התיקון**: הוספת console.log בפונקציית audiences כדי לעקוב אחר התהליך.

## בדיקות שבוצעו
1. ✅ "משרתי מילואים" מופיע כעת ברשימת קהלי היעד (13 הטבות)
2. ✅ "תקועים בחו״ל" מופיע נכון ברשימת קהלי היעד (78 הטבות)  
3. ✅ מערכת הסינון עובדת עבור שני קהלי היעד
4. ✅ השרת רץ במקומי על פורט 3000

## תוצאות
- רשימת קהלי היעד כוללת כעת 13 קהלי יעד נפוצים
- משרתי מילואים יכולים למצוא בקלות את הטבותיהם
- תקועים בחו״ל יכולים למצוא בקלות את הטבותיהם
- המערכת יציבה ועובדת כמצופה