import { useEffect, useRef } from 'react';
import { Box, Typography } from '@mui/material';
import classNames from 'classnames';
import type { Message, MessageStatus } from '../../types/greenApi';
import styles from './MessageList.module.scss';

interface Props {
  messages: Message[];
}

function formatTime(timestamp: number) {
  const date = new Date(
    timestamp < 10_000_000_000 ? timestamp * 1000 : timestamp,
  );
  return date.toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function statusMark(status: MessageStatus | undefined): string {
  switch (status) {
    case 'error':
      return '!';
    case 'sending':
      return '…';
    case 'delivered':
    case 'read':
      return '✓✓';
    case 'sent':
    default:
      return '✓';
  }
}

export function MessageList({ messages }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!messages.length) {
    return (
      <Box className={styles.empty}>
        <Typography variant="body2" color="text.secondary">
          Напишите первое сообщение
        </Typography>
      </Box>
    );
  }
  console.log(messages, 'messages');
  return (
    <Box className={styles.list}>
      {messages.map((message) => (
        <div
          key={message.id}
          className={classNames(
            styles.row,
            message.direction === 'outgoing'
              ? styles.outgoing
              : styles.incoming,
          )}
        >
          {message.senderName && (
            <span className={message.senderName && styles.sender}>
              {message.senderName}
            </span>
          )}
          <div
            className={classNames(
              styles.bubble,
              message.status === 'error' && styles.error,
            )}
          >
            <span className={styles.text}>{message.text}</span>

            <span className={styles.meta}>
              {formatTime(message.timestamp)}
              {message.direction === 'outgoing' && (
                <span
                  className={classNames(styles.check, {
                    [styles.read]: message.status === 'read',
                  })}
                >
                  {statusMark(message.status)}
                </span>
              )}
            </span>
          </div>
        </div>
      ))}

      <div ref={bottomRef} />
    </Box>
  );
}
