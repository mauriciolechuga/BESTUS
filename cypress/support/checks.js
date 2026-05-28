/**
 * Shared, importable assertion helpers used across specs. Each issues Cypress commands
 * and is safe to call inside an `it`. Grouped assertions live here (rather than as custom
 * commands) so they read as plain functions with their rationale documented alongside.
 */

/** Waits for the product grid to populate. */
export const waitForProducts = (min = 1) =>
  cy.get('ul.productGrid li.product', { timeout: 20000 }).should('have.length.at.least', min);

/** Picks a random element from a non-empty list. */
export const pickRandom = (list) => list[Math.floor(Math.random() * list.length)];

/** Asserts the first `limit` product cards each have an image, title, price, and link. */
export function assertProductCards(limit = 3) {
  cy.get('ul.productGrid li.product').each(($li, i) => {
    if (i >= limit) return false;
    cy.wrap($li).within(() => {
      cy.get('.card-figure img').should('exist').invoke('attr', 'src').should('not.be.empty');
      cy.get('.card-title').invoke('text').should('not.be.empty');
      cy.get('[class*="price"]').invoke('text').should('match', /\$[\d,]+(\.\d{2})?/);
      cy.get('.card-figure a, .card-title a')
        .first()
        .invoke('attr', 'href')
        .should('not.be.empty')
        .and('include', '/');
    });
  });
}

/** Asserts the page does not overflow horizontally beyond `maxWidth`. */
export function assertNoHorizontalOverflow(maxWidth) {
  // body.scrollWidth > viewport width means content spills off-screen, forcing the user
  // to scroll horizontally — the most common mobile layout bug.
  cy.window().then((win) => {
    expect(win.document.body.scrollWidth, 'body.scrollWidth').to.be.lte(maxWidth);
  });
}

/**
 * Asserts the tallest visible interactive header element is at least `minHeight` px.
 * Uses Math.max (not .first()) because DOM order puts small utility/skip links first;
 * the real question is whether there is at least one prominently-sized tappable element.
 */
export function assertMaxTouchTarget(minHeight) {
  cy.get('header a[href], header button')
    .filter(':visible')
    .filter((i, el) => el.getBoundingClientRect().height > 0)
    .should('have.length.at.least', 1)
    .then(($els) => {
      const maxHeight = Math.max(...[...$els].map((el) => el.getBoundingClientRect().height));
      expect(maxHeight, 'Tallest header interactive element height').to.be.gte(minHeight);
    });
}

/** Asserts the breadcrumb trail has a Home link and at least two labels. */
export function assertBreadcrumbs() {
  cy.get('.breadcrumbs.new_breadcrumbs').should('be.visible').within(() => {
    cy.get('a.breadcrumb-home').should('be.visible');
    cy.get('.breadcrumb-label').should('have.length.at.least', 2);
  });
}

/** Asserts the on-PDP "have a product question" Zoho form is present with its required fields. */
export function assertProductInfoForm() {
  cy.get('#have_a_product_question_request').should('exist').within(() => {
    cy.get('form[action*="zohopublic"]').should('exist');
    cy.get('input[name="Name_First"]').should('exist');
    cy.get('input[name="Name_Last"]').should('exist');
    cy.get('input[name="Email"]').should('exist');
  });
}

/**
 * Asserts the footer's four sections are present along with their heading text.
 * @param {'exist'|'be.visible'} mode — desktop footer is visible; mobile footer is display:none.
 */
export function assertFooterHeadings(mode = 'exist') {
  cy.get('footer.tcsFooter').should(mode);
  cy.get('footer .footer-top').should(mode);
  cy.get('footer .footer-bottom').should(mode);
  cy.get('footer .Copyright').should(mode);

  const expected = ["WHAT'S IN STORE", 'SECURE SHOPPING', 'MY ACCOUNT', 'Contact Info'];
  cy.get('footer .box h3').then(($headings) => {
    const texts = [...$headings].map((el) => {
      const clone = el.cloneNode(true);
      clone.querySelectorAll('svg').forEach((svg) => svg.remove());
      return clone.textContent.trim();
    });
    expected.forEach((heading) => expect(texts).to.include(heading));
  });
}

/**
 * Creates a console.error spy to attach at page-load time and assert on later.
 * Returns { onBeforeLoad, assertClean }. Uses a closure ref (not a cy alias) so it
 * survives across tests that share a single visit under testIsolation:false.
 *
 *   const consoleErrors = makeConsoleErrorSpy();
 *   before(() => cy.visit(url, { onBeforeLoad: consoleErrors.onBeforeLoad }));
 *   it('has no console errors', () => consoleErrors.assertClean());
 */
export function makeConsoleErrorSpy() {
  const ref = {};
  return {
    onBeforeLoad: (win) => {
      ref.spy = cy.spy(win.console, 'error');
    },
    assertClean: () =>
      cy.then(() => {
        expect(ref.spy, 'console.error').to.not.have.been.called;
      }),
  };
}
