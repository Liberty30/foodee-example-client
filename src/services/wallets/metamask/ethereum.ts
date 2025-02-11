import { JsonRpcPayload, JsonRpcResponse } from "web3-core-helpers";

interface ConnectInfo {
  chainId: string;
}

interface ProviderRpcError extends Error {
  message: string;
  code: number;
  data?: unknown;
}

interface ProviderMessage {
  type: string;
  data: unknown;
}

interface RequestArguments {
  method: string;
  params?: unknown[] | Record<string, unknown>;
  from?: string;
}

interface Callback<ResultType> {
  (error: Error): void;
  (error: null, val: ResultType): void;
}

export interface EthereumProvider {
  isMetaMask?: boolean;
  autoRefreshOnNetworkChange: boolean;
  chainId: number;

  isConnected(): boolean;

  on(event: "accountsChanged", handler: (addresses: string[]) => void): void;
  on(event: "chainChanged", handler: (chainId: string) => void): void;
  on(event: "connect", handler: (connectInfo: ConnectInfo) => void): void;
  on(event: "disconnect", handler: (error: ProviderRpcError) => void): void;
  on(event: "message", handler: (message: ProviderMessage) => void): void;

  request(request: RequestArguments): Promise<any>;

  sendAsync(
    payload: JsonRpcPayload,
    callback: (error: Error | null, result?: JsonRpcResponse) => void
  ): void;
  send(payload: JsonRpcPayload, callback: Callback<JsonRpcResponse>): any;
}
// eip-1193
const ethereum = (window as any).ethereum as
  | EthereumProvider
  | null
  | undefined;

if (ethereum) (ethereum as EthereumProvider).autoRefreshOnNetworkChange = false;

export default ethereum;
