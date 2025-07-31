export interface EventCtx {
  room: string;
  sessionId: number;
  userId: number;
}

export interface GameController {
  /** Запуск игры – вызывается когда оба игрока подключились */
  start(): void;

  /** Обработка любых пользовательских событий */
  onClientEvent(event: string, payload: any, ctx: EventCtx): void;

  /** Очистка ресурсов */
  dispose(): void;
}
