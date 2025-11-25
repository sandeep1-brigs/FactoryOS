import { Filesystem, Directory, Encoding } from "@capacitor/filesystem"
import { Capacitor } from '@capacitor/core';
import { Device } from "@capacitor/device"
import { Http } from '@capacitor-community/http';
import { Network } from '@capacitor/network';
import { App } from '@capacitor/app';
import $ from 'jquery';
import { BarcodeScanner } from '@capacitor-mlkit/barcode-scanning';


import { shared , s3PrivateUrl} from "./globals.js";
import { showDialog, initAppRuntimeMonitor, closeDialogBox, getSignedUrl , initPinchZoom ,  constructUrl, convertVersionVal, fixModuleHeight , highlightHeaderTabMenu , populateImage , startAppIdleTimer , updateAppRuntime} from "./utility.js";
import { displaySection, buildRequestOptions, RequestOptions, isValidResponse, showConfirmDialog } from "./capacitor-welcome.js";
import { viewLogin, apiRequestFailed } from "./auth.js";
import {  exitModules } from "./content";
import { getMenuBar , getNewToken } from "./settings.js";
import { createList } from "./list.js";


var pmprojectList = null;
var currentPmprojectData = null;
var selectedPmproject = null;
var currentPmlabelData = null;
var selectedPmlabel = null;
var contents = [];
var selectedContents = [];
var archiveIds = null;
var shareIds = null;
var searchInputTimeout = null;
let searchType ="";
let selectedName ="";
let selectedId = 0;
var listItems = [];
var unsavedData = false;

function viewPipemark() {
	shared.currentRunningApp = 'pipeMark';

	if (shared.mCustomerDetailsJSON != null) {
		$('#moduleTitle').html("PIPE MARKING");
		displaySection('modulesSection', 'flex', false, true);

		//updateAppRuntime("pipeMark", "on", "ok");
		displayPipemarkMenu();

		$('#modulesMenuArea').show();
		$('#modulesListArea').show();
		$('#modulesDisplayArea').hide();

		let btn = document.getElementById("btnId_view_pmprojects");
			setTimeout(function() {
				btn.click();
			}, 200);
		
	} else { 		
		showDialog("You need to login to access this resource!", "viewLogin('menuProcess')");
	}
}

function exitPipemark() {
	if(shared.mCustomerDetailsJSON == null) {
        startAppIdleTimer();
    }
	contents = [];
	selectedContents = [];
	archiveIds = null;
	shareIds = null;
	searchInputTimeout = null;
	exitModules();
}

function displayPipemarkMenu() {
	var htmlContent = "";
	var pipemarkScreenSource = shared.cmsJSON.cmsJSONdata.pipemarkScreen;

	$.each(pipemarkScreenSource.sectionList, function(key, section) {
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

			htmlContent += '<div class="searchArea"><div class="searchBox" id="pipemark_searchbox"></div></div>';

			htmlContent += '</div>';
		}
	});
	$("#modulesMenuArea").html(htmlContent);

}

function viewPmprojects() {
    viewAllPipemarks();
}

function viewAllPipemarks(pipemarkType = 'All') {
	highlightHeaderTabMenu("menuBtn", "btnId_view_pmprojects");
	searchType = "all";
	$('#pipemark_searchbox').html('<input type="search" class="searchInput" id="pipemark_'+searchType+'_search_input" placeholder="Search '+searchType+'" /><button class="searchBtn" id="pipemark_'+searchType+'_searchbtn" onclick="searchPipemark()"><span class="material-symbols-outlined" style="font-size: 30px; padding: 5px 0;">search</span></button>');
	searchPipemark();
}

function getPipemarkLocations() {
	shared.currentState = "pipemarkLocations";
	shared.currentSourceState = shared.currentState;
	//$("#location_search_input").val("");
	searchType = "location";
	$('#pipemark_searchbox').html('<input type="search" class="searchInput" id="pipemark_'+searchType+'_search_input" placeholder="Search '+searchType+'" /><button class="searchBtn" id="pipemark_'+searchType+'_searchbtn" onclick="searchPipemarkDepartmentLocationCategory()"><span class="material-symbols-outlined" style="font-size: 30px; padding: 5px 0;">search</span></button>');
	searchPipemarkDepartmentLocationCategory();
}

function getPipemarkDepartments() {
	shared.currentState = "pipemarkDepartments";
	shared.currentSourceState = shared.currentState;
	//$("#department_search_input").val("");
	searchType = "department";
	$('#pipemark_searchbox').html('<input type="search" class="searchInput" id="pipemark_'+searchType+'_search_input" placeholder="Search '+searchType+'" /><button class="searchBtn" id="pipemark_'+searchType+'_searchbtn" onclick="searchPipemarkDepartmentLocationCategory()"><span class="material-symbols-outlined" style="font-size: 30px; padding: 5px 0;">search</span></button>');
	searchPipemarkDepartmentLocationCategory();
}

function getPipemarkCategorys() {
	shared.currentState = "pipemarkCategorys";
	shared.currentSourceState = shared.currentState;
	//$("#category_search_input").val("");
	searchType = "category";
	$('#pipemark_searchbox').html('<input type="search" class="searchInput" id="pipemark_'+searchType+'_search_input" placeholder="Search '+searchType+'" /><button class="searchBtn" id="pipemark_'+searchType+'_searchbtn" onclick="searchPipemarkDepartmentLocationCategory()"><span class="material-symbols-outlined" style="font-size: 30px; padding: 5px 0;">search</span></button>');
	searchPipemarkDepartmentLocationCategory();
}

function searchPipemarkDepartmentLocationCategory(pageNumber = 1, pageSize = 50) {
    let type = searchType;
    highlightHeaderTabMenu("menuBtn", "btnId_view_pipemark" + type + "s");

    let searchStr = $("#pipemark_" + type + "_search_input").val();
    if (searchStr == null) { searchStr = ""; }
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
    const url = "/" + type + "s/search" + type + "spaginated";

    buildRequestOptions(constructUrl(url), "GET", data)
        .then(request => {
            return Http.request(request);
        })
        .then(res => {
            if (isValidResponse(res, "search" + type + "spaginated")) {
                const items = res;

                if (items.error !== "invalid_token") {
                    let htmlContent = '';
                    htmlContent += '<div class="searchArea"><div class="searchBox" style="font-size: 1.3em; justify-content: center; text-align: center;">'
                        + type.toUpperCase() + 'S (' + items.totalElements + ')</div></div>';

                    if (items && items.content && items.content.length > 0) {
                        listItems = [];
                        for (let index in items.content) {
                            let item = items.content[index];

                            let description = '<div>' + item.description + '</div><div>Assets: ' + item.assetCount + '</div>';
                            let image = '';
                            if (item.image !== undefined && item.image !== null && item.image.length > 0) {
                                image = item.image;
                            } else {
                                if (type === "asset") {
                                    image = '<span class="material-symbols-outlined ticketStyleMaterializeIcon">notification_important</span>';
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
                                clickAction: "getPipemarksAtSelected('" + item.id + "', '" + item.name + "')"
                            };
                            listItems.push(itemJson);

                            if (index == items.content.length - 1) {
                                createList(
                                    "department",
                                    htmlContent,
                                    listItems,
                                    items.pageable,
                                    items.totalPages,
                                    "modulesListBox",
                                    "getProcessAtListIndex",
                                    "searchPipemarkDepartmentLocationCategory",
                                    "ticketStyle"
                                );
                            }
                        }
                    } else {
                        htmlContent += '<div class="formlabel">No ' + type + 's found</div>';
                        $('#modulesListBox').html(htmlContent);
                    }
                } else {
                    // Token expired
                    getNewToken("searchPipemarkDepartmentLocationCategory(" + type + ")");
                }
            }
        })
        .catch(err => {
            apiRequestFailed(err, "search" + type + "spaginated");
            console.error("Search Pipemark Department/Location/Category failed!", err);
        });
}

function getPipemarksAtSelected(id, name) {
	selectedId = id;
	selectedName = name;
	getPipemarksAtDepartmentLocationCategory();
}

function getPipemarksAtDepartmentLocationCategory(pageNumber = 1, pageSize = 50) {
    $('#modulesMenuArea').show();
    $('#modulesListArea').show();
    $('#modulesDisplayArea').hide();
    $('#pipemark_searchbox').html('');
    fixModuleHeight("modulesModuleHeader, modulesMenuArea, footerSection", 20, "modulesListArea");

    let type = searchType;   // all / department / location / category
    let id = selectedId;
    shared.currentState = type + "pmprojects";
    shared.currentSourceState = shared.currentState;

    const url = "/pmprojects/getpmprojectssat" + type + "paginated";
    let data = {};

    if (type === "department") {
        data = { token: shared.mCustomerDetailsJSON.token, departmentId: id, page: pageNumber, size: pageSize };
    } else if (type === "location") {
        data = { token: shared.mCustomerDetailsJSON.token, locationId: id, page: pageNumber, size: pageSize };
    } else if (type === "category") {
        data = { token: shared.mCustomerDetailsJSON.token, categoryId: id, page: pageNumber, size: pageSize };
    }

    buildRequestOptions(constructUrl(url), "GET", data)
        .then(request => {
            return Http.request(request);
        })
        .then(res => {
            if (isValidResponse(res, url)) {
                if (res.error !== "invalid_token") {
                    pmprojectList = res;
                    createPipemarkList(type);
                } else {
                    // Token expired
                    getNewToken("getSitesAtDepartment(" + department + ")");
                }
            }
        })
        .catch(err => {
            apiRequestFailed(err, "getpipemarkatdepartmentpaginated");
            console.error("Fetching Pipemarks at " + type + " failed!", err);
        });
}

function searchPipemark(pageNumber = 1, pageSize = 50) {
    // UI handling (unchanged)
    $('#modulesMenuArea').show();
    $('#modulesListArea').show();
    $('#modulesDisplayArea').hide();
    fixModuleHeight("modulesModuleHeader, modulesMenuArea, footerSection", 20, "modulesListArea");

    let type = searchType;
    highlightHeaderTabMenu("menuBtn", "btnId_view_pmprojects");

    shared.currentState = "searchPipemark";
    shared.currentSourceState = shared.currentState;

    let searchStr = $("#pipemark_" + type + "_search_input").val();

    const data = { token: shared.mCustomerDetailsJSON.token, searchStr: searchStr, page: pageNumber, size: pageSize };

    // Helper: normalize the various responses
    function normalizeResponseForPayload(res) {
        if (!res) return res;

        // If there's no res.data, assume this is already the jqXHR-like payload
        if (typeof res.data === "undefined") {
            return res;
        }

        // Work with res.data now
        let d = res.data;

        // If data is a JSON string, try to parse it
        if (typeof d === "string") {
            try { d = JSON.parse(d); } catch (e) { /* leave as-is if parse fails */ }
        }

        // If d contains an inner .data property (common nested pattern), unwrap it
        if (d && typeof d === "object" && typeof d.data !== "undefined") {
            let inner = d.data;
            if (typeof inner === "string") {
                try { inner = JSON.parse(inner); } catch (e) { /* leave as-is if parse fails */ }
            }
            return inner;
        }

        // Otherwise d is the payload
        return d;
    }

    buildRequestOptions(constructUrl("/pmprojects/searchpmprojectpaginated"), "GET", data)
        .then(request => Http.request(request))
        .then(res => {
            // Leave isValidResponse check unchanged (it expects the full response object)
            if (isValidResponse(res, "searchpmprojectpaginated")) {
                const payload = normalizeResponseForPayload(res);

                // If payload indicates token problem, regenerate token (keeps behavior safe)
                if (payload && payload.error === "invalid_token") {
                    getNewToken("searchPipemark()");
                    return;
                }

                // Assign payload exactly like the original Cordova code did
                pmprojectList = payload;
                createPipemarkList(type);
            } else {
                // Token expired or invalid according to isValidResponse
                getNewToken("searchPipemark()");
            }
        })
        .catch(err => {
            apiRequestFailed(err, "searchpmprojectpaginated");
            console.error("Fetching pipemark search failed!", err);
        });
}

function createPipemarkList(type) {

	let pmprojects = pmprojectList.content;
    let totalElements = pmprojectList.totalElements;
	let totalPages = pmprojectList.totalPages;
    let pageable = pmprojectList.pageable;		
	if(pageable == undefined || pageable == null) {		// Not pageable
        pmprojects = pmprojectList;
		totalElements = pmprojectList.length;
		totalPages = 1;
		pageable = null;
	}

	let items = pmprojects;
	var htmlContent = '';
	let title = type;
	if(type == 'department' || type == 'location' || type == 'category') {
		title = type+': '+selectedName;
	}
	htmlContent += '<div class="searchArea"><div class="searchBox" style="font-size: 1.3em; justify-content: center; text-align: center;">'+title.toUpperCase()+' PROJECTS ('+totalElements+')</div></div>';

	if(items != null && items.length > 0) {
		listItems = [];
		for(var index in items) {
			let item = items[index];

			let description = '';
			let image = '';
			let states = [];
			let actions = [];
			let activeActions = [];

            description += '<div>'+item.description+'</div>';
            description += '<div>Creator 1: '+item.projectCreator1Name+'</div>';
            if(item.projectCreator2Name != null && item.projectCreator2Name.length > 0) {
                description += '<div>Creator 2: '+item.projectCreator2Name+'</div>';
            }
            if(item.projectCreator3Name != null && item.projectCreator3Name.length > 0) {
                description += '<div>Creator 3: '+item.projectCreator3Name+'</div>';
            }
            description += '<div>Reviewer 1: '+item.projectReviewer1Name+'</div>';
            if(item.projectReviewer2Name != null && item.projectReviewer2Name.length > 0) {
                description += '<div>Reviewer 2: '+item.projectReviewer2Name+'</div>';
            }
            if(item.projectReviewer3Name != null && item.projectReviewer3Name.length > 0) {
                description += '<div>Reviewer 3: '+item.projectReviewer3Name+'</div>';
            }

            let userId = shared.mCustomerDetailsJSON.id;
            if(item.projectStatus == 'Audit') {
                states.push({"text":"Pending Audit", "type": "infoState"});
                if(item.projectCreator1Id == userId || item.projectCreator2Id == userId || item.projectCreator3Id == userId) {
                    actions.push({"text": "Create", "type":"button",  "actionClass": "activeActionWideGreen", "act":"displayPmproject("+index+", 'Create')"});
                    activeActions.push({"text": "Create"});
                } else {
                    actions.push({"text": "View", "type":"button",  "actionClass": "activeActionWideBlue", "act":"displayPmproject("+index+", 'View')"});
                    activeActions.push({"text": "View"});
                }
            } else if(item.projectStatus == 'Review') {
                states.push({"text":"Pending Review", "type": "infoState"});
                if(item.projectReviewer1Id == userId || item.projectReviewer2Id == userId || item.projectReviewer3Id == userId) {
                    actions.push({"text": "Review", "type":"button",  "actionClass": "activeActionWideOrange", "act":"displayPmproject("+index+", 'Review')"});
                    activeActions.push({"text": "Review"});
                } else {
                    actions.push({"text": "View", "type":"button",  "actionClass": "activeActionWideBlue", "act":"displayPmproject("+index+", 'View')"});
                    activeActions.push({"text": "View"});
                }
            } else {
                if(item.projectStatus != null) {
                    states.push({"text":item.projectStatus, "type": "infoState"});
                }
                actions.push({"text": "View", "type":"button",  "actionClass": "activeActionWideBlue", "act":"displayPmproject("+index+", 'View')"});
                activeActions.push({"text": "View"});
            }

            if(item.locationName != null && item.locationName.length > 0) {
                description += '<div>Location: '+item.locationName+'</div>';
            }
            if(item.departmentName != null && item.departmentName.length > 0) {
                description += '<div>Department: '+item.departmentName+'</div>';
            }
            if(item.categoryName != null && item.categoryName.length > 0) {
                description += '<div>Category: '+item.categoryName+'</div>';
            }
            image = '<span class="material-symbols-outlined ticketStyleMaterializeIcon">valve</span>';

            //let itemJson = {"id": item.id, "image": item.image, "title":item.name, "description":description};
            let itemJson = {"id": item.id, "image": image, "title":item.pmprojectName, "description":description, "clickAction":"displayPmproject("+index+", 'View')", "states":states, "actions":actions, "activeActions":activeActions};

            listItems.push(itemJson);
            if(index == items.length-1) {
                createList("site", htmlContent, listItems, pageable, totalPages, "modulesListBox", "getProcessAtListIndex", "searchPmproject", "ticketStyle");
                
            }
        }
	} else {
		htmlContent += '<div class="formlabel">No Pipe Marking Project found</div>';
		$('#modulesListBox').html(htmlContent);
	}
}


async function scanPipemarkQRCode() {

    if (shared.mCustomerDetailsJSON == null) {
        showDialog("You need to login to access this resource!", "viewLogin('menuProcess')");
        return;
    }

    try {
        // original logic
        updateAppRuntime("pipeMark", "on", "ok");

        let displayOrientation = "portrait";
        if (window.screenWidth > window.screenHeight) {
            displayOrientation = "landscape";
        }

        shared.currentState = "viewScanner";

        // 🔹 Request camera permission
        const perm = await BarcodeScanner.requestPermissions();
        if (perm.camera !== "granted") {
            showDialog("Camera permission denied. Please allow camera access.");
            return;
        }

        // 🔹 Start scanning
        const result = await BarcodeScanner.scan({
            formats: ['qr_code', 'pdf417'],
        });

        console.log("Scan result:", result);

        if (!result.barcodes || result.barcodes.length === 0) {
            console.log("No barcode detected.");
            return;
        }

        const codeData = result.barcodes[0].rawValue;
        console.log("Scanned Value:", codeData);

        // ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
        // 🔥 ORIGINAL LOGIC PRESERVED
        // ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
        if (codeData && codeData.startsWith('PM')) {
            let qrData = codeData.replace('PM', '');
            if (!isNaN(qrData)) {
                handlePipemarkQrCode(qrData);
            }
        }

    } catch (err) {
        alert("Scanning failed: " + err);
        console.error(err);
    }
}


function handlePipemarkQrCode(codeId) {
    // $('#loadingmessage').show();

    if (codeId != null) {
        const data = { token: shared.mCustomerDetailsJSON.token, pmlabelId: codeId };
        const url = "/pmlabels/restgetpmlabelbyid";

        buildRequestOptions(constructUrl(url), "GET", data)
            .then(request => {
                return Http.request(request);
            })
            .then(res => {
                if (isValidResponse(res, "restgetpmlabelbyid")) {
                    if (res != null) {
                        if (res.error !== "invalid_token") { // Token is valid
                            var pmlabelData = res;
                            if (pmlabelData.pmlabel != null) {
                                populatePmlabelData(pmlabelData);
                                // $('#loadingmessage').hide();
                            } else {
                                showDialog('No records found!');
                            }
                        } else { // Token expired
                            // $('#loadingmessage').hide();
                            getNewToken("handlePipemarkQrCode(" + codeId + ")");
                        }
                    }
                }
            })
            .catch(err => {
                apiRequestFailed(err, "getpmlabelbyqrcode");
                console.error("Fetching Pipemark QR Code failed!", err);
                // $('#loadingmessage').hide();
            });
    } else {
        // $('#loadingmessage').hide();
    }
}

function displayPmproject(pmprojectIndex, task) {
    let pmprojects = pmprojectList.content;
    let pageable = pmprojectList.pageable;		
	if(pageable == undefined || pageable == null) {		// Not pageable
        pmprojects = pmprojectList;
	}
    populatePmprojectData(pmprojects[pmprojectIndex].id, task);
}

async function populatePmprojectData(projectId) {
    let htmlContent = "";
    const data = { token: shared.mCustomerDetailsJSON.token, pmprojectId: projectId };

    try {
        const request = await buildRequestOptions(constructUrl("/pmprojects/restgetpmprojectbyid"), "GET", data);

        Http.request(request).then(res => {
            if (isValidResponse(res, "restgetpmlabelbyid")) {
                if (res != null) {
                    if (res.error !== "invalid_token") {  // Token still valid
                        currentPmprojectData = res;
                        selectedPmproject = currentPmprojectData.pmproject;

                        htmlContent += '<div class="projectContentArea">';
                            
                            htmlContent += '<div class="moduleNameArea" id="moduleLotomateNameArea">';
                                htmlContent += '<div style="display: flex; width: 100%; justify-content: center; align-items: center;" onclick="event.stopPropagation(); editPmproject(' + selectedPmproject.id + ');">';
                                    htmlContent += '<div class="displayTitleClass">' + selectedPmproject.pmprojectName + '</div>';
                                    htmlContent += '<span class="displayTitleClass" style="margin-left: 10px;"><i class="fas fa-pencil-alt"></i></span>';
                                htmlContent += '</div>';
                                htmlContent += '<div class="moduleDescriptionClass">' + selectedPmproject.description + '</div>';
                            htmlContent += '</div>';
                            htmlContent += '<hr>';
                            htmlContent += '<input id="pmprojectId" type="hidden" value=' + selectedPmproject.id + ' />';

                            htmlContent += '<div style="display: grid; grid-template-columns: 40% 60%; margin: 0 10px;">';
                            htmlContent += '<div class="formlabel">Project Date</div>';
                            htmlContent += '<div class="formvalue">' + selectedPmproject.projectDate + '</div>';
                            htmlContent += '<div class="formlabel">Installation Date</div>';
                            htmlContent += '<div class="formvalue">' + selectedPmproject.installationDate + '</div>';
                            htmlContent += '<div class="formlabel">Warranty Date</div>';
                            htmlContent += '<div class="formvalue">' + selectedPmproject.warrantyDate + '</div>';
                            htmlContent += '<div class="formlabel">Created</div>';
                            htmlContent += '<div class="formvalue">' + selectedPmproject.createdBy + ' - ' + selectedPmproject.createdOn + '</div>';
                            htmlContent += '<div class="formlabel">Modified</div>';
                            htmlContent += '<div class="formvalue">' + selectedPmproject.modifiedBy + ' - ' + selectedPmproject.modifiedOn + '</div>';
                            htmlContent += '</div>';

                            htmlContent += '<div style="width: 100%; margin: 10px 0; display: flex; justify-content: space-between; background-color: rgb(80, 55, 120);">';
                                htmlContent += '<div class="displayTitleClass" style="padding: 0 0 0 10px; color: rgb(255,255,255); line-height: 1.7;">Labels</div>';
                                htmlContent += '<div class="moduleButton" id="pmAddNewButton1" onclick="event.stopPropagation(); addNewLabel();"><span><i class="fas fa-plus"></i></span></div>';
                            htmlContent += '</div>';

                            if (currentPmprojectData.pmlabels != null && currentPmprojectData.pmlabels.length > 0) {
                                htmlContent += '<table style="margin: 0 1%; width: 98%;">';
                                htmlContent += '<thead>';
                                    htmlContent += '<tr>';
                                        htmlContent += '<th class="tableHeader" style="width: 10%;">Sl</th>';
                                        htmlContent += '<th class="tableHeader" style="width: 25%;">Name</th>';
                                        htmlContent += '<th class="tableHeader" style="width: 20%;">Content</th>';
                                        htmlContent += '<th class="tableHeader" style="width: 35%;">From-To</th>';
                                        htmlContent += '<th class="tableHeader" style="width: 10%;">Dia</th>';
                                    htmlContent += '</tr>';
                                htmlContent += '</thead>';

                                htmlContent += '<tbody>';
                                for (let count = 0; count < currentPmprojectData.pmlabels.length; count++) {
                                    let label = currentPmprojectData.pmlabels[count];
                                    let indexVal = count + 1;
                                    htmlContent += '<tr onclick="viewLabelDetails(' + count + ')">';
                                        htmlContent += '<td class="tableBody">' + indexVal + '</td>';
                                        htmlContent += '<td class="tableBody clickable">' + label.pmlabelName + '</td>';
                                        htmlContent += '<td class="tableBody clickable">' + label.contentName + '</td>';
                                        htmlContent += '<td class="tableBody">' + label.pmfrom + ' - ' + label.pmto + '</td>';
                                        htmlContent += '<td class="tableBody">' + label.pipeDia + '</td>';
                                    htmlContent += '</tr>';

                                    if (count === currentPmprojectData.pmlabels.length - 1) {
                                        htmlContent += '</tbody>';
                                        htmlContent += '</table>';
                                        htmlContent += '</div>';

                                        htmlContent += '<hr style="margin: 10px 0;">';

                                        htmlContent += '<div style="width: 100%; margin: 0 10px; display: flex; justify-content: space-around;">';
                                            htmlContent += '<div class="moduleButton" id="pmAddNewButton2" onclick="event.stopPropagation(); addNewLabel();"><span><i class="fas fa-plus"></i></span></div>';
                                        htmlContent += '</div>';

                                        $('#modulesDisplayArea').html(htmlContent);
                                        fixModuleHeight("modulesModuleHeader, footerSection", 20, "modulesDisplayArea");
                                    }
                                }
                            } else {
                                // No labels found
                                htmlContent += '</div>';
                                htmlContent += '<div style="margin: 0 1%;">No labels found!</div>';
                                
                                htmlContent += '<hr style="margin: 10px 0;">';
                                
                                htmlContent += '<div style="width: 100%; margin: 0 10px; display: flex; justify-content: space-around;">';
                                    htmlContent += '<div class="moduleButton" id="pmAddNewButton2" onclick="event.stopPropagation(); addNewLabel();"><span><i class="fas fa-plus"></i></span></div>';
                                htmlContent += '</div>';

                                $('#modulesDisplayArea').html(htmlContent);
                                fixModuleHeight("modulesModuleHeader, footerSection", 20, "modulesDisplayArea");
                            }
                        
                    } else { // Token expired
                        getNewToken("populatePmprojectData(" + projectId + ")");
                    }
                }
            }
        }).catch(err => {
            apiRequestFailed(err, "getpmlabelbyqrcode");
        });

        showPmprojectView();
    } catch (err) {
        console.warn("Request aborted due to missing requestOptions.", err);
    }
}

async function editPmproject(projectId) {
    const data = { token: shared.mCustomerDetailsJSON.token, pmprojectId: projectId };

    try {
        const request = await buildRequestOptions(
            constructUrl("/pmprojects/restgetpmprojectbyid"),
            "GET",
            data
        );

        Http.request(request).then(res => {
            if (isValidResponse(res, "restgetpmprojectbyid")) {
                if (res != null) {
                    if (res.error !== "invalid_token") { // Token still valid
                        currentPmprojectData = res;
                        selectedPmproject = res.pmproject;
                        let userList = res.users;

                        viewPmprojectForm(selectedPmproject, userList);

                    } else { // Token expired
                        getNewToken("editPmproject(" + projectId + ")");
                    }
                }
            }
        }).catch(err => {
            apiRequestFailed(err, "restgetpmprojectbyid");
        });

    } catch (err) {
        console.warn("Request aborted due to missing requestOptions.", err);
    }
}

async function addPmproject() {
    const data = { token: shared.mCustomerDetailsJSON.token };

    try {
        const request = await buildRequestOptions(
            constructUrl("/pmprojects/restgetblankpmproject"),
            "GET",
            data
        );

        Http.request(request).then(res => {
            if (isValidResponse(res, "restgetblankpmproject")) {
                if (res != null) {
                    if (res.error !== "invalid_token") { // Token still valid
                        if (res.error === "no_privilege") {
                            showDialog("You don't have privilege to perform this task!");
                        } else {
                            selectedPmproject = res.pmproject;
                            let userList = res.users;
                            viewPmprojectForm(selectedPmproject, userList);
                        }
                    } else { // Token expired
                        getNewToken("addPmproject()");
                    }
                }
            }
        }).catch(err => {
            apiRequestFailed(err, "restgetblankpmproject");
        });

    } catch (err) {
        console.warn("Request aborted due to missing requestOptions.", err);
    }
}

function viewPmprojectForm(pmproject, users) {
    unsavedData = true;
    let allStandards = ['ANSI', 'IS', 'EN'];

    var htmlContent = "";
    htmlContent += '<div class="projectContentArea">';
        
        htmlContent += '<div class="moduleNameArea" id="moduleLotomateNameArea">';
            htmlContent += '<div class="displayTitleClass">PROJECT DETAIL</div>';
        htmlContent += '</div>';
        htmlContent += '<hr>';
        htmlContent += '<input id="pmprojectId" type="hidden" value='+pmproject.id+' />';

        
        htmlContent += '<div style="display: grid; grid-template-columns: 40% 60%; margin: 0 10px;">';
        htmlContent += '<div class="formlabel">Project Name</div>';
        htmlContent += '<input type="text" class="formvalue" id="projectname" value="'+pmproject.pmprojectName+'" />';
        htmlContent += '<div class="formlabel">Description</div>';
        htmlContent += '<input type="text" class="formvalue" id="description" value="'+pmproject.description+'" />';

        htmlContent += '<div class="formlabel">Standard</div>';
        htmlContent += '<select class="formvalue" id="standard">';
            htmlContent += '<option value="">Select Standard</option>';
            for(var standard of allStandards) {
                if(standard == pmproject.standard) {
                    htmlContent += '<option value="'+standard+'" selected>'+standard+'</option>';
                } else {
                    htmlContent += '<option value="'+standard+'">'+standard+'</option>';
                }
            }
        htmlContent += '</select>';

        htmlContent += '<div class="formlabel">Creator 1</div>';
        htmlContent += '<select class="formvalue" id="projectcreator1">';
            htmlContent += '<option value="">Select Creator 1</option>';
            for(var user of users) {
                if(pmproject.projectCreator1 != null) {
                    if(user.id == pmproject.projectCreator1) {
                        htmlContent += '<option value="'+user.id+'" selected>'+user.id+' -- '+user.userName+' -- '+user.firstName+' '+user.lastName+'</option>';
                    } else {
                        htmlContent += '<option value="'+user.id+'">'+user.id+' -- '+user.userName+' -- '+user.firstName+' '+user.lastName+'</option>';
                    }
                } else {
                    htmlContent += '<option value="'+user.id+'">'+user.id+' -- '+user.userName+' -- '+user.firstName+' '+user.lastName+'</option>';
                }
            }
        htmlContent += '</select>';

        htmlContent += '<div class="formlabel">Creator 2</div>';
        htmlContent += '<select class="formvalue" id="projectcreator2">';
            htmlContent += '<option value="">Select Creator 2</option>';
            for(user of users) {
                if(pmproject.projectCreator2 != null) {
                    if(user.id == pmproject.projectCreator2) {
                        htmlContent += '<option value="'+user.id+'" selected>'+user.id+' -- '+user.userName+' -- '+user.firstName+' '+user.lastName+'</option>';
                    } else {
                        htmlContent += '<option value="'+user.id+'">'+user.id+' -- '+user.userName+' -- '+user.firstName+' '+user.lastName+'</option>';
                    }
                } else {
                    htmlContent += '<option value="'+user.id+'">'+user.id+' -- '+user.userName+' -- '+user.firstName+' '+user.lastName+'</option>';
                }
            }
        htmlContent += '</select>';

        htmlContent += '<div class="formlabel">Creator 3</div>';
        htmlContent += '<select class="formvalue" id="projectcreator3">';
            htmlContent += '<option value="">Select Creator 3</option>';
            for(user of users) {
                if(pmproject.projectCreator3 != null) {
                    if(user.id == pmproject.projectCreator3) {
                        htmlContent += '<option value="'+user.id+'" selected>'+user.id+' -- '+user.userName+' -- '+user.firstName+' '+user.lastName+'</option>';
                    } else {
                        htmlContent += '<option value="'+user.id+'">'+user.id+' -- '+user.userName+' -- '+user.firstName+' '+user.lastName+'</option>';
                    }
                } else {
                    htmlContent += '<option value="'+user.id+'">'+user.id+' -- '+user.userName+' -- '+user.firstName+' '+user.lastName+'</option>';
                }
            }
        htmlContent += '</select>';

        htmlContent += '<div class="formlabel">Reviewer 1</div>';
        htmlContent += '<select class="formvalue" id="projectreviewer1">';
            htmlContent += '<option value="">Select Reviewer 1</option>';
            for(user of users) {
                if(pmproject.projectReviewer1 != null) {
                    if(user.id == pmproject.projectReviewer1) {
                        htmlContent += '<option value="'+user.id+'" selected>'+user.id+' -- '+user.userName+' -- '+user.firstName+' '+user.lastName+'</option>';
                    } else {
                        htmlContent += '<option value="'+user.id+'">'+user.id+' -- '+user.userName+' -- '+user.firstName+' '+user.lastName+'</option>';
                    }
                } else {
                    htmlContent += '<option value="'+user.id+'">'+user.id+' -- '+user.userName+' -- '+user.firstName+' '+user.lastName+'</option>';
                }
            }
        htmlContent += '</select>';

        htmlContent += '<div class="formlabel">Reviewer 2</div>';
        htmlContent += '<select class="formvalue" id="projectreviewer2">';
            htmlContent += '<option value="">Select Reviewer 2</option>';
            for(user of users) {
                if(pmproject.projectReviewer2 != null) {
                    if(user.id == pmproject.projectReviewer2) {
                        htmlContent += '<option value="'+user.id+'" selected>'+user.id+' -- '+user.userName+' -- '+user.firstName+' '+user.lastName+'</option>';
                    } else {
                        htmlContent += '<option value="'+user.id+'">'+user.id+' -- '+user.userName+' -- '+user.firstName+' '+user.lastName+'</option>';
                    }
                } else {
                    htmlContent += '<option value="'+user.id+'">'+user.id+' -- '+user.userName+' -- '+user.firstName+' '+user.lastName+'</option>';
                }
            }
        htmlContent += '</select>';

        htmlContent += '<div class="formlabel">Reviewer 3</div>';
        htmlContent += '<select class="formvalue" id="projectreviewer3">';
            htmlContent += '<option value="">Select Reviewer 3</option>';
            for(user of users) {
                if(pmproject.projectReviewer3 != null) {
                    if(user.id == pmproject.projectReviewer3) {
                        htmlContent += '<option value="'+user.id+'" selected>'+user.id+' -- '+user.userName+' -- '+user.firstName+' '+user.lastName+'</option>';
                    } else {
                        htmlContent += '<option value="'+user.id+'">'+user.id+' -- '+user.userName+' -- '+user.firstName+' '+user.lastName+'</option>';
                    }
                } else {
                    htmlContent += '<option value="'+user.id+'">'+user.id+' -- '+user.userName+' -- '+user.firstName+' '+user.lastName+'</option>';
                }
            }
        htmlContent += '</select>';

        htmlContent += '<div class="formlabel">Bracket</div>';
        htmlContent += '<input type="checkbox" class="formvalue" id="bracketpresent" value='+pmproject.bracketPresent+' />';
        htmlContent += '<div class="formlabel">GHS Present</div>';
        htmlContent += '<input type="checkbox" class="formvalue" id="ghspresent" value='+pmproject.ghsPresent+' />';
        htmlContent += '<div class="formlabel">Hazard Icon</div>';
        htmlContent += '<input type="checkbox" class="formvalue" id="hazardiconpresent" value='+pmproject.hazardIconPresent+' />';
        htmlContent += '<div class="formlabel">QR Code</div>';
        htmlContent += '<input type="checkbox" class="formvalue" id="qrcodepresent" value='+pmproject.qrCodePresent+' />';
        htmlContent += '<div class="formlabel">Project Date</div>';
        htmlContent += '<input type="datetime-local" class="formvalue" id="projectdate" value='+pmproject.projectDate+' />';
        htmlContent += '<div class="formlabel">Installation Date</div>';
        htmlContent += '<input type="datetime-local" class="formvalue" id="installationdate" value='+pmproject.installationDate+' />';
        htmlContent += '<div class="formlabel">Warranty Date</div>';
        htmlContent += '<input type="datetime-local" class="formvalue" id="warrantydate" value='+pmproject.warrantyDate+' />';
    htmlContent += '</div>';

    htmlContent += '<div style="width: 100%; margin-top: 15px; display: flex; justify-content: space-around;">';
        htmlContent += '<div class="btnStyle" style="background-color: rgb(0,67,255);" onclick="saveProject()">SAVE</div>';
    htmlContent += '</div>';

    $('#modulesDisplayArea').html(htmlContent);
    showPmprojectView();
}

function saveProject() {
    getProjectFormData("save");
}

function getProjectFormData(execute) {

	let pmproject = selectedPmproject;
	
	//pmproject.pmprojectId = parseInt($('#pmprojectId').val());
	pmproject.pmprojectName = $('#projectname').val();
	pmproject.description = $('#description').val();
	pmproject.projectCreator1 = parseInt($('#projectcreator1').val());
    pmproject.projectCreator2 = parseInt($('#projectcreator2').val());
    pmproject.projectCreator3 = parseInt($('#projectcreator3').val());
    pmproject.projectReviewer1 = parseInt($('#projectreviewer1').val());
    pmproject.projectReviewer2 = parseInt($('#projectreviewer2').val());
    pmproject.projectReviewer3 = parseInt($('#projectreviewer3').val());
    pmproject.standard = $('#standard').val();
    pmproject.bracketPresent = $('#bracketpresent').val();
    pmproject.ghsPresent = $('#ghspresent').val();
    pmproject.hazardIconPresent = $('#hazardiconpresent').val();
    pmproject.qrCodePresent = $('#qrcodepresent').val();
    pmproject.projectDate = $('#projectdate').val();
    pmproject.installationDate = $('#installationdate').val();
    pmproject.warrantyDate = $('#warrantydate').val();

	pmproject.enabled = true;
	
    if(execute == 'save') {
        saveProjectExecute(pmproject);
    }

}

function saveProjectExecute(pmproject) {
    selectedPmproject = pmproject;

    const data = { 
        token: shared.mCustomerDetailsJSON.token, 
        pmproject: JSON.stringify(selectedPmproject) 
    };

    RequestOptions(constructUrl("/pmprojects/restsavepmproject"), "POST", data)
        .then(request => {
            Http.request(request)
                .then(res => {
                    if (isValidResponse(res, "restsavepmproject") && res) {
                        if (res.error !== "invalid_token") { // Check if token is valid
                            unsavedData = false;
                            viewPmprojects();
                        } else { 
                            // Token expired -> regenerate and retry
                            getNewToken("saveProject()");
                        }
                    }
                })
                .catch(err => {
                    console.error("Saving PM Project failed!", err);
                    apiRequestFailed(err, "restsavepmproject");
                });
        })
        .catch(err => {
            console.warn("Request aborted due to missing requestOptions.", err);
        });
}

function addNewLabel() {
    const data = { 
        token: shared.mCustomerDetailsJSON.token, 
        pmprojectId: selectedPmproject.id 
    };

    buildRequestOptions(constructUrl("/pmlabels/restgetblankpmlabel"), "GET", data)
        .then(request => {
            Http.request(request)
                .then(res => {
                    if (isValidResponse(res, "restgetblankpmlabel") && res) {
                        if (res.error !== "invalid_token") {  // Check if the token is valid
                            currentPmlabelData = res;
                            populatePmlabelData(currentPmlabelData);
                        } else {
                            // Token expired -> regenerate and retry
                            getNewToken("addNewLabel()");
                        }
                    }
                })
                .catch(err => {
                    console.error("Fetching blank PM label failed!", err);
                    apiRequestFailed(err, "restgetblankpmlabel");
                });
        })
        .catch(err => {
            console.warn("Request aborted due to missing requestOptions.", err);
        });
}

function viewLabelDetails(pmlabelIndex) {
    const data = { 
        token: shared.mCustomerDetailsJSON.token, 
        pmlabelId: currentPmprojectData.pmlabels[pmlabelIndex].id 
    };

    buildRequestOptions(constructUrl("/pmlabels/restgetpmlabelbyid"), "GET", data)
        .then(request => {
            Http.request(request)
                .then(res => {
                    if (isValidResponse(res, "restgetpmlabelbyid") && res) {
                        if (res.error !== "invalid_token") {  // Token still valid
                            currentPmlabelData = res;
                            populatePmlabelData(currentPmlabelData);
                        } else {
                            // Token expired -> regenerate token and retry
                            getNewToken(`viewLabelDetails(${pmlabelIndex})`);
                        }
                    }
                })
                .catch(err => {
                    console.error("Fetching PM label by ID failed!", err);
                    apiRequestFailed(err, "restgetpmlabelbyid");
                });
        })
        .catch(err => {
            console.warn("Request aborted due to missing requestOptions.", err);
        });
}

function populatePmlabelData(pmlabelData) {
    
    shared.currentSourceState = shared.currentState;
    unsavedData = true;

    var htmlContent = "";
    let arrowTypes = [
        "Full circumference arrows, both sides",
        "Arrows beside label, both sides</option>",
        "Arrows beside label, once side</option>"
    ]

    selectedPmlabel = pmlabelData.pmlabel
    let pmlabelhazard = pmlabelData.pmlabelhazard;
    let allPmhazards = pmlabelData.pmhazards;
    let allPmghss = pmlabelData.pmghss;
    let pmlabelghss = pmlabelData.pmlabelghss;

    htmlContent += '<div class="projectContentArea">';
        
        htmlContent += '<div class="moduleNameArea" id="moduleLotomateNameArea">';
        htmlContent += '<div class="displayTitleClass">LABEL DETAIL</div>';
        htmlContent += '</div>';
        htmlContent += '<hr>';
        htmlContent += '<input id="labelId" type="hidden" value='+selectedPmlabel.id+' />';

        
        htmlContent += '<div style="display: grid; grid-template-columns: 40% 60%; margin: 0 10px;">';
            htmlContent += '<div class="formlabel">Name</div>';
            htmlContent += '<input type="text" id="labelname" class="formvalue" value="'+selectedPmlabel.pmlabelName+'" />';
            htmlContent += '<div class="formlabel">Description</div>';
            htmlContent += '<input type="text" id="description" class="formvalue" value="'+selectedPmlabel.description+'" />';
            htmlContent += '<div class="formlabel">Content</div>';
            htmlContent += '<input type="text" id="contentname" class="formvalue" onchange="updateSizes()" value="'+selectedPmlabel.contentName+'" />';
            htmlContent += '<div class="formlabel">Pipe Dia</div>';
            htmlContent += '<input type="number" id="pipedia" step=0.1 min=1 max=127 class="formvalue" onchange="updateSizes()" value="'+selectedPmlabel.pipeDia+'" />';
            htmlContent += '<div class="formlabel">From</div>';
            htmlContent += '<input type="text" id="pmfrom" class="formvalue" onchange="updateSizes()" value="'+selectedPmlabel.pmfrom+'" />';
            htmlContent += '<div class="formlabel">To</div>';
            htmlContent += '<input type="text" id="pmto" class="formvalue" onchange="updateSizes()" value="'+selectedPmlabel.pmto+'" />';
            htmlContent += '<div class="formlabel">Hazard</div>';
            htmlContent += '<select class="formvalue" id="pmhazardid"">';
                htmlContent += '<option value="">Select Hazard Type</option>';
                for(var pmhazard of allPmhazards) {
                    if(pmlabelhazard != null) {
                        if(pmhazard.id == pmlabelhazard.id) {
                            htmlContent += '<option value="'+pmhazard.id+' -- '+pmhazard.pmhazardName+'" selected>'+pmhazard.pmhazardName+'</option>';
                        } else {
                            htmlContent += '<option value="'+pmhazard.id+' -- '+pmhazard.pmhazardName+'">'+pmhazard.pmhazardName+'</option>';
                        }
                    } else {
                        htmlContent += '<option value="'+pmhazard.id+' -- '+pmhazard.pmhazardName+'">'+pmhazard.pmhazardName+'</option>';
                    }
                }
            htmlContent += '</select>';

            htmlContent += '<div class="formlabel">Label Type</div>';
            htmlContent += '<select class="formvalue" id="pmlabeltype" onchange="updateSizes()">';
                htmlContent += '<option value="0" >Select Label Type</option>';
                htmlContent += '<option value="1 -- Normal" selected>Normal</option>';
                htmlContent += '<option value="2 -- PC" >PC</option>';
            htmlContent += '</select>';

            htmlContent += '<div class="formlabel">Arrow Type</div>';
            htmlContent += '<select class="formvalue" id="pmarrowtype" onchange="updateSizes()">';
                htmlContent += '<option value="">Select Array Type</option>';
                for(var index in arrowTypes) {
                    if(index == selectedPmlabel.pmlabelType) {
                        htmlContent += '<option value="'+index+' -- '+arrowTypes[index]+'" selected>'+arrowTypes[index]+'</option>';
                    } else {
                        htmlContent += '<option value="'+index+' -- '+arrowTypes[index]+'">'+arrowTypes[index]+'</option>';
                    }
                }
            htmlContent += '</select>';

            htmlContent += '<div class="formlabel">Label Count</div>';
            htmlContent += '<input type="number" id="labelcount" step=1 min=1 max=127 class="formvalue" onchange="updateSizes()" value="'+selectedPmlabel.labelCount+'" />';

            htmlContent += '<div class="formlabel">Custom Width</div>';
            htmlContent += '<input type="number" id="customwidth" step=0.1 min=1 max=127 class="formvalue" onchange="updateSizes()" value="'+selectedPmlabel.customWidth+'" />';

            htmlContent += '<div class="formlabel">Installation Height</div>';
            htmlContent += '<input type="number" id="installationheight" step=1 min=1 max=255 class="formvalue" value="'+selectedPmlabel.installationHeight+'" />';

            htmlContent += '<div class="formlabel">Remarks</div>';
            htmlContent += '<input type="text" id="remarks" maxlength="255" class="formvalue" value="'+selectedPmlabel.remarks+'" />';

            //htmlContent += '<div class="formlabel">Custom Height</div>';
            //htmlContent += '<input type="number" id="customheight" step=0.1 min=1 max=127 class="formvalue" onchange="updateSizes()" value="'+selectedPmlabel.customHeight+'" />';

        htmlContent += '</div>';

        htmlContent += '<hr style="margin: 5px 0;">';

        htmlContent += '<div class="formvalue" style="display: flex; flex-wrap: wrap; justify-content: center;">';
        let count = 0;
        for(var pmghs of allPmghss) {
            if(pmlabelghss != null && pmlabelghss.length > 0) {
                if(pmlabelghss.some(pmlabelghs => pmlabelghs.id === pmghs.id)) {
                    htmlContent += '<div class="ghsChoice"><input class="ghsItem" type="checkbox" id="ghs_'+pmghs.id+'" name="ghs_'+pmghs.id+'" value="'+pmghs.id+' -- '+pmghs.pmghsName+' -- '+pmghs.title+'" checked ><label for="ghs_'+pmghs.id+'" class="ghslabel"><img class="ghsIcon" id="ghsicon_'+pmghs.id+'" src="'+pmghs.icon+'" /><p>'+pmghs.title+'</p></label></div>';
                } else {
                    htmlContent += '<div class="ghsChoice"><input  class="ghsItem" type="checkbox" id="ghs_'+pmghs.id+'" name="ghs_'+pmghs.id+'" value="'+pmghs.id+' -- '+pmghs.pmghsName+' -- '+pmghs.title+'" ><label for="ghs_'+pmghs.id+'" class="ghslabel"><img class="ghsIcon" id="ghsicon_'+pmghs.id+'" src="'+pmghs.icon+'" /><p>'+pmghs.title+'</p></label></div>';
                }
            } else {
                htmlContent += '<div class="ghsChoice"><input  class="ghsItem" type="checkbox" id="ghs_'+pmghs.id+'" name="ghs_'+pmghs.id+'" value="'+pmghs.id+' -- '+pmghs.pmghsName+' -- '+pmghs.title+'" ><label for="ghs_'+pmghs.id+'" class="ghslabel"><img class="ghsIcon" id="ghsicon_'+pmghs.id+'" src="'+pmghs.icon+'" /><p>'+pmghs.title+'</p></label></div>';
            }

            count++;
            if(count == allPmghss.length) {
            }
        }

        htmlContent += '</div>';
        htmlContent += '<hr style="margin: 5px 0;">';

        htmlContent += '<div style="display: grid; grid-template-columns: 30% 20% 30% 20%; margin: 0 10px;">';
            htmlContent += '<div class="formlabel">Label Size</div>';
            htmlContent += '<div id="prescribedsize" class="formvalue"></div>';
            htmlContent += '<div class="formlabel">Arrow Size</div>';
            htmlContent += '<div id="arrowsize" class="formvalue"></div>';
            htmlContent += '<div class="formlabel">Total Arrow L</div>';
            htmlContent += '<div id="totalarrowlength" class="formvalue"></div>';
            htmlContent += '<div class="formlabel">Label Area</div>';
            htmlContent += '<div id="labelarea" class="formvalue"></div>';
            htmlContent += '<div class="formlabel">Arrow Area</div>';
            htmlContent += '<div id="arrowarea" class="formvalue"></div>';

            htmlContent += '<div class="formlabel">PC Arrow Typ</div>';
            htmlContent += '<div id="pcarrowtype" class="formvalue"></div>';
            htmlContent += '<div class="formlabel">PC Arrow #</div>';
            htmlContent += '<div id="pcarrowcount" class="formvalue"></div>';
            htmlContent += '<div class="formlabel">Cable Size</div>';
            htmlContent += '<div id="sscablesize" class="formvalue"></div>';
            htmlContent += '<div class="formlabel">Cable Count</div>';
            htmlContent += '<div id="sscablecount" class="formvalue"></div>';
            htmlContent += '<div class="formlabel">PC Length</div>';
            htmlContent += '<div id="pclength" class="formvalue"></div>';
            htmlContent += '<div class="formlabel">Final Length</div>';
            htmlContent += '<div id="finallength" class="formvalue"></div>';
        htmlContent += '</div>';

        htmlContent += '<hr style="margin: 10px 0;">';

        htmlContent += '<div style="width: 100%; margin-top: 15px; display: flex; justify-content: space-around;">';
            htmlContent += '<div class="btnStyle" style="background-color: rgb(0,67,255);" onclick="saveLabel()">SAVE</div>';
        htmlContent += '</div>';

        $('#modulesDisplayArea').html(htmlContent);
        showPmlabelForm();
        updateSizes();
               
}

function updateSizes() {

    let pipeDia = parseFloat($('#pipedia').val());
    let contentName = $('#contentname').val();
    var labelCount = parseInt($('#labelcount').val());
    let customWidth = parseFloat($('#customwidth').val());
    if(isNaN(labelCount) || labelCount == 0) {labelCount = 1;}

    let labelHeight = 3;
    
    if(pipeDia != null && pipeDia > 0) {
        if(pipeDia >= 1 && pipeDia < 2) {
            labelHeight = 1;
        } else if(pipeDia < 4) {
            labelHeight = 2;
        } else if(pipeDia < 8) {
            labelHeight = 4;
        } else if(pipeDia < 15) {
            labelHeight = 6;
        } else {
            labelHeight = 8;
        }
    }
    
    let labelWidth = 6;
    if(contentName != null && contentName.length > 0) {
        let charCount = contentName.length;
        if(labelHeight < 4) {
            let pmfrom = $('#pmfrom').val();
            let pmto = $('#pmto').val();
            charCount += pmfrom.length + pmto.length + 7; 
        }
        
        if(charCount < 8) {
            labelWidth = 6;
        } else if(charCount < 15) {
            labelWidth = 12;
        } else if(charCount < 20) {
            labelWidth = 18;
        } else if(charCount < 28) {
            labelWidth = 24;
        } else {
            labelWidth = 32;
        }
    }
    if(customWidth > 0) {
        labelWidth = customWidth;
    }

    $('#prescribedsize').html(labelWidth+' x '+labelHeight);

    let labelType = parseInt($('#pmlabeltype').val().split(' -- ')[0]);
    let arrowWidth = 0;
    if(labelHeight < 4) {
        arrowWidth = 1.5;
    } else if(labelHeight < 8) {
        arrowWidth = 2.5;
    } else {
        arrowWidth = 4.5;
    }
    
    let arrowLength = Math.ceil(2*3.14*pipeDia)+4;
    
    let labelArea = labelCount*labelHeight*labelWidth;
    $('#labelarea').html(labelArea);

    if(labelType == 2) {    // 1 for Normal, 2 for PC
        let pcArrowType = labelHeight;
        let pcArrowCount = labelCount*2;
            $('#pcarrowtype').html(pcArrowType);
        $('#pcarrowcount').html(pcArrowCount);

        let arrowArea = 0;
        if(pcArrowType == 1) {
            arrowArea = 2;
        } else if(pcArrowType == 2) {
            arrowArea = 6;
        } else if(pcArrowType == 4) {
            arrowArea = 24;
        } else if(pcArrowType == 6) {
            arrowArea = 36;
        } else {
            arrowArea = 48;
        }
        arrowArea = pcArrowCount*arrowArea; 
        $('#arrowarea').html(arrowArea);

        let ssCableSize = 0;
        if(pipeDia < 3) {
            ssCableSize = 300;
        } else if(pipeDia < 6.1) {
            ssCableSize = 520;
        } else if(pipeDia < 11.1) {
            ssCableSize = 1000;
        } else if(pipeDia < 17.1) {
            ssCableSize = 1500;
        } else if(pipeDia < 23.1) {
            ssCableSize = 2000;
        } else {
            ssCableSize = 2500;
        }
        $('#sscablesize').html(ssCableSize);

        let ssCableCount = 2;
        if(labelWidth > 23) {
            ssCableCount = 3;
        }
        $('#sscablecount').html(ssCableCount);

        let pcLength = 0
        if(pipeDia < 2) {
            pcLength = labelWidth+4;
        } else if(pipeDia < 4) {
            pcLength = labelWidth+6;
        } else {
            pcLength = labelWidth+12;
        }
        $('#pclength').html(pcLength);

        $('#finallength').html(pcLength);

        $('#arrowsize').html("");
        $('#totalarrowlength').html("");
    } else {    // Normal
        
        $('#arrowsize').html(arrowWidth+' x '+arrowLength);
        $('#totalarrowlength').html(arrowLength*labelCount);
        $('#finallength').html(labelWidth);

        let arrowArea = arrowWidth*arrowLength*labelCount; 
		$('#arrowarea').html(arrowArea);

        $('#pclength').html("");
        $('#sscablecount').html("");
        $('#sscablesize').html("");
        $('#pcarrowtype').html("");
        $('#pcarrowcount').html("");
    }
    
}

function saveLabel() {
    console.log("Saving sizes...");

    getFormData("save");
}

function getFormData(execute) {
    let pmlabel = selectedPmlabel;

    // Map form values to pmlabel
    pmlabel.pmlabelName = $('#labelname').val();
    pmlabel.description = $('#description').val();
    pmlabel.contentName = $('#contentname').val();
    pmlabel.pipeDia = parseFloat($('#pipedia').val());
    pmlabel.pmfrom = $('#pmfrom').val();
    pmlabel.pmto = $('#pmto').val();
    pmlabel.pmlabelType = parseInt($('#pmlabeltype').val().split(' -- ')[0]);
    pmlabel.pmarrowType = parseInt($('#pmarrowtype').val().split(' -- ')[0]);
    pmlabel.pmhazardId = parseInt($('#pmhazardid').val().split(' -- ')[0]);
    pmlabel.pmhazardName = $('#pmhazardid').val().split(' -- ')[1];
    pmlabel.customWidth = parseFloat($('#customwidth').val());
    pmlabel.customHeight = parseFloat($('#customheight').val());
    pmlabel.labelCount = parseInt($('#labelcount').val());
    pmlabel.installationHeight = parseInt($('#installationheight').val());
    pmlabel.remarks = $('#remarks').val();
    pmlabel.enabled = true;

    let selectedPmghss = $('.ghsItem:checkbox:checked');
    let newPmghss = [];

    if (selectedPmghss != null && selectedPmghss.length > 0) {
        const data = { token: shared.mCustomerDetailsJSON.token };

        buildRequestOptions(constructUrl("/pmlabelghss/restgetblankpmlabelghs"), "GET", data)
            .then(request => {
                Http.request(request)
                    .then(res => {
                        if (isValidResponse(res, "restgetblankpmlabelghs") && res) {
                            if (res.error !== "invalid_token") {  // Token still valid
                                var blankPmlabelghs = res;
                                for (let index = 0; index < selectedPmghss.length; index++) {
                                    let newPmghs = Object.assign({}, blankPmlabelghs);
                                    let pmghs = selectedPmghss[index];
                                    let pmghsValues = pmghs.value.split(' -- ');

                                    newPmghs.pmlabelId = pmlabel.id;
                                    newPmghs.pmlabelName = pmlabel.pmlabelName;
                                    newPmghs.pmghsId = pmghsValues[0];
                                    newPmghs.pmghsName = pmghsValues[1];
                                    newPmghss.push(newPmghs);

                                    if (index === selectedPmghss.length - 1) {
                                        if (execute === 'save') {
                                            saveLabelExecute(pmlabel, newPmghss);
                                        } else {
                                            previewLabelExecute(pmlabel, newPmghss);
                                        }
                                    }
                                }
                            } else {
                                // Token expired → regenerate token and retry
                                getNewToken(`getFormData("${execute}")`);
                            }
                        }
                    })
                    .catch(err => {
                        console.error("Fetching blank PM label GHS failed!", err);
                        apiRequestFailed(err, "restgetblankpmlabelghs");
                    });
            })
            .catch(err => {
                console.warn("Request aborted due to missing requestOptions.", err);
            });
    } else {
        if (execute === 'save') {
            saveLabelExecute(pmlabel, newPmghss);
        } else {
            previewLabelExecute(pmlabel, newPmghss);
        }
    }
}

function saveLabelExecute(pmlabel, pmlabelghss) {
    var currentPmlabel = pmlabel;
    var currentPmlabelghss = pmlabelghss;

    const data = {
        token: shared.mCustomerDetailsJSON.token,
        pmlabel: JSON.stringify(currentPmlabel),
        pmlabelghss: JSON.stringify(currentPmlabelghss)
    };

    RequestOptions(constructUrl("/pmlabels/restsavepmlabeldata"), "POST", data)
        .then(request => {
            Http.request(request)
                .then(res => {
                    if (isValidResponse(res, "restsavepmlabeldata") && res) {
                        if (res.error !== "invalid_token") {  // Token still valid
                            unsavedData = false;
                            if (shared.currentSourceState === "viewScanner") {
                                showPmprojectList();
                            } else {
                                populatePmprojectData(selectedPmproject.id);
                            }
                        } else {
                            // Token expired → regenerate and retry
                            getNewToken("addNewLabel()");
                        }
                    }
                })
                .catch(err => {
                    console.error("Saving PM label data failed!", err);
                    apiRequestFailed(err, "restsavepmlabeldata");
                });
        })
        .catch(err => {
            console.warn("Request aborted due to missing requestOptions.", err);
        });
}


function showPmprojectList() {
	shared.currentState = "displayPipemarkList";
    $('#modulesMenuArea').show();
	$('#modulesListArea').show();
    $('#modulesDisplayArea').hide();
}

function showPmprojectView() {
	shared.currentState = "displayPmprojectView";
    $('#modulesMenuArea').hide();
	$('#modulesListArea').hide();
    $('#modulesDisplayArea').show();
}

function showPmlabelForm() {
	shared.currentState = "displayPmlabelForm";
    $('#modulesMenuArea').hide();
	$('#modulesListArea').hide();
    $('#modulesDisplayArea').show();
}


export function backPipemarkHandle() {
	if (shared.currentState == "displayPmlabelView") {
		showPmlabelForm();
	} else if (shared.currentState == "displayPmlabelForm") {
		if (shared.currentSourceState == "viewScanner") {
			if (unsavedData === true) {
				showConfirmDialog({
					message: "Any unsaved data will be lost. Proceed?",
					yesLabel: "Proceed",
					noLabel: "Cancel",
					onYes: () => {
						showPmprojectList();
					},
					onNo: () => {
						console.log("❌ User cancelled backPipemarkHandle (displayPmlabelForm → viewScanner)");
					}
				});
			} else {
				showPmprojectList();
			}
		} else {
			if (unsavedData === true) {
				showConfirmDialog({
					message: "Any unsaved data will be lost. Proceed?",
					yesLabel: "Proceed",
					noLabel: "Cancel",
					onYes: () => {
						showPmprojectView();
					},
					onNo: () => {
						console.log("❌ User cancelled backPipemarkHandle (displayPmlabelForm → viewProjectView)");
					}
				});
			} else {
				showPmprojectView();
			}
		}
	} else if (shared.currentState == "displayPmprojectView") {
		if (unsavedData === true) {
			showConfirmDialog({
				message: "Any unsaved data will be lost. Proceed?",
				yesLabel: "Proceed",
				noLabel: "Cancel",
				onYes: () => {
					viewPmprojects();
				},
				onNo: () => {
					console.log("❌ User cancelled backPipemarkHandle (displayPmprojectView)");
				}
			});
		} else {
			viewPmprojects();
		}
	} else if (currentState == "displayPmprojectList" || currentState == "viewScanner") {
		showPmprojectList();
	} else {
		shared.currentState = "";
		unsavedData = false;
		closePipemark();
	}
}

function closePipemark() {
	showConfirmDialog({
		message: "Exit PipeMark?",
		yesLabel: "Exit",
		noLabel: "Cancel",
		onYes: () => {
			exitPipemark();
		},
		onNo: () => {
			console.log("❌ User cancelled closePipemark");
		}
	});
}






window.viewPipemark = viewPipemark;
window.exitPipemark = exitPipemark;
window.displayPipemarkMenu = displayPipemarkMenu;
window.viewPmprojects = viewPmprojects;
window.scanPipemarkQRCode = scanPipemarkQRCode;
window.viewAllPipemarks = viewAllPipemarks;
window.getPipemarkLocations = getPipemarkLocations;
window.getPipemarkDepartments = getPipemarkDepartments;
window.getPipemarkCategorys = getPipemarkCategorys;
window.searchPipemarkDepartmentLocationCategory = searchPipemarkDepartmentLocationCategory;
window.getPipemarksAtSelected = getPipemarksAtSelected;
window.getPipemarksAtDepartmentLocationCategory = getPipemarksAtDepartmentLocationCategory;
window.createPipemarkList = createPipemarkList;
window.handlePipemarkQrCode = handlePipemarkQrCode;
window.displayPmproject = displayPmproject;
window.populatePmprojectData = populatePmprojectData;
window.editPmproject = editPmproject;
window.addPmproject = addPmproject;
window.viewPmprojectForm = viewPmprojectForm;
window.saveProject = saveProject;
window.getProjectFormData = getProjectFormData;
window.saveProjectExecute = saveProjectExecute;
window.addNewLabel = addNewLabel;
window.viewLabelDetails = viewLabelDetails;
window.populatePmlabelData = populatePmlabelData;
window.updateSizes = updateSizes;
window.saveLabel = saveLabel;
window.getFormData = getFormData;
window.saveLabelExecute = saveLabelExecute;
window.backPipemarkHandle = backPipemarkHandle;
window.closePipemark = closePipemark;
window.showPmprojectList = showPmprojectList;
window.showPmprojectView = showPmprojectView;
window.showPmlabelForm = showPmlabelForm;
