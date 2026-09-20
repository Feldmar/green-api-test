import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  Paper,
  Stack,
  Typography,
} from '@mui/material';

import { createGreenApi, type GreenApi } from './services/greenApi';
import type {
  Chat,
  GreenApiConfig,
  Message,
  MessageStatus,
} from './types/greenApi';
import { isMessageWebhook, mapWebhookToMessage } from './utils/mapper';
import styles from './App.module.scss';
import { CredentialsForm } from './components/CredentialsForm/CredentialsForm';
import { MessageInput } from './components/MessageInput/MessageInput';
import { MessageList } from './components/MessageList/MessageList';
import { NewChatForm } from './components/NewChatForm/NewChatForm';
import { GreenApiError } from './services/greenApiErrorConstructor';

const RECEIVE_TIMEOUT = 20;
const POLL_INTERVAL = 2000;

// Утилиты сравнения chatId
const normalizeChatId = (id?: string | null) =>
  (id ?? '').trim().toLowerCase().split('@')[0];

const isSameChat = (a?: string | null, b?: string | null) =>
  !!a && !!b && normalizeChatId(a) === normalizeChatId(b);

// Приватный чат определяем по chatType
const isPrivateChat = (senderData?: {
  chatId?: string | null;
  chatType?: string | null;
}) => {
  const { chatId, chatType } = senderData ?? {};
  if (!chatId) return false;
  if (chatType) return chatType === 'user';
  // fallback, если chatType не пришёл
  return chatId.toLowerCase().endsWith('@c.us');
};

function App() {
  const [config, setConfig] = useState<GreenApiConfig | null>(null);
  const [chat, setChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [creatingChat, setCreatingChat] = useState(false);
  const [error, setError] = useState('');
  const [connected, setConnected] = useState(false);

  const chatRef = useRef<Chat | null>(null);
  useEffect(() => {
    chatRef.current = chat;
  }, [chat]);

  const api: GreenApi | null = useMemo(
    () => (config ? createGreenApi(config) : null),
    [config],
  );

  // Создание чата
  const createChat = useCallback(
    async (phone: string) => {
      if (!api) return;
      setCreatingChat(true);
      setError('');
      try {
        const result = await api.checkAccount(Number(phone));

        if (!result.exist || !result.chatId) {
          throw new Error('На этом номере не найден аккаунт MAX.');
        }
        setChat({ chatId: result.chatId, phone, name: phone });
        setMessages([]);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Не удалось создать чат.');
      } finally {
        setCreatingChat(false);
      }
    },
    [api],
  );

  // Отправка сообщения
  const sendMessage = useCallback(
    async (text: string) => {
      if (!api) return;
      const currentChat = chatRef.current;
      if (!currentChat) return;

      const localId = crypto.randomUUID();
      setError('');
      setMessages((prev) => [
        ...prev,
        {
          id: localId,
          chatId: currentChat.chatId,
          text,
          timestamp: Date.now(),
          direction: 'outgoing',
          status: 'sending',
        },
      ]);

      try {
        const { idMessage } = await api.sendMessage(currentChat.chatId, text);

        setMessages((prev) =>
          prev.map((m) =>
            m.id === localId
              ? { ...m, id: idMessage, status: 'sent' as const }
              : m,
          ),
        );
      } catch (e) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === localId ? { ...m, status: 'error' as const } : m,
          ),
        );
        setError(
          e instanceof GreenApiError
            ? e.message
            : 'Не удалось отправить сообщение.',
        );
      }
    },
    [api],
  );

  // Поллинг уведомлений
  useEffect(() => {
    if (!api) return;

    let cancelled = false;
    let running = false;

    const loop = async () => {
      if (running) return;
      running = true;

      while (!cancelled) {
        try {
          const notification = await api.receiveNotification(RECEIVE_TIMEOUT);
          if (cancelled) break;

          setConnected(true);

          if (notification) {
            const { body, receiptId } = notification;

            const currentChat = chatRef.current;

            // Статус отправленного сообщения
            if (body.typeWebhook === 'outgoingMessageStatus') {
              const { idMessage, status, chatId } = body as {
                idMessage?: string;
                status?: MessageStatus | 'failed';
                chatId?: string;
              };

              const belongsToCurrentChat =
                !chatId ||
                (currentChat && isSameChat(chatId, currentChat.chatId));

              if (idMessage && status && belongsToCurrentChat) {
                const mapped: MessageStatus =
                  status === 'failed' ? 'error' : status;

                setMessages((prev) => {
                  const exists = prev.some((m) => m.id === idMessage);
                  if (!exists) return prev;
                  return prev.map((m) =>
                    m.id === idMessage ? { ...m, status: mapped } : m,
                  );
                });
              }
            }

            //Входящее/исходящее сообщение
            if (isMessageWebhook(body.typeWebhook)) {
              const sender = body.senderData;

              if (
                isPrivateChat(sender) &&
                currentChat &&
                isSameChat(sender?.chatId, currentChat.chatId)
              ) {
                const msg = mapWebhookToMessage(body);

                if (msg) {
                  if (msg.direction === 'incoming') {
                    api.readChat(currentChat.chatId).catch((e) => {
                      console.warn('readChat failed', e);
                    });
                  }

                  setMessages((prev) => {
                    if (prev.some((m) => m.id === msg.id)) return prev;

                    // Эхо-защита для исходящих
                    if (msg.direction === 'outgoing') {
                      const isEcho = prev.some(
                        (m) =>
                          m.direction === 'outgoing' &&
                          m.text === msg.text &&
                          Math.abs(m.timestamp - msg.timestamp) < 10_000,
                      );
                      if (isEcho) return prev;
                    }

                    return [...prev, msg];
                  });
                }
              }
            }

            await api.deleteNotification(receiptId);
          }
        } catch (e) {
          if (cancelled) break;
          console.error('ReceiveNotification error:', e);
          setConnected(false);
        }

        await new Promise((r) => setTimeout(r, POLL_INTERVAL));
      }

      running = false;
    };

    void loop();

    return () => {
      cancelled = true;
    };
  }, [api]);

  const resetChat = () => {
    setChat(null);
    setMessages([]);
    setError('');
  };

  if (!api) {
    return <CredentialsForm onConnect={(cfg) => setConfig(cfg)} />;
  }

  return (
    <Box className={styles.shell}>
      <Paper elevation={0} component="header" className={styles.topbar}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Avatar className={styles.logo}>M</Avatar>
          <Typography fontWeight={700}>MAX Chat</Typography>
        </Stack>

        <Stack direction="row" spacing={1.5} alignItems="center">
          <Chip
            size="small"
            color={connected ? 'success' : 'default'}
            label={connected ? 'Подключено' : 'Подключение…'}
          />
          {chat && (
            <Button variant="text" onClick={resetChat}>
              Новый чат
            </Button>
          )}
        </Stack>
      </Paper>

      <Box component="main" className={styles.main}>
        {!chat ? (
          <Paper elevation={0} className={styles.newChatCard}>
            <NewChatForm loading={creatingChat} onCreate={createChat} />
            {error && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {error}
              </Alert>
            )}
          </Paper>
        ) : (
          <Paper elevation={0} className={styles.chat}>
            <Stack
              direction="row"
              spacing={1.5}
              alignItems="center"
              className={styles.chatHeader}
            >
              <Avatar>{chat.phone.slice(-2)}</Avatar>
              <Box>
                <Typography fontWeight={600}>{chat.name}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {chat.phone}
                </Typography>
              </Box>
            </Stack>

            <MessageList messages={messages} />

            {error && (
              <Alert severity="error" className={styles.chatError}>
                {error}
              </Alert>
            )}

            <MessageInput onSend={sendMessage} />
          </Paper>
        )}
      </Box>
    </Box>
  );
}

export default App;
