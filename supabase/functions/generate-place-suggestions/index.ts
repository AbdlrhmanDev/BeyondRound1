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

Generate exactly 3 personalized place suggestions in JSON format. Each place should be perfect for this specific group of physicians. Consider their profession (need quiet spaces for deep conversations, appreciate good food/coffee after long shifts) and any shared interests.

Return ONLY valid JSON in this exact format (no markdown, no code blocks, just pure JSON):
{
  "suggestions": [
    {
      "name": "Place Name 1",
      "type": "cafe",
      "description": "A brief description (1-2 sentences) about why this place is great for physicians",
      "vibe": "cozy and quiet",
      "priceRange": "$$",
      "goodFor": ["networking", "coffee meetings", "casual conversations"]
    },
    {
      "name": "Place Name 2",
      "type": "restaurant",
      "description": "A brief description (1-2 sentences) about why this place is great for physicians",
      "vibe": "upscale but relaxed",
      "priceRange": "$$$",
      "goodFor": ["dinner meetings", "professional gatherings"]
    },
    {
      "name": "Place Name 3",
      "type": "bar",
      "description": "A brief description (1-2 sentences) about why this place is great for physicians",
      "vibe": "sophisticated lounge",
      "priceRange": "$$",
      "goodFor": ["after-work drinks", "socializing"]
    }
  ]
}

Important: 
- Use realistic place names that could exist in ${city}
- Types should be: cafe, restaurant, park, bar, lounge, library, gym, museum, or similar
- Price ranges: $ (budget), $$ (moderate), $$$ (upscale), $$$$ (fine dining)
- goodFor should be an array of 2-4 relevant tags
- Return ONLY the JSON object, no additional text before or after`;

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
        response_format: { type: "json_object" },
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
    let content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No content in AI response");
    }

    // Clean up the content - remove markdown code blocks if present
    content = content.trim();
    if (content.startsWith("```json")) {
      content = content.replace(/^```json\s*/, "").replace(/\s*```$/, "");
    } else if (content.startsWith("```")) {
      content = content.replace(/^```\s*/, "").replace(/\s*```$/, "");
    }

    let parsedData;
    try {
      parsedData = JSON.parse(content);
    } catch (parseError) {
      console.error("Error parsing AI JSON response:", parseError);
      console.error("Raw content:", content);
      throw new Error("Failed to parse AI response as JSON");
    }

    // Return suggestions directly
    if (parsedData.suggestions && Array.isArray(parsedData.suggestions)) {
      return new Response(
        JSON.stringify({ 
          suggestions: parsedData.suggestions,
          message: `Here are ${parsedData.suggestions.length} great places in ${city} for your group!`
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    throw new Error("Invalid response structure from AI");
  } catch (error) {
    console.error("Error in generate-place-suggestions:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
