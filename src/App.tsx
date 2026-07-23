import { useCallback, useEffect, useState } from "react";
import WalletPanel from "./components/WalletPanel";
import BillForm from "./components/BillForm";
import ParticipantLedger from "./components/ParticipantLedger";
import TransactionLog from "./components/TransactionLog";
import type { Participant, TxRecord } from "./types";
import {
  buildPaymentTransaction,
  fetchBalances,
  fundWithFriendbot,
  isLikelyValidPublicKey,
  submitSignedTransaction,
  NETWORK_PASSPHRASE,
} from "./lib/stellar";
import {
  checkNetwork,
  connectFreighter,
  getCurrentAddress,
  signWithFreighter,
} from "./lib/freighter";

function makeId(): string {
  return Math.random().toString(36).slice(2, 10);
}

export default function App() {
  const [address, setAddress] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [networkWarning, setNetworkWarning] = useState<string | null>(null);

  const [balance, setBalance] = useState<string | null>(null);
  const [balanceLoading, setBalanceLoading] = useState(false);
  const [accountExists, setAccountExists] = useState(false);
  const [funding, setFunding] = useState(false);

  const [total, setTotal] = useState("");
  const [tipPercent, setTipPercent] = useState("0");
  const [participants, setParticipants] = useState<Participant[]>([]);

  const [payingId, setPayingId] = useState<string | null>(null);
  const [txRecords, setTxRecords] = useState<TxRecord[]>([]);
  const [globalError, setGlobalError] = useState<string | null>(null);

  const refreshBalance = useCallback(async (pubKey: string) => {
    setBalanceLoading(true);
    try {
      const result = await fetchBalances(pubKey);
      setAccountExists(result.exists);
      setBalance(result.native);
    } finally {
      setBalanceLoading(false);
    }
  }, []);

  // Pick up an already-authorized Freighter session on load, without
  // forcing a fresh connect prompt.
  useEffect(() => {
    (async () => {
      const existing = await getCurrentAddress();
      if (existing) {
        setAddress(existing);
        const net = await checkNetwork();
        setNetworkWarning(
          net.isTestnet
            ? null
            : `Freighter is on ${net.network ?? "an unknown network"}. Switch to Testnet in the extension.`
        );
        refreshBalance(existing);
      }
    })();
  }, [refreshBalance]);

  async function handleConnect() {
    setConnecting(true);
    setGlobalError(null);
    try {
      const pubKey = await connectFreighter();
      const net = await checkNetwork();
      setNetworkWarning(
        net.isTestnet
          ? null
          : `Freighter is on ${net.network ?? "an unknown network"}. Switch to Testnet in the extension, then reconnect.`
      );
      setAddress(pubKey);
      await refreshBalance(pubKey);
    } catch (err) {
      setGlobalError(
        err instanceof Error
          ? err.message
          : "Couldn't connect to Freighter. Is the extension installed?"
      );
    } finally {
      setConnecting(false);
    }
  }

  function handleDisconnect() {
    setAddress(null);
    setBalance(null);
    setAccountExists(false);
    setNetworkWarning(null);
  }

  async function handleFund() {
    if (!address) return;
    setFunding(true);
    setGlobalError(null);
    try {
      await fundWithFriendbot(address);
      await refreshBalance(address);
    } catch (err) {
      setGlobalError(
        err instanceof Error ? err.message : "Friendbot funding failed."
      );
    } finally {
      setFunding(false);
    }
  }

  function handleAddParticipant(name: string, addr: string): string | null {
    if (!name) return "Give this diner a name.";
    if (!isLikelyValidPublicKey(addr)) {
      return "That doesn't look like a valid Stellar public key (starts with G, 56 characters).";
    }
    if (participants.some((p) => p.address === addr)) {
      return "That address is already on the tab.";
    }
    setParticipants((prev) => [
      ...prev,
      { id: makeId(), name, address: addr, paid: false },
    ]);
    return null;
  }

  function handleRemoveParticipant(id: string) {
    setParticipants((prev) => prev.filter((p) => p.id !== id));
  }

  const totalNum = parseFloat(total) || 0;
  const tipNum = parseFloat(tipPercent) || 0;
  const grandTotal = totalNum + totalNum * (tipNum / 100);
  const shareAmount =
    participants.length > 0 ? grandTotal / participants.length : 0;

  async function handlePay(participant: Participant) {
    if (!address || shareAmount <= 0) return;
    setPayingId(participant.id);
    setGlobalError(null);

    const recordId = makeId();
    setTxRecords((prev) => [
      {
        id: recordId,
        participantName: participant.name,
        amount: shareAmount.toFixed(7),
        status: "pending",
        timestamp: Date.now(),
      },
      ...prev,
    ]);

    try {
      const tx = await buildPaymentTransaction(
        address,
        participant.address,
        shareAmount.toFixed(7),
        `split:${participant.name}`.slice(0, 28)
      );
      const signedXdr = await signWithFreighter(
        tx.toXDR(),
        address,
        NETWORK_PASSPHRASE
      );
      const result = await submitSignedTransaction(signedXdr);

      setTxRecords((prev) =>
        prev.map((r) =>
          r.id === recordId
            ? { ...r, status: "success", hash: result.hash }
            : r
        )
      );
      setParticipants((prev) =>
        prev.map((p) => (p.id === participant.id ? { ...p, paid: true } : p))
      );
      await refreshBalance(address);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Transaction failed.";
      setTxRecords((prev) =>
        prev.map((r) =>
          r.id === recordId
            ? { ...r, status: "failed", errorMessage: message }
            : r
        )
      );
    } finally {
      setPayingId(null);
    }
  }

  return (
    <div className="app-shell">
      <header className="hero-ticket">
        <div className="stub-perf stub-perf-top" aria-hidden="true" />
        <p className="eyebrow">Stellar Testnet · White Belt Challenge</p>
        <h1 className="hero-title">Split the Bill</h1>
        <p className="hero-tagline">
          Divide a tab, punch the ticket, settle it in XLM — no IOUs.
        </p>
        <div className="stub-perf stub-perf-bottom" aria-hidden="true" />
      </header>

      {globalError && (
        <p className="warning-banner global-error" role="alert">
          {globalError}
        </p>
      )}

      <main className="layout-grid">
        <div className="layout-col layout-col-side">
          <WalletPanel
            address={address}
            balance={balance}
            balanceLoading={balanceLoading}
            accountExists={accountExists}
            connecting={connecting}
            networkWarning={networkWarning}
            onConnect={handleConnect}
            onDisconnect={handleDisconnect}
            onFund={handleFund}
            funding={funding}
          />

          {participants.length > 0 && (
            <section className="ticket-card summary-card">
              <p className="eyebrow">Summary</p>
              <dl className="stub-row">
                <dt>Subtotal</dt>
                <dd className="mono">{totalNum.toFixed(2)} XLM</dd>
              </dl>
              <dl className="stub-row">
                <dt>Tip ({tipNum || 0}%)</dt>
                <dd className="mono">
                  {(totalNum * (tipNum / 100)).toFixed(2)} XLM
                </dd>
              </dl>
              <div className="stub-divider" aria-hidden="true" />
              <dl className="stub-row stub-row-balance">
                <dt>Total</dt>
                <dd className="mono balance-amount">
                  {grandTotal.toFixed(2)} XLM
                </dd>
              </dl>
              <dl className="stub-row">
                <dt>Per diner ({participants.length})</dt>
                <dd className="mono">{shareAmount.toFixed(7)} XLM</dd>
              </dl>
            </section>
          )}
        </div>

        <div className="layout-col layout-col-main">
          <BillForm
            total={total}
            tipPercent={tipPercent}
            onTotalChange={setTotal}
            onTipChange={setTipPercent}
            onAddParticipant={handleAddParticipant}
          />

          <ParticipantLedger
            participants={participants}
            shareAmount={shareAmount}
            walletConnected={!!address}
            payingId={payingId}
            onPay={handlePay}
            onRemove={handleRemoveParticipant}
          />

          <TransactionLog records={txRecords} />
        </div>
      </main>

      <footer className="app-footer">
        <p>
          Built for the Stellar Frontend Challenge · Level 1 — White Belt ·
          Testnet only, no real funds involved.
        </p>
      </footer>
    </div>
  );
}
