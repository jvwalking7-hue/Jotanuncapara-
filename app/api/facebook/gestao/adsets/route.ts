import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
    try {
        const { email, campaign_id } = await req.json();
        
        if (!email || !campaign_id) return NextResponse.json({ error: "E-mail e Campanha obrigatórios." }, { status: 400 });

        const user = await prisma.user.findUnique({ where: { email }, include: { accounts: true } });
        const fbAccount = user?.accounts?.find((a: any) => a.provider === 'facebook');
        const accessToken = fbAccount?.access_token || (user as any)?.meta_token;

        if (!accessToken) return NextResponse.json({ error: "Token não localizado." }, { status: 404 });

        const fields = 'id,name,status,configured_status,daily_budget,lifetime_budget';
        const fbUrl = `https://graph.facebook.com/v19.0/${campaign_id}/adsets?fields=${fields}&access_token=${accessToken}&limit=50`;

        const fbRes = await fetch(fbUrl, { method: "GET" });
        const adSetsData = await fbRes.json();

        if (!fbRes.ok) return NextResponse.json({ error: adSetsData.error?.message || "Erro na Meta API" }, { status: fbRes.status });

        return NextResponse.json({ data: adSetsData.data || [] });
    } catch (error: any) {
        return NextResponse.json({ error: error.message || "Erro interno." }, { status: 500 });
    }
}