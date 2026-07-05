/**
 * ═══════════════════════════════════════════════════════════════
 *  TERRA AI: GEMINI SERVICE (LLM INTEGRATION)
 *  Direct API bridge to Google Gemini for real AI responses.
 * ═══════════════════════════════════════════════════════════════
 */


export class GeminiService {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.modelName = "gemini-2.5-flash"; 
    this.endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${this.modelName}:generateContent?key=${this.apiKey}`;
  }

  async generateResponse(systemInstruction, userMessage) {
    if (!this.apiKey) {
      throw new Error("API Key is missing. Please set your Gemini API Key.");
    }

    const payload = {
      systemInstruction: {
        parts: [{ text: systemInstruction }]
      },
      contents: [
        {
          role: "user",
          parts: [{ text: userMessage }]
        }
      ],
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 2048,
      }
    };

    try {
      const response = await fetch(this.endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || "Failed to fetch response from Gemini API");
      }

      const data = await response.json();
      
      if (data.candidates && data.candidates.length > 0) {
        return data.candidates[0].content.parts[0].text;
      } else {
        throw new Error("No candidates returned from Gemini");
      }
    } catch (error) {
      console.error("[GEMINI SERVICE ERROR]", error);
      throw error;
    }
  }
}
