import { SyntheticEvent, useState } from 'react';
import {
  Box,
  Paper,
  Stack,
  TextField,
  Typography,
  Button,
  IconButton,
  InputAdornment,
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import type { GreenApiConfig } from '../../types/greenApi';
import styles from './CredentialsForm.module.scss';

interface Props {
  onConnect: (config: GreenApiConfig) => void;
}

export function CredentialsForm({ onConnect }: Props) {
  const [idInstance, setIdInstance] = useState('');
  const [apiTokenInstance, setApiTokenInstance] = useState('');
  const [showToken, setShowToken] = useState(false);

  const isIdValid = /^\d{12}$/.test(idInstance.trim());
  const isTokenValid = /^[a-zA-Z0-9]{24,}$/.test(apiTokenInstance.trim());

  const submit = (event: SyntheticEvent) => {
    event.preventDefault();

    if (!isIdValid && !isTokenValid) return;

    onConnect({
      idInstance: idInstance.trim(),
      apiTokenInstance: apiTokenInstance.trim(),
    });
  };

  return (
    <Box className={styles.screen}>
      <Paper
        elevation={0}
        className={styles.card}
        component="form"
        onSubmit={submit}
      >
        <div className={styles.brandMark}>M</div>

        <Typography variant="h5" fontWeight={700}>
          MAX Chat
        </Typography>

        <Typography variant="body2" color="text.secondary">
          Подключение через GREEN-API
        </Typography>

        <Stack spacing={2} sx={{ mt: 3 }}>
          <TextField
            label="ID Instance"
            value={idInstance}
            onChange={(e) => setIdInstance(e.target.value)}
            placeholder="Например, 310022700641"
            fullWidth
            error={Boolean(idInstance) && !isIdValid}
            helperText={
              Boolean(idInstance) && !isIdValid
                ? 'ID Instance должен содержать 12 цифр'
                : ''
            }
          />

          <TextField
            label="API Token Instance"
            type={showToken ? 'text' : 'password'}
            value={apiTokenInstance}
            onChange={(e) => setApiTokenInstance(e.target.value)}
            placeholder="Ваш токен GREEN-API"
            fullWidth
            error={Boolean(apiTokenInstance) && !isTokenValid}
            helperText={
              Boolean(apiTokenInstance) && !isTokenValid
                ? 'Токен должен содержать только латинские буквы и цифры'
                : ''
            }
            className={styles.inputToken}
            slotProps={{
              input: {
                endAdornment: (
                  <InputAdornment
                    position="end"
                    className={styles.visabilityIcon}
                  >
                    <IconButton
                      onClick={() => setShowToken((prev) => !prev)}
                      edge="end"
                      aria-label={
                        showToken
                          ? 'Скрыть API Token Instance'
                          : 'Показать API Token Instance'
                      }
                    >
                      {showToken ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              },
            }}
          />

          <Button
            type="submit"
            variant="contained"
            size="large"
            disabled={!isIdValid && !isTokenValid}
          >
            Подключиться
          </Button>
        </Stack>
      </Paper>
    </Box>
  );
}
