import { Building2, Users, Calendar, Briefcase, Target } from 'lucide-react'

interface CompanyProfileFieldsProps {
  editMode: boolean
  data: any
  onChange: (field: string, value: string) => void
}

export default function CompanyProfileFields({ editMode, data, onChange }: CompanyProfileFieldsProps) {
  return (
    <div className="space-y-6">
      <h3 className="text-xl font-bold text-navy-900 flex items-center space-x-2">
        <Building2 className="h-5 w-5 text-purple-600" />
        <span>Company Information</span>
      </h3>

      {/* Company Name */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Company Name
        </label>
        {editMode ? (
          <input
            type="text"
            value={data.company_name || ''}
            onChange={(e) => onChange('company_name', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            placeholder="Your company name"
          />
        ) : (
          <p className="text-gray-900">{data.company_name || 'Not specified'}</p>
        )}
      </div>

      {/* Industry */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <Briefcase className="inline h-4 w-4 mr-1" />
          Industry
        </label>
        {editMode ? (
          <select
            value={data.industry || ''}
            onChange={(e) => onChange('industry', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="">Select industry</option>
            <option value="technology">Technology</option>
            <option value="finance">Finance</option>
            <option value="healthcare">Healthcare</option>
            <option value="education">Education</option>
            <option value="retail">Retail</option>
            <option value="manufacturing">Manufacturing</option>
            <option value="agriculture">Agriculture</option>
            <option value="consulting">Consulting</option>
            <option value="other">Other</option>
          </select>
        ) : (
          <p className="text-gray-900 capitalize">{data.industry || 'Not specified'}</p>
        )}
      </div>

      {/* Company Size */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <Users className="inline h-4 w-4 mr-1" />
          Company Size
        </label>
        {editMode ? (
          <select
            value={data.company_size || ''}
            onChange={(e) => onChange('company_size', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="">Select size</option>
            <option value="1-10">1-10 employees</option>
            <option value="11-50">11-50 employees</option>
            <option value="51-200">51-200 employees</option>
            <option value="201-500">201-500 employees</option>
            <option value="501-1000">501-1000 employees</option>
            <option value="1000+">1000+ employees</option>
          </select>
        ) : (
          <p className="text-gray-900">{data.company_size || 'Not specified'} employees</p>
        )}
      </div>

      {/* Founded Year */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <Calendar className="inline h-4 w-4 mr-1" />
          Founded Year
        </label>
        {editMode ? (
          <input
            type="number"
            value={data.founded_year || ''}
            onChange={(e) => onChange('founded_year', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            placeholder="e.g., 2020"
            min="1900"
            max={new Date().getFullYear()}
          />
        ) : (
          <p className="text-gray-900">{data.founded_year || 'Not specified'}</p>
        )}
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Company Description
        </label>
        {editMode ? (
          <textarea
            value={data.description || ''}
            onChange={(e) => onChange('description', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            rows={4}
            placeholder="Tell us about your company..."
          />
        ) : (
          <p className="text-gray-900 whitespace-pre-line">{data.description || 'No description provided'}</p>
        )}
      </div>

      {/* Hiring Needs */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <Target className="inline h-4 w-4 mr-1" />
          Current Hiring Needs
        </label>
        {editMode ? (
          <textarea
            value={data.hiring_needs || ''}
            onChange={(e) => onChange('hiring_needs', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            rows={3}
            placeholder="Roles you're hiring for (one per line)"
          />
        ) : (
          <p className="text-gray-900 whitespace-pre-line">{data.hiring_needs || 'Not currently hiring'}</p>
        )}
      </div>

      {/* Company Culture */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Company Culture & Values
        </label>
        {editMode ? (
          <textarea
            value={data.culture || ''}
            onChange={(e) => onChange('culture', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            rows={3}
            placeholder="Describe your company culture and values..."
          />
        ) : (
          <p className="text-gray-900 whitespace-pre-line">{data.culture || 'Not described'}</p>
        )}
      </div>
    </div>
  )
}
