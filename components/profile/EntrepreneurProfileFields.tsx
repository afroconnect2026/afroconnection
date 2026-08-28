import { DollarSign, Users, TrendingUp, Rocket, FileText } from 'lucide-react'

interface EntrepreneurProfileFieldsProps {
  editMode: boolean
  data: any
  onChange: (field: string, value: string) => void
}

export default function EntrepreneurProfileFields({ editMode, data, onChange }: EntrepreneurProfileFieldsProps) {
  return (
    <div className="space-y-6">
      <h3 className="text-xl font-bold text-navy-900 flex items-center space-x-2">
        <Rocket className="h-5 w-5 text-primary-600" />
        <span>Startup Information</span>
      </h3>

      {/* Startup Name */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Startup Name
        </label>
        {editMode ? (
          <input
            type="text"
            value={data.startup_name || ''}
            onChange={(e) => onChange('startup_name', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            placeholder="Your startup name"
          />
        ) : (
          <p className="text-gray-900">{data.startup_name || 'Not specified'}</p>
        )}
      </div>

      {/* Industry */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Industry
        </label>
        {editMode ? (
          <select
            value={data.industry || ''}
            onChange={(e) => onChange('industry', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="">Select industry</option>
            <option value="fintech">Fintech</option>
            <option value="agritech">Agritech</option>
            <option value="healthtech">Healthtech</option>
            <option value="edtech">Edtech</option>
            <option value="ecommerce">E-commerce</option>
            <option value="logistics">Logistics</option>
            <option value="cleantech">Cleantech</option>
            <option value="saas">SaaS</option>
            <option value="other">Other</option>
          </select>
        ) : (
          <p className="text-gray-900">{data.industry || 'Not specified'}</p>
        )}
      </div>

      {/* Startup Stage */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <TrendingUp className="inline h-4 w-4 mr-1" />
          Startup Stage
        </label>
        {editMode ? (
          <select
            value={data.startup_stage || ''}
            onChange={(e) => onChange('startup_stage', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="">Select stage</option>
            <option value="idea">Idea</option>
            <option value="mvp">MVP</option>
            <option value="revenue">Revenue</option>
            <option value="growth">Growth</option>
            <option value="scale">Scale</option>
          </select>
        ) : (
          <p className="text-gray-900 capitalize">{data.startup_stage || 'Not specified'}</p>
        )}
      </div>

      {/* Funding Goal */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <DollarSign className="inline h-4 w-4 mr-1" />
          Funding Goal (USD)
        </label>
        {editMode ? (
          <input
            type="number"
            value={data.funding_goal || ''}
            onChange={(e) => onChange('funding_goal', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            placeholder="e.g., 100000"
          />
        ) : (
          <p className="text-gray-900">
            {data.funding_goal ? `$${parseInt(data.funding_goal).toLocaleString()}` : 'Not specified'}
          </p>
        )}
      </div>

      {/* Team Size */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <Users className="inline h-4 w-4 mr-1" />
          Team Size
        </label>
        {editMode ? (
          <input
            type="number"
            value={data.team_size || ''}
            onChange={(e) => onChange('team_size', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            placeholder="Number of team members"
          />
        ) : (
          <p className="text-gray-900">{data.team_size || 'Not specified'} members</p>
        )}
      </div>

      {/* Pitch Deck URL */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <FileText className="inline h-4 w-4 mr-1" />
          Pitch Deck URL
        </label>
        {editMode ? (
          <input
            type="url"
            value={data.pitch_deck_url || ''}
            onChange={(e) => onChange('pitch_deck_url', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            placeholder="https://..."
          />
        ) : (
          <p className="text-gray-900">
            {data.pitch_deck_url ? (
              <a href={data.pitch_deck_url} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline">
                View Pitch Deck →
              </a>
            ) : (
              'Not uploaded'
            )}
          </p>
        )}
      </div>
    </div>
  )
}
