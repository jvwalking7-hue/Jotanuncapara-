import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email } = body;

    if (!email) return NextResponse.json({ error: "Email não fornecido." }, { status: 400 });

    const user = await prisma.user.findUnique({
      where: { email },
      include: { accounts: true },
    });

    const facebookAccount = user?.accounts.find(acc => acc.provider === "facebook");
    if (!facebookAccount?.access_token) {
      return NextResponse.json({ error: "Token do Facebook não encontrado." }, { status: 401 });
    }

    const token = facebookAccount.access_token;

    // ─── Estrutura de BMs com CAs e páginas ──────────────────────────────────
    // bms: [ { id, name, contas: [ { id, name, status, paginas: [...] } ] } ]
    const bms: any[] = [];
    const contasAvulsas: any[] = [];

    // ── Helper: busca páginas de uma CA ──────────────────────────────────────
    const buscarPaginasCA = async (caId: string): Promise<any[]> => {
      try {
        // Páginas vinculadas à CA via promoted_objects / assigned pages
        const res = await fetch(
          `https://graph.facebook.com/v20.0/${caId}/assigned_pages` +
          `?fields=id,name,access_token&limit=50&access_token=${token}`
        );
        const data = await res.json();
        if (data.data && data.data.length > 0) return data.data;
      } catch {}

      // Fallback: páginas do usuário
      try {
        const res = await fetch(
          `https://graph.facebook.com/v20.0/me/accounts` +
          `?fields=id,name,access_token&limit=50&access_token=${token}`
        );
        const data = await res.json();
        return data.data || [];
      } catch {}
      return [];
    };

    // ── 1. Contas pessoais (sem BM) ───────────────────────────────────────────
    const pessoalRes = await fetch(
      `https://graph.facebook.com/v20.0/me/adaccounts` +
      `?fields=id,name,account_status,currency,business&limit=50&access_token=${token}`
    );
    const pessoalData = await pessoalRes.json();

    if (!pessoalData.error) {
      for (const c of pessoalData.data || []) {
        // Só inclui como "avulsa" se não tiver BM associada
        if (!c.business?.id) {
          const paginas = await buscarPaginasCA(c.id);
          contasAvulsas.push({
            id:      c.id,
            name:    c.name || c.id,
            status:  c.account_status,
            paginas,
          });
        }
      }
    }

    // ── 2. BMs e suas CAs ─────────────────────────────────────────────────────
    const bmsRes = await fetch(
      `https://graph.facebook.com/v20.0/me/businesses` +
      `?fields=id,name&limit=50&access_token=${token}`
    );
    const bmsData = await bmsRes.json();

    for (const bm of bmsData.data || []) {
      const bmEntry: any = { id: bm.id, name: bm.name, contas: [] };

      const caRes = await fetch(
        `https://graph.facebook.com/v20.0/${bm.id}/owned_ad_accounts` +
        `?fields=id,name,account_status,currency&limit=50&access_token=${token}`
      );
      const caData = await caRes.json();

      for (const ca of caData.data || []) {
        const paginas = await buscarPaginasCA(ca.id);
        bmEntry.contas.push({
          id:      ca.id,
          name:    ca.name || ca.id,
          status:  ca.account_status,
          paginas,
        });
      }

      // Ordena: ativas primeiro
      bmEntry.contas.sort((a: any, b: any) => (a.status === 1 ? 0 : 1) - (b.status === 1 ? 0 : 1));
      bms.push(bmEntry);
    }

    // ── 3. Monta também lista flat de accounts (para compatibilidade) ─────────
    const todasFlat: any[] = [];
    for (const bm of bms) {
      for (const ca of bm.contas) {
        todasFlat.push({ ...ca, business_name: bm.name, business_id: bm.id });
      }
    }
    for (const ca of contasAvulsas) {
      todasFlat.push({ ...ca, business_name: null, business_id: null });
    }

    console.log(`✅ BMs: ${bms.length} | CAs em BMs: ${todasFlat.length} | Avulsas: ${contasAvulsas.length}`);

    return NextResponse.json({
      bms,
      contasAvulsas,
      accounts: todasFlat, // compatibilidade com código antigo
    });

  } catch (error) {
    console.error("🚨 Erro interno:", error);
    return NextResponse.json({ error: "Erro interno do servidor." }, { status: 500 });
  }
}