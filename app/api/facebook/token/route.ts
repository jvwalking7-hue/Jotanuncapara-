import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const { email } = await req.json();
    
    // Vai no banco de dados procurar as contas vinculadas a esse email
    const user = await prisma.user.findUnique({ 
      where: { email }, 
      include: { accounts: true } 
    });
    
    // Pega especificamente o crachá (token) do Facebook
    const facebookAccount = user?.accounts.find((acc: any) => acc.provider === "facebook");
    
    if (!facebookAccount?.access_token) {
      return NextResponse.json({ error: "Token não encontrado" }, { status: 400 });
    }
    
    // Devolve o token para o Frontend usar no upload do vídeo!
    return NextResponse.json({ token: facebookAccount.access_token });
  } catch (error) {
    return NextResponse.json({ error: "Erro ao buscar token" }, { status: 500 });
  }
}