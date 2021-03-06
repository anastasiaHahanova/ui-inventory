/* global describe it before after Nightmare */

module.exports.test = function uiTest(uiTestCtx) {
  describe('Module test: inventory:filters', function modTest() {
    const { config, helpers: { login, openApp, logout }, meta: { testVersion } } = uiTestCtx;
    const nightmare = new Nightmare(config.nightmare);

    this.timeout(Number(config.test_timeout));
    // Resource type filter test disabled as new resource types are being loaded.
    // const filters = ['resource-Books', 'resource-Serials', 'resource-eBooks', 'language-English', 'language-Spanish', 'location-Annex'];
    const filters = ['language-English', 'language-Spanish', 'location-Annex'];
    let hitCount = null;
    describe('Login > Open module "Inventory" > Get hit counts > Click filters > Logout', () => {
      before((done) => {
        login(nightmare, config, done); // logs in with the default admin credentials
      });
      after((done) => {
        logout(nightmare, config, done);
      });
      it('should open module "Inventory" and find version tag ', (done) => {
        nightmare
          .use(openApp(nightmare, config, done, 'inventory', testVersion))
          .then(result => result);
      });
      it('should find hit count with no filters applied', (done) => {
        nightmare
          .wait('p[title*="records found"]:not([title^="0 "]')
          .wait(1111)
          .evaluate(() => {
            let count = document.querySelector('p[title*="records found"]').title;
            count = count.replace(/^(\d+).+/, '$1');
            return count;
          })
          .then((result) => {
            done();
            hitCount = result;
          })
          .catch(done);
      });
      filters.forEach((filter) => {
        it(`should click ${filter} and change hit count`, (done) => {
          nightmare
            .wait('#input-inventory-search')
            .type('#input-inventory-search', 0)
            .wait('#clickable-reset-all')
            .click('#clickable-reset-all')
            .wait(`#clickable-filter-${filter}`)
            .click(`#clickable-filter-${filter}`)
            .wait('#clickable-reset-all')
            .wait(`p[title*="record"]:not([title^="${hitCount} "]`)
            .click(`#clickable-filter-${filter}`)
            .wait(`p[title="${hitCount} records found"]`)
            .then(done)
            .catch(done);
        });
      });
    });
  });
};
