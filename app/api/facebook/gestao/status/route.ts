import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
    try {
        const { email, object_id, status } = await req.json();
        
        if (!email || !object_id || !status) return NextResponse.json({ error: "Parâmetros inválidos." }, { status: 400 });

        const user = await prisma.user.findUnique({ where: { email }, include: { accounts: true } });
        const fbAccount = user?.accounts?.find((a: any) => a.provider === 'facebook');
        const accessToken = fbAccount?.access_token || (user as any)?.meta_token;

        if (!accessToken) return NextResponse.json({ error: "Token não localizado." }, { status: 404 });

        const fbUrl = `https://graph.facebook.com/v19.0/${object_id}?status=${status}&access_token=${accessToken}`;

        const fbRes = await fetch(fbUrl, { method: "POST" });
        const result = await fbRes.json();

        if (!fbRes.ok) return NextResponse.json({ error: result.error?.message || "Erro ao alterar status" }, { status: fbRes.status });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message || "Erro interno." }, { status: 500 });
    }
}