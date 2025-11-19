export default class ContentType {
  stripHtml(html) {
    if (!html) {
      return "";
    }
    const div = document.createElement("div");
    div.innerHTML = html;
    const result = div.textContent || div.innerText || "";
    return result;
  }

  stripEnclosingTags(htmlString) {
    if (!htmlString) return '';

    // Trim outer whitespace characters including &nbsp;
    htmlString = htmlString.replace(/^(?:\s|&nbsp;)+|(?:\s|&nbsp;)+$/gi, '');

    const container = document.createElement('div');
    container.innerHTML = htmlString;

    // Remove leading and trailing whitespace-only nodes
    const removeEmptyNodes = (el) => {
      while (el.firstChild && isEmptyNode(el.firstChild)) {
        el.removeChild(el.firstChild);
      }
      while (el.lastChild && isEmptyNode(el.lastChild)) {
        el.removeChild(el.lastChild);
      }
    };

    const isEmptyNode = (node) => {
      return (node.nodeType === Node.TEXT_NODE && !node.textContent.trim()) ||
        (node.nodeType === Node.ELEMENT_NODE &&
          ['BR'].includes(node.tagName) ? false : !node.textContent.trim());
    };

    removeEmptyNodes(container);

    // If container now has a single child that is a div or p, unwrap it
    while (
      container.childNodes.length === 1 &&
      container.firstChild.nodeType === Node.ELEMENT_NODE &&
      ['DIV', 'P'].includes(container.firstChild.tagName)
    ) {
      removeEmptyNodes(container.firstChild); // clean inner whitespace
      container.innerHTML = container.firstChild.innerHTML;
    }

    return container.innerHTML.trim();
  }


  createDetailsElement(description) {
    const details = document.createElement("details");
    const summary = document.createElement("summary");
    summary.innerHTML = description ? `<strong>${description}</strong>` : "<strong>Text Description</strong>";
    details.appendChild(summary);
    return details;
  }

  shuffleArray(array) {
    for (let i = array.length - 1; i >= 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }

  addLineBreaksToHtml(text) {
    const tagIndex = (t, i) => {
      const str = t.substring(i);
      const idx = str.search(/<\/?(details|summary|div|p|ul|ol|li)>/);
      if (idx === -1) {
        return idx;
      }
      return idx + i;
    };

    let index = tagIndex(text, 0);
    while (index !== -1) {
      if (index > 0 && text[index - 1] !== "\n") {
        text = text.substring(0, index) + "\n" + text.substring(index);
      }
      index = text.indexOf(">", index) + 1;
      if (index < text.length && text[index] !== "\n") {
        text = text.substring(0, index) + "\n" + text.substring(index);
      }
      index = tagIndex(text, index);
    }

    return text;
  }

  trimEmptyHtmlEdges(html) {
    // Create a DOM parser
    const container = document.createElement('div');
    container.innerHTML = html;

    // Helper: check if an element is empty (only whitespace or &nbsp;)
    const isEmptyElement = (el) => {
      const text = el.textContent.replace(/\u00a0/g, '').trim(); // remove &nbsp; and whitespace
      return text.length === 0;
    };

    // Remove empty elements from the start
    while (container.firstElementChild && isEmptyElement(container.firstElementChild)) {
      container.removeChild(container.firstElementChild);
    }

    // Remove empty elements from the end
    while (container.lastElementChild && isEmptyElement(container.lastElementChild)) {
      container.removeChild(container.lastElementChild);
    }

    return container.innerHTML.trim();
  }
}
