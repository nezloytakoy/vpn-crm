import { NextResponse } from 'next/server';
import { generateToken } from '../../../../lib/auth';
import bcrypt from 'bcrypt';
import prisma from '../../../../lib/server/prisma';
import { NextRequest } from 'next/server';

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();


  const user = await prisma.user.findUnique({ where: { email } });

  if (!user || !(await bcrypt.compare(password, user.password))) {
    return NextResponse.json({ message: 'Invalid credentials' }, { status: 401 });
  }


  const token = await generateToken(user);


  return NextResponse.json({ token });
}
