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

  it('footer is visible with all four section headings', () => {
    cy.visit('/');
    cy.get('footer.tcsFooter').should('be.visible');
    cy.get('footer .footer-top').should('be.visible');
    cy.get('footer .footer-bottom').should('be.visible');
    cy.get('footer .Copyright').should('be.visible');

    const expectedHeadings = ["WHAT'S IN STORE", 'SECURE SHOPPING', 'MY ACCOUNT', 'Contact Info'];
    cy.get('footer .box h3').then(($headings) => {
      const texts = [...$headings].map((el) => {
        const clone = el.cloneNode(true);
        clone.querySelectorAll('svg').forEach((svg) => svg.remove());
        return clone.textContent.trim();
      });
      expectedHeadings.forEach((heading) => {
        expect(texts).to.include(heading);
      });
    });
  });

  it('footer links all resolve without 404', () => {
    cy.visit('/');
    cy.get('footer a[href]').then(($links) => {
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

  it('footer nav links have non-empty visible text', () => {
    cy.visit('/');
    cy.get('footer .box ul li a').each(($a) => {
      expect($a.text().trim()).to.not.be.empty;
    });
  });

  it('footer contact info shows phone, fax, address, and warehouses link', () => {
    cy.visit('/');
    cy.get('footer .Contact-info-box').should('have.length.at.least', 3);

    // Phone and fax: verify tel: links exist and have non-empty text (not hardcoded)
    cy.get('footer .Contact-info-box a[href^="tel:"]').should('have.length.at.least', 2).each(($a) => {
      expect($a.text().trim()).to.match(/[\d\-\(\)\s\+]+/);
    });

    cy.get('footer .Contact-info-box').contains('New York').should('exist');

    cy.get('footer a[href="/warehouses/"]').should('be.visible').and('contain.text', 'Warehouses');
  });

  it('footer payment icons section is visible', () => {
    cy.visit('/');
    cy.get('footer .footer-payment-icons').should('be.visible');
  });

  it('footer copyright year is current', () => {
    cy.visit('/');
    const currentYear = new Date().getFullYear().toString();
    cy.get('footer .Copyright p').should('contain.text', currentYear);
    cy.get('footer .Copyright p').should('contain.text', 'Best Access Doors');
  });

  it('footer partner logo links resolve without error', () => {
    const partnerLinks = [
      'https://www.bimobject.com/en/best-access-doors?location=us',
      'https://www.rib-software.com/en/rib-speclink',
    ];
    partnerLinks.forEach((url) => {
      cy.request({ url, failOnStatusCode: false }).its('status').should('not.eq', 404);
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
