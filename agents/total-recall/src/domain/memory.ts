export type MemoryKind = "preference" | "project_context" | "rule";

export type MemoryScope = { type: "global" } | { id: string; type: "project" };

export type MemoryProposalItem = {
  content: string;
  kind: MemoryKind;
  scope: MemoryScope;
  sourceRef?: string;
  sourceExcerpt?: string;
};

export type MemoryProposalInput = {
  items: MemoryProposalItem[];
  idempotencyKey: string;
};

export type ProposalStatus =
  | "approved"
  | "archived"
  | "partially_approved"
  | "pending"
  | "rejected";

export type MemoryProposalResult = {
  archiveAt: string;
  message: string;
  proposalId: string;
  status: ProposalStatus;
};
