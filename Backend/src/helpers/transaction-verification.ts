import { getAddress } from 'ethers';

const TRANSFER_TOPIC =
  '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';

const CHAIN_API_KEYS: { [chainId: number]: string } = {
  137: process.env.POLYGON_API_KEY || '',
  1: process.env.ETHEREUM_API_KEY || '',
  56: process.env.BSC_API_KEY || '',
  42161: process.env.ARBITRUM_API_KEY || '',
  10: process.env.OPTIMISM_API_KEY || '',
  43114: process.env.AVALANCHE_API_KEY || '',
  8453: process.env.BASE_API_KEY || '',
};

const NETWORK_TO_CHAIN_ID: { [network: string]: number } = {
  polygon: 137,
  ethereum: 1,
  bsc: 56,
  arbitrum: 42161,
  optimism: 10,
  avalanche_c_chain: 43114,
  base: 8453,
};

function getChainId(network: string): number {
  const normalized = network.toLowerCase().trim();
  const chainId = NETWORK_TO_CHAIN_ID[normalized];
  if (chainId == null) {
    throw new Error(`Unsupported network: ${network}`);
  }
  return chainId;
}

function getApiKey(chainId: number): string {
  const apiKey = CHAIN_API_KEYS[chainId];
  if (!apiKey) {
    throw new Error(
      `API key not configured for chain ID ${chainId}. Set the appropriate env (e.g. POLYGON_API_KEY).`,
    );
  }
  return apiKey;
}

export interface VerifyTransactionResult {
  success: true;
  confirmed: boolean;
  confirmations: number;
  requiredConfirmations: number;
  from: string;
  to: string;
  amount: number;
  tokenContract: string;
  txHash: string;
}

/**
 * Verify USDC transfer to admin wallet using Etherscan-compatible API (multi-chain).
 */
export async function verifyPolygonUSDCTransaction(
  txHash: string,
  adminWalletAddress: string,
  network: string = 'polygon',
  minConfirmations: number = 12,
): Promise<VerifyTransactionResult> {
  const chainId = getChainId(network);
  const apiKey = getApiKey(chainId);

  const base = 'https://api.etherscan.io/v2/api';
  const q = (p: Record<string, string>) =>
    new URLSearchParams({ ...p, apikey: apiKey, chainid: String(chainId) }).toString();

  const receiptRes = await fetch(
    `${base}?${q({ module: 'proxy', action: 'eth_getTransactionReceipt', txhash: txHash })}`,
  );
  const receiptJson = (await receiptRes.json()) as { result?: { status: string; blockNumber: string; logs?: Array<{ topics: string[]; data: string; address: string }> } };
  const receipt = receiptJson.result;

  if (!receipt) {
    throw new Error('Transaction not mined yet');
  }
  if (receipt.status !== '0x1') {
    throw new Error('Transaction failed');
  }

  const txBlock = parseInt(receipt.blockNumber, 16);

  const blockRes = await fetch(
    `${base}?${q({ module: 'proxy', action: 'eth_blockNumber' })}`,
  );
  const blockJson = (await blockRes.json()) as { result: string };
  const latestBlock = parseInt(blockJson.result, 16);
  const confirmations = latestBlock - txBlock;

  const logs = receipt.logs ?? [];
  const transfers = logs
    .filter((l) => l.topics?.[0] === TRANSFER_TOPIC)
    .map((log) => ({
      from: getAddress('0x' + (log.topics[1] ?? '').slice(26)),
      to: getAddress('0x' + (log.topics[2] ?? '').slice(26)),
      amount: Number(BigInt(log.data)) / 1_000_000,
      tokenContract: log.address,
    }));

  const adminLower = adminWalletAddress.toLowerCase();
  const payment = transfers.find((t) => t.to.toLowerCase() === adminLower);
  if (!payment) {
    throw new Error('No payment to platform wallet found');
  }

  return {
    success: true,
    confirmed: confirmations >= minConfirmations,
    confirmations,
    requiredConfirmations: minConfirmations,
    ...payment,
    txHash,
  };
}
