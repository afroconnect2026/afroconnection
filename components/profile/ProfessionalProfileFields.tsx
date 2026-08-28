import { Award, DollarSign, Languages, Calendar, FileText, ToggleLeft, ToggleRight } from 'lucide-react'

interface ProfessionalProfileFieldsProps {
  editMode: boolean
  data: any
  onChange: (field: string, value: string | boolean) => void
}

export default function ProfessionalProfileFields({ editMode, data, onChange }: ProfessionalProfileFieldsProps) {
  return (
    <div className="space-y-6">
      <h3 className="text-xl font-bold text-navy-900 flex items-center space-x-2">
        <Award className="h-5 w-5 text-blue-600" />
        <span>Professional Information</span>
      </h3>

      {/* Expertise */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Expertise / Skills
        </label>
        {editMode ? (
          <input
            type="text"
            value={data.expertise || ''}
            onChange={(e) => onChange('expertise', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            placeholder="e.g., Product Management, Marketing, Software Development"
          />
        ) : (
          <p className="text-gray-900">{data.expertise || 'Not specified'}</p>
        )}
        <p className="text-xs text-gray-500 mt-1">Comma-separated skills</p>
      </div>

      {/* Hourly Rate */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <DollarSign className="inline h-4 w-4 mr-1" />
          Hourly Rate (USD)
        </label>
        {editMode ? (
          <input
            type="number"
            value={data.hourly_rate || ''}
            onChange={(e) => onChange('hourly_rate', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            placeholder="e.g., 50"
          />
        ) : (
          <p className="text-gray-900">
            {data.hourly_rate ? `$${data.hourly_rate}/hour` : 'Not set'}
          </p>
        )}
      </div>

      {/* Years of Experience */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <Calendar className="inline h-4 w-4 mr-1" />
          Years of Experience
        </label>
        {editMode ? (
          <input
            type="number"
            value={data.years_of_experience || ''}
            onChange={(e) => onChange('years_of_experience', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            placeholder="e.g., 5"
          />
        ) : (
          <p className="text-gray-900">{data.years_of_experience || '0'} years</p>
        )}
      </div>

      {/* Languages */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <Languages className="inline h-4 w-4 mr-1" />
          Languages
        </label>
        {editMode ? (
          <input
            type="text"
            value={data.languages || ''}
            onChange={(e) => onChange('languages', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            placeholder="e.g., English, French, Swahili"
          />
        ) : (
          <p className="text-gray-900">{data.languages || 'Not specified'}</p>
        )}
      </div>

      {/* Certifications */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <FileText className="inline h-4 w-4 mr-1" />
          Certifications
        </label>
        {editMode ? (
          <textarea
            value={data.certifications || ''}
            onChange={(e) => onChange('certifications', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            rows={3}
            placeholder="List your certifications (one per line)"
          />
        ) : (
          <p className="text-gray-900 whitespace-pre-line">{data.certifications || 'No certifications listed'}</p>
        )}
      </div>

      {/* Availability */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Availability Status
        </label>
        {editMode ? (
          <div className="flex items-center space-x-4">
            <button
              type="button"
              onClick={() => onChange('is_available', true)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg border-2 transition-colors ${
                data.is_available
                  ? 'border-green-500 bg-green-50 text-green-700'
                  : 'border-gray-300 bg-white text-gray-700'
              }`}
            >
              <ToggleRight className="h-5 w-5" />
              <span>Available for Work</span>
            </button>
            <button
              type="button"
              onClick={() => onChange('is_available', false)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg border-2 transition-colors ${
                !data.is_available
                  ? 'border-gray-500 bg-gray-50 text-gray-700'
                  : 'border-gray-300 bg-white text-gray-700'
              }`}
            >
              <ToggleLeft className="h-5 w-5" />
              <span>Unavailable</span>
            </button>
          </div>
        ) : (
          <p className="text-gray-900">
            {data.is_available ? (
              <span className="text-green-600 font-medium">✓ Available for Work</span>
            ) : (
              <span className="text-gray-600">Currently Unavailable</span>
            )}
          </p>
        )}
      </div>

      {/* Available For */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Available For
        </label>
        {editMode ? (
          <input
            type="text"
            value={data.available_for || ''}
            onChange={(e) => onChange('available_for', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            placeholder="e.g., Consulting, Mentorship, Full-time, Part-time"
          />
        ) : (
          <p className="text-gray-900">{data.available_for || 'Not specified'}</p>
        )}
      </div>
    </div>
  )
}
