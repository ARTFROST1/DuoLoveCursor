# План рефакторинга: поддержка множества онлайн-игр

> Следуя шагам ниже, мы приведём проект к модульной архитектуре, где добавление новой игры сводится к написанию её **Game-контроллера** и минимальной разметки на фронтенде. Все общие процессы (инвайты, сессии, история, ачивки) будут переиспользоваться.

---

## 0. Подготовка
1. Создать новую ветку `feature/multi-game-support`.
2. Обновить README: ссылка на данный файл и кратко описать цель рефакторинга.

---

## 1. Аудит текущей логики
1. Просмотреть серверный файл `sockets.ts` и разделить код на:
   * A) общие процессы (валидация, подключение, инвайт/сессия, история, ачивки)
   * B) игровая логика Reaction-Duo (countdown, фиксация победителя, restart/exit).
2. Зафиксировать список используемых событий Socket.io.
3. Описать ограничения текущего решения (нет рандома, нет точного времени реакции и т.д.).

---

## 2. Изменения базы данных (Prisma)
> Цель — сделать схему независимой от конкретной игры и позволить хранить результаты разных игр.

| Модель | Действие |
| --- | --- |
| `Game` *(NEW)* | `id`, `slug`, `title`, `description` |
| `GameSession` | добавить поле `gameId` (FK → `Game`)  |
| `GameRound` *(NEW)* | для игр c несколькими раундами: `id`, `sessionId`, `roundIndex`, `startedAt`, `endedAt`, `winnerId` |
| `GameAction` *(NEW, generic)* | хранит события игроков: `id`, `roundId`, `userId`, `action`, `payload(Json)`, `createdAt` |

Шаги:
1. Создать в `prisma/schema.prisma` новые модели.
2. Выполнить миграцию `npx prisma migrate dev -n multi_game`.
3. Заполнить таблицу `Game` начальными играми (`reaction_duo`).
4. Обновить seed-скрипт.
5. Проверить, что существующие записи `gameSession` корректно ссылаются на `gameId` (скрипт миграции).

---

## 3. Абстракция «GameController»

### 3.1 Интерфейс
```ts
export interface GameController {
  /** вызывается, когда оба игрока подключились и сессия готова */
  start(session: GameSession, room: string): void;
  /** обработка пользовательских событий (socket.emit) */
  onClientEvent(event: string, payload: unknown, ctx: EventCtx): void;
  /** закрытие комнаты, очистка таймеров */
  dispose(): void;
}
```
`EventCtx` содержит ссылки на `socket`, `io`, `session`, `room`, helper-методы.

### 3.2 Реестр игр
```ts
const controllers: Record<string, (params) => GameController> = {
  reaction_duo: (p) => new ReactionController(p),
  // chess_duo: (p) => new ChessController(p),
};
export function getController(slug: string) { return controllers[slug]; }
```

### 3.3 Перенос логики Reaction-Duo
1. Создать класс `ReactionController` в `server/games/reaction/controller.ts`.
2. Переместить countdown, обработку `reaction`, restart/exit внутрь класса.
3. Оставить в `sockets.ts` только общее подключение и делегирование событий контроллеру.

---

## 4. Рефакторинг Socket-хаба
1. Создать файл `server/socketHub.ts`.
2. Внутри `io.on("connection")`:
   * Выполнить валидацию `userId`, `sessionId` (как сейчас).
   * Получить из БД `session`, `game`.
   * Создать/получить экземпляр контроллера `getController(game.slug)` и сохранить его в `Map<sessionId, GameController>`.
   * Делегировать:
     ```ts
     socket.onAny((event, payload) => {
       controller.onClientEvent(event, payload, ctx);
     });
     ```
3. На событии `disconnect` удалять контроллер, если в комнате 0 клиентов → `dispose()`.
4. Общие события (`choice`, история, ачивки) оставить в хабе, но при необходимости предоставить контроллеру callback-хелперы.

---

## 5. Тесты / эмуляторы
1. Написать unit-тест на `ReactionController` (jest + socket.io-mock).
2. Проверить миграцию данных в тестовой БД.

---

## 6. Минимальный пример второй игры (echo_duo)
1. Добавить игру `echo_duo` (просто пересылает сообщения между игроками).
2. Реализовать `EchoController` со своим набором событий (`message`, `ready`).
3. Запустить две разные сессии реакционной и echo-игры параллельно → убедиться, что контроллеры не конфликтуют.

---

## 7. Клиентские изменения (минимум)
1. Добавить энд-поинт `/game/<slug>` универсальный.
2. В `useGameSocket` передавать `slug` и сохранять канал событий `<slug>/<event>` (если потребуется неймспейс).
3. Для тестовой игры `echo_duo` показать два текстовых поля.

---

## 8. Документация для разработчиков игр
1. Создать `docs/how_to_add_new_game.md`:
   * шаги добавления записи в `Game`.
   * создание `GameController`.
   * список обязательных событий (`start`, `result`, `choice` и/или свои).
   * рекомендации по клиентским компонентам.

---

## 9. Деплой и миграции на production
1. Обновить CI/CD: запуск `prisma migrate deploy`.
2. Произвести канареечный релиз.

---

## 10. Очистка и завершение ветки
1. Code-review, исправления.
2. Слияние `feature/multi-game-support` → `main`.
3. Создать GitHub issue шаблон «Добавить новую игру».

---

## 11. Следующие шаги
* Реализация случайной задержки и точного замера реакции в `ReactionController`.
* Добавление поддержки best-of-N раундов через `GameRound`.
* Улучшение UI/UX под каждую игру.

---

> Готово. Следующий шаг — приступить к этапу **1. Аудит** или уточнить/скорректировать план.
