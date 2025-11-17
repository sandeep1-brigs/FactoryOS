import { Filesystem, Directory, Encoding } from "@capacitor/filesystem"
import { Capacitor } from '@capacitor/core';
import { Device } from "@capacitor/device"
import { Http } from '@capacitor-community/http';
import { Network } from '@capacitor/network';
import { App } from '@capacitor/app';
import $ from 'jquery';


import { shared , appUrl , s3PrivateUrl , s3PublicUrl} from "./globals.js";
import { displaySection , buildRequestOptions , isValidResponse , RequestOptions} from "./capacitor-welcome.js";
import { getSignedUrl ,constructUrl , populateTempCopiedImage , startAppIdleTimer } from "./utility.js";
import { viewHome } from "./settings.js";
import { viewPdfFile } from "./pdfviewer.js";


let currentJsonFile = '';
var currentTemplate = null;
var _refreshBannerTimer = null;
var mouseTimer = null, cursorVisible = true, showCustomControls = true;
var templateInfoJson = {"datId":0,"content":[]};
let showOfflineMsg = false;
var tempSsItemJsonData = {"folder": "", "items":[]};
var ssItemJsonData = {"folder": "", "items":[]};
var ssObjects = [];
var youtubePlayerId = null;
var youtubeVideoId = null;
var ytplayer = null;
var template;
var templateChange = true;
var screenWidth = 848;
var screenHeight = 1434;
var ssDigiveuTimer = null;
let cuttentSsItemIndex = 0;
var deviceInfo = null;


function viewDigiveu() {
    displayBanner();
}


export function displayBanner() {
    shared.currentRunningApp = 'digiVeu';

    displaySection("bannerSection", "flex", false, false);
	// $("#displayAny").text("JS is running!");
	
	document.addEventListener('fullscreenchange', (event) => {
		// document.fullscreenElement will point to the element that
		// is in fullscreen mode if there is one. If there isn't one,
		// the value of the property is null.
		if(showCustomControls == true) {
			if (document.fullscreenElement) {
		    	console.log(`Element: ${document.fullscreenElement.id} entered full-screen mode.`);
				document.getElementById("fullScreenBtn").innerHTML = '<i class="fas fa-compress"></i>';
		
			} else {
				console.log('Leaving full-screen mode.');
				document.getElementById("fullScreenBtn").innerHTML = '<i class="fas fa-expand"></i>';
			}
		}
	});

    currentJsonFile = '';
    currentTemplate = null;
    clearInterval(_refreshBannerTimer);
    _refreshBannerTimer = setInterval(bannerAliveHandle, 30000);
    CheckNewTemplate();
	// getContentDisplay();
	// getTemplateDisplay();
    // getSerialNumber();
	
	if(showCustomControls == true) {
        console.log("Custom video controls enabled");
		//handleVideoControls();
        
		// document.onmousemove = function() {
        $(document).on('click touchstart', function() {
            console.log("Mouse moved - show controls");
			//handleVideoControls();
	    });
	}
}

var bannerAliveHandleCounter = 0;

function bannerAliveHandle() {
    var bannerRefreshDelayCounter = 5;
    bannerAliveHandleCounter++;
    if(bannerAliveHandleCounter == bannerRefreshDelayCounter) {
        bannerAliveHandleCounter = 0;
        CheckNewTemplate();
    }

    if(currentTemplate == null) {
        //updateAppRuntime("banner", "running", "no_template");
      //  updateAppRuntime("banner", "on", JSON.stringify(templateInfoJson));
      console.log("No template loaded yet");
    } else {
       // updateAppRuntime("banner", "running", JSON.stringify(templateInfoJson));
       console.log("Template running: " );
    }
}



// async function CheckNewTemplate() {
//     try {
//         const serialNo = shared.deviceSerialNumber;

//         // === Call 1: /api/restgettemplatesfordevice =========================================
//         const urlTemplates = constructUrl("/api/restgettemplatesfordevice");
//         const dataTemplates = { deviceSerialno: serialNo };

//         const reqTemplates = await buildRequestOptions(urlTemplates, "GET", dataTemplates);
//         if (!reqTemplates) {
//             console.warn("[CheckNewTemplate] Request aborted: buildRequestOptions returned null (restgettemplatesfordevice).");
//             return;
//         }

//         const respTemplates = await Http.request(reqTemplates);
//         console.log("[CheckNewTemplate] restgettemplatesfordevice raw response:", respTemplates);

//         if (!(isValidResponse(respTemplates, "restgettemplatesfordevice") && respTemplates.data)) {
            
//             console.log("[CheckNewTemplate] Invalid response for restgettemplatesfordevice");
//             return;
//         }

//         let deviceTemplates;
//         try {
//             deviceTemplates = typeof respTemplates.data === "string"
//                 ? JSON.parse(respTemplates.data)
//                 : respTemplates.data;
//         } catch (e) {
//             console.warn("[CheckNewTemplate] Parsing restgettemplatesfordevice failed, using raw:", e);
//             deviceTemplates = respTemplates.data;
//         }

//         if (deviceTemplates != null && deviceTemplates.length > 0) {
//             const currentTime = new Date();
//             let matched = false;

//             for (let index = 0; index < deviceTemplates.length; index++) {
//                 const val = deviceTemplates[index];
//                 const startTime = new Date(val.startTime);
//                 const endTime = new Date(val.endTime);

//                 if ((currentTime > startTime) && (currentTime < endTime)) {
//                     matched = true;

//                     if (val.templateId == 0) {
//                         // === Simple storage branch =========================================
//                         console.log("Storage Folder: " + val.templateName);
//                         const folderPath = shared.systemConfiguration.systemInfo.privateCdnURL + val.templateName; // kept for parity

//                         // Call 2: /contents/getobjectsinfolder
//                         const urlObjects = constructUrl("/contents/getobjectsinfolder");
//                         const dataObjects = { directory: val.templateName, bucket: "bveucp" };

//                         try {
//                             const reqObjects = await buildRequestOptions(urlObjects, "GET", dataObjects);
//                             if (!reqObjects) {
//                                 console.warn("[CheckNewTemplate] Request aborted: buildRequestOptions returned null (getobjectsinfolder).");
//                                 break; // return false in $.each → break here
//                             }

//                             const respObjects = await Http.request(reqObjects);
//                             console.log("[CheckNewTemplate] getobjectsinfolder raw response:", respObjects);

//                             if (!(isValidResponse(respObjects, "getobjectsinfolder") && respObjects.data)) {
//                                 console.log("[CheckNewTemplate] Invalid response for getobjectsinfolder");
//                                 break;
//                             }

//                             // Cordova logged raw 'dat' string, then JSON.parse(dat)
//                             const datRaw = respObjects.data;
//                             const datString = typeof datRaw === "string" ? datRaw : JSON.stringify(datRaw);
//                             console.log("Objects: " + datString);

//                             let folderData;
//                             try {
//                                 folderData = typeof datRaw === "string" ? JSON.parse(datRaw) : datRaw;
//                             } catch (e) {
//                                 console.warn("[CheckNewTemplate] Parsing objects list failed:", e);
//                                 break;
//                             }

//                             ssObjects = folderData.objects;

//                             if (folderData.objects.length !== 0) {
//                                 const jsonFileIndex = ssObjects.findIndex(el => el.includes(".json"));

//                                 // Check if JSON file name updated.. indicates new data for signage
//                                 if (currentJsonFile !== ssObjects[jsonFileIndex]) {
//                                     currentJsonFile = ssObjects[jsonFileIndex];

//                                     // Get the JSON file (signed URL)
//                                     getSignedUrl(currentJsonFile, 10).then(async (url) => {
//                                         if (url && url.startsWith("http")) {
//                                             try {
//                                                 // Keep the XHR-style logic; fetch is equivalent for GET text
//                                                 const res = await fetch(url);
//                                                 if (res.ok) {
//                                                     const textContent = await res.text();
//                                                     console.log(textContent);
//                                                     tempSsItemJsonData = JSON.parse(textContent);

//                                                     // downloadObjects(val.templateName);
//                                                     getDownloadFolder();
//                                                     // viewObjectList(ssObjects, tempSsItemJsonData);
//                                                 } else {
//                                                     currentTemplate = null;
//                                                     displayNoTemplate();
//                                                 }
//                                             } catch (err) {
//                                                 console.log("error fetching signed url json: " + JSON.stringify(err));
//                                                 currentTemplate = null;
//                                                 displayNoTemplate();
//                                             }
//                                         }
//                                     });
//                                 }
//                             }
//                         } catch (exception) {
//                             console.log("error: " + JSON.stringify(exception));
//                         }
//                     } else {
//                         // === Template content branch =======================================
//                         const urlTemplateContent = constructUrl("/api/restgettemplatecontentbyid");
//                         const dataTemplateContent = { templatecontentId: val.templateId };

//                         try {
//                             const reqTemplateContent = await buildRequestOptions(urlTemplateContent, "GET", dataTemplateContent);
//                             if (!reqTemplateContent) {
//                                 console.warn("[CheckNewTemplate] Request aborted: buildRequestOptions returned null (restgettemplatecontentbyid).");
//                                 break;
//                             }

//                             const respTemplateContent = await Http.request(reqTemplateContent);
//                             console.log("[CheckNewTemplate] restgettemplatecontentbyid raw response:", respTemplateContent);

//                             if (!(isValidResponse(respTemplateContent, "restgettemplatecontentbyid") && respTemplateContent.data)) {
//                                 // mirror $.ajax error path handling below
//                                 if (currentTemplate != null) {
//                                     currentTemplate = null;
//                                     displayNoTemplate();
//                                 }
//                                 break;
//                             }

//                             let dat;
//                             try {
//                                 dat = typeof respTemplateContent.data === "string"
//                                     ? JSON.parse(respTemplateContent.data)
//                                     : respTemplateContent.data;
//                             } catch (e) {
//                                 console.warn("[CheckNewTemplate] Parsing template content failed, using raw:", e);
//                                 dat = respTemplateContent.data;
//                             }

//                             if (JSON.stringify(currentTemplate) !== JSON.stringify(dat)) {
//                                 templateChange = true;
//                                 currentTemplate = dat;
//                                 viewTemplate(dat);
//                             } else {
//                                 templateChange = false;
//                             }
//                         } catch (exception) {
//                             if (currentTemplate != null) {
//                                 currentTemplate = null;
//                                 displayNoTemplate();
//                             }
//                             console.log("error: " + JSON.stringify(exception));
//                         }
//                     }

//                     // return false in $.each → break here
//                     break;
//                 }

//                 // If loop reaches last item without match
//                 if (index === deviceTemplates.length - 1 && !matched) {
//                     currentTemplate = null;
//                     displayNoTemplate();
//                 }
//             }
//         } else {
//             // deviceTemplates is empty
//             currentTemplate = null;
//             displayNoTemplate();
//         }
//     } catch (exception) {
//         console.log("error: " + JSON.stringify(exception));
//     }
// }

function CheckNewTemplate() {
    try {
        const serialNo = shared.deviceSerialNumber;

        // === Call 1: /api/restgettemplatesfordevice =========================================
        const urlTemplates = constructUrl("/api/restgettemplatesfordevice");
        const dataTemplates = { deviceSerialno: serialNo };

        buildRequestOptions(urlTemplates, "GET", dataTemplates)
            .then(req => Http.request(req))
            .then(respTemplates => {
                console.log("[CheckNewTemplate] restgettemplatesfordevice raw response:", respTemplates);

                if (!(isValidResponse(respTemplates, "restgettemplatesfordevice") && respTemplates.data)) {
                    console.log("[CheckNewTemplate] Invalid response for restgettemplatesfordevice");
                    return;
                }

                let deviceTemplates;
                try {
                    deviceTemplates = typeof respTemplates.data === "string"
                        ? JSON.parse(respTemplates.data)
                        : respTemplates.data;
                } catch (e) {
                    console.warn("[CheckNewTemplate] Parsing restgettemplatesfordevice failed, using raw:", e);
                    deviceTemplates = respTemplates.data;
                }

                if (deviceTemplates != null && deviceTemplates.length > 0) {
                    const currentTime = new Date();
                    let matched = false;

                    for (let index = 0; index < deviceTemplates.length; index++) {
                        const val = deviceTemplates[index];
                        const startTime = new Date(val.startTime);
                        const endTime = new Date(val.endTime);

                        if ((currentTime > startTime) && (currentTime < endTime)) {
                            matched = true;

                            if (val.templateId == 0) {
                                // === Simple storage branch =========================================
                                console.log("Storage Folder: " + val.templateName);
                                const folderPath = shared.systemConfiguration.systemInfo.privateCdnURL + val.templateName;

                                // Call 2: /contents/getobjectsinfolder
                                const urlObjects = constructUrl("/contents/getobjectsinfolder");
                                const dataObjects = { directory: val.templateName, bucket: "bveucp" };

                                buildRequestOptions(urlObjects, "GET", dataObjects)
                                    .then(req => Http.request(req))
                                    .then(respObjects => {
                                        console.log("[CheckNewTemplate] getobjectsinfolder raw response:", respObjects);

                                        if (!(isValidResponse(respObjects, "getobjectsinfolder") && respObjects.data)) {
                                            console.log("[CheckNewTemplate] Invalid response for getobjectsinfolder");
                                            return;
                                        }

                                        const datRaw = respObjects.data;
                                        const datString = typeof datRaw === "string" ? datRaw : JSON.stringify(datRaw);
                                        console.log("Objects: " + datString);

                                        let folderData;
                                        try {
                                            folderData = typeof datRaw === "string" ? JSON.parse(datRaw) : datRaw;
                                        } catch (e) {
                                            console.warn("[CheckNewTemplate] Parsing objects list failed:", e);
                                            return;
                                        }

                                        ssObjects = folderData.objects;

                                        if (folderData.objects.length !== 0) {
                                            const jsonFileIndex = ssObjects.findIndex(el => el.includes(".json"));

                                            // Check if JSON file name updated.. indicates new data for signage
                                            if (currentJsonFile !== ssObjects[jsonFileIndex]) {
                                                currentJsonFile = ssObjects[jsonFileIndex];

                                                // Get the JSON file (signed URL)
                                                getSignedUrl(currentJsonFile, 10).then(async (url) => {
                                                    if (url && url.startsWith("http")) {
                                                        try {
                                                            const res = await fetch(url);
                                                            if (res.ok) {
                                                                const textContent = await res.text();
                                                                console.log(textContent);
                                                                tempSsItemJsonData = JSON.parse(textContent);

                                                                // downloadObjects(val.templateName);
                                                                getDownloadFolder();
                                                                // viewObjectList(ssObjects, tempSsItemJsonData);
                                                            } else {
                                                                currentTemplate = null;
                                                                displayNoTemplate();
                                                            }
                                                        } catch (err) {
                                                            console.log("error fetching signed url json: " + JSON.stringify(err));
                                                            currentTemplate = null;
                                                            displayNoTemplate();
                                                        }
                                                    }
                                                });
                                            }
                                        }
                                    })
                                    .catch(exception => {
                                        console.log("error: " + JSON.stringify(exception));
                                    });

                            } else {
                                // === Template content branch =======================================
                                const urlTemplateContent = constructUrl("/api/restgettemplatecontentbyid");
                                const dataTemplateContent = { templatecontentId: val.templateId };

                                buildRequestOptions(urlTemplateContent, "GET", dataTemplateContent)
                                    .then(req => Http.request(req))
                                    .then(respTemplateContent => {
                                        console.log("[CheckNewTemplate] restgettemplatecontentbyid raw response:", respTemplateContent);

                                        if (!(isValidResponse(respTemplateContent, "restgettemplatecontentbyid") && respTemplateContent.data)) {
                                            if (currentTemplate != null) {
                                                currentTemplate = null;
                                                displayNoTemplate();
                                            }
                                            return;
                                        }

                                        let dat;
                                        try {
                                            dat = typeof respTemplateContent.data === "string"
                                                ? JSON.parse(respTemplateContent.data)
                                                : respTemplateContent.data;
                                        } catch (e) {
                                            console.warn("[CheckNewTemplate] Parsing template content failed, using raw:", e);
                                            dat = respTemplateContent.data;
                                        }

                                        if (JSON.stringify(currentTemplate) !== JSON.stringify(dat)) {
                                            templateChange = true;
                                            currentTemplate = dat;
                                            viewTemplate(dat);
                                        } else {
                                            templateChange = false;
                                        }
                                    })
                                    .catch(exception => {
                                        if (currentTemplate != null) {
                                            currentTemplate = null;
                                            displayNoTemplate();
                                        }
                                        console.log("error: " + JSON.stringify(exception));
                                    });
                            }

                            // break loop after matched template
                            break;
                        }

                        // If loop reaches last item without match
                        if (index === deviceTemplates.length - 1 && !matched) {
                            currentTemplate = null;
                            displayNoTemplate();
                        }
                    }
                } else {
                    // deviceTemplates is empty
                    currentTemplate = null;
                    displayNoTemplate();
                }
            })
            .catch(exception => {
                console.log("error: " + JSON.stringify(exception));
            });

    } catch (exception) {
        console.log("error: " + JSON.stringify(exception));
    }
}


async function displayInstantTemplate(templateId, duration) {
    displaySection("bannerSection", "flex", false, false);
    closeAllVideos();
    $("#signagePage").html("");

    document.addEventListener('fullscreenchange', (event) => {
        if (showCustomControls === true) {
            if (document.fullscreenElement) {
                console.log(`Element: ${document.fullscreenElement.id} entered full-screen mode.`);
                document.getElementById("fullScreenBtn").innerHTML = '<i class="fas fa-compress"></i>';
            } else {
                console.log('Leaving full-screen mode.');
                document.getElementById("fullScreenBtn").innerHTML = '<i class="fas fa-expand"></i>';
            }
        }
    });

    currentTemplate = null;
    clearInterval(_refreshBannerTimer);
    _refreshBannerTimer = setInterval(instapublishEndHandle, duration * 1000);

    function instapublishEndHandle() {
        clearInterval(_refreshBannerTimer);
        bannerAliveHandleCounter = 0;
        _refreshBannerTimer = setInterval(bannerAliveHandle, 30000);
        CheckNewTemplate();

        if (showCustomControls === true) {
            handleVideoControls();
        }
    }

    // === Updated server call logic (replacing $.ajax) ===
    try {
        const urlTemplateContent = constructUrl("/api/restgettemplatecontentbyid");
        const dataTemplateContent = { templatecontentId: templateId };

        const reqTemplateContent = await buildRequestOptions(urlTemplateContent, "GET", dataTemplateContent);
        if (!reqTemplateContent) {
            console.warn("[displayInstantTemplate] Request aborted: buildRequestOptions returned null.");
            return;
        }

        const respTemplateContent = await Http.request(reqTemplateContent);
        console.log("[displayInstantTemplate] restgettemplatecontentbyid raw response:", respTemplateContent);

        if (!(isValidResponse(respTemplateContent, "restgettemplatecontentbyid") && respTemplateContent.data)) {
            // Mirror $.ajax error behavior
            if (currentTemplate != null) {
                currentTemplate = null;
                displayNoTemplate();
            }
            return;
        }

        let dat;
        try {
            dat = typeof respTemplateContent.data === "string"
                ? JSON.parse(respTemplateContent.data)
                : respTemplateContent.data;
        } catch (e) {
            console.warn("[displayInstantTemplate] Parsing template content failed, using raw:", e);
            dat = respTemplateContent.data;
        }

        if (JSON.stringify(currentTemplate) !== JSON.stringify(dat)) {
            templateChange = true;
            currentTemplate = dat;
            viewTemplate(dat);
        }
    } catch (exception) {
        if (currentTemplate != null) {
            currentTemplate = null;
            displayNoTemplate();
        }
        console.log("error: " + JSON.stringify(exception));
    }
}

async function displayNoTemplate() {
    // $('#loadingmessage').hide();
    let htmlContent = "";
    htmlContent += '<div class="notemplateerror">';
    htmlContent += '<div style="text-align: center;">No Template assigned!</div>';
    htmlContent += '<div class="backbuttonstyle" onclick="exitToHome()">Back</div>';
    htmlContent += '</div>';
    $("#signagePage").html(htmlContent);

    // === Updated server call logic (replacing $.ajax) ===
    try {
        const urlDisable = constructUrl("/deviceregistrations/disabledigiveu");
        const dataDisable = { deviceregistrationId: deviceInfo.id };

        const reqDisable = await RequestOptions(urlDisable, "POST", dataDisable);
        if (!reqDisable) {
            console.warn("[displayNoTemplate] Request aborted: buildRequestOptions returned null.");
            return;
        }

        const respDisable = await Http.request(reqDisable);
        console.log("[displayNoTemplate] disabledigiveu raw response:", respDisable);

        if (!(isValidResponse(respDisable, "disabledigiveu") && respDisable.data)) {
            console.log("[displayNoTemplate] Invalid response for disabledigiveu");
        } else {
            try {
                const dat = typeof respDisable.data === "string"
                    ? JSON.parse(respDisable.data)
                    : respDisable.data;
                console.log("[displayNoTemplate] disabledigiveu parsed:", dat);
            } catch (e) {
                console.warn("[displayNoTemplate] Parsing disabledigiveu response failed:", e);
                console.log("[displayNoTemplate] Raw data:", respDisable.data);
            }
        }
    } catch (exception) {
        console.log("error: " + JSON.stringify(exception));
    }

    if (templateChange === true) {
        templateChange = false;
        templateInfoJson = { "datId": 0, "content": [] };
        //updateAppRuntime("banner", "on", JSON.stringify(templateInfoJson));
    }
}

async function viewTemplate(dat) {
    if (dat != null) {
        let htmlContent = "";
        const parentElem = document.getElementById("signagePage");

        if ((dat.templateData != null) && (dat.templateData.length > 0)) {
            template = JSON.parse(dat.templateData);
            setBackgroundStyle(template, parentElem.id);

            templateInfoJson = { "datId": dat.id, "content": [] };
            for (let sec of template.sections) {
                if (sec.contentId != undefined) {
                    const contArr = sec.contentId.split("__");
                    const contJson = { "id": contArr[0], "name": contArr[1] };
                    templateInfoJson.content.push(contJson);
                }
            }
            //updateAppRuntime("banner", "on", JSON.stringify(templateInfoJson));

            let index = 0;
            htmlContent = "";

            for (let section of template.sections) {
                if (section.sectionStyles != undefined) {
                    let styleCount = 0;
                    for (let style of section.sectionStyles) {
                        styleCount++;
                        if (styleCount == section.sectionStyles.length) {
                            htmlContent += '<div class="templatesection" id="Contentbox_' + index + '" style="' + style.css + 'display: flex; align-items: center;">';
                        } else {
                            htmlContent += '<div style="' + style.css + '">';
                        }
                    }
                    for (let count = 0; count < styleCount; count++) {
                        htmlContent += "</div>";
                    }
                } else if ((section.values != undefined) && (section.type != undefined)) {
                    getEachElem(section).then((elem) => {
                        elem.style.position = "absolute";
                        elem.classList.add("templatebox");
                        if (elem.id == null || elem.id.length == 0) {
                            elem.id = "Contentbox_" + index;
                        }
                        parentElem.appendChild(elem);
                    });
                }
                index++;
            }

            if (htmlContent != "") {
                $(parentElem).html(htmlContent);
            }

            // font resize
            const parentElemBound = parentElem.getBoundingClientRect();
            if (parentElemBound.width > parentElemBound.height) {
                const fontResizeRatio = parentElemBound.width / 1920;
                $(parentElem).css("font-size", fontResizeRatio + "em");
            } else {
                const fontResizeRatio = parentElemBound.width / 1080;
                $(parentElem).css("font-size", fontResizeRatio + "em");
            }

            closeAllVideos();
            index = 0;

           
            async function nextAjax(section) {
                if (section.contentId != undefined) {
                    const id = section.contentId.split("__")[0];
                    let destinId = "";
                    if (section.values != undefined) {
                        destinId = section.values.id;
                    } else {
                        destinId = "Contentbox_" + index;
                    }

                    try {
                        const urlContent = constructUrl("/api/restgetcontentbyid");
                        const dataContent = { contentId: id };

                        const reqContent = await buildRequestOptions(urlContent, "GET", dataContent);
                        if (!reqContent) {
                            console.warn("[viewTemplate] Request aborted: buildRequestOptions returned null.");
                            return;
                        }

                        const respContent = await Http.request(reqContent);
                        console.log("[viewTemplate] restgetcontentbyid raw response:", respContent);

                        if (!(isValidResponse(respContent, "restgetcontentbyid") && respContent.data)) {
                            console.log("[viewTemplate] Invalid response for restgetcontentbyid");
                            return;
                        }

                        let content;
                        try {
                            content = typeof respContent.data === "string"
                                ? JSON.parse(respContent.data)
                                : respContent.data;
                        } catch (e) {
                            console.warn("[viewTemplate] Parsing restgetcontentbyid failed:", e);
                            content = respContent.data;
                        }

                        htmlContent = "";

                        // === Same rendering logic preserved ===
                        if (content.contentUrl.includes("google")) {
                            let contUrl = content.contentUrl;
                            if (!contUrl.includes("embed")) {
                                const contArr = contUrl.split("/");
                                const contId = contArr[5];
                                contUrl = "https://docs.google.com/presentation/d/" + contId + "/embed?start=true&loop=true&delayms=5000&rm=minimal";
                            }
                            htmlContent += '<iframe src="' + contUrl + '" frameborder="0" width="100%" height="100%" allowfullscreen="true" mozallowfullscreen="true" webkitallowfullscreen="true"></iframe>';
                            $("#" + destinId).html(htmlContent);

                        } else if (content.type.includes("Youtu")) {
                            const contUrl = content.contentUrl;
                            $("#" + destinId).html(htmlContent);

                            youtubePlayerId = destinId;
                            youtubeVideoId = contId;

                            if (ytplayer != null) {
                                ytplayer = new YT.Player(youtubePlayerId, {
                                    height: "100%",
                                    width: "100%",
                                    videoId: youtubeVideoId,
                                    playerVars: {
                                        playsinline: 1,
                                        controls: 0,
                                        showinfo: 0,
                                        rel: 0,
                                        loop: 1
                                    },
                                    events: {
                                        onReady: onPlayerReady,
                                        onStateChange: onPlayerStateChange
                                    }
                                });
                            } else {
                                const tag = document.createElement("script");
                                tag.src = "https://www.youtube.com/iframe_api";
                                const firstScriptTag = document.getElementsByTagName("script")[0];
                                firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
                            }

                        } else if (content.type.includes("Video")) {
                            getVideoFile(index, content.contentUrl, destinId);

                        } else if (content.type.includes("Document") || content.type.includes("Presentation") || content.type.includes("Spreadsheet")) {
                            // const encodedUrl = encodeURIComponent(content.contentUrl);
                            // const viewerUrl = `https://view.officeapps.live.com/op/embed.aspx?src=${encodedUrl}`;
                            // htmlContent += '<iframe src="' + viewerUrl + '" frameborder="0" width="100%" height="100%" allowfullscreen></iframe>';
                            // $("#" + destinId).html(htmlContent);
                           // content = { type: "Video"/"PDF"/"Image"/"Document"... , contentUrl: "https://..." }
                            // getAssetFile(index, content, destinId);
                            getAssetFile(index, content.contentUrl, destinId, "document");


                        } else if (content.type.includes("PDF")) {
                            // htmlContent += '<iframe src="' + content.contentUrl + '#toolbar=0" style="width:100%; height: 100%;" frameborder="0"></iframe>';
                            // $("#" + destinId).html(htmlContent);
                            // content = { type: "Video"/"PDF"/"Image"/"Document"... , contentUrl: "https://..." }
                            // getAssetFile(index, content, destinId);
                            getAssetFile(index, content.contentUrl, destinId, "pdf");


                        } else if (content.type.includes("HTML")) {
                            htmlContent += content.contentUrl;
                            $("#" + destinId).html(htmlContent);

                        } else if (content.type.includes("Image")) {
                            // htmlContent += '<img src="' + content.contentUrl + '" style="object-fit: contain; max-height: 100%; width: 100%;" onerror="this.onerror=null;this.src=\'./img/noimage.jpg\';" />';
                            // $("#" + destinId).html(htmlContent);
                            // content = { type: "Video"/"PDF"/"Image"/"Document"... , contentUrl: "https://..." }
                            // getAssetFile(index, content, destinId);
                            getAssetFile(index, content.contentUrl, destinId, "image");

                        }

                        index++;
                        if (index < template.sections.length) {
                            nextAjax(template.sections[index]);
                        }

                    } catch (exception) {
                        console.log("error: " + JSON.stringify(exception));
                    }

                } else {
                    index++;
                    if (index < template.sections.length) {
                        nextAjax(template.sections[index]);
                    }
                }
            }

            nextAjax(template.sections[0]);

        } else {
            templateInfoJson = { "datId": 0, "content": [] };
            //updateAppRuntime("banner", "on", JSON.stringify(templateInfoJson));

            htmlContent += "No CMS data!";
            $(parentElem).html(htmlContent);
        }

        return false; // breaks
    }
}

// Helpers
// function normalizeDir(dir) {
//   const d = String(dir || '').replace(/^\/+/, '').replace(/\/+$/, '');
//   return d || 'content';
// }
// function formatBytes(n) {
//   if (typeof n !== 'number') return 'n/a';
//   const u = ['B','KB','MB','GB']; const i = Math.max(0, Math.min(u.length-1, Math.floor(Math.log(n)/Math.log(1024))));
//   return `${(n/Math.pow(1024,i)).toFixed(2)} ${u[i]}`;
// }

// Robust downloader with fallbacks.
// Returns: { ok, uri, path, existed, method }
// async function downloadAsset({
//   uri,
//   targetDirectory,
//   fileName,
//   onProgress,              // (0..100)
//   maxBase64Bytes = 20 * 1024 * 1024
// }) {
//   const tag = `DL#${Date.now()}`;
//   const log = (...a) => console.log(`[${tag}]`, ...a);
//   const warn = (...a) => console.warn(`[${tag}]`, ...a);
//   const error = (...a) => console.error(`[${tag}]`, ...a);

//   if (!uri) return { ok: false, reason: 'No URI provided' };

//   const dir = normalizeDir(targetDirectory);
//   const fullPath = `${dir}/${fileName}`.replace(/\/+/g, '/');

//   log('Starting download:', uri, '→', fullPath);

//   // Ensure directory
//   try {
//     await Filesystem.mkdir({ path: dir, directory: Directory.Data, recursive: true });
//   } catch (e) {
//     if (!String(e?.message || e).match(/exist/i)) warn('mkdir:', e?.message || e);
//   }

//   // 0) Cached?
//   try {
//     const stat = await Filesystem.stat({ path: fullPath, directory: Directory.Data });
//     const { uri: nativeUri } = await Filesystem.getUri({ path: fullPath, directory: Directory.Data });
//     log('✅ File already exists:', nativeUri);
//     return { ok: true, existed: true, uri: nativeUri, path: fullPath, method: 'cache' };
//   } catch { /* not found → continue */ }

//   // Detect HTTP plugin (Capacitor Community HTTP or alias)
//   const HttpPlugin =
//     (globalThis.Capacitor?.Plugins && (globalThis.Capacitor.Plugins.CapacitorHttp || globalThis.Capacitor.Plugins.Http)) ||
//     globalThis.CapacitorHttp || // some builds expose this
//     globalThis.Http;            // your earlier code used "Http"

//   // 1) Try native streaming via Filesystem.downloadFile (if available)
//   if (typeof Filesystem.downloadFile === 'function') {
//     try {
//       await Filesystem.downloadFile({ url: uri, path: fullPath, directory: Directory.Data, recursive: true });
//       const { uri: nativeUri } = await Filesystem.getUri({ path: fullPath, directory: Directory.Data });
//       log('✅ Saved via Filesystem.downloadFile:', nativeUri);
//       return { ok: true, existed: false, uri: nativeUri, path: fullPath, method: 'fs.downloadFile' };
//     } catch (e) { warn('Filesystem.downloadFile failed:', e?.message || e); }
//   }

//   // 2) Try Capacitor HTTP streaming (with progress if available)
//   if (HttpPlugin?.downloadFile) {
//     try {
//       const resp = await HttpPlugin.downloadFile({
//         url: uri,
//         filePath: fullPath,
//         directory: Directory.Data,
//         progress: true
//       });

//       if (resp?.progress && typeof resp.progress.on === 'function' && onProgress) {
//         resp.progress.on('downloadProgress', (ev) => {
//           if (ev?.total) {
//             const pct = Math.round((ev.loaded * 100) / ev.total);
//             onProgress(Math.max(0, Math.min(100, pct)));
//           }
//         });
//       }
//       const { uri: nativeUri } = await Filesystem.getUri({ path: fullPath, directory: Directory.Data });
//       log('✅ Saved via Http.downloadFile:', nativeUri);
//       return { ok: true, existed: false, uri: nativeUri, path: fullPath, method: 'http.downloadFile' };
//     } catch (e) { warn('Http.downloadFile failed:', e?.message || e); }
//   }

//   // 3) Fallback: fetch → Blob → base64 (guard big files!)
//   try {
//     const res = await fetch(uri);
//     if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
//     const blob = await res.blob();
//     const size = blob?.size ?? 0;
//     log('Fetch blob size:', formatBytes(size));
//     if (size > maxBase64Bytes) throw new Error(`Blob too large for base64 fallback: ${formatBytes(size)} > ${formatBytes(maxBase64Bytes)}`);

//     if (onProgress) onProgress(5);
//     const b64 = await new Promise((resolve, reject) => {
//       const r = new FileReader();
//       r.onloadend = () => {
//         const s = String(r.result || '');
//         const comma = s.indexOf(',');
//         if (comma < 0) return reject(new Error('Invalid DataURL'));
//         resolve(s.slice(comma + 1));
//       };
//       r.onerror = reject;
//       r.readAsDataURL(blob);
//     });
//     if (onProgress) onProgress(50);

//     await Filesystem.writeFile({ path: fullPath, data: b64, directory: Directory.Data, recursive: true });
//     const { uri: nativeUri } = await Filesystem.getUri({ path: fullPath, directory: Directory.Data });
//     if (onProgress) onProgress(100);
//     log('✅ Saved via fetch+writeFile:', nativeUri);
//     return { ok: true, existed: false, uri: nativeUri, path: fullPath, method: 'fetch+base64' };
//   } catch (e) { warn('fetch+base64 fallback failed:', e?.message || e); }

//   // 4) Final fallback: use remote URL so UI still shows something
//   warn('All download methods failed. Using remote URL:', uri);
//   return { ok: true, existed: false, uri, path: null, method: 'remote' };
// }


// Type helpers
// function _inferTypeFromContent(contentOrUrl, explicitType) {
//   if (explicitType) return explicitType.toLowerCase();

//   if (contentOrUrl && typeof contentOrUrl === 'object' && contentOrUrl.type) {
//     const t = contentOrUrl.type.toLowerCase();
//     if (t.includes('video')) return 'video';
//     if (t.includes('image')) return 'image';
//     if (t.includes('pdf')) return 'pdf';
//     if (t.includes('document') || t.includes('presentation') || t.includes('spreadsheet')) return 'document';
//     if (t.includes('html')) return 'html';
//   }

//   const s = String(contentOrUrl || '').toLowerCase();
//   if (s.endsWith('.mp4') || s.endsWith('.webm') || s.endsWith('.ogg')) return 'video';
//   if (s.endsWith('.jpg') || s.endsWith('.jpeg') || s.endsWith('.png') || s.endsWith('.gif') || s.endsWith('.webp')) return 'image';
//   if (s.endsWith('.pdf')) return 'pdf';
//   if (s.endsWith('.doc') || s.endsWith('.docx') || s.endsWith('.xls') || s.endsWith('.xlsx') || s.endsWith('.ppt') || s.endsWith('.pptx')) return 'document';
//   if (s.endsWith('.html') || s.startsWith('<')) return 'html';
//   return 'file';
// }
// function _extForType(type) {
//   switch (type) {
//     case 'video': return 'mp4';
//     case 'image': return 'jpg';
//     case 'pdf': return 'pdf';
//     case 'document': return 'docx';
//     default: return 'bin';
//   }
// }
// function _fileNameFromUrlOrFallback(url, index, type) {
//   try {
//     const clean = url.split('#')[0].split('?')[0];
//     const last = decodeURIComponent(clean.substring(clean.lastIndexOf('/') + 1));
//     if (last && last !== '' && last !== '/' && last !== clean) {
//       // ensure has extension
//       if (last.includes('.')) return last;
//       return `${last}.${_extForType(type)}`;
//     }
//   } catch {}
//   return `asset_${index}_${Date.now()}.${_extForType(type)}`;
// }

// async function getAssetFile(index, contentOrUrl, destinId, explicitType) {
//   try {
//     const isObj = contentOrUrl && typeof contentOrUrl === 'object';
//     const remoteUrl = isObj ? String(contentOrUrl.contentUrl || '') : String(contentOrUrl || '');

//     if (!remoteUrl) {
//       console.error('getAssetFile: missing URL');
//       $("#" + destinId).html(`<div style="color:#b00020">Missing URL</div>`);
//       return;
//     }

//     const type = _inferTypeFromContent(contentOrUrl, explicitType);
//     const sourceDir = normalizeDir(shared.systemConfiguration?.systemInfo?.localAppFolderDigiSign + "/content");
//     const fileName = _fileNameFromUrlOrFallback(remoteUrl, index, type);

//     // Progress UI (optional; safe if element not present)
//     const progressId = `ftProgess_${index}`;
//     $("#" + destinId).html(`
//       <div style="display:flex;justify-content:center;width:100%;padding:12px 0;">
//         <div>
//           <div class="uploadingSpinnerImageStyle" style="font-size:1em;padding:0;">LOADING... ${index}</div>
//           <progress id="${progressId}" value="0" max="100"></progress>
//         </div>
//       </div>
//     `);

//     const dl = await downloadAsset({
//       uri: encodeURI(remoteUrl),
//       targetDirectory: sourceDir,
//       fileName,
//       onProgress: (p) => {
//         const $p = $('#' + progressId);
//         if ($p.length) { $p.val(p); $p.html(`${p}%`); }
//       }
//     });

//     const toRender = (dl.method === 'remote') ? remoteUrl : Capacitor.convertFileSrc(dl.uri);

//     // Render by type
//     if (type === 'video') {
//       $("#" + destinId).html(`
//         <video id="video__${index}" controls autoplay loop style="width:100%;height:100%;position:absolute;">
//           <source src="${toRender}" type="video/mp4">
//         </video>
//       `);
//       return;
//     }

//     if (type === 'image') {
//       $("#" + destinId).html(`
//         <img src="${toRender}" style="object-fit:contain;max-height:100%;width:100%;" 
//              onerror="this.onerror=null;this.src='./img/noimage.jpg';" />
//       `);
//       return;
//     }

//     if (type === 'pdf') {
//       // Use your custom viewer; works with local or remote URL
//       viewPdfFile(toRender, destinId);
//       return;
//     }

//     if (type === 'document') {
//       // Office Web Viewer cannot open local file paths; use the REMOTE url for embed.
//       const encoded = encodeURIComponent(remoteUrl);
//       const viewerUrl = `https://view.officeapps.live.com/op/embed.aspx?src=${encoded}`;
//       $("#" + destinId).html(`<iframe src="${viewerUrl}" frameborder="0" width="100%" height="100%" allowfullscreen></iframe>`);
//       return;
//     }

//     if (type === 'html') {
//       $("#" + destinId).html(remoteUrl); // html string or URL – adjust if you only expect HTML strings
//       return;
//     }

//     // Fallback generic
//     $("#" + destinId).html(`
//       <div style="padding:8px;background:#f4f4f4;border-radius:6px;">
//         <p>✅ File saved.</p>
//         <a href="${toRender}" target="_blank" style="color:#0066cc;">Open</a>
//       </div>
//     `);
//   } catch (err) {
//     console.error('❌ Error in getAssetFile:', err);
//     $("#" + destinId).html(`<div style="color:#b00020">Failed to load asset</div>`);
//   }
// }

// --- Type helpers
function _mapTypeLabel(t = "") {
  const s = String(t).toLowerCase();
  if (s.includes("video")) return "video";
  if (s.includes("image")) return "image";
  if (s.includes("pdf")) return "pdf";
  if (s.includes("html")) return "html";
  if (s.includes("document") || s.includes("presentation") || s.includes("spreadsheet")) return "document";
  return "";
}

function _extFromType(type) {
  switch (type) {
    case "video": return "mp4";
    case "image": return "jpg";
    case "pdf":   return "pdf";
    case "document": return "docx";
    default: return "bin";
  }
}

function _inferTypeFromUrl(url = "") {
  const u = String(url).toLowerCase();
  if (/\.(mp4|webm|ogg)(\?|#|$)/.test(u)) return "video";
  if (/\.(jpeg|jpg|png|gif|webp|bmp|svg)(\?|#|$)/.test(u)) return "image";
  if (/\.(pdf)(\?|#|$)/.test(u)) return "pdf";
  if (/\.(doc|docx|ppt|pptx|xls|xlsx)(\?|#|$)/.test(u)) return "document";
  if (/\.(html|htm)(\?|#|$)/.test(u)) return "html";
  return "";
}

function _extractNameFromUrl(url = "") {
  try {
    const noQuery = String(url).split("?")[0];
    const last = noQuery.split("/").pop() || "";
    return decodeURIComponent(last);
  } catch { return ""; }
}

function _safeFileName({ url, providedName, type, index }) {
  let name = (providedName || _extractNameFromUrl(url) || "").trim();
  // strip any illegal fs chars, fallback if empty/undefined/no extension
  name = name.replace(/[\\/:*?"<>|]/g, "");
  const hasExt = /\.[a-z0-9]{2,5}$/i.test(name);

  if (!name || name.toLowerCase() === "undefined") {
    const ext = _extFromType(type || _inferTypeFromUrl(url));
    name = `asset_${index}_${Date.now()}.${ext}`;
  } else if (!hasExt) {
    const ext = _extFromType(type || _inferTypeFromUrl(url));
    name = `${name}.${ext}`;
  }
  return name;
}

function normalizeDir(dir) {
  return String(dir || "")
    .replace(/^\/+/, "")   // no leading slash
    .replace(/\/+$/, "");  // no trailing slash
}

function _toWebPath(nativeUri) {
  try { return Capacitor.convertFileSrc(nativeUri); } catch { return nativeUri; }
}

// Accepts either (index, contentObj, destinId) OR (index, url, destinId, type)
function _normalizeGetAssetArgs(index, contentOrUrl, destinId, explicitType) {
  if (contentOrUrl && typeof contentOrUrl === "object") {
    const url = contentOrUrl.contentUrl || contentOrUrl.url || "";
    const type = _mapTypeLabel(contentOrUrl.type || explicitType || "") || _inferTypeFromUrl(url);
    const name = contentOrUrl.name || "";
    return { url, type, name, destinId };
  }
  // string URL form
  const url = String(contentOrUrl || "");
  const type = _mapTypeLabel(explicitType || "") || _inferTypeFromUrl(url);
  return { url, type, name: "", destinId };
}

async function downloadAsset(uri, targetDirectory, fileName, opts = {}) {
  const tag = `DL#${Date.now()}`;
  const log  = (...a) => console.log(`[${tag}]`, ...a);
  const warn = (...a) => console.warn(`[${tag}]`, ...a);
  const errl = (...a) => console.error(`[${tag}]`, ...a);

  const onProgress = typeof opts.onProgress === "function" ? opts.onProgress : () => {};
  const base64Limit = opts.maxBase64Bytes ?? 20 * 1024 * 1024; // 20MB cap for base64 fallback

  if (!uri || typeof uri !== "string") {
    throw new Error("downloadAsset: invalid uri");
  }

  const dir = normalizeDir(targetDirectory || "content");
  const path = `${dir}/${fileName}`.replace(/\/+/g, "/");
  log("Starting download:", uri, "→", path);

  // Ensure dir exists (ignore "already exists")
  try {
    await Filesystem.mkdir({ path: dir, directory: Directory.Data, recursive: true });
  } catch (e) {
    if (!String(e?.message || e).toLowerCase().includes("exist")) {
      errl("mkdir failed:", e);
      throw e;
    }
  }

  // 0) Cached file?
  try {
    const stat = await Filesystem.stat({ path, directory: Directory.Data });
    const got = await Filesystem.getUri({ path, directory: Directory.Data });
    log("✅ File already exists:", got.uri);
    return {
      ok: true, existed: true, path, nativeUri: got.uri, webPath: _toWebPath(got.uri), method: "cached"
    };
  } catch { /* not found, continue */ }

  // 1) Prefer Filesystem.downloadFile (streaming)
  try {
    if (typeof Filesystem.downloadFile === "function") {
      log("Using Filesystem.downloadFile()");
      await Filesystem.downloadFile({ url: uri, path, directory: Directory.Data, recursive: true });
      const got = await Filesystem.getUri({ path, directory: Directory.Data });
      return { ok: true, existed: false, path, nativeUri: got.uri, webPath: _toWebPath(got.uri), method: "fs.downloadFile" };
    }
  } catch (e) { warn("Filesystem.downloadFile failed:", e); }

  // 2) CapacitorHttp.downloadFile (streaming)
  try {
    const Http = (Capacitor?.Plugins?.CapacitorHttp) || window.Http || null;
    if (Http && typeof Http.downloadFile === "function") {
      log("Using CapacitorHttp.downloadFile()");
      const res = await Http.downloadFile({ url: uri, filePath: path, fileDirectory: Directory.Data, progress: true });
      // attach progress if available
      if (res?.progress && typeof res.progress.on === "function") {
        res.progress.on("downloadProgress", (pe) => {
          if (pe?.total) {
            const pct = Math.max(0, Math.min(100, Math.round((pe.loaded * 100) / pe.total)));
            onProgress(pct);
          }
        });
      }
      const got = await Filesystem.getUri({ path, directory: Directory.Data });
      return { ok: true, existed: false, path, nativeUri: got.uri, webPath: _toWebPath(got.uri), method: "http.downloadFile" };
    }
  } catch (e) { warn("CapacitorHttp.downloadFile failed:", e); }

  // 3) XHR → base64 (guarded)
  try {
    log("Falling back to XHR→base64 (guarded).");
    const base64Data = await new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("GET", uri, true);
      xhr.responseType = "blob";
      xhr.timeout = 120000;

      xhr.onprogress = (ev) => {
        if (ev.lengthComputable) {
          const pct = Math.max(0, Math.min(100, Math.round((ev.loaded * 100) / ev.total)));
          onProgress(pct);
        }
      };
      xhr.onload = () => {
        if (xhr.status < 200 || xhr.status >= 300) {
          return reject(new Error(`HTTP ${xhr.status}`));
        }
        const blob = xhr.response;
        const size = blob?.size ?? 0;
        if (!blob || size === 0) return reject(new Error("Empty response blob"));
        if (size > base64Limit) return reject(new Error(`File too large for base64: ${size} bytes`));

        const fr = new FileReader();
        fr.onerror = (e) => reject(e?.error || new Error("FileReader error"));
        fr.onloadend = () => {
          const s = String(fr.result || "");
          const i = s.indexOf(",");
          if (i < 0) return reject(new Error("Invalid DataURL"));
          resolve(s.slice(i + 1));
        };
        fr.readAsDataURL(blob);
      };
      xhr.onerror = () => reject(new Error("Network error"));
      xhr.ontimeout = () => reject(new Error("Request timeout"));
      xhr.send();
    });

    await Filesystem.writeFile({ path, data: base64Data, directory: Directory.Data, recursive: true });
    const got = await Filesystem.getUri({ path, directory: Directory.Data });
    return { ok: true, existed: false, path, nativeUri: got.uri, webPath: _toWebPath(got.uri), method: "xhr+base64" };
  } catch (e) { warn("XHR→base64 failed:", e); }

  // 4) Final fallback: remote URI (so UI doesn’t break)
  warn("All downloads failed. Returning remote URI.");
  return { ok: false, existed: false, path, nativeUri: uri, webPath: uri, method: "remote" };
}

// Works with EITHER:
//   getAssetFile(index, contentObj, destinId)
// OR
//   getAssetFile(index, contentUrl, destinId, "pdf"|"video"|"image"|"document"|"html")
async function getAssetFile(index, contentOrUrl, destinId, explicitType) {
  try {
    const { url, type, name } = _normalizeGetAssetArgs(index, contentOrUrl, destinId, explicitType);

    if (!url) {
      console.error("getAssetFile: missing URL.");
      $("#" + destinId).html(`<div style="color:#b00020">Invalid content URL</div>`);
      return;
    }

    const sourceDir = normalizeDir(
      (shared?.systemConfiguration?.systemInfo?.localAppFolderDigiSign || "DigiSign") + "/content"
    );

    const fileName = _safeFileName({ url, providedName: name, type, index });

    // Optional basic loader (progress)
    $("#" + destinId).html(`
      <div style="display:flex;justify-content:center;align-items:center;height:100%;">
        <div>
          <div class="uploadingSpinnerImageStyle" style="font-size:1em;padding:0;">LOADING…</div>
          <progress id="ftProgess_${index}" value="0" max="100" style="width:260px;"></progress>
        </div>
      </div>
    `);

    const result = await downloadAsset(url, sourceDir, fileName, {
      type,
      onProgress: (pct) => {
        const $p = $("#ftProgess_" + index);
        if ($p.length) { $p.val(pct).html(pct + "%"); }
      }
    });

    const webPath = result.webPath; // native path converted (or remote if fallback)
    let html = "";

    if (type === "video") {
      html = `
        <video id="video__${index}" controls autoplay loop style="width:100%;height:100%;position:absolute;">
          <source src="${webPath}" type="video/mp4">
        </video>`;

    } else if (type === "image") {
      html = `
        <img src="${webPath}" style="object-fit:contain;max-height:100%;width:100%;"
             onerror="this.onerror=null;this.src='./img/noimage.jpg';" />`;

    } else if (type === "pdf") {
      // Use your custom PDF viewer
      viewPdfFile(webPath, destinId);
      return;

    } else if (type === "document") {
      // Office viewer CANNOT read local file paths; keep using remote URL
      const encodedUrl = encodeURIComponent(url);
      const viewerUrl = `https://view.officeapps.live.com/op/embed.aspx?src=${encodedUrl}`;
      html = `<iframe src="${viewerUrl}" frameborder="0" width="100%" height="100%" allowfullscreen></iframe>`;

    } else if (type === "html") {
      html = url; // if this is literal HTML string; if it's a URL, you probably want an <iframe>

    } else {
      // Fallback generic
      html = `
        <div style="padding:8px;background:#f4f4f4;border-radius:6px;">
          <p>✅ File saved.</p>
          <a href="${webPath}" target="_blank" style="color:#0066cc;">Open</a>
        </div>`;
    }

    $("#" + destinId).html(html);

  } catch (err) {
    console.error("❌ Error in getAssetFile:", err);
    $("#" + destinId).html(`<div style="color:#b00020">Failed to load asset.</div>`);
  }
}



function viewSsItems() {
	
	let htmlContent = '';
    var parentElem = document.getElementById('signagePage');
    if(ssItemJsonData.items.length > 0) {
	    getItems(0);
    }
	
	function getItems(index) { 
	//for(index in jsonData.data) {
		let item = ssItemJsonData.items[index];
        let itemName = item.name.split('/').pop(0);
        var localPath = shared.ROOT_STORAGE_PATH + shared.systemConfiguration.systemInfo.localAppFolderDigiSign + "/content/";
        var localFileNameWithPath = localPath + itemName;
        let name = itemName.toLowerCase()

        if(name.endsWith('.jpeg') || name.endsWith('.jpg') || name.endsWith('.png')) {
            htmlContent += '<div class="digiveuItemArea" id="digiveuitemArea_'+index+'" data-type="image" data-duration="'+item.duration+'" >';
            htmlContent += '<img class="digiveuItem digiveuImage" id="digiveu_image_'+index+'" src="'+localFileNameWithPath+'" style="object-fit: contain; max-height: 100%; width: 100%;" onerror="this.onerror=null;this.src=\'./img/noimage.jpg\';">';
            htmlContent += '</div>';
		} else if(name.endsWith('.mp4') || name.endsWith('.webm') || name.endsWith('.ogg')) {
            let ext = name.split('.').pop(0);
			htmlContent += '<div class="digiveuItemArea" id="digiveuitemArea_'+index+'" data-type="video" data-duration="'+item.duration+'" >';
			htmlContent += '<video class="digiveuItem digiveuVideo" id="digiveu_video_'+index+'" muted="muted" controlsList="nodownload nofullscreen noremoteplayback" style="object-fit: contain; max-height: 100%; width: 100%;" ><source src="'+localFileNameWithPath+'" type="video/'+ext+'"></video>';
			htmlContent += '</div>';
		} else if(itemName.toLowerCase().endsWith('.pptx') || itemName.toLowerCase().endsWith('.ppt')) {
            let url = 'https://bviucp.s3.ap-south-1.amazonaws.com/bviu_resource/bviu_contents/' + ssItemJsonData.folder.replace(shared.systemConfiguration.systemInfo.privateCdnURL, '')+'/'+item.name;
            htmlContent += '<div class="digiveuItemArea" id="digiveuitemArea_'+index+'" data-type="ppt" data-duration="'+item.duration+'" >';
			htmlContent += '<div class="digiveuItem digiveuPpt" id="digiveu_ppt_'+index+'" data-src="'+url+'" ></div>';
			htmlContent += '</div>';
        }
		
		if(index == ssItemJsonData.items.length -1) {
			$(parentElem).html(htmlContent);
            viewDigiveuItem(0);
		} else {
            getItems(index+1);
        }
	}
}

function viewDigiveuItem(itmIndex) {
	let index = itmIndex;
    let itemElems = document.getElementsByClassName('digiveuItemArea');
	if(itmIndex >= itemElems.length) {
		index = 0;
	}
	
    let itemElem = document.getElementById('digiveuitemArea_'+index);

	if(itemElem.dataset.type.includes('image')) {
        let duration = parseInt(itemElem.dataset.duration);
        if(duration == 0) {duration = 10;}
        duration = duration * 1000;

        clearTimeout(ssDigiveuTimer);
		ssDigiveuTimer = setTimeout(function() {
            viewDigiveuItem(index+1);
        }, duration);
	
	} else if(itemElem.dataset.type.includes('video')) {
		let videoElem = document.getElementById('digiveu_video_'+index);
		videoElem.play()
		videoElem.onended = function(){
			viewDigiveuItem(index+1);
		}
        videoElem.onerror = function() {
		    viewDigiveuItem(index+1);
		};
	} else if(itemElem.dataset.type.includes('ppt')) {
        
		let pptElem = document.getElementById('digiveu_ppt_'+index);
        let filePath = pptElem.dataset.src;
        let htmlContent = '<iframe src="https://view.officeapps.live.com/op/view.aspx?src='+filePath+'&wdSlideId=0" width="100%" height="600px" frameborder="0"></iframe>';
        $(pptElem).html(htmlContent);

        let duration = parseInt(itemElem.dataset.duration);
        if(duration == 0) {duration = 60;}
        duration = duration * 1000;

        clearTimeout(ssDigiveuTimer);
		ssDigiveuTimer = setTimeout(function() {
            viewDigiveuItem(index+1);
        }, duration);

        /*var viewer = new ViewerJS.DocumentViewer();
        viewer.loadDocument(filePath);
        viewer.attachTo('#digiveu_video_'+index);

        var totalSlides = viewer.getNumPages();
        var currentPage = 1;

        let duration = parseInt(itemElem.dataset.duration);
        if(duration == 0) {duration = 10;}
        duration = duration * 1000;

        setInterval(function() {
            if(currentPage == totalSlides) {
                viewDigiveuItem(index+1);
            } else {
                currentPage = currentPage + 1;
                viewer.setPage(currentPage);
            }
            //currentPage = (currentPage % totalSlides) + 1;
            //viewer.setPage(currentPage);
        }, duration); // Change slide every 5 seconds (adjust the interval as needed)*/


    }
	
	//$('.digiveuItem').removeClass('digiveuItemVisible');
	//$('#digiveuitem_'+cuttentItemIndex).removeClass('digiveuItemVisible');
	//$('#digiveuitem_'+index).addClass('digiveuItemVisible');
	$('.digiveuItemArea').css('opacity', 0);
	$('#digiveuitemArea_'+index).css('opacity', 1);
	cuttentSsItemIndex = index;

}


async function getVideoFile(index, contentUrl, destinId) {
    try {
        const uri = encodeURI(contentUrl);
        const sourceDir = shared.systemConfiguration.systemInfo.localAppFolderDigiSign + "/content";
        const fileName = uri.split("?")[0].split("/").pop();

        // Target directory path inside app storage
        const targetDirectory = `${sourceDir}`;

        console.log("Checking directory:", targetDirectory);

        // Step 1: Try to read the directory
        try {
            await Filesystem.readdir({
                path: targetDirectory,
                directory: Directory.Data
            });
            console.log("Directory exists:", targetDirectory);
        } catch (err) {
            // Step 2: Directory doesn't exist, create it
            console.log("Directory missing. Creating:", targetDirectory);
            await Filesystem.mkdir({
                path: targetDirectory,
                directory: Directory.Data,
                recursive: true
            });
            console.log("Directory created successfully:", targetDirectory);
        }

        // Step 3: Call your download function
        downloadVideo(index, uri, targetDirectory, fileName, destinId);

    } catch (err) {
        console.error("❌ Error in getVideoFile:", err);
    }
}


// Helpers: safe logging with a per-download tag


const DL_DEFAULT_MAX_BASE64_BYTES = 100 * 1024 * 1024; // 100 MB safety cap for base64 fallback

function _normalizeDir(dir) {
  const d = String(dir || '').replace(/^\/+/, '').replace(/\/+$/, '');
  return d || 'videos';
}

function _formatBytes(bytes) {
  if (!bytes && bytes !== 0) return 'n/a';
  const units = ['B','KB','MB','GB','TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${units[i]}`;
}

function _renderLoader(destinId, index) {
  const htmlContent = `
    <div style="display:flex;justify-content:center;width:100%;font-size:2em;">
      <div style="width:fit-content;">
        <div class="uploadingSpinnerImageStyle" style="font-size:1em;padding:0px;">LOADING...</div>
        <progress id="ftProgess_${index}" value="0" max="100"></progress>
      </div>
    </div>`;
  $("#" + destinId).html(htmlContent);
}

function _renderError(destinId, index, message) {
  const html = `
    <div style="padding:8px;color:#b00020;background:#ffeaea;border-radius:8px;">
      <div style="font-weight:600;">Download failed</div>
      <div style="font-size:12px;opacity:.8">${message}</div>
      <button id="retry_${index}" style="margin-top:6px;">Retry</button>
    </div>`;
  $("#" + destinId).html(html);
}

function _attachVideo(destinId, index, nativeUri) {
  const webViewPath = Capacitor.convertFileSrc(nativeUri);
  const videoHtml = `
    <video id="video__${index}" controls autoplay loop style="width:100%;height:100%;position:absolute;">
      <source src="${webViewPath}" type="video/mp4">
    </video>`;
  $("#" + destinId).html(videoHtml);
}

async function downloadVideo(
  index,
  uri,
  targetDirectory,
  fileName,
  destinId,
  options = {} // { onSuccess?: (info) => void, onError?: (err) => void, maxBase64Bytes?: number }
) {
  const tag = `DL#${index}-${Date.now()}`;
  const log = (...a) => console.log(`[${tag}]`, ...a);
  const warn = (...a) => console.warn(`[${tag}]`, ...a);
  const errLog = (...a) => console.error(`[${tag}]`, ...a);

  const onSuccess = options.onSuccess || (() => {});
  const onError = options.onError || (() => {});
  const base64Limit = options.maxBase64Bytes ?? DL_DEFAULT_MAX_BASE64_BYTES;

  try {
    // --- Validate inputs
    if (!uri || typeof uri !== 'string') throw new Error('Invalid "uri"');
    if (!fileName || typeof fileName !== 'string') throw new Error('Invalid "fileName"');
    const dir = _normalizeDir(targetDirectory);
    const fullPath = `${dir}/${fileName}`.replace(/\/+/g, '/');
    log('Start', { uri, dir, fileName, fullPath });

    // --- Show loader up front
    _renderLoader(destinId, index);

    // --- Step 0: already downloaded?
    try {
      const stat = await Filesystem.stat({ path: fullPath, directory: Directory.Data });
      log('File exists:', stat);
      const { uri: existingUri } = await Filesystem.getUri({ path: fullPath, directory: Directory.Data });
      log('Resolved existing URI:', existingUri);
      _attachVideo(destinId, index, existingUri);
      const out = { ok: true, existed: true, path: fullPath, uri: existingUri };
      onSuccess(out);
      return out;
    } catch (e) {
      log('stat: not found (expected if first time).', e?.message || e);
    }

    // --- Ensure directory
    try {
      await Filesystem.mkdir({ path: dir, directory: Directory.Data, recursive: true });
      log('Created directory:', dir);
    } catch (mkdirErr) {
      const msg = String(mkdirErr?.message || mkdirErr);
      if (/exist/i.test(msg)) {
        log('Directory already exists:', dir);
      } else {
        throw mkdirErr;
      }
    }

    // --- Prefer native streaming if available (avoids base64 OOM)
    const hasFSDownload =
      typeof Filesystem.downloadFile === 'function'; // available on newer @capacitor/filesystem
    const hasHttpDownload =
      Capacitor?.Plugins?.CapacitorHttp && typeof Capacitor.Plugins.CapacitorHttp.downloadFile === 'function';

    if (hasFSDownload) {
      log('Using Filesystem.downloadFile (streaming).');
      // Some versions support progress via listener; if not, we still get a reliable save.
      await Filesystem.downloadFile({
        url: uri,
        path: fullPath,
        directory: Directory.Data,
        recursive: true,
        // headers: { ... } // add if needed
      });
      const { uri: nativeUri } = await Filesystem.getUri({ path: fullPath, directory: Directory.Data });
      _attachVideo(destinId, index, nativeUri);
      const out = { ok: true, existed: false, path: fullPath, uri: nativeUri, method: 'fs.downloadFile' };
      onSuccess(out);
      return out;
    }

    if (hasHttpDownload) {
      log('Using CapacitorHttp.downloadFile (streaming).');
      const res = await Capacitor.Plugins.CapacitorHttp.downloadFile({
        url: uri,
        filePath: fullPath,
        fileDirectory: Directory.Data,
        // headers: { ... }
      });
      if (res?.path == null) throw new Error('downloadFile returned no path');
      const { uri: nativeUri } = await Filesystem.getUri({ path: fullPath, directory: Directory.Data });
      _attachVideo(destinId, index, nativeUri);
      const out = { ok: true, existed: false, path: fullPath, uri: nativeUri, method: 'http.downloadFile' };
      onSuccess(out);
      return out;
    }

    // --- Fallback: XHR -> Blob -> Base64 (guarded!)
    log('Falling back to XHR->base64 (watching memory).');

    const base64Data = await new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('GET', uri, true);
      xhr.responseType = 'blob';
      xhr.timeout = 120000; // 120s

      xhr.onprogress = (event) => {
        if (event.lengthComputable) {
          const progress = Math.max(0, Math.min(100, Math.round((event.loaded * 100) / event.total)));
          const $p = $('#ftProgess_' + index);
          if ($p.length) {
            $p.val(progress);
            $p.html(progress + '%');
          }
        }
      };

      xhr.onload = () => {
        try {
          if (xhr.status < 200 || xhr.status >= 300) {
            return reject(new Error(`HTTP ${xhr.status} ${xhr.statusText || ''}`.trim()));
          }
          const blob = xhr.response;
          const size = blob?.size ?? 0;
          log(`HTTP ${xhr.status}; blob size: ${_formatBytes(size)}`);
          if (!blob || size === 0) return reject(new Error('Empty response blob'));
          if (size > base64Limit) {
            return reject(new Error(
              `File too large for base64 path: ${_formatBytes(size)} > ${_formatBytes(base64Limit)}`
            ));
          }

          const reader = new FileReader();
          reader.onerror = (ev) => reject(ev?.error || new Error('FileReader error'));
          reader.onloadend = () => {
            const result = String(reader.result || '');
            const comma = result.indexOf(',');
            if (comma < 0) return reject(new Error('Invalid DataURL'));
            const b64 = result.slice(comma + 1);
            log('Base64 conversion done (length):', b64.length);
            resolve(b64);
          };
          reader.readAsDataURL(blob);
        } catch (ex) {
          reject(ex);
        }
      };

      xhr.onerror = () => reject(new Error('Network error'));
      xhr.ontimeout = () => reject(new Error('Request timeout'));
      xhr.onabort = () => reject(new Error('Request aborted'));
      xhr.send();
    });

    // --- Write the file (base64)
    await Filesystem.writeFile({
      path: fullPath,
      data: base64Data,
      directory: Directory.Data,
      recursive: true
    });
    log('File written:', fullPath);

    const { uri: nativeUri } = await Filesystem.getUri({ path: fullPath, directory: Directory.Data });
    log('Resolved native URI:', nativeUri);
    _attachVideo(destinId, index, nativeUri);

    const out = { ok: true, existed: false, path: fullPath, uri: nativeUri, method: 'xhr+base64' };
    onSuccess(out);
    return out;

  } catch (err) {
    const msg = err?.message || String(err);
    errLog('Failed:', msg, err);
    _renderError(destinId, index, msg);
    onError(err);
    return { ok: false, reason: msg, error: err };
  }
}



async function getDownloadFolder() {
    try {
        const sourceDir = shared.systemConfiguration.systemInfo.localAppFolderDigiSign + "/temp_content";
        const targetDirectory = sourceDir; // inside app storage

        console.log("Checking directory:", targetDirectory);

        try {
            // Step 1: Check if directory exists
            await Filesystem.readdir({
                path: targetDirectory,
                directory: Directory.Data
            });
            console.log("Directory exists:", targetDirectory);

            // Call your function
            downloadObjects(targetDirectory);

        } catch (err) {
            // Step 2: Directory doesn't exist, create it
            console.log("Directory missing. Creating:", targetDirectory);

            await Filesystem.mkdir({
                path: targetDirectory,
                directory: Directory.Data,
                recursive: true
            });

            console.log("Directory created successfully:", targetDirectory);

            // Call your function
            downloadObjects(targetDirectory);
        }

    } catch (err) {
        console.error("❌ Error in getDownloadFolder:", err);
    }
}


async function downloadObjects(folder) {
    try {
        const parentElem = document.getElementById("signagePage");

        let ShowLoading = false;
        let htmlData = $(parentElem).html();
        if (htmlData.length === 0) {
            ShowLoading = true;
        }

        if (tempSsItemJsonData.items.length > 0) {
            await getObject(0);
        }

        async function getObject(index) {
            let item = tempSsItemJsonData.items[index];
            let name = item.name.toLowerCase();

            // Supported types
            if (
                name.endsWith(".jpeg") ||
                name.endsWith(".jpg") ||
                name.endsWith(".png") ||
                name.endsWith(".mp4") ||
                name.endsWith(".webm") ||
                name.endsWith(".ogg")
            ) {
                let itemName = item.name.split("/").pop();
                let objectKey = (tempSsItemJsonData.folder + "/" + itemName).replace(
                    s3PrivateUrl,
                    ""
                );
                let duration = item.duration;
                if (
                    item.duration === 0 ||
                    name.endsWith(".mp4") ||
                    name.endsWith(".webm") ||
                    name.endsWith(".ogg")
                ) {
                    duration = 900;
                }

                // Step 1: Get signed URL
                getSignedUrl(objectKey, duration).then(async (url) => {
                    if (url.startsWith("https://")) {
                        let uri = encodeURI(url);
                        let localFileNameWithPath = `${folder}/${itemName}`;

                        if (ShowLoading === true) {
                            let htmlContent = `
                                <div style="display: flex; justify-content: center; width: 100%; font-size: 1em; padding-top:50%;">
                                    <div style="width:50%;">
                                        <div class="uploadingSpinnerImageStyle" style="font-size: 1em; padding: 0px;">
                                            LOADING... ${index}
                                        </div>
                                        <progress id="ftProgess_${index}" value="0" max="100"></progress>
                                    </div>
                                </div>`;
                            $(parentElem).html(htmlContent);
                        }

                        try {
                            // Step 2: Download file with progress
                            const response = await Http.downloadFile({
                                url: uri,
                                filePath: localFileNameWithPath,
                                directory: Directory.Data,
                                progress: true,
                            });

                            if (response.progress) {
                                response.progress.on(
                                    "downloadProgress",
                                    (progressEvent) => {
                                        if (progressEvent.total) {
                                            let progress = (
                                                (progressEvent.loaded * 100) /
                                                progressEvent.total
                                            ).toFixed(0);
                                            $(`#ftProgess_${index}`).val(progress);
                                            $(`#ftProgess_${index}`).html(progress + "%");
                                        }
                                    }
                                );
                            }

                            console.log("✅ File downloaded:", localFileNameWithPath);

                            // Step 3: Verify file exists
                            await Filesystem.stat({
                                path: localFileNameWithPath,
                                directory: Directory.Data,
                            });

                            // Next item
                            if (index === tempSsItemJsonData.items.length - 1) {
                                finishDownload();
                            } else {
                                getObject(index + 1);
                            }
                        } catch (err) {
                            console.error("❌ Download error:", err);
                            if (index === tempSsItemJsonData.items.length - 1) {
                                finishDownload();
                            } else {
                                getObject(index + 1);
                            }
                        }
                    }
                });
            } else {
                // Skip unsupported file
                if (index === tempSsItemJsonData.items.length - 1) {
                    finishDownload();
                } else {
                    getObject(index + 1);
                }
            }
        }
    } catch (err) {
        console.error("❌ Error in downloadObjects:", err);
    }
}


async function finishDownload() {
    try {
        const sourceDir = shared.systemConfiguration.systemInfo.localAppFolderDigiSign + "/temp_content";
        const newDirectory = shared.systemConfiguration.systemInfo.localAppFolderDigiSign + "/content";

        console.log("✅ Finished downloading!");

        // Before moving, stop existing slider
        currentTemplate = null;
        closeAllVideos();

        try {
            // Step 1: Remove destination folder if it already exists
            await Filesystem.rmdir({
                path: newDirectory,
                directory: Directory.Data,
                recursive: true,
            });
            console.log("Old destination directory removed:", newDirectory);
        } catch (err) {
            console.log("Destination folder did not exist, continuing...");
        }

        try {
            // Step 2: Rename (move) sourceDir → newDirectory
            await Filesystem.rename({
                from: sourceDir,
                to: newDirectory,
                directory: Directory.Data,
            });

            console.log("Folder moved successfully:", newDirectory);

            // Step 3: Update data and render UI
            ssItemJsonData = tempSsItemJsonData;
            viewSsItems();
        } catch (err) {
            console.error("❌ Error renaming folder:", err);
        }
    } catch (err) {
        console.error("❌ Error in finishDownload:", err);
    }
}

function setBackgroundImage(contentUrl, destin) {
	//var contentUrl = $("#"+source).val();
	if(contentUrl.startsWith(s3PrivateUrl)){
		var objectKey = contentUrl.replace(s3PrivateUrl, '');
		getSignedUrl(objectKey, 10).then(url => {
            $("#"+destin).css({'background-image':'url('+url+')', 'background-repeat':'no-repeat', 'background-size':'100% 100%'});
		});
	} else {
		$("#"+destin).css({'background-image':'url('+contentUrl+')', 'background-repeat':'no-repeat', 'background-size':'100% 100%'});
	}
}

function setBackgroundStyle(template, destin) {
	if((template.pageStyle != undefined) && (template.pageStyle.length > 0)) {
		$("#"+destin).attr('style', template.pageStyle);
	}

    if((template.backgroundImage != undefined) && (template.backgroundImage.length > 0)) {
		if(template.backgroundImage.startsWith('https://')) {
			setBackgroundImage(template.backgroundImage, destin);
		} 
	}
}

function closeAllVideos() {

    var videoElemtnts = document.getElementsByTagName("video");
    for(var video of videoElemtnts) {
        video.pause(0);
        video.setAttribute("src", "");
    }
}

function onYouTubeIframeAPIReady() {
    ytplayer = new YT.Player(youtubePlayerId, {
        height: '100%',
        width: '100%',
        videoId: youtubeVideoId,
        playerVars: {
          'playsinline': 1,
          'controls': 0,           
          'showinfo': 0,
          'rel': 0,
          'loop': 1
        },
        events: {
            'onReady': onPlayerReady,
            'onStateChange': onPlayerStateChange
        }
    });
}

// 4. The API will call this function when the video player is ready.
function onPlayerReady(event) {
    event.target.playVideo();
}

// 5. The API calls this function when the player's state changes.
//    The function indicates that when playing a video (state=1),
//    the player should play for six seconds and then stop.
// var done = false;
function onPlayerStateChange(event) {
    if (event.data === YT.PlayerState.ENDED) {
        event.target.playVideo(); 
    }
    if (event.data == YT.PlayerState.PLAYING && event.data != YT.PlayerState.PAUSED) {
    // setTimeout(stopVideo, 6000);
    // done = true;
    }
}

async function getEachElem(boxJson) {
	if(boxJson.type != undefined) {						// New template builder coded
		if(boxJson.type == "textbox") {
			return getTextElem(boxJson);
		} else if(boxJson.type == "contentbox") {
			return getContentElem(boxJson);
		} else if(boxJson.type == "imagebox") {
			return getImageElem(boxJson);
		} else if(boxJson.type == "gridbox") {
			return getGridElem(boxJson);
		}
	} else if(boxJson.sectionStyles != undefined) {		// Old style template - manually coded
		var elem = document.createElement("div");
		elem.style = boxJson.sectionStyles[0].css;
		return elem;
	}
}

function getTextElem(boxJson) {
	var elem = document.createElement("div");
	if(boxJson.values != undefined) {
		elem.id = boxJson.values.id;
		elem.style.width = boxJson.values.width;
		elem.style.height = boxJson.values.height;
		elem.style.top = boxJson.values.top;
		elem.style.left = boxJson.values.left;
		elem.style.fontFamily = boxJson.values.fontFamily.replaceAll('"', '');
		elem.style.color = boxJson.values.color;
		elem.style.fontSize = boxJson.values.fontSize;
		elem.style.fontWeight = boxJson.values.fontWeight;
		elem.style.lineHeight = boxJson.values.lineHeight;
		elem.style.padding = boxJson.values.padding;
		elem.style.textAlign = boxJson.values.textAlign;
		elem.style.backgroundColor = boxJson.values.backgroundColor; 
		elem.style.border = boxJson.values.border;
		elem.style.borderRadius = boxJson.values.borderRadius;
        elem.style.display = 'flex';
		elem.style.alignItems = 'center';
        elem.style.justifyContent = boxJson.values.textAlign;
		elem.innerHTML = boxJson.values.text;
	}

	elem.classList.add("templatetextbox");
	
	return elem;
}

function getContentElem(boxJson) {
	var elem = document.createElement("div");
	if(boxJson.values != undefined) {
		elem.id = boxJson.values.id;
		elem.style.width = boxJson.values.width;
		elem.style.height = boxJson.values.height;
		elem.style.top = boxJson.values.top;
		elem.style.left = boxJson.values.left;
		elem.style.padding = boxJson.values.padding;
		elem.style.backgroundColor = boxJson.values.backgroundColor; 
		elem.style.border = boxJson.values.border;
		elem.style.borderRadius = boxJson.values.borderRadius;
        elem.style.display = 'flex';
		elem.style.alignItems = 'center';
        elem.style.justifyContent = boxJson.values.textAlign;
		elem.innerHTML = boxJson.values.text;
	}
	elem.classList.add("templatecontentbox");
	
	return elem;
}

function getImageElem(boxJson) {
	var elem = document.createElement("div");
	if(boxJson.values != undefined) {
		elem.id = boxJson.values.id;
		elem.style.width = boxJson.values.width;
		elem.style.height = boxJson.values.height;
		elem.style.top = boxJson.values.top;
		elem.style.left = boxJson.values.left;					
		elem.style.padding = boxJson.values.padding;
		elem.style.backgroundColor = boxJson.values.backgroundColor;
		elem.style.border = boxJson.values.border;
		elem.style.borderRadius = boxJson.values.borderRadius;
        elem.style.display = 'flex';
		elem.style.alignItems = 'center';
        elem.style.justifyContent = boxJson.values.textAlign;
		
		var imageElem = document.createElement("img");
        imageElem.id = "img_"+boxJson.values.id;
		imageElem.style.objectFit = boxJson.values.objectFit;
		imageElem.style.borderRadius = boxJson.values.imageBorderRadius;
		imageElem.style.width = "100%";
		imageElem.style.height = "100%";
		elem.appendChild(imageElem);

        if(boxJson.values.image.startsWith(s3PrivateUrl)) {
            // var objectKey = boxJson.values.image.replace(s3PrivateUrl, ''); 

            populateTempCopiedImage(imageElem, boxJson.values.image)
            //populateImage("img_"+boxJson.values.id, boxJson.values.image);
            // let retryCount = 0;
            // function obtainSignedUrl(objectKey) {
            //     getSignedUrl(objectKey, 10).then(url => {
            //         if(url.startsWith('http')) {
            //             imageElem.src = url;
            //         } else {
            //             retryCount++;
            //             console.log("Getting Signed URL. Retry-"+retryCount);
            //             if(retryCount <= 5) {
            //                 obtainSignedUrl(objectKey);
            //             }
            //         }
            //     });
            // }
            // obtainSignedUrl(objectKey);
		} else {
			imageElem.src = boxJson.values.image;
		}

	}
	elem.classList.add("templateimagebox");
	
	return elem;
}

async function getGridElem(boxJson) {
	var elem = document.createElement("div");
	elem.id = boxJson.values.id;
	elem.style.width = boxJson.values.width;
	elem.style.height = boxJson.values.height;
	elem.style.top = boxJson.values.top;
	elem.style.left = boxJson.values.left;
	var rows = boxJson.values.cols;
	var cols = boxJson.values.cols;
	elem.dataset.cols = cols;
	elem.dataset.rows = rows;
	elem.dataset.synctype = boxJson.values.synctype;
	elem.style.backgroundColor = boxJson.values.backgroundColor; 
	elem.style.border = boxJson.values.border;
	elem.style.borderRadius = boxJson.values.borderRadius;
	elem.style.display = "grid";

	var colTemplateString = "";
	var colWidth = parseFloat(100/cols).toFixed(2);
	for(count=0; count<cols; count++) {
		colTemplateString += colWidth+"%";
	}
	elem.style.gridTemplateColumns = colTemplateString;
	var rowTemplateString = "";
	var rowWidth = parseFloat(100/rows).toFixed(2);
	for(count=0; count<rows; count++) {
		rowTemplateString +=rowWidth+"%";
	}
	elem.style.gridTemplateRows = rowTemplateString;
	
	$(elem).resizable('destroy');
	$(elem).html("");
	$(elem).resizable({ containment: "parent" });
	
	$.each(boxJson.values.divs, function(divIndex, div) {
		var divElem = document.createElement("div");
		divElem.style.border = "1px solid rgba(0, 0, 0, 0.1)";
		divElem.style.position = "relative";
		divElem.id = div.id;
		
		$.each(div.elems, function(childIndex, child) {
			var splitArray = child.values.id.split('_');
			var gridIdCount = splitArray[1];
			var elemIdCount = splitArray[5];
			var groupClassName = "";

			var childElem = null;
			if(child.type == 'textbox') {
				childElem = getTextElem(child);
				childElem.classList.add("templatetextbox");
				childElem.classList.add('templategrid'+gridIdCount+'textbox');
				childElem.classList.add('templategrid'+gridIdCount+'divtextbox'+elemIdCount);
				groupClassName = "templategrid"+gridIdCount+"divtextbox";
			} else if(child.type == 'imagebox') {
				childElem = getImageElem(child);
				childElem.classList.add("templateimagebox");
				childElem.classList.add('templategrid'+gridIdCount+'imagebox');
				childElem.classList.add('templategrid'+gridIdCount+'divimagebox'+elemIdCount);
				groupClassName = "templategrid"+gridIdCount+"divimagebox";
			}
			childElem.style.position = "absolute";
			childElem.style.cursor = "move";
			divElem.appendChild(childElem);
			
			childElem.ondrag = function() {
				dragResizeGridBox(groupClassName, this, "drag");
			}
			childElem.onresize = function() {
				dragResizeGridBox(groupClassName, this, "resize");
			}
								
			childElem.onclick = function(e) {
				var id = this.id;
				e.stopPropagation();	// This is to avoid the backgound also getting cicked (propagating to parent)
				viewBoxData(childElem.id);
			};
			$(childElem).resizable({ containment: "parent" });
			$(childElem).draggable({ containment: "parent" });
		});
		
		elem.appendChild(divElem);
	});
		
	elem.classList.add("templategridbox");
	return elem;
}

function handleVideoControls() {
    if (mouseTimer) {
        window.clearTimeout(mouseTimer);
    }

    if (!cursorVisible) {
        document.body.style.cursor = "default";
        cursorVisible = true;
		$(".videoControlButton").css("display", "flex");
    }

    mouseTimer = window.setTimeout(function() {
        mouseTimer = null;
        document.body.style.cursor = "none";
        cursorVisible = false;
		$(".videoControlButton").css("display", "none");
    }, 3000);
}


function fullscreenBtnHandle() {
	var elem = document.getElementById("signageworkarea");
	if (document.fullscreenElement) {
		document.exitFullscreen();
	} else {
		if (elem.requestFullscreen) {
			elem.requestFullscreen();
		}
	}

}

function muteVolume() {
	var players = document.getElementsByTagName('video');
    if(document.getElementById('muteButton').classList.contains('muted')) {
        $("#muteButton").html('<i class="fas fa-volume-off"></i>');
        $("#muteButton").removeClass('muted');
        for(var player of players) {
            player.volume = 1;
        }
        if(ytplayer != null) { 
            ytplayer.unMute();
        }
        
    } else {
        $("#muteButton").html('<i class="fas fa-volume-mute"></i>');
        $("#muteButton").addClass('muted');
        for(var player of players) {
            player.volume = 0;
        }
        if(ytplayer != null) {
            ytplayer.mute();
        }
    }
    /*for(var player of players) {
        if(player.volume == 0) {
            player.volume = 1;
            $("#muteButton").html('<i class="fas fa-volume-off"></i>');
            $("#muteButton").removeClass('muted');
            ytplayer.unMute()
        } else {
            player.volume = 0;
            $("#muteButton").html('<i class="fas fa-volume-mute"></i>');
            ytplayer.mute();
        }
    }*/
}

function pauseVideo() {
	var players = document.getElementsByTagName('video');
    for(let player of players) {
        if(player.paused == false) {
            player.pause();
            $("#pauseButton").html('<i class="fas fa-play"></i>');
        } else {
            player.play();
            $("#pauseButton").html('<i class="fas fa-pause"></i>');
        }
    }

    var marquees = document.getElementsByClassName('moving-text');
    for(marquee of marquees) {

    }
}

function SetVolume(val)
{
    var players = document.getElementsByTagName('video');
    for(player of players) {
        console.log('Before: ' + player.volume);
        player.volume = val / 100;
        console.log('After: ' + player.volume);
    }
}

/******************************************************************************************
Name: exitToHome
Purpose: Exit from the Banner - Image/GIF/Video
******************************************************************************************/
export function exitToHome() {
    currentTemplate = null;
    closeAllVideos();
    window.clearInterval(_refreshBannerTimer);
    bannerAliveHandleCounter = 0;
    //$('#videoControls').trigger('pause');

    startAppIdleTimer();
    //updateAppRuntime("banner", "off", "ok");
    viewHome();
    $("#signagePage").html("");
}


window.viewDigiveu = viewDigiveu;
window.displayBanner = displayBanner; // Make globally accessible for inline HTML calls
window.bannerAliveHandle = bannerAliveHandle; // Make globally accessible for inline HTML calls
window.CheckNewTemplate = CheckNewTemplate; // Make globally accessible for inline HTML calls
window.displayInstantTemplate = displayInstantTemplate; // Make globally accessible for inline HTML calls
window.displayNoTemplate = displayNoTemplate; // Make globally accessible for inline HTML calls
window.viewTemplate = viewTemplate; // Make globally accessible for inline HTML calls
window.viewSsItems = viewSsItems; // Make globally accessible for inline HTML calls
window.viewDigiveuItem = viewDigiveuItem; // Make globally accessible for inline HTML calls
window.getVideoFile = getVideoFile; // Make globally accessible for inline HTML calls
window.downloadVideo = downloadVideo; // Make globally accessible for inline HTML calls
window.getDownloadFolder = getDownloadFolder; // Make globally accessible for inline HTML calls
window.downloadObjects = downloadObjects; // Make globally accessible for inline HTML calls
window.finishDownload = finishDownload; // Make globally accessible for inline HTML calls  
window.setBackgroundImage = setBackgroundImage; // Make globally accessible for inline HTML calls
window.setBackgroundStyle = setBackgroundStyle; // Make globally accessible for inline HTML calls
window.closeAllVideos = closeAllVideos; // Make globally accessible for inline HTML calls
window.handleVideoControls = handleVideoControls; // Make globally accessible for inline HTML calls
window.fullscreenBtnHandle = fullscreenBtnHandle; // Make globally accessible for inline HTML calls
window.muteVolume = muteVolume; // Make globally accessible for inline HTML calls
window.pauseVideo = pauseVideo;
window.SetVolume = SetVolume; // Make globally accessible for inline HTML calls
window.exitToHome = exitToHome; // Make globally accessible for inline HTML calls 
window.onYouTubeIframeAPIReady = onYouTubeIframeAPIReady; // Make globally accessible for inline HTML calls