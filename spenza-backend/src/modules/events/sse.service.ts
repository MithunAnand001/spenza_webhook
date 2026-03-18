import { Response } from 'express';

interface SSEClient {
  userId: number;
  res: Response;
}

export const sseClients = new Map<string, SSEClient>();

export const broadcastEvent = (userId: number, eventData: Record<string, unknown>): void => {
  for (const [, client] of sseClients) {
    if (client.userId === userId) {
      try {
        client.res.write(`event: webhook_event\ndata: ${JSON.stringify(eventData)}\n\n`);
      } catch {
        // Client disconnected — will be cleaned up on close event
      }
    }
  }
};