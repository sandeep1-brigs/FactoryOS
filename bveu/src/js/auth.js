import { Filesystem, Directory, Encoding } from "@capacitor/filesystem"
import { Capacitor } from '@capacitor/core';
import { Device } from "@capacitor/device"
import { Http } from '@capacitor-community/http';
import { Network } from '@capacitor/network';
import { App } from '@capacitor/app';
import $ from 'jquery';
import { Preferences } from "@capacitor/preferences";

import { shared, settingJson } from "./globals.js";
import { displaySection, isValidResponse, buildRequestOptions, RequestOptions} from "./capacitor-welcome.js";
import { showDialog,constructUrl , startAppIdleTimer , stopAppIdleTimer} from "./utility.js";
import { viewHome, clearFavouriteBtns, updateHomeButtonAcccess } from "./settings.js";
import { displayBanner } from "./digiveu.js";


var deviceInfo = null;
var userNotifications = "";

export function viewLogin(caller) {
    
    if (caller == "programProcess") { // Called from program - check if you are still logged in
        //$("#loginIcon").html('<i class="fas fa-user"></i>');
        //$("#loginIcon").html('<span class="material-symbols-outlined" style="font-size: 35px;">person</span>');
        $("#loginSection").css("display", "block");
        $("#loginButton").attr("onclick", "doLogin('viewHome')");
        $("#continueButton").attr("onclick", "closeLoginWindow()");

        shared.mCustomerDetailsJSON = null;
        startAppIdleTimer();
    } else if (caller == "menuProcess") { // Called from menu - just loginif not already logged in
        if (shared.mCustomerDetailsJSON != null) { // Already Logged in
            viewLogout();
        } else {
            //$("#loginIcon").html('<i class="fas fa-user"></i>');
            //$("#loginIcon").html('<span class="material-symbols-outlined" style="font-size: 35px;">person</span>');
            $("#loginSection").css("display", "flex");
            $("#loginButton").attr("onclick", "doLogin('viewHome')");
            $("#continueButton").attr("onclick", "closeLoginWindow()");

            shared.mCustomerDetailsJSON = null;
            startAppIdleTimer();
    
        }
    } else if (caller == "systemProcess") { // Pressed System - its local login
        $("#loginSection").css("display", "none");

        //$("#systemLoginIcon").html('<i class="fas fa-cogs"></i>');
        //$("#systemLoginIcon").html('<span class="material-symbols-outlined" style="font-size: 35px;">person</span>');
        $("#systemLoginSection").css("display", "flex");
        $("#systemLoginButton").attr("onclick", "doSystemLogin()");
        $("#systemContinueButton").attr("onclick", "systemLoginError()");
        // document.getElementById("userName").value = systemConfiguration.systemInfo.adminUser;
        // document.getElementById("password").value = systemConfiguration.systemInfo.adminPassword;
    }

    /*$("#homeloginuserName").on('keyup', function(e) {
        if (e.keyCode === 13) {
            document.getElementById("homeloginuserName").blur();
            document.getElementById("homeloginpassword").focus();
        }
    });
    $("#homeloginpassword").on('keyup', function(e) {
        if (e.keyCode === 13) {
            document.getElementById("homeloginpassword").blur();
            document.getElementById("loginButton").click();
        }
    });*/

}

function viewLogout() {
    $("#loginSection").css("display", "none");
    $("#logoutSection").css("display", "block");
    $("#logoutButton").attr("onclick", "doLogout(false)");
    $("#continueButton2").attr("onclick", "closeLogoutWindow()");
}

function viewSystem() {

    var commonCMS = shared.cmsJSON.cmsJSONdata.common;

    shared.appVersion = shared.systemConfiguration.appInfo.appVersion;
    shared.releaseInfo = shared.systemConfiguration.appInfo.releaseInfo;
    shared.configVersion = shared.systemConfiguration.systemInfo.systemVersion;
    shared.softAutoUpdate = shared.systemConfiguration.systemInfo.softAutoUpdate;
    shared.configUpdateTime = shared.systemConfiguration.systemInfo.configUpdateTime;
    shared.systemSleepTime = shared.systemConfiguration.systemInfo.systemSleepTime;
    shared.systemWakeTime = shared.systemConfiguration.systemInfo.systemWakeTime;
    shared.primaryColor = commonCMS.primaryColor;
    shared.secondaryColor = commonCMS.secondaryColor;
    shared.developerEmailAddress = shared.systemConfiguration.systemInfo.developerEmailAddress;
    shared.server = shared.systemConfiguration.systemInfo.gatewayBaseURL;
    shared.inAppUpdateEnabled = shared.systemConfiguration.systemInfo.inAppUpdateEnabled;

    var prodHtml = "";
    var pageStyle = shared.cmsJSON.cmsJSONdata.systemScreen;

    prodHtml += '<div onclick="closeSystem()" style="float:right; padding:5px 15px; color:rgba(50,50,50,1.0); margin:10px; "><i class="fas fa-times"></i></div>';
    prodHtml += '<p class="' + pageStyle.headingFontClass + '">System</p>';

    $.each(settingJson.content, function (key, value) {
        prodHtml += '<p class="' + pageStyle.nameFontClass + '">' + value.heading + '</p>';
        $.each(value.params, function (k, val) {
            var param = val.name;
            if ((val.variable != '') && (val.variable != undefined)) {
                param += ': ' + window[val.variable];
            }
            if ((val.onClickFunction != '') && (val.onClickFunction != undefined) && (val.onClickText != '') && (val.onClickText != undefined)) {
                prodHtml += '<p class="settingRight" onclick="' + val.onClickFunction + '" class="' + pageStyle.descriptionFontClass + '">' + val.onClickText + '</p><p class="settingLeft" class="' + pageStyle.descriptionFontClass + '">' + param + '</p>';
            } else {
                prodHtml += '<p class="settingRight" class="' + pageStyle.descriptionFontClass + '"></p><p class="settingLeft" class="' + pageStyle.descriptionFontClass + '">' + param + '</p>';
            }
        });
    });

    $("#systemWindow").html(prodHtml);
    displaySection("systemSection", "block", false, false);
}

function doSystemLogin() {
    var userID = document.getElementById("sysUserName").value.toLowerCase();
    var password = document.getElementById("sysPassword").value;
    if ((userID == shared.systemConfiguration.systemInfo.adminUser.toLowerCase()) && (password == shared.systemConfiguration.systemInfo.adminPassword)) {

        closeSystemLoginWindow();
        stopAppIdleTimer();
        viewSystem();
    } else {
        closeSystemLoginWindow();
        showDialog("Invalid login credentials!", "viewHome()");
    }
}

function closeSystemLoginWindow() {
    $("#systemLoginSection").css("display", "none");
    viewHome();
}

function closeLogoutWindow() {
    $("#logoutSection").css("display", "none");
}

function systemLoginError() {
    closeSystemLoginWindow();
    showDialog("You are not authorized to view/modify this page!", "viewHome()");
}


export function closeLoginWindow() {
    stopAppIdleTimer();
    $("#loginSection").css("display", "none");

}

 export function doLogout(callback) {
    //$('#loadingmessage').hide();
    if(shared.mCustomerDetailsJSON != null) {
        clearFavouriteBtns();
        showDialog("You have been logged out.", "viewHome()");
        shared.mCustomerDetailsJSON = null;
        $('#onlineDotOverlay').html("");
        $('#onlineDotOverlay').hide();
        userNotifications = null;
        $("#notificationOverlay").html("");
        $("#notificationOverlay").hide();
    }
    $("#loggedUserName").html("");
    closeLogoutWindow();
    
    if(callback == 'banner') {
        console.log("Banner callback triggered");
        displayBanner();
    } else if(callback == 'ert') {
        console.log("ERT callback triggered");
        // viewErt();
    } else {
        console.log("No callback triggered");
         startAppIdleTimer();
    }


    // var query =  systemConfiguration.systemInfo.gatewayBaseURL + "/logout";

    // $.ajax({
    //     url: query,
    //     type: 'post',
        
    //     success: function(data) { // Got banner info from server
    //         if(exitApp == true) {
    //             navigator.app.exitApp();
    //         } else {
    //             //$('#loadingmessage').hide();
    //             userFirstName = "";
    //             $("#btnText_account").text("Account");
    //             $('#btnOverlay_account').css("display", "none");
    //             // updateCartIconOverlay();
    //             closeLogoutWindow();
    //             mCustomerDetailsJSON = null;
    //             $("#loggedUserName").html("");
    //             showDialog("You have been logged out.", "viewHome()");
    //         }

    //     }, function(e) {
    //         console.log(e.target.error.code); // Filesystem failure
    //         //$('#loadingmessage').hide();
    //     }
    // });

}

// async function doLogin(callback) {
//     try {
//         console.log("[doLogin] Starting login process...");

//         const theUserName = document.getElementById("homeloginuserName").value.trim();
//         const thePassword = document.getElementById("homeloginpassword").value.trim();

//         if (!theUserName || !thePassword) {
//             showDialog("Username and password are required!");
//             return;
//         }

//         const data = { userName: theUserName, password: thePassword };
//         const url = constructUrl("/api/login");

//         // Build request with headers, token, etc.
//         const requestOptions = await buildRequestOptions(url, "POST", data);

//         if (!requestOptions) {
//             console.warn("[doLogin] Request aborted due to missing request options.");
//             return;
//         }

//         // Send API request
//         const response = await Http.request(requestOptions);
//         console.log("[doLogin] Raw response:", response);

//         // Validate API response
//         if (isValidResponse(response, "login") && response.data) {
//             const resData = typeof response.data === "string" ? JSON.parse(response.data) : response.data;

//             if (resData.error === "none") {
//                 shared.mCustomerDetailsJSON = resData;

//                 // Update UI
//                 document.getElementById("loggedUserName").textContent = `Hello, ${shared.mCustomerDetailsJSON.firstName}`;

//                 if (shared.mCustomerDetailsJSON.image?.startsWith("http")) {
//                     document.getElementById("userIcon").innerHTML = `
//                         <img src="${shared.mCustomerDetailsJSON.image}" 
//                              style="width:100%; height:100%; object-fit:cover; border-radius: 20px;" />
//                         <div id="onlineDotOverlay" class="notificationOverlayClass"></div>
//                     `;
//                 }

//                 document.getElementById("logoutUserMessage").textContent =
//                     `${shared.mCustomerDetailsJSON.firstName}, you are currently logged in.`;

//                 closeLoginWindow();
//                 updateHomeButtonAcccess();
//                 //stopAppIdleTimer();

//                 if (!deviceInfo) {
//                     console.log("calling function check device registration");
//                     // await checkDeviceRegistration();
//                 }

//                // await getUserNotifications();

//                 if (typeof callback === "function") {
//                     callback(true);
//                 }

//             } else {
//                 showDialog("Invalid userid/password!");
//                 if (typeof callback === "function") {
//                     callback(false);
//                 }
//             }
//         } else {
//             console.warn("[doLogin] Invalid response format or missing data from server.");
//             showDialog("Login failed. Please try again.");
//         }
//     } catch (error) {
//         console.error("[doLogin] Login request failed!", error);
//         apiRequestFailed(error, "login");
//         showDialog("An error occurred while logging in.");
//     }
// }

export function doLogin(callback) {
    console.log("🟢 [doLogin] Starting login process...");

    const theUserName = document.getElementById("homeloginuserName").value.trim();
    const thePassword = document.getElementById("homeloginpassword").value.trim();
    console.log("👤 [doLogin] Entered Username:", theUserName);
    console.log("🔑 [doLogin] Entered Password:", thePassword ? "******" : "(empty)");

    if (!theUserName || !thePassword) {
        console.warn("⚠️ [doLogin] Username or password is missing!");
        showDialog("Username and password are required!");
        return;
    }

    const data = { userName: theUserName, password: thePassword };
    console.log("📦 [doLogin] Payload Data:", data);

    const url = constructUrl("/api/login");
    console.log("🌐 [doLogin] API URL:", url);

    // Build request with headers, token, etc.
    RequestOptions(url, "POST", data)
        .then((requestOptions) => {
            console.log("📝 [doLogin] Request Options:", requestOptions);

            if (!requestOptions) {
                console.warn("⛔ [doLogin] Request aborted - Missing request options.");
                return;
            }

            // Send API request
            return Http.request(requestOptions);
        })
        .then((response) => {
            if (!response) return;

            console.log("📩 [doLogin] Raw Response:", response);

            // Validate API response
            if (isValidResponse(response, "login") && response.data) {
                console.log("✅ [doLogin] Response is valid.");
                const resData = typeof response.data === "string"
                    ? JSON.parse(response.data)
                    : response.data;
                console.log("📊 [doLogin] Parsed Response Data:", resData);

                if (resData.error === "none") {
                    console.log("🎉 [doLogin] Login Successful for User:", resData.firstName);

                    shared.mCustomerDetailsJSON = resData;
                    console.log("🗂 [doLogin] Stored Customer Details:", shared.mCustomerDetailsJSON);

                    // Update UI
                    document.getElementById("loggedUserName").textContent =
                        `Hello, ${shared.mCustomerDetailsJSON.firstName}`;

                    if (shared.mCustomerDetailsJSON.image?.startsWith("http")) {
                        console.log("🖼 [doLogin] User Image Found:", shared.mCustomerDetailsJSON.image);
                        document.getElementById("userIcon").innerHTML = `
                            <img src="${shared.mCustomerDetailsJSON.image}" 
                                 style="width:100%; height:100%; object-fit:cover; border-radius: 20px;" />
                            <div id="onlineDotOverlay" class="notificationOverlayClass"></div>
                        `;
                    } else {
                        console.log("🚫 [doLogin] No valid user image found.");
                    }

                    document.getElementById("logoutUserMessage").textContent =
                        `${shared.mCustomerDetailsJSON.firstName}, you are currently logged in.`;

                    console.log("🔄 [doLogin] Updating UI after successful login...");
                    closeLoginWindow();
                    updateHomeButtonAcccess();
                     stopAppIdleTimer();

                    if (!deviceInfo) {
                        console.log("📡 [doLogin] Device info missing → Checking device registration...");
                        // checkDeviceRegistration();
                    }

                    // getUserNotifications();

                    if (typeof callback === "function") {
                        console.log("📞 [doLogin] Executing callback with success = true");
                        callback(true);
                    }

                } else {
                    console.warn("❌ [doLogin] Login Failed: Invalid userid/password!", resData);
                    showDialog("Invalid userid/password!");
                    if (typeof callback === "function") {
                        console.log("📞 [doLogin] Executing callback with success = false");
                        callback(false);
                    }
                }
            } else {
                console.warn("⚠️ [doLogin] Invalid response format or missing data from server.", response);
                showDialog("Login failed. Please try again.");
            }
        })
        .catch((error) => {
            console.error("🔥 [doLogin] Login request failed!", error);
            apiRequestFailed(error, "login");
            showDialog("An error occurred while logging in.");
        });
}


// async function doLogin(callback) {
//     try {
//         console.log("🟢 [doLogin] Starting login process...");

//         const theUserName = document.getElementById("homeloginuserName").value.trim();
//         const thePassword = document.getElementById("homeloginpassword").value.trim();
//         console.log("👤 [doLogin] Entered Username:", theUserName);
//         console.log("🔑 [doLogin] Entered Password:", thePassword ? "******" : "(empty)"); // mask password

//         if (!theUserName || !thePassword) {
//             console.warn("⚠️ [doLogin] Username or password is missing!");
//             showDialog("Username and password are required!");
//             return;
//         }

//         const data = { userName: theUserName, password: thePassword };
//         console.log("📦 [doLogin] Payload Data:", data);

//         const url = constructUrl("/api/login");
//         console.log("🌐 [doLogin] API URL:", url);

//         // Build request with headers, token, etc.
//         const requestOptions = await RequestOptions(url, "POST", data);
//         console.log("📝 [doLogin] Request Options:", requestOptions);

//         if (!requestOptions) {
//             console.warn("⛔ [doLogin] Request aborted - Missing request options.");
//             return;
//         }

//         // Send API request
//         const response = await Http.request(requestOptions);
//         console.log("📩 [doLogin] Raw Response:", response);

//         // Validate API response
//         if (isValidResponse(response, "login") && response.data) {
//             console.log("✅ [doLogin] Response is valid.");
//             const resData = typeof response.data === "string" ? JSON.parse(response.data) : response.data;
//             console.log("📊 [doLogin] Parsed Response Data:", resData);

//             if (resData.error === "none") {
//                 console.log("🎉 [doLogin] Login Successful for User:", resData.firstName);

//                 shared.mCustomerDetailsJSON = resData;
//                 console.log("🗂 [doLogin] Stored Customer Details:", shared.mCustomerDetailsJSON);

//                 // Update UI
//                 document.getElementById("loggedUserName").textContent = `Hello, ${shared.mCustomerDetailsJSON.firstName}`;

//                 if (shared.mCustomerDetailsJSON.image?.startsWith("http")) {
//                     console.log("🖼 [doLogin] User Image Found:", shared.mCustomerDetailsJSON.image);
//                     document.getElementById("userIcon").innerHTML = `
//                         <img src="${shared.mCustomerDetailsJSON.image}" 
//                              style="width:100%; height:100%; object-fit:cover; border-radius: 20px;" />
//                         <div id="onlineDotOverlay" class="notificationOverlayClass"></div>
//                     `;
//                 } else {
//                     console.log("🚫 [doLogin] No valid user image found.");
//                 }

//                 document.getElementById("logoutUserMessage").textContent =
//                     `${shared.mCustomerDetailsJSON.firstName}, you are currently logged in.`;

//                 console.log("🔄 [doLogin] Updating UI after successful login...");
//                 closeLoginWindow();
//                 updateHomeButtonAcccess();
//                 // stopAppIdleTimer();

//                 if (!deviceInfo) {
//                     console.log("📡 [doLogin] Device info missing → Checking device registration...");
//                     // await checkDeviceRegistration();
//                 }

//                 // await getUserNotifications();

//                 if (typeof callback === "function") {
//                     console.log("📞 [doLogin] Executing callback with success = true");
//                     callback(true);
//                 }

//             } else {
//                 console.warn("❌ [doLogin] Login Failed: Invalid userid/password!", resData);
//                 showDialog("Invalid userid/password!");
//                 if (typeof callback === "function") {
//                     console.log("📞 [doLogin] Executing callback with success = false");
//                     callback(false);
//                 }
//             }
//         } else {
//             console.warn("⚠️ [doLogin] Invalid response format or missing data from server.", response);
//             showDialog("Login failed. Please try again.");
//         }
//     } catch (error) {
//         console.error("🔥 [doLogin] Login request failed!", error);
//         apiRequestFailed(error, "login");
//         showDialog("An error occurred while logging in.");
//     }
// }

export function apiRequestFailed(jqXHR, apiFunctionName) {
    apiResponseCodeMessage(jqXHR.status, apiFunctionName);
    $('#loadingmessage').hide();
    // console.log(apiFunctionName + " Failed: " + JSON.stringify(jqXHR));
    console.log(apiFunctionName + " Failed!");
    // Add log response data 
    showDialog("Something went wrong!\nStatus: "+jqXHR.status+" - "+jqXHR.statusText+"\nModule: "+apiFunctionName);

}

function apiResponseCodeMessage(code, apiName) {
    var message = "Status: ";
    if (code == 500) {
        message = "Server Error!";
    } else if (code == 403) {
        message = "Non-authoritative Information";
    } else if (code == 502) {
        message = "Bad Gateway";
    } else if (code == 599) {
        message = "Network Connect Timeout Error";
    } else if (code == 200) {
        message = "Success";
    } else if (code == 0) {
        message = "Not Supported";
    }
    message += " : " + code + " API: " + apiName;
    console.log(message);
}

window.viewLogin = viewLogin;
window.viewLogout = viewLogout;
window.doLogin = doLogin;
window.closeLoginWindow = closeLoginWindow;
window.closeLogoutWindow = closeLogoutWindow;
window.doLogout = doLogout;
window.viewSystem = viewSystem;
window.doSystemLogin = doSystemLogin;
window.systemLoginError = systemLoginError;
window.closeSystemLoginWindow = closeSystemLoginWindow;