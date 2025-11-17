import { Http } from '@capacitor-community/http';
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory, Encoding } from "@capacitor/filesystem"
import $ from 'jquery';



import { shared, appUrl, s3PrivateUrl, s3PublicUrl} from "./globals.js";
import { displaySection, buildRequestOptions, isValidResponse, showConfirmDialog} from "./capacitor-welcome.js";
import { showDialog, updateAppRuntime, highlightHeaderTabMenu, fixModuleHeight, constructUrl, getSignedUrl, pauseVideos, initPinchZoom , startAppIdleTimer} from "./utility.js";
import { getMenuBar, getNewToken, viewHome} from "./settings.js";
import { apiRequestFailed } from './auth.js';
import { createList } from './list.js';
import { viewPdfFile } from './pdfviewer.js';
import { openTab } from './assetmate.js';


var contents = [];
var listItems = [];
//var archivedContents = null;
//let sharedWithMeContents = null;
//let sharedByMeContents = null;
const ARCHIVE = 0;
const SHARE = 1;
var selectedContents = [];
var archiveIds = null;
var shareIds = null;
var searchInputTimeout = null;
var selectedContentType = 'All';
let searchType ="";
let selectedName ="";
let selectedId = 0;
var unsavedData = false;
// function viewContentModule() {
// 	shared.currentRunningApp = 'content';

// 	if (shared.mCustomerDetailsJSON != null) {
// 		$('#moduleTitle').html("CONTENTS");
// 		displaySection('modulesSection', 'flex', false, true);

// 		updateAppRuntime("content", "on", "ok");
// 		displayContentMenu();

// 		$('#modulesMenuArea').show();
// 		$('#modulesListArea').show();
// 		$('#modulesDisplayArea').hide();

// 		let btn = document.getElementById("btnId_get_allcontents");
// 			setTimeout(function() {
// 				btn.click();
// 			}, 200);
		
// 	} else { 		
// 		showDialog("You need to login to access this resource!", "viewLogin('menuProcess')");
// 	}
// }

function viewContentModule() {
    console.log("▶️ [viewContentModule] called");

    shared.currentRunningApp = 'content';
    console.log("📌 currentRunningApp set to:", shared.currentRunningApp);

    if (shared.mCustomerDetailsJSON != null) {
        console.log("✅ mCustomerDetailsJSON is available:", shared.mCustomerDetailsJSON);

        $('#moduleTitle').html("CONTENTS");
        console.log("📌 Updated #moduleTitle to 'CONTENTS'");

        displaySection('modulesSection', 'flex', false, true);
        console.log("📌 Called displaySection with args:", {
            sectionId: "modulesSection",
            display: "flex",
            arg3: false,
            arg4: true
        });

        updateAppRuntime("content", "on", "ok");
        console.log("📌 Called updateAppRuntime with args:", {
            app: "content",
            status: "on",
            message: "ok"
        });

        displayContentMenu();
        console.log("📌 Called displayContentMenu()");

        $('#modulesMenuArea').show();
        $('#modulesListArea').show();
        $('#modulesDisplayArea').hide();
        console.log("📌 Toggled visibility: #modulesMenuArea(show), #modulesListArea(show), #modulesDisplayArea(hide)");

        let btn = document.getElementById("btnId_get_allcontents");
        console.log("📌 btnId_get_allcontents element:", btn);

        if (btn) {
            setTimeout(function () {
                console.log("⏳ Triggering click on #btnId_get_allcontents");
                btn.click();
            }, 200);
        } else {
            console.warn("⚠️ Button #btnId_get_allcontents not found in DOM");
        }

    } else {
        console.warn("❌ mCustomerDetailsJSON is NULL - user not logged in");
        showDialog("You need to login to access this resource!", "viewLogin('menuProcess')");
        console.log("📌 Called showDialog with login warning");
    }
}

function closeContent() {
    showConfirmDialog({
        message: "Exit Content?",
        yesLabel: "Exit",
        noLabel: "Cancel",
        onYes: () => {
            console.log("🚪 Exiting content...");
            exitContent();
        },
        onNo: () => {
            console.log("❌ Exit cancelled");
            // Nothing else needed, dialog auto-hides
        }
    });
}

function exitContent() {
	if(shared.mCustomerDetailsJSON == null) {
        console.log("🕒 Starting app idle timer to be added here...");
        startAppIdleTimer();
    }
	contents = [];
	selectedContents = [];
	archiveIds = null;
	shareIds = null;
	searchInputTimeout = null;
	exitModules();
}

export function exitModules() {
    if (unsavedData === true) {
        showConfirmDialog({
            message: "Any unsaved data will be lost. Proceed?",
            yesLabel: "Proceed",
            noLabel: "Cancel",
            onYes: () => {
                console.log("✅ User chose to proceed with exit");
                confirmExit();
            },
            onNo: () => {
                console.log("❌ User cancelled exit");
                // Dialog auto-hides, nothing else needed
            }
        });
    } else {
        confirmExit();
    }
}

function confirmExit() {
	shared.currentState = "";
	pauseVideos();
    $("#modulesSection").css("display", "none");
	updateAppRuntime(shared.currentRunningApp, "off", "ok");
	if(shared.mCustomerDetailsJSON == null) {
        console.log("🕒 Starting app idle timer to be added here...");
        startAppIdleTimer();
    }
	$('#modulesMenuArea').html('');
	$('#modulesListBox').html('');
	$('#modulesDisplayArea').html('');
	viewHome();
}



function displayContentMenu() {
	var htmlContent = "";
	var contentScreenSource = shared.cmsJSON.cmsJSONdata.contentScreen;

	$.each(contentScreenSource.sectionList, function(key, section) {
		if (section.content.length) {
			htmlContent += section.content;
			
		} else if(section.sectionStyle) {
			htmlContent += '<div style="' + section.sectionStyle + '">';

			if (section.menuList.length) {
				$.each(section.menuList, function(key, menu) {
					// htmlContent += getButtons(menu, "none");
					htmlContent += getMenuBar(menu, "");
				});
			}
			if (section.overlayList.length) {
				$.each(section.overlayList, function(key, overlay) {
					htmlContent += overlay.htmlContent;
				});
			}

			htmlContent += '<div class="searchArea"><div class="searchBox" id="content_searchbox"></div></div>';

			htmlContent += '</div>';
		}
	});
	$("#modulesMenuArea").html(htmlContent);

}

function getAllContents(contentType = 'All') {
	highlightHeaderTabMenu("menuBtn", "btnId_get_allcontents");
	selectedContentType = contentType;
	searchType = "content";
	$('#content_searchbox').html('<input type="search" class="searchInput" id="content_'+searchType+'_search_input" placeholder="Search '+searchType+'" /><button class="searchBtn" id="content_'+searchType+'_searchbtn" onclick="searchContent()"><span class="material-symbols-outlined" style="font-size: 30px; padding: 5px 0;">search</span></button>');
	searchContent();
}

function getContentLocations() {
	shared.currentState = "contentLocations";
	shared.currentSourceState = shared.currentState;
	//$("#location_search_input").val("");
	searchType = "location";
	$('#content_searchbox').html('<input type="search" class="searchInput" id="content_'+searchType+'_search_input" placeholder="Search '+searchType+'" /><button class="searchBtn" id="content_'+searchType+'_searchbtn" onclick="searchContentDepartmentLocationCategory()"><span class="material-symbols-outlined" style="font-size: 30px; padding: 5px 0;">search</span></button>');
	searchContentDepartmentLocationCategory();
}


function getContentDepartments() {
	shared.currentState = "contentDepartments";
	shared.currentSourceState = shared.currentState;
	//$("#department_search_input").val("");
	searchType = "department";
	$('#content_searchbox').html('<input type="search" class="searchInput" id="content_'+searchType+'_search_input" placeholder="Search '+searchType+'" /><button class="searchBtn" id="content_'+searchType+'_searchbtn" onclick="searchContentDepartmentLocationCategory()"><span class="material-symbols-outlined" style="font-size: 30px; padding: 5px 0;">search</span></button>');
	searchContentDepartmentLocationCategory();
}

function getContentCategorys() {
	shared.currentState = "contentCategorys";
	shared.currentSourceState = shared.currentState;
	//$("#category_search_input").val("");
	searchType = "category";
	$('#content_searchbox').html('<input type="search" class="searchInput" id="content_'+searchType+'_search_input" placeholder="Search '+searchType+'" /><button class="searchBtn" id="content_'+searchType+'_searchbtn" onclick="searchContentDepartmentLocationCategory()"><span class="material-symbols-outlined" style="font-size: 30px; padding: 5px 0;">search</span></button>');
	searchContentDepartmentLocationCategory();
}

function viewSharedRecordList(contentType = 'All') {
	selectedContentType = contentType;
	searchType = "shared";
	closeShareArchiveAdd();
	highlightHeaderTabMenu("menuBtn", "btnId_view_archivedrecords");
	shared.currentState = "viewSharedRecordList";
	shared.currentSourceState = shared.currentState;
	//$("#category_search_input").val("");
	$('#content_searchbox').html('<input type="search" class="searchInput" id="filter_sharedContentListArea" placeholder="Filter contents" /><div class="searchBtn"><span class="material-symbols-outlined" style="font-size: 30px; padding: 5px 0;">filter_alt</span></div>');
	showSharedRecords();
}

function viewArchivedRecordList(contentType = 'All') {
	selectedContentType = contentType;
	searchType = "archived";
	closeShareArchiveAdd();
	highlightHeaderTabMenu("menuBtn", "btnId_view_sharedrecords");
	shared.currentState = "viewArchivedRecordList";
	shared.currentSourceState = shared.currentState;
	//$("#category_search_input").val("");
	$('#content_searchbox').html('<input type="search" class="searchInput" id="filter_archivedContentListArea" placeholder="Search contents" /><div class="searchBtn"><span class="material-symbols-outlined" style="font-size: 30px; padding: 5px 0;">filter_alt</span></div>');
	showArchivedRecords();
}

function getContentTypesAtSelected(contentType) {
	selectedContentType = contentType;
	getContentsAtDepartmentLocationCategory();
}
function getContentsAtSelected(id, name, contentType) {
	selectedContentType = contentType;
	selectedId = id;
	selectedName = name;
	getContentsAtDepartmentLocationCategory();
}

function getContentAtListIndex(index) {
	if(listItems != null && index < listItems.length) {
        console.log("yet to be impleemnted...");
		// handleContentQrCode(listItems[index].codeId);
	}
}


// async function searchContent(pageNumber = 1, pageSize = 50) {
//     try {
//         console.log("[searchContent] Start");

//         $('#modulesMenuArea').show();
//         $('#modulesListArea').show();
//         $('#modulesDisplayArea').hide();
//         fixModuleHeight("modulesModuleHeader, modulesMenuArea, footerSection", 20, "modulesListArea");

//         shared.currentState = "searchContent";
//         shared.currentSourceState = shared.currentState;

//         let contentType = selectedContentType;
//         if (contentType === 'All') {
//             contentType = '';
//         }
//         let searchStr = $("#content_content_search_input").val();

//         const data = {
//             token: shared.mCustomerDetailsJSON.token,
//             searchStr: searchStr,
//             type: contentType,
//             page: pageNumber,
//             size: pageSize
//         };
//         const url = constructUrl("/contents/searchcontentpaginated");

//         // Build request options
//         const requestOptions = await buildRequestOptions(url, "GET", data);

//         if (!requestOptions) {
//             console.warn("Request aborted due to missing requestOptions.");
//             return;
//         }

//         // Send API request via Capacitor HTTP
//         const response = await Http.request(requestOptions);

//         console.log("[searchContent] Raw response:", response);

//         // Check validity
//         if (isValidResponse(response, "searchcontentpaginated") && response.data) {
//             let jqXHR;

//             // Parse JSON if needed
//             try {
//                 jqXHR = typeof response.data === "string"
//                     ? JSON.parse(response.data)
//                     : response.data;
//             } catch (e) {
//                 console.warn("[searchContent] Parsing failed, using raw response data.");
//                 jqXHR = response.data;
//             }

//             if (jqXHR != null) {
//                 if (jqXHR.error !== "invalid_token") { // Token is valid
//                     archiveIds = jqXHR.archiveIds;
//                     shareIds = jqXHR.shareIds;

//                     viewContentRecordList("ALL CONTENTS", jqXHR.contents, "modulesListBox");
//                 } else {
//                     // Token expired - regenerate token
//                     console.warn("[searchContent] Token expired, regenerating...");
//                     getNewToken("searchContent()");
//                 }
//             }
//         }
//     } catch (error) {
//         console.error("[searchContent] Request failed:", error);
//         apiRequestFailed(error, "searchcontentpaginated");
//     }
// }

function searchContent(pageNumber = 1, pageSize = 50) {
    console.log("[searchContent] Start");

    $('#modulesMenuArea').show();
    $('#modulesListArea').show();
    $('#modulesDisplayArea').hide();
    fixModuleHeight("modulesModuleHeader, modulesMenuArea, footerSection", 20, "modulesListArea");

    shared.currentState = "searchContent";
    shared.currentSourceState = shared.currentState;

    let contentType = selectedContentType;
    if (contentType === 'All') {
        contentType = '';
    }
    let searchStr = $("#content_content_search_input").val();

    const data = {
        token: shared.mCustomerDetailsJSON.token,
        searchStr: searchStr,
        type: contentType,
        page: pageNumber,
        size: pageSize
    };
    const url = constructUrl("/contents/searchcontentpaginated");

    // Build request options
    buildRequestOptions(url, "GET", data)
        .then((requestOptions) => {
            if (!requestOptions) {
                console.warn("Request aborted due to missing requestOptions.");
                return;
            }

            // Send API request
            return Http.request(requestOptions);
        })
        .then((response) => {
            if (!response) return;

            console.log("[searchContent] Raw response:", response);

            // Check validity
            if (isValidResponse(response, "searchcontentpaginated") && response.data) {
                let jqXHR;

                // Parse JSON if needed
                try {
                    jqXHR = typeof response.data === "string"
                        ? JSON.parse(response.data)
                        : response.data;
                } catch (e) {
                    console.warn("[searchContent] Parsing failed, using raw response data.");
                    jqXHR = response.data;
                }

                if (jqXHR != null) {
                    if (jqXHR.error !== "invalid_token") { // Token is valid
                        archiveIds = jqXHR.archiveIds;
                        shareIds = jqXHR.shareIds;

                        viewContentRecordList("ALL CONTENTS", jqXHR.contents, "modulesListBox");
                    } else {
                        // Token expired - regenerate token
                        console.warn("[searchContent] Token expired, regenerating...");
                        getNewToken("searchContent()");
                    }
                }
            }
        })
        .catch((error) => {
            console.error("[searchContent] Request failed:", error);
            apiRequestFailed(error, "searchcontentpaginated");
        });
}


// async function searchContentDepartmentLocationCategory(pageNumber = 1, pageSize = 50) {
//     try {
//         console.log("[searchContentDepartmentLocationCategory] Start");

//         let type = searchType;
//         highlightHeaderTabMenu("menuBtn", "btnId_view_content" + type + "s");

//         let searchStr = $("#content_" + type + "_search_input").val();
//         if (searchStr == null) searchStr = "";

//         $('#modulesMenuArea').show();
//         $('#modulesListArea').show();
//         $('#modulesDisplayArea').hide();
//         fixModuleHeight("modulesModuleHeader, modulesMenuArea, footerSection", 20, "modulesListArea");

//         const data = {
//             token: shared.mCustomerDetailsJSON.token,
//             searchStr: searchStr,
//             page: pageNumber,
//             size: pageSize
//         };
//         const url = constructUrl("/" + type + "s/search" + type + "spaginated");

//         // Build request options
//         const requestOptions = await buildRequestOptions(url, "GET", data);

//         if (!requestOptions) {
//             console.warn("Request aborted due to missing requestOptions.");
//             return;
//         }

//         // Send API request via Capacitor HTTP
//         const response = await Http.request(requestOptions);

//         console.log("[searchContentDepartmentLocationCategory] Raw response:", response);

//         // Check validity
//         if (isValidResponse(response, "search" + type + "spaginated") && response.data) {
//             let items;

//             // Parse JSON if needed
//             try {
//                 items = typeof response.data === "string"
//                     ? JSON.parse(response.data)
//                     : response.data;
//             } catch (e) {
//                 console.warn("[searchContentDepartmentLocationCategory] Parsing failed, using raw response data.");
//                 items = response.data;
//             }

//             if (items != null) {
//                 if (items.error !== "invalid_token") { // Token is valid
//                     let htmlContent = '';
//                     htmlContent += '<div class="searchArea"><div class="searchBox" style="font-size: 1.3em; justify-content: center; text-align: center;">' 
//                                  + type.toUpperCase() + 'S (' + items.totalElements + ')</div></div>';

//                     if (items.content != null && items.content.length > 0) {
//                         listItems = [];
//                         for (let index in items.content) {
//                             let item = items.content[index];

//                             let description = item.description ? '<div>' + item.description + '</div>' : '';
//                             let image = '';

//                             if (item.image && item.image.length > 0) {
//                                 image = item.image;
//                             } else {
//                                 if (type === "content") {
//                                     image = '<span class="material-symbols-outlined" style="padding: 0 30%; width: 100%; color:var(--secondary-blue);">box</span>';
//                                 } else if (type === "department") {
//                                     image = '<img id="adlc_list_image_' + index + '" style="padding: 0 25%; width: 100%; object-fit: contain;" src="./img/icon_department.png" >';
//                                 } else if (type === "location") {
//                                     image = '<img id="adlc_list_image_' + index + '" style="padding: 0 25%; width: 100%; object-fit: contain;" src="./img/icon_location.png" >';
//                                 } else if (type === "category") {
//                                     image = '<img id="adlc_list_image_' + index + '" style="padding: 0 25%; width: 100%; object-fit: contain;" src="./img/icon_category.png" >';
//                                 }
//                             }

//                             let itemJson = {
//                                 id: item.id,
//                                 image: image,
//                                 title: item.name,
//                                 description: description,
//                                 clickAction: "getContentsAtSelected('" + item.id + "', '" + item.name + "')"
//                             };
//                             listItems.push(itemJson);

//                             if (index == items.content.length - 1) {
//                                 createList("department", htmlContent, listItems, items.pageable, items.totalPages, "modulesListBox", "getContentAtListIndex", "searchContentDepartmentLocationCategory", "ticketStyle");
//                             }
//                         }
//                     } else {
//                         htmlContent += '<div class="formlabel">No ' + type + 's found</div>';
//                         $('#modulesListBox').html(htmlContent);
//                     }
//                 } else {
//                     // Token expired - regenerate token
//                     console.warn("[searchContentDepartmentLocationCategory] Token expired, regenerating...");
//                     getNewToken("searchContentDepartmentLocationCategory(" + type + ")");
//                 }
//             }
//         }
//     } catch (error) {
//         console.error("[searchContentDepartmentLocationCategory] Request failed:", error);
//         apiRequestFailed(error, "search" + searchType + "spaginated");
//     }
// }

function searchContentDepartmentLocationCategory(pageNumber = 1, pageSize = 50) {
    try {
        console.log("[searchContentDepartmentLocationCategory] Start");

        let type = searchType;
        highlightHeaderTabMenu("menuBtn", "btnId_view_content" + type + "s");

        let searchStr = $("#content_" + type + "_search_input").val();
        if (searchStr == null) searchStr = "";

        $('#modulesMenuArea').show();
        $('#modulesListArea').show();
        $('#modulesDisplayArea').hide();
        fixModuleHeight("modulesModuleHeader, modulesMenuArea, footerSection", 20, "modulesListArea");

        const data = {
            token: shared.mCustomerDetailsJSON.token,
            searchStr: searchStr,
            page: pageNumber,
            size: pageSize
        };
        const url = constructUrl("/" + type + "s/search" + type + "spaginated");

        
        buildRequestOptions(url, "GET", data)
            .then(requestOptions => {
                if (!requestOptions) {
                    console.warn("Request aborted due to missing requestOptions.");
                    return;
                }
                return Http.request(requestOptions);
            })
            .then(response => {
                console.log("[searchContentDepartmentLocationCategory] Raw response:", response);

                if (isValidResponse(response, "search" + type + "spaginated") && response.data) {
                    let items;

                    try {
                        items = typeof response.data === "string"
                            ? JSON.parse(response.data)
                            : response.data;
                    } catch (e) {
                        console.warn("[searchContentDepartmentLocationCategory] Parsing failed, using raw response data.");
                        items = response.data;
                    }

                    if (items != null) {
                        if (items.error !== "invalid_token") { // Token is valid
                            let htmlContent = '';
                            htmlContent += '<div class="searchArea"><div class="searchBox" style="font-size: 1.3em; justify-content: center; text-align: center;">'
                                + type.toUpperCase() + 'S (' + items.totalElements + ')</div></div>';

                            if (items.content != null && items.content.length > 0) {
                                listItems = [];
                                for (let index in items.content) {
                                    let item = items.content[index];

                                    let description = item.description ? '<div>' + item.description + '</div>' : '';
                                    let image = '';

                                    if (item.image && item.image.length > 0) {
                                        image = item.image;
                                    } else {
                                        if (type === "content") {
                                            image = '<span class="material-symbols-outlined" style="padding: 0 30%; width: 100%; color:var(--secondary-blue);">box</span>';
                                        } else if (type === "department") {
                                            image = '<img id="adlc_list_image_' + index + '" style="padding: 0 25%; width: 100%; object-fit: contain;" src="./img/icon_department.png" >';
                                        } else if (type === "location") {
                                            image = '<img id="adlc_list_image_' + index + '" style="padding: 0 25%; width: 100%; object-fit: contain;" src="./img/icon_location.png" >';
                                        } else if (type === "category") {
                                            image = '<img id="adlc_list_image_' + index + '" style="padding: 0 25%; width: 100%; object-fit: contain;" src="./img/icon_category.png" >';
                                        }
                                    }

                                    let itemJson = {
                                        id: item.id,
                                        image: image,
                                        title: item.name,
                                        description: description,
                                        clickAction: "getContentsAtSelected('" + item.id + "', '" + item.name + "')"
                                    };
                                    listItems.push(itemJson);

                                    if (index == items.content.length - 1) {
                                        createList("department", htmlContent, listItems, items.pageable, items.totalPages, "modulesListBox", "getContentAtListIndex", "searchContentDepartmentLocationCategory", "ticketStyle");
                                    }
                                }
                            } else {
                                htmlContent += '<div class="formlabel">No ' + type + 's found</div>';
                                $('#modulesListBox').html(htmlContent);
                            }
                        } else {
                            // Token expired - regenerate token
                            console.warn("[searchContentDepartmentLocationCategory] Token expired, regenerating...");
                            getNewToken("searchContentDepartmentLocationCategory(" + type + ")");
                        }
                    }
                }
            })
            .catch(error => {
                console.error("[searchContentDepartmentLocationCategory] Request failed:", error);
                apiRequestFailed(error, "search" + searchType + "spaginated");
            });

    } catch (error) {
        console.error("[searchContentDepartmentLocationCategory] Unexpected failure:", error);
    }
}



// async function getContentsAtDepartmentLocationCategory(pageNumber = 1, pageSize = 50) { 
//     try {
//         console.log("[getContentsAtDepartmentLocationCategory] Start");

//         $('#modulesMenuArea').show();
//         $('#modulesListArea').show();
//         $('#modulesDisplayArea').hide();
//         $('#content_searchbox').html('');

//         let type = searchType;
//         let id = selectedId;
//         let name = selectedName;
//         shared.currentState = type + "Content";
//         shared.currentSourceState = shared.currentState;

//         let contentType = selectedContentType;
//         if (contentType === 'All') { contentType = ''; }

//         const url = constructUrl("/contents/getcontentsat" + type + "paginated");

//         // Build request data
//         let data = {};
//         if (type === "department") {
//             data = { token: shared.mCustomerDetailsJSON.token, type: contentType, departmentId: id, page: pageNumber, size: pageSize };
//         } else if (type === "location") {
//             data = { token: shared.mCustomerDetailsJSON.token, type: contentType, locationId: id, page: pageNumber, size: pageSize };
//         } else if (type === "category") {
//             data = { token: shared.mCustomerDetailsJSON.token, type: contentType, categoryId: id, page: pageNumber, size: pageSize };
//         }

//         // Build request options
//         const requestOptions = await buildRequestOptions(url, "GET", data);

//         if (!requestOptions) {
//             console.warn("Request aborted due to missing requestOptions.");
//             return;
//         }

//         // Send API request via Capacitor HTTP
//         const response = await Http.request(requestOptions);

//         console.log("[getContentsAtDepartmentLocationCategory] Raw response:", response);

//         // Check validity
//         if (isValidResponse(response, "getcontentsat" + type + "paginated") && response.data) {
//             let items;

//             // Parse JSON if needed
//             try {
//                 items = typeof response.data === "string"
//                     ? JSON.parse(response.data)
//                     : response.data;
//             } catch (e) {
//                 console.warn("[getContentsAtDepartmentLocationCategory] Parsing failed, using raw response data.");
//                 items = response.data;
//             }

//             if (items != null) {
//                 if (items.error !== "invalid_token") { // Token is valid
//                     viewContentRecordList(type.toUpperCase() + ': ' + name.toUpperCase(), items, "modulesListBox");
//                 } else {
//                     // Token expired - regenerate token
//                     console.warn("[getContentsAtDepartmentLocationCategory] Token expired, regenerating...");
//                     getNewToken("getContentsAtDepartmentLocationCategory()");
//                 }
//             }
//         }
//     } catch (error) {
//         console.error("[getContentsAtDepartmentLocationCategory] Request failed:", error);
//         apiRequestFailed(error, "getcontentsat" + searchType + "paginated");
//     }
// }

function getContentsAtDepartmentLocationCategory(pageNumber = 1, pageSize = 50) {
    try {
        console.log("[getContentsAtDepartmentLocationCategory] Start");

        $('#modulesMenuArea').show();
        $('#modulesListArea').show();
        $('#modulesDisplayArea').hide();
        $('#content_searchbox').html('');

        let type = searchType;
        let id = selectedId;
        let name = selectedName;
        shared.currentState = type + "Content";
        shared.currentSourceState = shared.currentState;

        let contentType = selectedContentType;
        if (contentType === 'All') { contentType = ''; }

        const url = constructUrl("/contents/getcontentsat" + type + "paginated");

        // Build request data
        let data = {};
        if (type === "department") {
            data = { token: shared.mCustomerDetailsJSON.token, type: contentType, departmentId: id, page: pageNumber, size: pageSize };
        } else if (type === "location") {
            data = { token: shared.mCustomerDetailsJSON.token, type: contentType, locationId: id, page: pageNumber, size: pageSize };
        } else if (type === "category") {
            data = { token: shared.mCustomerDetailsJSON.token, type: contentType, categoryId: id, page: pageNumber, size: pageSize };
        }

        
        buildRequestOptions(url, "GET", data)
            .then(requestOptions => {
                if (!requestOptions) {
                    console.warn("Request aborted due to missing requestOptions.");
                    return;
                }
                return Http.request(requestOptions);
            })
            .then(response => {
                console.log("[getContentsAtDepartmentLocationCategory] Raw response:", response);

                if (isValidResponse(response, "getcontentsat" + type + "paginated") && response.data) {
                    let items;

                    try {
                        items = typeof response.data === "string"
                            ? JSON.parse(response.data)
                            : response.data;
                    } catch (e) {
                        console.warn("[getContentsAtDepartmentLocationCategory] Parsing failed, using raw response data.");
                        items = response.data;
                    }

                    if (items != null) {
                        if (items.error !== "invalid_token") { // Token is valid
                            viewContentRecordList(type.toUpperCase() + ': ' + name.toUpperCase(), items, "modulesListBox");
                        } else {
                            // Token expired - regenerate token
                            console.warn("[getContentsAtDepartmentLocationCategory] Token expired, regenerating...");
                            getNewToken("getContentsAtDepartmentLocationCategory()");
                        }
                    }
                }
            })
            .catch(error => {
                console.error("[getContentsAtDepartmentLocationCategory] Request failed:", error);
                apiRequestFailed(error, "getcontentsat" + searchType + "paginated");
            });

    } catch (error) {
        console.error("[getContentsAtDepartmentLocationCategory] Unexpected failure:", error);
    }
}


function viewContentRecordList(title, itemList, destin) {
	
	let items = itemList.content;
	let contentType = selectedContentType;
	let type = searchType;

	let totalElements = itemList.totalElements;
	let totalPages = itemList.totalPages;
	let pageable = itemList.pageable;
	if(pageable == undefined || pageable == null) {		// Not pageable
		items = itemList;
		totalElements = itemList.length;
		pageable = null;
		totalPages = 1;
	}

	let searchFunction = 'getAllContents';
	if(searchType == "department" || searchType == "location" || searchType == "category") {
		searchFunction = 'getContentTypesAtSelected';
	} else if(type == "shared") {
		searchFunction = 'viewSharedRecordList';
	} else if(type == "archived") {
		searchFunction = 'viewArchivedRecordList';
	}

	var htmlContent = '';
	htmlContent += '<div class="searchArea"><div class="searchBox" style="font-size: 1.3em; justify-content: center; text-align: center;">'+title+' ('+totalElements+')</div></div>';
	htmlContent += '<div style="padding: 0 10px; display: flex; justify-content: flex-start; flex-wrap: wrap;">';
		htmlContent += '<div class="listBoxActionButton" id="contentType_All" style="border-radius: 5px; padding: 5px 10px; margin: 5px;" onclick="'+searchFunction+'(\'All\')">All</div>';
		htmlContent += '<div class="listBoxActionButton" id="contentType_Video" style="border-radius: 5px; padding: 5px 10px; margin: 5px;" onclick="'+searchFunction+'(\'Video\')">Video</div>';
		htmlContent += '<div class="listBoxActionButton" id="contentType_Image" style="border-radius: 5px; padding: 5px 10px; margin: 5px;" onclick="'+searchFunction+'(\'Image\')">Image</div>';
		htmlContent += '<div class="listBoxActionButton" id="contentType_PDF" style="border-radius: 5px; padding: 5px 10px; margin: 5px;" onclick="'+searchFunction+'(\'PDF\')">PDF</div>';
		htmlContent += '<div class="listBoxActionButton" id="contentType_HTML" style="border-radius: 5px; padding: 5px 10px; margin: 5px;" onclick="'+searchFunction+'(\'HTML\')">HTML</div>';
		htmlContent += '<div class="listBoxActionButton" id="contentType_Document" style="border-radius: 5px; padding: 5px 10px; margin: 5px;" onclick="'+searchFunction+'(\'Document\')">Document</div>';
		htmlContent += '<div class="listBoxActionButton" id="contentType_Presentation" style="border-radius: 5px; padding: 5px 10px; margin: 5px;" onclick="'+searchFunction+'(\'Presentation\')">Presentation</div>';
		htmlContent += '<div class="listBoxActionButton" id="contentType_Spreadsheet" style="border-radius: 5px; padding: 5px 10px; margin: 5px;" onclick="'+searchFunction+'(\'Spreadsheet\')">Spreadsheet</div>';
	htmlContent += '</div>';

	if(items != null && items.length > 0) {
		listItems = [];
		for(var index in items) {
			
			let sharedItem = null;
			let item = items[index];
			//if(destin.includes("sharedWith") || destin.includes("sharedBy") || destin.includes("archive")) {
			if(item.content != undefined) {
				sharedItem = item;
				item = item.content;
			}

			let description = '';
			if(item.description != null) {
				description += '<div>'+item.description+'</div>';
			}
			if(item.codeId != null) {
				description += '<div>'+item.codeId+'</div>';
			}

			let image = '';
			if(item.image != undefined && item.image != null && item.image.length > 0) {
				image = item.image;
			} else {
				let contentUrl = item.contentUrl.trim();
				//image = '<span class="material-symbols-outlined" style="padding: 0 30%; width: 100%; color:var(--secondary-blue);">box</span>';
				if(contentUrl.startsWith('<') && contentUrl.endsWith('>')) {
					image = '<img class="ticketStyleImageIcon" src="./img/icon_html.png" onerror="this.onerror=null;this.src=\'./img/noimage.jpg\';" />';
				} else if(contentUrl.toLowerCase().includes('.pdf')) {
					image = '<img class="ticketStyleImageIcon" src="./img/icon_pdf.png" onerror="this.onerror=null;this.src=\'./img/noimage.jpg\';" />';
				} else if(contentUrl.toLowerCase().includes('.mp4')) {
					image = '<img class="ticketStyleImageIcon" src="./img/icon_video.png" onerror="this.onerror=null;this.src=\'./img/noimage.jpg\';" />';
				} else if(contentUrl.toLowerCase().includes('.doc')) {
					image = '<img class="ticketStyleImageIcon" src="./img/icon_word.png" onerror="this.onerror=null;this.src=\'./img/noimage.jpg\';" />';
				} else if(contentUrl.toLowerCase().includes('.ppt')) {
					image = '<img class="ticketStyleImageIcon" src="./img/icon_ppt.png" onerror="this.onerror=null;this.src=\'./img/noimage.jpg\';" />';
				} else if(contentUrl.toLowerCase().includes('.xls')) {
					image = '<img class="ticketStyleImageIcon" src="./img/icon_excel.png" onerror="this.onerror=null;this.src=\'./img/noimage.jpg\';" />';
				} else if(contentUrl.toLowerCase().includes('.png') || contentUrl.toLowerCase().includes('.jpg') || contentUrl.toLowerCase().includes('.jpeg') || item.contentUrl.toLowerCase().includes('.bmp')) {
					image = '<img class="ticketStyleImageIcon" src="./img/icon_img.png" onerror="this.onerror=null;this.src=\'./img/noimage.jpg\';" />';
				} else {
					image = '<img class="ticketStyleImageIcon" src="./img/noimage.jpg" onerror="this.onerror=null;this.src=\'./img/noimage.jpg\';" />';
				}
			}

			let states = [];
			//let actions = [{"text": "View Audits", "act":"handleAssetQrCode('"+item.codeId+"', 1)"}];
			let actions = [];
			let activeActions = [];
			let contentIdName = item.id+'__'+item.contentName;
			if(sharedItem != null) {	// Share info available
				if(sharedItem.byName != undefined) {
					states.push({"text":"Shared by: "+sharedItem.byName, "type": "warningState"});
				} else if(sharedItem.withName != undefined) {
					states.push({"text":"Shared with: "+sharedItem.withName, "type": "warningState"});
				}
			} else {
				const shareExists = shareIds.some(share => share.contentId === item.id);
				if(shareExists) {
					states.push({"text":"Shared", "type": "warningState"});
				}
			}

			const archiveExists = archiveIds.some(archive => archive.contentId === item.id);
			if(archiveExists) {
				states.push({"text":"Archived", "type": "infoState"});
			} else {
				activeActions.push({"text": "Archive"});
			}
			
			if(destin.includes("sharedWith") || destin.includes("sharedBy") || destin.includes("archive")) {
				if(destin.includes("archive")) {
					actions.push({"text": "Delete", "type":"button", "icon": "<span class=\"material-symbols-outlined\" style=\"font-size: 20px;\">delete</span>",  "actionClass": "activeAction1", "act":"deleteArchiveNow('"+sharedItem.archiveId+"')"});
				} else {
					actions.push({"text": "Delete", "type":"button", "icon": "<span class=\"material-symbols-outlined\" style=\"font-size: 20px;\">delete</span>",  "actionClass": "activeAction1", "act":"deleteShareNow('"+sharedItem.shareId+"')"});
				}
				activeActions.push({"text": "Delete"});
			}
			actions.push({"text": "Archive", "type":"button", "icon": "<span class=\"material-symbols-outlined\" style=\"font-size: 20px;\">library_add</span>",  "actionClass": "activeAction1", "act":"archiveNow('"+contentIdName+"')"});
			actions.push({"text": "Share", "type":"button", "icon": "<span class=\"material-symbols-outlined\" style=\"font-size: 20px;\">share</span>",  "actionClass": "activeAction1", "act":"shareNow('"+contentIdName+"')"});
			activeActions.push({"text": "Share"});

			let itemJson = {"id": item.id, "image": image, "contentUrl":item.contentUrl, "title":item.contentName, "description":description, "clickAction":"displayContentAtIndex("+index+")", "states":states, "actions":actions, "activeActions":activeActions};
			listItems.push(itemJson);
			if(index == items.length-1) {
				contents = listItems;
				createList("content", htmlContent, listItems, pageable, totalPages, destin, "getContentAtListIndex", "searchContent", "ticketStyle");
				$('#contentType_'+contentType).addClass("activeAction1");
			}
		}
	} else {
		htmlContent += '<div class="formlabel">No Contents found</div>';
		$('#'+destin).html(htmlContent);
		$('#contentType_'+contentType).addClass("activeAction1");
	}

/*
	$('#search_contentListArea_'+tag).on('input', function() {
		var that = this;
		if (searchInputTimeout !== null) {
			clearTimeout(searchInputTimeout);
		}
		searchInputTimeout = setTimeout(function () {
			filterContents(that);
		}, 1000);
	});*/
}

function displayContentAtIndex(index) {
	shared.currentState = "displayContent";
	showContentArea();
	let htmlContent = '';
	htmlContent+= '<div id="contentViewArea">';
		htmlContent+= '<div id="contentDisplayArea">';
			htmlContent+= '<div class="lightBkClass" id="modules_contentViewBox"></div>';
		htmlContent+= '</div>';
	htmlContent+= '</div>';
	$('#modulesDisplayArea').html(htmlContent);
	viewContent(contents[index], 'modules_contentViewBox');
}


function archiveNow(contentIdName) {
	selectedContents = [];
	selectedContents.push(contentIdName);
	displayShareArchiveAdd('ARCHIVE');
}

function shareNow(contentIdName) {
	selectedContents = [];
	selectedContents.push(contentIdName);
	displayShareArchiveAdd('SHARE');
}

function deleteShareNow(theId) {
	selectedContents = [];
	selectedContents.push(theId);
	deleteSharedContent();
}

function deleteArchiveNow(theId) {
	selectedContents = [];
	selectedContents.push(theId);
	deleteArchivedContent();
}


// async function showArchivedRecords() {
//     try {
//         console.log("[showArchivedRecords] Start");

//         highlightHeaderTabMenu("menuBtn", "btnId_view_archivedrecords");

//         let contentType = selectedContentType;

//         const data = {
//             token: shared.mCustomerDetailsJSON.token,
//             type: contentType
//         };
//         const url = constructUrl("/api/getcontentarchivebyuser");

//         // Build request options
//         const requestOptions = await buildRequestOptions(url, "GET", data);

//         if (!requestOptions) {
//             console.warn("Request aborted due to missing requestOptions.");
//             return;
//         }

//         // Send API request via Capacitor HTTP
//         const response = await Http.request(requestOptions);

//         console.log("[showArchivedRecords] Raw response:", response);

//         // Check validity
//         if (isValidResponse(response, "getcontentarchivebyuser") && response.data) {
//             let contents;

//             // Parse JSON if needed
//             try {
//                 contents = typeof response.data === "string"
//                     ? JSON.parse(response.data)
//                     : response.data;
//             } catch (e) {
//                 console.warn("[showArchivedRecords] Parsing failed, using raw response data.");
//                 contents = response.data;
//             }

//             if (contents != null) {
//                 if (contents.error !== "invalid_token") { // Token is valid
//                     let htmlContent = '<div class="moduleContentListArea" id="contentListArea_archive" style="padding-bottom: 10px;"></div>';
//                     $('#modulesListBox').html(htmlContent);

//                     viewContentRecordList("MY FAVORITES", contents.archive, "contentListArea_archive");
//                 } else {
//                     // Token expired - regenerate token
//                     console.warn("[showArchivedRecords] Token expired, regenerating...");
//                     getNewToken("viewArchivedRecordList()");
//                 }
//             }
//         }
//     } catch (error) {
//         console.error("[showArchivedRecords] Request failed:", error);
//         apiRequestFailed(error, "getcontentarchivebyuser");
//     }
// }

function showArchivedRecords() {
    try {
        console.log("[showArchivedRecords] Start");

        highlightHeaderTabMenu("menuBtn", "btnId_view_archivedrecords");

        let contentType = selectedContentType;

        const data = {
            token: shared.mCustomerDetailsJSON.token,
            type: contentType
        };
        const url = constructUrl("/api/getcontentarchivebyuser");

        
        buildRequestOptions(url, "GET", data)
            .then(requestOptions => {
                if (!requestOptions) {
                    console.warn("Request aborted due to missing requestOptions.");
                    return;
                }
                return Http.request(requestOptions);
            })
            .then(response => {
                console.log("[showArchivedRecords] Raw response:", response);

                if (isValidResponse(response, "getcontentarchivebyuser") && response.data) {
                    let contents;

                    try {
                        contents = typeof response.data === "string"
                            ? JSON.parse(response.data)
                            : response.data;
                    } catch (e) {
                        console.warn("[showArchivedRecords] Parsing failed, using raw response data.");
                        contents = response.data;
                    }

                    if (contents != null) {
                        if (contents.error !== "invalid_token") { // Token is valid
                            let htmlContent = '<div class="moduleContentListArea" id="contentListArea_archive" style="padding-bottom: 10px;"></div>';
                            $('#modulesListBox').html(htmlContent);

                            viewContentRecordList("MY FAVORITES", contents.archive, "contentListArea_archive");
                        } else {
                            // Token expired - regenerate token
                            console.warn("[showArchivedRecords] Token expired, regenerating...");
                            getNewToken("viewArchivedRecordList()");
                        }
                    }
                }
            })
            .catch(error => {
                console.error("[showArchivedRecords] Request failed:", error);
                apiRequestFailed(error, "getcontentarchivebyuser");
            });

    } catch (error) {
        console.error("[showArchivedRecords] Unexpected failure:", error);
    }
}



// async function showSharedRecords() {
//     try {
//         console.log("[showSharedRecords] Start");

//         highlightHeaderTabMenu("menuBtn", "btnId_view_sharedrecords");

//         let contentType = selectedContentType;

//         const data = {
//             token: shared.mCustomerDetailsJSON.token,
//             type: contentType
//         };
//         const url = constructUrl("/api/getcontentsharedbyuser");

//         // Build request options
//         const requestOptions = await buildRequestOptions(url, "GET", data);

//         if (!requestOptions) {
//             console.warn("Request aborted due to missing requestOptions.");
//             return;
//         }

//         // Send API request via Capacitor HTTP
//         const response = await Http.request(requestOptions);

//         console.log("[showSharedRecords] Raw response:", response);

//         // Check validity
//         if (isValidResponse(response, "getcontentsharedbyuser") && response.data) {
//             let contents;

//             // Parse JSON if needed
//             try {
//                 contents = typeof response.data === "string"
//                     ? JSON.parse(response.data)
//                     : response.data;
//             } catch (e) {
//                 console.warn("[showSharedRecords] Parsing failed, using raw response data.");
//                 contents = response.data;
//             }

//             if (contents != null) {
//                 if (contents.error !== "invalid_token") { // Token is valid
//                     let htmlContent = '';
//                     htmlContent += '<div id="contentTabbedContentArea">';
//                         htmlContent += '<div id="contentChartTabArea" class="headerTabMenuBtnAreaStyle">';
//                             htmlContent += '<button id="content_tab_0" class="tabLinks headerTabMenuBtnStyle" data-linkedcontentareaid="contentsharedWithChartArea_0" onclick="openTab(event, 0)">Shared with me</button>';
//                             htmlContent += '<button id="content_tab_1" class="tabLinks headerTabMenuBtnStyle" data-linkedcontentareaid="contentsharedByChartArea_1" onclick="openTab(event, 1)">Shared by me</button>';
//                         htmlContent += '</div>';

//                         htmlContent += '<div id="contentChartDisplayArea" style="height: calc(100% - 30px); box-sizing: border-box; overflow: auto;">';
//                             htmlContent += '<div id="contentsharedWithChartArea_0" class="chartArea" style="height: fit-content;">';
//                                 htmlContent += '<div class="moduleContentListArea" id="contentListArea_sharedWith" style="padding-bottom: 10px;"></div>';
//                             htmlContent += '</div>';
//                             htmlContent += '<div id="contentsharedByChartArea_1" class="chartArea" style="height: fit-content;">'; 
//                                 htmlContent += '<div class="moduleContentListArea" id="contentListArea_sharedBy" style="padding-bottom: 10px;"></div>';
//                             htmlContent += '</div>';
//                         htmlContent += '</div>';
//                     htmlContent += '</div>';

//                     $('#modulesListBox').html(htmlContent);

//                     viewContentRecordList("SHARED WITH ME", contents.sharedWithMe, "contentListArea_sharedWith");
//                     viewContentRecordList("SHARED BY ME", contents.sharedByMe, "contentListArea_sharedBy");

//                     $('#filter_sharedContentListArea').on('input', function () {
//                         var that = this;
//                         if (searchInputTimeout !== null) {
//                             clearTimeout(searchInputTimeout);
//                         }
//                         searchInputTimeout = setTimeout(function () {
//                             filterContents(that);
//                         }, 1000);
//                     });

//                     const defaultTab = document.getElementById('content_tab_0');
//                     setTimeout(function () {
//                         defaultTab.click();
//                     }, 200);
//                 } else {
//                     // Token expired - regenerate token
//                     console.warn("[showSharedRecords] Token expired, regenerating...");
//                     getNewToken("viewSharedRecordList()");
//                 }
//             }
//         }
//     } catch (error) {
//         console.error("[showSharedRecords] Request failed:", error);
//         apiRequestFailed(error, "getcontentsharedbyuser");
//     }
// }

function showSharedRecords() {
    console.log("[showSharedRecords] Start");

    highlightHeaderTabMenu("menuBtn", "btnId_view_sharedrecords");

    let contentType = selectedContentType;

    const data = {
        token: shared.mCustomerDetailsJSON.token,
        type: contentType
    };
    const url = constructUrl("/api/getcontentsharedbyuser");

    buildRequestOptions(url, "GET", data).then(requestOptions => {              
        Http.request(requestOptions).then(response => {
            console.log("[showSharedRecords] Raw response:", response);

            if (isValidResponse(response, "getcontentsharedbyuser") && response.data) {
                let contents;

                try {
                    contents = typeof response.data === "string"
                        ? JSON.parse(response.data)
                        : response.data;
                } catch (e) {
                    console.warn("[showSharedRecords] Parsing failed, using raw response data.");
                    contents = response.data;
                }

                if (contents != null) {
                    if (contents.error !== "invalid_token") { // Token is valid
                        let htmlContent = '';
                        htmlContent += '<div id="contentTabbedContentArea">';
                            htmlContent += '<div id="contentChartTabArea" class="headerTabMenuBtnAreaStyle">';
                                htmlContent += '<button id="content_tab_0" class="tabLinks headerTabMenuBtnStyle" data-linkedcontentareaid="contentsharedWithChartArea_0" onclick="openTab(event, 0)">Shared with me</button>';
                                htmlContent += '<button id="content_tab_1" class="tabLinks headerTabMenuBtnStyle" data-linkedcontentareaid="contentsharedByChartArea_1" onclick="openTab(event, 1)">Shared by me</button>';
                            htmlContent += '</div>';

                            htmlContent += '<div id="contentChartDisplayArea" style="height: calc(100% - 30px); box-sizing: border-box; overflow: auto;">';
                                htmlContent += '<div id="contentsharedWithChartArea_0" class="chartArea" style="height: fit-content;">';
                                    htmlContent += '<div class="moduleContentListArea" id="contentListArea_sharedWith" style="padding-bottom: 10px;"></div>';
                                htmlContent += '</div>';
                                htmlContent += '<div id="contentsharedByChartArea_1" class="chartArea" style="height: fit-content;">'; 
                                    htmlContent += '<div class="moduleContentListArea" id="contentListArea_sharedBy" style="padding-bottom: 10px;"></div>';
                                htmlContent += '</div>';
                            htmlContent += '</div>';
                        htmlContent += '</div>';

                        $('#modulesListBox').html(htmlContent);

                        viewContentRecordList("SHARED WITH ME", contents.sharedWithMe, "contentListArea_sharedWith");
                        viewContentRecordList("SHARED BY ME", contents.sharedByMe, "contentListArea_sharedBy");

                        $('#filter_sharedContentListArea').on('input', function () {
                            var that = this;
                            if (searchInputTimeout !== null) {
                                clearTimeout(searchInputTimeout);
                            }
                            searchInputTimeout = setTimeout(function () {
                                filterContents(that);
                            }, 1000);
                        });

                        const defaultTab = document.getElementById('content_tab_0');
                        setTimeout(function () {
                            defaultTab.click();
                        }, 200);
                    } else {
                        // Token expired - regenerate token
                        console.warn("[showSharedRecords] Token expired, regenerating...");
                        getNewToken("viewSharedRecordList()");
                    }
                }
            }
        }).catch(error => {
            console.error("[showSharedRecords] Request failed:", error);
            apiRequestFailed(error, "getcontentsharedbyuser");
        });
    }).catch(error => {
        console.error("[showSharedRecords] Unexpected failure:", error);
    });
}

   

function filterContents(that) {
	var inputData = that.value.toLowerCase();
	console.log("Input Date: "+inputData);
	var tempContentArr = [];
	
	var contents = contents;

	for(var content of contents) {
		if(content.contentName != undefined) {
			if(content.contentName.toLowerCase().includes(inputData)) {
				tempContentArr.push(content);
			}
		} else if(content.content != undefined) {
			if(content.content.contentName.toLowerCase().includes(inputData)) {
				tempContentArr.push(content);
			}
		}
	}
	destin = that.dataset.linkedareaid;
	//populateContentRecords(tempContentArr, true, destin);
}

function loadContentFooterButtons() {
	var htmlContent = "";
	htmlContent += '<div class="moduleButton" id="contentarchiveButton"  onclick="displayShareArchiveAdd(\''+ARCHIVE+'\')"><span><i class="fas fa-archive"></i></span></div>';
	htmlContent += '<div class="moduleButton" id="contentshareButton"  onclick="displayShareArchiveAdd(\''+SHARE+'\')"><span><i class="fas fa-share-alt"></i></div>';
	htmlContent += '<div class="moduleButton" id="contentDeleteButton" ><span><i class="fas fa-trash-alt"></i></div>';
	$("#contentFooter").html(htmlContent);

	disableAllFooterBtns();
}

function disableAllFooterBtns() {
	$("#contentarchiveButton").hide();
	$("#contentshareButton").hide();
	$("#contentDeleteButton").hide();
}

// async function displayShareArchiveAdd(archiveOrShare) {
//     try {
//         $('#archiveShareSection').show();
//         let htmlContent = '';
//         const contents = selectedContents;

//         htmlContent += '<div class="popupWindow">';
//         htmlContent += '<div class="lightBkClass" style="width: 100%; height: 100%; border-radius: 5px; position: relative;">';

//         htmlContent += '<div style="position: absolute; right: 5px; top: 5px;"><div class="moduleButton" onclick="closeShareArchiveAdd()" style="background-color: var(--primary-white); padding: 5px; margin: 0;"><span class="material-symbols-outlined" style="font-size: 30px;">close</span></div></div>';
//         htmlContent += '<div class="moduleNameArea">';
//         if (archiveOrShare === 'ARCHIVE') {
//             htmlContent += '<div class="searchArea"><div class="searchBox" style="font-size: 1.3em; justify-content: center; text-align: center;">Add to Favourite</div></div>';
//         } else {
//             htmlContent += '<div class="searchArea"><div class="searchBox" style="font-size: 1.3em; justify-content: center; text-align: center;">Share</div></div>';
//         }
//         htmlContent += '</div>';

//         htmlContent += '<div class="moduleContentListBox" id="contentarchiveListBox">';
//         for (let index in contents) {
//             const content = contents[index];

//             htmlContent += '<div id="shareArchiveContentNameArea">';
//             htmlContent += '<div style="margin: auto">';
//             if (content.toLowerCase().includes('.pdf')) {
//                 htmlContent += '<img class="moduleImage" style="width: 40px;" src="./img/icon_pdf.png" onerror="this.onerror=null;this.src=\'./img/noimage.jpg\';" />';
//             } else if (content.toLowerCase().includes('.mp4')) {
//                 htmlContent += '<img class="moduleImage" style="width: 40px;" src="./img/icon_video.png" onerror="this.onerror=null;this.src=\'./img/noimage.jpg\';" />';
//             } else if (content.toLowerCase().includes('.doc')) {
//                 htmlContent += '<img class="moduleImage" style="width: 40px;" src="./img/icon_word.png" onerror="this.onerror=null;this.src=\'./img/noimage.jpg\';" />';
//             } else if (content.toLowerCase().includes('.ppt')) {
//                 htmlContent += '<img class="moduleImage" style="width: 40px;" src="./img/icon_ppt.png" onerror="this.onerror=null;this.src=\'./img/noimage.jpg\';" />';
//             } else if (content.toLowerCase().includes('.xls')) {
//                 htmlContent += '<img class="moduleImage" style="width: 40px;" src="./img/icon_excel.png" onerror="this.onerror=null;this.src=\'./img/noimage.jpg\';" />';
//             } else if (content.toLowerCase().includes('.png') || content.toLowerCase().includes('.jpg') || content.toLowerCase().includes('.jpeg') || content.toLowerCase().includes('.bmp')) {
//                 htmlContent += '<img class="moduleImage" style="width: 40px;" src="./img/icon_img.png" onerror="this.onerror=null;this.src=\'./img/noimage.jpg\';" />';
//             }
//             htmlContent += '</div>';
//             htmlContent += '<div class="moduleDescriptionClass" style="font-size: 1.1em; font-weight: bold; color: var(--primary-blue); word-break: break-word; overflow-wrap: break-word; white-space: normal;">' + content.split('__')[1] + '</div>';
//             htmlContent += '</div>';
//         }
//         htmlContent += '</div>';

//         htmlContent += '<div style="width: 100%; padding: 10px;">'; // Starting of form
//         htmlContent += '<input type="text" id="contentNoteTextArea" placeholder="Add Note" style="width: 100%; border-radius: 25px; border: 1px solid rgb(200, 200, 200); padding: 10px; margin: 5px 0;">';

//         if (archiveOrShare === 'ARCHIVE') {
//             htmlContent += '<div class="footerMenuBtnAreaStyle">';
//             htmlContent += '<div style="width: 100%; text-align:center; margin-top: 20px;"><div class="moduleButton" onclick="saveArchiveData()" style="background-color: var(--secondary-blue); color: var(--primary-white); padding: 5px;"><span class="material-symbols-outlined" style="font-size: 30px;">library_add</span></div></div>';
//             htmlContent += '</div>';
//             htmlContent += '</div>'; // closing form
//             htmlContent += '</div></div>';
//             $('#archiveShareSection').html(htmlContent);

//         } else {
//             // SHARE FLOW with Capacitor HTTP
//             const data = { token: shared.mCustomerDetailsJSON.token };
//             const url = constructUrl("/api/getusers");

//             // Build request options
//             const requestOptions = await buildRequestOptions(url, "GET", data);
//             if (!requestOptions) {
//                 console.warn("[displayShareArchiveAdd] Request aborted due to missing requestOptions.");
//                 return;
//             }

//             try {
//                 const response = await Http.request(requestOptions);
//                 console.log("[displayShareArchiveAdd] Raw response:", response);

//                 let userIdAndNames;
//                 try {
//                     userIdAndNames = typeof response.data === "string"
//                         ? JSON.parse(response.data)
//                         : response.data;
//                 } catch (e) {
//                     console.warn("[displayShareArchiveAdd] Parsing failed, using raw response data.");
//                     userIdAndNames = response.data;
//                 }

//                 if (userIdAndNames && userIdAndNames.error !== "invalid_token") {
//                     htmlContent += '<input id="userSelect" class="formvalue" list="userlist" >';
//                     htmlContent += '<div class="selectDiv">';
//                     htmlContent += '<datalist id="userlist" class="selectBox" onChange="getSelectedOptions(this)" style="width: 100%; border-radius: 25px; border: 1px solid rgb(200, 200, 200); padding: 10px; margin: 5px 0; background-color: white;">';
//                     htmlContent += '<option value="" id="option_0-0">Select Users</option>';

//                     for (const user of userIdAndNames) {
//                         htmlContent += '<option value="' + user.id + '-' + user.firstName + '" id="option_' + user.id + '-' + user.firstName + '">' + user.firstName + ' ' + user.lastName + '</option>';
//                     }
//                     htmlContent += '</datalist>';
//                     htmlContent += '</div>';

//                     htmlContent += '<div id="tagbtns" class="contentUserBtnArea"></div>';
//                     htmlContent += '<input type="hidden" id="taglist"></input>';
//                     htmlContent += '</div>'; // closing form

//                     htmlContent += '<div class="footerMenuBtnAreaStyle">';
//                     htmlContent += '<div style="width: 100%; text-align:center; margin-top: 20px;"><div class="moduleButton" onclick="saveShareData()" style="background-color: var(--secondary-blue); color: var(--primary-white); padding: 5px;"><span class="material-symbols-outlined" style="font-size: 30px;">share</span></div></div>';
//                     htmlContent += '</div>';

//                     htmlContent += '</div></div>';
//                     $('#archiveShareSection').html(htmlContent);

//                 } else {
//                     console.warn("[displayShareArchiveAdd] Token expired, regenerating...");
//                     getNewToken("displayShareArchiveAdd('" + archiveOrShare + "')");
//                 }

//             } catch (error) {
//                 console.error("[displayShareArchiveAdd] Request failed:", error);
//                 htmlContent += '</div>';
//                 htmlContent += '</div></div>';
//                 htmlContent += '<div class="moduleDescriptionClass">Could not get users for sharing!</div>';
//                 $('#archiveShareSection').html(htmlContent);
//                 apiRequestFailed(error, "getusers");
//             }
//         }
//     } catch (error) {
//         console.error("[displayShareArchiveAdd] General error:", error);
//     }
// }

async function displayShareArchiveAdd(archiveOrShare) {
    try {
        $('#archiveShareSection').show();
        let htmlContent = '';
        const contents = selectedContents;

        htmlContent += '<div class="popupWindow">';
        htmlContent += '<div class="lightBkClass" style="width: 100%; height: 100%; border-radius: 5px; position: relative;">';

        htmlContent += '<div style="position: absolute; right: 5px; top: 5px;"><div class="moduleButton" onclick="closeShareArchiveAdd()" style="background-color: var(--primary-white); padding: 5px; margin: 0;"><span class="material-symbols-outlined" style="font-size: 30px;">close</span></div></div>';
        htmlContent += '<div class="moduleNameArea">';
        if (archiveOrShare === 'ARCHIVE') {
            htmlContent += '<div class="searchArea"><div class="searchBox" style="font-size: 1.3em; justify-content: center; text-align: center;">Add to Favourite</div></div>';
        } else {
            htmlContent += '<div class="searchArea"><div class="searchBox" style="font-size: 1.3em; justify-content: center; text-align: center;">Share</div></div>';
        }
        htmlContent += '</div>';

        htmlContent += '<div class="moduleContentListBox" id="contentarchiveListBox">';
        for (let index in contents) {
            const content = contents[index];

            htmlContent += '<div id="shareArchiveContentNameArea">';
            htmlContent += '<div style="margin: auto">';
            if (content.toLowerCase().includes('.pdf')) {
                htmlContent += '<img class="moduleImage" style="width: 40px;" src="./img/icon_pdf.png" onerror="this.onerror=null;this.src=\'./img/noimage.jpg\';" />';
            } else if (content.toLowerCase().includes('.mp4')) {
                htmlContent += '<img class="moduleImage" style="width: 40px;" src="./img/icon_video.png" onerror="this.onerror=null;this.src=\'./img/noimage.jpg\';" />';
            } else if (content.toLowerCase().includes('.doc')) {
                htmlContent += '<img class="moduleImage" style="width: 40px;" src="./img/icon_word.png" onerror="this.onerror=null;this.src=\'./img/noimage.jpg\';" />';
            } else if (content.toLowerCase().includes('.ppt')) {
                htmlContent += '<img class="moduleImage" style="width: 40px;" src="./img/icon_ppt.png" onerror="this.onerror=null;this.src=\'./img/noimage.jpg\';" />';
            } else if (content.toLowerCase().includes('.xls')) {
                htmlContent += '<img class="moduleImage" style="width: 40px;" src="./img/icon_excel.png" onerror="this.onerror=null;this.src=\'./img/noimage.jpg\';" />';
            } else if (content.toLowerCase().includes('.png') || content.toLowerCase().includes('.jpg') || content.toLowerCase().includes('.jpeg') || content.toLowerCase().includes('.bmp')) {
                htmlContent += '<img class="moduleImage" style="width: 40px;" src="./img/icon_img.png" onerror="this.onerror=null;this.src=\'./img/noimage.jpg\';" />';
            }
            htmlContent += '</div>';
            htmlContent += '<div class="moduleDescriptionClass" style="font-size: 1.1em; font-weight: bold; color: var(--primary-blue); word-break: break-word; overflow-wrap: break-word; white-space: normal;">' + content.split('__')[1] + '</div>';
            htmlContent += '</div>';
        }
        htmlContent += '</div>';

        htmlContent += '<div style="width: 100%; padding: 10px;">'; // Starting of form
        htmlContent += '<input type="text" id="contentNoteTextArea" placeholder="Add Note" style="width: 100%; border-radius: 25px; border: 1px solid rgb(200, 200, 200); padding: 10px; margin: 5px 0;">';

        if (archiveOrShare === 'ARCHIVE') {
            htmlContent += '<div class="footerMenuBtnAreaStyle">';
            htmlContent += '<div style="width: 100%; text-align:center; margin-top: 20px;"><div class="moduleButton" onclick="saveArchiveData()" style="background-color: var(--secondary-blue); color: var(--primary-white); padding: 5px;"><span class="material-symbols-outlined" style="font-size: 30px;">library_add</span></div></div>';
            htmlContent += '</div>';
            htmlContent += '</div>'; // closing form
            htmlContent += '</div></div>';
            $('#archiveShareSection').html(htmlContent);

        } else {
            // SHARE FLOW with new server call logic
            const data = { token: shared.mCustomerDetailsJSON.token };
            const url = constructUrl("/api/getusers");

            buildRequestOptions(url, "GET", data)
                .then(req => Http.request(req))
                .then(res => {
                    console.log("[displayShareArchiveAdd] Raw response:", res);

                    if (isValidResponse(res, "getusers") && res.data) {
                        let userIdAndNames;
                        try {
                            userIdAndNames = typeof res.data === "string"
                                ? JSON.parse(res.data)
                                : res.data;
                        } catch (e) {
                            console.warn("[displayShareArchiveAdd] Parsing failed, using raw response data.");
                            userIdAndNames = res.data;
                        }

                        if (userIdAndNames && userIdAndNames.error !== "invalid_token") {
                            htmlContent += '<input id="userSelect" class="formvalue" list="userlist" >';
                            htmlContent += '<div class="selectDiv">';
                            htmlContent += '<datalist id="userlist" class="selectBox" onChange="getSelectedOptions(this)" style="width: 100%; border-radius: 25px; border: 1px solid rgb(200, 200, 200); padding: 10px; margin: 5px 0; background-color: white;">';
                            htmlContent += '<option value="" id="option_0-0">Select Users</option>';

                            for (const user of userIdAndNames) {
                                htmlContent += '<option value="' + user.id + '-' + user.firstName + '" id="option_' + user.id + '-' + user.firstName + '">' + user.firstName + ' ' + user.lastName + '</option>';
                            }
                            htmlContent += '</datalist>';
                            htmlContent += '</div>';

                            htmlContent += '<div id="tagbtns" class="contentUserBtnArea"></div>';
                            htmlContent += '<input type="hidden" id="taglist"></input>';
                            htmlContent += '</div>'; // closing form

                            htmlContent += '<div class="footerMenuBtnAreaStyle">';
                            htmlContent += '<div style="width: 100%; text-align:center; margin-top: 20px;"><div class="moduleButton" onclick="saveShareData()" style="background-color: var(--secondary-blue); color: var(--primary-white); padding: 5px;"><span class="material-symbols-outlined" style="font-size: 30px;">share</span></div></div>';
                            htmlContent += '</div>';

                            htmlContent += '</div></div>';
                            $('#archiveShareSection').html(htmlContent);

                        } else {
                            console.warn("[displayShareArchiveAdd] Token expired, regenerating...");
                            getNewToken("displayShareArchiveAdd('" + archiveOrShare + "')");
                        }
                    }
                })
                .catch(error => {
                    console.error("[displayShareArchiveAdd] Request failed:", error);
                    htmlContent += '</div>';
                    htmlContent += '</div></div>';
                    htmlContent += '<div class="moduleDescriptionClass">Could not get users for sharing!</div>';
                    $('#archiveShareSection').html(htmlContent);
                    apiRequestFailed(error, "getusers");
                });
        }
    } catch (error) {
        console.error("[displayShareArchiveAdd] General error:", error);
    }
}



// async function saveArchiveData() {
//     try {
//         console.log("[saveArchiveData] Start");

//         const contents = selectedContents;
//         const note = document.getElementById("contentNoteTextArea").value;

//         if (!contents || contents.length === 0) {
//             console.warn("[saveArchiveData] No contents selected. Aborting.");
//             return;
//         }

//         const data = {
//             token: shared.mCustomerDetailsJSON.token,
//             contents: contents.toString(),
//             note: note
//         };
//         const url = constructUrl("/api/savecontentarchives");

//         // Build request options
//         const requestOptions = await buildRequestOptions(url, "GET", data);

//         if (!requestOptions) {
//             console.warn("[saveArchiveData] Request aborted due to missing requestOptions.");
//             return;
//         }

//         // Send API request via Capacitor HTTP
//         const response = await Http.request(requestOptions);

//         console.log("[saveArchiveData] Raw response:", response);

//         // Validate response
//         if (isValidResponse(response, "savecontentarchives") && response.data) {
//             let jqXHR;

//             try {
//                 jqXHR = typeof response.data === "string"
//                     ? JSON.parse(response.data)
//                     : response.data;
//             } catch (e) {
//                 console.warn("[saveArchiveData] Parsing failed, using raw response data.");
//                 jqXHR = response.data;
//             }

//             if (jqXHR) {
//                 if (jqXHR.error !== "invalid_token") {
//                     // ✅ Success
//                     showDialog("Data saved to Archive", "closeShareArchiveAdd('viewArchivedRecordList')");
//                     console.log("[saveArchiveData] Archive saved successfully.");
//                 } else {
//                     // ❌ Token expired
//                     console.warn("[saveArchiveData] Token expired, regenerating...");
//                     getNewToken("saveArchiveData()");
//                 }
//             }
//         }
//     } catch (error) {
//         console.error("[saveArchiveData] Request failed:", error);
//         apiRequestFailed(error, "savecontentarchives");
//     }
// }

function saveArchiveData() {
    try {
        console.log("[saveArchiveData] Start");

        const contents = selectedContents;
        const note = document.getElementById("contentNoteTextArea").value;

        if (!contents || contents.length === 0) {
            console.warn("[saveArchiveData] No contents selected. Aborting.");
            return;
        }

        const data = {
            token: shared.mCustomerDetailsJSON.token,
            contents: contents.toString(),
            note: note
        };
        const url = constructUrl("/api/savecontentarchives");

        // ✅ Newer server call logic
        buildRequestOptions(url, "GET", data)
            .then(req => Http.request(req))
            .then(response => {
                console.log("[saveArchiveData] Raw response:", response);

                if (isValidResponse(response, "savecontentarchives") && response.data) {
                    let jqXHR;

                    try {
                        jqXHR = typeof response.data === "string"
                            ? JSON.parse(response.data)
                            : response.data;
                    } catch (e) {
                        console.warn("[saveArchiveData] Parsing failed, using raw response data.");
                        jqXHR = response.data;
                    }

                    if (jqXHR) {
                        if (jqXHR.error !== "invalid_token") {
                            // ✅ Success
                            showDialog("Data saved to Archive", "closeShareArchiveAdd('viewArchivedRecordList')");
                            console.log("[saveArchiveData] Archive saved successfully.");
                        } else {
                            // ❌ Token expired
                            console.warn("[saveArchiveData] Token expired, regenerating...");
                            getNewToken("saveArchiveData()");
                        }
                    }
                }
            })
            .catch(error => {
                console.error("[saveArchiveData] Request failed:", error);
                apiRequestFailed(error, "savecontentarchives");
            });
    } catch (error) {
        console.error("[saveArchiveData] Unexpected failure:", error);
    }
}



// async function saveShareData() {
//     try {
//         console.log("[saveShareData] Start");

//         const contents = selectedContents;
//         const note = document.getElementById("contentNoteTextArea").value;
//         const users = document.getElementById("taglist").value.replace('-', '__');

//         if (!contents || contents.length === 0) {
//             console.warn("[saveShareData] No contents selected. Aborting.");
//             return;
//         }

//         const data = {
//             token: shared.mCustomerDetailsJSON.token,
//             contents: contents.toString(),
//             users: users,
//             note: note
//         };
//         const url = constructUrl("/api/savecontentshares");

//         // Build request options
//         const requestOptions = await buildRequestOptions(url, "GET", data);

//         if (!requestOptions) {
//             console.warn("[saveShareData] Request aborted due to missing requestOptions.");
//             return;
//         }

//         // Send API request via Capacitor HTTP
//         const response = await Http.request(requestOptions);

//         console.log("[saveShareData] Raw response:", response);

//         // Validate response
//         if (isValidResponse(response, "savecontentshares") && response.data) {
//             let jqXHR;

//             try {
//                 jqXHR = typeof response.data === "string"
//                     ? JSON.parse(response.data)
//                     : response.data;
//             } catch (e) {
//                 console.warn("[saveShareData] Parsing failed, using raw response data.");
//                 jqXHR = response.data;
//             }

//             if (jqXHR) {
//                 if (jqXHR.error !== "invalid_token") {
//                     // ✅ Success
//                     showDialog("Data shared with users", "closeShareArchiveAdd('viewSharedRecordList')");
//                     selectedContents = [];
//                     $(".contentCheckbox").prop('checked', false);
//                     console.log("[saveShareData] Share saved successfully.");
//                 } else {
//                     // ❌ Token expired
//                     console.warn("[saveShareData] Token expired, regenerating...");
//                     getNewToken("saveShareData()");
//                 }
//             }
//         }
//     } catch (error) {
//         console.error("[saveShareData] Request failed:", error);
//         apiRequestFailed(error, "savecontentshares");
//     }
// }

function saveShareData() {
    try {
        console.log("[saveShareData] Start");

        const contents = selectedContents;
        const note = document.getElementById("contentNoteTextArea").value;
        const users = document.getElementById("taglist").value.replace('-', '__');

        if (!contents || contents.length === 0) {
            console.warn("[saveShareData] No contents selected. Aborting.");
            return;
        }

        const data = {
            token: shared.mCustomerDetailsJSON.token,
            contents: contents.toString(),
            users: users,
            note: note
        };
        const url = constructUrl("/api/savecontentshares");

        // ✅ Newer server call logic
        buildRequestOptions(url, "GET", data)
            .then(req => Http.request(req))
            .then(response => {
                console.log("[saveShareData] Raw response:", response);

                if (isValidResponse(response, "savecontentshares") && response.data) {
                    let jqXHR;

                    try {
                        jqXHR = typeof response.data === "string"
                            ? JSON.parse(response.data)
                            : response.data;
                    } catch (e) {
                        console.warn("[saveShareData] Parsing failed, using raw response data.");
                        jqXHR = response.data;
                    }

                    if (jqXHR) {
                        if (jqXHR.error !== "invalid_token") {
                            // ✅ Success
                            showDialog("Data shared with users", "closeShareArchiveAdd('viewSharedRecordList')");
                            selectedContents = [];
                            $(".contentCheckbox").prop('checked', false);
                            console.log("[saveShareData] Share saved successfully.");
                        } else {
                            // ❌ Token expired
                            console.warn("[saveShareData] Token expired, regenerating...");
                            getNewToken("saveShareData()");
                        }
                    }
                }
            })
            .catch(error => {
                console.error("[saveShareData] Request failed:", error);
                apiRequestFailed(error, "savecontentshares");
            });
    } catch (error) {
        console.error("[saveShareData] Unexpected failure:", error);
    }
}


function viewContentFullScreenImage() {
	$('#footerSection').hide();
	$('#contentImageArea').hide();
	$('#fullScreenContentImageArea').show();
}
function closeContentFullScreenImage() {
	$('#footerSection').show();
	$('#contentImageArea').show();
	$('#fullScreenContentImageArea').hide();
	//var emageElem
	//$(myElement).hammer().off("tap.anotherNamespace");
}



function deleteSharedContent() {
    showConfirmDialog({
        message: "Delete is not reversible. Are you sure?",
        yesLabel: "Delete",
        noLabel: "Cancel",
        onYes: () => {
            console.log("🗑 Calling deleteContentRecord...");
            deleteContentRecord(selectedContents, "/api/deletecontentshares");
        },
        onNo: () => {
            console.log("❌ Cancel pressed — dialog closed");
            // nothing else required, dialog auto-closes
        }
    });
}

function deleteArchivedContent() {
    showConfirmDialog({
        message: "Delete is not reversible. Are you sure?",
        yesLabel: "Delete",
        noLabel: "Cancel",
        onYes: () => {
            console.log("🗑 Calling deleteContentRecord for archives...");
            deleteContentRecord(selectedContents, "/api/deletecontentarchives");
        },
        onNo: () => {
            console.log("❌ Cancel pressed — dialog closed");
            // No extra action needed, dialog auto-hides
        }
    });
}



// async function deleteContentRecord(contents, url) {
//     try {
//         console.log("[deleteContentRecord] Start with contents:", contents, "url:", url);

//         // Step 1: Collect selected content IDs
//         const selectedContentIds = [];
//         for (let sel of contents) {
//             selectedContentIds.push(parseInt(sel));
//         }

//         if (!contents || contents.length === 0) {
//             console.warn("[deleteContentRecord] No contents selected. Aborting.");
//             return;
//         }

//         // Step 2: Prepare request data
//         const data = {
//             token: shared.mCustomerDetailsJSON.token,
//             deleteIdList: selectedContentIds.toString()
//         };

//         const apiName = url.includes("archive") ? "archiveDelete" : "shareDelete";
//         const requestUrl = constructUrl(url);

//         // Step 3: Build request options
//         const requestOptions = await buildRequestOptions(requestUrl, "GET", data);

//         if (!requestOptions) {
//             console.warn("[deleteContentRecord] Request aborted due to missing requestOptions.");
//             return;
//         }

//         // Step 4: Send request via Capacitor HTTP
//         const response = await Http.request(requestOptions);

//         console.log("[deleteContentRecord] Raw response:", response);

//         // Step 5: Validate response
//         if (isValidResponse(response, apiName) && response.data) {
//             let jqXHR;

//             try {
//                 jqXHR = typeof response.data === "string"
//                     ? JSON.parse(response.data)
//                     : response.data;
//             } catch (e) {
//                 console.warn("[deleteContentRecord] Parsing failed, using raw response data.");
//                 jqXHR = response.data;
//             }

//             if (jqXHR) {
//                 if (jqXHR.error !== "invalid_token") {
//                     //  Token valid, proceed
//                     selectedContents = [];

//                     if (url.includes("archive")) {
//                         console.log("[deleteContentRecord] Archive delete success, refreshing archived list.");
//                         viewArchivedRecordList();
//                     } else {
//                         console.log("[deleteContentRecord] Shared delete success, refreshing shared list.");
//                         viewSharedRecordList();
//                     }

//                 } else {
//                     //  Token expired
//                     console.warn("[deleteContentRecord] Token expired, regenerating...");
//                     getNewToken(`deleteContentRecord(${JSON.stringify(contents)}, '${url}')`);
//                 }
//             }
//         }
//     } catch (error) {
//         console.error("[deleteContentRecord] Request failed:", error);
//         apiRequestFailed(error, url);
//     }
// }

function deleteContentRecord(contents, url) {
    try {
        console.log("[deleteContentRecord] Start with contents:", contents, "url:", url);

        // Step 1: Collect selected content IDs
        const selectedContentIds = [];
        for (let sel of contents) {
            selectedContentIds.push(parseInt(sel));
        }

        if (!contents || contents.length === 0) {
            console.warn("[deleteContentRecord] No contents selected. Aborting.");
            return;
        }

        // Step 2: Prepare request data
        const data = {
            token: shared.mCustomerDetailsJSON.token,
            deleteIdList: selectedContentIds.toString()
        };

        const apiName = url.includes("archive") ? "archiveDelete" : "shareDelete";
        const requestUrl = constructUrl(url);

        // ✅ Step 3 & 4: Newer server call logic
        buildRequestOptions(requestUrl, "GET", data)
            .then(req => Http.request(req))
            .then(response => {
                console.log("[deleteContentRecord] Raw response:", response);

                // Step 5: Validate response
                if (isValidResponse(response, apiName) && response.data) {
                    let jqXHR;

                    try {
                        jqXHR = typeof response.data === "string"
                            ? JSON.parse(response.data)
                            : response.data;
                    } catch (e) {
                        console.warn("[deleteContentRecord] Parsing failed, using raw response data.");
                        jqXHR = response.data;
                    }

                    if (jqXHR) {
                        if (jqXHR.error !== "invalid_token") {
                            // ✅ Token valid, proceed
                            selectedContents = [];

                            if (url.includes("archive")) {
                                console.log("[deleteContentRecord] Archive delete success, refreshing archived list.");
                                viewArchivedRecordList();
                            } else {
                                console.log("[deleteContentRecord] Shared delete success, refreshing shared list.");
                                viewSharedRecordList();
                            }
                        } else {
                            // ❌ Token expired
                            console.warn("[deleteContentRecord] Token expired, regenerating...");
                            getNewToken(`deleteContentRecord(${JSON.stringify(contents)}, '${url}')`);
                        }
                    }
                }
            })
            .catch(error => {
                console.error("[deleteContentRecord] Request failed:", error);
                apiRequestFailed(error, url);
            });
    } catch (error) {
        console.error("[deleteContentRecord] Unexpected failure:", error);
    }
}



var tagList = [];

function getSelectedOptions(that) {
	for (option of that.options) {
		if(option.selected) {
			if(option.value.length > 0) {
				tagList.push(option.value);
			}
		}
	}
	showTags();
	$(that).val("");
}

function showTags() {
	var htmlStr = "";
	var tagStr = "";
	var index = 0;
	if(tagList.length > 0) {
		for(tag of tagList) {
			//htmlStr += that.options[count].value;
			htmlStr += '<div class="tagBtn" id="tagBtn_'+tag+'">';
			htmlStr += '<div class="tagBtnText">'+tag+'</div>';
			htmlStr += '<span id="tagBtnClose_'+tag+'" onclick="removeTag(this)"><i class="fas fa-times"></i></span>';
			htmlStr += '</div>';
			$("#option_"+tag).prop("disabled", true);
			
			if(index > 0) {
				tagStr += ",";
			}
			tagStr += tag;
			index++;
			if(index == tagList.length) {
				$("#tagbtns").html(htmlStr);
				$("#taglist").val(tagStr);
			}
		}
	} else {
		$("#tagbtns").html(htmlStr);
		$("#taglist").val(tagStr);
	}
}

function removeTag(that) {
	var tagValue = that.id.split('_')[1];
	
	for(index in tagList) {
		if(tagList[index] == tagValue) {
			tagList.splice(index, 1);
			$("#option_"+tagValue).prop("disabled", false);
		}
	}
	showTags();
}

function loadTags() {
	var tagStr = $("#taglist").val();
	if(tagStr.length > 0) {
		tagList = tagStr.split(',');
	}
	showTags();
}

function clearSelectionAndShowmodulesListArea() {
	selectedContents = [];
	//$(".contentCheckbox").prop('checked', false);
	showmodulesListArea();
}

function clearSelectionAndShowContentArea() {
	selectedContents = [];
	pauseVideos();
	showContentArea();
}

function showmodulesListArea() {
	pauseVideos();
	shared.currentState = shared.currentSourceState;
	$('#modulesMenuArea').show();
	$('#modulesListArea').show();
	$('#modulesDisplayArea').hide();
	$('#content_searchbox').show();
}

function showmodulesMenuArea() {
	shared.currentState = "displayContentMenu";
	$('#modulesMenuArea').show();
	$('#modulesListArea').show();
	$('#modulesDisplayArea').hide();
	$('#content_searchbox').show();
	disableAllFooterBtns();
}

function showContentArea() {
	$('#modulesMenuArea').hide();
	$('#modulesListArea').hide();
	$('#modulesDisplayArea').show();
	$('#content_searchbox').hide();
	disableAllFooterBtns();
}




function closeShareArchiveAdd(callback = '') {
	$('#archiveShareSection').hide();
	if(callback == 'viewArchivedRecordList') {
		viewArchivedRecordList();
	} else if(callback == 'viewSharedRecordList') {
		viewSharedRecordList();
	} 
}

export function backContentHandle() {
	if(shared.currentState == "displayContent") {
		showmodulesListArea();
	} else if(shared.currentState == "departmentContent"){
		getContentDepartments();
	} else if(shared.currentState == "locationContent"){
		getContentLocations();
	} else if(shared.currentState == "categoryContent"){
		getContentCategorys();
	} else {
		shared.currentState = "";
		exitContent();
	}
}


// async function viewContent(content, destinid) {
//     var path = content.contentUrl.trim();
//     let headerId = destinid.split('_')[0] + 'ModuleHeader';

//     var htmlContent = '';

//     htmlContent += '<div id="' + headerId + '">';
//     htmlContent += '<div class="moduleNameArea" style="background-color: var(--primary-white);">';
//     if (content.previewImage != undefined && content.previewImage != null && content.previewImage.startsWith('http')) {
//         const noImagePath = Capacitor.convertFileSrc('img/noimage.jpg');
//         htmlContent += '<div class="moduleImageClass"><img id="contentPreviewIcon" class="moduleImage" data-imgurl="' + content.previewImage + '" src="' + noImagePath + '" onerror="this.onerror=null;this.src=\'' + noImagePath + '\';"></div>';
//         htmlContent += '<div class="moduleTextClass">';
//     } else {
//         htmlContent += '<div class="moduleTextClass" style="width: 100%;">';
//     }
//     htmlContent += '<div style="display: flex; justify-content: space-between; align-items: center;">';
//     htmlContent += '<div class="moduleDescriptionClass" style="font-size: 1.1em; font-weight: bold; color: var(--primary-blue); word-break: break-word; overflow-wrap: break-word; white-space: normal;">' + content.title + '</div>';

//     htmlContent += '<div style="display: flex;">';
//     let contentIdName = content.id + '__' + content.title;
//     let archiveExists = false;
//     if (archiveIds != null) {
//         archiveExists = archiveIds.some(archive => archive.id === content.id);
//     }
//     if (!archiveExists) {
//         htmlContent += '<div class="listBoxActionButton" onclick="archiveNow(\'' + contentIdName + '\')" style="background-color: transparent;"><span class="material-symbols-outlined" style="font-size: 25px;">library_add</span></div>';
//     }
//     htmlContent += '<div class="listBoxActionButton" onclick="shareNow(\'' + contentIdName + '\')" style="background-color: transparent;"><span class="material-symbols-outlined" style="font-size: 25px;">share</span></div>';
//     htmlContent += '</div>';

//     htmlContent += '</div>';

//     htmlContent += '<div class="moduleDescriptionClass">' + content.description + '</div>';
//     htmlContent += '</div>';

//     htmlContent += '</div>';
//     htmlContent += '</div>';

//     htmlContent += '<div id="contentPlayerArea" style="overflow: hidden; position: relative;"><div id="contentPlayer" style="padding-bottom: 20px; height:100%;"></div></div>';
//     $('#' + destinid).html(htmlContent);
//     fixModuleHeight("modulesModuleHeader, " + headerId + ", footerSection", 20, "contentPlayerArea");

//     htmlContent = '';

//     if (path.startsWith("<") && path.endsWith(">")) {
//         $('#contentPlayer').html(path);

//         if (path.includes('class="weatherwidget-io"') || path.includes("class='weatherwidget-io'")) {
//             if (window.__weatherwidget_init) {
//                 window.__weatherwidget_init();
//             } else {
//                 const script = document.createElement('script');
//                 script.id = 'weatherwidget-io-js';
//                 script.src = 'https://weatherwidget.io/js/widget.min.js';
//                 document.head.appendChild(script);
//             }
//         }

//     } else if (path.includes('youtu')) {
//         var contUrl = path;
//         if (!contUrl.includes("embed")) {
//             var contArr = contUrl.split("/");
//             var contId = contArr[contArr.length - 1];
//             contUrl = "https://www.youtube.com/embed/" + contId;
//         }
//         htmlContent += '<div class="preview-container"><iframe id="player_content_' + content.id + '" width=100% height=100% src="' + contUrl + '?autoplay=1&controls=1&showinfo=0&loop=1&enablejsapi=1" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div>';
//         $("#contentPlayer").html(htmlContent);

//     } else if (path.includes("google")) {
//         if (!path.includes("embed")) {
//             var contArr = path.split("/");
//             var contId = contArr[5];
//             path = "https://docs.google.com/presentation/d/" + contId + "/embed?start=true&loop=true&delayms=5000&rm=minimal";
//         }
//         htmlContent += '<iframe src="' + path + '" frameborder="0" width="100%" height="100%" allowfullscreen="true" mozallowfullscreen="true" webkitallowfullscreen="true"></iframe>';
//         $('#contentPlayer').html(htmlContent);

//         } else {
//         if (path.includes('.pdf')) {
//             if (path.startsWith(s3PrivateUrl)) {
//                 var objectKey = path.replace(s3PrivateUrl, "");
//                 getSignedUrl(objectKey, 20).then(url => {
//                     if (url.startsWith("https://")) {
//                         console.log(url);
//                         url = encodeURIComponent(url);

//                         htmlContent += '<iframe id="pdfViewerWindow" width="100%" height="100%" frameborder="0" fullscreen slideOnTouch allowfullscreen webkitallowfullscreen></iframe>';
//                         $('#contentPlayer').html(htmlContent);

//                         var pdfElem = document.getElementById("pdfViewerWindow");

//                         // ✅ Capacitor requires convertFileSrc
//                         const viewerPath = Capacitor.convertFileSrc("pdfjs/web/viewer.html");
//                         pdfElem.src = viewerPath + "?file=" + url;

//                     } else if (url == "file_not_found") {
//                         showDialog("This file is expired or deleted!");
//                     }
//                 });
//             } else {
//                 let url = encodeURIComponent(path);

//                 htmlContent += '<iframe id="pdfViewerWindow" width="100%" height="100%" frameborder="0" fullscreen slideOnTouch allowfullscreen webkitallowfullscreen></iframe>';
//                 $('#contentPlayer').html(htmlContent);

//                 var pdfElem = document.getElementById("pdfViewerWindow");

//                 // ✅ Same fix for static PDFs
//                 const viewerPath = Capacitor.convertFileSrc("pdfjs/viewer.html");
//                 pdfElem.src = viewerPath + "?file=" + url;
//             }
//         }
//              else if (path.includes('.mp4')) {
//             if (path.startsWith(s3PrivateUrl)) {
//                 var objectKey = path.replace(s3PrivateUrl, "");
//                 getSignedUrl(objectKey, 300).then(url => {
//                     if (url.startsWith("https://")) {
//                         htmlContent += '<video id="qrContentVideo" controlsList="nodownload noremoteplayback" controls autoplay muted style="width: 100%;"><source src="' + url + '" type="video/mp4"></video>';
//                         $('#contentPlayer').html(htmlContent);
//                         document.getElementById("qrContentVideo").play();
//                     } else if (url == "file_not_found") {
//                         showDialog("This file is expired or deleted!");
//                     }
//                 });
//             } else {
//                 htmlContent += '<video id="qrContentVideo" controlsList="nodownload noremoteplayback" controls autoplay muted style="width: 100%;"><source src="' + path + '" type="video/mp4"></video>';
//                 $('#contentPlayer').html(htmlContent);
//                 document.getElementById("qrContentVideo").play();
//             }

//         } else if (path.includes('.doc') || path.includes('.ppt') || path.includes('.xls')) {
//             if (path.startsWith(s3PrivateUrl)) {
//                 var objectKey = path.replace(s3PrivateUrl, "");
//                 getSignedUrl(objectKey, 300).then(url => {
//                     if (url.startsWith("https://")) {
//                         const encodedUrl = encodeURIComponent(url);
//                         const viewerUrl = `https://view.officeapps.live.com/op/embed.aspx?src=${encodedUrl}`;
//                         htmlContent += '<iframe src="' + viewerUrl + '" frameborder="0" width="100%" height="100%" allowfullscreen></iframe>';
//                         $('#contentPlayer').html(htmlContent);
//                     } else if (url == "file_not_found") {
//                         showDialog("This file is expired or deleted!");
//                     }
//                 });
//             } else {
//                 const encodedUrl = encodeURIComponent(path);
//                 const viewerUrl = `https://view.officeapps.live.com/op/embed.aspx?src=${encodedUrl}`;
//                 htmlContent += '<iframe src="' + viewerUrl + '" frameborder="0" width="100%" height="100%" allowfullscreen></iframe>';
//                 $('#contentPlayer').html(htmlContent);
//             }

//         } else if (path.match(/\.(png|jpg|jpeg|bmp)$/i)) {
//             if (path.startsWith(s3PrivateUrl)) {
//                 var objectKey = path.replace(s3PrivateUrl, "");
//                 getSignedUrl(objectKey, 10).then(url => {
//                     if (url.startsWith("https://")) {
//                         htmlContent += '<div class="zoomableImage" id="contentImageArea" style="position: relative;">';
//                         htmlContent += '<img id="contentContentImage_' + content.id + '" style="width: 100%; max-height: 100%; object-fit: contain;" src="' + url + '" onerror="this.onerror=null;this.src=\'' + Capacitor.convertFileSrc('img/noimage.jpg') + '\';" />';
//                         htmlContent += '<button class="fullscreenBtn" id="enterImageFullscreenBtn" title="Fullscreen" onclick="viewContentFullScreenImage()">⛶</button>';
//                         htmlContent += '</div>';

//                         htmlContent += '<div class="fullScreenImage" id="fullScreenContentImageArea">';
//                         htmlContent += '<img id="contentContentFullScreenImage_' + content.id + '" style="width: 100%; max-height: 100%; object-fit: contain;" src="' + url + '" />';
//                         htmlContent += '<button class="exitFullscreenBtn" id="exitImageFullscreenBtn" title="Exit Fullscreen" onclick="closeContentFullScreenImage()">✕</button>';
//                         htmlContent += '</div>';

//                         $('#contentPlayer').html(htmlContent);
//                         let imageElem = document.getElementById('contentContentImage_' + content.id);
//                         imageElem.onload = function () {
//                             initPinchZoom('contentContentImage_' + content.id);
//                             initPinchZoom('contentContentFullScreenImage_' + content.id);
//                         }
//                     } else if (url == "file_not_found") {
//                         showDialog("This file is expired or deleted!");
//                     }
//                 });
//             } else {
//                 htmlContent += '<div class="zoomableImage" id="contentImageArea">';
//                 htmlContent += '<img id="contentContentImage_' + content.id + '" style="width: 100%; max-height: 100%; object-fit: contain;" src="' + path + '" />';
//                 htmlContent += '<button class="fullscreenBtn" id="enterImageFullscreenBtn" title="Fullscreen" onclick="viewContentFullScreenImage()">⛶</button>';
//                 htmlContent += '</div>';

//                 htmlContent += '<div class="fullScreenImage" id="fullScreenContentImageArea">';
//                 htmlContent += '<img id="contentContentFullScreenImage_' + content.id + '" style="width: 100%; max-height: 100%; object-fit: contain;" src="' + path + '" />';
//                 htmlContent += '<button class="exitFullscreenBtn" id="exitImageFullscreenBtn" title="Exit Fullscreen" onclick="closeContentFullScreenImage()">✕</button>';
//                 htmlContent += '</div>';

//                 $('#contentPlayer').html(htmlContent);
//                 let imageElem = document.getElementById('contentContentImage_' + content.id);
//                 imageElem.onload = function () {
//                     initPinchZoom('contentContentImage_' + content.id);
//                     initPinchZoom('contentContentFullScreenImage_' + content.id);
//                 }
//             }

//         } else {
//             htmlContent += '<div class="moduleDescriptionClass" style="font-size: 1.1em; font-weight: bold; color: var(--secondary-orange); padding: 5px"> Could not identify content type!</div>';
//             $('#contentPlayer').html(htmlContent);
//         }
//     }
// }

export async function viewContent(content, destinid) { 
    var path = content.contentUrl.trim();
    let headerId = destinid.split('_')[0] + 'ModuleHeader';

    var htmlContent = '';

    htmlContent += '<div id="' + headerId + '">';
    htmlContent += '<div class="moduleNameArea" style="background-color: var(--primary-white);">';
    if (content.previewImage != undefined && content.previewImage != null && content.previewImage.startsWith('http')) {
        const noImagePath = Capacitor.convertFileSrc('img/noimage.jpg');
        htmlContent += '<div class="moduleImageClass"><img id="contentPreviewIcon" class="moduleImage" data-imgurl="' + content.previewImage + '" src="' + noImagePath + '" onerror="this.onerror=null;this.src=\'' + noImagePath + '\';"></div>';
        htmlContent += '<div class="moduleTextClass">';
    } else {
        htmlContent += '<div class="moduleTextClass" style="width: 100%;">';
    }
    htmlContent += '<div style="display: flex; justify-content: space-between; align-items: center;">';
    htmlContent += '<div class="moduleDescriptionClass" style="font-size: 1.1em; font-weight: bold; color: var(--primary-blue); word-break: break-word; overflow-wrap: break-word; white-space: normal;">' + content.title + '</div>';

    htmlContent += '<div style="display: flex;">';
    let contentIdName = content.id + '__' + content.title;
    let archiveExists = false;
    if (archiveIds != null) {
        archiveExists = archiveIds.some(archive => archive.id === content.id);
    }
    if (!archiveExists) {
        htmlContent += '<div class="listBoxActionButton" onclick="archiveNow(\'' + contentIdName + '\')" style="background-color: transparent;"><span class="material-symbols-outlined" style="font-size: 25px;">library_add</span></div>';
    }
    htmlContent += '<div class="listBoxActionButton" onclick="shareNow(\'' + contentIdName + '\')" style="background-color: transparent;"><span class="material-symbols-outlined" style="font-size: 25px;">share</span></div>';
    htmlContent += '</div>';

    htmlContent += '</div>';

    htmlContent += '<div class="moduleDescriptionClass">' + content.description + '</div>';
    htmlContent += '</div>';

    htmlContent += '</div>';
    htmlContent += '</div>';

    htmlContent += '<div id="contentPlayerArea" style="overflow: hidden; position: relative;"><div id="contentPlayer" style="padding-bottom: 20px; height:100%;"></div></div>';
    $('#' + destinid).html(htmlContent);
    fixModuleHeight("modulesModuleHeader, " + headerId + ", footerSection", 20, "contentPlayerArea");

    htmlContent = '';

    if (path.startsWith("<") && path.endsWith(">")) {
        $('#contentPlayer').html(path);

        if (path.includes('class="weatherwidget-io"') || path.includes("class='weatherwidget-io'")) {
            if (window.__weatherwidget_init) {
                window.__weatherwidget_init();
            } else {
                const script = document.createElement('script');
                script.id = 'weatherwidget-io-js';
                script.src = 'https://weatherwidget.io/js/widget.min.js';
                document.head.appendChild(script);
            }
        }

    } else if (path.includes('youtu')) {
        var contUrl = path;
        if (!contUrl.includes("embed")) {
            var contArr = contUrl.split("/");
            var contId = contArr[contArr.length - 1];
            contUrl = "https://www.youtube.com/embed/" + contId;
        }
        htmlContent += '<div class="preview-container"><iframe id="player_content_' + content.id + '" width=100% height=100% src="' + contUrl + '?autoplay=1&controls=1&showinfo=0&loop=1&enablejsapi=1" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div>';
        $("#contentPlayer").html(htmlContent);

    } else if (path.includes("google")) {
        if (!path.includes("embed")) {
            var contArr = path.split("/");
            var contId = contArr[5];
            path = "https://docs.google.com/presentation/d/" + contId + "/embed?start=true&loop=true&delayms=5000&rm=minimal";
        }
        htmlContent += '<iframe src="' + path + '" frameborder="0" width="100%" height="100%" allowfullscreen="true" mozallowfullscreen="true" webkitallowfullscreen="true"></iframe>';
        $('#contentPlayer').html(htmlContent);

    } else {
              if (path.includes(".pdf")) {
   

    if (path.startsWith(s3PrivateUrl)) {
        const objectKey = path.replace(s3PrivateUrl, "");

        getSignedUrl(objectKey, 20).then((url) => {
            if (url && url.startsWith("https://")) {
                console.log( "working" +url);
                const encodedUrl = encodeURIComponent(url);
                // pdfElem.src = `./pdfjs/web/viewer.html?file=${encodedUrl}`;
                viewPdfFile(url, 'contentPlayer');
            } else if (url === "file_not_found") {
                showDialog("This file is expired or deleted!");
            }
        });
    } else {
        const encodedUrl = encodeURIComponent(path);
        // pdfElem.src = `./pdfjs/web/viewer.html?file=${encodedUrl}`;
        viewPdfFile(url, 'contentPlayer');
    }
}


        else if (path.includes('.mp4')) {
            if (path.startsWith(s3PrivateUrl)) {
                var objectKey = path.replace(s3PrivateUrl, "");
                getSignedUrl(objectKey, 300).then(url => {
                    if (url.startsWith("https://")) {
                        htmlContent += '<video id="qrContentVideo" controlsList="nodownload noremoteplayback" controls autoplay muted style="width: 100%;"><source src="' + url + '" type="video/mp4"></video>';
                        $('#contentPlayer').html(htmlContent);
                        document.getElementById("qrContentVideo").play();
                    } else if (url == "file_not_found") {
                        showDialog("This file is expired or deleted!");
                    }
                });
            } else {
                htmlContent += '<video id="qrContentVideo" controlsList="nodownload noremoteplayback" controls autoplay muted style="width: 100%;"><source src="' + path + '" type="video/mp4"></video>';
                $('#contentPlayer').html(htmlContent);
                document.getElementById("qrContentVideo").play();
            }

        } else if (path.includes('.doc') || path.includes('.ppt') || path.includes('.xls')) {
            if (path.startsWith(s3PrivateUrl)) {
                var objectKey = path.replace(s3PrivateUrl, "");
                getSignedUrl(objectKey, 300).then(url => {
                    if (url.startsWith("https://")) {
                        const encodedUrl = encodeURIComponent(url);
                        const viewerUrl = `https://view.officeapps.live.com/op/embed.aspx?src=${encodedUrl}`;
                        htmlContent += '<iframe src="' + viewerUrl + '" frameborder="0" width="100%" height="100%" allowfullscreen></iframe>';
                        $('#contentPlayer').html(htmlContent);
                    } else if (url == "file_not_found") {
                        showDialog("This file is expired or deleted!");
                    }
                });
            } else {
                const encodedUrl = encodeURIComponent(path);
                const viewerUrl = `https://view.officeapps.live.com/op/embed.aspx?src=${encodedUrl}`;
                htmlContent += '<iframe src="' + viewerUrl + '" frameborder="0" width="100%" height="100%" allowfullscreen></iframe>';
                $('#contentPlayer').html(htmlContent);
            }

        } else if (path.match(/\.(png|jpg|jpeg|bmp)$/i)) {
            if (path.startsWith(s3PrivateUrl)) {
                var objectKey = path.replace(s3PrivateUrl, "");
                getSignedUrl(objectKey, 10).then(url => {
                    if (url.startsWith("https://")) {
                        htmlContent += '<div class="zoomableImage" id="contentImageArea" style="position: relative;">';
                        htmlContent += '<img id="contentContentImage_' + content.id + '" style="width: 100%; max-height: 100%; object-fit: contain;" src="' + url + '" onerror="this.onerror=null;this.src=\'' + Capacitor.convertFileSrc('img/noimage.jpg') + '\';" />';
                        htmlContent += '<button class="fullscreenBtn" id="enterImageFullscreenBtn" title="Fullscreen" onclick="viewContentFullScreenImage()">⛶</button>';
                        htmlContent += '</div>';

                        htmlContent += '<div class="fullScreenImage" id="fullScreenContentImageArea">';
                        htmlContent += '<img id="contentContentFullScreenImage_' + content.id + '" style="width: 100%; max-height: 100%; object-fit: contain;" src="' + url + '" />';
                        htmlContent += '<button class="exitFullscreenBtn" id="exitImageFullscreenBtn" title="Exit Fullscreen" onclick="closeContentFullScreenImage()">✕</button>';
                        htmlContent += '</div>';

                        $('#contentPlayer').html(htmlContent);
                        let imageElem = document.getElementById('contentContentImage_' + content.id);
                        imageElem.onload = function () {
                            initPinchZoom('contentContentImage_' + content.id);
                            initPinchZoom('contentContentFullScreenImage_' + content.id);
                        }
                    } else if (url == "file_not_found") {
                        showDialog("This file is expired or deleted!");
                    }
                });
            } else {
                htmlContent += '<div class="zoomableImage" id="contentImageArea">';
                htmlContent += '<img id="contentContentImage_' + content.id + '" style="width: 100%; max-height: 100%; object-fit: contain;" src="' + path + '" />';
                htmlContent += '<button class="fullscreenBtn" id="enterImageFullscreenBtn" title="Fullscreen" onclick="viewContentFullScreenImage()">⛶</button>';
                htmlContent += '</div>';

                htmlContent += '<div class="fullScreenImage" id="fullScreenContentImageArea">';
                htmlContent += '<img id="contentContentFullScreenImage_' + content.id + '" style="width: 100%; max-height: 100%; object-fit: contain;" src="' + path + '" />';
                htmlContent += '<button class="exitFullscreenBtn" id="exitImageFullscreenBtn" title="Exit Fullscreen" onclick="closeContentFullScreenImage()">✕</button>';
                htmlContent += '</div>';

                $('#contentPlayer').html(htmlContent);
                let imageElem = document.getElementById('contentContentImage_' + content.id);
                imageElem.onload = function () {
                    initPinchZoom('contentContentImage_' + content.id);
                    initPinchZoom('contentContentFullScreenImage_' + content.id);
                }
            }

        } else {
            htmlContent += '<div class="moduleDescriptionClass" style="font-size: 1.1em; font-weight: bold; color: var(--secondary-orange); padding: 5px"> Could not identify content type!</div>';
            $('#contentPlayer').html(htmlContent);
        }
    }
}




window.viewContentModule = viewContentModule;
window.getAllContents = getAllContents;
window.searchContent = searchContent;
window.viewArchivedRecordList = viewArchivedRecordList;
window.viewSharedRecordList = viewSharedRecordList;
window.getContentDepartments = getContentDepartments;
window.getContentLocations = getContentLocations;
window.getContentCategorys = getContentCategorys;
window.searchContentDepartmentLocationCategory = searchContentDepartmentLocationCategory;
window.getContentsAtDepartmentLocationCategory = getContentsAtDepartmentLocationCategory;
window.getContentTypesAtSelected = getContentTypesAtSelected;
window.getContentAtListIndex = getContentAtListIndex;
window.getContentsAtSelected = getContentsAtSelected;
window.archiveNow = archiveNow;
window.shareNow = shareNow;
window.displayContentAtIndex = displayContentAtIndex;
window.viewContent = viewContent;
window.closeContent = closeContent;
window.loadContentFooterButtons = loadContentFooterButtons;
window.saveArchiveData = saveArchiveData;
window.saveShareData = saveShareData;
window.clearSelectionAndShowmodulesListArea = clearSelectionAndShowmodulesListArea;
window.clearSelectionAndShowContentArea = clearSelectionAndShowContentArea;
window.showmodulesMenuArea = showmodulesMenuArea;
window.backContentHandle = backContentHandle;
window.getSelectedOptions = getSelectedOptions;
window.deleteArchiveNow = deleteArchiveNow;
window.deleteShareNow = deleteShareNow;
window.viewContentFullScreenImage = viewContentFullScreenImage;
window.closeContentFullScreenImage = closeContentFullScreenImage;
window.closeShareArchiveAdd = closeShareArchiveAdd;
window.exitModules = exitModules;
