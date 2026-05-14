describe('Homepage', () => {

  it('loads with key elements visible', () => {
    cy.visit('/');
    cy.get('header').should('be.visible');
    cy.get('footer').should('be.visible');
    cy.get('[class*="carousel"], [class*="hero"], [class*="banner"], main, [role="main"]').first().should('be.visible');
  });

  it('header and nav links all resolve without 404', () => {
    cy.visit('/');
    cy.get('header a[href]').then(($links) => {
      const hrefs = [...$links]
        .map((a) => a.getAttribute('href'))
        .filter((href) => href && !href.startsWith('#') && !href.startsWith('tel:') && !href.startsWith('mailto:') && !href.includes('amazon') && !href.includes('facebook'));
      const unique = [...new Set(hrefs)];
      unique.forEach((href) => {
        const url = href.startsWith('http') ? href : `https://www.bestaccessdoors.com${href}`;
        cy.request({ url, failOnStatusCode: false }).its('status').should('not.eq', 404);
      });
    });
  });

  it('footer links all resolve without 404', () => {
    cy.visit('/');
    cy.get('footer a').then(($links) => {
      const hrefs = [...$links]
        .map((a) => a.getAttribute('href'))
        .filter((href) => href && !href.startsWith('#') && !href.startsWith('tel:') && !href.startsWith('mailto:'));
      const unique = [...new Set(hrefs)];
      unique.forEach((href) => {
        const url = href.startsWith('http') ? href : `https://www.bestaccessdoors.com${href}`;
        cy.request({ url, failOnStatusCode: false }).its('status').should('not.eq', 404);
      });
    });
  });

  it('phone number in header matches footer', () => {
    cy.visit('/');
    cy.get('header [href^="tel:"]').first().invoke('text').then((headerPhone) => {
      cy.get('footer [href^="tel:"]').first().invoke('text').should('eq', headerPhone.trim());
    });
  });

  it('has no console errors', () => {
    cy.visit('/', {
      onBeforeLoad(win) {
        cy.spy(win.console, 'error').as('consoleError');
      },
    });
    cy.get('@consoleError').should('not.have.been.called');
  });

});
