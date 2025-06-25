import React from 'react'
import { ExternalLink, Calendar, Users } from 'lucide-react'

const BenefitCard = ({ benefit, onReadMore }) => {
  const {
    organization,
    category,
    subcategory,
    detailsTruncated,
    hasMoreDetails,
    targetAudienceDisplayed,
    hasMoreAudience,
    additionalAudienceCount,
    detailsLink,
    lastUpdated
  } = benefit;

  return (
    <div className="clean-card p-6 clean-hover">
      {/* Header */}
      <div className="mb-4">
        <h3 className="text-xl font-semibold text-gray-900 mb-3">
          {organization}
        </h3>
        
        {/* Categories */}
        <div className="flex flex-wrap gap-2 mb-3">
          {category && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-calm-blue text-white">
              {category}
            </span>
          )}
          {subcategory && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-calm-green text-white">
              {subcategory}
            </span>
          )}
        </div>

        {/* Last Updated */}
        {lastUpdated && (
          <div className="text-sm text-gray-500 mb-3 flex items-center gap-1">
            <Calendar size={14} />
            עודכן: {lastUpdated}
          </div>
        )}
      </div>

      {/* Description */}
      <div className="mb-4">
        <p className="text-gray-700 leading-relaxed mb-3">
          {detailsTruncated}
        </p>
        
        {hasMoreDetails && (
          <button
            onClick={onReadMore}
            className="clean-btn bg-calm-blue text-white hover:bg-blue-600 clean-focus"
          >
            קרא עוד
          </button>
        )}
      </div>

      {/* Target Audience */}
      {targetAudienceDisplayed && targetAudienceDisplayed.length > 0 && (
        <div className="mb-4">
          <div className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
            <Users size={14} />
            קהל יעד:
          </div>
          
          <div className="flex flex-wrap gap-2">
            {targetAudienceDisplayed.map((audience, index) => (
              <span
                key={index}
                className="px-3 py-1 rounded-full text-sm bg-gray-100 text-gray-700 border border-gray-200"
              >
                {audience}
              </span>
            ))}
            
            {hasMoreAudience && additionalAudienceCount > 0 && (
              <span className="px-3 py-1 rounded-full text-sm bg-gray-200 text-gray-600 font-medium">
                +{additionalAudienceCount} נוספים
              </span>
            )}
          </div>
        </div>
      )}

      {/* Action Button */}
      {detailsLink && (
        <div className="pt-4 border-t border-gray-200">
          <a
            href={detailsLink}
            target="_blank"
            rel="noopener noreferrer"
            className="clean-btn bg-gray-900 text-white hover:bg-gray-800 w-full text-center clean-focus flex items-center justify-center gap-2"
          >
            <ExternalLink size={16} />
            מעבר לשירות
          </a>
        </div>
      )}
    </div>
  )
}

export default BenefitCard