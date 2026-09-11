import { NextRequest, NextResponse } from 'next/server';
import { buildUserContext } from '@/lib/memory/context';
import { auth } from '@/lib/auth';

export async function GET(_req: NextRequest) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const context = await buildUserContext(session.user.id);

    return NextResponse.json(context);
}
