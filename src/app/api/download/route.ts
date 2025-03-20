import { NextRequest, NextResponse } from 'next/server';
import { getDownloadLink } from '@/lib/dropbox';

export async function GET(request: NextRequest) {
  // Get path parameter from query string
  const { searchParams } = new URL(request.url);
  const path = searchParams.get('path');

  if (!path) {
    return NextResponse.json(
      { error: 'Path parameter is required' },
      { status: 400 }
    );
  }

  try {
    // Get the direct download link from Dropbox
    const downloadUrl = await getDownloadLink(path);
    
    // Fetch the file content from Dropbox
    const response = await fetch(downloadUrl);
    
    if (!response.ok) {
      throw new Error(`Failed to download file: ${response.statusText}`);
    }
    
    // Get the file content as an array buffer
    const fileBuffer = await response.arrayBuffer();
    
    // Extract filename from path
    const filename = path.split('/').pop() || 'file';
    
    // Create a new response with the file content
    const newResponse = new NextResponse(fileBuffer);
    
    // Set appropriate headers
    newResponse.headers.set('Content-Type', response.headers.get('Content-Type') || 'application/octet-stream');
    newResponse.headers.set('Content-Disposition', `attachment; filename="${filename}"`);
    newResponse.headers.set('Content-Length', response.headers.get('Content-Length') || '');
    
    return newResponse;
  } catch (error) {
    console.error('Error downloading file:', error);
    return NextResponse.json(
      { error: 'Failed to download file' },
      { status: 500 }
    );
  }
} 