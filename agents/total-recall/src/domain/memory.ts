export type SemanticMemoryKind = "fact" | "preference" | "project_context";

export type ProceduralMemoryKind = "rule";

export type MemoryClassification =
  | {
      class: "semantic";
      kind: SemanticMemoryKind;
    }
  | {
      class: "procedural";
      kind: ProceduralMemoryKind;
    };

export type MemoryScope = { type: "global" } | { type: "project"; projectId: string };

export type MemoryProposalItem = MemoryClassification & {
  content: string;
  scope: MemoryScope;
  sourceRef?: string;
  sourceExcerpt?: string;
};

export type MemoryProposalInput = {
  items: MemoryProposalItem[];
  idempotencyKey: string;
};

export type ProposalStatus = "pending" | "approved" | "rejected" | "archived";

export type MemoryProposalResult =
  | {
      proposalId: string;
      status: Exclude<ProposalStatus, "archived">;
      message: string;
      scheduledArchiveAt: string;
    }
  | {
      proposalId: string;
      status: "archived";
      message: string;
      archivedAt: string;
    };
