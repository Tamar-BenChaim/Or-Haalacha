# admin – אזור הניהול (Angular)

אפליקציה נפרדת מהחנות, בכתובת admin.orhaalacha.org, מאחורי Cloudflare Access.
בנוסף, השרת בודק התחברות מנהל בכל פעולת ניהול. ממשק בעברית מימין לשמאל (RTL).
ההחלטות: [0003](../docs/decisions/0003-separate-admin-app.md), [0009](../docs/decisions/0009-client-angular.md).

> הקוד עוד לא נוצר. המסמך מתאר את ההתקנה המתוכננת, ויתעדכן עם יצירת הפרויקט.

## יצירת הפרויקט (פעם אחת)

מתוך תיקיית `admin/` (היא כוללת כרגע רק `.gitkeep` ו־README זה):

```bash
npx @angular/cli new or-haalacha-admin --directory . --style=scss --routing --skip-git
```

## הרצה

| פקודה | מה היא עושה |
|-------|-------------|
| `npm ci` | התקנת תלויות |
| `npm start` | שרת פיתוח (`ng serve --port 4201`), כדי לא להתנגש עם החנות |
| `npm run lint` | בדיקת סגנון (ESLint) |
| `npm test` | בדיקות רכיבים, מוגדר כ־`ng test --watch=false` |
| `npm run build` | בניית ייצור לתיקיית `dist/` |

## הגדרות סביבה

אין קבצי `.env`. כתובת ה־API בקבצי `src/environments/`:

```ts
export const environment = { apiUrl: 'http://localhost:3000' };
```

הקבצים האלה נשלחים לדפדפן. **אין לשים בהם סודות.**
