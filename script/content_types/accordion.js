import ContentType from "./contentType.js";

export default class Accordion extends ContentType {
  constructor() {
    super();
    this.name = "Accordion";
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
