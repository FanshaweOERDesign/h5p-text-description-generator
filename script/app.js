import DragText from "./content_types/dragText.js";
import Blanks from "./content_types/blanks.js";
import SingleChoiceSet from "./content_types/singleChoiceSet.js";
import MultiChoice from "./content_types/multiChoice.js";
import Flashcards from "./content_types/flashCards.js";
import Dialogcards from "./content_types/dialogCards.js";
import TrueFalse from "./content_types/trueFalse.js";
import Column from "./content_types/column.js";
import Accordion from "./content_types/accordion.js";
import Timeline from "./content_types/timeline.js";
import QuestionSet from "./content_types/questionSet.js";
import DocumentationTool from "./content_types/documentationTool/documentationTool.js";
import H5P2Text from "./h5p2Text.js";

function isH5PFile(file) {
  return file.name.match(/.+\.h5p$/);
}

// handle files dragged and dropped into text editor
function dropHandler(ev) {
  console.log("File(s) dropped");

  // Prevent default behavior (Prevent file from being opened)
  ev.preventDefault();
  if (ev.dataTransfer.items) {
    let item = ev.dataTransfer.items[0];
    if (item.kind === "file") {
      const file = item.getAsFile();

      // If isn't H5P file
      if (!isH5PFile(file)) {
        //Some kind of error message
        alert(file.name + " is not an H5P file");
        return;
      }

      // Check and replace `.h5p` extension with `.zip`
      const newFileName = file.name.replace(/\.h5p$/, ".zip");
      const zipFile = new File([file], newFileName, {
        type: "application/zip",
      });

      // Otherwise it's an H5P file
      unzipAndReadH5PFile(zipFile);
    }
  } else {
    // Use DataTransfer interface to access the file(s)
    readFile(ev.dataTransfer.files[0]);
  }
}

// handle files being dragged over text editor
function dragOverHandler(ev) {
  console.log("File(s) in drop zone");

  // Prevent default behavior (Prevent file from being opened)
  ev.preventDefault();
}

// upload file
const fileUploader = () => {
  let input = document.createElement("input");
  input.type = "file";

  input.onchange = async (e) => {
    // getting a hold of the file reference
    let file = e.target.files[0];
    if (!isH5PFile(file)) {
      //Some kind of error message
      alert(file.name + " is not an H5P file");
      return;
    }

    unzipAndReadH5PFile(file);
    return;
  };

  // activate the upload
  input.click();
};

// unzip FOL Help file and read into images and state variables
const unzipAndReadH5PFile = async (file) => {
  let zip = new JSZip();
  let loaded_files = await zip.loadAsync(file);

  const converter = new H5P2Text();
  try {
    converter.addContentType(new DragText());
    converter.addContentType(new Blanks());
    converter.addContentType(new SingleChoiceSet());
    converter.addContentType(new MultiChoice());
    converter.addContentType(new Flashcards());
    converter.addContentType(new Dialogcards());
    converter.addContentType(new TrueFalse());
    converter.addContentType(new DocumentationTool());
    converter.addContentType(new Accordion());
    converter.addContentType(new Timeline());
    converter.addContentType(new Column(converter));
    converter.addContentType(new QuestionSet(converter));
  } catch (err) {
    document.getElementById("errorContainer").innerHTML = err;
    console.log(err);
  }

  try {
    const { accordionHtml, solution } = await converter.parse(loaded_files);

    const parser = new DOMParser();
const doc = parser.parseFromString(accordionHtml, "text/html");
const details = doc.querySelector("details");
const preview = document.getElementById("preview_container");
preview.innerHTML = "";
preview.appendChild(details);

    document.getElementById("html_output").value = `${accordionHtml}`;
    const answerPreview = document.getElementById("answer_preview");
    const ansDoc = parser.parseFromString(solution, "text/html");
    answerPreview.innerHTML = "";
    const previewBody = ansDoc.body;
    previewBody.style.backgroundColor = "white";
    answerPreview.appendChild(ansDoc.body);
    document.getElementById("answer_output").value = `${solution}`;
  
  } catch (err) {
    document.getElementById("errorContainer").innerHTML = err;
    console.log(err);
  }
};

const copyContents = (targetId) => {
  const el = document.getElementById(targetId);
  if (!el) return;

  const text = el.value ?? el.textContent;

  navigator.clipboard.writeText(text)
    .then(() => {
      alert("Copied to clipboard");
      window.parent.postMessage({ content: text }, "*");
    })
    .catch(err => {
      console.error("Clipboard failed:", err);
      alert("Clipboard copy failed");
    });
};

// page initialization
document.addEventListener("DOMContentLoaded", function () {
  let dropZone = document.getElementById("drop_zone");
  dropZone.addEventListener("dragover", dragOverHandler);
  dropZone.addEventListener("drop", dropHandler);
  dropZone.addEventListener("click", fileUploader);
  this.getElementById("copy_text").addEventListener("click", () =>
    copyContents("html_output")
  );
  this.getElementById("copy_answer").addEventListener("click", () =>
    copyContents("answer_output")
  );
  this.getElementById("view_accepted_types_btn").addEventListener("click", (e) => {
    e.preventDefault();
    document.getElementById("accepted_types_container").classList.toggle("hidden");
  });
  this.getElementById("close_accepted_types").addEventListener("click", () =>
    document.getElementById("accepted_types_container").classList.toggle("hidden")
  );
  this.getElementById("combine_chk").addEventListener("change", (e) => {
    const htmlOutput = document.getElementById("html_output");
    const answerOutput = document.getElementById("answer_output");
    const htmlPreview = document.getElementById("preview_container");
    const solutionPreview = document.getElementById("answer_preview");
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlOutput.value, "text/html");
    const copySolutionBtn = document.getElementById("copy_answer");
    const solutionLabel = document.querySelector("label[for='answer_preview']");

    if (e.target.checked) {
      const outputDetails = doc.querySelector("details");
      let detailsHTML = outputDetails.innerHTML;
      detailsHTML += `<div><strong>Solution:</strong> ${answerOutput.value}</div>`;
      outputDetails.innerHTML = detailsHTML;
      htmlOutput.value = doc.body.innerHTML;
      htmlPreview.innerHTML = htmlOutput.value;
      answerOutput.style.display = "none";
      solutionPreview.style.display = "none";
      copySolutionBtn.style.display = "none";
      solutionLabel.style.display = "none";
    } else {
      answerOutput.style.display = "block";
      const outputHtmlText = htmlOutput.value;
      const regexString = `<div><strong>Solution:</strong> ${answerOutput.value}</div>`;
      // Remove the solution line from the HTML output
      htmlOutput.value = outputHtmlText.replace(
        regexString, ""
      );
      htmlPreview.innerHTML = htmlOutput.value;
      solutionPreview.style.display = "block";
      copySolutionBtn.style.display = "inline-block";
      solutionLabel.style.display = "block";
    }
  });
});
