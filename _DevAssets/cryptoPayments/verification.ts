import { ethers } from 'ethers';

const TRANSFER_TOPIC = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';

// Chain ID to API key mapping
const CHAIN_API_KEYS: { [chainId: number]: string } = {
  137: process.env.POLYGON_API_KEY || '', // Polygon
  1: process.env.ETHEREUM_API_KEY || '', // Ethereum
  56: process.env.BSC_API_KEY || '', // BSC
  42161: process.env.ARBITRUM_API_KEY || '', // Arbitrum
  10: process.env.OPTIMISM_API_KEY || '', // Optimism
  43114: process.env.AVALANCHE_API_KEY || '', // Avalanche C-Chain
  8453: process.env.BASE_API_KEY || '', // Base
};

// Network name to chain ID mapping
const NETWORK_TO_CHAIN_ID: { [network: string]: number } = {
  'polygon': 137,
  'ethereum': 1,
  'bsc': 56,
  'arbitrum': 42161,
  'optimism': 10,
  'avalanche_c_chain': 43114,
  'base': 8453,
};

/**
 * Get chain ID from network name
 */
function getChainId(network: string): number {
  const normalizedNetwork = network.toLowerCase().trim();
  const chainId = NETWORK_TO_CHAIN_ID[normalizedNetwork];
  if (!chainId) {
    throw new Error(`Unsupported network: ${network}`);
  }
  return chainId;
}

/**
 * Get API key for a chain ID
 */
function getApiKey(chainId: number): string {
  const apiKey = CHAIN_API_KEYS[chainId];
  if (!apiKey) {
    throw new Error(`API key not configured for chain ID ${chainId}. Please set the appropriate environment variable.`);
  }
  return apiKey;
}

/**
 * Verify Polygon USDC transaction with confirmation checking
 * Based on the provided code snippet, adapted to support multiple chains
 */
export async function verifyPolygonUSDCTransaction(
  txHash: string,
  adminWalletAddress: string,
  network: string = 'polygon',
  minConfirmations: number = 12
) {
  const chainId = getChainId(network);
  const apiKey = getApiKey(chainId);

  /* ----------------------------------------------------
   * 1️⃣ Get transaction receipt
   * -------------------------------------------------- */
  const receiptRes = await fetch(
    `https://api.etherscan.io/v2/api` +
      `?chainid=${chainId}` +
      `&module=proxy` +
      `&action=eth_getTransactionReceipt` +
      `&txhash=${txHash}` +
      `&apikey=${apiKey}`
  );

  const receiptJson = await receiptRes.json();
  const receipt = receiptJson.result;

  if (!receipt) {
    throw new Error('Transaction not mined yet');
  }

  if (receipt.status !== '0x1') {
    throw new Error('Transaction failed');
  }

  const txBlock = parseInt(receipt.blockNumber, 16);

  /* ----------------------------------------------------
   * 2️⃣ Get latest block → confirmations
   * -------------------------------------------------- */
  const blockRes = await fetch(
    `https://api.etherscan.io/v2/api` +
      `?chainid=${chainId}` +
      `&module=proxy` +
      `&action=eth_blockNumber` +
      `&apikey=${apiKey}`
  );

  const blockJson = await blockRes.json();
  const latestBlock = parseInt(blockJson.result, 16);
  const confirmations = latestBlock - txBlock;

  /* ----------------------------------------------------
   * 3️⃣ Find & decode USDC Transfer event
   * -------------------------------------------------- */
  const transfers = receipt.logs
    .filter((l: any) => l.topics[0] === TRANSFER_TOPIC)
    .map((log: any) => ({
      from: ethers.getAddress('0x' + log.topics[1].slice(26)),
      to: ethers.getAddress('0x' + log.topics[2].slice(26)),
      amount: Number(BigInt(log.data)) / 1_000_000,
      tokenContract: log.address,
    }));

  const payment = transfers.find(
    (t: { from: string; to: string; amount: number; tokenContract: string }) => t.to.toLowerCase() === adminWalletAddress.toLowerCase()
  );

  if (!payment) {
    throw new Error('No payment to platform wallet found');
  }

  /* ----------------------------------------------------
   * 4️⃣ Final result
   * -------------------------------------------------- */
  return {
    success: true,
    confirmed: confirmations >= minConfirmations,
    confirmations,
    requiredConfirmations: minConfirmations,
    ...payment,
    txHash,
  };
}

