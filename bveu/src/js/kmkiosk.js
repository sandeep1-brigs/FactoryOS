import { Filesystem, Directory, Encoding } from "@capacitor/filesystem";
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';
import { Device } from "@capacitor/device"
import { Http } from '@capacitor-community/http';
import { Network } from '@capacitor/network';
import { App } from '@capacitor/app';
import $ from 'jquery';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import QRCode from "qrcodejs2-fix";


import { shared, appUrl, s3PrivateUrl, s3PublicUrl} from "./globals.js";
import { displaySection, buildRequestOptions, isValidResponse, showConfirmDialog} from "./capacitor-welcome.js";
import { showDialog, updateAppRuntime, highlightHeaderTabMenu, fixModuleHeight, constructUrl, getSignedUrl, pauseVideos, initPinchZoom} from "./utility.js";
import { getMenuBar, getNewToken, viewHome} from "./settings.js";
import { apiRequestFailed ,closeLoginWindow } from './auth.js';
import { exitModules , viewContent } from "./content.js";
import { createList } from './list.js';
import { viewPdfFile } from './pdfviewer.js';
import { openTab } from './assetmate.js';

/****************************************************************************************************
 * File: kmkiosk.js
 * Description:
 *     This module controls Kiosk Mode operations including:
 *     - Displaying kiosk menus (online/offline)
 *     - Managing user registration and login
 *     - QR scanning for visitor identification
 *     - Image capture, OTP verification, and file operations
 *
 * Author: [Your Name or Team]
 * Last Updated: 2025-10-25
 ****************************************************************************************************/


// ==================================================================================================
// GLOBAL VARIABLES
// ==================================================================================================
let kmUserCategory;
let kmkioskConfiguration = null;
let currentCourseDetail = null;
let questions = [];
let kmkioskRegistrations = null;
let kmkioskRegistrationFileEntry = null;
let kmkioskUsercourseFileEntry = null;
let kmkioskUsercourses = null;
let currentUserDetail = null;
let kmkioskUserassessmentFileEntry = null;
let kmkioskUserassessments = null;
let currentUserAssessmentState = null;
let QRScaned = false;
let networkOffline = false;
var unsavedData = false;
var listItems = [];
let userCategory = "user";
var courseContentStatus = null;
var testContent = JSON.parse(null);
var testQuestions = JSON.parse(null);
var assessmentResult = JSON.parse(null);
var questionCount = 0;
var timeLimit = 0;
var countDownTimer;
var qSequence = [];

// ==================================================================================================
// CONSTANTS
// ==================================================================================================
/**
 * Key mapping used to minimize QR data payloads.
 * Enables compact encoding of registration data into QR format.
 */
const keyMap = {
    kmregusercategory: "uc",
    kmregusername: "n",
    kmregpincode: "pc",
    kmregemployeeid: "eid",
    kmreguseremail: "e",
    kmreguserphone: "ph",
    kmreguserbloodgroup: "b",
    kmregusercompany: "c",
    kmregaddress1: "a1",
    kmregaddress2: "a2",
    kmregcity: "ct",
    kmregstate: "st",
    kmregcountry: "co",
    kmregzipcode: "z",
    kmregvisiteename: "v",
    kmregvisiteedepartment: "d",
    kmregstartdate: "sd",
    kmregenddate: "ed",
    timestamp: "t",
    kmreguserImage: "img",
    deviceSerialNumber: "ds"
};


// ==================================================================================================
// KIOSK SCREEN DISPLAY FUNCTIONS
// ==================================================================================================

/****************************************************************************************************
 * Function: displayKmkioskScreen
 * Purpose:
 *     Initializes and displays the main Kiosk Mode screen.
 *     Loads configuration files, hides login, and reveals kiosk UI.
 ****************************************************************************************************/
export function displayKmkioskScreen(QRScan = false) {
    QRScaned = QRScan;
    shared.currentRunningApp = 'kmkiosk';
    closeLoginWindow();
    displaySection('modulesSection', 'flex', false, true);
    $("#loadingSpinner").show();
    getKioskConfigurationFromFile();
}


/****************************************************************************************************
 * Function: displayKmkioskMenu
 * Purpose:
 *     Renders the main Kiosk Menu screen.
 *     Chooses between online/offline layouts based on connectivity.
 ****************************************************************************************************/
function displayKmkioskMenu() {
    $("#loadingSpinner").hide();
    if(QRScaned == false) {
        $("#modulesMenuArea").show();
        $("#modulesListArea").hide();
        $("#modulesDisplayArea").hide();
    }

    // If customer data available and network online
    if (shared.mCustomerDetailsJSON !== null && networkOffline === false) {
        displayKmkioskOnlineMenu();
    } else {
        displayKmkioskOfflineMenu();
    }
}


/****************************************************************************************************
 * Function: displayKmkioskOnlineMenu
 * Purpose:
 *     Builds and displays the Kiosk Menu layout for Online Mode.
 *     Pulls screen and menu configuration from the CMS JSON.
 ****************************************************************************************************/
function displayKmkioskOnlineMenu() {
    shared.currentState = "kmkioskMenu";
    let htmlContent = "";
    const kmkioskScreenSource = shared.cmsJSON.cmsJSONdata.kmkioskScreen;

    // Loop through kiosk sections defined in CMS JSON
    $.each(kmkioskScreenSource.sectionList, function (key, section) {
        if (section.content.length) {
            htmlContent += section.content;
        } else if (section.sectionStyle) {
            htmlContent += `<div style="${section.content}">`;

            // Render Menus
            if (section.menuList.length) {
                $.each(section.menuList, function (key, menu) {
                    htmlContent += getMenuBar(menu, "");
                });
            }

            // Render Overlays
            if (section.overlayList.length) {
                $.each(section.overlayList, function (key, overlay) {
                    htmlContent += overlay.htmlContent;
                });
            }

            // Add search bar
            htmlContent += `
                <div class="searchArea">
                    <div class="searchBox" id="assetmate_searchbox"></div>
                </div>
            `;

            htmlContent += `</div>`;
        }
    });

    $("#modulesMenuArea").html(htmlContent);
}


/****************************************************************************************************
 * Function: displayKmkioskOfflineMenu
 * Purpose:
 *     Builds the Kiosk Menu layout for Offline Mode using stored configuration.
 *     Displays available user categories as selectable buttons.
 ****************************************************************************************************/
function displayKmkioskOfflineMenu() {
    shared.currentState = "kmkioskMenu";
    let htmlContent = '';
    const solutionsScreenSource = shared.cmsJSON.cmsJSONdata.kmkioskScreen;

    $.each(solutionsScreenSource.sectionList, function (sectionIndex, section) {
        if (section.content.length) {
            htmlContent += section.content;
            if (sectionIndex === solutionsScreenSource.sectionList.length - 1) {
                $("#modulesMenuArea").html(htmlContent);
            }
        } else if (section.sectionStyle) {
            htmlContent += `<div style="${section.sectionStyle}">`;

            const kmKioskCategories = kmkioskConfiguration.config.kmkioskusercategoryList;
            const menuSource = section.menuList[0];

            // Start Menu Wrapper
            htmlContent += `
                <div class="menu ${menuSource.menuClass}">
                    <div class="${menuSource.menuBtnAreaTitleClass}" style="padding: 25px 0 10px 30px;">
                        Please select your category to begin
                    </div>
                    <div class="${menuSource.menuBtnAreaClass}" id="homemenu_kmkiosk">
            `;

            // Create buttons dynamically for each user category
            $.each(kmKioskCategories, function (btnIndex, val) {
                const style = val.categoryBtnStyles ? `style="${val.categoryBtnStyles}"` : "";
                htmlContent += `
                    <button
                        id="btnId_${val.usercategory}"
                        data-clickaction="${val.usercategory}"
                        onclick="viewKmkioskRegistrationPage('${val.usercategory.toUpperCase()}', {})"
                        class="menuBtn ${menuSource.btnClass}"
                        ${style}>
                        <span id="btnIcon_${val.usercategory}" class="${menuSource.iconClass}">
                            ${val.categoryIcon}
                        </span>
                        <p id="btnText_${val.usercategory}" class="${menuSource.btnTextClass}">
                            ${val.usercategory}
                        </p>
                    </button>
                `;

                // Finalize last section
                if (btnIndex === kmKioskCategories.length - 1) {
                    htmlContent += `
                            </div>
                        </div>
                    </div>
                    `;
                    if (sectionIndex === solutionsScreenSource.sectionList.length - 1) {
                        $("#modulesMenuArea").html(htmlContent);
                        getKmkioskBanner();
                    }
                }
            });
        }
    });
}


/****************************************************************************************************
 * Function: getKmkioskBanner
 * Purpose:
 *     Displays a banner at the top of the kiosk screen.
 *     Checks for a locally cached banner, else loads a configured or default remote banner.
 ****************************************************************************************************/



async function getKmkioskBanner() {
  const relativeDir = shared.systemConfiguration.systemInfo.localAppFolderDigiSign + "/contents/";
  const bannerFileName = "banner_kmkiosk.jpg";
  const localDirPath = relativeDir + bannerFileName;

  const configuredBannerUrl = kmkioskConfiguration.config.kmkioskconfig.bannerUrl;
  const defaultBannerUrl = "https://bviucp.s3.ap-south-1.amazonaws.com/assets/asset_images/banner_kmkiosk.jpg";

  try {
    // Try to read the local file
    const fileResult = await Filesystem.readFile({
      path: localDirPath,
      directory: Directory.Data, // Equivalent to cordova.file.dataDirectory
    });

    console.log("✅ Local banner found:", localDirPath);

    // Convert file to base64 URL and load
    const bannerSrc = `data:image/jpeg;base64,${fileResult.data}`;
    document.getElementById("solutionsSectionBanner").innerHTML =
      `<img style="width:100%;object-fit:cover;height:-webkit-fill-available;" src="${bannerSrc}">`;

  } catch (error) {
    console.warn("⚠️ Local banner not found:", error);

    // Fallback to remote or default banners
    if (configuredBannerUrl) {
      console.log("Using configured remote banner:", configuredBannerUrl);
      document.getElementById("solutionsSectionBanner").innerHTML =
        `<img style="width:100%;object-fit:cover;height:-webkit-fill-available;" src="${configuredBannerUrl}">`;
    } else {
      console.log("ℹ️ No banner configured, using default banner.");
      document.getElementById("solutionsSectionBanner").innerHTML =
        `<img style="width:100%;object-fit:cover;height:-webkit-fill-available;" src="${defaultBannerUrl}">`;
    }
  }
}


/****************************************************************************************************
 * Function: exitKmkiosk
 * Purpose:
 *     Resets all Kiosk-related global variables and gracefully exits the Kiosk module.
 ****************************************************************************************************/
function exitKmkiosk() {
    kmUserCategory = null;
    kmkioskConfiguration = null;
    currentCourseDetail = null;
    questions = [];
    kmkioskRegistrations = null;
    kmkioskRegistrationFileEntry = null;
    kmkioskUsercourseFileEntry = null;
    kmkioskUsercourses = null;
    currentUserDetail = null;
    exitModules();
}

/****************************************************************************************************
 * Function: displayLocalUserImage
 * Purpose:
 *     Safely displays a locally stored user image in the webview.
 *     Resolves "file:///" paths into valid accessible URLs for the <img> tag.
 *
 * @param {string} filePath - Local file URI of the image.
 * @param {string} imgElementId - ID of the <img> element to display the image in.
 ****************************************************************************************************/

async function displayLocalUserImage(filePath, imgElementId) {
  const imgEl = document.getElementById(imgElementId);
  if (!imgEl) {
    console.error("Image element not found:", imgElementId);
    return;
  }

  if (!filePath) {
    console.warn("Invalid or empty file path:", filePath);
    return;
  }

  try {
    // Remove "file://" prefix if it exists (Capacitor expects just the relative path)
    const cleanPath = filePath.replace(/^file:\/\//, '');

    // Try reading the local image file
    const fileResult = await Filesystem.readFile({
      path: cleanPath,
      directory: Directory.Data, // Maps to app's internal storage
    });

    // Convert Base64 to data URL
    const imageSrc = `data:image/jpeg;base64,${fileResult.data}`;

    // Assign to the image element
    imgEl.src = imageSrc;

    imgEl.onload = () => console.log("✅ Image loaded successfully");
    imgEl.onerror = e => console.error("❌ Failed to load image", e);

    console.log("Resolved image path via Capacitor:", cleanPath);

  } catch (error) {
    console.error("Failed to read local image file:", error);
  }
}

function handleKmkioskQrCode(data) {
    $("#modulesMenuArea").hide();
    $("#modulesListArea").hide();
    $("#modulesDisplayArea").show();
    shared.currentState = "kmkioskUserDetail";

    try {
        const obj = typeof data === 'string' ? JSON.parse(data) : data;
        const u = obj?.u;
        if (!u) throw new Error("Invalid QR data");


        const address = [u.a1, u.a2, u.ct, u.st, u.co, u.z]
            .filter(Boolean)
            .join(", ");

        const startDate = new Date(u.sd).toLocaleString();
        const endDate = new Date(u.ed).toLocaleString();
        const trainingName = obj.tr ? obj.tr.trim() : null;
        const category = obj.cat;

        let htmlContent = `
        <div class="kiosk-container" style="
            display:flex;
            justify-content:center;
            align-items:flex-start;
            min-height:100vh;
            background:linear-gradient(135deg,#1976d2,#42a5f5);
            font-family:'Segoe UI',sans-serif;
            color:#333;
            padding:20px;
        ">
            <div class="kiosk-card" style="
                background:#fff;
                border-radius:20px;
                box-shadow:0 10px 30px rgba(0,0,0,0.2);
                max-width:600px;
                width:100%;
                padding:30px;
                animation:fadeIn 0.6s ease;
                position:relative;
                overflow:hidden;
            ">
                <div style="text-align:center;margin-bottom:25px;">
                    <h2 style="color:#1976d2;font-size:26px;margin-bottom:8px;display:flex;align-items:center;justify-content:center;gap:8px;">
                        <span class="material-symbols-outlined" style="font-size:28px;">badge</span>
                        ${category}
                    </h2>

                    ${
                        trainingName
                            ? `
                        <div style="
                            display:inline-flex;
                            align-items:center;
                            background:#e8f5e9;
                            color:#2e7d32;
                            border-radius:20px;
                            padding:6px 14px;
                            font-size:14px;
                            margin-top:8px;
                            box-shadow:0 2px 6px rgba(46,125,50,0.2);
                            font-weight:500;
                        ">
                            <span class="material-symbols-outlined" style="font-size:18px;margin-right:5px;">verified</span>
                            Training Completed: ${trainingName}
                        </div>`
                            : ""
                    }
                </div>

                <div style="line-height:1.8;font-size:16px;">
                    <p><span class="material-symbols-outlined" style="font-size:17px;vertical-align:middle;color:#1976d2;">person</span>
                        <strong>${u.n.trim()}</strong></p>

                    <p><span class="material-symbols-outlined" style="font-size:17px;vertical-align:middle;color:#1976d2;">business</span>
                        ${u.c}</p>

                    <p><span class="material-symbols-outlined" style="font-size:17px;vertical-align:middle;color:#1976d2;">mail</span>
                        ${u.e}</p>

                    <p><span class="material-symbols-outlined" style="font-size:17px;vertical-align:middle;color:#1976d2;">call</span>
                        ${u.ph}</p>

                    <p><span class="material-symbols-outlined" style="font-size:17px;vertical-align:middle;color:#1976d2;">bloodtype</span>
                        ${u.b}</p>

                    <hr style="margin:20px 0;border:none;border-top:1px solid #eee;">`;
                    
                    if(address && address.length > 0) {
                        htmlContent += `<p><span class="material-symbols-outlined" style="font-size:17px;vertical-align:middle;color:#1976d2;">location_on</span>
                            ${address}</p>
                        <hr style="margin:20px 0;border:none;border-top:1px solid #eee;">`;
                    }

                    if(u.v.length > 0) {
                        htmlContent += `
                        <p><span class="material-symbols-outlined" style="font-size:17px;vertical-align:middle;color:#1976d2;">supervisor_account</span>
                            Visiting <strong>${u.v}</strong> (${u.d})</p>

                        <p><span class="material-symbols-outlined" style="font-size:17px;vertical-align:middle;color:#1976d2;">schedule</span>
                            From: ${startDate}</p>

                        <p><span class="material-symbols-outlined" style="font-size:17px;vertical-align:middle;color:#1976d2;">event_available</span>
                            To: ${endDate}</p>`;
                    }

                htmlContent += `
                </div>

                <div style="text-align:center;margin-top:30px;">
                    <button id="closeKioskView" style="
                        background:#1976d2;
                        color:#fff;
                        border:none;
                        border-radius:8px;
                        padding:12px 25px;
                        font-size:16px;
                        cursor:pointer;
                        box-shadow:0 4px 10px rgba(25,118,210,0.3);
                        transition:all 0.2s ease;
                        display:flex;
                        align-items:center;
                        justify-content:center;
                        gap:5px;
                        margin:0 auto;
                    " onmouseover="this.style.background='#155cc1'" onmouseout="this.style.background='#1976d2'">
                        <span class="material-symbols-outlined" style="font-size:20px;">close</span>
                        Close
                    </button>
                </div>
            </div>
        </div>

        <style>
        @keyframes fadeIn {
            from {opacity:0; transform:translateY(20px);}
            to {opacity:1; transform:translateY(0);}
        }
        </style>
        `;

        $('#modulesDisplayArea').html(htmlContent);

        $('#closeKioskView').on('click', function() {
            $('#modulesDisplayArea').html('');
            shared.currentState = '';
        });

    } catch (err) {
        console.error("Error in handleKmkioskQrCode:", err);
        $('#modulesDisplayArea').html(`<p style="color:red;text-align:center;">Invalid QR data</p>`);
    }
}


/****************************************************************************************************
 * Function: viewKmkioskRegistrationPage
 * Purpose:
 *     Displays the user registration form for the selected category (Visitor, Employee, Contractor, etc.).
 *     Dynamically builds the registration UI based on configuration and user type.
 *     Handles both new registration and existing user data population.
 *
 * @param {string} userCategory - Category of the user (VISITOR / EMPLOYEE / CONTRACTOR / DRIVER).
 * @param {object} regData - Pre-existing registration data, if available.
 ****************************************************************************************************/

function viewKmkioskRegistrationPage(userCategory, regData) {
    shared.currentState = "kmkioskUserRegistration";
    unsavedData = true;
    kmUserCategory = userCategory;

    let htmlContent = "";
    $("#modulesMenuArea").hide();
    $("#modulesListArea").hide();
    $("#modulesDisplayArea").show();

    // Prepare registration container sections
    htmlContent += `
        <div id="kmkioskRegistrationArea" style="width: 100%; background-color: var(--primary-white); padding-bottom: 30px;"></div>
        <div id="kmkioskRegistrationImageArea" style="width: 100%; background-color: var(--primary-white); padding-bottom: 30px;"></div>
        <div id="kmkioskLoginArea" style="width: 100%; background-color: var(--primary-white); padding-bottom: 30px;"></div>
        <div id="kmkioskOTPArea" style="width: 100%; background-color: var(--primary-white); padding-bottom: 30px;"></div>
    `;
    $('#modulesDisplayArea').html(htmlContent);

    // Build form content
    htmlContent = `
        <div id="registrationform" style="width: 100%; background-color: var(--primary-white); padding-bottom: 30px;">
            <div style="width: 90%; margin: 0 5%; text-align: center; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(0,0,0,0.1);">
                ${regData && regData.kmreguserphone
                    ? '<div class="displayTitleClass" style="border: none;">EXISTING REGISTRATION</div>'
                    : '<div class="displayTitleClass" style="border: none;">REGISTRATION</div><div class="clickable" style="display: flex; align-items: center;" onclick="kmkioskRegisteredLogin()"><div style="padding: 5px;">Already registered</div><div class="kmkioskBtnStyle">Login</div></div>'}
            </div>
    `;

    // Core form start
    htmlContent += `
        <div style="width: 90%; margin: 10px 5%;">
            <div class="kmkioskFormBlock">
                <input type="hidden" class="formvalue" id="kmregusercategory" value="${userCategory}" />
    `;

    // Add existing image preview area if found
    if (regData && regData.kmreguserImage) {
        htmlContent += `
            <div style="display: grid; grid-template-columns: 30% 70%; background-color: rgb(240,240,240); border-radius: 5px;">
                <div>
                    <input id="kmkioskexistingimage" style="display:none;" value="${regData.kmreguserImage}" />
                    <div style="margin:15px 5%;">
                        <img id="kmregimagepreview" alt="Profile Image" style="max-width:350px; max-height:350px; width: 100%; border-radius: 5px;">
                    </div>
                </div>
                <div style="padding-left: 10px;">
        `;
    }

    // Common credential fields
    htmlContent += `
        <div style="margin: 15px 0 5px 0; font-weight: bold;">Credentials</div>
        <input class="formvalue" type="text" style="width: 100%; text-align: left; padding: 5px 10px;" id="kmregusername" placeholder="Full Name" pattern=".{4,100}" maxlength="100" title="At least 4 characters." required>
    `;

    // Password/PIN handling based on configuration
    if (kmkioskConfiguration.loginVerificationEnabled === true) {
        if (kmkioskConfiguration.loginVerificationOption === 1) {
            htmlContent += `
                <div class="kmkioskFormRow">
                    <input class="formvalue" type="password" style="width: 100%; text-align: left; padding: 5px 10px;" id="kmregpincode" placeholder="Password/Pincode" maxlength="50">
                    <input type="password" style="width: 100%; text-align: left; padding: 5px 10px;" id="kmregpincodeconfirm" placeholder="Confirm Password/Pincode" maxlength="50">
                </div>
            `;
        } else {
            htmlContent += `<input class="formvalue" type="hidden" id="kmregpincode">`;
        }
    } else {
        htmlContent += `<input class="formvalue" type="hidden" id="kmregpincode">`;
    }

    // Category-specific fields (Employee, Visitor, Contractor, etc.)
    if (kmUserCategory === 'EMPLOYEE') {
        // Employee fields
        htmlContent += `
            <input class="formvalue" type="hidden" id="kmregusercompany">
            <div class="kmkioskFormRow">
                <input class="formvalue" type="text" id="kmregvisiteedepartment" placeholder="Department" />
                <input class="formvalue" type="text" id="kmregemployeeid" placeholder="Employee ID" />
            </div>
            <div class="kmkioskFormRow">
                <input class="formvalue" type="text" id="kmreguseremail" placeholder="Email" pattern="[a-z0-9._%+-]+@[a-z0-9.-]+\\.[a-z]{2,}$" title="Must be a valid Email ID" maxlength="50">
                <input class="formvalue" type="tel" id="kmreguserphone" placeholder="Phone" pattern=".{6,15}" maxlength="15" required>
            </div>
            <input class="formvalue" type="hidden" id="kmreguserbloodgroup">
        `;
        if (regData && regData.kmreguserImage) htmlContent += '</div>';
        htmlContent += '</div>';

        htmlContent += `
            <input type="hidden" class="formvalue" id="kmregaddress1">
            <input type="hidden" class="formvalue" id="kmregaddress2">
            <input type="hidden" class="formvalue" id="kmregcity">
            <input type="hidden" class="formvalue" id="kmregstate">
            <input type="hidden" class="formvalue" id="kmregcountry">
            <input type="hidden" class="formvalue" id="kmregzipcode">
            <input type="hidden" class="formvalue" id="kmregvisiteename">
            <input type="hidden" class="formvalue" id="kmregstartdate">
            <input type="hidden" class="formvalue" id="kmregenddate">
        `;
    } else {
        // Non-Employee (Visitor, Contractor, etc.) – show company and address fields
        htmlContent += `
            <div class="kmkioskFormRow">
                <input class="formvalue" type="text" id="kmreguseremail" placeholder="Email" pattern="[a-z0-9._%+-]+@[a-z0-9.-]+\\.[a-z]{2,}$" maxlength="50">
                <input class="formvalue" type="tel" id="kmreguserphone" placeholder="Phone" pattern=".{6,15}" maxlength="15" required>
            </div>
            <div class="kmkioskFormRow">
                <input class="formvalue" type="text" id="kmreguserbloodgroup" placeholder="Blood Group" maxlength="5">
                <input class="formvalue" type="text" id="kmregusercompany" placeholder="Company Name" maxlength="100" title="At least 4 characters.">
            </div>
        `;
        if (regData && regData.kmreguserImage) htmlContent += '</div>';
        htmlContent += '</div>';
    }

    // Add contact section for visitors/contractors
    if (kmUserCategory === 'VISITOR' || kmUserCategory === 'CONTRACTOR') {
        htmlContent += `
            <div class="kmkioskFormBlock">
                <div class="kmkioskFormRow">
                    <input class="formvalue" type="text" id="kmregaddress1" placeholder="Address Line 1" maxlength="150">
                    <input class="formvalue" type="text" id="kmregaddress2" placeholder="Address Line 2" maxlength="150">
                </div>
                <div class="kmkioskFormRow">
                    <div class="kmkioskFormRow">
                        <input class="formvalue" type="text" id="kmregcity" placeholder="City" maxlength="50">
                        <input class="formvalue" type="text" id="kmregstate" placeholder="State" maxlength="50">
                    </div>
                    <div class="kmkioskFormRow">
                        <input class="formvalue" type="text" id="kmregcountry" placeholder="Country" maxlength="50">
                        <input class="formvalue" type="text" id="kmregzipcode" placeholder="PIN Code" maxlength="15">
                    </div>
                </div>
            </div>
        `;
        htmlContent += `
            <div class="kmkioskFormBlock">
                <div style="margin: 15px 0 5px 0; font-weight: bold;">Visit Details</div>
                <div class="kmkioskFormRow">
                    ${kmUserCategory === 'VISITOR' ? '<input class="formvalue" type="text" id="kmregvisiteename" placeholder="Visitee name"/>' : '<input type="hidden" class="formvalue" id="kmregvisiteename">'}
                    <input class="formvalue" type="text" id="kmregvisiteedepartment" placeholder="Department"/>
                </div>
                <div class="kmkioskFormRow">
                    <input class="formvalue" type="datetime-local" id="kmregstartdate" placeholder="Start Date">
                    <input class="formvalue" type="datetime-local" id="kmregenddate" placeholder="End Date">
                </div>
            </div>
        `;
    } else if (kmUserCategory === 'DRIVER') {
        // Drivers: hidden visitee, but include date fields
        htmlContent += `
            <div class="kmkioskFormBlock">
                <div style="margin: 15px 0 5px 0; font-weight: bold;">Visit Details</div>
                <input type="hidden" class="formvalue" id="kmregvisiteename">
                <input type="hidden" class="formvalue" id="kmregvisiteedepartment">
                <div class="kmkioskFormRow">
                    <input class="formvalue" type="datetime-local" id="kmregstartdate" placeholder="Start Date">
                    <input class="formvalue" type="datetime-local" id="kmregenddate" placeholder="End Date">
                </div>
            </div>
        `;
    }

    // Submit button
    htmlContent += `
        <div style="width: 100%; margin-top: 20px; display: flex; justify-content: space-around; border-top: 1px solid rgba(0,0,0,0.1);">
            <div class="kmkioskBtnStyle" id="kmRegistrationSubmitBtn" onclick="kmkioskSubmitRegistrationForm()">SUBMIT</div>
        </div>
    `;

    $('#kmkioskRegistrationArea').html(htmlContent);
    $('#kmkioskRegistrationArea').show();
    $('#kmkioskRegistrationImageArea').hide();
    $('#kmkioskLoginArea').hide();
    $('#kmkioskOTPArea').hide();

    // Populate form if existing data provided
    if (regData && Object.keys(regData).length > 0) {
        for (const key in regData) {
            if (regData.hasOwnProperty(key)) {
                const inputEl = document.getElementById(key);
                if (inputEl) inputEl.value = regData[key];
            }
        }

        // Load existing image
        if (regData.kmreguserImage) {
            displayLocalUserImage(regData.kmreguserImage, "kmregimagepreview");
        }

        // Auto-fill password confirm if applicable
        if (kmkioskConfiguration.loginVerificationEnabled && kmkioskConfiguration.loginVerificationOption === 1) {
            document.getElementById("kmregpincodeconfirm").value = document.getElementById("kmregpincode").value;
        }
    }

    fixModuleHeight("modulesModuleHeader, footerSection", 20, "modulesDisplayArea");
}

/****************************************************************************************************
 * Function: kmkioskSubmitRegistrationForm
 * Purpose:
 *     Validates registration input fields before moving to image capture or OTP step.
 *     Ensures mandatory fields are filled and passwords match if required.
 ****************************************************************************************************/
function kmkioskSubmitRegistrationForm() {
    let noError = true;

    // Password/PIN validation
    if (kmkioskConfiguration.loginVerificationEnabled && kmkioskConfiguration.loginVerificationOption === 1) {
        const pass = document.getElementById('kmregpincode').value;
        const confirmPass = document.getElementById('kmregpincodeconfirm').value;

        if (!pass) {
            noError = false;
            showDialog('Error! Password/Pincode required!');
            document.getElementById('kmregpincode').classList.add("error-border");
        } else if (pass !== confirmPass) {
            noError = false;
            showDialog('Error! Password/Pincode not matching!');
            document.getElementById('kmregpincode').classList.add("error-border");
            document.getElementById('kmregpincodeconfirm').classList.add("error-border");
        } else {
            document.getElementById('kmregpincode').classList.remove("error-border");
            document.getElementById('kmregpincodeconfirm').classList.remove("error-border");
        }
    }

    // Name and phone checks
    const userName = document.getElementById('kmregusername').value;
    const userPhone = document.getElementById('kmreguserphone').value;

    if (!userName) {
        noError = false;
        showDialog('Error! User name required!');
        document.getElementById('kmregusername').classList.add("error-border");
    } else {
        document.getElementById('kmregusername').classList.remove("error-border");
    }

    if (!userPhone) {
        noError = false;
        showDialog('Error! Phone number required!');
        document.getElementById('kmreguserphone').classList.add("error-border");
    } else {
        document.getElementById('kmreguserphone').classList.remove("error-border");
    }

    // If validation passes, proceed to next step
    if (noError === true) {
        const imageArea = document.getElementById('kmregimagepreview');
        if (!imageArea || imageArea.src.trim() === "") {
            // Move to OTP or image form if no picture
            if (kmkioskConfiguration.otpEnabled === true) {
                kmkioskSendOTP(1);
            } else {
                kmkioskRegistrationImageForm();
            }
        } else {
            // If image already present, update registration directly
            kmkioskSubmitUpdatedRegistration();
        }
    }
}

/****************************************************************************************************
 * Function: kmkioskRegisteredLogin
 * Purpose:
 *     Displays the login form for already registered users.
 *     Depending on configuration, enables login via PIN or OTP.
 ****************************************************************************************************/

function kmkioskRegisteredLogin() {
    let htmlContent = `
        <div id="registrationform" style="width:100%;background-color:var(--primary-white);padding-bottom:30px;">
            <div style="width:90%;margin:0 5%;text-align:center;display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid rgba(0,0,0,0.1);">
                <div class="displayTitleClass" style="border:none;">${kmUserCategory} LOGIN</div>
            </div>
            <div id="kmkioskLoginMsg" style="width:90%;margin:10px 5%;"></div>
            <div style="width:90%;margin:10px 5%;">
                <input type="hidden" id="kmregusercategory" value=${kmUserCategory}/>
                <input class="formvalue" type="tel" id="kmloginuserphone" placeholder="Phone" pattern=".{6,15}" maxlength="15" required>
    `;

    // PIN vs OTP login handling
    if (kmkioskConfiguration.loginVerificationEnabled === true) {
        if (kmkioskConfiguration.loginVerificationOption === 2) {
            htmlContent += `
                <div style="width:100%;margin-top:20px;display:flex;justify-content:space-around;border-top:1px solid rgba(0,0,0,0.1);">
                    <div class="kmkioskBtnStyle" id="kmkioskSendOTPBtn" onclick="kmkioskSendOTP(0)">SEND OTP</div>
                </div>
            `;
        } else if (kmkioskConfiguration.loginVerificationOption === 1) {
            htmlContent += `
                <input class="formvalue" type="password" id="kmloginpassword" placeholder="Password/PIN" pattern=".{4,15}" maxlength="15" required>
                <div style="width:100%;margin-top:20px;display:flex;justify-content:space-around;border-top:1px solid rgba(0,0,0,0.1);">
                    <div class="kmkioskBtnStyle" id="kmkioskPasswordSubmitBtn" onclick="kmkioskVerifyUser()">SUBMIT</div>
                </div>
            `;
        }
    } else {
        htmlContent += `
            <div style="width:100%;margin-top:20px;display:flex;justify-content:space-around;border-top:1px solid rgba(0,0,0,0.1);">
                <div class="kmkioskBtnStyle" id="kmkioskLoginBtn" onclick="kmkioskVerifyUser()">SUBMIT</div>
            </div>
        `;
    }

    htmlContent += `</div></div>`;

    $('#kmkioskLoginArea').html(htmlContent);
    $('#kmkioskRegistrationArea').hide();
    $('#kmkioskRegistrationImageArea').hide();
    $('#kmkioskLoginArea').show();
    $('#kmkioskOTPArea').hide();
}


/****************************************************************************************************
 * Function: kmkioskVerifyUser
 * Purpose:
 *     Authenticates a registered user via phone number and PIN (if enabled).
 *     Loads user details into the system for continued interaction.
 ****************************************************************************************************/
function kmkioskVerifyUser() {
    const phone = document.getElementById('kmloginuserphone').value.trim();
    const pin = document.getElementById('kmloginpassword')
        ? document.getElementById('kmloginpassword').value.trim()
        : null;

    if (!phone) {
        showLoginError("Phone number is required", 'kmloginuserphone');
        return;
    }

    if (kmkioskRegistrationFileEntry != null && kmkioskRegistrations.length > 0) {
        const user = kmkioskRegistrations.find(u => u.kmreguserphone === phone);

        if (!user) {
            showLoginError("User not found", 'kmloginuserphone');
            return;
        }

        if (kmkioskConfiguration.config.kmkioskconfig.loginVerificationEnabled === true &&
            kmkioskConfiguration.config.kmkioskconfig.loginVerificationOption === 1) {
            if (!pin) {
                showLoginError("PIN is required", 'kmloginpassword');
                return;
            }
            if (user.pincode !== pin) {
                showLoginError("Incorrect PIN", 'kmloginpassword');
                return;
            }
        }

        console.log("✅ User verified successfully:", user);
        currentUserDetail = user;
        viewKmkioskRegistrationPage(kmUserCategory, user);
    } else {
        showLoginError("No registration data found", "kmkioskLoginMsg");
    }
}


/****************************************************************************************************
 * Function: showLoginError
 * Purpose:
 *     Displays a login error message and highlights the invalid field.
 ****************************************************************************************************/
function showLoginError(message, fieldId) {
    console.warn(message);
    if (fieldId) {
        const field = document.getElementById(fieldId);
        if (field) {
            field.style.borderColor = "red";
            setTimeout(() => field.style.borderColor = "", 2000);
        }
    }
    alert(message);
}


/****************************************************************************************************
 * Function: kmkioskSendOTP
 * Purpose:
 *     Validates phone number format and initiates OTP sending process.
 *     Moves user to the OTP verification screen.
 *
 * @param {number} newUserRegistration - 1 for new registration, 0 for existing login.
 ****************************************************************************************************/
function kmkioskSendOTP(newUserRegistration) {
    let phone = newUserRegistration === 1
        ? $('#kmreguserphone').val()
        : $('#kmloginuserphone').val();
    phone = phone.trim();

    // Clean number and validate
    const cleaned = phone.replace(/(?!^\+)\D/g, '');
    const regex = /^\+?\d{10,15}$/;

    if (regex.test(cleaned)) {
        sendOtp(cleaned);
        kmkioskOTPScreen(newUserRegistration, cleaned);
    } else {
        showDialog("Invalid phone number! Please enter a valid 10-digit phone number with or without a country code.");
    }
}


/****************************************************************************************************
 * Function: kmkioskOTPScreen
 * Purpose:
 *     Displays OTP entry screen after sending an OTP to user’s phone.
 *     Manages resend timer and optional bypass option.
 ****************************************************************************************************/
function kmkioskOTPScreen(newUserRegistration, phone) {
    const trimmedNumber = phone.slice(-4);
    let htmlContent = `
        <div id="registrationform" style="width:100%;background-color:var(--primary-white);padding-bottom:30px;">
            <div style="width:90%;margin:0 5%;text-align:center;display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid rgba(0,0,0,0.1);">
                <div class="displayTitleClass" style="border:none;">OTP</div>
            </div>
            <div style="width:90%;margin:10px 5%;">
                <div style="padding-top:20px;">An OTP has been sent to phone number xxxxxx${trimmedNumber}</div>
                <div style="width:100%;margin-top:20px;display:flex;align-items:center;">
                    <div id="countdownMsg"></div>
                    <div class="clickable" style="display:none;" id="kmkioskResendOTPBtn" onclick="kmkioskResendOTP(${newUserRegistration}, '${phone}')">Send OTP</div>
                </div>
                <input class="formvalue" type="number" id="kmloginotp" style="margin-top:20px;" placeholder="OTP" maxlength="6" required>
                <div style="width:100%;margin-top:20px;display:flex;justify-content:space-around;border-top:1px solid rgba(0,0,0,0.1);">
                    <div class="kmkioskBtnStyle" id="kmkioskSubmitOTPBtn" onclick="kmkioskSubmitOTP(${newUserRegistration}, '${phone}')">SUBMIT</div>
                </div>
                <div style="width:100%;margin-top:20px;">
                    <div style="display:inline;">Without verifying your phone number, your registration may not be saved. You will need to register again on your next visit.</div>
                    <div class="clickable" id="kmkioskLoginLoginWitoutOTPBtn" style="display:inline;padding-left:5px;" onclick="kmkioskLoginWithoutOTP(${newUserRegistration})">Continue without OTP</div>
                </div>
            </div>
        </div>
    `;

    $('#kmkioskOTPArea').html(htmlContent);
    $('#kmkioskRegistrationArea').hide();
    $('#kmkioskRegistrationImageArea').hide();
    $('#kmkioskLoginArea').hide();
    $('#kmkioskOTPArea').show();

    // Countdown for resend option
    let countdown = 60;
    const countdownMsg = document.getElementById("countdownMsg");
    const resendBtn = document.getElementById("kmkioskResendOTPBtn");

    const interval = setInterval(() => {
        countdown--;
        if (countdown > 0) {
            countdownMsg.textContent = `Resend OTP in ${countdown} seconds...`;
        } else {
            clearInterval(interval);
            resendBtn.style.display = "block";
        }
    }, 1000);
}
/****************************************************************************************************
 * Function: kmkioskRegistrationImageForm
 * Purpose:
 *     Prompts the user to capture or select an image as part of registration.
 ****************************************************************************************************/
function kmkioskRegistrationImageForm() {
    const userPhone = document.getElementById('kmreguserphone').value;
    unsavedData = true;
    const folder = shared.systemConfiguration.systemInfo.localAppFolderDigiSign + "/kmkiosk_images/";
    const fileName = "kmkiosk_" + userPhone + "_im";
    const imageQuality = parseInt(shared.systemConfiguration.systemInfo.assetMateImageQuality || 60);
    const resolution = parseInt(shared.systemConfiguration.systemInfo.assetMateImagePixel || 600);

    const htmlContent = `
        <div class="displayTitleClass" style="border-bottom:1px solid rgba(0,0,0,0.1);">VISITOR REGISTRATION</div>
        <div style="width:90%;margin:20px 5%;">
            <div style="text-align:center;padding:5px;">Visitor Image</div>
            <div style="position:relative;width:100%;min-height:100px;text-align:center;">
                <input id="kmkioskimage" style="display:none;" />
                <img id="kmkiosk_preview_image" style="max-width:100%;max-height:350px;" src="img/noimage.jpg" onerror="this.onerror=null;this.src='./img/noimage.jpg';"/>
                <div id="moduleImageButtonLayer" style="display:flex;align-items:center;justify-content:space-evenly;width:100%;height:100%;position:absolute;top:0;">
                    <div class="moduleImageButton" id="cameraButton" onclick="kmkioskCaptureImage('kmkiosk_preview_image', ${navigator.camera.PictureSourceType.CAMERA}, '${folder}', '${fileName}', ${imageQuality}, ${resolution})"><span><i class='fas fa-camera'></i></span></div>
                    <div class="moduleImageButton" id="galleryButton" onclick="kmkioskCaptureImage('kmkiosk_preview_image', ${navigator.camera.PictureSourceType.PHOTOLIBRARY}, '${folder}', '${fileName}', ${imageQuality}, ${resolution})"><span><i class='fas fa-photo-video'></i></span></div>
                </div>
            </div>
            <div style="width:100%;margin-top:20px;display:flex;justify-content:space-around;border-top:1px solid rgba(0,0,0,0.1);">
                <div class="kmkioskBtnStyle" id="vmRegistrationA1SubmitBtn" onclick="kmkioskSubmitRegistrationImage()">SUBMIT</div>
            </div>
        </div>
    `;

    $('#kmkioskRegistrationImageArea').html(htmlContent);
    $('#kmkioskRegistrationArea').hide();
    $('#kmkioskRegistrationImageArea').show();
    $('#kmkioskLoginArea').hide();
    $('#kmkioskOTPArea').hide();
}
/****************************************************************************************************
 * Function: kmkioskCaptureImage
 * Purpose:
 *     Captures or selects an image using Cordova Camera plugin and saves locally.
 ****************************************************************************************************/




async function kmkioskCaptureImage(imageElement, imageSource, folder, fileName, imageQuality, resolution) {
  try {
    if (isNaN(resolution)) resolution = 600;
    if (isNaN(imageQuality)) imageQuality = 60;

    // 🔹 Determine camera source (mimic Cordova Camera.SourceType)
    let source;
    if (imageSource === CameraSource.Camera || imageSource === 1) {
      source = CameraSource.Camera;
    } else if (imageSource === CameraSource.Photos || imageSource === 0) {
      source = CameraSource.Photos;
    } else {
      source = CameraSource.Prompt; // fallback
    }

    // 🔹 Capture image using Capacitor Camera
    const photo = await Camera.getPhoto({
      quality: imageQuality,
      source,
      resultType: CameraResultType.Base64, // we want to save to filesystem
      width: resolution,
      height: resolution,
      correctOrientation: true,
      saveToGallery: false,
    });

    console.log("📸 Image captured");

    // 🔹 Save the captured image to app's internal folder
    const base64Data = photo.base64String;
    const filePath = `${folder}/${fileName}.jpg`;

    await Filesystem.writeFile({
      path: filePath,
      data: base64Data,
      directory: Directory.Data, // same as Cordova dataDirectory
    });

    const savedPath = `data:image/jpeg;base64,${base64Data}`;
    console.log("✅ Image saved to:", filePath);

    // 🔹 Display the image on UI
    document.getElementById(imageElement).src = savedPath;
    document.getElementById("kmkioskimage").value = filePath;

  } catch (error) {
    console.error("❌ Camera or save operation failed:", error);
    showDialog("ERROR! Could not capture or save the image! " + error);
  }
}


/****************************************************************************************************
 * Function: saveImageToFolder
 * Purpose:
 *     Saves an image to the local app directory and renames it with a custom filename.
 ****************************************************************************************************/

async function saveImageToFolder(fileURI, folder, fileName, successCallback, errorCallback) {
  try {
    // Remove file:// prefix if present
    const cleanPath = fileURI.replace(/^file:\/\//, '');
    const targetPath = `${folder}/${fileName}.jpg`;

    console.log("📂 Saving image...");
    console.log("Source:", cleanPath);
    console.log("Destination:", targetPath);

    // Step 1: Read the original file (from temporary or external location)
    const fileResult = await Filesystem.readFile({
      path: cleanPath,
      directory: Directory.Data, // Adjust if file was saved elsewhere
    });

    // Step 2: Ensure target directory exists and write the new file
    await Filesystem.writeFile({
      path: targetPath,
      data: fileResult.data, // Base64 data
      directory: Directory.Data,
    });

    // Step 3: Optionally delete the original file (to mimic moveTo)
    await Filesystem.deleteFile({
      path: cleanPath,
      directory: Directory.Data,
    }).catch(() => {
      console.warn("⚠️ Could not delete original file — possibly external or readonly");
    });

    const savedPath = `${Directory.Data}/${targetPath}`;
    console.log("✅ Image moved successfully:", savedPath);

    if (successCallback) successCallback(savedPath);

  } catch (error) {
    console.error("❌ Failed to save image:", error);
    if (errorCallback) errorCallback(error);
  }
}

/****************************************************************************************************
 * Function: kmkioskSubmitRegistrationImage
 * Purpose:
 *     Stores registration form data along with user image to local storage.
 *     Called after user captures or selects their image during registration.
 ****************************************************************************************************/


async function kmkioskSubmitRegistrationImage() {
  try {
    const inputElems = document.getElementsByClassName('formvalue');
    const formData = {};

    // 📝 Collect data from form inputs
    for (let elem of inputElems) {
      if (elem.id) {
        formData[elem.id] = elem.value;
      }
    }

    formData.timestamp = Date.now();
    formData.kmreguserImage = document.getElementById('kmkioskimage').value;
    formData.deviceSerialNumber = shared.deviceSerialNumber; // ✅ Device ID

    console.log("🧾 Form Data:", JSON.stringify(formData));

    const registrationFilePath = 'kmkiosk/registrations.json'; // You can keep the same folder structure

    // 🔹 Step 1: Read existing registrations
    let existingRegistrations = [];
    try {
      const readResult = await Filesystem.readFile({
        path: registrationFilePath,
        directory: Directory.Data,
      });
      existingRegistrations = JSON.parse(readResult.data);
    } catch (readErr) {
      console.warn("ℹ️ No existing registration file found, creating new one.");
    }

    // 🔹 Step 2: Add new registration
    existingRegistrations.push(formData);

    // 🔹 Step 3: Write back to file
    await Filesystem.writeFile({
      path: registrationFilePath,
      data: JSON.stringify(existingRegistrations, null, 2),
      directory: Directory.Data,
      encoding: 'utf8',
    });

    console.log("✅ Registration saved successfully:", formData);

    // 🔹 Step 4: Update app variables (same as original)
    currentUserDetail = formData;
    kmkioskViewCourses();

  } catch (error) {
    console.error("❌ Failed saving registration data:", error);

    // Fallback: call equivalent of writeFreshRegistration()
    try {
      await writeFreshRegistration([], formData);
    } catch (fallbackErr) {
      console.error("❌ Fallback write failed:", fallbackErr);
    }
  }
}

/****************************************************************************************************
 * Function: verifyOtp
 * Purpose:
 *     Stub for OTP verification logic. Should integrate with SMS gateway in production.
 ****************************************************************************************************/
function verifyOtp() {
    return true; // placeholder
}


/****************************************************************************************************
 * Function: sendOtp
 * Purpose:
 *     Stub function for sending OTP via SMS service.
 ****************************************************************************************************/
function sendOtp(phone) {
    console.log("📲 Sending OTP to", phone);
}


/****************************************************************************************************
 * Function: kmkioskResendOTP
 * Purpose:
 *     Re-sends the OTP and reloads the OTP entry screen.
 ****************************************************************************************************/
function kmkioskResendOTP(newUserRegistration, phone) {
    sendOtp(phone);
    kmkioskOTPScreen(newUserRegistration, phone);
}


/****************************************************************************************************
 * Function: kmkioskSubmitOTP
 * Purpose:
 *     Verifies OTP and proceeds with registration or login accordingly.
 ****************************************************************************************************/
function kmkioskSubmitOTP(newUserRegistration, phone) {
    if (verifyOtp() === true) {
        if (newUserRegistration === 1) {
            kmkioskRegistrationImageForm();
        } else {
            kmkioskViewCourses();
        }
    } else {
        showDialog("Error! Incorrect OTP.");
        sendOtp(phone);
    }
}


/****************************************************************************************************
 * Function: kmkioskLoginWithoutOTP
 * Purpose:
 *     Allows user to continue without OTP verification (for offline or fallback use).
 ****************************************************************************************************/
function kmkioskLoginWithoutOTP(newUserRegistration) {
    if (newUserRegistration === 1) {
        kmkioskRegistrationImageForm();
    } else {
        kmkioskViewCourses();
    }
}
/****************************************************************************************************
 * Function: kmkioskRepairRegistration
 * Purpose:
 *     Utility function used for manually repairing or patching existing registration and course data.
 *     This is typically used for debugging or data correction when kiosk files are corrupted or incomplete.
 *
 * Notes:
 *     - Updates user registration or course state files.
 *     - Should NOT be exposed in production kiosk UI.
 ****************************************************************************************************/

async function kmkioskRepairRegistration() {
  try {
    console.log("🛠 Repairing registration...");

    // ✅ Step 1: Update course state manually (repair/debug)
    let courseState = JSON.parse(kmkioskUsercourses[0].courseState);
    courseState.contents = [
      {
        contentId: 592,
        contentName: "Visitor Training --",
        contentType: "Content",
        status: 0.9087689521760339
      },
      {
        contentId: 45,
        contentName: "Visitor quiz --",
        contentType: "Assessment",
        status: 1
      }
    ];

    kmkioskUsercourses[0].courseState = JSON.stringify(courseState);

    // ✅ Step 2: Define local user courses file path
    const userCourseFilePath = 'kmkiosk/usercourses.json';

    // ✅ Step 3: Write repaired data back to local file
    await Filesystem.writeFile({
      path: userCourseFilePath,
      data: JSON.stringify(kmkioskUsercourses, null, 2),
      directory: Directory.Data,
      encoding: 'utf8',
    });

    console.log("✅ User Courses saved successfully:", kmkioskUsercourses);

  } catch (error) {
    console.error("❌ Failed writing User Courses file:", error);
  }
}

/****************************************************************************************************
 * Function: kmkioskSubmitUpdatedRegistration
 * Purpose:
 *     Updates an existing user registration or creates a new one if not found.
 *     Ensures the most recent data is persisted in the local registration JSON.
 ****************************************************************************************************/

async function kmkioskSubmitUpdatedRegistration() {
    try {
        const inputElems = document.getElementsByClassName('formvalue');
        const formData = {};

        // Collect form inputs
        for (let elem of inputElems) {
            if (elem.id) {
                formData[elem.id] = elem.value;
            }
        }

        formData.timestamp = Date.now();
        formData.kmreguserImage = document.getElementById('kmkioskexistingimage')?.value || "";
        formData.deviceSerialNumber = shared.deviceSerialNumber; // ✅ Add device info

        // Use phone or email as unique identifier
        const uniqueId = formData.kmreguserphone || formData.kmreguseremail;
        if (!uniqueId) {
            console.error("❌ Cannot update registration: unique ID missing");
            return;
        }

        // Find existing record by phone/email
        const index = kmkioskRegistrations.findIndex(r =>
            r.kmreguserphone === uniqueId || r.kmreguseremail === uniqueId
        );

        if (index >= 0) {
            kmkioskRegistrations[index] = { ...kmkioskRegistrations[index], ...formData };
            console.log("🔁 Updated existing registration:", kmkioskRegistrations[index]);
        } else {
            console.warn("⚠️ Registration not found. Creating new entry.");
            kmkioskRegistrations.push(formData);
        }

        // Save back to local file
        const filePath = 'kmkiosk/registrations.json';

        await Filesystem.writeFile({
            path: filePath,
            data: JSON.stringify(kmkioskRegistrations, null, 2),
            directory: Directory.Data,
            encoding: Encoding.UTF8,
        });

        console.log("✅ Registration file updated successfully:", formData);
        currentUserDetail = formData;
        kmkioskViewCourses();

    } catch (err) {
        console.error("❌ Failed writing registration file:", err);

        // fallback to writing fresh registration if file doesn’t exist
        try {
            await Filesystem.writeFile({
                path: 'kmkiosk/registrations.json',
                data: JSON.stringify(kmkioskRegistrations, null, 2),
                directory: Directory.Data,
                encoding: Encoding.UTF8,
            });
            console.log("🆕 Created new registration file successfully.");
            currentUserDetail = formData;
            kmkioskViewCourses();
        } catch (fallbackErr) {
            console.error("❌ Failed creating new registration file:", fallbackErr);
        }
    }
}
/****************************************************************************************************
 * Function: writeFreshRegistration
 * Purpose:
 *     Creates a new registration file if none exists, with the first entry provided.
 ****************************************************************************************************/


async function writeFreshRegistration(fileEntry, newData) {
    try {
        // Add timestamp to the new data
        newData.timestamp = Date.now();

        // Wrap it in an array to match original behavior
        const registrations = [newData];

        // Write new JSON file
        await Filesystem.writeFile({
            path: 'kmkiosk/registrations.json',
            data: JSON.stringify(registrations, null, 2),
            directory: Directory.Data,
            encoding: Encoding.UTF8,
        });

        console.log("🆕 Created fresh registration file with first entry");

        // Maintain same logic and variables as original
        kmkioskRegistrations = registrations;
        currentUserDetail = newData;
        kmkioskViewCourses();

    } catch (err) {
        console.error("❌ Failed to write fresh registration file:", err);
    }
}
/******************************************************************************** KIOSK COURSE *******************************************************************/
/****************************************************************************************************
 * Function: kmkioskViewCourses
 * Purpose:
 *     Displays the list of courses available to the current user category.
 *     If only one course is available, opens it directly.
 ****************************************************************************************************/

function kmkioskViewCourses() {
    unsavedData = false;
    shared.currentState = "kmkioskViewCourseList";
    shared.currentSourceState = shared.currentState;

    $("#modulesMenuArea").hide();
    $("#modulesListArea").show();
    $("#modulesDisplayArea").hide();

    fixModuleHeight("modulesModuleHeader, footerSection", 30, "modulesListArea");

    // Filter course list by current user category
    const kmkioskcourseList = kmkioskConfiguration.config.kmkioskcourseList.filter(
        item => item.userCategory.toUpperCase() === kmUserCategory
    );

    if (kmkioskcourseList.length > 0) {
        let htmlContent = "";
        listItems = [];
        let pageable = null;
        let totalPages = 1;

        // More than one course → display as list
        if (kmkioskcourseList.length > 1) {
            for (let index in kmkioskcourseList) {
                const item = kmkioskcourseList[index];
                const description = item.courseDescription
                    ? `<div>${item.courseDescription}</div>`
                    : "";

                // Use provided course icon or default placeholder
                const image = (item.courseIcon && item.courseIcon.length > 0)
                    ? item.courseIcon
                    : `<img style="width: 100%;" src="./img/noimage.jpg" />`;

                const itemJson = {
                    id: item.id,
                    image: image,
                    title: item.courseName,
                    description: description,
                    clickAction: `kmkioskOpenCourse('${item.courseId}')`,
                    states: [],
                    actions: [],
                    activeActions: []
                };

                listItems.push(itemJson);

                // Generate the course list after loop completes
                if (index == kmkioskcourseList.length - 1) {
                    createList("knowledgemate", htmlContent, listItems, pageable, totalPages, "modulesListBox", "", "", "cardStyle");
                }
            }
        } else {
            // Only one course → open directly
            kmkioskOpenCourse(kmkioskcourseList[0].courseId);
        }
    }
}

/****************************************************************************************************
 * Function: kmkioskOpenCourse
 * Purpose:
 *     Opens the detailed course view for the selected course.
 *     Loads course content and initializes course tracking state.
 ****************************************************************************************************/

function kmkioskOpenCourse(courseId) {
    shared.currentState = "kmkioskViewCourse";
    shared.currentSourceState = shared.currentState;
    $("#modulesMenuArea").hide();

    // Retrieve course details from resources
    const courseDetail = kmkioskConfiguration.resources.courses.find(
        item => item.course.id === courseId
    );

    currentCourseDetail = courseDetail;
    userCategory = "kiosk";

    // Build course screen layout
    createCourseScreen(courseDetail.course);

    // Extract course content
    const courseContentList = [];
    for (let index in courseDetail.coursecontentDetailsDTOList) {
        const dto = courseDetail.coursecontentDetailsDTOList[index];
        courseContentList.push(dto.courseContent);

        // On last loop → initialize user progress
        if (index == courseDetail.coursecontentDetailsDTOList.length - 1) {
            courseContentStatus = getCourseContentStatus(currentUserDetail.kmreguserphone, currentCourseDetail);
            viewCourseContent(courseContentList, "kiosk", 0);
        }
    }
}

/****************************************************************************************************
 * Function: showKmkioskAssessment
 * Purpose:
 *     Launches the assessment view for a given assessmentId.
 *     Initializes questions, answers, timers, and previous attempt states.
 ****************************************************************************************************/

function showKmkioskAssessment(assessmentId) {
    shared.currentState = "kmkioskAssessment";
    let htmlContent = "";

    // Pause any running videos before assessment starts
    const players = document.getElementsByTagName("video");
    for (let player of players) player.pause();

    const dto = currentCourseDetail.coursecontentDetailsDTOList.find(
        item => item.courseContent.contentType.toLowerCase() === "assessment" &&
            item.assessment != null &&
            item.assessment.id === assessmentId
    );

    testContent = dto.assessment;
    const assessmentQuestionsDTOList = dto.assessmentQuestionsDTOList;
    questions = [];
    testQuestions = [];

    // Prepare questions & metadata
    if (assessmentQuestionsDTOList && assessmentQuestionsDTOList.length > 0) {
        for (let index in assessmentQuestionsDTOList) {
            const qDTO = assessmentQuestionsDTOList[index];
            testQuestions.push(qDTO.assessmentQuestion);
            questions.push(qDTO.question);

            // On last question, render UI
            if (index == assessmentQuestionsDTOList.length - 1) {
                htmlContent += `
                    <div id="contentNameField" class="titleFontClass" style="background-color: rgb(240,240,240);">
                        ${testContent.title}
                    </div>
                    <div id="contentDescriptionField" class="contentDetailText" style="padding-top:5px;">
                        ${testContent.description}
                    </div>
                `;

                // Add timer if enabled
                if (testContent.timeLimitEnable === true) {
                    htmlContent += `
                        <div class="contentDetailText" style="display:flex;align-items:center;">
                            <span class="material-symbols-outlined" style="font-size:17px;">schedule</span>
                            <div id="assessmentTime" style="padding-left:5px;">${testContent.timeLimit}</div>
                        </div>
                    `;
                }

                htmlContent += `
                    <div id="assessmentBox"></div>
                    <div class="qpaperfooter" id="qPaperFooter"></div>
                `;

                $("#modules_contentViewBox").html(htmlContent);

                questionCount = 0;
                currentUserAssessmentState = getAssessmentStatus(currentUserDetail.kmreguserphone, testContent);
                assessmentResult = {};

                // Attempt to restore previous answers if exist
                if (currentUserAssessmentState && currentUserAssessmentState.assessmentState) {
                    try {
                        const data = currentUserAssessmentState.assessmentState;
                        assessmentResult = (typeof data === "string") ? JSON.parse(data) : data;
                    } catch (error) {
                        console.error("Invalid JSON in assessmentState:", error);
                        assessmentResult = {};
                    }
                }

                // Display questions
                if (testQuestions.length > 0) {
                    htmlContent = "";
                    if (testContent.backAllowed === true) {
                        htmlContent += `<div id="assessmentBackBtn" class="kmkioskBtnStyle" onclick="getBackAssessment()">Back <i class="fas fa-arrow-left"></i></div>`;
                    } else {
                        htmlContent += `<div></div>`;
                    }

                    htmlContent += `<div id="submitBtn" class="kmkioskBtnStyle" onclick="getSubmittedAnswer(false)">Submit <i class="fas fa-arrow-right"></i></div>`;
                    $("#qPaperFooter").html(htmlContent);

                    // Timer handling
                    if (testContent.timeLimitEnable === true) {
                        const timeArr = testContent.timeLimit.split(":");
                        if (timeArr.length > 2) {
                            timeLimit = (+timeArr[0]) * 3600 + (+timeArr[1]) * 60 + (+timeArr[2]);
                        } else if (timeArr.length > 1) {
                            timeLimit = (+timeArr[0]) * 60 + (+timeArr[1]);
                        } else {
                            timeLimit = +timeArr[0];
                        }
                        countDownTimer = setInterval(assessmentCountdownTimerHandler, 1000);
                    }

                    // Randomize question sequence
                    shuffleIndex(testQuestions.length).then(numArr => {
                        qSequence = numArr;
                        getKmkioskQuestions();
                    });
                }
            }
        }
    }
}
/****************************************************************************************************
 * Function: getKmkioskQuestions
 * Purpose:
 *     Renders assessment questions one-by-one or all at once based on configuration.
 ****************************************************************************************************/

async function getKmkioskQuestions() {
    let htmlContent = "";

    if (testContent.oneQuestionAtATime === true) {
        // Display one question at a time
        let qIndex = testContent.randomizeQuestionSequence ? qSequence[questionCount] : questionCount;

        if (questionCount < questions.length) {
            questionCount++;
            const obj = questions[qIndex];
            htmlContent = await getQuestionHtml(obj);
            $("#assessmentBox").html(htmlContent);
        }
    } else {
        // Display all questions at once
        function nextQuestion(index) {
            let qIndex = testContent.randomizeQuestionSequence ? qSequence[questionCount] : questionCount;
            questionCount++;
            htmlContent += getQuestionHtml(questions[qIndex]);
            if (index === questions.length - 1) {
                $("#assessmentBox").html(htmlContent);
            } else {
                nextQuestion(index + 1);
            }
        }
        nextQuestion(0);
    }
}


/****************************************************************************************************
 * Function: getQuestionHtml
 * Purpose:
 *     Builds HTML markup for a given question object including image, text, and answer options.
 ****************************************************************************************************/
function getQuestionHtml(obj) {
    let htmlContent = "";

    let hasAnswer = "";
    let ansArray = [];

    // Restore previously saved answer if available
    if (assessmentResult?.content && assessmentResult.content.length >= questionCount) {
        hasAnswer = assessmentResult.content[questionCount - 1].A;
        ansArray = hasAnswer.split("#");
    }

    htmlContent += `<div class="assessmentquestioanswerbox">`;

    // Display question image if available
    if (obj.questionImage) {
        let objectKey = obj.questionImage;
        if (objectKey.startsWith(s3PrivateUrl)) {
            objectKey = objectKey.replace(s3PrivateUrl, "");
            getSignedUrl(objectKey, 10).then(url => {
                if (url.startsWith("http")) {
                    htmlContent += `<img class="assessmentquestion" src="${url}" onerror="this.onerror=null;this.src='./img/noimage.jpg';"/>`;
                }
            });
        } else {
            htmlContent += `<img class="assessmentquestion" src="${obj.questionImage}" onerror="this.onerror=null;this.src='./img/noimage.jpg';"/>`;
        }
    }

    htmlContent += `<div class="assessmentquestion">${questionCount}. ${obj.questionName}</div>`;

    const choiceArr = obj.choices.split("#");
    const answerArr = obj.answers.split("#");

    if (testContent.randomizeAnswerSequence) {
        shuffleIndex(choiceArr.length).then(aSequence => {
            const newChoiceArr = [];
            for (let i = 0; i < choiceArr.length; i++) {
                const aIndex = aSequence[i];
                const choice = choiceArr[aIndex];
                newChoiceArr.push(choice);
                htmlContent += buildAnswerOptionHtml(obj, aIndex, choice, ansArray.includes(choice));
                if (i === choiceArr.length - 1) {
                    mcqChoices[questionCount - 1] = newChoiceArr;
                    mcqAnswers[questionCount - 1] = answerArr;
                    htmlContent += "</div>";
                    return htmlContent;
                }
            }
        });
    } else {
        for (let i = 0; i < choiceArr.length; i++) {
            const choice = choiceArr[i];
            htmlContent += buildAnswerOptionHtml(obj, i, choice, ansArray.includes(choice));
            if (i === choiceArr.length - 1) {
                mcqChoices[questionCount - 1] = choiceArr;
                mcqAnswers[questionCount - 1] = answerArr;
                htmlContent += "</div>";
                return htmlContent;
            }
        }
    }
}


/****************************************************************************************************
 * Helper Function: buildAnswerOptionHtml
 * Purpose:
 *     Builds and returns a single answer option (radio or checkbox) element HTML string.
 ****************************************************************************************************/
function buildAnswerOptionHtml(obj, aIndex, choice, checked) {
    const type = obj.multipleAnswer ? "checkbox" : "radio";
    const checkedAttr = checked ? "checked" : "";
    return `
        <input class="assessmentanswer" type="${type}" id="q${obj.id}a${aIndex}" 
               name="q${obj.id}" value="${choice}" ${checkedAttr}>
        <label for="q${obj.id}a${aIndex}" class="assessmentanswerlabel">${choice}</label><br>
    `;
}
/****************************************************************************************************
 * Function: getCourseContentStatus
 * Purpose:
 *     Retrieves or initializes a user’s course state (progress tracking data).
 *     Ensures a local record exists for each user-course combination.
 *
 * @param {string} userPhone - Unique user ID (typically phone number).
 * @param {object} courseDetail - The selected course details object.
 * @returns {object|null} The user's course progress state.
 ****************************************************************************************************/
function getCourseContentStatus(userPhone, courseDetail) {
    if (!courseDetail || !userPhone) {
        console.error("❌ Missing course or userPhone!");
        return null;
    }

    // Initialize array if not present
    if (!Array.isArray(kmkioskUsercourses)) kmkioskUsercourses = [];

    // Try to find an existing record for this user & course
    let usercourse = kmkioskUsercourses.find(
        item => item.userId === userPhone && item.courseId === courseDetail.course.id
    );

    if (usercourse && usercourse.courseState) return usercourse;

    // Not found → create a new record with blank states
    console.log("ℹ️ User-course not found! Creating new...");

    const contents = [];
    if (Array.isArray(courseDetail.coursecontentDetailsDTOList)) {
        for (const item of courseDetail.coursecontentDetailsDTOList) {
            contents.push(getContentInitJson(item.courseContent));
        }
    }

    const courseState = { contents: contents };
    const dateStr = new Date().toLocaleString("sv-SE").replace("T", " ");

    usercourse = {
        userId: currentUserDetail?.kmreguserphone || userPhone,
        userName: currentUserDetail?.kmregusername || "Unknown User",
        deviceSerial: shared.deviceSerialNumber,
        courseId: courseDetail.course.id,
        courseName: courseDetail.course.courseName,
        courseState: JSON.stringify(courseState),
        companyKey: courseDetail.course.companyKey,
        createdBy: `kiosk -- ${shared.deviceSerialNumber}`,
        createdOn: dateStr,
        modifiedBy: `kiosk -- ${shared.deviceSerialNumber}`,
        modifiedOn: dateStr,
        other: "",
        enabled: true,
        timestamp: Date.now()
    };

    kmkioskUsercourses.push(usercourse);
    return usercourse;
}

/****************************************************************************************************
 * Function: updateKmkioskCourseStatus
 * Purpose:
 *     Updates the stored course state (progress) for the current user and course.
 *     If no record exists, creates a new one with timestamp and deviceSerialNumber.
 *     Updates the timestamp only for the modified record.
 ****************************************************************************************************/
function updateKmkioskCourseStatus() {
    if (!courseContentStatus || !courseContentStatus.userId || !courseContentStatus.courseId) {
        console.error("⚠️ updateKmkioskCourseStatus: Missing courseContentStatus data!");
        return;
    }

    // Find the existing record for this user & course
    const index = kmkioskUsercourses.findIndex(
        item => item.userId === courseContentStatus.userId && item.courseId === courseContentStatus.courseId
    );

    if (index !== -1) {
        // ✅ Update progress and metadata for the existing course
        kmkioskUsercourses[index].courseState = courseContentStatus.courseState;
        kmkioskUsercourses[index].modifiedOn = new Date().toLocaleString("sv-SE").replace("T", " ");
        kmkioskUsercourses[index].timestamp = Date.now(); // ✅ Only update this course's timestamp
        console.log("🔄 Updated course progress for existing user-course record:", kmkioskUsercourses[index]);

    } else {
        // 🆕 Create a new record if it doesn't exist
        const newRecord = {
            ...courseContentStatus,
            timestamp: Date.now(), // ✅ First-time save timestamp
            createdOn: new Date().toLocaleString("sv-SE").replace("T", " "),
            modifiedOn: new Date().toLocaleString("sv-SE").replace("T", " ")
        };

        kmkioskUsercourses.push(newRecord);
        console.log("🆕 Added new course record:", newRecord);
    }

    // Save the updated user courses list
    saveKmkioskUsercourses();
}


/****************************************************************************************************
 * Function: getAssessmentStatus
 * Purpose:
 *     Retrieves or initializes a user’s assessment state.
 *     Ensures every user-assessment pair has a record for progress tracking.
 *
 * @param {string} userPhone - User phone number (unique ID).
 * @param {object} assessment - The current assessment object.
 * @returns {object|null} User assessment state.
 ****************************************************************************************************/
function getAssessmentStatus(userPhone, assessment) {
    if (!assessment || !userPhone) {
        console.error("❌ Missing assessment or userPhone!");
        return null;
    }

    if (!Array.isArray(kmkioskUserassessments)) kmkioskUserassessments = [];

    // Find existing record
    let userassessment = kmkioskUserassessments.find(
        item => item.userId === userPhone && item.assessmentId === assessment.id
    );

    if (userassessment) return userassessment;

    // Not found → create new entry
    console.log("ℹ️ User-assessment not found! Creating new...");

    const dateStr = new Date().toLocaleString("sv-SE").replace("T", " ");
    userassessment = {
        userId: currentUserDetail?.kmreguserphone || userPhone,
        userName: currentUserDetail?.kmregusername || "Unknown User",
        assessmentId: assessment.id,
        assessmentName: assessment.assessmentName,
        assessmentState: JSON.stringify({}),
        companyKey: assessment.companyKey,
        createdBy: `kiosk -- ${shared.deviceSerialNumber}`,
        createdOn: dateStr,
        modifiedBy: `kiosk -- ${shared.deviceSerialNumber}`,
        modifiedOn: dateStr,
        other: "",
        enabled: true,
        timestamp: Date.now()
    };

    kmkioskUserassessments.push(userassessment);
    return userassessment;
}


/****************************************************************************************************
 * Function: updateKmkioskAssessmentStatus
 * Purpose:
 *     Updates the current user’s assessment result and syncs progress with course status.
 *
 * @param {number} passFail - Numeric value representing assessment result (1 = pass, 0 = fail).
 ****************************************************************************************************/
function updateKmkioskAssessmentStatus(passFail) {
    // Update local assessment state
    currentUserAssessmentState.assessmentState = assessmentResult;

    const contJson = JSON.parse(courseContentStatus.courseState);
    const contentIndex = contJson.contents.findIndex(
        item => item.contentType === "Assessment" && item.contentId === courseContent[runningContentIndex].id
    );

    if (contentIndex !== -1) {
        contJson.contents[contentIndex].status = passFail;
    }

    courseContentStatus.courseState = JSON.stringify(contJson);

    // Update progress meter UI
    const meterElem = document.getElementById(
        "prg_" + courseContent[runningContentIndex].contentType + "_" + courseContent[runningContentIndex].id
    );
    if (meterElem) meterElem.value = contJson.contents[contentIndex].status * 100;

    // Update local user assessment data
    const index = kmkioskUserassessments.findIndex(
        item => item.userId === currentUserAssessmentState.userId &&
            item.courseId === courseContentStatus.courseId
    );

    if (index !== -1) {
        kmkioskUserassessments[index].assessmentState = assessmentResult;
        kmkioskUserassessments[index].modifiedOn = new Date().toLocaleString("sv-SE").replace("T", " ");
    } else {
        kmkioskUserassessments.push(currentUserAssessmentState);
    }

    // Persist assessment & course status to file
    saveKmkioskUserassessments();
    updateKmkioskCourseStatus();
}
/******************************************************************************** KIOSK DATA *******************************************************************/

/****************************************************************************************************
 * Function: getKmkioskUserData
 * Purpose:
 *     Loads all locally stored kiosk user data: registration records, user course states,
 *     and user assessment states. Cleans records older than 90 days to optimize performance.
 *
 * Flow:
 *     1. Opens or creates the DigiSign app directory.
 *     2. Loads "kmkiosk_registration.json".
 *     3. Trims records older than 90 days.
 *     4. Writes back the trimmed data.
 *     5. Calls getKmkioskUserCourseState() → then getKmkioskUserAssessmentState().
 ****************************************************************************************************/


async function getKmkioskUserData() {
    console.log("📥 Getting Registration and User data!");

    try {
        const appFolder = shared.systemConfiguration.systemInfo.localAppFolderDigiSign;
        const regFileName = "kmkiosk_registration.json";
        const filePath = `${appFolder}/${regFileName}`;

        console.log("🔍 Accessing file:", filePath);

        // ✅ Ensure directory exists (Capacitor auto-creates if needed)
        await Filesystem.mkdir({
            path: appFolder,
            directory: Directory.Data,
            recursive: true
        }).catch(() => {
            // Directory may already exist — safe to ignore
        });

        // ✅ Try reading the registration file
        let fileData;
        try {
            const result = await Filesystem.readFile({
                path: filePath,
                directory: Directory.Data,
                encoding: Encoding.UTF8
            });
            fileData = result.data;
        } catch (readErr) {
            console.warn("⚠️ Registration file not found, creating a new one.");
            fileData = "[]";
            await Filesystem.writeFile({
                path: filePath,
                data: "[]",
                directory: Directory.Data,
                encoding: Encoding.UTF8
            });
        }

        // ✅ Parse JSON
        let registrations = [];
        try {
            registrations = JSON.parse(fileData) || [];
        } catch (parseErr) {
            console.warn("⚠️ Failed to parse registration file, using empty array.");
        }

        // ✅ Trim registrations older than 90 days
        if (registrations && registrations.length > 0) {
            const ninetyDaysAgo = Date.now() - (90 * 24 * 60 * 60 * 1000);
            registrations = registrations.filter(item => item.timestamp >= ninetyDaysAgo);

            // ✅ Rewrite trimmed data
            await Filesystem.writeFile({
                path: filePath,
                data: JSON.stringify(registrations, null, 2),
                directory: Directory.Data,
                encoding: Encoding.UTF8
            });

            console.log("✅ Registration data trimmed and saved (last 90 days).");
        }

        // ✅ Update global variables and continue workflow
        kmkioskRegistrations = registrations;
        kmkioskRegistrationFileEntry = filePath;
        await getKmkioskUserCourseState(appFolder);

    } catch (error) {
        console.error("❌ Failed to get registration/user data:", error);
    }
}
/****************************************************************************************************
 * Function: getKmkioskUserCourseState
 * Purpose:
 *     Loads all locally stored user course progress data from "kmkiosk_usercourse.json".
 *     Removes data older than 90 days and writes trimmed results back to file.
 *
 * @param {FileEntry} appDirectory - The local DigiSign application directory entry.
 ****************************************************************************************************/

async function getKmkioskUserCourseState(appFolder) {
    const regFileName = "kmkiosk_usercourse.json";
    const filePath = `${appFolder}/${regFileName}`;

    try {
        console.log("📥 Getting User Course Data:", filePath);

        // ✅ Ensure app directory exists (Capacitor auto-creates recursively)
        await Filesystem.mkdir({
            path: appFolder,
            directory: Directory.Data,
            recursive: true
        }).catch(() => {
            // Ignore if already exists
        });

        // ✅ Try reading existing file
        let fileData;
        try {
            const result = await Filesystem.readFile({
                path: filePath,
                directory: Directory.Data,
                encoding: Encoding.UTF8
            });
            fileData = result.data;
        } catch (readErr) {
            console.warn("⚠️ Usercourse file not found, creating a new one.");
            fileData = "[]";
            await Filesystem.writeFile({
                path: filePath,
                data: "[]",
                directory: Directory.Data,
                encoding: Encoding.UTF8
            });
        }

        // ✅ Parse JSON safely
        let usercourses = [];
        try {
            usercourses = JSON.parse(fileData) || [];
        } catch (e) {
            console.warn("⚠️ Failed to parse usercourse file, defaulting to empty array.");
        }

        // ✅ Trim old courses (older than 90 days)
        if (usercourses.length > 0) {
            const ninetyDaysAgo = Date.now() - (90 * 24 * 60 * 60 * 1000);
            usercourses = usercourses.filter(item => item.timestamp >= ninetyDaysAgo);
            kmkioskUsercourses = usercourses;

            // ✅ Save cleaned data back
            await Filesystem.writeFile({
                path: filePath,
                data: JSON.stringify(usercourses, null, 2),
                directory: Directory.Data,
                encoding: Encoding.UTF8
            });

            console.log("✅ Usercourse data trimmed and saved (last 90 days).");
        } else {
            kmkioskUsercourses = usercourses;
        }

        // ✅ Store reference and proceed
        kmkioskUsercourseFileEntry = filePath;
        await getKmkioskUserAssessmentState(appFolder);

    } catch (error) {
        console.error("❌ Failed to load or save usercourse data:", error);
    }
}
/****************************************************************************************************
 * Function: getKmkioskUserAssessmentState
 * Purpose:
 *     Loads all locally stored assessment results from "kmkiosk_userassessment.json".
 *     Removes assessments older than 90 days and saves trimmed results.
 *
 * @param {FileEntry} appDirectory - The local DigiSign application directory entry.
 ****************************************************************************************************/


async function getKmkioskUserAssessmentState(appFolder) {
    const regFileName = "kmkiosk_userassessment.json";
    const filePath = `${appFolder}/${regFileName}`;

    try {
        console.log("📥 Getting User Assessment Data:", filePath);

        // ✅ Ensure app directory exists (recursive creation)
        await Filesystem.mkdir({
            path: appFolder,
            directory: Directory.Data,
            recursive: true
        }).catch(() => {
            // Directory may already exist, safely ignore
        });

        // ✅ Try reading existing file
        let fileData;
        try {
            const result = await Filesystem.readFile({
                path: filePath,
                directory: Directory.Data,
                encoding: Encoding.UTF8
            });
            fileData = result.data;
        } catch (readErr) {
            console.warn("⚠️ Userassessment file not found, creating a new one.");
            fileData = "[]";
            await Filesystem.writeFile({
                path: filePath,
                data: "[]",
                directory: Directory.Data,
                encoding: Encoding.UTF8
            });
        }

        // ✅ Parse JSON safely
        let userassessments = [];
        try {
            userassessments = JSON.parse(fileData) || [];
        } catch (e) {
            console.warn("⚠️ Failed to parse userassessment file, defaulting to empty array.");
        }

        // ✅ Trim records older than 90 days
        if (userassessments.length > 0) {
            const ninetyDaysAgo = Date.now() - (90 * 24 * 60 * 60 * 1000);
            userassessments = userassessments.filter(item => item.timestamp >= ninetyDaysAgo);
            kmkioskUserassessments = userassessments;

            // ✅ Save updated data
            await Filesystem.writeFile({
                path: filePath,
                data: JSON.stringify(userassessments, null, 2),
                directory: Directory.Data,
                encoding: Encoding.UTF8
            });

            console.log("✅ Userassessment data trimmed and saved (last 90 days).");
        } else {
            kmkioskUserassessments = userassessments;
        }

        // ✅ Maintain reference to file path (for consistency)
        kmkioskUserassessmentFileEntry = filePath;

    } catch (error) {
        console.error("❌ Failed to load or save userassessment data:", error);
    }
}


/****************************************************************************************************
 * Function: getKioskConfigurationFromFile
 * Purpose:
 *     Loads the kiosk configuration JSON file from local storage ("CURR_KIOSKCONFINFO-{deviceSerial}.json").
 *     If found and valid, initializes configuration and user data.
 *     Otherwise, falls back to fetching from the server.
 *
 * Flow:
 *     1. Checks for the local configuration file.
 *     2. Parses and validates the configuration.
 *     3. If valid, triggers:
 *         - checkIfDownloadRequire()
 *         - getKmkioskUserData()
 *     4. If invalid or missing, calls getKioskConfigurationFromServer().
 ****************************************************************************************************/

async function getKioskConfigurationFromFile() {
  console.log("🔍 Checking kiosk configuration using Capacitor Filesystem...");

  try {
    // Define filenames and paths
    const infoFileName = `CURR_KIOSKCONFINFO-${shared.deviceSerialNumber}.json`;
    const appFolder = shared.systemConfiguration.systemInfo.localAppFolderDigiSign;

    const dirPath = `${appFolder}`;
    const filePath = `${dirPath}/${infoFileName}`;

    // ✅ Ensure the app directory exists
    try {
      await Filesystem.mkdir({
        path: dirPath,
        directory: Directory.Data,
        recursive: true
      });
      console.log("📁 Ensured DigiSign directory exists:", dirPath);
    } catch (mkdirErr) {
      if (mkdirErr.message?.includes('already exists')) {
        console.log("📂 DigiSign directory already exists:", dirPath);
      } else {
        console.error("❌ Failed creating DigiSign directory:", mkdirErr);
        return;
      }
    }

    // ✅ Try reading existing config file
    try {
      const result = await Filesystem.readFile({
        path: filePath,
        directory: Directory.Data,
        encoding: 'utf8'
      });

      console.log("✅ Kiosk configuration file found:", infoFileName);

      const fileData = result.data;
      kmkioskConfiguration = JSON.parse(fileData);

      if (kmkioskConfiguration && kmkioskConfiguration.config?.kmkioskconfig) {
        console.log(
          "🟢 Local Kiosk Config Loaded:",
          kmkioskConfiguration.config.kmkioskconfig.kmkioskconfigName
        );

        // Proceed with normal kiosk flow
        checkIfDownloadRequire();
        getKmkioskUserData();
      } else {
        console.warn("⚠️ Invalid configuration file — fetching from server...");
        getKioskConfigurationFromServer(infoFileName);
      }

    } catch (readErr) {
      console.warn("⚠️ Kiosk configuration file missing. Fetching from server...", readErr.message);
      getKioskConfigurationFromServer(infoFileName);
    }

  } catch (err) {
    console.error("❌ Unexpected error accessing kiosk configuration:", err);
  }
}
/****************************************************************************************************
 * Global: syncStatus
 * Purpose:
 *     Tracks the completion state of all kiosk sync tasks.
 *     Each flag represents whether that specific type of data has finished syncing.
 ****************************************************************************************************/
const syncStatus = {
    configCourse: false,
    userData: false,
    trainingData: false
};

/****************************************************************************************************
 * Function: kmkioskSyncData
 * Purpose:
 *     Displays the "Kiosk Data Sync" screen allowing selective syncing of:
 *       - Configuration & Course Data
 *       - User Data
 *       - Training Data
 *     Users can check/uncheck individual items or select all.
 *     Pressing "Start Sync" triggers synchronization for chosen types.
 *
 * Flow:
 *     1. Renders the Sync UI.
 *     2. Handles "Select All" and per-item toggle logic.
 *     3. Starts the selected sync processes.
 *     4. Displays completion message upon sync finish.
 ****************************************************************************************************/

function kmkioskSyncData() {
    shared.currentState = "kmkioskSyncScreen";

    // Hide main areas and show sync screen
    $("#modulesMenuArea").hide();
    $("#modulesListArea").hide();
    $("#modulesDisplayArea").show();
    fixModuleHeight("modulesModuleHeader, footerSection", 20, "modulesDisplayArea");

    const infoFileName = "CURR_KIOSKCONFINFO-" + shared.deviceSerialNumber + ".json";

    // Build Sync UI
    const htmlContent = `
        <div class="displayTitleClass" style="max-width: 500px; margin: 40px auto; padding: 30px;
             background: #f9f9f9; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
            
            <h2 style="text-align: center; margin-bottom: 30px; color: #333; font-size: 1.3em; font-weight: bold;">
                Kiosk Data Sync
            </h2>
            
            <div style="text-align: left;">
                <div style="background-color: rgb(220,220,220); padding: 10px; margin-bottom: 10px;">
                    <label style="font-weight: bold;">
                        <input type="checkbox" id="selectAllSync" checked
                               style="width:22px; height:22px; margin-right:10px;">
                        Select All
                    </label>
                </div>

                <div style="margin-bottom: 15px;">
                    <label>
                        <input type="checkbox" class="syncOption" value="configCourse" checked
                               style="width:22px; height:22px; margin-right:10px;">
                        Configuration & Course Data
                    </label>
                </div>

                <div style="margin-bottom: 15px;">
                    <label>
                        <input type="checkbox" class="syncOption" value="userData" checked
                               style="width:22px; height:22px; margin-right:10px;">
                        User Data
                    </label>
                </div>

                <div style="margin-bottom: 25px;">
                    <label>
                        <input type="checkbox" class="syncOption" value="trainingData" checked
                               style="width:22px; height:22px; margin-right:10px;">
                        Training Data
                    </label>
                </div>
            </div>

            <button id="startSyncBtn" class="kmkioskBtnStyle"
                style="display:block; width:100%; padding:12px; font-size:1rem;
                       border-radius:8px; border:none; cursor:pointer;">
                Start Sync
            </button>

            <div id="syncCompletedMsg" style="display:none; margin-top:30px; text-align:center;">
                <p style="font-size:1.1rem; color:#333;">✅ Sync completed!</p>
                <button id="closeSyncBtn" class="kmkioskBtnStyle"
                    style="padding:10px 20px; font-size:1rem;
                           background-color:#2196f3; color:#fff; border:none; cursor:pointer;">
                    Close
                </button>
            </div>
        </div>
    `;

    $('#modulesDisplayArea').html(htmlContent);

    // ===============================
    // 🟢 Event Handlers
    // ===============================

    // Handle "Select All" toggle
    $('#modulesDisplayArea').on('change', '#selectAllSync', function () {
        const checked = $(this).is(':checked');
        $('.syncOption').prop('checked', checked);
    });

    // Auto-sync "Select All" checkbox based on individual toggles
    $('#modulesDisplayArea').on('change', '.syncOption', function () {
        const allChecked = $('.syncOption').length === $('.syncOption:checked').length;
        $('#selectAllSync').prop('checked', allChecked);
    });

    // Handle Start Sync
    $('#startSyncBtn').on('click', function () {
        const selectedOptions = $('.syncOption:checked').map(function () {
            return $(this).val();
        }).get();

        if (selectedOptions.length === 0) {
            alert("Please select at least one option to sync.");
            return;
        }

        // Reset sync flags for this run
        syncStatus.configCourse = false;
        syncStatus.userData = false;
        syncStatus.trainingData = false;

        // Disable Start button to avoid duplicate syncs
        $(this).prop('disabled', true);

        console.log("🔄 Starting sync for:", selectedOptions);

        // 1️⃣ Configuration & Course Data
        if (selectedOptions.includes('configCourse')) {
            syncStatus.configCourse = true;
            getKioskConfigurationFromServer(infoFileName);
        }

        // 2️⃣ User Data
        if (selectedOptions.includes('userData')) {
            syncStatus.userData = true;
            syncUserData();
        }

        // 3️⃣ Training Data
        if (selectedOptions.includes('trainingData')) {
            syncStatus.trainingData = true;
            syncTrainingData();
        }

        // Note: The "Sync completed" message is displayed after all tasks complete via checkAllSyncComplete()
    });

    // Handle Close Sync Screen
    $('#modulesDisplayArea').on('click', '#closeSyncBtn', function () {
        $('#modulesDisplayArea').hide();
        $("#modulesMenuArea").show();
        $("#modulesListArea").hide();
        shared.currentState = "kmkioskMenu";
    });
}

/****************************************************************************************************
 * Function: checkAllSyncComplete
 * Purpose:
 *     Checks if all sync flags (config, user, training) are false, indicating that all sync
 *     operations are finished. Displays the "Sync Completed" message once all tasks complete.
 ****************************************************************************************************/
function checkAllSyncComplete() {
    if (
        syncStatus.configCourse === false &&
        syncStatus.userData === false &&
        syncStatus.trainingData === false
    ) {
        $('#syncCompletedMsg').show();
        $('#closeSyncBtn').prop('disabled', false);
        console.log("✅ All sync tasks complete!");
    }
}

/****************************************************************************************************
 * Function: syncUserData
 * Purpose:
 *     Synchronizes kiosk user registration data with the server.
 *
 * Steps:
 *     1. Request last synced timestamp from the server.
 *     2. Filter local user registrations newer than that timestamp.
 *     3. Upload in manageable batches (e.g., 50 records per request).
 *     4. Upload user images one by one.
 *     5. Mark sync complete when all done.
 ****************************************************************************************************/

function syncUserData() {
  console.log("🔄 Starting User Data Sync...");

  // Step 1: Get last timestamp from server
  const data = { deviceSerialNumber: shared.deviceSerialNumber };
  RequestOptions(constructUrl("/kmkioskuserregistrations/getlasttimestamp"), "POST", data)
    .then(request => {
      Http.request(request)
        .then(response => {
          if (!isValidResponse(response, "getlasttimestamp") || !response.data) {
            throw new Error("Invalid response for last timestamp");
          }

          const parsed = typeof response.data === "string" ? JSON.parse(response.data) : response.data;
          const lastSyncTimestamp = parsed.lastSyncTimestamp || 0;
          console.log("🕒 Last sync timestamp:", lastSyncTimestamp);

          // Step 2: Filter new registrations
          if (!Array.isArray(kmkioskRegistrations) || kmkioskRegistrations.length === 0) {
            console.log("ℹ️ No local registration data found.");
            syncStatus.userData = false;
            checkAllSyncComplete();
            return;
          }

          const newRegistrations = kmkioskRegistrations.filter(user => user.timestamp > lastSyncTimestamp);

          if (newRegistrations.length === 0) {
            console.log("✅ No new registrations to upload.");
            syncStatus.userData = false;
            checkAllSyncComplete();
            return;
          }

          console.log("🧾 " + newRegistrations.length + " new records found for upload.");

          // Step 3: Upload in batches (for scalability)
          const batchSize = 50;
          let currentBatch = 0;

          function uploadNextBatch() {
            if (currentBatch * batchSize >= newRegistrations.length) {
              console.log("✅ All user data batches uploaded.");
              uploadPendingImages(newRegistrations);
              return;
            }

            const batch = newRegistrations.slice(currentBatch * batchSize, (currentBatch + 1) * batchSize);
            console.log("📤 Uploading batch " + (currentBatch + 1) + " (" + batch.length + " records)");

            const batchData = {
              deviceSerialNumber: shared.deviceSerialNumber,
              users: batch
            };

            RequestOptions(constructUrl("/kmkioskuserregistrations/newuserdata"), "POST", batchData)
              .then(batchRequest => {
                Http.request(batchRequest)
                  .then(res => {
                    if (isValidResponse(res, "newuserdata")) {
                      console.log("✅ Batch " + (currentBatch + 1) + " uploaded successfully.");
                      currentBatch++;
                      uploadNextBatch();
                    } else {
                      throw new Error("Server rejected batch upload");
                    }
                  })
                  .catch(err => {
                    console.error("❌ Failed uploading batch " + (currentBatch + 1) + ":", err);
                    showDialog("ERROR! Could not upload user batch.<br>" + err);
                    syncStatus.userData = false;
                    checkAllSyncComplete();
                  });
              })
              .catch(err => {
                console.warn("Request options failed for batch:", err);
                syncStatus.userData = false;
                checkAllSyncComplete();
              });
          }

          // Start batch uploads
          uploadNextBatch();
        })
        .catch(err => {
          console.error("❌ Failed to get last timestamp:", err);
          showDialog("ERROR! Could not fetch last sync timestamp.<br>" + err);
          syncStatus.userData = false;
          checkAllSyncComplete();
        });
    })
    .catch(err => {
      console.warn("Request aborted due to missing requestOptions:", err);
      syncStatus.userData = false;
      checkAllSyncComplete();
    });
}
/****************************************************************************************************
 * Function: uploadPendingImages
 * Purpose:
 *     Uploads user images for all unsynced records.
 *     Uses same Cordova S3 upload logic as `takePicture()`.
 ****************************************************************************************************/

function uploadPendingImages(newRegistrations) {
    console.log("📸 Starting upload of related user images...");

    var index = 0;

    function uploadNext() {
        if (index >= newRegistrations.length) {
            console.log("✅ All user images processed.");
            syncStatus.userData = false;
            checkAllSyncComplete();
            return;
        }

        var user = newRegistrations[index];
        index++;

        if (!user.kmreguserImage || !user.kmreguserImage.startsWith("file")) {
            uploadNext(); // Skip missing or remote images
            return;
        }

        // Build S3 object key
        var folder = "kmkiosk_users/";
        var fileName = (user.kmreguserphone || user.kmreguseremail || "user") + "_" + Date.now() + ".jpg";
        var company = "INTERNAL";

        if (shared.mCustomerDetailsJSON != null) {
            company = shared.mCustomerDetailsJSON.companyKey.replace("COMPANY_KEY_", "") + "/";
        } else if (mVisitorinvite != null) {
            company = mVisitorinvite.companyKey.replace("COMPANY_KEY_", "") + "/";
        }

        var objectKey = "bveu_resource/" + company + folder + fileName;
        var serverUrl = s3PrivateUrl;

        if (
            shared.systemConfiguration.systemInfo.privateCdnURL &&
            shared.systemConfiguration.systemInfo.privateCdnURL.length > 0
        ) {
            serverUrl = shared.systemConfiguration.systemInfo.privateCdnURL;
        }

        serverUrl += objectKey;

        console.log("📤 Uploading image for:", user.kmregusername, serverUrl);

        // Signed URL flow for S3 uploads
        if (serverUrl.startsWith(s3PrivateUrl)) {
            getSignedUrlForUpload(objectKey, 30).then(function (uploadUrl) {
                if (uploadUrl && uploadUrl.startsWith("http")) {
                    uploadFile(uploadUrl, user.kmreguserImage, null, serverUrl);
                } else {
                    console.error("❌ Invalid signed URL for image upload.");
                }
                uploadNext();
            });
        } else {
            uploadFile(serverUrl, user.kmreguserImage, null, serverUrl);
            uploadNext();
        }
    }

    uploadNext(); // Start image upload loop
}
/****************************************************************************************************
 * Function: syncTrainingData
 * Purpose:
 *     Synchronizes kiosk training data (course progress & assessments) with the server.
 *
 * Flow:
 *     1. Fetch last synced timestamp from server.
 *     2. Filter local course/assessment data newer than that timestamp.
 *     3. Upload new/updated data in manageable batches.
 *     4. Mark sync complete after success.
 *
 * APIs:
 *     - POST /kmkiosktrainingdata/getlasttimestamp
 *     - POST /kmkiosktrainingdata/newtrainingdata
 ****************************************************************************************************/

function syncTrainingData() {
  console.log("📤 Starting Training Data Sync...");

  const data = { deviceSerialNumber: shared.deviceSerialNumber };

  // Step 1️⃣: Request last synced timestamp from server
  RequestOptions(constructUrl("/kmkiosktrainingdata/getlasttimestamp"), "POST", data)
    .then(request => {
      Http.request(request)
        .then(response => {
          if (!isValidResponse(response, "getlasttimestamp") || !response.data) {
            throw new Error("Invalid response for last training timestamp");
          }

          const parsedData = typeof response.data === "string" ? JSON.parse(response.data) : response.data;
          const lastSyncTimestamp = parsedData.lastSyncTimestamp || 0;
          console.log("🕒 Last training sync timestamp:", lastSyncTimestamp);

          // Step 2️⃣: Gather local training data
          let newCourses = [];
          let newAssessments = [];

          if (Array.isArray(kmkioskUsercourses)) {
            newCourses = kmkioskUsercourses.filter(item => item.timestamp > lastSyncTimestamp);
          }

          if (Array.isArray(kmkioskUserassessments)) {
            newAssessments = kmkioskUserassessments.filter(item => item.timestamp > lastSyncTimestamp);
          }

          if (newCourses.length === 0 && newAssessments.length === 0) {
            console.log("✅ No new training data to sync.");
            syncStatus.trainingData = false;
            checkAllSyncComplete();
            return;
          }

          console.log(
            `📚 Found ${newCourses.length} updated courses and ${newAssessments.length} updated assessments.`
          );

          // Step 3️⃣: Prepare combined payload and upload in batches
          const batchSize = 50;
          const allTrainingItems = [];

          newCourses.forEach(c => allTrainingItems.push({ type: "course", data: c }));
          newAssessments.forEach(a => allTrainingItems.push({ type: "assessment", data: a }));

          let currentBatch = 0;

          function uploadNextBatch() {
            if (currentBatch * batchSize >= allTrainingItems.length) {
              console.log("✅ All training data batches uploaded successfully.");
              syncStatus.trainingData = false;
              checkAllSyncComplete();
              return;
            }

            const batch = allTrainingItems.slice(
              currentBatch * batchSize,
              (currentBatch + 1) * batchSize
            );

            console.log(
              `📤 Uploading training data batch ${currentBatch + 1} (${batch.length} records)`
            );

            const batchData = {
              deviceSerialNumber: shared.deviceSerialNumber,
              records: batch
            };

            // Build request for batch upload
            RequestOptions(constructUrl("/kmkiosktrainingdata/newtrainingdata"), "POST", batchData)
              .then(batchRequest => {
                Http.request(batchRequest)
                  .then(res => {
                    if (isValidResponse(res, "newtrainingdata")) {
                      console.log(`✅ Training data batch ${currentBatch + 1} uploaded successfully.`);
                      currentBatch++;
                      uploadNextBatch();
                    } else {
                      throw new Error("Server rejected training data batch");
                    }
                  })
                  .catch(err => {
                    console.error(`❌ Failed uploading training data batch ${currentBatch + 1}:`, err);
                    showDialog("ERROR! Could not upload training data.<br>" + err);
                    syncStatus.trainingData = false;
                    checkAllSyncComplete();
                  });
              })
              .catch(err => {
                console.warn("⚠️ Failed to build request for batch upload:", err);
                syncStatus.trainingData = false;
                checkAllSyncComplete();
              });
          }

          // Start uploading batches
          uploadNextBatch();
        })
        .catch(err => {
          console.error("❌ Failed to get last training sync timestamp:", err);
          showDialog("ERROR! Could not fetch last training sync timestamp.<br>" + err);
          syncStatus.trainingData = false;
          checkAllSyncComplete();
        });
    })
    .catch(err => {
      console.warn("⚠️ Request aborted due to missing requestOptions:", err);
      syncStatus.trainingData = false;
      checkAllSyncComplete();
    });
}

/*******************************************************************************
 * Retrieves the KM Kiosk configuration from the server for this device.
 *
 * @function getKioskConfigurationFromServer
 * @param {string} infoFileName - The base name of the local configuration file to create/update.
 *
 * @description
 * Sends a GET request to fetch the kiosk configuration using the device serial number.
 * If a valid configuration is returned, it updates the local configuration file,
 * retrieves user data, and sets up the kiosk. If the device is not configured or
 * an error occurs, it displays an appropriate message to the user.
 *******************************************************************************/


function getKioskConfigurationFromServer(infoFileName) {
  console.log("⚙️ Fetching Kiosk Configuration from server...");

  // Step 1️⃣: Prepare request payload
  const data = { deviceSerial: shared.deviceSerialNumber };

  // Step 2️⃣: Build and send HTTP GET request using Capacitor
  buildRequestOptions(constructUrl("/kmkioskconfigs/restgetkmkioskconfig"), "GET", data)
    .then(request => {
      Http.request(request)
        .then(res => {
          if (isValidResponse(res, "restgetkmkioskconfig") && res.data) {
            console.log("✅ Got Settings from server!");

            // Parse the response safely
            kmkioskConfiguration = typeof res.data === "string" ? JSON.parse(res.data) : res.data;
            console.log(JSON.stringify(kmkioskConfiguration));

            // Step 3️⃣: Check if the kiosk is configured
            if (kmkioskConfiguration.config && kmkioskConfiguration.config.kmkioskconfig) {
              // Create/update local configuration file
              createKioskConfiguration(infoFileName);

              // Retrieve user-specific kiosk data
              getKmkioskUserData();
            } else {
              // Step 4️⃣: Device is not configured as a kiosk
              console.warn("⚠️ Device is not configured as Kiosk!");
              currentState = "kmkioskMenu";

              $("#modulesMenuArea").html(`
                <div style="
                  display: flex; 
                  align-items: center; 
                  justify-content: center; 
                  margin-top: 50px; 
                  font-size: 1.3em; 
                  color: var(--primary-red);
                ">
                  This device is not configured as Kiosk!
                </div>
              `);

              if (QRScaned === false) {
                $("#modulesMenuArea").show();
                $("#modulesListArea").hide();
                $("#modulesDisplayArea").hide();
              }

              fixModuleHeight("modulesModuleHeader, footerSection", 20, "modulesMenuArea");
            }
          } else {
            throw new Error("Invalid kiosk config response");
          }
        })
        .catch(err => {
          console.error("❌ Kiosk config settings failed from server!", err);
          showDialog("Error!!! Couldn't get Kiosk configuration from server: " + err);
        });
    })
    .catch(err => {
      console.warn("⚠️ Request aborted due to missing requestOptions.", err);
    });
}

/*******************************************************************************
 * Creates or updates the KM Kiosk configuration file and forces download of all content.
 *
 * @function createKioskConfiguration
 * @param {string} infoFileName - The base name of the configuration file to create.
 *
 * @description
 * Writes the current KM Kiosk configuration to local storage.
 * After writing, normalizes content list, ensures banner is included,
 * and triggers download of all files to sync the kiosk data.
 *******************************************************************************/


async function createKioskConfiguration(infoFileName) {
  try {
    console.log("⚙️ Creating kiosk configuration file using Capacitor...");

    const appFolder = shared.systemConfiguration.systemInfo.localAppFolderDigiSign;
    const dirPath = `${appFolder}`;
    const filePath = `${dirPath}/${infoFileName}`;

    // ✅ Ensure DigiSign directory exists
    try {
      await Filesystem.mkdir({
        path: dirPath,
        directory: Directory.Data,
        recursive: true
      });
      console.log("📁 Ensured DigiSign directory exists:", dirPath);
    } catch (mkdirErr) {
      if (mkdirErr.message?.includes('already exists')) {
        console.log("📂 DigiSign directory already exists:", dirPath);
      } else {
        console.error("❌ Failed to create DigiSign directory:", mkdirErr);
        return;
      }
    }

    // ✅ Write configuration file
    const configInfo = JSON.stringify(kmkioskConfiguration, null, 2);
    await Filesystem.writeFile({
      path: filePath,
      data: configInfo,
      directory: Directory.Data,
      encoding: 'utf8',
      recursive: true
    });

    console.log("✅ createKioskConfiguration: Config written successfully.");

    // --- FORCE DOWNLOAD ALL CONTENT ---

    let contentList;
    if (typeof kmkioskConfiguration.resources.contents === "string") {
      try {
        contentList = JSON.parse(kmkioskConfiguration.resources.contents);
      } catch (err) {
        console.error("❌ Failed to parse contents JSON:", err);
        contentList = [];
      }
    } else {
      contentList = kmkioskConfiguration.resources.contents || [];
    }

    // 🖼️ Add banner if missing
    let bannerUrl = kmkioskConfiguration.config.kmkioskconfig.bannerUrl;
    if (!bannerUrl) {
      bannerUrl = "https://bviucp.s3.ap-south-1.amazonaws.com/assets/asset_images/banner_kmkiosk.jpg";
    }

    const alreadyHasBanner = contentList.some(item => item.fileName === "banner_kmkiosk.jpg");
    if (bannerUrl && !alreadyHasBanner) {
      contentList.push({
        type: "Image",
        contentUrl: bannerUrl,
        fileName: "banner_kmkiosk.jpg"
      });
    }

    // 🧩 Filter only downloadable content
    const downloadableList = contentList.filter(item => checkIfFile(item.type));

    if (downloadableList.length === 0) {
      console.log("ℹ️ No downloadable contents found.");
      syncStatus.configCourse = true;
      checkAllSyncComplete();
      displayKmkioskMenu();
    } else {
      console.log(`⬇️ Forcing download of ${downloadableList.length} file(s)...`);
      downloadContents(downloadableList);
    }

  } catch (err) {
    console.error("❌ createKioskConfiguration: Unexpected error:", err);
    alert("createKioskConfiguration failed: " + err.message);
  }
}

/*******************************************************************************
 * Checks whether any KM Kiosk content files need to be downloaded.
 *
 * @function checkIfDownloadRequire
 *
 * @description
 * Verifies which required content files are missing locally and triggers
 * downloads for only those files. Also ensures the banner image is included
 * if not already present.
 *******************************************************************************/


async function checkIfDownloadRequire() {
  console.log("📦 Checking if download is required...");

  try {
    // 🧩 Normalize content list
    let contentList;
    if (typeof kmkioskConfiguration.resources.contents === "string") {
      contentList = JSON.parse(kmkioskConfiguration.resources.contents);
    } else {
      contentList = kmkioskConfiguration.resources.contents || [];
    }

    // 🗂️ Local directory for content files
    const localDirPath = `${shared.systemConfiguration.systemInfo.localAppFolderDigiSign}/contents`;

    // 🖼️ Ensure banner image is always included
    let bannerUrl = kmkioskConfiguration.config.kmkioskconfig.bannerUrl;
    if (!bannerUrl) {
      bannerUrl = "https://bviucp.s3.ap-south-1.amazonaws.com/assets/asset_images/banner_kmkiosk.jpg";
    }

    const alreadyHasBanner = contentList.some(item => item.fileName === "banner_kmkiosk.jpg");
    if (bannerUrl && !alreadyHasBanner) {
      contentList.push({
        type: "Image",
        contentUrl: bannerUrl,
        fileName: "banner_kmkiosk.jpg"
      });
    }

    // 🛑 No content? Stop here
    if (contentList.length === 0) {
      console.log("ℹ️ No contents to check.");
      displayKmkioskMenu();
      return;
    }

    // 🧹 Filter valid file-based contents
    const filteredList = contentList.filter(item => {
      const isValid = checkIfFile(item.type);
      if (!isValid) {
        console.log(`Skipping non-downloadable content: "${item.type}" → ${item.contentUrl}`);
      }
      return isValid;
    });

    if (filteredList.length === 0) {
      console.log("ℹ️ No downloadable contents found.");
      displayKmkioskMenu();
      return;
    }

    // 🧾 Check which files exist
    const missingChecks = filteredList.map(async (item) => {
      const fileName = item.contentUrl.substring(item.contentUrl.lastIndexOf("/") + 1);
      const filePath = `${localDirPath}/${fileName}`;

      try {
        await Filesystem.stat({
          path: filePath,
          directory: Directory.Data
        });
        // ✅ File exists locally
        return null;
      } catch {
        // ❌ File missing
        return item;
      }
    });

    // 📊 Await all file checks
    const results = await Promise.all(missingChecks);
    const missingFiles = results.filter(Boolean);

    if (missingFiles.length > 0) {
      console.log(`🚀 ${missingFiles.length} file(s) missing. Downloading only missing ones...`);
      downloadContents(missingFiles);
    } else {
      console.log("✅ All files already downloaded.");
      displayKmkioskMenu();
    }

  } catch (err) {
    console.error("❌ checkIfDownloadRequire: Failed with error:", err);
    displayKmkioskMenu(); // fallback
  }
}

/*******************************************************************************
 * Downloads all required content files for the KM Kiosk application.
 *
 * @function downloadContents
 * @param {Array} [customList] - Optional custom list of content items to download.
 *
 * @description
 * Checks for all file-based content items, ensures the local directory exists,
 * and downloads each file (handling both public and private S3 URLs).
 * Logs progress, errors, and completion status to the console.
 *******************************************************************************/


async function downloadContents(customList) {
  console.log("📦 Getting contents...");

  const contentList = Array.isArray(customList)
    ? customList
    : kmkioskConfiguration.resources.contents;

  const relativeDir = `${shared.systemConfiguration.systemInfo.localAppFolderDigiSign}/contents`;

  if (!Array.isArray(contentList) || contentList.length === 0) {
    console.log("ℹ️ No contents to download.");
    displayKmkioskMenu();
    return;
  }

  // ✅ Count only downloadable files
  const totalFiles = contentList.filter(item => checkIfFile(item.type)).length;
  if (totalFiles === 0) {
    displayKmkioskMenu();
    return;
  }

  // 🧭 UI: Show progress
  const progressContainer = document.getElementById("downloadProgressContainer");
  const progressBar = document.getElementById("downloadProgressBar");
  const progressMessage1 = document.getElementById("progressMessage1");
  const progressMessage2 = document.getElementById("progressMessage2");

  progressContainer.style.display = "flex";
  progressMessage1.textContent = "Downloading kiosk content...";
  progressMessage2.textContent = `0 / ${totalFiles} files completed`;
  progressBar.style.width = "0%";

  let completedCount = 0;

  const updateProgress = () => {
    completedCount++;
    progressMessage2.textContent = `${completedCount} / ${totalFiles} files completed`;
    progressBar.style.width = `${Math.round((completedCount / totalFiles) * 100)}%`;

    if (completedCount >= totalFiles) {
      console.log("✅ All downloads completed (success or fail).");
      progressContainer.style.display = "none";

      if (syncStatus.configCourse) {
        syncStatus.configCourse = false;
        checkAllSyncComplete();
      } else {
        displayKmkioskMenu();
      }
    }
  };

  // ✅ Ensure contents directory exists
  try {
    await Filesystem.mkdir({
      path: relativeDir,
      directory: Directory.Data,
      recursive: true
    });
  } catch (err) {
    if (!err.message.includes('EEXIST')) {
      console.error("❌ Failed to create directory:", err);
      progressContainer.style.display = "none";
      if (syncStatus.configCourse) {
        syncStatus.configCourse = false;
        checkAllSyncComplete();
      } else {
        displayKmkioskMenu();
      }
      return;
    }
  }

  // 🚀 Begin downloading files
  for (const contentItem of contentList) {
    if (!checkIfFile(contentItem.type)) continue;

    const fileUrl = contentItem.contentUrl;
    const fileName = fileUrl.substring(fileUrl.lastIndexOf("/") + 1);
    const filePath = `${relativeDir}/${fileName}`;

    const performDownload = async (finalUrl) => {
      try {
        console.log(`⬇️ Downloading: ${fileName}`);
        const response = await Http.downloadFile({
          url: finalUrl,
          filePath,
          fileDirectory: Directory.Data
        });

        if (response.path) {
          console.log(`✅ File downloaded to: ${response.path}`);
        } else {
          console.warn(`⚠️ No path returned for ${fileName}`);
        }
      } catch (error) {
        console.error(`❌ Download failed for ${fileName}:`, error);
      } finally {
        updateProgress();
      }
    };

    // Handle private S3 URLs with signed URLs
    if (fileUrl.startsWith(s3PrivateUrl)) {
      const objectKey = fileUrl.replace(s3PrivateUrl, "");
      try {
        const signedUrl = await getSignedUrl(objectKey, 10);
        if (signedUrl.startsWith("https://")) {
          await performDownload(signedUrl);
        } else {
          console.error(`Invalid signed URL for ${fileName}:`, signedUrl);
          updateProgress();
        }
      } catch (err) {
        console.error(`Failed to generate signed URL for ${fileName}`, err);
        updateProgress();
      }
    } else {
      await performDownload(fileUrl);
    }
  }
}
/*******************************************************************************
 * Ensures that a specified directory path exists within the app’s data directory.
 *
 * @function ensureDirectory
 * @param {string} path - The directory path to verify or create.
 * @returns {Promise<DirectoryEntry>} Resolves with the final directory entry if successful.
 *
 * @description
 * Recursively checks for each folder in the given path and creates any missing
 * directories using the Cordova File API.
 *******************************************************************************/


async function ensureDirectory(path) {
    try {
        // Normalize the path (remove extra slashes)
        const folders = path.split('/').filter(Boolean);

        // Start from the root data directory
        let currentPath = '';

        for (const folder of folders) {
            currentPath = currentPath ? `${currentPath}/${folder}` : folder;

            try {
                // Check if directory exists
                await Filesystem.stat({
                    path: currentPath,
                    directory: 'DATA',
                });
            } catch (error) {
                // Directory does not exist — create it
                await Filesystem.mkdir({
                    path: currentPath,
                    directory: 'DATA',
                    recursive: false,
                });
                console.log(`📁 Created directory: ${currentPath}`);
            }
        }

        console.log(`✅ Directory structure ensured: ${path}`);
        return Promise.resolve({ path, directory: 'DATA' });

    } catch (err) {
        console.error("❌ Failed to ensure directory:", err);
        return Promise.reject(err);
    }
}
/*******************************************************************************
 * Checks whether a given content type represents a file-based resource.
 *
 * @function checkIfFile
 * @param {string} type - The content type to check.
 * @returns {boolean} True if the content type matches a known file type; otherwise false.
 *
 * @description
 * Determines if the provided content type is one of the recognized file formats
 * such as video, document, presentation, image, or spreadsheet.
 *******************************************************************************/
function checkIfFile(type) {
    // List of content types considered as file-based resources
    const contentTypes = [
        "Video", "File Video", "Document", "File Doc",
        "Presentation", "File PPT", "Image", "PDF",
        "File PDF", "Spreadsheet"
    ];
    
    // Return true if the type exists in the list of known file types
    return contentTypes.includes(type);
}
/*******************************************************************************
 * Saves the KM Kiosk user courses to a local file.
 *
 * @function saveKmkioskUsercourses
 *
 * @description
 * Converts the user course data to JSON and writes it to the existing
 * local file using the Cordova File API.
 * Adds the deviceSerialNumber only if missing, without altering old timestamps.
 *******************************************************************************/

async function saveKmkioskUsercourses() {
    try {
        // 🔹 Step 1: Validate input data
        if (!Array.isArray(kmkioskUsercourses) || kmkioskUsercourses.length === 0) {
            console.warn("⚠️ saveKmkioskUsercourses: No user courses found.");
            return;
        }

        // 🔹 Step 2: Enrich records with metadata
        for (let i = 0; i < kmkioskUsercourses.length; i++) {
            const record = kmkioskUsercourses[i];

            if (!record.deviceSerialNumber) {
                record.deviceSerialNumber = shared.deviceSerialNumber;
            }

            if (!record.timestamp || record.timestamp === 0) {
                record.timestamp = Date.now();
            }
        }

        // 🔹 Step 3: Prepare JSON data
        const info = JSON.stringify(kmkioskUsercourses, null, 2);

        // If you have a specific folder or file name, define it here
        const folderPath = 'kmkioskData';
        const fileName = 'usercourses.json';
        const fullPath = `${folderPath}/${fileName}`;

        // 🔹 Step 4: Ensure folder exists (create if missing)
        try {
            await Filesystem.stat({ path: folderPath, directory: Directory.Data });
        } catch {
            await Filesystem.mkdir({ path: folderPath, directory: Directory.Data, recursive: true });
        }

        // 🔹 Step 5: Write data to file
        await Filesystem.writeFile({
            path: fullPath,
            data: info,
            directory: Directory.Data,
            encoding: Encoding.UTF8,
        });

        console.log(`✅ saveKmkioskUsercourses: Write success for ${kmkioskUsercourses.length} records (Device: ${deviceSerialNumber})`);

    } catch (error) {
        console.error("❌ saveKmkioskUsercourses: Write failed:", error);
        alert("saveKmkioskUsercourses: Write failed: " + error.message);
    }
}

/*******************************************************************************
 * Saves the KM Kiosk user assessments to a local file.
 *
 * @function saveKmkioskUserassessments
 *
 * @description
 * Converts the user assessment data to JSON and writes it to the existing
 * local file using the Cordova File API. Logs success or failure messages.
 *******************************************************************************/

async function saveKmkioskUserassessments() {
    try {
        // 🔹 Step 1: Validate data
        if (!Array.isArray(kmkioskUserassessments) || kmkioskUserassessments.length === 0) {
            console.warn("⚠️ saveKmkioskUserassessments: No assessments to save.");
            return;
        }

        // 🔹 Step 2: Convert data to JSON
        const info = JSON.stringify(kmkioskUserassessments, null, 2);

        // Define storage path
        const folderPath = 'kmkioskData';
        const fileName = 'userassessments.json';
        const fullPath = `${folderPath}/${fileName}`;

        // 🔹 Step 3: Ensure the directory exists
        try {
            await Filesystem.stat({ path: folderPath, directory: Directory.Data });
        } catch {
            await Filesystem.mkdir({
                path: folderPath,
                directory: Directory.Data,
                recursive: true
            });
        }

        // 🔹 Step 4: Write the JSON file
        await Filesystem.writeFile({
            path: fullPath,
            data: info,
            directory: Directory.Data,
            encoding: Encoding.UTF8,
        });

        // 🔹 Step 5: Log success
        console.log(`✅ saveKmkioskUserassessments: Write success! (${kmkioskUserassessments.length} records saved)`);

    } catch (error) {
        console.error("❌ saveKmkioskUserassessments: Write failed:", error);
        alert('saveKmkioskUserassessments: Write failed: ' + error.message);
    }
}

/*******************************************************************************
 * Deletes a local file from the application's DigiSign storage directory.
 *
 * @function deleteLocalFile
 * @param {string} fileName - The name of the file to be deleted.
 *
 * @description
 * Builds the file path using system configuration and deletes the file
 * from local storage using the Cordova File API. Logs success or failure
 * messages to the console.
 ******************************************************************************/


async function deleteLocalFile(fileName) {
    try {
        console.log("🗑️ Attempting to delete local file:", fileName);

        // 🔹 Step 1: Build relative and full paths
        const relativeDir = shared.systemConfiguration.systemInfo.localAppFolderDigiSign + "/";
        const regFileName = fileName;
        const fullPath = `${relativeDir}${regFileName}`;

        // 🔹 Step 2: Check if file exists
        try {
            await Filesystem.stat({
                path: fullPath,
                directory: Directory.Data,
            });
        } catch (err) {
            console.warn(`⚠️ File not found: ${fullPath}`, err);
            return;
        }

        // 🔹 Step 3: Delete the file
        await Filesystem.deleteFile({
            path: fullPath,
            directory: Directory.Data,
        });

        console.log(`✅ File deleted: ${fullPath}`);
    } catch (error) {
        console.error(`❌ Failed to delete file: ${fileName}`, error);
    }
}
/*******************************************************************************
 * Displays a printable kiosk token for the current user with selected information
 * and a QR code.
 *
 * @function generateKioskToken
 *
 * @description
 * Constructs and displays a token including:
 * - User category, name, company, phone, email, address, and visit details
 * - User image (if enabled)
 * - A QR code representing minified user and course data
 * - A "Print" button for printing the token
 * Fields displayed are controlled via print options from kmkioskConfiguration
 * or default settings. Layout is centered and formatted for kiosk display.
 *******************************************************************************/
/*******************************************************************************
 * Generates a printable kiosk token with user info and QR code.
 *
 * @function generateKioskToken
 *******************************************************************************/
function generateKioskToken() {
    generateToken(currentUserDetail, currentCourseDetail.course.courseName);
}
function generateKioskTokenWithCourseName(courseName) {
    generateToken(currentUserDetail, courseName);
}

async function generateToken(userDetail, courseName) {

    $("#loadingSpinner").show();

    const defaultPrintOptions = {
        userCategory: true,
        image: true,
        name: true,
        company: true,
        email: false,
        phone: true,
        address: false,
        city: false,
        state: false,
        country: false,
        zipcode: false,
        visiteename: true,
        visiteedepartment: true,
        bloodgroup: true,
        startdate: true,
        enddate: true
    };

    shared.currentState = "viewPrintToken";

    // ISO → readable date
    function formatReadableDate(isoString) {
        if (!isoString) return "";
        const d = new Date(isoString);
        if (isNaN(d.getTime())) return isoString;
        return d.toLocaleString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            hour12: true
        });
    }

    // ------------------------------------------------------------
    // Build HTML layout
    // ------------------------------------------------------------
    const printOptions =
        kmkioskConfiguration?.config?.printOptions || defaultPrintOptions;

    let htmlContent = `
    <div class="lightBkClass" id="kmkioskTokenViewArea"
         style="display:flex; justify-content:center; overflow:auto;">
        <div id="kmkioskTokenDisplayArea"
             style="width:400px; background:#fff; margin:10px; padding:10px 10px 20px 10px; line-height:1.5;">
            <div id="kmkioskTokenViewBox">
    `;

    if (printOptions.userCategory) {
        let title = userDetail.kmregusercategory?.toUpperCase() || "";
        htmlContent += `
            <div id="tokenTitle"
                 style="font-size:2.5em; text-align:center; width:100%;">
                 <strong>${title}</strong>
            </div>`;
    }

    htmlContent += `
        <div style="display:flex; flex-direction:column; align-items:center;">
    `;

    // 🖼 Image
    if (printOptions.image && userDetail.kmreguserImage) {
        htmlContent += `
            <div style="width:100%; text-align:center; margin-bottom:15px;">
                <img id="kmkioskUserImage"
                     alt="User Image"
                     style="width:100%; max-width:400px; object-fit:cover; border:2px solid #ccc;">
            </div>`;
    }

    // Text fields
    htmlContent += `<div style="width:100%; text-align:left;">`;

    if (printOptions.name && userDetail.kmregusername)
        htmlContent += `<div class="infoRow"><strong>Name:</strong> ${userDetail.kmregusername}</div>`;

    if (printOptions.company && userDetail.kmregusercompany)
        htmlContent += `<div class="infoRow"><strong>Company:</strong> ${userDetail.kmregusercompany}</div>`;

    if (printOptions.phone && userDetail.kmreguserphone)
        htmlContent += `<div class="infoRow"><strong>Phone:</strong> ${userDetail.kmreguserphone}</div>`;

    if (printOptions.bloodgroup && userDetail.kmreguserbloodgroup)
        htmlContent += `<div class="infoRow"><strong>Blood Group:</strong> ${userDetail.kmreguserbloodgroup}</div>`;

    // close text area + main column
    htmlContent += `</div></div>`;

    // More optional fields
    if (printOptions.address && userDetail.kmregaddress1)
        htmlContent += `<div class="infoRow"><strong>Address:</strong> ${userDetail.kmregaddress1}</div>`;

    if (printOptions.visiteename && userDetail.kmregvisiteename)
        htmlContent += `<div class="infoRow"><strong>Visitee:</strong> ${userDetail.kmregvisiteename}</div>`;

    if (printOptions.startdate && userDetail.kmregstartdate)
        htmlContent += `<div class="infoRow"><strong>Start:</strong> ${formatReadableDate(userDetail.kmregstartdate)}</div>`;

    if (printOptions.enddate && userDetail.kmregenddate)
        htmlContent += `<div class="infoRow"><strong>End:</strong> ${formatReadableDate(userDetail.kmregenddate)}</div>`;

    // ⭐ QR Code container
    htmlContent += `
        <div id="qrCodeArea" style="text-align:center; margin-top:10px;">
            <div id="tokenQRCode"></div>
        </div>
    `;

    // Close container
    htmlContent += `
            </div>
        </div>
    </div>

    <div class="qpaperfooter" style="position:absolute; bottom:40px;">
        <div></div>
        <div id="printBtn" class="kmkioskBtnStyle"
             onclick="printTokenSmart('kmkioskTokenDisplayArea')">Print</div>
    </div>
    `;

    // Inject into DOM
    $("#modulesDisplayArea").html(htmlContent);

    // ------------------------------------------------------------
    // Load image (Capacitor filesystem-safe)
    // ------------------------------------------------------------
    if (printOptions.image && userDetail.kmreguserImage) {
        displayLocalUserImage(userDetail.kmreguserImage, "kmkioskUserImage");
    }

    // ------------------------------------------------------------
    // Generate QR Data
    // ------------------------------------------------------------
    const userData = Object.entries(userDetail).reduce((acc, [key, value]) => {
        const shortKey = keyMap[key] || key;
        acc[shortKey] = value;
        return acc;
    }, {});

    const qrPayload = {
        app: "kiosk",
        code: {
            cat: userDetail.kmregusercategory,
            tr: courseName,
            u: userData
        }
    };

    const qrJSONString = JSON.stringify(qrPayload);

    // ------------------------------------------------------------
    // Generate QR Code
    // ------------------------------------------------------------
    const qrElement = document.getElementById("tokenQRCode");
    if (qrElement) {
        qrElement.innerHTML = "";
        new QRCode(qrElement, {
            text: qrJSONString,
            width: 380,
            height: 380,
            colorDark: "#000",
            colorLight: "#fff",
            correctLevel: QRCode.CorrectLevel.L
        });
        qrElement.dataset.text = qrJSONString;
    }

    // ------------------------------------------------------------
    // UI Controls
    // ------------------------------------------------------------
    $("#modulesMenuArea").hide();
    $("#modulesListArea").hide();
    $("#modulesDisplayArea").show();

    fixModuleHeight("modulesModuleHeader, footerSection", 20, "kmkioskTokenViewArea");

    $("#loadingSpinner").hide();
}

let printerConfig = {
    "portType": "COM",       // COM/Serial only
    "portName": "/dev/ttyAS7",
    "portSetting": "9600,n,8,1"
};

/*******************************************************************************
 * printTokenSmart(tokenContainerId)
 * ---------------------------------
 * Prints kiosk token dynamically with:
 *  - Dynamic category title (e.g., VISITOR, STAFF, etc.)
 *  - User photo as raster (native streaming)
 *  - User info as text
 *  - QR code (native or raster fallback)
 *  - Clean feed and cut
 *  - Flow control aware
 *******************************************************************************/
async function printTokenSmart(tokenContainerId) {
    console.log("🧠 printTokenSmart() invoked");

    const container = typeof tokenContainerId === "string"
        ? document.getElementById(tokenContainerId)
        : tokenContainerId;

    if (!container) {
        console.error("❌ [printTokenSmart] Container not found.");
        return;
    }

    /***********************************
     * 1️⃣ Load and prepare printer config
     ***********************************/
    const saved = JSON.parse(localStorage.getItem("printerConfig") || "null");
    if (!saved) {
        alert("⚠️ Please configure a printer first.");
        return;
    }

    const [baudStr, parityStr, dataBitsStr, stopBitsStr] =
        (saved.portSetting || "9600,n,8,1").split(",");

    const serialOpts = {
        path: saved.portName.startsWith("/dev/") ? saved.portName : `/dev/${saved.portName}`,
        baudRate: parseInt(baudStr, 10) || 9600,
        parity: (parityStr || "n").toLowerCase(),
        dataBits: parseInt(dataBitsStr, 10) || 8,
        stopBits: parseInt(stopBitsStr, 10) || 1,
        flowControl: saved.flowControl || "none" // ✅ NEW
    };

    console.log("🔧 Serial options:", serialOpts);

    /***********************************
     * 2️⃣ Extract page elements
     ***********************************/
    const imgEl = container.querySelector("#kmkioskUserImage");
    const textEls = Array.from(container.querySelectorAll(".infoRow"));
    const qrCanvas = container.querySelector("#tokenQRCode canvas");
    const qrImg = container.querySelector("#tokenQRCode img");

    // Extract dynamic title
    const titleEl = container.querySelector("#tokenTitle");
    const dynamicTitle = (titleEl?.innerText || "").trim().toUpperCase() || "TOKEN";
    console.log("🏷️ Token title:", dynamicTitle);

    // QR Data
    let qrDataRaw =
        container.querySelector("#tokenQRCode")?.dataset?.text ||
        (typeof finalQRObject !== "undefined" ? JSON.stringify(finalQRObject) : null);
    qrDataRaw = qrDataRaw?.replace(/\s+/g, "");
    console.log("🔳 QR data length:", qrDataRaw?.length || 0);

    if (!window.SerialPort) {
        alert("❌ SerialPort plugin not found!");
        return;
    }

    /***********************************
     * 3️⃣ Open Serial Port
     ***********************************/
    console.log("📡 Opening serial port...");
    window.SerialPort.open(serialOpts, () => {
        console.log("✅ Serial port opened successfully.");

        // Initialize printer
        window.SerialPort.writeText("\x1B\x40", async () => {
            console.log("🧾 Printer initialized (ESC @)");

            /*************************
             * 0️⃣ Print Title
             *************************/
            const titleCmd =
                "\x1B\x61\x01" +   // Center align
                "\x1B\x21\x30" +   // Double width + height
                dynamicTitle + "\n" +
                "\x1B\x21\x00" +   // Reset
                "\x1B\x61\x00";    // Left align

            window.SerialPort.writeText(titleCmd, async () => {
                console.log("✅ Title printed:", dynamicTitle);
                await printPhotoSection();
            });

            /*************************
             * 1️⃣ User Photo Section (Raster)
             *************************/
            async function printPhotoSection() {
                if (!imgEl || !imgEl.src) {
                    console.log("⚠️ No photo found, skipping image print.");
                    return printTextSection();
                }

                console.log("🖼 Printing user photo...");
                try {
                    const imgBytes = await imageToEscPos(imgEl);
                    console.log(`📦 [UserPhoto] Bytes=${imgBytes.length}`);

                    // ✅ Use writeStream if available (smooth, native streaming)
                    const writeFn = window.SerialPort.writeStream || window.SerialPort.writeBytes;
                    writeFn(imgBytes, () => {
                        console.log("✅ Photo printed. Feeding...");
                        const feed = new Uint8Array([0x0A]);
                        window.SerialPort.writeBytes(feed, printTextSection);
                    }, err => {
                        console.error("💥 Photo stream failed:", err);
                        printTextSection();
                    });
                } catch (err) {
                    console.error("💥 Image conversion failed:", err);
                    printTextSection();
                }
            }

            /*************************
             * 2️⃣ Text Section
             *************************/
            function printTextSection() {
                console.log("📝 Printing text section...");
                if (!textEls.length) return printQRCodeSection();

                let i = 0;
                const next = () => {
                    if (i >= textEls.length) {
                        console.log("✅ Text done. Feeding...");
                        return window.SerialPort.writeBytes(new Uint8Array([0x0A]), printQRCodeSection);
                    }

                    const line = (textEls[i++].innerText || "").trim();
                    if (!line) return next();
                    window.SerialPort.writeText(line + "\n", () => setTimeout(next, 25));
                };
                next();
            }

            /*************************
             * 3️⃣ QR Section (Native or Raster)
             *************************/
            async function printQRCodeSection() {
                console.log("🔳 Printing QR...");
                if (!qrDataRaw) return finalizePrint();

                try {
                    if (qrDataRaw.length > 400) {
                        console.warn("⚠️ Large QR → using raster fallback.");

                        const qrElement = qrCanvas || qrImg;
                        if (!qrElement) {
                            console.error("❌ No QR image found for fallback.");
                            return finalizePrint();
                        }

                        const qrBytes = await imageToEscPos(qrElement);
                        console.log("📦 [QR Raster] Bytes:", qrBytes.length);

                        const writeFn = window.SerialPort.writeStream || window.SerialPort.writeBytes;
                        writeFn(qrBytes, () => {
                            console.log("✅ QR raster printed. Feeding...");
                            window.SerialPort.writeBytes(new Uint8Array([0x0A, 0x0A]), finalizePrint);
                        }, err => {
                            console.error("💥 QR stream failed:", err);
                            finalizePrint();
                        });
                        return;
                    }

                    // Native QR print
                    const qrBytes = buildEscPosQRCodeBytes(qrDataRaw);
                    console.log("🔳 [QR Native] Bytes:", qrBytes.length);
                    window.SerialPort.writeBytes(new Uint8Array([0x1B, 0x61, 0x01]), () => {
                        window.SerialPort.writeBytes(qrBytes, () => {
                            console.log("✅ QR printed. Feeding...");
                            window.SerialPort.writeBytes(new Uint8Array([0x0A, 0x0A]), finalizePrint);
                        });
                    });
                } catch (err) {
                    console.error("💥 QR print failed:", err);
                    finalizePrint();
                }
            }

            /*************************
             * 4️⃣ Finalize Print
             *************************/
            function finalizePrint() {
                console.log("🔚 Finalizing print...");
                const cut = new Uint8Array([0x1D, 0x56, 0x00]);
                window.SerialPort.writeBytes(cut, () => {
                    console.log("✅ Cut sent. Closing port...");
                    window.SerialPort.close?.(() => console.log("🔒 Port closed."));
                });
            }
        });
    }, err => {
        console.error("💥 Failed to open serial port:", err);
        alert("❌ Failed to open serial port: " + err);
    });
}


/*******************************************************************************
 * imageToEscPos(element, ditherMode)
 * Converts <img> or <canvas> into ESC/POS raster data.
 * - Scales to 384 px width
 * - Supports multiple dithering modes:
 *   none | bayer2x2 | bayer4x4 | floydsteinberg
 *******************************************************************************/
function imageToEscPos(element, ditherMode = "none") {
    return new Promise((resolve, reject) => {
        try {
            const MAX_WIDTH = 384;
            const canvas = document.createElement("canvas");
            const ctx = canvas.getContext("2d");

            function applyDithering(ctx, w, h) {
                const imgData = ctx.getImageData(0, 0, w, h);
                const processed = applyDitheringMode(imgData, w, h, ditherMode);
                ctx.putImageData(processed, 0, 0);
            }

            if (element.tagName === "CANVAS") {
                const scale = Math.min(1, MAX_WIDTH / element.width);
                const w = Math.floor(element.width * scale);
                const h = Math.floor(element.height * scale);
                canvas.width = w;
                canvas.height = h;
                ctx.drawImage(element, 0, 0, w, h);
                applyDithering(ctx, w, h);
                return convertCanvasToEscPos(canvas, bytes => resolve(bytes));
            }

            if (element.tagName === "IMG") {
                const img = new Image();
                img.crossOrigin = "anonymous";
                img.onload = function () {
                    const scale = Math.min(1, MAX_WIDTH / img.width);
                    const w = Math.floor(img.width * scale);
                    const h = Math.floor(img.height * scale);
                    canvas.width = w;
                    canvas.height = h;
                    ctx.drawImage(img, 0, 0, w, h);
                    applyDithering(ctx, w, h);
                    convertCanvasToEscPos(canvas, bytes => resolve(bytes));
                };
                img.onerror = reject;
                img.src = element.src;
                return;
            }

            reject(new Error("Unsupported element type for imageToEscPos()"));
        } catch (err) {
            reject(err);
        }
    });
}

/*******************************************************************************
 * applyDitheringMode(imageData, width, height, mode)
 *******************************************************************************/
function applyDitheringMode(imageData, width, height, mode) {
    switch (mode) {
        case "bayer2x2": return bayerDither(imageData, width, height, 2);
        case "bayer4x4": return bayerDither(imageData, width, height, 4);
        case "floydsteinberg": return floydSteinbergDither(imageData, width, height);
        case "none":
        default: return thresholdDither(imageData, width, height);
    }
}

/*******************************************************************************
 * Threshold Dither (no pattern)
 *******************************************************************************/
function thresholdDither(imageData, width, height) {
    const d = imageData.data;
    for (let i = 0; i < d.length; i += 4) {
        const gray = 0.3 * d[i] + 0.59 * d[i + 1] + 0.11 * d[i + 2];
        const v = gray < 128 ? 0 : 255;
        d[i] = d[i + 1] = d[i + 2] = v;
    }
    return imageData;
}

/*******************************************************************************
 * Bayer Ordered Dithering (2×2 or 4×4)
 *******************************************************************************/
function bayerDither(imageData, width, height, size = 2) {
    const d = imageData.data;
    const bayer2 = [
        [0, 2],
        [3, 1]
    ];
    const bayer4 = [
        [0, 8, 2, 10],
        [12, 4, 14, 6],
        [3, 11, 1, 9],
        [15, 7, 13, 5]
    ];
    const matrix = size === 4 ? bayer4 : bayer2;
    const div = size * size;

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const i = (y * width + x) * 4;
            const gray = 0.3 * d[i] + 0.59 * d[i + 1] + 0.11 * d[i + 2];
            const threshold = (matrix[y % size][x % size] / div) * 255;
            const v = gray < threshold ? 0 : 255;
            d[i] = d[i + 1] = d[i + 2] = v;
        }
    }
    return imageData;
}

/*******************************************************************************
 * Floyd–Steinberg Dithering (error diffusion)
 *******************************************************************************/
function floydSteinbergDither(imageData, width, height) {
    const d = imageData.data;
    const lum = new Float32Array(width * height);
    for (let i = 0; i < width * height; i++) {
        const j = i * 4;
        lum[i] = 0.3 * d[j] + 0.59 * d[j + 1] + 0.11 * d[j + 2];
    }

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const i = y * width + x;
            const oldPixel = lum[i];
            const newPixel = oldPixel < 128 ? 0 : 255;
            const err = oldPixel - newPixel;
            lum[i] = newPixel;

            if (x + 1 < width) lum[i + 1] += err * 7 / 16;
            if (x - 1 >= 0 && y + 1 < height) lum[i + width - 1] += err * 3 / 16;
            if (y + 1 < height) lum[i + width] += err * 5 / 16;
            if (x + 1 < width && y + 1 < height) lum[i + width + 1] += err * 1 / 16;
        }
    }

    for (let i = 0; i < width * height; i++) {
        const v = lum[i] < 128 ? 0 : 255;
        const j = i * 4;
        d[j] = d[j + 1] = d[j + 2] = v;
    }
    return imageData;
}

/***************************************************************************
 * Helper: Convert Canvas → ESC/POS Raster Bytes (block-safe & fast)
 * - Groups 8 lines per block (≈8× faster than line-by-line)
 * - Prevents chunk-split distortion
 ***************************************************************************/
function convertCanvasToEscPos(canvas, callback) {
    const ctx = canvas.getContext("2d");
    const img = ctx.getImageData(0, 0, canvas.width, canvas.height);

    const alignedWidth = Math.ceil(canvas.width / 8) * 8;
    const height = canvas.height;
    const lineBytes = alignedWidth / 8;
    const blockHeight = 8; // ✅ 8 lines per block (tunable)
    const bytes = [];

    for (let y = 0; y < height; y += blockHeight) {
        const blockH = Math.min(blockHeight, height - y);

        // GS v 0 command header
        bytes.push(0x1D, 0x76, 0x30, 0x00);
        bytes.push(lineBytes & 0xFF, lineBytes >> 8, blockH & 0xFF, blockH >> 8);

        // Write blockH scanlines
        for (let yy = 0; yy < blockH; yy++) {
            const yPos = y + yy;
            for (let x = 0; x < alignedWidth; x += 8) {
                let byte = 0;
                for (let bit = 0; bit < 8; bit++) {
                    const i = ((yPos * canvas.width) + (x + bit)) * 4;
                    const gray = (img.data[i] + img.data[i + 1] + img.data[i + 2]) / 3;
                    if (gray < 128) byte |= (0x80 >> bit);
                }
                bytes.push(byte);
            }
        }
    }

    console.log(`[convertCanvasToEscPos] width=${alignedWidth}, height=${height}, bytes=${bytes.length}, blockHeight=${blockHeight}`);
    callback(new Uint8Array(bytes));
}


/*
function convertCanvasToEscPos(canvas, callback) {
    const ctx = canvas.getContext("2d");
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    const alignedWidth = Math.ceil(canvas.width / 8) * 8; // ✅ byte alignment
    const height = canvas.height;
    const bytes = [];

    // ESC/POS raster header
    bytes.push(0x1D, 0x76, 0x30, 0x00);
    bytes.push((alignedWidth / 8) & 0xFF, (alignedWidth / 8) >> 8, height & 0xFF, height >> 8);

    // Convert pixels to monochrome bitmap
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < alignedWidth; x += 8) {
            let byte = 0;
            for (let bit = 0; bit < 8; bit++) {
                const i = ((y * canvas.width) + (x + bit)) * 4;
                let avg = 255;
                if (x + bit < canvas.width) {
                    const r = imgData.data[i];
                    const g = imgData.data[i + 1];
                    const b = imgData.data[i + 2];
                    avg = (r + g + b) / 3;
                }
                if (avg < 128) byte |= (0x80 >> bit);
            }
            bytes.push(byte);
        }
    }

    // Safety: ensure byte count matches declared header
    const expected = (alignedWidth / 8) * height;
    const actual = bytes.length - 8; // exclude header
    if (actual !== expected) {
        console.warn(`⚠️ Raster length mismatch! expected=${expected}, actual=${actual}`);
    } else {
        console.log(`✅ Raster data validated: ${actual} bytes`);
    }

    callback(new Uint8Array(bytes));
}*/


/*******************************************************************************
 * printSamplePage(config, log)
 * Adds optional flow control handling
 *******************************************************************************/
function printSamplePage(config, log) {
    const now = new Date().toLocaleString();
    log(`🕒 [${now}] Starting test page`);

    const cfg = config || printerConfig || {};
    const [baudStr, parityStr, dataBitsStr, stopBitsStr] =
        (cfg.portSetting || "9600,n,8,1").split(",");

    const serialOpts = {
        path: cfg.portName && cfg.portName.startsWith("/dev/")
            ? cfg.portName
            : `/dev/${cfg.portName || "ttyS0"}`,
        baudRate: parseInt(baudStr, 10) || 9600,
        parity: (parityStr || "n").toLowerCase(),
        dataBits: parseInt(dataBitsStr, 10) || 8,
        stopBits: parseInt(stopBitsStr, 10) || 1,
        flowControl: cfg.flowControl || "none"  // ✅ NEW
    };

    log("🔧 Opening port with options: " + JSON.stringify(serialOpts, null, 2));

    try {
        log("📡 [STEP] Attempting to open serial port...");
        window.SerialPort.open(serialOpts, () => {
            log("✅ [OK] Serial port successfully opened.");

            // ESC/POS constants
            const ESC = "\x1B", GS = "\x1D", LF = "\x0A";

            const qrData = "https://bveu.in/";
            const qrBytes = buildEscPosQRCodeBytes(qrData);
            log(`🔳 [QR DEBUG] Data=${qrData}, Bytes=${qrBytes.length}`);

            const testText =
                ESC + "@\n" +
                "============================\n" +
                "     🧾 TEST PRINT PAGE 🧾    \n" +
                "============================\n" +
                "Printer: OK\n" +
                `Port: ${serialOpts.path}\n` +
                `Baud: ${serialOpts.baudRate}, Parity: ${serialOpts.parity.toUpperCase()}\n` +
                `Data Bits: ${serialOpts.dataBits}, Stop Bits: ${serialOpts.stopBits}\n` +
                `Flow: ${serialOpts.flowControl}\n\n` +
                "----------------------------\n" +
                "Left aligned text\n" +
                ESC + "a" + "\x01" + "Centered text\n" +
                ESC + "a" + "\x02" + "Right aligned text\n" +
                ESC + "a" + "\x00" +
                "----------------------------\n" +
                ESC + "E" + "\x01" + "Bold Text ON\n" + ESC + "E" + "\x00" +
                ESC + "!" + "\x10" + "Double Height\n" + ESC + "!" + "\x00" +
                ESC + "!" + "\x20" + "Double Width\n" + ESC + "!" + "\x00" +
                ESC + "!" + "\x30" + "Double Height & Width\n" + ESC + "!" + "\x00" +
                "----------------------------\n" +
                "Sample Numbers: 1234567890\n" +
                "Sample Letters: ABCDEFGHIJ\n" +
                "Symbols: #@$%&*()/+-=?!\n" +
                "----------------------------\n" +
                "Testing QR Code...\n";

            const afterQR =
                "----------------------------\n" +
                "Check line feeds...\n\n\n" +
                ESC + "a" + "\x01" + "=== END OF TEST ===\n" +
                ESC + "a" + "\x00" + LF + LF + LF +
                GS + "V" + "\x00"; // Cut

            // Print in sequence
            window.SerialPort.writeText(testText, () => {
                window.SerialPort.writeBytes(qrBytes, () => {
                    window.SerialPort.writeText(afterQR, () => {
                        log("✅ [OK] Test page printed successfully.");
                        window.SerialPort.close?.(
                            () => log("✅ [OK] Serial port closed."),
                            err => log(`❌ [ERROR] Close failed: ${err}`)
                        );
                    });
                });
            });
        }, err => log(`❌ [ERROR] Failed to open serial port: ${err}`));
    } catch (ex) {
        log(`💥 [EXCEPTION] printSamplePage failed: ${ex.message}`);
    }

    log("🕒 [END] Print sample request queued (async).");
}

let originalImageDataURL = null; // store clean unprocessed version
/*******************************************************************************
 * testSerialPrinterWithLog()
 * Final version:
 *  - Common title (with top margin)
 *  - Equal height panels
 *  - Hidden fullscreen log overlay
 *  - “View Log” toggle button beside Save Default
 *******************************************************************************/
function testSerialPrinterWithLog() {
    shared.currentState = "testPrinter";
    $("#modulesMenuArea, #modulesListArea").hide();
    $("#modulesDisplayArea").show().html("");

    const container = document.getElementById("modulesDisplayArea");

    /******************************************
     * PAGE HEADER
     ******************************************/
    const header = document.createElement("h2");
    header.textContent = "🖨 Printer Setup & Test";
    header.style.cssText = `
        font-size: 24px;
        color: #004aad;
        text-align: center;
        margin-top: 15px;
        margin-bottom: 15px;
    `;
    container.appendChild(header);

    /******************************************
     * MAIN WRAPPER – two test boxes side by side
     ******************************************/
    const mainWrapper = document.createElement("div");
    mainWrapper.style.cssText = `
        display: flex;
        flex-direction: row;
        align-items: stretch;
        justify-content: center;
        width: 100%;
        gap: 20px;
        background: #f7f7f9;
        padding: 20px;
        box-sizing: border-box;
    `;

    /****************************
     * LEFT PANEL – Printer Setup
     ****************************/
    const setup = document.createElement("div");
    setup.style.cssText = `
        display:flex;flex-direction:column;align-items:center;
        background:#f7f7f9;flex:1;max-width:600px;
    `;

    const box = document.createElement("div");
    box.style.cssText = `
        width:100%;height:100%;
        background:white;padding:15px;border-radius:10px;
        box-shadow:rgba(0,0,0,0.1) 0 2px 6px;
        display:flex;flex-direction:column;justify-content:space-between;
    `;
    box.id = "printerOptionBox";
    box.innerHTML = `
        <div>
            <div style="display:flex;align-items:center;margin-bottom:10px;">
                <label style="width:100px;">Port:</label>
                <select id="portSelect" style="flex:1; padding:5px;"></select>
                <button id="scanPortsBtn" class="kmkioskBtnStyle" style="margin-left:10px;">🔍 Scan</button>
            </div>
            <div style="display:flex;align-items:center;margin-bottom:10px;">
                <label style="width:100px;">Baud Rate:</label>
                <select id="baudInput" style="flex:1; padding:5px;">
                    <option value="9600">9600</option><option value="19200">19200</option>
                    <option value="38400">38400</option><option value="57600">57600</option>
                    <option value="115200">115200</option>
                </select>
            </div>
            <div style="display:flex;align-items:center;margin-bottom:10px;">
                <label style="width:100px;">Parity:</label>
                <select id="paritySelect" style="flex:1; padding:5px;">
                    <option value="n">None</option><option value="e">Even</option><option value="o">Odd</option>
                </select>
            </div>
            <div style="display:flex;align-items:center;margin-bottom:10px;">
                <label style="width:100px;">Data Bits:</label>
                <input id="dataBitsInput" type="number" value="8" min="5" max="8" style="flex:1; padding:5px;">
            </div>
            <div style="display:flex;align-items:center;margin-bottom:10px;">
                <label style="width:100px;">Stop Bits:</label>
                <input id="stopBitsInput" type="number" value="1" min="1" max="2" style="flex:1; padding:5px;">
            </div>
            <div style="display:flex;align-items:center;margin-bottom:10px;">
                <label style="width:100px;">Flow Control:</label>
                <select id="flowSelect" style="flex:1; padding:5px;">
                    <option value="none">None</option>
                    <option value="xonxoff">XON/XOFF</option>
                    <option value="rtscts">RTS/CTS</option>
                </select>
            </div>
        </div>
        <div style="text-align:center;margin-top:10px;display:flex;align-items:center;">
            <button id="printTestPageBtn" class="kmkioskBtnStyle">🧾 Print Test Page</button>
        </div>
    `;
    setup.appendChild(box);

    /****************************
     * RIGHT PANEL – Image Dithering
     ****************************/
    const testPanel = document.createElement("div");
    testPanel.style.cssText = `
        flex:1;max-width:400px;
        background:white;border-radius:10px;
        box-shadow:rgba(0,0,0,0.1) 0 2px 6px;
        padding:15px;display:flex;flex-direction:column;
        justify-content:space-between;align-items:center;
    `;
    testPanel.innerHTML = `
        <div style="width:100%;">
            <div style="text-align:center;display:flex; justify-content: center;">
                <button id="captureImageBtn" class="kmkioskBtnStyle" style="margin-bottom:10px;">📸 Capture Image</button>
            </div>
            <div id="previewBox" style="width:100%;height:220px;text-align:center;margin-bottom:10px;border:1px solid #ccc;border-radius:6px;display:flex;align-items:center;justify-content:center;background:#f9f9f9;">
                <span id="noImagePlaceholder" style="color:#888;">No image captured</span>
                <img id="ditherPreview" src="" alt="Captured preview" style="max-width:100%;max-height:220px;border-radius:6px;display:none;">
            </div>
            <div style="width:100%;margin-bottom:10px;">
                <label style="font-weight:500;">Dithering Technique:</label>
                <select id="ditherSelect" style="width:100%; padding:5px; margin-top:5px;">
                    <option value="none">None (Threshold)</option>
                    <option value="bayer2x2">Bayer 2x2</option>
                    <option value="bayer4x4">Bayer 4x4</option>
                    <option value="floydsteinberg">Floyd–Steinberg</option>
                </select>
            </div>
        </div>
        <div style="text-align:center; display:flex; justify-content:center; gap:10px;">
            <button id="printImageBtn" class="kmkioskBtnStyle">🧾 Print Test Image</button>
        </div>
    `;
    mainWrapper.appendChild(setup);
    mainWrapper.appendChild(testPanel);
    container.appendChild(mainWrapper);

    /****************************
     * FOOTER – Save + View Log
     ****************************/
    const footer = document.createElement("div");
    footer.style.cssText = `
        width:100%;max-width:1200px;margin:20px auto 0;
        display:flex;flex-direction:row;justify-content:space-between;gap:10px;
    `;
    footer.innerHTML = `
        <button id="saveConfigBtn" class="kmkioskBtnStyle">💾 Save Default Configuration</button>
        <button id="viewLogBtn" class="kmkioskBtnStyle">📜 View Log</button>
    `;
    container.appendChild(footer);

    /****************************
     * HIDDEN LOG OVERLAY
     ****************************/
    const logOverlay = document.createElement("div");
    logOverlay.id = "logOverlay";
    logOverlay.style.cssText = `
        position:fixed;top:0;left:0;width:100%;height:100%;
        background:rgba(0,0,0,0.85);z-index:9999;display:none;
        flex-direction:column;justify-content:center;align-items:center;
    `;
    logOverlay.innerHTML = `
        <div style="width:90%;max-width:1000px;height:80%;background:#000;border-radius:8px;overflow:auto;position:relative;">
            <button id="closeLogBtn" style="
                position:absolute;top:10px;right:10px;
                background:#ff4444;color:#fff;border:none;border-radius:5px;
                padding:5px 10px;cursor:pointer;">✖ Close</button>
            <div id="serialLogWindow" style="
                color:#0f0;font-family:monospace;
                padding:10px;font-size:13px;white-space:pre-wrap;"></div>
        </div>
    `;
    document.body.appendChild(logOverlay);

    /****************************
     * LOG FUNCTION
     ****************************/
    function log(msg) {
        const logWin = document.getElementById("serialLogWindow");
        const t = new Date().toLocaleTimeString();
        const div = document.createElement("div");
        div.textContent = `[${t}] ${msg}`;
        logWin.appendChild(div);
        logWin.scrollTop = logWin.scrollHeight;
    }

    /****************************
     * CONFIG LOAD
     ****************************/
    let saved = JSON.parse(localStorage.getItem("printerConfig") || "null");
    if (saved) {
        const [b, p, d, s] = saved.portSetting.split(",");
        $("#baudInput").val(b);
        $("#paritySelect").val(p);
        $("#dataBitsInput").val(d);
        $("#stopBitsInput").val(s);
        $("#flowSelect").val(saved.flowControl || "none");
        $("#ditherSelect").val(saved.dithering || "none");
    }

    /****************************
     * SCAN PORTS
     ****************************/
    function scanPorts() {
        log("🔍 Scanning ports...");
        window.SerialPort?.listPorts(
            ports => {
                const sel = $("#portSelect").empty();
                if (ports?.length) ports.forEach(p => sel.append(`<option value="${p}">${p}</option>`));
                else sel.append("<option>No ports</option>");
                log(`✅ Found ${ports.length || 0} port(s).`);
            },
            err => log("❌ Scan failed: " + err)
        );
    }
    scanPorts();
    $("#scanPortsBtn").click(scanPorts);

    /****************************
     * TEST PAGE PRINT
     ****************************/
    $("#printTestPageBtn").click(() => {
        const port = $("#portSelect").val();
        if (!port) return log("⚠️ Select a port first!");
        const cfg = {
            portName: port.replace("/dev/", ""),
            portSetting: `${$("#baudInput").val()},${$("#paritySelect").val()},${$("#dataBitsInput").val()},${$("#stopBitsInput").val()}`,
            flowControl: $("#flowSelect").val(),
            dithering: $("#ditherSelect").val()
        };
        log("🧾 Testing with: " + JSON.stringify(cfg));
        printSamplePage(cfg, log);
    });

    /****************************
     * SAVE DEFAULT
     ****************************/
    $("#saveConfigBtn").click(() => {
        const port = $("#portSelect").val();
        if (!port) return log("⚠️ Select a port first!");
        const cfg = {
            portType: "COM",
            portName: port.replace("/dev/", ""),
            portSetting: `${$("#baudInput").val()},${$("#paritySelect").val()},${$("#dataBitsInput").val()},${$("#stopBitsInput").val()}`,
            flowControl: $("#flowSelect").val(),
            dithering: $("#ditherSelect").val()
        };
        localStorage.setItem("printerConfig", JSON.stringify(cfg));
        printerConfig = cfg;
        log("💾 Saved printer config: " + JSON.stringify(cfg));
        alert("✅ Default configuration saved!");
    });

    /****************************
     * VIEW / CLOSE LOG
     ****************************/
    $("#viewLogBtn").click(() => {
        $("#logOverlay").css("display", "flex");
    });

    $(document).on("click", "#closeLogBtn", () => {
        $("#logOverlay").css("display", "none");
    });

    /****************************
     * AUTO-UPDATE DITHER PREVIEW
     ****************************/
    $("#ditherSelect").on("change", () => {
        if (!originalImageDataURL) return;
        const ditherMode = $("#ditherSelect").val();
        log(`🎨 Applying ${ditherMode} dithering...`);

        const img = new Image();
        img.src = originalImageDataURL;
        img.onload = () => {
            const MAX_WIDTH = 384;
            const canvas = document.createElement("canvas");
            const ctx = canvas.getContext("2d");

            // Scale to printer width
            const scale = Math.min(1, MAX_WIDTH / img.width);
            const w = Math.floor(img.width * scale);
            const h = Math.floor(img.height * scale);
            canvas.width = w;
            canvas.height = h;

            // Draw base image
            ctx.drawImage(img, 0, 0, w, h);

            // Apply selected dithering (unless "none")
            if (ditherMode !== "none") {
                const imgData = ctx.getImageData(0, 0, w, h);
                const processed = applyDitheringMode(imgData, w, h, ditherMode);
                ctx.putImageData(processed, 0, 0);
            }

            // Convert to PNG preview
            const dataUrl = canvas.toDataURL("image/png");
            $("#ditherPreview").attr("src", dataUrl).show();
            $("#noImagePlaceholder").hide();
            log("✅ Dithered preview updated.");
        };
    });



    /****************************
     * IMAGE CAPTURE + PRINT
     ****************************/
    let capturedImage = null;

    $("#captureImageBtn").click(async () => {
        try {
            const input = document.createElement("input");
            input.type = "file";
            input.accept = "image/*";
            input.capture = "environment";
            input.onchange = e => {
                const file = e.target.files[0];
                if (!file) return;
                const url = URL.createObjectURL(file);
                $("#ditherPreview").attr("src", url).show();
                $("#noImagePlaceholder").hide();
                capturedImage = file;
                originalImageDataURL = url; // 🔸 Remember the clean version
                log("📸 Image loaded for dithering test.");
            };
            input.click();
        } catch (err) {
            log("💥 Capture failed: " + err);
        }
    });


    /****************************
     * PRINT TEST IMAGE (FIXED)
     ****************************/
    $("#printImageBtn").click(async () => {
        if (!originalImageDataURL) return log("⚠️ No image captured yet!");

        const ditherMode = $("#ditherSelect").val();
        log(`🖨 Preparing image print with ${ditherMode} dithering...`);

        const img = new Image();
        img.src = $("#ditherPreview").attr("src");

        img.onload = async () => {
            try {
                // 🧠 Convert image to a single ESC/POS raster command
                const bytes = await imageToEscPos(img, ditherMode);
                log(`📦 Generated continuous raster data: ${bytes.length} bytes`);

                // Load printer config
                const saved = JSON.parse(localStorage.getItem("printerConfig") || "null");
                const [baudStr, parityStr, dataBitsStr, stopBitsStr] =
                    (saved.portSetting || "9600,n,8,1").split(",");

                const serialOpts = {
                    path: saved.portName.startsWith("/dev/")
                        ? saved.portName
                        : `/dev/${saved.portName}`,
                    baudRate: parseInt(baudStr, 10) || 9600, // ✅ keep low
                    parity: (parityStr || "n").toLowerCase(),
                    dataBits: parseInt(dataBitsStr, 10) || 8,
                    stopBits: parseInt(stopBitsStr, 10) || 1,
                    flowControl: saved.flowControl || "none"
                };

                log(`📡 Opening printer port: ${serialOpts.path}`);
                window.SerialPort.open(serialOpts, () => {
                    log("✅ Printer connected. Initializing...");

                    // 🧾 Initialize printer
                    const init = new TextEncoder().encode("\x1B\x40"); // ESC @
                    window.SerialPort.writeBytes(init, () => {
                        log("🧾 Printer reset. Sending continuous raster data...");

                        // 🚀 Send all image data in one go
                        window.SerialPort.writeBytes(bytes, () => {
                            log(`✅ Image bytes (${bytes.length}) sent successfully.`);

                            // 🧾 Feed + Cut
                            const feedCut = new Uint8Array([
                                0x0A, 0x0A, 0x1D, 0x56, 0x00 // LF x2 + Cut
                            ]);
                            window.SerialPort.writeBytes(feedCut, () => {
                                log("✂️ Cut command sent. Closing...");
                                setTimeout(() => {
                                    window.SerialPort.close(
                                        () => log("🔒 Port closed cleanly."),
                                        err => log(`❌ Close failed: ${err}`)
                                    );
                                }, 100);
                            });
                        }, err => log(`💥 Raster write failed: ${err}`));
                    });
                }, err => log(`💥 Failed to open printer port: ${err}`));
            } catch (err) {
                log(`💥 [ERROR] Image print failed: ${err}`);
            }
        };
    });



}


/*******************************************************************************
 * buildEscPosQRCodeBytes(data)
 * - Returns a Uint8Array with proper ESC/POS QR code commands (binary-safe)
 * - Supports most 58mm & 80mm printers (Epson, XPrinter, Rongta, etc.)
 *******************************************************************************/
function buildEscPosQRCodeBytes(data) {
    const encoder = new TextEncoder();
    const bytes = [];
    const GS = 0x1D;
    const k = 0x28;
    const qrData = encoder.encode(data);

    const model = 0x32; // Model 2
    const errorCorrection = 0x31; // M
    const moduleSize = 5; // 1–16

    const storeLen = qrData.length + 3;
    const pL = storeLen & 0xFF;
    const pH = (storeLen >> 8) & 0xFF;

    bytes.push(GS, k, 0x6B, 0x04, 0x00, 0x31, 0x41, model, 0x00); // Select model
    bytes.push(GS, k, 0x6B, 0x03, 0x00, 0x31, 0x45, errorCorrection); // Error correction
    bytes.push(GS, k, 0x6B, 0x03, 0x00, 0x31, 0x43, moduleSize); // Module size
    bytes.push(GS, k, 0x6B, pL, pH, 0x31, 0x50, 0x30); // Store data
    bytes.push(...qrData);
    bytes.push(GS, k, 0x6B, 0x03, 0x00, 0x31, 0x51, 0x30); // Print QR
    bytes.push(0x0A); // Line feed

    console.log("🔳 [QR DEBUG] buildEscPosQRCodeBytes() length:", bytes.length);
    return new Uint8Array(bytes);
}


/******************************************************************************************
Name: viewKmkioskRegistrations
Purpose: Generates paginated list of user registrations from the local memory. 
******************************************************************************************/
function viewKmkioskRegistrations(pageNumber = 0, pageSize = 50) {
    shared.currentState = "viewKmkioskRegistrations";
    shared.currentSourceState = shared.currentState;
    $("#modulesMenuArea").hide();
    $("#modulesListArea").show();
    $("#modulesDisplayArea").hide();
    fixModuleHeight("modulesModuleHeader, footerSection", 20, "modulesListArea");

    let itemList = kmkioskRegistrations || [];
    let totalItems = itemList.length;
    let totalPages = Math.ceil(totalItems / pageSize);

    // ✅ Slice the dataset based on the page number and page size
    let startIndex = pageNumber * pageSize;
    let endIndex = startIndex + pageSize;
    let items = itemList.slice(startIndex, endIndex);

    let htmlContent = '';
    if (items && items.length > 0) {
        let listItems = [];

        htmlContent += '<div class="searchArea"><div class="searchBox" style="font-size: 1.3em; justify-content: center; text-align: center;">REGISTRED USERS ('+totalItems+')</div></div>';

        for (let index = items.length; index > 0; index--) {
            let item = items[index-1];
            let states = [];

            let description = `
                <div>
                    <a style="color: var(--secondary-cyan); font-size: 1.1em; font-weight: bold;" href="tel:${item.kmreguserphone}">
                        ${item.kmreguserphone}
                    </a>
                </div>
                <div>${item.kmreguseremail}</div>
            `;
            if(item.kmregusercategory == "EMPLOYEE") {
                description += `
                    <div>Department: ${item.kmregvisiteedepartment}</div>
                    <div>Employee ID: ${item.kmregemployeeid}</div>
                `;
            } else if(item.kmregusercategory == "VISITOR" || item.kmregusercategory == "CONTRACTOR") {
                description += `
                    <div>Company: ${item.kmregusercompany}</div>
                    <div>Visiting: ${item.kmregvisiteename} (${item.kmregvisiteedepartment})</div>
                    <div>${item.kmregstartdate} to ${item.kmregenddate}</div>
                `;
            } else if(item.kmregusercategory == "DRIVER") {
                description += `
                    <div>Company: ${item.kmregusercompany}</div>
                    <div>${item.kmregstartdate} to ${item.kmregenddate}</div>
                `;
            }
                


            let fullName = item.kmregusername;

            let image = '';
            if (item.kmreguserImage && item.kmreguserImage.length > 0) {
                image = item.kmreguserImage;
            } else {
                image = `<img style="padding: 0 20%; width: 100%;" src="./img/icon_img.png" onerror="this.onerror=null;this.src='./img/noimage.jpg';" />`;
            }

            states.push({
                "text": item.kmregusercategory || "N/A",
                "type": "successState"
            });

            let itemJson = {
                "id": item.kmreguserphone,
                "image": image,
                "title": fullName,
                "description": description,
                "clickAction": "getKmkioskUser('" + item.kmreguserphone + "')",
                "states": states
            };

            listItems.push(itemJson);
        }

        // ✅ Create the list for this page
        createList(
            "kmkiosk",
            htmlContent,
            listItems,
            { pageNumber: pageNumber, pageSize: pageSize, totalItems: totalItems },
            totalPages,
            "modulesListBox",
            "getUserAtIndex",
            "viewKmkioskRegistrations",
            "ticketStyle"
        );

    } else {
        htmlContent += '<div class="formlabel">No registrations found</div>';
        $('#modulesListBox').html(htmlContent);
    }
}


/******************************************************************************************
Name: viewKmkioskLearninngs
Purpose: Generates paginated list of user courses from the local memory. 
******************************************************************************************/
function viewKmkioskLearninngs(pageNumber = 0, pageSize = 50) {
    shared.currentState = "viewKmkioskLearninngs";
    shared.currentSourceState = shared.currentState;
    $("#modulesMenuArea").hide();
    $("#modulesListArea").show();
    $("#modulesDisplayArea").hide();
    fixModuleHeight("modulesModuleHeader, footerSection", 20, "modulesListArea");

    let itemList = kmkioskUsercourses || [];
    let totalItems = itemList.length;
    let totalPages = Math.ceil(totalItems / pageSize);

    // ✅ Slice the dataset based on the page number and page size
    let startIndex = pageNumber * pageSize;
    let endIndex = startIndex + pageSize;
    let items = itemList.slice(startIndex, endIndex);

    let htmlContent = '';
    if (items && items.length > 0) {
        let listItems = [];

        htmlContent += '<div class="searchArea"><div class="searchBox" style="font-size: 1.3em; justify-content: center; text-align: center;">TRAININGS ('+totalItems+')</div></div>';

        for (let index = items.length; index > 0; index--) {
            let item = items[index-1];
            let states = [];
            let courseState = JSON.parse(item.courseState);
            let completed = "Completed";

            const user = kmkioskRegistrations.find(u => u.kmreguserphone === item.userId);
            if(user) {
                for(content of courseState.contents) {
                    if(content.status < 0.9) {
                        completed = "Incomplete";
                    }
                }
                let description = `
                    <div>
                        <a style="color: var(--secondary-cyan); font-size: 1.1em; font-weight: bold;" href="tel:${user.kmreguserphone}">
                            ${user.kmreguserphone}
                        </a>
                    </div>
                `;
                description += `
                    <div>Course: ${item.courseName} (${completed})</div>
                `;
                description += `
                    <div>Updated: ${item.modifiedOn}</div>
                `;

                let fullName = user.kmregusername;

                let image = '';
                if (user.kmreguserImage && user.kmreguserImage.length > 0) {
                    image = user.kmreguserImage;
                } else {
                    image = `<img style="padding: 0 20%; width: 100%;" src="./img/icon_img.png" onerror="this.onerror=null;this.src='./img/noimage.jpg';" />`;
                }

                states.push({
                    "text": user.kmregusercategory || "N/A",
                    "type": "successState"
                });

                let itemJson = {
                    "id": user.kmreguserphone,
                    "image": image,
                    "title": fullName,
                    "description": description,
                    "clickAction": "getKmkioskCourse('" + user.kmreguserphone + "', "+item.courseId+")",
                    "states": states
                };

                listItems.push(itemJson);
            }
        }

        // ✅ Create the list for this page
        createList(
            "kmkiosk",
            htmlContent,
            listItems,
            { pageNumber: pageNumber, pageSize: pageSize, totalItems: totalItems },
            totalPages,
            "modulesListBox",
            "getKmkioskUserCourse",
            "viewKmkioskLearninngs",
            "ticketStyle"
        );

    } else {
        htmlContent += '<div class="formlabel">No registrations found</div>';
        $('#modulesListBox').html(htmlContent);
    }
}

function getKmkioskUser(userPhone) {
    shared.currentState = "kmkioskUserTicketView";
    const userData = kmkioskRegistrations.find(u => u.kmreguserphone === userPhone);
    
    const completedCourses = kmkioskUsercourses
        .filter(c => c.userId === userPhone && c.courseState)
        .filter(c => {
            try {
                const state = JSON.parse(c.courseState);
                // consider completed if all contents have status >= 0.9
                return state.contents.every(item => item.status >= 0.9);
            } catch {
                return false;
            }
        })
        .sort((a, b) => new Date(b.modifiedOn) - new Date(a.modifiedOn));

    // if none found, return empty object
    const completedCoursesStr = completedCourses
        .map(c => c.courseName)
        .join(', ');
    const lastCompletedCourseName = completedCourses.length > 0 ? completedCourses[0].courseName : '';
    currentUserDetail = userData;

    // Combine full address
    const fullAddress = [userData.kmregaddress1, userData.kmregaddress2, userData.kmregcity, userData.kmregstate, userData.kmregcountry, userData.kmregzipcode]
        .filter(Boolean)
        .join(',');

    let htmlContent = `
        <div class="userCard" style="background: #fff; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); padding: 20px; margin: 20px auto; max-width: 500px; font-family: 'Roboto', sans-serif;">
            
            <!-- User category / title -->
            <h2 style="text-align: center; margin-bottom: 15px; color: #333;">${userData.kmregusercategory || "User"}</h2>
            
            <!-- Top grid: image and primary details -->
            <div style="display: grid; grid-template-columns: 35% 65%; gap: 15px; align-items: start;">
                ${userData.kmreguserImage ? `
                <div style="text-align: center;">
                    <img src="${userData.kmreguserImage}" alt="User Image" style="width:100%; object-fit:cover; border-radius: 8px; border: 2px solid #ccc;">
                </div>` : ''}

                <div>
                    ${userData.kmregusername ? `<div style="display:flex; align-items:center; margin-bottom:5px;"><span class="material-symbols-outlined" style="margin-right:6px; color:#4caf50; font-size:24px;">person</span><strong>${userData.kmregusername}</strong></div>` : ''}
                    ${userData.kmregusercompany ? `<div style="display:flex; align-items:center; margin-bottom:5px;"><span class="material-symbols-outlined" style="margin-right:6px; color:#2196f3; font-size:24px;">apartment</span>${userData.kmregusercompany}</div>` : ''}
                    ${userData.kmreguseremail || userData.kmreguserEmail ? `<div style="display:flex; align-items:center; margin-bottom:5px;"><span class="material-symbols-outlined" style="margin-right:6px; color:#f44336; font-size:24px;">email</span>${userData.kmreguseremail || userData.kmreguserEmail}</div>` : ''}
                    ${userData.kmreguserphone ? `<div style="display:flex; align-items:center; margin-bottom:5px;"><span class="material-symbols-outlined" style="margin-right:6px; color:#ff9800; font-size:24px;">phone</span>${userData.kmreguserphone}</div>` : ''}
                    ${userData.kmreguserbloodgroup ? `<div style="display:flex; align-items:center; margin-bottom:5px;"><span class="material-symbols-outlined" style="margin-right:6px; color:#e91e63; font-size:24px;">local_hospital</span>${userData.kmreguserbloodgroup}</div>` : ''}
                </div>
            </div>

            <!-- Full address and visit info -->
            <div style="margin-top: 15px; border-top: 1px solid #ddd; padding-top: 10px; color: #555;">
                ${fullAddress ? `<div style="display:flex; align-items:center; margin-bottom:5px;"><span class="material-symbols-outlined" style="margin-right:6px; color:#795548; font-size:24px;">location_on</span>${fullAddress}</div>` : ''}
                ${userData.kmregvisiteename ? `<div style="display:flex; align-items:center; margin-bottom:5px;"><span class="material-symbols-outlined" style="margin-right:6px; color:#ff5722; font-size:24px;">person_outline</span>Visitee: ${userData.kmregvisiteename}</div>` : ''}
                ${userData.kmregvisiteedepartment ? `<div style="display:flex; align-items:center; margin-bottom:5px;"><span class="material-symbols-outlined" style="margin-right:6px; color:#009688; font-size:24px;">work</span>Department: ${userData.kmregvisiteedepartment}</div>` : ''}
                ${userData.kmregstartdate ? `<div style="display:flex; align-items:center; margin-bottom:5px;"><span class="material-symbols-outlined" style="margin-right:6px; color:#4caf50; font-size:24px;">event</span>Start: ${formatReadableDate(userData.kmregstartdate)}</div>` : ''}
                ${userData.kmregenddate ? `<div style="display:flex; align-items:center; margin-bottom:5px;"><span class="material-symbols-outlined" style="margin-right:6px; color:#f44336; font-size:24px;">event_busy</span>End: ${formatReadableDate(userData.kmregenddate)}</div>` : ''}
                ${completedCoursesStr ? `<div style="display:flex; align-items:center; margin-bottom:5px;"><span class="material-symbols-outlined" style="margin-right:6px; color:#3f51b5; font-size:24px;">school</span>Completed Courses: ${completedCoursesStr}</div>` : ''}
            </div>

            <!-- Timestamp -->
            <div style="margin-top: 15px; text-align: center; font-size: 0.85rem; color: #999;">
                Last Updated: ${new Date(userData.timestamp).toLocaleString()}
            </div>

            <div id="generateTokenBtn" class="kmkioskBtnStyle" onclick="generateKioskTokenWithCourseName('${lastCompletedCourseName}')" style="margin-top: 0;">Generate Token</div>
        </div>
    `;

    // Render card
    $("#modulesDisplayArea").html(htmlContent);
    $("#modulesMenuArea").hide();
    $("#modulesListArea").hide();
    $("#modulesDisplayArea").show();
    fixModuleHeight("modulesModuleHeader, footerSection", 20, "modulesDisplayArea");
}



function getKmkioskCourse(userPhone, courseId) {
    shared.currentState = "kmkioskCourseTicketView";
    const courseData = kmkioskUsercourses.find(c => c.userId === userPhone && c.courseId == courseId);
    // Parse courseState JSON
    let courseState = {};
    try {
        courseState = JSON.parse(courseData.courseState);
    } catch (e) {
        console.error("Invalid courseState JSON", e);
    }

    // Start building HTML content
    let htmlContent = `
        <div class="courseCard" style="background: #fff; border-radius: 10px; box-shadow: 0 2px 8px rgba(0,0,0,0.2); padding: 20px; margin: 20px auto; max-width: 500px; font-family: sans-serif;">
            <h2 style="margin-bottom: 10px; text-align: center;">${courseData.courseName}</h2>
            <div style="margin-bottom: 15px; font-size: 0.9rem; color: #666; text-align: center;">
                User: <strong>${courseData.userName}</strong> | Phone: <strong>${courseData.userId}</strong>
            </div>
    `;

    // Group contents by contentType
    const contentsByType = {};
    (courseState.contents || []).forEach(item => {
        if (!contentsByType[item.contentType]) contentsByType[item.contentType] = [];
        contentsByType[item.contentType].push(item);
    });

    // Iterate over each content type
    Object.keys(contentsByType).forEach(type => {
        htmlContent += `<div style="margin-bottom: 15px;">`;
        htmlContent += `<h3 style="margin-bottom: 5px; border-bottom: 1px solid #ddd; padding-bottom: 3px;">${type}</h3>`;

        contentsByType[type].forEach(item => {
            const completed = item.status > 0.9;
            const icon = completed ? '✅' : '⚠️';
            htmlContent += `
                <div style="display: flex; align-items: center; margin: 5px 0; font-size: 1rem;">
                    <span style="margin-right: 10px; font-size: 1.2rem;">${icon}</span>
                    <span>${item.contentName}</span>
                </div>
            `;
        });

        htmlContent += `</div>`;
    });

    htmlContent += `
        <div style="text-align: center; margin-top: 15px; font-size: 0.85rem; color: #999;">
            Created on: ${courseData.createdOn} | Modified on: ${courseData.modifiedOn}
        </div>
    </div>
    `;

    // Render card
    $("#modulesDisplayArea").html(htmlContent);
    $("#modulesMenuArea").hide();
    $("#modulesListArea").hide();
    $("#modulesDisplayArea").show();
    fixModuleHeight("modulesModuleHeader, footerSection", 20, "modulesDisplayArea");
}

export function backKmkioskHandle() {

    // Case 1: Registration & Test Printer
    if (shared.currentState === "kmkioskUserRegistration" || shared.currentState === "testPrinter") {
        if (unsavedData === true) {
            showConfirmDialog({
                message: "Any unsaved data will be lost. Proceed?",
                yesLabel: "Yes",
                noLabel: "Cancel",
                onYes: () => displayKmkioskMenu(),
                onNo: () => closeConfirmDialogBox()
            });
        } else {
            displayKmkioskMenu();
        }
        return;
    }


    // Case 2: Common list screens → return to menu
    if (
        shared.currentState === "kmkioskViewCourseList" ||
        shared.currentState === "kmkioskSyncScreen" ||
        shared.currentState === "viewKmkioskLearninngs" ||
        shared.currentState === "viewKmkioskRegistrations"
    ) {
        displayKmkioskMenu();
        return;
    }


    // Case 3: User detail & print token
    if (shared.currentState === "kmkioskUserDetail" || shared.currentState === "viewPrintToken") {

        if (kmkioskConfiguration.config.kmkioskconfig) {
            if (shared.currentState === "viewPrintToken") {
                showKmkioskListArea();
            } else {
                displayKmkioskMenu();
            }
        } else {
            exitKmkiosk();
        }
        return;
    }


    // Case 4: Viewing a course
    if (shared.currentState === "kmkioskViewCourse") {

        const kmkioskcourseList =
            kmkioskConfiguration.config.kmkioskcourseList.filter(
                item => item.userCategory.toUpperCase() === kmUserCategory
            );

        const multipleCourses = kmkioskcourseList.length !== 1;

        showConfirmDialog({
            message: "Are you sure you want to exit without completing the course?",
            yesLabel: "Yes",
            noLabel: "Cancel",
            onYes: () => {
                if (multipleCourses) {
                    kmkioskViewCourses();
                } else {
                    displayKmkioskMenu();
                }
            },
            onNo: () => closeConfirmDialogBox()
        });

        return;
    }


    // Case 5: Content view / Assessment
    if (shared.currentState === "viewContent" || shared.currentState === "kmkioskAssessment") {
        stopProgressMonitoring();
        showKmkioskListArea();
        return;
    }


    // Case 6: Ticket views
    if (shared.currentState === "kmkioskUserTicketView" || shared.currentState === "kmkioskCourseTicketView") {
        showKmkioskListArea();
        return;
    }


    // DEFAULT → Exit Kiosk
    shared.currentState = "";
    unsavedData = false;
    exitKmkiosk();
}

function showKmkioskListArea() {
	pauseVideos();
	shared.currentState = shared.currentSourceState;
	$('#modulesMenuArea').hide();
	$('#modulesListArea').show();
	$('#modulesDisplayArea').hide();
}




window.displayKmkioskScreen = displayKmkioskScreen;
window.displayKmkioskMenu = displayKmkioskMenu;
window.displayKmkioskOnlineMenu = displayKmkioskOnlineMenu;
window.displayKmkioskOfflineMenu = displayKmkioskOfflineMenu;
window.exitKmkiosk = exitKmkiosk;
window.getKmkioskBanner = getKmkioskBanner;
window.displayLocalUserImage = displayLocalUserImage;
window.handleKmkioskQrCode = handleKmkioskQrCode;
window.viewKmkioskRegistrationPage = viewKmkioskRegistrationPage;
window.kmkioskSubmitRegistrationForm = kmkioskSubmitRegistrationForm;
window.kmkioskRegisteredLogin = kmkioskRegisteredLogin;
window.kmkioskVerifyUser = kmkioskVerifyUser;
window.showLoginError = showLoginError;
window.kmkioskSendOTP = kmkioskSendOTP;
window.kmkioskOTPScreen = kmkioskOTPScreen;
window.kmkioskRegistrationImageForm = kmkioskRegistrationImageForm;
window.kmkioskCaptureImage = kmkioskCaptureImage;
window.saveImageToFolder = saveImageToFolder;
window.kmkioskSubmitRegistrationImage = kmkioskSubmitRegistrationImage;
window.verifyOtp = verifyOtp;
window.sendOtp = sendOtp;
window.kmkioskResendOTP = kmkioskResendOTP;
window.kmkioskSubmitOTP = kmkioskSubmitOTP;
window.kmkioskLoginWithoutOTP = kmkioskLoginWithoutOTP;
window,kmkioskRepairRegistration = kmkioskRepairRegistration;
window.kmkioskSubmitUpdatedRegistration = kmkioskSubmitUpdatedRegistration;
window.writeFreshRegistration = writeFreshRegistration;
window.kmkioskViewCourses = kmkioskViewCourses;
window.kmkioskOpenCourse = kmkioskOpenCourse;
window.showKmkioskAssessment = showKmkioskAssessment;
window.getKmkioskQuestions = getKmkioskQuestions;
window.getQuestionHtml = getQuestionHtml;
window.buildAnswerOptionHtml = buildAnswerOptionHtml;
window.getCourseContentStatus = getCourseContentStatus;
window.updateKmkioskCourseStatus = updateKmkioskCourseStatus;
window.getAssessmentStatus = getAssessmentStatus;
window.updateKmkioskAssessmentStatus = updateKmkioskAssessmentStatus;
window.getKmkioskUserData = getKmkioskUserData;
window.getKmkioskUserCourseState = getKmkioskUserCourseState;
window.getKmkioskUserAssessmentState = getKmkioskUserAssessmentState;
window.getKioskConfigurationFromFile = getKioskConfigurationFromFile;
window.kmkioskSyncData = kmkioskSyncData;
window.checkAllSyncComplete = checkAllSyncComplete;
window.syncUserData = syncUserData;
window.uploadPendingImages = uploadPendingImages;
window.syncTrainingData = syncTrainingData;
window.getKioskConfigurationFromServer = getKioskConfigurationFromServer;
window.createKioskConfiguration = createKioskConfiguration;
window.checkIfDownloadRequire = checkIfDownloadRequire;
window.downloadContents = downloadContents;
window.ensureDirectory = ensureDirectory;
window.checkIfFile = checkIfFile;
window.saveKmkioskUsercourses = saveKmkioskUsercourses;
window.saveKmkioskUserassessments = saveKmkioskUserassessments;
window.deleteLocalFile = deleteLocalFile;
window.generateKioskToken = generateKioskToken;
window.generateKioskTokenWithCourseName = generateKioskTokenWithCourseName;
window.generateToken = generateToken;   
window.printTokenSmart = printTokenSmart;
window.testSerialPrinterWithLog = testSerialPrinterWithLog;
window.viewKmkioskRegistrations = viewKmkioskRegistrations;
window.viewKmkioskLearninngs = viewKmkioskLearninngs;
window.getKmkioskUser = getKmkioskUser;
window.getKmkioskCourse = getKmkioskCourse;
window.backKmkioskHandle = backKmkioskHandle;











