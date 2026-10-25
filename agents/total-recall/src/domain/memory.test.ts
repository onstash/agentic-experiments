import type {
  MemoryProposalInput,
  MemoryProposalItem,
  MemoryProposalResult,
  MemoryScope,
} from "./memory.js";

const preference: MemoryProposalItem = {
  content: "Prefer concise explanations.",
  kind: "preference",
  scope: { type: "global" },
};

const rule: MemoryProposalItem = {
  content: "Run tests before committing.",
  kind: "rule",
  scope: { id: "life-os", type: "project" },
};

const projectScope: MemoryScope = { id: "life-os", type: "project" };

const proposal: MemoryProposalInput = {
  items: [preference, rule],
  idempotencyKey: "agent-request-123",
};

const result: MemoryProposalResult = {
  archiveAt: "2026-11-12T10:00:00Z",
  message: "Review this proposal in Life OS.",
  proposalId: "prop-123",
  status: "pending",
};

void projectScope;

void proposal;

void result;

const invalidScope: MemoryProposalItem = {
  content: "Invalid scope.",
  kind: "project_context",
  // @ts-expect-error Project scope requires an id.
  scope: { type: "project" },
};

void invalidScope;
