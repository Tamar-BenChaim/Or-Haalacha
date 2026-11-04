# client – החנות (Angular)

חנות הספרים שהגולשים רואים. Angular + TypeScript, ממשק בעברית מימין לשמאל (RTL).
ההחלטה: [docs/decisions/0009-client-angular.md](../docs/decisions/0009-client-angular.md).

> נוצר שלד בלבד (Angular 21): מעטפת, ראוטינג lazy לכל הדפים, רכיבים ריקים ו־stores ריקים. הלוגיקה והעיצוב עוד לא ממומשים.
> המבנה והכללים: סעיף 2 ב־[docs/client-spec-angular.md](../docs/client-spec-angular.md).

## הרצה

| פקודה | מה היא עושה |
|-------|-------------|
| `npm ci` | התקנת תלויות |
| `npm start` | שרת פיתוח (`ng serve`) בכתובת http://localhost:4200 |
| `npm run lint` | בדיקת סגנון (ESLint) |
| `npm test` | בדיקות רכיבים (Vitest דרך Angular CLI), רצות פעם אחת בלי watch |
| `npm run build` | בניית ייצור לתיקיית `dist/` |

ה־CI (`.github/workflows/ci.yml`) מריץ `lint`, ‏`test` ו־`build` לפי ה־scripts האלה, ולכן הם חייבים להתקיים ב־`package.json`.
כדי ש־`npm test` לא ייתקע ב־CI, מגדירים אותו כ־`ng test --watch=false`.

## הגדרות סביבה

אין קבצי `.env`. כתובת ה־API בקבצי `src/environments/` (`environment.development.ts` לפיתוח, `environment.ts` לייצור):

```ts
export const environment = { apiUrl: 'http://localhost:3000' };
```

הקבצים האלה נשלחים לדפדפן. **אין לשים בהם סודות.**

## כללים

- עגלת הקניות נשמרת ב־`localStorage`. אין התחברות לקונים.
- מחירים ומלאי מחושבים תמיד בשרת, לא סומכים על הדפדפן.
- התשלום בדף של חברת הסליקה, ופרטי אשראי לא עוברים אצלנו.
