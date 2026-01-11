import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { 
      status: 200,
      headers: corsHeaders 
    });
  }

  try {
    const { city, memberNames, specialties, interests, chatContext } = await req.json();

    if (!city) {
      return new Response(
        JSON.stringify({ error: "City is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not set");
    }

    // Build context about the group
    const groupContext = memberNames?.length 
      ? `This is for a group of ${memberNames.length} physicians including: ${memberNames.join(", ")}.` 
      : "This is for a group of physicians.";
    
    const specialtyContext = specialties?.length 
      ? `Their specialties include: ${specialties.join(", ")}.` 
      : "";
    
    const interestContext = interests?.length 
      ? `Shared interests include: ${interests.join(", ")}.` 
      : "";

    const chatHistoryContext = chatContext 
      ? `Recent chat context: "${chatContext}". Use this to personalize suggestions.`
      : "";

    const prompt = `You are a friendly AI assistant helping a group of physicians find great places to meet up in ${city}. 

${groupContext}
${specialtyContext}
${interestContext}
${chatHistoryContext}

Generate 3 personalized place suggestions that would be perfect for this specific group. Consider their profession (need quiet spaces for deep conversations, appreciate good food/coffee after long shifts) and any shared interests.

For each place, provide:
1. A realistic venue name for ${city}
2. Type (cafe, restaurant, park, bar, lounge, etc.)
3. A brief, friendly description (1-2 sentences)
4. Why it's perfect for THIS group specifically
5. Price range ($, $$, $$$)

Respond conversationally as if you're a local friend making recommendations. Start with a brief friendly intro, then list the 3 places with details. Use emojis sparingly. Keep it concise but warm.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "user", content: prompt },
        ],
        temperature: 0.8,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add credits to continue." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No content in AI response");
    }

    return new Response(
      JSON.stringify({ message: content }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in generate-place-suggestions:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
