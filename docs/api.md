# תיעוד ה־API

כתובת בסיס: `https://api.orhaalacha.org` (מקומית: `http://localhost:3000`).

## כללי

- גוף הבקשה והתשובה ב־JSON, עד 100KB.
- כל תשובה כוללת כותרת `X-Request-Id`. כדאי לצרף אותה לכל דיווח על תקלה.
- הגבלת קצב: 300 בקשות ב־15 דקות לכל כתובת IP (ניתן לשינוי). הכותרות `RateLimit` ו־`RateLimit-Policy` מציגות את המצב.

### מבנה שגיאה

```json
{
  "error": { "code": "VALIDATION_ERROR", "message": "Invalid request", "details": [] },
  "requestId": "…"
}
```

| סטטוס | קוד | מתי |
|-------|-----|-----|
| 400 | `VALIDATION_ERROR` | הקלט לא עומד בסכמה. `details` מפרט מיקום, שדה והודעה |
| 400 | `INVALID_JSON` | גוף הבקשה אינו JSON תקין |
| 400 | `INVALID_INPUT` | שמות שדות אסורים (מתחילים ב־`$`, מכילים `.` וכו') |
| 404 | `NOT_FOUND` | הנתיב לא קיים |
| 413 | `PAYLOAD_TOO_LARGE` | גוף הבקשה גדול מדי |
| 429 | `RATE_LIMITED` | יותר מדי בקשות |
| 500 | `INTERNAL_ERROR` | תקלה פנימית. הפרטים רק בלוג |

## נקודות

### `GET /health`

בדיקת זמינות של השרת ושל החיבור למסד הנתונים. מתאימה לניטור זמינות ולבדיקות של ספק האחסון.

תשובה `200`, הכול תקין:

```json
{ "status": "ok", "database": "ok" }
```

תשובה `503`, אין חיבור למסד:

```json
{ "status": "error", "database": "unavailable" }
```
