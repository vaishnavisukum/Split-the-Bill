import { EXPLORER_ACCOUNT_URL, formatXlm } from "../lib/stellar";

interface WalletPanelProps {
  address: string | null;
  balance: string | null;
  balanceLoading: boolean;
  accountExists: boolean;
  connecting: boolean;
  networkWarning: string | null;
  onConnect: () => void;
  onDisconnect: () => void;
  onFund: () => void;
  funding: boolean;
}

function truncate(address: string): string {
  return `${address.slice(0, 4)}···${address.slice(-4)}`;
}

export default function WalletPanel({
  address,
  balance,
  balanceLoading,
  accountExists,
  connecting,
  networkWarning,
  onConnect,
  onDisconnect,
  onFund,
  funding,
}: WalletPanelProps) {
  return (
    <section className="ticket-card wallet-stub" aria-label="Wallet">
      <div className="stub-perf stub-perf-top" aria-hidden="true" />
      <p className="eyebrow">01 · Boarding Pass</p>
      <h2 className="ticket-title">Your Wallet</h2>

      {!address ? (
        <>
          <p className="stub-copy">
            Connect Freighter on Stellar Testnet to check in.
          </p>
          <button
            className="btn btn-brass"
            onClick={onConnect}
            disabled={connecting}
          >
            {connecting ? "Connecting…" : "Connect Freighter"}
          </button>
        </>
      ) : (
        <>
          {networkWarning && (
            <p className="warning-banner" role="alert">
              {networkWarning}
            </p>
          )}

          <dl className="stub-row">
            <dt>Passenger</dt>
            <dd className="mono">
              <a
                href={`${EXPLORER_ACCOUNT_URL}/${address}`}
                target="_blank"
                rel="noreferrer"
              >
                {truncate(address)}
              </a>
            </dd>
          </dl>

          <div className="stub-divider" aria-hidden="true" />

          <dl className="stub-row stub-row-balance">
            <dt>Balance</dt>
            <dd className="mono balance-amount">
              {balanceLoading
                ? "…"
                : accountExists
                ? `${formatXlm(balance ?? "0")} XLM`
                : "Not funded"}
            </dd>
          </dl>

          {!balanceLoading && !accountExists && (
            <>
              <p className="stub-copy">
                This testnet account doesn't exist on-chain yet. Fund it with
                Friendbot to get started.
              </p>
              <button
                className="btn btn-teal"
                onClick={onFund}
                disabled={funding}
              >
                {funding ? "Funding…" : "Fund with Friendbot"}
              </button>
            </>
          )}

          <button className="btn btn-ghost" onClick={onDisconnect}>
            Disconnect
          </button>
        </>
      )}
      <div className="stub-perf stub-perf-bottom" aria-hidden="true" />
    </section>
  );
}
