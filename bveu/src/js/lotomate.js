import { Filesystem, Directory, Encoding } from "@capacitor/filesystem"
import { Capacitor } from '@capacitor/core';
import { Device } from "@capacitor/device"
import { Http } from '@capacitor-community/http';
import { Network } from '@capacitor/network';
import { App } from '@capacitor/app';
import $ from 'jquery';
import { Browser } from '@capacitor/browser';



import { shared , s3PrivateUrl } from "./globals.js";
import { displaySection , buildRequestOptions , isValidResponse , RequestOptions ,showConfirmDialog} from "./capacitor-welcome.js";
import { getMenuBar ,viewHome , getNewToken} from "./settings.js";
import { highlightHeaderTabMenu , constructUrl , showDialog , fixModuleHeight , getSignedUrl , startAppIdleTimer } from "./utility.js";
import { apiRequestFailed , } from "./auth.js";
import { createList } from "./list.js";
import { exitModules } from "./content.js";

var lotomateProcessList = null;
var lotomateAllList = null;
var lotomateBuildList = null;
var lotomateExecutionList = null;
var selectedLotomateProcessList = [];
let currentLotoIndex = 0;
var searchInputTimeout = null;
var tableList = null;
var sortable = null;
var unsavedData = false;
const HEADER = 0;
const FOOTER = 1;
const PROCESS = 2;
let searchType ="";
let selectedName ="";
let selectedId = 0;
var listItems = [];


function viewMaintenance() {
	shared.currentRunningApp = 'maintenance';
	$('#moduleTitle').html("MAINTENANCE");
	viewSop();
}

function viewLotomate () {
	shared.currentRunningApp = 'lotoMate';
	$('#moduleTitle').html("SOP");
	viewSop();
}

// function viewSop() {
// 	unsavedData = false;
// 	if (shared.mCustomerDetailsJSON != null) {
// 		//stopAppIdleTimer();
// 		displaySection("modulesSection", "flex", false, true);

// 		$('#modulesMenuArea').show();
// 		$('#modulesListArea').show();
// 		$('#modulesDisplayArea').hide();
// 		displayLotomateMenu();

// 		//updateAppRuntime(currentRunningApp, "on", "ok");

// 		lotomateProcessList = null;

// 		let btn = null;
// 		if(shared.currentRunningApp == 'lotoMate') {
// 			btn = document.getElementById("btnId_view_alllotoprocess");
// 		} else {
// 			btn = document.getElementById("btnId_view_executelotoprocess");
// 		}
// 		setTimeout(function() {
// 			btn.click();
// 		}, 200);

		
// 	} else { 		
// 		showDialog("You need to login to access this resource!", "viewLogin('menuProcess')");
// 	}
// }

async function viewSop() {
  unsavedData = false;

  if (shared.mCustomerDetailsJSON != null) {
    displaySection("modulesSection", "flex", false, true);

    $('#modulesMenuArea').show();
    $('#modulesListArea').show();
    $('#modulesDisplayArea').hide();

    // Wait for the menu to be fully displayed / built
    await displayLotomateMenu();

    lotomateProcessList = null;

    let btnId =
      shared.currentRunningApp === "lotoMate"
        ? "btnId_view_alllotoprocess"
        : "btnId_view_executelotoprocess";

    let btn = document.getElementById(btnId);
    if (btn) {
      btn.click();
    } else {
      console.warn(`Button with ID '${btnId}' not found.`);
    }
  } else {
    showDialog(
      "You need to login to access this resource!",
      "viewLogin('menuProcess')"
    );
  }
}



function exitLotomate() {
	if(shared.mCustomerDetailsJSON == null) {
        startAppIdleTimer();
    }
	exitModules();
}

function displayLotomateMenu() {
	
	var htmlContent = "";
	var lotomateScreenSource = null;
	if(shared.currentRunningApp == 'lotoMate') {
		lotomateScreenSource = shared.cmsJSON.cmsJSONdata.lotomateScreen;
	} else {
		lotomateScreenSource = shared.cmsJSON.cmsJSONdata.maintenanceScreen;
	}
	

	$.each(lotomateScreenSource.sectionList, function(key, section) {
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

			htmlContent += '<div class="searchArea"><div class="searchBox" id="lotomate_searchbox"></div></div>';

			htmlContent += '</div>';
		}
	});
	$("#modulesMenuArea").html(htmlContent);
}

function getMyLoto() {
    viewAllProcesss();
}

function viewAllProcesss() {
	//lotomateSearchStr = "";
	searchType = "all";
	$('#lotomate_searchbox').html('<input type="search" class="searchInput" id="lotomate_'+searchType+'_search_input" placeholder="Search '+searchType+'" /><button class="searchBtn" id="lotomate_'+searchType+'_searchbtn" onclick="searchLotomateprocess()"><span class="material-symbols-outlined" style="font-size: 30px; padding: 5px 0;">search</span></button>');
	searchLotomateprocess();
}

function viewBuildProcesss() {
	searchType = "build";
	$('#lotomate_searchbox').html('<input type="search" class="searchInput" id="lotomate_'+searchType+'_search_input" placeholder="Search '+searchType+'" /><button class="searchBtn" id="lotomate_'+searchType+'_searchbtn" onclick="searchLotomateprocess()"><span class="material-symbols-outlined" style="font-size: 30px; padding: 5px 0;">search</span></button>');
	searchLotomateprocess();
}

function viewExecutionProcesss() {
	searchType = "execution";
	$('#lotomate_searchbox').html('<input type="search" class="searchInput" id="lotomate_'+searchType+'_search_input" placeholder="Search '+searchType+'" /><button class="searchBtn" id="lotomate_'+searchType+'_searchbtn" onclick="searchLotomateprocess()"><span class="material-symbols-outlined" style="font-size: 30px; padding: 5px 0;">search</span></button>');
	searchLotomateprocess();
}

function getProcessAtListIndex(index) {
	if(listItems != null && index < listItems.length) {
		manageProcess(index);
	}
}

function getLotomateLocations() {
	shared.currentState = "lotomateLocations";
	shared.currentSourceState = shared.currentState;
	//$("#location_search_input").val("");
	searchType = "location";
	$('#lotomate_searchbox').html('<input type="search" class="searchInput" id="lotomate_'+searchType+'_search_input" placeholder="Search '+searchType+'" /><button class="searchBtn" id="lotomate_'+searchType+'_searchbtn" onclick="searchLotomateDepartmentLocationCategory()"><span class="material-symbols-outlined" style="font-size: 30px; padding: 5px 0;">search</span></button>');
	searchLotomateDepartmentLocationCategory();
}

function getLotomateDepartments() {
	shared.currentState = "lotomateDepartments";
	shared.currentSourceState = shared.currentState;
	//$("#department_search_input").val("");
	searchType = "department";
	$('#lotomate_searchbox').html('<input type="search" class="searchInput" id="lotomate_'+searchType+'_search_input" placeholder="Search '+searchType+'" /><button class="searchBtn" id="lotomate_'+searchType+'_searchbtn" onclick="searchLotomateDepartmentLocationCategory()"><span class="material-symbols-outlined" style="font-size: 30px; padding: 5px 0;">search</span></button>');
	searchLotomateDepartmentLocationCategory();
}

function getLotomateCategorys() {
	shared.currentState = "lotomateCategorys";
	shared.currentSourceState = shared.currentState;
	//$("#category_search_input").val("");
	searchType = "category";
	$('#lotomate_searchbox').html('<input type="search" class="searchInput" id="lotomate_'+searchType+'_search_input" placeholder="Search '+searchType+'" /><button class="searchBtn" id="lotomate_'+searchType+'_searchbtn" onclick="searchLotomateDepartmentLocationCategory()"><span class="material-symbols-outlined" style="font-size: 30px; padding: 5px 0;">search</span></button>');
	searchLotomateDepartmentLocationCategory();
}

// function searchLotomateDepartmentLocationCategory(pageNumber=1, pageSize=50) {
// 	let type = searchType;
// 	highlightHeaderTabMenu("menuBtn", "btnId_view_lotomate"+type+"s");

// 	let searchStr = $("#lotomate_"+type+"_search_input").val();
// 	if(searchStr == null) {searchStr = "";}
// 	$('#modulesMenuArea').show();
// 	$('#modulesListArea').show();
// 	$('#modulesDisplayArea').hide();
// 	fixModuleHeight("modulesModuleHeader, modulesMenuArea, footerSection", 20, "modulesListArea");

// 	var data =  {"token": shared.mCustomerDetailsJSON.token, "searchStr": searchStr, "page": pageNumber, "size": pageSize};
// 	let url = "/"+type+"s/search"+type+"spaginated";

// 	// Capacitor-style request
// 	buildRequestOptions(constructUrl(url), "GET", data)
// 		.then((requestOptions) => fetch(constructUrl(url), requestOptions))
// 		.then((response) => response.json())
// 		.then((jqXHR) => {
// 			if (isValidResponse(jqXHR, "search"+type+"spaginated")) {
// 				var items = jqXHR;

// 				if(items.error != "invalid_token") {	//  Token valid
// 					var htmlContent = '';
// 					htmlContent += '<div class="searchArea"><div class="searchBox" style="font-size: 1.3em; justify-content: center; text-align: center;">'+type.toUpperCase()+'S ('+items.totalElements+')</div></div>';

// 					if(items != null && items.content != null && items.content.length > 0) {
// 						listItems = [];
// 						for(var index in items.content) {
// 							let item = items.content[index];
							
// 							let description = '<div>'+item.description+'</div><div>Assets: '+item.assetCount+'</div>';
// 							let image = '';
// 							if(item.image != undefined && item.image != null && item.image.length > 0) {
// 								image = item.image;
// 							} else {
// 								if(type == "asset") {
// 									image = '<span class="material-symbols-outlined ticketStyleMaterializeIcon">notification_important</span>';
// 								} else if(type == "department") {
// 									image = '<img id="adlc_list_image_'+index+'" style="padding: 0 25%; width: 100%; object-fit: contain;" src="./img/icon_department.png" >';
// 								} else if(type == "location") {
// 									image = '<img id="adlc_list_image_'+index+'" style="padding: 0 25%; width: 100%; object-fit: contain;" src="./img/icon_location.png" >';
// 								} else if(type == "category") {
// 									image = '<img id="adlc_list_image_'+index+'" style="padding: 0 25%; width: 100%; object-fit: contain;" src="./img/icon_category.png" >';
// 								}
// 							}

// 							let itemJson = {"id": item.id, "image": image, "title":item.name, "description":description, "clickAction":"getProcesssAtSelected('"+item.id+"', '"+item.name+"')"};
// 							listItems.push(itemJson);

// 							if(index == items.content.length-1) {
// 								createList("department", htmlContent, listItems, items.pageable, items.totalPages, "modulesListBox", "getProcessAtListIndex", "searchLotomateDepartmentLocationCategory", "ticketStyle");
// 							}
// 						}
// 					} else {
// 						htmlContent += '<div class="formlabel">No '+type+'s found</div>';
// 						$('#modulesListBox').html(htmlContent);
// 					}

// 				} else { 
// 					//  Token expired → regenerate automatically
// 					getNewToken("searchLotomateDepartmentLocationCategory("+type+")");
// 				}
// 			}
// 		})
// 		.catch((jqXHR) => {
// 			apiRequestFailed(jqXHR, "search"+type+"spaginated");
// 		});
// }

function searchLotomateDepartmentLocationCategory(pageNumber = 1, pageSize = 50) {
	let type = searchType;
	highlightHeaderTabMenu("menuBtn", "btnId_view_lotomate" + type + "s");

	let searchStr = $("#lotomate_" + type + "_search_input").val();
	if (searchStr == null) {
		searchStr = "";
	}
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

	let url = "/" + type + "s/search" + type + "spaginated";

	buildRequestOptions(constructUrl(url), "GET", data).then(request => {
		Http.request(request).then(res => {
			if (isValidResponse(res, "search" + type + "spaginated") && res.data) {
				let items = (typeof res.data === "string" ? JSON.parse(res.data) : res.data);

				if (items.error !== "invalid_token") {	// Check if token is still valid
					let htmlContent = '';
					htmlContent += '<div class="searchArea"><div class="searchBox" style="font-size: 1.3em; justify-content: center; text-align: center;">'
						+ type.toUpperCase() + 'S (' + items.totalElements + ')</div></div>';

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
									image = '<span class="material-symbols-outlined ticketStyleMaterializeIcon">notification_important</span>';
								} else if (type == "department") {
									image = '<img id="adlc_list_image_' + index + '" style="padding: 0 25%; width: 100%; object-fit: contain;" src="./img/icon_department.png" >';
								} else if (type == "location") {
									image = '<img id="adlc_list_image_' + index + '" style="padding: 0 25%; width: 100%; object-fit: contain;" src="./img/icon_location.png" >';
								} else if (type == "category") {
									image = '<img id="adlc_list_image_' + index + '" style="padding: 0 25%; width: 100%; object-fit: contain;" src="./img/icon_category.png" >';
								}
							}

							let itemJson = {
								id: item.id,
								image: image,
								title: item.name,
								description: description,
								clickAction: "getProcesssAtSelected('" + item.id + "', '" + item.name + "')"
							};
							listItems.push(itemJson);

							if (index == items.content.length - 1) {
								createList("department", htmlContent, listItems, items.pageable, items.totalPages,
									"modulesListBox", "getProcessAtListIndex", "searchLotomateDepartmentLocationCategory", "ticketStyle");
							}
						}
					} else {
						htmlContent += '<div class="formlabel">No ' + type + 's found</div>';
						$('#modulesListBox').html(htmlContent);
					}
				} else {
					// Token expired → regenerate and retry
					getNewToken("searchLotomateDepartmentLocationCategory(" + type + ")");
				}
			}
		}).catch(err => {
			apiRequestFailed(err, "search" + type + "spaginated");
		});
	}).catch(err => {
		console.warn("Request aborted due to missing requestOptions.", err);
	});
}



function getProcesssAtSelected(id, name) {
	selectedId = id;
	selectedName = name;
	getProcesssAtDepartmentLocationCategory();
}

function getProcesssAtDepartmentLocationCategory(pageNumber=1, pageSize=50) {
	$('#modulesMenuArea').show();
	$('#modulesListArea').show();
	$('#modulesDisplayArea').hide();
	$('#lotomate_searchbox').html('');
	
	let type = searchType;	// all / department / location / category
	let task = 'all';		// all / build / execute
	let id = selectedId;
	shared.currentState = type+"lotomateprocess";
	shared.currentSourceState = shared.currentState;
	var url = "/lotomateprocesss/getlotomateprocesssat"+type+"paginated";

	let data = {};
	if(type == "department") {
		data =  {"token": shared.mCustomerDetailsJSON.token, "departmentId": id, "page": pageNumber, "size": pageSize};
	} else if(type == "location") {
		data =  {"token": shared.mCustomerDetailsJSON.token, "locationId": id, "page": pageNumber, "size": pageSize};
	} else if(type == "category") {
		data =  {"token": shared.mCustomerDetailsJSON.token, "categoryId": id, "page": pageNumber, "size": pageSize};
	}

	
	buildRequestOptions(constructUrl(url), "GET", data)
		.then((requestOptions) => fetch(constructUrl(url), requestOptions))
		.then((response) => response.json())
		.then((jqXHR) => {
			if (isValidResponse(jqXHR, url)) {
				if(jqXHR.error != "invalid_token") {	// ✅ Token valid
					lotomateAllList = jqXHR;
					createLotomateList(type, task);

					/*
					// Keeping your old UI code commented as in original
					var htmlContent = '';
					htmlContent += '<div class="searchArea"><div class="searchBox" style="font-size: 1.3em; justify-content: center; text-align: center;">'+type.toUpperCase()+': '+name.toUpperCase()+'  ('+items.totalElements+')</div></div>';
					if(items != null && items.content != null && items.content.length > 0) {
						listItems = [];
						for(var index in items.content) {
							let item = items.content[index];
							let reportDate = new Date(item.createdOn.replace(' ', 'T'));  
							const readableDate = reportDate.toLocaleString('en-US', {year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true});
							
							let description = '<div>Reported: On '+readableDate+', By '+item.userName+'</div>';
							description += '<div>Location: '+item.locationName+' ';
							if(item.departmentName != null) {
								description += '('+item.departmentName+')';
							}
							description += '</div>';

							let image = '';
							const imageAvailable = item.processReportData.match(/https:\/\/bveucp.*?\.jpg/);
							if(imageAvailable) {
								image = imageAvailable[0];
							} else {
								image = '<span class="material-symbols-outlined ticketStyleMaterializeIcon" >notification_important</span>';
							}

							let itemJson = {"id": item.id, "image": image, "title":item.lotoName, "description":description, "clickAction":"viewSelectedProcess('"+index+"')"};
							listItems.push(itemJson);

							if(index == items.content.length-1) {
								createList("site", htmlContent, listItems, items.pageable, items.totalPages, "modulesListBox", "getSiteAtListIndex", "getSitesAtDepartmentLocationCategory", "ticketStyle");
							}
						}
					} else {
						htmlContent += '<div class="formlabel">No '+type+'s found</div>';
						$('#modulesListBox').html(htmlContent);
					}
					*/
				}
			} else { 
				// ❌ Token expired → regenerate
				getNewToken("getSitesAtDepartment("+department+")");
			}
		})
		.catch((jqXHR) => {
			apiRequestFailed(jqXHR, "getlotomateprocesssatdepartmentpaginated");
		});
}

function searchLotomateprocess(pageNumber=1, pageSize=50) {
	$('#modulesMenuArea').show();
	$('#modulesListArea').show();
	$('#modulesDisplayArea').hide();
	fixModuleHeight("modulesModuleHeader, modulesMenuArea, footerSection", 20, "modulesListArea");

	let task = searchType;	// all / build / execute
	let type = task;
	highlightHeaderTabMenu("menuBtn", "btnId_view_"+task+"lotoprocess");

	shared.currentState = "searchLotomateprocess";
	shared.currentSourceState = shared.currentState;
	let searchStr = $("#lotomate_"+task+"_search_input").val();

	const data = { 
		"token": shared.mCustomerDetailsJSON.token, 
		"searchStr": searchStr, 
		"page": pageNumber, 
		"size": pageSize 
	};

	// Capacitor-style request
	buildRequestOptions(constructUrl("/lotomateprocesss/searchlotomateprocesspaginated"), "GET", data)
		.then(request => {
			Http.request(request).then(res => {
				if (isValidResponse(res, "searchlotomateprocesspaginated") && res.data) {
					const jqXHR = (typeof res.data === "string" ? JSON.parse(res.data) : res.data);

					if (jqXHR.error != "invalid_token") {	//  Token valid
						lotomateAllList = jqXHR.lotomateProcesss;
						lotomateBuildList = jqXHR.builds;
						lotomateExecutionList = jqXHR.executions;

						createLotomateList(type, task);
					}
				} else { 
					//  Token expired
					getNewToken("searchLotomateprocess()");
				}
			}).catch(err => {
				apiRequestFailed(err, "searchlotomateprocesspaginated");
			});
		})
		.catch(err => console.warn("Request aborted due to missing requestOptions.", err));
}

function createLotomateList(type, taskName) {

	let totalElements = 0;
	let totalPages = 0;
	let pageable = null;

	if(taskName == 'all') {
		lotomateProcessList = lotomateAllList.content;
		totalElements = lotomateAllList.totalElements;
		totalPages = lotomateAllList.totalPages;
		pageable = lotomateAllList.pageable;		
	} else {
		if(taskName == 'build') {
			lotomateProcessList = lotomateBuildList;
		} else if(taskName == 'execution') {
			lotomateProcessList = lotomateExecutionList;
		}
		totalElements = lotomateProcessList.length;
		totalPages = 1;
		pageable = null;
	}

	let items = lotomateProcessList;
	var htmlContent = '';
	let title = type;
	if(type == 'department' || type == 'location' || type == 'category') {
		title = type+': '+selectedName;
	}
	htmlContent += '<div class="searchArea"><div class="searchBox" style="font-size: 1.3em; justify-content: center; text-align: center;">'+title.toUpperCase()+' SOPS ('+totalElements+')</div></div>';

	if(items != null && items.length > 0) {
		listItems = [];
		for(var index in items) {
			let task = '';
			if(taskName == 'all') {
				task = getLotoTask(index, 'TASK_ANY');
			} else if(taskName == 'build') {
				task = getLotoTask(index, 'TASK_BUILD');
			} else if(taskName == 'execution') {
				task = getLotoTask(index, 'TASK_EXECUTE');
			}

			let item = items[index];
			let currentDate = new Date();
			let targetDate = currentDate;
			if(item.completionDate != null) {
				targetDate = new Date(item.completionDate.replace(' ', 'T'));  // make it ISO-friendly
			}
			const targetDateStr = targetDate.toLocaleString('en-US', {year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true});
			let completionDate = new Date(item.modifiedOn.replace(' ', 'T'));  // make it ISO-friendly
			const completionDateStr = completionDate.toLocaleString('en-US', {year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true});

			let description = '';
			let image = '';
			let states = [];
			let actions = [];
			let activeActions = [];

			if(task.startsWith('TASK_EXECUTE')) {
				description += '<div>'+item.description+'</div>';
				description += '<div>Executor: '+item.executorName+'</div>';
				description += '<div>Approver: '+item.approverName+'</div>';
				if(task == 'TASK_EXECUTE_EXECUTE') {
					description += '<div>Complete by: '+targetDateStr+'</div>';
					if(currentDate > targetDate) {
						states.push({"text":"Pending Execution", "type": "errorState"});
					} else {
						states.push({"text":"Scheduled", "type": "infoState"});
					}
					actions.push({"text": "Execute", "type":"button",  "actionClass": "activeActionWideBlue", "act":"displayLotomateProcess("+index+", '"+task+"')"});
					activeActions.push({"text": "Execute"});
				} else {
					description += '<div>Executed On: '+completionDateStr+'</div>';
					if(task == 'TASK_EXECUTE_APPROVE') {
						//description += '<div>Status: '+completion+'</div>';
						states.push({"text":"Pending Approval", "type": "warningState"});
						actions.push({"text": "Approve", "type":"button",  "actionClass": "activeActionWideBlue", "act":"displayLotomateProcess("+index+", , '"+task+"')"});
						activeActions.push({"text": "Approve"});
					} else {
						if(item.complete == true) {
							if(item.approved == true) {
								states.push({"text":"Execution Complete", "type": "successState"});
							} else {
								states.push({"text":"Execution Pending Approval", "type": "warningState"});
							}
						}
					}
				}
				image = '<span class="material-symbols-outlined ticketStyleMaterializeIcon">settings_b_roll</span>';
			
			} else {
				description += '<div>'+item.description+'</div>';
				description += '<div>Creator: '+item.creatorName+'</div>';
				description += '<div>Approver: '+item.approverName+'</div>';
				description += '<div>Asset: '+item.assetName+'</div>';
				if(task == 'TASK_BUILD_CREATE') {
					description += '<div>Complete by: '+targetDateStr+'</div>';
					if(currentDate > targetDate) {
						states.push({"text":"Pending Build", "type": "errorState"});
					} else {
						states.push({"text":"Build Scheduled", "type": "warningState"});
					}
					actions.push({"text": "Build", "type":"button",  "actionClass": "activeActionWideBlue", "act":"displayLotomateProcess("+index+", '"+task+"')"});
					activeActions.push({"text": "Build"});
				} else {
					description += '<div>Built On: '+completionDateStr+'</div>';
					if(task == 'TASK_BUILD_APPROVE') {
						states.push({"text":"Pending Approval", "type": "warningState"});
						actions.push({"text": "Approve", "type":"button",  "actionClass": "activeActionWideBlue", "act":"displayLotomateProcess("+index+", '"+task+"')"});
						activeActions.push({"text": "Approve"});

					} else {
						if(item.complete == true) {
							if(item.approved == true) {
								states.push({"text":"Build Complete", "type": "successState"});
							} else {
								states.push({"text":"Build Pending Approval", "type": "warningState"});
							}
						}
					}
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
				image = '<span class="material-symbols-outlined ticketStyleMaterializeIcon">flowsheet</span>';
			}

			//let itemJson = {"id": item.id, "image": item.image, "title":item.name, "description":description};
			let itemJson = {"id": item.id, "image": image, "title":item.lotoName, "description":description, "clickAction":"displayLotomateProcess('"+index+"', '"+task+"')", "states":states, "actions":actions, "activeActions":activeActions};

			listItems.push(itemJson);
			if(index == items.length-1) {
				createList("site", htmlContent, listItems, pageable, totalPages, "modulesListBox", "getProcessAtListIndex", "searchLotomateprocess", "ticketStyle");
				
			}
		}
	} else {
		htmlContent += '<div class="formlabel">No SOP found</div>';
		$('#modulesListBox').html(htmlContent);
	}
}



// async function scanLotomateQRCode() {
//   if (shared.mCustomerDetailsJSON != null) {
//     //updateAppRuntime("lotoMate", "on", "ok");

//     let displayOrientation = "portrait";
//     if (window.screenWidth > window.screenHeight) {
//       displayOrientation = "landscape";
//     }

//     shared.currentState = "viewScanner";

//     try {
//       // Prepare scanner
//       await BarcodeScanner.checkPermission({ force: true });
//       await BarcodeScanner.hideBackground(); // Make background transparent
//       const result = await BarcodeScanner.startScan();

//       console.log("We got a barcode\n" +
//         "Result: " + result.content + "\n" +
//         "Format: " + (result.format || "unknown") + "\n" +
//         "Cancelled: " + result.hasContent);

//       if (result.hasContent && result.content.length > 0) {
//         try {
//           const qrData = JSON.parse(result.content);
//           handleLotomateQrCode(qrData.code, 0);
//         } catch (err) {
//           console.error("Invalid QR JSON format", err);
//           showDialog("Invalid QR Code format!");
//         }
//       }

//     } catch (error) {
//       alert("Scanning failed: " + error);
//     } finally {
//       BarcodeScanner.showBackground();
//       BarcodeScanner.stopScan();
//     }

//   } else {
//     showDialog("You need to login to access this resource!", "viewLogin('menuProcess')");
//   }
// }


function handleLotomateQrCode(codeId, tabIndex) {
  if (codeId != null) {
    const data = { token: shared.mCustomerDetailsJSON.token, code: codeId };

    buildRequestOptions(constructUrl("/lotomateprocesss/getlotomatebyqrcode"), "GET", data)
      .then(request => {
        Http.request(request).then(res => {
          if (isValidResponse(res, "getlotomatebyqrcode") && res.data) {
            const jqXHR = (typeof res.data === "string" ? JSON.parse(res.data) : res.data);

            if (jqXHR != null) {
              if (jqXHR.error !== "invalid_token") {
                lotomateAllList = jqXHR;

                if (jqXHR.length === 1) {
                  let task = getLotoTask(0, "TASK_BUILD");
                  shared.currentSourceState = "displayScannedLotomate";
                  displayLotomateProcess(0, task);
                } else if (jqXHR.length > 1) {
                  createLotomateList("all");
                } else {
                  showDialog("No records found!");
                }
              } else {
                // Token expired → regenerate
                getNewToken(`handleLotomateQrCode(${codeId}, ${tabIndex})`);
              }
            }
          }
        }).catch(err => {
          apiRequestFailed(err, "getlotomatebyqrcode");
        });
      })
      .catch(err => console.warn("Request aborted due to missing requestOptions.", err));
  }
}

function getLotoTask(index, task) {
	let loto = lotomateProcessList[index];
	let userId = shared.mCustomerDetailsJSON.id;
	let updatedTask = task;
	if(task === "TASK_ANY") {
		if(loto.creatorId == userId && loto.complete != true) {
			updatedTask = "TASK_BUILD_CREATE";
		} else if(loto.approverId == userId && loto.complete == true && loto.approved != true) {
			updatedTask = "TASK_BUILD_APPROVE";
		} else if(loto.safetyOfficerId == userId || loto.hodId == userId || loto.safetyManagerId == userId || loto.hodId == userId) {
			updatedTask = "TASK_BUILD_VIEW";
		} else {
			updatedTask = "TASK_BUILD_VIEW";
		}
	} else if(task === "TASK_BUILD") {
		if(loto.creatorId == userId && loto.complete != true) {
			updatedTask = "TASK_BUILD_CREATE";
		} else if(loto.approverId == userId && loto.complete == true && loto.approved != true) {
			updatedTask = "TASK_BUILD_APPROVE";
		} else if(loto.safetyOfficerId == userId || loto.hodId == userId || loto.safetyManagerId == userId || loto.hodId == userId) {
			updatedTask = "TASK_BUILD_VIEW";
		} else {
			updatedTask = "TASK_BUILD_VIEW";
		}
	} else if(task === "TASK_EXECUTE") {
		// let exec = lotomateExecutionList[index]
		if(loto.executorId == userId && loto.complete != true) {
			updatedTask = "TASK_EXECUTE_EXECUTE";
		} else if(loto.approverId == userId && loto.complete == true && loto.approved != true) {
			updatedTask = "TASK_EXECUTE_APPROVE";
		} else if(loto.safetyOfficerId == userId || loto.hodId == userId || loto.safetyManagerId == userId || loto.hodId == userId) {
			updatedTask = "TASK_EXECUTE_VIEW";
		} else {
			updatedTask = "TASK_EXECUTE_VIEW";
		}
	}
	return updatedTask;
}

function editExecution(index) {
    let task = "create";
    if (index >= 0) {
        task = "update";
    }

    const data = { token: shared.mCustomerDetailsJSON.token, task: task };

    RequestOptions(
        constructUrl("/lotomateexecutions/restcreatelotomateexecution"),
        "POST",
        data
    ).then(request => {
        Http.request(request).then(res => {
            if (isValidResponse(res, "getformtemplate") && res.data) {
                const jqXHR = (typeof res.data === "string" ? JSON.parse(res.data) : res.data);

                if (jqXHR != null) {
                    if (jqXHR.error !== "invalid_token") { // Token still valid
                        if (jqXHR.error === "no_privilege") { // Privilege check
                            showDialog("You don't have privilege to " + task + " execution!");
                        } else {
                            showNewExeutionForm(index, jqXHR);
                        }
                    } else {
                        // Invalid Token → regenerate
                        getNewToken("editExecution(" + index + ")");
                    }
                }
            }
        }).catch(err => {
            console.error("Execution request failed!", err);
            apiRequestFailed(err, constructUrl("/lotomateexecutions/restcreatelotomateexecution"));
        });
    }).catch(err => {
        console.warn("Request aborted due to missing requestOptions.", err);
    });
}

function showNewExeutionForm(index, data) {
	unsavedData = true;
	shared.currentState = "displayNewExecution";
	showLotomateDisplayArea();
	var htmlContent = "";

	var userList = data.users;
	var lotoList = data.lotomates;
	var execData = {};
	if(index != -1) {
		// execData = lotomateExecutionList[index];
		execData = lotomateProcessList[index];
		htmlContent += '<input id="newexec_id" style="display: none;" value='+execData.id+' />';
	} else {
		htmlContent += '<input id="newexec_id" style="display: none;" value=0 />';
	}

	htmlContent += '<div class="moduleNameArea" id="lotomateNameArea">';
		htmlContent += '<div class="displayTitleClass">LOTO EXECUTION PLAN</div>';
	htmlContent += '</div>';

	htmlContent += '<div class="moduleContentListArea" style="padding: 10px;">';
		htmlContent += '<table>';
			htmlContent += '<thead>';
				htmlContent += '<tr>';
					htmlContent += '<th class="tableHeader" style="width: 40%;"></td>';
					htmlContent += '<th class="tableHeader" style="width: 60%;"></td>';
				htmlContent += '</tr>';
			htmlContent += '</thead>';
			htmlContent += '<tbody>';
				htmlContent += '<tr style="margin: 5px;">';
					htmlContent += '<td style="padding: 5px;">Loto Process</td>';
					htmlContent += '<td class="newExecData" style="padding: 5px;">';
						htmlContent += '<select id="newexec_select_loto" style="width: 100%; padding: 5px;" required>';
						htmlContent += '<option value="">Select LOTO</option>';
						for(var loto of lotoList) {
							if(loto.id == execData.lotoId) {
								htmlContent += '<option value="'+loto.id+'" selected>'+loto.lotoName+'</option>';
							} else {
								htmlContent += '<option value="'+loto.id+'">'+loto.lotoName+'</option>';
							}
						}
						htmlContent += '</select>';
					htmlContent += '</td>';
				htmlContent += '</tr>';

				htmlContent += '<tr>';
					htmlContent += '<td style="padding: 5px;">Executor</td>';
					htmlContent += '<td style="padding: 5px;">';
						htmlContent += '<select class="newExecData" id="newexec_select_executor" style="width: 100%; padding: 5px;" required>';
						htmlContent += '<option value="">Select Executor</option>';
						for(var user of userList) {
							if(user.id == execData.executorId) {
								htmlContent += '<option value="'+user.userName+'" selected>'+user.userName+' - '+user.firstName+' '+user.lastName+'</option>';
							} else {
								htmlContent += '<option value="'+user.userName+'">'+user.userName+' - '+user.firstName+' '+user.lastName+'</option>';
							}
						}
						htmlContent += '</select>';
					htmlContent += '</td>';
				htmlContent += '</tr>';

				htmlContent += '<tr>';
					htmlContent += '<td style="padding: 5px;">Approver</td>';
					htmlContent += '<td style="padding: 5px;">';
						htmlContent += '<select class="newExecData" id="newexec_select_approver" style="width: 100%; padding: 5px;" required>';
						htmlContent += '<option value="">Select Approver</option>';
						for(var user of userList) {
							if(user.id == execData.approverId) {
								htmlContent += '<option value="'+user.userName+'" selected>'+user.userName+' - '+user.firstName+' '+user.lastName+'</option>';
							} else {
								htmlContent += '<option value="'+user.userName+'">'+user.userName+' - '+user.firstName+' '+user.lastName+'</option>';
							}
						}
						htmlContent += '</select>';
					htmlContent += '</td>';
				htmlContent += '</tr>';

				htmlContent += '<tr>';
					htmlContent += '<td style="padding: 5px;">Execution Date</td>';
					htmlContent += '<td style="padding: 5px;">';
						htmlContent += '<input type="date" class="newExecData" id="newexec_date" style="width: 100%; padding: 5px;" value='+execData.executionDate+' required />';
					htmlContent += '</td>';
				htmlContent += '</tr>';

				htmlContent += '<tr>';
					htmlContent += '<td style="padding: 5px;">Note</td>';
					htmlContent += '<td style="padding: 5px;">';
						if(execData.approvalNote == undefined) {execData.approvalNote = "";}
						htmlContent += '<input type="text" class="newExecData" id="newexec_note" style="width: 100%; padding: 5px;" value="'+execData.approvalNote+'" />';
					htmlContent += '</td>';
				htmlContent += '</tr>';

			htmlContent += '</tbody>';
		htmlContent += '</table>';
		htmlContent += '<div style="width: 100%; display: flex; justify-content: space-around;"><div class="btnStyle" onclick="saveLotomateExecutionPlan()">SAVE <span><i class="fas fa-save"></i></span></div></div>';

	htmlContent += '</div>';

	$('#lotomateProcessViewerArea').html(htmlContent);
}

function saveLotomateExecutionPlan() {
    let id = $('#newexec_id').val();
    let lotoId = $('#newexec_select_loto :selected').val();
    let executor = $('#newexec_select_executor :selected').val();
    let approver = $('#newexec_select_approver :selected').val();
    let date = $('#newexec_date').val();
    let note = $('#newexec_note').val();

    if (lotoId != null && lotoId !== "" && executor != null && executor !== "" && approver != null && approver !== "" && date != null && date !== "") {

        const data = {
            token: shared.mCustomerDetailsJSON.token,
            id: id,
            lotoId: lotoId,
            executor: executor,
            approver: approver,
            date: date,
            note: note
        };

        RequestOptions(
            constructUrl("/lotomateexecutions/restsavenewlotomateexecution"),
            "POST",
            data
        ).then(request => {
            Http.request(request).then(res => {
                if (isValidResponse(res, "getformtemplate") && res.data) {
                    const jqXHR = (typeof res.data === "string" ? JSON.parse(res.data) : res.data);

                    if (jqXHR != null) {
                        if (jqXHR.error !== "invalid_token") { // Token still valid
                            showDialog("Execution plan saved.", "getLotomateExecutionList()");
                        } else { // Invalid Token → regenerate
                            getNewToken("saveLotomateExecutionPlan()");
                        }
                    }
                }
            }).catch(err => {
                console.error("Execution plan save failed!", err);
                apiRequestFailed(err, constructUrl("/lotomateexecutions/restsavenewlotomateexecution"));
            });
        }).catch(err => {
            console.warn("Request aborted due to missing requestOptions.", err);
        });

    } else {
        if (lotoId == null || lotoId === "") {
            showDialog("** Please select LOTO process!");
        } else if (executor == null || executor === "") {
            showDialog("** Please select LOTO executor!");
        } else if (approver == null || approver === "") {
            showDialog("** Please select LOTO execution approver!");
        } else if (date == null || date === "") {
            showDialog("** Please select LOTO execution date!");
        }
    }
}

function displayLotomateProcess(index, task) {
	$('#modulesMenuArea').hide();
	$('#modulesListArea').hide();
	$('#modulesDisplayArea').show();
	$('#modulesDisplayArea').html('<div id="moduleDisplayBox" class="lightBkClass" style="padding-bottom: 50px;"></div>');
	currentLotoIndex = index;
	shared.currentState = "displayLotomateProcess";

	let process = lotomateProcessList[index];
	if(process != null) {
		var execution = null;
		if(task.startsWith("TASK_EXECUTE")) {
			execution = lotomateExecutionList.find(item => item.id === process.id);
		} 
		

		//let task = getLotoTask(index, taskName);
		// if(taskName.startsWith("TASK_EXECUTE")) {
		// 	execution = lotomateExecutionList[index];
		// }

		//$('#loadingmessage').show();		
		var htmlContent = '';

		htmlContent += '<div class="moduleNameArea" id="moduleLotomateNameArea">';
			htmlContent += '<div class="moduleTextClass">';;
				htmlContent += '<div class="displayTitleClass" style="text-align: left;">'+process.lotoName+'</div>';
				htmlContent += '<div class="moduleDescriptionClass">'+process.description+'</div>';
				var statusInfo = [];
				let sCount = 0;
				if(process.complete == false && process.approved == true) {
					statusInfo[sCount] = 'Build: Rejected';
				} else if(process.complete == true && process.approved == false) {
					statusInfo[sCount] = 'Build: Approval Pending';
				} else if(process.complete == true && process.approved == true) {
					statusInfo[sCount] = 'Build: Approved';
				} else {
					statusInfo[sCount] = 'Build: Pending';
				}
				sCount++;
				if(task.startsWith("TASK_EXECUTE")) {
					if(execution != undefined) {
						if(execution.complete == false && execution.approved == true) {
							statusInfo[sCount] = 'Execution: Rejected';
						} else if(execution.complete == true && execution.approved == false) {
							statusInfo[sCount] = 'Execution: Approval Pending';
						} else if(execution.complete == true && execution.approved == true) {
							statusInfo[sCount] = 'Execution: Approved';
						} else {
							statusInfo[sCount] = 'Execution: pending';
						}
					}
				}

				if(statusInfo != '') {htmlContent += '<div class="moduleDescriptionClass">'+statusInfo.join(', ')+'</div>';}
			
			htmlContent += '</div>';
		htmlContent += '</div>';

		htmlContent += '<div id="projectContentArea" style="position: relative;">';
			htmlContent += '<div style="border-right: 1px solid rgb(200,200,200);">';
				htmlContent += '<div id="loto_header" style="padding: 10px; position: relative;"></div>';
				htmlContent += '<div id="loto_footer" style="padding: 10px; position: relative;"></div>';
			htmlContent += '</div>';
			htmlContent += '<div>';
				htmlContent += '<div id="loto_process" style="padding: 10px; position: relative;"></div>';
			htmlContent += '</div>';
		htmlContent += '</div>';
		
		if(task === "TASK_BUILD_CREATE") {
			htmlContent += '<div class="lotoModuleFooterArea" id="lmBuildCreate" style="width: 100%; padding: 10px;">';
				htmlContent += '<textarea id="lotoNote" placeholder="Note" value="'+process.approvalNote+'" style="width: 100%; padding: 5px;"></textarea>'; 
				htmlContent += '<div style="width: 100%; display: flex; justify-content: space-around;"><div class="btnStyle" onclick="saveLotomateProcessData(\'TASK_BUILD_CREATE\', false, false)">SAVE DRAFT</div><div class="btnStyle" onclick="saveLotomateProcessData(\'TASK_BUILD_CREATE\', true, false)">FINISH</div></div>';
			htmlContent += '</div>';
		} else if(task === "TASK_BUILD_APPROVE") {
			htmlContent += '<div class="lotoModuleFooterArea" id="lmBuildApprove" style="width: 100%; padding: 10px;">';
				htmlContent += '<textarea id="lotoNote" placeholder="Note" value="'+process.approvalNote+'" style="width: 100%; padding: 5px;"></textarea>'; 
				htmlContent += '<div style="width: 100%; display: flex; justify-content: space-around;"><div class="btnStyle" onclick="saveLotomateProcessData(\'TASK_BUILD_APPROVE\', false, true)">REJECT</div><div class="btnStyle" onclick="saveLotomateProcessData(\'TASK_BUILD_APPROVE\', true, true)">APPROVE</div></div>';
			htmlContent += '</div>';
		} else if(task === "TASK_EXECUTE_EXECUTE") {
			htmlContent += '<div class="lotoModuleFooterArea" id="lmExecuteExecute" style="width: 100%; padding: 10px;">';
				htmlContent += '<textarea id="lotoNote" placeholder="Note" value="'+execution.approvalNote+'" style="width: 100%; padding: 5px;"></textarea>'; 
				htmlContent += '<div style="width: 100%; display: flex; justify-content: space-around;"><div class="btnStyle" onclick="saveLotomateExecutionData(\'TASK_EXECUTE_EXECUTE\', false, false)">SAVE DRAFT</div><div class="btnStyle" onclick="saveLotomateExecutionData(\'TASK_EXECUTE_APPROVE\', true, false)">FINISH</div></div>';
			htmlContent += '</div>';
		} else if(task === "TASK_EXECUTE_APPROVE") {
			htmlContent += '<div class="lotoModuleFooterArea" id="lmExecuteApprove" style="width: 100%; padding: 10px;">';
				htmlContent += '<textarea id="lotoNote" placeholder="Note" value="'+execution.approvalNote+'" style="width: 100%; padding: 5px;"></textarea>'; 
				htmlContent += '<div style="width: 100%; display: flex; justify-content: space-around;"><div class="btnStyle" onclick="saveLotomateExecutionData(\'TASK_EXECUTE_APPROVE\', false, true)">REJECT</div><div class="btnStyle" onclick="saveLotomateExecutionData(\'TASK_EXECUTE_APPROVE\', true, true)">APPROVE</div></div>';
			htmlContent += '</div>';
		}

		$('#moduleDisplayBox').html(htmlContent);
		fixModuleHeight("modulesModuleHeader, footerSection", 20, "modulesDisplayArea");

		if(task === "TASK_BUILD_CREATE" || task === "TASK_EXECUTE_EXECUTE") {
			unsavedData = true;
		}
		// Showing forms...
		populateLotoForm(HEADER, task, 0);
	}

}


function populateLotoForm(tableType, task, slideNo) {
  let process = lotomateProcessList[currentLotoIndex];
  let lotomateProcessId = process.id;
  let destinId = '';
  let formId = 0;
  let dataJson = { stepCount: 1, steps: [{}], stepIndexArray: [0] };

  if (tableType == HEADER) {
    destinId = 'loto_header';
    formId = process.headerFormId;
    if (process.headerFormData != null && process.headerFormData.startsWith('{')) {
      dataJson = JSON.parse(process.headerFormData);
    }
  } else if (tableType == FOOTER) {
    destinId = 'loto_footer';
    formId = process.footerFormId;
    if (process.footerFormData != null && process.footerFormData.startsWith('{')) {
      dataJson = JSON.parse(process.footerFormData);
    }
  } else if (tableType == PROCESS) {
    destinId = 'loto_process';
    formId = process.processFormId;
    if (process.processFormData != null && process.processFormData.startsWith('{')) {
      dataJson = JSON.parse(process.processFormData);
    }
  }

  let execution = null;
  let executionData = {};
  if (task.startsWith("TASK_EXECUTE")) {
    if (lotomateExecutionList[currentLotoIndex] != undefined) {
      execution = lotomateExecutionList[currentLotoIndex];
      if (execution.executionData != null && execution.executionData.startsWith('{')) {
        executionData = JSON.parse(execution.executionData);
      }
    }
  }

  const data = { token: shared.mCustomerDetailsJSON.token, templateId: formId };

  buildRequestOptions(
    constructUrl("/api/getformtemplate"),
    "GET",
    data
  ).then(request => {
    Http.request(request).then(res => {
      if (isValidResponse(res, "getformtemplate") && res.data) {
        const templateJson = JSON.parse(res.data.templateData);

        if (templateJson != null) {
          if (templateJson.error !== "invalid_token") {
            let step = 0;
            let stepCount = 1;

            if (dataJson.steps != undefined) {
              if (dataJson.stepIndexArray == undefined) {
                let tempArr = [];
                for (let count = 0; count < dataJson.steps.length; count++) {
                  tempArr[count] = count;
                }
                dataJson.stepIndexArray = tempArr;
                dataJson.stepCount = dataJson.stepIndexArray.length;
              }
              stepCount = dataJson.stepIndexArray.length;
            } else {
              dataJson = { stepCount, steps: [{}], stepIndexArray: [0] };
            }

            let htmlContent = '';
            htmlContent += '<div style="display: flex; justify-content: space-between; align-items: center; position: relative;  background-color: var(--secondary-blue-80pc); color: var(--primary-white); border-radius: 5px 5px 0 0; padding: 10px; width: 100%; font-size: 1.1em;">';

            if (tableType == HEADER) {
              lotomateProcessList[currentLotoIndex].headerFormData = JSON.stringify(dataJson);
              htmlContent += '<div>HEADER</div>';
            } else if (tableType == FOOTER) {
              lotomateProcessList[currentLotoIndex].footerFormData = JSON.stringify(dataJson);
              htmlContent += '<div>FOOTER</div>';
            } else if (tableType == PROCESS) {
              lotomateProcessList[currentLotoIndex].processFormData = JSON.stringify(dataJson);
              htmlContent += '<div>PROCESS</div>';

              if (task == 'TASK_BUILD_CREATE') {
                htmlContent += '<div style="display: flex; position: absolute; right: 0px;">';
                htmlContent += '<div class="listBoxActionButton activeAction1" id="enableSorting" style="margin: 0 10px; transform: rotate(90deg);" onclick="enableSorting(this)"><span class="material-symbols-outlined" style="font-size: 20px; color: var(--primary-white);">sync_alt</span></div>';
                htmlContent += '<div class="listBoxActionButton activeAction1" style="margin: 0 10px;" onclick="addLotomateProcessStep(' + stepCount + ')"><span class="material-symbols-outlined" style="font-size: 25px; color: var(--primary-white);">add</span></div>';
                htmlContent += '</div>';
              }
            }
            htmlContent += '</div>';
            htmlContent += '<div class="carousel" id="lotoSortableList_' + tableType + '">';

            // keep your getNextStep logic here
            function getNextStep(step) {
						var formDataJson = {};
						var newStep = getStepIndex(dataJson.stepIndexArray, step);
						if(dataJson.steps !=  undefined && dataJson.steps.length > step) {
							formDataJson = dataJson.steps[newStep]; 
						}

						let newFormDataStep = Object.keys(formDataJson)[0].split('_').pop(0);

						var executionDataJson = {};
						if(executionData != null && executionData.steps !=  undefined && newStep < executionData.steps.length) {
							executionDataJson = executionData.steps[newStep]; 
						}

						htmlContent += '<div class="carousel-item lotoSortableItem_'+tableType+'" id="lotoSortableItem_'+tableType+'_'+step+'"  >';

						if(tableType === PROCESS) {
							var stepVal = step +1;
							//htmlContent += '<div class="slide slide_1">';
							//htmlContent += '<div class="slideContent">';
							htmlContent += '<div class="lotoProcessStepHeader" onclick="toggleLotoprocessStepDetail(this)">';
								htmlContent += '<div>STEP '+stepVal+'</div>';
								htmlContent += '<div style="display: flex;">';
									// if(step > 0) {
									// 	let nextStep = step-1;
									// 	htmlContent += '<div class="moduleButton" style="margin: 0 10px;" onclick="alterStepPosition('+step+', '+nextStep+', '+lotomateProcessId+')"><i class="fas fa-arrow-up"></i></div>';
									// }
									// if(step < stepCount-1) {
									// 	let nextStep = step+1;
									// 	htmlContent += '<div class="moduleButton" style="margin: 0 10px;" onclick="alterStepPosition('+step+', '+nextStep+', '+lotomateProcessId+')"><i class="fas fa-arrow-down"></i></div>';
									// }
									if(stepCount > 1) {
										htmlContent += '<div class="moduleButton" style="margin: 5px; height: 30px;" onclick="warnDeleteStepIndex('+step+', '+lotomateProcessId+')"><span class="material-symbols-outlined" style="font-size: 25px; line-height: 1; color: var(--secondary-orange);">delete</span></div>';
									}
								htmlContent += '</div>';
							htmlContent += '</div>';
							htmlContent += '<div class="content-wrapper">';
							htmlContent += '<div class="lotoprocessStepDetail" id="lotoprocessStepDetail_'+tableType+'_'+step+'">';
						} else {
							htmlContent += '<div id="lotoprocessStepDetail_'+tableType+'_0">';
						}

							htmlContent += '<table class="formTemplateTable lotoTable lotoTable_'+tableType+'" id="lotoTable_'+tableType+'_'+newFormDataStep+'" style=" width: 100%; background-color: white; table-layout: fixed;">';
								htmlContent += '<thead>';
									htmlContent += '<tr>';
										htmlContent += '<th class="tableHeader" style="width: 25%;"></td>';
										htmlContent += '<th class="tableHeader" style="width: 75%;"></td>';
									htmlContent += '</tr>';
								htmlContent += '</thead>';
								htmlContent += '<tbody>';
									if(templateJson.tr.length > 0) {
										for(var rowNum in templateJson.tr) {
											var tr = templateJson.tr[rowNum];
											for(var colNum in tr.td) {
												var td = tr.td[colNum];
												if(td.class == "formdata") {
													var label = "";
													if((colNum > 0) && (td.label == "") && (colNum > 0) && (templateJson.tr[rowNum].td[colNum-1].type == "text")) {
														label = templateJson.tr[rowNum].td[colNum-1].value;
													} else {
														label = td.label;
													}
													var newtdid = td.id+'_'+tableType+'_'+newFormDataStep;
													htmlContent += '<tr>';
														
														htmlContent += '<td class="tableBody">'+label+'</td>';
														htmlContent += '<td class="tableBody" >';
															if(td.type.includes('lookup')) {
																var typeArr = td.type.split('---');
																var cellType = typeArr[0];
																var lookupType = typeArr[1];

																htmlContent += '<input id="lookupTable_'+newtdid+'" style="display: none;" />';
																if(task === "TASK_BUILD_CREATE") {
																	htmlContent += '<select class="templateSelectbox" id="select_'+newtdid+'" style="width: 100%; padding: 5px; background-color: rgb(235 250 255);" onchange="populateSelectedColumnValue(this, \''+lookupType+'\', \''+cellType+'\', \''+newtdid+'\')" >';
																	htmlContent += '<option value="">Select Content</option>';
																	htmlContent += '</select>';
																}
																
																if(td.type.startsWith("inputImage")) {
																	htmlContent += '<input class="templatebox '+td.class+'" id="'+newtdid+'" data-label="'+td.label+'" data-rownum='+rowNum+' data-colnum='+colNum+' data-type='+td.type+' style="display: none;" value="'+formDataJson[newtdid]+'" />';
																	htmlContent += '<div style="position: relative; width: 100%; min-height: 100px;">';
																	if(tableType === PROCESS) {
																		htmlContent += '<img class="lmpreview" id="lmpreview_'+newtdid+'" style="'+td.style+' max-height: 300px; border: none; object-fit: contain;" onerror="this.onerror=null;this.src=\'./img/noimage.jpg\';" />';
																	} else {
																		htmlContent += '<img class="lmpreview" id="lmpreview_'+newtdid+'" style="'+td.style+' max-height: 300px; max-width: 50%; margin: 0 25%; border: none; object-fit: contain;" onerror="this.onerror=null;this.src=\'./img/noimage.jpg\';" />';
																	}
																	htmlContent += '</div>';
																} else {
																	var txt = '';
																	if(formDataJson[newtdid] != null && formDataJson[newtdid].length > 0) {
																		txt = formDataJson[newtdid].replace(/^\s+|\s+$/g, '');
																		var lineArr = txt.split('<br>');
																		txt = lineArr.join('\n');
																	}
																	htmlContent += '<div contenteditable="true" class="templatebox '+td.class+'" id="'+newtdid+'" data-label="'+td.label+'" data-rownum='+rowNum+' data-colnum='+colNum+' data-type='+td.type+'  style="width: 100%;">'+txt+'</div>';
																}
															} else if(td.type.includes('linkedcell')) {
																
																if(td.type.startsWith("inputImage")) {
																	htmlContent += '<input class="templatebox '+td.class+'" id="'+newtdid+'" data-label="'+td.label+'" data-rownum='+rowNum+' data-colnum='+colNum+' data-type='+td.type+' style="display: none;" value="'+formDataJson[newtdid]+'" />';
																	htmlContent += '<div style="position: relative; width: 100%; min-height: 100px;">';
																	if(tableType === PROCESS) {
																		htmlContent += '<img class="lmpreview" id="lmpreview_'+newtdid+'" style="'+td.style+' max-height: 300px; border: none; object-fit: contain;" onerror="this.onerror=null;this.src=\'./img/noimage.jpg\';" />';
																	} else {
																		htmlContent += '<img class="lmpreview" id="lmpreview_'+newtdid+'" style="'+td.style+' max-height: 300px; max-width: 50%; margin: 0 25%; border: none; object-fit: contain;" onerror="this.onerror=null;this.src=\'./img/noimage.jpg\';" />';
																	}
																	htmlContent += '</div>';
																} else {
																	htmlContent += '<input class="templatebox '+td.class+'" id="'+newtdid+'" data-rownum='+rowNum+' data-colnum='+colNum+' data-type='+td.type+' style="display: none;"  value="'+formDataJson[newtdid]+'"/>';
																	var txt = '';
																	if(formDataJson[newtdid] != null && formDataJson[newtdid].length > 0) {
																		txt = formDataJson[newtdid].replace(/^\s+|\s+$/g, '');
																		var lineArr = txt.split('<br>');
																		txt = lineArr.join('\n');
																	}
																	htmlContent += '<div contenteditable="true" class="txtPreview" id="txtpreview_'+newtdid+'" style="width: 100%; height: auto;" >'+txt+'</div>';
																}
																
															} else {
																if(td.type.startsWith("text")) {
																	if(td.class == "") {td.class = "formlabel";}
																	htmlContent += '<div class="'+td.class+'" id="'+newtdid+'" data-rownum='+rowNum+' data-colnum='+colNum+' data-type='+td.type+' style="width:100%;">'+td.value+'</div>';
																} else if(td.type.startsWith("image")) {
																	htmlContent += '<div style="position: relative; width: 100%; min-height: 100px;">';
																		htmlContent += '<img id="lmpreview_'+newtdid+'" data-rownum='+rowNum+' data-colnum='+colNum+' data-type='+td.type+' src="'+td.value+'" id="myImage" />';
																	htmlContent += '</div>';
																} else if(td.type.startsWith("inputText")) {
																	htmlContent += '<input type="text" class='+td.class+' id="'+newtdid+'" data-rownum='+rowNum+' data-colnum='+colNum+' data-type='+td.type+' style="width: 100%;" value="'+formDataJson[newtdid]+'" />';
																} else if(td.type.startsWith("inputNumber")) {
																	htmlContent += '<input type="number" class='+td.class+' id="'+newtdid+'" data-rownum='+rowNum+' data-colnum='+colNum+' data-type='+td.type+' style="width: 100%;" value="'+formDataJson[newtdid]+'" />';
																} else if(td.type.startsWith("inputCb")) {
																	if(formDataJson[newtdid] == 'on') {
																		htmlContent += '<input type="checkbox" class='+td.class+' id="'+newtdid+'" data-rownum='+rowNum+' data-colnum='+colNum+' data-type='+td.type+' style="width: 100%;" value="on" onChange="$(this).val(this.checked? \'on\': \'off\');" checked />';
																	} else {
																		htmlContent += '<input type="checkbox" class='+td.class+' id="'+newtdid+'" data-rownum='+rowNum+' data-colnum='+colNum+' data-type='+td.type+' style="width: 100%;" value="off" onChange="$(this).val(this.checked? \'on\': \'off\');" />';
																	}
																} else if(td.type.startsWith("inputDate")) {
																	htmlContent += '<input type="date" class='+td.class+' id="'+newtdid+'" data-rownum='+rowNum+' data-colnum='+colNum+' data-type='+td.type+' style="width: 100%;" value="'+formDataJson[newtdid]+'"/>';
																} else if(td.type.startsWith("inputImage")) {
																	htmlContent += '<input type="text" class='+td.class+' id="'+newtdid+'" data-rownum='+rowNum+' data-colnum='+colNum+' data-type='+td.type+' style="display: none;" value="'+formDataJson[newtdid]+'" />';
																	htmlContent += '<div style="display: flex; flex-wrap: wrap; position: relative;">';
																		if(tableType === PROCESS) {
																			htmlContent += '<img class="lmpreview" id="lmpreview_'+newtdid+'" style="'+td.style+' max-height: 300px; border: none; object-fit: contain;" onerror="this.onerror=null;this.src=\'./img/noimage.jpg\';"/>';
																		} else {
																			htmlContent += '<img class="lmpreview" id="lmpreview_'+newtdid+'" style="'+td.style+' max-height: 300px; max-width: 50%; margin: 0 25%; border: none; object-fit: contain;" onerror="this.onerror=null;this.src=\'./img/noimage.jpg\';"/>';
																		}
																		if(task === "TASK_BUILD_CREATE") {
																			htmlContent += '<div style="display: flex; align-items: center; justify-content: space-evenly; width: 100%; height: 100%; position: absolute; top: 0;">';
																				let fileName = "";
																				if(isImageUrlValid(formDataJson[newtdid]) == true) {
																					fileName = formDataJson[newtdid].split('/').pop(0);
																				} else {
																					fileName = 'lm_'+(lotomateProcessId+'_'+formId+'_'+newtdid).replace(/[-:.]/g,'')+".jpg";
																				}
																				var imageQuality = 60;
																				if(systemConfiguration.systemInfo.lotoMateImageQuality != undefined) {
																					imageQuality = parseInt(systemConfiguration.systemInfo.lotoMateImageQuality);
																				}
																				var imageResolution = 600;
																				if(systemConfiguration.systemInfo.lotoMateImagePixel != undefined) {
																					imageResolution = parseInt(systemConfiguration.systemInfo.lotoMateImagePixel);
																				}
																				
																				// htmlContent += '<div class="moduleImageButton" id="cameraButton" onclick="captureImage(\'lmpreview_'+newtdid+'\', '+Camera.PictureSourceType.CAMERA+', \'lotomate_images/\', \''+fileName+'\', '+imageQuality+', '+imageResolution+')"><span><i class="fas fa-camera"></i></span></div>';
																				// htmlContent += '<div class="moduleImageButton" id="galleryButton" onclick="captureImage(\'lmpreview_'+newtdid+'\', '+Camera.PictureSourceType.PHOTOLIBRARY+', \'lotomate_images/\', \''+fileName+'\', '+imageQuality+', '+imageResolution+')"><span><i class="fas fa-photo-video"></i></span></div>';
																				htmlContent += '<div class="moduleImageButton" id="cameraButton" onclick="captureImage(\'lmpreview_'+newtdid+'\', '+navigator.camera.PictureSourceType.CAMERA+', \'lotomate_images/\', \''+fileName+'\', '+imageQuality+', '+imageResolution+')"><span><i class="fas fa-camera"></i></span></div>';
																				htmlContent += '<div class="moduleImageButton" id="galleryButton" onclick="captureImage(\'lmpreview_'+newtdid+'\', '+navigator.camera.PictureSourceType.PHOTOLIBRARY+', \'lotomate_images/\', \''+fileName+'\', '+imageQuality+', '+imageResolution+')"><span><i class="fas fa-photo-video"></i></span></div>';
																			htmlContent += '</div>';
																		}
																	htmlContent += '</div>';
																} else if((td.type.startsWith("inputSingleSelect")) || (td.type.startsWith("inputMultiSelect"))) {
																	htmlContent += '<div id="select_'+newtdid+'" data-label="'+td.label+'" data-options="'+td.options+'">';
																		if((td.options != undefined) && (td.options.length > 0)) {
																			var oprionsArr = td.options.split('#');
																			for(var index in oprionsArr) {
																				if(td.type == "inputMultiSelect") {
																					if((formDataJson[newtdid] != undefined) && (formDataJson[newtdid].includes(oprionsArr[index]))) {
																						htmlContent += '<input type="checkbox" id="option_'+newtdid+'_'+index+'" name="'+newtdid+'" value="'+oprionsArr[index]+'" checked /><label class="templatelabel" for="option_'+newtdid+'_'+index+'" >'+oprionsArr[index]+'</label><br>';
																					} else {
																						htmlContent += '<input type="checkbox" id="option_'+newtdid+'_'+index+'" name="'+newtdid+'" value="'+oprionsArr[index]+'" /><label class="templatelabel" for="option_'+newtdid+'_'+index+'" >'+oprionsArr[index]+'</label><br>';
																					}
																				} else {
																					if((formDataJson[newtdid] != undefined) && (formDataJson[newtdid].includes(oprionsArr[index]))) {
																						htmlContent += '<input type="radio" id="option_'+newtdid+'_'+index+'" name="'+newtdid+'" value="'+oprionsArr[index]+'" checked /><label class="templatelabel" for="option_'+newtdid+'_'+index+'" >'+oprionsArr[index]+'</label><br>';
																					} else {
																						htmlContent += '<input type="radio" id="option_'+newtdid+'_'+index+'" name="'+newtdid+'" value="'+oprionsArr[index]+'" /><label class="templatelabel" for="option_'+newtdid+'_'+index+'" >'+oprionsArr[index]+'</label><br>';
																					}
																				}
																			}
																			htmlContent += '<input class='+td.class+' id="'+newtdid+'" data-rownum='+rowNum+' data-colnum='+colNum+' data-type='+td.type+' value="'+formDataJson[newtdid]+'" style="display:none;" />';
																		}
																	htmlContent += '</div>';
																}
															}
														htmlContent += '</td>';
													htmlContent += '</tr>';
												}

												if(colNum == tr.td.length-1) {			// Finished one step
													if(rowNum == templateJson.tr.length-1) {	// Finished all steps
														htmlContent += '</tbody>';
														htmlContent += '</table>';

														if(tableType === PROCESS) {
															if(task.startsWith('TASK_EXECUTE')) {
																// Add execution proof form
																htmlContent += '<div style="font-size: 1.3em; margin: 30px 0 5px 0;">Proof of execution</div>';
																htmlContent += '<table class="lotoTable lotoExecuteTable_'+tableType+'" id="lotoExecuteTable_'+tableType+'_'+newFormDataStep+'" style="width: 100%; background-color: white; table-layout: fixed;">';
																	htmlContent += '<thead>';
																		htmlContent += '<tr>';
																			htmlContent += '<th class="tableHeader" style="width: 50%;"></td>';
																			htmlContent += '<th class="tableHeader" style="width: 50%;"></td>';
																		htmlContent += '</tr>';
																	htmlContent += '</thead>';
																	htmlContent += '<tbody>';
																		htmlContent += '<tr>';
																			let newExecId = "lmexecute_"+newFormDataStep+"_0";
																			htmlContent += '<td class="tableBody">';
																				htmlContent += '<input type="text" class="lmexecute" id="'+newExecId+'" data-type="inputImage" style="display: none;" value="'+executionDataJson[newExecId]+'" />';
																				htmlContent += '<div style="display: flex; flex-wrap: wrap; position: relative;">';
																					htmlContent += '<img class="lmpreview" id="lmpreview_'+newExecId+'" src="../img/noimage.jpg" style="height: 200px; width: 100%; border: none; object-fit: contain;" onerror="this.onerror=null;this.src=\'./img/noimage.jpg\';"/>';
																					if(task === "TASK_EXECUTE_EXECUTE") {
																						htmlContent += '<div style="display: flex; align-items: center; justify-content: space-evenly; width: 100%; height: 100%; position: absolute; top: 0;">';
																							let fileName = "";
																							if(isImageUrlValid(executionDataJson[newExecId]) == true) {
																								fileName = executionDataJson[newExecId].split('/').pop(0);
																							} else {
																								fileName = 'lm_'+(execution.id+'_'+newExecId).replace(/[-:.]/g,'')+".jpg";
																							}
																							var imageQuality = 60;
																							if(systemConfiguration.systemInfo.lotoMateImageQuality != undefined) {
																								imageQuality = parseInt(systemConfiguration.systemInfo.lotoMateImageQuality);
																							}
																							var imageResolution = 600;
																							if(systemConfiguration.systemInfo.lotoMateImagePixel != undefined) {
																								imageResolution = parseInt(systemConfiguration.systemInfo.lotoMateImagePixel);
																							}
																							
																							// htmlContent += '<div class="moduleImageButton" id="cameraButton" onclick="captureImage(\'lmpreview_'+newExecId+'\', '+Camera.PictureSourceType.CAMERA+', \'lotomate_images/\', \''+fileName+'\', '+imageQuality+', '+imageResolution+')"><span><i class="fas fa-camera"></i></span></div>';
																							// htmlContent += '<div class="moduleImageButton" id="galleryButton" onclick="captureImage(\'lmpreview_'+newExecId+'\', '+Camera.PictureSourceType.PHOTOLIBRARY+', \'lotomate_images/\', \''+fileName+'\', '+imageQuality+', '+imageResolution+')"><span><i class="fas fa-photo-video"></i></span></div>';
																							htmlContent += '<div class="moduleImageButton" id="cameraButton" onclick="captureImage(\'lmpreview_'+newExecId+'\', '+navigator.camera.PictureSourceType.CAMERA+', \'lotomate_images/\', \''+fileName+'\', '+imageQuality+', '+imageResolution+')"><span><i class="fas fa-camera"></i></span></div>';
																							htmlContent += '<div class="moduleImageButton" id="galleryButton" onclick="captureImage(\'lmpreview_'+newExecId+'\', '+navigator.camera.PictureSourceType.PHOTOLIBRARY+', \'lotomate_images/\', \''+fileName+'\', '+imageQuality+', '+imageResolution+')"><span><i class="fas fa-photo-video"></i></span></div>';
																						htmlContent += '</div>';
																					}
																				htmlContent += '</div>';
																			htmlContent += '</td>';

																			newExecId = "lmexecute_"+newFormDataStep+"_1";
																			htmlContent += '<td class="tableBody">';
																				if(task === "TASK_EXECUTE_EXECUTE") {
																					htmlContent += '<input type="text" class="lmexecute" id="'+newExecId+'" data-type="inputText" placeholder="Note" style="width: 100%;" value="'+executionDataJson[newExecId]+'" />';
																				} else {
																					htmlContent += '<input type="text" class="lmexecute" id="'+newExecId+'" data-type="inputText" placeholder="Note" style="width: 100%; border: none;" value="'+executionDataJson[newExecId]+'" readonly />';
																				}
																			htmlContent += '</td>';
																		htmlContent += '</tr>';
																	htmlContent += '</tbody>';
																htmlContent += '</table>';
															
															} /*else if(task === "TASK_BUILD_CREATE") {
																if(step == stepCount-1) {
																	htmlContent += '<div style="width: 100%; display: flex; justify-content: space-around;"><div class="btnStyle" onclick="addLotomateProcessStep('+stepCount+')">ADD STEP <i class="fas fa-plus"></i></div></div>';
																} else {
																	let nextStep = step+1;
																	htmlContent += '<div style="width: 100%; display: flex; justify-content: space-around;"><div class="btnStyle" onclick="addLotomateProcessStep('+nextStep+')">INSERT STEP <i class="fas fa-plus"></i></div></div>';
																}
															}*/
															// htmlContent += '</div></div>'; // closing slide and slideContent
															if(tableType === PROCESS) {
																htmlContent += '</div>';	// closing content-wrapper
															}
															htmlContent += '</div>';// closing lotoprocessSetpDetail
															htmlContent += '</div>';// closing lotoSortableItem_x
														}

														step++;
														if(step < stepCount) {
															getNextStep(step);
														} else {				// Finished all steps
															// if(tableType === PROCESS) {
																// htmlContent += '</div></div>'; // closing sliderContentArea and slider
															// }
															htmlContent += '</div>'; // closing lotoSortableList_x

															//let parentElem = document.getElementById(destinId);
															$('#'+destinId).html(htmlContent);
															
															if(task != "TASK_BUILD_CREATE") {
																$('#'+destinId+' .formdata').css('border', 'none');
																$('#'+destinId+' .formdata').attr('readonly', true);
																$('#'+destinId+' .txtPreview').css('border', 'none');
																$('#'+destinId+' .txtPreview').attr('readonly', true);
																$('#'+destinId+' .templateSelectbox').attr('disabled', true);
															}
								
															let destinElem = document.getElementById(destinId);
															formatAndLoadImages(destinElem);
															if(tableType == HEADER) {
																populateLotoForm(FOOTER, task, 0);
															} else if(tableType == FOOTER) {
																populateLotoForm(PROCESS, task, 0);
															} else {
																if(task == 'TASK_BUILD_CREATE') {
																	sortable = new Sortable(document.getElementById('lotoSortableList_'+PROCESS), {
																		animation: 150,
																		ghostClass: 'ghost',
																		direction: 'vertical',
																		//swapThreshold: 0.65,    // How far you need to drag over to swap
																		dragClass: 'dragging',   // Optional class during dragging
																	});
																	sortable.option("disabled", true);
																}
															}
														}
													}
												}
											}
										}
									}

			        }
            getNextStep(step);

          } else {
            // invalid token → regenerate
            getNewToken(`populateLotoForm(${tableType}, '${task}', ${slideNo})`);
          }
        }
      }
    }).catch(err => {
      console.error("populateLotoForm request failed!", err);
      apiRequestFailed(err, "getformtemplate");
    });
  }).catch(err => {
    console.warn("Request aborted due to missing requestOptions.", err);
  });
}

function enableSorting(that) {
	const button = that;
    const sortingEnabled = button.classList.contains('sortableOn');

    if (sortingEnabled) {
      sortable.option("disabled", true);
      button.classList.remove('sortableOn');
    } else {
      sortable.option("disabled", false);
      button.classList.add('sortableOn');

      // Collapse all items when sorting is enabled
      document.querySelectorAll('.carousel-item.expanded').forEach(item => {
        item.classList.remove('expanded');
        const wrapper = item.querySelector('.content-wrapper');
        if (wrapper) wrapper.style.height = '0px';
      });
    }
}

function toggleLotoprocessStepDetail(clickedItemTitle) {
	let clickedItem = clickedItemTitle.parentElement;
	// Disable sorting on expand
	sortable.option("disabled", true);
	document.getElementById('enableSorting').classList.remove('sortableOn');

	const allItems = document.querySelectorAll('.carousel-item');
	allItems.forEach(item => {
		if (item !== clickedItem) {
			item.classList.remove('expanded');
			const wrapper = item.querySelector('.content-wrapper');
			if (wrapper) wrapper.style.height = '0px';
		}
	});

	clickedItem.classList.toggle('expanded');
	const wrapper = clickedItem.querySelector('.content-wrapper');
	const content = wrapper.querySelector('.lotoprocessStepDetail');
	if (clickedItem.classList.contains('expanded')) {
		wrapper.style.height = content.scrollHeight + 'px';
	} else {
		wrapper.style.height = '0px';
	}
}

function formatAndLoadImages(parentElem) {
	var formDataElems = parentElem.querySelectorAll('.formdata');
	let elemIndex = 0;
	function getNextElement(elemIndex) {
		let elem = formDataElems[elemIndex];
		if(elem.value == 'undefined') {
			elem.value = '';
		}
		elemIndex++;
		if(elem.dataset.type != undefined) {
			if (elem.dataset.type.includes('lookup')) {
				populateLookupTable(elem);
			}
			if (elem.dataset.type.startsWith('inputImage')) {
				var imageElem = elem.closest('TD').querySelector('img');
				populateImage(imageElem.id, elem.value);
				$(imageElem).on('click', function() {
					viewLmFullScreenImage(this);
				});
			}

			if(elemIndex < formDataElems.length) {
				getNextElement(elemIndex);
			} else {
				if(parentElem.id == 'loto_process') {
					// To go to the last blank slide after new step is added
					// initSlider(1, 300, false).then(pass => {
					// 	if(pass) {
					// 		if(task === "TASK_BUILD_CREATE") {
					// 			goToSlide(1, slideNo);
					// 		}
					// 	}
					// });
				}
			}
		} else {
			if(elemIndex < formDataElems.length) {
				getNextElement(elemIndex);
			} else {
				// if(parentElem == 'loto_process') {
				// 	initSlider(1, 300, false);
				// }
			}
		}
	}
	if(formDataElems != null && formDataElems.length > 0) {
		getNextElement(elemIndex);
	}

	var execDataElems = parentElem.querySelectorAll('.lmexecute');
	let execIndex = 0;
	function getNextExec(execIndex) {
		let elem = execDataElems[execIndex];
		if(elem.value == 'undefined') {
			elem.value = '';
		}
		execIndex++;
		if(elem.dataset.type != undefined) {
			if (elem.dataset.type.startsWith('inputImage')) {
				var imgElem = elem.closest('TD').querySelector('img');
				populateImage(imgElem.id, elem.value);
			}

			if(execIndex < execDataElems.length) {
				getNextExec(execIndex);
			}
		} else {
			if(execIndex < execDataElems.length) {
				getNextExec(execIndex);
			}
		}
	}
	if(execDataElems != null && execDataElems.length > 0) {
		getNextExec(elemIndex);
	}

	// $('textarea').each(function() {
	// 	$(this).height((this.scrollHeight)+'px');
	// 	//$(this).height('auto');
	// });
	//$('#loadingmessage').hide();
}


function populateLookupTable(elem) {
  if (tableList != null && tableList.length > 0) {
    populateLookupTableOptions(elem);
  } else {
    const data = { token: shared.mCustomerDetailsJSON.token };

    buildRequestOptions(
      constructUrl("/tablenamelookups/restgettablenamelookups"),
      "GET",
      data
    ).then(request => {
      Http.request(request).then(res => {
        if (isValidResponse(res, "restgettablenamelookups") && res.data) {
          const jqXHR = (typeof res.data === "string" ? JSON.parse(res.data) : res.data);

          if (jqXHR != null) {
            if (jqXHR.error !== "invalid_token") {
              tableList = jqXHR;
              populateLookupTableOptions(elem);
            } else {
              getNewToken("populateLookupTable(" + elem + ")");
            }
          }
        }
      }).catch(err => {
        console.error("Lookup table request failed!", err);
        apiRequestFailed(err, "restgettablenamelookups");
      });
    }).catch(err => {
      console.warn("Request aborted due to missing requestOptions.", err);
    });
  }
}


function populateLookupTableOptions(elem) {
  const typeArr = elem.dataset.type.split('---');
  const lookupType = typeArr[1];
  const tableName = typeArr[2];
  const tables = tableList.filter(item => item.tableName === tableName);
  let table = null;

  if ((tables != null) && (tables.length > 0)) {
    table = tables[0];
  }

  const columnIndex = parseInt(typeArr[3]);
  let columnName = "";
  if (typeArr.length > 4) {
    columnName = typeArr[4];
  }

  const data = { token: shared.mCustomerDetailsJSON.token };
  let arr = table.controllerName.split('/');
  arr[arr.length - 1] = 'rest' + arr[arr.length - 1];
  const newUrl = arr.join('/');

  buildRequestOptions(constructUrl(newUrl), "GET", data).then(request => {
    Http.request(request).then(res => {
      if (isValidResponse(res, newUrl) && res.data) {
        const jqXHR = (typeof res.data === "string" ? JSON.parse(res.data) : res.data);

        if (jqXHR != null) {
          if (jqXHR.error !== "invalid_token") { //  Token valid
            const tableData = jqXHR;

            // Save table data into hidden input
            document.getElementById("lookupTable_" + elem.id).value = JSON.stringify(tableData);

            // Collect column names if not provided
            const columnNames = [];
            if (columnName === "" && tableData.length > 0) {
              for (let x in tableData[0]) {
                columnNames.push(x);
              }
            }

            // Handle lookup type
            if (lookupType === "lookup") {
              const selectElement = document.getElementById("select_" + elem.id);
              let index = 0;

              for (let entity of tableData) {
                const opt = document.createElement("option");
                opt.dataset.tablename = table.tableName;

                let val = "";
                if (columnName !== "" && entity[columnName] !== undefined) {
                  val = entity[columnName];
                } else if (columnNames[columnIndex] !== undefined && entity[columnNames[columnIndex]] !== undefined) {
                  val = entity[columnNames[columnIndex]];
                }

                opt.value = index + "---" + val;

                if (elem.value == val) {
                  opt.selected = true;
                }

                if (val.toString().startsWith("http")) {
                  opt.text = val.split("/").pop(0); // show only file name
                } else {
                  opt.text = val;
                }

                if (selectElement != null) {
                  $(selectElement).append(opt);
                }
                index++;
              }
            }
          } else {
            //  Token refresh
            getNewToken("populateLookupTableOptions(" + elem + ")");
          }
        }
      }
    }).catch(err => {
      console.error("Lookup table options request failed!", err);
      apiRequestFailed(err, newUrl);
    });
  }).catch(err => {
    console.warn("Request aborted due to missing requestOptions.", err);
  });
}

function populateSelectedColumnValue(that, lookupType, cellType, lookupCellId) {
	var optionValueArr = null;
	if(lookupType.includes('lookup')) {
		if(that.value != null) {
			optionValueArr = that.value.split('---');
		}
		
		if(cellType.startsWith('inputImage')) {
			//var imgElem = document.getElementById(lookupCellId).querySelector("img");
			var imgElem = document.getElementById('lmpreview_'+lookupCellId);
			if((optionValueArr != null) && (optionValueArr.length > 1) && (optionValueArr[1].startsWith('http')) && (imgElem != null)) {
				populateImage(imgElem.id, optionValueArr[1]);
			}
		} else {
			if((optionValueArr != null) && (optionValueArr.length > 1)) {
				$('#txtpreview_'+lookupCellId).text(optionValueArr[1]);
			}
		}
		$('#'+lookupCellId).val(optionValueArr[1]);
		var selectedElem = document.getElementById(lookupCellId);
		//templateJson.tr[selectedElem.dataset.rownum].td[selectedElem.dataset.colnum].value = optionValueArr[1];
		var tableData = JSON.parse($('#lookupTable_'+lookupCellId).val());
		var parentTable = selectedElem.closest('table');
		var elems = parentTable.querySelectorAll('.templatebox');

		for(elem of elems) {
			if(elem.dataset.type != undefined && elem.dataset.type.includes('linkedcell')) {
				var typeArr = elem.dataset.type.split('---');
				if(typeArr.length > 2 && lookupCellId.startsWith(typeArr[2])) {		// In LOTO process there is step added in the id, so it's not equal, but it starts with the same

					var columnName = "";
					var columnIndex = 0;
					if(typeArr.length > 4) {
						columnName = typeArr[4]
					} else if(typeArr.length > 3) {
						columnIndex = parseInt(typeArr[3]);
					}

					if(that.selectedIndex > 0) {
						
						if((optionValueArr != null) && (optionValueArr.length > 0)) {
							var entity = tableData[parseInt(optionValueArr[0])];
							var columnNames = [];
							for (var x in entity) {
								columnNames.push(x);
							}

							var val = '';
							if(columnName != "" && entity[columnName] != undefined) {
								val = entity[columnName];
							} else if(columnNames[columnIndex] != undefined && entity[columnIndex] != undefined) {
								val = entity[columnNames[columnIndex]];
							}
							if(typeArr[0].startsWith('inputImage')) {
								//var imgElem = document.getElementById(lookupCellId).querySelector("img");
								var imgElem = document.getElementById('lmpreview_'+elem.id);
								if((val != null) && (val.startsWith('http')) && (imgElem != null)) {
									$(elem).val(val);
									populateImage(imgElem.id, val);
								}
							} else {
								//$('#txtpreview_'+elem.id).text(val);
								$(elem).val(val);
								var lineArr = val.replace(/^\s+|\s+$/g, '').split('<br>');
								var txt = lineArr.join('\n');
								$('#txtpreview_'+elem.id).text(txt);
								$('#txtpreview_'+elem.id).css('height', 'auto');
							}
							
							//templateJson.tr[elem.dataset.rownum].td[elem.dataset.colnum].value = val;
						}
					}
				}
			}
		}
	}
}

function viewLotomateFullScreenImage() {
	$('#fullScreenLotomateImage').show();
}

function closeLotomateFullScreenImage() {
	
	$('#fullScreenLotomateImage').hide();
	//var emageElem
	//$(myElement).hammer().off("tap.anotherNamespace");
}


function saveLotomateProcessData(task, complete, approve) {
  let currentLotoId = lotomateProcessList[currentLotoIndex].id;

  getStepsData(HEADER, 'lotoTable', 'formdata').then(headerData => {
    let headerFormData = '{"stepCount":1, "steps":[{}], "stepIndexArray":[0]}';
    if (headerData != null && headerData !== "") {
      headerFormData = headerData;
    }
    lotomateProcessList[currentLotoIndex].headerFormData = headerFormData;

    getStepsData(FOOTER, 'lotoTable', 'formdata').then(footerData => {
      let footerFormData = '{"stepCount":1, "steps":[{}], "stepIndexArray":[0]}';
      if (footerData != null && footerData !== "") {
        footerFormData = footerData;
      }
      lotomateProcessList[currentLotoIndex].footerFormData = footerFormData;

      getStepsData(PROCESS, 'lotoTable', 'formdata').then(processData => {
        let processFormData = '{"stepCount":1, "steps":[{}], "stepIndexArray":[0]}';
        if (processData != null && processData !== "") {
          processFormData = processData;
        }
        lotomateProcessList[currentLotoIndex].processFormData = processFormData;

        let note = document.getElementById("lotoNote").value;
        lotomateProcessList[currentLotoIndex].approvalNote = note;
        lotomateProcessList[currentLotoIndex].complete = complete;
        lotomateProcessList[currentLotoIndex].approved = approve;

        const postdata = {
          token: shared.mCustomerDetailsJSON.token,
          id: currentLotoId,
          header: headerFormData,
          footer: footerFormData,
          process: processFormData,
          note: note,
          complete: complete,
          approve: approve,
          task: task,
        };

        // Build request 
        RequestOptions(
          constructUrl("/lotomateprocesss/restsaveloto"),
          "POST",
          postdata
        )
          .then(request => {
            Http.request(request)
              .then(res => {
                if (isValidResponse(res, "restsaveloto") && res.data) {
                  const jqXHR =
                    typeof res.data === "string"
                      ? JSON.parse(res.data)
                      : res.data;

                  if (jqXHR != null) {
                    if (jqXHR.error !== "invalid_token") {
                      console.log(JSON.stringify(jqXHR));
                      unsavedData = false;

                      if (complete === false && approve === false) {
                        showDialog("Data saved successfully!");
                      } else {
                        showDialog(
                          "Data saved successfully! Closing form.",
                          "viewAllProcesss()"
                        );
                      }
                    } else {
                      //  Refresh token
                      getNewToken(
                        "saveLotomateProcessData(" +
                          task +
                          ", " +
                          complete +
                          ", " +
                          approve +
                          ")"
                      );
                    }
                  }
                }
              })
              .catch(err => {
                console.error("Save LOTO request failed!", err);
                apiRequestFailed(err, "restsaveloto");
              });
          })
          .catch(err => {
            console.warn(
              "Request aborted due to missing requestOptions.",
              err
            );
          });
      });
    });
  });
}



function saveLotomateExecutionData(task, complete, approve) {
  let currentExecId = lotomateExecutionList[currentLotoIndex].id;

  getStepsData(PROCESS, "lotoExecuteTable", "lmexecute").then(data => {
    let executionData = data;
    lotomateExecutionList[currentLotoIndex].executionData = executionData;

    let note = document.getElementById("lotoNote").value;
    lotomateExecutionList[currentLotoIndex].approvalNote = note;

    const postData = {
      token: shared.mCustomerDetailsJSON.token,
      id: currentExecId,
      data: executionData,
      note: note,
      complete: complete,
      approve: approve,
      task: task,
    };

    RequestOptions(
      constructUrl("/lotomateexecutions/restsavelotomateexecution"),
      "POST",
      postData
    )
      .then(request => {
        Http.request(request)
          .then(res => {
            if (
              isValidResponse(res, "restsavelotomateexecution") &&
              res.data
            ) {
              const jqXHR =
                typeof res.data === "string"
                  ? JSON.parse(res.data)
                  : res.data;

              if (jqXHR != null) {
                if (jqXHR.error !== "invalid_token") {
                  console.log(JSON.stringify(jqXHR));

                  if (complete === false && approve === false) {
                    showDialog("Data saved successfully!");
                  } else {
                    let rootTask = task.replace(
                      "_" + task.split("_").pop(0),
                      ""
                    );
                    showDialog(
                      "Data saved successfully! Closing form.",
                      "viewExecutionProcesss()"
                    );
                  }
                  unsavedData = false;
                } else {
                  //  Refresh token and retry
                  getNewToken(
                    "saveLotomateExecutionData(" +
                      task +
                      ", " +
                      complete +
                      ", " +
                      approve +
                      ")"
                  );
                }
              }
            }
          })
          .catch(err => {
            console.error("Execution save request failed!", err);
            apiRequestFailed(err, "restsavelotomateexecution");
          });
      })
      .catch(err => {
        console.warn(
          "Request aborted due to missing requestOptions.",
          err
        );
      });
  });
}

async function getStepsData(tableType, tableClass, dataClass) {
	// This is to take the editable div data into the input (Hidden field	)
	let txtPreviews = document.getElementsByClassName('txtPreview');
	for(var txtPreview of txtPreviews) {	
		inputElem = document.getElementById(txtPreview.id.replace('txtpreview_', ''));
		inputElem.value = txtPreview.innerHTML;
	}
	let stepIndexArray = [];
	let tables = document.getElementsByClassName(tableClass+'_'+tableType);
	if(tables!= null && tables.length > 0) {
		let tableArray = [];
		for(tableIndex in tables) {
			let table = tables[tableIndex];
			var elems = table.getElementsByClassName(dataClass);
			stepIndexArray.push(parseInt(tableIndex));
			if(elems != null && elems.length > 0) {
				let stepData = {};
				for(elemIndex in elems) {
					elem = elems[elemIndex];
					if(elem.value != undefined) {
						stepData[elem.id] = elem.value;
						console.log('elem.id : elem.value - '+elem.id+' : '+elem.value);
					} else {
						stepData[elem.id] = elem.innerHTML;
						console.log('elem.id : elem.value - '+elem.id+' : '+elem.innerHTML);
					}

					if(elemIndex == elems.length-1) {
						tableArray.push(stepData);
						if(tableIndex == tables.length-1) {
							let stepCount = parseInt(tableIndex)+1;
							return '{"stepCount":'+stepCount+',"steps":'+JSON.stringify(tableArray)+',"stepIndexArray":['+stepIndexArray+']}';
						}
					}

				}
			} else {
				if(tableIndex == tables.length-1) {
					let stepCount = parseInt(tableIndex)+1;
					return '{"stepCount":'+stepCount+',"steps":'+JSON.stringify(tableArray)+',"stepIndexArray":['+stepIndexArray+']}';
				}
			}
		}
	}
}


/********************************************************************* BACK **********************************************************************/
/****************************************************************************************************
 Function: backLotomate
 Purpose: Back button handler for lotoMate
****************************************************************************************************/
export function backLotomateHandle() {
	if (shared.currentState == "departmentlotomateprocess") {
		getLotomateDepartments();
	} else if (shared.currentState == "locationlotomateprocess") {
		getLotomateLocations();
	} else if (shared.currentState == "categorylotomateprocess") {
		getLotomateCategorys();
	} else if (shared.currentState.startsWith("displayLotomateProcess") || shared.currentState.startsWith("displayNewExecution")) {
		if (shared.currentState.endsWith("viewFullScreenImage")) {
			closeLmFullScreenImage();
		} else {
			if (unsavedData === true) {
				showConfirmDialog({
					message: "Any unsaved data will be lost. Proceed?",
					yesLabel: "Proceed",
					noLabel: "Cancel",
					onYes: () => {
						clearSelectionAndShowLotomateListArea();
					},
					onNo: () => {
						console.log("❌ User cancelled backLotomateHandle action");
					}
				});
			} else {
				clearSelectionAndShowLotomateListArea();
			}
		}
	} else {
		shared.currentState = "";
		unsavedData = false;
		exitLotomate();
	}
}

function backMaintenanceHandle() {
	if (shared.currentState.startsWith("displayLotomateProcess") || shared.currentState.startsWith("displayNewExecution")) {
		if (shared.currentState.endsWith("viewFullScreenImage")) {
			closeLmFullScreenImage();
		} else {
			if (unsavedData === true) {
				showConfirmDialog({
					message: "Any unsaved data will be lost. Proceed?",
					yesLabel: "Proceed",
					noLabel: "Cancel",
					onYes: () => {
						clearSelectionAndShowLotomateListArea();
					},
					onNo: () => {
						console.log("❌ User cancelled backMaintenanceHandle action");
					}
				});
			} else {
				clearSelectionAndShowLotomateListArea();
			}
		}
	} else {
		shared.currentState = "";
		unsavedData = false;
		exitLotomate();
	}
}

function closeLotomate() {
	if (unsavedData === true) {
		showConfirmDialog({
			message: "Any unsaved data will be lost. Proceed?",
			yesLabel: "Proceed",
			noLabel: "Cancel",
			onYes: () => {
				exitLotomate();
			},
			onNo: () => {
				console.log("❌ User cancelled closeLotomate action");
			}
		});
	}
}



function clearSelectionAndShowLotomateListArea() {
	unsavedData = false;
	selectedLotomateProcessList = [];
	shared.currentState = shared.currentSourceState;
	$('#modulesMenuArea').show();
	$('#modulesListArea').show();
	$('#modulesDisplayArea').hide();
}

function showLotomateDisplayArea() {
	$('#modulesMenuArea').hide();
	$('#modulesListArea').hide();
	$('#modulesDisplayArea').show();
}


function getStepIndex(stepIndexArray, index) {
	if(stepIndexArray != undefined && index < stepIndexArray.length) {
		return stepIndexArray[index];
	} else {
		return index;
	}
}

function addLotomateProcessStep(position) {
	//let process = lotomateProcessList[currentLotoIndex];
	getStepsData(PROCESS, 'lotoTable', 'formdata').then(data => {
		let dataJson = {};
		//if(data != null && data != "") {processFormData = JSON.stringify(data);}
		if(data != null && data != "") {
			dataJson = JSON.parse(data);
		}

		if(dataJson.steps != undefined) {
			let newStepIndex = dataJson.steps.length;
			dataJson.steps.push({});
			if(position == 0) {
				dataJson.stepIndexArray.unshift(newStepIndex);
			} else if(position >= dataJson.steps.length) {
				dataJson.stepIndexArray.push(newStepIndex);
			} else {
				dataJson.stepIndexArray.splice(position, 0, newStepIndex);
			}
			dataJson.stepCount = dataJson.stepIndexArray.length;
		} else {
			dataJson = {"stepCount":1,"steps":[{}],"stepIndexArray":[0]};
		}

		lotomateProcessList[currentLotoIndex].processFormData = JSON.stringify(dataJson);
		populateLotoForm(PROCESS, "TASK_BUILD_CREATE", position);
	});
}

function warnDeleteStepIndex(position, lotomateProcessId, returnDivId) {
	if (confirm("Cannot be reversed. Sure?") == true) {
		deleteStepIndex(position, lotomateProcessId, returnDivId);
	}
}

function deleteStepIndex(position) {
	getStepsData(PROCESS, 'lotoTable', 'formdata').then(data => {
		let dataJson = JSON.parse(data);
		if(dataJson.stepIndexArray != undefined) {
			//dataJson.steps.splice(dataJson.stepIndexArray[position], 1);
			dataJson.stepIndexArray.splice(position, 1);
		}
		dataJson.stepCount = dataJson.stepIndexArray.length;
		lotomateProcessList[currentLotoIndex].processFormData = JSON.stringify(dataJson);
		//viewTemplateData(lotomateProcessId, 'processformid', returnDivId);
		if(position == dataJson.stepCount) {position = position-1;}
		populateLotoForm(PROCESS, "TASK_BUILD_CREATE", position);
	});
}

function isJson(str) {
    try {
        JSON.parse(str);
    } catch (e) {
        return false;
    }
    return true;
}



function viewLmFullScreenImage(that) {
	var htmlContent = '';

	var objectKey = $('#'+that.id.replace('lmpreview_','')).val();
	if(objectKey.startsWith(s3PrivateUrl)) {
		objectKey = objectKey.replace(s3PrivateUrl, "");
		let destinId = 'img_fsarea';

		getSignedUrl(objectKey, 10).then(url => {
			if(url.startsWith("https://")) {
				htmlContent += '<div class="fullScreenMenuBar" onclick="closeLmFullScreenImage()"><i class="fas fa-times expandCompressBtn"></i></div>';
				htmlContent += '<div style="width:100%; height: 100%" id="'+that.id+'_fs"><img id="'+that.id+'_fs_image" style="width: 100%; max-height: 100%; object-fit: contain;" src="'+url+'" onerror="this.onerror=null;this.src=\'./img/noimage.jpg\';"></div>';
				$('#'+destinId).html(htmlContent);
				initPinchZoom(that.id+'_fs_image');
			}
		});
		shared.currentState = shared.currentState+"__viewFullScreenImage";
		$('#'+destinId).show();
	}
}

function closeLmFullScreenImage() {
	$('#img_fsarea').hide();
	shared.currentState = shared.currentState.split("__")[0];
}



window.viewMaintenance = viewMaintenance;
window.viewLotomate = viewLotomate;
window.exitLotomate = exitLotomate;
window.viewSop = viewSop;
window.displayLotomateMenu = displayLotomateMenu;
window.getMyLoto = getMyLoto;
window.viewAllProcesss = viewAllProcesss;
window.viewBuildProcesss = viewBuildProcesss;
window.viewExecutionProcesss = viewExecutionProcesss;
window.getProcessAtListIndex = getProcessAtListIndex;
window.getLotomateLocations = getLotomateLocations;
window.getLotomateDepartments = getLotomateDepartments;
window.getLotomateCategorys = getLotomateCategorys;
window.searchLotomateDepartmentLocationCategory = searchLotomateDepartmentLocationCategory;
window.getProcesssAtSelected = getProcesssAtSelected;
window.getProcesssAtDepartmentLocationCategory = getProcesssAtDepartmentLocationCategory;
window.searchLotomateprocess = searchLotomateprocess;
window.createLotomateList = createLotomateList;
window.handleLotomateQrCode = handleLotomateQrCode;
window.getLotoTask = getLotoTask;
window.editExecution = editExecution;
window.showNewExeutionForm = showNewExeutionForm;
window.saveLotomateExecutionPlan = saveLotomateExecutionPlan;
window.displayLotomateProcess = displayLotomateProcess;
window.populateLotoForm = populateLotoForm;
window.enableSorting = enableSorting;
window.toggleLotoprocessStepDetail = toggleLotoprocessStepDetail;
window.formatAndLoadImages = formatAndLoadImages;
window.populateLookupTable = populateLookupTable;
window.populateSelectedColumnValue = populateSelectedColumnValue;
window.viewLotomateFullScreenImage = viewLotomateFullScreenImage;
window.closeLotomateFullScreenImage = closeLotomateFullScreenImage;
window.saveLotomateProcessData = saveLotomateProcessData;
window.saveLotomateExecutionData = saveLotomateExecutionData;
window.getStepsData = getStepsData;
window.backLotomateHandle = backLotomateHandle;
window.backMaintenanceHandle = backMaintenanceHandle;
window.clearSelectionAndShowLotomateListArea = clearSelectionAndShowLotomateListArea;
window.addLotomateProcessStep = addLotomateProcessStep;
window.warnDeleteStepIndex = warnDeleteStepIndex;
window.deleteStepIndex = deleteStepIndex;
window.isJson = isJson;
window.viewLmFullScreenImage = viewLmFullScreenImage;
window.closeLmFullScreenImage = closeLmFullScreenImage;