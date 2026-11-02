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

### `GET /bundles`

סטים במחיר מיוחד, כרגע "הסט המלא".

תשובה `200`:

```json
{
  "bundles": [
    {
      "id": "…",
      "slug": "full-set",
      "title": "הסט המלא – אור ההלכה",
      "description": "…",
      "priceAgorot": 22000,
      "separatePriceAgorot": 26000,
      "inStock": true,
      "books": [{ "slug": "or-haalacha-1", "title": "…", "volume": 1 }]
    }
  ]
}
```

| שדה | פירוש |
|-----|-------|
| `separatePriceAgorot` | סכום מחירי הספרים בנפרד, להצגת החיסכון. `null` אם אחד הספרים מוסתר |
| `inStock` | יש במלאי לפחות עותק אחד מכל ספר בסט |

### `POST /cart/quote`

חישוב מחדש של העגלה בשרת. הדפדפן שולח רק מה הוא רוצה וכמה. המחירים, המלאי והסכומים מחושבים תמיד מהמסד, וכל מחיר שנשלח מהדפדפן מתעלם. העגלה קוראת לנקודה הזו בכל פתיחה, כדי להציג לקונה שינויים במחיר או במלאי.

גוף הבקשה:

```json
{
  "items": [
    { "type": "book", "slug": "or-haalacha-1", "quantity": 2 },
    { "type": "bundle", "slug": "full-set", "quantity": 1 }
  ]
}
```

| שדה | כללים |
|-----|-------|
| `items` | עד 50 שורות. מותרת רשימה ריקה |
| `type` | ‏`book` או `bundle` |
| `slug` | הכתובת הקבועה של הספר או הסט |
| `quantity` | מספר שלם בין 1 ל־99 |

תשובה `200`:

```json
{
  "items": [
    {
      "type": "book",
      "slug": "or-haalacha-1",
      "title": "אור ההלכה – כרך א'",
      "unitPriceAgorot": 6500,
      "requestedQuantity": 2,
      "quantity": 2,
      "lineTotalAgorot": 13000,
      "status": "ok"
    }
  ],
  "subtotalAgorot": 13000,
  "allAvailable": true
}
```

| `status` | פירוש | `quantity` |
|----------|-------|------------|
| `ok` | זמין בכמות המבוקשת | כמו שהתבקש |
| `limited` | יש במלאי פחות מהמבוקש | הכמות שיש |
| `out_of_stock` | אזל | 0 |
| `unavailable` | הספר או הסט לא קיים או מוסתר. `title` ו־`unitPriceAgorot` הם `null` | 0 |

כללי החישוב:
- שורות חוזרות לאותו מוצר מאוחדות.
- סט משתמש בעותק אחד מכל ספר שבו, והמלאי משותף לסטים ולספרים בודדים. קודם מוקצים הסטים, ואחר כך הספרים הבודדים ממה שנשאר.
- `subtotalAgorot` כולל רק את הכמויות הזמינות. דמי המשלוח מחושבים בשלב ההזמנה.
- `allAvailable` הוא `true` רק כשכל השורות במצב `ok`. בלי זה לא תתאפשר הזמנה.

## בדיקה ב־Postman

אוסף מוכן נמצא ב־[`server/postman/or-haalacha.postman_collection.json`](../server/postman/or-haalacha.postman_collection.json). לכל בקשה מצורפות בדיקות שרצות אוטומטית. ההוראות ב־[server/README.md](../server/README.md#בדיקה-ב־postman).
