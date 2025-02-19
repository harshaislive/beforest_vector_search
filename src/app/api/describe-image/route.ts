import { NextRequest, NextResponse } from 'next/server';

const MISTRAL_API_KEY = process.env.MISTRAL_API_KEY;
const MISTRAL_API_URL = 'https://api.mistral.ai/v1/chat/completions';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    if (!MISTRAL_API_KEY) {
      return NextResponse.json(
        { error: 'Mistral API key not configured' },
        { status: 500 }
      );
    }

    // Convert the file to base64
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64Image = buffer.toString('base64');

    // Call Mistral API
    const response = await fetch(MISTRAL_API_URL, {
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
            content: "You are a highly skilled image analyst. Your task is to provide concise, accurate, and search-relevant descriptions of images. Focus on key visual elements that would be most useful for image similarity search, such as: main subjects, composition, lighting, colors, and setting. Avoid subjective interpretations."
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Describe this image in a way that would be most useful for finding similar images. Focus on the key visual elements, composition, and distinctive features that make this image unique."
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
        max_tokens: 100,
        temperature: 0.3 // Lower temperature for more focused and consistent outputs
      })
    });

    if (!response.ok) {
      throw new Error('Failed to get image description from Mistral API');
    }

    const data = await response.json();
    const description = data.choices[0].message.content;

    return NextResponse.json({ description });
  } catch (error) {
    console.error('Error describing image:', error);
    return NextResponse.json(
      { error: 'Failed to describe image' },
      { status: 500 }
    );
  }
} 