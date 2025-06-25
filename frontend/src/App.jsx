import React, { useState, useEffect } from 'react'
import { Search, X, ExternalLink, Calendar, Users, Tag } from 'lucide-react'
import BenefitCard from './components/BenefitCard'
import BenefitModal from './components/BenefitModal'
import CategoryFilter from './components/CategoryFilter'
import SearchBar from './components/SearchBar'

function App() {
  const [benefits, setBenefits] = useState([])
  const [categories, setCategories] = useState([])
  const [selectedCategory, setSelectedCategory] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [selectedBenefit, setSelectedBenefit] = useState(null)
  const [showModal, setShowModal] = useState(false)

  // Fetch categories on component mount
  useEffect(() => {
    fetchCategories()
  }, [])

  // Fetch benefits when category or search changes
  useEffect(() => {
    fetchBenefits()
  }, [selectedCategory, searchQuery])

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories')
      const data = await response.json()
      if (data.success) {
        setCategories(data.categories)
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }

  const fetchBenefits = async () => {
    setLoading(true)
    try {
      let url = '/api/benefits/enhanced'
      const params = new URLSearchParams()
      
      if (selectedCategory) params.append('category', selectedCategory)
      if (searchQuery) params.append('q', searchQuery)
      
      if (params.toString()) {
        url = `/api/benefits/search?${params.toString()}`
      }

      const response = await fetch(url)
      const data = await response.json()
      
      if (data.success) {
        setBenefits(data.data)
      }
    } catch (error) {
      console.error('Error fetching benefits:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchBenefitDetails = async (benefitId) => {
    try {
      const response = await fetch(`/api/benefits/${benefitId}`)
      const data = await response.json()
      if (data.success) {
        setSelectedBenefit(data.benefit)
        setShowModal(true)
      }
    } catch (error) {
      console.error('Error fetching benefit details:', error)
    }
  }

  const handleCategoryChange = (category) => {
    setSelectedCategory(category === selectedCategory ? '' : category)
  }

  const handleSearchChange = (query) => {
    setSearchQuery(query)
  }

  const handleReadMore = (benefitId) => {
    fetchBenefitDetails(benefitId)
  }

  const closeModal = () => {
    setShowModal(false)
    setSelectedBenefit(null)
  }

  return (
    <div className="min-h-screen bg-gray-50 rtl">
      {/* Header */}
      <header className="bg-white clean-border-thick clean-shadow-lg mb-8">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-8">
          <div className="text-center">
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4 sm:mb-6 leading-tight">
              הקלות והטבות בעקבות מבצע עם כלביא
            </h1>
            <div className="max-w-4xl mx-auto">
              <p className="text-base sm:text-lg md:text-xl text-gray-700 leading-relaxed mb-3 sm:mb-4 px-2">
                מאגר הטבות והקלות לטובת הקהילה, על מנת לדעת בקלות "מה מגיע למי ואיך מקבלים מידע נוסף"
              </p>
              <p className="text-sm sm:text-base md:text-lg text-gray-600 px-2">
                כאן תמצאו מידע מרוכז על כל ההטבות והשירותים הזמינים לכם - מהממשלה, מארגונים וממוסדות שונים
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Search Section */}
      <section className="mb-6 sm:mb-8 px-3 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-lg sm:text-xl md:text-2xl font-semibold text-gray-900 mb-3 sm:mb-4 text-center">
            חיפוש
          </h2>
          <SearchBar 
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder="הקלידו כאן מה אתם מחפשים..."
          />
        </div>
      </section>

      {/* Categories Section */}
      <section className="mb-6 sm:mb-8 px-3 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-lg sm:text-xl md:text-2xl font-semibold text-gray-900 mb-3 sm:mb-4 text-center">
            קטגוריות
          </h2>
          {/* Static Shell - This div has all the responsive classes it will ever need */}
          <div 
            id="category-grid" 
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 text-center"
          >
            {/* This div should be empty. JavaScript will fill it. */}
          </div>
          <CategoryFilter
            categories={categories}
            selectedCategory={selectedCategory}
            onCategoryChange={handleCategoryChange}
          />
        </div>
      </section>

      {/* Results Section */}
      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pb-8 sm:pb-12">
        {/* Results Header */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 bg-white clean-border rounded-lg p-6 clean-shadow">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4 md:mb-0">
            {searchQuery ? `תוצאות חיפוש עבור "${searchQuery}"` :
             selectedCategory ? `הטבות בקטגוריה "${selectedCategory}"` :
             'כל ההטבות'}
          </h2>
          {!loading && (
            <div className="bg-calm-blue text-white px-4 py-2 rounded-lg font-semibold">
              {benefits.length} תוצאות
            </div>
          )}
        </div>

        {/* Active Filters */}
        {(selectedCategory || searchQuery) && (
          <div className="flex flex-wrap gap-2 mb-6">
            {selectedCategory && (
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800">
                <Tag size={14} />
                {selectedCategory}
                <button
                  onClick={() => setSelectedCategory('')}
                  className="hover:bg-blue-200 rounded-full p-0.5"
                >
                  <X size={12} />
                </button>
              </span>
            )}
            {searchQuery && (
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm bg-green-100 text-green-800">
                <Search size={14} />
                {searchQuery}
                <button
                  onClick={() => setSearchQuery('')}
                  className="hover:bg-green-200 rounded-full p-0.5"
                >
                  <X size={12} />
                </button>
              </span>
            )}
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="calm-loading rounded-full h-12 w-12 border-4 border-calm-blue border-t-transparent"></div>
            <span className="mr-4 text-lg text-gray-600">טוען...</span>
          </div>
        ) : (
          /* Benefits Grid */
          benefits.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {benefits.map((benefit) => (
                <BenefitCard
                  key={benefit.id}
                  benefit={benefit}
                  onReadMore={() => handleReadMore(benefit.id)}
                />
              ))}
            </div>
          ) : (
            /* Empty State */
            <div className="text-center py-20 bg-white clean-border rounded-lg clean-shadow">
              <div className="text-6xl mb-4 text-gray-300">🔍</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                לא נמצאו תוצאות
              </h3>
              <p className="text-gray-600">
                נסו לשנות את מילות החיפוש או את הקטגוריה שנבחרה
              </p>
            </div>
          )
        )}
      </main>

      {/* Benefit Modal */}
      {showModal && selectedBenefit && (
        <BenefitModal
          benefit={selectedBenefit}
          onClose={closeModal}
        />
      )}

      {/* Footer with Credits */}
      <footer className="bg-white clean-border-thick clean-shadow-lg mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid md:grid-cols-2 gap-8">
            {/* Data Credit */}
            <div className="text-center md:text-right">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                📊 מאגר המידע
              </h3>
              <p className="text-gray-700 mb-3">
                מאגר המידע נבנה ומתעדכן על ידי מוֹרָן תְּסַדֵּר
              </p>
              <div className="flex flex-wrap justify-center md:justify-start gap-3">
                <a
                  href="https://t.me/haravotbe"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="clean-btn bg-blue-500 text-white hover:bg-blue-600 clean-focus"
                >
                  📱 טלגרם
                </a>
                <a
                  href="https://www.facebook.com/moranfixit/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="clean-btn bg-blue-600 text-white hover:bg-blue-700 clean-focus"
                >
                  📘 פייסבוק
                </a>
                <a
                  href="https://wa.me/972524244298"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="clean-btn bg-green-500 text-white hover:bg-green-600 clean-focus"
                >
                  💬 וואטסאפ
                </a>
              </div>
            </div>

            {/* Development Credit */}
            <div className="text-center md:text-left">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                💻 פיתוח האתר
              </h3>
              <p className="text-gray-700 mb-3">
                האתר פותח על ידי אסף עקיבא
              </p>
              <a
                href="https://www.linkedin.com/in/assafakiva"
                target="_blank"
                rel="noopener noreferrer"
                className="clean-btn bg-blue-700 text-white hover:bg-blue-800 clean-focus"
              >
                💼 לינקדאין
              </a>
            </div>
          </div>

          {/* Divider and Final Note */}
          <div className="border-t border-gray-200 pt-6 mt-6 text-center">
            <p className="text-gray-500 text-sm">
              🤝 פרויקט קהילתי למען הציבור - מידע מעודכן ונגיש לכל אזרח
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default App