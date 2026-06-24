import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Função auxiliar para evitar Rate Limit da Meta
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Nova função: Manda a Meta baixar o vídeo direto da Cloudflare R2!
const baixarVideoDaCloudflareParaMeta = async (fileUrl: string, actId: string, token: string, titulo: string) => {
  const uploadForm = new FormData();
  uploadForm.append("access_token", token);
  uploadForm.append("file_url", fileUrl); // A mágica tá aqui!
  uploadForm.append("title", titulo);

  const res = await fetch(`https://graph.facebook.com/v20.0/${actId}/advideos`, {
    method: "POST",
    body: uploadForm
  });
  
  const data = await res.json();
  if (data.error) throw new Error(`Erro ao subir vídeo via URL na Meta: ${data.error.message}`);
  
  return data.id; // Retorna o ID do vídeo dentro da Meta
};

// Função: Fica vigiando até a Meta terminar de renderizar o vídeo e pegar a miniatura
const aguardarVideoPronto = async (videoId: string, token: string) => {
  let pronto = false;
  let tentativas = 0;
  let pictureUrl = "";

  while (!pronto && tentativas < 25) { 
    const statusRes = await fetch(`https://graph.facebook.com/v20.0/${videoId}?fields=status,picture&access_token=${token}`);
    const statusData = await statusRes.json();
    
    const status = statusData.status?.video_status;
    if (status === "ready" || status === "published") {
      pronto = true;
      pictureUrl = statusData.picture; 
    } else if (status === "error") {
      throw new Error("A Meta recusou o formato do vídeo ou ele está corrompido.");
    } else {
      await delay(3000); 
      tentativas++;
    }
  }
  if (!pronto) throw new Error("Tempo limite excedido: A Meta demorou demais para processar o vídeo.");
  
  return pictureUrl; 
};

type CASelecionada = { caId: string; caName: string; bmName: string; bmId: string; paginaId: string };
type CriativoUrl = { url: string; type: string; name: string };

export async function POST(req: Request) {
  try {
    const formData = await req.formData();

    const email               = formData.get("email") as string;
    const objetivo            = formData.get("objetivo") as string;
    const tipoCampanha        = formData.get("tipoCampanha") as string;
    const orcamento           = formData.get("orcamento") as string;
    const estrategiaLance     = formData.get("estrategiaLance") as string;
    const valorLance          = formData.get("valorLance") as string;
    const dataInicio          = formData.get("dataInicio") as string;
    const link                = formData.get("link") as string;
    const pixelId             = formData.get("pixelId") as string;
    const paises              = JSON.parse(formData.get("paises") as string) as string[];
    const idadeMin            = formData.get("idadeMin") as string;
    const idadeMax            = formData.get("idadeMax") as string;
    const genero              = formData.get("genero") as string;
    const textoAnuncio        = formData.get("textoAnuncio") as string;
    const titulo              = formData.get("titulo") as string;
    const descricao           = formData.get("descricao") as string;
    const callToAction        = formData.get("callToAction") as string;
    const quantidadeCampanhas = Number(formData.get("quantidadeCampanhas"));
    const quantidadeConjuntos = Number(formData.get("quantidadeConjuntos")) || 1;
    
    // PEGANDO OS LINKS DA CLOUDFLARE ENVIADOS PELO FRONTEND
    const criativosUrlsRaw    = formData.get("criativosUrls") as string;
    const criativosUrls: CriativoUrl[] = criativosUrlsRaw ? JSON.parse(criativosUrlsRaw) : [];

    const nomeCampanha  = formData.get("nomeCampanha") as string;
    const nomeConjunto  = formData.get("nomeConjunto") as string;
    const nomeAnuncio   = formData.get("nomeAnuncio") as string;
    const parametrosUtm = formData.get("parametrosUtm") as string;

    const casSelecionadasRaw = formData.get("casSelecionadas") as string;
    const casSelecionadas: CASelecionada[] = casSelecionadasRaw ? JSON.parse(casSelecionadasRaw) : [];

    const modoConjuntos      = (formData.get("modoConjuntos") as string) || "criar";
    const quantidadeCopias   = Number(formData.get("quantidadeCopias")) || 1;
    const preservarReacoes   = formData.get("preservarReacoes") === "true";
    const localConversao     = (formData.get("localConversao") as string) || "WEBSITE";
    const advantagePlus      = formData.get("advantagePlus")      === "true";
    const advantageAudience  = formData.get("advantageAudience")  === "true";
    const advantageBudget    = formData.get("advantageBudget")    === "true";
    const advantageCreative  = formData.get("advantageCreative")  === "true";
    const advantagePlacement = formData.get("advantagePlacement") === "true";

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const send = (tipo: string, mensagem: string, pct?: number) => {
          const data = JSON.stringify({ tipo, mensagem, pct });
          controller.enqueue(encoder.encode(`data: ${data}\n\n`));
        };

        try {
          const faltando: string[] = [];
          if (!email) faltando.push("email (sessão expirada — faça login novamente)");
          if (casSelecionadas.length === 0) faltando.push("conta de anúncios selecionada (Passo 1)");
          if (criativosUrls.length === 0) faltando.push("criativo — imagem ou vídeo (Passo 4)");

          if (faltando.length > 0) {
            throw new Error(`Campos obrigatórios faltando: ${faltando.join(", ")}.`);
          }

          const semPagina = casSelecionadas.find(ca => !ca.paginaId);
          if (semPagina) {
            throw new Error(`A conta "${semPagina.caName}" está sem Página do Facebook selecionada. Volte ao Passo 1 e escolha uma página para ela.`);
          }

          const linkLimpo = (link || "").trim();
          if (!linkLimpo) {
            throw new Error("O campo 'Link de destino' está vazio. Preencha uma URL válida no Passo 2.");
          }

          let urlValida: URL;
          try {
            const comProtocolo = linkLimpo.startsWith("http://") || linkLimpo.startsWith("https://") ? linkLimpo : `https://${linkLimpo}`;
            urlValida = new URL(comProtocolo);
          } catch {
            throw new Error(`O link "${linkLimpo}" não é uma URL válida.`);
          }

          const dominiosProibidos = ["facebook.com", "www.facebook.com", "google.com", "www.google.com"];
          if (dominiosProibidos.includes(urlValida.hostname)) {
            throw new Error(`O domínio "${urlValida.hostname}" não pode ser usado como destino.`);
          }

          send("info", "Autenticando usuário e permissões da Meta...", 2);

          const user = await prisma.user.findUnique({ where: { email }, include: { accounts: true } });
          const facebookAccount = user?.accounts.find(acc => acc.provider === "facebook");
          if (!facebookAccount?.access_token) {
            throw new Error("Token do Facebook não encontrado.");
          }

          const userToken = facebookAccount.access_token;

          const optimizationGoalMap: Record<string, string> = {
            OUTCOME_SALES:      localConversao === "PHONE_CALL" ? "LINK_CLICKS" : ["MESSENGER","WHATSAPP","INSTAGRAM_DIRECT"].includes(localConversao) ? "CONVERSATIONS" : "OFFSITE_CONVERSIONS",
            OUTCOME_TRAFFIC:    ["PHONE_CALL","MESSENGER","WHATSAPP"].includes(localConversao) ? "CONVERSATIONS" : "LINK_CLICKS",
            OUTCOME_LEADS:      "LEAD_GENERATION",
            OUTCOME_ENGAGEMENT: "POST_ENGAGEMENT",
            OUTCOME_AWARENESS:  "REACH",
          };
          const genderMap: Record<string, number[]> = { todos: [1, 2], homens: [1], mulheres: [2] };
          const optimizationGoal = optimizationGoalMap[objetivo] ?? "LINK_CLICKS";

          const bidStrategyDe = (estrat: string) => estrat === "LOWEST_COST" ? "LOWEST_COST_WITHOUT_CAP" : estrat === "MINIMUM_ROAS" ? "MINIMUM_ROAS" : "LOWEST_COST_WITH_BID_CAP";

          let finalLink = urlValida.toString();
          if (parametrosUtm) {
            finalLink += (finalLink.includes("?") ? "&" : "?") + (parametrosUtm.startsWith("?") ? parametrosUtm.slice(1) : parametrosUtm);
          }

          let pctGeral = 5;
          const pctPorConta = 90 / casSelecionadas.length;

          const contasComErro: { nome: string; erro: string }[] = [];
          let contasComSucesso = 0;

          // ─── INÍCIO DO LOOP DE CONTAS ─────────────────
          for (let idxConta = 0; idxConta < casSelecionadas.length; idxConta++) {
            const conta = casSelecionadas[idxConta];
            const actIdConta = conta.caId.startsWith("act_") ? conta.caId : `act_${conta.caId}`;
            const pctAtualConta = pctGeral + (idxConta * pctPorConta);

            if (idxConta > 0) {
              send("info", `Aguardando 5 segundos por segurança antes de iniciar a próxima conta...`, pctAtualConta - 2);
              await delay(5000);
            }

            send("conta_inicio", `Acessando conta ${actIdConta} (${conta.caName})`, pctAtualConta);

            await delay(1000); 

            try {
              let paginaToken = userToken;
              try {
                const pageTokenRes  = await fetch(`https://graph.facebook.com/v20.0/${conta.paginaId}?fields=access_token&access_token=${userToken}`);
                const pageTokenData = await pageTokenRes.json();
                if (pageTokenData.access_token) paginaToken = pageTokenData.access_token;
              } catch (e) {
                console.warn("Sem page token específico, usando o do usuário.");
              }

              send("info", `Processando criativos na nuvem da Cloudflare...`, pctAtualConta + 2);
              
              type CriativoUpload = { tipo: "imagem" | "video"; hash?: string; videoId?: string; imageUrl?: string; nome: string };
              const criativosProcessados: CriativoUpload[] = [];

              for (const midia of criativosUrls) {
                if (midia.type === "image") {
                  send("info", `Enviando link da imagem "${midia.name}" para a Meta...`, pctAtualConta + 3);
                  // Meta pode baixar imagens via URL também (usando o campo "url" em vez de "bytes")
                  const uploadForm = new FormData();
                  uploadForm.append("url", midia.url);
                  uploadForm.append("access_token", userToken);

                  const uploadRes  = await fetch(`https://graph.facebook.com/v20.0/${actIdConta}/adimages`, { method: "POST", body: uploadForm });
                  const uploadData = await uploadRes.json();
                  
                  if (uploadData.error) {
                    throw new Error(`A Meta recusou a imagem: ${uploadData.error.message}`);
                  }
                  
                  // Como o upload via URL retorna o hash num array, pegamos o primeiro item (ou chave)
                  const hashGerado = uploadData.images ? uploadData.images[Object.keys(uploadData.images)[0]].hash : null;
                  
                  if(!hashGerado) throw new Error("Erro desconhecido ao pegar hash da imagem.");
                  
                  criativosProcessados.push({ tipo: "imagem", hash: hashGerado, nome: midia.name });

                } else if (midia.type === "video") {
                  send("info", `Mandando a Meta baixar o vídeo "${midia.name}" na velocidade da luz (Modo Nuvem)...`, pctAtualConta + 4);
                  
                  const videoId = await baixarVideoDaCloudflareParaMeta(midia.url, actIdConta, userToken, midia.name);
                  
                  send("info", `Aguardando a Meta renderizar o vídeo "${midia.name}" e gerar a miniatura...`, pctAtualConta + 5);
                  const picUrl = await aguardarVideoPronto(videoId, userToken);
                  
                  criativosProcessados.push({ tipo: "video", videoId: videoId, imageUrl: picUrl, nome: midia.name });
                }
                
                await delay(2000);
              }

              for (let c = 0; c < quantidadeCampanhas; c++) {
                const sufixoCamp = quantidadeCampanhas > 1 ? ` #${c + 1}` : "";
                const nameCamp   = nomeCampanha ? `${nomeCampanha}${sufixoCamp}` : `AutoAds — ${objetivo}${sufixoCamp}`;

                send("info", `Estruturando campanha: ${nameCamp}...`, pctAtualConta + 10);
                const campanhaBody: Record<string, any> = {
                  name: nameCamp,
                  objective: advantagePlus ? "OUTCOME_SALES" : objetivo,
                  buying_type: "AUCTION",
                  status: "PAUSED",
                  special_ad_categories: [],
                  access_token: userToken,
                };

                if (advantagePlus) campanhaBody.smart_promotion_type = "SMART_APP_PROMOTION";
                if (tipoCampanha === "CBO") {
                  campanhaBody.daily_budget = Math.round(Number(orcamento) * 100);
                  campanhaBody.bid_strategy = advantageBudget ? "LOWEST_COST_WITHOUT_CAP" : bidStrategyDe(estrategiaLance);
                }

                const campanhaRes  = await fetch(`https://graph.facebook.com/v20.0/${actIdConta}/campaigns`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(campanhaBody) });
                const campanhaData = await campanhaRes.json();
                
                if (campanhaData.error) {
                  throw new Error(`Erro campanha: ${campanhaData.error.message}`);
                }
                
                const campanhaId = campanhaData.id;

                send("campanha_criada", `Campanha criada com ID ${campanhaId}`, pctAtualConta + 15);
                await delay(3000); 

                const nameAdSetBase = (nomeConjunto ? `${nomeConjunto}${sufixoCamp}` : `Conjunto${sufixoCamp}`);
                const adSetBody: Record<string, any> = {
                  name: nameAdSetBase,
                  campaign_id: campanhaId,
                  billing_event: "IMPRESSIONS",
                  optimization_goal: optimizationGoal,
                  destination_type: (objetivo === "OUTCOME_SALES" || objetivo === "OUTCOME_TRAFFIC" || objetivo === "OUTCOME_LEADS") ? localConversao : undefined,
                  dsa_beneficiary: conta.caName, 
                  dsa_payor: conta.caName,       
                  targeting: {
                    age_min: Number(idadeMin),
                    age_max: Number(idadeMax),
                    ...(advantageAudience ? {} : { genders: genderMap[genero] ?? [1, 2], geo_locations: { countries: paises } }),
                    ...(advantagePlacement ? {} : { publisher_platforms: ["facebook", "instagram"], facebook_positions: ["feed"], instagram_positions: ["stream"] }),
                    targeting_automation: { advantage_audience: advantageAudience ? 1 : 0 },
                  },
                  status: "PAUSED",
                  access_token: userToken,
                };

                if (dataInicio) {
                  adSetBody.start_time = new Date(dataInicio).toISOString();
                }
                if (pixelId && (objetivo === "OUTCOME_SALES" || objetivo === "OUTCOME_LEADS")) {
                  adSetBody.promoted_object = { pixel_id: pixelId, custom_event_type: objetivo === "OUTCOME_SALES" ? "PURCHASE" : "LEAD" };
                }
                if (tipoCampanha === "ABO") {
                  adSetBody.daily_budget = Math.round(Number(orcamento) * 100);
                  adSetBody.bid_strategy = advantageBudget ? "LOWEST_COST_WITHOUT_CAP" : bidStrategyDe(estrategiaLance);
                }
                if (estrategiaLance !== "LOWEST_COST" && valorLance) {
                  if (estrategiaLance === "MINIMUM_ROAS") adSetBody.roas_average_floor = Number(valorLance);
                  else adSetBody.bid_amount = Math.round(Number(valorLance) * 100);
                }

                const adSetRes  = await fetch(`https://graph.facebook.com/v20.0/${actIdConta}/adsets`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(adSetBody) });
                const adSetData = await adSetRes.json();
                
                if (adSetData.error) {
                  const e = adSetData.error;
                  const partes = [e.message, e.error_user_title, e.error_user_msg].filter(Boolean);
                  throw new Error(`Erro conjunto: ${partes.join(" — ")}`);
                }
                
                const adSetIdBase = adSetData.id;
                await delay(3000); 

                const criarAnunciosNoConjunto = async (adSetId: string, sufixoConj: string) => {
                  for (let i = 0; i < criativosProcessados.length; i++) {
                    const criativo = criativosProcessados[i];
                    const nomeBase = nomeAnuncio || "AD";
                    const nameAd   = `${nomeBase} ${String(i + 1).padStart(2, "0")}`;

                    const storySpec = criativo.tipo === "video"
                      ? { page_id: conta.paginaId, video_data: { image_url: criativo.imageUrl, video_id: criativo.videoId, message: textoAnuncio || undefined, call_to_action: { type: callToAction, value: { link: finalLink } }, ...(titulo ? { title: titulo } : {}), ...(descricao ? { link_description: descricao } : {}) } }
                      : { page_id: conta.paginaId, link_data: { image_hash: criativo.hash, link: finalLink, message: textoAnuncio || undefined, call_to_action: { type: callToAction, value: { link: finalLink } }, ...(titulo ? { name: titulo } : {}), ...(descricao ? { description: descricao } : {}) } };

                    const creativeBody: Record<string, any> = {
                      name: `Criativo — ${nameAd}`,
                      object_story_spec: storySpec,
                      ...(advantageCreative ? { degrees_of_freedom_spec: { creative_features_spec: { standard_enhancements: { enroll_status: "OPT_IN" } } } } : {}),
                      access_token: paginaToken,
                    };

                    const creativeRes  = await fetch(`https://graph.facebook.com/v20.0/${actIdConta}/adcreatives`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(creativeBody) });
                    const creativeData = await creativeRes.json();
                    
                    if (creativeData.error) {
                      const e = creativeData.error;
                      const partes = [e.message, e.error_user_title, e.error_user_msg, e.error_subcode ? `subcode ${e.error_subcode}` : null].filter(Boolean);
                      throw new Error(`Erro criativo: ${partes.join(" — ")}`);
                    }

                    const adBody = { name: nameAd, adset_id: adSetId, creative: { creative_id: creativeData.id }, status: "PAUSED", access_token: userToken };
                    const adRes  = await fetch(`https://graph.facebook.com/v20.0/${actIdConta}/ads`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(adBody) });
                    const adData = await adRes.json();
                    
                    if (adData.error) {
                      const e = adData.error;
                      const partes = [e.message, e.error_user_title, e.error_user_msg].filter(Boolean);
                      throw new Error(`Erro anúncio: ${partes.join(" — ")}`);
                    }

                    send("anuncio_criado", `Anúncio vinculado: ${nameAd}`, pctAtualConta + 20);
                    await delay(3000); 
                  }
                };

                await criarAnunciosNoConjunto(adSetIdBase, "");

                if (modoConjuntos === "duplicar_ad" && quantidadeCopias > 1) {
                  send("info", "Duplicando anúncios no conjunto (Prova Social)...", pctAtualConta + 25);
                  const adsRes = await fetch(`https://graph.facebook.com/v20.0/${adSetIdBase}/ads?fields=id,name&access_token=${userToken}`);
                  const adsData = await adsRes.json();
                  const adsBase: any[] = adsData.data || [];

                  for (const ad of adsBase) {
                    for (let cp = 1; cp < quantidadeCopias; cp++) {
                      const copyBody: Record<string, any> = {
                        adset_id: adSetIdBase, status_option: "PAUSED",
                        ...(preservarReacoes ? { rename_options: { rename_strategy: "KEEP_EXISTING_NAME" } } : {}),
                        access_token: userToken,
                      };
                      const copyRes = await fetch(`https://graph.facebook.com/v20.0/${ad.id}/copies`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(copyBody) });
                      const copyData = await copyRes.json();
                      if (copyData.error) throw new Error(`Erro ao duplicar anúncio: ${copyData.error.message}`);
                      await delay(3000);
                    }
                  }
                } else if (quantidadeConjuntos > 1) {
                  send("info", `Estruturando ${quantidadeConjuntos - 1} conjunto(s) adicional(is)...`, pctAtualConta + 25);
                  
                  for (let s = 1; s < quantidadeConjuntos; s++) {
                    const novoAdSetBody = { ...adSetBody, name: nameAdSetBase + ` C${s + 1}` };
                    const novoAdSetRes = await fetch(`https://graph.facebook.com/v20.0/${actIdConta}/adsets`, { 
                      method: "POST", 
                      headers: { "Content-Type": "application/json" }, 
                      body: JSON.stringify(novoAdSetBody) 
                    });
                    const novoAdSetData = await novoAdSetRes.json();
                    
                    if (novoAdSetData.error) {
                      const e = novoAdSetData.error;
                      const partes = [e.message, e.error_user_title, e.error_user_msg].filter(Boolean);
                      throw new Error(`Erro criar conjunto adicional: ${partes.join(" — ")}`);
                    }
                    
                    await delay(3000);
                    await criarAnunciosNoConjunto(novoAdSetData.id, ` C${s + 1}`);
                  }
                }
              }
              send("conta_concluida", `Configuração na conta ${actIdConta} finalizada com sucesso.`, pctAtualConta + pctPorConta);
              contasComSucesso++;

            } catch (errorConta: any) {
              const msg = errorConta?.message || "Erro desconhecido";
              console.error(`🚨 Erro na conta ${actIdConta}:`, msg);
              contasComErro.push({ nome: conta.caName, erro: msg });
              send("conta_erro", `Falha na conta ${actIdConta} (${conta.caName}): ${msg}`, pctAtualConta + pctPorConta);
            }
          }

          if (contasComSucesso === 0) {
            const detalhes = contasComErro.map(c => `${c.nome}: ${c.erro}`).join(" | ");
            throw new Error(`Nenhuma conta concluiu o lançamento. ${detalhes}`);
          }

          if (contasComErro.length > 0) {
            const detalhes = contasComErro.map(c => `${c.nome} (${c.erro})`).join(", ");
            send("concluido", `Concluído com ${contasComSucesso} conta(s) com sucesso e ${contasComErro.length} com falha: ${detalhes}. Tudo pausado no Gerenciador.`, 100);
          } else {
            send("concluido", "Processo de lançamento em massa concluído! Tudo pausado no Gerenciador.", 100);
          }
        } catch (error: any) {
          console.error("🚨 Erro durante o stream:", error.message);
          send("erro", error.message || "Erro desconhecido", 0);
        } finally {
          controller.close();
        }
      }
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });

  } catch (error) {
    console.error("🚨 Erro catastrófico ao ler FormData:", error);
    return NextResponse.json({ error: "Falha geral ao iniciar o servidor." }, { status: 500 });
  }
}