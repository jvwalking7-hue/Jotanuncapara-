import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";


export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get("email");
  if (!email) return NextResponse.json({ error: "Email obrigatório" }, { status: 400 });

  const user = await prisma.user.findUnique({
    where: { email },
    include: { workspaces: { include: { campanhas: true }, orderBy: { atualizadoEm: "desc" } } },
  });

  return NextResponse.json({ workspaces: user?.workspaces ?? [] });
}

export async function POST(req: NextRequest) {
  const { email, workspace } = await req.json();
  if (!email) return NextResponse.json({ error: "Email obrigatório" }, { status: 400 });

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });

  const data = {
    nome: workspace.nome,
    nicho: workspace.nicho,
    oferta: workspace.oferta,
    status: workspace.status,
    emoji: workspace.emoji,
    link: workspace.link,
    linkExibicao: workspace.linkExibicao,
    parametrosUtm: workspace.parametrosUtm,
    pixelId: workspace.pixelId,
    paises: JSON.stringify(workspace.paises),
    idadeMin: workspace.idadeMin,
    idadeMax: workspace.idadeMax,
    genero: workspace.genero,
  };

  const ws = workspace.id
    ? await prisma.workspace.update({ where: { id: workspace.id }, data })
    : await prisma.workspace.create({ data: { ...data, userId: user.id } });

  return NextResponse.json({ workspace: ws });
}

export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID obrigatório" }, { status: 400 });

  await prisma.workspace.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}