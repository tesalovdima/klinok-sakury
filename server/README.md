# Сервер игры

Один процесс на Python 3 (только стандартная библиотека): отдаёт `public/` и API чата, рейтинга и арены. Данные — `data/state.json`, запись атомарная.

## Развёртывание на чистой машине

```bash
# отдельный пользователь, без shell
useradd --system --no-create-home --shell /usr/sbin/nologin sakura || true

mkdir -p /opt/klinok-sakury/public /opt/klinok-sakury/data
# public/ — содержимое dist/yandex, server.py — рядом
chown -R sakura:sakura /opt/klinok-sakury/data
chmod 755 /opt/klinok-sakury /opt/klinok-sakury/public

cp server/klinok-sakury.service /etc/systemd/system/
systemctl daemon-reload
systemctl enable --now klinok-sakury
systemctl status klinok-sakury --no-pager
```

Порт по умолчанию `8080` (`Environment=PORT=`). Сервис не трогает другие юниты и слушает только свой порт.

## API

| Метод | Путь | Тело / параметры | Ответ |
|---|---|---|---|
| GET | `/api/health` | — | `{ok, players}` |
| GET | `/api/chat?since=N` | — | `{messages:[{id,pid,name,text,ts}]}` |
| POST | `/api/chat` | `{pid,name,text}` | `{ok, message}`; 3 с на игрока, 200 символов |
| GET | `/api/board` | — | `{top:[{name,stage,best,level,power,rating}]}` |
| POST | `/api/board` | `{pid,name,stage,best,level,power,rating}` | `{ok}`; 5 с на игрока |
| GET | `/api/arena?pid&rating&power` | — | `{players:[{name,rating,power,st,look}]}` |
| POST | `/api/arena` | `{pid,name,rating,power,level,body,hair,st,look}` | `{ok}`; 8 с на игрока |

Клиент игры сам определяет доступность: если `/api/health` не отвечает, чат и рейтинг показывают «нет связи», арена работает на ботах. Поэтому та же сборка подходит и для Яндекс Игр.

## Безопасность и ограничения

- Никаких внешних зависимостей и shell-вызовов; статика отдаётся только из `public/`, обход путей запрещён.
- Имена и сообщения очищаются от управляющих символов и ограничиваются по длине; на клиенте вывод идёт через `textContent`.
- Ограничения частоты в памяти процесса; чат хранит последние 200 сообщений, игроки — профиль до 30 дней (очистка не автоматическая, файл маленький).
- Нет TLS: для продакшена поставьте перед сервисом nginx/caddy с сертификатом, не меняя порт приложения.
- Резервная копия — `data/state.json`.
