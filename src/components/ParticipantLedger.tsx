import type { Participant } from "../types";
import { formatXlm } from "../lib/stellar";

interface ParticipantLedgerProps {
  participants: Participant[];
  shareAmount: number;
  walletConnected: boolean;
  payingId: string | null;
  onPay: (participant: Participant) => void;
  onRemove: (id: string) => void;
}

function truncateAddress(address: string): string {
  return `${address.slice(0, 4)}···${address.slice(-4)}`;
}

export default function ParticipantLedger({
  participants,
  shareAmount,
  walletConnected,
  payingId,
  onPay,
  onRemove,
}: ParticipantLedgerProps) {
  if (participants.length === 0) {
    return (
      <section className="ticket-card receipt-card" aria-label="Diners">
        <p className="eyebrow">03 · The Tab</p>
        <h2 className="ticket-title">Nobody's on the tab yet</h2>
        <p className="stub-copy">
          Add diners above — each one's share will show up here as a line
          item you can settle in XLM.
        </p>
      </section>
    );
  }

  return (
    <section className="ticket-card receipt-card" aria-label="Diners">
      <p className="eyebrow">03 · The Tab</p>
      <h2 className="ticket-title">Who Owes What</h2>

      <ul className="ledger-list">
        {participants.map((p) => (
          <li key={p.id} className="ledger-row">
            <div className="ledger-row-main">
              <span className="ledger-name">{p.name}</span>
              <span className="ledger-leader" aria-hidden="true" />
              <span className="mono ledger-amount">
                {formatXlm(shareAmount)} XLM
              </span>
            </div>
            <div className="ledger-row-meta">
              <span className="mono ledger-address">
                {truncateAddress(p.address)}
              </span>
              <div className="ledger-actions">
                {p.paid ? (
                  <span className="badge badge-paid">Paid ✓</span>
                ) : (
                  <button
                    className="btn btn-teal btn-tiny"
                    onClick={() => onPay(p)}
                    disabled={!walletConnected || payingId === p.id}
                  >
                    {payingId === p.id ? "Sending…" : "Pay share"}
                  </button>
                )}
                <button
                  className="btn btn-ghost btn-tiny"
                  onClick={() => onRemove(p.id)}
                  disabled={payingId === p.id}
                  aria-label={`Remove ${p.name}`}
                >
                  ✕
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>

      {!walletConnected && (
        <p className="stub-copy stub-copy-muted">
          Connect your wallet to send payments.
        </p>
      )}
    </section>
  );
}
