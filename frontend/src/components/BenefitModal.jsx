import React, { useEffect } from 'react'
import { X, ExternalLink } from 'lucide-react'

const BenefitModal = ({ benefit, onClose }) => {
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-lg clean-shadow-lg max-w-4xl w-full max-h-[90vh] overflow-hidden clean-border">
        {/* Header */}
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-2xl font-semibold text-gray-900">
            {benefit.organization}
          </h2>
          <button
            onClick={onClose}
            className="clean-btn bg-gray-200 text-gray-700 hover:bg-gray-300 clean-focus flex items-center gap-2"
          >
            <X size={16} />
            סגור
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              פרטים מלאים
            </h3>
            <div className="prose prose-gray max-w-none text-gray-700 leading-relaxed whitespace-pre-line">
              {benefit.details}
            </div>
          </div>

          {benefit.targetAudienceArray && benefit.targetAudienceArray.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                קהל יעד
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {benefit.targetAudienceArray.map((audience, index) => (
                  <span
                    key={index}
                    className="px-3 py-2 rounded-lg text-sm bg-blue-50 text-blue-800 border border-blue-200"
                  >
                    {audience}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
          <div className="flex flex-col md:flex-row gap-3">
            {benefit.detailsLink && (
              <a
                href={benefit.detailsLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 clean-btn bg-calm-blue text-white hover:bg-blue-600 text-center clean-focus flex items-center justify-center gap-2"
              >
                <ExternalLink size={16} />
                מעבר לשירות
              </a>
            )}
            <button
              onClick={onClose}
              className="clean-btn bg-gray-200 text-gray-700 hover:bg-gray-300 clean-focus"
            >
              סגור
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default BenefitModal