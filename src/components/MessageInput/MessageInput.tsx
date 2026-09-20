import { useState, type KeyboardEvent } from 'react';
import { IconButton, Stack, TextField } from '@mui/material';
import ArrowUpwardRoundedIcon from '@mui/icons-material/ArrowUpwardRounded';
import styles from './MessageInput.module.scss';

interface Props {
  onSend: (text: string) => Promise<void>;
}

export function MessageInput({ onSend }: Props) {
  const [text, setText] = useState('');

  const submit = async () => {
    const value = text.trim();
    if (!value || value.length > 4000) return;
    await onSend(value);
    setText('');
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void submit();
    }
  };

  return (
    <Stack
      direction="row"
      spacing={1}
      alignItems="flex-end"
      className={styles.root}
    >
      <TextField
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder="Напишите сообщение…"
        multiline
        maxRows={4}
        size="small"
        fullWidth
      />
      <IconButton
        color="primary"
        onClick={() => void submit()}
        disabled={!text.trim()}
        aria-label="Отправить"
        className={styles.send}
      >
        <ArrowUpwardRoundedIcon />
      </IconButton>
    </Stack>
  );
}
