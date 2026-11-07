import { inject } from '@angular/core';
import { Router, Routes } from '@angular/router';

/**
 * The home page is one long page with sections (books, set, about, contact).
 * These old addresses still work: they take the visitor to the matching section.
 */
const toSection = (fragment: string) => () => inject(Router).createUrlTree(['/'], { fragment });

export const routes: Routes = [
  {
    path: '',
    title: 'אור ההלכה',
    loadComponent: () => import('./features/home/home/home').then((m) => m.Home),
  },
  { path: 'set', pathMatch: 'full', redirectTo: toSection('set') },
  { path: 'about', pathMatch: 'full', redirectTo: toSection('about') },
  { path: 'contact', pathMatch: 'full', redirectTo: toSection('contact') },
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
    path: 'legal/:doc',
    loadComponent: () => import('./features/content/legal/legal').then((m) => m.Legal),
  },
  {
    path: '**',
    title: 'הדף לא נמצא',
    loadComponent: () => import('./features/content/not-found/not-found').then((m) => m.NotFound),
  },
];
