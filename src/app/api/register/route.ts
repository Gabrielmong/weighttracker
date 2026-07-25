import { NextRequest, NextResponse } from 'next/server';
import { registerUser } from '@/features/auth/registerUser';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { displayName, password, gender, birthdate, weightGoal } = body;

  if (!displayName || !password || !gender || !birthdate || !weightGoal) {
    return NextResponse.json({ error: 'Todos los campos son obligatorios.' }, { status: 400 });
  }

  try {
    const result = await registerUser({ displayName, password, gender, birthdate, weightGoal });
    return NextResponse.json({ id: result.id }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Ese nombre ya está en uso.' }, { status: 409 });
  }
}
