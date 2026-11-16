describe('File Upload Verification', () => {
  const testCases = Cypress.expose('testCases') || [];

  it('loads at least one test case from the external assets directory', () => {
    expect(testCases.length).to.be.greaterThan(0);
  });

  testCases.forEach((testCase) => {
    it(`processes ${testCase.name} and matches expected output`, () => {
      // Open the app
      cy.visit('/');

      cy.get('#drop_zone')
        .should('be.visible')
        .selectFile(testCase.inputPath, { action: 'drag-drop' });

      cy.get('#html_output', { timeout: 15000 })
        .should('be.visible')
        .and('have.value', testCase.expected.accordionHtml);

      cy.get('#answer_output')
        .should('be.visible')
        .and('have.value', testCase.expected.solution);
    });
  });
});
