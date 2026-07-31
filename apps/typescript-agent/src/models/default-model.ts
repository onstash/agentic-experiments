export type ModelProvider = "openai";

export type ModelName = "gpt-4o-mini";

export type SelectedModel = {
  provider: ModelProvider;
  name: ModelName;
};

export function getDefaultModel(): SelectedModel {
  return {
    provider: "openai",
    name: "gpt-4o-mini",
  };
}