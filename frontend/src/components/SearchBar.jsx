import React from 'react'
import { Search, X } from 'lucide-react'

const SearchBar = ({ value, onChange, placeholder }) => {
  return (
    <div className="relative max-w-2xl mx-auto">
      <div className="relative">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="border-2 border-gray-300 focus:border-calm-blue focus:outline-none block w-full px-4 py-4 sm:py-3 rounded-lg bg-white text-gray-900 placeholder-gray-500 text-right text-base sm:text-sm touch-manipulation"
          dir="rtl"
        />
        {value && (
          <button
            onClick={() => onChange('')}
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 active:text-gray-600 p-2 touch-manipulation"
          >
            <X size={16} />
          </button>
        )}
      </div>
      <div className="mt-2 text-xs sm:text-sm text-gray-500 text-center px-2">
        חפשו לפי מילות מפתח, שם ארגון, או סוג השירות
      </div>
    </div>
  )
}

export default SearchBar