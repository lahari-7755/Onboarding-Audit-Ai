import express from "express";
import path from "path";
import fs from "fs";
import * as pdfParseModule from "pdf-parse";
import { createServer as createViteServer } from "vite";

import { ServerDatabase } from "./src/server-db.js";
import { runOnboardingAudit, runAgentChat } from "./src/server-agents.js";
import { AppDocument, CandidateRole } from "./src/types.js";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware for large payload sizes (handling base64 documents)
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  // API ROUTES GO HERE FIRST
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", time: new Date().toISOString() });
  });

  // 1. Get all documents
  app.get("/api/documents", (req, res) => {
    try {
      const documents = ServerDatabase.getDocuments();
      res.json(documents);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 2. Upload / Add document
  app.post("/api/documents", async (req, res) => {
    try {
      const { name, type, content, size, base64Content } = req.body;
      if (!name || !type) {
        return res.status(400).json({ error: "Document name and type are required." });
      }

      let parsedContent = content || "";

      // If a PDF is uploaded as base64, parse it using pdf-parse!
      if (type === 'pdf' && base64Content) {
        try {
          console.log(`Parsing PDF document "${name}" using pdf-parse...`);
          const base64Data = base64Content.replace(/^data:application\/pdf;base64,/, "");
          const buffer = Buffer.from(base64Data, 'base64');
          
          let parseFunc: any = pdfParseModule;
          // Handle case where pdf-parse might be imported as a module object with a default property
          if (typeof parseFunc !== 'function' && (pdfParseModule as any).default) {
            parseFunc = (pdfParseModule as any).default;
          }
          
          if (typeof parseFunc !== 'function') {
            console.error("pdf-parse initialization failed. Type of pdfParseModule:", typeof pdfParseModule);
            throw new Error("PDF parser library failed to initialize correctly.");
          }
          
          const pdfData = await parseFunc(buffer);
          parsedContent = pdfData.text || "";
        } catch (pdfErr) {
          console.error("Failed to parse PDF text:", pdfErr);
          return res.status(422).json({ error: "Failed to extract text from the PDF file. Make sure it is not corrupt or encrypted." });
        }
      }

      // Check for DOCX extraction using mammoth
      if ((type === 'docx' || type === 'doc' || name.toLowerCase().endsWith('.docx')) && base64Content && !parsedContent) {
        try {
          console.log(`Parsing DOCX document "${name}" using mammoth...`);
          const base64Data = base64Content.replace(/^data:.*base64,/, "");
          const buffer = Buffer.from(base64Data, 'base64');
          
          const mammoth = await import('mammoth');
          const result = await mammoth.extractRawText({ buffer });
          parsedContent = result.value || "";
          
          if (result.messages.length > 0) {
            console.log("Mammoth messages:", result.messages);
          }
        } catch (docxErr) {
          console.error("Failed to parse DOCX with mammoth:", docxErr);
          // Fallback extraction
          const base64Data = base64Content.replace(/^data:.*base64,/, "");
          const buffer = Buffer.from(base64Data, 'base64');
          const rawZipText = buffer.toString('binary');
          const matches = rawZipText.match(/[a-zA-Z0-9\s\.\,\!\?\-]{10,200}/g);
          parsedContent = matches ? matches.join(" ") : "Word Docx extracted text file.";
        }
      }

      if (!parsedContent.trim()) {
        return res.status(400).json({ error: "No text could be extracted from this document." });
      }

      const newDoc: AppDocument = {
        id: 'doc-' + Date.now() + '-' + Math.random().toString(36).substring(2, 9),
        name,
        type,
        content: parsedContent,
        size: size || parsedContent.length,
        uploadDate: new Date().toISOString(),
        status: 'indexed',
        chunkCount: Math.max(1, Math.ceil(parsedContent.length / 800))
      };

      ServerDatabase.addDocument(newDoc);
      
      // Auto-trigger a baseline audit if this is the first document or to refresh global state
      const sessionId = 'global-audit-init';
      const existingGlobal = ServerDatabase.getSession(sessionId);
      
      if (!existingGlobal) {
        const baselineSession: any = {
          id: sessionId,
          name: "Baseline Corporate Audit",
          date: new Date().toISOString(),
          candidateRole: "Software Engineer",
          score: 0,
          status: 'running',
          progress: 10,
          findingsCount: 0,
          contradictionCount: 0,
          missingInfoCount: 0
        };
        ServerDatabase.addSession(baselineSession);
      } else {
        ServerDatabase.updateSession(sessionId, { status: 'running', progress: 10 });
      }

      runOnboardingAudit(sessionId, "Software Engineer")
        .then(() => console.log("Baseline audit refreshed after document upload."))
        .catch(err => console.error("Baseline audit failed:", err));

      res.json(newDoc);
    } catch (err: any) {
      console.error("Upload handler error:", err);
      res.status(500).json({ error: err.message });
    }
  });

  // 3. Delete document
  app.delete("/api/documents/:id", (req, res) => {
    try {
      ServerDatabase.deleteDocument(req.params.id);
      res.json({ success: true, message: "Document deleted." });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 4. Get active sessions list
  app.get("/api/sessions", (req, res) => {
    try {
      const sessions = ServerDatabase.getSessions();
      res.json(sessions);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 5. Get detailed session report
  app.get("/api/sessions/:id", (req, res) => {
    try {
      const { id } = req.params;
      const session = ServerDatabase.getSession(id);
      if (!session) {
        return res.status(404).json({ error: "Audit session not found" });
      }

      const findings = ServerDatabase.getSessionFindings(id);
      const recommendations = ServerDatabase.getSessionRecommendations(id);
      const chats = ServerDatabase.getSessionChats(id);

      res.json({
        session,
        findings,
        recommendations,
        chats
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 6. Create custom session & trigger agent workflow simulation
  app.post("/api/sessions", async (req, res) => {
    try {
      const { name, candidateRole } = req.body;
      if (!candidateRole) {
        return res.status(400).json({ error: "Please specify a candidate role (e.g. Software Engineer)." });
      }

      const activeDocs = ServerDatabase.getDocuments();
      if (activeDocs.length === 0) {
        return res.status(400).json({ error: "Please upload at least one company policy or setup folder document first." });
      }

      const sessionId = 'sess-' + Date.now() + '-' + Math.random().toString(36).substring(2, 9);
      const newSession: any = {
        id: sessionId,
        name: name || `Simulation: ${candidateRole} (${new Date().toLocaleDateString()})`,
        date: new Date().toISOString(),
        candidateRole: candidateRole as CandidateRole,
        score: 0,
        status: 'running',
        progress: 10,
        findingsCount: 0,
        contradictionCount: 0,
        missingInfoCount: 0
      };

      ServerDatabase.addSession(newSession);

      // We start the Multi-Agent audit simulation in background or directly!
      // Since Gemini completes in a few seconds, we can run it asynchronously
      // or synchronously within the request, or kick it off in the background.
      // Kicking it off in a promise keeps response instant and previews progressive status!
      runOnboardingAudit(sessionId, candidateRole as CandidateRole)
        .then(() => {
          console.log(`Audit finished successfully for session ${sessionId}`);
        })
        .catch(err => {
          console.error(`Error performing background audit for session ${sessionId}:`, err);
          ServerDatabase.updateSession(sessionId, { status: 'failed', progress: 100 });
        });

      res.json(newSession);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 7. Interactive chatbot message
  app.post("/api/sessions/:id/chat", async (req, res) => {
    try {
      const { id } = req.params;
      const { message } = req.body;

      if (!message || message.trim() === '') {
        return res.status(400).json({ error: "Message cannot be empty." });
      }

      const resultMessage = await runAgentChat(id, message);
      res.json(resultMessage);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 8. Delete audit session
  app.delete("/api/sessions/:id", (req, res) => {
    try {
      ServerDatabase.deleteSession(req.params.id);
      res.json({ success: true, message: "Session deleted." });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 9. Resolve a single finding
  app.post("/api/findings/:id/resolve", (req, res) => {
    try {
      const { id } = req.params;
      ServerDatabase.updateFinding(id, { status: "resolved" });
      res.json({ success: true, message: "Finding set as resolved." });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 10. Resolve all findings for a session
  app.post("/api/sessions/:id/resolve-all-findings", (req, res) => {
    try {
      const { id } = req.params;
      ServerDatabase.resolveAllFindings(id);
      res.json({ success: true, message: "All findings resolved for this session." });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Vite integration middleware
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    
    // API 404 handler
    app.use('/api/*', (req, res) => {
      res.status(404).json({ error: "Endpoint not found" });
    });

    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Global Error Handler
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error("Global Error Handler:", err);
    // If it's an API request, return JSON
    if (req.originalUrl.startsWith('/api/')) {
      return res.status(err.status || 500).json({ 
        error: "Internal Server Error", 
        message: err.message || "An unexpected error occurred." 
      });
    }
    // Fallback for non-API requests
    next(err);
  });

  // PORT value is hardcoded as 3000 by infrastructure constraints.
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
