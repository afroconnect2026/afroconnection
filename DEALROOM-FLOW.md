# 🔄 Connection → Dealroom Flow

## Complete User Journey

### 📍 **Entry Points:**
1. `/explore` - Browse all users
2. `/profile/[id]` - View specific user profile
3. `/connections` - Manage existing connections

---

## 🔗 **Flow Diagram**

```
┌─────────────────────────────────────────────────────────────────┐
│                      EXPLORE PAGE                                │
│  • Browse users by type (entrepreneur, investor, etc.)           │
│  • Search by name/location                                       │
│  • Click "View Profile" button                                   │
└──────────────────────┬──────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│                   PROFILE PAGE (/profile/[id])                   │
│                                                                   │
│  CONNECTION STATUS CHECK:                                        │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ Status: 'none' (Not Connected)                             │ │
│  │ ┌────────────────────────────────────────────────────────┐ │ │
│  │ │  ✋ "Connect" Button                                    │ │ │
│  │ │     → Calls sendConnectionRequest()                    │ │ │
│  │ │     → Creates connection with status='pending'         │ │ │
│  │ └────────────────────────────────────────────────────────┘ │ │
│  └────────────────────────────────────────────────────────────┘ │
│                       │                                           │
│                       ▼                                           │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ Status: 'pending' (Request Sent)                           │ │
│  │                                                            │ │
│  │ IF YOU SENT REQUEST:                                       │ │
│  │ ┌────────────────────────────────────────────────────────┐ │ │
│  │ │  ⏳ "Request Pending" (disabled button)                 │ │ │
│  │ │     → Wait for other user to respond                   │ │ │
│  │ └────────────────────────────────────────────────────────┘ │ │
│  │                                                            │ │
│  │ IF YOU RECEIVED REQUEST:                                   │ │
│  │ ┌────────────────────────────────────────────────────────┐ │ │
│  │ │  ✅ "Accept" Button                                     │ │ │
│  │ │     → Calls acceptConnectionRequest()                  │ │ │
│  │ │     → Updates status to 'accepted'                     │ │ │
│  │ │                                                         │ │ │
│  │ │  ❌ "Decline" Button                                    │ │ │
│  │ │     → Calls declineConnectionRequest()                 │ │ │
│  │ │     → Updates status to 'declined'                     │ │ │
│  │ └────────────────────────────────────────────────────────┘ │ │
│  └────────────────────────────────────────────────────────────┘ │
│                       │                                           │
│                       ▼                                           │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ Status: 'accepted' (Connected!)                            │ │
│  │ ┌────────────────────────────────────────────────────────┐ │ │
│  │ │  💬 "Open Dealroom" Button                              │ │ │
│  │ │     → Calls handleMessage()                            │ │ │
│  │ │     → Checks if conversation exists                    │ │ │
│  │ │     → Creates new conversation OR opens existing       │ │ │
│  │ │     → Redirects to /messages?conversation=[id]         │ │ │
│  │ │                                                         │ │ │
│  │ │  🗑️ "Remove Connection" Button                         │ │ │
│  │ │     → Deletes connection (back to 'none' status)       │ │ │
│  │ └────────────────────────────────────────────────────────┘ │ │
│  └────────────────────────────────────────────────────────────┘ │
└──────────────────────┬──────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│                  DEALROOM (/messages?conversation=[id])          │
│                                                                   │
│  IF NEW CONVERSATION (messages.length === 0):                    │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  ✨ AI CONVERSATION STARTERS                                │ │
│  │  ┌──────────────────────────────────────────────────────┐  │ │
│  │  │  Calls: POST /api/ai/conversation-starters            │  │ │
│  │  │  Sends: { otherUserId }                               │  │ │
│  │  │  Returns: 3 personalized conversation openers         │  │ │
│  │  │                                                        │  │ │
│  │  │  Example Starters:                                    │  │ │
│  │  │  • "I see you're an investor in fintech..."          │  │ │
│  │  │  • "Both in Kigali! Have you attended..."            │  │ │
│  │  │  • "Your background in mobile dev aligns..."         │  │ │
│  │  │                                                        │  │ │
│  │  │  Click starter → Auto-fills message box               │  │ │
│  │  └──────────────────────────────────────────────────────┘  │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                   │
│  CHAT INTERFACE:                                                 │
│  • Send messages                                                 │
│  • Attach files                                                  │
│  • Real-time messaging                                           │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔒 **Security: Database Policies**

### RLS Policy on `conversations` table:
```sql
CREATE POLICY "Users can create conversations with connections"
ON conversations FOR INSERT
WITH CHECK (
  -- Must be participant
  (auth.uid() = participant_a_id OR auth.uid() = participant_b_id)
  AND
  -- Must have ACCEPTED connection
  EXISTS (
    SELECT 1 FROM connections
    WHERE status = 'accepted'
    AND (
      (requester_id = participant_a_id AND addressee_id = participant_b_id)
      OR
      (requester_id = participant_b_id AND addressee_id = participant_a_id)
    )
  )
);
```

**This enforces:**
- ❌ Cannot create conversation without accepted connection
- ❌ Cannot message random users
- ✅ Must connect first, THEN message

---

## 🎯 **Key Functions**

### Connection Functions (`lib/connections.ts`):
- `sendConnectionRequest(addresseeId)` - Send request
- `acceptConnectionRequest(connectionId)` - Accept request
- `declineConnectionRequest(connectionId)` - Decline request
- `removeConnection(connectionId)` - Unfriend
- `getConnectionStatus(otherUserId)` - Check status

### Messaging Function (`app/profile/[id]/page.tsx`):
```typescript
const handleMessage = async () => {
  // 1. Check connection status
  if (connectionStatus !== 'accepted') {
    toast.error('You must be connected to open a dealroom')
    return
  }

  // 2. Check if conversation exists
  const { data: existing } = await supabase
    .from('conversations')
    .select('id')
    .or(`participant_a_id.eq.${userId},participant_b_id.eq.${userId}`)
    .maybeSingle()

  if (existing) {
    router.push(`/messages?conversation=${existing.id}`)
    return
  }

  // 3. Create new conversation
  const { data: newConvo } = await supabase
    .from('conversations')
    .insert({
      participant_a_id: currentUser.id,
      participant_b_id: userId
    })
    .select()
    .single()

  // 4. Redirect to dealroom
  router.push(`/messages?conversation=${newConvo.id}`)
}
```

---

## 🤖 **AI Integration Points**

1. **AI Match Badge** (Explore Page)
   - Shows match percentage
   - Click to see synergies
   - Location: `/explore`

2. **AI Conversation Starters** (Dealroom)
   - Shows ONLY in NEW conversations (0 messages)
   - Generates 3 personalized openers
   - Location: `/messages?conversation=[id]`

---

## 📊 **Status Flow**

```
none → pending → accepted → messaging ✅
  ↓       ↓         ↓
  ❌     decline   remove → back to 'none'
```

---

## ✅ **Current Implementation Status**

- ✅ Connection request system
- ✅ Accept/decline functionality
- ✅ Remove connection (unfriend)
- ✅ Database RLS enforcement
- ✅ Conversation creation gated by connection
- ✅ AI Conversation Starters in new chats
- ✅ Real-time messaging

---

## 🐛 **Known Behavior**

**AI Starters only show when:**
- New conversation (0 messages)
- Valid otherUser exists

**To see AI Starters:**
1. Go to `/explore`
2. Find someone you've NEVER messaged
3. Connect with them
4. Open dealroom for FIRST TIME
5. AI card appears with 3 starters! ✨

**Won't show if:**
- Conversation has any messages
- Already dismissed the AI card
- No profile data available
