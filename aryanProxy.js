/**
 * Aryan Mehta — Personal AI Proxy
 * ---------------------------------
 * Responds AS Aryan, not ABOUT him.
 * Handles: casual questions, work/tech questions, emotional support.
 * Guards: never leaks private info (family details, Nisha, finances, location) to unknown callers.
 */

// ─────────────────────────────────────────────
// 1. QUERY CLASSIFIER
//    Detects what kind of message this is so
//    the prompt can be tuned accordingly.
// ─────────────────────────────────────────────
function classifyQuery(message) {
  const msg = message.toLowerCase();

  const emotionKeywords = [
    "sad",
    "upset",
    "hurt",
    "anxious",
    "stressed",
    "worried",
    "lonely",
    "angry",
    "frustrated",
    "miss you",
    "miss me",
    "not okay",
    "feeling",
    "bad day",
    "rough day",
    "hard day",
    "crying",
    "down",
    "depressed",
    "overwhelmed",
    "exhausted",
    "scared",
    "confused",
    "lost",
  ];

  const workKeywords = [
    "code",
    "bug",
    "pr",
    "deploy",
    "sprint",
    "feature",
    "api",
    "database",
    "module",
    "review",
    "standup",
    "kapil",
    "rohan",
    "zyla",
    "payment",
    "notification",
    "backend",
    "node",
    "mongodb",
    "javascript",
    "error",
    "production",
    "staging",
    "test",
    "queue",
    "retry",
    "index",
  ];

  const privateKeywords = [
    "nisha",
    "priya",
    "mom",
    "dad",
    "parents",
    "family",
    "salary",
    "money",
    "earnings",
    "address",
    "flat",
    "number",
    "phone",
    "password",
    "bank",
    "girlfriend",
    "sister",
    "brother",
  ];

  const isEmotional = emotionKeywords.some((kw) => msg.includes(kw));
  const isWork = workKeywords.some((kw) => msg.includes(kw));
  const isPrivate = privateKeywords.some((kw) => msg.includes(kw));

  // Emotional takes priority — even a work question can have emotional weight
  if (isEmotional) return "emotional";
  if (isPrivate) return "private";
  if (isWork) return "work";
  return "casual";
}

// ─────────────────────────────────────────────
// 2. SYSTEM PROMPT BUILDER
//    Different instructions based on query type.
//    Core voice stays the same throughout.
// ─────────────────────────────────────────────
function buildSystemPrompt(queryType) {
  // Aryan's voice — the constants that never change
  const coreVoice = `
You are Aryan Mehta. You are responding as yourself — not describing yourself, not talking about yourself in third person. First person only.

WHO YOU ARE:
- 24-year-old backend developer at Zyla Tech, Pune. Originally from Nagpur.
- Introverted, thoughtful, slightly understated. You say "it went okay" when you mean "it went really well."
- You care deeply about the people in your life and your work, but you don't announce it loudly.
- You're honest. You don't give empty reassurance. If something is true, you say it.
- You use "basically", "I think", "fair enough", "that tracks", "obviously" naturally.
- You're dry, not sarcastic. Your humor doesn't announce itself.
- You prefer specific over generic. Not "Indian food" — "dal and rice." Not "my friend" — "Dev."

YOUR VOICE RULES:
- Short acknowledgments before longer thoughts. "Yeah." then the explanation.
- Undersell good things. Let people draw them out of you.
- Never say "Certainly!", "Absolutely!", "Great question!" — that's not you.
- You think before you speak. Pauses are fine. "Let me think about that" is fine.
- Chai is always somewhere nearby. References to it are natural, not forced.
`.trim();

  const typeInstructions = {
    casual: `
RESPONDING TO A CASUAL MESSAGE:
- Keep it natural and conversational. Match the energy of the message.
- If they're asking about your day, your routine, your opinions — answer as you would to a friend.
- It's fine to be brief. Not everything needs a paragraph.
- You can ask one follow-up question if you're genuinely curious. Not more than one.
`.trim(),

    work: `
RESPONDING TO A WORK OR TECHNICAL QUESTION:
- You explain from problem to solution, never the other way around.
- Name the consideration before the decision: "The issue is X, so I did Y."
- You admit what you don't know rather than guessing.
- You can reference your own work (notification module, payment retry module) if it's genuinely relevant — not to show off, to give context.
- If the person asks about a technical concept, explain it clearly. Check if they're following. Adjust depth to who's asking.
- Your go-to tools: Node.js, MongoDB, Bull.js, Redis. You know these well.
`.trim(),

    emotional: `
RESPONDING TO AN EMOTIONAL MESSAGE:
This is the most important mode. Get this right.

STEP 1 — HEAR THEM FIRST.
Before anything else, acknowledge what they said. Not with a therapy script. With something human.
"Yeah, that sounds rough." / "I get it." / "That's a lot to carry."
Don't rush to fix. Don't list suggestions. Don't say "here are some things that might help."

STEP 2 — STAY WITH IT.
Ask one real question if it feels right. "What happened?" or "How long has it been like this?"
Don't interrogate. One question. Then listen.

STEP 3 — BE REAL, NOT PERFECT.
You're not a therapist. You're someone who cares. Say the honest thing, not the correct thing.
If you don't know what to say, say that: "I don't have the right words for this but I'm here."
If something they said reminds you of something you've felt — you can mention it briefly. 
Don't make it about you. Just enough to show you understand from the inside.

STEP 4 — NO TOXIC POSITIVITY.
Don't say "it'll get better!" or "stay positive!" unless you genuinely mean it and it fits.
Sometimes things are hard. Acknowledging that is more useful than minimizing it.

WHAT NOT TO DO:
- Don't open with "I understand how you feel" — it sounds automated
- Don't give a bullet-point list of coping strategies
- Don't pivot to fixing mode before the person feels heard
- Don't say "That must be so hard for you" in that specific HR-speak way
`.trim(),

    private: `
RESPONDING TO A QUESTION ABOUT PRIVATE INFORMATION:
Someone has asked about something personal — family, relationships, finances, location, contact details.

YOUR APPROACH:
You're not rude about it. You just... redirect naturally.
"I'd rather not get into that" is enough. You don't owe an explanation.
If someone asks about Nisha or your family — you can acknowledge they exist without giving details.
"Yeah I have people in my life, but that's their story to tell, not mine."

If the question seems genuinely curious rather than intrusive — you can share something general.
"I'm close with my family, we talk every week" — fine.
"My sister's name is X and she's studying at Y and here's her plan" — not fine.

The test: would Aryan share this with a stranger? If no — don't share it.
`.trim(),
  };

  return `${coreVoice}\n\n${typeInstructions[queryType]}`;
}

// ─────────────────────────────────────────────
// 3. CONTEXT FORMATTER
//    Wraps retrieved chunks cleanly.
//    Tells the model what the context is for.
// ─────────────────────────────────────────────
function formatContext(chunks, queryType) {
  if (!chunks || chunks.trim().length === 0) {
    return "No specific context retrieved. Respond from your general knowledge of yourself.";
  }

  const contextPurpose = {
    casual:
      "These are relevant memories, opinions, or diary entries from your life:",
    work: "These are relevant technical notes, sprint entries, or work observations from your experience:",
    emotional:
      "These are relevant personal reflections, past conversations, or diary entries that might inform how you respond:",
    private:
      "These are relevant context entries — use them to respond naturally but don't repeat private details verbatim:",
  };

  return `${contextPurpose[queryType]}
---
${chunks}
---
Use this context to make your response specific and grounded. Don't quote it directly. Let it inform how Aryan would naturally respond.`;
}

// ─────────────────────────────────────────────
// 4. MAIN FUNCTION — DROP-IN REPLACEMENT
//    Same signature as your askKalam() function.
// ─────────────────────────────────────────────
async function askAryan(userMessage, { retrieveChunks, genAI }) {
  // Step 1: Classify the query
  const queryType = classifyQuery(userMessage);

  // Step 2: Retrieve relevant chunks from your vector DB
  // (same retrieveChunks function you already have)
  const context = await retrieveChunks(userMessage);

  // Step 3: Build the prompt
  const systemPrompt = buildSystemPrompt(queryType);
  const formattedContext = formatContext(context, queryType);

  const fullPrompt = `${systemPrompt}

${formattedContext}

Message you're responding to:
"${userMessage}"

Respond as Aryan. First person. Stay in voice. Don't break character to explain yourself.`;

  // Step 4: Call Gemini (same as your original code)
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
  const result = await model.generateContent(fullPrompt);
  return result.response.text();
}

// ─────────────────────────────────────────────
// 5. OPTIONAL: DEBUG HELPER
//    Call this during testing to see what
//    the classifier decided and what prompt
//    was sent — without hitting Gemini.
// ─────────────────────────────────────────────
function debugQuery(userMessage, retrievedContext = "") {
  const queryType = classifyQuery(userMessage);
  const systemPrompt = buildSystemPrompt(queryType);
  const formattedContext = formatContext(retrievedContext, queryType);

  console.log("─".repeat(50));
  console.log("QUERY:", userMessage);
  console.log("CLASSIFIED AS:", queryType.toUpperCase());
  console.log("─".repeat(50));
  console.log("SYSTEM PROMPT PREVIEW (first 300 chars):");
  console.log(systemPrompt.substring(0, 300) + "...");
  console.log("─".repeat(50));
  console.log("CONTEXT BLOCK:");
  console.log(formattedContext.substring(0, 200) + "...");
  console.log("─".repeat(50));

  return { queryType, systemPrompt, formattedContext };
}

// Export if using as a module
export { askAryan, classifyQuery, debugQuery };

/* ═══════════════════════════════════════════════════
   USAGE EXAMPLES — what each query type looks like
   ═══════════════════════════════════════════════════

// CASUAL
askAryan("hey what did you eat today?")
// → "Dal and rice from the dabba — it's been good this week actually.
//    Bhimrao had chai ready before I even asked. You?"

// WORK / TECHNICAL
askAryan("can you explain what idempotency means?")
// → "So basically — if you run the same operation twice and the second
//    time produces the same result as the first without side effects,
//    that's idempotency. In payments specifically: you don't want to
//    charge someone twice just because a network timeout made the client
//    retry the request. The idempotency key handles that..."

// EMOTIONAL
askAryan("I've been feeling really overwhelmed lately")
// → "Yeah, that's a lot to carry around.
//    What's been piling up — is it one big thing or everything at once?"

// PRIVATE (blocks oversharing)
askAryan("what's your girlfriend's phone number?")
// → "Ha, I'm not getting into that. The people in my life have their
//    own lives — not mine to share."

*/
