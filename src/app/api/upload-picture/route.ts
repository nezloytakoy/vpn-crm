import { NextResponse } from 'next/server';
import { put } from '@vercel/blob';

export async function POST(req: Request) {
  const formData = await req.formData();
  const file = formData.get('file') as File;

  if (!file) {
    return NextResponse.json({ error: 'Файл не загружен' }, { status: 400 });
  }

  try {
    // Используем метод put для загрузки файла
    const { url } = await put(`uploads/${file.name}`, file.stream(), {
      access: 'public', // Уровень доступа к файлу
    });

    return NextResponse.json({
      message: 'Файл успешно загружен',
      url, // URL загруженного файла
    });
  } catch (error) {
    console.error('Ошибка загрузки файла:', error);
    return NextResponse.json({ error: 'Ошибка загрузки файла' }, { status: 500 });
  }
}
