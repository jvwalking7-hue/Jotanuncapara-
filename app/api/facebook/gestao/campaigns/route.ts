import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
    try {
        const { email, ad_account_id } = await req.json();
        
        if (!email || !ad_account_id) {
            return NextResponse.json({ error: "E-mail e Conta são obrigatórios." }, { status: 400 });
        }

        const user = await prisma.user.findUnique({
            where: { email },
            include: { accounts: true }
        });

        const fbAccount = user?.accounts?.find((a: any) => a.provider === 'facebook');
        const accessToken = fbAccount?.access_token || (user as any)?.meta_token;

        if (!accessToken) {
            return NextResponse.json({ error: "Usuário não possui token da Meta conectado." }, { status: 404 });
        }

        const fields = 'id,name,status,configured_status,objective,buying_type,daily_budget,lifetime_budget';
        const cleanId = ad_account_id.startsWith('act_') ? ad_account_id : `act_${ad_account_id}`;
        
        const fbUrl = `https://graph.facebook.com/v19.0/${cleanId}/campaigns?fields=${fields}&access_token=${accessToken}&limit=50`;
        
        const fbRes = await fetch(fbUrl, { method: "GET" });
        const campaignsData = await fbRes.json();

        if (!fbRes.ok) return NextResponse.json({ error: campaignsData.error?.message || "Erro na Meta API" }, { status: fbRes.status });

        return NextResponse.json({ data: campaignsData.data || [] });
    } catch (error: any) {
        return NextResponse.json({ error: error.message || "Erro interno." }, { status: 500 });
    }
}