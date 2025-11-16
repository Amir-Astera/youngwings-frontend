# OrientVentus Frontend

## Environment variables

| Name | Description |
| --- | --- |
| `VITE_PUBLIC_SITE_ORIGIN` | Абсолютный публичный origin (например, `https://orientventus.com`). Используется для формирования canonical-URL, `og:url`, `og:image` и JSON-LD. |

> ⚠️ Без заданного origin мета-теги и структурированные данные не смогут сформировать корректные абсолютные ссылки.

## OG изображение по умолчанию

В каталоге `public/assets/og-default.jpg` лежит статичное превью 1200×630. Оно подставляется автоматически, если у записи нет собственной картинки.
