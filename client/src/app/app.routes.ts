import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    title: 'אור ההלכה',
    loadComponent: () => import('./features/home/home/home').then((m) => m.Home),
  },
  {
    path: 'set',
    title: 'הסט המלא',
    loadComponent: () => import('./features/set/set/set').then((m) => m.SetPage),
  },
  {
    path: 'book/:slug',
    loadComponent: () => import('./features/book/book/book').then((m) => m.BookPage),
  },
  {
    path: 'cart',
    title: 'עגלת הקניות',
    loadComponent: () => import('./features/cart/cart/cart').then((m) => m.Cart),
  },
  {
    path: 'checkout',
    title: 'פרטים ותשלום',
    loadComponent: () => import('./features/checkout/checkout/checkout').then((m) => m.Checkout),
  },
  {
    path: 'order/success',
    title: 'ההזמנה התקבלה',
    loadComponent: () =>
      import('./features/order/order-success/order-success').then((m) => m.OrderSuccess),
  },
  {
    path: 'order/failed',
    title: 'התשלום לא הושלם',
    loadComponent: () =>
      import('./features/order/order-failed/order-failed').then((m) => m.OrderFailed),
  },
  {
    path: 'about',
    title: 'אודות',
    loadComponent: () => import('./features/content/about/about').then((m) => m.About),
  },
  {
    path: 'contact',
    title: 'צור קשר',
    loadComponent: () => import('./features/contact/contact/contact').then((m) => m.Contact),
  },
  {
    path: 'legal/:doc',
    loadComponent: () => import('./features/content/legal/legal').then((m) => m.Legal),
  },
  {
    path: '**',
    title: 'הדף לא נמצא',
    loadComponent: () => import('./features/content/not-found/not-found').then((m) => m.NotFound),
  },
];
