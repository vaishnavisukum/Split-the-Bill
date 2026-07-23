import {
  Horizon,
  Networks,
  TransactionBuilder,
  Operation,
  Asset,
  BASE_FEE,
  Memo,
} from "@stellar/stellar-sdk";

/** Testnet Horizon endpoint — this app only ever talks to testnet. */
export const HORIZON_URL = "https://horizon-testnet.stellar.org";
export const FRIENDBOT_URL = "https://friendbot.stellar.org";
export const NETWORK_PASSPHRASE = Networks.TESTNET;
export const EXPLORER_TX_URL = "https://stellar.expert/explorer/testnet/tx";
export const EXPLORER_ACCOUNT_URL =
  "https://stellar.expert/explorer/testnet/account";

export const server = new Horizon.Server(HORIZON_URL);

export interface AccountBalance {
  balance: string;
  assetType: string;
}

/**
 * Fetch every balance line for an account. Returns an empty XLM balance
 * (and `exists: false`) for accounts that haven't been funded on testnet yet,
 * rather than throwing, so the UI can prompt the person to fund it.
 */
export async function fetchBalances(
  publicKey: string
): Promise<{ exists: boolean; native: string; all: AccountBalance[] }> {
  try {
    const account = await server.loadAccount(publicKey);
    const native =
      account.balances.find((b) => b.asset_type === "native")?.balance ??
      "0";
    return {
      exists: true,
      native,
      all: account.balances.map((b) => ({
        balance: b.balance,
        assetType: b.asset_type,
      })),
    };
  } catch {
    // Horizon returns 404 for an account that has never been created/funded.
    return { exists: false, native: "0", all: [] };
  }
}

/** Ask testnet Friendbot to fund a freshly created account with test XLM. */
export async function fundWithFriendbot(publicKey: string): Promise<void> {
  const response = await fetch(`${FRIENDBOT_URL}?addr=${publicKey}`);
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Friendbot funding failed: ${body}`);
  }
}

/**
 * Build an unsigned XLM payment transaction from `sourceAddress` to
 * `destinationAddress`. The caller is responsible for signing (Freighter)
 * and submitting it.
 */
export async function buildPaymentTransaction(
  sourceAddress: string,
  destinationAddress: string,
  amount: string,
  memoText?: string
) {
  const sourceAccount = await server.loadAccount(sourceAddress);

  const builder = new TransactionBuilder(sourceAccount, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(
      Operation.payment({
        destination: destinationAddress,
        asset: Asset.native(),
        amount,
      })
    )
    .setTimeout(180);

  if (memoText) {
    builder.addMemo(Memo.text(memoText.slice(0, 28)));
  }

  return builder.build();
}

/** Submit a signed transaction XDR (as returned by Freighter) to Horizon. */
export async function submitSignedTransaction(signedXdr: string) {
  const transaction = TransactionBuilder.fromXDR(signedXdr, NETWORK_PASSPHRASE);
  return server.submitTransaction(transaction);
}

/** Basic G... public key shape check — not a full checksum validation. */
export function isLikelyValidPublicKey(value: string): boolean {
  return /^G[A-Z2-7]{55}$/.test(value.trim());
}

export function formatXlm(value: string | number): string {
  const n = typeof value === "string" ? parseFloat(value) : value;
  if (Number.isNaN(n)) return "0.0000000";
  return n.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 7,
  });
}
