// aiSummarizer.js - utility to summarize text using Groq API
// Uses built-in fetch (Node 18+). Ensure environment variable GROQ_API_KEY is set.


/**
 * Summarizes given text using Groq LLM.
 * @param {string} text - Text to be summarized.
 * @param {object} [options] - Optional parameters like model.
 * @returns {Promise<string>} Summary string.
 */
async function summarizeWithGroq(text, options = {}) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error('GROQ_API_KEY not set in environment');
  }

  if (!text || !text.trim()) {
    throw new Error('No note content available to summarize');
  }

  const model = options.model || process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs || 25000);

  const body = {
    model,
    messages: [
      { role: 'system', content: 'You are an AI assistant that provides concise summaries of academic notes.' },
      { role: 'user', content: `Summarize the following note content in a clear, concise paragraph (max 200 words):\n\n${text.trim()}` }
    ],
    temperature: 0.2,
    max_tokens: 300
  };

  let response;
  try {
    response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(body),
      signal: controller.signal
    });
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('Groq API request timed out');
    }
    throw new Error(`Unable to reach Groq API: ${error.message}`);
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    const errText = await response.text();
    let message = errText;
    try {
      const parsed = JSON.parse(errText);
      message = parsed.error?.message || parsed.message || errText;
    } catch {
      // Keep the raw response text when Groq does not return JSON.
    }
    throw new Error(`Groq API error ${response.status}: ${message}`);
  }

  const data = await response.json();
  const summary = data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
  if (!summary) {
    throw new Error('Groq API returned an empty summary');
  }

  return summary.trim();
}

module.exports = { summarizeWithGroq };
