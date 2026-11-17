function readCorrectChoices(solutionText, choices) {
  expect(solutionText).to.match(/^Correct answer\(s\):/);
  let remaining = solutionText.replace(/^Correct answer\(s\):\s*/, '');
  const correct = [];
  while (remaining) {
    const label = remaining.match(/^([a-z])\. /);
    expect(label, 'solution has an answer letter').not.to.equal(null);
    const index = label[1].charCodeAt(0) - 97;
    expect(index, 'solution letter refers to an existing choice').to.be.lessThan(choices.length);
    expect(correct, 'solution does not repeat a choice').not.to.include(index);
    remaining = remaining.slice(label[0].length);
    const text = choices[index];
    expect(remaining.startsWith(text), 'solution text matches its lettered choice').to.equal(true);
    remaining = remaining.slice(text.length);
    correct.push(index);
    if (remaining) {
      expect(remaining, 'correct answers are separated by semicolons').to.match(/^;\s*/);
      remaining = remaining.replace(/^;\s*/, '');
    }
  }
  return correct;
}

function normalizeOutput(output) {
  const parser = new DOMParser();
  const description = parser.parseFromString(output.accordionHtml, 'text/html');
  const questionList = description.querySelector('body > details > ol:not([type])');
  const questionChoices = questionList && Array.from(questionList.children, (question) =>
    question.querySelector(':scope > ol[type="a"]')
  );
  if (questionChoices?.some(Boolean)) {
    expect(questionChoices.every(Boolean), 'every question has a choice list').to.equal(true);
    const solution = parser.parseFromString(output.solution, 'text/html');
    const answerList = solution.querySelector('body > ol');
    expect(answerList, 'single choice set solution exists').not.to.equal(null);
    const answers = Array.from(answerList.children);
    expect(answers.length, 'one solution per question').to.equal(questionChoices.length);
    const normalizedQuestions = questionChoices.map((list, questionIndex) => {
      const choices = Array.from(list.children);
      const answer = answers[questionIndex].textContent.trim();
      const label = answer.match(/^([a-z])\. /);
      expect(label, 'solution has an answer letter').not.to.equal(null);
      const correctIndex = label[1].charCodeAt(0) - 97;
      expect(correctIndex, 'solution letter refers to an existing choice').to.be.lessThan(choices.length);
      expect(answer.slice(label[0].length), 'solution text matches its lettered choice')
        .to.equal(choices[correctIndex].textContent.trim());
      const normalizedChoices = choices.map((choice, index) => ({
        html: choice.outerHTML,
        correct: index === correctIndex,
      }));
      normalizedChoices.sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)));
      list.replaceChildren();
      answers[questionIndex].textContent = '';
      return normalizedChoices;
    });
    return {
      accordionHtml: description.body.innerHTML,
      solution: solution.body.innerHTML,
      questions: normalizedQuestions,
    };
  }

  const choiceList = description.querySelector('body > details > ol[type="a"]');
  if (choiceList) {
    const solution = parser.parseFromString(output.solution, 'text/html');
    const solutionElement = solution.querySelector('body > div');
    expect(solutionElement, 'multiple choice solution exists').not.to.equal(null);
    const choices = Array.from(choiceList.children);
    // The app renders choice text as HTML in the solution, so decode it the same way.
    const solutionTexts = choices.map((choice) =>
      parser.parseFromString(choice.textContent, 'text/html').body.textContent.trim()
    );
    const correct = readCorrectChoices(solutionElement.textContent.trim(), solutionTexts);
    const normalizedChoices = choices.map((choice, index) => ({
      html: choice.outerHTML,
      correct: correct.includes(index),
    }));
    normalizedChoices.sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)));
    choiceList.replaceChildren();
    solutionElement.textContent = 'Correct answer(s):';
    return {
      accordionHtml: description.body.innerHTML,
      solution: solution.body.innerHTML,
      choices: normalizedChoices,
    };
  }

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
