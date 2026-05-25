import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET: List user memories with filters
export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const type = searchParams.get('type');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const minConfidence = parseFloat(searchParams.get('minConfidence') || '0.3');

    if (!userId) {
        return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    const where: any = {
        userId,
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
    const body = await req.json();
    const { memoryId, userId } = body;

    if (!memoryId || !userId) {
        return NextResponse.json(
            { error: 'memoryId and userId are required' },
            { status: 400 }
        );
    }

    await prisma.userMemory.deleteMany({
        where: { id: memoryId, userId },
    });

    return NextResponse.json({ status: 'deleted' });
}