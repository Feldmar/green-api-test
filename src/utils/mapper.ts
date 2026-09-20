import type { Message, WebhookBody } from '../types/greenApi';

export function isMessageWebhook(type: string): boolean {
  return (
    type === 'incomingMessageReceived' ||
    type === 'outgoingMessageReceived' ||
    type === 'outgoingAPIMessageReceived'
  );
}

function isTextMessage(body: WebhookBody): boolean {
  const t = body.messageData?.typeMessage;
  return t === 'textMessage' || t === 'extendedTextMessage';
}

function extractText(body: WebhookBody): string | null {
  return (
    body.messageData?.textMessageData?.textMessage ??
    body.messageData?.extendedTextMessageData?.text ??
    null
  );
}

// Преобразует вебхук в Message. Возвращает null, если не подходит
export function mapWebhookToMessage(body: WebhookBody): Message | null {
  if (!isTextMessage(body)) return null;

  const chatId = body.senderData?.chatId;
  const text = extractText(body);
  if (!chatId || !text || !body.idMessage) return null;

  const direction =
    body.typeWebhook === 'incomingMessageReceived' ? 'incoming' : 'outgoing';

  return {
    id: body.idMessage,
    chatId,
    text,
    senderName: body.senderData?.senderName,
    timestamp: body.timestamp ? body.timestamp * 1000 : Date.now(),
    direction,
    status: direction === 'outgoing' ? 'sent' : undefined,
  };
}
