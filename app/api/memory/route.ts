import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

// GET: List user memories with filters
export async function GET(req: NextRequest) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type');
    const requestedLimit = Number(searchParams.get('limit') || '50');
    const requestedOffset = Number(searchParams.get('offset') || '0');
    const requestedConfidence = Number(searchParams.get('minConfidence') || '0.3');
    const limit = Number.isFinite(requestedLimit) ? Math.min(100, Math.max(1, Math.floor(requestedLimit))) : 50;
    const offset = Number.isFinite(requestedOffset) ? Math.max(0, Math.floor(requestedOffset)) : 0;
    const minConfidence = Number.isFinite(requestedConfidence) ? Math.min(1, Math.max(0, requestedConfidence)) : 0.3;

    const where: any = {
        userId: session.user.id,
        confidence: { gte: minConfidence },
    };
    if (type) where.type = type;

    const [memories, total] = await Promise.all([
        prisma.userMemory.findMany({
            where,
            orderBy: [{ confidence: 'desc' }, { createdAt: 'desc' }],
            take: limit,
            skip: offset,
            select: {
                id: true,
                type: true,
                category: true,
                title: true,
                content: true,
                confidence: true,
                version: true,
                createdAt: true,
                sourceCardId: true,
            },
        }),
        prisma.userMemory.count({ where }),
    ]);

    return NextResponse.json({ memories, total, limit, offset });
}

// DELETE: Remove a specific memory
export async function DELETE(req: NextRequest) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { memoryId } = body;

    if (!memoryId) {
        return NextResponse.json(
            { error: 'memoryId is required' },
            { status: 400 }
        );
    }

    await prisma.userMemory.deleteMany({
        where: { id: memoryId, userId: session.user.id },
    });

    return NextResponse.json({ status: 'deleted' });
}
