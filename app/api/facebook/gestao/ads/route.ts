import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
    try {
        const { email, adset_id } = await req.json();
        
        if (!email || !adset_id) return NextResponse.json({ error: "E-mail e Conjunto obrigatórios." }, { status: 400 });

        const user = await prisma.user.findUnique({ where: { email }, include: { accounts: true } });
        const fbAccount = user?.accounts?.find((a: any) => a.provider === 'facebook');
        const accessToken = fbAccount?.access_token || (user as any)?.meta_token;

        if (!accessToken) return NextResponse.json({ error: "Token não localizado." }, { status: 404 });

        // A MÁGICA ESTÁ AQUI: Adicionamos o thumbnail_url nos campos do creative
        const fields = 'id,name,status,configured_status,creative{id,image_url,thumbnail_url,title,body,video_id}';
        const fbUrl = `https://graph.facebook.com/v19.0/${adset_id}/ads?fields=${fields}&access_token=${accessToken}&limit=50`;

        const fbRes = await fetch(fbUrl, { method: "GET" });
        const adsData = await fbRes.json();

        if (!fbRes.ok) return NextResponse.json({ error: adsData.error?.message || "Erro na Meta API" }, { status: fbRes.status });

        return NextResponse.json({ data: adsData.data || [] });
    } catch (error: any) {
        return NextResponse.json({ error: error.message || "Erro interno." }, { status: 500 });
    }
}