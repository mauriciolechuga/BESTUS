/**
 * ============================================================
 *  Cypress E2E — Broken Image Detector
 * ============================================================
 *  Author : Mauricio Lechuga
 *  Purpose: Scan pages for broken images and report them.
 *
 *  What this test does:
 *    1. Visits each page listed in the pagesToCheck array
 *    2. Finds every <img> tag on the page
 *    3. Skips tracking pixels and invisible images
 *    4. Checks that each image actually loaded (naturalWidth > 0)
 *    5. Logs any broken images with their src URL
 *
 *  HOW TO RUN
 *    npx cypress open          (interactive / headed)
 *    npx cypress run            (headless CI mode)
 * ============================================================
 */

describe('Broken Image Detector', () => {

  // ── Pages to scan (add as many as you need) ─────────────
  const pagesToCheck = [
    '/',
    '/request-a-quote/',
  ];

  pagesToCheck.forEach((page) => {

    it(`has no broken images on ${page}`, () => {

      cy.visit(`https://www.bestaccessdoors.com${page}`);

      // Collect broken images so we can report them all at once
      const brokenImages = [];

      cy.get('img').each(($img) => {
        // Skip tracking pixels, spacers, and hidden images
        if ($img.width() === 0 && $img.height() === 0) return;
        if (!$img.is(':visible')) return;

        const src = $img.attr('src') || $img.attr('data-src') || 'unknown';
        const naturalWidth = $img.prop('naturalWidth');

        if (!naturalWidth || naturalWidth === 0) {
          brokenImages.push(src);
          cy.log(`BROKEN IMAGE: ${src}`);
        }
      }).then(() => {
        // After checking all images, fail the test if any were broken
        if (brokenImages.length > 0) {
          cy.screenshot(`broken-images-${page.replace(/\//g, '_')}`);
        }

        expect(
          brokenImages,
          `Found ${brokenImages.length} broken image(s):\n${brokenImages.join('\n')}`
        ).to.have.length(0);
      });
    });
  });
});

// ── Capture uncaught JS errors for reporting ──────────────
Cypress.on('uncaught:exception', (err) => {
  Cypress.log({
    name: 'Uncaught Error',
    message: err.message,
  });
  return false;
});