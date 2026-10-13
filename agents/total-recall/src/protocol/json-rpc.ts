export type RequestId = string | number;

export type JsonRpcError = {
  code: number;
  message: string;
  data?: unknown;
};

export type JsonRpcRequest = {
  jsonrpc: "2.0";
  id: RequestId;
  method: string;
  params?: unknown;
};

export type JsonRpcResponse<TResult> =
  | {
      jsonrpc: "2.0";
      id: RequestId;
      result: TResult;
      error?: never;
    }
  | {
      jsonrpc: "2.0";
      id: RequestId | null;
      result?: never;
      error: JsonRpcError;
    };
