import type {
  User,
  Conversation,
  Message,
  SavedNote,
  Feedback,
  Incident,
  FeatureFlag,
  PromptVersion,
  AuditLog,
  ContactInquiry,
} from "@prisma/client";

export type {
  User,
  Conversation,
  Message,
  SavedNote,
  Feedback,
  Incident,
  FeatureFlag,
  PromptVersion,
  AuditLog,
  ContactInquiry,
};

export type SafeUser = Omit<User, "passwordHash" | "verificationToken" | "resetToken" | "resetTokenExpiry" | "verificationExpiry">;

export type ConversationWithMessages = Conversation & {
  messages: Message[];
};

export type ConversationWithCount = Conversation & {
  _count: { messages: number };
};

export type MessageWithFeedback = Message & {
  feedback: Feedback[];
};

export type NoteWithConversation = SavedNote & {
  conversation: Pick<Conversation, "id" | "mode" | "title"> | null;
};

export type FeedbackWithRelations = Feedback & {
  user: Pick<User, "id" | "email" | "name"> | null;
  message: Pick<Message, "id" | "content"> | null;
  conversation: Pick<Conversation, "id" | "mode"> | null;
};

export type IncidentWithMeta = Incident & {
  metadata: Record<string, unknown> | null;
};

// API response types
export interface ApiResponse<T> {
  data: T;
}

export interface ApiError {
  error: string;
  details?: Record<string, unknown>;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// Session type returned to client
export interface ClientSession {
  id: string;
  email: string;
  name: string | null;
  role: "USER" | "ADMIN";
  emailVerified: boolean;
}

// Chat streaming message format
export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  executionId?: string;
  createdAt: string;
}
