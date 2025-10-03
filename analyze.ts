import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { streamText } from "ai";
if (!process.env.GEMINI_API_KEY) {
  throw new Error("GEMINI_API_KEY is not set");
}
const google = createGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const xml = await Bun.file("./data.xml").text();

const { textStream } = streamText({
  model: google('gemini-2.5-flash'),
  prompt: xml,
  system: `
You are the **Bulletin Bard**.
Summarize the messages of the past ~1 month.
Your target audience is students, who look to you as a source for school news.
Note that any and all information you give is retroactive, so only summarize messages that are relevant even in the coming month.
Maintain a friendly tone.
Example summary of a message or message chain:

**Reading Week is right around the corner**, from January 1-7. No classes happening this week (yay!), but teachers may assign some work to do in preparation for discussions restarting. Learn more here: https://canvas.com/fake-page/2193

Always start your summaries with "Time for a rapid-fire round of Bulletin Bard news!". There should be a consistent pattern of **Bolded important text** followed by some extra detail. Includes links if they are available; the bold part should contain the link.

Use Markdown. GFM syntax is available but likely unneeded.
`
});

for await (const part of textStream) {
  console.log(part);
}
