/**
 * Connection utilities
 * Helper functions for managing professional connections
 */

import { createClient } from '@/lib/supabase/client';
import { Connection, ConnectionRequest, ConnectionStatus } from '@/lib/types/connections';

/**
 * Send a connection request to another user
 */
export async function sendConnectionRequest(
  addresseeId: string,
  message?: string
): Promise<{ data: Connection | null; error: Error | null }> {
  const supabase = createClient();

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { data: null, error: new Error('Not authenticated') };
    }

    // Check if connection already exists
    const { data: existing } = await supabase
      .from('connections')
      .select('*')
      .or(`and(requester_id.eq.${user.id},addressee_id.eq.${addresseeId}),and(requester_id.eq.${addresseeId},addressee_id.eq.${user.id})`)
      .maybeSingle();

    if (existing) {
      return { data: null, error: new Error('Connection request already exists') };
    }

    // Create new connection request
    const { data, error } = await supabase
      .from('connections')
      .insert({
        requester_id: user.id,
        addressee_id: addresseeId,
        request_message: message || null,
        status: 'pending'
      })
      .select()
      .single();

    if (error) throw error;

    return { data, error: null };
  } catch (error: any) {
    return { data: null, error };
  }
}

/**
 * Accept a connection request
 */
export async function acceptConnectionRequest(
  connectionId: string
): Promise<{ data: Connection | null; error: Error | null }> {
  const supabase = createClient();

  try {
    const { data, error } = await supabase
      .from('connections')
      .update({ status: 'accepted' })
      .eq('id', connectionId)
      .select()
      .single();

    if (error) throw error;

    return { data, error: null };
  } catch (error: any) {
    return { data: null, error };
  }
}

/**
 * Decline a connection request
 */
export async function declineConnectionRequest(
  connectionId: string
): Promise<{ data: Connection | null; error: Error | null }> {
  const supabase = createClient();

  try {
    const { data, error } = await supabase
      .from('connections')
      .update({ status: 'declined' })
      .eq('id', connectionId)
      .select()
      .single();

    if (error) throw error;

    return { data, error: null };
  } catch (error: any) {
    return { data: null, error };
  }
}

/**
 * Remove a connection (unfriend)
 */
export async function removeConnection(
  connectionId: string
): Promise<{ error: Error | null }> {
  const supabase = createClient();

  try {
    const { error } = await supabase
      .from('connections')
      .delete()
      .eq('id', connectionId);

    if (error) throw error;

    return { error: null };
  } catch (error: any) {
    return { error };
  }
}

/**
 * Get connection status between current user and another user
 */
export async function getConnectionStatus(
  otherUserId: string
): Promise<{
  status: ConnectionStatus | 'none';
  connection: Connection | null;
  isRequester: boolean;
}> {
  const supabase = createClient();

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { status: 'none', connection: null, isRequester: false };
    }

    const { data } = await supabase
      .from('connections')
      .select('*')
      .or(`and(requester_id.eq.${user.id},addressee_id.eq.${otherUserId}),and(requester_id.eq.${otherUserId},addressee_id.eq.${user.id})`)
      .maybeSingle();

    if (!data) {
      return { status: 'none', connection: null, isRequester: false };
    }

    return {
      status: data.status as ConnectionStatus,
      connection: data,
      isRequester: data.requester_id === user.id
    };
  } catch (error) {
    console.error('Error getting connection status:', error);
    return { status: 'none', connection: null, isRequester: false };
  }
}

/**
 * Check if two users are connected
 */
export async function areUsersConnected(
  userId1: string,
  userId2: string
): Promise<boolean> {
  const supabase = createClient();

  try {
    const { data } = await supabase
      .from('connections')
      .select('id')
      .eq('status', 'accepted')
      .or(`and(requester_id.eq.${userId1},addressee_id.eq.${userId2}),and(requester_id.eq.${userId2},addressee_id.eq.${userId1})`)
      .maybeSingle();

    return !!data;
  } catch (error) {
    console.error('Error checking connection:', error);
    return false;
  }
}

/**
 * Get all connections for current user
 */
export async function getMyConnections() {
  const supabase = createClient();

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { data: [], error: new Error('Not authenticated') };

    const { data, error } = await supabase
      .from('connections')
      .select(`
        *,
        requester:requester_id(id, full_name, avatar_url, bio, user_type, country, city),
        addressee:addressee_id(id, full_name, avatar_url, bio, user_type, country, city)
      `)
      .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)
      .eq('status', 'accepted')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return { data: data || [], error: null };
  } catch (error: any) {
    return { data: [], error };
  }
}

/**
 * Get pending connection requests (received)
 */
export async function getPendingRequests() {
  const supabase = createClient();

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { data: [], error: new Error('Not authenticated') };

    const { data, error } = await supabase
      .from('connections')
      .select(`
        *,
        requester:requester_id(id, full_name, avatar_url, bio, user_type, country, city)
      `)
      .eq('addressee_id', user.id)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return { data: data || [], error: null };
  } catch (error: any) {
    return { data: [], error };
  }
}

/**
 * Get sent connection requests (pending)
 */
export async function getSentRequests() {
  const supabase = createClient();

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { data: [], error: new Error('Not authenticated') };

    const { data, error } = await supabase
      .from('connections')
      .select(`
        *,
        addressee:addressee_id(id, full_name, avatar_url, bio, user_type, country, city)
      `)
      .eq('requester_id', user.id)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return { data: data || [], error: null };
  } catch (error: any) {
    return { data: [], error };
  }
}
