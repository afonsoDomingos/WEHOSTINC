// API de Server-Sent Events para atualizações em tempo real de afiliados
// Usa SSE em vez de WebSocket para melhor compatibilidade com Next.js

import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return new Response('userId é obrigatório', { status: 400 });
  }

  // Configurar headers para SSE
  const headers = new Headers({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Cache-Control',
  });

  // Criar stream
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      // Enviar mensagem inicial de conexão
      const data = JSON.stringify({
        type: 'connected',
        userId,
        timestamp: Date.now(),
        message: 'Conectado ao stream de atualizações de afiliado'
      });
      
      controller.enqueue(encoder.encode(`data: ${data}\n\n`));

      // Simular atualizações periódicas (em produção, isso seria conectado a eventos reais)
      const interval = setInterval(async () => {
        try {
          // Buscar dados atualizados do afiliado
          const response = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/affiliates/dashboard?userId=${encodeURIComponent(userId)}&bypassCache=true`);
          
          if (response.ok) {
            const affiliateData = await response.json();
            
            const updateData = JSON.stringify({
              type: 'stats_update',
              data: affiliateData,
              timestamp: Date.now()
            });
            
            controller.enqueue(encoder.encode(`data: ${updateData}\n\n`));
          }
        } catch (error) {
          console.error('Erro ao buscar atualizações:', error);
          
          const errorData = JSON.stringify({
            type: 'error',
            error: 'Erro ao buscar atualizações',
            timestamp: Date.now()
          });
          
          controller.enqueue(encoder.encode(`data: ${errorData}\n\n`));
        }
      }, 30000); // 30 segundos

      // Manter conexão viva com heartbeat
      const heartbeat = setInterval(() => {
        controller.enqueue(encoder.encode(': heartbeat\n\n'));
      }, 15000); // 15 segundos

      // Cleanup quando o cliente desconectar
      request.signal.addEventListener('abort', () => {
        clearInterval(interval);
        clearInterval(heartbeat);
        controller.close();
      });
    },
  });

  return new Response(stream, { headers });
}