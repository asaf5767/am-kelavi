import React, { useEffect } from 'react'
import { Tag } from 'lucide-react'

const CategoryFilter = ({ categories, selectedCategory, onCategoryChange }) => {
  // Use the Static Shell pattern - populate the existing grid container
  useEffect(() => {
    const categoryGrid = document.getElementById('category-grid');
    
    if (categoryGrid && categories.length > 0) {
      // Icon mapping for categories
      const categoryIcons = {
        'זכויות': '⚖️',
        'מידע': '📋',
        'כניסה/יציאה מישראל': '✈️',
        'בנקים': '🏦',
        'הגשת תביעה': '📝',
        'טיפול נפשי': '🧠',
        'קבלת קהל': '👥',
        'עבודה במלחמה': '💼',
        'עזרה הדדית': '🤝',
        'חינמי': '🆓',
        'רפואי': '🏥',
        'זכויות והטבות לעסקים/עצמאיים': '🏢',
        'עוקץ': '⚠️',
        'זכויות מס': '💰',
        'תלונות': '📢',
        'סיוע משפטי': '⚖️'
      };

      // Generate ONLY the HTML for the buttons
      const buttonsHtml = [
        // "All" button
        `<button data-category="" class="${
          selectedCategory === ''
            ? 'bg-calm-blue text-white border-calm-blue'
            : 'bg-white text-gray-800 border-gray-200 hover:border-blue-300 hover:bg-blue-50'
        } p-3 sm:p-4 rounded-lg sm:rounded-xl flex flex-col items-center justify-center aspect-square border-2 min-h-[80px] sm:min-h-[100px] touch-manipulation transition-all duration-200">
          <span class="text-2xl sm:text-3xl mb-1 sm:mb-2">🌟</span>
          <span class="font-medium text-xs sm:text-sm text-center leading-tight">הכל</span>
        </button>`,
        
        // Category buttons
        ...categories.map((category) => {
          const icon = categoryIcons[category.name] || '📁';
          return `<button data-category="${category.name}" class="${
            selectedCategory === category.name
              ? 'bg-calm-blue text-white border-calm-blue'
              : 'bg-white text-gray-800 border-gray-200 hover:border-blue-300 hover:bg-blue-50'
          } p-3 sm:p-4 rounded-lg sm:rounded-xl flex flex-col items-center justify-center aspect-square border-2 min-h-[80px] sm:min-h-[100px] touch-manipulation transition-all duration-200">
            <span class="text-2xl sm:text-3xl mb-1 sm:mb-2">${icon}</span>
            <span class="font-medium text-xs sm:text-sm text-center leading-tight px-1">${category.name}</span>
          </button>`;
        })
      ].join('');

      // Set the innerHTML of the existing shell
      categoryGrid.innerHTML = buttonsHtml;

      // Add click event listeners to the buttons
      const buttons = categoryGrid.querySelectorAll('button');
      buttons.forEach(button => {
        button.addEventListener('click', () => {
          const categoryName = button.dataset.category;
          onCategoryChange(categoryName);
        });
      });
    }
  }, [categories, selectedCategory, onCategoryChange]);

  // Return empty div since we're using the static shell
  return <div></div>;
}

export default CategoryFilter