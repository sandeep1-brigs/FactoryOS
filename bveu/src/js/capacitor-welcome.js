import { Filesystem, Directory, Encoding } from "@capacitor/filesystem"
import { Capacitor } from '@capacitor/core';
import { Device } from "@capacitor/device"
import { Http } from '@capacitor-community/http';
import { Network } from '@capacitor/network';
import { App } from '@capacitor/app';
import $ from 'jquery';
import { AppUpdate } from "@robingenz/capacitor-app-update";
import ApkInstaller from "./plugins/apk-installer.js";
import QRCode from 'qrcodejs2-fix';



import { shared } from "./globals.js";
import { showDialog, initAppRuntimeMonitor, closeDialogBox, constructUrl, convertVersionVal, fixModuleHeight , observeResize } from "./utility.js";
import { viewHome } from "./settings.js";


var infoJSON = {};
var userFirstName = "";
var directoryReader;
var appAliveTimer = null;
var qrcode;


// MAIN FUNCTION
//  export async function getSerialNumber() {
//   try {
//     console.log("getSerialNumber: Starting...");

//     const dirResult = await Filesystem.getUri({
//       directory: Directory.Data,
//       path: "",
//     });

//     shared.ROOT_STORAGE_PATH = dirResult.uri;
//     console.log("ROOT_STORAGE_PATH set to:", shared.ROOT_STORAGE_PATH);

//     initAppRuntimeMonitor();

//     // ✅ Check if systemConfiguration exists
//     if (!shared.systemConfiguration || !shared.systemConfiguration.systemInfo) {
//       console.error("systemConfiguration or systemInfo is undefined");
//       showDialog("System configuration is not loaded yet.");
//       return;
//     }

//     const folder = shared.systemConfiguration.systemInfo.localAppFolderDigiSign;
//     const fileName = "serialNumber.txt";
//     const filePath = `${folder}/${fileName}`.replace(/\/+/g, "/");

//     // Ensure directory exists
//     try {
//       await Filesystem.mkdir({
//         path: folder,
//         directory: Directory.Data,
//         recursive: true,
//       });
//       console.log("Directory ensured:", folder);
//     } catch (e) {
//       console.log("Directory may already exist:", e);
//     }

//     // Try reading serial number file
//     try {
//       const result = await Filesystem.readFile({
//         path: filePath,
//         directory: Directory.Data,
//         encoding: Encoding.UTF8,
//       });
//       console.log("Serial number file found.");
//       await onSerialNoFileFound(result.data);
//     } catch (e) {
//       console.log("Serial number file not found. Creating...");
//       await serialNoFileNotFound(folder, filePath);
//     }
//   } catch (error) {
//     showDialog("getSerialNumber: Filesystem Failed! " + JSON.stringify(error));
//     console.error("getSerialNumber: Filesystem Failed!", error);
//   }
// }

export async function getSerialNumber() {
  try {
    console.log("getSerialNumber: Starting...");

    // --- Step 1: Resolve ROOT_STORAGE_PATH (same as cordova.file.dataDirectory) ---
    const dirResult = await Filesystem.getUri({
      directory: Directory.Data,
      path: "",
    });

    shared.ROOT_STORAGE_PATH = dirResult.uri;
    console.log("ROOT_STORAGE_PATH:", shared.ROOT_STORAGE_PATH);

    initAppRuntimeMonitor();

    if (!shared.systemConfiguration || !shared.systemConfiguration.systemInfo) {
      console.error("systemConfiguration or systemInfo is undefined");
      showDialog("System configuration is not loaded yet.");
      return;
    }

    const folder = shared.systemConfiguration.systemInfo.localAppFolderDigiSign;
    const fileName = "serialNumber.txt";
    const filePath = `${folder}/${fileName}`.replace(/\/+/g, "/");

    // --- Step 2: Ensure DigiSign directory exists (Cordova: getDirectory(create:true)) ---
    try {
      await Filesystem.mkdir({
        directory: Directory.Data,
        path: folder,
        recursive: true,
      });
      console.log("getSerialNumber: DigiSign directory created or already exists.");
    } catch (err) {
      console.log("getSerialNumber: DigiSign directory may already exist.", err);
    }

    // --- Step 3: Try reading the serialNumber.txt file (Cordova: getFile(create:false)) ---
    try {
      const readResult = await Filesystem.readFile({
        directory: Directory.Data,
        path: filePath,
        encoding: Encoding.UTF8,
      });

      console.log("getSerialNumber: serialNumber.txt found.");
      await onSerialNoFileFound(readResult.data); // Pass ONLY file content, 
      return;
    } catch (err) {
      console.warn("getSerialNumber: serialNumber.txt NOT found.");
    }

    // --- Step 4: File Not Found → Create File (Cordova: serialNoFileNotFound(serialNoFileName)) ---
    console.log("getSerialNumber: Creating serial number file...");
    await serialNoFileNotFound(fileName);  // FIXED: Pass only fileName 

  } catch (error) {
    console.error("getSerialNumber: Filesystem FAILED!", error);
    showDialog("getSerialNumber: Filesystem FAILED! " + JSON.stringify(error));
  }
}


// FILE FOUND HANDLER
// async function onSerialNoFileFound(fileData) {
//   try {
//     shared.deviceSerialNumber = fileData
//     console.log("onSerialNoFileFound: deviceSerialNumber:", shared.deviceSerialNumber)

//     const deviceId = await Device.getId()
//     shared.deviceMACAddress = deviceId.identifier
//     console.log("this is proof of second run")

//     getSystemConfigurationFromFile()
//   } catch (error) {
//     console.error("onSerialNoFileFound: MAC Address failed:", error)
//     showDialog("Failed to get device MAC address: " + error.message)
//   }
// }

async function onSerialNoFileFound(fileData) {
  try {
    // Cordova → reader.result
    shared.deviceSerialNumber = fileData;
    console.log("onSerialNoFileFound: deviceSerialNumber:", shared.deviceSerialNumber);

    // Cordova: no MAC fetching, but your logic requires Device.getId()
    const deviceId = await Device.getId();
    shared.deviceMACAddress = deviceId.identifier;

    getSystemConfigurationFromFile();
  } catch (error) {
    console.error("onSerialNoFileFound: MAC Address failed:", error);
    showDialog("Failed to get device MAC address: " + error.message);
  }
}


// FILE NOT FOUND HANDLER
// async function serialNoFileNotFound(folder , filePath) {
//   try {
//     console.log("serialNoFileNotFound: Creating serial number file at", filePath) 
//     const uniqueID = await createDeviceSerialNumber()

//     await Filesystem.writeFile({
//       path: filePath,
//       data: uniqueID,
//       directory: Directory.Data,
//       encoding: Encoding.UTF8,
//     })

//     console.log("serialNoFileNotFound: File written:", filePath)
//     shared.deviceSerialNumber = uniqueID

//     // Get device MAC address
//     try {
//       const deviceId = await Device.getId()
//       shared.deviceMACAddress = deviceId.identifier
//     } catch (error) {
//       console.error("Failed to get device ID:", error)
//       shared.deviceMACAddress = "Unknown"
//     }

//     getSystemConfigurationFromFile()
//   } catch (error) {
//     console.error("serialNoFileNotFound: File creation failed!", error)
//     showDialog("Failed to create serial number file: " + error.message)
//   }
// }

async function serialNoFileNotFound(fileName) {
  try {
    const folder = shared.systemConfiguration.systemInfo.localAppFolderDigiSign;
    const filePath = `${folder}/${fileName}`.replace(/\/+/g, "/");

    console.log("serialNoFileNotFound: Creating serial number file:", filePath);

    // Cordova's createWriter → Write file
    const uniqueID = await createDeviceSerialNumber();

    await Filesystem.writeFile({
      path: filePath,
      data: uniqueID,
      directory: Directory.Data,
      encoding: Encoding.UTF8,
    });

    console.log("serialNoFileNotFound: File written:", filePath);

    // Match Cordova logic → update global deviceSerialNumber
    shared.deviceSerialNumber = uniqueID;

    // Additional your logic: fetch MAC
    try {
      const deviceId = await Device.getId();
      shared.deviceMACAddress = deviceId.identifier;
    } catch (err) {
      console.error("Failed to get device ID:", err);
      shared.deviceMACAddress = "Unknown";
    }

    getSystemConfigurationFromFile();
  } catch (error) {
    console.error("serialNoFileNotFound: File creation failed!", error);
    showDialog("Failed to create serial number file: " + error.message);
  }
}


async function createDeviceSerialNumber() {
    try {
      console.log("createDeviceSerialNumber: Starting...");
        const deviceInfo = await Device.getInfo();
        const deviceId = await Device.getId();
        
        let deviceUUID = deviceId.identifier || deviceInfo.identifier;
        
        if (deviceUUID != null) {
            // Ensure UUID is proper length, pad if necessary
            if (deviceUUID.length < 16) {
                deviceUUID = String(deviceUUID).padEnd(16, '0');
            }
            
            // Take first 16 characters and format
            deviceUUID = String(deviceUUID).substring(0, 16);
            var splitString = String(deviceUUID).match(/.{1,2}/g);

            var uniqueID = "";
            for (let x = 0; x < splitString.length; x++) {
                if ((x == 2) || (x == 4) || (x == 6)) {
                    uniqueID += "-";
                }
                uniqueID += splitString[x];
            }
            uniqueID = uniqueID.toUpperCase();
            
            return uniqueID;

        }
        
        // Fallback to timestamp-based ID
        return Date.now().toString();
        
    } catch (error) {
        console.log("createDeviceSerialNumber failed:" + error.toString());
        return Date.now().toString();
    }
}

async function getSystemConfigurationFromFile() {
    const infoFileName = "SYSCONFINFO-" + shared.deviceSerialNumber + ".json";
    const folder = shared.systemConfiguration.systemInfo.localAppFolderDigiSign;
    const filePath = `${folder}/CURR_${infoFileName}`.replace(/\/+/g, '/');

    console.log("getSystemConfigurationFromFile: Start");
    console.log("Device Serial Number:", shared.deviceSerialNumber);
    console.log("Info File Name:", infoFileName);
    console.log("Local App Folder:", folder);
    console.log("Full File Path:", filePath);

    try {
        const result = await Filesystem.readFile({
            path: filePath,
            directory: Directory.Data,
            encoding: Encoding.UTF8
        });

        console.log("File read successfully.");
        console.log("File content:", result.data);

        onSystemConfigurationFileFound(result.data);

    } catch (error) {
        console.error("getSystemConfigurationFromFile: Error reading file", error);
        console.log("Falling back to getSystemConfigurationFromServer");
        getSystemConfigurationFromServer(infoFileName);
    }
}


function onSystemConfigurationFileFound(fileData) {
    try {
        shared.systemConfiguration = JSON.parse(fileData);

        if (shared.systemConfiguration?.systemInfo) {
            const version = shared.systemConfiguration.systemInfo.systemVersion;
            const idle = shared.systemConfiguration.systemInfo.appIdleTime;

            console.log(`Local system config found. Version: ${version}, Idle timeout: ${idle}`);
        } else {
            console.warn("System info section missing in parsed config.");
        }
        console.log("this is proof of second run");

        getStyleCSSData();

    } catch (error) {
        console.log("onSystemConfigurationFileFound: could not parse! " + JSON.stringify(error));
    }
}

// async function getSystemConfigurationFromServer(infoFileName) {
//     try {
//       console.log(" Starting for the first time ...");
//         const data = { serialno: shared.deviceSerialNumber };

//         // Build full API path
//         const url = constructUrl("/api/restgetdevicesetting");
//          console.log(" in itt...");
//         // Build request options with token, headers, and params
//         const requestOptions = await buildRequestOptions(url, "GET", data);

//         if (!requestOptions) {
//             console.warn("Request aborted due to missing requestOptions.");
//             return;
//         }

//         // Send API request
//         const response = await Http.request(requestOptions);

//         console.log("Raw response:", response);

//         // Check validity
//         if (isValidResponse(response, "restgetdevicesetting") && response.data) {
//             console.log("Got settings from server!");

//             let config;

//             try {
//                 // If response data is a string, parse it
//                 config = typeof response.data === 'string'
//                     ? JSON.parse(response.data)
//                     : response.data;
//             } catch (e) {
//                 console.warn("Parsing failed: using response data as-is.");
//                 config = response.data;
//             }
//             shared.systemConfiguration = JSON.parse(config.data);
//             console.log("Parsed systemConfiguration:", shared.systemConfiguration );


//             // Save to file
//             console.log("Before calling createSystemConfiguration, systemConfiguration is", shared.systemConfiguration);
//             await createSystemConfiguration(infoFileName);
//         } else {
//             console.warn("Invalid response format or missing data from server.");
//         }

//     } catch (error) {
//         console.error("System config settings failed from server!", error);
//         // Don't write to file on failure
//     }
// }

/*this is the seacond logic*/

// function getSystemConfigurationFromServer(infoFileName) {
//     console.log("Starting for the first time ...");
//     const data = { serialno: shared.deviceSerialNumber };

//     // Build full API path
//     const url = constructUrl("/api/restgetdevicesetting");
//     console.log(" in itt...");

//     // Build request options with token, headers, and params
//     buildRequestOptions(url, "GET", data)
//         .then((requestOptions) => {
//             if (!requestOptions) {
//                 console.warn("Request aborted due to missing requestOptions.");
//                 return;
//             }

//             // Send API request
//             return Http.request(requestOptions);
//         })
//         .then((response) => {
//             if (!response) return; // If requestOptions failed

//             console.log("Raw response:", response);

//             // Check validity
//             if (isValidResponse(response, "restgetdevicesetting") && response.data) {
//                 console.log("Got settings from server!");

//                 let config;
//                 try {
//                     // If response data is a string, parse it
//                     config = typeof response.data === "string"
//                         ? JSON.parse(response.data)
//                         : response.data;
//                 } catch (e) {
//                     console.warn("Parsing failed: using response data as-is.");
//                     config = response.data;
//                 }

//                 try {
//                     shared.systemConfiguration = JSON.parse(config.data);
//                     console.log("Parsed systemConfiguration:", shared.systemConfiguration);
//                 } catch (err) {
//                     console.error("Failed to parse systemConfiguration:", err);
//                     return;
//                 }

//                 // Save to file
//                 console.log(
//                     "Before calling createSystemConfiguration, systemConfiguration is",
//                     shared.systemConfiguration
//                 );

//                 return createSystemConfiguration(infoFileName);
//             } else {
//                 console.warn("Invalid response format or missing data from server.");
//             }
//         })
//         .then(() => {
//             // createSystemConfiguration completed
//             console.log("✅ System configuration saved successfully.");
//         })
//         .catch((error) => {
//             console.error("System config settings failed from server!", error);
//             // Don't write to file on failure
//         });
// }

/*this is third logic*/
function getSystemConfigurationFromServer(infoFileName) {
  const data = { serialno: shared.deviceSerialNumber };
  buildRequestOptions(constructUrl("/api/restgetdevicesetting"), "GET", data).then(request => {
    Http.request(request).then(res => {
      if (isValidResponse(res, "restgetdevicesetting") && res.data) {
        shared.systemConfiguration = JSON.parse((typeof res.data === "string" ? JSON.parse(res.data) : res.data).data);
        return createSystemConfiguration(infoFileName);
      }
    }).catch(err => console.error("System config settings failed from server!", err));
  }).catch(err => console.warn("Request aborted due to missing requestOptions.", err));
}



async function createSystemConfiguration(infoFileName) {
    try {
        console.log("createSystemConfiguration: Starting...");
        console.log("systemConfiguration:", shared.systemConfiguration);
        console.log("systemConfiguration.systemInfo:", shared.systemConfiguration?.systemInfo);

        if (!shared.systemConfiguration || !shared.systemConfiguration.systemInfo) {
            console.warn("System configuration is missing or invalid.");
            return;
        }

        const folder = shared.systemConfiguration.systemInfo.localAppFolderDigiSign;
        const fullPath = folder + '/CURR_' + infoFileName;

        const configInfo = JSON.stringify(shared.systemConfiguration);

        console.log("createSystemConfiguration: Writing to", fullPath);

        await Filesystem.writeFile({
            path: fullPath,
            data: configInfo,
            directory: Directory.Data,
            encoding: Encoding.UTF8
        });

        try {
            console.log("createSystemConfiguration: File created successfully at", fullPath);
            getStyleCSSData();
        } catch (e) {
            console.warn("getStyleCSSData failed:", e);
        }

    } catch (error) {
        console.log("createSystemConfiguration: File Creation failed! " + JSON.stringify(error));
    }
}


async function getStyleCSSData() {
  let styleCSSDataFileName;

  try {
    console.log("getStyleCSSData: Starting...");

    if (!shared.systemConfiguration) {
      console.warn("getStyleCSSData: systemConfiguration is undefined!");
    } else {
      console.log("getStyleCSSData: systemConfiguration present", shared.systemConfiguration);
    }

    styleCSSDataFileName = shared.systemConfiguration?.cmsInfo?.cssFileName;
    console.log("getStyleCSSData: cssFileName from config =", styleCSSDataFileName);

    if (!styleCSSDataFileName || typeof styleCSSDataFileName !== 'string') {
      if (!shared.deviceSerialNumber) throw new Error("deviceSerialNumber is undefined");
      styleCSSDataFileName = `STYLECSSDATA-${shared.deviceSerialNumber}.css`;
      console.log("getStyleCSSData: fallback cssFileName =", styleCSSDataFileName);
    }

    const fullPath = getLocalCSSPath(styleCSSDataFileName);
    console.log("getStyleCSSData: Trying to read CSS file from", fullPath);

    const result = await Filesystem.readFile({
      path: fullPath,
      directory: Directory.Data,
      encoding: Encoding.UTF8,
    });

    console.log("getStyleCSSData: Successfully read file from local filesystem");
    onStyleCSSDataFileFound(result.data);

  } catch (error) {
    console.error("getStyleCSSData: Error reading local CSS", error);

    if (typeof onStyleCSSDataFileNotFound === "function") {
      console.log("getStyleCSSData: Calling onStyleCSSDataFileNotFound with", styleCSSDataFileName);
      await onStyleCSSDataFileNotFound(styleCSSDataFileName);
    } else {
      console.warn("getStyleCSSData: onStyleCSSDataFileNotFound is not defined or not a function");
    }
  }
}


function onStyleCSSDataFileFound(fileData) {
  console.log("onStyleCSSDataFileFound: Injecting CSS into <head>");

  try {
    const styleElem = document.createElement("style");
    styleElem.type = "text/css";
    styleElem.appendChild(document.createTextNode(fileData));
    document.head.appendChild(styleElem);

    console.log("onStyleCSSDataFileFound: CSS injected successfully");

    if (typeof getCMSData === "function") {
      console.log("onStyleCSSDataFileFound: Calling getCMSData()");
      getCMSData();
    } else {
      console.warn("onStyleCSSDataFileFound: getCMSData is not defined or not a function");
    }

  } catch (error) {
    console.error("onStyleCSSDataFileFound: Error injecting CSS", error);
  }
}


async function onStyleCSSDataFileNotFound(styleCSSDataFileName) {
  try {
    console.log("onStyleCSSDataFileNotFound: Entered");

    if (!shared.systemConfiguration?.systemInfo?.cdnURL || !shared.systemConfiguration?.cmsInfo?.cssPath) {
      throw new Error("Missing CDN URL or CSS path in systemConfiguration");
    }

    const fileURL = shared.systemConfiguration.systemInfo.cdnURL + shared.systemConfiguration.cmsInfo.cssPath + styleCSSDataFileName;
    console.log("onStyleCSSDataFileNotFound: Fetching CSS from", fileURL);

    const response = await fetch(fileURL);

    if (!response.ok) {
      throw new Error(`Failed to fetch CSS from CDN: ${response.status} ${response.statusText}`);
    }

    const cssText = await response.text();
    const fullPath = getLocalCSSPath(styleCSSDataFileName);
    console.log("onStyleCSSDataFileNotFound: Writing fetched CSS to", fullPath);

    await Filesystem.writeFile({
      path: fullPath,
      data: cssText,
      directory: Directory.Data,
      encoding: Encoding.UTF8
    });

    console.log("onStyleCSSDataFileNotFound: CSS saved locally");
    onStyleCSSDataFileFound(cssText);

  } catch (error) {
    console.error("onStyleCSSDataFileNotFound: CDN fetch failed", error);
    console.log("onStyleCSSDataFileNotFound: Falling back to createStyleCSSDataFile");
    await createStyleCSSDataFile(styleCSSDataFileName);
  }
}


async function createStyleCSSDataFile(styleCSSDataFileName) {
  try {
    console.log("createStyleCSSDataFile: Fetching fallback CSS");

    const response = await fetch("./assets/css/custom_style.css");

    if (!response.ok) {
      throw new Error(`Fallback CSS fetch failed: ${response.status} ${response.statusText}`);
    }

    const cssText = await response.text();
    const fullPath = getLocalCSSPath(styleCSSDataFileName);
    console.log("createStyleCSSDataFile: Writing fallback CSS to", fullPath);

    await Filesystem.writeFile({
      path: fullPath,
      data: cssText,
      directory: Directory.Data,
      encoding: Encoding.UTF8
    });

    console.log("createStyleCSSDataFile: Fallback CSS written and calling onStyleCSSDataFileFound");
    onStyleCSSDataFileFound(cssText);

  } catch (error) {
    console.error("createStyleCSSDataFile: Error using fallback CSS", error);
  }
}

async function getCMSData() {
    let cmsDataFileName;

    try {
        console.log("getCMSData: Starting...");

        // Step 1: Determine CMS file name
        cmsDataFileName = shared.systemConfiguration?.cmsInfo?.cmsFileName;
        if (!cmsDataFileName || cmsDataFileName.length === 0) {
            cmsDataFileName = "CURR_CMSDATA-" + shared.deviceSerialNumber + ".json";
        }

        const folder = shared.systemConfiguration.systemInfo.localAppFolderDigiSign;
        const filePath = `${folder}/${cmsDataFileName}`.replace(/\/+/g, '/');

        console.log("getCMSData: CMS data filename =", cmsDataFileName);
        console.log("getCMSData: Full path =", filePath);

        // Step 2: Attempt to read file from device
        const fileReadResult = await Filesystem.readFile({
            path: filePath,
            directory: Directory.Data,
            encoding: Encoding.UTF8,
        });

        console.log("getCMSData: File read successfully.");
        onCMSDataFileFound(fileReadResult.data);

    } catch (error) {
        console.error("getCMSData: Error reading CMS file.", error);
        await onCMSDataFileNotFound(cmsDataFileName);
    }
}

function onCMSDataFileFound(fileDataRaw) {
    try {
        console.log("onCMSDataFileFound: Raw data received.");
        const fileData = typeof fileDataRaw === "string" ? fileDataRaw : fileDataRaw?.toString();
        shared.cmsJSON = JSON.parse(fileData);

        console.log("onCMSDataFileFound: JSON parsed successfully.");
       

        initSystem();
        checkConfigUpdate();

    } catch (parseError) {
        console.error("onCMSDataFileFound: Failed to parse CMS JSON -", parseError);
    }
}

async function onCMSDataFileNotFound(cmsDataFileName) {
  try {
    console.log("onCMSDataFileNotFound: Entered");

    if (!shared.systemConfiguration?.systemInfo?.cdnURL || !shared.systemConfiguration?.cmsInfo?.cmsPath) {
      throw new Error("Missing CDN URL or CMS path in systemConfiguration");
    }

    const fileURL = shared.systemConfiguration.systemInfo.cdnURL + 
                    shared.systemConfiguration.cmsInfo.cmsPath + 
                    cmsDataFileName;

    console.log("onCMSDataFileNotFound: Fetching CMS data from", fileURL);

    const response = await fetch(fileURL);

    if (!response.ok) {
      throw new Error(`Failed to fetch CMS data from CDN: ${response.status} ${response.statusText}`);
    }

    const cmsText = await response.text();
    const folder = shared.systemConfiguration.systemInfo.localAppFolderDigiSign;
    const fullPath = `${folder}/${cmsDataFileName}`.replace(/\/+/g, '/');

    console.log("onCMSDataFileNotFound: Writing fetched CMS data to", fullPath);

    await Filesystem.writeFile({
      path: fullPath,
      data: cmsText,
      directory: Directory.Data,
      encoding: Encoding.UTF8
    });

    console.log("onCMSDataFileNotFound: CMS data saved locally");
    onCMSDataFileFound(cmsText);

  } catch (error) {
    console.error("onCMSDataFileNotFound: CDN fetch failed", error);
    console.log("onCMSDataFileNotFound: Falling back to createCMSDataFile");
    await createCMSDataFile(cmsDataFileName);
  }
}


async function createCMSDataFile(cmsDataFileName) {
    const folder = shared.systemConfiguration.systemInfo.localAppFolderDigiSign;
    const filePath = `${folder}/${cmsDataFileName}`.replace(/\/+/g, '/');

    try {
        const cmsData = JSON.stringify(shared.cmsJSON);

        console.log("createCMSDataFile: Writing fallback CMS data to:", filePath);

        await Filesystem.writeFile({
            path: filePath,
            data: cmsData,
            directory: Directory.Data,
            encoding: Encoding.UTF8,
        });

        console.log("createCMSDataFile: File written successfully.");
       

        initSystem();
        checkConfigUpdate();

    } catch (err) {
        console.error("createCMSDataFile: Failed to write fallback CMS file -", err);
    }
}

// async function initSystem() {
//     var commonCMS = shared.cmsJSON.cmsJSONdata.common;
//     // Load the loading spinner
//     if(commonCMS.loadingSpinner != undefined) {
//         $("#loadingmessage").addClass(commonCMS.loadingSpinner.spinnerClass);
//         $("#spinnerImage").addClass(commonCMS.loadingSpinner.imageClass);
//         $("#spinnerImage").html(commonCMS.loadingSpinner.image);
//     }

//     if(commonCMS.uploadingSpinner != undefined) {
//         $("#uploadingmessage").addClass(commonCMS.uploadingSpinner.spinnerClass);
//         $("#uploaderMessageArea").addClass(commonCMS.uploadingSpinner.messageAreaClass);
//         $("#uploaderImage").addClass(commonCMS.uploadingSpinner.imageClass);
//         $("#uploaderImage").html(commonCMS.uploadingSpinner.image);
//     }

//     window.onerror = function(message, source, lineno, colno, error) {
//         console.log("message: "+message+", source: "+source+", lineno: "+lineno+", colno"+colno+", error: "+error);
//         if(message.includes("ReferenceError") && message.includes("not defined")) {
//             showDialog("Error! This function is not supported in current version. Please update your app.\n"+"message: "+message+", source: "+source+", lineno: "+lineno+", colno"+colno+", error: "+error);
//         }
//     }
//     if ((shared.systemConfiguration.systemInfo.inAppUpdateEnabled != undefined) && (shared.systemConfiguration.systemInfo.inAppUpdateEnabled == true)) {
//         checkAppUpdate();
//     }

//     closeDialogBox();
//     displaySection("none", "none", false, false);

//     //  qrcode = new QRCode(document.getElementById("qrcode"), {
//     //     width: 400,
//     //     height: 400,
//     //     colorDark: "#000000",
//     //     colorLight: "#ffffff",
//     //     correctLevel: QRCode.CorrectLevel.M
//     // });

//     userFirstName = "";
//     observeResize();
//     viewHome();

//     if((shared.systemConfiguration.systemInfo.mqttEnabled != undefined) && (shared.systemConfiguration.systemInfo.mqttEnabled != null) &&
//         (shared.systemConfiguration.systemInfo.mqttEnabled == "true"))
//     {
//         console.log("Settings >> initSystem > Initializing MQTT Client!");
//         //initMqttClient();
//     }

// }

async function initSystem() {
    console.log('initSystem starting!');

    const commonCMS = shared.cmsJSON.cmsJSONdata.common;

    /* ----------------------------------------------------------
     * 1. Initialize Loading Spinner
     * ---------------------------------------------------------- */
    if (commonCMS.loadingSpinner !== undefined) {
        console.log('Initialize loading spinner!');
        $("#loadingmessage").addClass(commonCMS.loadingSpinner.spinnerClass);
        $("#spinnerImage").addClass(commonCMS.loadingSpinner.imageClass);
        $("#spinnerImage").html(commonCMS.loadingSpinner.image);
    }

    if (commonCMS.uploadingSpinner !== undefined) {
        console.log('Initialize uploading spinner!');
        $("#uploadingmessage").addClass(commonCMS.uploadingSpinner.spinnerClass);
        $("#uploaderMessageArea").addClass(commonCMS.uploadingSpinner.messageAreaClass);
        $("#uploaderImage").addClass(commonCMS.uploadingSpinner.imageClass);
        $("#uploaderImage").html(commonCMS.uploadingSpinner.image);
    }

    /* ----------------------------------------------------------
     * 2. Global Error Handler (same as Cordova)
     * ---------------------------------------------------------- */
    console.log('Initialize error handler!');
    window.onerror = function(message, source, lineno, colno, error) {
        console.error("message: " + message + ", source: " + source + ", lineno: " + lineno + ", colno" + colno + ", error: " + error);

        if (message.includes("ReferenceError") && message.includes("not defined")) {
            showDialog(
                "Error! This function is not supported in current version. Please update your app.\n" +
                "message: " + message + ", source: " + source + ", lineno: " + lineno + ", colno" + colno + ", error: " + error
            );
        }
    };

    /* ----------------------------------------------------------
     * 3. In-App Update Check (same as Cordova logic)
     * ---------------------------------------------------------- */
    if (
        shared.systemConfiguration.systemInfo.inAppUpdateEnabled !== undefined &&
        shared.systemConfiguration.systemInfo.inAppUpdateEnabled === true &&
        window.networkOffline === false 
    ) {
        checkAppUpdate();
    }

    /* ----------------------------------------------------------
     * 4. Initial UI Reset (same as Cordova)
     * ---------------------------------------------------------- */
    closeDialogBox();
    displaySection("none", "none", false, false);

    /* ----------------------------------------------------------
     * 5. Initialize QR Code (restored from Cordova)
     * ---------------------------------------------------------- */
    console.log("Initializing QR code for the device!");
    qrcode = new QRCode(document.getElementById("qrcode"), {
        width: 400,
        height: 400,
        colorDark: "#000000",
        colorLight: "#ffffff",
        correctLevel: QRCode.CorrectLevel.M
    });

    /* ----------------------------------------------------------
     * 6. User Info
     * ---------------------------------------------------------- */
    userFirstName = "";

    /* ----------------------------------------------------------
     * 7. Resize Observer + Home Screen
     * ---------------------------------------------------------- */
    observeResize();
    console.log("Calling viewHome()!");
    viewHome();

    /* ----------------------------------------------------------
     * 8. MQTT Initialization (Cordova logic restored)
     * ---------------------------------------------------------- */
    if (
        shared.systemConfiguration.systemInfo.mqttEnabled !== undefined &&
        shared.systemConfiguration.systemInfo.mqttEnabled !== null &&
        shared.systemConfiguration.systemInfo.mqttEnabled === "true"
    ) {
        console.log("Settings >> initSystem > Initializing MQTT Client!");
        // initMqttClient();
    }

    /* ----------------------------------------------------------
     * 9. (Optional) Kiosk Plugin Logic from Cordova
     * ---------------------------------------------------------- */
    // KioskPlugin.isInKiosk(function(isInKiosk){ console.log("Is in Kiosk: "+isInKiosk) });
    // KioskPlugin.isSetAsLauncher(function(isLauncher){ console.log("Is Launcher: "+isLauncher) });
    // KioskPlugin.setAllowedKeys([24, 25]); // KEYCODE_VOLUME_UP, KEYCODE_VOLUME_DOWN

    /* ----------------------------------------------------------
     * 10. Other Legacy Functions from Cordova
     * ---------------------------------------------------------- */
    // AppIdleTime();
    // sendVoice();
    // getProductCategory();
    // loadVideoPlayer("../CMS/Yashi_Group_Profile.36.mp4");
}



function checkAppUpdate() {
    AppUpdate.isUpdateAvailable()
        .then((result) => {
            if (result.value) {
                showConfirmDialog({
                    message: "An app update is available. We recommend updating immediately for the app to function correctly. Update now?",
                    yesLabel: "Update",
                    noLabel: "Later",
                    onYes: () => {
                        updateAppNow();
                    },
                    onNo: () => {
                        getSerialNumber();
                    }
                });
            } else {
                getSerialNumber();
            }
        })
        .catch((error) => {
            console.error("Update check failed:", error);
            getSerialNumber();
        });
}

function updateAppNow() {
    AppUpdate.performImmediateUpdate()
        .then(() => {
            console.log("✅ App updated successfully");
        })
        .catch((err) => {
            console.error("Update failed:", err);
            getSerialNumber();
        });
}


// async function checkConfigUpdate() {
//     try {
//         console.log("🔍 [checkConfigUpdate] Start");

//         // Step 1: Prepare Payload
//         const data = { serialno: shared.deviceSerialNumber };
//         console.log("📦 [Payload] serialno =", data.serialno);

//         // Step 2: Construct URL
//         const url = constructUrl("/api/restgetdevicesetting");
//         console.log("🌐 [URL] Constructed URL:", url);

//         // Step 3: Build Request Options
//         const requestOptions = await buildRequestOptions(url, "GET", data);
//         console.log("🛠️ [Request Options] =", requestOptions);

//         if (!requestOptions) {
//             console.warn("⚠️ [Abort] requestOptions is undefined or invalid.");
//             return;
//         }

//         // Step 4: Make HTTP Request
//         const response = await Http.request(requestOptions);
//         console.log("📨 [HTTP Response] Raw Response Object:", response);

//         // Step 5: Validate and Parse Response
//         if (isValidResponse(response, "restgetdevicesetting") && response.data) {
//             console.log("✅ [Valid Response] Passed validation check.");

//             let config;
//             try {
//                 config = typeof response.data === 'string'
//                     ? JSON.parse(response.data)
//                     : response.data;
//                 console.log("🧾 [Config Parsed] config =", config);
//             } catch (e) {
//                 console.warn("❗ [Fallback Parse] Using raw response data as config:", response.data);
//                 config = response.data;
//             }

//             // Step 6: Parse config.data → infoJSON
//             try {
//                 infoJSON = JSON.parse(config.data);
//                 console.log("📁 [Parsed infoJSON] =", infoJSON);
//             } catch (err) {
//                 console.error("❌ [Parse Failed] Could not parse config.data:", config.data, err);
//                 return;
//             }

//             // Step 7: Get App Info
//             const appInfo = await App.getInfo();
//             console.log("📱 [App Info] =", appInfo);

//             const versionStr = appInfo.version || "0.0.0";
//             console.log("🔢 [Version String] =", versionStr);

//             const version = parseInt(versionStr.replace(/\./g, '').padEnd(5, '0'));
//             console.log("🔢 [Parsed App Version Code] =", version);

//             const cmsVersionVal = convertVersionVal(infoJSON.cmsInfo.cmsVersion);
//             const cssVersionVal = convertVersionVal(infoJSON.cmsInfo.cssVersion);

//             console.log("📊 [Version Codes]");
//             console.log("   - App Version Code:", version);
//             console.log("   - CMS Version:", infoJSON.cmsInfo.cmsVersion, "→", cmsVersionVal);
//             console.log("   - CSS Version:", infoJSON.cmsInfo.cssVersion, "→", cssVersionVal);

//            // Step 8: Fallback version enforcement
//             if (version === 10000 || version >= 10100) {
//                 if (cmsVersionVal < 20001) {
//                     console.warn("🛑 [Fallback] Forcing CMS version to 2.0.1");
//                     infoJSON.cmsInfo.cmsFileName = "CMS-20001.json";
//                     infoJSON.cmsInfo.cmsVersion = "2.0.1";
//                 }
//                 if (cssVersionVal < 20001) {
//                     console.warn("🛑 [Fallback] Forcing CSS version to 2.0.1");
//                     infoJSON.cmsInfo.cssFileName = "STYLECSS-20001.css";
//                     infoJSON.cmsInfo.cssVersion = "2.0.1";
//                 }
//             }

//             // Step 9: Version Mismatch Check
//             const updateRequired =
//                 infoJSON.systemInfo.systemVersion !== shared.systemConfiguration.systemInfo.systemVersion ||
//                 infoJSON.systemInfo.systemTimestamp !== shared.systemConfiguration.systemInfo.systemTimestamp ||
//                 infoJSON.cmsInfo.cmsVersion !== shared.systemConfiguration.cmsInfo.cmsVersion ||
//                 infoJSON.cmsInfo.cmsTimestamp !== shared.systemConfiguration.cmsInfo.cmsTimestamp ||
//                 infoJSON.cmsInfo.cssVersion !== shared.systemConfiguration.cmsInfo.cssVersion ||
//                 infoJSON.cmsInfo.cssTimestamp !== shared.systemConfiguration.cmsInfo.cssTimestamp ||
//                 infoJSON.appInfo.appVersion !== shared.systemConfiguration.appInfo.appVersion ||
//                 infoJSON.appInfo.appTimestamp !== shared.systemConfiguration.appInfo.appTimeStamp;

//             console.log("🔍 [Update Check]");
//             console.log("   - System Version:", infoJSON.systemInfo.systemVersion, "vs", shared.systemConfiguration.systemInfo.systemVersion);
//             console.log("   - System Timestamp:", infoJSON.systemInfo.systemTimestamp, "vs", shared.systemConfiguration.systemInfo.systemTimestamp);
//             console.log("   - CMS Version:", infoJSON.cmsInfo.cmsVersion, "vs", shared.systemConfiguration.cmsInfo.cmsVersion);
//             console.log("   - CMS Timestamp:", infoJSON.cmsInfo.cmsTimestamp, "vs", shared.systemConfiguration.cmsInfo.cmsTimestamp);
//             console.log("   - CSS Version:", infoJSON.cmsInfo.cssVersion, "vs", shared.systemConfiguration.cmsInfo.cssVersion);
//             console.log("   - CSS Timestamp:", infoJSON.cmsInfo.cssTimestamp, "vs", shared.systemConfiguration.cmsInfo.cssTimestamp);
//             console.log("   - App Version:", infoJSON.appInfo.appVersion, "vs", shared.systemConfiguration.appInfo.appVersion);
//             console.log("   - App Timestamp:", infoJSON.appInfo.appTimestamp, "vs", shared.systemConfiguration.appInfo.appTimeStamp);
//             console.log("🔧 [Update Required] =", updateRequired);

            
//             // Step 10: Show confirmation dialog if update is needed
//             if (updateRequired) {
//                 console.log("📤 [Prompt Update] Showing confirmation dialog.");

//                showConfirmDialog({
//                     message: "New update available for your system configuration<br>Update now?",
//                     yesLabel: "Update",
//                     noLabel: "Cancel",
//                     onYes: () => followUpdateOrder('updateSystemConfiguration', infoJSON),
//                     onNo: () => console.log("Update cancelled")
//                 });
//             } else {
//                 console.log("✅ [No Update Required] Configuration is up to date.");
//             }


//             // Step 11: Update company message if any
//             const companyMsgElem = document.getElementById("homeSection1Content");
//             if (companyMsgElem !== null) {
//                 const message = infoJSON.cmsInfo.homeMessaging;
//                 console.log("💬 [Company Message] =", message);
//                 if (message && message.length > 0) {
//                     $("#homeSection1Content").html(message);
//                 }
//             }

//             // Step 12: UI height adjustment
//             console.log("📐 [Adjust Module Heights]");
//             fixModuleHeight("headerSection, footerSection, homeSection1", -50, "homeSection3");

//         } else {
//             console.warn("⚠️ [Invalid Response] Missing or incorrect 'data' from server.");
//         }

//     } catch (error) {
//         console.error("💥 [Exception] checkConfigUpdate failed:", error);
//         showDialog("Server didn't respond!");
//     }
// }

// async function checkConfigUpdate() {
//     try {
//         console.log("🔍 [checkConfigUpdate] Start");

//         // Step 1: Prepare Payload
//         const data = { serialno: shared.deviceSerialNumber };
//         console.log("📦 [Payload] serialno =", data.serialno);

//         // Step 2: Construct URL
//         const url = constructUrl("/api/restgetdevicesetting");
//         console.log("🌐 [URL] Constructed URL:", url);

//         // Step 3: Build Request Options
//         const requestOptions = await buildRequestOptions(url, "GET", data);
//         console.log("🛠️ [Request Options] =", requestOptions);

//         if (!requestOptions) {
//             console.warn("⚠️ [Abort] requestOptions is undefined or invalid.");
//             return;
//         }

//         // Step 4: Make HTTP Request (new success/failure style)
//         Http.request(requestOptions)
//             .then(async (response) => {
//                 console.log("📨 [HTTP Response] Raw Response Object:", response);

//                 // Step 5: Validate and Parse Response
//                 if (isValidResponse(response, "restgetdevicesetting") && response.data) {
//                     console.log("✅ [Valid Response] Passed validation check.");

//                     let config;
//                     try {
//                         config = typeof response.data === 'string'
//                             ? JSON.parse(response.data)
//                             : response.data;
//                         console.log("🧾 [Config Parsed] config =", config);
//                     } catch (e) {
//                         console.warn("❗ [Fallback Parse] Using raw response data as config:", response.data);
//                         config = response.data;
//                     }

//                     // Step 6: Parse config.data → infoJSON
//                     try {
//                         infoJSON = JSON.parse(config.data);
//                         console.log("📁 [Parsed infoJSON] =", infoJSON);
//                     } catch (err) {
//                         console.error("❌ [Parse Failed] Could not parse config.data:", config.data, err);
//                         return;
//                     }

//                     // Step 7: Get App Info
//                     const appInfo = await App.getInfo();
//                     console.log("📱 [App Info] =", appInfo);

//                     const versionStr = appInfo.version || "0.0.0";
//                     console.log("🔢 [Version String] =", versionStr);

//                     const version = parseInt(versionStr.replace(/\./g, '').padEnd(5, '0'));
//                     console.log("🔢 [Parsed App Version Code] =", version);

//                     const cmsVersionVal = convertVersionVal(infoJSON.cmsInfo.cmsVersion);
//                     const cssVersionVal = convertVersionVal(infoJSON.cmsInfo.cssVersion);

//                     console.log("📊 [Version Codes]");
//                     console.log("   - App Version Code:", version);
//                     console.log("   - CMS Version:", infoJSON.cmsInfo.cmsVersion, "→", cmsVersionVal);
//                     console.log("   - CSS Version:", infoJSON.cmsInfo.cssVersion, "→", cssVersionVal);

//                     // Step 8: Fallback version enforcement
//                     if (version === 10000 || version >= 10100) {
//                         if (cmsVersionVal < 20001) {
//                             console.warn("🛑 [Fallback] Forcing CMS version to 2.0.1");
//                             infoJSON.cmsInfo.cmsFileName = "CMS-20001.json";
//                             infoJSON.cmsInfo.cmsVersion = "2.0.1";
//                         }
//                         if (cssVersionVal < 20001) {
//                             console.warn("🛑 [Fallback] Forcing CSS version to 2.0.1");
//                             infoJSON.cmsInfo.cssFileName = "STYLECSS-20001.css";
//                             infoJSON.cmsInfo.cssVersion = "2.0.1";
//                         }
//                     }

//                     // Step 9: Version Mismatch Check
//                     const updateRequired =
//                         infoJSON.systemInfo.systemVersion !== shared.systemConfiguration.systemInfo.systemVersion ||
//                         infoJSON.systemInfo.systemTimestamp !== shared.systemConfiguration.systemInfo.systemTimestamp ||
//                         infoJSON.cmsInfo.cmsVersion !== shared.systemConfiguration.cmsInfo.cmsVersion ||
//                         infoJSON.cmsInfo.cmsTimestamp !== shared.systemConfiguration.cmsInfo.cmsTimestamp ||
//                         infoJSON.cmsInfo.cssVersion !== shared.systemConfiguration.cmsInfo.cssVersion ||
//                         infoJSON.cmsInfo.cssTimestamp !== shared.systemConfiguration.cmsInfo.cssTimestamp ||
//                         infoJSON.appInfo.appVersion !== shared.systemConfiguration.appInfo.appVersion ||
//                         infoJSON.appInfo.appTimestamp !== shared.systemConfiguration.appInfo.appTimeStamp;

//                     console.log("🔍 [Update Check]");
//                     console.log("   - System Version:", infoJSON.systemInfo.systemVersion, "vs", shared.systemConfiguration.systemInfo.systemVersion);
//                     console.log("   - System Timestamp:", infoJSON.systemInfo.systemTimestamp, "vs", shared.systemConfiguration.systemInfo.systemTimestamp);
//                     console.log("   - CMS Version:", infoJSON.cmsInfo.cmsVersion, "vs", shared.systemConfiguration.cmsInfo.cmsVersion);
//                     console.log("   - CMS Timestamp:", infoJSON.cmsInfo.cmsTimestamp, "vs", shared.systemConfiguration.cmsInfo.cmsTimestamp);
//                     console.log("   - CSS Version:", infoJSON.cmsInfo.cssVersion, "vs", shared.systemConfiguration.cmsInfo.cssVersion);
//                     console.log("   - CSS Timestamp:", infoJSON.cmsInfo.cssTimestamp, "vs", shared.systemConfiguration.cmsInfo.cssTimestamp);
//                     console.log("   - App Version:", infoJSON.appInfo.appVersion, "vs", shared.systemConfiguration.appInfo.appVersion);
//                     console.log("   - App Timestamp:", infoJSON.appInfo.appTimestamp, "vs", shared.systemConfiguration.appInfo.appTimeStamp);
//                     console.log("🔧 [Update Required] =", updateRequired);

//                     // Step 10: Show confirmation dialog if update is needed
//                     if (updateRequired) {
//                         console.log("📤 [Prompt Update] Showing confirmation dialog.");
//                         showConfirmDialog({
//                             message: "New update available for your system configuration<br>Update now?",
//                             yesLabel: "Update",
//                             noLabel: "Cancel",
//                             onYes: () => followUpdateOrder('updateSystemConfiguration', infoJSON),
//                             onNo: () => console.log("Update cancelled")
//                         });
//                     } else {
//                         console.log("✅ [No Update Required] Configuration is up to date.");
//                     }

//                     // Step 11: Update company message if any
//                     let companyMsgElem = document.getElementById("homeSection1Content");
//                     if (companyMsgElem !== null) {
//                         const message = infoJSON.cmsInfo.homeMessaging;
//                         console.log("💬 [Company Message] =", message);
//                         if (message && message.length > 0) {
//                             $("#homeSection1Content").html(message);
//                         }
//                     }

//                     // Step 12: UI height adjustment
//                     console.log("📐 [Adjust Module Heights]");
//                     fixModuleHeight("headerSection, footerSection, homeSection1", -50, "homeSection3");

//                 } else {
//                     console.warn("⚠️ [Invalid Response] Missing or incorrect 'data' from server.");
//                 }
//             })
//             .catch((error) => {
//                 console.error("💥 [Exception] checkConfigUpdate failed:", error);
//                 showDialog("Server didn't respond!");
//             });

//     } catch (error) {
//         console.error("💥 [Outer Exception] checkConfigUpdate failed:", error);
//         showDialog("Server didn't respond!");
//     }
// }

function checkConfigUpdate() {
    console.log("🔍 [checkConfigUpdate] Start");

    // Step 1: Prepare Payload
    const data = { serialno: shared.deviceSerialNumber };
    console.log("📦 [Payload] serialno =", data.serialno);

    // Step 2: Construct URL
    const url = constructUrl("/api/restgetdevicesetting");
    console.log("🌐 [URL] Constructed URL:", url);

    // Step 3: Build Request Options (still async)
    buildRequestOptions(url, "GET", data)
        .then((requestOptions) => {
            console.log("🛠️ [Request Options] =", requestOptions);

            if (!requestOptions) {
                console.warn("⚠️ [Abort] requestOptions is undefined or invalid.");
                return;
            }

            // Step 4: MAKE HTTP REQUEST (NO await here)
            return Http.request(requestOptions);
        })
        .then((response) => {
            if (!response) return;

            console.log("📨 [HTTP Response] Raw Response Object:", response);

            // Step 5: Validate and Parse Response
            if (!isValidResponse(response, "restgetdevicesetting") || !response.data) {
                console.warn("⚠️ [Invalid Response] Missing or incorrect 'data' from server.");
                return;
            }

            console.log("✅ [Valid Response] Passed validation check.");

            let config;
            try {
                config =
                    typeof response.data === "string"
                        ? JSON.parse(response.data)
                        : response.data;

                console.log("🧾 [Config Parsed] config =", config);
            } catch (e) {
                console.warn("❗ [Fallback Parse] Using raw response data as config:", response.data);
                config = response.data;
            }

            // Step 6: Parse config.data → infoJSON
            try {
                infoJSON = JSON.parse(config.data);
                console.log("📁 [Parsed infoJSON] =", infoJSON);
            } catch (err) {
                console.error("❌ [Parse Failed] Could not parse config.data:", config.data, err);
                return;
            }

            // Step 7: GET APP INFO (async but NOT HTTP)
            return App.getInfo();
        })
        .then((appInfo) => {
            if (!appInfo) return;

            console.log("📱 [App Info] =", appInfo);

            const versionStr = appInfo.version || "0.0.0";
            console.log("🔢 [Version String] =", versionStr);

            const version = parseInt(versionStr.replace(/\./g, "").padEnd(5, "0"));
            console.log("🔢 [Parsed App Version Code] =", version);

            const cmsVersionVal = convertVersionVal(infoJSON.cmsInfo.cmsVersion);
            const cssVersionVal = convertVersionVal(infoJSON.cmsInfo.cssVersion);

            console.log("📊 [Version Codes]");
            console.log("   - App Version Code:", version);
            console.log("   - CMS Version:", infoJSON.cmsInfo.cmsVersion, "→", cmsVersionVal);
            console.log("   - CSS Version:", infoJSON.cmsInfo.cssVersion, "→", cssVersionVal);

            // Step 8: Fallback version enforcement
            if (version === 10000 || version >= 10100) {
                if (cmsVersionVal < 20001) {
                    console.warn("🛑 [Fallback] Forcing CMS version to 2.0.1");
                    infoJSON.cmsInfo.cmsFileName = "CMS-20001.json";
                    infoJSON.cmsInfo.cmsVersion = "2.0.1";
                }
                if (cssVersionVal < 20001) {
                    console.warn("🛑 [Fallback] Forcing CSS version to 2.0.1");
                    infoJSON.cmsInfo.cssFileName = "STYLECSS-20001.css";
                    infoJSON.cmsInfo.cssVersion = "2.0.1";
                }
            }

            // Step 9: Version mismatch check
            const updateRequired =
                infoJSON.systemInfo.systemVersion !== shared.systemConfiguration.systemInfo.systemVersion ||
                infoJSON.systemInfo.systemTimestamp !== shared.systemConfiguration.systemInfo.systemTimestamp ||
                infoJSON.cmsInfo.cmsVersion !== shared.systemConfiguration.cmsInfo.cmsVersion ||
                infoJSON.cmsInfo.cmsTimestamp !== shared.systemConfiguration.cmsInfo.cmsTimestamp ||
                infoJSON.cmsInfo.cssVersion !== shared.systemConfiguration.cmsInfo.cssVersion ||
                infoJSON.cmsInfo.cssTimestamp !== shared.systemConfiguration.cmsInfo.cssTimestamp ||
                infoJSON.appInfo.appVersion !== shared.systemConfiguration.appInfo.appVersion ||
                infoJSON.appInfo.appTimestamp !== shared.systemConfiguration.appInfo.appTimeStamp;

            console.log("🔧 [Update Required] =", updateRequired);

            // Step 10: Confirm update
            if (updateRequired) {
                console.log("📤 [Prompt Update] Showing confirmation dialog.");
                showConfirmDialog({
                    message: "New update available for your system configuration<br>Update now?",
                    yesLabel: "Update",
                    noLabel: "Cancel",
                    onYes: () => followUpdateOrder("updateSystemConfiguration", infoJSON),
                    onNo: () => console.log("Update cancelled"),
                });
            } else {
                console.log("✅ [No Update Required] Configuration is up to date.");
            }

            // Step 11: Update UI message
            let companyMsgElem = document.getElementById("homeSection1Content");
            if (companyMsgElem !== null) {
                const message = infoJSON.cmsInfo.homeMessaging;
                console.log("💬 [Company Message] =", message);
                if (message && message.length > 0) {
                    $("#homeSection1Content").html(message);
                }
            }

            // Step 12: UI height adjustment
            console.log("📐 [Adjust Module Heights]");
            fixModuleHeight("headerSection, footerSection, homeSection1", -50, "homeSection3");
        })
        .catch((error) => {
            console.error("💥 [Exception] checkConfigUpdate failed:", error);
            showDialog("Server didn't respond!");
        });
}



async function updateSystemConfiguration() {
    try {
        console.log("🛠 [updateSystemConfiguration] Start");

        // Step 1: Prepare file name
        const infoFileName = `SYSCONFINFO-${shared.deviceSerialNumber}.json`;
        console.log("📄 [File Name] =", infoFileName);

        // Step 2: Convert config data to JSON
        const configInfo = JSON.stringify(infoJSON);
        console.log("📦 [Config Info] JSON Length =", configInfo.length);

        // Step 3: Build file path
        const filePath = `${shared.systemConfiguration.systemInfo.localAppFolderDigiSign}/CURR_${infoFileName}`
            .replace(/\/+/g, '/');
        console.log("📂 [File Path] =", filePath);

        // Step 4: Confirm before writing
        const confirmWrite = confirm(`Do you want to write configuration file?\n\nPath: ${filePath}`);
        if (!confirmWrite) {
            console.warn("⚠️ File write canceled by user");
            return;
        }

        // Step 5: Write file
        console.log("✍️ Writing file to device storage...");
        await Filesystem.writeFile({
            path: filePath,
            data: configInfo,
            directory: Directory.Data,
            encoding: Encoding.UTF8,
        });
        console.log("✅ File written successfully:", filePath);

        // Step 6: Post-write confirmation
        alert(`Configuration file successfully created!\n\nPath: ${filePath}`);

        // Step 7: Follow update order
        console.log("➡️ Calling followUpdateOrder('updateCMSData')");
        followUpdateOrder("updateCMSData");

    } catch (error) {
        console.error("❌ [updateSystemConfiguration] File Creation failed!", error);
        alert(`Error creating configuration file!\n\n${error.message || error}`);
    }
}



// async function updateCMSData() {
//     try {
//         const cmsFileName = infoJSON.cmsInfo.cmsFileName;
//         const cmsFolder = shared.systemConfiguration.systemInfo.localAppFolderDigiSign;
//         const fileURL = infoJSON.systemInfo.cdnURL + infoJSON.cmsInfo.cmsPath + cmsFileName;

//         const fullLocalPath = `${cmsFolder}/${cmsFileName}`;

//         // Step 1: Download CMS file from CDN
//         const response = await Http.downloadFile({
//             url: fileURL,
//             filePath: fullLocalPath,
//             fileDirectory: Directory.Data
//         });

//         // Step 2: After download, attempt to read file locally
//         const result = await Filesystem.readFile({
//             path: fullLocalPath,
//             directory: Directory.Data,
//             encoding: Encoding.UTF8
//         });

//         // Step 3: Parse JSON content
//         shared.cmsJSON = JSON.parse(result.data);
       

//         // Step 4: Proceed with next update
//         followUpdateOrder("updateStyleCSSData");

//     } catch (error) {
//         // Step 5: If download or read fails, proceed anyway
//         followUpdateOrder("updateStyleCSSData");
//         console.log("updateCMSData: download/read error " + JSON.stringify(error));
//     }
// }

async function updateCMSData() {
    try {
        console.log("🛠 [updateCMSData] Start");

        // Step 1: Prepare variables
        const cmsFileName = infoJSON.cmsInfo.cmsFileName;
        const cmsFolder = shared.systemConfiguration.systemInfo.localAppFolderDigiSign;
        const fileURL = infoJSON.systemInfo.cdnURL + infoJSON.cmsInfo.cmsPath + cmsFileName;
        const fullLocalPath = `${cmsFolder}/${cmsFileName}`.replace(/\/+/g, '/');

        console.log("📄 [CMS File Name] =", cmsFileName);
        console.log("📂 [CMS Folder] =", cmsFolder);
        console.log("🌐 [File URL] =", fileURL);
        console.log("📌 [Full Local Path] =", fullLocalPath);

        // Step 2: Ask before downloading
        const confirmDownload = confirm(`Do you want to download the CMS file?\n\nURL: ${fileURL}`);
        if (!confirmDownload) {
            console.warn("⚠️ CMS download canceled by user");
            return;
        }

        // Step 3: Fetch CMS file from CDN
        console.log("⬇️ Fetching CMS file...");
        const response = await fetch(fileURL);

        if (!response.ok) {
            throw new Error(`Failed to fetch CMS file: ${response.status} ${response.statusText}`);
        }

        const cmsText = await response.text();

        // Step 4: Save CMS file locally
        console.log("💾 Saving CMS file locally at:", fullLocalPath);
        await Filesystem.writeFile({
            path: fullLocalPath,
            data: cmsText,
            directory: Directory.Data,
            encoding: Encoding.UTF8
        });

        alert(`CMS file downloaded successfully!\n\nPath: ${fullLocalPath}`);

        // Step 5: Parse CMS JSON
        console.log("📦 Parsing CMS JSON...");
        shared.cmsJSON = JSON.parse(cmsText);
        console.log("✅ CMS JSON parsed successfully");

        alert("CMS JSON loaded into shared.cmsJSON successfully!");

        // Step 6: Proceed with next update
        console.log("➡️ Calling followUpdateOrder('updateStyleCSSData')");
        followUpdateOrder("updateStyleCSSData");

    } catch (error) {
        // Step 7: If download/read fails, still proceed
        console.error("❌ [updateCMSData] Error:", error);
        alert(`Error downloading or reading CMS file!\n\n${error.message || error}`);

        followUpdateOrder("updateStyleCSSData");
    }
}



// async function updateStyleCSSData() {
//     try {
//         const cssFileName = infoJSON.cmsInfo.cssFileName;
//         const cssPath = shared.systemConfiguration.systemInfo.localAppFolderDigiSign + '/' + cssFileName;
//         const fileURL = infoJSON.systemInfo.cdnURL + infoJSON.cmsInfo.cssPath + cssFileName;

//         // Step 1: Download the CSS file
//         const response = await Http.downloadFile({
//             url: fileURL,
//             filePath: cssPath,
//             fileDirectory: Directory.Data
//         });

//         // Step 2: Verify that file exists and can be accessed
//         await Filesystem.getUri({
//             directory: Directory.Data,
//             path: cssPath,
//         });

//         // Step 3: Proceed if file is accessible
//         followUpdateOrder("updateApp", infoJSON);

//     } catch (error) {
//         // Fallback: proceed even if download/access fails
//         followUpdateOrder("updateApp");
//         console.log("updateStyleCSSData: download error (file not found!): " + JSON.stringify(error));
//     }
// }

async function updateStyleCSSData() {
    try {
        console.log("🛠 [updateStyleCSSData] Start");

        // Step 1: Prepare file names and paths
        const cssFileName = infoJSON.cmsInfo.cssFileName;
        const cssFolder = shared.systemConfiguration.systemInfo.localAppFolderDigiSign;
        const cssPath = `${cssFolder}/${cssFileName}`.replace(/\/+/g, '/');
        const fileURL = infoJSON.systemInfo.cdnURL + infoJSON.cmsInfo.cssPath + cssFileName;

        console.log("📄 [CSS File Name] =", cssFileName);
        console.log("📂 [CSS Local Path] =", cssPath);
        console.log("🌐 [CSS File URL] =", fileURL);

        // Step 2: Ask before downloading
        const confirmDownload = confirm(`Do you want to download the CSS file?\n\nURL: ${fileURL}`);
        if (!confirmDownload) {
            console.warn("⚠️ CSS download canceled by user");
            return;
        }

        // Step 3: Fetch CSS file from CDN
        console.log("⬇️ Fetching CSS file...");
        const response = await fetch(fileURL);

        if (!response.ok) {
            throw new Error(`Failed to fetch CSS file: ${response.status} ${response.statusText}`);
        }

        const cssText = await response.text();

        // Step 4: Save CSS file locally
        console.log("💾 Saving CSS file locally at:", cssPath);
        await Filesystem.writeFile({
            path: cssPath,
            data: cssText,
            directory: Directory.Data,
            encoding: Encoding.UTF8
        });

        alert(`CSS file downloaded successfully!\n\nPath: ${cssPath}`);

        // Step 5: Verify saved file exists
        console.log("🔍 Verifying CSS file existence...");
        const fileUri = await Filesystem.getUri({
            directory: Directory.Data,
            path: cssPath,
        });
        console.log("📌 File URI:", JSON.stringify(fileUri));

        alert(`CSS file is accessible at:\n${fileUri.uri}`);

        // Step 6: Proceed with update
        console.log("➡️ Calling followUpdateOrder('updateApp')");
        followUpdateOrder("updateApp", infoJSON);

    } catch (error) {
        // Step 7: Fallback if fetch/write fails
        console.error("❌ [updateStyleCSSData] Fetch/write error:", error);
        alert(`Error downloading or accessing CSS file!\n\n${error.message || error}`);

        followUpdateOrder("updateApp");
    }
}




// async function updateApp() {
//     try {
//         const fileURL = infoJSON.systemInfo.cdnURL + infoJSON.appInfo.appPath + infoJSON.appInfo.appFileName;
//         const fileName = infoJSON.appInfo.appFileName;
//         const folderPath = shared.systemConfiguration.systemInfo.localAppFolderDigiSign;
//         const localFileNameWithPath = folderPath + '/' + fileName;

//         showDialog("It may take few minutes.. DO NOT power off!!! System will automatically restart.");

//         // Download the APK file
//         const response = await Http.downloadFile({
//             url: fileURL,
//             filePath: localFileNameWithPath,
//             fileDirectory: Directory.Data
//         });

//         // Check if file exists after download
//         try {
//             await Filesystem.stat({
//                 path: localFileNameWithPath,
//                 directory: Directory.Data
//             });

//             console.log("updateApp: Downloaded complete!");

//             // Attempt APK install (requires plugin)
//             if (Capacitor.getPlatform() === 'android') {
//                 // You MUST implement or install a plugin for APK installation
//                 // For now, just log
//                 console.log("APK installation requires a custom plugin");
//                 // Example if you had a plugin:
//                 // await ApkInstaller.install({ path: localFileNameWithPath });
//             }
//         } catch (fileError) {
//             console.log("updateApp: Downloaded but could not find file locally: " + JSON.stringify(fileError));
//         }

//     } catch (error) {
//         followUpdateOrder("");
//         console.log("updateApp: download error (file not found!): " + JSON.stringify(error));
//     }
// }

// function followUpdateOrder(order) {
//     if (order == "updateSystemConfiguration") {
//         updateSystemConfiguration();
//     }

//     if (order == "updateCMSData") {
//         if ((infoJSON.cmsInfo.cmsVersion != shared.systemConfiguration.cmsInfo.cmsVersion) ||
//             (infoJSON.cmsInfo.cmsTimestamp != shared.systemConfiguration.cmsInfo.cmsTimestamp)) {
//             updateCMSData(infoJSON);
//         } else {
//             order = "updateStyleCSSData";
//         }
//     }

//     if (order == "updateStyleCSSData") {
//         if ((infoJSON.cmsInfo.cssVersion != shared.systemConfiguration.cmsInfo.cssVersion) ||
//             (infoJSON.cmsInfo.cssTimestamp != shared.systemConfiguration.cmsInfo.cssTimestamp)) {
//             updateStyleCSSData();
//         } else {
//             order = "updateApp";
//         }
//     }

//     if (order == "updateApp") {
//         if ((infoJSON.appInfo.appVersion != shared.systemConfiguration.appInfo.appVersion) ||
//             (infoJSON.appInfo.appTimestamp != shared.systemConfiguration.appInfo.appTimestamp)) {
//             updateApp();
//         } else {
//             shared.systemConfiguration = infoJSON;
//             showDialog("System file updated!", "location.reload()");
//         }
//     }
// }


// helper functions are defined below 


async function updateApp() {
    try {
        const fileURL = infoJSON.systemInfo.cdnURL + infoJSON.appInfo.appPath + infoJSON.appInfo.appFileName;
        const fileName = infoJSON.appInfo.appFileName;

        showDialog("It may take few minutes... DO NOT power off!");

        console.log("Downloading APK:", fileURL);

        let response;
        try {
            response = await Http.downloadFile({
                url: fileURL,
                filePath: fileName,
                fileDirectory: Directory.Data
            });

            console.log("DOWNLOAD RESPONSE:", response);
        } catch (err) {
            console.error("DOWNLOAD ERROR:", err);
            showDialog("APK download failed! Check server URL.");
            return;
        }

        if (!response || !response.path) {
            console.error("Invalid download response:", response);
            showDialog("Download failed. Server did not return a file.");
            return;
        }

        let apkPath = response.path.replace("file://", "");
        console.log("APK saved to:", apkPath);

        await ApkInstaller.install({ path: apkPath });

        console.log("Installer triggered.");

    } catch (error) {
        console.error("updateApp: download or install error:", error);
        followUpdateOrder("");
    }
}

/**
 * Utility: convert ArrayBuffer -> base64
 */
function arrayBufferToBase64(buffer) {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
}

async function isUrlReachable(url) {
    try {
        // try a HEAD request first
        const res = await fetch(url, { method: 'HEAD' });
        return res.ok;
    } catch (e) {
        // fallback: try GET but don't download body
        try {
            const res2 = await fetch(url, { method: 'GET' });
            return res2.ok;
        } catch (e2) {
            console.warn("isUrlReachable error:", e2);
            return false;
        }
    }
}

// async function updateApp() {
//     try {
//         // defensive checks for infoJSON/shared
//         if (!infoJSON || !infoJSON.appInfo || !infoJSON.systemInfo) {
//             console.error("updateApp: infoJSON is missing or invalid:", infoJSON);
//             showDialog("Update failed: invalid update metadata.");
//             return;
//         }

//         const fileURL = infoJSON.systemInfo.cdnURL + infoJSON.appInfo.appPath + infoJSON.appInfo.appFileName;
//         const fileName = infoJSON.appInfo.appFileName;

//         console.log("FINAL APK URL:", fileURL);
//         showDialog("It may take a few minutes.. DO NOT power off!!! System will automatically restart.");

//         // Quick URL reachability check (useful for S3 CORS or 404)
//         const ok = await isUrlReachable(fileURL);
//         if (!ok) {
//             console.error("APK URL not reachable from device:", fileURL);
//             showDialog("APK not reachable from device. Check network/S3 URL.");
//             return;
//         }

//         // Attempt Http.downloadFile first (native)
//         let downloadResponse = null;
//         try {
//             console.log("Calling Http.downloadFile...");
//             downloadResponse = await Http.downloadFile({
//                 url: fileURL,
//                 filePath: fileName,
//                 fileDirectory: Directory.Data
//             });
//             console.log("Http.downloadFile response:", downloadResponse);
//         } catch (httpErr) {
//             console.error("DOWNLOAD ERROR (Http.downloadFile) ->", httpErr);
//             // do not return yet — we'll try fallback
//         }

//         // If native download didn't provide path, fallback to fetch + writeFile
//         let apkPath = null;
//         if (downloadResponse && (downloadResponse.path || downloadResponse.uri)) {
//             // prefer path, fallback to uri
//             apkPath = downloadResponse.path || downloadResponse.uri;
//             console.log("Raw downloadResponse path/uri:", apkPath);
//         }

//         if (!apkPath) {
//             console.log("Falling back to fetch + Filesystem.writeFile...");
//             // fetch binary and write as base64
//             try {
//                 const resp = await fetch(fileURL);
//                 if (!resp.ok) {
//                     throw new Error("Fetch failed with status " + resp.status);
//                 }
//                 const arrayBuffer = await resp.arrayBuffer();
//                 const base64Data = arrayBufferToBase64(arrayBuffer);

//                 // write into Directory.Data
//                 const writeRes = await Filesystem.writeFile({
//                     path: fileName,
//                     data: base64Data,
//                     directory: Directory.Data,
//                     recursive: true
//                 });
//                 console.log("Filesystem.writeFile result:", writeRes);

//                 // attempt to get file uri
//                 try {
//                     const statRes = await Filesystem.getUri({
//                         path: fileName,
//                         directory: Directory.Data
//                     });
//                     apkPath = statRes.uri || statRes.path;
//                     console.log("Filesystem.getUri:", statRes);
//                 } catch (statErr) {
//                     // Some Filesystem implementations return different fields
//                     console.warn("Filesystem.getUri failed:", statErr);
//                     // attempt common app-files path fallback
//                     apkPath = "/data/data/" + Capacitor.getPackageName?.() + "/files/" + fileName;
//                 }
//             } catch (fetchErr) {
//                 console.error("Fallback fetch/writeFile failed:", fetchErr);
//                 showDialog("APK download failed. Check server and try again.");
//                 return;
//             }
//         }

//         // Normalize path: remove file:// prefix when present
//         if (apkPath && apkPath.startsWith("file://")) {
//             apkPath = apkPath.replace("file://", "");
//         }

//         console.log("Attempting to install APK at:", apkPath);

//         // final guard
//         if (!apkPath) {
//             console.error("No valid APK path available after download attempts.");
//             showDialog("Download didn't complete: no APK file.");
//             return;
//         }

//         // Call plugin to install
//         try {
//             await ApkInstaller.install({ path: apkPath });
//             console.log("APK install intent triggered.");
//         } catch (installErr) {
//             console.error("ApkInstaller.install error:", installErr);
//             showDialog("Failed to launch installer: " + (installErr && installErr.message ? installErr.message : "unknown"));
//             return;
//         }

//     } catch (err) {
//         console.error("updateApp: unexpected error:", err);
//         showDialog("Update failed unexpectedly.");
//         followUpdateOrder("");
//     }
// }



function followUpdateOrder(order, updatedInfoJSON) {
    console.log("🔄 [followUpdateOrder] Start - Order:", order);

    // If updatedInfoJSON was passed in, update global infoJSON
    if (updatedInfoJSON) {
        console.log("📥 [followUpdateOrder] Received updated infoJSON");
        infoJSON = updatedInfoJSON;
    }

    if (order == "updateSystemConfiguration") {
        console.log("🛠 [updateSystemConfiguration] Triggered");
        console.log("📄 Current infoJSON.systemInfo:", infoJSON.systemInfo);
        console.log("📄 Current shared.systemConfiguration.systemInfo:", shared.systemConfiguration.systemInfo);
        updateSystemConfiguration();
    }

    if (order == "updateCMSData") {
        console.log("📦 [updateCMSData] Checking CMS version/timestamp");
        console.log("   infoJSON.cmsInfo.cmsVersion:", infoJSON.cmsInfo.cmsVersion, 
                    "| shared.cmsVersion:", shared.systemConfiguration.cmsInfo.cmsVersion);
        console.log("   infoJSON.cmsInfo.cmsTimestamp:", infoJSON.cmsInfo.cmsTimestamp, 
                    "| shared.cmsTimestamp:", shared.systemConfiguration.cmsInfo.cmsTimestamp);

        if ((infoJSON.cmsInfo.cmsVersion != shared.systemConfiguration.cmsInfo.cmsVersion) ||
            (infoJSON.cmsInfo.cmsTimestamp != shared.systemConfiguration.cmsInfo.cmsTimestamp)) {
            console.log("✅ CMS update needed → Calling updateCMSData()");
            updateCMSData(infoJSON);
        } else {
            console.log("⏩ CMS data is up-to-date → Moving to updateStyleCSSData");
            order = "updateStyleCSSData";
            followUpdateOrder(order); // continue chain
        }
    }

    if (order == "updateStyleCSSData") {
        console.log("🎨 [updateStyleCSSData] Checking CSS version/timestamp");
        console.log("   infoJSON.cmsInfo.cssVersion:", infoJSON.cmsInfo.cssVersion, 
                    "| shared.cssVersion:", shared.systemConfiguration.cmsInfo.cssVersion);
        console.log("   infoJSON.cmsInfo.cssTimestamp:", infoJSON.cmsInfo.cssTimestamp, 
                    "| shared.cssTimestamp:", shared.systemConfiguration.cmsInfo.cssTimestamp);

        if ((infoJSON.cmsInfo.cssVersion != shared.systemConfiguration.cmsInfo.cssVersion) ||
            (infoJSON.cmsInfo.cssTimestamp != shared.systemConfiguration.cmsInfo.cssTimestamp)) {
            console.log("✅ CSS update needed → Calling updateStyleCSSData()");
            updateStyleCSSData();
        } else {
            console.log("⏩ CSS data is up-to-date → Moving to updateApp");
            order = "updateApp";
            followUpdateOrder(order); // continue chain
        }
    }

    if (order == "updateApp") {
        console.log("📱 [updateApp] Checking App version/timestamp");
        console.log("   infoJSON.appInfo.appVersion:", infoJSON.appInfo.appVersion, 
                    "| shared.appVersion:", shared.systemConfiguration.appInfo.appVersion);
        console.log("   infoJSON.appInfo.appTimestamp:", infoJSON.appInfo.appTimestamp, 
                    "| shared.appTimestamp:", shared.systemConfiguration.appInfo.appTimeStamp);

        if ((infoJSON.appInfo.appVersion != shared.systemConfiguration.appInfo.appVersion) ||
            (infoJSON.appInfo.appTimestamp != shared.systemConfiguration.appInfo.appTimeStamp)) {
            console.log("✅ App update needed → Calling updateApp()");
            updateApp();
        } else {
            console.log("🎉 All updates complete → Updating shared.systemConfiguration and reloading");
            shared.systemConfiguration = infoJSON;
            showDialog("System file updated!", "location.reload()");
        }
    }

    console.log("🏁 [followUpdateOrder] End - Order processed:", order);
}

export function displaySection(section, displayType, header, footer) {
    var sectionList = [
        "systemSection",
        "helpSection",
        "modulesSection",
        "homeSection",
        "bannerSection",
        "visitmateSection",
        "lotomateSection",
        "pipemarkSection"
    ];

    if (header == true) {
        $("#headerSection").css("display", "block");
    } else {
        $("#headerSection").css("display", "none");
    }
    if (footer == true) {
        $("#footerSection").css("display", "block");
    } else {
        $("#footerSection").css("display", "none");
    }

    for (const sec of sectionList) {
        if (sec === section) {
            $("#" + sec).css("display", displayType);
            shared.currentState = sec;
        } else {
            $("#" + sec).css("display", "none");
        }
    }

}


function getLocalCSSPath(fileName) {
  const base = shared.systemConfiguration?.systemInfo?.localAppFolderDigiSign;
  if (!base) throw new Error("Invalid localAppFolderDigiSign path");
  return [base, fileName].join("/").replace(/\/+/g, "/");
}




//  export async function   buildRequestOptions(apiURL, apiType = 'GET', apiData = {}) {
//   apiData = apiData || {};
// //   const status = await Network.getStatus();
// //   if (!status.connected) {
// //     console.log("No network connection available");
// //     return null;
// //   }

//   let api = shared.systemConfiguration.systemInfo.gatewayBaseURL + apiURL;

//   console.log("calling API:", api, "with type:", apiType, "and data:", apiData);
//   const requestOptions = {
//     url: api,
//     method: apiType,
//     headers: {
//       'Content-Type': 'application/json'
//     },
//     ...(apiType === 'GET' ? { params: apiData } : { data: apiData })
//   };
//   return requestOptions;
// }

//  export async function RequestOptions(apiURL, apiType = 'POST', apiData = {}) {
//   apiData = apiData || {};
// //   const status = await Network.getStatus();
// //   if (!status.connected) {
// //     console.log("No network connection available");
// //     return null;
// //   }

//   let api = shared.systemConfiguration.systemInfo.gatewayBaseURL + apiURL;

//   console.log("calling API:", api, "with type:", apiType, "and data:", apiData);
//   const requestOptions = {
//     url: api,
//     method: apiType,
//     headers: {
//       'Content-Type': 'application/json'
//     },
//     ...(apiType === 'POST' ? { params: apiData } : { data: apiData })
//   };
//   return requestOptions;
// }

/**
 * @param {{ status: number, statusText?: string }} response
 * @param {string} apiFunctionName
 */
// export function isValidResponse(response, apiFunctionName) {
//     $('#loadingmessage').hide();

//     if (!response || typeof response.status !== 'number') {
//         showDialog(`Something went wrong!\nNo response object for ${apiFunctionName}`);
//         return false;
//     }

//     if (response.status >= 200 && response.status < 300) {
//         console.log(`${apiFunctionName} Success!`);
//         return true;
//     } else {
//         showDialog(`Error!\nStatus: ${response.status} - ${response.statusText}\nModule: ${apiFunctionName}`);
//         return false;
//     }
// }





// export function showConfirmDialog(res, yesCall, noCall) {
//     var commonCMS = shared.cmsJSON.cmsJSONdata.common;
//     $('#confirmDialogBox').addClass(commonCMS.dialogBox.dialogBoxBackgroundClass);
//     $('#confirmDialogBoxCard').addClass(commonCMS.dialogBox.dialogBoxCardClass);
//     $('#confirmDialogText').addClass(commonCMS.dialogBox.dialogBoxTextClass);
//     $('#confirmDialogYes').addClass(commonCMS.dialogBox.dialogBoxButtonClass);
//     $('#confirmDialogNo').addClass(commonCMS.dialogBox.dialogBoxButtonClass);

//     $('#confirmDialogText').html(res);

//     // Remove previous handlers to avoid multiple triggers
//     if (typeof yesCall === 'function') {
//         $('#confirmDialogYes').off('click').on('click', yesCall);
//     }
//     if (typeof noCall === 'function') {
//         $('#confirmDialogNo').off('click').on('click', noCall);
//     }

//     $('#confirmDialogBox').show();
// }

// export function showConfirmDialog(res, yesCall, noCall) {
//     console.group("🛠️ [showConfirmDialog Diagnostic]");

//     // 1️⃣ Check element existence
//     const dialogElem = $('#confirmDialogBox');
//     if (dialogElem.length === 0) {
//         console.error("❌ #confirmDialogBox element NOT found in DOM!");
//         console.groupEnd();
//         return;
//     } else {
//         console.log("✅ #confirmDialogBox element FOUND in DOM.");
//     }

//     // 2️⃣ Check visibility before changes
//     const isInitiallyVisible = dialogElem.is(':visible');
//     console.log("👀 Initially visible:", isInitiallyVisible);

//     // 3️⃣ Check CSS state
//     const computedStyle = window.getComputedStyle(dialogElem[0]);
//     console.log("🎨 Computed Styles:", {
//         display: computedStyle.display,
//         opacity: computedStyle.opacity,
//         visibility: computedStyle.visibility,
//         zIndex: computedStyle.zIndex
//     });

//     if (computedStyle.zIndex === "auto" || parseInt(computedStyle.zIndex) < 1000) {
//         console.warn("⚠️ z-index might be too low, dialog could be behind other elements.");
//     }

//     // 4️⃣ Apply CMS classes
//     var commonCMS = shared.cmsJSON.cmsJSONdata.common;
//     dialogElem.addClass(commonCMS.dialogBox.dialogBoxBackgroundClass);
//     $('#confirmDialogBoxCard').addClass(commonCMS.dialogBox.dialogBoxCardClass);
//     $('#confirmDialogText').addClass(commonCMS.dialogBox.dialogBoxTextClass);
//     $('#confirmDialogYes').addClass(commonCMS.dialogBox.dialogBoxButtonClass);
//     $('#confirmDialogNo').addClass(commonCMS.dialogBox.dialogBoxButtonClass);

//     // 5️⃣ Set text and callbacks
//     $('#confirmDialogText').html(res);

//     if (typeof yesCall === 'function') {
//         $('#confirmDialogYes').off('click').on('click', yesCall);
//     }
//     if (typeof noCall === 'function') {
//         $('#confirmDialogNo').off('click').on('click', noCall);
//     }

//     // 6️⃣ Show the dialog
//     dialogElem.show();

//     // 7️⃣ Verify visibility after showing
//     const isNowVisible = dialogElem.is(':visible');
//     console.log("👁️ Visible after .show():", isNowVisible);

//     if (!isNowVisible) {
//         console.error("❌ Dialog still not visible after .show() — likely hidden by CSS.");
//     }

//     console.groupEnd();
// }

// Validate server response


// Validate server response


// unified, correct RequestOptions

export async function RequestOptions(apiURL, apiType = 'POST', apiData = {}) {
  apiData = apiData || {};

  let api = shared.systemConfiguration.systemInfo.gatewayBaseURL + apiURL;
  console.log("calling API:", api, "with type:", apiType, "and data:", apiData);

  const requestOptions = {
    url: api,
    method: apiType,
    headers: {
      'Content-Type': 'application/json'
    },
    ...(apiType === 'POST' ? { params: apiData } : { data: apiData })
  };
  return requestOptions;
}

// buildRequestOptions for get
export async function buildRequestOptions(apiURL, apiType = 'GET', apiData = {}) {
  apiData = apiData || {};

  let api = shared.systemConfiguration.systemInfo.gatewayBaseURL + apiURL;
  console.log("calling API:", api, "with type:", apiType, "and data:", apiData);

  const requestOptions = {
    url: api,
    method: apiType,
    headers: {
      'Content-Type': 'application/json'
    },
    ...(apiType === 'GET' ? { params: apiData } : { data: apiData })
  };
  return requestOptions;
}

// export function isValidResponse(response, apiFunctionName) {
//     $('#loadingmessage').hide();

//     if (!response || typeof response.status !== 'number') {
//         showDialog(`Something went wrong!\nNo valid response for ${apiFunctionName}`);
//         return false;
//     }

//     if (response.status >= 200 && response.status < 300) {
//         console.log(`${apiFunctionName} Success!`);
//         return true;
//     }

//     const statusText = response.statusText || "Unknown error";
//     switch (response.status) {
//         case 401:
//             showDialog(`Unauthorized! Please log in again.\nModule: ${apiFunctionName}`);
//             break;
//         case 403:
//             showDialog(`Forbidden! Access denied.\nModule: ${apiFunctionName}`);
//             break;
//         case 404:
//             showDialog(`Not Found!\nModule: ${apiFunctionName}`);
//             break;
//         default:
//           if (response.status >= 500) {
//                 showDialog(`Server Error!\nStatus: ${response.status}\nModule: ${apiFunctionName}`);
//             } else {
//                 showDialog(`Error!\nStatus: ${response.status} - ${statusText}\nModule: ${apiFunctionName}`);
//             }
//     }
//     return false;
// }

// Use this unified function to support both jQuery-style jqXHR (no numeric status)
// and Capacitor Http.request (has numeric status).

export function isValidResponse(response, apiFunctionName) {
    $('#loadingmessage').hide();

    if (!response || typeof response.status !== 'number') {
        showDialog(`Something went wrong!\nNo valid response for ${apiFunctionName}`);
        return false;
    }

    // Success case
    if (response.status >= 200 && response.status < 300) {
        console.log(`${apiFunctionName} Success!`);
        return true;
    }

    // Map common status codes (since Capacitor doesn't provide statusText)
    const statusTextMap = {
        400: "Bad Request",
        401: "Unauthorized",
        403: "Forbidden",
        404: "Not Found",
        500: "Internal Server Error",
        502: "Bad Gateway",
        503: "Service Unavailable",
        504: "Gateway Timeout",
    };
    const statusText = statusTextMap[response.status] || "Unknown Error";

    // Detect if response.data is actually HTML (server error page)
    let extraInfo = "";
    if (typeof response.data === "string" && response.data.startsWith("<!doctype html")) {
        extraInfo = "\n(Server returned HTML error page)";
    }

    showDialog(
        `Error!\nStatus: ${response.status} - ${statusText}\nModule: ${apiFunctionName}${extraInfo}`
    );

    // Log full response for debugging
    console.error("API Error Response:", response);

    return false;
}




export function showConfirmDialog({
    message = "Are you sure?",
    yesLabel = "Yes",
    noLabel = "No",
    onYes = () => {},
    onNo = () => {}
} = {}) {
    console.log("🔍 [showConfirmDialog] General version called");

    // Create dialog if missing
    if ($('#confirmDialogBox').length === 0) {
        console.warn("⚠️ #confirmDialogBox not found — creating generic dialog...");
        $('body').append(`
            <div id="confirmDialogBox" style="display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.6); z-index:9999;">
              <div id="confirmDialogBoxCard" style="background:#fff; padding:20px; max-width:400px; margin:100px auto; border-radius:8px; text-align:center;">
                <p id="confirmDialogText"></p>
                <div style="margin-top:20px;">
                  <button id="confirmDialogYes"></button>
                  <button id="confirmDialogNo"></button>
                </div>
              </div>
            </div>
        `);
    }

    // Apply CMS styling if present
    if (shared?.cmsJSON?.cmsJSONdata?.common) {
        let commonCMS = shared.cmsJSON.cmsJSONdata.common;
        $('#confirmDialogBox').addClass(commonCMS.dialogBox.dialogBoxBackgroundClass);
        $('#confirmDialogBoxCard').addClass(commonCMS.dialogBox.dialogBoxCardClass);
        $('#confirmDialogText').addClass(commonCMS.dialogBox.dialogBoxTextClass);
        $('#confirmDialogYes').addClass(commonCMS.dialogBox.dialogBoxButtonClass);
        $('#confirmDialogNo').addClass(commonCMS.dialogBox.dialogBoxButtonClass);
    }

    // Set message and button labels
    $('#confirmDialogText').html(message);
    $('#confirmDialogYes').text(yesLabel);
    $('#confirmDialogNo').text(noLabel);

    // Bind click handlers
    $('#confirmDialogYes').off('click').on('click', function () {
        console.log("✅ Yes clicked");
        onYes();
        $('#confirmDialogBox').hide();
    });

    $('#confirmDialogNo').off('click').on('click', function () {
        console.log("❌ No clicked");
        onNo();
        $('#confirmDialogBox').hide();
    });

    // Show dialog
    $('#confirmDialogBox').show();
    console.log("📤 Confirm dialog shown");
}





async function logAllFilesInAppFolder() {
  try {
    const folderName = shared.systemConfiguration.systemInfo.localAppFolderDigiSign;

    console.log(`📂 Listing files in folder: ${folderName}`);

    const result = await Filesystem.readdir({
      path: folderName,
      directory: Directory.Data,
    });

    if (result.files.length === 0) {
      console.log("📭 No files found in the folder.");
    } else {
      console.log("📄 Files in folder:");
      result.files.forEach(file => console.log(`- ${file.name}`));
    }

  } catch (error) {
    console.error("❌ Error reading files from folder:", error);
  }
}





// Expose function to window for HTML to call
window.getSerialNumber = getSerialNumber;
window.createDeviceSerialNumber = createDeviceSerialNumber;
window.onSerialNoFileFound = onSerialNoFileFound;
window.serialNoFileNotFound = serialNoFileNotFound;
window.getSystemConfigurationFromFile = getSystemConfigurationFromFile;
window.getSystemConfigurationFromServer = getSystemConfigurationFromServer;
window.onSystemConfigurationFileFound = onSystemConfigurationFileFound;
window.createSystemConfiguration = createSystemConfiguration;
window.getStyleCSSData = getStyleCSSData;
window.onStyleCSSDataFileFound = onStyleCSSDataFileFound;
window.onStyleCSSDataFileNotFound = onStyleCSSDataFileNotFound;
window.createStyleCSSDataFile = createStyleCSSDataFile;
window.getCMSData = getCMSData;
window.onCMSDataFileFound = onCMSDataFileFound;
window.onCMSDataFileNotFound = onCMSDataFileNotFound;
window.createCMSDataFile = createCMSDataFile;
window.logAllFilesInAppFolder = logAllFilesInAppFolder;

