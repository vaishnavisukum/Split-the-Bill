import { useState, type FormEvent } from "react";

interface BillFormProps {
  total: string;
  tipPercent: string;
  onTotalChange: (value: string) => void;
  onTipChange: (value: string) => void;
  onAddParticipant: (name: string, address: string) => string | null;
}

export default function BillForm({
  total,
  tipPercent,
  onTotalChange,
  onTipChange,
  onAddParticipant,
}: BillFormProps) {
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  function handleAdd(e: FormEvent) {
    e.preventDefault();
    const error = onAddParticipant(name.trim(), address.trim());
    if (error) {
      setFormError(error);
      return;
    }
    setFormError(null);
    setName("");
    setAddress("");
  }

  return (
    <section className="ticket-card receipt-card" aria-label="Bill details">
      <p className="eyebrow">02 · Itemized Receipt</p>
      <h2 className="ticket-title">Split the Bill</h2>

      <div className="field-row">
        <label className="field">
          <span>Total bill (XLM)</span>
          <input
            className="mono"
            type="number"
            min="0"
            step="0.0000001"
            inputMode="decimal"
            placeholder="0.00"
            value={total}
            onChange={(e) => onTotalChange(e.target.value)}
          />
        </label>

        <label className="field field-narrow">
          <span>Tip %</span>
          <input
            className="mono"
            type="number"
            min="0"
            max="100"
            step="1"
            inputMode="numeric"
            placeholder="0"
            value={tipPercent}
            onChange={(e) => onTipChange(e.target.value)}
          />
        </label>
      </div>

      <div className="stub-divider" aria-hidden="true" />

      <form className="add-participant-form" onSubmit={handleAdd}>
        <p className="field-group-label">Add a diner</p>
        <div className="field-row">
          <label className="field">
            <span>Name</span>
            <input
              type="text"
              placeholder="Maya"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={24}
            />
          </label>
          <label className="field field-wide">
            <span>Stellar address (G…)</span>
            <input
              className="mono"
              type="text"
              placeholder="GABC…WXYZ"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              spellCheck={false}
            />
          </label>
        </div>
        {formError && (
          <p className="form-error" role="alert">
            {formError}
          </p>
        )}
        <button type="submit" className="btn btn-brass btn-small">
          + Add to the tab
        </button>
      </form>
    </section>
  );
}
