const { OpenAI } = require("openai");
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function moderateContent(text) {
  if (!process.env.OPENAI_API_KEY) throw new Error("OpenAI API key not configured");
  try {
    const response = await openai.moderations.create({ input: text });
    const result = response.results[0];
    return {
      flagged: result.flagged,
      categories: result.categories,
      category_scores: result.category_scores,
    };
  } catch (err) {
    throw new Error("Moderation API error");
  }
}

module.exports = { moderateContent };
