import { ChatGroq } from "@langchain/groq"
import dotenv from "dotenv"
dotenv.config()
const GROQ_API_KEY = process.env.GROQ_API_KEY

const llm = new ChatGroq({
    model: "llama-3.3-70b-versatile",
    temperature: 0,
    maxTokens: undefined,
    maxRetries: 2,
    // other params...
})
const aiMsg = await llm.invoke([
    {
      role: "system",
      content: "You are a helpful assistant that translates English to French. Translate the user sentence.",
    },
    { role: "user", content: "I love programming." },
])
aiMsg
console.log(aiMsg.content)