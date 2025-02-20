import { NextRequest, NextResponse } from 'next/server';

const MISTRAL_API_KEY = process.env.MISTRAL_API_KEY;
const MISTRAL_API_URL = 'https://api.mistral.ai/v1/chat/completions';

const BEFOREST_CONTEXT = `You are helping users search through Beforest's image collection. Beforest is a collective permaculture farming company focused on sustainable agriculture, forest conservation, and community building.

The search uses CLIP, an AI model that understands semantic relationships between images and text. CLIP works best with:
- Simple action descriptions (e.g. "person climbing tree")
- Direct object naming (e.g. "basket of vegetables")
- Basic scene descriptions (e.g. "foggy forest morning")
- Short activity phrases (e.g. "people planting trees")
- Clear visual elements and colors
- Short, natural language

Common themes in Beforest's imagery:
- Forest landscapes and trails
- Farming and gardens
- Plants and animals
- People working outdoors
- Community activities
- Natural buildings
- Water features
- Weather conditions
- Seasonal changes

When generating suggestions:
1. Keep phrases short and simple
2. Use basic object names
3. Describe scenes directly
4. Avoid poetic or complex language
5. Focus on visible elements only`;

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

    let imageDescription = '';
    if (imageFile) {
      // First, get image description using Pixtral
      const arrayBuffer = await imageFile.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const base64Image = buffer.toString('base64');

      const descriptionResponse = await fetch(MISTRAL_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${MISTRAL_API_KEY}`
        },
        body: JSON.stringify({
          model: "pixtral-12b-2409",
          messages: [
            {
              role: "system",
              content: "You are an expert at describing images in detail, focusing on visual elements, composition, lighting, colors, and atmosphere. Provide natural, descriptive observations that would be useful for image search."
            },
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: "Describe this image in detail, focusing on visual elements that would be useful for searching similar images. Include details about composition, lighting, colors, and atmosphere."
                },
                {
                  type: "image_url",
                  image_url: {
                    url: `data:image/jpeg;base64,${base64Image}`
                  }
                }
              ]
            }
          ],
          max_tokens: 200,
          temperature: 0.3
        })
      });

      if (!descriptionResponse.ok) {
        throw new Error('Failed to generate image description');
      }

      const descriptionData = await descriptionResponse.json();
      imageDescription = descriptionData.choices[0].message.content;
    }

    // Generate search suggestions using the text model
    const messages = [
      {
        role: "system",
        content: BEFOREST_CONTEXT + "\n\nYou are generating alternative search queries that work well with CLIP and align with Beforest's themes. Think like a user trying to find similar images using natural language."
      },
      {
        role: "user",
        content: imageFile 
          ? `Based on this image description: "${imageDescription}", generate 5 alternative search queries that:
1. Capture the key visual elements described
2. Use natural language descriptions that CLIP understands well
3. Include relevant Beforest themes and contexts
4. Vary in specificity (from specific details to broader scenes)
5. Consider different perspectives and relationships

Return ONLY the suggestions, one per line, without numbers or bullet points.`
          : `The user is searching for "${query}". Generate 5 alternative search queries that:
1. Capture the semantic meaning of the original query
2. Use natural language descriptions that CLIP understands well
3. Include relevant Beforest themes and contexts
4. Vary in specificity (from specific details to broader scenes)
5. Consider different perspectives and relationships

Return ONLY the suggestions, one per line, without numbers or bullet points.`
      }
    ];

    const response = await fetch(MISTRAL_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${MISTRAL_API_KEY}`
      },
      body: JSON.stringify({
        model: "mistral-small-latest",
        messages,
        max_tokens: 150,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      throw new Error('Failed to get suggestions from Mistral API');
    }

    const data = await response.json();
    const suggestions = data.choices[0].message.content
      .split('\n')
      .map((s: string) => s.trim())
      .filter((s: string) => s.length > 0);

    return NextResponse.json({ suggestions });
  } catch (error) {
    console.error('Error generating suggestions:', error);
    return NextResponse.json(
      { error: 'Failed to generate suggestions' },
      { status: 500 }
    );
  }
} 