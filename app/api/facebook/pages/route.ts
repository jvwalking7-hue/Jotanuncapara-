import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json({ error: "Email não fornecido." }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: { accounts: true },
    });

    if (!user) {
      return NextResponse.json({ error: "Usuário não encontrado no banco de dados." }, { status: 404 });
    }

    const facebookAccount = user.accounts.find(acc => acc.provider === "facebook");

    if (!facebookAccount || !facebookAccount.access_token) {
      return NextResponse.json({ error: "Token do Facebook não encontrado." }, { status: 400 });
    }

    const token = facebookAccount.access_token;
    const todasAsPaginas: any[] = [];

    // ─── 1. Páginas vinculadas diretamente à conta pessoal ───────────────────
    const pessoalRes = await fetch(
      `https://graph.facebook.com/v20.0/me/accounts` +
      `?fields=id,name,access_token,category` +
      `&access_token=${token}`
    );
    const pessoalData = await pessoalRes.json();

    if (pessoalData.error) {
      console.error("🚨 Erro ao buscar páginas pessoais:", pessoalData.error.message);
    } else {
      const paginas = (pessoalData.data || []).map((p: any) => ({
        ...p,
        origem: "pessoal",
      }));
      todasAsPaginas.push(...paginas);
    }

    // ─── 2. Páginas dentro de Business Managers ──────────────────────────────
    const bmsRes = await fetch(
      `https://graph.facebook.com/v20.0/me/businesses` +
      `?fields=id,name` +
      `&access_token=${token}`
    );
    const bmsData = await bmsRes.json();

    if (bmsData.error) {
      console.error("🚨 Erro ao buscar Business Managers:", bmsData.error.message);
    } else {
      const businesses = bmsData.data || [];

      for (const bm of businesses) {
        const bmPagesRes = await fetch(
          `https://graph.facebook.com/v20.0/${bm.id}/owned_pages` +
          `?fields=id,name,access_token,category` +
          `&access_token=${token}`
        );
        const bmPagesData = await bmPagesRes.json();

        if (bmPagesData.error) {
          console.error(`🚨 Erro ao buscar páginas do BM ${bm.name}:`, bmPagesData.error.message);
          continue;
        }

        const paginas = (bmPagesData.data || []).map((p: any) => ({
          ...p,
          origem: "business_manager",
          business_name: bm.name,
          business_id: bm.id,
        }));

        todasAsPaginas.push(...paginas);
      }
    }

    // ─── 3. Remove duplicatas (mesma página pode aparecer nos dois lugares) ──
    const unicas = Array.from(
      new Map(todasAsPaginas.map(p => [p.id, p])).values()
    );

    console.log(`✅ Total de páginas encontradas: ${unicas.length}`);

    return NextResponse.json({ paginas: unicas });

  } catch (error) {
    console.error("🚨 Erro interno no Backend:", error);
    return NextResponse.json({ error: "Erro interno do servidor." }, { status: 500 });
  }
}