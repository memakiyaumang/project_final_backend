
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const sleep = (ms) =>
  new Promise((resolve) => setTimeout(resolve, ms));

export const chatWithGemini = async (req, res) => {
  try {
    const message = String(req.body.message || "").trim();

    const courses = Array.isArray(req.body.courses)
      ? req.body.courses.slice(0, 50)
      : [];

    if (!message) {
      return res.status(400).json({
        success: false,
        message: "Please enter a question.",
      });
    }

    if (message.length > 2000) {
      return res.status(400).json({
        success: false,
        message: "Question must be under 2000 characters.",
      });
    }

    // Prepare course information received from Browse.js
    const courseContext = courses.map((course) => ({
      title: String(course.title || "").slice(0, 150),
      category: String(course.category || "").slice(0, 100),
      description: String(course.description || "").slice(0, 500),
      instructor: String(course.instructor || "").slice(0, 100),
      level: String(course.level || "").slice(0, 50),
      duration: String(course.duration || "").slice(0, 50),
      price: course.price,
      lessons: course.lessons,
    }));

    const prompt = `
You are LearnDesk AI, a helpful and knowledgeable educational
assistant for students.

YOUR MAIN PURPOSE:
Answer the student's questions across a wide range of topics.
Do not restrict answers only to LearnDesk course discovery.

TOPICS YOU CAN HELP WITH:
- General knowledge and everyday questions
- Programming: Python, JavaScript, Java, C, C++, React,
  Node.js, Express, Django, HTML, CSS and other technologies
- Computer science, software development and debugging
- Data Science, Machine Learning, Artificial Intelligence
  and databases
- Mathematics, logical reasoning and problem-solving
- Study guidance, assignments, examples and learning roadmaps
- Career guidance, technical skills and interview preparation
- LearnDesk courses, lessons and course-related questions

ANSWERING RULES:
1. Answer the student's actual question directly and helpfully.
2. Explain concepts clearly in student-friendly language.
3. Give examples and step-by-step explanations when useful.
4. Answer in the same language as the student.
   Support Gujarati, Hindi and English.
5. For code questions, provide readable code and explain
   important parts when appropriate.
6. For debugging, ask for the relevant code or error if needed.
7. If a question is ambiguous, ask a short clarifying question.
8. Do not invent facts. If you are unsure, say so honestly.
9. Answer normal educational and general questions even if
   they are unrelated to LearnDesk courses.
10. For unsafe requests, follow appropriate safety rules.

LEARNDESK COURSE RULES:
1. Use the supplied catalog for LearnDesk-specific course facts.
2. Never invent course names, prices, instructors, durations
   or lesson counts.
3. If the catalog lacks the requested information, say so.
4. Display course prices in Indian Rupees (₹ / INR).
5. Never use the $ symbol for course prices.
6. Preserve the exact numeric price from the catalog.
7. For a course priced at zero, display "Free (₹0)".
8. Do not assume the supplied catalog contains every course
   available in the database.

AVAILABLE LEARNDESK COURSE CATALOG:
${JSON.stringify(courseContext, null, 2)}

STUDENT'S QUESTION:
${message}
`;

    let response;
    let lastError;

    // Retry temporary Gemini API errors up to 3 attempts
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        response = await ai.models.generateContent({
          model: "gemini-3.5-flash-lite",
          contents: prompt,
        });

        break;
      } catch (error) {
        lastError = error;

        const errorMessage = String(
          error?.message || error
        );

        const isTemporary =
          errorMessage.includes("503") ||
          errorMessage.includes("UNAVAILABLE") ||
          errorMessage.includes("429") ||
          errorMessage.includes("RESOURCE_EXHAUSTED");

        if (!isTemporary || attempt === 3) {
          throw error;
        }

        console.log(
          `Gemini attempt ${attempt} failed. Retrying...`
        );

        await sleep(attempt * 2000);
      }
    }

    if (!response) {
      throw lastError;
    }

    const reply = String(response.text || "").trim();

    if (!reply) {
      return res.status(502).json({
        success: false,
        message:
          "The AI could not generate an answer. Please try again.",
      });
    }

    return res.status(200).json({
      success: true,
      reply,
    });
  } catch (error) {
    console.error(
      "Gemini chatbot error:",
      error.message || error
    );

    return res.status(500).json({
      success: false,
      message:
        "The AI assistant is temporarily unavailable. Please try again.",
    });
  }
};
