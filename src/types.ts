export interface Participant {
  id: string;
  name: string;
  address: string;
  /** True once this participant's share has been paid on-chain. */
  paid: boolean;
}

export type TxStatus = "pending" | "success" | "failed";

export interface TxRecord {
  id: string;
  participantName: string;
  amount: string;
  status: TxStatus;
  hash?: string;
  errorMessage?: string;
  timestamp: number;
}
