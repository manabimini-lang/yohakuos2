import { NextRequest, NextResponse } from 'next/server';
import { buildUserContext } from '@/lib/memory/context';

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
        return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    const context = await buildUserContext(userId);

    return NextResponse.json(context);
}