

export interface AiResult {
  id: string;

  decision: AiDecision;   // strict instead of string
  score: number;          // 0–100 or 0–1 (define in backend)

  feedback: string;

  createdAt: string;
  documentId: string;
}

export type DocumentStatus =
  | "DRAFT"
  | "AI_PROCESSING"
  | "AI_REVIEWED"
  | "REVIEW_REQUESTED"
  | "APPROVED"
  | "REJECTED";

  export type DocumentSource =
  | "UPLOAD"
  | "MANUAL"; 




export type AiDecision =
  | "LIKELY_VALID"
  | "NEEDS_REVIEW"
  | "INVALID"
  | "UNKNOWN";

export interface AiResult {
  id: string;
  decision: AiDecision;
  score: number;        // define scale in backend (0–1 or 0–100)
  feedback: string;
  createdAt: string;
  documentId: string;
}


export interface Document {
  id: string;

  title: string;

  source: DocumentSource;
  status: DocumentStatus;

  createdAt: string;

  // Content
  content: string | null;   // for editor documents
  filePath: string | null;  // for uploaded files

  // Ownership
  userId: string;
  lawyerId: string | null;

  // AI Result
  aiResult: AiResult | null;

  // Lawyer Review
  lawyerDecision: LawyerDecision;
  lawyerFeedback: string | null;
  lawyerSuggestion: string | null;

  // Revision
  revisedContent: string | null;

  reviewedAt: string | null;
}

export type LawyerDecision =
  | "APPROVED"
  | "REJECTED"
  | "CHANGES_REQUIRED"
  | null;