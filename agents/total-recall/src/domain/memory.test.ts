import type {
  MemoryProposalInput,
  MemoryProposalResult,
  MemoryProposalItem,
  MemoryScope,
} from "./memory.js";

const semanticFact: MemoryProposalItem = {
  class: "semantic",
  kind: "fact",
  content: "The user lives in London.",
  scope: { type: "global" },
};

const proceduralRule: MemoryProposalItem = {
  class: "procedural",
  kind: "rule",
  content: "Run tests before committing.",
  scope: { type: "project", projectId: "life-os" },
};

const globalScope: MemoryScope = { type: "global" };

const projectScope: MemoryScope = { type: "project", projectId: "life-os" };

const proposal: MemoryProposalInput = {
  items: [semanticFact, proceduralRule],
  idempotencyKey: "agent-request-123",
};

const pending: MemoryProposalResult = {
  proposalId: "prop-123",
  status: "pending",
  message: "Review this proposal in Life OS.",
  scheduledArchiveAt: "2026-11-12T10:00:00Z",
};

const archived: MemoryProposalResult = {
  proposalId: "prop-123",
  status: "archived",
  message: "Proposal archived.",
  archivedAt: "2026-11-12T10:00:03Z",
};

void globalScope;

void projectScope;

void proposal;

void pending;

void archived;

// @ts-expect-error Facts cannot use the procedural classification.
const _invalidClassification: MemoryProposalItem = {
  class: "procedural",
  kind: "fact",
  content: "Invalid classification.",
  scope: { type: "global" },
};

const _invalidScope: MemoryProposalItem = {
  class: "semantic",
  kind: "project_context",
  content: "Invalid scope.",
  // @ts-expect-error Project scope requires a projectId.
  scope: { type: "project" },
};

const _invalidArchiveResult: MemoryProposalResult = {
  proposalId: "prop-123",
  status: "archived",
  message: "Invalid archive result.",
  // @ts-expect-error Archived results require archivedAt, not scheduledArchiveAt.
  scheduledArchiveAt: "2026-11-12T10:00:00Z",
};
