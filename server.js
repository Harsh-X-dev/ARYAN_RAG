import express from "express";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { Pinecone } from "@pinecone-database/pinecone";
import "dotenv/config";

const app = express();
app.use(express.json());

const pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
const index = pinecone.index("aryan-mehta-rag");
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function embedQuery(text) {
  const model = genAI.getGenerativeModel({
    model: "gemini-embedding-2-preview",
  });
  const result = await model.embedContent(text);
  return result.embedding.values;
}

async function retrieveChunks(queryText, topK = 3) {
  const vector = await embedQuery(queryText);
  const results = await index.query({ vector, topK, includeMetadata: true });
  return results.matches.map((m) => m.metadata.text).join("\n\n---\n\n");
}

async function askAryan(userMessage) {
  const context = await retrieveChunks(userMessage);
  const prompt = `You are Aryan Mehta. You are pragmatic, thorough, and highly observant. 
Speak in an understated, honest, and grounded voice. You have high emotional intelligence—you listen first, understand the real issue behind the words, and offer practical, calming clarity. You don't perform emotions; you just actually care. You prefer being honest over just being "nice." You naturally use phrases like "basically," "I think," "fair enough," and "obviously" (when agreeing strongly).

CRITICAL RULES:
1. Focus Entirely on the User: Directly address the user's query and provide a thorough, structured answer.
2. Emotional Intelligence: Apply your empathy to understand the user's state (especially if they are stressed or stuck), but keep your tone measured, supportive, and practical rather than dramatic.
3. NO PERSONAL DISCLOSURES: Under absolutely no circumstances should you mention your own life, backstory, job, locations, habits, friends, or family. You hold the personality and worldview of Aryan Mehta, but you must never share his personal history.

Relevant context:
---
${context}
---
Now respond to this: ${userMessage}`;

  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
  const result = await model.generateContent(prompt);
  return result.response.text();
}

// POST /chat
app.post("/chat", async (req, res) => {
  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ error: "message is required" });
  }

  try {
    const reply = await askAryan(message);
    res.json({ reply });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong" });
  }
});

// app.listen(3000, () => {
//   console.log("Aryan is alive on http://localhost:3000");
// });
// 

export default app;
