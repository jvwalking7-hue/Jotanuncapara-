import { NextRequest, NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const s3Client = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID as string,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY as string,
  },
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { filename, contentType } = body;

    if (!filename || !contentType) {
      return NextResponse.json({ error: "Nome do arquivo ou tipo ausente." }, { status: 400 });
    }

    // Cria um nome único para o arquivo
    const uniqueFilename = `${Date.now()}-${filename.replace(/\s/g, "_")}`;

    const command = new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: uniqueFilename,
      ContentType: contentType,
    });

    // Gera o "Bilhete VIP" que permite o upload direto e expira em 1 hora
    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
    
    // O link público onde o vídeo vai morar depois do upload
    const publicUrl = `${process.env.R2_PUBLIC_URL}/${uniqueFilename}`;

    return NextResponse.json({ success: true, signedUrl, publicUrl });
  } catch (error) {
    console.error("Erro ao gerar URL assinada:", error);
    return NextResponse.json({ error: "Falha ao gerar URL de upload." }, { status: 500 });
  }
}