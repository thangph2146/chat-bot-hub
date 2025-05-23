export interface ChatMessage {
  id: number; // Changed from string
  sessionId: string;
  userId: number; // Added
  senderName: string; // Added, replaces 'sender'
  isUser: boolean; // Added
  content: string;
  timestamp: string; // ISO date string
  // contentType can be removed if not used, or kept if applicable
}

export interface ChatSession {
  id: string;
  userId: number; // Changed from string
  title?: string; // Added
  createdAt: string; // ISO date string
  lastUpdatedAt: string; // Changed from updatedAt
  messages: ChatMessage[]; // Added: messages are now embedded
  // lastMessagePreview can be derived or removed
}
