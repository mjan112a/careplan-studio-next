import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const data = formData.get('data');
    let parsed = null;
    try {
      parsed = data ? JSON.parse(data.toString()) : null;
    } catch (e) {
      parsed = data;
    }
    return new NextResponse(
      `<html><body><h1>Simulation Target</h1><pre>${JSON.stringify(parsed, null, 2)}</pre></body></html>`,
      {
        status: 200,
        headers: { 'Content-Type': 'text/html' },
      }
    );
  } catch (error) {
    return new NextResponse('Error reading POST data', { status: 500 });
  }
} 