import { NextRequest, NextResponse } from 'next/server';
import { getMemoryGraph } from '@/lib/memory/graph';

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const limit = parseInt(searchParams.get('limit') || '50');

    if (!userId) {
        return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    const graph = await getMemoryGraph(userId, limit);

    return NextResponse.json(graph);
}