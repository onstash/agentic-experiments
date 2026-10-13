# Mental Model

## Host

MCP Host is the application/runtime containing the model

## Model

Model is the LLM

## Client

MCP Client is the host component connecting to one MCP server

## Server

MCP Server is the process exposing tools

### tools/list

`tools/list` lets the MCP client discover the tools exposed by the server, including their descriptions and input schemas.

### tools/call

`tools/call` invokes one discovered tool with arguments. For Total Recall, this may create a pending memory proposal, but it must not activate memory.

### JSON-RPC errors versus isError

A JSON-RPC error means the protocol request was invalid or unsupported. `isError: true` means the tool call was valid but the tool could not complete successfully.

## Why Life OS owns approval

Life OS owns canonical memory, user consent, approval policy, and audit history. Total Recall can propose memory, but it cannot activate memory.