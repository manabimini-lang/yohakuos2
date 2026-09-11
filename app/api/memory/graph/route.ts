import { NextRequest, NextResponse } from 'next/server';
import { getMemoryConstellation } from '@/lib/memory/graph';
import { auth } from '@/lib/auth';

export async function GET(req: NextRequest) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const requestedLimit = Number(searchParams.get('limit') || '50');
    const limit = Number.isFinite(requestedLimit) ? Math.min(100, Math.max(1, Math.floor(requestedLimit))) : 50;
    const graph = await getMemoryConstellation(session.user.id, limit);

    return NextResponse.json(graph);
}
