import { SyntheticEvent, useState } from 'react';
import { Box, Button, Stack, TextField, Typography } from '@mui/material';
import styles from './NewChatForm.module.scss';

interface Props {
  loading: boolean;
  onCreate: (phone: string) => Promise<void>;
}

export function NewChatForm({ loading, onCreate }: Props) {
  const [phone, setPhone] = useState('');

  const submit = async (event: SyntheticEvent) => {
    event.preventDefault();
    const normalized = phone.replace(/\D/g, '');
    if (!normalized) return;
    await onCreate(normalized);
  };

  return (
    <Box component="form" onSubmit={submit} className={styles.root}>
      <div>
        <Typography variant="h6" fontWeight={700}>
          Новый чат
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Введите номер телефона в международном формате
        </Typography>
      </div>

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
        <TextField
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="+7 999 123-45-67"
          disabled={loading}
          fullWidth
          size="small"
        />
        <Button
          type="submit"
          variant="contained"
          disabled={loading || !phone.trim()}
          sx={{ minWidth: 160 }}
        >
          {loading ? 'Проверяем…' : 'Создать чат'}
        </Button>
      </Stack>
    </Box>
  );
}
