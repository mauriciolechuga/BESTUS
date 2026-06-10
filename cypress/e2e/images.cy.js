import { pickRandom } from '../support/checks.js';
import { getStore, describeIfStore, storePath, homePath } from '../support/store.js';

const site = getStore();
const imageHosts = site.branding.imageHosts;

/**
 * Collects all img[src] values from the current page that belong to the site's own
 * domain (or are root-relative paths), deduplicates them, and verifies each returns
 * a non-error HTTP status. Third-party CDN images (e.g. Google, social) are excluded
 * to avoid noise from assets we don't control.
 */
function assertNoBrokenImages() {
  cy.get('img[src]').then(($imgs) => {
    const srcs = [...new Set(
      [...$imgs]
        .map((img) => img.getAttribute('src'))
        .filter((src) => {
          if (!src || src.startsWith('data:')) return false;
          if (!src.startsWith('/') && !imageHosts.some((host) => src.includes(host))) {
            return false;
          }
          if (src.includes('yotpo') || src.includes('staticw2')) return false;
          return true;
        })
    )];

    expect(srcs.length, 'number of site images found').to.be.at.least(1);

    srcs.forEach((src) => {
      const url = src.startsWith('http') ? src : `${Cypress.config('baseUrl')}${src}`;
      cy.request({ url, failOnStatusCode: false }).then((res) => {
        expect(res.status, `image status: ${url}`).to.be.lessThan(400);
      });
    });
  });
}

// ─── Alt attributes — PDP ─────────────────────────────────────────────────────
describeIfStore(site.pdp, 'Image alt attributes – PDP', { testIsolation: false }, () => {
  before(() => {
    cy.visit(storePath(pickRandom(site.pdp.popular)));
  });

  it('all product gallery images have a non-empty alt attribute', () => {
    cy.get('section[data-image-gallery] img').should('have.length.at.least', 1).each(($img) => {
      const alt = $img.attr('alt');
      expect(alt, `alt for img src="${$img.attr('src')}"`).to.not.be.undefined;
      expect(alt.trim()).to.not.be.empty;
    });
  });
});

// ─── Broken images — Homepage ─────────────────────────────────────────────────
describe('Broken images – Homepage', { testIsolation: false }, () => {
  before(() => {
    cy.visit(homePath());
  });

  it('all site images return a non-error status code', () => {
    assertNoBrokenImages();
  });
});

// ─── Broken images — PDP ─────────────────────────────────────────────────────
describeIfStore(site.pdp, 'Broken images – PDP', { testIsolation: false }, () => {
  before(() => {
    cy.visit(storePath(pickRandom(site.pdp.popular)));
  });

  it('all site images return a non-error status code', () => {
    assertNoBrokenImages();
  });
});
