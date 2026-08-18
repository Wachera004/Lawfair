export interface AnalyzedClause {
  id: string;
  title: string;
  originalText: string;
  summary: string;
  status: 'compliant' | 'warning' | 'illegal';
  citation?: string; // exact Kenyan Law citation
  recommendation?: string;
}

export interface Contract {
  id: string;
  tenantName: string;
  landlordName: string;
  landlordPhone: string;
  apartmentName: string;
  monthlyRent: number;
  depositAmount: number;
  status: 'pending_review' | 'under_review' | 'approved' | 'revision_requested';
  fairnessScore: number; // 0-100
  riskLevel: 'Low' | 'Medium' | 'High';
  clauses: AnalyzedClause[];
  summary: string; // Plain English summary
  smsStatus: 'not_sent' | 'sent' | 'accepted' | 'declined';
  lawyerId?: string;
  lawyerName?: string;
  createdAt: string;
  updatedAt: string;
  lastUpdateNotes?: string;
}

export interface Dispute {
  id: string;
  contractId: string;
  disputeType: 'deposit_retention' | 'wrongful_eviction' | 'repair_breach' | 'other';
  description: string;
  status: 'draft' | 'active' | 'resolved';
  demandLetter: string;
  activatedAt?: string;
}

export interface Lawyer {
  id: string;
  name: string;
  firm: string;
  verified: boolean;
  activeRetainersCount: number;
  avatar: string;
}

export interface MarketStat {
  neighborhood: string;
  averageScore: number;
  nonRefundableDepositPct: number;
  averageDepositMonths: number;
  totalContracts: number;
}
