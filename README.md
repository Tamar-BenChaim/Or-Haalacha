# אור ההלכה – Or Haalacha

אתר למכירת ספרי **אור ההלכה**.

האתר בנוי כ-**מונו־ריפו (Monorepo)** – צד הלקוח וצד השרת נמצאים באותו מאגר.

## טכנולוגיות

| שכבה | טכנולוגיה |
|------|-----------|
| צד לקוח (Frontend) | React + Vite |
| צד שרת (Backend) | Node.js |
| מסד נתונים | MongoDB Atlas |

## מבנה התיקיות

```
Or-Haalacha/
├── client/   # החנות – React (Vite)
├── admin/    # אזור הניהול – React (Vite), אפליקציה נפרדת
├── server/   # שרת Node.js
└── README.md
```

## סטטוס

הפרויקט בשלב הפיתוח הראשוני. מצב העבודה ושלביה מתועדים ב־[docs/progress.md](docs/progress.md).

## תיעוד

- [docs/planning.md](docs/planning.md) – אפיון, החלטות ושאלות פתוחות
- [docs/decisions/](docs/decisions/) – החלטות ארכיטקטורה
- [docs/api.md](docs/api.md) – תיעוד ה־API
- [server/README.md](server/README.md) – הרצת השרת
