figma.showUI(__html__);
figma.ui.resize(500, 500);

figma.ui.onmessage = async (msg) => {
  await figma.loadFontAsync({ family: "Rubik", style: "Regular" });

  const nodes: SceneNode[] = [];

  const postComponentSet = figma.root.findOne(
    (node) => node.type == "COMPONENT_SET" && node.name == "post"
  ) as ComponentSetNode;

  let selectedVariant = null;
  console.log(msg);
  if (msg.darkModeState === true) {
    switch (msg.imageVariant) {
      case "2":
        // create instance of dark mode, single image
        selectedVariant = postComponentSet.findOne(
          (node) =>
            node.type == "COMPONENT" &&
            node.name == "Image=single, Dark mode=true"
        ) as ComponentNode;
        break;
      case "3":
        // create instance of dark mode, double carousel
        selectedVariant = postComponentSet.findOne(
          (node) =>
            node.type == "COMPONENT" &&
            node.name == "Image=carousel, Dark mode=true"
        ) as ComponentNode;
        break;
      default:
        // create instance of dark mode, no image
        selectedVariant = postComponentSet.findOne(
          (node) =>
            node.type == "COMPONENT" &&
            node.name == "Image=none, Dark mode=true"
        ) as ComponentNode;
    }
  } else {
    switch (msg.imageVariant) {
      case "2":
        // create instance of dark mode, single image
        selectedVariant = postComponentSet.findOne(
          (node) =>
            node.type == "COMPONENT" &&
            node.name == "Image=single, Dark mode=false"
        ) as ComponentNode;
        break;
      case "3":
        // create instance of dark mode, double carousel
        selectedVariant = postComponentSet.findOne(
          (node) =>
            node.type == "COMPONENT" &&
            node.name == "Image=carousel, Dark mode=false"
        ) as ComponentNode;
        break;
      default:
        // create instance of dark mode, no image
        selectedVariant = postComponentSet.findOne(
          (node) =>
            node.type == "COMPONENT" &&
            node.name == "Image=none, Dark mode=false"
        ) as ComponentNode;
        break;
    }
  }
  const newPost = selectedVariant.createInstance();
  const templateName = newPost.findOne(
    (node) => node.name == "displayName" && node.type == "TEXT"
  ) as TextNode;
  const templateUsername = newPost.findOne(
    (node) => node.name == "@username" && node.type == "TEXT"
  ) as TextNode;
  const templateDescription = newPost.findOne(
    (node) => node.name == "description" && node.type == "TEXT"
  ) as TextNode;

  templateName.characters = msg.name;
  templateUsername.characters = msg.username;
  templateDescription.characters = msg.description;

  nodes.push(newPost);

  figma.viewport.scrollAndZoomIntoView(nodes);
  
  figma.closePlugin();
};
