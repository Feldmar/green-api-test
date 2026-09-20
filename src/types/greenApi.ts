export interface GreenApiConfig {
  idInstance: string;
  apiTokenInstance: string;
}

export interface CheckAccountResponse {
  exist: boolean;
  chatId?: string;
}

export type MessageStatus = 'sending' | 'sent' | 'delivered' | 'read' | 'error';

export interface Message {
  id: string;
  chatId: string;
  text: string;
  timestamp: number;
  direction: 'incoming' | 'outgoing';
  status?: MessageStatus;
  senderName?: string;
}

export interface Chat {
  chatId: string;
  phone: string;
  name: string;
}

export interface WebhookSenderData {
  chatId: string;
  chatName?: string;
  chatType?: string;
  sender?: string;
  senderName?: string;
  senderType?: string;
  senderContactName?: string;
  senderPhoneNumber?: number;
}

export interface WebhookTextMessageData {
  textMessage: string;
  forwardingScore?: number;
  isForwarded?: boolean;
}

export interface WebhookExtendedTextMessageData {
  text: string;
  description?: string;
  title?: string;
  previewType?: string;
  jpegThumbnail?: string;
  forwardingScore?: number;
  isForwarded?: boolean;
}

export interface WebhookMessageData {
  typeMessage: string;
  textMessageData?: WebhookTextMessageData;
  extendedTextMessageData?: WebhookExtendedTextMessageData;
}

export interface WebhookInstanceData {
  idInstance: number;
  wid: string;
  typeInstance: string;
}

export interface WebhookBody {
  typeWebhook: string;
  instanceData: WebhookInstanceData;
  timestamp: number;
  idMessage?: string;
  senderData?: WebhookSenderData;
  messageData?: WebhookMessageData;
  chatId?: string;
  status?: 'sent' | 'delivered' | 'read' | 'failed';
}

export interface ReceiveNotificationResponse {
  receiptId: number;
  body: WebhookBody;
}
