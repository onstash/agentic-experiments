#!/usr/bin/env node
/* oxlint-disable anti-slop/no-runtime-typeof -- Validate untrusted JSON at the boundary. */
// Local development only. Docker isolation is not complete hostile-code containment.
import { createServer } from "node:http";
import { timingSafeEqual } from "node:crypto";
import { spawn } from "node:child_process";

const token = process.env.LOCAL_BROKER_TOKEN;

const container = process.env.LOCAL_BROKER_CONTAINER_ID;

const port = process.env.LOCAL_BROKER_PORT ?? "8788";

const maxBody = 16 * 1024;

const maxCommand = 8 * 1024;

const maxOutput = 64 * 1024;

const timeoutMs = 30_000;

if (
  !token ||
  Buffer.byteLength(token) < 32 ||
  !/^[a-f0-9]{64}$/.test(container ?? "") ||
  !/^\d+$/.test(port) ||
  Number(port) < 1 ||
  Number(port) > 65535
) {
  console.error(
    "Set LOCAL_BROKER_TOKEN (at least 32 bytes), LOCAL_BROKER_CONTAINER_ID (full Docker ID), and optionally LOCAL_BROKER_PORT (1-65535).",
  );
  process.exit(1);
}

function runDocker(args, limit, timeout) {
  return new Promise((resolve, reject) => {
    const child = spawn("docker", args, {
      stdio: ["ignore", "pipe", "pipe"],
      env: { PATH: process.env.PATH ?? "/usr/bin:/bin" },
    });

    const chunks = [];
    let size = 0;
    let reason;

    const timer = setTimeout(() => {
      reason = "timeout";
      child.kill("SIGKILL");
    }, timeout);

    for (const stream of [child.stdout, child.stderr]) {
      stream.on("data", (chunk) => {
        const remaining = limit - size;

        if (remaining > 0) chunks.push(chunk.subarray(0, remaining));
        size += chunk.length;

        if (size > limit && !reason) {
          reason = "output_limit";
          child.kill("SIGKILL");
        }
      });
    }

    child.on("error", (error) => {
      clearTimeout(timer);
      reject(error);
    });
    child.on("close", (code) => {
      clearTimeout(timer);
      resolve({ output: Buffer.concat(chunks).toString("utf8"), exitCode: code, reason });
    });
  });
}

function reply(res, status, body) {
  res.writeHead(status, { "content-type": "application/json", "cache-control": "no-store" });
  res.end(JSON.stringify(body));
}

createServer(async (req, res) => {
  const supplied = req.headers.authorization ?? "";
  const expected = Buffer.from(`Bearer ${token}`);
  const actual = Buffer.from(supplied);

  if (actual.length !== expected.length || !timingSafeEqual(actual, expected))
    return reply(res, 401, { error: "unauthorized" });

  if (req.method !== "POST" || req.url !== "/command")
    return reply(res, 404, { error: "not found" });
  let size = 0;
  const chunks = [];

  try {
    for await (const chunk of req) {
      size += chunk.length;

      if (size > maxBody) {
        reply(res, 413, { error: "request too large" });
        req.resume();

        return;
      }

      chunks.push(chunk);
    }
  } catch {
    return;
  }

  let body;

  try {
    body = JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    return reply(res, 400, { error: "invalid JSON" });
  }

  if (
    !body ||
    typeof body !== "object" ||
    Array.isArray(body) ||
    Object.keys(body).length !== 1 ||
    typeof body.command !== "string" ||
    !body.command ||
    Buffer.byteLength(body.command) > maxCommand ||
    body.command.includes("\0")
  ) {
    return reply(res, 400, {
      error: "expected only a nonempty command string of at most 8192 bytes without NUL",
    });
  }

  const started = Date.now();

  try {
    const inspection = await runDocker(["inspect", container], 256 * 1024, 5000);

    if (inspection.exitCode !== 0 || inspection.reason) throw new Error("inspection failed");
    const data = JSON.parse(inspection.output);
    const info = data.length === 1 && data[0];

    if (
      !info ||
      info.Id !== container ||
      info.State?.Running !== true ||
      !Array.isArray(info.Mounts) ||
      info.Mounts.length !== 0 ||
      info.HostConfig?.NetworkMode !== "none" ||
      !info.NetworkSettings?.Networks ||
      Object.keys(info.NetworkSettings.Networks).length !== 1 ||
      !("none" in info.NetworkSettings.Networks) ||
      !Array.isArray(info.Config?.Env) ||
      info.Config.Env.some((entry) => typeof entry !== "string" || entry.includes(token))
    )
      throw new Error("container rejected");

    // GNU/coreutils timeout bounds the in-container shell even if the Docker client exits.
    const result = await runDocker(
      ["exec", container, "timeout", "-k", "1s", "30s", "sh", "-c", body.command],
      maxOutput,
      timeoutMs + 2000,
    );

    const response = {
      output: result.output,
      exitCode: result.exitCode,
      durationMs: Date.now() - started,
    };

    if (result.reason) response.interrupted = result.reason;
    reply(res, 200, response);
  } catch {
    reply(res, 503, { error: "container unavailable or unsafe", durationMs: Date.now() - started });
  }
}).listen(Number(port), "127.0.0.1", () =>
  console.log(`Local broker listening on 127.0.0.1:${port}`),
);
