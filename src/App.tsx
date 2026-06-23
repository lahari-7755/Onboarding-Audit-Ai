import React, { useState, useEffect, useRef } from 'react';
import { 
  FileText, 
  Upload, 
  Trash2, 
  Play, 
  AlertTriangle, 
  Plus, 
  CheckCircle, 
  HelpCircle, 
  ArrowRight, 
  Send, 
  Briefcase, 
  Cpu, 
  Check, 
  Sparkles, 
  Flame, 
  Database, 
  Download, 
  Info, 
  Activity, 
  ChevronRight, 
  Code, 
  User, 
  MapPin, 
  Network, 
  AlertOctagon, 
  Search, 
  RefreshCw,
  LayoutDashboard,
  Sliders,
  LogOut,
  Settings,
  MessageSquare,
  Bot,
  Brain
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, BarChart, Bar, XAxis, YAxis, Tooltip, Cell, RadialBarChart, RadialBar, Legend } from 'recharts';
import { AppDocument, AuditSession, Finding, Recommendation, ChatMessage, CandidateRole } from './types.js';

export default function App() {
  // Database datasets
  const [documents, setDocuments] = useState<AppDocument[]>([]);
  const [sessions, setSessions] = useState<AuditSession[]>([]);
  
  // Selected simulation session details
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [sessionDetail, setSessionDetail] = useState<{
    session: AuditSession;
    findings: Finding[];
    recommendations: Recommendation[];
    chats: ChatMessage[];
  } | null>(null);

  // Form states
  const [pasteName, setPasteName] = useState('');
  const [pasteContent, setPasteContent] = useState('');
  const [pasteType, setPasteType] = useState<'md' | 'txt'>('md');
  const [customSessionName, setCustomSessionName] = useState('');
  const [selectedRole, setSelectedRole] = useState<CandidateRole>('Software Engineer');
  const [chatInput, setChatInput] = useState('');
  const [sidebarChatInput, setSidebarChatInput] = useState('');

  // Global chatbot message history (standalone)
  const [globalChats, setGlobalChats] = useState<ChatMessage[]>([]);

  // User Authentication State
  interface UserProfile {
    name: string;
    email: string;
    role: string;
    department: string;
    registeredOn: string;
  }

  const [loggedInUser, setLoggedInUser] = useState<UserProfile | null>(() => {
    try {
      const saved = localStorage.getItem('onboarding_audit_authenticated_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  
  // Registration Form States
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regRole, setRegRole] = useState('Senior Onboarding Lead');
  const [regDept, setRegDept] = useState('Engineering Support');
  const [regAgree, setRegAgree] = useState(false);

  // Interactive views state
  const [activeNav, setActiveNav] = useState('Dashboard');
  const [viewingDoc, setViewingDoc] = useState<AppDocument | null>(null);
  const [activeReportTab, setActiveReportTab] = useState<'findings' | 'recommendations' | 'chat'>('findings');
  const [filterSeverity, setFilterSeverity] = useState<'ALL' | 'HIGH' | 'MEDIUM' | 'LOW'>('ALL');
  const [filterType, setFilterType] = useState<'ALL' | 'contradiction' | 'info_miss' | 'broken_setup' | 'confusion' | 'ambiguous'>('ALL');
  const [isSidebarChatOpen, setIsSidebarChatOpen] = useState(false);

  const scrollToSection = (id: string, navName: string) => {
    setActiveNav(navName);
    setIsSidebarChatOpen(false); // Close sidebar chat if navigating, to avoid blocking screen
    
    const element = document.getElementById(id);
    const container = document.getElementById('main-viewport');
    
    if (element && container) {
      // Find relative scroll offsets to avoid sticky header overlaying the elements
      const containerRect = container.getBoundingClientRect();
      const elementRect = element.getBoundingClientRect();
      const relativeTop = elementRect.top - containerRect.top + container.scrollTop;
      
      const headerOffset = 100; // Account for the sticky header
      
      container.scrollTo({
        top: Math.max(0, relativeTop - headerOffset),
        behavior: 'smooth'
      });
    } else if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Async UI states
  const [isUploading, setIsUploading] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationProgress, setSimulationProgress] = useState(10);
  const [simulationStatusText, setSimulationStatusText] = useState('Booting Employee Simulator...');
  const [isChatTyping, setIsChatTyping] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const sidebarChatEndRef = useRef<HTMLDivElement | null>(null);

  // Fetch initial documents and sessions on mount
  useEffect(() => {
    fetchDocuments();
    fetchSessions();
  }, []);

  // Fetch details when session selection changes
  useEffect(() => {
    if (selectedSessionId) {
      fetchSessionDetails(selectedSessionId);
    } else {
      setSessionDetail(null);
    }
  }, [selectedSessionId]);

  // Scroll chats to bottom
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
    if (sidebarChatEndRef.current) {
      // Small timeout to allow container render calculations
      setTimeout(() => {
        sidebarChatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }, [sessionDetail?.chats, isSidebarChatOpen]);

  const fetchDocuments = async () => {
    try {
      const res = await fetch('/api/documents');
      if (res.ok) {
        const data = await res.json();
        setDocuments(data);
      }
    } catch (err) {
      console.error("Error fetching documents:", err);
    }
  };

  const fetchSessions = async () => {
    try {
      const res = await fetch('/api/sessions');
      if (res.ok) {
        const data = await res.json();
        setSessions(data);
        // Default select latest session if none selected
        if (data.length > 0 && !selectedSessionId) {
          setSelectedSessionId(data[0].id);
        }
      }
    } catch (err) {
      console.error("Error fetching sessions:", err);
    }
  };

  const fetchSessionDetails = async (id: string) => {
    try {
      const res = await fetch(`/api/sessions/${id}`);
      if (res.ok) {
        const data = await res.json();
        setSessionDetail(data);
      }
    } catch (err) {
      console.error("Error fetching session details:", err);
    }
  };

  // Helper flash messages
  const showFlashError = (text: string) => {
    setErrorMessage(text);
    setTimeout(() => setErrorMessage(null), 6000);
  };

  const showFlashSuccess = (text: string) => {
    setSuccessMessage(text);
    setTimeout(() => setSuccessMessage(null), 4000);
  };

  // File Upload Handlers (supports PDF & DOCX parsing on server!)
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const lastFileName = files[files.length - 1].name;
    setIsUploading(true);

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const reader = new FileReader();

        await new Promise<void>((resolve, reject) => {
          reader.onload = async (event) => {
            try {
              const fileResult = event.target?.result as string;
              const fileNameLower = file.name.toLowerCase();
              let payload: any = {
                name: file.name,
                size: file.size,
                type: file.name.slice((file.name.lastIndexOf(".") - 1 >>> 0) + 2).toLowerCase()
              };

              // Handle binary formats (PDF and Word)
              if (fileNameLower.endsWith('.pdf') || fileNameLower.endsWith('.docx') || fileNameLower.endsWith('.doc')) {
                // Read as data URL to extract binary base64
                const binaryReader = new FileReader();
                binaryReader.onload = async (binEvent) => {
                  try {
                    payload.base64Content = binEvent.target?.result as string;
                    await uploadToServer(payload);
                    resolve();
                  } catch (err) {
                    reject(err);
                  }
                };
                binaryReader.readAsDataURL(file);
              } else {
                // TXT or Markdown
                payload.content = fileResult;
                await uploadToServer(payload);
                resolve();
              }
            } catch (err) {
              reject(err);
            }
          };
          
          if (file.name.toLowerCase().endsWith('.pdf') || file.name.toLowerCase().endsWith('.docx') || file.name.toLowerCase().endsWith('.doc')) {
            // Placeholder read, handled in secondary reader
            reader.readAsText(file.slice(0, 100)); 
          } else {
            reader.readAsText(file);
          }
        });
      }
      showFlashSuccess("Documents indexed successfully! Starting automated audit report...");
      await fetchDocuments();
      
      // Auto-trigger simulation after upload using the last filename as report title
      await runAuditSimulation(lastFileName);

    } catch (err: any) {
      showFlashError(err.message || "File upload failed.");
    } finally {
      setIsUploading(false);
    }
  };

  const uploadToServer = async (payload: any) => {
    try {
      const res = await fetch('/api/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      const contentType = res.headers.get("content-type");
      if (!res.ok) {
        if (contentType && contentType.includes("application/json")) {
          const errorData = await res.json();
          throw new Error(errorData.error || "Failed to process document");
        } else {
          const textError = await res.text();
          console.error("Server error (not JSON):", textError);
          throw new Error(`Server Error (${res.status}): The system could not process this document. It might be too large or invalid.`);
        }
      }
      return await res.json();
    } catch (err: any) {
      console.error("Upload error:", err);
      throw err;
    }
  };

  // Dedicated audit simulation runner
  const runAuditSimulation = async (customName?: string) => {
    setIsSimulating(true);
    setSimulationProgress(15);
    setSimulationStatusText("Step 1: Segmenting document context chunks...");
    
    // Smooth visual rhythm
    const progressInterval = setInterval(() => {
      setSimulationProgress(prev => {
        if (prev < 40) {
          setSimulationStatusText("Step 2: Activating Document Reader Agent & loading memory matrices...");
          return prev + 5;
        } else if (prev < 70) {
          setSimulationStatusText(`Step 3: Employee Simulation Agent acting as newly hired [${selectedRole}]...`);
          return prev + 4;
        } else if (prev < 95) {
          setSimulationStatusText("Step 4: Contradiction Detector comparing HR policies & developer guides...");
          return prev + 3;
        }
        return prev;
      });
    }, 1500);

    try {
      const res = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: customName || (customSessionName.trim() ? customSessionName : undefined),
          candidateRole: selectedRole
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Simulation failed to start.");
      }

      const newSessionObj = await res.json();
      
      // Navigate immediately while processing
      setActiveNav('Reports');
      setSelectedSessionId(newSessionObj.id);

      let isComplete = false;
      let checkAttempts = 0;
      
      while (!isComplete && checkAttempts < 20) {
        await new Promise(r => setTimeout(r, 2000));
        const checkRes = await fetch(`/api/sessions/${newSessionObj.id}`);
        if (checkRes.ok) {
          const detailData = await checkRes.json();
          if (detailData.session.status === 'completed') {
            isComplete = true;
            clearInterval(progressInterval);
            setSimulationProgress(100);
            setSimulationStatusText("Audit Simulation Complete!");
            showFlashSuccess("Handbook Audit fully automatically generated!");
            
            // Reload fresh details
            setSessionDetail(detailData);
            await fetchSessions();
            break;
          } else if (detailData.session.status === 'failed') {
            throw new Error("Audit Agent encountered a runtime roadblock.");
          }
        }
        checkAttempts++;
      }

      setCustomSessionName('');

    } catch (err: any) {
      clearInterval(progressInterval);
      showFlashError(err.message || "Audit simulation interrupted.");
    } finally {
      clearInterval(progressInterval);
      setIsSimulating(false);
    }
  };

  // Paste Content Directly
  const handlePasteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pasteName.trim() || !pasteContent.trim()) {
      showFlashError("Please fill in both name and document text content.");
      return;
    }
    setIsUploading(true);

    try {
      const payload = {
        name: pasteName.endsWith(`.${pasteType}`) ? pasteName : `${pasteName}.${pasteType}`,
        type: pasteType,
        content: pasteContent,
        size: pasteContent.length
      };

      const res = await fetch('/api/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const contentType = res.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const err = await res.json();
          throw new Error(err.error || "Failed to upload.");
        } else {
          throw new Error(`Server Error (${res.status}): Could not save document.`);
        }
      }

      setPasteName('');
      setPasteContent('');
      showFlashSuccess("Pasted instructions indexed. Running audit...");
      await fetchDocuments();
      await runAuditSimulation(payload.name);
    } catch (err: any) {
      showFlashError(err.message);
    } finally {
      setIsUploading(false);
    }
  };

  // Delete document
  const handleDocDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this document from the audited indices?")) return;
    try {
      const res = await fetch(`/api/documents/${id}`, { method: 'DELETE' });
      if (res.ok) {
        showFlashSuccess("Document removed.");
        fetchDocuments();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Trigger Onboarding Audit Simulation (wrapper for original UI button)
  const handleTriggerSimulation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (documents.length === 0) {
      showFlashError("Index is empty. Please upload corporate guidelines or handbooks first.");
      return;
    }
    await runAuditSimulation();
  };

  // Interactive chat message submissions
  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !selectedSessionId) return;

    const userMessage = chatInput;
    setChatInput('');
    setIsChatTyping(true);

    // Optimistically update client-side chats to preserve user action
    if (sessionDetail) {
      setSessionDetail({
        ...sessionDetail,
        chats: [
          ...sessionDetail.chats,
          {
            id: 'chat-opt-' + Date.now(),
            sessionId: selectedSessionId,
            role: 'user',
            text: userMessage,
            timestamp: new Date().toISOString()
          }
        ]
      });
    }

    try {
      const res = await fetch(`/api/sessions/${selectedSessionId}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage })
      });

      if (res.ok) {
        const reply = await res.json();
        // Update local state directly for immediate feedback
        if (sessionDetail) {
          setSessionDetail(prev => prev ? {
            ...prev,
            chats: [...prev.chats, reply]
          } : null);
        }
      } else {
        const errText = await res.text();
        console.error("Chat error:", errText);
        showFlashError("Audit Agent is unavailable. Please check your connection.");
      }
    } catch (err) {
      console.error("Chat fetch failed:", err);
      showFlashError("Network error while talking to Auditor.");
    } finally {
      setIsChatTyping(false);
    }
  };

  // Quick Prompt Assist clicker
  const handleQuickPromptClick = (prompt: string) => {
    setChatInput(prompt);
  };

  const handleSendSidebarChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sidebarChatInput.trim()) return;

    const targetSessionId = selectedSessionId || 'global';
    const userMessage = sidebarChatInput;
    setSidebarChatInput('');
    setIsChatTyping(true);

    const newUserMsg: ChatMessage = {
      id: 'chat-usr-' + Date.now(),
      sessionId: targetSessionId,
      role: 'user',
      text: userMessage,
      timestamp: new Date().toISOString()
    };

    // Optimistically update
    if (selectedSessionId && sessionDetail) {
      setSessionDetail({
        ...sessionDetail,
        chats: [...sessionDetail.chats, newUserMsg]
      });
    } else {
      setGlobalChats(prev => [...prev, newUserMsg]);
    }

    try {
      const res = await fetch(`/api/sessions/${targetSessionId}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage })
      });

      if (res.ok) {
        const reply = await res.json();
        if (selectedSessionId && sessionDetail) {
          setSessionDetail(prev => prev ? {
            ...prev,
            chats: [...prev.chats, reply]
          } : null);
        } else {
          setGlobalChats(prev => [...prev, reply]);
        }
      } else {
        const errText = await res.text();
        console.error("Sidebar chat error:", errText);
        showFlashError("Communication failure.");
      }
    } catch (err) {
      console.error("Sidebar chat fetch failed:", err);
      showFlashError("Could not reach Audit Agent.");
    } finally {
      setIsChatTyping(false);
    }
  };

  // Delete specific session
  const handleSessionDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm("Delete this completed audit report from database logs?")) return;
    try {
      const res = await fetch(`/api/sessions/${id}`, { method: 'DELETE' });
      if (res.ok) {
        showFlashSuccess("Audit Session archived.");
        setSelectedSessionId(null);
        fetchSessions();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Resolve a single finding
  const handleResolveFinding = async (findingId: string) => {
    try {
      const res = await fetch(`/api/findings/${findingId}/resolve`, { method: 'POST' });
      if (res.ok) {
        showFlashSuccess("Issue resolved! Target gap cleared.");
        if (selectedSessionId) {
          fetchSessionDetails(selectedSessionId);
        }
        fetchSessions();
      }
    } catch (err) {
      console.error(err);
      showFlashError("Failed to clear error.");
    }
  };

  // Resolve all findings for the active session
  const handleResolveAllFindings = async (sessionId: string) => {
    if (!window.confirm("Mark all issues as resolved? This will clear all onboarding gaps & danger marks.")) return;
    try {
      const res = await fetch(`/api/sessions/${sessionId}/resolve-all-findings`, { method: 'POST' });
      if (res.ok) {
        showFlashSuccess("All issues resolved. Onboarding alignment is 100%!");
        fetchSessionDetails(sessionId);
        fetchSessions();
      }
    } catch (err) {
      console.error(err);
      showFlashError("Failed to clear all errors.");
    }
  };

  // Dynamic metrics formatting
  const getSeverityColor = (sev: 'HIGH' | 'MEDIUM' | 'LOW') => {
    switch (sev) {
      case 'HIGH': return 'bg-rose-50 border-rose-100 text-rose-700';
      case 'MEDIUM': return 'bg-amber-50 border-amber-100 text-amber-700';
      case 'LOW': return 'bg-sky-50 border-sky-100 text-sky-700';
    }
  };

  const getFindingIcon = (type: string) => {
    switch (type) {
      case 'contradiction': return <AlertOctagon className="w-5 h-5 text-rose-600" />;
      case 'info_miss': return <Search className="w-5 h-5 text-amber-600" />;
      case 'broken_setup': return <Code className="w-5 h-5 text-rose-500" />;
      case 'confusion': return <Info className="w-5 h-5 text-sky-600" />;
      default: return <HelpCircle className="w-5 h-5 text-slate-500" />;
    }
  };

  // Client PDF/Print action or export text log
  const handlePrintReport = () => {
    window.print();
  };

  const handleDownloadReport = () => {
    if (!sessionDetail) return;
    const { session, findings, recommendations } = sessionDetail;

    let reportMarkdown = `# ONBOARDING AUDIT REPORT: ${session.name}\n`;
    reportMarkdown += `Date Generated: ${new Date(session.date).toLocaleString()}\n`;
    reportMarkdown += `Simulated Role: ${session.candidateRole}\n`;
    reportMarkdown += `Onboarding Score: ${session.score}/100\n`;
    reportMarkdown += `Contradiction Count: ${session.contradictionCount}\n`;
    reportMarkdown += `Missing Information Count: ${session.missingInfoCount}\n`;
    reportMarkdown += `=========================\n\n`;

    reportMarkdown += `## DETECTED DOCUMENTATION FINDINGS (${findings.length})\n\n`;
    findings.forEach((f, idx) => {
      reportMarkdown += `### ${idx + 1}. [${f.severity} IMPACT] ${f.title}\n`;
      reportMarkdown += `* Type: ${f.type.toUpperCase()}\n`;
      reportMarkdown += `* Document context reference: ${f.documentReference}\n`;
      reportMarkdown += `* Description: ${f.description}\n`;
      if (f.details) {
        reportMarkdown += `* Detailing analysis: ${f.details}\n`;
      }
      reportMarkdown += `\n`;
    });

    reportMarkdown += `## AUDITOR RECOMMENDATION PLAN (${recommendations.length})\n\n`;
    recommendations.forEach((r, idx) => {
      reportMarkdown += `### ${idx + 1}. Category: ${r.category} [${r.impact} IMPACT]\n`;
      reportMarkdown += `* Solution: ${r.text}\n`;
      reportMarkdown += `* Fix instruction: ${r.actionItem}\n\n`;
    });

    const fileBlob = new Blob([reportMarkdown], { type: 'text/markdown;charset=utf-8;' });
    const fileUrl = URL.createObjectURL(fileBlob);
    const linkElement = document.createElement('a');
    linkElement.href = fileUrl;
    linkElement.setAttribute('download', `Onboarding_Audit_${session.candidateRole.replace(/\s+/g, '_')}_Report.md`);
    document.body.appendChild(linkElement);
    linkElement.click();
    document.body.removeChild(linkElement);
  };

  // Filtered Findings
  const filteredFindings = sessionDetail?.findings.filter(f => {
    if (f.status === 'resolved') return false;
    const passSeverity = filterSeverity === 'ALL' || f.severity === filterSeverity;
    const passType = filterType === 'ALL' || f.type === filterType;
    return passSeverity && passType;
  }) || [];

  // Radial score list
  const radarData = sessionDetail ? [
    { name: 'Clarity', value: sessionDetail.session.clarityScore || (sessionDetail.session.score >= 70 ? 8 : 5) },
    { name: 'Completeness', value: sessionDetail.session.completenessScore || (sessionDetail.session.score >= 75 ? 9 : 4) },
    { name: 'Consistency', value: sessionDetail.session.consistencyScore || (sessionDetail.session.score >= 80 ? 8 : 4) },
    { name: 'Support SLA', value: sessionDetail.session.supportScore || (sessionDetail.session.score >= 60 ? 7 : 6) }
  ] : [];

  return (
    <div className="min-h-screen bg-[#f8fafc] text-[#1e293b] font-sans flex flex-col md:flex-row transition-all">
      {/* PERSISTENT MODERN SIDEBAR ON THE LEFT SIDE OF THE APP */}
      <aside className="w-full md:w-[280px] bg-[#0f172a] text-[#f8fafc] shrink-0 border-b md:border-b-0 md:border-r border-[#1e293b] p-5 flex flex-col md:sticky md:top-0 md:max-h-screen print:hidden z-50 overflow-y-auto">
        <div className="flex items-center justify-between md:block mb-8 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-600 text-white rounded-xl flex items-center justify-center font-extrabold text-base shadow-md">
              A
            </div>
            <div>
              <h1 id="app-title-sidebar" className="text-xs font-extrabold tracking-wider text-white uppercase flex items-center gap-1.5 leading-none">
                ONBOARDING AUDIT
              </h1>
              <p className="text-[10px] text-[#94a3b8] font-sans font-medium whitespace-nowrap mt-1">"Experience onboarding before they do"</p>
            </div>
          </div>
          <span className="text-[9px] bg-blue-950/40 text-[#60a5fa] font-mono font-bold px-2 py-0.5 rounded-full border border-blue-900 shadow-3xs uppercase tracking-wide md:mt-3 md:inline-block">
            ACTIVE PORTABLE STORE
          </span>
        </div>

        {/* Navigation Items in Sidebar */}
        <nav className="flex flex-row md:flex-col gap-1 overflow-x-auto md:overflow-x-visible pb-3 md:pb-0 scrollbar-none mb-4 md:mb-0 shrink-0">
          {[
            { label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4 shrink-0" /> },
            { label: 'Document Library', icon: <FileText className="w-4 h-4 shrink-0" /> },
            { label: 'Reports', icon: <Activity className="w-4 h-4 shrink-0" /> },
            { label: 'Audit History', icon: <Sliders className="w-4 h-4 shrink-0" /> },
          ].map((item) => (
            <button
              key={item.label}
              id={`nav-item-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
              onClick={() => {
                setActiveNav(item.label);
                setIsSidebarChatOpen(false);
              }}
              className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg text-xs font-semibold cursor-pointer transition-all whitespace-nowrap w-full text-left justify-start ${activeNav === item.label && !isSidebarChatOpen ? 'bg-blue-600 text-white shadow-sm font-bold' : 'text-[#94a3b8] hover:bg-[#1e293b] hover:text-white'}`}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}

          <button
            id="nav-item-ask-ai-auditor"
            onClick={() => {
              setIsSidebarChatOpen(!isSidebarChatOpen);
            }}
            className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg text-xs font-semibold cursor-pointer transition-all whitespace-nowrap w-full text-left justify-start ${isSidebarChatOpen ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-sm font-bold' : 'text-[#10b981] hover:bg-[#1e293b] hover:text-white bg-emerald-950/15 border border-emerald-900/40'}`}
          >
            <Bot className="w-4 h-4 shrink-0 text-emerald-400 animate-pulse" />
            <div className="flex items-center justify-between w-full">
              <span>Ask AI Auditor</span>
              <span className="text-[9px] bg-emerald-500/20 text-emerald-300 font-mono px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                Online
              </span>
            </div>
          </button>
        </nav>

        {/* Sidebar Profile Footer */}
        <div className="mt-auto hidden md:block pt-4 border-t border-[#1e293b] shrink-0">
          <div className="flex items-center gap-2.5 text-xs text-[#94a3b8] mb-3">
            <div className="w-7 h-7 rounded bg-[#1e293b] text-[#3b82f6] flex items-center justify-center font-bold shrink-0 text-[10px] border border-slate-800">
              {loggedInUser ? loggedInUser.name.charAt(0).toUpperCase() : "AD"}
            </div>
            <div className="overflow-hidden">
              <p className="font-semibold text-white text-[11px] truncate">
                {loggedInUser ? loggedInUser.name : "Guest Auditor"}
              </p>
              <p className="text-[9px] text-[#64748b] truncate">
                {loggedInUser ? `${loggedInUser.role} • ${loggedInUser.department}` : "lahari.nanduri24@sasi.ac.in"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-[10px] text-[#475569] font-mono leading-none">
            <Database className="w-3.5 h-3.5 text-blue-500 shrink-0" />
            <span className="truncate">{loggedInUser ? "VERIFIED PROTOCOL" : "SYS SECURITY SAFE"}</span>
          </div>
        </div>
      </aside>

      {/* CORE WEB VIEWPORT CONTENT AREA */}
      <div id="main-viewport" className="flex-1 flex flex-col md:max-h-screen md:overflow-y-auto scroll-smooth">
        {/* TOP BAR BRAND HEADER */}
        <header className="border-b border-[#e2e8f0] bg-white sticky top-0 z-40 backdrop-blur-md bg-opacity-95 print:hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h1 id="app-title-header" className="text-sm font-extrabold tracking-wider text-[#0f172a] uppercase flex items-center gap-1.5 leading-none">
                  ONBOARDING AUDIT AGENT
                </h1>
                <span className="text-[9px] bg-blue-50 text-blue-700 border border-blue-100 font-mono font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">
                  AGENT RECRUIT ALPHA
                </span>
              </div>
              <p className="text-[11px] text-[#64748b] font-sans font-medium mt-0.5">Corporate Multi-Agent Onboarding Alignment & Contradiction Suite</p>
            </div>

            <div className="flex items-center gap-3.5 text-xs">
              {/* Authenticated user profile */}
              {loggedInUser ? (
                <div key="auth-logged-in-profile" className="flex items-center gap-2.5 bg-blue-50/70 border border-blue-200/60 pl-2.5 pr-3 py-1 rounded-xl shadow-3xs text-[11px]">
                  <div className="w-7 h-7 rounded bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white text-[11px] font-extrabold uppercase shrink-0 shadow-sm">
                    {loggedInUser.name.charAt(0)}
                  </div>
                  <div className="text-left hidden sm:block">
                    <div className="font-extrabold text-[#0f172a] leading-none">{loggedInUser.name}</div>
                    <div className="text-[8.5px] text-[#475569] font-mono leading-none mt-0.5">{loggedInUser.role}</div>
                  </div>
                  <button 
                    onClick={() => {
                      localStorage.removeItem('onboarding_audit_authenticated_user');
                      setLoggedInUser(null);
                      setSuccessMessage("Logged out of Active Account");
                      setTimeout(() => setSuccessMessage(null), 3000);
                    }} 
                    title="Log Out Profile" 
                    className="p-1 bg-white hover:bg-rose-50 border border-slate-200 text-slate-500 hover:text-rose-600 rounded-lg transition-all cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  id="signup-trigger-btn"
                  onClick={() => setIsAuthModalOpen(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl flex items-center gap-2 shadow-sm border border-blue-500 shadow-blue-500/10 active:scale-95 transition-all cursor-pointer"
                >
                  <Bot className="w-4 h-4 text-blue-105" />
                  <span>Sign Up</span>
                </button>
              )}
            </div>
          </div>
        </header>

        {/* ERROR & SUCCESS FLASHERS */}
        <AnimatePresence>
          {errorMessage && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-rose-50 border-b border-rose-200 text-rose-800 px-4 py-3 text-center text-sm font-medium flex items-center justify-center gap-2 sticky top-[61px] z-30"
            >
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              {errorMessage}
            </motion.div>
          )}
          {successMessage && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-emerald-50 border-b border-emerald-200 text-emerald-800 px-4 py-3 text-center text-sm font-medium flex items-center justify-center gap-2 sticky top-[61px] z-30"
            >
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              {successMessage}
            </motion.div>
          )}
        </AnimatePresence>

        <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1">
          {/* ==================== PAGE 1: DASHBOARD ==================== */}
          {activeNav === 'Dashboard' && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8"
            >
              {/* BRAND ADVANCED HERO */}
              <div className="bg-[#0f172a] text-[#cbd5e1] rounded-2xl overflow-hidden relative shadow-md border border-slate-800">
                <div className="p-8 lg:p-14 max-w-4xl space-y-6 relative z-10">
                  <div className="flex items-center gap-2 font-display text-xs text-[#3b82f6] font-bold tracking-widest uppercase">
                    <Sparkles className="w-3.5 h-3.5 text-[#3b82f6] animate-pulse" />
                    Autonomous Alignment Platform
                  </div>
                  <h2 className="text-3xl lg:text-5xl font-extrabold font-display tracking-tight text-white leading-[1.1]">
                    Experience Your Onboarding Rules Before Real Employees Do
                  </h2>
                  <p className="text-sm lg:text-lg text-[#94a3b8] leading-relaxed max-w-3xl">
                    Agent Recruit AI acts as an actual new hire. It autonomously digests your company playbooks, attempts to complete setups, and charts structural process roadblocks. It checks security vaults, identifies outdated policy statements, and detects team workflow contradictions before they lead to real recruit confusion.
                  </p>
                  
                  <div className="flex flex-wrap gap-4 pt-4">
                    <button
                      onClick={() => setActiveNav('Document Library')}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm px-6 py-4 rounded-xl transition flex items-center gap-3 cursor-pointer shadow-lg border border-blue-500 shadow-blue-500/20"
                    >
                      <Plus className="w-5 h-5" />
                      <span>Ingest Handbook Document</span>
                    </button>
                  </div>
                </div>

                {/* Decorative background accent */}
                <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-blue-600/5 to-transparent pointer-events-none"></div>
                <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-blue-600/10 rounded-full blur-[100px] pointer-events-none"></div>
              </div>

              {/* CARD BENEFITS DETAILS */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-3xs flex flex-col justify-between hover:shadow-xs transition">
                  <div className="space-y-3">
                    <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center border border-blue-100">
                      <Cpu className="w-5 h-5 text-blue-600" />
                    </div>
                    <h3 className="text-sm font-bold text-slate-900 font-display uppercase tracking-wide">Multi-Agent Personas</h3>
                    <p className="text-xs text-slate-500 leading-relaxed font-sans">
                      Spawn highly customized candidate profiles (Software Engineer, PM, Analyst, Intern). Each agent features specific technical environments & credentials parameters.
                    </p>
                  </div>
                  <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-[11px] font-sans">
                    <span className="font-bold text-blue-600 font-mono">Role Templates ready</span>
                    <span className="font-bold text-slate-800">4 Active presets</span>
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-3xs flex flex-col justify-between hover:shadow-xs transition">
                  <div className="space-y-3">
                    <div className="w-10 h-10 bg-amber-50 text-amber-650 rounded-xl flex items-center justify-center border border-amber-100">
                      <AlertTriangle className="w-5 h-5 text-amber-600" />
                    </div>
                    <h3 className="text-sm font-bold text-slate-900 font-display uppercase tracking-wide">Contradiction Map</h3>
                    <p className="text-xs text-slate-500 leading-relaxed font-sans">
                      Automatically scan documents for clashing statements (e.g. Remote SLA hours vs standard on-site policies) and compute clear risk indexes.
                    </p>
                  </div>
                  <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-[11px] font-sans">
                    <span className="font-bold text-amber-600 font-mono">Precision checking</span>
                    <span className="font-bold text-slate-800">100% Autonomous</span>
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-3xs flex flex-col justify-between hover:shadow-xs transition">
                  <div className="space-y-3">
                    <div className="w-10 h-10 bg-emerald-50 text-emerald-650 rounded-xl flex items-center justify-center border border-emerald-100">
                      <Sparkles className="w-5 h-5 text-emerald-600" />
                    </div>
                    <h3 className="text-sm font-bold text-slate-900 font-display uppercase tracking-wide">Ask AI Auditor</h3>
                    <p className="text-xs text-slate-500 leading-relaxed font-sans">
                      Inspect policies, draft remediation playbooks, or clarify confusing terms with our built-in contextual conversational chat panel.
                    </p>
                  </div>
                  <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-[11px] font-sans">
                    <span className="font-bold text-emerald-600 font-mono">Active Support</span>
                    <span className="font-bold text-slate-800">Ask the Auditor</span>
                  </div>
                </div>
              </div>

              {/* INTERACTIVE WORKFLOW LOOP SYSTEM MAP */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 lg:p-8 shadow-xs space-y-6">
                <div>
                  <h3 className="text-sm font-extrabold text-[#0f172a] font-display uppercase tracking-wider flex items-center gap-2">
                    <Activity className="text-blue-600 w-4 h-4" />
                    AUTONOMIC ALIGNMENT PLATFORM WORKFLOW
                  </h3>
                  <p className="text-xs text-slate-500 mt-1.5 leading-relaxed max-w-3xl">
                    Our platform executes a closed-loop automated pipeline. By simulating virtual employee interactions directly against parsed guidelines, the system logs compliance friction, measures real-time alignment drift, and suggests playbooks autonomously.
                  </p>
                </div>

                {/* ===== DESKTOP 9-STEP CIRCULAR PIPELINE GRID ===== */}
                <div className="hidden lg:block relative p-6 bg-slate-50/50 rounded-2xl border border-slate-100 overflow-visible">
                  
                  {/* Decorative Connection lines & Loops */}
                  <svg className="absolute inset-0 w-full h-full pointer-events-none z-0" xmlns="http://www.w3.org/2000/svg">
                    {/* Top Row to Bottom Row Connection (from col 5 right-side down to col 4 right-side) */}
                    <path 
                      d="M 940 75 C 1040 75, 1040 235, 760 235" 
                      fill="none" 
                      stroke="#94a3b8" 
                      strokeWidth="2" 
                      strokeDasharray="4 4" 
                      className="opacity-70"
                    />
                    <path d="M 765 231 L 755 235 L 765 239 Z" fill="#94a3b8" />

                    {/* Bottom Row back to Top Row Loop (from col 1 left-side up to col 1 bottom-left) */}
                    <path 
                      d="M 120 235 C 0 235, 0 75, 100 75" 
                      fill="none" 
                      stroke="#3b82f6" 
                      strokeWidth="2" 
                      strokeDasharray="4 4" 
                      className="opacity-60"
                    />
                    <path d="M 95 71 L 105 75 L 95 79 Z" fill="#3b82f6" />
                  </svg>

                  {/* ROW 1: STEPS 1 TO 5 */}
                  <div className="grid grid-cols-5 gap-6 relative z-10 mb-10">
                    
                    {/* step 1 */}
                    <div className="bg-white border-2 border-blue-100 hover:border-blue-400 p-4 rounded-xl shadow-3xs hover:shadow-2xs transition-all relative group">
                      <div className="flex justify-between items-start mb-2.5">
                        <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-mono font-bold flex items-center justify-center text-[10px]">1</span>
                        <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg group-hover:scale-110 transition-transform">
                          <Upload className="w-4 h-4" />
                        </div>
                      </div>
                      <h4 className="text-[12px] font-extrabold text-[#0f172a] uppercase font-display tracking-tight">Upload Documents</h4>
                      <p className="text-[10px] text-slate-500 mt-1 leading-snug">Upload PDFs, DOCX, TXT, FAQs, etc.</p>
                      
                      {/* Connection arrow right */}
                      <div className="absolute top-1/2 -right-3.5 -translate-y-1/2 bg-white border border-slate-200 rounded-full p-1 shadow-3xs text-slate-400 group-hover:scale-105 transition-transform z-20">
                        <ArrowRight className="w-3 h-3" />
                      </div>
                    </div>

                    {/* step 2 */}
                    <div className="bg-white border-2 border-emerald-100 hover:border-emerald-400 p-4 rounded-xl shadow-3xs hover:shadow-2xs transition-all relative group">
                      <div className="flex justify-between items-start mb-2.5">
                        <span className="w-5 h-5 rounded-full bg-emerald-600 text-white font-mono font-bold flex items-center justify-center text-[10px]">2</span>
                        <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg group-hover:scale-110 transition-transform">
                          <Cpu className="w-4 h-4" />
                        </div>
                      </div>
                      <h4 className="text-[12px] font-extrabold text-[#0f172a] uppercase font-display tracking-tight">Extract Knowledge</h4>
                      <p className="text-[10px] text-slate-500 mt-1 leading-snug">Extract text, chunk &amp; create embeddings</p>
                      
                      {/* Connection arrow right */}
                      <div className="absolute top-1/2 -right-3.5 -translate-y-1/2 bg-white border border-slate-200 rounded-full p-1 shadow-3xs text-slate-400 group-hover:scale-105 transition-transform z-20">
                        <ArrowRight className="w-3 h-3" />
                      </div>
                    </div>

                    {/* step 3 */}
                    <div className="bg-white border-2 border-purple-100 hover:border-purple-400 p-4 rounded-xl shadow-3xs hover:shadow-2xs transition-all relative group">
                      <div className="flex justify-between items-start mb-2.5">
                        <span className="w-5 h-5 rounded-full bg-purple-600 text-white font-mono font-bold flex items-center justify-center text-[10px]">3</span>
                        <div className="p-1.5 bg-purple-50 text-purple-600 rounded-lg group-hover:scale-110 transition-transform">
                          <Database className="w-4 h-4" />
                        </div>
                      </div>
                      <h4 className="text-[12px] font-extrabold text-[#0f172a] uppercase font-display tracking-tight">Store Vectors</h4>
                      <p className="text-[10px] text-slate-500 mt-1 leading-snug">Store embeddings in vector database</p>
                      
                      {/* Connection arrow right */}
                      <div className="absolute top-1/2 -right-3.5 -translate-y-1/2 bg-white border border-slate-200 rounded-full p-1 shadow-3xs text-slate-400 group-hover:scale-105 transition-transform z-20">
                        <ArrowRight className="w-3 h-3" />
                      </div>
                    </div>

                    {/* step 4 */}
                    <div className="bg-white border-2 border-orange-100 hover:border-orange-400 p-4 rounded-xl shadow-3xs hover:shadow-2xs transition-all relative group">
                      <div className="flex justify-between items-start mb-2.5">
                        <span className="w-5 h-5 rounded-full bg-orange-600 text-white font-mono font-bold flex items-center justify-center text-[10px]">4</span>
                        <div className="p-1.5 bg-orange-50 text-orange-600 rounded-lg group-hover:scale-110 transition-transform">
                          <Bot className="w-4 h-4" />
                        </div>
                      </div>
                      <h4 className="text-[12px] font-extrabold text-[#0f172a] uppercase font-display tracking-tight">Simulate Employee</h4>
                      <p className="text-[10px] text-slate-500 mt-1 leading-snug">AI agent acts as a new employee</p>
                      
                      {/* Connection arrow right */}
                      <div className="absolute top-1/2 -right-3.5 -translate-y-1/2 bg-white border border-slate-200 rounded-full p-1 shadow-3xs text-slate-400 group-hover:scale-105 transition-transform z-20">
                        <ArrowRight className="w-3 h-3" />
                      </div>
                    </div>

                    {/* step 5 */}
                    <div className="bg-white border-2 border-rose-100 hover:border-rose-400 p-4 rounded-xl shadow-3xs hover:shadow-2xs transition-all relative group">
                      <div className="flex justify-between items-start mb-2.5">
                        <span className="w-5 h-5 rounded-full bg-rose-600 text-white font-mono font-bold flex items-center justify-center text-[10px]">5</span>
                        <div className="p-1.5 bg-rose-50 text-rose-600 rounded-lg group-hover:scale-110 transition-transform">
                          <AlertTriangle className="w-4 h-4" />
                        </div>
                      </div>
                      <h4 className="text-[12px] font-extrabold text-[#0f172a] uppercase font-display tracking-tight">Detect Issues</h4>
                      <p className="text-[10px] text-slate-500 mt-1 leading-snug">Find missing info, conflicts &amp; friction</p>
                    </div>

                  </div>

                  {/* ROW 2: STEPS 9 TO 6 (aligned perfectly to cycle back) */}
                  <div className="grid grid-cols-5 gap-6 relative z-10 pt-2">
                    
                    {/* step 9 */}
                    <div className="bg-white border-2 border-indigo-100 hover:border-indigo-400 p-4 rounded-xl shadow-3xs hover:shadow-2xs transition-all relative group">
                      <div className="flex justify-between items-start mb-2.5">
                        <span className="w-5 h-5 rounded-full bg-indigo-600 text-white font-mono font-bold flex items-center justify-center text-[10px]">9</span>
                        <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg group-hover:scale-110 transition-transform">
                          <LayoutDashboard className="w-4 h-4" />
                        </div>
                      </div>
                      <h4 className="text-[12px] font-extrabold text-[#0f172a] uppercase font-display tracking-tight">Dashboard</h4>
                      <p className="text-[10px] text-slate-500 mt-1 leading-snug">View results, insights &amp; take action</p>
                    </div>

                    {/* step 8 */}
                    <div className="bg-white border-2 border-sky-100 hover:border-sky-400 p-4 rounded-xl shadow-3xs hover:shadow-2xs transition-all relative group">
                      <div className="flex justify-between items-start mb-2.5">
                        <span className="w-5 h-5 rounded-full bg-sky-600 text-white font-mono font-bold flex items-center justify-center text-[10px]">8</span>
                        <div className="p-1.5 bg-sky-50 text-sky-600 rounded-lg group-hover:scale-110 transition-transform">
                          <Activity className="w-4 h-4" />
                        </div>
                      </div>
                      <h4 className="text-[12px] font-extrabold text-[#0f172a] uppercase font-display tracking-tight">Analytics</h4>
                      <p className="text-[10px] text-slate-500 mt-1 leading-snug">Onboarding score, trends &amp; insights</p>
                      
                      {/* Connection arrow left to 9 */}
                      <div className="absolute top-1/2 -left-3.5 -translate-y-1/2 bg-white border border-slate-200 rounded-full p-1 shadow-3xs text-slate-400 group-hover:scale-105 transition-transform z-20">
                        <svg className="w-3 h-3 transform rotate-180" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                      </div>
                    </div>

                    {/* step 7 */}
                    <div className="bg-white border-2 border-amber-100 hover:border-amber-400 p-4 rounded-xl shadow-3xs hover:shadow-2xs transition-all relative group">
                      <div className="flex justify-between items-start mb-2.5">
                        <span className="w-5 h-5 rounded-full bg-amber-600 text-white font-mono font-bold flex items-center justify-center text-[10px]">7</span>
                        <div className="p-1.5 bg-amber-50 text-amber-600 rounded-lg group-hover:scale-110 transition-transform">
                          <FileText className="w-4 h-4" />
                        </div>
                      </div>
                      <h4 className="text-[12px] font-extrabold text-[#0f172a] uppercase font-display tracking-tight">Generate Reports</h4>
                      <p className="text-[10px] text-slate-500 mt-1 leading-snug">Generate findings, recommendations &amp; logs</p>
                      
                      {/* Connection arrow left to 8 */}
                      <div className="absolute top-1/2 -left-3.5 -translate-y-1/2 bg-white border border-slate-200 rounded-full p-1 shadow-3xs text-slate-400 group-hover:scale-105 transition-transform z-20">
                        <svg className="w-3 h-3 transform rotate-180" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                      </div>
                    </div>

                    {/* step 6 */}
                    <div className="bg-white border-2 border-teal-100 hover:border-teal-400 p-4 rounded-xl shadow-3xs hover:shadow-2xs transition-all relative group">
                      <div className="flex justify-between items-start mb-2.5">
                        <span className="w-5 h-5 rounded-full bg-teal-600 text-white font-mono font-bold flex items-center justify-center text-[10px]">6</span>
                        <div className="p-1.5 bg-teal-50 text-teal-600 rounded-lg group-hover:scale-110 transition-transform">
                          <Brain className="w-4 h-4" />
                        </div>
                      </div>
                      <h4 className="text-[12px] font-extrabold text-[#0f172a] uppercase font-display tracking-tight">Memory Module</h4>
                      <p className="text-[10px] text-slate-500 mt-1 leading-snug">Store session history &amp; agent memory</p>
                      
                      {/* Connection arrow left to 7 */}
                      <div className="absolute top-1/2 -left-3.5 -translate-y-1/2 bg-white border border-slate-200 rounded-full p-1 shadow-3xs text-slate-400 group-hover:scale-105 transition-transform z-20">
                        <svg className="w-3 h-3 transform rotate-180" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                      </div>
                    </div>

                    {/* col 5 row 2: blank spacer card with a small loop info */}
                    <div className="bg-slate-50/50 border border-dashed border-slate-200 rounded-xl p-4 flex flex-col justify-center items-center text-center">
                      <p className="text-[9px] font-mono font-bold text-slate-400 tracking-wider">LOOP FEEDBACK</p>
                      <span className="text-[8px] text-slate-450 leading-relaxed font-sans mt-0.5">Recurrent Evaluation Loop</span>
                    </div>

                  </div>

                </div>

                {/* ===== MOBILE 9-STEP VERTICAL TIMELINE ===== */}
                <div className="block lg:hidden bg-slate-50/50 border border-slate-100 rounded-xl p-5 space-y-6">
                  
                  {/* step 1 */}
                  <div className="flex gap-4 items-start relative group">
                    <div className="w-6 h-6 rounded-full bg-blue-600 text-white font-mono font-bold flex items-center justify-center text-xs shrink-0 z-10">1</div>
                    <div className="bg-white border border-slate-150 p-3.5 rounded-xl shadow-3xs flex-1">
                      <div className="flex items-center gap-2 mb-1 text-blue-650">
                        <Upload className="w-3.5 h-3.5" />
                        <h4 className="text-xs font-bold text-[#0f172a] uppercase tracking-tight">Upload Documents</h4>
                      </div>
                      <p className="text-[11px] text-slate-500">Upload PDFs, DOCX, TXT, FAQs, etc.</p>
                    </div>
                  </div>

                  {/* step 2 */}
                  <div className="flex gap-4 items-start relative group">
                    <div className="w-6 h-6 rounded-full bg-emerald-600 text-white font-mono font-bold flex items-center justify-center text-xs shrink-0 z-10">2</div>
                    <div className="bg-white border border-slate-150 p-3.5 rounded-xl shadow-3xs flex-1">
                      <div className="flex items-center gap-2 mb-1 text-emerald-650">
                        <Cpu className="w-3.5 h-3.5" />
                        <h4 className="text-xs font-bold text-[#0f172a] uppercase tracking-tight">Extract Knowledge</h4>
                      </div>
                      <p className="text-[11px] text-slate-500">Extract text, chunk &amp; create embeddings</p>
                    </div>
                  </div>

                  {/* step 3 */}
                  <div className="flex gap-4 items-start relative group">
                    <div className="w-6 h-6 rounded-full bg-purple-600 text-white font-mono font-bold flex items-center justify-center text-xs shrink-0 z-10">3</div>
                    <div className="bg-white border border-slate-150 p-3.5 rounded-xl shadow-3xs flex-1">
                      <div className="flex items-center gap-2 mb-1 text-purple-650">
                        <Database className="w-3.5 h-3.5" />
                        <h4 className="text-xs font-bold text-[#0f172a] uppercase tracking-tight">Store Vectors</h4>
                      </div>
                      <p className="text-[11px] text-slate-500">Store embeddings in vector database</p>
                    </div>
                  </div>

                  {/* step 4 */}
                  <div className="flex gap-4 items-start relative group">
                    <div className="w-6 h-6 rounded-full bg-orange-600 text-white font-mono font-bold flex items-center justify-center text-xs shrink-0 z-10">4</div>
                    <div className="bg-white border border-slate-150 p-3.5 rounded-xl shadow-3xs flex-1">
                      <div className="flex items-center gap-2 mb-1 text-orange-650">
                        <Bot className="w-3.5 h-3.5" />
                        <h4 className="text-xs font-bold text-[#0f172a] uppercase tracking-tight">Simulate Employee</h4>
                      </div>
                      <p className="text-[11px] text-slate-500">AI agent acts as a new employee</p>
                    </div>
                  </div>

                  {/* step 5 */}
                  <div className="flex gap-4 items-start relative group">
                    <div className="w-6 h-6 rounded-full bg-rose-600 text-white font-mono font-bold flex items-center justify-center text-xs shrink-0 z-10">5</div>
                    <div className="bg-white border border-slate-150 p-3.5 rounded-xl shadow-3xs flex-1">
                      <div className="flex items-center gap-2 mb-1 text-rose-650">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <h4 className="text-xs font-bold text-[#0f172a] uppercase tracking-tight">Detect Issues</h4>
                      </div>
                      <p className="text-[11px] text-slate-500">Find missing info, conflicts &amp; friction</p>
                    </div>
                  </div>

                  {/* step 6 */}
                  <div className="flex gap-4 items-start relative group">
                    <div className="w-6 h-6 rounded-full bg-teal-600 text-white font-mono font-bold flex items-center justify-center text-xs shrink-0 z-10">6</div>
                    <div className="bg-white border border-slate-150 p-3.5 rounded-xl shadow-3xs flex-1">
                      <div className="flex items-center gap-2 mb-1 text-teal-650">
                        <Brain className="w-3.5 h-3.5" />
                        <h4 className="text-xs font-bold text-[#0f172a] uppercase tracking-tight">Memory Module</h4>
                      </div>
                      <p className="text-[11px] text-slate-500">Store session history &amp; agent memory</p>
                    </div>
                  </div>

                  {/* step 7 */}
                  <div className="flex gap-4 items-start relative group">
                    <div className="w-6 h-6 rounded-full bg-amber-600 text-white font-mono font-bold flex items-center justify-center text-xs shrink-0 z-10">7</div>
                    <div className="bg-white border border-slate-150 p-3.5 rounded-xl shadow-3xs flex-1">
                      <div className="flex items-center gap-2 mb-1 text-amber-650">
                        <FileText className="w-3.5 h-3.5" />
                        <h4 className="text-xs font-bold text-[#0f172a] uppercase tracking-tight">Generate Reports</h4>
                      </div>
                      <p className="text-[11px] text-slate-500">Generate findings, recommendations &amp; logs</p>
                    </div>
                  </div>

                  {/* step 8 */}
                  <div className="flex gap-4 items-start relative group">
                    <div className="w-6 h-6 rounded-full bg-sky-600 text-white font-mono font-bold flex items-center justify-center text-xs shrink-0 z-10">8</div>
                    <div className="bg-white border border-slate-150 p-3.5 rounded-xl shadow-3xs flex-1">
                      <div className="flex items-center gap-2 mb-1 text-sky-650">
                        <Activity className="w-3.5 h-3.5" />
                        <h4 className="text-xs font-bold text-[#0f172a] uppercase tracking-tight">Analytics</h4>
                      </div>
                      <p className="text-[11px] text-slate-500">Onboarding score, trends &amp; insights</p>
                    </div>
                  </div>

                  {/* step 9 */}
                  <div className="flex gap-4 items-start relative group">
                    <div className="w-6 h-6 rounded-full bg-indigo-600 text-white font-mono font-bold flex items-center justify-center text-xs shrink-0 z-10">9</div>
                    <div className="bg-white border border-slate-150 p-3.5 rounded-xl shadow-3xs flex-1">
                      <div className="flex items-center gap-2 mb-1 text-indigo-650">
                        <LayoutDashboard className="w-3.5 h-3.5" />
                        <h4 className="text-xs font-bold text-[#0f172a] uppercase tracking-tight">Dashboard</h4>
                      </div>
                      <p className="text-[11px] text-slate-500">View results, insights &amp; take action</p>
                    </div>
                  </div>

                </div>

              </div>
            </motion.div>
          )}

          {/* ==================== PAGE 2: DOCUMENT LIBRARY ==================== */}
          {activeNav === 'Document Library' && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6 w-full"
            >
              {/* SEC 1: DOCUMENTS INDEXING */}
              <section id="document-library" className="w-full space-y-6 print:hidden">
            
            {/* FILE Uploader Unit */}
            <div className="bg-white border border-stone-200 rounded-xl p-5 shadow-3xs">
              <h3 className="text-sm font-bold font-display text-stone-800 tracking-tight mb-3 uppercase flex items-center justify-between">
                <span>1. Process Documents</span>
                <span className="text-[10px] font-mono text-stone-400 font-normal">DOCX / PDF / TXT / MD</span>
              </h3>

              {/* Drag and Drop Zone */}
              <div className="relative border-2 border-dashed border-stone-200 rounded-lg p-5 text-center hover:border-stone-400 transition-colors bg-stone-50 cursor-pointer">
                <input 
                  type="file" 
                  id="file-upload-input"
                  multiple 
                  accept=".pdf,.txt,.md,.docx,.doc" 
                  onChange={handleFileUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="flex flex-col items-center justify-center gap-2">
                  <div className="p-2 bg-stone-200 rounded-full text-stone-700 shadow-3xs">
                    <Upload className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-stone-800">Drag & Drop handbook items</p>
                    <p className="text-[10px] text-stone-500 mt-1">or click to browse local files (under 10MB)</p>
                  </div>
                </div>
              </div>

              {/* Upload Busy state */}
              {isUploading && (
                <div className="mt-3 bg-stone-50 border border-stone-200 p-3 rounded-md flex items-center gap-3">
                  <div className="w-4 h-4 border-2 border-stone-800 border-t-transparent rounded-full animate-spin"></div>
                  <div className="text-xs font-medium text-stone-700">Extracting text & forming memory chunks...</div>
                </div>
              )}

              {/* Paste Text fallback direct */}
              <div className="mt-4 border-t border-stone-100 pt-4">
                <details className="group">
                  <summary className="text-xs font-medium text-stone-600 hover:text-stone-900 cursor-pointer flex items-center justify-between list-none">
                    <span>Or direct paste policy text</span>
                    <Plus className="w-3 h-3 group-open:rotate-45 transition-transform" />
                  </summary>
                  <form onSubmit={handlePasteSubmit} className="mt-3 space-y-3">
                    <div>
                      <label className="block text-[10px] font-bold text-stone-500 uppercase mb-1">Document Name</label>
                      <input 
                        type="text"
                        id="paste-doc-name"
                        placeholder="e.g. Remote Work FAQ.md"
                        value={pasteName}
                        onChange={e => setPasteName(e.target.value)}
                        className="w-full text-xs border border-stone-200 rounded px-2.5 py-1.5 focus:outline-stone-400 font-sans"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-stone-500 uppercase mb-1">Raw Text Context</label>
                      <textarea
                        id="paste-doc-content"
                        placeholder="# Workplace Guide... Paste company expectations here."
                        value={pasteContent}
                        onChange={e => setPasteContent(e.target.value)}
                        rows={5}
                        className="w-full text-xs border border-stone-200 rounded px-2.5 py-1.5 focus:outline-stone-400 font-mono"
                      />
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          id="btn-paste-md"
                          onClick={() => setPasteType('md')}
                          className={`px-2 py-0.5 rounded text-[10px] border font-bold ${pasteType === 'md' ? 'bg-stone-950 text-white border-stone-950' : 'bg-stone-50 text-stone-600 border-stone-200'}`}
                        >
                          Markdown
                        </button>
                        <button
                          type="button"
                          id="btn-paste-txt"
                          onClick={() => setPasteType('txt')}
                          className={`px-2 py-0.5 rounded text-[10px] border font-bold ${pasteType === 'txt' ? 'bg-stone-950 text-white border-stone-950' : 'bg-stone-50 text-stone-600 border-stone-200'}`}
                        >
                          Plain Text
                        </button>
                      </div>
                      <button 
                        type="submit"
                        id="btn-submit-paste"
                        className="px-3 py-1 bg-stone-900 text-white rounded text-xs font-semibold hover:bg-stone-800 flex items-center gap-1 cursor-pointer"
                      >
                        Add to Index
                      </button>
                    </div>
                  </form>
                </details>
              </div>

            </div>

            {/* INDEXED DOCUMENTS LIST */}
            <div className="bg-white border border-[#e2e8f0] rounded-xl p-5 shadow-sm">
              <h3 className="text-sm font-bold font-display text-[#0f172a] tracking-tight mb-3 uppercase flex items-center justify-between">
                <span>Indexed Sources</span>
                <span className="text-xs bg-[#f1f5f9] text-[#475569] px-2 py-0.5 rounded-full font-mono font-bold">
                  {documents.length} files
                </span>
              </h3>

              {documents.length === 0 ? (
                <div className="text-center py-8 bg-slate-50/50 rounded-lg border border-[#e2e8f0]/40 p-4">
                  <FileText className="w-8 h-8 text-[#94a3b8] mx-auto mb-2" />
                  <p className="text-xs text-[#64748b]">No documents indexed in simulation parameters yet.</p>
                </div>
              ) : (
                <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
                  {documents.map((doc) => (
                    <div 
                       key={doc.id}
                      id={`doc-card-${doc.id}`}
                      onClick={() => setViewingDoc(doc)}
                      className="group flex items-center justify-between p-2.5 rounded-lg border border-[#e2e8f0] hover:border-[#3b82f6] bg-slate-50/50 hover:bg-white cursor-pointer transition-all"
                    >
                      <div className="flex items-center gap-2.5 overflow-hidden">
                        <div className="p-2 bg-[#f1f5f9] text-[#475569] rounded group-hover:bg-[#3b82f6] group-hover:text-white transition-colors">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div className="overflow-hidden">
                          <p className="text-xs font-semibold text-[#1e293b] truncate">{doc.name}</p>
                          <div className="flex items-center gap-2 mt-0.5 text-[9px] text-[#64748b] font-mono font-medium">
                            <span className="uppercase">{doc.type}</span>
                            <span>•</span>
                            <span>{Math.round(doc.size / 100) / 10} KB</span>
                            <span>•</span>
                            <span>{doc.chunkCount} Chunks</span>
                          </div>
                        </div>
                      </div>
                      <button 
                        id={`btn-del-doc-${doc.id}`}
                        onClick={(e) => handleDocDelete(doc.id, e)}
                        className="p-1 px-1.5 hover:bg-rose-50 text-[#94a3b8] hover:text-rose-600 rounded transition-colors"
                        title="Remove Document From Audit context"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* QUICK PREVIEW DRAWER MODEL FOR DOCUMENTS */}
            <AnimatePresence>
              {viewingDoc && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4"
                >
                  <motion.div 
                    initial={{ scale: 0.95 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0.95 }}
                    className="bg-white rounded-xl shadow-xl border border-stone-200 max-w-2xl w-full max-h-[80vh] flex flex-col p-6"
                  >
                    <div className="flex items-center justify-between pb-3 border-b border-stone-100">
                      <div>
                        <h4 className="font-bold text-stone-950 text-base">{viewingDoc.name}</h4>
                        <p className="text-[10px] font-mono text-stone-500 mt-0.5">SIZE: {viewingDoc.size} bytes | DATE: {new Date(viewingDoc.uploadDate).toLocaleString()}</p>
                      </div>
                      <button 
                        id="btn-close-preview"
                        onClick={() => setViewingDoc(null)}
                        className="px-2.5 py-1 text-xs font-semibold rounded bg-stone-100 hover:bg-stone-200 text-stone-700 transition"
                      >
                        Close
                      </button>
                    </div>
                    <div className="flex-1 overflow-y-auto my-4 text-xs font-mono bg-stone-50 border border-stone-200 p-4 rounded-lg leading-relaxed whitespace-pre-wrap select-text">
                      {viewingDoc.content}
                    </div>
                    <div className="text-right">
                      <button 
                        id="btn-ok-preview"
                        onClick={() => setViewingDoc(null)}
                        className="px-4 py-1.5 bg-stone-900 text-white rounded text-xs font-semibold hover:bg-stone-800"
                      >
                        Acknowledge
                      </button>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

          </section>
        </motion.div>
      )}

      {/* ==================== PAGE 4: AUDIT HISTORY ==================== */}
      {activeNav === 'Audit History' && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6 w-full"
        >
          {/* AUDIT ARCHIVE HISTORICAL LOGS */}
          <div className="bg-white border border-[#e2e8f0] rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <Briefcase className="w-5 h-5 text-slate-700" />
              <div>
                <h3 className="text-sm font-bold text-slate-800 font-display">Onboarding Sessions Database</h3>
                <p className="text-[11px] text-slate-500">Pick past recruit simulations to examine risk reports.</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#f1f5f9] p-4 rounded-xl">
              <span className="text-xs font-bold text-[#1e293b]">Choose Active Report:</span>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <select
                  id="session-history-select-main"
                  value={selectedSessionId || ''}
                  onChange={e => {
                    setSelectedSessionId(e.target.value);
                    setActiveNav('Reports'); // Redirection
                  }}
                  className="bg-white text-xs border border-[#e2e8f0] hover:border-[#cbd5e1] rounded px-3 py-2.5 focus:outline-[#3b82f6] font-semibold cursor-pointer text-[#334155] flex-1 min-w-[240px]"
                >
                  <option value="" disabled>-- Select saved audit log --</option>
                  {sessions.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name} - ({s.score}%) ({s.candidateRole})
                    </option>
                  ))}
                </select>
                {selectedSessionId && (
                  <button
                    id="btn-del-session-main"
                    onClick={(e) => handleSessionDelete(selectedSessionId, e)}
                    className="p-2 px-2.5 hover:bg-rose-50 border border-[#e2e8f0] text-[#94a3b8] hover:text-rose-600 bg-white rounded-lg cursor-pointer transition-colors"
                    title="Archive this report"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {sessions.length > 0 ? (
              <div className="space-y-3 border-t border-slate-100 pt-4 font-sans">
                <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono">Sessions Registry</h4>
                <div className="border border-slate-150 rounded-lg overflow-hidden divide-y divide-slate-100 bg-slate-50/50">
                  {sessions.map(s => (
                    <div key={s.id} className="p-3.5 flex items-center justify-between hover:bg-white transition text-xs">
                      <div>
                        <p className="font-bold text-slate-800">{s.name}</p>
                        <p className="text-[10px] text-slate-500 mt-1 font-sans">Role Type: **{s.candidateRole}** • Date calculated: {new Date(s.date).toLocaleDateString()}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full ${s.score >= 80 ? 'bg-emerald-100 text-emerald-800' : s.score >= 60 ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'}`}>
                          Score: {s.score}%
                        </span>
                        <button
                          onClick={() => {
                            setSelectedSessionId(s.id);
                            setActiveNav('Reports');
                          }}
                          className="px-3 py-1 bg-slate-900 hover:bg-slate-850 text-white rounded font-bold cursor-pointer text-[10px]"
                        >
                          Load Report
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-6 text-slate-400">
                <p className="text-xs">No saved simulation sessions yet. Start a new run above.</p>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* ==================== PAGE 5: REPORTS ==================== */}
      {activeNav === 'Reports' && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6 w-full"
        >
          {/* AUDIT ARCHIVE HISTORICAL LOGS (Dropdown Selector - hidden) */}
          <div className="hidden">
            <div id="audit-sessions" className="bg-[#f1f5f9] border border-[#e2e8f0] rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 print:hidden shadow-sm">
              <div className="flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-[#475569]" />
                <span className="text-xs font-bold text-[#1e293b]">Audit History Logs</span>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <select
                  id="session-history-select-hidden"
                  value={selectedSessionId || ''}
                  onChange={() => {}}
                  className="bg-white text-xs border border-[#e2e8f0] hover:border-[#cbd5e1] rounded px-3 py-1.5 focus:outline-[#3b82f6] font-semibold cursor-pointer text-[#334155] flex-1 min-w-[200px]"
                >
                  <option value="" disabled>-- Choose historical audit --</option>
                  {sessions.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name} - ({s.score}%)
                    </option>
                  ))}
                </select>
                {selectedSessionId && (
                  <button
                    id="btn-del-session-hidden"
                    onClick={(e) => handleSessionDelete(selectedSessionId, e)}
                    title="Archive this report"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* AUDIT REPORT DASHBOARD (LOADED DETAILS) */}
          <div id="audit-report">
            {sessionDetail ? (
                <div className="bg-white border border-[#e2e8f0] rounded-xl shadow-sm p-6 print:p-0 print:border-none print:shadow-none space-y-6">
                
                {/* Print Title Header */}
                <div className="hidden print:block text-center pb-4 border-b border-stone-300">
                  <h2 className="text-2xl font-bold font-display uppercase text-stone-900">Corporate Onboarding Audit Log</h2>
                  <p className="text-xs text-stone-500 uppercase mt-0.5">ONBOARDING AUDIT AGENT • {sessionDetail.session.name}</p>
                  <p className="text-[10px] text-stone-400 mt-0.5">DATE: {new Date(sessionDetail.session.date).toLocaleDateString()} | ROLE: {sessionDetail.session.candidateRole}</p>
                </div>

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-stone-100 print:hidden">
                  <div>
                    <span className="text-[10px] font-mono text-stone-500 uppercase">Interactive Report Summary</span>
                    <h2 className="text-xl font-bold font-display tracking-tight text-stone-900">{sessionDetail.session.name}</h2>
                    <p className="text-xs text-stone-500">
                      Diagnosed on {new Date(sessionDetail.session.date).toLocaleString()} for dynamic candidate role **{sessionDetail.session.candidateRole}**.
                    </p>
                  </div>
                  
                  {/* Reporting actions */}
                  <div className="flex items-center gap-2">
                    <button
                      id="btn-print-action"
                      onClick={handlePrintReport}
                      className="p-2 border border-stone-200 rounded-lg hover:border-stone-400 text-stone-700 bg-stone-50 flex items-center justify-center gap-1 text-xs font-semibold cursor-pointer"
                      title="Optimised document print"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Print PDF</span>
                    </button>
                    <button
                      id="btn-download-markdown"
                      onClick={handleDownloadReport}
                      className="p-2 bg-stone-950 text-white rounded-lg hover:bg-stone-800 flex items-center justify-center gap-1 text-xs font-semibold cursor-pointer"
                      title="Download Markdown audit report"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>Download Report (.md)</span>
                    </button>
                  </div>
                    {/* KPI METRIC CARDS GRID */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  
                  {/* Conic Score Ring card */}
                  <div className="bg-white border border-[#e2e8f0] p-5 rounded-xl shadow-sm md:col-span-2 flex items-center gap-5">
                    <div className="relative w-24 h-24 rounded-full flex items-center justify-center shrink-0" style={{ background: `conic-gradient(#3b82f6 ${sessionDetail.session.score}%, #e2e8f0 0)` }}>
                      <div className="w-[84px] h-[84px] bg-white rounded-full flex flex-col items-center justify-center shadow-3xs">
                        <span className="text-2xl font-black text-[#0f172a]">{sessionDetail.session.score}%</span>
                        <span className="text-[9px] text-blue-600 font-bold tracking-widest uppercase">MATCH</span>
                      </div>
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-[#64748b] uppercase tracking-wider">Overall Success</h4>
                      <h3 className="text-[#0f172a] font-bold text-sm mt-1 leading-snug">
                        {sessionDetail.session.name}
                      </h3>
                      <p className="text-[11px] text-[#64748b] mt-1 leading-relaxed line-clamp-2">
                        {sessionDetail.session.executiveSummary || "The simulated candidate role completed active task milestones with the results plotted below."}
                      </p>
                    </div>
                  </div>

                  <div className="bg-white border border-[#e2e8f0] p-4 rounded-xl relative shadow-sm flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-[#64748b] font-mono tracking-wider uppercase">Contradictions</span>
                      <div className={`text-3xl font-extrabold font-display mt-1 ${sessionDetail.session.contradictionCount > 0 ? 'text-[#b91c1c]' : 'text-emerald-600'}`}>
                        {sessionDetail.session.contradictionCount}
                      </div>
                    </div>
                    <div className="text-[10px] text-[#64748b] mt-2 font-medium">Clashing rules in manuals.</div>
                    <div className="absolute top-4 right-4 p-1">
                      {sessionDetail.session.contradictionCount > 0 ? (
                        <AlertOctagon className="w-4 h-4 text-rose-500 animate-pulse" />
                      ) : (
                        <Check className="w-4 h-4 text-emerald-500 font-bold" />
                      )}
                    </div>
                  </div>

                  <div className="bg-white border border-[#e2e8f0] p-4 rounded-xl relative shadow-sm flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-[#64748b] font-mono tracking-wider uppercase">Gaps & Missing Info</span>
                      <div className={`text-3xl font-extrabold font-display mt-1 ${sessionDetail.session.missingInfoCount > 0 ? 'text-[#b45309]' : 'text-emerald-600'}`}>
                        {sessionDetail.session.missingInfoCount}
                      </div>
                    </div>
                    <div className="text-[10px] text-[#64748b] mt-2 font-medium">Setup elements not listed.</div>
                    <div className="absolute top-4 right-4 p-1">
                      {sessionDetail.session.missingInfoCount > 0 ? (
                        <Search className="w-4 h-4 text-amber-500" />
                      ) : (
                        <Check className="w-4 h-4 text-emerald-500 font-bold" />
                      )}
                    </div>
                  </div>

                </div>              </div>

                {/* SCORE CHARTS VISUALISATION (RECHARTS + RADAR ANALYSER) */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center bg-[#f1f5f9]/50 border border-[#e2e8f0] rounded-xl p-5">
                  
                  <div className="md:col-span-4 flex flex-col justify-center gap-3">
                    <h4 className="text-xs font-bold font-display text-[#64748b] uppercase tracking-widest flex items-center gap-1.5">
                      <Activity className="w-3.5 h-3.5 text-[#3b82f6] font-bold" />
                      Criteria Evaluation
                    </h4>
                    <p className="text-xs text-[#64748b] leading-relaxed">
                      Our multi-agent simulation rates documents across four core dimensions. Gaps drag scores downwards.
                    </p>
                    <div className="space-y-1.5 text-[11px] font-semibold text-[#1e293b]">
                      <div className="flex items-center justify-between pb-1.5 border-b border-dashed border-[#e2e8f0]">
                        <span className="text-[#64748b]">Clarity</span>
                        <span>{sessionDetail.session.clarityScore || (sessionDetail.session.score >= 70 ? '8' : '5')} / 10</span>
                      </div>
                      <div className="flex items-center justify-between pb-1.5 border-b border-dashed border-[#e2e8f0]">
                        <span className="text-[#64748b]">Completeness</span>
                        <span>{sessionDetail.session.completenessScore || (sessionDetail.session.score >= 75 ? '9' : '4')} / 10</span>
                      </div>
                      <div className="flex items-center justify-between pb-1.5 border-b border-dashed border-[#e2e8f0]">
                        <span className="text-[#64748b]">Consistency</span>
                        <span>{sessionDetail.session.consistencyScore || (sessionDetail.session.score >= 80 ? '8' : '4')} / 10</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[#64748b]">Support SLA Escalation</span>
                        <span>{sessionDetail.session.supportScore || (sessionDetail.session.score >= 60 ? '7' : '6')} / 10</span>
                      </div>
                    </div>
                  </div>

                  {/* Dynamic Radar visual (Recharts) */}
                  <div className="md:col-span-8 h-[220px] w-full flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                        <PolarGrid stroke="#e5e5e0" />
                        <PolarAngleAxis dataKey="name" tick={{ fill: '#404040', fontSize: 11, fontWeight: 550 }} />
                        <PolarRadiusAxis angle={30} domain={[0, 10]} stroke="#cbd5e1" tick={{ fill: '#737373', fontSize: 9 }} />
                        <Radar 
                          name="Simulation" 
                          dataKey="value" 
                          stroke="#1c1917" 
                          fill="#1c1917" 
                          fillOpacity={0.15} 
                        />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>

                </div>

                {/* THE AGENT DETECTED ROADBLOCKS TABS AND LOGS */}
                <div className="print:block">
                  
                  {/* Selector tabs print invisible */}
                  <div className="flex border-b border-[#e2e8f0] gap-6 text-sm font-semibold print:hidden">
                    <button
                      id="tab-findings"
                      onClick={() => setActiveReportTab('findings')}
                      className={`pb-3 border-b-2 hover:text-[#0f172a] transition flex items-center gap-1.5 cursor-pointer ${activeReportTab === 'findings' ? 'border-[#3b82f6] text-[#3b82f6]' : 'border-transparent text-[#94a3b8]'}`}
                    >
                      <AlertTriangle className="w-4 h-4" />
                      <span>Friction Findings ({sessionDetail.findings.length})</span>
                    </button>
                    <button
                      id="tab-recommendations"
                      onClick={() => setActiveReportTab('recommendations')}
                      className={`pb-3 border-b-2 hover:text-[#0f172a] transition flex items-center gap-1.5 cursor-pointer ${activeReportTab === 'recommendations' ? 'border-[#3b82f6] text-[#3b82f6]' : 'border-transparent text-[#94a3b8]'}`}
                    >
                      <CheckCircle className="w-4 h-4" />
                      <span>Actionable Remediation ({sessionDetail.recommendations.length})</span>
                    </button>
                    <button
                      id="tab-chat"
                      onClick={() => setActiveReportTab('chat')}
                      className={`pb-3 border-b-2 hover:text-[#0f172a] transition flex items-center gap-1.5 cursor-pointer ${activeReportTab === 'chat' ? 'border-[#3b82f6] text-[#3b82f6]' : 'border-transparent text-[#94a3b8]'}`}
                    >
                      <HelpCircle className="w-4 h-4" />
                      <span>Ask the Auditor Chat</span>
                    </button>
                  </div>

                  {/* TAB 1: DETECTED ROADBLOCK LOGS */}
                  {((activeReportTab === 'findings' || window.matchMedia('print').matches)) && (
                    <div className="space-y-4 pt-4">
                      
                      {/* Findings search filters - hidden in print */}
                      <div className="flex flex-wrap gap-4 items-center justify-between text-xs pb-3 border-b border-slate-100 print:hidden">
                        <div className="flex flex-wrap gap-4 items-center">
                          <div className="flex items-center gap-2">
                            <span className="text-[#64748b] font-medium">Filter Severity:</span>
                            <div className="flex rounded border border-[#e2e8f0] overflow-hidden font-semibold">
                              {['ALL', 'HIGH', 'MEDIUM', 'LOW'].map(sev => (
                                <button
                                  key={sev}
                                  id={`btn-sev-${sev}`}
                                  onClick={() => setFilterSeverity(sev as any)}
                                  className={`px-2.5 py-1 transition-all cursor-pointer ${filterSeverity === sev ? 'bg-[#1e293b] text-white font-bold' : 'bg-white text-[#475569] hover:bg-[#f1f5f9]'}`}
                                >
                                  {sev}
                                </button>
                              ))}
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="text-stone-500 font-medium font-sans">Type:</span>
                            <select
                              id="type-filter-select"
                              value={filterType}
                              onChange={e => setFilterType(e.target.value as any)}
                              className="bg-white border border-stone-200 rounded px-2.5 py-1 focus:outline-stone-400 font-medium text-[#1e293b] cursor-pointer"
                            >
                              <option value="ALL">All Gaps</option>
                              <option value="contradiction">Contradiction</option>
                              <option value="info_miss">Missing Info</option>
                              <option value="broken_setup">Broken Setup</option>
                              <option value="confusion">Confusion</option>
                              <option value="ambiguous">Ambiguous</option>
                            </select>
                          </div>
                        </div>

                        {/* Resolve All Button */}
                        <button
                          onClick={() => handleResolveAllFindings(sessionDetail.session.id)}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all text-[11px] uppercase tracking-wider cursor-pointer shadow-xs hover:shadow-sm"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>Resolve All Gaps</span>
                        </button>
                      </div>

                      {/* Expandable finding cards */}
                      {filteredFindings.length === 0 ? (
                        <div className="text-center py-10 bg-stone-50 rounded-lg border border-stone-100">
                          <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
                          <p className="text-sm font-semibold text-stone-800">No matching friction findings cataloged.</p>
                          <p className="text-xs text-stone-500 mt-1">Excellent! The simulated candidate cruised through our handbook.</p>
                        </div>
                      ) : (
                        <div className="space-y-3.5">
                          {filteredFindings.map((find, idx) => (
                            <div 
                              key={find.id}
                              id={`finding-${find.id}`}
                              className="bg-white border border-[#e2e8f0] hover:border-[#3b82f6] rounded-xl p-5 transition-all shadow-sm"
                            >
                              <div className="flex items-start justify-between gap-3 flex-wrap">
                                <div className="flex items-center gap-2.5 font-display">
                                  {getFindingIcon(find.type)}
                                  <h4 className="font-bold text-[#0f172a] text-sm">{find.title}</h4>
                                </div>
                                <div className="flex gap-1.5 text-[9px] font-bold font-mono">
                                  <span className={`px-2 py-0.5 border rounded-full ${getSeverityColor(find.severity)}`}>
                                    {find.severity} IMPACT
                                  </span>
                                  <span className="bg-slate-100 border border-slate-200 text-[#334155] px-2 py-0.5 rounded-full uppercase tracking-wider">
                                    {find.type.replace('_', ' ')}
                                  </span>
                                </div>
                              </div>

                              <div className="mt-4 space-y-4 pl-7 border-l-2 border-slate-150 ml-1">
                                {/* ISSUE STATEMENT */}
                                <div className="text-xs">
                                  <span className="font-bold text-[#475569] uppercase tracking-wider text-[10px] block mb-1">Issue</span>
                                  <p className="text-[#0f172a] leading-relaxed font-semibold font-sans">
                                    {find.description}
                                  </p>
                                </div>

                                {/* WHY IT MATTERS */}
                                <div className="text-xs">
                                  <span className="font-bold text-amber-600 uppercase tracking-wider text-[10px] block mb-1">Why it matters</span>
                                  <p className="text-[#334155] leading-relaxed font-sans bg-amber-50/40 p-2.5 rounded-lg border border-amber-100/30">
                                    {find.whyItMatters || find.details || "This directly limits setup velocity, increases first-week confusion, and raises risk of candidate dropouts."}
                                  </p>
                                </div>

                                {/* SUGGESTED FIX */}
                                <div className="text-xs">
                                  <span className="font-bold text-[#2563eb] uppercase tracking-wider text-[10px] block mb-1">Suggested fix</span>
                                  <p className="text-[#1e40af] bg-blue-50/50 p-2.5 rounded-lg border border-blue-100/40 leading-relaxed font-sans font-semibold">
                                    {find.suggestedFix || "Update target onboarding guidelines to formally define process owners and establish unified support channel SLA configurations."}
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center justify-between mt-4 border-t border-slate-50 pt-3 pl-7 flex-wrap gap-2">
                                <div className="flex items-center gap-1.5 text-[10px] text-[#64748b] font-mono font-medium">
                                  <FileText className="w-3.5 h-3.5 text-[#94a3b8]" />
                                  <span>Context references:</span>
                                  <span className="font-semibold text-[#1e293b] truncate max-w-sm">{find.documentReference}</span>
                                </div>
                                <button
                                  onClick={() => handleResolveFinding(find.id)}
                                  className="text-[10px] font-bold uppercase tracking-wider bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 px-3 py-1.5 rounded-lg flex items-center gap-1 transition-all cursor-pointer shadow-3xs"
                                >
                                  <Check className="w-3 h-3 text-emerald-600" />
                                  <span>Clear / Resolve</span>
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                    </div>
                  )}

                  {/* TAB 2: REMEDIATION RECOMMENDATION ACTION PLANNED */}
                  {((activeReportTab === 'recommendations' || window.matchMedia('print').matches)) && (
                    <div className="space-y-4 pt-4">
                      
                      <div className="bg-[#f0fdf4] border border-emerald-100 rounded-xl p-4 flex items-start gap-3 print:hidden">
                        <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs font-bold text-emerald-950">Active Remediation Roadmap</p>
                          <p className="text-[11px] text-emerald-700 mt-1 leading-relaxed">
                            These priorities are constructed by the Auditor to restructure missing files, settle workplace location clashes, and configure API vaults. Implement these step-by-step to reach a 100% onboarding success rate.
                          </p>
                        </div>
                      </div>

                      <div className="space-y-3">
                        {sessionDetail.recommendations.map((rec) => (
                          <div 
                            key={rec.id}
                            id={`rec-item-${rec.id}`}
                            className="bg-white border border-stone-200 hover:border-emerald-300 rounded-xl p-4.5 transition-all shadow-3xs"
                          >
                            <div className="flex items-center justify-between gap-2.5 bg-stone-50 border border-stone-200 px-3 py-1.5 rounded-lg">
                              <span className="text-[10px] font-bold text-stone-700 uppercase font-mono tracking-wider">{rec.category}</span>
                              <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${rec.impact === 'HIGH' ? 'bg-emerald-100 text-emerald-900' : 'bg-sky-100 text-sky-900'}`}>
                                Impact: {rec.impact}
                              </span>
                            </div>

                            <p className="text-xs font-bold text-stone-900 mt-3">
                              {rec.text}
                            </p>

                            <div className="mt-2.5 bg-stone-50 border-l-2 border-emerald-500 p-3 text-[11px] text-stone-600 leading-relaxed font-sans">
                              <span className="font-semibold text-stone-850 block mb-1 uppercase text-[9px] tracking-wider font-mono">Proposed Documentation Fix:</span>
                              {rec.actionItem}
                            </div>
                          </div>
                        ))}
                      </div>

                    </div>
                  )}

                  {/* TAB 3: CHATBOT WORKSPACE ("ASK THE AUDITOR") */}
                  {activeReportTab === 'chat' && (
                    <div className="pt-4 space-y-4 print:hidden">
                      
                      <div className="border border-stone-200 rounded-xl overflow-hidden bg-stone-50 flex flex-col h-[480px] shadow-3xs">
                        
                        {/* Chat Header */}
                        <div className="bg-stone-900 text-white p-3 px-4 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 bg-emerald-400 rounded-full animate-pulse"></div>
                            <div>
                              <p className="text-xs font-bold font-display">Onboarding Auditor Chat Context</p>
                              <p className="text-[9px] text-stone-300">Evaluating: {sessionDetail.session.candidateRole}</p>
                            </div>
                          </div>
                          <span className="text-[9px] font-mono text-stone-400 bg-stone-800 px-2.5 py-0.5 rounded-full">ACTIVE SESSION</span>
                        </div>

                        {/* Conversational Stream */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-stone-50">
                          {sessionDetail.chats.map((chat) => {
                            const isUser = chat.role === 'user';
                            return (
                              <div 
                                key={chat.id} 
                                className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
                              >
                                <div className={`max-w-[85%] rounded-xl px-4 py-2.5 text-xs leading-relaxed font-sans shadow-3xs ${isUser ? 'bg-stone-900 text-stone-50 rounded-br-none' : 'bg-white border border-stone-200 text-stone-800 rounded-bl-none'}`}>
                                  {!isUser && (
                                    <div className="flex items-center gap-1 text-[9px] font-bold text-stone-400 uppercase tracking-wider mb-1 font-mono">
                                      <Cpu className="w-3 h-3 text-stone-500" />
                                      {chat.agentName || 'Auditor'}
                                    </div>
                                  )}
                                  <div className="whitespace-pre-wrap select-text">{chat.text}</div>
                                  <div className="text-[8px] text-stone-400 text-right mt-1.5 font-mono">
                                    {new Date(chat.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                          
                          {/* Simulated agent typing indicator */}
                          {isChatTyping && (
                            <div className="flex justify-start">
                              <div className="bg-white border border-stone-200 rounded-xl px-4 py-3 flex items-center gap-1.5 text-xs text-stone-400 font-medium rounded-bl-none shadow-3xs">
                                <Cpu className="w-4 h-4 animate-spin text-stone-400" />
                                <span>Agent thinking...</span>
                              </div>
                            </div>
                          )}

                          <div ref={chatEndRef} />
                        </div>

                        {/* Suggested Prompts Area */}
                        <div className="p-2 bg-white border-t border-stone-150 flex gap-2 overflow-x-auto scroller-none group">
                          {[
                            "Act as a software engineer.",
                            "What would confuse a new employee?",
                            "Find contradictions.",
                            "Rate onboarding quality."
                          ].map((prompt, pIdx) => (
                            <button
                              key={pIdx}
                              id={`suggested-prompt-${pIdx}`}
                              type="button"
                              onClick={() => handleQuickPromptClick(prompt)}
                              className="whitespace-nowrap px-2.5 py-1 text-[10px] bg-stone-50 hover:bg-stone-950 hover:text-stone-100 border border-stone-200 hover:border-stone-950 font-semibold text-stone-600 rounded transition cursor-pointer"
                            >
                              "{prompt}"
                            </button>
                          ))}
                        </div>

                        {/* Text input controller */}
                        <form onSubmit={handleSendChat} className="p-3 bg-white border-t border-stone-200 flex gap-2">
                          <input
                            type="text"
                            id="chat-input-text"
                            placeholder={`Ask the Auditor about setup road blocks or hybrid policies...`}
                            value={chatInput}
                            onChange={e => setChatInput(e.target.value)}
                            disabled={isChatTyping}
                            className="flex-1 text-xs px-3 py-2 border border-stone-200 rounded-lg focus:outline-stone-500 outline-none"
                          />
                          <button
                            type="submit"
                            id="btn-chat-send"
                            disabled={isChatTyping || !chatInput.trim()}
                            className="bg-stone-900 border border-stone-900 text-white hover:bg-stone-800 disabled:bg-stone-100 disabled:border-stone-100 disabled:text-stone-300 p-2.5 rounded-lg flex items-center justify-center cursor-pointer transition shadow-3xs"
                          >
                            <Send className="w-3.5 h-3.5" />
                          </button>
                        </form>

                      </div>

                    </div>
                  )}

                </div>

              </div>
            ) : (
              <div className="bg-white border border-stone-200 rounded-xl p-8 text-center shadow-3xs">
                <AlertTriangle className="w-12 h-12 text-stone-300 mx-auto mb-3" />
                <h3 className="font-bold font-display text-base text-stone-900">No Audited Simulation Selected</h3>
                <p className="text-xs text-stone-500 max-w-sm mx-auto mt-1 leading-relaxed">
                  Start by uploading corporate manual files on the left panel, and then run an Agent Recruit simulation to assess details. Alternatively, load a historical audit from the menu.
                </p>
              </div>
            )}
            </div>
          </motion.div>
        )}

      </main>

      {/* FOOTER METADATA DETAIL */}
      <footer className="border-t border-stone-200 bg-white mt-16 py-6 text-xs text-stone-400 font-mono text-center print:hidden">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <p>© 2026 Onboarding Audit Agent Platform. All rights reserved.</p>
          <p className="text-[10px]">DESIGN CONSTRAINTS: Swiss Modern • Highly Durable SQLite Cache • Multi-Agent Cohesion</p>
        </div>
      </footer>
      </div>

      {/* CHAT SIDEBAR - OVERLAY PANEL */}
      <AnimatePresence>
        {isSidebarChatOpen && (
          <motion.div
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 bottom-0 w-full sm:w-[420px] bg-[#0f172a] text-slate-100 flex flex-col shadow-[0_0_50px_rgba(0,0,0,0.5)] z-[100] border-l border-[#1e293b] print:hidden overflow-hidden"
          >
            {/* Header */}
            <div className="p-4 border-b border-[#1e293b] flex items-center justify-between bg-[#1e293b] shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-emerald-600 to-teal-600 flex items-center justify-center shadow-lg">
                  <Bot className="w-5 h-5 text-white animate-pulse" />
                </div>
                <div>
                  <h3 className="text-xs font-extrabold text-white tracking-widest uppercase flex items-center gap-1 font-display">
                    AI AUDITOR
                  </h3>
                  <p className="text-[10px] text-emerald-400 font-semibold font-mono uppercase tracking-tighter">Real-time Analysis</p>
                </div>
              </div>

              <button
                onClick={() => setIsSidebarChatOpen(false)}
                className="p-1 px-2 rounded bg-slate-800 text-slate-300 hover:text-white text-[10px] uppercase hover:bg-slate-700 font-bold cursor-pointer transition"
              >
                Close ✕
              </button>
            </div>

            {/* Main Chat Display */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-950/40">
              {(selectedSessionId ? sessionDetail?.chats : globalChats)?.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
                  <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center mb-2 shadow-lg border border-slate-700/50">
                    <Bot className="w-8 h-8 text-blue-400" />
                  </div>
                  <h3 className="text-lg font-bold text-white tracking-tight uppercase font-display">👋 Welcome to AI Auditor</h3>
                  <div className="max-w-[280px] space-y-3">
                    <div className="text-[11px] text-slate-400 font-medium leading-relaxed text-left space-y-2 bg-slate-900/60 p-4 rounded-xl border border-slate-800/50 shadow-inner">
                      <p className="border-b border-slate-800 pb-2 mb-2 font-bold text-slate-300">I can help you:</p>
                      <div className="flex items-start gap-2">
                        <CheckCircle className="w-3 h-3 text-emerald-500 mt-0.5" />
                        <span>Analyze onboarding documents</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <CheckCircle className="w-3 h-3 text-emerald-500 mt-0.5" />
                        <span>Explain audit reports</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <CheckCircle className="w-3 h-3 text-emerald-500 mt-0.5" />
                        <span>Detect contradictions</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <CheckCircle className="w-3 h-3 text-emerald-500 mt-0.5" />
                        <span>Review compliance issues</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <CheckCircle className="w-3 h-3 text-emerald-500 mt-0.5" />
                        <span>Suggest HR improvements</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <CheckCircle className="w-3 h-3 text-emerald-500 mt-0.5" />
                        <span>Summarize uploaded files</span>
                      </div>
                    </div>
                    <p className="text-xs font-bold text-blue-400 mt-4 animate-pulse">Ask me anything to get started.</p>
                  </div>
                </div>
              ) : (
                (selectedSessionId ? sessionDetail?.chats : globalChats)?.map((chat) => {
                  const isUser = chat.role === 'user';
                  return (
                    <div key={chat.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[90%] rounded-xl px-3 py-2.5 text-xs leading-relaxed font-sans shadow-md ${isUser ? 'bg-blue-600 text-white rounded-br-none' : 'bg-[#1e293b] border border-[#2d3a4f] text-slate-100 rounded-bl-none font-medium'}`}>
                        {!isUser && (
                          <div className="flex items-center gap-1.5 text-[8px] font-bold text-blue-400 uppercase tracking-wider mb-1 font-mono">
                            <Cpu className="w-3 h-3 text-blue-400" />
                            {chat.agentName || 'AI Auditor'}
                          </div>
                        )}
                        <div className="whitespace-pre-wrap select-text text-[11px] font-sans">{chat.text}</div>
                        <div className="text-[7px] text-slate-400 text-right mt-1.5 font-mono">
                          {new Date(chat.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              
              {isChatTyping && (
                <div className="flex justify-start">
                  <div className="bg-[#1e293b] border border-[#2d3a4f] rounded-xl px-3 py-2.5 flex items-center gap-2 text-xs text-slate-400 font-medium rounded-bl-none shadow-md">
                    <Cpu className="w-3.5 h-3.5 animate-spin text-blue-500" />
                    <span className="text-blue-400 font-bold font-sans text-[10px] uppercase">Analyzing Policy...</span>
                  </div>
                </div>
              )}
              
              <div ref={sidebarChatEndRef} />
            </div>

            {/* Chat Input form */}
            <form onSubmit={handleSendSidebarChat} className="p-3 bg-slate-900 border-t border-[#1e293b] flex gap-2 shrink-0">
              <input
                type="text"
                placeholder="Ask the AI Auditor..."
                value={sidebarChatInput}
                onChange={(e) => setSidebarChatInput(e.target.value)}
                disabled={isChatTyping}
                className="flex-1 text-xs px-3 py-2.5 bg-slate-950/60 border border-[#2d3a4f] rounded-xl text-slate-100 placeholder-slate-400 focus:outline-none focus:border-blue-500 font-sans"
              />
              <button
                type="submit"
                disabled={isChatTyping || !sidebarChatInput.trim()}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:from-slate-800 disabled:to-slate-800 text-white px-3 py-2.5 rounded-xl flex items-center justify-center cursor-pointer transition shadow-lg shrink-0"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* SECURITY SIGNUP & REQUIREMENTS MODAL */}
      <AnimatePresence>
        {isAuthModalOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAuthModalOpen(false)}
              className="fixed inset-0 bg-slate-950/80 z-[1001] backdrop-blur-xs flex items-center justify-center p-4 print:hidden"
            >
              {/* Modal Card wrapper - stopPropagation to prevent click-through */}
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                transition={{ type: 'spring', duration: 0.3 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-lg bg-slate-900 border border-slate-800 text-slate-100 rounded-2xl flex flex-col overflow-hidden shadow-2xl relative"
              >
                {/* Header banner */}
                <div className="bg-slate-800 p-5 border-b border-slate-700 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-900/30">
                      <Cpu className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold font-display text-xs uppercase tracking-wider text-white">
                        Auditor Signup & Verification
                      </h3>
                      <p className="text-[9px] text-blue-400 font-mono font-bold tracking-wide">SECURE ID CREDENTIAL VERIFICATION SYSTEM</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsAuthModalOpen(false)}
                    className="text-slate-400 hover:text-white bg-slate-750 hover:bg-slate-700 p-1 px-2.5 rounded-lg text-[10px] font-mono leading-none transition"
                  >
                    Close ✕
                  </button>
                </div>

                <div className="p-6 space-y-4 overflow-y-auto max-h-[80vh]">
                  
                  {/* Overview Text */}
                  <div className="text-xs text-slate-300 leading-relaxed bg-slate-950/40 p-4 border border-slate-800 rounded-xl space-y-1.5">
                    <span className="font-bold text-blue-400 flex items-center gap-1.5 text-[11px] uppercase tracking-wide">
                      <Sparkles className="w-3.5 h-3.5" />
                      SIGN SECURITY REQUIREMENTS CHECK
                    </span>
                    <p className="text-[10px] text-slate-400 leading-normal">
                      This audit system requires security clearance credentials. All registered audits will be digitally assigned to your active verified user profile. Complete the credential guidelines below.
                    </p>
                  </div>

                  {/* Form fields */}
                  <form onSubmit={(e) => {
                    e.preventDefault();
                    
                    // Validate
                    const isNameOk = regName.trim().length >= 3;
                    const isEmailOk = regEmail.includes('@') && regEmail.split('@')[1]?.includes('.');
                    const isPassOk = regPassword.length >= 6;
                    const isAgreeOk = regAgree;

                    if (isNameOk && isEmailOk && isPassOk && isAgreeOk) {
                      const profileObj = {
                        name: regName.trim(),
                        email: regEmail.trim(),
                        role: regRole,
                        department: regDept,
                        registeredOn: new Date().toISOString()
                      };
                      localStorage.setItem('onboarding_audit_authenticated_user', JSON.stringify(profileObj));
                      setLoggedInUser(profileObj);
                      setIsAuthModalOpen(false);
                      setSuccessMessage(`Digital verification granted! Welcome back ${profileObj.name}`);
                      setTimeout(() => setSuccessMessage(null), 3000);
                    }
                  }} className="space-y-3.5">
                    
                    {/* Name */}
                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold font-mono uppercase tracking-wider text-slate-400">
                        1. Audit Officer Name *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Lahari Nanduri"
                        value={regName}
                        onChange={(e) => setRegName(e.target.value)}
                        className="w-full text-xs bg-slate-950 border border-slate-700 focus:border-blue-500 hover:border-slate-600 rounded-xl p-3 text-white outline-none transition"
                      />
                    </div>

                    {/* Email */}
                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold font-mono uppercase tracking-wider text-slate-400">
                        2. Verified Corporate Email Address *
                      </label>
                      <input
                        type="email"
                        required
                        placeholder="e.g. lahari.nanduri24@sasi.ac.in"
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        className="w-full text-xs bg-slate-950 border border-slate-700 focus:border-blue-500 hover:border-slate-600 rounded-xl p-3 text-white outline-none transition"
                      />
                    </div>

                    {/* Password */}
                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold font-mono uppercase tracking-wider text-slate-400">
                        3. Secured Login Hashing Password *
                      </label>
                      <input
                        type="password"
                        required
                        placeholder="Must be at least 6 characters"
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        className="w-full text-xs bg-slate-950 border border-slate-700 focus:border-blue-500 hover:border-slate-600 rounded-xl p-3 text-white outline-none transition font-mono"
                      />
                    </div>

                    {/* Dual Selector: Role and Dept */}
                    <div className="grid grid-cols-2 gap-3 pb-1">
                      <div className="space-y-1">
                        <label className="block text-[10px] font-bold font-mono uppercase tracking-wider text-slate-400">
                          4. Audit Core Role
                        </label>
                        <select
                          value={regRole}
                          onChange={(e) => setRegRole(e.target.value)}
                          className="w-full text-xs bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white outline-none cursor-pointer"
                        >
                          <option value="Senior Onboarding Lead">Onboarding Lead</option>
                          <option value="HR Operations Admin">HR Admin</option>
                          <option value="Corporate Talent Lead">Corporate Talent</option>
                          <option value="Technical Auditor">Technical Auditor</option>
                        </select>
                      </div>
                      
                      <div className="space-y-1">
                        <label className="block text-[10px] font-bold font-mono uppercase tracking-wider text-slate-400">
                          5. Division Office
                        </label>
                        <select
                          value={regDept}
                          onChange={(e) => setRegDept(e.target.value)}
                          className="w-full text-xs bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white outline-none cursor-pointer"
                        >
                          <option value="Engineering HQ">Engineering HQ</option>
                          <option value="Operations & Legal">Operations & Legal</option>
                          <option value="Talent & Staffing">Talent & Staffing</option>
                          <option value="Executive Suite">Executive Suite</option>
                        </select>
                      </div>
                    </div>

                    {/* Agreement checkbox */}
                    <div className="flex items-start gap-2.5">
                      <input
                        id="reg-agree-check"
                        type="checkbox"
                        checked={regAgree}
                        onChange={(e) => setRegAgree(e.target.checked)}
                        className="mt-0.5 w-4 h-4 text-blue-600 bg-slate-950 border-slate-700 rounded focus:ring-blue-500 cursor-pointer"
                      />
                      <label htmlFor="reg-agree-check" className="text-[10px] text-slate-400 leading-relaxed cursor-pointer select-none">
                        I confirm this profile will serve as my official signature for the Agent Recruit contradiction suite and that I accept local compliance storage terms.
                      </label>
                    </div>

                    {/* Interactive Real-Time Requirements Validation Block */}
                    <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 space-y-2">
                      <p className="text-[9px] font-bold font-mono text-slate-450 uppercase tracking-widest border-b border-slate-850 pb-1.5 flex items-center justify-between">
                        <span>REQUIREMENT DIRECTIVES ENGINE</span>
                        <span className="text-[8px] bg-indigo-900/40 text-indigo-400 px-1 py-0.2 rounded font-mono font-bold">Active Status Check</span>
                      </p>
                      
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-[10px] font-mono">
                        {/* Requirement 1: Name */}
                        <div className="flex items-center gap-2">
                          {regName.trim().length >= 3 ? (
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                          ) : (
                            <div className="w-3.5 h-3.5 rounded-full border border-slate-850 bg-slate-900/60 flex items-center justify-center text-[8px] text-slate-500 shrink-0 font-mono">1</div>
                          )}
                          <span className={regName.trim().length >= 3 ? "text-slate-300 font-medium" : "text-slate-500"}>
                            Name (≥3 char)
                          </span>
                        </div>

                        {/* Requirement 2: Email */}
                        <div className="flex items-center gap-2">
                          {(regEmail.includes('@') && regEmail.split('@')[1]?.includes('.')) ? (
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                          ) : (
                            <div className="w-3.5 h-3.5 rounded-full border border-slate-850 bg-slate-900/60 flex items-center justify-center text-[8px] text-slate-500 shrink-0 font-mono">2</div>
                          )}
                          <span className={(regEmail.includes('@') && regEmail.split('@')[1]?.includes('.')) ? "text-slate-300 font-medium" : "text-slate-500"}>
                            Valid Company Email
                          </span>
                        </div>

                        {/* Requirement 3: Password */}
                        <div className="flex items-center gap-2">
                          {regPassword.length >= 6 ? (
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                          ) : (
                            <div className="w-3.5 h-3.5 rounded-full border border-slate-850 bg-slate-900/60 flex items-center justify-center text-[8px] text-slate-500 shrink-0 font-mono">3</div>
                          )}
                          <span className={regPassword.length >= 6 ? "text-slate-300 font-medium" : "text-slate-500"}>
                            Passcode (≥6 char)
                          </span>
                        </div>

                        {/* Requirement 4: Agreement */}
                        <div className="flex items-center gap-2">
                          {regAgree ? (
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                          ) : (
                            <div className="w-3.5 h-3.5 rounded-full border border-slate-850 bg-slate-900/60 flex items-center justify-center text-[8px] text-slate-500 shrink-0 font-mono">4</div>
                          )}
                          <span className={regAgree ? "text-slate-300 font-medium" : "text-slate-500"}>
                            Terms Signed
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Submit Button */}
                    <button
                      type="submit"
                      disabled={!(regName.trim().length >= 3 && regEmail.includes('@') && regEmail.split('@')[1]?.includes('.') && regPassword.length >= 6 && regAgree)}
                      className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-extrabold text-[10.5px] uppercase tracking-widest rounded-xl transition-all cursor-pointer active:scale-[0.99] flex items-center justify-center gap-2 mt-4 shadow-md shadow-blue-900/30"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Verify & Create Auditor Account</span>
                    </button>

                  </form>
                </div>
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
