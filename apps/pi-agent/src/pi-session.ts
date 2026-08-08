import {
  createAgentSession,
  SessionManager,
  type AgentSession,
} from "@earendil-works/pi-coding-agent";

export type PersistentPiSession = {
  session: AgentSession;
  sessionFile: string;
};

export async function createPersistentPiSession(cwd = process.cwd()): Promise<PersistentPiSession> {
  const sessionManager = SessionManager.create(cwd);
  const { session } = await createAgentSession({
    cwd,
    sessionManager,
    noTools: "all",
  });
  const sessionFile = sessionManager.getSessionFile();
  if (!sessionFile) throw new Error("Pi did not create a session file.");
  return { session, sessionFile };
}
