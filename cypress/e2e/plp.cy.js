describe('Product Listing Page', () => {
  const PLP = '/products/';
  const SUBCAT = '/products/popular-picks/fire-rated/';

  const waitForProducts = (minCount = 1) =>
    cy.get('ul.productGrid li.product', { timeout: 20000 }).should('have.length.at.least', minCount);

  // ─── Page structure ────────────────────────────────────────────────────────

  it('loads with correct heading and breadcrumb', () => {
    cy.visit(PLP);
    cy.get('h1.page-heading').should('contain.text', 'Products');
    cy.get('.breadcrumbs.new_breadcrumbs').within(() => {
      cy.get('a.breadcrumb-home').should('be.visible');
      cy.contains('a', 'Products').should('be.visible');
    });
  });

  it('sidebar is visible with category navigation', () => {
    cy.visit(PLP);
    cy.get('.categories-left').should('be.visible');
    cy.get('.categories-left .sidebarBlock').should('have.length.at.least', 2);
    cy.get('.categories-left .navList-item a').each(($a) => {
      expect($a.text().trim()).to.not.be.empty;
    });
  });

  it('best sellers sidebar block renders with labelled links', () => {
    cy.visit(PLP);
    cy.get('#treeView li a').should('have.length.at.least', 1).each(($a) => {
      expect($a.text().trim()).to.not.be.empty;
    });
  });

  it('subcategory boxes render with non-empty titles and valid links', () => {
    cy.visit(PLP);
    cy.get('.subCategoriesBox').should('have.length.at.least', 1).each(($box) => {
      expect($box.find('.nameTitle').text().trim()).to.not.be.empty;
      const href = $box.find('a.navList-action').attr('href');
      expect(href).to.not.be.empty;
      expect(href).to.include('/');
    });
  });

  // ─── Product grid ──────────────────────────────────────────────────────────

  it('renders products on the top-level PLP', () => {
    cy.visit(PLP);
    waitForProducts(1);
  });

  it('each product card has an image, title, price, and link', () => {
    cy.visit(PLP);
    waitForProducts().then(() => {
      cy.get('ul.productGrid li.product').each(($li, i) => {
        if (i >= 3) return false; // only check first 3 cards

        cy.wrap($li).within(() => {
          cy.get('.card-figure img')
            .should('exist')
            .invoke('attr', 'src')
            .should('not.be.empty');

          cy.get('.card-title')
            .invoke('text')
            .should('not.be.empty');

          cy.get('[class*="price"]')
            .invoke('text')
            .should('match', /\$[\d,]+(\.\d{2})?/);

          cy.get('.card-figure a, .card-title a')
            .first()
            .invoke('attr', 'href')
            .should('not.be.empty')
            .and('include', '/');
        });
      });
    });
  });

  it('clicking a product card navigates to the PDP', () => {
    cy.visit(PLP);
    waitForProducts();
    cy.get('ul.productGrid li.product').first().find('.card-title a').click();
    cy.url().should('not.include', '/products/');
    cy.get('h1').should('be.visible');
  });

  // ─── Subcategory page ──────────────────────────────────────────────────────

  it('subcategory page shows correct heading and breadcrumb trail', () => {
    cy.visit(SUBCAT);
    cy.get('h1.page-heading').invoke('text').should('not.be.empty');
    cy.get('.breadcrumbs.new_breadcrumbs').within(() => {
      cy.contains('a', 'Products').should('be.visible');
    });
  });

  it('subcategory page loads products and SearchSpring sidebar', () => {
    cy.visit(SUBCAT);
    waitForProducts();
    cy.get('#searchspring-sidebar').should('exist');
  });

  // ─── Pagination ────────────────────────────────────────────────────────────

  it('pagination controls are present after products load', () => {
    cy.visit(PLP);
    waitForProducts();
    cy.get('[class*="pagination"], [class*="Pagination"], [aria-label*="pagination"], [aria-label*="page"]')
      .should('exist');
  });

  it('pagination JSON blob is valid and references page 2', () => {
    cy.visit(PLP);
    cy.get('div[style="display:none"]').first().invoke('text').then((raw) => {
      const data = JSON.parse(raw);
      expect(data.current).to.eq(1);
      expect(data.links).to.have.length.at.least(2);
      expect(data.next).to.include('page=2');
    });
  });

  // ─── Link health & console errors ─────────────────────────────────────────

  it('sidebar category links all resolve without 404', () => {
    cy.visit(PLP);
    cy.get('.categories-left .navList-item a[href]').then(($links) => {
      const hrefs = [...new Set([...$links].map((a) => a.getAttribute('href')).filter(Boolean))];
      hrefs.forEach((href) => {
        const url = href.startsWith('http') ? href : `${Cypress.config('baseUrl')}${href}`;
        cy.request({ url, failOnStatusCode: false }).its('status').should('not.eq', 404);
      });
    });
  });

  it('has no console errors on page load', () => {
    cy.visit(PLP, {
      onBeforeLoad(win) {
        cy.spy(win.console, 'error').as('consoleError');
      },
    });
    cy.get('@consoleError').should('not.have.been.called');
  });
});
