import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdtempSync, writeFileSync, readFileSync, rmSync } from "node:fs";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { once } from "node:events";
import { test } from "node:test";

const id = "a".repeat(64);

const token = "t".repeat(32);

test("local broker authenticates, validates requests and inspects before each fixed Docker exec", async () => {
  const dir = mkdtempSync(join(tmpdir(), "local-broker-"));
  const state = join(dir, "state");
  const log = join(dir, "log");

  const fake = `#!/usr/bin/env node
const fs = require('fs');
const args = process.argv.slice(2);
fs.appendFileSync(${JSON.stringify(log)}, JSON.stringify(args) + '\\n');
if (args[0] === 'inspect') {
  const mode = fs.readFileSync(${JSON.stringify(state)}, 'utf8');
  console.log(JSON.stringify([{Id: ${JSON.stringify(id)}, State: {Running: mode !== 'stopped'}, Mounts: mode === 'mount' ? [{}] : [], HostConfig: {NetworkMode: mode === 'network' ? 'host' : 'none'}, NetworkSettings: {Networks: mode === 'attached' ? {none: {}, bridge: {}} : {none: {}}}, Config: {Env: mode === 'token' ? [${JSON.stringify(`SECRET=${token}`)}] : []}}]));
} else { process.stdout.write(args.at(-1)); process.exitCode = 7; }
`;

  writeFileSync(join(dir, "docker"), fake, { mode: 0o755 });
  writeFileSync(state, "safe");
  const probe = createServer();
  probe.listen(0, "127.0.0.1");
  await once(probe, "listening");
  const port = probe.address().port;
  await new Promise((resolveClose) => probe.close(resolveClose));

  const child = spawn(process.execPath, [resolve("agents/cloud-coding/scripts/local-broker.mjs")], {
    env: {
      ...process.env,
      PATH: `${dir}:${process.env.PATH}`,
      LOCAL_BROKER_TOKEN: token,
      LOCAL_BROKER_CONTAINER_ID: id,
      LOCAL_BROKER_PORT: String(port),
    },
    stdio: ["ignore", "pipe", "pipe"],
  });

  try {
    await once(child.stdout, "data");

    const call = (body, authorization = `Bearer ${token}`, path = "/command") =>
      fetch(`http://127.0.0.1:${port}${path}`, {
        method: "POST",
        headers: { authorization },
        body: JSON.stringify(body),
      });

    assert.equal((await call({ command: "true" }, "Bearer wrong")).status, 401);
    assert.equal((await call({ command: "true" }, `Bearer ${token}`, "/other")).status, 404);

    for (const body of [
      { command: "true", path: "/host" },
      { command: "a\0b" },
      { command: "x".repeat(8193) },
    ]) {
      assert.equal((await call(body)).status, 400);
    }

    assert.equal((await call({ command: "x".repeat(17000) })).status, 413);

    for (const mode of ["stopped", "mount", "network", "attached", "token"]) {
      writeFileSync(state, mode);
      assert.equal((await call({ command: "echo test" })).status, 503, mode);
    }

    writeFileSync(state, "safe");
    const response = await call({ command: "echo '$HOME'; exit 7" });
    assert.equal(response.status, 200);
    const result = await response.json();
    assert.equal(result.output, "echo '$HOME'; exit 7");
    assert.equal(result.exitCode, 7);
    assert.ok(Number.isFinite(result.durationMs));
    const calls = readFileSync(log, "utf8").trim().split("\n").map(JSON.parse);
    assert.equal(calls.filter((args) => args[0] === "inspect").length, 6);
    assert.deepEqual(calls.at(-1), [
      "exec",
      id,
      "timeout",
      "-k",
      "1s",
      "30s",
      "sh",
      "-c",
      "echo '$HOME'; exit 7",
    ]);
  } finally {
    child.kill();
    await once(child, "exit");
    rmSync(dir, { recursive: true, force: true });
  }
});

test("startup fails closed without credentials or a full container ID", async () => {
  const child = spawn(process.execPath, [resolve("agents/cloud-coding/scripts/local-broker.mjs")], {
    env: { ...process.env, LOCAL_BROKER_TOKEN: "", LOCAL_BROKER_CONTAINER_ID: id },
    stdio: "ignore",
  });

  const [code] = await once(child, "exit");
  assert.equal(code, 1);
});
