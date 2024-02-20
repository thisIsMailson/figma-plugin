import { UIActionTypes, UIAction, WorkerActionTypes, WorkerAction } from './types';
import JSZip from '../node_modules/jszip/dist/jszip.min.js';
import AWS from 'aws-sdk';
// import archiver from 'archiver';
export interface ExportableBytes {
  name: string;
  setting: ExportSettingsImage | ExportSettingsPDF | ExportSettingsSVG;
  bytes: Uint8Array;
}
function typedArrayToBuffer(array: Uint8Array) {
  return array.buffer.slice(array.byteOffset, array.byteLength + array.byteOffset);
}

function exportTypeToBlobType(type: string) {
  switch (type) {
    case 'PDF':
      return 'application/pdf';
    case 'SVG':
      return 'image/svg+xml';
    case 'PNG':
      return 'image/png';
    case 'JPG':
      return 'image/jpeg';
    default:
      return 'image/png';
  }
}

function exportTypeToFileExtension(type: string) {
  switch (type) {
    case 'PDF':
      return '.pdf';
    case 'SVG':
      return '.svg';
    case 'PNG':
      return '.png';
    case 'JPG':
      return '.jpg';
    default:
      return '.png';
  }
}
async function getSelectedLayers() {
  const selectedLayers = figma.currentPage.selection;
  let exportableBytes = [];

  const nodes = selectedLayers[0].children;
  for (let node of nodes) {
    let { name, exportSettings } = node;
    if (exportSettings.length === 0) {
      exportSettings = [
        {
          format: 'PNG',
          suffix: '',
          constraint: { type: 'SCALE', value: 1 },
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
  console.log('ex', exportableBytes);
  saveToAws(exportableBytes);
}
function createZip(exportableBytes: ExportableBytes[]) {
  return new Promise<void>((resolve) => {
    let zip = new JSZip();
    console.log('boutta generate this Zip');

    for (let data of exportableBytes) {
      const { bytes, name, setting } = data;
      const cleanBytes = typedArrayToBuffer(bytes);
      const type = exportTypeToBlobType(setting.format);
      const extension = exportTypeToFileExtension(setting.format);
      console.log('alright im in', cleanBytes);

      let blob = new Blob([cleanBytes], { type });
      console.log('alright im out', blob);
      zip.file(`${name}${setting.suffix}${extension}`, blob, { base64: true });
    }
    console.log('boutta generate this thang');

    zip.generateAsync({ type: 'blob' }).then((content: Blob) => {
      const blobURL = window.URL.createObjectURL(content);
      const link = document.createElement('a');
      link.className = 'button button--primary';
      link.href = blobURL;
      link.download = 'export.zip';
      link.click();
      link.setAttribute('download', name + '.zip');
      resolve();
    });
  }).then(() => {
    console.log('Zip unten');
    postMessage({ type: WorkerActionTypes.GENERATE_ZIP_NOTIFY, payload: 'Zip unten' });
  });
}
// Sends a message to the plugin UI
function postMessage({ type, payload }: WorkerAction): void {
  figma.ui.postMessage({ type, payload });
}

// Listen to messages received from the plugin UI (src/ui/ui.ts)
figma.ui.onmessage = function ({ type, payload }: UIAction): void {
  switch (type) {
    case UIActionTypes.CLOSE:
      figma.closePlugin();
      break;
    case UIActionTypes.NOTIFY:
      payload && figma.notify(payload);
      break;
    case UIActionTypes.CREATE_RECTANGLE:
      getSelectedLayers();
      break;
    case UIActionTypes.GENERATE_ZIP:
      console.log('generating zip', payload);
      getSelectedLayers();
  }
};
async function saveToAws(data: any) {
  console.log('saving to aws');
  return;

  AWS.config.update({
    accessKeyId: 'AKIAZJXWVMT3OZRO4GHF',
    secretAccessKey: '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',
  });
  const s3 = new AWS.S3();
  const bucketName = 'ah-banners';
  const folderName = 'assets';

  const zip = archiver('zip');

  for (let item of data) {
    const { name, setting, bytes } = item;
    const entryName = `${folderName}/${name}_${setting.format.toLowerCase()}.png`;
    zip.append(bytes, { name: entryName });
  }

  // Finalize the zip file
  zip.finalize();

  // Upload the zip file to S3
  const zipParams = {
    Bucket: bucketName,
    Key: `${folderName}/export.zip`,
    Body: require('fs').createReadStream('/tmp/export.zip'), // Change the path as needed
  };

  await s3.upload(zipParams).promise();

  // Generate a pre-signed URL for downloading the zip file
  const zipSignedUrl = await s3.getSignedUrlPromise('getObject', {
    Bucket: bucketName,
    Key: `${folderName}/export.zip`,
    Expires: 60, // Set expiration time for the URL in seconds
  });

  console.log(`Download URL for the zip file:`, zipSignedUrl);
  // for (let item of data) {
  //   const { name, setting, bytes } = item;
  //   const key = `${folderName}/${name}_${setting.format.toLowerCase()}.png`;

  //   const zip = archiver('zip');
  //   const zipStream = require('fs').createWriteStream('/tmp/export.zip'); // Change the path as needed

  //   for (let item of data) {
  //     const { name, setting, bytes } = item;
  //     const entryName = `${folderName}/${name}_${setting.format.toLowerCase()}.png`;
  //     zip.append(bytes, { name: entryName });
  //   }

  //   // Finalize the zip file
  //   zip.finalize();

  //   const params = {
  //     Bucket: bucketName,
  //     Key: key,
  //     Body: bytes,
  //   };
  //   s3.upload(params, async function (err: any, data: any) {
  //     if (err) {
  //       console.log('There was an error uploading your file: ', err);
  //       return;
  //     }
  //     const signedUrl = await s3.getSignedUrl('getObject', {
  //       Bucket: bucketName,
  //       Key: key,
  //       Expires: 60,
  //     });
  //     console.log(`Download URL for ${name}: ${signedUrl}`);
  //   });
  // }
}

// Show the plugin interface (https://www.figma.com/plugin-docs/creating-ui/)
// Remove this in case your plugin doesn't need a UI, make network requests, use browser APIs, etc.
// If you need to make network requests you need an invisible UI (https://www.figma.com/plugin-docs/making-network-requests/)
figma.showUI(__html__, { width: 350, height: 200 });
