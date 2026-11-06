# Cloud coding experiment

This experiment gives an existing agent a disposable Cloudflare workspace.
The MCP server exposes Cloudflare Code Mode `search` and `execute` tools.
The workspace starts with a small TypeScript bug and no credentials.
The container has internet access disabled.

Read [DESIGN.md](DESIGN.md) for the design and later milestones.
This is a learning experiment. It is not a production security boundary.

## Requirements

- Node.js, pnpm, and Docker. Start the Docker daemon before local tests.
- A Cloudflare account with the [Workers Paid plan](https://developers.cloudflare.com/sandbox/) for deployment.
- Codex or another MCP client for interactive use.

Run commands from the repository root. Install dependencies with `pnpm install`.

## Run locally

Start the local server with a test token. Use this token only on your machine.

```sh
pnpm --filter cloud-coding exec wrangler dev --local --port 8799 --var MCP_BEARER_TOKEN:local-test-token-12345
```

In another terminal, run the smoke test:

```sh
MCP_BEARER_TOKEN=local-test-token-12345 node agents/cloud-coding/test/local-smoke.mjs
```

The test checks authentication, tool discovery, the fixture fix, and a denied network request.
It also checks the test status and patch. The test deletes its workspace at the end.
One failed network request does not prove that all network access is blocked.
Local Docker isolation is different from the deployed Cloudflare container isolation.

To connect Codex, put the test token in its environment and add the server:

```sh
export CLOUD_CODING_TOKEN=local-test-token-12345
codex mcp add cloud-coding --url http://127.0.0.1:8799/mcp --bearer-token-env-var CLOUD_CODING_TOKEN
```

Start a new Codex session with that environment. Ask it to use the `cloud-coding` MCP tools.
Ask it to fix the fixture, run the tests, and show the patch.
Codex may require approval for MCP tool calls. A session that denies approvals cannot complete this task.

## Deploy later

First check the account plan and Cloudflare container charges.
Use a unique, random bearer token for the deployed server.
Set `MCP_BEARER_TOKEN` as a Worker secret with Wrangler. Do not put it in source files or chat.
Use `wrangler deploy` from this package to deploy after you configure the account.
Use an HTTPS MCP URL and keep the bearer token in the client environment.

## Current limits

- The local smoke test uses an MCP client. It does not prove that a Codex session completed the task.
- Cloudflare deployment and deployed network isolation have not yet been tested.
- The server uses one shared fixture workspace for all holders of the token. It is for one trusted user and one task at a time.
- The workspace is disposable. Cleanup or inactivity deletes its files.
- Commands time out and output is capped. The implementation does not fully contain hostile process trees or output-file tampering.
- Command status does not survive a client disconnect. An interrupted command may have changed the workspace.
- The server starts with the bundled fixture. The optional local host-side snapshot command can add reviewed committed files. The server does not clone repositories or install packages.
- The patch is a `diff -u` result. The managed image does not provide Git.
- Code Mode is experimental. Its APIs may change.

## Copy a local committed snapshot

This optional host-side command copies selected files from the local
`/Users/santoshvenkatraman/Personal/Coding/prompt-shelf` repository. It reads
blobs from one resolved `HEAD` commit. It does not read working-tree changes,
Git configuration, or credentials. It does not modify the source repository.
The file arguments form the allowlist. Directories, symlinks, dotfiles, sensitive
file names, and paths with traversal are rejected. The total limit is 2 MiB.

Before running it, inspect the exact committed contents of every file. Do not
select files that contain secrets, tokens, private data, or generated credentials.
The script rejects some common secret patterns, but it cannot detect all secrets.
The operator must review the commit and the selected files. For example:

```sh
git -C /Users/santoshvenkatraman/Personal/Coding/prompt-shelf rev-parse HEAD
git -C /Users/santoshvenkatraman/Personal/Coding/prompt-shelf show HEAD:path/to/reviewed-file
```

Start the local server and run a fixture command first to start its container.
Find the full ID of the intended disposable sandbox with `docker ps --no-trunc`.
Check the ID carefully. Then pass that ID and the reviewed paths:

```sh
node agents/cloud-coding/scripts/snapshot.mjs <full-container-id> <reviewed-commit-id> path/to/reviewed-file
```

The command accepts the local Node 24 image used by the current Cloudflare
development runtime. It requires a matching workspace name and no Docker mounts.
It uses the exact ID and does not start, stop, or remove containers.
It creates `/workspace/snapshot` once. It fails if that directory already exists.
The directory disappears when the disposable workspace is destroyed. The sandbox
must have Node.js and an existing `/workspace` directory. This route is local
Docker only; it does not work with a deployed Cloudflare container. It does not
prove the selected container belongs to this experiment. Container image names and
the local Docker daemon are not security boundaries. The command does not add a
host path or a snapshot upload operation to MCP. The normal MCP command tool can
read and modify the copied files. Avoid concurrent sandbox commands during the copy.
The command requires the full reviewed commit ID and fails if `HEAD` has changed.
Review files with `git show <reviewed-commit-id>:path/to/file` before the copy.

## Prepare files and dependencies offline

This local workflow creates a separate Docker execution container. It does not
connect that container to the MCP server. The managed local workspace shares a
network namespace with a proxy. It does not use Docker network mode `none`.
The preparation command rejects it. Use `docker exec` to work in the separate
container. This workflow does not deploy anything.

Review the exact commit and every selected file as described above. Include the
root manifest, lockfile, workspace configuration, each selected workspace
manifest, and the source files you need. The snapshot rules above also apply
here. They reject dotfiles, symlinks, and snapshots over 2 MiB. Partial
workspaces, local dependencies, native modules, and packages that need install
scripts may not work. The pnpm store must already contain every package for the
selected lockfile and the setup container's platform. This command does not
fetch missing packages or populate the host store.

Prepare a trusted local Linux setup image with Node, tar, and the pnpm version
required by the selected commit. Build it separately before this workflow. For
example, use a reviewed Node image and install the required pnpm version in it.
The setup image must use the same OS and CPU architecture as the execution
image. For example, build a local image with the pnpm version from the reviewed
manifest. Replace `<platform>` and `<pnpm-version>` first. This build uses the
network and must be run separately from the offline preparation step.

```sh
docker build --platform <platform> -t cloud-coding-setup - <<'DOCKERFILE'
FROM node:24
RUN npm install -g pnpm@<pnpm-version>
DOCKERFILE
```

Pass the versioned directory printed by `pnpm store path`, using the same pnpm
version as the setup image. Copying a large store can take time and disk space.
Review the image and dependencies:
`--ignore-scripts` does not make their contents trustworthy. Do not put secrets
in the image or the selected files. The secret filter is only a backstop.

Start a disposable execution container with the exact local runtime image digest
used by this experiment. Replace the digest below with the digest reported by
`docker inspect` for a local cloud-coding workspace. Use a unique name that
matches the example. The container must have no mounts.

```sh
docker run -d --network none --name workerd-cloud-coding-Workspace-abcd \
  --entrypoint sleep docker.io/library/node:24.20.0-trixie-slim@sha256:<digest> infinity
docker exec workerd-cloud-coding-Workspace-abcd mkdir -p /workspace
docker inspect --format '{{.Id}}' workerd-cloud-coding-Workspace-abcd
```

Then use the full container ID, the reviewed commit ID, the local setup image,
the absolute host pnpm store path, and the reviewed file paths:

```sh
node agents/cloud-coding/scripts/prepare.mjs /Users/santoshvenkatraman/Personal/Coding/prompt-shelf \
  <full-container-id> <reviewed-commit-id> \
  <local-setup-image> <absolute-pnpm-store-path> \
  package.json pnpm-lock.yaml pnpm-workspace.yaml app/package.json <other-reviewed-files>
docker exec -it <full-container-id> sh
```

The command copies committed blobs into a temporary setup container. That
container has Docker networking disabled. It mounts the host store read-only,
copies it internally, and runs `pnpm install --offline --ignore-scripts
--frozen-lockfile`. It then copies the resulting tree into the execution
container and removes the setup container. It removes `.git` entries before
transfer. It fails if `/workspace/snapshot` already exists. The execution
container receives no source or store mount and uses Docker network mode `none`.
It receives no GitHub token from this workflow. Check the image and files for
credentials yourself. Avoid concurrent commands in either container during
preparation. The Docker daemon, local host, setup image, and operator are trusted.
Docker network mode `none` is not a claim of complete isolation from the host.
The copied dependency tree may contain sensitive data if the store or packages
do. Review those inputs before use. Remove the disposable execution container
when finished:

```sh
docker rm -f <full-container-id>
```

The optional integration test builds a small fixture and populates a temporary
cache over the network. It then tests the offline preparation step. It requires
a setup image with pnpm 10 and the matching managed Node image digest:

```sh
CLOUD_CODING_TEST_IMAGE=<setup-image> CLOUD_CODING_NODE_IMAGE=<node-image-with-digest> \
  node --test agents/cloud-coding/test/prepare.integration.test.mjs
```
