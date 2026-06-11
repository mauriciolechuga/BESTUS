/**
 * Shared mobile/tablet device matrix for all *.mobile.cy.js specs.
 *
 * touchTarget = minimum acceptable height (px) for a visible header interactive element:
 *   44px → phones  (Apple HIG / WCAG 2.5.5 AAA)
 *   24px → tablets (WCAG 2.2 AA 2.5.8 — the site serves desktop nav at these widths,
 *                   where mouse-optimised links of 23–30px are expected)
 *
 * The BESTUS mobile nav is a div.mobile-menu drawer (not a hamburger button), confirmed
 * from page source. It is always in the DOM; opening it requires user interaction.
 * Other themes differ (ADAP uses a #mySidenav slide-out) — MOBILE_NAV below is resolved
 * per store via branding.mobileNavSelector (see store.js).
 *
 * Layout notes that shape the mobile specs:
 * - footer.tcsFooter is display:none on phone viewports — footer tests assert DOM
 *   presence (exist), not visibility.
 * - Desktop-only seasonal banners are display:none on mobile — visible-content checks
 *   filter to :visible.
 * - .categories-left (PLP sidebar) is collapsed/hidden on mobile — assert exist, not visible.
 * - Landscape is covered for phones only; tablet landscape widths (1080–1388px) approach
 *   desktop and rarely produce distinct layout breaks worth a separate pass.
 */
import { mobileNavSelector } from './store.js';

export const PHONES = [
  // Apple iPhones — compact, standard, and current flagship sizes
  { name: 'iPhone SE 2nd gen (2020)', width: 375, height: 667, touchTarget: 44 },
  { name: 'iPhone 13 (2021)',         width: 390, height: 844, touchTarget: 44 },
  { name: 'iPhone 15 (2023)',         width: 393, height: 852, touchTarget: 44 },
  // Android phones — budget-era, mid-cycle, and current flagship
  { name: 'Samsung Galaxy S10 (2019)', width: 360, height: 760, touchTarget: 44 },
  { name: 'Samsung Galaxy A53 (2022)', width: 412, height: 892, touchTarget: 44 },
  { name: 'Google Pixel 8 (2023)',     width: 412, height: 915, touchTarget: 44 },
];

export const TABLETS = [
  // Apple iPads — budget and pro sizes
  { name: 'iPad 9th gen (2021)',          width: 810,  height: 1080, touchTarget: 24 },
  { name: 'iPad Pro 12.9" (2022)',        width: 1024, height: 1366, touchTarget: 24 },
  // Android tablets — mainstream and flagship
  { name: 'Samsung Galaxy Tab S7 (2020)', width: 800,  height: 1280, touchTarget: 24 },
  { name: 'Samsung Galaxy Tab S9 (2023)', width: 834,  height: 1388, touchTarget: 24 },
];

export const ALL_DEVICES = [...PHONES, ...TABLETS];

export const MOBILE_NAV = mobileNavSelector();
