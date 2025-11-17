import { Filesystem, Directory, Encoding } from "@capacitor/filesystem"
import { Capacitor } from '@capacitor/core';
import { Device } from "@capacitor/device"
import { Http } from '@capacitor-community/http';
import { Network } from '@capacitor/network';
import { App } from '@capacitor/app';
import $ from 'jquery';
import { Haptics, ImpactStyle } from '@capacitor/haptics';


import { shared } from "./globals.js";
import { showDialog, initAppRuntimeMonitor, closeDialogBox, constructUrl, convertVersionVal, fixModuleHeight , addBtnToFavourite ,removeBtnFromFavourite} from "./utility.js";
import { displaySection, buildRequestOptions, RequestOptions, isValidResponse, showConfirmDialog } from "./capacitor-welcome.js";
import { viewLogin, apiRequestFailed } from "./auth.js";


export async function viewHome() {
    console.log("[viewHome] Start");
    shared.currentRunningApp = 'home';
   

    // if (deviceInfo == null) {
    //     console.log("[viewHome] deviceInfo is null. Checking device registration...");
    //     checkDeviceRegistration();
    // }

    try {
        var commonCMS = shared.cmsJSON.cmsJSONdata.common;
        var homeScreenSource = shared.cmsJSON.cmsJSONdata.homeScreen;

        
        const appInfo = await App.getInfo();
        console.log("[viewHome] App Info:", appInfo);

        $('#appVersion').html(appInfo.version);

        if ($("#homeWindow").is(':empty')) {
            console.log("[viewHome] Home window is empty. Proceeding to populate content...");
            let prodHtml = "";
            

            const versionParts = appInfo.version.split('.');
            const majorVersion = parseInt(versionParts[0]) || 0;
            const minorVersion = parseInt(versionParts[1]) || 0;
            const patchVersion = parseInt(versionParts[2]) || 0;
            const versionCode = majorVersion * 10000 + minorVersion * 100 + patchVersion;

            console.log("[viewHome] Parsed versionCode:", versionCode);

            if (commonCMS.mainBodyHtml.length && versionCode < 20000 && versionCode !== 10000) {
                console.log("[viewHome] Using mainBodyHtml from CMS");
                prodHtml = commonCMS.mainBodyHtml;
                $("#homeWindow").html(prodHtml);
                displaySection("homeSection", "block", true, true);
            } else {
                console.log("[viewHome] Generating home screen dynamically");
                // const homeScreenSource = shared.cmsJSON.cmsJSONdata.homeScreen;

                if (homeScreenSource.assistPresent === true) {
                    console.log("[viewHome] Assist present. Adding assist div");
                    prodHtml += "<div id='assist'></div>";
                }

                function getNextSection(sectionIndex) {
                    const section = homeScreenSource.sectionList[sectionIndex];
                    console.log(`[viewHome] Processing section ${sectionIndex}`, section);

                    if (section.sectionStyle?.length) {
                        prodHtml += `<div id="homeSection${sectionIndex}" style="${section.sectionStyle}">`;
                        if (section.content?.startsWith('<')) {
                            prodHtml += section.content;
                        }
                    } else if (section.content?.length) {
                        if (section.content.startsWith('<')) {
                            prodHtml += `<div style="${section.content}">`;
                        }
                    }

                    if (Array.isArray(section.menuList) && section.menuList.length) {
                        function getNextMenu(menuIndex) {
                            const menu = section.menuList[menuIndex];
                            console.log(`[viewHome] Processing menu ${menuIndex}`, menu);

                            prodHtml += getMenuBar(menu, "homeHome");

                            if (menuIndex === section.menuList.length - 1) {
                                if (Array.isArray(section.overlayList)) {
                                    section.overlayList.forEach((overlay, i) => {
                                        console.log(`[viewHome] Adding overlay ${i}`, overlay);
                                        prodHtml += overlay.htmlContent;
                                    });
                                }

                                prodHtml += '</div>';

                                if (sectionIndex === homeScreenSource.sectionList.length - 1) {
                                    console.log("[viewHome] All sections processed. Injecting HTML...");
                                    $("#homeWindow").html(prodHtml);
                                    updateHome();

                                    if (versionCode === 10000 || versionCode >= 20000) {
                                        console.log("[viewHome] Hiding version notice");
                                        $("#versionnotice").hide();
                                    }
                                } else {
                                    getNextSection(sectionIndex + 1);
                                }
                            } else {
                                getNextMenu(menuIndex + 1);
                            }
                        }

                        getNextMenu(0);
                    } else {
                        if (Array.isArray(section.overlayList)) {
                            section.overlayList.forEach((overlay, i) => {
                                console.log(`[viewHome] Adding overlay ${i}`, overlay);
                                prodHtml += overlay.htmlContent;
                            });
                        }

                        prodHtml += '</div>';

                        if (sectionIndex === homeScreenSource.sectionList.length - 1) {
                            console.log("[viewHome] All sections processed. Injecting HTML...");
                            $("#homeWindow").html(prodHtml);
                            updateHome();

                            if (versionCode === 10000 || versionCode >= 20000) {
                                console.log("[viewHome] Hiding version notice");
                                $("#versionnotice").hide();
                            }
                        } else {
                            getNextSection(sectionIndex + 1);
                        }
                    }
                }

                getNextSection(0);
            }
        } else {
            console.log("[viewHome] Home window already populated. Just updating...");
            updateHome();
        }
    } catch (error) {
        console.error('[viewHome] Error getting app info:', error);
    }

    console.log("[viewHome] End");
}

export function getMenuBar(menuSource, activeWindow) {
    var htmlData = '<div class="menu ' + menuSource.menuClass + '">';
    if (menuSource.logoPresent == true) {
        var logo = shared.cmsJSON.cmsJSONdata.common.logo;
        htmlData += '<img class="' + logo.logoClass + '" src="' + logo.image + '" onclick="viewHome()" onerror="this.onerror=null;this.src=\'./img/noimage.jpg\';">';
    }
    if (menuSource.menuPresent == true) {
        htmlData += getButtons(menuSource, activeWindow);
    }

    htmlData += '</div>';
    return htmlData;
}

function getButtons(menuSource, activeWindow) {
    var menuHtml = "";

    if(menuSource.title != undefined && menuSource.title.length > 0) {
        let btnId = menuSource.title.toLowerCase().replaceAll(" ", "_");
        menuHtml += '<div class="'+menuSource.menuBtnAreaTitleClass+'" style="padding: 15px 0 5px 0;">'+menuSource.title+'</div>';
        menuHtml += '<div class="'+menuSource.menuBtnAreaClass+'" id="homemenu_'+btnId+'">';
    } else {
        menuHtml += '<div class="'+menuSource.menuBtnAreaClass+'">';
    }

    $.each(menuSource.btnData, function(key, val) {
        if (activeWindow == val.tag) {
            if ((val.activeStyle != undefined) && (val.activeStyle != "")) {
                if ((val.intent != undefined) && (val.intent != "")) {
                    menuHtml += '<button id="btnId_' + val.tag + '" data-mod="'+val.intent+'" data-clickaction="'+val.funct+'" onclick="' + val.funct + '" class="menuBtn ' + menuSource.activeBtnClass + '" style="' + val.activeStyle + '">';
                } else {
                    menuHtml += '<button id="btnId_' + val.tag + '" data-mod="" data-clickaction="'+val.funct+'" onclick="' + val.funct + '" class="menuBtn ' + menuSource.activeBtnClass + '" style="' + val.activeStyle + '">';
                }
            } else {
                if ((val.intent != undefined) && (val.intent != "")) {
                    menuHtml += '<button id="btnId_' + val.tag + '" data-mod="'+val.intent+'" data-clickaction="'+val.funct+'" onclick="' + val.funct + '" class="menuBtn ' + menuSource.activeBtnClass + '" >';
                } else {
                    menuHtml += '<button id="btnId_' + val.tag + '" data-mod="" data-clickaction="'+val.funct+'" onclick="' + val.funct + '" class="menuBtn ' + menuSource.activeBtnClass + '" >';
                }
            }

            if ((val.tag == "account") && (userFirstName != "")) {
                menuHtml += '<div id="btnOverlay_' + val.tag + '" class="' + menuSource.overlayClass + '" style="display:block; background-color:rgba(0,180,90,1.0);"></div>';
                menuHtml += '<span id="btnIcon_' + val.tag + '" class="' + menuSource.activeIconClass + '">' + val.activeIcon + '</span>';
                menuHtml += '<p id="btnText_' + val.tag + '" class="' + menuSource.activeBtnTextClass + '"> ' + userFirstName + '</p>';
            } else {
                menuHtml += '<div id="btnOverlay_' + val.tag + '" style="display:none;"></div>';
                menuHtml += '<span id="btnIcon_' + val.tag + '" class="' + menuSource.activeIconClass + '">' + val.activeIcon + '</span>';
                menuHtml += '<p id="btnText_' + val.tag + '" class="' + menuSource.activeBtnTextClass + '"> ' + val.activeBtnText + '</p>';
            }

        } else {
            if ((val.style != undefined) && (val.style != "")) {
                if ((val.intent != undefined) && (val.intent != "")) {
                    menuHtml += '<button id="btnId_' + val.tag + '" data-mod="'+val.intent+'" data-clickaction="'+val.funct+'" onclick="' + val.funct + '" class="menuBtn ' + menuSource.btnClass + '" style="' + val.style + '">';
                } else {
                    menuHtml += '<button id="btnId_' + val.tag + '" data-mod="" data-clickaction="'+val.funct+'" onclick="' + val.funct + '" class="menuBtn ' + menuSource.btnClass + '" style="' + val.style + '">';
                }
            } else {
                if ((val.intent != undefined) && (val.intent != "")) {
                    menuHtml += '<button id="btnId_' + val.tag + '" data-mod="'+val.intent+'" data-clickaction="'+val.funct+'" onclick="' + val.funct + '" class="menuBtn ' + menuSource.btnClass + '">';
                } else {
                    menuHtml += '<button id="btnId_' + val.tag + '" data-mod="" data-clickaction="'+val.funct+'" onclick="' + val.funct + '" class="menuBtn ' + menuSource.btnClass + '">';
                }
            }

            if ((val.tag == "account") && (userFirstName != "")) {
                menuHtml += '<div id="btnOverlay_' + val.tag + '" class="' + menuSource.overlayClass + '" style="display:block; background-color:rgba(0,180,90,1.0);"></div>';
                menuHtml += '<span id="btnIcon_' + val.tag + '" class="' + menuSource.iconClass + '">' + val.icon + '</span>';
                menuHtml += '<p id="btnText_' + val.tag + '" class="' + menuSource.btnTextClass + '"> ' + userFirstName + '</p>';
            } else {
                menuHtml += '<div id="btnOverlay_' + val.tag + '" style="display:none;"></div>';
                menuHtml += '<span id="btnIcon_' + val.tag + '" class="' + menuSource.iconClass + '">' + val.icon + '</span>';
                menuHtml += '<p id="btnText_' + val.tag + '" class="' + menuSource.btnTextClass + '"> ' + val.btnText + '</p>';
            }
        }

        if (menuSource.btnAfterEffect != "") {
            menuHtml += '<div id="btnAfterEffect_' + val.tag + '" class="' + menuSource.btnAfterEffectClass + '" ></div>';
        }
        menuHtml += '</button>';
    });

    menuHtml += '</div>';
    return menuHtml;
}

function updateHome() {
    var commonCMS = shared.cmsJSON.cmsJSONdata.common;
    if(shared.mCustomerDetailsJSON == null) {
        viewLogin("programProcess");
    } else {
        updateHomeButtonAcccess();
        // commented as not yet implemented 
        // getUserNotifications();
    }

    if ($("#navMenu").is(':empty')) {
        var navMenuHtmlData = "";
        navMenuHtmlData += getMenuBar(commonCMS.navMenu, "catalog");
        $("#navMenu").html(navMenuHtmlData);
    } 

    if ($("#headerMenu").is(':empty')) {
        var navMenuHtmlData = "";
        navMenuHtmlData += getMenuBar(commonCMS.headerMenu, "");
        $("#headerMenu").html(navMenuHtmlData);
    } 

    if ($("#footerMenu").is(':empty')) {
        var navMenuHtmlData = "";
        navMenuHtmlData += getMenuBar(commonCMS.footerMenu, "");
        $("#footerMenu").html(navMenuHtmlData);
    }

    displaySection("homeSection", "block", true, true);
    // commented as not yet implemented
    // configureCustomBackButton();
}

export function  updateHomeButtonAcccess() {
    var homeScreenSource = shared.cmsJSON.cmsJSONdata.homeScreen;

    let homeMenuBtns = document.getElementsByClassName('homeMenu');
    for(let button of homeMenuBtns) {
        if(!shared.mCustomerDetailsJSON.mod.includes(button.dataset.mod)) {
            let iconId = button.id.replace('btnId','btnIcon');
            let textId = button.id.replace('btnId','btnText');
            $('#'+iconId).css('color', 'var(--secondary-gray)');
            $('#'+textId).css('color', 'var(--secondary-gray)');
        }
    }
    getFavoriteBtns();
}


// async function getFavoriteBtns() {
//     try {
//         console.log("[getFavoriteBtns] Start");

//         const data = { token: shared.mCustomerDetailsJSON.token };
//         const url = constructUrl("/userfavorites/getuserfavorites");

//         // Build request options
//         const requestOptions = await buildRequestOptions(url, "GET", data);

//         if (!requestOptions) {
//             console.warn("Request aborted due to missing requestOptions.");
//             return;
//         }

//         // Send API request via Capacitor HTTP
//         const response = await Http.request(requestOptions);

//         console.log("[getFavoriteBtns] Raw response:", response);

//         // Check validity
//         if (isValidResponse(response, "getuserfavorites") && response.data) {
//             let jqXHR;

//             // Parse JSON if needed
//             try {
//                 jqXHR = typeof response.data === 'string'
//                     ? JSON.parse(response.data)
//                     : response.data;
//             } catch (e) {
//                 console.warn("Parsing failed, using raw response data.");
//                 jqXHR = response.data;
//             }

//             if (jqXHR != null) {
//                 if (jqXHR.error !== "invalid_token") { // Token is valid
//                     let favorites = jqXHR;

//                     if (jqXHR.length > 0) {
//                         for (let index in favorites) {
//                             let favorite = favorites[index];
//                             moveBtnToSection(favorite.btnId, "homemenu_favorites");

//                             if (index == favorites.length - 1) {
//                                 attachLongclickToMenuButtons();
//                             }
//                         }
//                     } else {
//                         attachLongclickToMenuButtons();
//                     }
//                 } else { 
//                     // Token expired - regenerate token
//                     console.warn("[getFavoriteBtns] Token expired, regenerating...");
//                     getNewToken("getFavoriteBtns()");
//                 }
//             }
//         }
//     } catch (error) {
//         console.error("[getFavoriteBtns] Request failed:", error);
//         apiRequestFailed(error, "getuserfavorites");
//     }
// }

export function getFavoriteBtns() {
    console.log("[getFavoriteBtns] Start");

    const data = { token: shared.mCustomerDetailsJSON.token };
    const url = constructUrl("/userfavorites/getuserfavorites");

    // Build request options
    buildRequestOptions(url, "GET", data)
        .then((requestOptions) => {
            if (!requestOptions) {
                console.warn("Request aborted due to missing requestOptions.");
                return;
            }

            // Send API request via Capacitor HTTP
            return Http.request(requestOptions);
        })
        .then((response) => {
            if (!response) return;

            console.log("[getFavoriteBtns] Raw response:", response);

            // Check validity
            if (isValidResponse(response, "getuserfavorites") && response.data) {
                let jqXHR;

                // Parse JSON if needed
                try {
                    jqXHR = typeof response.data === "string"
                        ? JSON.parse(response.data)
                        : response.data;
                } catch (e) {
                    console.warn("Parsing failed, using raw response data.");
                    jqXHR = response.data;
                }

                if (jqXHR != null) {
                    if (jqXHR.error !== "invalid_token") { 
                        // ✅ Token is valid
                        let favorites = jqXHR;

                        if (jqXHR.length > 0) {
                            for (let index in favorites) {
                                let favorite = favorites[index];
                                moveBtnToSection(favorite.btnId, "homemenu_favorites");

                                if (index == favorites.length - 1) {
                                    attachLongclickToMenuButtons();
                                }
                            }
                        } else {
                            attachLongclickToMenuButtons();
                        }
                    } else {
                        // ❌ Token expired - regenerate token
                        console.warn("[getFavoriteBtns] Token expired, regenerating...");
                        getNewToken("getFavoriteBtns()");
                    }
                }
            }
        })
        .catch((error) => {
            console.error("[getFavoriteBtns] Request failed:", error);
            apiRequestFailed(error, "getuserfavorites");
        });
}


// export async function getNewToken(callback) {
//     try {
//         console.log("[getNewToken] Start");

//         const data = { refreshToken: shared.mCustomerDetailsJSON.refreshToken };
//         const url = constructUrl("/api/refreshtoken");

//         // Build request options
//         const requestOptions = await RequestOptions(url, "POST", data);

//         if (!requestOptions) {
//             console.warn("Request aborted due to missing requestOptions.");
//             return;
//         }

//         // Send API request via Capacitor HTTP
//         const response = await Http.request(requestOptions);

//         console.log("[getNewToken] Raw response:", response);

//         // Check validity
//         if (isValidResponse(response, "refreshtoken") && response.data) {
//             let jqXHR;

//             // Parse JSON if needed
//             try {
//                 jqXHR = typeof response.data === "string"
//                     ? JSON.parse(response.data)
//                     : response.data;
//             } catch (e) {
//                 console.warn("[getNewToken] Parsing failed, using raw response data.");
//                 jqXHR = response.data;
//             }

//             if (jqXHR != null) {
//                 if (jqXHR.error === "none") {
//                     shared.mCustomerDetailsJSON = jqXHR;

//                     if (callback !== undefined) {
//                         console.log("[getNewToken] Executing callback:", callback);
//                         eval(callback);
//                     }
//                 } else {
//                     if (callback !== undefined) {
//                         showDialog(
//                             "Your session has expired! Please login again.\nModule: " + callback,
//                             "exitAllAppAndViewLogin()"
//                         );
//                     } else {
//                         showDialog(
//                             "Your session has expired! Please login again.",
//                             "exitAllAppAndViewLogin()"
//                         );
//                     }
//                 }
//             }
//         }
//     } catch (error) {
//         console.error("[getNewToken] Request failed:", error);
//         apiRequestFailed(error, "refreshtoken");
//     }
// }

export function getNewToken(callback) {
    console.log("[getNewToken] Start");

    const data = { refreshToken: shared.mCustomerDetailsJSON.refreshToken };
    const url = constructUrl("/api/refreshtoken");

    // Build request options
    RequestOptions(url, "POST", data)
        .then((requestOptions) => {
            if (!requestOptions) {
                console.warn("Request aborted due to missing requestOptions.");
                return;
            }

            // Send API request via Capacitor HTTP
            return Http.request(requestOptions);
        })
        .then((response) => {
            if (!response) return;

            console.log("[getNewToken] Raw response:", response);

            // Check validity
            if (isValidResponse(response, "refreshtoken") && response.data) {
                let jqXHR;

                // Parse JSON if needed
                try {
                    jqXHR = typeof response.data === "string"
                        ? JSON.parse(response.data)
                        : response.data;
                } catch (e) {
                    console.warn("[getNewToken] Parsing failed, using raw response data.");
                    jqXHR = response.data;
                }

                if (jqXHR != null) {
                    if (jqXHR.error === "none") {
                        shared.mCustomerDetailsJSON = jqXHR;

                        if (callback !== undefined) {
                            console.log("[getNewToken] Executing callback:", callback);
                            eval(callback);
                        }
                    } else {
                        if (callback !== undefined) {
                            showDialog(
                                "Your session has expired! Please login again.\nModule: " + callback,
                                "exitAllAppAndViewLogin()"
                            );
                        } else {
                            showDialog(
                                "Your session has expired! Please login again.",
                                "exitAllAppAndViewLogin()"
                            );
                        }
                    }
                }
            }
        })
        .catch((error) => {
            console.error("[getNewToken] Request failed:", error);
            apiRequestFailed(error, "refreshtoken");
        });
}



 export function moveBtnToSection(btnId, destin) {
    const btn = document.getElementById(btnId);
    const favorites = document.getElementById(destin);
    
    if(btn != null && favorites != null) {
        // Step 1: Fade out
        btn.classList.add("btn-fade-out");
        
        setTimeout(() => {
        // Step 2: Move to favorites
        favorites.appendChild(btn);
        
        // Step 3: Remove fade-out, add fade-in
        btn.classList.remove("btn-fade-out");
        btn.classList.add("btn-fade-in");
        
        // Optional: Clean up fade-in class after animation
        setTimeout(() => {
            btn.classList.remove("btn-fade-in");
        }, 300);
        }, 100); // matches transition duration
    }
}

export function attachLongclickToMenuButtons() {
    let buttons = document.getElementsByClassName('homeMenu');
    if(buttons != null && buttons.length > 0) {
        for(let button of buttons) {
            button.addEventListener('contextmenu', e => e.preventDefault());
            let pressTimer;
            let longPressTriggered = false;
            const longClickTime = 600;

            const longClickAction = () => {
                longPressTriggered = true;
                console.log(`Long Click on #${button.id}`);
                // Add haptic feedback for long press
                Haptics.impact({ style: ImpactStyle.Medium });
                handleMenuLongClick(button);
            };

            const clickAction = () => {
                if (!longPressTriggered) {
                    console.log(`Click on #${button.id}`);
                    // Add light haptic feedback for regular click
                    Haptics.impact({ style: ImpactStyle.Light });
                    let func = button.dataset.clickAction;
                    if (typeof window[func] === "function") {
                        window[func]();
                    }
                }
            };

            const startPress = () => {
                longPressTriggered = false;
                pressTimer = setTimeout(longClickAction, longClickTime);
            };

            const cancelPress = () => {
                clearTimeout(pressTimer);
            };

            // Attach both mouse and touch events
            button.addEventListener('mousedown', startPress);
            button.addEventListener('mouseup', () => {
                cancelPress();
                clickAction();
            });
            button.addEventListener('mouseleave', cancelPress);

            button.addEventListener('touchstart', startPress);
            button.addEventListener('touchend', () => {
                cancelPress();
                clickAction();
            });
            button.addEventListener('touchmove', cancelPress);
        }
    }
}

function handleMenuLongClick(button) {
    console.log("Button long clicked: " + button.id);

    if (shared.mCustomerDetailsJSON != null) {
        if (button.parentElement.id == "homemenu_favorites") {
            showConfirmDialog(
                "Remove from favourite?",
                () => removeBtnFromFavourite(button.id),
                () => closeConfirmDialogBox()
            );
        } else {
            showConfirmDialog(
                "Add to favourite?",
                () => addBtnToFavourite(button.id),
                () => closeConfirmDialogBox()
            );
        }
    } else {
        showDialog(
            "You need to login to perform this task!",
            "viewLogin('programProcess')"
        );
    }
}

export function closeConfirmDialogBox() {
    $('#confirmDialogBox').hide();
}


export function clearFavouriteBtns() {
    let section = document.getElementById('homemenu_favorites');
    let buttons = section.getElementsByClassName('homeMenu1BtnStyle');
    if(buttons != null && buttons.length > 0) {
        for(let button of buttons) {
            moveBtnToSection(button.id, "homemenu_modules");
        }
    }
}


window.viewHome = viewHome;
window.closeConfirmDialogBox = closeConfirmDialogBox;

