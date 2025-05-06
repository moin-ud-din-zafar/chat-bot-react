const GEMINI_API_KEY = "AIzaSyCZYVqf90RzkCX2iqcDGevuXlGSied4t24"; // Replace with your actual key
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

/**
 * Sends a prompt to the Gemini model and returns the generated content.
 * @param {string} prompt - The prompt to send to the Gemini model.
 * @returns {Promise<string>} The generated content from Gemini.
 */
export async function getGeminiResponse(prompt) {
  try {
    // Build the request payload as per the cURL example.
    const payload = {
      contents: [
        {
          parts: [
            { text: prompt }
          ]
        }
      ]
    };

    const response = await fetch(GEMINI_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    console.log("Gemini API Response:", data);

    if (!response.ok) {
      console.error("Gemini API Error:", data);
      throw new Error(data.error?.message || "Error fetching from Gemini API.");
    }

    // Extract generated text from the "content" field.
    if (
      data.candidates &&
      data.candidates.length > 0 &&
      data.candidates[0].content &&
      data.candidates[0].content.parts &&
      data.candidates[0].content.parts.length > 0 &&
      data.candidates[0].content.parts[0].text
    ) {
      return data.candidates[0].content.parts[0].text.trim();
    } else {
      throw new Error("No valid output received from Gemini API. Full candidate response: " + JSON.stringify(data.candidates));
    }
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Sorry, something went wrong.";
  }
}
