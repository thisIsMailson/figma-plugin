// import JSZip from '../node_modules/jszip/dist/jszip.min.js';

figma.showUI(__html__);

figma.ui.onmessage = async (message) => {
  const selectedLayers = figma.currentPage.selection;

  // Check if there is at least one selected layer
  if (selectedLayers.length > 0) {
    // Assuming the first selected layer is the frame
    const selectedFrame = selectedLayers[0];
    console.log("frame t", selectedFrame.type);
    if (selectedFrame.type === "FRAME") {
      const frameName = selectedFrame.name;
      console.log("Selected Frame Name:", frameName);

      const exportResults = [];

      for (const child of selectedFrame.children) {
        const node = await child.exportAsync({ format: "PNG" });
        console.log("node ->", node);
        exportResults.push(node);
      }

      return exportResults;
    } else {
      console.error("Please select a frame to start the plugin.");
    }
  } else {
    console.error(
      "No layers are selected. Please select a frame to start the plugin."
    );
  }

  figma.closePlugin();
};

// Traverse layers under the selected frame
const traverseLayers = (layer) => {
  for (const child of layer.children) {
    handleLayerType(child);
  }
};

const downloadImage = async (imageLayer) => {
  const imageHash = imageLayer.imageHash;
  const image = await figma.getImageByHash(imageHash);

  // Use the 'image' object to access image data
  console.log("Downloaded Image:", image);
};

// Example: Handling different layer types
const handleLayerType = async (layer) => {
  switch (layer.type) {
    case "IMAGE":
      downloadImage(layer);
      break;
    case "RECTANGLE":
    case "GROUP":
      // Download RECTANGLE and GROUP layers as PNG
      const exportSettings = {
        format: "PNG",
        constraint: { type: "SCALE", value: 2 },
      };

      try {
        const exp = await layer.exportAsync(exportSettings);
        console.log("your img ->", exp);

        // Send the image bytes to the Figma UI
      } catch (error) {
        console.error("Error exporting PNG:", error);
      }

      break;
    default:
      break;
  }
};
