/**
 * Types & Interfaces for Onboarding Audit Agent
 */

export interface AppDocument {
  id: string;
  name: string;
  type: string; // 'pdf' | 'docx' | 'txt' | 'md'
  content: string;
  size: number;
  uploadDate: string;
  status: 'processing' | 'indexed' | 'failed';
  chunkCount: number;
}

export type CandidateRole = 'Software Engineer' | 'Product Manager' | 'Data Analyst' | 'Intern';

export interface AuditSession {
  id: string;
  name: string;
  date: string;
  candidateRole: CandidateRole;
  score: number;
  status: 'draft' | 'running' | 'completed' | 'failed';
  progress: number;
  findingsCount: number;
  contradictionCount: number;
  missingInfoCount: number;
  // Detailed breakdown
  clarityScore?: number;
  completenessScore?: number;
  consistencyScore?: number;
  supportScore?: number;
  executiveSummary?: string;
}

export interface Finding {
  id: string;
  sessionId: string;
  type: 'info_miss' | 'contradiction' | 'ambiguous' | 'confusion' | 'broken_setup';
  title: string;
  description: string;
  documentReference: string;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  status: 'active' | 'resolved';
  details?: string;
  whyItMatters?: string;
  suggestedFix?: string;
}

export interface Recommendation {
  id: string;
  sessionId: string;
  category: string;
  text: string;
  actionItem: string;
  impact: 'HIGH' | 'MEDIUM' | 'LOW';
}

export interface ChatMessage {
  id: string;
  sessionId: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: string;
  agentName?: string; // 'Auditor' | 'Simulation' | 'Detector'
}

export interface AuditReport {
  sessionId: string;
  onboardingScore: number;
  documentationQuality: number;
  missingInfoScore: number;
  riskScore: number;
  criteriaBreakdown: {
    clarity: number;
    completeness: number;
    consistency: number;
    support: number;
  };
  executiveSummary: string;
  recommendations: Recommendation[];
}
