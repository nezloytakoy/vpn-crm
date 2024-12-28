import { NextResponse } from 'next/server';

// Если используете Node.js < 18 и у вас нет глобального fetch, 
// можно раскомментировать следующую строку:
// import fetch from 'node-fetch';

export const revalidate = 1;

export async function GET(request: Request) {
    // Разбираем query-параметры
    const { searchParams } = new URL(request.url);
    const url = searchParams.get('url');

    console.log('Proxying image from URL:', url);

    // Проверяем, что нам передали "url"
    if (!url) {
        return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });
    }

    try {
        // Делаем запрос к исходному URL
        const response = await fetch(url);

        if (!response.ok) {
            return NextResponse.json({ error: 'Ошибка загрузки изображения' }, { status: 500 });
        }

        // Считываем бинарные данные
        const imageBuffer = await response.arrayBuffer();

        // Возвращаем "сырое" изображение
        return new Response(imageBuffer, {
            headers: {
                // Подставляем заголовок content-type из исходного ответа, 
                // если там есть что-то вроде "image/jpeg" или "image/png".
                'Content-Type': response.headers.get('content-type') || 'image/jpeg',
                // Можете добавить "Cache-Control" или другие заголовки по желанию
                'Cache-Control': 'public, max-age=86400',
            },
        });
    } catch (error) {
        console.error('Ошибка при проксировании изображения:', error);
        return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
    }
}
