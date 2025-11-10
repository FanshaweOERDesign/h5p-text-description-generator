import ContentType from "./contentType.js";

export default class Accordion extends ContentType {
  constructor() {
    super();
    this.name = "Accordion";
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

  parse(contentJson) {
    const content = JSON.parse(contentJson);

    const details = this.createDetailsElement();
    details.innerHTML += '<div>&nbsp;</div>'; // Add spacing after summary
    const contentItems = content.panels;
    contentItems.forEach((item) => {
      const itemContent = document.createElement("div");
      itemContent.innerHTML += `<div><strong>${item.title ? item.title : "Panel Title"}</strong></div>`;
      const itemText = this.trimEmptyHtmlEdges(item.content?.params?.text || "");
      itemContent.innerHTML += `${itemText || "Panel Content"}`;
      details.appendChild(itemContent);
    });
    const accordionHtml = details.outerHTML;
    const solution = details.innerHTML;
    return { accordionHtml, solution };
  }
}
