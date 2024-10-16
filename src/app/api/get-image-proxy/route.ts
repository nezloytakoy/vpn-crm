import { NextResponse } from 'next/server';
import fetch from 'node-fetch';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');

  console.log(url)

  if (!url) {
    return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });
  }

  try {
    
    const response = await fetch(url);

    if (!response.ok) {
      return NextResponse.json({ error: 'Ошибка загрузки изображения' }, { status: 500 });
    }

    
    const imageBuffer = await response.arrayBuffer();

    
    return new Response(imageBuffer, {
      headers: {
        'Content-Type': response.headers.get('content-type') || 'image/jpeg',
        'Cache-Control': 'public, max-age=86400',
      },
    });
  } catch (error) {
    console.error('Ошибка при проксировании изображения:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}
