// import JSZip from '../node_modules/jszip/dist/jszip.min.js';
// https://github.com/brianlovin/figma-export-zip/tree/main
import JSZip from "../node_modules/jszip/dist/jszip.min.js";
const selectedLayers = figma.currentPage.selection;
figma.ui.onmessage = async (message) => {
  console.log("mess", selectedLayers);
  let exportableBytes = [];
  const nodes = selectedLayers[0].children;
  for (let node of nodes) {
    let { name, exportSettings } = node;
    if (exportSettings.length === 0) {
      exportSettings = [
        {
          format: "PNG",
          suffix: "",
          constraint: { type: "SCALE", value: 1 },
          contentsOnly: true,
        },
      ];
    }

    for (let setting of exportSettings) {
      let defaultSetting = setting;
      const bytes = await node.exportAsync(defaultSetting);
      exportableBytes.push({ name, setting, bytes });
    }
  }
  generateZip(exportableBytes);
  figma.closePlugin();
};

function typedArrayToBuffer(array) {
  return array.buffer.slice(
    array.byteOffset,
    array.byteLength + array.byteOffset
  );
}

function exportTypeToBlobType(type) {
  switch (type) {
    case "PDF":
      return "application/pdf";
    case "SVG":
      return "image/svg+xml";
    case "PNG":
      return "image/png";
    case "JPG":
      return "image/jpeg";
    default:
      return "image/png";
  }
}

function exportTypeToFileExtension(type) {
  switch (type) {
    case "PDF":
      return ".pdf";
    case "SVG":
      return ".svg";
    case "PNG":
      return ".png";
    case "JPG":
      return ".jpg";
    default:
      return ".png";
  }
}

const generateZip = (exportableBytes) => { 
  console.log("evt", exportableBytes);
  if (!exportableBytes) return;

  return new Promise((resolve) => {
    let zip = new JSZip();

    for (let data of exportableBytes) {
      console.log("data =>", data);
      const { bytes, name, setting } = data;
      const cleanBytes = typedArrayToBuffer(bytes);
      const type = exportTypeToBlobType(setting.format);
      const extension = exportTypeToFileExtension(setting.format);
      let blob = new Blob([cleanBytes], { type });
      zip.file(`${name}${setting.suffix}${extension}`, blob, {
        base64: true,
      });
    }

    zip.generateAsync({ type: "blob" }).then((content) => {
      const blobURL = window.URL.createObjectURL(content);
      const link = document.createElement("a");
      link.className = "button button--primary";
      link.href = blobURL;
      link.download = "export.zip";
      link.click();
      link.setAttribute("download", name + ".zip");
      resolve();
    });
  }).then(() => {
    window.parent.postMessage({ pluginMessage: "Done!" }, "*");
  });
};
async function main(params) {
  let exportableBytes = [];
  const nodes = selectedLayers[0].children;
  for (let node of nodes) {
    let { name, exportSettings } = node;
    if (exportSettings.length === 0) {
      exportSettings = [
        {
          format: "PNG",
          suffix: "",
          constraint: { type: "SCALE", value: 1 },
          contentsOnly: true,
        },
      ];
    }

    for (let setting of exportSettings) {
      let defaultSetting = setting;
      const bytes = await node.exportAsync(defaultSetting);
      exportableBytes.push({ name, setting, bytes });
    }
  }

  figma.showUI(__html__, { visible: false });
  figma.ui.postMessage({ message: exportableBytes });

  return new Promise((res) => {
    figma.ui.onmessage = () => res();
  });
}

// main("message").then((res) => console.log("closing main"));

figma.showUI(__html__);
