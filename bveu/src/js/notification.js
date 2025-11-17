import { Filesystem, Directory, Encoding } from "@capacitor/filesystem"
import { Capacitor } from '@capacitor/core';
import { Device } from "@capacitor/device"
import { Http } from '@capacitor-community/http';
import { Network } from '@capacitor/network';
import { App } from '@capacitor/app';
import $ from 'jquery';

import { shared } from "./globals.js";
import { displaySection , showConfirmDialog , buildRequestOptions , isValidResponse , RequestOptions  } from "./capacitor-welcome.js";
import { getMenuBar ,getNewToken } from "./settings.js";
import { constructUrl  } from "./utility";
import { apiRequestFailed } from "./auth.js";
import { handleAssetQrCode } from "./assetmate.js";

 let userNotifications = null;


function getUserNotifications() {
    const data = {
        token: shared.mCustomerDetailsJSON.token,
        userId: shared.mCustomerDetailsJSON.id
    };

    buildRequestOptions(constructUrl("/api/restgetusernotificationsbyuser"), "GET", data)
        .then(request => {
            Http.request(request)
                .then(res => {
                    if (!res) return;

                    let jqXHR;
                    try {
                        jqXHR = typeof res.data === "string" ? JSON.parse(res.data) : res.data;
                    } catch (e) {
                        console.warn("[getUserNotifications] Parsing failed, using raw response data.");
                        jqXHR = res.data;
                    }

                    if (isValidResponse(jqXHR, "restgetusernotificationsbyuser") && jqXHR != null) {
                        if (jqXHR.error !== "invalid_token") { // Token is valid
                             userNotifications = jqXHR;

                            console.log("User Notifications: " + JSON.stringify(jqXHR));
                            $("#notificationOverlay").html(userNotifications.length);

                            if (userNotifications.length > 0) {
                                $("#notificationOverlay").show();
                                viewUserNotifications();
                            } else {
                                $("#notificationOverlay").hide();
                            }

                            $("#loadingSpinner").hide();
                        } else {
                            console.warn("[getUserNotifications] Token expired, regenerating...");
                            getNewToken("getUserNotifications()");
                        }
                    }
                })
                .catch(err => {
                    console.error("[getUserNotifications] Request failed:", err);
                    apiRequestFailed(err, "restgetusernotificationsbyuser");
                });
        })
        .catch(err => {
            console.warn("[getUserNotifications] Request aborted due to missing requestOptions.", err);
        });
}

function viewUserNotifications() {
    if(  userNotifications != undefined) {
        let prevName = '';
        let prevTitle = '';

        console.log("User Notifications: "+userNotifications);
        var htmlStr = '';
        // htmlStr += '<p class="titleFontClass" style="padding: 10px;">NOTIFICATIONS</p>';
        let cardCount = 0;
        for(var index in userNotifications) {
            let notification = userNotifications[index]; 

            if((notification.notification != null) && (notification.notification.startsWith('{'))) {
                var item = JSON.parse(notification.notification);
                let name = item.type.toLowerCase().replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()); // capitalize first letter of each word
                let title = item.title;

                if(item.items != undefined && item.items != null && item.items.length > 0) {
                    if(item.items.length == 1) {    // only one
                        title = item.items[0].incidentName;
                    }
                }
                if(prevName != name || prevTitle != title) {
                    prevName = name;
                    prevTitle = title;
                    htmlStr += '<div class="notificationCard" onclick="showNotificationDetail('+index+')">';
                        htmlStr += '<div class="notificationCardTitle">'+name+'</div>';
                        htmlStr += '<div class="notificationCardDesc">'+title+'</div>';
                        htmlStr += '<div class="userNotificationDeleteBtn" data-id='+notification.id+' onclick="event.stopPropagation(); deleteUserNotification('+notification.id+')"><i class="fas fa-trash-alt"></i></div>';
                    htmlStr += '</div>';
                    cardCount++;
                    if(index == userNotifications.length -1) {
                        $("#notificationslidearea").html(htmlStr);
                    } else if(cardCount == 4) {
                        htmlStr += '<div class="notificationCard"><div class="notificationCardTitle" onclick="viewUserAllNotifications()">More...</div></div>';
                        $("#notificationslidearea").html(htmlStr);
                        break;
                    }
                }

                if(index == userNotifications.length -1) {
                    $("#notificationslidearea").html(htmlStr);
                }
            }
        }

        $("#notificationArea").hide();
        $("#notificationList").hide();
        $("#notificationDetail").hide();
    }
}

function viewUserAllNotifications() {
    if(userNotifications != undefined) {
        // console.log("User Notifications: "+userNotifications);
        var htmlStr = '';
        // htmlStr += '<p class="titleFontClass" style="padding: 10px;">NOTIFICATIONS</p>';
        let cardCount = 0;
        for(var index in userNotifications) {
            let notification = userNotifications[index]; 

            // if((notification.notification != null) && (notification.notification.startsWith('{'))) {
            //     var item = JSON.parse(notification.notification);
            //     let name = item.type.toLowerCase().replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()); // capitalize first letter of each word
            //     let title = item.title;
            //     if(item.items.length == 1) {    // only one
            //         title = item.items[0].incidentName;
            //     }
            //     if(prevName != name || prevTitle != title) {
            //         prevName = name;
            //         prevTitle = title;
            //         htmlStr += '<div class="notificationCard" onclick="showNotificationDetail('+index+')">';
            //             htmlStr += '<div class="notificationCardTitle">'+name+'</div>';
            //             htmlStr += '<div class="notificationCardDesc">'+title+'</div>';
            //             htmlStr += '<div class="userNotificationDeleteBtn" data-id='+notification.id+' onclick="event.stopPropagation(); deleteUserNotification('+notification.id+')"><i class="fas fa-trash-alt"></i></div>';
            //         htmlStr += '</div>';
            //         cardCount++;
            //     }
            // }

            htmlStr += '<div class="userNotificationBlock" onclick="showNotificationDetail('+index+')">';
                var dateStr = new Date(notification.createdOn).toDateString().substring(0,10);
                htmlStr += '<div><b>'+notification.status.replace('_', ' ')+'</b> <p style="color: rgb(150,150,150); display: inline;">('+dateStr+')</p></div>';
                if((notification.notification != null) && (notification.notification.startsWith('{'))) {
                    var notificationJson = JSON.parse(notification.notification);
                    htmlStr += '<p class="userNotificationText">'+notificationJson.title+'</p>';
                    if((notificationJson.items != null) && (notificationJson.items.length > 0)) {
                        for(var item of notificationJson.items) {
                            htmlStr += '<p class="userNotificationText">'+item.incidentName+'. Location: '+item.location+'. Status: '+item.status+'</p>';
                        }
                    }
                }
                htmlStr += '<div class="userNotificationDeleteBtn" data-id='+notification.id+' onclick="event.stopPropagation(); deleteUserNotification('+notification.id+')"><i class="fas fa-trash-alt"></i></div>';
            htmlStr += '</div>';
            if(index == userNotifications.length -1) {
                $("#notificationListContent").html(htmlStr);
            }
        }

        $("#notificationArea").show();
        $("#notificationList").show();
        $("#notificationDetail").hide();
    }
}

export function closeUserNotifications() {
    shared.currentState = shared.currentSourceState;
	$("#notificationArea").hide();
}

function showNotificationDetail(index) {
    currentSourceState = currentState;
    currentState = 'userNotification';

    var htmlStr = '';
    var notification = userNotifications[index];
    var notificationJson = JSON.parse(notification.notification);
	
    var dateStr = new Date(notification.createdOn).toDateString();
	htmlStr += '<div style="padding: 10px;">';
        htmlStr += '<p class="titleFontClass">'+notification.status.replace('_', ' ')+'</p>';
        htmlStr += '<p style="color: rgb(150,150,150);">('+dateStr+')</p>';
    htmlStr += '</div>';

    htmlStr += '<div style="padding: 10px; font-weight: normal;">';
        htmlStr += '<div class="userNotificationText">'+notificationJson.title+'</div>';

        if(notificationJson.type.includes('ASSETMATE')) {
            $.each(notificationJson.items, function(key, val) {
                var date = Date(parseInt(val.schedule));
                date = date.substring(0,25);

                htmlStr += '<div class="entityBlock" onclick="openAsset(\''+val.codeId+'\')">';
                    if(notification.status.includes('ESCALATION')) {
                        htmlStr += '<div class="title" style="background-color: var(--secondary-orange-80pc);">'+val.scheduleName+'</div>';
                    } else {
                        htmlStr += '<div class="title">'+val.scheduleName+'</div>';
                    }
                    htmlStr += '<div class="detail">'+val.assetName+' - '+val.codeId+'</div>';
                    htmlStr += '<div class="detail">'+date+'</div>';
                htmlStr += '</div>';
            });
        } else if(notificationJson.type.includes('SITEMATE')) {
            $.each(notificationJson.items, function(key, val) {
                htmlStr += '<div class="entityBlock" onclick="viewNotificationIncident('+val.incidentId+') ">';
                    if(notification.status.includes('ESCALATION')) {
                        htmlStr += '<div class="title" style="background-color: var(--secondary-orange-80pc);">'+val.incidentName+'</div>';
                    } else {
                        htmlStr += '<div class="title">'+val.incidentName+'</div>';
                    }
                    htmlStr += '<div class="detail">Location: '+val.location+'</div>';
                    htmlStr += '<div class="detail">Status: '+val.status+'</div>';
                htmlStr += '</div>';
            });
        }
    htmlStr += '</div>';
	
	$("#notificationDetailContent").html(htmlStr);
    $("#notificationArea").show();
    $("#notificationDetail").show();
    $("#notificationList").hide();
	
}

function closeNotificationDetail() {
	$("#notificationDetail").hide();
    //$("#notificationList").show();
    $("#notificationArea").hide();

}


function deleteUserNotification(id) {
    $("#loadingSpinner").show();

    const data = {
        token: shared.mCustomerDetailsJSON.token,
        id: parseInt(id)
    };

    buildRequestOptions(constructUrl("/api/restDeleteUserNotification"), "GET", data)
        .then(request => {
            Http.request(request)
                .then(res => {
                    if (!res) return;

                    let jqXHR;
                    try {
                        jqXHR = typeof res.data === "string" ? JSON.parse(res.data) : res.data;
                    } catch (e) {
                        console.warn("[deleteUserNotification] Parsing failed, using raw response data.");
                        jqXHR = res.data;
                    }

                    if (isValidResponse(jqXHR, "restDeleteUserNotification") && jqXHR != null) {
                        if (jqXHR.error !== "invalid_token") { // Token is valid
                            userNotifications = jqXHR;

                            $("#notificationOverlay").html(userNotifications.length);

                            if (userNotifications.length > 0) {
                                $("#notificationOverlay").show();
                                viewUserNotifications();
                            } else {
                                $("#notificationOverlay").hide();
                            }

                            $("#loadingSpinner").hide();
                        } else {
                            console.warn("[deleteUserNotification] Token expired, regenerating...");
                            getNewToken("deleteUserNotification(" + id + ")");
                        }
                    }
                })
                .catch(err => {
                    console.error("[deleteUserNotification] Request failed:", err);
                    apiRequestFailed(err, "restDeleteUserNotification");
                    $("#loadingSpinner").hide();
                });
        })
        .catch(err => {
            console.warn("[deleteUserNotification] Request aborted due to missing requestOptions.", err);
            $("#loadingSpinner").hide();
        });
}

function openAsset(codeId) {
    $("#notificationArea").hide();
    handleAssetQrCode(codeId, 1);
}

window.openAsset = openAsset;
window.getUserNotifications = getUserNotifications;
window.viewUserAllNotifications = viewUserAllNotifications;
window.deleteUserNotification = deleteUserNotification;
window.closeUserNotifications = closeUserNotifications;
window.closeNotificationDetail =closeNotificationDetail;
window.showNotificationDetail = showNotificationDetail;