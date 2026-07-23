import {
  isConnected,
  requestAccess,
  getAddress,
  getNetworkDetails,
  setAllowed,
  signTransaction,
} from "@stellar/freighter-api";

export const EXPECTED_NETWORK = "TESTNET";

export interface FreighterCheck {
  installed: boolean;
  network: string | null;
  isTestnet: boolean;
}

/** Is the Freighter browser extension present at all? */
export async function isFreighterInstalled(): Promise<boolean> {
  const result = await isConnected();
  return !result.error && result.isConnected;
}

/** Prompt the person to grant this site access, returning their public key. */
export async function connectFreighter(): Promise<string> {
  const allowed = await setAllowed();
  if (allowed.error) {
    throw new Error(allowed.error.message ?? "Freighter access was denied.");
  }

  const access = await requestAccess();
  if (access.error) {
    throw new Error(access.error.message ?? "Could not access Freighter.");
  }
  return access.address;
}

/** Read the currently authorized address without prompting again. */
export async function getCurrentAddress(): Promise<string | null> {
  const result = await getAddress();
  if (result.error || !result.address) return null;
  return result.address;
}

/** Confirm the wallet is pointed at Stellar Testnet, not mainnet/futurenet. */
export async function checkNetwork(): Promise<FreighterCheck> {
  const installed = await isFreighterInstalled();
  if (!installed) {
    return { installed: false, network: null, isTestnet: false };
  }
  const details = await getNetworkDetails();
  const network = details.network ?? null;
  return {
    installed: true,
    network,
    isTestnet: network === EXPECTED_NETWORK,
  };
}

/** Hand an unsigned XDR to Freighter for the person to review and sign. */
export async function signWithFreighter(
  xdr: string,
  address: string,
  networkPassphrase: string
): Promise<string> {
  const result = await signTransaction(xdr, {
    address,
    networkPassphrase,
  });
  if (result.error) {
    throw new Error(result.error.message ?? "Signing was rejected.");
  }
  return result.signedTxXdr;
}
