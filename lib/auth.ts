// lib/auth.ts
import { SignJWT, jwtVerify } from 'jose';
import { v4 as uuidv4 } from 'uuid';

// Секретный ключ для подписи токена
const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'your-secret-key');

// Функция для генерации JWT токена
export async function generateJWT(userId: string) {
  return await new SignJWT({ userId })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('2h') // Токен будет действителен 2 часа
    .setJti(uuidv4()) // Уникальный идентификатор токена
    .sign(secret);
}

// Функция для проверки JWT токена
export async function verifyJWT(token: string) {
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload; // Если токен валиден, возвращаем полезную нагрузку
  } catch (error) {
    throw new Error('Invalid token');
  }
}
