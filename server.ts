import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json({ limit: '10mb' }));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

app.post('/api/memo', async (req, res) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({
        error: 'GEMINI_API_KEY environment variable is not configured.',
      });
    }

    const { stats, inputs } = req.body;
    if (!stats) {
      return res.status(400).json({ error: 'Missing stats payload.' });
    }

    const ai = new GoogleGenAI({ apiKey });

    const systemInstruction = `You are an expert Washington, DC residential property management advisor preparing an executive advisory memo for a client homeowner.
You advise homeowners on whether to list their DC property on Airbnb and what to charge.

HARD RULES:
1. Write a professional, plain-English memo to the homeowner of approximately 150 words.
2. Use ONLY the exact numbers provided in the JSON data payload.
3. NEVER add, fabricate, or cite any numbers, percentages, dollar amounts, benchmarks, occupancy averages, city regulations, or outside facts from general knowledge.
4. EVERY SINGLE NUMBER that appears in your text MUST be immediately followed by its exact JSON property key in brackets, for example: "$195 [recommended_price]", "215 [median_occupancy] nights", or "68.2% [superhost_pct]".
5. Structure your memo clearly: Executive Recommendation, Strategy & Revenue Outlook, and Owner Economics / Break-even context (if inputs provided).`;

    const promptText = `Here is the verified data and inputs for this property in Washington, DC:

INPUTS:
${JSON.stringify(inputs, null, 2)}

COMPUTED DATA METRICS:
${JSON.stringify(stats, null, 2)}

Please draft the 150-word owner advisory memo adhering strictly to the bracketed key rules.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: promptText,
      config: {
        systemInstruction,
        temperature: 0.2,
      },
    });

    const text = response.text || '';
    res.json({ memo: text });
  } catch (error: any) {
    console.error('Gemini memo generation error:', error);
    res.status(500).json({
      error: error?.message || 'Failed to generate advisory memo.',
    });
  }
});

async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(process.cwd(), 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(process.cwd(), 'dist', 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(Number(port), '0.0.0.0', () => {
    console.log(`DC Listing Advisor server listening on port ${port}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
