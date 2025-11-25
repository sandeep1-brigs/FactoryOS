import { Filesystem, Directory, Encoding } from "@capacitor/filesystem"
import { Capacitor } from '@capacitor/core';
import { Device } from "@capacitor/device"
import { Http } from '@capacitor-community/http';
import { Network } from '@capacitor/network';
import { App } from '@capacitor/app';
import $ from 'jquery';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';


import { shared , s3PrivateUrl , s3PublicUrl  } from "./globals.js";
import { displaySection , showConfirmDialog , buildRequestOptions , isValidResponse , RequestOptions  } from "./capacitor-welcome.js";
import { showDialog , highlightHeaderTabMenu , fixModuleHeight , constructUrl , getSignedUrl , pauseVideos , initPinchZoom , getGeoPosition , updateAppRuntime} from "./utility.js";
import { getMenuBar ,getNewToken } from "./settings.js";
import { exitModules , viewContent } from "./content.js";
import { createList } from "./list.js";
import { apiRequestFailed } from "./auth.js";
import { viewPdfFile } from "./pdfviewer.js";
import { getStyleAttributeInStyles } from "./ert.js";


let searchType ="";
let selectedName ="";
let selectedId = 0;
var assetmateAssetInfo = null;
var assetmateFormTemplate = null;
var assetmateData = null;
var unsavedData = false;
//var assetmateassetList = null;
var listItems = [];
var archiveIds = null;
var assetmateContents = [];
var formTemplate = null;
var currentAssetData = null;
var overWrite = false;
const dayInMs = 86400000;

/*************************************************** ASSETMATE ********************************************** */
function viewAssetmate(task = "asset") {
	shared.currentRunningApp = 'assetMate';
	unsavedData = false;
	if (shared.mCustomerDetailsJSON != null) {
		$('#moduleTitle').html("ASSETS");
		updateAppRuntime("assetMate", "on", "ok");
		displaySection('modulesSection', 'flex', false, true);

		displayAssetmateMenu();
		$('#modulesMenuArea').show();
		$('#modulesListArea').show();
		$('#modulesDisplayArea').hide();
		
		if(task == "audit") {
			let btn = document.getElementById("btnId_get_audits");
			setTimeout(function() {
				btn.click();
			}, 200);
		} else {
			let btn = document.getElementById("btnId_get_allassets");
			setTimeout(function() {
				btn.click();
			}, 200);
		}
	} else { 		
		showDialog("You need to login to access this resource!", "viewLogin('menuProcess')");
	}
}


/****************************************************************************************************
 Function: displayAssetmateMenu
 Purpose: Displays Assetmate Menu screen
****************************************************************************************************/

function displayAssetmateMenu() {

	var htmlContent = "";
	var assetmateScreenSource = shared.cmsJSON.cmsJSONdata.assetmateScreen;

	$.each(assetmateScreenSource.sectionList, function(key, section) {
		if (section.content.length) {
			htmlContent += section.content;
			
		} else if(section.sectionStyle) {
			htmlContent += '<div style="' + section.content + '">';

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

			htmlContent += '<div class="searchArea"><div class="searchBox" id="assetmate_searchbox"></div></div>';

			htmlContent += '</div>';
		}
	});
	$("#modulesMenuArea").html(htmlContent);
}

function closeAssetmate() {
    showConfirmDialog({
        message: "Exit AssetMate?",
        yesLabel: "Exit",
        noLabel: "Cancel",
        onYes: () => {
            console.log("✅ User confirmed exit from AssetMate");
            exitAssetmate();
        },
        onNo: () => {
            console.log("❌ User cancelled exit from AssetMate");
            // Dialog auto-hides
        }
    });
}

function exitAssetmate() {
	assetmateAssetInfo = null;
	assetmateFormTemplate = null;
	assetmateData = null;
	listItems = [];
	formTemplate = null;
	currentAssetData = null;
	overWrite = false;
	unsavedData = false;
	exitModules();
}

function getAllAssets() {
	//assetmateSearchStr = "";
	searchType = "asset";
	$('#assetmate_searchbox').html('<input type="search" class="searchInput" id="assetmate_'+searchType+'_search_input" placeholder="Search '+searchType+'" /><button class="searchBtn" id="assetmate_'+searchType+'_searchbtn" onclick="searchAssetmateasset()"><span class="material-symbols-outlined" style="font-size: 30px; padding: 5px 0;">search</span></button>');
	searchAssetmateasset();
}

function getAssetAtListIndex(index) {
	if(listItems != null && index < listItems.length) {
		handleAssetQrCode(listItems[index].codeId, 0);
	}
}

function getAssetmateLocations() {
	shared.currentState = "assetmateLocations";
	shared.currentSourceState = "assetmateLocations";
	//$("#location_search_input").val("");
	searchType = "location";
	$('#assetmate_searchbox').html('<input type="search" class="searchInput" id="assetmate_'+searchType+'_search_input" placeholder="Search '+searchType+'" /><button class="searchBtn" id="assetmate_'+searchType+'_searchbtn" onclick="searchAssetmateDepartmentLocationCategory()"><span class="material-symbols-outlined" style="font-size: 30px; padding: 5px 0;">search</span></button>');
	searchAssetmateDepartmentLocationCategory();
}
function getAssetmateDepartments() {
	shared.currentState = "assetmateDepartments";
	shared.currentSourceState = "assetmateDepartments";
	//$("#department_search_input").val("");
	searchType = "department";
	$('#assetmate_searchbox').html('<input type="search" class="searchInput" id="assetmate_'+searchType+'_search_input" placeholder="Search '+searchType+'" /><button class="searchBtn" id="assetmate_'+searchType+'_searchbtn" onclick="searchAssetmateDepartmentLocationCategory()"><span class="material-symbols-outlined" style="font-size: 30px; padding: 5px 0;">search</span></button>');
	searchAssetmateDepartmentLocationCategory();
}
function getAssetmateCategorys() {
	shared.currentState = "assetmateCategorys";
	shared.currentSourceState = "assetmateCategorys";
	//$("#category_search_input").val("");
	searchType = "category";
	$('#assetmate_searchbox').html('<input type="search" class="searchInput" id="assetmate_'+searchType+'_search_input" placeholder="Search '+searchType+'" /><button class="searchBtn" id="assetmate_'+searchType+'_searchbtn" onclick="searchAssetmateDepartmentLocationCategory()"><span class="material-symbols-outlined" style="font-size: 30px; padding: 5px 0;">search</span></button>');
	searchAssetmateDepartmentLocationCategory();
}

// async function searchAssetmateDepartmentLocationCategory(pageNumber = 1, pageSize = 50) {
//     let type = searchType;
//     highlightHeaderTabMenu("menuBtn", "btnId_view_asset" + type + "s");

//     let searchStr = $("#assetmate_" + type + "_search_input").val();
//     if (searchStr == null) { searchStr = ""; }
//     $('#modulesMenuArea').show();
//     $('#modulesListArea').show();
//     $('#modulesDisplayArea').hide();
//     fixModuleHeight("modulesModuleHeader, modulesMenuArea, footerSection", 20, "modulesListArea");

//     const data = { "token": shared.mCustomerDetailsJSON.token, "searchStr": searchStr, "page": pageNumber, "size": pageSize };
//     const urlPath = "/" + type + "s/search" + type + "spaginated";
//     const url = constructUrl(urlPath);

//     try {
//         // Build request options (will encode GET params as needed)
//         const requestOptions = await buildRequestOptions(url, "GET", data);
//         if (!requestOptions) {
//             console.warn("[searchAssetmateDepartmentLocationCategory] Request aborted: buildRequestOptions returned null.");
//             return;
//         }

//         const response = await Http.request(requestOptions);
//         console.log("[searchAssetmateDepartmentLocationCategory] Raw response:", response);

//         if (isValidResponse(response, "search" + type + "spaginated") && response.data) {
//             let items;
//             try {
//                 items = typeof response.data === "string"
//                     ? JSON.parse(response.data)
//                     : response.data;
//             } catch (e) {
//                 console.warn("[searchAssetmateDepartmentLocationCategory] Parsing failed, using raw response data.");
//                 items = response.data;
//             }

//             if (items && items.error != "invalid_token") { // Check if the token is still valid
//                 var htmlContent = '';
//                 htmlContent += '<div class="searchArea"><div class="searchBox" style="font-size: 1.3em; justify-content: center; text-align: center;">' + type.toUpperCase() + 'S (' + items.totalElements + ')</div></div>';

//                 if (items != null && items.content != null && items.content.length > 0) {
//                     listItems = [];
//                     for (var index in items.content) {
//                         let item = items.content[index];

//                         let description = '<div>' + item.description + '</div><div>Assets: ' + item.assetCount + '</div>';
//                         let image = '';
//                         if (item.image != undefined && item.image != null && item.image.length > 0) {
//                             image = item.image;
//                         } else {
//                             if (type == "asset") {
//                                 image = '<span class="material-symbols-outlined ticketStyleMaterializeIcon">box</span>';
//                             } else if (type == "department") {
//                                 image = '<img id="adlc_list_image_' + index + '" style="padding: 0 25%; width: 100%; object-fit: contain;" src="./img/icon_department.png" >';
//                             } else if (type == "location") {
//                                 image = '<img id="adlc_list_image_' + index + '" style="padding: 0 25%; width: 100%; object-fit: contain;" src="./img/icon_location.png" >';
//                             } else if (type == "category") {
//                                 image = '<img id="adlc_list_image_' + index + '" style="padding: 0 25%; width: 100%; object-fit: contain;" src="./img/icon_category.png" >';
//                             }
//                         }

//                         let itemJson = {
//                             "id": item.id,
//                             "image": image,
//                             "title": item.name,
//                             "description": description,
//                             "clickAction": "getAssetsAtSelected('" + item.id + "','" + item.name + "')"
//                         };
//                         listItems.push(itemJson);

//                         if (index == items.content.length - 1) {
//                             createList("department", htmlContent, listItems, items.pageable, items.totalPages, "modulesListBox", "getAssetAtListIndex", "searchAssetmateDepartmentLocationCategory", "ticketStyle");
//                         }
//                     }
//                 } else {
//                     htmlContent += '<div class="formlabel">No ' + type + 's found</div>';
//                     $('#modulesListBox').html(htmlContent);
//                 }
//             } else { // Token expired
//                 // Regenerate token and callback
//                 getNewToken("searchAssetmateDepartmentLocationCategory(" + type + ")");
//             }
//         }
//     } catch (err) {
//         apiRequestFailed(err, "search" + type + "spaginated");
//     }
// }

function searchAssetmateDepartmentLocationCategory(pageNumber = 1, pageSize = 50) {
    let type = searchType;
    highlightHeaderTabMenu("menuBtn", "btnId_view_asset" + type + "s");

    let searchStr = $("#assetmate_" + type + "_search_input").val();
    if (searchStr == null) { searchStr = ""; }
    $('#modulesMenuArea').show();
    $('#modulesListArea').show();
    $('#modulesDisplayArea').hide();
    fixModuleHeight("modulesModuleHeader, modulesMenuArea, footerSection", 20, "modulesListArea");

    const data = { "token": shared.mCustomerDetailsJSON.token, "searchStr": searchStr, "page": pageNumber, "size": pageSize };
    const urlPath = "/" + type + "s/search" + type + "spaginated";
    const url = constructUrl(urlPath);

   
    buildRequestOptions(url, "GET", data).then(requestOptions => {
        Http.request(requestOptions).then(response => {
            console.log("[searchAssetmateDepartmentLocationCategory] Raw response:", response);

            if (isValidResponse(response, "search" + type + "spaginated") && response.data) {
                let items;
                try {
                    items = typeof response.data === "string"
                        ? JSON.parse(response.data)
                        : response.data;
                } catch (e) {
                    console.warn("[searchAssetmateDepartmentLocationCategory] Parsing failed, using raw response data.");
                    items = response.data;
                }

                if (items && items.error != "invalid_token") { 
                    var htmlContent = '';
                    htmlContent += '<div class="searchArea"><div class="searchBox" style="font-size: 1.3em; justify-content: center; text-align: center;">' + type.toUpperCase() + 'S (' + items.totalElements + ')</div></div>';

                    if (items != null && items.content != null && items.content.length > 0) {
                        listItems = [];
                        for (var index in items.content) {
                            let item = items.content[index];

                            let description = '<div>' + item.description + '</div><div>Assets: ' + item.assetCount + '</div>';
                            let image = '';
                            if (item.image != undefined && item.image != null && item.image.length > 0) {
                                image = item.image;
                            } else {
                                if (type == "asset") {
                                    image = '<span class="material-symbols-outlined ticketStyleMaterializeIcon">box</span>';
                                } else if (type == "department") {
                                    image = '<img id="adlc_list_image_' + index + '" style="padding: 0 25%; width: 100%; object-fit: contain;" src="./img/icon_department.png" >';
                                } else if (type == "location") {
                                    image = '<img id="adlc_list_image_' + index + '" style="padding: 0 25%; width: 100%; object-fit: contain;" src="./img/icon_location.png" >';
                                } else if (type == "category") {
                                    image = '<img id="adlc_list_image_' + index + '" style="padding: 0 25%; width: 100%; object-fit: contain;" src="./img/icon_category.png" >';
                                }
                            }

                            let itemJson = {
                                "id": item.id,
                                "image": image,
                                "title": item.name,
                                "description": description,
                                "clickAction": "getAssetsAtSelected('" + item.id + "','" + item.name + "')"
                            };
                            listItems.push(itemJson);

                            if (index == items.content.length - 1) {
                                createList("department", htmlContent, listItems, items.pageable, items.totalPages, "modulesListBox", "getAssetAtListIndex", "searchAssetmateDepartmentLocationCategory", "ticketStyle");
                            }
                        }
                    } else {
                        htmlContent += '<div class="formlabel">No ' + type + 's found</div>';
                        $('#modulesListBox').html(htmlContent);
                    }
                } else { 
                    // Token expired
                    getNewToken("searchAssetmateDepartmentLocationCategory(" + type + ")");
                }
            }
        }).catch(err => apiRequestFailed(err, "search" + type + "spaginated"));
    }).catch(err => {
        console.warn("[searchAssetmateDepartmentLocationCategory] Request aborted: buildRequestOptions failed.", err);
    });
}


function getAssetsAtSelected(id, name) {
	selectedId = id;
	selectedName = name;
	getAssetsAtDepartmentLocationCategory();
}

// async function getAssetsAtDepartmentLocationCategory(pageNumber = 1, pageSize = 50) {
//     $('#modulesMenuArea').show();
//     $('#modulesListArea').show();
//     $('#modulesDisplayArea').hide();
//     $('#assetmate_searchbox').html('');

//     let type = searchType;
//     let id = selectedId;
//     let name = selectedName;
//     shared.currentState = type + "Assetmateasset";
//     shared.currentSourceState = shared.currentState;

//     const urlPath = "/assetmateassets/getassetmateassetsat" + type + "paginated";
//     const url = constructUrl(urlPath);

//     let data = {};
//     if (type === "department") {
//         data = { "token": shared.mCustomerDetailsJSON.token, "departmentId": id, "page": pageNumber, "size": pageSize };
//     } else if (type === "location") {
//         data = { "token": shared.mCustomerDetailsJSON.token, "locationId": id, "page": pageNumber, "size": pageSize };
//     } else if (type === "category") {
//         data = { "token": shared.mCustomerDetailsJSON.token, "categoryId": id, "page": pageNumber, "size": pageSize };
//     }

//     try {
//         const requestOptions = await buildRequestOptions(url, "GET", data);
//         if (!requestOptions) {
//             console.warn("[getAssetsAtDepartmentLocationCategory] Request aborted: no requestOptions");
//             return;
//         }

//         const response = await Http.request(requestOptions);
//         console.log("[getAssetsAtDepartmentLocationCategory] Raw response:", response);

//         if (isValidResponse(response, urlPath) && response.data) {
//             let items;
//             try {
//                 items = typeof response.data === "string" ? JSON.parse(response.data) : response.data;
//             } catch (e) {
//                 console.warn("[getAssetsAtDepartmentLocationCategory] Parsing failed, using raw response");
//                 items = response.data;
//             }

//             if (items && items.error !== "invalid_token") {
//                 let htmlContent = '';
//                 htmlContent += '<div class="searchArea"><div class="searchBox" style="font-size: 1.3em; justify-content: center; text-align: center;">'
//                              + type.toUpperCase() + ': ' + name.toUpperCase() + '  (' + items.totalElements + ')</div></div>';

//                 if (items.content && items.content.length > 0) {
//                     listItems = [];
//                     for (let index in items.content) {
//                         let item = items.content[index];

//                         let description = '<div>' + item.description + '</div><div>' + item.codeId + '</div>';
//                         let image = '';
//                         if (item.image && item.image.length > 0) {
//                             image = item.image;
//                         } else {
//                             image = '<span class="material-symbols-outlined ticketStyleMaterializeIcon">box</span>';
//                         }

//                         let itemJson = {
//                             "id": item.id,
//                             "image": image,
//                             "title": item.assetName,
//                             "description": description,
//                             "clickAction": "handleAssetQrCode('" + item.codeId + "', 0)"
//                         };
//                         listItems.push(itemJson);

//                         if (index == items.content.length - 1) {
//                             createList("asset", htmlContent, listItems, items.pageable, items.totalPages, "modulesListBox", "getAssetAtListIndex", "getAssetsAtDepartmentLocationCategory", "ticketStyle");
//                         }
//                     }
//                 } else {
//                     htmlContent += '<div class="formlabel">No Assets found</div>';
//                     $('#modulesListBox').html(htmlContent);
//                 }
//             } else {
//                 // Token expired
//                 getNewToken("getAssetsAtDepartmentLocationCategory()");
//             }
//         }
//     } catch (err) {
//         apiRequestFailed(err, urlPath);
//     }
// }

// async function getAssetsAtDepartmentLocationCategory(pageNumber = 1, pageSize = 50) {
//     $('#modulesMenuArea').show();
//     $('#modulesListArea').show();
//     $('#modulesDisplayArea').hide();
//     $('#assetmate_searchbox').html('');

//     let type = searchType;
//     let id = selectedId;
//     let name = selectedName;
//     currentState = type + "Assetmateasset";
//     currentSourceState = currentState;

//     let urlPath = "/assetmateassets/getassetmateassetsat" + type + "paginated";
//     let data = {};

//     if (type == "department") {
//         data = { "token": mCustomerDetailsJSON.token, "departmentId": id, "page": pageNumber, "size": pageSize };
//     } else if (type == "location") {
//         data = { "token": mCustomerDetailsJSON.token, "locationId": id, "page": pageNumber, "size": pageSize };
//     } else if (type == "category") {
//         data = { "token": mCustomerDetailsJSON.token, "categoryId": id, "page": pageNumber, "size": pageSize };
//     }

//     const url = constructUrl(urlPath);

//     try {
//         // Build request options
//         const requestOptions = await buildRequestOptions(url, "GET", data);
//         if (!requestOptions) {
//             console.warn("[getAssetsAtDepartmentLocationCategory] Request aborted: requestOptions missing.");
//             return;
//         }

//         // Send API request
//         const response = await Http.request(requestOptions);
//         console.log("[getAssetsAtDepartmentLocationCategory] Raw response:", response);

//         if (isValidResponse(response, urlPath) && response.data) {
//             let items;
//             try {
//                 items = typeof response.data === "string" ? JSON.parse(response.data) : response.data;
//             } catch (e) {
//                 console.warn("[getAssetsAtDepartmentLocationCategory] Parsing failed, using raw data.");
//                 items = response.data;
//             }

//             if (items && items.error != "invalid_token") { // Valid token
//                 let htmlContent = '';
//                 htmlContent += '<div class="searchArea"><div class="searchBox" style="font-size: 1.3em; justify-content: center; text-align: center;">'
//                     + type.toUpperCase() + ': ' + name.toUpperCase() + '  (' + items.totalElements + ')</div></div>';

//                 if (items != null && items.content != null && items.content.length > 0) {
//                     listItems = [];
//                     for (var index in items.content) {
//                         let item = items.content[index];

//                         let description = '<div>' + item.description + '</div><div>' + item.codeId + '</div>';
//                         let image = '';
//                         if (item.image != undefined && item.image != null && item.image.length > 0) {
//                             image = item.image;
//                         } else {
//                             image = '<span class="material-symbols-outlined ticketStyleMaterializeIcon">box</span>';
//                         }

//                         let itemJson = {
//                             "id": item.id,
//                             "image": image,
//                             "title": item.assetName,
//                             "description": description,
//                             "clickAction": "handleAssetQrCode('" + item.codeId + "', 0)"
//                         };
//                         listItems.push(itemJson);

//                         if (index == items.content.length - 1) {
//                             createList("asset", htmlContent, listItems, items.pageable, items.totalPages,
//                                 "modulesListBox", "getAssetAtListIndex", "getAssetsAtDepartmentLocationCategory", "ticketStyle");
//                         }
//                     }
//                 } else {
//                     htmlContent += '<div class="formlabel">No Assets found</div>';
//                     $('#modulesListBox').html(htmlContent);
//                 }
//             } else {
//                 // Token expired
//                 getNewToken("getAssetsAtDepartment(" + type + ")");
//             }
//         }
//     } catch (err) {
//         apiRequestFailed(err, "getassetmateassetsat" + type + "paginated");
//     }
// }

function getAssetsAtDepartmentLocationCategory(pageNumber = 1, pageSize = 50) {
    $('#modulesMenuArea').show();
    $('#modulesListArea').show();
    $('#modulesDisplayArea').hide();
    $('#assetmate_searchbox').html('');

    let type = searchType;
    let id = selectedId;
    let name = selectedName;
    shared.currentState = type + "Assetmateasset";
    shared.currentSourceState = shared.currentState;

    const urlPath = "/assetmateassets/getassetmateassetsat" + type + "paginated";
    const url = constructUrl(urlPath);

    let data = {};
    if (type === "department") {
        data = { "token": shared.mCustomerDetailsJSON.token, "departmentId": id, "page": pageNumber, "size": pageSize };
    } else if (type === "location") {
        data = { "token": shared.mCustomerDetailsJSON.token, "locationId": id, "page": pageNumber, "size": pageSize };
    } else if (type === "category") {
        data = { "token": shared.mCustomerDetailsJSON.token, "categoryId": id, "page": pageNumber, "size": pageSize };
    }

    // Follow the same pattern as searchAssetmateDepartmentLocationCategory
    buildRequestOptions(url, "GET", data).then(requestOptions => {
        Http.request(requestOptions).then(response => {
            console.log("[getAssetsAtDepartmentLocationCategory] Raw response:", response);

            if (isValidResponse(response, urlPath) && response.data) {
                let items;
                try {
                    items = typeof response.data === "string" ? JSON.parse(response.data) : response.data;
                } catch (e) {
                    console.warn("[getAssetsAtDepartmentLocationCategory] Parsing failed, using raw response");
                    items = response.data;
                }

                if (items && items.error !== "invalid_token") {
                    let htmlContent = '';
                    htmlContent += '<div class="searchArea"><div class="searchBox" style="font-size: 1.3em; justify-content: center; text-align: center;">'
                                 + type.toUpperCase() + ': ' + name.toUpperCase() + '  (' + items.totalElements + ')</div></div>';

                    if (items.content && items.content.length > 0) {
                        listItems = [];
                        for (let index in items.content) {
                            let item = items.content[index];

                            let description = '<div>' + item.description + '</div><div>' + item.codeId + '</div>';
                            let image = '';
                            if (item.image && item.image.length > 0) {
                                image = item.image;
                            } else {
                                image = '<span class="material-symbols-outlined ticketStyleMaterializeIcon">box</span>';
                            }

                            let itemJson = {
                                "id": item.id,
                                "image": image,
                                "title": item.assetName,
                                "description": description,
                                "clickAction": "handleAssetQrCode('" + item.codeId + "', 0)"
                            };
                            listItems.push(itemJson);

                            if (index == items.content.length - 1) {
                                createList("asset", htmlContent, listItems, items.pageable, items.totalPages, "modulesListBox", "getAssetAtListIndex", "getAssetsAtDepartmentLocationCategory", "ticketStyle");
                            }
                        }
                    } else {
                        htmlContent += '<div class="formlabel">No Assets found</div>';
                        $('#modulesListBox').html(htmlContent);
                    }
                } else {
                    // Token expired
                    getNewToken("getAssetsAtDepartmentLocationCategory()");
                }
            }
        }).catch(err => apiRequestFailed(err, urlPath));
    }).catch(err => {
        console.warn("[getAssetsAtDepartmentLocationCategory] Request aborted: buildRequestOptions failed.", err);
    });
}


// async function searchAssetmateasset(pageNumber = 1, pageSize = 50) {
//     highlightHeaderTabMenu("menuBtn", "btnId_get_allassets");
//     $('#modulesMenuArea').show();
//     $('#modulesListArea').show();
//     $('#modulesDisplayArea').hide();
//     fixModuleHeight("modulesModuleHeader, modulesMenuArea, footerSection", 20, "modulesListArea");

//     shared.currentState = "searchAssetmateasset";
//     shared.currentSourceState = "searchAssetmateasset";

//     let searchStr = $("#assetmate_asset_search_input").val();
//     if (searchStr == null) { searchStr = ""; }

//     const data = { "token": shared.mCustomerDetailsJSON.token, "searchStr": searchStr, "page": pageNumber, "size": pageSize };
//     const urlPath = "/assetmateassets/searchassetmateassetpaginated";
//     const url = constructUrl(urlPath);

//     try {
//         // Build request options
//         const requestOptions = await buildRequestOptions(url, "GET", data);
//         if (!requestOptions) {
//             console.warn("[searchAssetmateasset] Request aborted: buildRequestOptions returned null.");
//             return;
//         }

//         // Make request using Capacitor Http
//         const response = await Http.request(requestOptions);
//         console.log("[searchAssetmateasset] Raw response:", response);

//         if (isValidResponse(response, "searchassetmateassetpaginated") && response.data) {
//             let items;
//             try {
//                 items = typeof response.data === "string"
//                     ? JSON.parse(response.data)
//                     : response.data;
//             } catch (e) {
//                 console.warn("[searchAssetmateasset] Parsing failed, using raw response data.");
//                 items = response.data;
//             }

//             if (items && items.error != "invalid_token") { // Token still valid
//                 var htmlContent = '';
//                 htmlContent += '<div class="searchArea"><div class="searchBox" style="font-size: 1.3em; justify-content: center; text-align: center;">ALL ASSETS (' + items.totalElements + ')</div></div>';

//                 if (items != null && items.content != null && items.content.length > 0) {
//                     listItems = [];
//                     for (var index in items.content) {
//                         let item = items.content[index];

//                         let description = '<div>' + item.description + '</div><div>' + item.codeId + '</div>';
//                         let image = '';
//                         if (item.image != undefined && item.image != null && item.image.length > 0) {
//                             image = item.image;
//                         } else {
//                             image = '<span class="material-symbols-outlined ticketStyleMaterializeIcon">box</span>';
//                         }

//                         let itemJson = {
//                             "id": item.id,
//                             "image": image,
//                             "title": item.assetName,
//                             "description": description,
//                             "clickAction": "handleAssetQrCode('" + item.codeId + "', 0)"
//                         };
//                         listItems.push(itemJson);

//                         if (index == items.content.length - 1) {
//                             createList("asset", htmlContent, listItems, items.pageable, items.totalPages, "modulesListBox", "getAssetAtListIndex", "searchAssetmateasset", "ticketStyle");
//                         }
//                     }
//                 } else {
//                     htmlContent += '<div class="formlabel">No Assets found</div>';
//                     $('#modulesListBox').html(htmlContent);
//                 }
//             } else { // Token expired
//                 getNewToken("searchAssetmateasset()");
//             }
//         }
//     } catch (err) {
//         apiRequestFailed(err, "searchassetmateassetpaginated");
//     }
// }

function searchAssetmateasset(pageNumber = 1, pageSize = 50) {
    highlightHeaderTabMenu("menuBtn", "btnId_get_allassets");
    $('#modulesMenuArea').show();
    $('#modulesListArea').show();
    $('#modulesDisplayArea').hide();
    fixModuleHeight("modulesModuleHeader, modulesMenuArea, footerSection", 20, "modulesListArea");

    shared.currentState = "searchAssetmateasset";
    shared.currentSourceState = "searchAssetmateasset";

    let searchStr = $("#assetmate_asset_search_input").val();
    if (searchStr == null) { searchStr = ""; }

    const data = { "token": shared.mCustomerDetailsJSON.token, "searchStr": searchStr, "page": pageNumber, "size": pageSize };
    const urlPath = "/assetmateassets/searchassetmateassetpaginated";
    const url = constructUrl(urlPath);

    // Follow the same pattern as searchAssetmateDepartmentLocationCategory
    buildRequestOptions(url, "GET", data).then(requestOptions => {
        Http.request(requestOptions).then(response => {
            console.log("[searchAssetmateasset] Raw response:", response);

            if (isValidResponse(response, "searchassetmateassetpaginated") && response.data) {
                let items;
                try {
                    items = typeof response.data === "string"
                        ? JSON.parse(response.data)
                        : response.data;
                } catch (e) {
                    console.warn("[searchAssetmateasset] Parsing failed, using raw response data.");
                    items = response.data;
                }

                if (items && items.error != "invalid_token") { // Token still valid
                    var htmlContent = '';
                    htmlContent += '<div class="searchArea"><div class="searchBox" style="font-size: 1.3em; justify-content: center; text-align: center;">ALL ASSETS (' + items.totalElements + ')</div></div>';

                    if (items != null && items.content != null && items.content.length > 0) {
                        listItems = [];
                        for (var index in items.content) {
                            let item = items.content[index];

                            let description = '<div>' + item.description + '</div><div>' + item.codeId + '</div>';
                            let image = '';
                            if (item.image != undefined && item.image != null && item.image.length > 0) {
                                image = item.image;
                            } else {
                                image = '<span class="material-symbols-outlined ticketStyleMaterializeIcon">box</span>';
                            }

                            let itemJson = {
                                "id": item.id,
                                "image": image,
                                "title": item.assetName,
                                "description": description,
                                "clickAction": "handleAssetQrCode('" + item.codeId + "', 0)"
                            };
                            listItems.push(itemJson);

                            if (index == items.content.length - 1) {
                                createList("asset", htmlContent, listItems, items.pageable, items.totalPages, "modulesListBox", "getAssetAtListIndex", "searchAssetmateasset", "ticketStyle");
                            }
                        }
                    } else {
                        htmlContent += '<div class="formlabel">No Assets found</div>';
                        $('#modulesListBox').html(htmlContent);
                    }
                } else { // Token expired
                    getNewToken("searchAssetmateasset()");
                }
            }
        }).catch(err => apiRequestFailed(err, "searchassetmateassetpaginated"));
    }).catch(err => {
        console.warn("[searchAssetmateasset] Request aborted: buildRequestOptions failed.", err);
    });
}


function getAudits() {
	highlightHeaderTabMenu("menuBtn", "btnId_get_audits");
	getMyAudits();
}

// async function getMyAudits(pageNumber = 1, pageSize = 50) {
//     $('#modulesMenuArea').show();
//     $('#modulesListArea').show();
//     $('#modulesDisplayArea').hide();
//     $('#assetmate_searchbox').html('');
//     fixModuleHeight("modulesModuleHeader, modulesMenuArea, footerSection", 20, "modulesListArea");

//     shared.currentState = "getAudits";

//     const data = { "token": shared.mCustomerDetailsJSON.token, "page": pageNumber, "size": pageSize };
//     const urlPath = "/assetmateschedules/getauditsforuserpaginated";
//     const url = constructUrl(urlPath);

//     try {
//         // Build request options
//         const requestOptions = await buildRequestOptions(url, "GET", data);
//         if (!requestOptions) {
//             console.warn("[getMyAudits] Request aborted: buildRequestOptions returned null.");
//             return;
//         }

//         // Make request using Capacitor Http
//         const response = await Http.request(requestOptions);
//         console.log("[getMyAudits] Raw response:", response);

//         if (isValidResponse(response, "getauditsforuserpaginated") && response.data) {
//             let items;
//             try {
//                 items = typeof response.data === "string"
//                     ? JSON.parse(response.data)
//                     : response.data;
//             } catch (e) {
//                 console.warn("[getMyAudits] Parsing failed, using raw response data.");
//                 items = response.data;
//             }

//             if (items && items.error != "invalid_token") { // Token still valid
//                 var htmlContent = '';
//                 htmlContent += '<div class="searchArea"><div class="searchBox" style="font-size: 1.3em; justify-content: center; text-align: center;">MY AUDITS (' + items.totalElements + ')</div></div>';

//                 if (items != null && items.content != null && items.content.length > 0) {
//                     listItems = [];
//                     for (var index in items.content) {
//                         let item = items.content[index];
//                         let title = item.amScheduleName;
//                         var dateStr = new Date(item.schedule).toDateString();

//                         let states = [];
//                         let actions = [];
//                         let activeActions = [];
//                         let nowTime = new Date().getTime();

//                         if (nowTime > item.schedule) {
//                             states = [{ "text": "Audit Pending", "type": "warningState" }];
//                             let actionItem = {
//                                 "text": "Audit Now",
//                                 "type": "button",
//                                 "actionClass": "activeActionWideBlue",
//                                 "act": "auditNow('" + item.codeId + "')"
//                             };
//                             actions.push(actionItem);
//                             activeActions.push({ "text": "Audit Now" });
//                         }

//                         if (nowTime > item.gracePeriod) {
//                             states = [{ "text": "Escalated", "type": "errorState" }];
//                             let actionItem = {
//                                 "text": "Reassign Audit",
//                                 "type": "button",
//                                 "actionClass": "activeActionWideOrange",
//                                 "act": "viewAssetAndReassign('" + item.id + "','" + item.codeId + "', 1)"
//                             };
//                             actions.push(actionItem);
//                             activeActions.push({ "text": "Reassign Audit" });
//                         }

//                         let description = '<div>' + item.assetName + ': ' + item.codeId + '</div><div>' + dateStr + ' (' + item.userFirstLastName + ')</div>';
//                         let image = '<span class="material-symbols-outlined ticketStyleMaterializeIcon">content_paste_search</span>';

//                         let itemJson = {
//                             "id": index,
//                             "image": image,
//                             "title": title,
//                             "description": description,
//                             "clickAction": "handleAssetQrCode('" + item.codeId + "', 1)",
//                             "states": states,
//                             "actions": actions,
//                             "activeActions": activeActions
//                         };
//                         listItems.push(itemJson);

//                         if (index == items.content.length - 1) {
//                             createList("audit", htmlContent, listItems, items.pageable, items.totalPages, "modulesListBox", "", "getMyAudits", "ticketStyle");
//                         }
//                     }
//                 } else {
//                     htmlContent += '<div class="formlabel">No audits found assigned to you!</div>';
//                     $('#modulesListBox').html(htmlContent);
//                 }
//             } else { // Token expired
//                 getNewToken("getAudits()");
//             }
//         }
//     } catch (err) {
//         apiRequestFailed(err, "getauditsforuserpaginated");
//     }
// }

function getMyAudits(pageNumber = 1, pageSize = 50) {
    $('#modulesMenuArea').show();
    $('#modulesListArea').show();
    $('#modulesDisplayArea').hide();
    $('#assetmate_searchbox').html('');
    fixModuleHeight("modulesModuleHeader, modulesMenuArea, footerSection", 20, "modulesListArea");

    shared.currentState = "getAudits";

    const data = { "token": shared.mCustomerDetailsJSON.token, "page": pageNumber, "size": pageSize };
    const urlPath = "/assetmateschedules/getauditsforuserpaginated";
    const url = constructUrl(urlPath);

    buildRequestOptions(url, "GET", data).then(requestOptions => {
        Http.request(requestOptions).then(response => {
            console.log("[getMyAudits] Raw response:", response);

            if (isValidResponse(response, "getauditsforuserpaginated") && response.data) {
                let items;
                try {
                    items = typeof response.data === "string"
                        ? JSON.parse(response.data)
                        : response.data;
                } catch (e) {
                    console.warn("[getMyAudits] Parsing failed, using raw response data.");
                    items = response.data;
                }

                if (items && items.error != "invalid_token") { // Token still valid
                    var htmlContent = '';
                    htmlContent += '<div class="searchArea"><div class="searchBox" style="font-size: 1.3em; justify-content: center; text-align: center;">MY AUDITS (' + items.totalElements + ')</div></div>';

                    if (items != null && items.content != null && items.content.length > 0) {
                        listItems = [];
                        for (var index in items.content) {
                            let item = items.content[index];
                            let title = item.amScheduleName;
                            var dateStr = new Date(item.schedule).toDateString();

                            let states = [];
                            let actions = [];
                            let activeActions = [];
                            let nowTime = new Date().getTime();

                            if (nowTime > item.schedule) {
                                states = [{ "text": "Audit Pending", "type": "warningState" }];
                                let actionItem = {
                                    "text": "Audit Now",
                                    "type": "button",
                                    "actionClass": "activeActionWideBlue",
                                    "act": "auditNow('" + item.codeId + "')"
                                };
                                actions.push(actionItem);
                                activeActions.push({ "text": "Audit Now" });
                            }

                            if (nowTime > item.gracePeriod) {
                                states = [{ "text": "Escalated", "type": "errorState" }];
                                let actionItem = {
                                    "text": "Reassign Audit",
                                    "type": "button",
                                    "actionClass": "activeActionWideOrange",
                                    "act": "viewAssetAndReassign('" + item.id + "','" + item.codeId + "', 1)"
                                };
                                actions.push(actionItem);
                                activeActions.push({ "text": "Reassign Audit" });
                            }

                            let description = '<div>' + item.assetName + ': ' + item.codeId + '</div><div>' + dateStr + ' (' + item.userFirstLastName + ')</div>';
                            let image = '<span class="material-symbols-outlined ticketStyleMaterializeIcon">content_paste_search</span>';

                            let itemJson = {
                                "id": index,
                                "image": image,
                                "title": title,
                                "description": description,
                                "clickAction": "handleAssetQrCode('" + item.codeId + "', 1)",
                                "states": states,
                                "actions": actions,
                                "activeActions": activeActions
                            };
                            listItems.push(itemJson);

                            if (index == items.content.length - 1) {
                                createList("audit", htmlContent, listItems, items.pageable, items.totalPages, "modulesListBox", "", "getMyAudits", "ticketStyle");
                            }
                        }
                    } else {
                        htmlContent += '<div class="formlabel">No audits found assigned to you!</div>';
                        $('#modulesListBox').html(htmlContent);
                    }
                } else { // Token expired
                    getNewToken("getAudits()");
                }
            }
        }).catch(err => apiRequestFailed(err, "getauditsforuserpaginated"));
    }).catch(err => {
        console.warn("[getMyAudits] Request aborted: buildRequestOptions failed.", err);
    });
}


/*************************************************** QR CODE ********************************************** */

async function openQRCodeScanner() {
    if (shared.mCustomerDetailsJSON != null) {
        shared.currentState = "scanAssetQrCode";
        shared.currentSourceState = shared.currentState;

        let displayOrientation = "portrait";
        if (window.screen.width > window.screen.height) {
            displayOrientation = "landscape";
        }
        shared.currentState = "viewScanner";

        try {
            // Request camera permission first
            const status = await BarcodeScanner.checkPermission({ force: true });
            if (!status.granted) {
                alert("Camera permission is required to scan QR codes.");
                return;
            }

            // Start scanning
            const result = await BarcodeScanner.startScan();

            console.log("We got a barcode\n" +
                "Result: " + result?.content + "\n" +
                "Cancelled: " + (result?.hasContent ? "false" : "true"));

            if (result.hasContent && result.content.length > 0) {
                try {
                    const qrData = JSON.parse(result.content);
                    handleAssetQrCode(qrData.code, 0);
                } catch (e) {
                    alert("Invalid QR Code format");
                }
            }

        } catch (error) {
            alert("Scanning failed: " + error);
        } finally {
            await BarcodeScanner.stopScan(); // Always stop scanner after use
        }
    } else {
        showDialog("You need to login to access this resource!", "viewLogin('menuProcess')");
    }
}

// async function handleAssetQrCode(codeId, tabIndex, callback = null, auditScheduleId = 0) {
//     if (!codeId) {
//         return;
//     }

//     const data = { "token": shared.mCustomerDetailsJSON.token, "codeId": codeId };
//     const urlPath = "/api/getassetmateasset";
//     const url = constructUrl(urlPath);

//     try {
//         // Build request options
//         console.log("starting ");
//         const requestOptions = await buildRequestOptions(url, "GET", data);
//         if (!requestOptions) {
//             console.warn("[handleAssetQrCode] Request aborted: buildRequestOptions returned null.");
//             return;
//         }

//         // Make request using Capacitor Http
//         const response = await Http.request(requestOptions);
//         console.log("[handleAssetQrCode] Raw response:", response);

//         if (isValidResponse(response, "getassetmateasset") && response.data) {
//             let assetmate;
//             try {
//                 assetmate = typeof response.data === "string"
//                     ? JSON.parse(response.data)
//                     : response.data;
//             } catch (e) {
//                 console.warn("[handleAssetQrCode] Parsing failed, using raw response data.");
//                 assetmate = response.data;
//             }

//             if (assetmate.error === undefined) { // Token still valid
//                 if (assetmate != null) {
//                     assetmateAssetInfo = assetmate;
//                 }

//                 displaySection('modulesSection', 'flex', false, true);
//                 $('#modulesMenuArea').hide();
//                 $('#modulesListArea').hide();
//                 $('#modulesDisplayArea').show();
//                 shared.currentState = "handleAssetQrCode";

//                 if (assetmateAssetInfo.assetmatedocumentList.length > 0) {
//                     viewAssetmateasset(tabIndex, callback, auditScheduleId, codeId);
//                 } else {
//                     // Show audit if there are no documents attached
//                     viewAssetmateasset(1, callback, auditScheduleId, codeId);
//                 }

//             } else { // Token expired or error
//                 if (assetmate.error === "invalid_token") {
//                     getNewToken("handleAssetQrCode('" + codeId + "'," + tabIndex + ")");
//                 } else {
//                     showDialog("ERROR! " + assetmate.error.toUpperCase().replaceAll("_", " "));
//                 }
//             }
//         }
//     } catch (err) {
//         apiRequestFailed(err, "getassetmateasset");
//     }
// }

// async function handleAssetQrCode(codeId, tabIndex, callback = null, auditScheduleId = 0) {
//     if (!codeId) {
//         console.warn("[handleAssetQrCode] No codeId provided. Exiting.");
//         return;
//     }

//     const data = {
//         token: shared.mCustomerDetailsJSON.token,
//         codeId: codeId
//     };

//     const url = constructUrl("/api/getassetmateasset");

//     try {
//         // Build request options
//         const requestOptions = await buildRequestOptions(url, "GET", data);
//         if (!requestOptions) {
//             console.warn("[handleAssetQrCode] Request aborted: buildRequestOptions returned null.");
//             return;
//         }
//         console.log("[handleAssetQrCode] Request options:", requestOptions);

//         // Make HTTP request using Capacitor Http
//         const response = await Http.request(requestOptions);
//         console.log("[handleAssetQrCode] Raw response:", response);

//         // Validate response structure
//         if (!response || typeof response.status !== "number") {
//             console.error("[handleAssetQrCode] Invalid HTTP response:", response);
//             return;
//         }

//         console.log(`[handleAssetQrCode] API Status: ${response.status}`);

//         if (isValidResponse(response, "getassetmateasset") && response.data) {
//             let assetmate;

//             try {
//                 assetmate = typeof response.data === "string" ? JSON.parse(response.data) : response.data;
//             } catch (e) {
//                 console.warn("[handleAssetQrCode] JSON parsing failed, using raw data.");
//                 assetmate = response.data;
//             }

//             // Check for token errors or other API errors
//             if (assetmate.error === undefined) {
//                 if (assetmate) assetmateAssetInfo = assetmate;

//                 // Display relevant sections
//                 displaySection('modulesSection', 'flex', false, true);
//                 $('#modulesMenuArea').hide();
//                 $('#modulesListArea').hide();
//                 $('#modulesDisplayArea').show();
//                 shared.currentState = "handleAssetQrCode";

//                 // Decide which tab to open
//                 const tabToOpen = (assetmateAssetInfo.assetmatedocumentList?.length > 0) ? tabIndex : 1;
//                 viewAssetmateasset(tabToOpen, callback, auditScheduleId, codeId);

//             } else if (assetmate.error === "invalid_token") {
//                 // Refresh token safely
//                 console.warn("[handleAssetQrCode] Token invalid, requesting new token...");
//                 await getNewToken(async () => {
//                     await handleAssetQrCode(codeId, tabIndex, callback, auditScheduleId);
//                 });

//             } else {
//                 // Other API errors
//                 showDialog("ERROR! " + assetmate.error.toUpperCase().replaceAll("_", " "));
//             }
//         } else {
//             console.error("[handleAssetQrCode] Invalid or empty response data:", response.data);
//         }

//     } catch (err) {
//         console.error("[handleAssetQrCode] API request failed:", err);
//         apiRequestFailed(err, "getassetmateasset");
//     }
// }

export function handleAssetQrCode(codeId, tabIndex, callback = null, auditScheduleId = 0) {
    if (!codeId) {
        console.warn("[handleAssetQrCode] No codeId provided. Exiting.");
        return;
    }

    const data = {
        token: shared.mCustomerDetailsJSON.token,
        codeId: codeId
    };

    const url = constructUrl("/api/getassetmateasset");

    // Follow the same pattern as searchAssetmateDepartmentLocationCategory
    buildRequestOptions(url, "GET", data).then(requestOptions => {
        Http.request(requestOptions).then(response => {
            console.log("[handleAssetQrCode] Raw response:", response);

            // Validate response structure
            if (!response || typeof response.status !== "number") {
                console.error("[handleAssetQrCode] Invalid HTTP response:", response);
                return;
            }

            console.log(`[handleAssetQrCode] API Status: ${response.status}`);

            if (isValidResponse(response, "getassetmateasset") && response.data) {
                let assetmate;

                try {
                    assetmate = typeof response.data === "string"
                        ? JSON.parse(response.data)
                        : response.data;
                } catch (e) {
                    console.warn("[handleAssetQrCode] JSON parsing failed, using raw data.");
                    assetmate = response.data;
                }

                // Check for token errors or other API errors
                if (assetmate.error === undefined) {
                    if (assetmate) assetmateAssetInfo = assetmate;

                    // Display relevant sections
                    displaySection('modulesSection', 'flex', false, true);
                    $('#modulesMenuArea').hide();
                    $('#modulesListArea').hide();
                    $('#modulesDisplayArea').show();
                    shared.currentState = "handleAssetQrCode";

                    // Decide which tab to open
                    const tabToOpen = (assetmateAssetInfo.assetmatedocumentList?.length > 0) ? tabIndex : 1;
                    viewAssetmateasset(tabToOpen, callback, auditScheduleId, codeId);

                } else if (assetmate.error === "invalid_token") {
                    // Refresh token safely
                    console.warn("[handleAssetQrCode] Token invalid, requesting new token...");
                    getNewToken(() => {
                        handleAssetQrCode(codeId, tabIndex, callback, auditScheduleId);
                    });

                } else {
                    // Other API errors
                    showDialog("ERROR! " + assetmate.error.toUpperCase().replaceAll("_", " "));
                }
            } else {
                console.error("[handleAssetQrCode] Invalid or empty response data:", response.data);
            }
        }).catch(err => {
            console.error("[handleAssetQrCode] API request failed:", err);
            apiRequestFailed(err, "getassetmateasset");
        });
    }).catch(err => {
        console.warn("[handleAssetQrCode] Request aborted: buildRequestOptions failed.", err);
    });
}



function startNewScan() {
	openQRCodeScanner();
}


/****************************************************************************************************
 Function: viewAssetmateasset
 Purpose: Lists down all the document and record names once QR code is accepted
****************************************************************************************************/

function viewAssetmateasset(tabIndex, callback, auditScheduleId, codeId) {
	shared.currentState = "viewAssetmateasset";
	unsavedData = false;
	$('#modulesMenuArea').hide();
	$('#modulesListArea').hide();
	$('#modulesDisplayArea').show();
	$('#assetmateContentListBox').show();
	$('#modules_contentViewBox').hide();
	
	var htmlContent = "";

	htmlContent += '<div id="moduleAssetmateNameArea">';
		htmlContent += '<div class="moduleNameArea">';
			if(assetmateAssetInfo.assetmateasset.image != null && assetmateAssetInfo.assetmateasset.image.startsWith('http')) {
				htmlContent += '<div class="moduleImageClass"><img id="assetImage" class="moduleImage" data-imgurl="'+assetmateAssetInfo.assetmateasset.image+'" src="./img/noimage.jpg" onerror="this.onerror=null;this.src=\'./img/noimage.jpg\';"></div>';
			}
			htmlContent += '<div class="moduleTextClass">';
				htmlContent += '<div class="moduleDescriptionClass" style="font-size: 1.1em; font-weight: bold; color: var(--primary-blue); word-break: break-word; overflow-wrap: break-word; white-space: normal;">'+assetmateAssetInfo.assetmateasset.assetName+'</div>';
				htmlContent += '<div class="moduleDescriptionClass">'+assetmateAssetInfo.assetmateasset.description+'</div>';
				htmlContent += '<div class="moduleDescriptionClass">QR: '+assetmateAssetInfo.assetmateasset.codeId+'</div>';

				if(assetmateAssetInfo.assetmatescheduleList.length > 0) {
					let currentDateMs = Date.now();
					var index = 0;
					var assetMateSchedule = assetmateAssetInfo.assetmatescheduleList[0];
                    var userNotifications = [];
					//for(let assetMateSchedule of  assetmateAssetInfo.assetmatescheduleList) {
						index++;
						var date = new Date(assetMateSchedule.schedule);
						if((currentDateMs >= assetMateSchedule.schedule) && (currentDateMs <= assetMateSchedule.gracePeriod) && (assetMateSchedule.pending)) {
							//for(var notification of userNotifications) {
							//	if((notification.status == 'ASSETMATE_SCHEDULE') && (notification.notification.includes(assetmateAssetInfo.assetmateasset.codeId))) {
									htmlContent += '<div style="color:var(--secondary-blue); font-weight:bold;" class="moduleDescriptionClass">Audit Due: '+date.toDateString()+' <button class="inlineButton" onclick="forceStartAudit()">Start audit now</button></div>';
							//		break;
							//	}
							//}
							//break;
						} else if(((currentDateMs + (dayInMs*3)) >= assetMateSchedule.schedule) && ((currentDateMs + (dayInMs*3)) <= assetMateSchedule.gracePeriod)) {
							//for(var notification of userNotifications) {
							//	if((notification.status == 'UPCOMING') && (notification.notification.includes(assetmateAssetInfo.assetmateasset.codeId))) {
									htmlContent += '<div style="color:var(--secondary-yellow);" class="moduleDescriptionClass">Upcoming Audit: '+date.toDateString()+'</div>';
							//		break;
							//	}
							//}
							//break;
						} else if(currentDateMs > assetMateSchedule.gracePeriod) {
							for(var notification of userNotifications) {
								if((notification.status == 'ASSETMATE_ESCALATION') && (notification.notification.includes(assetmateAssetInfo.assetmateasset.codeId))) {
									htmlContent += '<div style="color:var(--secondary-red);" class="moduleDescriptionClass">Escated audit: '+date.toDateString()+' <button class="inlineButton" onclick="reassignAudit('+assetMateSchedule.id+', \''+assetmateAssetInfo.assetmateasset.codeId.trim()+'\')">Reassign audit</button></div>';
									break;
								}
							}
							//break;
						} else if((currentDateMs + (dayInMs*3)) < assetMateSchedule.schedule) {
							htmlContent += '<div class="moduleDescriptionClass">Next Audit: '+date.toDateString()+'</div>';
							//break;
						} else {
							//if(index == assetmateAssetInfo.assetmatescheduleList.length) {
								htmlContent += '<div class="moduleDescriptionClass">No autdit scheduled</div>';
							//}
						}
					//}
				}
			htmlContent += '</div>';
		htmlContent += '</div>';
	htmlContent += '</div>';

	htmlContent += '<div class="lightBkClass" id="moduleContentArea" style="padding: 10px 0 20px 0; box-sizing: border-box;">';
		htmlContent += '<div id="reassignAuditArea" style="display: none; height: calc(100% - 30px);">';
			htmlContent += '<div class="notificationAreaContent"  id="reassignAuditContent"></div>';
		htmlContent += '</div>';
	
		htmlContent += '<div id="chartTabArea" class="headerTabMenuBtnAreaStyle">';
			htmlContent += '<button id="tab_0" class="tabLinks headerTabMenuBtnStyle" data-linkedcontentareaid="chartArea_0" onclick="openTab(event, 0)">Contents</button>';
			htmlContent += '<button id="tab_1" class="tabLinks headerTabMenuBtnStyle" data-linkedcontentareaid="chartArea_1" onclick="openTab(event, 1)">Audits</button>';
		htmlContent += '</div>';

		// Asset content list display
		htmlContent += '<div id="chartDisplayArea" style="height: calc(100% - 30px); box-sizing: border-box; overflow: auto;">';
			htmlContent += '<div id="chartArea_0" class="chartArea" style="height: fit-content;" >';
				htmlContent += '<div id="assetmateContentListBox" style="padding-bottom: 10px;"></div>';
				htmlContent += '<div class="contentViewerArea" id="modules_contentViewBox" style="padding-bottom: 10px;"></div>';
			htmlContent += '</div>';
			
			// Asset audit list display
			htmlContent += '<div id="chartArea_1" class="chartArea" style="height: fit-content; " >';
				htmlContent += '<div id="auditTitleArea"><div id="auditTitleBox"></div><div class="auditButtonBoxClass" id="auditButtonBox"></div></div>';
				htmlContent += '<div id="qrFormListArea" style="padding-bottom: 10px;">></div>';
				htmlContent += '<div id="qrFormViewerArea" style="padding: 5px;"></div>';
				//htmlContent += '<div class="moduleFooter" id="assetmateFooter"></div>';
			htmlContent += '</div>';

		htmlContent += '</div>';

	htmlContent += '</div>';

	$("#modulesDisplayArea").html(htmlContent);

	//if(assetmateAssetInfo.assetmatedocumentList.length > 0) {
		let items = assetmateAssetInfo.assetmatedocumentList;
		var htmlContent = '';
		if(items != null && items.length > 0) {
			listItems = [];
			for(var index in items) {
				
				let item = items[index];
				let title = item.documentName;
				let description = item.description;
				let image = '';
					if(item.documentUrl.toLowerCase().includes('.pdf')) {
						image = '<img class="ticketStyleImageIcon" src="./img/icon_pdf.png" onerror="this.onerror=null;this.src=\'./img/noimage.jpg\';" />';
					} else if(item.documentUrl.toLowerCase().includes('.mp4')) {
						image = '<img class="ticketStyleImageIcon" src="./img/icon_video.png" onerror="this.onerror=null;this.src=\'./img/noimage.jpg\';" />';
					} else if(item.documentUrl.toLowerCase().includes('.doc')) {
						image = '<img class="ticketStyleImageIcon" src="./img/icon_word.png" onerror="this.onerror=null;this.src=\'./img/noimage.jpg\';" />';
					} else if(item.documentUrl.toLowerCase().includes('.ppt')) {
						image = '<img class="ticketStyleImageIcon" src="./img/icon_ppt.png" onerror="this.onerror=null;this.src=\'./img/noimage.jpg\';" />';
					} else if(item.documentUrl.toLowerCase().includes('.xls')) {
						image = '<img class="ticketStyleImageIcon" src="./img/icon_excel.png" onerror="this.onerror=null;this.src=\'./img/noimage.jpg\';" />';
					} else if(item.documentUrl.toLowerCase().includes('.png') || item.documentUrl.toLowerCase().includes('.jpg') || item.documentUrl.toLowerCase().includes('.jpeg') || item.documentUrl.toLowerCase().includes('.bmp')) {
						image = '<img class="ticketStyleImageIcon" src="./img/icon_img.png" onerror="this.onerror=null;this.src=\'./img/noimage.jpg\';" />';
					}

				let itemJson = {"id": item.id, "image":image, "title":title, "contentUrl":item.documentUrl, "description":description, "clickAction":"displayAssetmateContentAtIndex('"+index+"')"};
				listItems.push(itemJson);
				if(index == items.length-1) {
					assetmateContents = listItems;
					createList("audit", htmlContent, listItems, null, 1, "assetmateContentListBox", "", "", "ticketStyle");
					
				}
			}
		} else {
			htmlContent += '<div class="formlabel">No contents found</div>';
			$('#assetmateContentListBox').html(htmlContent);
		}	
	//}

	//if(assetmateAssetInfo.assetmatedatainfoList.length > 0) {
		let auditItems = assetmateAssetInfo.assetmatedatainfoList;
		var htmlContent = '';
		$('#auditTitleBox').html('<div style="font-size: 1.0em;">'+assetmateAssetInfo.formtemplate.templateName+' ('+auditItems.length+')</div>');

		if(auditItems != null && auditItems.length > 0) {
			listItems = [];
			for(var index in auditItems) {
				
				let item = auditItems[index];
				let title = item.createdOn;
				let description = '<div>Modified: '+item.modifiedOn+'</div>';
				let image = '<span class="material-symbols-outlined ticketStyleMaterializeIcon">content_paste_search</span>';
				//let image = '<img id="am_list_image_'+index+'" style="padding: 0 30%; width: 100%; object-fit: contain;" src="./img/icon_audit.png" >';

				let itemJson = {"id": index, "image":image, "title":title, "description":description, "clickAction":"viewAssetmateForm("+item.formId+")"};
				listItems.push(itemJson);
				if(index == auditItems.length-1) {
					createList("audit", htmlContent, listItems, null, 1, "qrFormListArea", "", "", "ticketStyle");
					
				}
			}
		} else {
			htmlContent += '<div class="formlabel">No Audits found</div>';
			$('#qrFormListArea').html(htmlContent);
		}
	//}

	loadActionButtons();

	var imageElem = document.getElementById("assetImage");
	if(imageElem != null) {
		var objectKey = imageElem.dataset.imageurl;
		if(objectKey != null && objectKey.length > 0) {
			if(objectKey.startsWith(s3PrivateUrl)) {
				objectKey = objectKey.replace(s3PrivateUrl, "");
				console.log("objectKey: "+objectKey);
				//objectKey = "bveu_resource/BRIGS/assetmate_images/am_1_FE12345_templatebox_1_1__inputImage_33.jpg";

				getSignedUrl(objectKey, 10).then(url => {
					if(url.startsWith("https://")) {
						imageElem.src = url;
						imageElem.onload = function() {
							fixModuleHeight("modulesModuleHeader, moduleAssetmateNameArea, footerSection", 20, "moduleContentArea");	
						}
					}
				});
			} else {
				imageElem.src = objectKey;
			}
		}
	} else {
		fixModuleHeight("modulesModuleHeader, moduleAssetmateNameArea, footerSection", 20, "moduleContentArea");
	}

	var defaultTab = document.getElementById("tab_"+tabIndex);
	// Giving 1 seconds to complete the google charts to render before hiding them
	setTimeout(function() {
		defaultTab.click();
		if(callback != null) {
			if(callback.includes("reassignAudit")) {
				reassignAudit(auditScheduleId, codeId);
			} else if(callback.includes("forceStartAudit")) {
				forceStartAudit();
			}
		}
	}, 200);
	// document.getElementById('moduleContentArea').style.height = ((document.getElementById('modulesBox').offsetHeight - document.getElementById('moduleAssetmateNameArea').offsetHeight - document.getElementsByClassName('moduleHeader')[0].offsetHeight - document.getElementsByClassName('moduleFooter')[0].offsetHeight))+'px';

}

function auditNow(codeId) {
	handleAssetQrCode(codeId, 1, "forceStartAudit");
}

function forceStartAudit() {
	let auditTab = document.getElementById('tab_1');
	auditTab.click();
	setTimeout(function() {
		let addNew = document.getElementById('assetmateAddButton');
		addNew.click();
	}, 200);
}

function loadActionButtons() {
	var htmlContent = "";
	htmlContent += '<div class="moduleButtonSmall" id="assetmateBackButton"  onclick="backToAssetmateList()" ><span class="material-symbols-outlined" style="font-size: 30px; color: var(--primary-white);">arrow_back</span></div>';
	htmlContent += '<div class="moduleButtonSmall" id="assetmateEditButton"  onclick="enableAssetmateEdit()" ><span class="material-symbols-outlined" style="font-size: 30px; color: var(--primary-white);">edit</span></div>';
	htmlContent += '<div class="moduleButtonSmall" id="assetmateSaveButton"  onclick="saveAssetmateFormData()" ><span class="material-symbols-outlined" style="font-size: 30px; color: var(--primary-white);">save</span></div>';
	htmlContent += '<div class="moduleButtonSmall" id="assetmateCancelButton"  onclick="disableAssetmateEdit()" ><span class="material-symbols-outlined" style="font-size: 30px; color: var(--primary-white);">close</span></div>';
	htmlContent += '<div class="moduleButtonSmall" id="assetmateAddButton"  onclick="checkAddNewAssetData()" ><span class="material-symbols-outlined" style="font-size: 30px; color: var(--primary-white);">add</span></div>';
	$("#auditButtonBox").html(htmlContent);

	enableAssetmateAdd();

}

async function viewAssetAndReassign(scheduleId, codeId) {
	handleAssetQrCode(codeId, 1, "reassignAudit", scheduleId);
}

function reassignAudit(scheduleId, codeId) {
	$('#reassignAuditArea').show();
	$('#chartTabArea').hide();
	$('#chartDisplayArea').css('height', '100%');
	$('#chartDisplayArea').hide();
	

	var htmlContent = '';

	htmlContent += '<div style="background-color: var(--primary-blue); padding: 5px; display: flex; justify-content: space-between;">';
		htmlContent += '<div class="titleFontClass" style="text-align: left; color: var(--primary-white);">AUDIT REASSIGNMENT</div>';
		htmlContent += '<div class="auditButtonBoxClass" id="reassignAuditFooter">';
			htmlContent += '<div class="moduleButtonSmall" onclick="submitReassignAudit('+scheduleId+', \''+codeId+'\')"><span class="material-symbols-outlined" style="font-size: 30px; color: var(--primary-white);">save</span></div>';
			htmlContent += '<div class="moduleButtonSmall" onclick="closeReassignAudit()"><span class="material-symbols-outlined" style="font-size: 30px; color: var(--primary-white);">close</span></div>';
		htmlContent += '</div>';
	htmlContent += '</div>';
	htmlContent += '<div style="padding: 10px; overflow: auto; height: -webkit-fill-available;">';
		htmlContent += '<div class="selectarea">';
			htmlContent += '<label class="moduleDescriptionClass" for="targetDate" style="padding: 10px 0;">Target Date</label>';
			htmlContent += '<input type="date" class="formvalue" id="targetDate" name="targetDate" placeholder="Target complation date"/>';
		htmlContent += '</div>';	
		htmlContent += '<div id="auditUserSelect"></div>';
	htmlContent += '</div>';

	$('#reassignAuditContent').html(htmlContent);
	getUsersForAuditReassign();
}

function closeReassignAudit() {
	$('#reassignAuditArea').hide();
	$('#chartTabArea').show();
	$('#chartDisplayArea').css('height', 'calc(100% - 30px)');
	$('#chartDisplayArea').show();
}

// async function getUsersForAuditReassign() {
//     let htmlContent = '';
//     const data = { "token": shared.mCustomerDetailsJSON.token };
//     const urlPath = "/api/getusers";
//     const url = constructUrl(urlPath);

//     try {
//         // Build request options
//         const requestOptions = await buildRequestOptions(url, "GET", data);
//         if (!requestOptions) {
//             console.warn("[getUsersForAuditReassign] Request aborted: buildRequestOptions returned null.");
//             return;
//         }

//         // Make request using Capacitor Http
//         const response = await Http.request(requestOptions);
//         console.log("[getUsersForAuditReassign] Raw response:", response);

//         if (isValidResponse(response, "getusers") && response.data) {
//             let userIdAndNames;
//             try {
//                 userIdAndNames = typeof response.data === "string"
//                     ? JSON.parse(response.data)
//                     : response.data;
//             } catch (e) {
//                 console.warn("[getUsersForAuditReassign] Parsing failed, using raw response data.");
//                 userIdAndNames = response.data;
//             }

//             if (userIdAndNames && userIdAndNames.error !== "invalid_token") { // Token still valid
//                 htmlContent += '<div class="selectarea">';
//                 htmlContent += '<label class="moduleDescriptionClass" for="userSelect" style="padding: 10px 0;">Select User</label>';
//                 htmlContent += '<input id="userSelect" class="formvalue" list="userlist" >';
//                 htmlContent += '<div class="selectDiv">';
//                 htmlContent += '<datalist id="userList" class="selectBox" name="assetmateUser" style="width: 100%; padding: 5px; border-radius: 25px; background-color: var(--primary-white); margin: 10px 0;">';

//                 for (let user of userIdAndNames) {
//                     htmlContent += `<option value="${user.userName}" id="option_${user.id}-${user.firstName}">${user.firstName} ${user.lastName}</option>`;
//                 }

//                 htmlContent += '</datalist>';
//                 htmlContent += '</div>';
//                 htmlContent += '</div>';

//                 $('#auditUserSelect').html(htmlContent);
//             } else { // Token expired
//                 getNewToken("getUsersForAuditReassign()");
//             }
//         }
//     } catch (err) {
//         apiRequestFailed(err, "getusers");
//         htmlContent += '<div class="moduleDescriptionClass">Could not get users for assigning!</div>';
//         $('#auditUserSelect').html(htmlContent);
//     }
// }

function getUsersForAuditReassign() {
    let htmlContent = '';
    const data = { "token": shared.mCustomerDetailsJSON.token };
    const urlPath = "/api/getusers";
    const url = constructUrl(urlPath);

   
    buildRequestOptions(url, "GET", data).then(requestOptions => {
        Http.request(requestOptions).then(response => {
            console.log("[getUsersForAuditReassign] Raw response:", response);

            if (isValidResponse(response, "getusers") && response.data) {
                let userIdAndNames;
                try {
                    userIdAndNames = typeof response.data === "string"
                        ? JSON.parse(response.data)
                        : response.data;
                } catch (e) {
                    console.warn("[getUsersForAuditReassign] Parsing failed, using raw response data.");
                    userIdAndNames = response.data;
                }

                if (userIdAndNames && userIdAndNames.error !== "invalid_token") {
                    // Token still valid → Build HTML
                    htmlContent += '<div class="selectarea">';
                    htmlContent += '<label class="moduleDescriptionClass" for="userSelect" style="padding: 10px 0;">Select User</label>';
                    htmlContent += '<input id="userSelect" class="formvalue" list="userlist" >';
                    htmlContent += '<div class="selectDiv">';
                    htmlContent += '<datalist id="userList" class="selectBox" name="assetmateUser" style="width: 100%; padding: 5px; border-radius: 25px; background-color: var(--primary-white); margin: 10px 0;">';

                    for (let user of userIdAndNames) {
                        htmlContent += `<option value="${user.userName}" id="option_${user.id}-${user.firstName}">${user.firstName} ${user.lastName}</option>`;
                    }

                    htmlContent += '</datalist>';
                    htmlContent += '</div>';
                    htmlContent += '</div>';

                    $('#auditUserSelect').html(htmlContent);
                } else {
                    // Token expired
                    getNewToken("getUsersForAuditReassign()");
                }
            }
        }).catch(err => {
            apiRequestFailed(err, "getusers");
            htmlContent += '<div class="moduleDescriptionClass">Could not get users for assigning!</div>';
            $('#auditUserSelect').html(htmlContent);
        });
    }).catch(err => {
        console.warn("[getUsersForAuditReassign] Request aborted: buildRequestOptions failed.", err);
    });
}


// async function submitReassignAudit(scheduleId, codeId) {
//     const targetDate = new Date($("#targetDate").val()).getTime();
//     const userName = $("#userSelect").val();

//     const data = {
//         "token": shared.mCustomerDetailsJSON.token,
//         "scheduleId": scheduleId,
//         "targetDate": targetDate,
//         "userName": userName
//     };

//     const urlPath = "/api/assetmaterechedule";
//     const url = constructUrl(urlPath);

//     try {
//         // Build request options
//         const requestOptions = await buildRequestOptions(url, "POST", data);
//         if (!requestOptions) {
//             console.warn("[submitReassignAudit] Request aborted: buildRequestOptions returned null.");
//             return;
//         }

//         // Make request using Capacitor Http
//         const response = await Http.request(requestOptions);
//         console.log("[submitReassignAudit] Raw response:", response);

//         if (isValidResponse(response, "assetmaterechedule") && response.data) {
//             let result;
//             try {
//                 result = typeof response.data === "string"
//                     ? JSON.parse(response.data)
//                     : response.data;
//             } catch (e) {
//                 console.warn("[submitReassignAudit] Parsing failed, using raw response data.");
//                 result = response.data;
//             }

//             if (result && result.error !== "invalid_token") { // Token still valid
//                 showDialog("Audit reschedules successfully!", "handleAssetQrCode('" + codeId + "', 1)");
//             } else { // Token expired
//                 getNewToken("submitReassignAudit(" + scheduleId + ", '" + codeId + "')");
//             }
//         }
//     } catch (err) {
//         apiRequestFailed(err, "assetmaterechedule");
//     }
// }

function submitReassignAudit(scheduleId, codeId) {
    const targetDate = new Date($("#targetDate").val()).getTime();
    const userName = $("#userSelect").val();

    const data = {
        "token": shared.mCustomerDetailsJSON.token,
        "scheduleId": scheduleId,
        "targetDate": targetDate,
        "userName": userName
    };

    const urlPath = "/api/assetmaterechedule";
    const url = constructUrl(urlPath);

    // Follow the same pattern as getUsersForAuditReassign
    RequestOptions(url, "POST", data).then(requestOptions => {
        Http.request(requestOptions).then(response => {
            console.log("[submitReassignAudit] Raw response:", response);

            if (isValidResponse(response, "assetmaterechedule") && response.data) {
                let result;
                try {
                    result = typeof response.data === "string"
                        ? JSON.parse(response.data)
                        : response.data;
                } catch (e) {
                    console.warn("[submitReassignAudit] Parsing failed, using raw response data.");
                    result = response.data;
                }

                if (result && result.error !== "invalid_token") {
                    // Token still valid
                    showDialog("Audit reschedules successfully!", "handleAssetQrCode('" + codeId + "', 1)");
                } else {
                    // Token expired
                    getNewToken("submitReassignAudit(" + scheduleId + ", '" + codeId + "')");
                }
            }
        }).catch(err => {
            apiRequestFailed(err, "assetmaterechedule");
        });
    }).catch(err => {
        console.warn("[submitReassignAudit] Request aborted: buildRequestOptions failed.", err);
    });
}


async function captureImage(previewId, sourceType, folder, fileName, quality, resolution) {
  try {
    const photo = await Camera.getPhoto({
      quality: quality,
      resultType: CameraResultType.Uri,
      source: sourceType === "CAMERA" ? CameraSource.Camera : CameraSource.Photos,
      width: resolution,
    });

    const imageUrl = photo.webPath;
    document.getElementById(previewId).src = imageUrl;
    document.getElementById(previewId.replace('ampreview_', '')).value = imageUrl;
  } catch (err) {
    console.error("[captureImage] Failed:", err);
  }
}


/****************************************************************************************************
Function: viewAssetmateForm
Purpose: Opens Asset Form 
****************************************************************************************************/
// async function viewAssetmateForm(id) {
//     shared.currentState = "viewAssetmateForm";
//     overWrite = true;
//     let htmlContent = "";

//     const templateData = assetmateAssetInfo.formtemplate.templateData.replace(/[\r\n\t]+/gm, "");
//     const templateJson = JSON.parse(templateData);
//     loadActionButtons();

//     const data = { "token": shared.mCustomerDetailsJSON.token, "formId": id };
//     const urlPath = "/api/getassetmatedata";
//     const url = constructUrl(urlPath);

//     try {
//         // Build request options
//         const requestOptions = await buildRequestOptions(url, "GET", data);
//         if (!requestOptions) {
//             console.warn("[viewAssetmateForm] Request aborted: buildRequestOptions returned null.");
//             return;
//         }

//         // Make request using Capacitor Http
//         const response = await Http.request(requestOptions);
//         console.log("[viewAssetmateForm] Raw response:", response);

//         if (isValidResponse(response, "getassetmatedata") && response.data) {
//             let result;
//             try {
//                 result = typeof response.data === "string"
//                     ? JSON.parse(response.data)
//                     : response.data;
//             } catch (e) {
//                 console.warn("[viewAssetmateForm] Parsing failed, using raw response data.");
//                 result = response.data;
//             }

//             if (result && result.error !== "invalid_token") { // Token still valid
//                 currentAssetData = result;
//                 const assetData = currentAssetData.formData.replace(/[\r\n\t]+/gm, "");
//                 const assetJson = JSON.parse(assetData);

//                 // --- Build Header ---
//                 htmlContent = `
//                     <div>
//                         <div style="font-size: 1.0em;">${assetmateAssetInfo.formtemplate.templateName}</div>
//                         <div style="font-size: 0.8em;">Created: ${currentAssetData.createdOn}</div>
//                         <div style="font-size: 0.8em;">Modified: ${currentAssetData.modifiedOn}</div>
//                     </div>
//                 `;
//                 $('#auditTitleBox').html(htmlContent);

//                 // --- Build Table ---
//                 htmlContent = "";
//                 let rowNum = 0;
//                 htmlContent += `<table class="formTemplateTable" style="${templateJson.conf.style}">`;
//                 htmlContent += `<colgroup>`;
//                 for (let count = 0; count < templateJson.conf.cols; count++) {
//                     htmlContent += `<col span="1" style="width: ${templateJson.conf.colw[count]}%;">`;
//                 }
//                 htmlContent += `</colgroup>`;

//                 // render rows (keeping all your original loops + td rendering logic)
//                 for (let tr of templateJson.tr) {
//                     htmlContent += "<tr>";
//                     let colNum = 0;
//                     for (let td of tr.td) {
//                         if (td.marged !== true) {
//                             if (td.colSpan === undefined) td.colSpan = td.span;
//                             if (td.rowSpan === undefined) td.rowSpan = 1;

//                             htmlContent += `<td rowspan=${td.rowSpan} colspan=${td.colSpan} style="vertical-align: middle;${getStyleAttributeInStyles(td.style, 'background-color:')}${getStyleAttributeInStyles(td.style, 'border:')}" >`;
                                      
                                                 
//                             if(td.label == undefined) {
// 										td.label = ""
// 									}
// 									if(td.value == undefined) {
// 										td.value = "";
// 									}

// 									if(td.required != undefined && td.required != null && td.required == true) {
// 										htmlContent += '<div id="required_'+td.id+'" style="display: none; color:red;">*Required field</div>';
// 									}
// 									if(td.type.includes('lookup')) {
// 										var typeArr = td.type.split('---');
// 										var cellType = typeArr[0];
// 										var lookupType = typeArr[1];
		
// 										htmlContent += '<label class="templatelabel" id="label_'+td.id+'" for="'+td.id+'">'+td.label+'</label>';
// 										htmlContent += '<input id="lookupTable_'+td.id+'" style="display: none;" />';

// 										htmlContent += '<input class="templatebox '+td.class+'" id="'+td.id+'" data-rownum='+rowNum+' data-colnum='+colNum+' data-type='+td.type+' value="'+td.value+'" style="display: none;" />';
// 										htmlContent += '<select class="templateSelectbox" id="select_'+td.id+'" style="font-size:1.2em;" onchange="populateSelectedColumnValue(this, \''+lookupType+'\', \''+cellType+'\', \''+td.id+'\')" >';
// 										htmlContent += '<option value="">Select Content</option>';
// 										htmlContent += '</select>';
										
// 										if(td.type.startsWith("inputImage")) {
// 											htmlContent += '<div style="'+td.style+'position: relative; width: 100%; min-height: 10px; padding: 10px;">';
// 												htmlContent += '<img id="impreview_'+td.id+'" style="'+td.style+'" src="'+td.value+'" onerror="this.onerror=null;this.src=\'../img/noimage.jpg\';" />';
// 											htmlContent += '</div>';
// 										}
// 									} else if(td.type.includes('linkedcell')) {
// 										htmlContent += '<label class="templatelabel" id="label_'+td.id+'" for="'+td.id+'">'+td.label+'</label>'; 
										
// 										if(td.type.startsWith("inputImage")) {
// 											htmlContent += '<input class="templatebox '+td.class+'" id="'+td.id+'" data-rownum='+rowNum+' data-colnum='+colNum+' data-type='+td.type+' style="display: none;"  value="'+td.value+'"/>';
// 											htmlContent += '<div style="'+td.style+'position: relative; width: 100%; min-height: 10px; padding: 10px;">';
// 												htmlContent += '<img id="impreview_'+td.id+'" style="'+td.style+'" src="../img/noimage.jpg" />';
// 											htmlContent += '</div>';
// 										} else {
// 											htmlContent += '<input class="templatebox '+td.class+'" id="'+td.id+'" data-rownum='+rowNum+' data-colnum='+colNum+' data-type='+td.type+' style="display: none;"  value="'+td.value+'"/>';
// 											var txt = '';
// 											if(td.value != null && td.value.length > 0) {
// 												var lineArr = td.value.split('<br>');
// 												for(var line of lineArr) {
// 													txt += line + '\n';
// 												}
// 											}
// 											htmlContent += '<textarea id="txtpreview_'+td.id+'" style="'+td.style+'" >'+txt+'</textarea>';
// 										}
										
// 									} else {
// 										if(td.type == "text") {
// 											htmlContent += '<p class="templatebox '+td.class+'" id="'+td.id+'" style="'+td.style+'">'+td.value+'</p>';
// 										} else if(td.type == "image") {
// 											htmlContent += '<div style="position: relative; width: 100%; min-height: 100px;">';
// 												htmlContent += '<img id="ampreview_'+td.id+'" style="'+td.style+'" src="'+td.value+'" onerror="this.onerror=null;this.src=\'./img/noimage.jpg\';" />';
// 											htmlContent += '</div>';
// 										} else if(td.type == "inputText") {
// 											if(td.label != undefined && td.label != "") {
// 												htmlContent += '<label class="templatelabel" id="label_'+td.id+'" for="'+td.id+'">'+td.label+'</label>';
// 											}
// 											htmlContent += '<input type="text" class="templatebox '+td.class+'" id="'+td.id+'" style="'+td.style+'" value="'+assetJson[td.id]+'" />';
// 										} else if(td.type == "inputNumber") {
// 											if(td.label != undefined && td.label != "") {
// 												htmlContent += '<label class="templatelabel" id="label_'+td.id+'" for="'+td.id+'">'+td.label+'</label>';
// 											}
// 											htmlContent += '<input type="number" class="templatebox '+td.class+'" id="'+td.id+'" style="'+td.style+'" value="'+assetJson[td.id]+'" />';
// 										} else if(td.type == "inputCb") {
// 											if(td.label != undefined &&  td.label != "") {
// 												if(assetJson[td.id] == 'on') {
// 													htmlContent += '<input type="checkbox" class="templatebox '+td.class+'" id="'+td.id+'" style="'+td.style+' width: fit-content; margin-right: 10px;" value="on" onChange="$(this).val(this.checked? \'on\': \'off\');" checked />';
// 												} else {
// 													htmlContent += '<input type="checkbox" class="templatebox '+td.class+'" id="'+td.id+'" style="'+td.style+' width: fit-content; margin-right: 10px;" value="off" onChange="$(this).val(this.checked? \'on\': \'off\');" />';
// 												}
// 												htmlContent += '<label class="templatelabel" id="label_'+td.id+'" for="'+td.id+'">'+td.label+'</label>';
// 											} else {
// 												if(assetJson[td.id] == 'on') {
// 													htmlContent += '<input type="checkbox" class="templatebox '+td.class+'" id="'+td.id+'" style="'+td.style+'" value="on" onChange="$(this).val(this.checked? \'on\': \'off\');" checked />';
// 												} else {
// 													htmlContent += '<input type="checkbox" class="templatebox '+td.class+'" id="'+td.id+'" style="'+td.style+'" value="off" onChange="$(this).val(this.checked? \'on\': \'off\');" />';
// 												}
// 											}
// 										} else if(td.type == "inputDate") {
// 											if(td.label != undefined && td.label != "") {
// 												htmlContent += '<label class="templatelabel" id="label_'+td.id+'" for="'+td.id+'">'+td.label+'</label>';
// 											}
// 											htmlContent += '<input type="date" class="templatebox '+td.class+'" id="'+td.id+'" style="'+td.style+'" value="'+assetJson[td.id]+'" />';
// 										} else if(td.type == "inputImage") {
// 											if(td.label != undefined && td.label != "") {
// 												htmlContent += '<label class="templatelabel" id="label_'+td.id+'" for="'+td.id+'">'+td.label+'</label>';
// 											}
// 											htmlContent += '<div style="position: relative; width: 100%; min-height: 100px;">';
// 												htmlContent += '<input class="templatebox '+td.class+'" id="'+td.id+'" style="display:none;" value="'+assetJson[td.id]+'" />';
// 												htmlContent += '<img class="amPreview" id="ampreview_'+td.id+'" style="'+td.style+'" src="img/noimage.jpg" onerror="this.onerror=null;this.src=\'./img/noimage.jpg\';" />';
// 												htmlContent += '<div id="moduleImageButtonLayer" style="display: flex; align-items: center; justify-content: space-evenly; width: 100%; height: 100%; position: absolute; top: 0;">';
// 													let fileName = "";
// 													if(assetJson[td.id] != null) {
// 														fileName = assetJson[td.id].split('/').pop(0);
// 													} else {
// 														fileName = 'am_'+(assetmateAssetInfo.assetmateasset.id+'_'+assetmateAssetInfo.assetmateasset.codeId+'_'+td.id+'_'+assetmateAssetInfo.assetmatedatainfoList.length).replace(/[-:.]/g,'')+".jpg";
// 													}
// 													var imageQuality = 60;
// 													if(systemConfiguration.systemInfo.assetMateImageQuality != undefined) {
// 														imageQuality = parseInt(systemConfiguration.systemInfo.assetMateImageQuality);
// 													}
// 													var imageResolution = 600;
// 													if(systemConfiguration.systemInfo.assetMateImagePixel != undefined) {
// 														imageResolution = parseInt(systemConfiguration.systemInfo.assetMateImagePixel);
// 													}
// 													// const fileName = 'am_'+(assetmateAssetInfo.assetmateasset.id+'_'+assetmateAssetInfo.assetmateasset.codeId+'_'+td.id+'_'+assetmateAssetInfo.assetmatedatainfoList.length).replace(/[-:.]/g,'')+".jpg";
// 													// htmlContent += '<div class="moduleImageButton" id="cameraButton" onclick="captureImage(\'ampreview_'+td.id+'\', '+Camera.PictureSourceType.CAMERA+', \'assetmate_images/\', \''+fileName+'\', '+imageQuality+', '+imageResolution+')"><span><i class="fas fa-camera"></i></span></div>';
// 													// htmlContent += '<div class="moduleImageButton" id="galleryButton" onclick="captureImage(\'ampreview_'+td.id+'\', '+Camera.PictureSourceType.PHOTOLIBRARY+', \'assetmate_images/\', \''+fileName+'\', '+imageQuality+', '+imageResolution+')"><span><i class="fas fa-photo-video"></i></span></div>';
// 													htmlContent += '<div class="moduleImageButton" id="cameraButton" onclick="captureImage(\'ampreview_'+td.id+'\', '+navigator.camera.PictureSourceType.CAMERA+', \'assetmate_images/\', \''+fileName+'\', '+imageQuality+', '+imageResolution+')"><span><i class="fas fa-camera"></i></span></div>';
// 													htmlContent += '<div class="moduleImageButton" id="galleryButton" onclick="captureImage(\'ampreview_'+td.id+'\', '+navigator.camera.PictureSourceType.PHOTOLIBRARY+', \'assetmate_images/\', \''+fileName+'\', '+imageQuality+', '+imageResolution+')"><span><i class="fas fa-photo-video"></i></span></div>';
// 												htmlContent += '</div>';
// 											htmlContent += '</div>';
// 										} else if((td.type == "inputSingleSelect") || (td.type == "inputMultiSelect")) {
// 											if(td.label != undefined && td.label != "") {
// 												htmlContent += '<label class="templatelabel" id="label_'+td.id+'" for="'+td.id+'">'+td.label+'</label>';
// 											}
// 											htmlContent += '<div class="templatebox" id="select_'+td.id+'" data-label="'+td.label+'" data-options="'+td.options+'">';
// 												if((td.options != undefined) && (td.options.length > 0)) {
// 													var oprionsArr = td.options.split('#');
// 													for(var index in oprionsArr) {
// 														if(td.type == "inputMultiSelect") {
// 															if((assetJson[td.id] != undefined) && (assetJson[td.id].includes(oprionsArr[index]))) {
// 																htmlContent += '<input type="checkbox" "id="option_'+td.id+'_'+index+'" name="'+td.id+'" value="'+oprionsArr[index]+'" checked /><label class="templatelabel" for="option_'+td.id+'_'+index+'" >'+oprionsArr[index]+'</label><br>';
// 															} else {
// 																htmlContent += '<input type="checkbox" "id="option_'+td.id+'_'+index+'" name="'+td.id+'" value="'+oprionsArr[index]+'" /><label class="templatelabel" for="option_'+td.id+'_'+index+'" >'+oprionsArr[index]+'</label><br>';
// 															}
// 														} else {
// 															if((assetJson[td.id] != undefined) && (assetJson[td.id].includes(oprionsArr[index]))) {
// 																htmlContent += '<input type="radio" "id="option_'+td.id+'_'+index+'" name="'+td.id+'" value="'+oprionsArr[index]+'" checked /><label class="templatelabel" for="option_'+td.id+'_'+index+'" >'+oprionsArr[index]+'</label><br>';
// 															} else {
// 																htmlContent += '<input type="radio" "id="option_'+td.id+'_'+index+'" name="'+td.id+'" value="'+oprionsArr[index]+'" /><label class="templatelabel" for="option_'+td.id+'_'+index+'" >'+oprionsArr[index]+'</label><br>';
// 															}
// 														}
// 													}
// 													htmlContent += '<input class='+td.class+' id="'+td.id+'" value="'+assetJson[td.id]+'" style="display:none;" />';
// 												}
// 											htmlContent += '</div>';
// 										} else if(td.type == "inputGeoPosition") {
// 											if(td.label != undefined && td.label != "") {
// 												htmlContent += '<label class="templatelabel" id="label_'+td.id+'" for="'+td.id+'">'+td.label+'</label>';
// 											}
// 											htmlContent += '<div style="position: relative; width: 100%;">';
// 												htmlContent += '<input type="text" class="templatebox geoposition '+td.class+'" id="'+td.id+'" style="'+td.style+'" value="'+assetJson[td.id]+'" readonly/>';
// 												htmlContent += '<div id="moduleGeoButtonLayer" style="display: flex; justify-content: flex-end; align-items: center; width: 100%; height: 100%; position: absolute; top: 0;">';
// 													htmlContent += '<div class="moduleImageButton" id="geoButton" style="width:27px; height:27px; font-size:15px; line-height: 27px; margin: 0 3px;" onclick="getGeoPosition(\''+td.id+'\')"><span><i class="fas fa-map-marker-alt"></i></span></div>';
// 												htmlContent += '</div>';
// 											htmlContent += '</div>';
// 										}
// 									}

//                             htmlContent += `</td>`;
//                         }
//                         colNum++;
//                     }
//                     htmlContent += "</tr>";
//                     rowNum++;
//                 }
//                 htmlContent += "</table>";

//                 // Inject into DOM
//                 $("#qrFormViewerArea").html(htmlContent);
//                 $("#qrFormListArea").hide();
//                 $("#chartTabArea").hide();
//                 $('#chartDisplayArea').css('height', '100%');
//                 $('#qrFormViewerArea').show();
//                 disableAssetmateEdit();

//                 // --- Init post-render logic (images, selects, required, etc.) ---
//                 let trIndex = 0, tdIndex = 0;
//                 function getNextImageUrl(trIndex, tdIndex) {
//                     let tr = templateJson.tr[trIndex];
//                     let td = tr.td[tdIndex];

//                     if (td.type === 'inputImage') {
//                         if (assetJson[td.id] !== undefined) {
//                             let objectKey = assetJson[td.id];
//                             if (objectKey.startsWith(s3PrivateUrl)) {
//                                 objectKey = objectKey.replace(s3PrivateUrl, "");
//                             }

//                             getSignedUrl(objectKey, 10).then(url => {
//                                 if (url.startsWith("https://")) {
//                                     let imageElem = document.getElementById("ampreview_" + td.id);
//                                     imageElem.src = url;
//                                     $(imageElem).on('click', function () {
//                                         viewAmFullScreenImage(this);
//                                     });
//                                 }
//                             });
//                         }
//                     } else if (td.type === 'inputMultiSelect') {
//                         $("input[name=" + td.id + "]").on('change', function () {
//                             const value = [];
//                             $("input:checkbox[name=" + td.id + "]:checked").each(function () {
//                                 value.push($(this).val());
//                             });
//                             $("#" + td.id).val(value);
//                         });
//                     } else if (td.type === 'inputSingleSelect') {
//                         $("input[name=" + td.id + "]").on('change', function () {
//                             const value = $("input[name=" + td.id + "]:checked").val();
//                             $("#" + td.id).val(value);
//                         });
//                     } else if (td.type === "inputGeoPosition") {
//                         getGeoPosition(td.id);
//                     }

//                     if (td.required) {
//                         $("#" + td.id).addClass("required");
//                     }

//                     tdIndex++;
//                     if (tdIndex < tr.td.length) {
//                         getNextImageUrl(trIndex, tdIndex);
//                     } else {
//                         tdIndex = 0;
//                         trIndex++;
//                         if (trIndex < templateJson.tr.length) {
//                             getNextImageUrl(trIndex, tdIndex);
//                         } else {
//                             let imageElems = document.getElementsByClassName("amPreview");
//                             if (imageElems.length > 0) {
//                                 for (let index in imageElems) {
//                                     let image = imageElems[index];
//                                     image.onload = function () {
//                                         fixModuleHeight("modulesModuleHeader, moduleAssetmateNameArea, footerSection", 20, "moduleContentArea");
//                                     }
//                                 }
//                             } else {
//                                 fixModuleHeight("modulesModuleHeader, moduleAssetmateNameArea, footerSection", 20, "moduleContentArea");
//                             }
//                         }
//                     }
//                 }
//                 getNextImageUrl(trIndex, tdIndex);
//                 $(".templatebox").css('border', 'none');

//             } else { // Token expired
//                 getNewToken("viewAssetmateForm(" + id + ")");
//             }
//         }
//     } catch (err) {
//         console.error("[viewAssetmateForm] Request failed:", err);
//         htmlContent += '<div style="text-align: center; font-size: 1.5em; padding: 10px; width: 100%;">Data not found</div>';
//         $("#qrFormViewerArea").html(htmlContent);

//         $("#qrFormListArea").hide();
//         $('#qrFormViewerArea').show();
//         enableAssetmateAdd();
//         //apiRequestFailed(err, "getassetmatedata");
//     }
// }

function viewAssetmateForm(id) {
    shared.currentState = "viewAssetmateForm";
    overWrite = true;
    let htmlContent = "";

    const templateData = assetmateAssetInfo.formtemplate.templateData.replace(/[\r\n\t]+/gm, "");
    const templateJson = JSON.parse(templateData);
    loadActionButtons();

    const data = { "token": shared.mCustomerDetailsJSON.token, "formId": id };
    const urlPath = "/api/getassetmatedata";
    const url = constructUrl(urlPath);

   
    buildRequestOptions(url, "GET", data).then(requestOptions => {
        Http.request(requestOptions).then(response => {
            console.log("[viewAssetmateForm] Raw response:", response);

            if (isValidResponse(response, "getassetmatedata") && response.data) {
                let result;
                try {
                    result = typeof response.data === "string"
                        ? JSON.parse(response.data)
                        : response.data;
                } catch (e) {
                    console.warn("[viewAssetmateForm] Parsing failed, using raw response data.");
                    result = response.data;
                }

                if (result && result.error !== "invalid_token") {
                    // Token still valid
                    currentAssetData = result;
                    const assetData = currentAssetData.formData.replace(/[\r\n\t]+/gm, "");
                    const assetJson = JSON.parse(assetData);

                    // --- Build Header ---
                    htmlContent = `
                        <div>
                            <div style="font-size: 1.0em;">${assetmateAssetInfo.formtemplate.templateName}</div>
                            <div style="font-size: 0.8em;">Created: ${currentAssetData.createdOn}</div>
                            <div style="font-size: 0.8em;">Modified: ${currentAssetData.modifiedOn}</div>
                        </div>
                    `;
                    $('#auditTitleBox').html(htmlContent);

                    // --- Build Table (unchanged original loops and td rendering) ---
                    htmlContent = "";
                    let rowNum = 0;
                    htmlContent += `<table class="formTemplateTable" style="${templateJson.conf.style}">`;
                    htmlContent += `<colgroup>`;
                    for (let count = 0; count < templateJson.conf.cols; count++) {
                        htmlContent += `<col span="1" style="width: ${templateJson.conf.colw[count]}%;">`;
                    }
                    htmlContent += `</colgroup>`;

                    // render rows (your original logic unchanged)
                    for (let tr of templateJson.tr) {
                        htmlContent += "<tr>";
                        let colNum = 0;
                        for (let td of tr.td) {
                            if (td.marged !== true) {
                                if (td.colSpan === undefined) td.colSpan = td.span;
                                if (td.rowSpan === undefined) td.rowSpan = 1;

                                htmlContent += `<td rowspan=${td.rowSpan} colspan=${td.colSpan} style="vertical-align: middle;${getStyleAttributeInStyles(td.style, 'background-color:')}${getStyleAttributeInStyles(td.style, 'border:')}" >`;

                                // 🔹 keep your existing rendering logic exactly as-is
                                if (td.label == undefined) td.label = "";
                                if (td.value == undefined) td.value = "";
                                if (td.required) {
                                    htmlContent += '<div id="required_'+td.id+'" style="display: none; color:red;">*Required field</div>';
                                }
                                if(td.type.includes('lookup')) {
										var typeArr = td.type.split('---');
										var cellType = typeArr[0];
										var lookupType = typeArr[1];
		
										htmlContent += '<label class="templatelabel" id="label_'+td.id+'" for="'+td.id+'">'+td.label+'</label>';
										htmlContent += '<input id="lookupTable_'+td.id+'" style="display: none;" />';

										htmlContent += '<input class="templatebox '+td.class+'" id="'+td.id+'" data-rownum='+rowNum+' data-colnum='+colNum+' data-type='+td.type+' value="'+td.value+'" style="display: none;" />';
										htmlContent += '<select class="templateSelectbox" id="select_'+td.id+'" style="font-size:1.2em;" onchange="populateSelectedColumnValue(this, \''+lookupType+'\', \''+cellType+'\', \''+td.id+'\')" >';
										htmlContent += '<option value="">Select Content</option>';
										htmlContent += '</select>';
										
										if(td.type.startsWith("inputImage")) {
											htmlContent += '<div style="'+td.style+'position: relative; width: 100%; min-height: 10px; padding: 10px;">';
												htmlContent += '<img id="impreview_'+td.id+'" style="'+td.style+'" src="'+td.value+'" onerror="this.onerror=null;this.src=\'../img/noimage.jpg\';" />';
											htmlContent += '</div>';
										}
									} else if(td.type.includes('linkedcell')) {
										htmlContent += '<label class="templatelabel" id="label_'+td.id+'" for="'+td.id+'">'+td.label+'</label>'; 
										
										if(td.type.startsWith("inputImage")) {
											htmlContent += '<input class="templatebox '+td.class+'" id="'+td.id+'" data-rownum='+rowNum+' data-colnum='+colNum+' data-type='+td.type+' style="display: none;"  value="'+td.value+'"/>';
											htmlContent += '<div style="'+td.style+'position: relative; width: 100%; min-height: 10px; padding: 10px;">';
												htmlContent += '<img id="impreview_'+td.id+'" style="'+td.style+'" src="../img/noimage.jpg" />';
											htmlContent += '</div>';
										} else {
											htmlContent += '<input class="templatebox '+td.class+'" id="'+td.id+'" data-rownum='+rowNum+' data-colnum='+colNum+' data-type='+td.type+' style="display: none;"  value="'+td.value+'"/>';
											var txt = '';
											if(td.value != null && td.value.length > 0) {
												var lineArr = td.value.split('<br>');
												for(var line of lineArr) {
													txt += line + '\n';
												}
											}
											htmlContent += '<textarea id="txtpreview_'+td.id+'" style="'+td.style+'" >'+txt+'</textarea>';
										}
										
									} else {
										if(td.type == "text") {
											htmlContent += '<p class="templatebox '+td.class+'" id="'+td.id+'" style="'+td.style+'">'+td.value+'</p>';
										} else if(td.type == "image") {
											htmlContent += '<div style="position: relative; width: 100%; min-height: 100px;">';
												htmlContent += '<img id="ampreview_'+td.id+'" style="'+td.style+'" src="'+td.value+'" onerror="this.onerror=null;this.src=\'./img/noimage.jpg\';" />';
											htmlContent += '</div>';
										} else if(td.type == "inputText") {
											if(td.label != undefined && td.label != "") {
												htmlContent += '<label class="templatelabel" id="label_'+td.id+'" for="'+td.id+'">'+td.label+'</label>';
											}
											htmlContent += '<input type="text" class="templatebox '+td.class+'" id="'+td.id+'" style="'+td.style+'" value="'+assetJson[td.id]+'" />';
										} else if(td.type == "inputNumber") {
											if(td.label != undefined && td.label != "") {
												htmlContent += '<label class="templatelabel" id="label_'+td.id+'" for="'+td.id+'">'+td.label+'</label>';
											}
											htmlContent += '<input type="number" class="templatebox '+td.class+'" id="'+td.id+'" style="'+td.style+'" value="'+assetJson[td.id]+'" />';
										} else if(td.type == "inputCb") {
											if(td.label != undefined &&  td.label != "") {
												if(assetJson[td.id] == 'on') {
													htmlContent += '<input type="checkbox" class="templatebox '+td.class+'" id="'+td.id+'" style="'+td.style+' width: fit-content; margin-right: 10px;" value="on" onChange="$(this).val(this.checked? \'on\': \'off\');" checked />';
												} else {
													htmlContent += '<input type="checkbox" class="templatebox '+td.class+'" id="'+td.id+'" style="'+td.style+' width: fit-content; margin-right: 10px;" value="off" onChange="$(this).val(this.checked? \'on\': \'off\');" />';
												}
												htmlContent += '<label class="templatelabel" id="label_'+td.id+'" for="'+td.id+'">'+td.label+'</label>';
											} else {
												if(assetJson[td.id] == 'on') {
													htmlContent += '<input type="checkbox" class="templatebox '+td.class+'" id="'+td.id+'" style="'+td.style+'" value="on" onChange="$(this).val(this.checked? \'on\': \'off\');" checked />';
												} else {
													htmlContent += '<input type="checkbox" class="templatebox '+td.class+'" id="'+td.id+'" style="'+td.style+'" value="off" onChange="$(this).val(this.checked? \'on\': \'off\');" />';
												}
											}
										} else if(td.type == "inputDate") {
											if(td.label != undefined && td.label != "") {
												htmlContent += '<label class="templatelabel" id="label_'+td.id+'" for="'+td.id+'">'+td.label+'</label>';
											}
											htmlContent += '<input type="date" class="templatebox '+td.class+'" id="'+td.id+'" style="'+td.style+'" value="'+assetJson[td.id]+'" />';
										} else if(td.type == "inputImage") {
											if(td.label != undefined && td.label != "") {
												htmlContent += '<label class="templatelabel" id="label_'+td.id+'" for="'+td.id+'">'+td.label+'</label>';
											}
											htmlContent += '<div style="position: relative; width: 100%; min-height: 100px;">';
												htmlContent += '<input class="templatebox '+td.class+'" id="'+td.id+'" style="display:none;" value="'+assetJson[td.id]+'" />';
												htmlContent += '<img class="amPreview" id="ampreview_'+td.id+'" style="'+td.style+'" src="img/noimage.jpg" onerror="this.onerror=null;this.src=\'./img/noimage.jpg\';" />';
												htmlContent += '<div id="moduleImageButtonLayer" style="display: flex; align-items: center; justify-content: space-evenly; width: 100%; height: 100%; position: absolute; top: 0;">';
													let fileName = "";
													if(assetJson[td.id] != null) {
														fileName = assetJson[td.id].split('/').pop(0);
													} else {
														fileName = 'am_'+(assetmateAssetInfo.assetmateasset.id+'_'+assetmateAssetInfo.assetmateasset.codeId+'_'+td.id+'_'+assetmateAssetInfo.assetmatedatainfoList.length).replace(/[-:.]/g,'')+".jpg";
													}
													var imageQuality = 60;
													if(shared.systemConfiguration.systemInfo.assetMateImageQuality != undefined) {
														imageQuality = parseInt(shared.systemConfiguration.systemInfo.assetMateImageQuality);
													}
													var imageResolution = 600;
													if(shared.systemConfiguration.systemInfo.assetMateImagePixel != undefined) {
														imageResolution = parseInt(shared.systemConfiguration.systemInfo.assetMateImagePixel);
													}
													// const fileName = 'am_'+(assetmateAssetInfo.assetmateasset.id+'_'+assetmateAssetInfo.assetmateasset.codeId+'_'+td.id+'_'+assetmateAssetInfo.assetmatedatainfoList.length).replace(/[-:.]/g,'')+".jpg";
													// htmlContent += '<div class="moduleImageButton" id="cameraButton" onclick="captureImage(\'ampreview_'+td.id+'\', '+Camera.PictureSourceType.CAMERA+', \'assetmate_images/\', \''+fileName+'\', '+imageQuality+', '+imageResolution+')"><span><i class="fas fa-camera"></i></span></div>';
													// htmlContent += '<div class="moduleImageButton" id="galleryButton" onclick="captureImage(\'ampreview_'+td.id+'\', '+Camera.PictureSourceType.PHOTOLIBRARY+', \'assetmate_images/\', \''+fileName+'\', '+imageQuality+', '+imageResolution+')"><span><i class="fas fa-photo-video"></i></span></div>';
													htmlContent += `<div class="moduleImageButton" onclick="captureImage('ampreview_${td.id}', 'CAMERA', 'assetmate_images/', '${fileName}', ${imageQuality}, ${imageResolution})"><span><i class="fas fa-camera"></i></span></div>`;
                                                    htmlContent += `<div class="moduleImageButton" onclick="captureImage('ampreview_${td.id}', 'PHOTOS', 'assetmate_images/', '${fileName}', ${imageQuality}, ${imageResolution})"><span><i class="fas fa-photo-video"></i></span></div>`;

												htmlContent += '</div>';
											htmlContent += '</div>';
										} else if((td.type == "inputSingleSelect") || (td.type == "inputMultiSelect")) {
											if(td.label != undefined && td.label != "") {
												htmlContent += '<label class="templatelabel" id="label_'+td.id+'" for="'+td.id+'">'+td.label+'</label>';
											}
											htmlContent += '<div class="templatebox" id="select_'+td.id+'" data-label="'+td.label+'" data-options="'+td.options+'">';
												if((td.options != undefined) && (td.options.length > 0)) {
													var oprionsArr = td.options.split('#');
													for(var index in oprionsArr) {
														if(td.type == "inputMultiSelect") {
															if((assetJson[td.id] != undefined) && (assetJson[td.id].includes(oprionsArr[index]))) {
																htmlContent += '<input type="checkbox" "id="option_'+td.id+'_'+index+'" name="'+td.id+'" value="'+oprionsArr[index]+'" checked /><label class="templatelabel" for="option_'+td.id+'_'+index+'" >'+oprionsArr[index]+'</label><br>';
															} else {
																htmlContent += '<input type="checkbox" "id="option_'+td.id+'_'+index+'" name="'+td.id+'" value="'+oprionsArr[index]+'" /><label class="templatelabel" for="option_'+td.id+'_'+index+'" >'+oprionsArr[index]+'</label><br>';
															}
														} else {
															if((assetJson[td.id] != undefined) && (assetJson[td.id].includes(oprionsArr[index]))) {
																htmlContent += '<input type="radio" "id="option_'+td.id+'_'+index+'" name="'+td.id+'" value="'+oprionsArr[index]+'" checked /><label class="templatelabel" for="option_'+td.id+'_'+index+'" >'+oprionsArr[index]+'</label><br>';
															} else {
																htmlContent += '<input type="radio" "id="option_'+td.id+'_'+index+'" name="'+td.id+'" value="'+oprionsArr[index]+'" /><label class="templatelabel" for="option_'+td.id+'_'+index+'" >'+oprionsArr[index]+'</label><br>';
															}
														}
													}
													htmlContent += '<input class='+td.class+' id="'+td.id+'" value="'+assetJson[td.id]+'" style="display:none;" />';
												}
											htmlContent += '</div>';
										} else if(td.type == "inputGeoPosition") {
											if(td.label != undefined && td.label != "") {
												htmlContent += '<label class="templatelabel" id="label_'+td.id+'" for="'+td.id+'">'+td.label+'</label>';
											}
											htmlContent += '<div style="position: relative; width: 100%;">';
												htmlContent += '<input type="text" class="templatebox geoposition '+td.class+'" id="'+td.id+'" style="'+td.style+'" value="'+assetJson[td.id]+'" readonly/>';
												htmlContent += '<div id="moduleGeoButtonLayer" style="display: flex; justify-content: flex-end; align-items: center; width: 100%; height: 100%; position: absolute; top: 0;">';
													htmlContent += '<div class="moduleImageButton" id="geoButton" style="width:27px; height:27px; font-size:15px; line-height: 27px; margin: 0 3px;" onclick="getGeoPosition(\''+td.id+'\')"><span><i class="fas fa-map-marker-alt"></i></span></div>';
												htmlContent += '</div>';
											htmlContent += '</div>';
										}
									}
                                
                                htmlContent += `</td>`;
                            }
                            colNum++;
                        }
                        htmlContent += "</tr>";
                        rowNum++;
                    }
                    htmlContent += "</table>";

                    // Inject into DOM
                    $("#qrFormViewerArea").html(htmlContent);
                    $("#qrFormListArea").hide();
                    $("#chartTabArea").hide();
                    $('#chartDisplayArea').css('height', '100%');
                    $('#qrFormViewerArea').show();
                    disableAssetmateEdit();

                    // --- Init post-render logic (unchanged recursive getNextImageUrl) ---
                    let trIndex = 0, tdIndex = 0;
                    function getNextImageUrl(trIndex, tdIndex) {
                        let tr = templateJson.tr[trIndex];
                        let td = tr.td[tdIndex];

                        if (td.type === 'inputImage') {
                            if (assetJson[td.id] !== undefined) {
                                let objectKey = assetJson[td.id];
                                if (objectKey.startsWith(s3PrivateUrl)) {
                                    objectKey = objectKey.replace(s3PrivateUrl, "");
                                }

                                getSignedUrl(objectKey, 10).then(url => {
                                    if (url.startsWith("https://")) {
                                        let imageElem = document.getElementById("ampreview_" + td.id);
                                        imageElem.src = url;
                                        $(imageElem).on('click', function () {
                                            viewAmFullScreenImage(this);
                                        });
                                    }
                                });
                            }
                        } else if (td.type === 'inputMultiSelect') {
                            $("input[name=" + td.id + "]").on('change', function () {
                                const value = [];
                                $("input:checkbox[name=" + td.id + "]:checked").each(function () {
                                    value.push($(this).val());
                                });
                                $("#" + td.id).val(value);
                            });
                        } else if (td.type === 'inputSingleSelect') {
                            $("input[name=" + td.id + "]").on('change', function () {
                                const value = $("input[name=" + td.id + "]:checked").val();
                                $("#" + td.id).val(value);
                            });
                        } else if (td.type === "inputGeoPosition") {
                            getGeoPosition(td.id);
                        }

                        if (td.required) {
                            $("#" + td.id).addClass("required");
                        }

                        tdIndex++;
                        if (tdIndex < tr.td.length) {
                            getNextImageUrl(trIndex, tdIndex);
                        } else {
                            tdIndex = 0;
                            trIndex++;
                            if (trIndex < templateJson.tr.length) {
                                getNextImageUrl(trIndex, tdIndex);
                            } else {
                                let imageElems = document.getElementsByClassName("amPreview");
                                if (imageElems.length > 0) {
                                    for (let index in imageElems) {
                                        let image = imageElems[index];
                                        image.onload = function () {
                                            fixModuleHeight("modulesModuleHeader, moduleAssetmateNameArea, footerSection", 20, "moduleContentArea");
                                        }
                                    }
                                } else {
                                    fixModuleHeight("modulesModuleHeader, moduleAssetmateNameArea, footerSection", 20, "moduleContentArea");
                                }
                            }
                        }
                    }
                    getNextImageUrl(trIndex, tdIndex);
                    $(".templatebox").css('border', 'none');

                } else {
                    // Token expired
                    getNewToken("viewAssetmateForm(" + id + ")");
                }
            }
        }).catch(err => {
            console.error("[viewAssetmateForm] Request failed:", err);
            htmlContent += '<div style="text-align: center; font-size: 1.5em; padding: 10px; width: 100%;">Data not found</div>';
            $("#qrFormViewerArea").html(htmlContent);

            $("#qrFormListArea").hide();
            $('#qrFormViewerArea').show();
            enableAssetmateAdd();
            // apiRequestFailed(err, "getassetmatedata");
        });
    }).catch(err => {
        console.warn("[viewAssetmateForm] Request aborted: buildRequestOptions failed.", err);
    });
}


function checkAddNewAssetData() {
    if (
        assetmateAssetInfo.assetmatescheduleList != null &&
        assetmateAssetInfo.assetmatescheduleList.length > 0 &&
        assetmateAssetInfo.assetmatescheduleList[0].pending == false
    ) {
        showConfirmDialog({
            message: "Audit has been completed as per schedule, audit again?",
            yesLabel: "Yes",
            noLabel: "No",
            onYes: () => {
                console.log("✅ User confirmed re-audit");
                addNewAssetData();
            },
            onNo: () => {
                console.log("❌ User cancelled re-audit");
                // Dialog auto-hides
            }
        });
    } else {
        addNewAssetData();
    }
}

// async function addNewAssetData() {
//     shared.currentState = "addNewAssetData";
//     overWrite = false;
//     let htmlContent = "";

//     const templateData = assetmateAssetInfo.formtemplate.templateData.replace(/[\r\n\t]+/gm, "");
//     const templateJson = JSON.parse(templateData);

//     const data = {
//         "token": shared.mCustomerDetailsJSON.token,
//         "assetId": assetmateAssetInfo.assetmateasset.id,
//         "codeId": assetmateAssetInfo.assetmateasset.codeId,
//         "assetName": assetmateAssetInfo.assetmateasset.assetName
//     };
//     const urlPath = "/api/restgetassetmatedatablank";
//     const url = constructUrl(urlPath);

//     try {
//         // Build request options
//         const requestOptions = await buildRequestOptions(url, "GET", data);
//         if (!requestOptions) {
//             console.warn("[addNewAssetData] Request aborted: buildRequestOptions returned null.");
//             return;
//         }

//         // Make request using Capacitor Http
//         const response = await Http.request(requestOptions);
//         console.log("[addNewAssetData] Raw response:", response);

//         if (isValidResponse(response, "restgetassetmatedatablank") && response.data) {
//             let result;
//             try {
//                 result = typeof response.data === "string"
//                     ? JSON.parse(response.data)
//                     : response.data;
//             } catch (e) {
//                 console.warn("[addNewAssetData] Parsing failed, using raw response data.");
//                 result = response.data;
//             }

//             if (result && result.error !== "invalid_token") { // Token still valid
//                 currentAssetData = result;
//                 currentAssetData.formtemplateId = assetmateAssetInfo.formtemplate.id;

//                 // --- Build Header ---
//                 htmlContent = `
//                     <div style="font-size: 1.0em;">
//                         ${assetmateAssetInfo.formtemplate.templateName}
//                     </div>
//                 `;
//                 $('#auditTitleBox').html(htmlContent);

//                 // --- Build Table ---
//                 htmlContent = "";
//                 let rowNum = 0;
//                 htmlContent += `<table class="formTemplateTable" style="${templateJson.conf.style}">`;
//                 htmlContent += `<colgroup>`;
//                 for (let count = 0; count < templateJson.conf.cols; count++) {
//                     htmlContent += `<col span="1" style="width: ${templateJson.conf.colw[count]}%;">`;
//                 }
//                 htmlContent += `</colgroup>`;

//                 for (let tr of templateJson.tr) {
//                     htmlContent += "<tr>";
//                     let colNum = 0;
//                     for (let td of tr.td) {
//                         if (td.marged !== true) {
//                             if (td.colSpan === undefined) td.colSpan = td.span;
//                             if (td.rowSpan === undefined) td.rowSpan = 1;

//                             htmlContent += `<td rowspan=${td.rowSpan} colspan=${td.colSpan} 
//                                 style="vertical-align: middle;${getStyleAttributeInStyles(td.style, 'background-color:')}${getStyleAttributeInStyles(td.style, 'border:')}" >`;

                           
//                             if(td.label == undefined) {
// 									td.label = ""
// 								}
// 								if(td.value == undefined) {
// 									td.value = "";
// 								}

// 								if(td.required != undefined && td.required != null && td.required == true) {
// 									htmlContent += '<div id="required_'+td.id+'" style="display: none; color:red;">*Required field</div>';
// 								}

// 								if(td.type.includes('lookup')) {
// 									var typeArr = td.type.split('---');
// 									var cellType = typeArr[0];
// 									var lookupType = typeArr[1];
	
// 									htmlContent += '<label class="templatelabel" id="label_'+td.id+'" for="'+td.id+'">'+td.label+'</label>';
// 									htmlContent += '<input id="lookupTable_'+td.id+'" style="display: none;" />';
	
// 									htmlContent += '<input class="templatebox '+td.class+'" id="'+td.id+'" data-rownum='+rowNum+' data-colnum='+colNum+' data-type='+td.type+' value="'+td.value+'" style="display: none;" />';
// 									htmlContent += '<select class="templateSelectbox" id="select_'+td.id+'" style="font-size:1.2em;" onchange="populateSelectedColumnValue(this, \''+lookupType+'\', \''+cellType+'\', \''+td.id+'\')" >';
// 									htmlContent += '<option value="">Select Content</option>';
// 									htmlContent += '</select>';
									
// 									if(td.type.startsWith("inputImage")) {
// 										htmlContent += '<div style="'+td.style+'position: relative; width: 100%; min-height: 10px; padding: 10px;">';
// 											htmlContent += '<img id="impreview_'+td.id+'" style="'+td.style+'" src="'+td.value+'" onerror="this.onerror=null;this.src=\'../img/noimage.jpg\';" />';
// 										htmlContent += '</div>';
// 									}
// 								} else if(td.type.includes('linkedcell')) {
// 									htmlContent += '<label class="templatelabel" id="label_'+td.id+'" for="'+td.id+'">'+td.label+'</label>'; 
									
// 									if(td.type.startsWith("inputImage")) {
// 										htmlContent += '<input class="templatebox '+td.class+'" id="'+td.id+'" data-rownum='+rowNum+' data-colnum='+colNum+' data-type='+td.type+' style="display: none;"  value="'+td.value+'"/>';
// 										htmlContent += '<div style="'+td.style+'position: relative; width: 100%; min-height: 10px; padding: 10px;">';
// 											htmlContent += '<img id="impreview_'+td.id+'" style="'+td.style+'" src="../img/noimage.jpg" />';
// 										htmlContent += '</div>';
// 									} else {
// 										htmlContent += '<input class="templatebox '+td.class+'" id="'+td.id+'" data-rownum='+rowNum+' data-colnum='+colNum+' data-type='+td.type+' style="display: none;"  value="'+td.value+'"/>';
// 										var txt = '';
// 										if(td.value != null && td.value.length > 0) {
// 											var lineArr = td.value.split('<br>');
// 											for(var line of lineArr) {
// 												txt += line + '\n';
// 											}
// 										}
// 										htmlContent += '<textarea id="txtpreview_'+td.id+'" style="'+td.style+'" >'+txt+'</textarea>';
// 									}
									
// 								} else {
// 									if(td.type == "text") {
// 										htmlContent += '<p class="templatebox '+td.class+'" data-rownum='+rowNum+' data-colnum='+colNum+' id="'+td.id+'" style="'+td.style+'">'+td.value+'</p>';
// 									} else if(td.type == "image") {
// 										htmlContent += '<div style="position: relative; width: 100%; min-height: 100px;">';
// 											htmlContent += '<img id="ampreview_'+td.id+'" data-rownum='+rowNum+' data-colnum='+colNum+' style="'+td.style+'" src="'+td.value+'" id="myImage" onerror="this.onerror=null;this.src=\'./img/noimage.jpg\';" />';
// 										htmlContent += '</div>';
// 									} else if(td.type == "inputText") {
// 										if(td.label != undefined && td.label != "") {
// 											htmlContent += '<label class="templatelabel" id="label_'+td.id+'" for="'+td.id+'">'+td.label+'</label>';
// 										}
// 										htmlContent += '<input type="text" class="templatebox '+td.class+'" id="'+td.id+'" style="'+td.style+'" value="" />';
// 									} else if(td.type == "inputNumber") {
// 										if(td.label != undefined && td.label != "") {
// 											htmlContent += '<label class="templatelabel" id="label_'+td.id+'" for="'+td.id+'">'+td.label+'</label>';
// 										}
// 										htmlContent += '<input type="number" class="templatebox '+td.class+'" id="'+td.id+'" style="'+td.style+'" value="" />';
// 									} else if(td.type == "inputCb") {
// 										if(td.label != undefined &&  td.label != "") {
// 											htmlContent += '<input type="checkbox" class="templatebox '+td.class+'" id="'+td.id+'" style="'+td.style+' width: fit-content; margin-right: 10px;" value="off" onChange="$(this).val(this.checked? \'on\': \'off\');" />';
// 											htmlContent += '<label class="templatelabel" id="label_'+td.id+'" for="'+td.id+'">'+td.label+'</label>';
// 										} else {
// 											htmlContent += '<input type="checkbox" class="templatebox '+td.class+'" id="'+td.id+'" style="'+td.style+'" value="off" onChange="$(this).val(this.checked? \'on\': \'off\');" />';
// 										}
// 									} else if(td.type == "inputDate") {
// 										if(td.label != undefined && td.label != "") {
// 											htmlContent += '<label class="templatelabel" id="label_'+td.id+'" for="'+td.id+'">'+td.label+'</label>';
// 										}
// 										htmlContent += '<input type="date" class="templatebox '+td.class+'" id="'+td.id+'" style="'+td.style+'" />';
// 									} else if(td.type == "inputImage") {
// 										if(td.label != undefined && td.label != "") {
// 											htmlContent += '<label class="templatelabel" id="label_'+td.id+'" for="'+td.id+'">'+td.label+'</label>';
// 										}
// 										htmlContent += '<div style="position: relative; width: 100%; min-height: 100px;">';
// 											htmlContent += '<input class="templatebox '+td.class+'" id="'+td.id+'" style="display:none;" />';
// 											htmlContent += '<img id="ampreview_'+td.id+'" style="'+td.style+'" src="img/noimage.jpg" onerror="this.onerror=null;this.src=\'./img/noimage.jpg\';" />';
// 											htmlContent += '<div id="moduleImageButtonLayer" style="display: flex; align-items: center; justify-content: space-evenly; width: 100%; height: 100%; position: absolute; top: 0;">';
// 												const fileName = 'am_'+(assetmateAssetInfo.assetmateasset.id+'_'+assetmateAssetInfo.assetmateasset.codeId+'_'+td.id+'_'+assetmateAssetInfo.assetmatedatainfoList.length).replace(/[-:.]/g,'')+".jpg";
// 												var imageQuality = 60;
// 												if(systemConfiguration.systemInfo.assetMateImageQuality != undefined) {
// 													imageQuality = parseInt(systemConfiguration.systemInfo.assetMateImageQuality);
// 												}
// 												var imageResolution = 600;
// 												if(systemConfiguration.systemInfo.assetMateImagePixel != undefined) {
// 													imageResolution = parseInt(systemConfiguration.systemInfo.assetMateImagePixel);
// 												}
												
// 												// htmlContent += '<div class="moduleImageButton" id="cameraButton" onclick="captureImage(\'ampreview_'+td.id+'\', '+Camera.PictureSourceType.CAMERA+', \'assetmate_images/\', \''+fileName+'\', '+imageQuality+', '+imageResolution+')"><span><i class="fas fa-camera"></i></span></div>';
// 												// htmlContent += '<div class="moduleImageButton" id="galleryButton" onclick="captureImage(\'ampreview_'+td.id+'\', '+Camera.PictureSourceType.PHOTOLIBRARY+', \'assetmate_images/\', \''+fileName+'\', '+imageQuality+', '+imageResolution+')"><span><i class="fas fa-photo-video"></i></span></div>';
// 												htmlContent += '<div class="moduleImageButton" id="cameraButton" onclick="captureImage(\'ampreview_'+td.id+'\', '+navigator.camera.PictureSourceType.CAMERA+', \'assetmate_images/\', \''+fileName+'\', '+imageQuality+', '+imageResolution+')"><span><i class="fas fa-camera"></i></span></div>';
// 												htmlContent += '<div class="moduleImageButton" id="galleryButton" onclick="captureImage(\'ampreview_'+td.id+'\', '+navigator.camera.PictureSourceType.PHOTOLIBRARY+', \'assetmate_images/\', \''+fileName+'\', '+imageQuality+', '+imageResolution+')"><span><i class="fas fa-photo-video"></i></span></div>';
// 											htmlContent += '</div>';
// 										htmlContent += '</div>';
// 									} else if((td.type == "inputSingleSelect") || (td.type == "inputMultiSelect")) {
// 										if(td.label != undefined && td.label != "") {
// 											htmlContent += '<label class="templatelabel" id="label_'+td.id+'" for="'+td.id+'">'+td.label+'</label>';
// 										}
// 										htmlContent += '<div class="templatebox" id="select_'+td.id+'" data-label="'+td.label+'" data-options="'+td.options+'">';
// 											if((td.options != undefined) && (td.options.length > 0)) {
// 												var oprionsArr = td.options.split('#');
// 												for(var index in oprionsArr) {
// 													if(td.type == "inputMultiSelect") {
// 														htmlContent += '<input type="checkbox" "id="option_'+td.id+'_'+index+'" name="'+td.id+'" value="'+oprionsArr[index]+'" /><label class="templatelabel" for="option_'+td.id+'_'+index+'" >'+oprionsArr[index]+'</label><br>';
// 													} else {
// 														htmlContent += '<input type="radio" "id="option_'+td.id+'_'+index+'" name="'+td.id+'" value="'+oprionsArr[index]+'" /><label class="templatelabel" for="option_'+td.id+'_'+index+'" >'+oprionsArr[index]+'</label><br>';
// 													}
// 												}
// 												htmlContent += '<input class='+td.class+' id="'+td.id+'" style="display:none;" />';
// 											}
// 										htmlContent += '</div>';
// 									} else if(td.type == "inputGeoPosition") {
// 										if(td.label != undefined && td.label != "") {
// 											htmlContent += '<label class="templatelabel" id="label_'+td.id+'" for="'+td.id+'">'+td.label+'</label>';
// 										}
// 										htmlContent += '<div style="position: relative; width: 100%;">';
// 											htmlContent += '<input type="text" class="templatebox geoposition '+td.class+'" id="'+td.id+'" style="'+td.style+'" readonly/>';
// 											htmlContent += '<div id="moduleGeoButtonLayer" style="display: flex; justify-content: flex-end; align-items: center; width: 100%; height: 100%; position: absolute; top: 0;">';
// 												htmlContent += '<div class="moduleImageButton" id="geoButton" style="width:27px; height:27px; font-size:15px; line-height: 27px; margin: 0 3px;" onclick="getGeoPosition(\''+td.id+'\')"><span><i class="fas fa-map-marker-alt"></i></span></div>';
// 											htmlContent += '</div>';
// 										htmlContent += '</div>';
// 									}
// 								}

//                             htmlContent += `</td>`;
//                         }
//                         colNum++;
//                     }
//                     htmlContent += "</tr>";
//                     rowNum++;
//                 }
//                 htmlContent += "</table>";

//                 // Inject into DOM
//                 $("#qrFormViewerArea").html(htmlContent);
//                 $("#qrFormListArea").hide();
//                 $("#chartTabArea").hide();
//                 $('#chartDisplayArea').css('height', '100%');
//                 $('#qrFormViewerArea').show();
//                 enableAssetmateEdit();

//                 // --- Init post-render logic ---
//                 let trIndex = 0, tdIndex = 0;
//                 function getNextSelectElem(trIndex, tdIndex) {
//                     const tr = templateJson.tr[trIndex];
//                     const td = tr.td[tdIndex];

//                     if (td.type === 'inputMultiSelect') {
//                         $("input[name=" + td.id + "]").on('change', function () {
//                             const value = [];
//                             $("input:checkbox[name=" + td.id + "]:checked").each(function () {
//                                 value.push($(this).val());
//                             });
//                             $("#" + td.id).val(value);
//                         });
//                     } else if (td.type === 'inputSingleSelect') {
//                         $("input[name=" + td.id + "]").on('change', function () {
//                             const value = $("input[name=" + td.id + "]:checked").val();
//                             $("#" + td.id).val(value);
//                         });
//                     } else if (td.type === "inputGeoPosition") {
//                         getGeoPosition(td.id);
//                     }

//                     if (td.required) {
//                         $("#" + td.id).addClass("required");
//                     }

//                     tdIndex++;
//                     if (tdIndex < tr.td.length) {
//                         getNextSelectElem(trIndex, tdIndex);
//                     } else {
//                         tdIndex = 0;
//                         trIndex++;
//                         if (trIndex < templateJson.tr.length) {
//                             getNextSelectElem(trIndex, tdIndex);
//                         } else {
//                             // finished
//                         }
//                     }
//                 }
//                 getNextSelectElem(trIndex, tdIndex);
//                 $(".templatebox ").css('border', 'none');

//             } else { // Token expired
//                 getNewToken("addNewAssetData()");
//             }
//         }
//     } catch (err) {
//         console.error("[addNewAssetData] Request failed:", err);
//         htmlContent += `<div style="text-align: center; font-size: 1.5em; padding: 10px; width: 100%;">
//             Unable to create form
//         </div>`;
//         $("#qrFormViewerArea").html(htmlContent);

//         $("#qrFormListArea").hide();
//         $("#chartTabArea").hide();
//         $('#chartDisplayArea').css('height', '100%');
//         $('#qrFormViewerArea').show();
//         //apiRequestFailed(err, "restgetassetmatedatablank");
//     }
// }

function addNewAssetData() {
    shared.currentState = "addNewAssetData";
    overWrite = false;
    let htmlContent = "";

    const templateData = assetmateAssetInfo.formtemplate.templateData.replace(/[\r\n\t]+/gm, "");
    const templateJson = JSON.parse(templateData);

    const data = {
        "token": shared.mCustomerDetailsJSON.token,
        "assetId": assetmateAssetInfo.assetmateasset.id,
        "codeId": assetmateAssetInfo.assetmateasset.codeId,
        "assetName": assetmateAssetInfo.assetmateasset.assetName
    };
    const urlPath = "/api/restgetassetmatedatablank";
    const url = constructUrl(urlPath);

    // Follow the same pattern as submitReassignAudit
    buildRequestOptions(url, "GET", data).then(requestOptions => {
        Http.request(requestOptions).then(response => {
            console.log("[addNewAssetData] Raw response:", response);

            if (isValidResponse(response, "restgetassetmatedatablank") && response.data) {
                let result;
                try {
                    result = typeof response.data === "string"
                        ? JSON.parse(response.data)
                        : response.data;
                } catch (e) {
                    console.warn("[addNewAssetData] Parsing failed, using raw response data.");
                    result = response.data;
                }

                if (result && result.error !== "invalid_token") {
                    // Token still valid
                    currentAssetData = result;
                    currentAssetData.formtemplateId = assetmateAssetInfo.formtemplate.id;

                    // --- Build Header ---
                    htmlContent = `
                        <div style="font-size: 1.0em;">
                            ${assetmateAssetInfo.formtemplate.templateName}
                        </div>
                    `;
                    $('#auditTitleBox').html(htmlContent);

                    // --- Build Table (unchanged full loop logic) ---
                    htmlContent = "";
                    let rowNum = 0;
                    htmlContent += `<table class="formTemplateTable" style="${templateJson.conf.style}">`;
                    htmlContent += `<colgroup>`;
                    for (let count = 0; count < templateJson.conf.cols; count++) {
                        htmlContent += `<col span="1" style="width: ${templateJson.conf.colw[count]}%;">`;
                    }
                    htmlContent += `</colgroup>`;

                    for (let tr of templateJson.tr) {
                        htmlContent += "<tr>";
                        let colNum = 0;
                        for (let td of tr.td) {
                            if (td.marged !== true) {
                                if (td.colSpan === undefined) td.colSpan = td.span;
                                if (td.rowSpan === undefined) td.rowSpan = 1;

                                htmlContent += `<td rowspan=${td.rowSpan} colspan=${td.colSpan} 
                                    style="vertical-align: middle;${getStyleAttributeInStyles(td.style, 'background-color:')}${getStyleAttributeInStyles(td.style, 'border:')}" >`;

                                if(td.label == undefined) {
									td.label = ""
								}
								if(td.value == undefined) {
									td.value = "";
								}

								if(td.required != undefined && td.required != null && td.required == true) {
									htmlContent += '<div id="required_'+td.id+'" style="display: none; color:red;">*Required field</div>';
								}

								if(td.type.includes('lookup')) {
									var typeArr = td.type.split('---');
									var cellType = typeArr[0];
									var lookupType = typeArr[1];
	
									htmlContent += '<label class="templatelabel" id="label_'+td.id+'" for="'+td.id+'">'+td.label+'</label>';
									htmlContent += '<input id="lookupTable_'+td.id+'" style="display: none;" />';
	
									htmlContent += '<input class="templatebox '+td.class+'" id="'+td.id+'" data-rownum='+rowNum+' data-colnum='+colNum+' data-type='+td.type+' value="'+td.value+'" style="display: none;" />';
									htmlContent += '<select class="templateSelectbox" id="select_'+td.id+'" style="font-size:1.2em;" onchange="populateSelectedColumnValue(this, \''+lookupType+'\', \''+cellType+'\', \''+td.id+'\')" >';
									htmlContent += '<option value="">Select Content</option>';
									htmlContent += '</select>';
									
									if(td.type.startsWith("inputImage")) {
										htmlContent += '<div style="'+td.style+'position: relative; width: 100%; min-height: 10px; padding: 10px;">';
											htmlContent += '<img id="impreview_'+td.id+'" style="'+td.style+'" src="'+td.value+'" onerror="this.onerror=null;this.src=\'../img/noimage.jpg\';" />';
										htmlContent += '</div>';
									}
								} else if(td.type.includes('linkedcell')) {
									htmlContent += '<label class="templatelabel" id="label_'+td.id+'" for="'+td.id+'">'+td.label+'</label>'; 
									
									if(td.type.startsWith("inputImage")) {
										htmlContent += '<input class="templatebox '+td.class+'" id="'+td.id+'" data-rownum='+rowNum+' data-colnum='+colNum+' data-type='+td.type+' style="display: none;"  value="'+td.value+'"/>';
										htmlContent += '<div style="'+td.style+'position: relative; width: 100%; min-height: 10px; padding: 10px;">';
											htmlContent += '<img id="impreview_'+td.id+'" style="'+td.style+'" src="../img/noimage.jpg" />';
										htmlContent += '</div>';
									} else {
										htmlContent += '<input class="templatebox '+td.class+'" id="'+td.id+'" data-rownum='+rowNum+' data-colnum='+colNum+' data-type='+td.type+' style="display: none;"  value="'+td.value+'"/>';
										var txt = '';
										if(td.value != null && td.value.length > 0) {
											var lineArr = td.value.split('<br>');
											for(var line of lineArr) {
												txt += line + '\n';
											}
										}
										htmlContent += '<textarea id="txtpreview_'+td.id+'" style="'+td.style+'" >'+txt+'</textarea>';
									}
									
								} else {
									if(td.type == "text") {
										htmlContent += '<p class="templatebox '+td.class+'" data-rownum='+rowNum+' data-colnum='+colNum+' id="'+td.id+'" style="'+td.style+'">'+td.value+'</p>';
									} else if(td.type == "image") {
										htmlContent += '<div style="position: relative; width: 100%; min-height: 100px;">';
											htmlContent += '<img id="ampreview_'+td.id+'" data-rownum='+rowNum+' data-colnum='+colNum+' style="'+td.style+'" src="'+td.value+'" id="myImage" onerror="this.onerror=null;this.src=\'./img/noimage.jpg\';" />';
										htmlContent += '</div>';
									} else if(td.type == "inputText") {
										if(td.label != undefined && td.label != "") {
											htmlContent += '<label class="templatelabel" id="label_'+td.id+'" for="'+td.id+'">'+td.label+'</label>';
										}
										htmlContent += '<input type="text" class="templatebox '+td.class+'" id="'+td.id+'" style="'+td.style+'" value="" />';
									} else if(td.type == "inputNumber") {
										if(td.label != undefined && td.label != "") {
											htmlContent += '<label class="templatelabel" id="label_'+td.id+'" for="'+td.id+'">'+td.label+'</label>';
										}
										htmlContent += '<input type="number" class="templatebox '+td.class+'" id="'+td.id+'" style="'+td.style+'" value="" />';
									} else if(td.type == "inputCb") {
										if(td.label != undefined &&  td.label != "") {
											htmlContent += '<input type="checkbox" class="templatebox '+td.class+'" id="'+td.id+'" style="'+td.style+' width: fit-content; margin-right: 10px;" value="off" onChange="$(this).val(this.checked? \'on\': \'off\');" />';
											htmlContent += '<label class="templatelabel" id="label_'+td.id+'" for="'+td.id+'">'+td.label+'</label>';
										} else {
											htmlContent += '<input type="checkbox" class="templatebox '+td.class+'" id="'+td.id+'" style="'+td.style+'" value="off" onChange="$(this).val(this.checked? \'on\': \'off\');" />';
										}
									} else if(td.type == "inputDate") {
										if(td.label != undefined && td.label != "") {
											htmlContent += '<label class="templatelabel" id="label_'+td.id+'" for="'+td.id+'">'+td.label+'</label>';
										}
										htmlContent += '<input type="date" class="templatebox '+td.class+'" id="'+td.id+'" style="'+td.style+'" />';
									} else if(td.type == "inputImage") {
										if(td.label != undefined && td.label != "") {
											htmlContent += '<label class="templatelabel" id="label_'+td.id+'" for="'+td.id+'">'+td.label+'</label>';
										}
										htmlContent += '<div style="position: relative; width: 100%; min-height: 100px;">';
											htmlContent += '<input class="templatebox '+td.class+'" id="'+td.id+'" style="display:none;" />';
											htmlContent += '<img id="ampreview_'+td.id+'" style="'+td.style+'" src="img/noimage.jpg" onerror="this.onerror=null;this.src=\'./img/noimage.jpg\';" />';
											htmlContent += '<div id="moduleImageButtonLayer" style="display: flex; align-items: center; justify-content: space-evenly; width: 100%; height: 100%; position: absolute; top: 0;">';
												const fileName = 'am_'+(assetmateAssetInfo.assetmateasset.id+'_'+assetmateAssetInfo.assetmateasset.codeId+'_'+td.id+'_'+assetmateAssetInfo.assetmatedatainfoList.length).replace(/[-:.]/g,'')+".jpg";
												var imageQuality = 60;
												if(shared.systemConfiguration.systemInfo.assetMateImageQuality != undefined) {
													imageQuality = parseInt(shared.systemConfiguration.systemInfo.assetMateImageQuality);
												}
												var imageResolution = 600;
												if(shared.systemConfiguration.systemInfo.assetMateImagePixel != undefined) {
													imageResolution = parseInt(shared.systemConfiguration.systemInfo.assetMateImagePixel);
												}
												
												// htmlContent += '<div class="moduleImageButton" id="cameraButton" onclick="captureImage(\'ampreview_'+td.id+'\', '+Camera.PictureSourceType.CAMERA+', \'assetmate_images/\', \''+fileName+'\', '+imageQuality+', '+imageResolution+')"><span><i class="fas fa-camera"></i></span></div>';
												// htmlContent += '<div class="moduleImageButton" id="galleryButton" onclick="captureImage(\'ampreview_'+td.id+'\', '+Camera.PictureSourceType.PHOTOLIBRARY+', \'assetmate_images/\', \''+fileName+'\', '+imageQuality+', '+imageResolution+')"><span><i class="fas fa-photo-video"></i></span></div>';
												htmlContent += `<div class="moduleImageButton" onclick="captureImage('ampreview_${td.id}', 'CAMERA', 'assetmate_images/', '${fileName}', ${imageQuality}, ${imageResolution})"><span><i class="fas fa-camera"></i></span></div>`;
                                                htmlContent += `<div class="moduleImageButton" onclick="captureImage('ampreview_${td.id}', 'PHOTOS', 'assetmate_images/', '${fileName}', ${imageQuality}, ${imageResolution})"><span><i class="fas fa-photo-video"></i></span></div>`;

										htmlContent += '</div>';
									} else if((td.type == "inputSingleSelect") || (td.type == "inputMultiSelect")) {
										if(td.label != undefined && td.label != "") {
											htmlContent += '<label class="templatelabel" id="label_'+td.id+'" for="'+td.id+'">'+td.label+'</label>';
										}
										htmlContent += '<div class="templatebox" id="select_'+td.id+'" data-label="'+td.label+'" data-options="'+td.options+'">';
											if((td.options != undefined) && (td.options.length > 0)) {
												var oprionsArr = td.options.split('#');
												for(var index in oprionsArr) {
													if(td.type == "inputMultiSelect") {
														htmlContent += '<input type="checkbox" "id="option_'+td.id+'_'+index+'" name="'+td.id+'" value="'+oprionsArr[index]+'" /><label class="templatelabel" for="option_'+td.id+'_'+index+'" >'+oprionsArr[index]+'</label><br>';
													} else {
														htmlContent += '<input type="radio" "id="option_'+td.id+'_'+index+'" name="'+td.id+'" value="'+oprionsArr[index]+'" /><label class="templatelabel" for="option_'+td.id+'_'+index+'" >'+oprionsArr[index]+'</label><br>';
													}
												}
												htmlContent += '<input class='+td.class+' id="'+td.id+'" style="display:none;" />';
											}
										htmlContent += '</div>';
									} else if(td.type == "inputGeoPosition") {
										if(td.label != undefined && td.label != "") {
											htmlContent += '<label class="templatelabel" id="label_'+td.id+'" for="'+td.id+'">'+td.label+'</label>';
										}
										htmlContent += '<div style="position: relative; width: 100%;">';
											htmlContent += '<input type="text" class="templatebox geoposition '+td.class+'" id="'+td.id+'" style="'+td.style+'" readonly/>';
											htmlContent += '<div id="moduleGeoButtonLayer" style="display: flex; justify-content: flex-end; align-items: center; width: 100%; height: 100%; position: absolute; top: 0;">';
												htmlContent += '<div class="moduleImageButton" id="geoButton" style="width:27px; height:27px; font-size:15px; line-height: 27px; margin: 0 3px;" onclick="getGeoPosition(\''+td.id+'\')"><span><i class="fas fa-map-marker-alt"></i></span></div>';
											htmlContent += '</div>';
										htmlContent += '</div>';
									}
								}
                              
                                htmlContent += `</td>`;
                            }
                            colNum++;
                        }
                        htmlContent += "</tr>";
                        rowNum++;
                    }
                    htmlContent += "</table>";

                    // Inject into DOM
                    $("#qrFormViewerArea").html(htmlContent);
                    $("#qrFormListArea").hide();
                    $("#chartTabArea").hide();
                    $('#chartDisplayArea').css('height', '100%');
                    $('#qrFormViewerArea').show();
                    enableAssetmateEdit();

                    // --- Init post-render logic (unchanged) ---
                    let trIndex = 0, tdIndex = 0;
                    function getNextSelectElem(trIndex, tdIndex) {
                        const tr = templateJson.tr[trIndex];
                        const td = tr.td[tdIndex];

                        if (td.type === 'inputMultiSelect') {
                            $("input[name=" + td.id + "]").on('change', function () {
                                const value = [];
                                $("input:checkbox[name=" + td.id + "]:checked").each(function () {
                                    value.push($(this).val());
                                });
                                $("#" + td.id).val(value);
                            });
                        } else if (td.type === 'inputSingleSelect') {
                            $("input[name=" + td.id + "]").on('change', function () {
                                const value = $("input[name=" + td.id + "]:checked").val();
                                $("#" + td.id).val(value);
                            });
                        } else if (td.type === "inputGeoPosition") {
                            getGeoPosition(td.id);
                        }

                        if (td.required) {
                            $("#" + td.id).addClass("required");
                        }

                        tdIndex++;
                        if (tdIndex < tr.td.length) {
                            getNextSelectElem(trIndex, tdIndex);
                        } else {
                            tdIndex = 0;
                            trIndex++;
                            if (trIndex < templateJson.tr.length) {
                                getNextSelectElem(trIndex, tdIndex);
                            }
                        }
                    }
                    getNextSelectElem(trIndex, tdIndex);
                    $(".templatebox ").css('border', 'none');

                } else {
                    // Token expired
                    getNewToken("addNewAssetData()");
                }
            }
        }).catch(err => {
            console.error("[addNewAssetData] Request failed:", err);
            htmlContent += `<div style="text-align: center; font-size: 1.5em; padding: 10px; width: 100%;">Unable to create form</div>`;
            $("#qrFormViewerArea").html(htmlContent);

            $("#qrFormListArea").hide();
            $("#chartTabArea").hide();
            $('#chartDisplayArea').css('height', '100%');
            $('#qrFormViewerArea').show();
            // apiRequestFailed(err, "restgetassetmatedatablank");
        });
    }).catch(err => {
        console.warn("[addNewAssetData] Request aborted: buildRequestOptions failed.", err);
    });
}


function selectElemOnchangeInit(templateJson) {
	var trIndex = 0, tdIndex = 0;
	function getNextSelectElem(trIndex, tdIndex) {
		var tr = templateJson.tr[trIndex];
		var td = tr.td[tdIndex];
		if(td.type == 'inputMultiSelect') {
			$("input[name="+td.id+"]").on('change', function() {
				var value = [];
				$("input:checkbox[name="+td.id+"]:checked").each(function() {
					value.push($(this).val());
				});
				$("#"+td.id).val(value);
			});
		} else if (td.type == 'inputSingleSelect') {
			$("input[name="+td.id+"]").on('change', function() {
				var value = $("input[name="+td.id+"]:checked").val();
				$("#"+td.id).val(value);
			});
		}

		tdIndex++;
		if(tdIndex < tr.td.length) {
			getNextSelectElem(trIndex, tdIndex);
		} else {
			tdIndex = 0;
			trIndex++;
			if(trIndex < templateJson.tr.length) {
				getNextSelectElem(trIndex, tdIndex);
			} else {
				// finished;
			}
		}
	}
	getNextSelectElem(trIndex, tdIndex);
}


function enableAssetmateAdd() {
	$("#assetmateBackButton").hide();
	$("#assetmateEditButton").hide();
	$("#assetmateSaveButton").hide();
	$("#assetmateCancelButton").hide();
	$("#assetmateAddButton").show();
	$(".menuBtn").show();
	$("#moduleImageButtonLayer").hide();
	$("#moduleGeoButtonLayer").hide();
	
}

function enableAssetmateEdit() {
	$(".formdata").prop("disabled", false);
	$("input").prop("disabled", false);
	$("#assetmateEditButton").hide();
	$("#assetmateBackButton").hide();
	$("#assetmateSaveButton").show();
	$("#assetmateCancelButton").show();
	$("#assetmateAddButton").hide();
	$(".menuBtn").hide();
	$("#moduleImageButtonLayer").show();
	$("#moduleGeoButtonLayer").show();
	unsavedData = true;
}

function disableAssetmateEdit() {
	$(".formdata").prop("disabled", true);
	$("input").prop("disabled", true);
	$("#assetmateEditButton").show();
	$("#assetmateBackButton").show();
	$("#assetmateSaveButton").hide();
	$("#assetmateCancelButton").hide();
	$("#assetmateAddButton").hide();
	$(".menuBtn").show();
	$("#moduleImageButtonLayer").hide();
	$("#moduleGeoButtonLayer").hide();
	unsavedData = false;
}


export function backAssetmateHandle() {
	// window.QRScanner.destroy(function(status){
	// 	console.log(status);
	// });
	
	if((shared.currentState == "addNewAssetData") || (shared.currentState == "viewAssetmateForm")) {
		backToAssetmateList();
	} else if(shared.currentState == "displayContent") {
		backToQrContentList();
	} else if(shared.currentState == "viewAssetmateasset")  {
	//} else if((currentState == "viewAssetmateasset") || (currentState == "searchAssetmateasset") || (currentState == "getAudits") || (currentState == "viewScanner")
		//|| (currentState == "assetmateLocations") || (currentState == "assetmateCategories") || (currentState == "assetmateDepartments")) {
		$('#modulesMenuArea').show();
		$('#modulesListArea').show();
		$('#modulesDisplayArea').hide();
		//currentState = "assetmateMenu";
		shared.currentState = shared.currentSourceState;
	} else if(shared.currentState == "viewFullScreenImage") {
		closeAmFullScreenImage();
	} else if(shared.currentState == "locationAssetmateasset") {
		getAssetmateLocations();
	} else if(shared.currentState == "categoryAssetmateasset") {
		getAssetmateCategorys();
	} else if(shared.currentState == "departmentAssetmateasset") {
		getAssetmateDepartments();
	} else {
		//closeAssetmate();
		exitAssetmate();
	}
}

function backToQrContentList() {
	shared.currentState = "viewAssetmateasset";
	pauseVideos();

	$('#assetmateContentListBox').show();
	$('#modules_contentViewBox').hide();
}

function backToAssetmateList() {
    if (unsavedData === true) {
        showConfirmDialog({
            message: "Any unsaved data will be lost. Proceed?",
            yesLabel: "Proceed",
            noLabel: "Cancel",
            onYes: () => {
                console.log("✅ User confirmed navigation back to Assetmate list");
                handleAssetQrCode(assetmateAssetInfo.assetmateasset.codeId, 1);
            },
            onNo: () => {
                console.log("❌ User cancelled navigation back to Assetmate list");
                // Dialog auto-hides
            }
        });
    } else {
        handleAssetQrCode(assetmateAssetInfo.assetmateasset.codeId, 1);
    }
}

// async function saveAssetmateFormData() {
//     let allRequiredDataPresent = true;

//     const elems = document.getElementsByClassName("formdata");
//     let assetData = '{';
//     let index = 0;

//     for (let elem of elems) {
//         if (index > 0) {
//             assetData += ',';
//         }

//         assetData += '"' + elem.id + '":"' + elem.value.replaceAll('"', '') + '"';

//         // Required field validation
//         if ($(elem).hasClass("required")) {
//             if (!elem.value || elem.value === "") {
//                 allRequiredDataPresent = false;
//                 $("#required_" + elem.id).show();
//             } else {
//                 $("#required_" + elem.id).hide();
//             }
//         }

//         index++;
//         if (index === elems.length) {
//             assetData += '}';

//             if (allRequiredDataPresent) {
//                 currentAssetData.formData = assetData;
//                 const data = {
//                     "token": shared.mCustomerDetailsJSON.token,
//                     "assetmatedata": JSON.stringify(currentAssetData),
//                     "overwrite": overWrite
//                 };

//                 const urlPath = "/api/saveassetmateasset";
//                 const url = constructUrl(urlPath);

//                 try {
//                     // Build request options
//                     const requestOptions = await buildRequestOptions(url, "POST", data);
//                     if (!requestOptions) {
//                         console.warn("[saveAssetmateFormData] Request aborted: buildRequestOptions returned null.");
//                         return;
//                     }

//                     // Make request using Capacitor Http
//                     const response = await Http.request(requestOptions);
//                     console.log("[saveAssetmateFormData] Raw response:", response);

//                     if (isValidResponse(response, "saveassetmateasset") && response.data) {
//                         let result;
//                         try {
//                             result = typeof response.data === "string"
//                                 ? JSON.parse(response.data)
//                                 : response.data;
//                         } catch (e) {
//                             console.warn("[saveAssetmateFormData] Parsing failed, using raw response data.");
//                             result = response.data;
//                         }

//                         if (result && result.error !== "invalid_token") {
//                             // ✅ Success flow
//                             showDialog("Form saved successfully!");
//                             unsavedData = false;
//                             disableAssetmateEdit();
//                             backAssetmateHandle();
//                         } else {
//                             // 🔄 Token expired, retry with fresh token
//                             getNewToken("saveAssetmateFormData()");
//                         }
//                     }
//                 } catch (err) {
//                     apiRequestFailed(err, "saveassetmateasset");
//                 }

//                 console.log("Saving Asset Data: " + assetData);
//             } else {
//                 showDialog("Required fields are missing!");
//             }
//         }
//     }
// }

// function saveAssetmateFormData() {
//     const elems = document.getElementsByClassName("formdata");
//     let allRequiredDataPresent = true;
//     let assetDataObj = {};

//     // Collect form data
//     for (let elem of elems) {
//         assetDataObj[elem.id] = elem.value.replaceAll('"', '');

//         // Required field validation
//         if ($(elem).hasClass("required")) {
//             if (!elem.value || elem.value === "") {
//                 allRequiredDataPresent = false;
//                 $("#required_" + elem.id).show();
//             } else {
//                 $("#required_" + elem.id).hide();
//             }
//         }
//     }

//     if (!allRequiredDataPresent) {
//         showDialog("Required fields are missing!");
//         return;
//     }

//     // ✅ Prepare request
//     currentAssetData.formData = JSON.stringify(assetDataObj); // Ensure proper JSON
//     const data = {
//         token: shared.mCustomerDetailsJSON?.token,
//         assetmatedata: JSON.stringify(currentAssetData),
//         overwrite: overWrite
//     };

//     if (!data.token) {
//         console.error("[saveAssetmateFormData] Token is missing!");
//         showDialog("Session expired. Please login again.");
//         return;
//     }

//     const url = constructUrl("/api/saveassetmateasset");

//     RequestOptions(url, "POST", data)
//         .then(requestOptions => {
//             return Http.request(requestOptions);
//         })
//         .then(response => {
//             console.log("[saveAssetmateFormData] Raw response:", response);

//             if (!response || !isValidResponse(response, "saveassetmateasset")) {
//                 console.error("[saveAssetmateFormData] Invalid response", response);
//                 apiRequestFailed(response, "saveassetmateasset");
//                 return;
//             }

//             let result;
//             try {
//                 result = typeof response.data === "string"
//                     ? JSON.parse(response.data)
//                     : response.data;
//             } catch (e) {
//                 console.warn("[saveAssetmateFormData] Parsing failed. Using raw response.");
//                 result = response.data;
//             }

//             if (result?.error === "invalid_token") {
//                 getNewToken("saveAssetmateFormData()");
//                 return;
//             }

//             // ✅ Success flow
//             showDialog("Form saved successfully!");
//             unsavedData = false;
//             disableAssetmateEdit();
//             backAssetmateHandle();
//         })
//         .catch(err => {
//             console.error("[saveAssetmateFormData] Request failed:", err);
//             apiRequestFailed(err, "saveassetmateasset");
//         });
// }

function saveAssetmateFormData() {
    let allRequiredDataPresent = true;

    const elems = document.getElementsByClassName("formdata");
    let assetData = '{';
    let index = 0;

    for (let elem of elems) {
        if (index > 0) {
            assetData += ',';
        }

        assetData += '"' + elem.id + '":"' + elem.value.replaceAll('"', '') + '"';

        // Required field validation
        if ($(elem).hasClass("required")) {
            if (!elem.value || elem.value === "") {
                allRequiredDataPresent = false;
                $("#required_" + elem.id).show();
            } else {
                $("#required_" + elem.id).hide();
            }
        }

        index++;
        if (index === elems.length) {
            assetData += '}';

            if (allRequiredDataPresent) {
                currentAssetData.formData = assetData;
                const data = {
                    "token": shared.mCustomerDetailsJSON.token,
                    "assetmatedata": JSON.stringify(currentAssetData),
                    "overwrite": overWrite
                };

                const urlPath = "/api/saveassetmateasset";
                const url = constructUrl(urlPath);
              
                RequestOptions(url, "POST", data).then(requestOptions => {
                    Http.request(requestOptions).then(response => {
                        console.log("[saveAssetmateFormData] Raw response:", response);

                        if (isValidResponse(response, "saveassetmateasset") && response.data) {
                            let result;
                            try {
                                result = typeof response.data === "string"
                                    ? JSON.parse(response.data)
                                    : response.data;
                            } catch (e) {
                                console.warn("[saveAssetmateFormData] Parsing failed, using raw response data.");
                                result = response.data;
                            }

                            if (result && result.error !== "invalid_token") {
                                // ✅ Success flow
                                showDialog("Form saved successfully!");
                                unsavedData = false;
                                disableAssetmateEdit();
                                backAssetmateHandle();
                            } else {
                                // 🔄 Token expired, retry with fresh token
                                getNewToken("saveAssetmateFormData()");
                            }
                        }
                    }).catch(err => {
                        apiRequestFailed(err, "saveassetmateasset");
                    });
                }).catch(err => {
                    console.warn("[saveAssetmateFormData] Request aborted: buildRequestOptions failed.", err);
                });

                console.log("Saving Asset Data: " + assetData);
            } else {
                showDialog("Required fields are missing!");
            }
        }
    }
}




/******************************************************************************************
Name: displayContent
Purpose: Change the visibility PDF / mp4 to SHOW
******************************************************************************************/
// function displayAssetmateContentAtIndex(index) {
// 	$('#assetmateContentListBox').hide();
// 	$('#modules_contentViewBox').show();
// 	shared.currentState = "displayContent";
// 	viewContent(assetmateContents[index].contentUrl, 'modules_contentViewBox');

// }

function displayAssetmateContentAtIndex(index) {
    $('#assetmateContentListBox').hide();
    $('#modules_contentViewBox').show();
    shared.currentState = "displayContent";

    const content = assetmateContents && assetmateContents[index];
    if (!content) {
        console.error("[displayAssetmateContentAtIndex] Invalid index:", index, content);
        $('#modules_contentViewBox').html('<div class="formlabel">Content unavailable</div>');
        return;
    }

    // Use the replica instead of the original
    viewAssetmatePdf(content, 'modules_contentViewBox');
}




/******************************************************************************************
Name: displayContent
Purpose: Change the visibility PDF / mp4 to SHOW
******************************************************************************************/

function displayContent(path) {
	//$('#loadingmessage').show();

	if(path.startsWith(s3PrivateUrl)) {
		var objectKey = path.replace(s3PrivateUrl, "");
		$('#assetmateContentListBox').hide();
		$('#modules_contentViewBox').show();
		shared.currentState = "displayContent";
		
		if(path.includes('.pdf')) {
			getSignedUrl(objectKey, 20).then(url => {
				if(url.startsWith("https://")) {
					url = encodeURIComponent(url);
					// var htmlContent = '<iframe id="pdfViewerWindow" src = "./ViewerJS/index.html#'+url+'" width="100%" height="100%" frameborder="0" fullscreen slideOnTouch allowfullscreen webkitallowfullscreen></iframe>';
					// var htmlContent = '<iframe id="pdfViewerWindow" src="https://mozilla.github.io/pdf.js/web/viewer.html?file='+url+'#toolbar=0" width="100%" height="100%" frameborder="0" fullscreen slideOnTouch allowfullscreen webkitallowfullscreen></iframe>';
					// $('#modules_contentViewBox').html(htmlContent);
					//$('#loadingmessage').hide();
                    viewPdfFile(url, 'modules_contentViewBox');
				}
			});

		} else if(path.includes('.mp4')) {
			getSignedUrl(objectKey, 300).then(url => {
				var htmlContent = '<video id="qrContentVideo" controlsList="nodownload noremoteplayback" controls autoplay muted id="videoFrame" style="width: 100%;"><source src="'+url+'" type="video/mp4"></video>';
				$('#modules_contentViewBox').html(htmlContent);
				document.getElementById("qrContentVideo").play();
				//$('#loadingmessage').hide();
			});

		} else if(path.includes('.png') || path.includes('.jpg') || path.includes('.jpeg') || path.includes('.bmp')) {
			getSignedUrl(objectKey, 10).then(url => {
				var htmlContent = '<img id="qrContentImage" style="width: 100%; max-height: 100%; object-fit: contain;" src="'+url+'" onerror="this.onerror=null;this.src=\'./img/noimage.jpg\';" />';
				$('#modules_contentViewBox').html(htmlContent);
				//$('#loadingmessage').hide();
			});

		} else {
			$('#modules_contentViewBox').html("Could not identify content!");
			//$('#loadingmessage').hide();
		}
		
	} else {
		$('#assetmateContentListBox').hide();
		$('#modules_contentViewBox').show();
		shared.currentState = "displayContent";

		if(path.includes('.pdf')) {
			path = encodeURIComponent(path);
			//var htmlContent = '<iframe id="pdfViewerWindow" src = "./ViewerJS/index.html#'+path+'" width="100%" height="100%" frameborder="0" fullscreen slideOnTouch allowfullscreen webkitallowfullscreen></iframe>';
			var htmlContent = '<iframe id="pdfViewerWindow" src = "https://mozilla.github.io/pdf.js/web/viewer.html?file='+path+'#toolbar=0" width="100%" height="100%" frameborder="0" fullscreen slideOnTouch allowfullscreen webkitallowfullscreen></iframe>';
			
			$('#modules_contentViewBox').html(htmlContent);
			//$('#loadingmessage').hide();
		} else if(path.includes('.mp4')) {
			var htmlContent = '<video id="qrContentVideo" controlsList="nodownload noremoteplayback" controls autoplay muted id="videoFrame" style="width: 100%;"><source src="'+path+'" type="video/mp4"></video>';
			$('#modules_contentViewBox').html(htmlContent);
			document.getElementById("qrContentVideo").play();
			//$('#loadingmessage').hide();
		} else if(path.includes('.png') || path.includes('.jpg') || path.includes('.jpeg') || path.includes('.bmp')) {
			var htmlContent = '<img id="qrContentImage" style="width: 100%; max-height: 100%; object-fit: contain;" src="'+path+'" onerror="this.onerror=null;this.src=\'./img/noimage.jpg\';" />';
			$('#modules_contentViewBox').html(htmlContent);
			//$('#loadingmessage').hide();
		} else {
			$('#modules_contentViewBox').html("Could not identify content!");
			//$('#loadingmessage').hide();
		}
	}
}


/******************************************************************************************
Name: closePdfViewer
Purpose: Change the visibility PDF viewer to HIDE
******************************************************************************************/
//function closePdfViewer() {
    // Somthing to be done
//}


function viewAmFullScreenImage(that) {
	var htmlContent = '';

	var objectKey = $('#'+that.id.replace('ampreview_','')).val();
	if(objectKey.startsWith(s3PrivateUrl)) {
		objectKey = objectKey.replace(s3PrivateUrl, "");
		let destinId = 'img_fsarea';

		getSignedUrl(objectKey, 10).then(url => {
			if(url.startsWith("https://")) {
				htmlContent += '<div class="fullScreenMenuBar" onclick="closeAmFullScreenImage()"><i class="fas fa-times expandCompressBtn"></i></div>';
				htmlContent += '<div style="width:100%; height: 100%" id="'+that.id+'_fs"><img id="'+that.id+'_fs_image" style="width: 100%; max-height: 100%; object-fit: contain;" src="'+url+'" onerror="this.onerror=null;this.src=\'./img/noimage.jpg\';"></div>';
				$('#'+destinId).html(htmlContent);
				initPinchZoom(that.id+'_fs_image');
			}
		});
		// currentState = "viewFullScreenImage";
		$('#'+destinId).show();
	}
}

function closeAmFullScreenImage() {
	$('#img_fsarea').hide();
	shared.currentState = "viewAssetmateForm";
}

/****************************************************************************************************
 Function: openTab
 Purpose: Opens Document or Form tab
****************************************************************************************************/
export function openTab(evt, elemIndex) {
    if ((shared.currentState === "addNewAssetData") || (shared.currentState === "viewAssetmateForm")) {
        if (unsavedData === true) {
            showConfirmDialog({
                message: "Any unsaved data will be lost. Proceed?",
                yesLabel: "Proceed",
                noLabel: "Cancel",
                onYes: () => {
                    console.log("✅ User confirmed tab switch");
                    handleTabSwitch(evt.currentTarget.id, elemIndex);
                },
                onNo: () => {
                    console.log("❌ User cancelled tab switch");
                    // Dialog auto-hides
                }
            });
        } else {
            handleTabSwitch(evt.currentTarget.id, elemIndex);
        }
    } else {
        handleTabSwitch(evt.currentTarget.id, elemIndex);
    }
}

function handleTabSwitch(tabId, elemIndex) {
    var tab = document.getElementById(tabId);
    var linkedContentAreaId = tab.dataset.linkedcontentareaid;
    // Get all elements with class="tabcontent" and hide them
    // var chartAreas = document.getElementsByClassName("chartArea");
    // for (var i=0; i<chartAreas.length; i++) {
    // 	chartAreas[i].style.display = "none";
    // }
    $('.chartArea').hide();
  
    // Get all elements with class="tablinks" and remove the class "active"
    // var tabLinks = document.getElementsByClassName("tabLinks");
    // for (var i=0; i<tabLinks.length; i++) {
    // 	tabLinks[i].classList.remove("active");
    // }
    $('.tabLinks').removeClass("active");
  
    // Show the current tab, and add an "active" class to the button that opened the tab
    document.getElementById(linkedContentAreaId).style.display = "block";
    tab.classList.add("active");

    if(shared.currentRunningApp == 'assetMate') {
        if(elemIndex == 0) {
            $('#assetmateContentListBox').show();
            $('#assetmate_contentViewBox').hide();
            pauseVideos();

        } else if(elemIndex == 1) {
            $('#auditTitleArea').show();
            $('#qrFormListArea').show();
            $("#chartTabArea").show();
            $('#qrFormViewerArea').hide();
            enableAssetmateAdd();
        }
        shared.currentState = "viewAssetmateasset";
    }

    //document.getElementById('moduleContentArea').style.height = ($("#modulesBox").height() - $("#moduleAssetmateNameArea").height() - $(".moduleFooter").height() - $("#chartTabArea").height() - 15) +'px';	// 15 is compensation for paddings which is not being considered in height!
    unsavedData = false;
    highlightHeaderTabMenu("tabLinks", tabId);
}

// Replica of viewContent that works with assetmateContents items
function viewAssetmatePdf(content, destinid) {
    try {
        if (!content || !content.contentUrl) {
            console.error("[viewAssetmateContent] Invalid content:", content);
            $('#' + destinid).html('<div class="formlabel">Content unavailable</div>');
            return;
        }

        var path = content.contentUrl.trim();
        let headerId = destinid.split('_')[0] + 'ModuleHeader';

        // ---------- Header (same structure as viewContent) ----------
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
        htmlContent += '</div>'; // .moduleTextClass
        htmlContent += '</div>'; // .moduleNameArea
        htmlContent += '</div>'; // header wrapper

        htmlContent += '<div id="contentPlayerArea" style="overflow: hidden; position: relative;"><div id="contentPlayer" style="padding-bottom: 20px; height:100%;"></div></div>';

        $('#' + destinid).html(htmlContent);
        fixModuleHeight("modulesModuleHeader, " + headerId + ", footerSection", 20, "contentPlayerArea");

        // ---------- Body renderer (mirrors your routing) ----------
        htmlContent = '';

        // Raw embedded HTML
        if (path.startsWith("<") && path.endsWith(">")) {
            $('#contentPlayer').html(path);

            // Weather widget bootstrap
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
            return;
        }

        // YouTube
        if (path.includes('youtu')) {
            var contUrl = path;
            if (!contUrl.includes("embed")) {
                var contArr = contUrl.split("/");
                var contId = contArr[contArr.length - 1];
                contUrl = "https://www.youtube.com/embed/" + contId;
            }
            htmlContent += '<div class="preview-container"><iframe id="player_content_' + content.id + '" width=100% height=100% src="' + contUrl + '?autoplay=1&controls=1&showinfo=0&loop=1&enablejsapi=1" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div>';
            $("#contentPlayer").html(htmlContent);
            return;
        }

        // Google Slides / Docs (your existing slides embed case)
        if (path.includes("google")) {
            if (!path.includes("embed")) {
                var contArr = path.split("/");
                var contId = contArr[5];
                path = "https://docs.google.com/presentation/d/" + contId + "/embed?start=true&loop=true&delayms=5000&rm=minimal";
            }
            htmlContent += '<iframe src="' + path + '" frameborder="0" width="100%" height="100%" allowfullscreen="true" mozallowfullscreen="true" webkitallowfullscreen="true"></iframe>';
            $('#contentPlayer').html(htmlContent);
            return;
        }

        // Files routing
        // ---- PDF ----
        if (path.includes(".pdf")) {
            if (path.startsWith(s3PrivateUrl)) {
                const objectKey = path.replace(s3PrivateUrl, "");
                getSignedUrl(objectKey, 20).then((signedUrl) => {
                    if (signedUrl && signedUrl.startsWith("https://")) {
                        viewPdfFile(signedUrl, 'contentPlayer');
                    } else if (signedUrl === "file_not_found") {
                        showDialog("This file is expired or deleted!");
                    }
                });
            } else {
                // NOTE: original bug used `url` here; this replica uses `path` correctly.
                viewPdfFile(path, 'contentPlayer');
            }
            return;
        }

        // ---- MP4 ----
        if (path.includes('.mp4')) {
            if (path.startsWith(s3PrivateUrl)) {
                var objectKey = path.replace(s3PrivateUrl, "");
                getSignedUrl(objectKey, 300).then(signedUrl => {
                    if (signedUrl.startsWith("https://")) {
                        htmlContent += '<video id="qrContentVideo" controlsList="nodownload noremoteplayback" controls autoplay muted style="width: 100%;"><source src="' + signedUrl + '" type="video/mp4"></video>';
                        $('#contentPlayer').html(htmlContent);
                        document.getElementById("qrContentVideo").play();
                    } else if (signedUrl == "file_not_found") {
                        showDialog("This file is expired or deleted!");
                    }
                });
            } else {
                htmlContent += '<video id="qrContentVideo" controlsList="nodownload noremoteplayback" controls autoplay muted style="width: 100%;"><source src="' + path + '" type="video/mp4"></video>';
                $('#contentPlayer').html(htmlContent);
                document.getElementById("qrContentVideo").play();
            }
            return;
        }

        // ---- Office docs ----
        if (path.includes('.doc') || path.includes('.ppt') || path.includes('.xls')) {
            if (path.startsWith(s3PrivateUrl)) {
                var objectKey = path.replace(s3PrivateUrl, "");
                getSignedUrl(objectKey, 300).then(signedUrl => {
                    if (signedUrl.startsWith("https://")) {
                        const encodedUrl = encodeURIComponent(signedUrl);
                        const viewerUrl = `https://view.officeapps.live.com/op/embed.aspx?src=${encodedUrl}`;
                        htmlContent += '<iframe src="' + viewerUrl + '" frameborder="0" width="100%" height="100%" allowfullscreen></iframe>';
                        $('#contentPlayer').html(htmlContent);
                    } else if (signedUrl == "file_not_found") {
                        showDialog("This file is expired or deleted!");
                    }
                });
            } else {
                const encodedUrl = encodeURIComponent(path);
                const viewerUrl = `https://view.officeapps.live.com/op/embed.aspx?src=${encodedUrl}`;
                htmlContent += '<iframe src="' + viewerUrl + '" frameborder="0" width="100%" height="100%" allowfullscreen></iframe>';
                $('#contentPlayer').html(htmlContent);
            }
            return;
        }

        // ---- Images ----
        if (path.match(/\.(png|jpg|jpeg|bmp)$/i)) {
            if (path.startsWith(s3PrivateUrl)) {
                var objectKey = path.replace(s3PrivateUrl, "");
                getSignedUrl(objectKey, 10).then(signedUrl => {
                    if (signedUrl.startsWith("https://")) {
                        htmlContent += '<div class="zoomableImage" id="contentImageArea" style="position: relative;">';
                        htmlContent += '<img id="contentContentImage_' + content.id + '" style="width: 100%; max-height: 100%; object-fit: contain;" src="' + signedUrl + '" onerror="this.onerror=null;this.src=\'' + Capacitor.convertFileSrc('img/noimage.jpg') + '\';" />';
                        htmlContent += '<button class="fullscreenBtn" id="enterImageFullscreenBtn" title="Fullscreen" onclick="viewContentFullScreenImage()">⛶</button>';
                        htmlContent += '</div>';

                        htmlContent += '<div class="fullScreenImage" id="fullScreenContentImageArea">';
                        htmlContent += '<img id="contentContentFullScreenImage_' + content.id + '" style="width: 100%; max-height: 100%; object-fit: contain;" src="' + signedUrl + '" />';
                        htmlContent += '<button class="exitFullscreenBtn" id="exitImageFullscreenBtn" title="Exit Fullscreen" onclick="closeContentFullScreenImage()">✕</button>';
                        htmlContent += '</div>';

                        $('#contentPlayer').html(htmlContent);
                        let imageElem = document.getElementById('contentContentImage_' + content.id);
                        imageElem.onload = function () {
                            initPinchZoom('contentContentImage_' + content.id);
                            initPinchZoom('contentContentFullScreenImage_' + content.id);
                        }
                    } else if (signedUrl == "file_not_found") {
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
            return;
        }

        // ---- Fallback ----
        htmlContent += '<div class="moduleDescriptionClass" style="font-size: 1.1em; font-weight: bold; color: var(--secondary-orange); padding: 5px"> Could not identify content type!</div>';
        $('#contentPlayer').html(htmlContent);

    } catch (e) {
        console.error("[viewAssetmateContent] Exception:", e);
        $('#' + destinid).html('<div class="formlabel">Failed to load content</div>');
    }
}




window.viewAssetmate = viewAssetmate;
window.closeAssetmate = closeAssetmate;
window.getAllAssets = getAllAssets;
window.getAssetAtListIndex = getAssetAtListIndex;
window.getAssetmateLocations = getAssetmateLocations;
window.getAssetmateDepartments = getAssetmateDepartments;
window.getAssetmateCategorys = getAssetmateCategorys;
window.searchAssetmateDepartmentLocationCategory = searchAssetmateDepartmentLocationCategory;
window.getAssetsAtSelected = getAssetsAtSelected;
window.getAssetsAtDepartmentLocationCategory = getAssetsAtDepartmentLocationCategory;
window.viewAssetmateasset = viewAssetmateasset;
window.getAudits = getAudits;
window.startNewScan = startNewScan;
window.getMyAudits = getMyAudits;
window.reassignAudit = reassignAudit;
window.forceStartAudit = forceStartAudit;
window.auditNow = auditNow;
window.openTab  = openTab;
window.loadActionButtons = loadActionButtons;
window.closeReassignAudit = closeReassignAudit;
window.viewAssetAndReassign = viewAssetAndReassign;
window.getUsersForAuditReassign = getUsersForAuditReassign;
window.submitReassignAudit = submitReassignAudit;
window.openQRCodeScanner = openQRCodeScanner;
window.handleAssetQrCode = handleAssetQrCode;
window.viewAssetmateasset = viewAssetmateasset;
window.viewAssetmateForm = viewAssetmateForm;
window.disableAssetmateEdit = disableAssetmateEdit;
window.enableAssetmateAdd = enableAssetmateAdd;
window.enableAssetmateEdit = enableAssetmateEdit;
window.addNewAssetData = addNewAssetData;
window.checkAddNewAssetData = checkAddNewAssetData;
window.selectElemOnchangeInit = selectElemOnchangeInit;
window.backAssetmateHandle = backAssetmateHandle;
window.backToQrContentList = backToQrContentList;
window.backToAssetmateList = backToAssetmateList;
window.saveAssetmateFormData = saveAssetmateFormData;
window.displayAssetmateContentAtIndex = displayAssetmateContentAtIndex;
window.displayContent = displayContent;
window.closeAmFullScreenImage = closeAmFullScreenImage;
window.viewAmFullScreenImage = viewAmFullScreenImage;
window.searchAssetmateasset = searchAssetmateasset;