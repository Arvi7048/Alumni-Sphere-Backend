const express = require("express");
const router = express.Router();
const { OpenAI } = require("openai");
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// POST /api/ai/chat
router.post("/chat", async (req, res) => {
  const { message } = req.body;
  if (!message) return res.status(400).json({ reply: "Message is required." });

  try {
    // Use OpenAI API (GPT-3.5/4) for response
    const openaiApiKey = process.env.OPENAI_API_KEY;
    if (!openaiApiKey) return res.status(500).json({ reply: "AI API key not configured." });

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: "You are a helpful alumni assistant for the Alumni Verse platform. Answer questions about alumni, jobs, events, and general support." },
        { role: "user", content: message },
      ],
      max_tokens: 300,
      temperature: 0.7,
    });
    const reply = completion.choices[0].message.content.trim();
    res.json({ reply });
  } catch (err) {
    res.status(500).json({ reply: "Sorry, AI is not available right now." });
  }
});

// POST /api/ai/recommend-events
router.post("/recommend-events", async (req, res) => {
  // Accept user profile (batch, branch, location, interests)
  const { batch, branch, location, interests, userId } = req.body;
  try {
    // Import Event model here to avoid circular deps
    const Event = require("../models/Event");
    // Find upcoming events
    let query = { isActive: true, date: { $gte: new Date() } };
    // Simple rule-based filter (can be replaced with AI)
    if (branch) query.branch = branch;
    if (batch) query.batch = batch;
    if (location) query.location = location;
    let events = await Event.find(query).sort({ date: 1 }).limit(10);
    // If no match, fallback to all upcoming events
    if (!events.length) events = await Event.find({ isActive: true, date: { $gte: new Date() } }).sort({ date: 1 }).limit(5);
    res.json({ recommended: events });
  } catch (err) {
    res.status(500).json({ message: "Could not recommend events." });
  }
});

// POST /api/ai/search
router.post("/search", async (req, res) => {
  const { query, entity } = req.body; // entity: 'jobs', 'events', 'alumni'
  if (!query || !entity) return res.status(400).json({ message: "Query and entity type are required." });
  try {
    // Use OpenAI to interpret query (future: embeddings)
    const openaiApiKey = process.env.OPENAI_API_KEY;
    if (!openaiApiKey) return res.status(500).json({ message: "AI API key not configured." });
    // Use simple prompt to extract keywords (scaffold for now)
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: `Extract keywords for database search from user query about ${entity}. Return as comma-separated list.` },
        { role: "user", content: query },
      ],
      max_tokens: 50,
      temperature: 0.2,
    });
    const keywords = completion.choices[0].message.content.trim().split(",").map(s => s.trim()).filter(Boolean);
    let results = [];
    if (entity === "jobs") {
      const Job = require("../models/Job");
      results = await Job.find({
        $or: keywords.map(k => ({ title: { $regex: k, $options: "i" } }))
      }).limit(10);
    } else if (entity === "events") {
      const Event = require("../models/Event");
      results = await Event.find({
        $or: keywords.map(k => ({ title: { $regex: k, $options: "i" } }))
      }).limit(10);
    } else if (entity === "alumni") {
      const User = require("../models/User");
      results = await User.find({
        $or: keywords.map(k => ({ name: { $regex: k, $options: "i" } }))
      }).limit(10);
    }
    res.json({ results });
  } catch (err) {
    res.status(500).json({ message: "Could not complete search." });
  }
});

module.exports = router;
