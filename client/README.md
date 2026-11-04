# client – החנות (Angular)

חנות הספרים שהגולשים רואים. Angular + TypeScript, ממשק בעברית מימין לשמאל (RTL).
ההחלטה: [docs/decisions/0009-client-angular.md](../docs/decisions/0009-client-angular.md).

> הקוד עוד לא נוצר. המסמך מתאר את ההתקנה המתוכננת, ויתעדכן עם יצירת הפרויקט.

## יצירת הפרויקט (פעם אחת)

מתוך תיקיית `client/` (היא כוללת כרגע רק `.gitkeep` ו־README זה):

```bash
npx @angular/cli new or-haalacha-store --directory . --style=scss --routing --skip-git
```

## הרצה

| פקודה | מה היא עושה |
|-------|-------------|
| `npm ci` | התקנת תלויות |
| `npm start` | שרת פיתוח (`ng serve`) בכתובת http://localhost:4200 |
| `npm run lint` | בדיקת סגנון (ESLint) |
| `npm test` | בדיקות רכיבים. ב־CI מריצים בלי watch (`ng test --watch=false`) |
| `npm run build` | בניית ייצור לתיקיית `dist/` |

ה־CI (`.github/workflows/ci.yml`) מריץ `lint`, ‏`test` ו־`build` לפי ה־scripts האלה, ולכן הם חייבים להתקיים ב־`package.json`.
כדי ש־`npm test` לא ייתקע ב־CI, מגדירים אותו כ־`ng test --watch=false`.

## הגדרות סביבה

אין קבצי `.env`. כתובת ה־API בקבצי `src/environments/` (`environment.ts` לפיתוח, `environment.prod.ts` לייצור):

```ts
export const environment = { apiUrl: 'http://localhost:3000' };
```

הקבצים האלה נשלחים לדפדפן. **אין לשים בהם סודות.**

## כללים

- עגלת הקניות נשמרת ב־`localStorage`. אין התחברות לקונים.
- מחירים ומלאי מחושבים תמיד בשרת, לא סומכים על הדפדפן.
- התשלום בדף של חברת הסליקה, ופרטי אשראי לא עוברים אצלנו.
