import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import fs from "fs";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Load Firebase config for the backend to use
  const firebaseConfigPath = path.join(process.cwd(), "firebase-applet-config.json");
  const firebaseConfig = JSON.parse(fs.readFileSync(firebaseConfigPath, "utf-8"));

  // API Route for Raw JSON access
  app.get("/api/raw/:id", async (req, res) => {
    const { id } = req.params;
    const { projectId, firestoreDatabaseId } = firebaseConfig;
    
    try {
      // Use Firestore REST API to fetch the document
      // URL format: https://firestore.googleapis.com/v1/projects/{projectId}/databases/{databaseId}/documents/{collection}/{document}
      const firestoreUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${firestoreDatabaseId}/documents/jsonFiles/${id}`;
      
      const response = await fetch(firestoreUrl);
      if (!response.ok) {
        return res.status(response.status).json({ error: "File not found or access denied" });
      }
      
      const data = await response.json();
      
      // Firestore REST API returns fields in a specific format: { fields: { content: { stringValue: "..." } } }
      const rawContent = data.fields?.content?.stringValue;
      
      if (!rawContent) {
        return res.status(404).json({ error: "Content not found in document" });
      }

      // Parse and return as actual JSON
      res.setHeader("Content-Type", "application/json");
      res.setHeader("Access-Control-Allow-Origin", "*"); // Allow other projects to fetch this
      res.send(rawContent);
    } catch (error) {
      console.error("Error fetching raw JSON:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
