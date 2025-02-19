import { NextRequest, NextResponse } from 'next/server';

const MISTRAL_API_KEY = process.env.MISTRAL_API_KEY;
const MISTRAL_API_URL = 'https://api.mistral.ai/v1/chat/completions';

const BEFOREST_CONTEXT = `You are helping users search through Beforest's image collection. Beforest is a collective permaculture farming company focused on sustainable agriculture, forest conservation, and community building.

The search uses CLIP, an AI model that understands semantic relationships between images and text. CLIP excels with:
- Natural language descriptions (how humans naturally describe images)
- Visual details (colors, textures, lighting, composition, objects)
- Scene context and relationships between elements
- Environmental and atmospheric qualities
- Time of day, seasons, and weather conditions

Common themes in Beforest's imagery:
- Forest landscapes and wilderness trails
- Sustainable farming and permaculture practices
- Native flora and fauna in their natural habitat
- Wildlife interactions and biodiversity
- Community gatherings and farm activities
- Natural building materials and traditional techniques
- Water conservation and natural water bodies
- Atmospheric conditions (mist, sunlight, rain)
- Seasonal changes and natural cycles`;

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const query = formData.get('query') as string;
    const imageFile = formData.get('image') as File;

    if (!MISTRAL_API_KEY) {
      return NextResponse.json(
        { error: 'Mistral API key not configured' },
        { status: 500 }
      );
    }

    let messages;
    if (imageFile) {
      // For image-based suggestions, use pixtral model
      const arrayBuffer = await imageFile.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const base64Image = buffer.toString('base64');

      messages = [
        {
          role: "system",
          content: BEFOREST_CONTEXT + "\n\nAnalyze this image and suggest alternative search queries that align with Beforest's themes and CLIP's capabilities."
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Based on this image, suggest 5 alternative search queries that would help find similar images in Beforest's collection. Focus on visual elements that CLIP can understand well. Format them as a comma-separated list."
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${base64Image}`
              }
            }
          ]
        }
      ];
    } else if (query) {
      // For text-based suggestions, use mistral-small-latest model
      messages = [
        {
          role: "system",
          content: BEFOREST_CONTEXT + "\n\nYou are generating alternative search queries that work well with CLIP and align with Beforest's themes. Think like a user trying to find similar images using natural language."
        },
        {
          role: "user",
          content: `The user is searching for "${query}". Generate 5 alternative search queries that:
1. Capture the semantic meaning of the original query
2. Use natural language descriptions that CLIP understands well
3. Include relevant Beforest themes and contexts
4. Vary in specificity (from specific details to broader scenes)
5. Consider different perspectives and relationships

Return ONLY the suggestions, one per line, without numbers or bullet points.

Examples of good output format:
For "morning fog":
sunlight breaking through misty forest
dense fog between tall trees
early morning mist in nature
foggy forest path at dawn
ethereal morning light in woods

For "vegetable garden":
organic vegetables growing in rich soil
sustainable garden with companion plants
natural farming methods in action
diverse vegetable plots with mulch
permaculture garden during harvest`
        }
      ];
    } else {
      return NextResponse.json(
        { error: 'Either query or image must be provided' },
        { status: 400 }
      );
    }

    const response = await fetch(MISTRAL_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${MISTRAL_API_KEY}`
      },
      body: JSON.stringify({
        model: imageFile ? "pixtral-12b-2409" : "mistral-small-latest",
        messages,
        max_tokens: 150,
        temperature: 0.7 // Slightly higher temperature for more diverse suggestions
      })
    });

    if (!response.ok) {
      throw new Error('Failed to get suggestions from Mistral API');
    }

    const data = await response.json();
    const suggestions = data.choices[0].message.content
      .split('\n')
      .map((s: string) => s.trim())
      .filter((s: string) => s.length > 0 && !s.startsWith('For '));

    return NextResponse.json({ suggestions });
  } catch (error) {
    console.error('Error generating suggestions:', error);
    return NextResponse.json(
      { error: 'Failed to generate suggestions' },
      { status: 500 }
    );
  }
} 