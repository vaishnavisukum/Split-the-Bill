import type { TxRecord } from "../types";
import { EXPLORER_TX_URL } from "../lib/stellar";

interface TransactionLogProps {
  records: TxRecord[];
}

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export default function TransactionLog({ records }: TransactionLogProps) {
  if (records.length === 0) return null;

  return (
    <section className="ticket-card log-card" aria-label="Transaction log">
      <p className="eyebrow">04 · Transaction Log</p>
      <h2 className="ticket-title">Settled on Testnet</h2>

      <ul className="tx-list">
        {records.map((r) => (
          <li key={r.id} className={`tx-row tx-row-${r.status}`}>
            <div className="tx-row-top">
              <span
                className={`stamp ${
                  r.status === "success"
                    ? "stamp-paid"
                    : r.status === "failed"
                    ? "stamp-failed"
                    : "stamp-pending"
                }`}
              >
                {r.status === "success"
                  ? "PAID"
                  : r.status === "failed"
                  ? "FAILED"
                  : "SENDING"}
              </span>
              <span className="tx-participant">{r.participantName}</span>
              <span className="mono tx-amount">{r.amount} XLM</span>
            </div>
            <div className="tx-row-bottom">
              <span className="mono tx-time">{formatTime(r.timestamp)}</span>
              {r.status === "success" && r.hash && (
                <a
                  className="mono tx-hash"
                  href={`${EXPLORER_TX_URL}/${r.hash}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  {r.hash.slice(0, 10)}… ↗
                </a>
              )}
              {r.status === "failed" && r.errorMessage && (
                <span className="tx-error">{r.errorMessage}</span>
              )}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
