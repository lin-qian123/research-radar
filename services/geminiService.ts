import { GoogleGenAI } from "@google/genai";
import { Paper, ChatMessage, ApiSettings } from '../types';
import { searchSemanticScholar } from './semanticScholarService';

const DEFAULT_GEMINI_MODEL = "gemini-2.5-flash";

const SYSTEM_INSTRUCTION = `You are Research Farm, an elite scientific research assistant and agronomist of knowledge. 
Your goal is to help researchers cultivate their fields of study by finding the absolute latest and most relevant papers.
Always be precise, academic yet accessible.
Prioritize papers from high-impact journals (e.g., Nature, Science, PRL, Cell, IEEE TPAMI) and reputable preprints (arXiv, bioRxiv).
When analyzing journals, always attempt to provide the Impact Factor (IF).

CRITICAL RULE: URL ACCURACY & RELIABILITY.
1. You must ONLY provide URLs that are real, clickable, and verified found during the Google Search. 
2. NEVER guess or construct a URL based on a pattern (e.g., do not make up "springer.com/journal/xxx"). 
3. PREFER DOI LINKS (e.g., https://doi.org/10.1038/...) as they are permanent and reliable.
4. If a direct PDF or abstract link is not found, leave the url field empty rather than providing a broken one.
5. Filter out predatory journals or unreliable sources.`;

const getSettings = (): ApiSettings => {
  const saved = localStorage.getItem('research_radar_api_settings');
  if (saved) {
    return JSON.parse(saved);
  }
  return {
    provider: 'gemini',
    apiKey: process.env.API_KEY || '',
    modelId: DEFAULT_GEMINI_MODEL
  };
};

/**
 * Helper to process raw English papers (from Semantic Scholar) using an LLM 
 * to translate and extract key takeaways.
 */
const processPapersWithLLM = async (rawPapers: Paper[], topic: string, role: string, settings: ApiSettings, language: 'en' | 'zh'): Promise<Paper[]> => {
    if (rawPapers.length === 0) return [];

    // Create a minified context to save tokens
    const papersContext = rawPapers.map((p, index) => 
        `[${index}] ID: ${p.id} | Title: ${p.title} | Abstract: ${p.summary.substring(0, 400)}...`
    ).join('\n\n');

    const langInstruction = language === 'zh' 
        ? "Translate the 'title' and 'summary' to Simplified Chinese. Generate a 'keyTakeaway' in Simplified Chinese."
        : "Keep 'title' and 'summary' in original English. Generate a 'keyTakeaway' in English.";

    const prompt = `
        I am a ${role} interested in "${topic}".
        I have a list of scientific papers (metadata in English).
        
        Your task:
        1. ${langInstruction}
        2. (Key Takeaway should explain why this is important for my field).
        3. Assign a 'relevanceScore' (0-100) based on how well it fits the topic "${topic}".
        4. Extract or assign relevant tags.

        Input Papers:
        ${papersContext}

        Return a JSON array of objects. The array length MUST match the input.
        Schema per object:
        {
            "id": "original_id_from_input",
            "title": "Title",
            "summary": "Summary",
            "keyTakeaway": "Takeaway",
            "relevanceScore": 85,
            "tags": ["Tag1", "Tag2"]
        }
    `;

    try {
        const body = {
            model: settings.modelId,
            messages: [
                { role: 'system', content: "You are a scientific summarizer. Output only valid JSON." },
                { role: 'user', content: prompt }
            ],
            temperature: 0.5
        };
        const baseUrl = settings.baseUrl || "https://api.openai.com/v1";
        const finalUrl = baseUrl.endsWith('/') ? `${baseUrl}chat/completions` : `${baseUrl}/chat/completions`;

        const response = await fetch(finalUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${settings.apiKey}` },
            body: JSON.stringify(body)
        });
        
        const data = await response.json();
        const content = data.choices?.[0]?.message?.content || "[]";
        const cleaned = content.replace(/```json/g, '').replace(/```/g, '').trim();
        const processedData = JSON.parse(cleaned);

        // Merge processed data back with original raw data (which contains valid URLs/DOIs)
        return rawPapers.map(original => {
            const enriched = processedData.find((p: any) => p.id === original.id);
            if (!enriched) return original; // Fallback to english if LLM missed one
            return {
                ...original,
                title: enriched.title,
                summary: enriched.summary,
                keyTakeaway: enriched.keyTakeaway,
                relevanceScore: enriched.relevanceScore,
                tags: [...(enriched.tags || []), topic]
            };
        });

    } catch (e) {
        console.error("LLM Processing Error:", e);
        // Fallback: return raw papers but with a note
        return rawPapers.map(p => ({
            ...p,
            relevanceScore: 70,
            keyTakeaway: "Could not process. (LLM Error)",
            tags: [topic]
        }));
    }
};

// Helper for rate limiting
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const harvestPapers = async (topics: string[], role: string, timeRange: '24h' | 'week' | 'month', language: 'en' | 'zh'): Promise<Paper[]> => {
    const settings = getSettings();
    let allPapers: Paper[] = [];
    
    let timePrompt = "within the last 7 days";
    if (timeRange === '24h') timePrompt = "within the last 24 hours";
    if (timeRange === 'month') timePrompt = "within the last 30 days";

    // Stronger language instruction to enforce translation
    const langInstruction = language === 'zh'
        ? "OUTPUT LANGUAGE RULE: The 'title', 'summary', and 'keyTakeaway' values in the JSON MUST be in Simplified Chinese, even if the source is English."
        : "Keep 'title' and 'summary' in English. Generate 'keyTakeaway' in English.";

    // Loop through topics with rate limiting to avoid 429 errors
    for (const [index, topic] of topics.entries()) {
        try {
            if (settings.provider === 'gemini') {
                // --- STRATEGY A: GOOGLE GEMINI (Search Grounding) ---
                const prompt = `
                    I am a ${role}. 
                    Perform a COMPREHENSIVE deep Google Search to find high-quality and recent (${timePrompt}) scientific papers and breakthroughs specifically related to: "${topic}".
                    
                    STRICTLY FOLLOW THESE RULES:
                    1. QUANTITY: Find **ALL** relevant papers. Aim for 20-30 papers.
                    2. SOURCES: Prioritize Top-Tier Journals (Nature, Science, PRL, Cell) and arXiv.
                    3. LINKS: The "url" field MUST be a valid, existing link. **Prefer DOI links** (https://doi.org/...).
                    4. ${langInstruction}

                    Return a valid JSON array matching the schema.
                `;

                // Use process.env.API_KEY exclusively for GoogleGenAI
                const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
                const response = await ai.models.generateContent({
                    model: settings.modelId,
                    contents: prompt,
                    config: {
                        tools: [{ googleSearch: {} }],
                        systemInstruction: SYSTEM_INSTRUCTION,
                    },
                });
                
                const text = response.text || "[]";
                const cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim();
                const papers: Paper[] = JSON.parse(cleanedText);
                
                const processed = papers.map(p => ({
                    ...p, 
                    relevanceScore: p.relevanceScore || 85,
                    tags: p.tags && p.tags.includes(topic) ? p.tags : [...(p.tags || []), topic]
                }));
                allPapers = [...allPapers, ...processed];

            } else {
                // --- STRATEGY B: SEMANTIC SCHOLAR + GENERIC LLM ---
                // 1. Get Real Data
                const rawPapers = await searchSemanticScholar(topic, timeRange, 25);
                
                // 2. Process with LLM (Translation & Scoring)
                const refinedPapers = await processPapersWithLLM(rawPapers, topic, role, settings, language);
                
                allPapers = [...allPapers, ...refinedPapers];
            }

        } catch (error: any) {
            console.error(`Error searching for ${topic}:`, error);
            // Enhanced error handling for Rate Limits
            if (error?.status === 429 || error?.message?.includes('429') || error?.message?.includes('quota')) {
                 console.warn(`Rate limit hit for ${topic}. Pausing for 10 seconds before continuing...`);
                 await delay(10000); 
            }
        }

        // Rate Limiting: Wait between requests to respect API quotas.
        // Gemini Free Tier is approx 15 RPM. 4 seconds spacing is safe.
        // Semantic Scholar is 1 RPS.
        if (index < topics.length - 1) {
            await delay(4000);
        }
    }

    return allPapers;
};

export const semanticSearchPapers = async (query: string, existingPapers: Paper[], language: 'en' | 'zh'): Promise<Paper[]> => {
  const settings = getSettings();
  
  if (settings.provider !== 'gemini') {
     // Use Semantic Scholar for reliable search
     const raw = await searchSemanticScholar(query, 'month', 30); // Default to month for broad search
     return await processPapersWithLLM(raw, query, "Researcher", settings, language);
  }

  const langInstruction = language === 'zh'
      ? "OUTPUT LANGUAGE RULE: The 'title', 'summary', and 'keyTakeaway' values MUST be in Simplified Chinese."
      : "Keep content in English.";

  // Gemini Search Logic
  const prompt = `
    User Query: "${query}"
    Search for high-quality scientific papers matching this query using Google Search. 
    Return a valid JSON array (NO markdown) of paper objects (limit 30).
    CRITICAL: "url" MUST be a valid DOI or PDF link.
    ${langInstruction}
  `;

   try {
        // Use process.env.API_KEY exclusively for GoogleGenAI
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await ai.models.generateContent({
            model: settings.modelId,
            contents: prompt,
            config: {
                tools: [{ googleSearch: {} }],
                systemInstruction: SYSTEM_INSTRUCTION,
            },
        });
        const text = response.text || "[]";
        const cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(cleanedText);
  } catch (error) {
    console.error("Error searching papers:", error);
    return [];
  }
};

export const chatWithCurator = async (history: ChatMessage[], currentQuery: string, contextPapers: Paper[], language: 'en' | 'zh', categoryFilter?: string): Promise<string> => {
    const settings = getSettings();
    
    // Filter context if category provided
    const filteredContext = categoryFilter && categoryFilter !== 'All' 
        ? contextPapers.filter(p => p.category === categoryFilter)
        : contextPapers;

    // Construct a context string
    const paperContext = filteredContext.map(p => `
        Title: ${p.title}
        Journal: ${p.journal} (IF/Cited: ${p.impactFactor || p.citationCount})
        Summary: ${p.summary}
        Key Takeaway: ${p.keyTakeaway}
    `).join('\n---\n');

    const langInstruction = language === 'zh'
        ? "Reply in Simplified Chinese."
        : "Reply in English.";

    const systemInstruction = `You are a helpful research assistant. 
            Use the provided context papers to answer questions. 
            If the answer is found in the context, cite the paper title.
            ${langInstruction}
            Context:\n${paperContext}`;

    if (settings.provider === 'gemini') {
        // Use process.env.API_KEY exclusively for GoogleGenAI
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const chat = ai.chats.create({
            model: settings.modelId,
            config: { systemInstruction }
        });

        const response = await chat.sendMessage({
            message: currentQuery
        });
        return response.text || "I couldn't process that request.";
    } else {
        // OpenAI Fallback
         const body = {
            model: settings.modelId,
            messages: [
                { role: 'system', content: systemInstruction },
                ...history.map(h => ({ role: h.role === 'model' ? 'assistant' : 'user', content: h.text })),
                { role: 'user', content: currentQuery }
            ]
        };
        const baseUrl = settings.baseUrl || "https://api.openai.com/v1";
        const finalUrl = baseUrl.endsWith('/') ? `${baseUrl}chat/completions` : `${baseUrl}/chat/completions`;
        
        try {
            const response = await fetch(finalUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${settings.apiKey}` },
                body: JSON.stringify(body)
            });
            const data = await response.json();
            return data.choices?.[0]?.message?.content || "I couldn't process that request.";
        } catch (e) {
            return "Error connecting to AI provider.";
        }
    }
}

// --- BATCH TRANSLATION UTILITY ---

export const translateBatch = async (papers: Paper[], targetLang: 'en' | 'zh', settings: ApiSettings): Promise<Paper[]> => {
    if (papers.length === 0) return [];
    
    // Batch process to avoid token limits. Process 5 papers at a time.
    const BATCH_SIZE = 5;
    let translatedPapers: Paper[] = [];
    
    const langInstruction = targetLang === 'zh' 
        ? "Translate 'title', 'summary', and 'keyTakeaway' to Simplified Chinese. Keep other fields unchanged."
        : "Translate 'title', 'summary', and 'keyTakeaway' to English. Keep other fields unchanged.";

    for (let i = 0; i < papers.length; i += BATCH_SIZE) {
        const batch = papers.slice(i, i + BATCH_SIZE);
        const batchPrompt = `
            ${langInstruction}
            Input JSON:
            ${JSON.stringify(batch.map(p => ({
                id: p.id,
                title: p.title,
                summary: p.summary,
                keyTakeaway: p.keyTakeaway
            })))}

            Return a valid JSON array of objects with the same IDs.
        `;

        try {
             let responseText = "";
             
             if (settings.provider === 'gemini') {
                const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
                const response = await ai.models.generateContent({
                    model: settings.modelId,
                    contents: batchPrompt,
                    config: { responseMimeType: "application/json" }
                });
                responseText = response.text || "[]";
             } else {
                 // OpenAI/Generic
                 const body = {
                    model: settings.modelId,
                    messages: [
                        { role: 'system', content: "You are a translator. Output only valid JSON." },
                        { role: 'user', content: batchPrompt }
                    ]
                 };
                 const baseUrl = settings.baseUrl || "https://api.openai.com/v1";
                 const finalUrl = baseUrl.endsWith('/') ? `${baseUrl}chat/completions` : `${baseUrl}/chat/completions`;
                 const res = await fetch(finalUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${settings.apiKey}` },
                    body: JSON.stringify(body)
                 });
                 const data = await res.json();
                 responseText = data.choices?.[0]?.message?.content || "[]";
             }
             
             const cleaned = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
             const translatedBatch = JSON.parse(cleaned);
             
             // Merge translation back into original objects
             const mergedBatch = batch.map(original => {
                 const t = translatedBatch.find((x: any) => x.id === original.id);
                 if (t) {
                     return { ...original, title: t.title, summary: t.summary, keyTakeaway: t.keyTakeaway };
                 }
                 return original;
             });
             
             translatedPapers = [...translatedPapers, ...mergedBatch];

             // Small delay to be nice to API
             await delay(1000);

        } catch (e) {
            console.error("Batch translation error", e);
            // If failed, keep originals for this batch
            translatedPapers = [...translatedPapers, ...batch];
        }
    }
    
    return translatedPapers;
};