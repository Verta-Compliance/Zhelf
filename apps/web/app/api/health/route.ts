import { NextResponse } from 'next/server';
import { checkDatabase } from '../../../src/server/database';

export async function GET() {
  try {
    await checkDatabase();
    return NextResponse.json({ status: 'ok', services: ['database'] });
  } catch {
    return NextResponse.json({ status: 'unavailable', services: [] }, { status: 503 });
  }
}
