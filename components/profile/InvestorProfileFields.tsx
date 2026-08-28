import { TrendingUp, DollarSign, MapPin, Target, Briefcase } from 'lucide-react'

interface InvestorProfileFieldsProps {
  editMode: boolean
  data: any
  onChange: (field: string, value: string) => void
}

export default function InvestorProfileFields({ editMode, data, onChange }: InvestorProfileFieldsProps) {
  return (
    <div className="space-y-6">
      <h3 className="text-xl font-bold text-navy-900 flex items-center space-x-2">
        <TrendingUp className="h-5 w-5 text-gold-600" />
        <span>Investment Criteria</span>
      </h3>

      {/* Investment Focus */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <Target className="inline h-4 w-4 mr-1" />
          Investment Focus (Sectors)
        </label>
        {editMode ? (
          <input
            type="text"
            value={data.investment_focus || ''}
            onChange={(e) => onChange('investment_focus', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            placeholder="e.g., Fintech, Agritech, Healthtech"
          />
        ) : (
          <p className="text-gray-900">{data.investment_focus || 'Not specified'}</p>
        )}
        <p className="text-xs text-gray-500 mt-1">Comma-separated sectors you invest in</p>
      </div>

      {/* Investment Stage */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Investment Stages
        </label>
        {editMode ? (
          <input
            type="text"
            value={data.investment_stage || ''}
            onChange={(e) => onChange('investment_stage', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            placeholder="e.g., Seed, Series A, Series B"
          />
        ) : (
          <p className="text-gray-900">{data.investment_stage || 'Not specified'}</p>
        )}
        <p className="text-xs text-gray-500 mt-1">Stages you invest in (comma-separated)</p>
      </div>

      {/* Ticket Size */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <DollarSign className="inline h-4 w-4 mr-1" />
            Min Ticket Size (USD)
          </label>
          {editMode ? (
            <input
              type="number"
              value={data.ticket_size_min || ''}
              onChange={(e) => onChange('ticket_size_min', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="10000"
            />
          ) : (
            <p className="text-gray-900">
              {data.ticket_size_min ? `$${parseInt(data.ticket_size_min).toLocaleString()}` : 'Not set'}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Max Ticket Size (USD)
          </label>
          {editMode ? (
            <input
              type="number"
              value={data.ticket_size_max || ''}
              onChange={(e) => onChange('ticket_size_max', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="500000"
            />
          ) : (
            <p className="text-gray-900">
              {data.ticket_size_max ? `$${parseInt(data.ticket_size_max).toLocaleString()}` : 'Not set'}
            </p>
          )}
        </div>
      </div>

      {/* Regions of Interest */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <MapPin className="inline h-4 w-4 mr-1" />
          Regions of Interest
        </label>
        {editMode ? (
          <input
            type="text"
            value={data.regions_of_interest || ''}
            onChange={(e) => onChange('regions_of_interest', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            placeholder="e.g., East Africa, West Africa, Pan-African"
          />
        ) : (
          <p className="text-gray-900">{data.regions_of_interest || 'Not specified'}</p>
        )}
      </div>

      {/* Portfolio Companies */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <Briefcase className="inline h-4 w-4 mr-1" />
          Portfolio Companies
        </label>
        {editMode ? (
          <textarea
            value={data.portfolio_companies || ''}
            onChange={(e) => onChange('portfolio_companies', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            rows={3}
            placeholder="List your portfolio companies (one per line)"
          />
        ) : (
          <p className="text-gray-900 whitespace-pre-line">{data.portfolio_companies || 'No portfolio companies listed'}</p>
        )}
      </div>

      {/* Number of Exits */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Successful Exits
        </label>
        {editMode ? (
          <input
            type="number"
            value={data.successful_exits || ''}
            onChange={(e) => onChange('successful_exits', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            placeholder="0"
          />
        ) : (
          <p className="text-gray-900">{data.successful_exits || '0'} exits</p>
        )}
      </div>
    </div>
  )
}
