/**
 * Types for the connections system
 * Professional networking connections between users
 */

export type ConnectionStatus = 'pending' | 'accepted' | 'declined';

export interface Connection {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: ConnectionStatus;
  request_message: string | null;
  created_at: string;
  updated_at: string;
}

export interface ConnectionWithProfile extends Connection {
  requester?: {
    id: string;
    full_name: string;
    avatar_url: string | null;
    bio: string | null;
    user_type: string;
    country: string | null;
    city: string | null;
  };
  addressee?: {
    id: string;
    full_name: string;
    avatar_url: string | null;
    bio: string | null;
    user_type: string;
    country: string | null;
    city: string | null;
  };
}

export interface ConnectionRequest {
  addressee_id: string;
  request_message?: string;
}

export interface ConnectionStats {
  total_connections: number;
  pending_requests: number;
  sent_requests: number;
}
