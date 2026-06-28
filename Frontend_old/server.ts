import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini SDK with telemetry header
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

// Mock/Default response based on screenshots
const defaultRescuePlan = {
  welcomeMessage: "Good morning, Alex",
  urgentRescuePointsCount: 3,
  focusTask: {
    title: "Finalize Q4 Strategy Presentation",
    description: "Priority task to align executive team on growth projections. Requires 90 minutes of focused execution.",
    deadline: "2:00 PM",
    timeEst: "1.5 hrs",
    difficulty: "Varying",
    overallProgress: 70
  },
  insights: [
    "You are most productive between 9:00 AM and 11:30 AM. Tackle your 'Strategy' task now to avoid the 3 PM fatigue dip.",
    "Based on your recent commits, the indexing logic for PDF assets might need an asynchronous worker to prevent timeout during bulk uploads.",
    "You previously spent 45 minutes on 'Schema Definition.' Efficiency for this step is expected to increase by 15%."
  ],
  upcomingRisks: [
    {
      title: "Client Feedback Loop",
      details: "Due tomorrow, no progress yet.",
      type: "error"
    },
    {
      title: "Budget Review",
      details: "Starts in 3 hours.",
      type: "warning"
    }
  ],
  milestones: [
    {
      title: "Requirement Gathering",
      description: "Gather initial specifications and stakeholder constraints.",
      durationTracked: "1.2h tracked",
      status: "COMPLETED",
      difficulty: "Low"
    },
    {
      title: "Database Schema Design",
      description: "Draft entity relationship diagram and index keys.",
      durationTracked: "0.8h tracked",
      status: "COMPLETED",
      difficulty: "Medium"
    },
    {
      title: "Implement Vector Search Architecture",
      description: "Integrate Pinecone DB with the FastAPI backend. Ensure embeddings are normalized before upserting.",
      durationTracked: "Focusing on index logic",
      status: "WORKING NOW",
      difficulty: "High"
    },
    {
      title: "Frontend Integration",
      description: "Connect React context to backend search API endpoints.",
      durationTracked: "React Context setup",
      status: "UPCOMING",
      difficulty: "Medium"
    },
    {
      title: "QA & Prompt Testing",
      description: "Run adversarial prompt tests to verify agent guardrails.",
      durationTracked: "Not started",
      status: "UPCOMING",
      difficulty: "High"
    }
  ],
  activeTasks: [
    {
      title: "Website Performance Audit",
      deadline: "Oct 24",
      assignee: "Dev Team",
      progress: 85,
      status: "ON TRACK"
    },
    {
      title: "Contract Renewal Documentation",
      deadline: "Oct 22 (Late)",
      assignee: "You",
      progress: 15,
      status: "AT RISK"
    },
    {
      title: "Onboarding System Redesign",
      deadline: "Oct 28",
      assignee: "Design",
      progress: 40,
      status: "ACTIVE"
    }
  ],
  confidenceScore: "98.4%",
  processingPriority: "Ultra-High"
};

// API Endpoint to generate rescue plan
app.post("/api/analyze", async (req, res) => {
  try {
    const { text, filename } = req.body;
    
    if (!text || text.trim() === "") {
      return res.json({ success: true, plan: defaultRescuePlan });
    }

    // Check if API key is present
    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === "MY_GEMINI_API_KEY" || process.env.GEMINI_API_KEY === "") {
      console.warn("GEMINI_API_KEY is not configured or placeholder. Falling back to realistic smart simulation.");
      // Tailor the default data somewhat based on input keyword
      const customizedPlan = JSON.parse(JSON.stringify(defaultRescuePlan));
      if (filename) {
        customizedPlan.focusTask.title = `Review ${filename}`;
        customizedPlan.focusTask.description = `Analyze contents and key deliverables from ${filename}.`;
      } else if (text) {
        const firstLine = text.split("\n")[0].substring(0, 40);
        customizedPlan.focusTask.title = firstLine || "Analyze Assignment";
        customizedPlan.focusTask.description = text.substring(0, 150) + "...";
      }
      return res.json({ success: true, plan: customizedPlan });
    }

    const prompt = `You are the executive-grade AI engine of Deadline Rescue.
Analyze the following assignment brief / requirements text ${filename ? `(from file: ${filename})` : ''} and formulate a highly structured execution rescue plan:
---
${text}
---

Your response must be in JSON format matching the schema requested. Return:
1. A welcomeMessage (e.g., "Good morning, Alex" or based on any name found).
2. focusTask containing title, description, deadline, timeEst, difficulty, overallProgress.
3. A list of 3-4 insightful insights tailored specifically to the input text, helping them avoid bottleneck risks or fatigue.
4. A list of 2 upcoming risks based on the task description.
5. A list of 4 to 6 milestones (steps) sequencing the work required to complete this task. State completion status (e.g. COMPLETED for early steps, WORKING NOW for the active bottleneck step, UPCOMING for remaining).
6. A list of 3 active pipeline tasks related to this or general tasks for context.
7. confidenceScore (a percentage like "97.5%")
8. processingPriority ("High", "Ultra-High", "Medium", "Low")`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            welcomeMessage: { type: Type.STRING },
            urgentRescuePointsCount: { type: Type.INTEGER },
            focusTask: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                description: { type: Type.STRING },
                deadline: { type: Type.STRING },
                timeEst: { type: Type.STRING },
                difficulty: { type: Type.STRING },
                overallProgress: { type: Type.INTEGER }
              },
              required: ["title", "description", "deadline", "timeEst", "difficulty", "overallProgress"]
            },
            insights: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            upcomingRisks: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  details: { type: Type.STRING },
                  type: { type: Type.STRING, description: "error or warning" }
                },
                required: ["title", "details", "type"]
              }
            },
            milestones: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  description: { type: Type.STRING },
                  durationTracked: { type: Type.STRING },
                  status: { type: Type.STRING, description: "COMPLETED, WORKING NOW, or UPCOMING" },
                  difficulty: { type: Type.STRING }
                },
                required: ["title", "description", "durationTracked", "status", "difficulty"]
              }
            },
            activeTasks: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  deadline: { type: Type.STRING },
                  assignee: { type: Type.STRING },
                  progress: { type: Type.INTEGER },
                  status: { type: Type.STRING, description: "ON TRACK, AT RISK, or ACTIVE" }
                },
                required: ["title", "deadline", "assignee", "progress", "status"]
              }
            },
            confidenceScore: { type: Type.STRING },
            processingPriority: { type: Type.STRING }
          },
          required: ["welcomeMessage", "urgentRescuePointsCount", "focusTask", "insights", "upcomingRisks", "milestones", "activeTasks", "confidenceScore", "processingPriority"]
        }
      }
    });

    if (response.text) {
      const plan = JSON.parse(response.text.trim());
      res.json({ success: true, plan });
    } else {
      throw new Error("No text returned from Gemini");
    }
  } catch (err: any) {
    console.error("Gemini API Error:", err);
    res.status(500).json({ success: false, error: err.message, fallback: defaultRescuePlan });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
