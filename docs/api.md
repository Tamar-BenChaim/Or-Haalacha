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
| 404 | `BOOK_NOT_FOUND` | הספר לא קיים או מוסתר |
| 400 | `INVALID_INPUT` | שמות שדות אסורים (מתחילים ב־`$`, מכילים `.` וכו') |
| 404 | `NOT_FOUND` | הנתיב לא קיים |
| 413 | `PAYLOAD_TOO_LARGE` | גוף הבקשה גדול מדי |
| 429 | `RATE_LIMITED` | יותר מדי בקשות |
| 500 | `INTERNAL_ERROR` | תקלה פנימית. הפרטים רק בלוג |

## סכומי כסף

כל הסכומים הם מספרים שלמים באגורות. השדות מסתיימים ב־`Agorot`: ‏`"priceAgorot": 6500` הם 65 ₪ (החלטה 0009).

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

### `GET /books`

רשימת הספרים שמוצגים בחנות, לפי סדר ההצגה. ספרים מוסתרים לא מופיעים.

תשובה `200`:

```json
{
  "books": [
    {
      "id": "6ae0ab2aee9e92d2ef72df22",
      "slug": "or-haalacha-1",
      "title": "אור ההלכה – כרך א'",
      "volume": 1,
      "shortDescription": "…",
      "priceAgorot": 6500,
      "inStock": true,
      "coverImage": null
    }
  ]
}
```

| שדה | פירוש |
|-----|-------|
| `slug` | הכתובת הקבועה של הספר: אותיות לטיניות קטנות, ספרות ומקפים |
| `volume` | מספר הכרך, או `null` |
| `inStock` | האם אפשר להזמין. כמות המלאי המדויקת לא נחשפת |
| `coverImage` | ‏`{ "url", "alt" }` או `null` (אחסון התמונות טרם נבחר) |

### `GET /books/:slug`

ספר אחד לפי הכתובת הקבועה שלו, עם כל השדות של הרשימה ובנוסף `description` (תיאור מלא).

| סטטוס | מתי |
|-------|-----|
| `200` | ‏`{ "book": { … } }` |
| `400` | ‏`VALIDATION_ERROR`: הכתובת לא בפורמט הנכון |
| `404` | ‏`BOOK_NOT_FOUND`: הספר לא קיים או מוסתר |

## בדיקה ב־Postman

אוסף מוכן נמצא ב־[`server/postman/or-haalacha.postman_collection.json`](../server/postman/or-haalacha.postman_collection.json). לכל בקשה מצורפות בדיקות שרצות אוטומטית. ההוראות ב־[server/README.md](../server/README.md#בדיקה-ב־postman).
