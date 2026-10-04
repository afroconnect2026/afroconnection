import { formatDistanceToNow } from 'date-fns'
import {
  UserCheck,
  UserX,
  CheckCircle,
  XCircle,
  LogIn,
  LogOut,
  Edit,
  Trash2,
  Flag
} from 'lucide-react'

interface Activity {
  id: string
  action: string
  target_type: string
  target_id: string
  details: any
  created_at: string
  admin: {
    full_name: string
    email: string
  }
}

interface ActivityLogProps {
  activities: Activity[]
}

export default function ActivityLog({ activities }: ActivityLogProps) {
  const getActionIcon = (action: string) => {
    const icons: { [key: string]: any } = {
      login: LogIn,
      logout: LogOut,
      verify_user: CheckCircle,
      ban_user: UserX,
      approve_content: CheckCircle,
      reject_content: XCircle,
      delete_user: Trash2,
      delete_content: Trash2,
      edit_content: Edit,
      resolve_report: Flag,
    }

    return icons[action] || Edit
  }

  const getActionColor = (action: string) => {
    const colors: { [key: string]: string } = {
      login: 'text-green-600 bg-green-50',
      logout: 'text-gray-600 bg-gray-50',
      verify_user: 'text-green-600 bg-green-50',
      ban_user: 'text-red-600 bg-red-50',
      approve_content: 'text-green-600 bg-green-50',
      reject_content: 'text-red-600 bg-red-50',
      delete_user: 'text-red-600 bg-red-50',
      delete_content: 'text-red-600 bg-red-50',
      edit_content: 'text-blue-600 bg-blue-50',
      resolve_report: 'text-purple-600 bg-purple-50',
    }

    return colors[action] || 'text-gray-600 bg-gray-50'
  }

  const formatAction = (action: string) => {
    return action
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  if (!activities || activities.length === 0) {
    return (
      <div className="p-6 text-center text-gray-500">
        No recent activity
      </div>
    )
  }

  return (
    <div className="divide-y divide-gray-100">
      {activities.map((activity) => {
        const Icon = getActionIcon(activity.action)
        const colorClass = getActionColor(activity.action)

        return (
          <div key={activity.id} className="p-4 hover:bg-gray-50 transition-colors">
            <div className="flex items-start gap-4">
              <div className={`w-10 h-10 rounded-lg ${colorClass} flex items-center justify-center flex-shrink-0`}>
                <Icon className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {activity.admin?.full_name || 'Unknown Admin'}
                    </p>
                    <p className="text-sm text-gray-600 mt-0.5">
                      {formatAction(activity.action)}
                      {activity.target_type && (
                        <span className="text-gray-400">
                          {' '}on {activity.target_type}
                        </span>
                      )}
                    </p>
                    {activity.details && Object.keys(activity.details).length > 0 && (
                      <p className="text-xs text-gray-500 mt-1">
                        {JSON.stringify(activity.details, null, 2).slice(0, 100)}
                      </p>
                    )}
                  </div>
                  <span className="text-xs text-gray-500 whitespace-nowrap">
                    {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
