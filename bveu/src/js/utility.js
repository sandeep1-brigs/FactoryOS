import { Filesystem, Directory, Encoding } from "@capacitor/filesystem"
import { Capacitor } from '@capacitor/core';
import { Device } from "@capacitor/device"
import { Http } from '@capacitor-community/http';
import { Network } from '@capacitor/network';
import { App } from '@capacitor/app';
import $ from 'jquery';
import Hammer from 'hammerjs';
// import { Volume } from '@capacitor-community/volume';



import { shared, appUrl , s3PrivateUrl  } from "./globals.js";
import { showConfirmDialog , buildRequestOptions , RequestOptions , isValidResponse } from "./capacitor-welcome.js";
import { doLogout , closeLoginWindow , apiRequestFailed} from "./auth.js";
import { backAssetmateHandle } from "./assetmate.js";
import { backLotomateHandle } from "./lotomate.js";
import { backVisitmateHandle } from "./visitmate.js";
import { backKnowledgemateHandle } from "./knowledgemate.js";
import { backSitemateHandle } from "./sitemate.js";
import { backContentHandle } from "./content.js";
import { exitToHome } from "./digiveu.js";
import { backErtHandle } from "./ert.js";
import { backSolutionsHandle } from "./solutions.js";
import { closeUserNotifications } from "./notification.js";
import { getNewToken , moveBtnToSection , closeConfirmDialogBox} from "./settings.js";
import { backHelpHandle } from "./help.js";
import { backKmkioskHandle } from "./kmkiosk.js";
import { backPipemarkHandle } from "./pipemarking.js";


var IDLE_TIMEOUT = shared.systemConfiguration.systemInfo.appIdleTime; //seconds
var _appIdleTimer = null;
var _idleSecondsTimer = null;
var _idleSecondsCounter = 0;
var deviceInfo = null;
var _exitAppTimer = null;
var canExit = false;
var copyKeyList = [];
var appAliveTimer = null;
var pollFpsTimer = null;
var fpsMonitorTimer = null;





/******************************************************************************************
 Name: logToDataBox
 Purpose: Mirror console logs to #datalogBox area for in-app diagnostics
******************************************************************************************/
(function() {
    function appendToLogBox(level, msg) {
        const box = document.getElementById("datalogBox");
        if (box) {
            const timestamp = new Date().toISOString().split("T")[1].split(".")[0];
            const line = document.createElement("div");
            line.style.whiteSpace = "pre-wrap";
            line.style.fontFamily = "monospace";
            line.style.borderBottom = "1px solid rgba(255,255,255,0.1)";
            line.innerHTML = `<span style="color:gray;">[${timestamp}]</span> <b>${level}:</b> ${msg}`;
            box.appendChild(line);
            box.scrollTop = box.scrollHeight;
        }
    }

    // Keep original console methods intact
    const _log = console.log;
    const _warn = console.warn;
    const _error = console.error;

    console.log = function(...args) {
        _log.apply(console, args);
        appendToLogBox("LOG", args.join(" "));
    };
    console.warn = function(...args) {
        _warn.apply(console, args);
        appendToLogBox("WARN", args.join(" "));
    };
    console.error = function(...args) {
        _error.apply(console, args);
        appendToLogBox("ERROR", args.join(" "));
    };
})();

function openDataLogArea() {
    document.getElementById("dataLogArea").style.display = "block";
}
function closeDataLogArea() {
    document.getElementById("dataLogArea").style.display = "none";
}

$('.appBox').scroll(function() {
    if ($(this).scrollTop() > 20) {
        $('.moduleHeader').css('top', '-70px');
        $('.appBox').css('margin-top', '0px');
        $('.appBox').css('height', 'calc(100% - 0px)');
    } else {
        $('.moduleHeader').css('top', '0px');
        $('.appBox').css('margin-top', '70px');
        $('.appBox').css('height', 'calc(100% - 70px)');
    }
});


// $('.appBox').scroll(function() {
//     if ($(this).scrollTop() > 20) {
//         $('.moduleHeader').css('top', '-70px');
//         $('.appBox').css('margin-top', '0px');
//         $('.appBox').css('height', 'calc(100% - 0px)');
//     } else {
//         $('.moduleHeader').css('top', '0px');
//         $('.appBox').css('margin-top', '70px');
//         $('.appBox').css('height', 'calc(100% - 70px)');
//     }
// });

export function backBtnHandle() {
    if(shared.currentRunningApp == 'assetMate') {
        backAssetmateHandle();
    } else if(shared.currentRunningApp == 'lotoMate' || shared.currentRunningApp == 'maintenance') {
        backLotomateHandle();
    } else if(shared.currentRunningApp == 'content') {
        backContentHandle();
    } else if(shared.currentRunningApp == 'visitMate') {
        backVisitmateHandle();
    } else if(shared.currentRunningApp == 'knowledgeMate') {
        backKnowledgemateHandle();
    } else if(shared.currentRunningApp == 'siteMate') {
        backSitemateHandle();
    } else if(shared.currentRunningApp == 'digiVeu') {
        exitToHome();
    } else if(shared.currentRunningApp == 'help') {
        backHelpHandle();
    } else if(shared.currentRunningApp == 'ert') {
        backErtHandle();
    } else if(shared.currentRunningApp == 'pipeMark') {
         backPipemarkHandle();
    } else if(shared.currentRunningApp == 'solutions') {
        backSolutionsHandle();
    } else  if(shared.currentRunningApp == 'kmkiosk') {
        backKmkioskHandle();
    } else {
        if((shared.currentState == "systemSection")) {
            closeSystem();
        } else if(shared.currentState == "bannerSection") {
            exitToHome();
        } else if(shared.currentState == "userNotification") {
            closeUserNotifications();
        } else {//homeSection is visible
            if(canExit == true) {
                clearTimeout(_exitAppTimer);
                exitApp();
            } else {
                canExit = true;
                $("#exitAppMessage").css("display", "flex");
                clearTimeout(_exitAppTimer);
                _exitAppTimer = setTimeout(function() {
                    $("#exitAppMessage").css("display", "none");
                    // clearTimeout(_exitAppTimer);
                    canExit = false;
                }, 3000);
            }
        }
    }
};


export function observeResize() {
    let workArea = document.getElementById('workAreaSection');
    const resizeObserver = new ResizeObserver(entries => {
        for (let entry of entries) {
            console.log('Div size changed:', entry.contentRect);
            fixModuleHeight("headerSection, footerSection", "workAreaSection");
            fixModuleHeight("headerSection, footerSection, homeSection1", -50, "homeSection3");
        }
    });
  
    resizeObserver.observe(workArea);
}

function closeLoadingSpinner() {
    $("#loadingmessage").hide();
}

function closeUploadingSpinner() {
    $("#uploadingmessage").hide();
}


export function constructUrl(urlStr, val) {
    if (!val) return urlStr;
    return urlStr.replace(/<[^>]+>/, val);
}

export function configureCustomBackButton() {
    document.addEventListener('backbutton', backBtnHandle);
}

function displayToast(msg) {

}

export function addBtnToFavourite(btnId) {
    moveBtnToSection(btnId, "homemenu_favorites");

    const data = { token: shared.mCustomerDetailsJSON.token, btnId: btnId };

    buildRequestOptions(constructUrl("/userfavorites/addtofavorite"), "GET", data)
        .then(request => {
            Http.request(request).then(res => {
                if (isValidResponse(res, "addtofavorite")) {
                    if (res != null) {
                        if (res.error !== "invalid_token") { // Check if the token is still valid
                            console.log("Success: " + JSON.stringify(res));
                        } else { // Token expired
                            getNewToken("addBtnToFavourite('" + btnId + "')");
                        }
                    }
                }
            }).catch(err => {
                apiRequestFailed(err, "addtofavorite");
            });
        })
        .catch(err => console.warn("Request aborted due to missing requestOptions.", err));
}

export function removeBtnFromFavourite(btnId) {
    moveBtnToSection(btnId, "homemenu_modules");

    const data = { token: shared.mCustomerDetailsJSON.token, btnId: btnId };

    buildRequestOptions(constructUrl("/userfavorites/removefromfavorite"), "GET", data)
        .then(request => {
            Http.request(request).then(res => {
                if (isValidResponse(res, "removefromfavorite")) {
                    if (res != null) {
                        if (res.error !== "invalid_token") { // Check if the token is still valid
                            console.log("Success: " + JSON.stringify(res));
                        } else { // Token expired
                            getNewToken("removeBtnFromFavourite('" + btnId + "')");
                        }
                    }
                }
            }).catch(err => {
                apiRequestFailed(err, "removefromfavorite");
            });
        })
        .catch(err => console.warn("Request aborted due to missing requestOptions.", err));
}

export function checkDeviceRegistration() {
    const data = { deviceSerial: shared.deviceSerialNumber };

    buildRequestOptions(constructUrl("/api/getregistration"), "GET", data)
        .then(request => {
            Http.request(request).then(res => {
                if (isValidResponse(res, "getregistration")) {
                    deviceInfo = res;
                    if (deviceInfo != null) {
                        console.log("Yeayy!!! Device is registered.");
                    } else {
                        console.log("Oops! Device is not registered.");

                        if (shared.mCustomerDetailsJSON != null) {
                            console.log("Registering the device...");

                            const data1 = { token: shared.mCustomerDetailsJSON.token, deviceSerial: shared.deviceSerialNumber };

                            RequestOptions(constructUrl("/api/createdeviceregistration"), "POST", data1)
                                .then(request1 => {
                                    Http.request(request1).then(res1 => {
                                        if (isValidResponse(res1, "createdeviceregistration")) {
                                            deviceInfo = res1;
                                            console.log("Yeayy!!! Device is registered.");
                                        }
                                    }).catch(err => {
                                        apiRequestFailed(err, "createdeviceregistration");
                                    });
                                })
                                .catch(err => console.warn("Request aborted due to missing requestOptions (createdeviceregistration).", err));

                        } else {
                            console.log("Login to register.");
                            showDialog("Device registration not found. Please login to register.");
                        }
                    }
                }
            }).catch(err => {
                apiRequestFailed(err, "getregistration");
            });
        })
        .catch(err => console.warn("Request aborted due to missing requestOptions (getregistration).", err));
}



export function showDialog(message) {
  alert(message)
  // Also display in the result div
  const resultDiv = document.getElementById("result")
  if (resultDiv) {
    resultDiv.innerHTML = `<p style="color: red;">${message}</p>`
  }
}

function viewDashboard() {
    closeLoginWindow();
}


function exitFullScreen() {
    $("#imageFullScreenDisplay").css("display", "none");
}

let timesheetUploadRetryCount = 0;
const MAX_RETRY_COUNT = 2;


export function initAppRuntimeMonitor() {
    var appRuntime = localStorage.getItem('appRunTime');
    const d = new Date();
    let time = d.getTime();
    var runJson = null;
    var userId = 0;
    if(shared.mCustomerDetailsJSON != null) {
        userId = shared.mCustomerDetailsJSON.id;
    }
    if(appRuntime != null) {
        runJson = JSON.parse(appRuntime);
    }

    if((appRuntime != null) && (runJson['runTimes'] != null) && (runJson['moduleDatas'] != null)) {
        runJson = JSON.parse(appRuntime);
        runJson['runTimes'].push(JSON.parse('{"module":"bveu", "userId":'+userId+', "on":'+time+', "alive":'+time+', "health":"ok"}'));
    }
    else {
        localStorage.removeItem('appRunTime');
        runJson = JSON.parse('{"deviceSerial":"'+shared.deviceSerialNumber+'","runTimes":[{"module":"bveu", "userId":'+userId+', "on":'+time+', "alive":'+time+', "health":"ok"}],"moduleDatas":[]}');
    }
        
    localStorage.setItem('appRunTime', JSON.stringify(runJson));

    clearInterval(appAliveTimer);
    appAliveTimer = setInterval(function() {
        let appRuntime = localStorage.getItem('appRunTime');
        const d = new Date();
        let time = d.getTime();
        var runJson = null;
        var userId = 0;
        if(shared.mCustomerDetailsJSON != null) {
            userId = parseInt(shared.mCustomerDetailsJSON.id);
        }
        if(appRuntime != null) {
            runJson = JSON.parse(appRuntime);
        }

        if((appRuntime != null) && (runJson['runTimes'] != null) && (runJson['moduleDatas'] != null)) {
            if((runJson.deviceSerial == "") && (shared.deviceSerialNumber != "")) {
                runJson.deviceSerial = shared.deviceSerialNumber;
            }
            var nowDate = new Date(time).toString().substring(4,10);
            var firstRecordDate = new Date(runJson.runTimes[0].on).toString().substring(4,10);
            if(firstRecordDate != nowDate && timesheetUploadRetryCount < MAX_RETRY_COUNT) {
                //runJson['runTimes'].push(JSON.parse('{"module":"bveu", "userId":'+userId+', "on":'+time+', "alive":'+time+', "health":"ok"}'));
                sendDeviceTimesheet();
                timesheetUploadRetryCount++;
            } else {
                runJson.runTimes[runJson.runTimes.length-1].alive = time;
                localStorage.setItem('appRunTime', JSON.stringify(runJson));
            }
            
        } else {
            localStorage.removeItem('appRunTime');
            runJson = JSON.parse('{"deviceSerial":"'+shared.deviceSerialNumber+'","runTimes":[{"module":"bveu", "userId":'+userId+', "on":'+time+', "alive":'+time+', "health":"ok"}],"moduleDatas":[]}');
            localStorage.setItem('appRunTime', JSON.stringify(runJson));
        }
        //console.log("runTime Data: "+JSON.stringify(runJson));

    }, 10000);
}

let networkOffline = false;


// async function sendDeviceTimesheet() {
//     if (!networkOffline) {
//         const d = new Date();
//         let time = d.getTime();
//         let userId = 0;

//         if (shared.mCustomerDetailsJSON != null) {
//             userId = parseInt(shared.mCustomerDetailsJSON.id);
//         }

//         let appRuntime;
//         try {
//             appRuntime = await cleanRuntimeData();
//         } catch (err) {
//             console.error("Failed to clean runtime data:", err);
//             return;
//         }

//         const data = { miscData: appRuntime };

//         // Build full API path
//         const url = constructUrl("/api/restsavemisctimesheet");

//         // Build request options with token, headers, and params
//         RequestOptions(url, "POST", data)
//             .then((requestOptions) => {
//                 if (!requestOptions) {
//                     console.warn("Request aborted due to missing requestOptions.");
//                     return;
//                 }

//                 // Send API request
//                 return Http.request(requestOptions);
//             })
//             .then((response) => {
//                 if (!response) return; // If requestOptions failed

//                 console.log("Raw response:", response);

//                 // Check validity
//                 if (isValidResponse(response, "restsavemisctimesheet")) {
//                     let resData;
//                     try {
//                         resData = typeof response.data === "string"
//                             ? JSON.parse(response.data)
//                             : response.data;
//                     } catch (e) {
//                         console.warn("Parsing failed: using response data as-is.");
//                         resData = response.data;
//                     }

//                     if (resData?.error === "not_registered") {
//                         showDialog("Failed to read device registration! Please login to the app.");
//                         timesheetUploadRetryCount = MAX_RETRY_COUNT;
//                     } else {
//                         console.log("Saved timesheet to server!");

//                         localStorage.removeItem("appRunTime");
//                         const runJson = {
//                             deviceSerial: shared.deviceSerialNumber,
//                             runTimes: [
//                                 {
//                                     module: "bveu",
//                                     userId: userId,
//                                     on: time,
//                                     alive: time,
//                                     health: "ok",
//                                 },
//                             ],
//                             moduleDatas: [],
//                         };
//                         localStorage.setItem("appRunTime", JSON.stringify(runJson));
//                     }
//                 } else {
//                     console.warn("Invalid response format or missing data from server.");
//                 }
//             })
//             .catch((error) => {
//                 console.error("Server Error - Saving timesheet failed from server!", error);

//                 try {
//                     // Fallback: update runtime locally
//                     const runJson = JSON.parse(appRuntime);
//                     runJson.runTimes.push({
//                         module: "bveu",
//                         userId: userId,
//                         on: time,
//                         alive: time,
//                         health: "ok",
//                     });
//                     localStorage.setItem("appRunTime", JSON.stringify(runJson));
//                 } catch (e) {
//                     console.error("Failed to update local runtime on error:", e);
//                 }
//             });
//     }
// }

/*this is second version of sendDeviceTimesheet*/

// async function sendDeviceTimesheet() {
//     if (networkOffline) return;

//     const time = Date.now();
//     const userId = (shared.mCustomerDetailsJSON ? parseInt(shared.mCustomerDetailsJSON.id) : 0);

//     let appRuntime;
//     try {
//         appRuntime = await cleanRuntimeData();
//     } catch (err) {
//         console.error("Failed to clean runtime data:", err);
//         return;
//     }

//     const url = constructUrl("/api/restsavemisctimesheet");

//     // 🔑 form-encode miscData (just like jQuery did)
//     const formBody = "miscData=" + encodeURIComponent(
//         typeof appRuntime === "string" ? appRuntime : JSON.stringify(appRuntime)
//     );

//     try {
//         const response = await Http.request({
//             method: "POST",
//             url: url,
//             headers: {
//                 "Content-Type": "application/x-www-form-urlencoded",
//                 "Authorization": "Bearer " + shared.token   // if needed
//             },
//             data: formBody
//         });

//         if (!isValidResponse(response, "restsavemisctimesheet")) return;

//         const resData = response.data;
//         if (resData && resData.error === "not_registered") {
//             showDialog("Failed to read device registration! Please login to the app.");
//             timesheetUploadRetryCount = MAX_RETRY_COUNT;
//             return;
//         }

//         console.log("Saved timesheet to server!");
//         localStorage.removeItem("appRunTime");
//         const runJson = {
//             deviceSerial: shared.deviceSerialNumber,
//             runTimes: [
//                 { module: "bveu", userId, on: time, alive: time, health: "ok" }
//             ],
//             moduleDatas: []
//         };
//         localStorage.setItem("appRunTime", JSON.stringify(runJson));

//     } catch (error) {
//         console.error("Server Error - Saving timesheet failed from server!", error);
//         try {
//             const runJson = (typeof appRuntime === "string") ? JSON.parse(appRuntime) : appRuntime;
//             runJson.runTimes.push({ module: "bveu", userId, on: time, alive: time, health: "ok" });
//             localStorage.setItem("appRunTime", JSON.stringify(runJson));
//         } catch (e) {
//             console.error("Failed to update local runtime on error:", e);
//         }
//     }
// }

/*this is third version of sendDeviceTimesheet*/


async function sendDeviceTimesheet() {
    if (networkOffline) return;

    const time = Date.now();
    const userId = (shared.mCustomerDetailsJSON ? parseInt(shared.mCustomerDetailsJSON.id) : 0);

    let appRuntime;
    try {
        appRuntime = await cleanRuntimeData();
    } catch (err) {
        console.error("Failed to clean runtime data:", err);
        return;
    }

    const url = constructUrl("/api/restsavemisctimesheet");
    const miscDataString = (typeof appRuntime === "string" ? appRuntime : JSON.stringify(appRuntime));

    let requestOptions;
    try {
        requestOptions = await RequestOptions(url, "POST", {}); // build with empty object
        if (!requestOptions) return;

        requestOptions.headers = {
            "Content-Type": "application/x-www-form-urlencoded",
            ...(requestOptions.headers || {})
        };

        // ✅ Correct way: pass object (not raw string)
        requestOptions.data = {
            miscData: miscDataString
        };

    } catch (err) {
        console.error("Failed to build request options:", err);
        updateLocalRunTime(appRuntime, userId, time);
        return;
    }

    Http.request(requestOptions)
        .then(response => {
            if (!isValidResponse(response, "restsavemisctimesheet")) return;

            let resData = response.data;
            if (typeof resData === "string") {
                try { resData = JSON.parse(resData); } catch (e) {}
            }

            if (resData && resData.error === "not_registered") {
                showDialog("Failed to read device registration! Please login to the app.");
                timesheetUploadRetryCount = MAX_RETRY_COUNT;
                return;
            }

            console.log("Saved timesheet to server!");
            localStorage.removeItem("appRunTime");
            const runJson = {
                deviceSerial: shared.deviceSerialNumber,
                runTimes: [{ module: "bveu", userId, on: time, alive: time, health: "ok" }],
                moduleDatas: []
            };
            localStorage.setItem("appRunTime", JSON.stringify(runJson));
        })
        .catch(error => {
            console.error("Server Error - Saving timesheet failed from server!", error);
            updateLocalRunTime(appRuntime, userId, time);
        });
}

function updateLocalRunTime(appRuntime, userId, time) {
    try {
        const runJson = (typeof appRuntime === "string") ? JSON.parse(appRuntime) : appRuntime;
        runJson.runTimes = runJson.runTimes || [];
        runJson.runTimes.push({ module: "bveu", userId, on: time, alive: time, health: "ok" });
        localStorage.setItem("appRunTime", JSON.stringify(runJson));
    } catch (e) {
        console.error("Failed to update local runtime on error:", e);
    }
}




// async function sendDeviceTimesheet() {
//     if (networkOffline) return;

//     const time = Date.now();
//     const userId = (shared.mCustomerDetailsJSON ? parseInt(shared.mCustomerDetailsJSON.id) : 0);

//     // Prepare runtime payload
//     let appRuntime;
//     try {
//         appRuntime = await cleanRuntimeData(); // could be a JSON string or object
//     } catch (err) {
//         console.error("Failed to clean runtime data:", err);
//         return;
//     }

//     const data = { miscData: appRuntime };
//     const url = constructUrl("/api/restsavemisctimesheet");

//     // Utility: parse the "payload" from varying response shapes
//     function parseResponsePayload(resp) {
//         if (!resp) return null;
//         // Capacitor Http.request -> resp.data
//         if ('data' in resp) {
//             const d = resp.data;
//             if (typeof d === 'string') {
//                 try { return JSON.parse(d); } catch (e) { return d; }
//             }
//             return d;
//         }
//         // jQuery/jqXHR-style: resp itself may be the parsed object
//         if (typeof resp === 'string') {
//             try { return JSON.parse(resp); } catch (e) { return resp; }
//         }
//         return resp;
//     }

//     // Utility: safeize runJson (appRuntime may be string or object)
//     function ensureRunJson(runtime) {
//         if (!runtime) {
//             return { deviceSerial: shared.deviceSerialNumber, runTimes: [], moduleDatas: [] };
//         }
//         if (typeof runtime === 'string') {
//             try {
//                 return JSON.parse(runtime);
//             } catch (e) {
//                 // if parsing fails return a new structure
//                 return { deviceSerial: shared.deviceSerialNumber, runTimes: [], moduleDatas: [] };
//             }
//         }
//         // assume object
//         return runtime;
//     }

//     // Build request options (ensure RequestOptions sets responseType:'json' if using Capacitor Http)
//     let requestOptions;
//     try {
//         requestOptions = await RequestOptions(url, "POST", data);
//         if (!requestOptions) {
//             console.warn("Request aborted due to missing requestOptions.");
//             return;
//         }
//         // Ensure Capacitor returns parsed JSON where possible:
//         // If RequestOptions allows adding responseType, set it:
//         if (requestOptions && typeof requestOptions === 'object' && !requestOptions.responseType) {
//             requestOptions.responseType = 'json';
//         }
//     } catch (err) {
//         console.error("Failed to build request options:", err);
//         // fallback: update local runtime (mirror Cordova failure path)
//         try {
//             const runJson = ensureRunJson(appRuntime);
//             runJson.runTimes = runJson.runTimes || [];
//             runJson.runTimes.push({ module: "bveu", userId, on: time, alive: time, health: "ok" });
//             localStorage.setItem("appRunTime", JSON.stringify(runJson));
//         } catch (e) {
//             console.error("Failed to update local runtime after RequestOptions failure:", e);
//         }
//         return;
//     }

//     // Make request
//     try {
//         const response = await Http.request(requestOptions);

//         // Use unified validator (handles both jqXHR-style and Capacitor-style)
//         if (!isValidResponse(response, "restsavemisctimesheet")) {
//             return;
//         }

//         // Normalize payload (string vs object, nested vs top-level)
//         const resData = parseResponsePayload(response);

//         // Handle server-side business error (e.g. not_registered)
//         const serverError = resData && (resData.error || resData.err || resData.error_code);
//         if (serverError === "not_registered") {
//             showDialog("Failed to read device registration! Please login to the app.");
//             timesheetUploadRetryCount = MAX_RETRY_COUNT;
//             return;
//         }

//         // Success: mirror Cordova success behavior
//         console.log("Saved timesheet to server!");
//         localStorage.removeItem("appRunTime");
//         const runJson = {
//             deviceSerial: shared.deviceSerialNumber,
//             runTimes: [
//                 { module: "bveu", userId, on: time, alive: time, health: "ok" }
//             ],
//             moduleDatas: []
//         };
//         localStorage.setItem("appRunTime", JSON.stringify(runJson));
//     } catch (error) {
//         // Failure: fallback to local update (same as Cordova request.fail)
//         console.error("Server Error - Saving timesheet failed from server!", error);
//         try {
//             const runJson = ensureRunJson(appRuntime);
//             runJson.runTimes = runJson.runTimes || [];
//             runJson.runTimes.push({ module: "bveu", userId, on: time, alive: time, health: "ok" });
//             localStorage.setItem("appRunTime", JSON.stringify(runJson));
//         } catch (e) {
//             console.error("Failed to update local runtime on error:", e);
//         }
//     }
// }


// async function cleanRuntimeData() {
//     var appRuntime = localStorage.getItem('appRunTime');
//     if(appRuntime != null) {
//         runJson = JSON.parse(appRuntime);

//         var itemList = [];
//         await runJson.runTimes.forEach(val => {
//             if(val.on != val.alive) {
//                 itemList.push(val);
//             }
//         });
//         runJson.runTimes = itemList;
//         itemList = [];
//         await runJson.moduleDatas.forEach(val => {
//             if(val.on != val.alive) {
//                 itemList.push(val);
//             }
//         });
//         runJson.moduleDatas = itemList;
//         appRuntime = JSON.stringify(runJson);
//         return appRuntime;
//     }
// }

async function cleanRuntimeData() {
    let appRuntime = localStorage.getItem('appRunTime');
    if (appRuntime != null) {
        let runJson = JSON.parse(appRuntime);

        // Clean runTimes
        runJson.runTimes = runJson.runTimes.filter(val => val.on !== val.alive);

        // Clean moduleDatas
        runJson.moduleDatas = runJson.moduleDatas.filter(val => val.on !== val.alive);

        appRuntime = JSON.stringify(runJson);
        return appRuntime;
    }
    return null; // explicitly return null if nothing found
}






export function closeDialogBox() {
    $('#dialogBox').hide();
}

 


export function convertVersionVal(str) {
    const parts = str.split('.').map(Number);
    const major = parts[0];
    const minor = parts[1].toString().padStart(2, '0');
    const patch = parts[2].toString().padStart(2, '0');
    return parseInt(`${major}${minor}${patch}`, 10);
}

function toggleNavMenu() {
    var elem = document.getElementById("navDrawer");
    if(elem != null) {
        if(elem.offsetHeight > 0) {
            closeNavMenu();
        } else {
            viewNavMenu();
        }
    }
    //fixModuleHeight("headerSection, footerSection", "navMenu");
    
}
function viewNavMenu() {
    $("#navDrawer").css("display","block");
}
function closeNavMenu() {
    $("#navDrawer").css("display","none");
}
function viewBveu() {
    viewUnderContruction();
}

function viewUnderContruction() {
    $("#underConstructionSection").css("display", "flex");
}

function closeUnderContruction() {
    $("#underConstructionSection").css("display", "none");
}

function isImageUrlValid(imgUrl) {
    if(imgUrl != null && imgUrl != undefined && !imgUrl.includes('undefined') && (imgUrl.toLowerCase().endsWith('.jpeg') || imgUrl.toLowerCase().endsWith('.jpg') || imgUrl.toLowerCase().endsWith('.png'))) {
        return true;
    } else {
        return false
    }
}


export function fixModuleHeight(exclude, add, target) {

    let element = document.getElementById(target);
    if(element != null) {
        let excludeElemIds = exclude.split(',');
        const viewportHeight = window.innerHeight;
        let occupiedHeight = 0;

        excludeElemIds.forEach(elemId => {
            let id = elemId.trim();
            occupiedHeight += $('#'+id).height();
        });
        // Calculate the remaining height
        const remainingHeight = viewportHeight + add - (occupiedHeight + 1);

        // Set the height of the element
        // element.style.height = `${remainingHeight}px`;
        // element.style.setProperty("height", `${remainingHeight}px`, "important");
        element.style.setProperty("height", `${remainingHeight}px`);

        // const observer = new MutationObserver(() => {
        //     element.style.height = `${remainingHeight}px`;
        // });
        // observer.observe(element, { attributes: true, attributeFilter: ["style"] });
    }
}

export function updateAppRuntime(app, state, health) {
    let appRuntime = localStorage.getItem('appRunTime');
    const d = new Date();
    let time = d.getTime();
    var runJson = null;
    var userId = 0;
    if(shared.mCustomerDetailsJSON != null) {
        userId = parseInt(shared.mCustomerDetailsJSON.id);
    }
    if(appRuntime != null) {
        runJson = JSON.parse(appRuntime);
    }

    if((appRuntime != null) && (runJson['runTimes'] != null) && (runJson['moduleDatas'] != null)) {
        
        if((runJson.deviceSerial == "") && (shared.deviceSerialNumber != "")) {
            runJson.deviceSerial = shared.deviceSerialNumber;
        }
        if((state == "on") || (runJson.moduleDatas == null) || (runJson.moduleDatas.length == 0))  {
            runJson['moduleDatas'].push(JSON.parse('{"module":"'+app+'", "userId":'+userId+', "on":'+time+', "alive":'+time+', "health":'+JSON.stringify(health)+'}'));
            localStorage.setItem('appRunTime', JSON.stringify(runJson));
        } else {
            var nowDate = new Date(time).toString().substring(4,10);
            var lastRecordDate = new Date(runJson.moduleDatas[runJson.moduleDatas.length-1].on).toString().substring(4,10);
            if(lastRecordDate != nowDate) {
                runJson['moduleDatas'].push(JSON.parse('{"module":"'+app+'", "userId":'+userId+', "on":'+time+', "alive":'+time+', "health":'+JSON.stringify(health)+'}'));
                localStorage.setItem('appRunTime', JSON.stringify(runJson));
            } else {
                runJson.moduleDatas[runJson.moduleDatas.length-1].alive = time;
                localStorage.setItem('appRunTime', JSON.stringify(runJson));
            }
        }
    } else {
        localStorage.removeItem('appRunTime');
        runJson = JSON.parse('{"deviceSerial":"'+shared.deviceSerialNumber+'","runTimes":[{"module":"bveu", "userId":'+userId+', "on":'+time+', "alive":'+time+', "health":"ok"}],"moduleDatas":[]}');
        runJson['moduleDatas'].push(JSON.parse('{"module":"'+app+'", "userId":'+userId+', "on":'+time+', "alive":'+time+', "health":'+JSON.stringify(health)+'}'));
        localStorage.setItem('appRunTime', JSON.stringify(runJson));
    }
}

export async function getSignedUrl(theObjectKey, expirySeconds) {
    console.log("🔍 [getSignedUrl] Called with:", { theObjectKey, expirySeconds });

    if (theObjectKey != null && theObjectKey.length > 0) {
        try {
            // Step 1: Request the signed URL from your backend
            const url = new URL(appUrl + "/api/generatepresignedurlforread");
            url.searchParams.append("objectkey", theObjectKey);
            url.searchParams.append("expiry", expirySeconds);

            console.log("🌐 [getSignedUrl] Requesting backend with URL:", url.toString());

            const backendResponse = await fetch(url.toString(), { method: "GET" });

            console.log("📥 [getSignedUrl] Backend response status:", backendResponse.status);

            if (!backendResponse.ok) {
                throw new Error(`Backend request failed with status: ${backendResponse.status}`);
            }

            // 👇 FIX: Use .text() instead of .json()
            const resultText = await backendResponse.text();
            console.log("✅ [getSignedUrl] Backend raw result:", resultText);

            // Some backends return JSON, some return plain text.
            let signedUrl;
            try {
                const parsed = JSON.parse(resultText);
                signedUrl = parsed.url || parsed;
                console.log("🔑 [getSignedUrl] Extracted signed URL (JSON):", signedUrl);
            } catch {
                signedUrl = resultText.trim();
                console.log("🔑 [getSignedUrl] Extracted signed URL (plain text):", signedUrl);
            }

            // Step 2: Check if the signed URL points to an existing file
            console.log("🗂 [getSignedUrl] Validating signed URL via HEAD request...");

            const response = await fetch(signedUrl, { method: "HEAD", mode: "cors" });

            console.log("📥 [getSignedUrl] HEAD request status:", response.status);

            if (response.ok) {
                console.log("✅ [getSignedUrl] File exists, returning signed URL");
                return signedUrl;
            } else {
                console.warn("⚠️ [getSignedUrl] File not found at signed URL");
                return "file_not_found";
            }

        } catch (error) {
            console.error("❌ [getSignedUrl] Error generating or validating signed URL:", error);
            return "file_not_found";
        }
    } else {
        console.warn("⚠️ [getSignedUrl] Invalid object key provided");
        return "file_not_found";
    }
}



export async function getSignedUrlForUpload(theObjectKey, expirySeconds) {
    // Show loader if needed
    // document.getElementById("loadingSpinner")?.style.display = "block";

    try {
        const url = new URL(shared.systemConfiguration.systemInfo.gatewayBaseURL + "/api/generatepresignedurlforwrite");
        url.searchParams.append("objectkey", theObjectKey);
        url.searchParams.append("expiry", expirySeconds);

        const response = await fetch(url.toString(), {
            method: "GET"
        });

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const result = await response.json(); // same as $.ajax result
        // document.getElementById("loadingSpinner")?.style.display = "none";
        return result;
    } catch (error) {
        console.error("❌ Error in getSignedUrlForUpload:", error);

        showDialog("ERROR!!!<br>" + error);
        document.getElementById("uploadingmessage") && (document.getElementById("uploadingmessage").style.display = "none");
        document.getElementById("loadingmessage") && (document.getElementById("loadingmessage").style.display = "none");
        // document.getElementById("loadingSpinner") && (document.getElementById("loadingSpinner").style.display = "none");

    }
}

function closeSystem() {
    showConfirmDialog({
        message: "Exit System Settings?",
        yesLabel: "Exit",
        noLabel: "Cancel",
        onYes: () => {
            exitSystem();
        },
        onNo: () => {
            closeConfirmDialogBox();
        }
    });
}

function exitSystem() {
    viewHome();
    if(shared.mCustomerDetailsJSON == null) {
        startAppIdleTimer();
    }
}


function doSettingChange(settingItem) {
    console.log("Setting Item: "+settingItem);
}

function handleMenuLongClick(button) {
    console.log("Button long clicked: " + button.id);
    if (shared.mCustomerDetailsJSON != null) {
        if (button.parentElement.id === "homemenu_favorites") {
            showConfirmDialog({
                message: "Remove from favourite?",
                yesLabel: "Remove",
                noLabel: "Cancel",
                onYes: () => {
                    removeBtnFromFavourite(button.id);
                },
                onNo: () => {
                    closeConfirmDialogBox();
                }
            });
        } else {
            showConfirmDialog({
                message: "Add to favourite?",
                yesLabel: "Add",
                noLabel: "Cancel",
                onYes: () => {
                    addBtnToFavourite(button.id);
                },
                onNo: () => {
                    closeConfirmDialogBox();
                }
            });
        }
    } else {
        showDialog({
            message: "You need to login to perform this task!",
            onOk: () => {
                viewLogin("programProcess");
            }
        });
    }
}

function exitToErt() {
    if (shared.mCustomerDetailsJSON != null) {
        showConfirmDialog({
            message: "Starting ERT will log you out. Proceed?",
            yesLabel: "Proceed",
            noLabel: "Cancel",
            onYes: () => {
                startErt();
            },
            onNo: () => {
                closeConfirmDialogBox();
            }
        });
    } else {
        stopAppIdleTimer();
        startErt();
    }
}

var userNotifications = null;
function startErt() {
    shared.mCustomerDetailsJSON = null;
    $('#onlineDotOverlay').html("");
    $('#onlineDotOverlay').hide();
    userNotifications = null;
    $("#notificationOverlay").html("");
    $("#notificationOverlay").hide();
    $("#loggedUserName").html("");
    //doLogout('ert');
    // displayBanner(); is called directlt from logout
    viewErt();
}



export function highlightHeaderTabMenu(elclass, id) {
    $("."+elclass).removeClass("headerTabMenuActiveBtnStyle");
    $("#"+id).addClass("headerTabMenuActiveBtnStyle");

}

export async function getGeoPosition(elemId) {
    var options = {
       enableHighAccuracy: true,
       maximumAge: 3600000
    }
    navigator.geolocation.getCurrentPosition(position => {
        console.log('Latitude: '          + position.coords.latitude          + '\n' +
        'Longitude: '         + position.coords.longitude         + '\n' +
        'Altitude: '          + position.coords.altitude          + '\n' +
        'Accuracy: '          + position.coords.accuracy          + '\n' +
        'Altitude Accuracy: ' + position.coords.altitudeAccuracy  + '\n' +
        'Heading: '           + position.coords.heading           + '\n' +
        'Speed: '             + position.coords.speed             + '\n' +
        'Timestamp: '         + position.timestamp                + '\n');

      let geoData = 'lat:'+position.coords.latitude+',lon:'+position.coords.longitude+',acc:'+position.coords.accuracy+',time:'+position.timestamp;
      var elem = document.getElementById(elemId);
      elem.value = geoData;
      return geoData;
    }, 
    error => {
        alert('code: '    + error.code    + '\n' + 'message: ' + error.message + '\n');
        return {'error':error.code+' - '+error.message}
 
    }, options);
 }

export function startAppIdleTimer() {
    IDLE_TIMEOUT = shared.systemConfiguration.systemInfo.appIdleTime; //seconds

    var elem = document.getElementById("loginSection");
    elem.onclick = function() {
        restartAppIdleTimer();
    };

    elem.onmousemove = function() {
        restartAppIdleTimer();
    };

    elem.onkeypress = function() {
        restartAppIdleTimer();
    };

    elem.ontouchstart = function() {
        restartAppIdleTimer();
    };

    elem.ontouchmove = function() {
        restartAppIdleTimer();
    };

    document.getElementById("loginBackground").ontouchstart  = function() {
        restartAppIdleTimer();
    };

    document.getElementById("loginBackground").ontouchmove  = function() {
        restartAppIdleTimer();
    };

    document.getElementById("footerMenu").ontouchstart  = function() {
        restartAppIdleTimer();
    };
    
    document.getElementById("footerMenu").ontouchmove  = function() {
        restartAppIdleTimer();
    };

    _idleSecondsCounter = 0;
    if(_idleSecondsTimer) {
        window.clearInterval(_idleSecondsTimer);
        _idleSecondsTimer = null;
    }
    if(_appIdleTimer) {
        window.clearTimeout(_appIdleTimer);
        _appIdleTimer = null;
    }
    _appIdleTimer = setTimeout(viewSignageStartText, 10000);
    
    if(pollFpsTimer != null) {
        clearInterval(pollFpsTimer);
        pollFpsTimer = null;
    }
    if(fpsMonitorTimer != null) {
        clearInterval(fpsMonitorTimer);
        fpsMonitorTimer = null;
    }
    $("#signageStartMessage").css("display", "none");
}

export function restartAppIdleTimer() {

    if(_idleSecondsTimer){
        _idleSecondsCounter = 0;
        window.clearInterval(_idleSecondsTimer);
        _idleSecondsTimer = null;
    }

    window.clearTimeout(_appIdleTimer);
    _appIdleTimer = null;
    if(shared.mCustomerDetailsJSON == null) {
        _appIdleTimer = setTimeout(function() {viewSignageStartText()}, 10000);
    }

    $("#signageStartMessage").css("display", "none");
}

export function stopAppIdleTimer() {
    if(_appIdleTimer) {
        window.clearTimeout(_appIdleTimer);
        _appIdleTimer = null;
    } 
    
    if(_idleSecondsTimer){
        _idleSecondsCounter = 0;
        window.clearInterval(_idleSecondsTimer);
        _idleSecondsTimer = null;
    }
}

function viewSignageStartText() {
    if(shared.systemConfiguration.cmsInfo.deviceType == 'ERTDISPLAY' || shared.systemConfiguration.cmsInfo.deviceType == 'VMKIOSK' || shared.systemConfiguration.cmsInfo.deviceType == 'KMKIOSK' || deviceInfo.digiveuEnabled == true) {
        $("#SecondsUntilExpire").html(IDLE_TIMEOUT+" Seconds");
        if(shared.systemConfiguration.cmsInfo.deviceType != undefined && shared.systemConfiguration.cmsInfo.deviceType == 'ERTDISPLAY') {
            $("#signageMessage").text("ERT display will start in: ");
        } else if(shared.systemConfiguration.cmsInfo.deviceType != undefined && shared.systemConfiguration.cmsInfo.deviceType == 'KMKIOSK') {
            $("#signageMessage").text("Kiosk application will start in: ");
        }
        $("#signageStartMessage").css("display", "block");
        if(_appIdleTimer) {
            window.clearTimeout(_appIdleTimer);
            _appIdleTimer = null;
        }

        if(_idleSecondsTimer) {
            window.clearInterval(_idleSecondsTimer);
            _idleSecondsTimer = null;
        }
        _idleSecondsTimer = window.setInterval(function() {CheckIdleTime()}, 1000);
    } else {
        if(_appIdleTimer) {
            window.clearTimeout(_appIdleTimer);
            _appIdleTimer = null;
        }
    }
}

function CheckIdleTime() {
    var oPanel = document.getElementById("SecondsUntilExpire");
    if (oPanel) {
        oPanel.innerHTML = (IDLE_TIMEOUT - _idleSecondsCounter) + " Seconds";
    }
        
    if (_idleSecondsCounter >= IDLE_TIMEOUT) {
        stopAppIdleTimer();
        if(shared.systemConfiguration.cmsInfo.deviceType != undefined) {
            if(shared.systemConfiguration.cmsInfo.deviceType == 'KMKIOSK') {
                displayKmkioskScreen();
            } else if(shared.systemConfiguration.cmsInfo.deviceType == 'ERTDISPLAY') {
                viewErt();
            } else if (shared.systemConfiguration.cmsInfo.deviceType == 'VMKIOSK') {
                viewVisitmate();
            } else {
                startSignage();    
            }
        } else {
            startSignage();
        }
    } else {
        _idleSecondsCounter++;
    }
}

function exitApp() {
    navigator.app.exitApp();
}

 export function pauseVideos() {
	var players = document.getElementsByTagName('video');
	for(var player of players) {
		player.pause();
	}
}

 export function initPinchZoom(elemId) {
	var imageElem = document.getElementById(elemId, {});
	var imageGesture = new Hammer(imageElem, {});
	imageGesture.get('pinch').set({enable: true});

	var posX = 0,
        posY = 0,
        scale = 1,
        last_scale = 1,
        last_posX = 0,
        last_posY = 0,
        max_pos_x = 0,
        max_pos_y = 0,
        transform = "",
        el = imageElem;

	//var imageGesture = new Hammer.Manager(imageElem);
	//var pinch = new Hammer.Pinch();
	// add to the Manager
	//imageGesture.add([pinch]);
	
	imageGesture.on("doubletap pan pinch panend pinchend", function(ev) {
		// console.log("Gesture: "+ev.type);

		if (ev.type == "doubletap") {
            transform =
                "translate3d(0, 0, 0) " +
                "scale3d(2, 2, 1) ";
            scale = 2;
            last_scale = 2;
            try {
                if (window.getComputedStyle(el, null).getPropertyValue('-webkit-transform').toString() != "matrix(1, 0, 0, 1, 0, 0)") {
                    transform =
                        "translate3d(0, 0, 0) " +
                        "scale3d(1, 1, 1) ";
                    scale = 1;
                    last_scale = 1;
                }
            } catch (err) {}
            el.style.webkitTransform = transform;
            transform = "";
        }

        //pan    
        if (scale != 1) {
            posX = last_posX + ev.deltaX;
            posY = last_posY + ev.deltaY;
            max_pos_x = Math.ceil((scale - 1) * el.clientWidth / 2);
            max_pos_y = Math.ceil((scale - 1) * el.clientHeight / 2);
            if (posX > max_pos_x) {
                posX = max_pos_x;
            }
            if (posX < -max_pos_x) {
                posX = -max_pos_x;
            }
            if (posY > max_pos_y) {
                posY = max_pos_y;
            }
            if (posY < -max_pos_y) {
                posY = -max_pos_y;
            }
        }


        //pinch
        if (ev.type == "pinch") {
            scale = Math.max(.999, Math.min(last_scale * (ev.scale), 4));
        }
        if(ev.type == "pinchend"){last_scale = scale;}

        //panend
        if(ev.type == "panend"){
            last_posX = posX < max_pos_x ? posX : max_pos_x;
            last_posY = posY < max_pos_y ? posY : max_pos_y;
        }

        if (scale != 1) {
            transform =
                "translate3d(" + posX + "px," + posY + "px, 0) " +
                "scale3d(" + scale + ", " + scale + ", 1)";
        }

        if (transform) {
            el.style.webkitTransform = transform;
        }
		
	});
}

export async function captureImage(imageElement, imageSource, folder, fileName, imageQuality, resolution) {
    if (isNaN(resolution)) {resolution = 600;}
    if(isNaN(imageQuality)) {imageQuality = 60;}

	var options = {
        // Some common settings are 20, 50, and 100
        //"quality": imageQuality,
        "quality": 50,
        "destinationType": Camera.DestinationType.FILE_URI,
		// "destinationType": Camera.DestinationType.DATA_URL,
        // In this app, dynamically set the picture source, Camera or photo gallery
		// Can be: Camera.PictureSourceType.SAVEDPHOTOALBUM; Camera.PictureSourceType.PHOTOLIBRARY
        "sourceType": imageSource,
        "encodingType": Camera.EncodingType.JPEG,
        "mediaType": Camera.MediaType.PICTURE,
        "allowEdit": false,
        "correctOrientation": true,
		//"targetWidth": resolution,
		//"targetHeight": resolution
        "targetWidth": 400,
		"targetHeight": 400,
        "saveToPhotoAlbum": false
    }

    takePicture(imageElement, folder, fileName, options);
    // Check for required permissions
    // checkPermissions().then(() => {
    //     // Permissions granted, proceed to take picture
    //     takePicture(imageElement, folder, fileName, options);
    // }).catch((error) => {
    //     console.error('Permissions denied', error);
    // });
}
export function exitToBanner() {
    if (shared.mCustomerDetailsJSON != null) {
        showConfirmDialog({
            message: "Starting signage will log you out. Proceed?",
            yesLabel: "Proceed",
            noLabel: "Cancel",
            onYes: () => {
                console.log("✅ User confirmed signage start");
                startSignage();
            },
            onNo: () => {
                console.log("❌ User cancelled signage start");
                // Dialog auto-hides, nothing else needed
            }
        });
    } else {
        stopAppIdleTimer();
        startSignage();
    }
}

function startSignage() {
    doLogout('banner');
    // displayBanner(); is called directlt from logout
}

export function populateImage(imgElemId, imgUrl) {
    let imgElem = document.getElementById(imgElemId);
    if(imgElem != null && imgUrl != null && imgUrl.length > 0) {
        if(isImageUrlValid(imgUrl) == true) {
            if(imgUrl.includes(s3PrivateUrl)) {
                var objectKey = imgUrl.replace(s3PrivateUrl, '');
                var retryCount = 0;
                function obtainSignedUrl(objectKey) {
                    getSignedUrl(objectKey, 10).then(url => {
                        if(url.startsWith("http")) {
                            // imgElem.src = url;
                            //$('#'+imgElem).attr('src',url);
                            $(imgElem).attr('src',url);
                            console.log('Private Image - imgElem.id: '+imgElem.id+', url: '+url);
                        } else {
                            retryCount++;
                            if(retryCount <= 5) {
                                obtainSignedUrl(objectKey);
                            }
                        }
                    });
                }
                obtainSignedUrl(objectKey);
            } else {
                imgElem.src = imgUrl;
                console.log('Public Image - imgElem.id: '+imgElem.id+', url: '+url);
            }
        } else {
            imgElem.src = './img/noimage.jpg'
            console.log('Invalid Image - imgElem.id: '+imgElem.id+', url: ./img/noimage.jpg');
        }
    }
}



//  export async function populateTempCopiedImage(imgElem, imgUrl) {
//     let companySettings = {};
//     let cs = window.localStorage.getItem("companySettings");
//     if (cs != null && cs.startsWith("{")) {
//         companySettings = JSON.parse(cs);
//     }

//     if (imgElem != null) {
//         if (imgUrl.includes(s3PrivateUrl)) {
//             try {
//                 // ✅ Build request options
//                 const requestOptions = {
//                     method: "GET",
//                     url: constructUrl("/api/copyprivatetopublic"),
//                     params: { url: imgUrl }
//                 };

//                 // ✅ Send request
//                 const response = await Http.request(requestOptions);

//                 console.log("[populateTempCopiedImage] Raw response:", response);

//                 if (response && response.data) {
//                     imgElem.src =
//                         companySettings.systemInfo.cdnURL +
//                         imgUrl.replace(s3PrivateUrl, "");
//                     copyKeyList.push(imgElem.src);
//                 }
//             } catch (e) {
//                 console.log("[populateTempCopiedImage] Error:", e);
//             }
//         } else {
//             imgElem.src = imgUrl;
//         }
//     }
// }


export function populateTempCopiedImage(imgElem, imgUrl) {
    let companySettings = {};
    let cs = window.localStorage.getItem("companySettings");
    if (cs != null && cs.startsWith("{")) {
        companySettings = JSON.parse(cs);
    }

    if (imgElem != null) {
        if (imgUrl.includes(s3PrivateUrl)) {
            // ✅ Build request options
            const requestOptions = {
                method: "GET",
                url: constructUrl("/api/copyprivatetopublic"),
                params: { url: imgUrl }
            };

            // ✅ Send request using non-blocking promise chain
            Http.request(requestOptions)
                .then((response) => {
                    console.log("[populateTempCopiedImage] Raw response:", response);

                    if (response && response.data) {
                        imgElem.src =
                            companySettings.systemInfo.cdnURL +
                            imgUrl.replace(s3PrivateUrl, "");
                        copyKeyList.push(imgElem.src);
                    }
                })
                .catch((e) => {
                    console.log("[populateTempCopiedImage] Error:", e);
                });
        } else {
            imgElem.src = imgUrl;
        }
    }
}

function viewDeviceInfo() {
    closeNavMenu();
    $("#deviceInfoSection").css("display", "flex");
    var serial = shared.deviceSerialNumber;
    var deviceInfoHtml = "";
    if(deviceInfo != null) {
        deviceInfoHtml += '<p><b>This device is registered</b></p>';
        deviceInfoHtml += '<br>';
       
        deviceInfoHtml += '<p><b>Registered ID</b>: '+deviceInfo.id+'</p>';
        deviceInfoHtml += '<p><b>Serial No</b>: '+deviceInfo.serial+'</p>';
        deviceInfoHtml += '<p><b>Description</b>: '+deviceInfo.deviceName+'</p>';
        deviceInfoHtml += '<p><b>Description</b>: '+deviceInfo.description+'</p>';
        deviceInfoHtml += '<p><b>Date of registration</b>: '+deviceInfo.createdOn+'</p>';
        deviceInfoHtml += '<p><b>Registered By</b>: '+deviceInfo.createdBy+'</p>';
        deviceInfoHtml += '<p><b>Company Key</b>: '+deviceInfo.companyKey+'</p>';
        deviceInfoHtml += '<p><b>Detail</b>: '+deviceInfo.registrationDetails+' </p>';
    
    } else {
        deviceInfoHtml += '<p><b>This device is not registered</b></p>';
    }
    $("#deviceInfoBox").html(deviceInfoHtml);
}

function closeDeviceInfo() {
    $("#deviceInfoSection").css("display", "none");
}

function closeNeedAssistance() {
    $("#needAssistantSection").css("display", "none");
}


async function viewNeedAssistance() {
    // Show the "Need Assistance" section
    $("#needAssistantSection").css("display", "block");

    // Set initial volume to 0.8 (same logic as before)
    try {
        await Volume.set({ value: 0.8 });
    } catch (err) {
        console.error("Failed to set initial volume:", err);
    }

    // Get slider element
    const slider = document.getElementById("mediaVolumeLevel");

    // Update the current slider value (each time the user drags the slider handle)
    slider.oninput = async function() {
        try {
            await Volume.set({ value: this.value / 100 });
        } catch (err) {
            console.error("Failed to set volume:", err);
        }
    };
}

function mediaError(e) {
    console.log('Media Error ' + JSON.stringify(e));
}

function showMessage(res) {
    $('#dialogBox').addClass(commonCMS.dialogBox.dialogBoxBackgroundClass);
    $('#dialogBoxCard').addClass(commonCMS.dialogBox.dialogBoxCardClass);
    $('#dialogText').addClass(commonCMS.dialogBox.dialogBoxTextClass);
    $('#dialogBoxCard').css("background-color","rgba(0,0,0,0.5)");
    $('#dialogText').css("color","rgb(255,255,255)");
    $('#dialogOk').css("display", "none");

    $('#dialogText').html(res);

    $('#dialogBox').show();
}

function handleDialogCallback(callback) {
    closeDialogBox();
    eval(callback);
}

function customSerialize(str) {
    var res = encodeURIComponent(str);
    res = res.replace(/%20/g, '+');
    res = res.replace(/%26/g, '&');
    res = res.replace(/%3D/g, '=');
    res = res.replace(/%5F/g, '_');
    return res;
}

function convertToReadableDate(dateStr) {
    // Fix the format by replacing the space before milliseconds with a dot
    const fixedStr = dateStr.replace(' ', '.');
  
    // Create a Date object
    const date = new Date(fixedStr);
  
    // Check for invalid date
    if (isNaN(date)) {
      return 'Invalid date';
    }
  
    // Format options
    const options = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZoneName: 'short'
    };
  
    return date.toLocaleString(undefined, options);
}

function remove_non_ascii(str) {
    if ((str === null) || (str === ''))
        return false;
    else {
        str = str.toString();
        return str.replace(/\n/g, "").replace(/[\t ]+\</g, "<").replace(/\>[\t ]+\</g, "><").replace(/\>[\t ]+$/g, ">").replace(/[^\x20-\x7E]/g, '');
    }
}

function callTimerEvent(callback, hour, min, intervalMilli) {
    var currentTimeMilli = new Date();
    var alarmTimeMilli, waitTimeMilli;

    if (intervalMilli == undefined)
        intervalMilli = 86400000; // 24 Hours

    if (hour == undefined)
        hour = 11; // 11 AM 

    if (min == undefined)
        min = 30; // 3O min 

    alarmTimeMilli = new Date(currentTimeMilli.getFullYear(), currentTimeMilli.getMonth(), currentTimeMilli.getDate(), hour, min, 0, 0);
    if (alarmTimeMilli < currentTimeMilli) {
        alarmTimeMilli += intervalMilli;
    }
    waitTimeMilli = alarmTimeMilli - currentTimeMilli;
    setTimeout(function() {
        setInterval(function() {
            eval(callback);
            console.log('callTimerEvent: Invoked');
        }, intervalMilli);
    }, waitTimeMilli);
}


window.exitToBanner = exitToBanner; // Make globally accessible for inline HTML calls
window.toggleNavMenu = toggleNavMenu;
window.closeNavMenu = closeNavMenu;
window.viewDeviceInfo = viewDeviceInfo;
window.closeDeviceInfo = closeDeviceInfo;
window.viewDashboard = viewDashboard;
window.viewBveu = viewBveu;
window.closeUnderContruction = closeUnderContruction;
window.backBtnHandle = backBtnHandle;
window.doSettingChange = doSettingChange;
window.handleMenuLongClick = handleMenuLongClick;
window.exitToErt = exitToErt;
window.closeNeedAssistance = closeNeedAssistance;
window.viewNeedAssistance = viewNeedAssistance;
window.mediaError = mediaError;
window.showMessage = showMessage;
window.handleDialogCallback = handleDialogCallback
window.observeResize = observeResize;
window.closeLoadingSpinner = closeLoadingSpinner;
window.closeUploadingSpinner = closeUploadingSpinner;
window.configureCustomBackButton = configureCustomBackButton;
window.displayToast = displayToast;
window.addBtnToFavourite = addBtnToFavourite;
window.removeBtnFromFavourite = removeBtnFromFavourite;
window.checkDeviceRegistration = checkDeviceRegistration;
window.exitFullScreen = exitFullScreen;
window.initAppRuntimeMonitor = initAppRuntimeMonitor;
window.openDataLogArea = openDataLogArea;
window.closeDataLogArea = closeDataLogArea;
window.customSerialize = customSerialize;
window.convertToReadableDate = convertToReadableDate;
window.remove_non_ascii = remove_non_ascii;
window.callTimerEvent = callTimerEvent;
window.updateAppRuntime = updateAppRuntime;


