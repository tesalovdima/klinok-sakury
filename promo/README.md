# Промо-материалы «Клинка Сакуры»

Сгенерированы локально: ComfyUI 0.41, модель **Illustrious XL v0.1** (SDXL-архитектура), сэмплер `euler_ancestral`, 26 шагов, CFG 6.5. Все изображения созданы для этого проекта, без чужих персонажей и логотипов.

## Что лежит в `store/`

| Файл | Размер | Куда |
|---|---|---|
| `icon-512.png` / `icon-512.jpg` | 512×512 | Иконка игры в консоли Яндекс Игр |
| `icon-alt-512.png` | 512×512 | Альтернативная иконка для A/B |
| `cover-800x470.jpg` | 800×470 | Обложка в каталоге |
| `keyart-900.jpg` | 900×1316 | Соцсети, карточка, промо-посты |
| `event-banner-800x400.jpg` | 800×400 | Баннер события «Праздник сакуры» |
| `screen-main.jpg` | 1080×1920 | Скриншот 1: бой и героиня |
| `screen-gear.jpg` | 1080×1920 | Скриншот 2: снаряжение и сет |
| `screen-event.jpg` | 1080×1920 | Скриншот 3: событие и награды |
| `screen-tower.jpg` | 1080×1920 | Скриншот 4: башня |
| `screen-world.jpg` | 1080×1920 | Скриншот 5: мировой босс |
| `screen-skills.jpg` | 1080×1920 | Скриншот 6: умения со стихиями |

Скриншоты сняты с реальной сборки (Chrome headless, 540×960 @2x), без нарисованных вручную элементов.

## Промпты

**Иконка (seed 71, 1024×1024):**
`masterpiece, best quality, anime game icon, upper body samurai girl with long pink hair, sakura hairpin, holding katana diagonally, glowing gold accents, cherry blossoms, dramatic dark background, bold silhouette, centered, no text`

**Обложка (seed 81, 1216×832):**
`masterpiece, best quality, anime mobile game cover art, samurai girl with long pink hair and white red outfit, katana, no wings, surrounded by cute round slime monsters, blooming sakura, glowing lanterns at night, dynamic leap, vibrant pink and gold palette, clean bold shapes, no text`

**Баннер события (seed 91, 1216×640):**
`masterpiece, best quality, anime festival banner, girl with long pink hair in a pink kimono seen from behind, sakura festival at night, blank glowing paper lanterns with no text, cherry blossom petals, giant sakura tree, warm golden light, wide cinematic composition, no text, no letters, no watermark`

**Key art (seed 41, 832×1216):**
`masterpiece, best quality, anime key visual, full body samurai girl with long pink hair, white and red outfit, katana, standing on a stone path in a sakura shrine at night, glowing lanterns, falling petals, cinematic lighting, detailed background, no text`

## AI-иконки умений (концепт)

10 эмблем были сгенерированы Illustrious XL как концепт, но в игре они выбивались из плоского стиля. В финальную версию (3.7) пошли рисованные иконки в стиле игры: тёмный круглый бейдж, простой силуэт, толстый контур. AI-эмблемы остаются в `promo/raw/skills` как референс и не входят в билд.

## AI-баннер события

`src/img/event-lantern.jpg` — Illustrious XL, 1216×704, 28 шагов, CFG 7, затем кроп 800×450 и WebP/JPEG-сжатие. Вшивается в CSS как data URI, поэтому одиночный HTML и сборка для Яндекс Игр не делают внешних запросов.

## Лицензия и ограничения

- **Illustrious XL v0.1** распространяется по Fair AI Public License 1.0-SD: сгенерированные изображения можно использовать коммерчески. Саму модель в репозиторий не кладём.
- Локальные LoRA не использовались, поэтому нет дополнительных ограничений от авторов LoRA.
- Перед публикацией проверьте, что на иконке и обложке нет случайных надписей и водяных знаков. В текущих ассетах их нет.
- Иконка и обложка — маркетинговые материалы: они могут отличаться от игровой графики по стилю, это нормально. Внутриигровые спрайты остаются процедурными, чтобы билд оставался лёгким и цельным.

## A/B-план

1. Неделя 1: `icon-512.png` против `icon-alt-512.png`, одинаковые обложка и описание.
2. Метрика: CTR карточки и конверсия в установку. Останавливаем вариант, который проигрывает 20%+.
3. Неделя 2: победитель против варианта с более крупным лицом (сгенерировать из того же сида с `close-up portrait`).
4. Обложку меняем отдельно, после стабилизации иконки.

## Как пересобрать

Генерация: `_dev/gen.js` (локальный ComfyUI на `127.0.0.1:8188`). Кроп и ресайз: `_dev/resize.js` (headless Chrome + canvas). Скриншоты: `_dev/shots.js`. Промпты и сиды — выше, так что набор воспроизводим.
