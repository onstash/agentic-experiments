export type OpportunityKind = "oss" | "job";

export interface Opportunity {
  kind: OpportunityKind;
  title: string;
  url: string;
  organization: string;
  summary: string;
  topics: string[];
  queryScore: number;
  relevanceScore: number;
  recencyScore: number;
  effortScore: number;
  confidenceScore: number;
}

export type ScoredSourceHit<T> = {
  hit: T;
  queryScore: number;
};

export interface RankedOpportunity extends Opportunity {
  totalScore: number;
  reasons: string[];
}
