import { getDefaultModel } from "../../typescript-agent/src/models/default-model.js";

export const piAgentConfig = {
  model: getDefaultModel(),
  maxIterations: 3,
  systemPrompt: "Find and rank GitHub open-source and job opportunities. Explain every recommendation.",
};
