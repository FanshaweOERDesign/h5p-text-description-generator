function normalizeOutput(output) {
  const parser = new DOMParser();
  const description = parser.parseFromString(output.accordionHtml, 'text/html');
  const answerLists = Array.from(description.querySelectorAll('details > div'))
    .filter((element) => element.textContent.trim() === 'Possible answers:')
    .map((element) => element.nextElementSibling)
    .filter((element) => element?.tagName === 'UL');

  if (answerLists.length) {
    answerLists.forEach((list) => {
      const choices = Array.from(list.children, (item) => item.outerHTML).sort();
      list.innerHTML = choices.join('');
    });
    output = { ...output, accordionHtml: description.body.innerHTML };
  }

  if (!/This activity contains a set of (dialog cards|flashcards),/.test(output.accordionHtml)) {
    return output;
  }

  const solution = parser.parseFromString(output.solution, 'text/html');
  const cardList = description.querySelector('details > ol');
  const answerList = solution.querySelector('body > ol');
  const cards = Array.from(cardList.children);
  const answers = Array.from(answerList.children);

  expect(answers.length, 'one solution per card').to.equal(cards.length);
  const pairs = cards.map((card, index) => [card.outerHTML, answers[index].outerHTML]);
  pairs.sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)));
  cardList.replaceChildren();
  answerList.replaceChildren();

  return {
    accordionHtml: description.body.innerHTML,
    solution: solution.body.innerHTML,
    pairs,
  };
}

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

      cy.get('#html_output, #answer_output', { timeout: 15000 })
        .should('be.visible')
        .and(($outputs) => {
          const actual = {
            accordionHtml: $outputs.filter('#html_output').val(),
            solution: $outputs.filter('#answer_output').val(),
          };
          const expected = {
            accordionHtml: testCase.expected.accordionHtml,
            solution: testCase.expected.solution,
          };
          expect(normalizeOutput(actual)).to.deep.equal(normalizeOutput(expected));
        });
    });
  });
});
