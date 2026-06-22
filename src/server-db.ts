import fs from 'fs';
import path from 'path';
import { AppDocument, AuditSession, Finding, Recommendation, ChatMessage, AuditReport, CandidateRole } from './types.js';

const DB_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DB_DIR, 'onboarding_audit_db.json');

interface DatabaseSchema {
  documents: AppDocument[];
  sessions: AuditSession[];
  findings: Finding[];
  recommendations: Recommendation[];
  chatMessages: ChatMessage[];
}

// Default seed data for the application
const DEFAULT_DOCUMENTS: AppDocument[] = [
  {
    id: 'doc-1',
    name: 'Engineering Onboarding Setup Guide.md',
    type: 'md',
    content: `# Engineering Onboarding & Local Setup Guide

Welcome to the engineering team! This guide will help you set up your local development environment.

## 1. Machine Provisioning
You should have received your MacBook Pro from IT. If not, contact IT support at help@company.com.

## 2. Docker & Dependencies
- Install Docker Desktop. Note: We use Docker for running our local Postgres database and redis cache.
- Install Node.js v18 (LTS) using nvm: \`nvm install 18\`
- Install pnpm: \`npm install -g pnpm\`

## 3. Clone Repository & Run
Clone our main repository:
\`git clone https://github.com/internal-corp/main-apis.git\`

To boot the local environment, run:
\`pnpm install\`
\`pnpm dev\`

Note: Before running the application, make sure to copy \`.env.example\` to \`.env\`.
You will need the shared system API key for the Payment gateway. You can request this API key by messaging Sarah Chen, our DevOps engineer.

## 4. Deploying
All branch commits are automatically deployed to our staging environment.
To deploy to production, merge your branch to \`main\` and ping the deployment Slack channel \`#ops-prod-release\`.`,
    size: 980,
    uploadDate: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
    status: 'indexed',
    chunkCount: 3
  },
  {
    id: 'doc-2',
    name: 'Company Work Location Policy 2026.pdf',
    type: 'pdf',
    content: `# Corporation General Policy Manual - Section 4: Workplace Options

## 4.1 Work Location Philosophy
At our core, we believe in a hybrid-first environment. All employees are expected to spend at least 3 days per week inside their assigned physical office. This ensures effective collaboration and team cohesion.

The assigned physical office is determined based on your primary hiring region.

## 4.2 Office Attendance Tracking
Attendance is tracked via badge swipes at the security gates. Monthly stats are compiled and sent directly to reporting managers.

## 4.3 Policy Exemptions
Any exemptions to the 3-day in-office requirement must be approved in writing by the regional HR VP and your department Senior VP. Unauthorized remote work may result in disciplinary review.`,
    size: 2150,
    uploadDate: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
    status: 'indexed',
    chunkCount: 2
  },
  {
    id: 'doc-3',
    name: 'Remote Work Agreement & Onboarding FAQ.docx',
    type: 'docx',
    content: `# Remote Work Guidelines & FAQ

## Q: What are the expectation for remote work?
A: Our company operates as a **100% Remote-First organization**. We believe in asynchronous collaboration. You have the total freedom to choose where you work. There is no physical office space requirement. You do not need to check in or report daily office hours.

## Q: Are there any office spaces?
A: No, our central headquarters is purely virtual. We do not provide physical desks or local workspaces.

## Q: Who do I contact for onboarding problems?
A: Please check the wiki (internal-wiki.corp) or message your assigned buddy. If you do not have an assigned buddy, ask the general onboarding Slack channel \`#onboard-help\`.`,
    size: 1420,
    uploadDate: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
    status: 'indexed',
    chunkCount: 2
  }
];

const DEFAULT_SESSIONS: AuditSession[] = [
  {
    id: 'sess-1',
    name: 'Full Document Audit (Software Engineer)',
    date: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    candidateRole: 'Software Engineer',
    score: 64,
    status: 'completed',
    progress: 100,
    findingsCount: 5,
    contradictionCount: 2,
    missingInfoCount: 3
  },
  {
    id: 'sess-2',
    name: 'Initial Check (Intern)',
    date: new Date(Date.now() - 10 * 3600 * 1000).toISOString(),
    candidateRole: 'Intern',
    score: 48,
    status: 'completed',
    progress: 100,
    findingsCount: 4,
    contradictionCount: 1,
    missingInfoCount: 3
  }
];

const DEFAULT_FINDINGS: Finding[] = [
  {
    id: 'find-1',
    sessionId: 'sess-1',
    type: 'contradiction',
    title: 'Work Location Policy is Entirely Contradictory',
    description: 'Document "Company Work Location Policy 2026.pdf" states that all employees are hybrid and must attend the physical office at least 3 days/week. However, the FAQ document "Remote Work Agreement & Onboarding FAQ.docx" states that the company is "100% Remote-First" with no physical office space or tracking.',
    documentReference: 'Company Work Location Policy 2026.pdf / Remote Work FAQ',
    severity: 'HIGH',
    status: 'active',
    details: 'A new hire would be completely confused about whether they are required to move close to an office, swipe badges, or if they have the total freedom to live anywhere in the world. This is a severe legal and cultural contradiction.',
    whyItMatters: 'Conflicting work location requirements directly cause candidate anxiety, potential relocation mistakes, and a severe degradation of trust in internal operations on day one.',
    suggestedFix: 'Formally align both manuals to reflect the Remote-First model by updating "Company Work Location Policy 2026.pdf" Section 4.1 to explicitly state that the engineering department is exempt from badge-tracked swipes.'
  },
  {
    id: 'find-2',
    sessionId: 'sess-1',
    type: 'info_miss',
    title: 'Missing Payment Gateway Shared API Key Configuration',
    description: 'The Engineering Setup Guide indicates that a "shared system API key" is required for local setup, but does not provide details on how Sarah Chen can be securely reached or if there is a vaults system (e.g., Doppler, HashiCorp Vault) to pull secrets from.',
    documentReference: 'Engineering Onboarding Setup Guide.md',
    severity: 'MEDIUM',
    status: 'active',
    details: 'New software engineers will hit a complete roadblock during local setup when Sarah Chen is offline or in a different timezone. No automated keys fetch tool is documented.',
    whyItMatters: 'Introduces a clear blocker that causes fresh engineers to idle on their first day, relying entirely on the availability of busy senior developers.',
    suggestedFix: 'Revise "Engineering Onboarding Setup Guide.md" Section 3 to replace references to manual Sarah Chen Slack messages with instructions on fetching development API keys from Doppler vault.'
  },
  {
    id: 'find-3',
    sessionId: 'sess-1',
    type: 'ambiguous',
    title: 'Ambiguous Escalation of Setup Roadblocks',
    description: 'The guide says "If you do not have an assigned buddy, ask the general onboarding Slack channel". However, there is no automatic system to assign a buddy, leaving the process to chance.',
    documentReference: 'Remote Work Agreement & Onboarding FAQ.docx',
    severity: 'LOW',
    status: 'active',
    details: 'Creates an unnecessary "bystander effect" where some new hires might wait days before asking in a public channel if their buddy was not pre-assigned.',
    whyItMatters: 'New hires may experience isolation and feel uncomfortable posting in open channels, delaying setup assist feedback loops.',
    suggestedFix: 'Amend "Remote Work Agreement & Onboarding FAQ.docx" Section 2 buddy rules to establish that HR will automatically assign a peer partner and trigger a Slack matching invitation 2 days before the recruit start date.'
  },
  {
    id: 'find-4',
    sessionId: 'sess-1',
    type: 'broken_setup',
    title: 'IT Support Contact Lacks Slack Link or SLA Hours',
    description: 'Guide requests contacting "IT Support at help@company.com" for MacBook issues, but does not specify response SLA hours or active channel support link structure.',
    documentReference: 'Engineering Onboarding Setup Guide.md',
    severity: 'MEDIUM',
    status: 'active',
    details: 'If a Mac is unprovisioned, emailing may trigger slow ticketing loops while a active Slack channel would expedite resolution immediately.',
    whyItMatters: 'Hardware failures can halt onboarding entirely. Relying on anonymous email addresses with unknown answer intervals creates high day-one stress.',
    suggestedFix: 'Update "Engineering Onboarding Setup Guide.md" Section 1 to list the active ticket response SLA as 4 hours and link directly to the internal Slack channel #it-ops-support.'
  },
  {
    id: 'find-5',
    sessionId: 'sess-1',
    type: 'confusion',
    title: 'Branch Naming Merges Directly with Unclear Owners',
    description: 'Guide says "merge your branch to main and ping Slack #ops-prod-release". There is no mention of code reviews (PR approval requirements), peer lead gatekeepers, or standard repository permissions.',
    documentReference: 'Engineering Onboarding Setup Guide.md',
    severity: 'HIGH',
    status: 'active',
    details: 'An eager new engineer could push bad code straight into Main on day two thinking deployment is self-regulatory, causing unexpected production disruptions.',
    whyItMatters: 'Lack of clear review guardrails puts production systems at high risk and makes new developers feel vulnerable to making severe rookie setup errors.',
    suggestedFix: 'Incorporate an explicit branching and Pull Request approval policy subheader in "Engineering Onboarding Setup Guide.md" Section 4, stating that PRs require at least one lead engineer approval before merging to main.'
  },
  {
    id: 'find-6',
    sessionId: 'sess-2',
    type: 'contradiction',
    title: 'Work Desk Environment Clash',
    description: 'Agreement states that there are no physical desks, but Office policy says attendance is tracked by badge swipes inside physical desks.',
    documentReference: 'Multiple Documents',
    severity: 'HIGH',
    status: 'active',
    whyItMatters: 'Candidates do not know if they are allowed to reside asynchronously at a distance or must appear on physical premise sites.',
    suggestedFix: 'Harmonize workplace rules in "Company Work Location Policy 2026.pdf" to explicitly exempt fully remote interns from badge office trackers.'
  },
  {
    id: 'find-7',
    sessionId: 'sess-2',
    type: 'info_miss',
    title: 'Intern Tool Access and Licensing Missing',
    description: 'No documentation details whether interns get full license rights to systems, or how long provisioning approval cycles take.',
    documentReference: 'Company Work Location Policy 2026.pdf',
    severity: 'HIGH',
    status: 'active',
    whyItMatters: 'Interns spend their first few days blocked by tooling barriers because request approval periods are unlisted.',
    suggestedFix: 'Add a new "Intern Licensing & Accounts" section to the onboarding faq, indicating that corporate tool access is compiled and pre-approved by the hiring manager 3 days prior to start.'
  }
];

const DEFAULT_RECOMMENDATIONS: Recommendation[] = [
  {
    id: 'rec-1',
    sessionId: 'sess-1',
    category: 'Work Model Policy Alignment',
    text: 'Formally align HR documents to speak with a single voice regarding the hybrid/remote status.',
    actionItem: 'Revoke the deprecated hybrid policy or update the Remote Work Agreement to clarify regional office support details.',
    impact: 'HIGH'
  },
  {
    id: 'rec-2',
    sessionId: 'sess-1',
    category: 'Local Developer Secrets Management',
    text: 'Transition API credentials from Sarah Chen Slack pings to a secure central dev portal or infisical vault.',
    actionItem: 'Setup a secure .env loader script in pnpm dev to pull from the dev sandbox variables automatically.',
    impact: 'HIGH'
  },
  {
    id: 'rec-3',
    sessionId: 'sess-1',
    category: 'SLA Escalation Logs',
    text: 'Establish automatic onboarding buddy matches inside Slack workspace.',
    actionItem: 'Add an onboarding workflow Slack app that assigns buddy and reports setup obstacles to Lead Engineers.',
    impact: 'MEDIUM'
  }
];

const DEFAULT_CHATS: ChatMessage[] = [
  {
    id: 'chat-1',
    sessionId: 'sess-1',
    role: 'assistant',
    text: 'Hi there! I am your Onboarding Audit Lead. I have carefully simulated the role of a standard **Software Engineer** reading your uploaded materials. I encountered severe roadblocks regarding HR work policies and localized code keys. Ask me anything about my experience!',
    timestamp: new Date(Date.now() - 1.9 * 3600 * 1000).toISOString(),
    agentName: 'Auditor'
  },
  {
    id: 'chat-2',
    sessionId: 'sess-1',
    role: 'user',
    text: 'What was your biggest point of confusion during your onboarding simulation?',
    timestamp: new Date(Date.now() - 1.8 * 3600 * 1000).toISOString()
  },
  {
    id: 'chat-3',
    sessionId: 'sess-1',
    role: 'assistant',
    text: 'My absolute biggest roadblock was that **I could not configure my local code environment without personal intervention**. The guide requests that I send a direct message to "Sarah Chen" to retrieve the Payment gateway API keys. As an agent, this means my automated setup halts entirely. \n\nAdditionally, I was extremely conflicted about where I am legally supposed to work. One policy says there are no physical offices, and another says HR tracks our weekly swipes. I felt like I was breaking policy before my first cup of coffee!',
    timestamp: new Date(Date.now() - 1.7 * 3600 * 1000).toISOString(),
    agentName: 'Simulation'
  }
];

export class ServerDatabase {
  private static loadDb(): DatabaseSchema {
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }

    if (!fs.existsSync(DB_FILE)) {
      const initialDb: DatabaseSchema = {
        documents: DEFAULT_DOCUMENTS,
        sessions: DEFAULT_SESSIONS,
        findings: DEFAULT_FINDINGS,
        recommendations: DEFAULT_RECOMMENDATIONS,
        chatMessages: DEFAULT_CHATS
      };
      fs.writeFileSync(DB_FILE, JSON.stringify(initialDb, null, 2), 'utf-8');
      return initialDb;
    }

    try {
      const content = fs.readFileSync(DB_FILE, 'utf-8');
      return JSON.parse(content);
    } catch (e) {
      console.error('Error reading DB, resetting to defaults:', e);
      return {
        documents: DEFAULT_DOCUMENTS,
        sessions: DEFAULT_SESSIONS,
        findings: DEFAULT_FINDINGS,
        recommendations: DEFAULT_RECOMMENDATIONS,
        chatMessages: DEFAULT_CHATS
      };
    }
  }

  private static saveDb(data: DatabaseSchema) {
    try {
      if (!fs.existsSync(DB_DIR)) {
        fs.mkdirSync(DB_DIR, { recursive: true });
      }
      fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
    } catch (e) {
      console.error('Failed to save DB file:', e);
    }
  }

  // Document Operations
  static getDocuments(): AppDocument[] {
    return this.loadDb().documents;
  }

  static addDocument(doc: AppDocument) {
    const db = this.loadDb();
    db.documents.push(doc);
    this.saveDb(db);
    return doc;
  }

  static deleteDocument(id: string) {
    const db = this.loadDb();
    db.documents = db.documents.filter(d => d.id !== id);
    this.saveDb(db);
  }

  // Session Operations
  static getSessions(): AuditSession[] {
    return this.loadDb().sessions;
  }

  static getSession(id: string): AuditSession | undefined {
    return this.loadDb().sessions.find(s => s.id === id);
  }

  static getSessionFindings(sessionId: string): Finding[] {
    return this.loadDb().findings.filter(f => f.sessionId === sessionId);
  }

  static getSessionRecommendations(sessionId: string): Recommendation[] {
    return this.loadDb().recommendations.filter(r => r.sessionId === sessionId);
  }

  static getSessionChats(sessionId: string): ChatMessage[] {
    return this.loadDb().chatMessages.filter(c => c.sessionId === sessionId);
  }

  static addSession(session: AuditSession) {
    const db = this.loadDb();
    db.sessions.unshift(session);
    this.saveDb(db);
    return session;
  }

  static updateSession(id: string, updates: Partial<AuditSession>) {
    const db = this.loadDb();
    const index = db.sessions.findIndex(s => s.id === id);
    if (index !== -1) {
      db.sessions[index] = { ...db.sessions[index], ...updates };
      this.saveDb(db);
    }
  }

  static deleteSession(id: string) {
    const db = this.loadDb();
    db.sessions = db.sessions.filter(s => s.id !== id);
    db.findings = db.findings.filter(f => f.sessionId !== id);
    db.recommendations = db.recommendations.filter(r => r.sessionId !== id);
    db.chatMessages = db.chatMessages.filter(c => c.sessionId !== id);
    this.saveDb(db);
  }

  static clearSessionChildren(id: string) {
    const db = this.loadDb();
    db.findings = db.findings.filter(f => f.sessionId !== id);
    db.recommendations = db.recommendations.filter(r => r.sessionId !== id);
    db.chatMessages = db.chatMessages.filter(c => c.sessionId !== id);
    this.saveDb(db);
  }

  static addFinding(finding: Finding) {
    const db = this.loadDb();
    db.findings.push(finding);
    this.saveDb(db);
    return finding;
  }

  static updateFinding(id: string, updates: Partial<Finding>) {
    const db = this.loadDb();
    const index = db.findings.findIndex(f => f.id === id);
    if (index !== -1) {
      db.findings[index] = { ...db.findings[index], ...updates } as Finding;
      
      // Keep session counters in sync!
      const sessId = db.findings[index].sessionId;
      const sessIndex = db.sessions.findIndex(s => s.id === sessId);
      if (sessIndex !== -1) {
        const activeFindings = db.findings.filter(f => f.sessionId === sessId && f.status !== 'resolved');
        const resolvedCount = db.findings.filter(f => f.sessionId === sessId && f.status === 'resolved').length;
        const totalCount = db.findings.filter(f => f.sessionId === sessId).length;
        
        db.sessions[sessIndex].findingsCount = activeFindings.length;
        db.sessions[sessIndex].contradictionCount = activeFindings.filter(f => f.type === 'contradiction').length;
        db.sessions[sessIndex].missingInfoCount = activeFindings.filter(f => f.type === 'info_miss').length;
        
        // Dynamically boost score as issues are resolved!
        if (totalCount > 0) {
          const originalScore = db.sessions[sessIndex].score || 60;
          const progressPercent = resolvedCount / totalCount;
          // Scale from original (usually ~50-65) up to 100
          const remainingScale = 100 - originalScore;
          db.sessions[sessIndex].score = Math.min(100, Math.round(originalScore + (progressPercent * remainingScale)));
        } else {
          db.sessions[sessIndex].score = 100;
        }
      }
      this.saveDb(db);
    }
  }

  static resolveAllFindings(sessionId: string) {
    const db = this.loadDb();
    db.findings.forEach(f => {
      if (f.sessionId === sessionId) {
        f.status = 'resolved';
      }
    });
    
    const sessIndex = db.sessions.findIndex(s => s.id === sessionId);
    if (sessIndex !== -1) {
      db.sessions[sessIndex].findingsCount = 0;
      db.sessions[sessIndex].contradictionCount = 0;
      db.sessions[sessIndex].missingInfoCount = 0;
      db.sessions[sessIndex].score = 100; // Perfect score!
    }
    this.saveDb(db);
  }

  static addRecommendation(rec: Recommendation) {
    const db = this.loadDb();
    db.recommendations.push(rec);
    this.saveDb(db);
    return rec;
  }

  static addChat(chat: ChatMessage) {
    const db = this.loadDb();
    db.chatMessages.push(chat);
    this.saveDb(db);
    return chat;
  }
}
