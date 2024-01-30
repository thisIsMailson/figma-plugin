// import JSZip from '../node_modules/jszip/dist/jszip.min.js';
// https://github.com/brianlovin/figma-export-zip/tree/main

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

  figma.closePlugin();
};
async function main(params) {
  let exportableBytes = [];
  const nodes = selectedLayers[0].children;
  console.log("data", nodes);

  for (let node of nodes) {
    console.log("data", node);

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
  console.log("data", exportableBytes);
  figma.showUI(__html__, { visible: false });
  figma.ui.postMessage({ message: exportableBytes });

  return new Promise((res) => {
    figma.ui.onmessage = () => res();
  });
}

main("message").then((res) => console.log("closing main"));

// figma.showUI(__html__);
