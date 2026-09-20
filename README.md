MAX Chat
Веб-клиент для мессенджера MAX, работающий через GreenAPI. Позволяет подключаться к инстансу по idInstance и apiTokenInstance, создавать чат по номеру телефона, отправлять и получать сообщения в реальном времени через long-polling.

Демо версия: https://green-api-test-by-feldmar.netlify.app/ 

Возможности
- Подключение к GreenAPI по idInstance + apiTokenInstance

- Создание чата по номеру телефона через checkAccount

- Отправка текстовых сообщений с локальным статусом(sending → sent/error)

- Приём входящих сообщений через receiveNotification(long-polling)

- Отображение статусов доставки(sent, delivered, read, error)

- Фильтрация уведомлений по chatId текущего открытого чата

- Отсечение каналов и групп(обрабатываются только приватные чаты)

- Эхо-защита от дублей исходящих сообщений

- UI на MUI + CSS Modules

Стек
React 18 + TypeScript
Vite - сборка
MUI (Material UI) - UI-компоненты
SCSS Modules - стили
GreenAPI - транспорт сообщений

Требования
Node.js ≥ 18
npm ≥ 9 (или pnpm / yarn)
Аккаунт на green-api.com с созданным инстансом
