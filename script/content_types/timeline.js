import ContentType from "./contentType.js";

export default class Timeline extends ContentType {
    constructor() {
        super();
        this.name = "Timeline";
    }

    parse(contentJson) {
        function parseDateString(dateStr) {
            const dateParts = dateStr.split(",").map(part => parseInt(part.trim(), 10));
            console.log("Date parts:", dateParts);
            const date = new Date(dateParts[0], (dateParts[1] || 1) - 1, dateParts[2] || 1);
            if (!dateParts[1]) {
                return date.toLocaleString('default', { year: 'numeric' });
            } else if (!dateParts[2]) {
                return date.toLocaleString('default', { month: 'long', year: 'numeric' });
            } else {
                return date.toLocaleDateString();
            }
        }

        const content = JSON.parse(contentJson);

        const details = this.createDetailsElement();
        details.innerHTML += '<div>&nbsp;</div>'; // Add spacing after summary
        details.innerHTML += `<div style='margin-bottom: 10px;'><strong>${content.timeline.headline || "Timeline"}</strong></div>`;
        details.innerHTML += `<div style='margin-bottom: 10px;'>${this.trimEmptyHtmlEdges(content.timeline.text || "")}</div>`;
        details.innerHTML += '<hr />';
        const contentItems = content.timeline.date.sort((a, b) => {
            const aDateArr = a.startDate.split(",").filter(Boolean).map(num => parseInt(num.trim(), 10));
            const bDateArr = b.startDate.split(",").filter(Boolean).map(num => parseInt(num.trim(), 10));
            a.start_date = { year: aDateArr[0], month: aDateArr[1], day: aDateArr[2] };
            b.start_date = { year: bDateArr[0], month: bDateArr[1], day: bDateArr[2] };
            return new Date(a.start_date.year, (a.start_date.month || 1) - 1, a.start_date.day || 1) -
                new Date(b.start_date.year, (b.start_date.month || 1) - 1, b.start_date.day || 1);
        });
        contentItems.forEach((item, idx) => {
            const itemContent = document.createElement("div");
            itemContent.innerHTML += `<div><strong>${parseDateString(item.startDate) + (item.endDate ? ` - ${parseDateString(item.endDate)}` : "")}: ${item.headline ? item.headline : "Event"}</strong></div>`;
            const itemText = this.trimEmptyHtmlEdges(item.text || "");
            itemContent.innerHTML += `${itemText}`;
            if (idx < contentItems.length - 1) {
                itemContent.innerHTML += '<hr />';
            }
            
            details.appendChild(itemContent);
        });
        const accordionHtml = details.outerHTML;
        const solution = details.innerHTML;
        return { accordionHtml, solution };
    }
}
