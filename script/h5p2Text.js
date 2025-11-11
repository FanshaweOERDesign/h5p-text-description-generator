import ContentType from "./content_types/contentType.js";

class H5P2Text {
  constructor() {
    this.types = {};
  }

  addContentType(type) {
    if (!type || !(type instanceof ContentType)) {
      throw new Error("Invalid content type");
    }
    this.types[type.name] = type;
  }

  async parse(loaded_files) {
    const contentJsonStr = await loaded_files.files[
      "content/content.json"
    ].async("string");
    const h5pJsonStr = await loaded_files.files["h5p.json"].async("string");
    const h5pJson = JSON.parse(h5pJsonStr);
    const library = h5pJson.mainLibrary.replace("H5P.", "");
    const typeInstance = this.getTypeInstance(library);
    if (!typeInstance) {
      throw new Error(`No content type found for library ${library}`);
    }
    const result = typeInstance.parse(contentJsonStr);
    console.log("Parse result:", result);
    return result;
  }

  getTypeInstance(library) {
    const type = this.types[library];
    if (!type || !(type instanceof ContentType)) {
      return null;
    }

    return type;
  }
}

export default H5P2Text;
