import { Filesystem, Directory, Encoding } from "@capacitor/filesystem"
import { Capacitor } from '@capacitor/core';
import { Device } from "@capacitor/device"
import { Http } from '@capacitor-community/http';
import { Network } from '@capacitor/network';
import { App } from '@capacitor/app';
import $ from 'jquery';
import { Browser } from '@capacitor/browser';

const EDIT = 1;
const VIEW = 0;
const TASK_REPORT = 0;
const TASK_INVESTIGATION = 1;
const TASK_ACTION = 2;
const TASK_AUDIT = 3;
var sitemateConfig = null;
var sitemateLocations = null;
var sitemateDepartments = null;
var mySitemateIncidents = null;
var blankIncident = null;
var userIdAndNames = null;
var sitemateMonths = 1;
var sitemateSearchStr = "";
let searchType ="";
var listItems = [];
let selectedName ="";
let selectedId = 0;
var unsavedData = false;

import { shared , s3PrivateUrl} from "./globals.js";
import { showDialog, initAppRuntimeMonitor, closeDialogBox, getSignedUrl , initPinchZoom ,  constructUrl, convertVersionVal, fixModuleHeight , highlightHeaderTabMenu , populateImage , startAppIdleTimer } from "./utility.js";
import { displaySection, buildRequestOptions, RequestOptions, isValidResponse, showConfirmDialog } from "./capacitor-welcome.js";
import { viewLogin, apiRequestFailed } from "./auth.js";
import {  exitModules } from "./content";
import { getMenuBar , getNewToken } from "./settings.js";
import { createList } from "./list.js";
import { getStyleAttributeInStyles } from "./ert.js";





async function viewSitemate() {
  shared.currentRunningApp = 'siteMate';
  if (shared.mCustomerDetailsJSON != null) {
    $('#moduleTitle').html("INCIDENTS");
    displaySection('modulesSection', 'flex', false, true);
    $('#modulesMenuArea').show();
    $('#modulesListArea').show();
    $('#modulesDisplayArea').hide();

    if (sitemateConfig == null) {
      try {
        await getConfigData();   // <-- no .then, just wait until it finishes
        $('#loadingmessage').hide();
        displaySitemateMenu();

        let btn = document.getElementById("btnId_view_sitemateincidents");
        setTimeout(() => btn.click(), 200);
      } catch (err) {
        console.error("Failed to load SiteMate config:", err);
        showDialog("Could not load SiteMate configuration.", "viewLogin('menuProcess')");
      }
    } else {
      displaySitemateMenu();
      let btn = document.getElementById("btnId_view_sitemateincidents");
      setTimeout(() => btn.click(), 200);
    }
  } else {
    showDialog("You need to login to access this resource!", "viewLogin('menuProcess')");
  }
}


function exitSitemate() {
	if(shared.mCustomerDetailsJSON == null) {
        startAppIdleTimer();
    }
	exitModules();
}

function getConfigData() {
  const data = { token: shared.mCustomerDetailsJSON.token };
  buildRequestOptions(constructUrl("/api/restgetblankincident"), "GET", data).then(request => {
    Http.request(request).then(res => {
      if (isValidResponse(res, "restgetblankincident") && res.data) {
        return res; 
      }
    }).catch(err => console.error("error: " + JSON.stringify(err)));
  }).catch(err => console.warn("Request aborted due to missing requestOptions.", err));
}

function displaySitemateMenu() {
	
	var htmlContent = "";
	var sitemateScreenSource = shared.cmsJSON.cmsJSONdata.sitemateScreen;

	$.each(sitemateScreenSource.sectionList, function(key, section) {
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

			htmlContent += '<div class="searchArea"><div class="searchBox" id="sitemate_searchbox"></div></div>';

			htmlContent += '</div>';
		}
	});
	$("#modulesMenuArea").html(htmlContent);
}
function viewIncidents() {
	getMyIncidents();
}
function getMyIncidents() {
	//sitemateSearchStr = "";
	searchType = "incident";
	$('#sitemate_searchbox').html('<input type="search" class="searchInput" id="sitemate_'+searchType+'_search_input" placeholder="Search '+searchType+'" /><button class="searchBtn" id="sitemate_'+searchType+'_searchbtn" onclick="searchSitemateIncident()"><span class="material-symbols-outlined" style="font-size: 30px; padding: 5px 0;">search</span></button>');
	searchSitemateincident();
}

function getIncidentAtListIndex(index) {
	if(listItems != null && index < listItems.length) {
		manageIncident(index);
	}
}

function getSitemateLocations() {
	shared.currentState = "sitemateLocations";
	shared.currentSourceState = "sitemateLocations";
	//$("#location_search_input").val("");
	searchType = "location";
	$('#sitemate_searchbox').html('<input type="search" class="searchInput" id="sitemate_'+searchType+'_search_input" placeholder="Search '+searchType+'" /><button class="searchBtn" id="sitemate_'+searchType+'_searchbtn" onclick="searchSitemateDepartmentLocationCategory()"><span class="material-symbols-outlined" style="font-size: 30px; padding: 5px 0;">search</span></button>');
	searchSitemateDepartmentLocationCategory();
}
function getSitemateDepartments() {
	shared.currentState = "sitemateDepartments";
	shared.currentSourceState = "sitemateDepartments";
	//$("#department_search_input").val("");
	searchType = "department";
	$('#sitemate_searchbox').html('<input type="search" class="searchInput" id="sitemate_'+searchType+'_search_input" placeholder="Search '+searchType+'" /><button class="searchBtn" id="sitemate_'+searchType+'_searchbtn" onclick="searchSitemateDepartmentLocationCategory()"><span class="material-symbols-outlined" style="font-size: 30px; padding: 5px 0;">search</span></button>');
	searchSitemateDepartmentLocationCategory();
}
function getSitemateCategorys() {
	shared.currentState = "sitemateCategorys";
	shared.currentSourceState = "sitemateCategorys";
	//$("#category_search_input").val("");
	searchType = "category";
	$('#sitemate_searchbox').html('<input type="search" class="searchInput" id="sitemate_'+searchType+'_search_input" placeholder="Search '+searchType+'" /><button class="searchBtn" id="sitemate_'+searchType+'_searchbtn" onclick="searchSitemateDepartmentLocationCategory()"><span class="material-symbols-outlined" style="font-size: 30px; padding: 5px 0;">search</span></button>');
	searchSitemateDepartmentLocationCategory();
}

function searchSitemateDepartmentLocationCategory(pageNumber = 1, pageSize = 50) {
  let type = searchType;
  highlightHeaderTabMenu("menuBtn", "btnId_view_sitemate" + type + "s");

  let searchStr = $("#sitemate_" + type + "_search_input").val();
  if (searchStr == null) { searchStr = ""; }
  $('#modulesMenuArea').show();
  $('#modulesListArea').show();
  $('#modulesDisplayArea').hide();
  fixModuleHeight("modulesModuleHeader, modulesMenuArea, footerSection", 20, "modulesListArea");

  const data = { "token": shared.mCustomerDetailsJSON.token, "searchStr": searchStr, "page": pageNumber, "size": pageSize };
  let url = "/" + type + "s/search" + type + "spaginated";

  buildRequestOptions(constructUrl(url), "GET", data).then(request => {
    Http.request(request).then(res => {
      if (isValidResponse(res, "search" + type + "spaginated") && res.data) {
        const items = (typeof res.data === "string" ? JSON.parse(res.data) : res.data);

        if (items.error !== "invalid_token") {	// Check if the token is still valid
          var htmlContent = '';
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
                "id": item.id, 
                "image": image, 
                "title": item.name, 
                "description": description, 
                "clickAction": "getIncidentsAtSelected('" + item.id + "', '" + item.name + "')" 
              };
              listItems.push(itemJson);

              if (index == items.content.length - 1) {
                createList("department", htmlContent, listItems, items.pageable, items.totalPages, "modulesListBox", "getIncidentAtListIndex", "searchSitemateDepartmentLocationCategory", "ticketStyle");
              }
            }
          } else {
            htmlContent += '<div class="formlabel">No ' + type + 's found</div>';
            $('#modulesListBox').html(htmlContent);
          }
        } else { // Token expired
          getNewToken("searchSitemateDepartmentLocationCategory(" + type + ")");
        }
      }
    }).catch(err => {
      apiRequestFailed(err, "search" + type + "spaginated");
    });
  }).catch(err => console.warn("Request aborted due to missing requestOptions.", err));
}

function getIncidentsAtSelected(id, name) {
	selectedId = id;
	selectedName = name;
	getIncidentsAtDepartmentLocationCategory();
}

function getIncidentsAtDepartmentLocationCategory(pageNumber = 1, pageSize = 50) {
  $('#modulesMenuArea').show();
  $('#modulesListArea').show();
  $('#modulesDisplayArea').hide();
  $('#sitemate_searchbox').html('');

  let type = searchType;
  let name = selectedName;
  let id = selectedId;
  shared.currentState = type + "sitemateincident";

  let url = "/sitemateincidents/getsitemateincidentsat" + type + "paginated";
  let data = {};
  if (type === "department") {
    data = { "token": shared.mCustomerDetailsJSON.token, "departmentId": id, "page": pageNumber, "size": pageSize };
  } else if (type === "location") {
    data = { "token": shared.mCustomerDetailsJSON.token, "locationId": id, "page": pageNumber, "size": pageSize };
  }

  buildRequestOptions(constructUrl(url), "GET", data).then(request => {
    Http.request(request).then(res => {
      if (isValidResponse(res, url) && res.data) {
        const jqXHR = (typeof res.data === "string" ? JSON.parse(res.data) : res.data);

        if (jqXHR.error !== "invalid_token") { // Check if the token is still valid
          let items = jqXHR;
          mySitemateIncidents = jqXHR.content;

          let htmlContent = '';
          htmlContent += '<div class="searchArea"><div class="searchBox" style="font-size: 1.3em; justify-content: center; text-align: center;">'
            + type.toUpperCase() + ': ' + name.toUpperCase() + '  (' + items.totalElements + ')</div></div>';

          if (items != null && items.content != null && items.content.length > 0) {
            listItems = [];
            for (var index in items.content) {
              let item = items.content[index];
              let reportDate = new Date(item.createdOn.replace(' ', 'T'));  // make it ISO-friendly
              const readableDate = reportDate.toLocaleString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true });

              let description = '<div>Reported: On ' + readableDate + ', By ' + item.userName + '</div>';
              description += '<div>Location: ' + item.locationName + ' ';
              if (item.departmentName != null) {
                description += '(' + item.departmentName + ')';
              }
              description += '</div>';

              let image = '';
              const imageAvailable = item.incidentReportData.match(/https:\/\/bveucp.*?\.jpg/);
              if (imageAvailable) {
                image = imageAvailable[0];
              } else {
                image = '<span class="material-symbols-outlined ticketStyleMaterializeIcon">notification_important</span>';
              }

              let itemJson = {
                "id": item.id,
                "image": image,
                "title": item.incidentName,
                "description": description,
                "clickAction": "viewSelectedIncidentReport('" + index + "')"
              };
              listItems.push(itemJson);

              if (index == items.content.length - 1) {
                createList("site", htmlContent, listItems, items.pageable, items.totalPages,
                  "modulesListBox", "getSiteAtListIndex", "getSitesAtDepartmentLocationCategory", "ticketStyle");
              }
            }
          } else {
            htmlContent += '<div class="formlabel">No ' + type + 's found</div>';
            $('#modulesListBox').html(htmlContent);
          }
        } else { // Token expired
          getNewToken("getSitesAtDepartment(" + id + ")");
        }
      }
    }).catch(err => {
      apiRequestFailed(err, "getsitemateincidentsat" + type + "paginated");
    });
  }).catch(err => console.warn("Request aborted due to missing requestOptions.", err));
}

function searchSitemateincident(pageNumber = 1, pageSize = 50) {
  highlightHeaderTabMenu("menuBtn", "btnId_view_sitemateincidents");
  $('#modulesMenuArea').show();
  $('#modulesListArea').show();
  $('#modulesDisplayArea').hide();
  fixModuleHeight("modulesModuleHeader, modulesMenuArea, footerSection", 20, "modulesListArea");

  shared.currentState = "searchSitemateincident";
  shared.currentSourceState = shared.currentState;
  let searchStr = $("#sitemate_incident_search_input").val();

  const data = { "token": shared.mCustomerDetailsJSON.token, "searchStr": searchStr, "page": pageNumber, "size": pageSize };

  buildRequestOptions(constructUrl("/sitemateincidents/searchsitemateincidentpaginated"), "GET", data).then(request => {
    Http.request(request).then(res => {
      if (isValidResponse(res, "searchsitemateincidentpaginated") && res.data) {
        const jqXHR = (typeof res.data === "string" ? JSON.parse(res.data) : res.data);

        if (jqXHR.error !== "invalid_token") { // Check if the token is still valid
          let items = jqXHR;
          mySitemateIncidents = jqXHR.content;

          let htmlContent = '';
          htmlContent += '<div class="searchArea"><div class="searchBox" style="font-size: 1.3em; justify-content: center; text-align: center;">MY INCIDENTS (' + items.totalElements + ')</div></div>';
          htmlContent += '<div class="listBoxActionButton activeAction1" style="position: absolute; right: 10px; top: 10px;" onclick="createIncidentReport()"><span class="material-symbols-outlined" style="font-size: 30px; color: var(--primary-white);">add</span></div>';

          if (items != null && items.content != null && items.content.length > 0) {
            listItems = [];
            for (var index in items.content) {
              let item = items.content[index];
              let reportDate = new Date(item.createdOn.replace(' ', 'T')); // make it ISO-friendly
              const readableDate = reportDate.toLocaleString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true });

              let description = '<div>Reported: On ' + readableDate + ', By ' + item.userName + '</div>';
              description += '<div>Location: ' + item.locationName + ' (' + item.departmentName + ')</div>';

              let image = '';
              const imageAvailable = item.incidentReportData.match(/https:\/\/bveucp.*?\.jpg/);
              if (imageAvailable) {
                image = imageAvailable[0];
              } else {
                image = '<span class="material-symbols-outlined ticketStyleMaterializeIcon">notification_important</span>';
              }

              let states = [];
              let actions = [];
              let activeActions = [];
              if (item.incidentClosed === true) {
                states.push({ "text": "Closed", "type": "successState" });
              } else {
                if (item.incidentStatus === "Escalated") {
                  states.push({ "text": item.incidentStatus, "type": "errorState" });
                } else {
                  states.push({ "text": item.incidentStatus, "type": "infoState" });
                }

                if (shared.mCustomerDetailsJSON.id == item.locationContactId || shared.mCustomerDetailsJSON.id == item.safetyManagerId || shared.mCustomerDetailsJSON.id == item.hodId || shared.mCustomerDetailsJSON.id == item.safetyOfficerId) {
                  actions.push({ "text": "Manage", "type": "button", "actionClass": "activeActionWideBlue", "act": "manageIncident(" + index + ")" });
                  activeActions.push({ "text": "Manage" });
                }
                if (shared.mCustomerDetailsJSON.id == item.investigatorId) {
                  actions.push({ "text": "Investigate", "type": "button", "actionClass": "activeActionWideOrange", "act": "performSitemateTask(" + index + ", " + sitemateConfig.invstigationTemplateId + ", " + TASK_INVESTIGATION + ")" });
                  activeActions.push({ "text": "Investigate" });
                }
                if (shared.mCustomerDetailsJSON.id == item.actorId) {
                  actions.push({ "text": "Take Action", "type": "button", "actionClass": "activeActionWideCyan", "act": "performSitemateTask(" + index + ", " + sitemateConfig.actionTemplateId + ", " + TASK_ACTION + ")" });
                  activeActions.push({ "text": "Take Action" });
                }
                if (shared.mCustomerDetailsJSON.id == item.auditorId) {
                  actions.push({ "text": "Audit", "type": "button", "actionClass": "activeActionWideGreen", "act": "performSitemateTask(" + index + ", " + sitemateConfig.auditTemplateId + ", " + TASK_AUDIT + ")" });
                  activeActions.push({ "text": "Audit" });
                }
              }

              let itemJson = {
                "id": item.id,
                "image": image,
                "title": item.incidentName,
                "description": description,
                "clickAction": "viewSelectedIncidentReport('" + index + "')",
                "states": states,
                "actions": actions,
                "activeActions": activeActions
              };

              listItems.push(itemJson);
              if (index == items.content.length - 1) {
                createList("site", htmlContent, listItems, items.pageable, items.totalPages,
                  "modulesListBox", "getSiteAtListIndex", "searchSitemateincident", "ticketStyle");
              }
            }
          } else {
            htmlContent += '<div class="formlabel">No Sites found</div>';
            $('#modulesListBox').html(htmlContent);
          }
        } else { // Token expired
          getNewToken("searchSitemateincident()");
        }
      }
    }).catch(err => {
      apiRequestFailed(err, "searchsitemateincidentpaginated");
    });
  }).catch(err => console.warn("Request aborted due to missing requestOptions.", err));
}

// function createIncidentReport() {
//   console.log("createIncidentReport");
//   highlightHeaderTabMenu("menuBtn", "btnId_create_newincident");
//   shared.currentState = "createIncidentReport";
//   shared.currentSourceState = shared.currentState;
//   unsavedData = true;

//   var htmlContent = '';

//   if (sitemateConfig != null) {
//     const data = { token: shared.mCustomerDetailsJSON.token, templateId: sitemateConfig.incidentTemplateId };

//     buildRequestOptions(constructUrl("/api/getformtemplate"), "GET", data).then(request => {
//       Http.request(request).then(res => {
//         if (isValidResponse(res, "getformtemplate") && res.data) {
//           if (res.data.error != "invalid_token") { // Check if token is still valid
//             var formTemplate = (typeof res.data === "string" ? JSON.parse(res.data) : res.data);
//             console.log("formTemplate: " + formTemplate);

//             htmlContent += '<div id="sitemateContentViewerArea" style="padding-bottom: 50px;">';
//               htmlContent += '<div class="moduleNadisplayTitleClassmeClass" style="border-bottom: 1px solid rgba(0,0,0,0.1);">NEW INCIDENT REPORT</div>';

//               htmlContent += '<div id="sitemateFormGrid">';
//                 htmlContent += '<div class="selectarea">';
//                   htmlContent += '<div class="formlabel" style="margin: 10px 0;">Reporter</div>';
//                   htmlContent += '<input type="text" class="formlvalue" id="sitemateReporterName" value="'+mCustomerDetailsJSON.firstName+' '+mCustomerDetailsJSON.lastName+'" readonly/>';

//                   if (sitemateConfig.allowAnonymousReport == true) {
//                     htmlContent += '<div class="formlabel" style="margin: 10px 0;">Anonymous</div>';
//                     htmlContent += '<input type="checkbox" id="sitemateIsAnonymous" style="margin: 10px 0;" />';
//                   }

//                   htmlContent += '<div class="formlabel" style="margin: 10px 0;">Select Location</div>';
//                   htmlContent += '<input id="sitemateIncidentLocationSelect" class="formvalue" list="locationlist" >';
//                   htmlContent += '<div class="selectDiv">';
//                     htmlContent += '<datalist id="locationlist" class="selectBox" >';
//                     for (var loc of sitemateLocations) {
//                       htmlContent += '<option value="'+loc.id+'" id="sitemateLocationOption_'+loc.id+'">'+loc.id+' - '+loc.locationName+'</option>';
//                     }
//                     htmlContent += '</datalist>';
//                   htmlContent += '</div>';

//                   htmlContent += '<div class="formlabel" >Incident Name</div>';
//                   htmlContent += '<input class="formvalue" type="text" class="formlvalue" id="sitemateIncidentName" style="margin: 10px 0;" placeholder="Incident in short" />';
//                 htmlContent += '</div>';

//                 htmlContent += '<div id="sitemateFormViewerArea"></div>';
//               htmlContent += '</div>';

//               htmlContent += '<div style="width: 100%; margin-top: 20px; display: flex; justify-content: space-around; border-top: 1px solid rgba(0,0,0,0.1);"> <div class="btnStyle" id="smIncidentSubmitBtn" onclick="submitIncidentForm('+TASK_REPORT+')">SUBMIT</div></div>';
//             htmlContent += '</div>';

//             $('#modulesDisplayArea').html(htmlContent);

//             viewSitemateForm(formTemplate, 'sitemateFormViewerArea', TASK_REPORT, EDIT, null);
//             $("#modulesDisplayArea").show();
//             $("#modulesMenuArea").show();
//             $("#modulesListArea").hide();
//             $('#sitemate_searchbox').html('');
//             fixModuleHeight("modulesModuleHeader, footerSection", 20, "modulesDisplayArea");

//             if (sitemateConfig.allowAnonymousReport == true) {
//               $('#sitemateIsAnonymous').on('change', function() {
//                 if ($('#sitemateIsAnonymous').is(":checked")) {
//                   $("#sitemateReporterName").hide();
//                 } else {
//                   $("#sitemateReporterName").show();
//                 }
//               });
//             }
//           } else { // Token expired
//             getNewToken("createIncidentReport(" + editOrView + ")");
//           }
//         }
//       }).catch(err => {
//         apiRequestFailed(err, "getformtemplate");
//       });
//     }).catch(err => console.warn("Request aborted due to missing requestOptions.", err));
//   }
// }


async function createIncidentReport() {
  console.log("[createIncidentReport] ➤ Function called");

  try {
    // Step 1: UI header setup
    highlightHeaderTabMenu("menuBtn", "btnId_create_newincident");
    shared.currentState = "createIncidentReport";
    shared.currentSourceState = shared.currentState;
    unsavedData = true;

    let htmlContent = "";

    // Step 2: Validate config availability
    if (!window.sitemateConfig) {
      console.warn("[createIncidentReport] ⚠️ sitemateConfig not yet loaded, retrying in 500ms...");
      setTimeout(createIncidentReport, 500);
      return;
    }

    const sitemateConfig = window.sitemateConfig; // make local alias
    console.log("[createIncidentReport] ✅ sitemateConfig loaded:", sitemateConfig);

    // Step 3: Prepare API payload
    const data = {
      token: shared.mCustomerDetailsJSON?.token,
      templateId: sitemateConfig.incidentTemplateId,
    };
    console.log("[createIncidentReport] 🧩 Request data:", data);

    // Step 4: Construct API request
    const request = await buildRequestOptions(constructUrl("/api/getformtemplate"), "GET", data);
    if (!request) {
      console.error("[createIncidentReport] ❌ buildRequestOptions() returned null/undefined");
      return;
    }
    console.log("[createIncidentReport] ✅ Request built:", request);

    // Step 5: Execute API call
    const res = await Http.request(request);
    console.log("[createIncidentReport] 📩 API response:", res);

    // Step 6: Validate API response
    if (!isValidResponse(res, "getformtemplate")) {
      console.error("[createIncidentReport] ❌ Invalid response:", res);
      return;
    }

    if (!res.data) {
      console.error("[createIncidentReport] ❌ Missing 'data' field in response:", res);
      return;
    }

    // Step 7: Check for token expiry
    if (res.data.error === "invalid_token") {
      console.warn("[createIncidentReport] ⚠️ Token invalid — refreshing token...");
      getNewToken("createIncidentReport()");
      return;
    }

    // Step 8: Parse form template safely
    let formTemplate;
    try {
      formTemplate = typeof res.data === "string" ? JSON.parse(res.data) : res.data;
    } catch (e) {
      console.error("[createIncidentReport] ❌ Failed to parse form template:", e);
      return;
    }

    console.log("[createIncidentReport] 🧱 Form template parsed successfully:", formTemplate);

    // Step 9: Build HTML layout
    htmlContent += `
      <div id="sitemateContentViewerArea" style="padding-bottom: 50px;">
        <div class="moduleNadisplayTitleClassmeClass" style="border-bottom: 1px solid rgba(0,0,0,0.1);">
          NEW INCIDENT REPORT
        </div>
        <div id="sitemateFormGrid">
          <div class="selectarea">
            <div class="formlabel" style="margin: 10px 0;">Reporter</div>
            <input type="text" class="formlvalue" id="sitemateReporterName" 
                   value="${mCustomerDetailsJSON.firstName} ${mCustomerDetailsJSON.lastName}" readonly />
    `;

    if (sitemateConfig.allowAnonymousReport === true) {
      htmlContent += `
        <div class="formlabel" style="margin: 10px 0;">Anonymous</div>
        <input type="checkbox" id="sitemateIsAnonymous" style="margin: 10px 0;" />
      `;
    }

    htmlContent += `
        <div class="formlabel" style="margin: 10px 0;">Select Location</div>
        <input id="sitemateIncidentLocationSelect" class="formvalue" list="locationlist" />
        <div class="selectDiv">
          <datalist id="locationlist" class="selectBox">
    `;

    if (window.sitemateLocations && window.sitemateLocations.length > 0) {
      for (const loc of sitemateLocations) {
        htmlContent += `<option value="${loc.id}" id="sitemateLocationOption_${loc.id}">
                          ${loc.id} - ${loc.locationName}
                        </option>`;
      }
    } else {
      console.warn("[createIncidentReport] ⚠️ sitemateLocations empty or undefined");
    }

    htmlContent += `
          </datalist>
        </div>
        <div class="formlabel">Incident Name</div>
        <input class="formvalue" type="text" id="sitemateIncidentName" style="margin: 10px 0;" placeholder="Incident in short" />
      </div>
      <div id="sitemateFormViewerArea"></div>
    </div>
    <div style="width: 100%; margin-top: 20px; display: flex; justify-content: space-around; border-top: 1px solid rgba(0,0,0,0.1);">
      <div class="btnStyle" id="smIncidentSubmitBtn" onclick="submitIncidentForm(${TASK_REPORT})">SUBMIT</div>
    </div>
  </div>
    `;

    // Step 10: Inject HTML into DOM
    $("#modulesDisplayArea").html(htmlContent);
    console.log("[createIncidentReport] ✅ HTML rendered successfully");

    // Step 11: Render form content
    try {
      viewSitemateForm(formTemplate, "sitemateFormViewerArea", TASK_REPORT, EDIT, null);
    } catch (err) {
      console.error("[createIncidentReport] ❌ viewSitemateForm failed:", err);
    }

    // Step 12: Adjust UI
    $("#modulesDisplayArea").show();
    $("#modulesMenuArea").show();
    $("#modulesListArea").hide();
    $("#sitemate_searchbox").html("");
    fixModuleHeight("modulesModuleHeader, footerSection", 20, "modulesDisplayArea");

    // Step 13: Handle anonymous toggle logic
    if (sitemateConfig.allowAnonymousReport === true) {
      $("#sitemateIsAnonymous").on("change", function () {
        const isChecked = $(this).is(":checked");
        console.log("[createIncidentReport] Anonymous checkbox changed:", isChecked);
        $("#sitemateReporterName").toggle(!isChecked);
      });
    }

    console.log("[createIncidentReport] ✅ Completed successfully");
  } catch (err) {
    console.error("[createIncidentReport] ❌ Unexpected error:", err);
  }
}




function viewNotificationIncident(incidentId) {
	//$('#loadingmessage').show();
	$("#notificationArea").hide();
	displaySection("modulesSection", "flex", false, false);

	sitemateSearchStr = "";

	if(sitemateConfig == null) {		// load the config, locatios for first time
		//updateAppRuntime("siteMate", "on", "ok");

		getConfigData().then(data => {
			sitemateLocations = data.locations;
			sitemateConfig = data.config;
			blankIncident = data.incident;
			viewIncidentReport(incidentId);
			$('#loadingmessage').hide();
		});

	} else {
		viewIncidentReport(incidentId);
		//$('#loadingmessage').hide();
	}
}

function viewIncidentReport(incidentId) {
  if (mySitemateIncidents == null) {
    const data = { token: shared.mCustomerDetailsJSON.token, months: 1 };

    buildRequestOptions(constructUrl("/api/restgetmyincidents"), "GET", data).then(request => {
      Http.request(request).then(res => {
        if (isValidResponse(res, "restgetmyincidents") && res.data) {
          const responseData = (typeof res.data === "string" ? JSON.parse(res.data) : res.data);

          if (responseData.error != "invalid_token") { // Check if the token is still valid
            mySitemateIncidents = responseData;

            for (var index in mySitemateIncidents) {
              if (mySitemateIncidents[index].id == incidentId) {
                viewSelectedIncidentReport(index);
                break;
              }
            }
          } else { // Token expired
            getNewToken("viewNotificationIncident(" + incidentId + ")");
          }
        }
      }).catch(err => {
        apiRequestFailed(err, "restgetmyincidents");
      });
    }).catch(err => console.warn("Request aborted due to missing requestOptions.", err));

  } else {
    var incidentIndex = 0;
    for (var index in mySitemateIncidents) {
      if (mySitemateIncidents[index].id == incidentId) {
        viewSelectedIncidentReport(index);
        break;
      }
      incidentIndex++;
      if (index == mySitemateIncidents.length) {
        // reached end but incident is not part of the list
      }
    }
  }
}

function viewSelectedIncidentReport(incidentIndex) {
  shared.currentState = "viewSelectedIncidentReport";
  var incident = mySitemateIncidents[incidentIndex];

  var htmlContent = '';

  if (sitemateConfig != null) {
    const data = { token: shared.mCustomerDetailsJSON.token, templateId: sitemateConfig.incidentTemplateId };

    buildRequestOptions(constructUrl("/api/getformtemplate"), "GET", data).then(request => {
      Http.request(request).then(res => {
        if (isValidResponse(res, "getformtemplate") && res.data) {
          const responseData = (typeof res.data === "string" ? JSON.parse(res.data) : res.data);

          if (responseData.error != "invalid_token") { // Check if the token is still valid
            var formTemplate = responseData;

            htmlContent += '<div id="sitemateContentViewerArea" style="padding-bottom: 50px;">';
              let reportDate = new Date(incident.createdOn.replace(' ', 'T'));  // make it ISO-friendly
              const readableDate = reportDate.toLocaleString('en-US', {
                year: 'numeric', month: 'long', day: 'numeric',
                hour: 'numeric', minute: '2-digit', hour12: true
              });
              
              let description = '<div>Reported: On ' + readableDate + ', By ' + incident.userName + '</div>';
              description += '<div>Location: ' + incident.locationName + ' (' + incident.departmentName + ')</div>';

              htmlContent += '<div id="incidentTitleArea">';
                htmlContent += '<div class="bannerarea">';
                  htmlContent += '<div class="titleFontClass" style="background-color: rgb(240, 240, 240);">' + incident.incidentName + '</div>';							
                  htmlContent += '<div class="contentDetailText" style="padding-top: 5px;">' + description + '</div>';
                  htmlContent += '<div class="contentDetailText">Current status: ' + incident.incidentStatus + '</div>';
                htmlContent += '</div>';
              htmlContent += '</div>';

              htmlContent += '<div class="entityGrid">';
                htmlContent += '<div class="selectarea" style="grid-template-columns: 30% 70%;">';
                  if (incident.investigationRequired == true) {
                    let dateStr = (incident.investigationSchedule != null) ? new Date(incident.investigationSchedule).toDateString().substring(0, 10) : 'Not scheduled';
                    htmlContent += '<div class="formlabel">Investigator</div>';
                    var resourceName = incident.investigatorName;
                    if ((resourceName == null) || (resourceName.length == 0)) { resourceName = 'Not assigned'; }
                    htmlContent += '<div class="formvalue">' + resourceName + ' (' + dateStr + ')</div>';
                  }

                  if (incident.actionRequired == true) {
                    let dateStr = (incident.actionSchedule != null) ? new Date(incident.actionSchedule).toDateString().substring(0, 10) : 'Not scheduled';
                    htmlContent += '<div class="formlabel">Action by</div>';
                    var resourceName = incident.actorName;
                    if ((resourceName == null) || (resourceName.length == 0)) { resourceName = 'Not assigned'; }
                    htmlContent += '<div class="formvalue">' + resourceName + ' (' + dateStr + ')</div>';
                  }

                  if (incident.auditRequired == true) {
                    let dateStr = (incident.auditSchedule != null) ? new Date(incident.auditSchedule).toDateString().substring(0, 10) : 'Not scheduled';
                    htmlContent += '<div class="formlabel">Auditor</div>';
                    var resourceName = incident.auditorName;
                    if ((resourceName == null) || (resourceName.length == 0)) { resourceName = 'Not assigned'; }
                    htmlContent += '<div class="formvalue">' + resourceName + ' (' + dateStr + ')</div>';
                  }
                htmlContent += '</div>';
            
                htmlContent += '<div id="sitemateFormViewerArea">';
                  htmlContent += '<div id="smIncidentViewerArea"></div>';
                  if ((incident.investigationRequired == true) && (incident.investigationData != null) && (incident.investigationData.length > 0)) {
                    htmlContent += '<div id="smInvestigationViewerArea"></div>';
                  }
                  if ((incident.actionRequired == true) && (incident.actionData != null) && (incident.actionData.length > 0)) {
                    htmlContent += '<div id="smActionViewerArea"></div>';
                  }
                  if ((incident.auditRequired == true) && (incident.auditData != null) && (incident.auditData.length > 0)) {
                    htmlContent += '<div id="smAuditViewerArea"></div>';
                  }
                htmlContent += '</div>';

                htmlContent += '<div class="selectarea">';
                  if ((incident.incidentClosed == true) && (incident.closingNote != null) && (incident.closingNote.length > 0)) {
                    htmlContent += '<div class="formlabel">Closing Note</div>';
                    htmlContent += '<div id="closingNote" >' + incident.closingNote + ' </div>';
                  }
                htmlContent += '</div>';
              htmlContent += '</div>';

              var task = getMySitemateTask(incident, incidentIndex);
              htmlContent += '<div style="width: 100%; margin-top: 5px; display: flex; justify-content: space-around; flex-wrap: wrap;">';
                htmlContent += task;
              htmlContent += '</div>';
            htmlContent += '</div>';

            $('#modulesDisplayArea').html(htmlContent);

            viewSitemateForm(formTemplate, 'smIncidentViewerArea', TASK_REPORT, VIEW, incidentIndex);
            if ((incident.investigationRequired == true) && (incident.investigationData != null) && (incident.investigationData.length > 0)) {
              viewSitemateForm(formTemplate, 'smInvestigationViewerArea', TASK_INVESTIGATION, VIEW, incidentIndex);
            }
            if ((incident.actionRequired == true) && (incident.actionData != null) && (incident.actionData.length > 0)) {
              viewSitemateForm(formTemplate, 'smActionViewerArea', TASK_ACTION, VIEW, incidentIndex);
            }
            if ((incident.auditRequired == true) && (incident.auditData != null) && (incident.auditData.length > 0)) {
              viewSitemateForm(formTemplate, 'smAuditViewerArea', TASK_AUDIT, VIEW, incidentIndex);
            }

            $("#modulesDisplayArea").show();
            $("#modulesMenuArea").hide();
            $("#modulesListArea").hide();
            fixModuleHeight("modulesModuleHeader, footerSection", 20, "modulesDisplayArea");

          } else { // Token expired
            getNewToken("viewIncidentReport(" + incidentIndex + ")");
          }
        }
      }).catch(err => {
        apiRequestFailed(err, "getformtemplate");
      });
    }).catch(err => console.warn("Request aborted due to missing requestOptions.", err));
  }
}

function getMySitemateTask(incident, incidentIndex) {
	var incidentStatus = incident.incidentStatus;
	var myTask = '';
	
	var investigateNow = true;
	var actionNow = true;
	var auditNow = true;
	if (incident.investigationRequired == true) {
		if((incident.investigationData != null) && (incident.investigationData.length > 0)) {	// Investigation completed
			investigateNow = false;
			if (incident.actionRequired == true) {
				if((incident.actionData != null) && (incident.actionData.length > 0)) {			// Action completed
					actionNow = false;
					if (incident.auditRequired == true) {
						if((incident.auditData != null) && (incident.auditData.length > 0)) {	// Audit completed
							auditNow = false;
						}
					}
				}
			}
		}
	} else {	// Investigation not required
		if (incident.actionRequired == true) {
			if((incident.actionData != null) && (incident.actionData.length > 0)) {			// Action completed
				actionNow = false;
				if (incident.auditRequired == true) {
					if((incident.auditData != null) && (incident.auditData.length > 0)) {	// Audit completed
						actionNow = false;
					}
				}
			}
		} else {	// Audit not required
			if (incident.auditRequired == true) {
				if((incident.auditData != null) && (incident.auditData.length > 0)) {	// Audit completed
					actionNow = false;
				}
			}
		}
	}

	if((incident.actionData != null) && (incident.actionData.length > 0)) {
		actionComplete = true;
	}
	if((incident.auditData != null) && (incident.auditData.length > 0)) {
		auditComplete = true;
	}

	if(incidentStatus == 'Closed') {
		myTask = '<div class="btnStyle" style="background-color: transparent; color: #00c900;" >Closed</div>';
	} else {
		if((incidentStatus == 'Escalation1') && (shared.mCustomerDetailsJSON.id == incident.hodId)) {						// Dept Head
			myTask = '<div class="btnStyle" style="background-color: #c80000;" onclick="manageIncident('+incidentIndex+')">View Escalation</div>';
		} else if((incidentStatus == 'Escalation2') && (shared.mCustomerDetailsJSON.id == incident.safetyOfficerId)) {		// Company Safety officeer
			myTask = '<div class="btnStyle" style="background-color: #c80000;" onclick="manageIncident('+incidentIndex+')">View Escalation</div>';
		} else if((incidentStatus == 'Escalation3') && (shared.mCustomerDetailsJSON.id == incident.cooId)) {				// Company Chief
			myTask = '<div class="btnStyle" style="background-color: #c80000;" onclick="manageIncident('+incidentIndex+')">View Escalation</div>';
		}
		
		if((investigateNow == true) && (shared.mCustomerDetailsJSON.id == incident.investigatorId)) {					// Investigator
			myTask = '<div class="btnStyle" style="background-color: #ffa500;" onclick="performSitemateTask('+incidentIndex+', '+sitemateConfig.invstigationTemplateId+', '+TASK_INVESTIGATION+')">Investigate</div>';
		} else if((actionNow == true) && (shared.mCustomerDetailsJSON.id == incident.actorId)) {						// Actor
			myTask = '<div class="btnStyle" style="background-color: #04815e;" onclick="performSitemateTask('+incidentIndex+', '+sitemateConfig.actionTemplateId+', '+TASK_ACTION+')">Action</div>';
		} else if((auditNow == true) && (shared.mCustomerDetailsJSON.id == incident.auditorId)) {						// Auditor
			myTask = '<div class="btnStyle" style="background-color: #9800ff;" onclick="performSitemateTask('+incidentIndex+', '+sitemateConfig.auditTemplateId+', '+TASK_AUDIT+')">Audit</div>';
		} 
	}

		if(shared.mCustomerDetailsJSON.id == incident.safetyManagerId) {	// Dept safety manager
			myTask += '<div class="btnStyle" onclick="manageIncident('+incidentIndex+')">Manage</div>';
		} else if((shared.mCustomerDetailsJSON.id == incident.hodId) || (shared.mCustomerDetailsJSON.id == incident.safetyOfficerId) || (shared.mCustomerDetailsJSON.id == incident.cooId)) {	// Dept Head / Company safety officer / chief
			myTask += '<div class="btnStyle" onclick="manageIncident('+incidentIndex+')">Manage</div>';
		//} else if(mCustomerDetailsJSON.id == incident.userId) {
		//	myTask = 'Reported by me';
		}

	return myTask;
}

function viewSitemateForm(template, destin, task, viewOrEdit, incidentIndex) {
	// currentState = "viewSitemateForm";

	var templateJson = JSON.parse(template.templateData);

	var htmlContent = "";

	let taskStr = '';
	if(task == TASK_INVESTIGATION) {taskStr = "INVESTIGATION"}
	else if(task == TASK_ACTION) {taskStr = "ACTION"}
	else if(task == TASK_AUDIT) {taskStr = "AUDIT"}

	htmlContent += '<div class="displayTitleClass" id="smFormName" style="background-color: rgba(0,0,0,0.2);">INCIDENT '+taskStr+'</div>';

	htmlContent += '<table class="formTemplateTable" id="formTemplateTable_'+task+'" style="'+templateJson.conf.style+'">';
	htmlContent += '<colgroup>';
	for(count=0; count<templateJson.conf.cols; count++) {
		htmlContent += '<col span="1" style="width: '+templateJson.conf.colw[count]+'%;">';
	}
	htmlContent += '</colgroup>';

	for(var tr of templateJson.tr) {
		htmlContent += '<tr>';
		
		for(var td of tr.td) {
			//var attrIndex = td.style.indexOf('background-color:');
			if(td.colSpan == undefined) {
				td.colSpan = td.span;
			}
			if (td.rowSpan == undefined) {
				td.rowSpan = 1;
			}

			if(td.marged != true) {
				/*if(attrIndex != -1) {		// Attribute doesn't exist in the style
					var tempStr = td.style.substring(attrIndex, td.style.length);
					var eIndex = tempStr.indexOf(';')+attrIndex+1;
					htmlContent += '<td rowspan='+td.rowSpan+' colspan='+td.colSpan+' style="vertical-align: middle;'+td.style.substring(attrIndex, eIndex)+'">';
				} else {
					htmlContent += '<td rowspan='+td.rowSpan+' colspan='+td.colSpan+' style="vertical-align: middle;">';	
				}*/
				htmlContent += '<td rowspan='+td.rowSpan+' colspan='+td.colSpan+' style="vertical-align: middle;'+getStyleAttributeInStyles(td.style, 'background-color:')+'">';

					if(td.label == undefined) {
						td.label = ""
					}

					if(td.type == "text") {
						htmlContent += '<p class='+td.class+' id="'+td.id+'_'+task+'" style="'+td.style+'">'+td.value+'</p>';
					} else if(td.type == "image") {
						htmlContent += '<div style="position: relative; width: 100%; min-height: 100px;">';
							htmlContent += '<img id="ampreview_'+td.id+'_'+task+'" style="'+td.style+'" src="'+td.value+'" id="myImage" onerror="this.onerror=null;this.src=\'./img/noimage.jpg\';"/>';
						htmlContent += '</div>';
					} else if(td.type == "inputText") {
						if(td.label != undefined && td.label != "") {
							htmlContent += '<label class="templatelabel" id="label_'+td.id+'_'+task+'" for="'+td.id+'_'+task+'">'+td.label+'</label>';
						}
						htmlContent += '<textarea class='+td.class+' id="'+td.id+'_'+task+'" style="'+td.style+'min-height: 100px; resize: vertical;" value="" ></textarea>';
					} else if(td.type == "inputNumber") {
						if(td.label != undefined && td.label != "") {
							htmlContent += '<label class="templatelabel" id="label_'+td.id+'_'+task+'" for="'+td.id+'_'+task+'">'+td.label+'</label>';
						}
						htmlContent += '<input type="number" class='+td.class+' id="'+td.id+'_'+task+'" style="'+td.style+'" value="" />';
					} else if(td.type == "inputCb") {
						if(td.label != undefined &&  td.label != "") {
							htmlContent += '<input type="checkbox" class='+td.class+' id="'+td.id+'_'+task+'" style="'+td.style+' width: fit-content; margin-right: 10px;" onChange="$(this).val(this.checked? \'on\': \'off\');" />';
							htmlContent += '<label class="templatelabel" id="label_'+td.id+'_'+task+'" for="'+td.id+'_'+task+'">'+td.label+'</label>';
						} else {
							htmlContent += '<input type="checkbox" class='+td.class+' id="'+td.id+'_'+task+'" style="'+td.style+'" onChange="$(this).val(this.checked? \'on\': \'off\');" />';
						}
					} else if(td.type == "inputDate") {
						if(td.label != undefined && td.label != "") {
							htmlContent += '<label class="templatelabel" id="label_'+td.id+'_'+task+'" for="'+td.id+'_'+task+'">'+td.label+'</label>';
						}
						htmlContent += '<input type="date" class='+td.class+' id="'+td.id+'_'+task+'" style="'+td.style+'" />';
					} else if(td.type == "inputImage") {
						if(td.label != undefined && td.label != "") {
							htmlContent += '<label class="templatelabel" id="label_'+td.id+'_'+task+'" for="'+td.id+'_'+task+'">'+td.label+'</label>';
						}
						htmlContent += '<div style="position: relative; width: 100%; min-height: 100px;">';
							htmlContent += '<input class='+td.class+' id="'+td.id+'_'+task+'" style="display:none;"/>';
							htmlContent += '<img id="smpreview_'+td.id+'_'+task+'" style="'+td.style+'" src="img/noimage.jpg" onerror="this.onerror=null;this.src=\'./img/noimage.jpg\';"/>';
							if(viewOrEdit == EDIT) {
								htmlContent += '<div style="display: flex; align-items: center; justify-content: space-evenly; width: 100%; height: 100%; position: absolute; top: 0;">';
									const time = new Date().getTime();
									const fileName = ('sm_'+td.id+'_'+task+'_'+time).replace(/[-:.]/g,'')+'.jpg';
									var imageQuality = 60;
									if(shared.systemConfiguration.systemInfo.assetMateImageQuality != undefined) {
										imageQuality = parseInt(shared.systemConfiguration.systemInfo.assetMateImageQuality);
									}
									var imageResolution = 600;
									if(shared.systemConfiguration.systemInfo.assetMateImagePixel != undefined) {
										imageResolution = parseInt(shared.systemConfiguration.systemInfo.assetMateImagePixel);
									}
									// htmlContent += '<div class="moduleImageButton" id="cameraButton" onclick="captureImage(\'smpreview_'+td.id+'_'+task+'\', '+Camera.PictureSourceType.CAMERA+', \'sitemate_images/\', \''+fileName+'\', '+imageQuality+', '+imageResolution+')"><span><i class="fas fa-camera"></i></span></div>';
									// htmlContent += '<div class="moduleImageButton" id="galleryButton" onclick="captureImage(\'smpreview_'+td.id+'_'+task+'\', '+Camera.PictureSourceType.PHOTOLIBRARY+', \'sitemate_images/\', \''+fileName+'\', '+imageQuality+', '+imageResolution+')"><span><i class="fas fa-photo-video"></i></span></div>';
									htmlContent += '<div class="moduleImageButton" id="cameraButton" onclick="captureImage(\'smpreview_'+td.id+'_'+task+'\', '+navigator.camera.PictureSourceType.CAMERA+', \'sitemate_images/\', \''+fileName+'\', '+imageQuality+', '+imageResolution+')"><span><i class="fas fa-camera"></i></span></div>';
									htmlContent += '<div class="moduleImageButton" id="galleryButton" onclick="captureImage(\'smpreview_'+td.id+'_'+task+'\', '+navigator.camera.PictureSourceType.PHOTOLIBRARY+', \'sitemate_images/\', \''+fileName+'\', '+imageQuality+', '+imageResolution+')"><span><i class="fas fa-photo-video"></i></span></div>';
								htmlContent += '</div>';
							}
						htmlContent += '</div>';
					} else if((td.type == "inputSingleSelect") || (td.type == "inputMultiSelect")) {
						if(td.label != undefined && td.label != "") {
							htmlContent += '<label class="templatelabel" id="label_'+td.id+'_'+task+'" for="'+td.id+'_'+task+'">'+td.label+'</label>';
						}
						htmlContent += '<div id="select_'+td.id+'_'+task+'" data-label="'+td.label+'" data-options="'+td.options+'">';
							if((td.options != undefined) && (td.options.length > 0)) {
								var oprionsArr = td.options.split('#');
								for(var index in oprionsArr) {
									if(td.type == "inputMultiSelect") {
										htmlContent += '<input type="checkbox" "id="option_'+td.id+'_'+task+'_'+index+'" name="'+td.id+'_'+task+'" value="'+oprionsArr[index]+'" /><label class="templatelabel" for="option_'+td.id+'_'+task+'_'+index+'" >'+oprionsArr[index]+'</label><br>';
									} else {
										htmlContent += '<input type="radio" "id="option_'+td.id+'_'+task+'_'+index+'" name="'+td.id+'_'+task+'" value="'+oprionsArr[index]+'" /><label class="templatelabel" for="option_'+td.id+'_'+task+'_'+index+'" >'+oprionsArr[index]+'</label><br>';
									}
								}
								htmlContent += '<input class='+td.class+' id="'+td.id+'_'+task+'_'+task+'" style="display:none;" />';
							}
						htmlContent += '</div>';
					} else if(td.type == "inputGeoPosition") {
						if(td.label != undefined && td.label != "") {
							htmlContent += '<label class="templatelabel" id="label_'+td.id+'_'+task+'" for="'+td.id+'_'+task+'">'+td.label+'</label>';
						}
						htmlContent += '<div style="position: relative; width: 100%;">';
							htmlContent += '<input type="text" class='+td.class+' id="'+td.id+'_'+task+'" style="'+td.style+'" readonly/>';
							htmlContent += '<div id="moduleGeoButtonLayer" style="display: flex; justify-content: flex-end; align-items: center; width: 100%; height: 100%; position: absolute; top: 0;">';
								htmlContent += '<div class="moduleImageButton" id="geoButton" style="width:27px; height:27px; font-size:15px; line-height: 27px; margin: 0 3px;" onclick="getGeoPosition(\''+td.id+'\')"><span><i class="fas fa-map-marker-alt"></i></span></div>';
							htmlContent += '</div>';
						htmlContent += '</div>';
						
					}
				htmlContent += '</td>';
			}
		}
		htmlContent += '</tr>';
	}
	htmlContent += '</table>';

	$("#"+destin).html(htmlContent);

	if((incidentIndex != null) && (mySitemateIncidents.length > incidentIndex)) {
		var reportData = null;
		if(task == TASK_REPORT) {
			reportData = mySitemateIncidents[incidentIndex].incidentReportData;
		} else if(task == TASK_INVESTIGATION) {
			reportData = mySitemateIncidents[incidentIndex].investigationData;
		} else if(task == TASK_ACTION) {
			reportData = mySitemateIncidents[incidentIndex].actionData;
		} else if(task == TASK_AUDIT) {
			reportData = mySitemateIncidents[incidentIndex].auditData;
		}
		if((reportData != null) && ((reportData.length > 0))) {
			var reportJson = JSON.parse(reportData);
			var table = document.getElementById('formTemplateTable_'+task);
			var elems = table.getElementsByClassName("formdata");
			for(var elem of elems) {
				$(elem).val(reportJson[elem.id]);
			}
				
			var trIndex = 0, tdIndex = 0;
			function getNextImageUrl(trIndex, tdIndex) {
				//$('#loadingmessage').show();

				var tr = templateJson.tr[trIndex];
				var td = tr.td[tdIndex];
				if(td.type == 'inputImage') {
					if((reportJson[td.id+'_'+task] != undefined) && (reportJson[td.id+'_'+task].length > 0)) {
						// var objectKey = reportJson[td.id+'_'+task];
						populateImage('smpreview_'+td.id+'_'+task, reportJson[td.id+'_'+task]);
						$('#smpreview_'+td.id+'_'+task).on('click', function() {
							viewSmFullScreenImage(this);
						});

						// if(objectKey.startsWith(s3PrivateUrl)) {
						// 	objectKey = objectKey.replace(s3PrivateUrl, "");
						// 	//console.log("objectKey: "+objectKey);
						// 	//objectKey = "bveu_resource/BRIGS/sitemate_images/am_1_FE12345_templatebox_1_1__inputImage_33.jpg";
						
						// 	getSignedUrl(objectKey, 10).then(url => {
						// 		if(url.startsWith("https://")) {
						// 			var imageElem = document.getElementById('smpreview_'+td.id+'_'+task);
						// 			imageElem.src = url;
						// 			$(imageElem).on('click', function() {
						// 				viewSmFullScreenImage(this);
						// 			});
						// 		}
						// 	});
						// }

					}
				}
				tdIndex++;
				if(tdIndex < tr.td.length) {
					getNextImageUrl(trIndex, tdIndex);
				} else {
					tdIndex = 0;
					trIndex++;
					if(trIndex < templateJson.tr.length) {
						getNextImageUrl(trIndex, tdIndex);
					} else {
						// finished;
						//$('#loadingmessage').hide();
					}
				}
			}
			getNextImageUrl(trIndex, tdIndex);
		}
	}

	if(viewOrEdit == VIEW) {
		$("#formTemplateTable_"+task+" input").prop('readonly', true);
		$("#formTemplateTable_"+task+" textarea").prop('readonly', true);
		$("#formTemplateTable_"+task+" select").prop('disabled', true);
	}

	selectElemOnchangeInit(templateJson, task);
}

function selectElemOnchangeInit(templateJson, task) {
	var trIndex = 0, tdIndex = 0;
	function getNextSelectElem(trIndex, tdIndex) {
		var tr = templateJson.tr[trIndex];
		var td = tr.td[tdIndex];
		if(td.type == 'inputMultiSelect') {
			$("input[name="+td.id+"_"+task+"]").on('change', function() {
				var value = [];
				$("input:checkbox[name="+td.id+"_"+task+"]:checked").each(function() {
					value.push($(this).val());
				});
				$("#"+td.id+"_"+task).val(value);
			});
		} else if (td.type == 'inputSingleSelect') {
			$("input[name="+td.id+"_"+task+"]").on('change', function() {
				var value = $("input[name="+td.id+"_"+task+"]:checked").val();
				$("#"+td.id+"_"+task).val(value);
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
function performSitemateTask(incidentIndex, templateId, task) {
  shared.currentState = "performSitemateTask";
  // currentSourceState = currentState;
  unsavedData = true;

  //$('#loadingmessage').show();
  var htmlContent = '';

  if (sitemateConfig != null) {
    const data = { "token": shared.mCustomerDetailsJSON.token, "templateId": templateId };

    buildRequestOptions(constructUrl("/api/getformtemplate"), "GET", data).then(request => {
      Http.request(request).then(res => {
        if (isValidResponse(res, "getformtemplate") && res.data) {
          const jqXHR = (typeof res.data === "string" ? JSON.parse(res.data) : res.data);

          if (jqXHR.error !== "invalid_token") { // Check if the token is still valid
            var formTemplate = jqXHR;
            console.log("formTemplate: " + formTemplate);

            htmlContent += '<div id="sitemateContentViewerArea" style="padding-bottom: 50px;">';
            htmlContent += '<div id="sitemateFormViewerArea"></div>';
            htmlContent += '<div style="width: 100%; margin-top: 20px; display: flex; justify-content: space-around; border-top: 1px solid rgba(0,0,0,0.1);">';
            htmlContent += '<div class="btnStyle" id="smInvestigationSubmitBtn" onclick="submitForm(' + incidentIndex + ', ' + task + ')">SUBMIT</div></div>';
            htmlContent += '</div>';
            $('#modulesDisplayArea').html(htmlContent);

            viewSitemateForm(formTemplate, 'sitemateFormViewerArea', task, EDIT, incidentIndex);
            $("#modulesDisplayArea").show();
            $("#modulesMenuArea").hide();
            $("#modulesListArea").hide();
            fixModuleHeight("modulesModuleHeader, footerSection", 20, "modulesDisplayArea");

          } else { // Token expired
            getNewToken("performSitemateTask(" + incidentIndex + ", " + templateId + ", " + task + ")");
          }
        }
      }).catch(err => {
        console.error("performSitemateTask failed from server!", err);
        apiRequestFailed(err, "getformtemplate");
      });
    }).catch(err => console.warn("Request aborted due to missing requestOptions.", err));

    //console.log("locations: "+locations);
    //console.log("incident: "+incident);
  }
}

function manageIncident(incidentIndex) {
  //$('#loadingmessage').show();
  shared.currentState = "manageIncident";
  // currentSourceState = currentState;
  unsavedData = true;

  if ((incidentIndex != null) && (mySitemateIncidents.length > incidentIndex)) {
    var incident = mySitemateIncidents[incidentIndex];
    var htmlContent = '';

    if (sitemateConfig != null) {
      const data = { "token": shared.mCustomerDetailsJSON.token };

      buildRequestOptions(constructUrl("/api/getusers"), "GET", data).then(request => {
        Http.request(request).then(res => {
          if (isValidResponse(res, "getformtemplate") && res.data) {
            const jqXHR = (typeof res.data === "string" ? JSON.parse(res.data) : res.data);

            if (jqXHR.error !== "invalid_token") { // Check if the token is still valid
              userIdAndNames = jqXHR;

              htmlContent += '<div id="sitemateContentViewerArea" style="padding-bottom: 50px;">';
              htmlContent += '<div class="displayTitleClass" style="border-bottom: 1px solid rgba(0,0,0,0.1);">MANAGE INCIDENT</div>';

              htmlContent += '<div class="entityGrid">';
              htmlContent += '<div class="selectarea" style="grid-template-columns: 45% 55%;">';

              htmlContent += '<div class="formlabel">Incident</div>';
              htmlContent += '<div class="formvalue">' + incident.incidentName + '</div>';

              if (incident.userName == null || incident.userName.length == 0) {
                incident.userName = 'Anonymous';
              }
              var dateStr = new Date(incident.createdOn).toDateString().substring(0, 10);
              htmlContent += '<div class="formlabel">Reporter</div>';
              htmlContent += '<div class="formvalue">' + incident.userName + ' (' + dateStr + ')</div>';

              htmlContent += '<div class="formlabel">Location</div>';
              htmlContent += '<div class="formvalue">' + incident.locationName + '</div>';

              htmlContent += '<div class="formlabel">Status</div>';
              htmlContent += '<div class="formvalue">' + incident.incidentStatus + '</div>';

              htmlContent += '<div class="formlabel" >Category</div>';
              htmlContent += '<input id="sitemateCategorySelect" class="formvalue" list="categoryList" >';
              htmlContent += '<div class="selectDiv">';
              htmlContent += '<datalist id="categoryList" class="selectBox">';
              htmlContent += '<option value="" id="sitemateCategoryOption_0">Select Category</option>';
              var categories = sitemateConfig.incidentCategories.split(',');
              for (var category of categories) {
                if (incident.incidentCategory == category) {
                  htmlContent += '<option value="' + category + '" id="sitemateCategoryOption_' + category.replace(' ', '_') + '" selected>' + category + '</option>';
                } else {
                  htmlContent += '<option value="' + category + '" id="sitemateCategoryOption_' + category.replace(' ', '_') + '">' + category + '</option>';
                }
              }
              htmlContent += '</datalist>';
              htmlContent += '</div>';

              htmlContent += '<div class="formlabel" >Priority</div>';
              htmlContent += '<div style="width: 100%;">';
              htmlContent += '<select id="sitematePrioritySelect" class="formvalue selectBox" name="sitematePriority" >';
              htmlContent += '<option value="" id="sitematePriorityOption_0">Select Priority</option>';
              var priorities = sitemateConfig.incidentPriorities.split(',');
              for (var priority of priorities) {
                if (incident.incidentPriority == priority) {
                  htmlContent += '<option value="' + priority + '" id="sitemateCategoryOption_' + priority.replace(' ', '_') + '" selected>' + priority + '</option>';
                } else {
                  htmlContent += '<option value="' + priority + '" id="sitemateCategoryOption_' + priority.replace(' ', '_') + '">' + priority + '</option>';
                }
              }
              htmlContent += '</select>';
              htmlContent += '</div>';

              htmlContent += '<div class="formlabel">Incident Data</div>';
              htmlContent += '<div class="btnStyle" onclick="viewPopupForm(' + sitemateConfig.incidentTemplateId + ', \'sitemateFormViewerBox\', ' + TASK_REPORT + ', ' + incidentIndex + ')">VIEW</div>';

              htmlContent += '</div>';
              htmlContent += '<hr>';
              htmlContent += '<div class="selectarea" style="grid-template-columns: 45% 55%;">';

              if (sitemateConfig.investigationRequired == true) {
                htmlContent += '<div class="formlabel">Investigation required</div>';
                if (incident.investigationRequired == true) {
                  htmlContent += '<input type="checkbox" name="investigationRequired" value=' + incident.investigationRequired + ' class="formvalue" style="margin: 5px 0px;" checked/>';
                } else {
                  htmlContent += '<input type="checkbox" name="investigationRequired" value=' + incident.investigationRequired + ' class="formvalue" style="margin: 5px 0px;" />';
                }
              }

              var investigationDate = "";
              if (incident.investigationSchedule != null) { investigationDate = new Date(incident.investigationSchedule).toISOString().split('T')[0]; }
              htmlContent += '<div class="formlabel">Investigation schedule</div>';
              htmlContent += '<input type="date" name="investigationSchedule" value="' + investigationDate + '" class="formvalue" style="height: 35px;" />';

              htmlContent += '<div class="formlabel" >Investigator</div>';
              htmlContent += '<input id="sitemateInvestigatorSelect" class="formvalue" list="investigatorList" >';
              htmlContent += '<div class="selectDiv">';
              htmlContent += '<datalist id="investigatorList" class="selectBox" >';
              htmlContent += '<option value=0 id="sitemateInvestigatorOption_0">Select User</option>';
              for (var user of userIdAndNames) {
                if (incident.investigatorId == user.id) {
                  htmlContent += '<option value=' + user.id + ' id="sitemateInvestigatorOption_' + user.id + '" selected>' + user.id + ' - ' + user.firstName + ' ' + user.lastName + '</option>';
                } else {
                  htmlContent += '<option value=' + user.id + ' id="sitemateInvestigatorOption_' + user.id + '">' + user.id + ' - ' + user.firstName + ' ' + user.lastName + '</option>';
                }
              }
              htmlContent += '</datalist>';
              htmlContent += '</div>';

              htmlContent += '<div class="formlabel">Investigation Data</div>';
              if ((mySitemateIncidents[incidentIndex].investigationData != null) && (mySitemateIncidents[incidentIndex].investigationData.length > 0)) {
                htmlContent += '<div class="btnStyle" onclick="viewPopupForm(' + sitemateConfig.invstigationTemplateId + ', \'sitemateFormViewerBox\', ' + TASK_INVESTIGATION + ', ' + incidentIndex + ')">VIEW</div>';
              } else {
                htmlContent += '<div class="btnStyle inactive" onclick="viewPopupForm(' + sitemateConfig.invstigationTemplateId + ', \'sitemateFormViewerBox\', ' + TASK_INVESTIGATION + ', ' + incidentIndex + ')">VIEW</div>';
              }

              htmlContent += '</div>';
              htmlContent += '<hr>';
              htmlContent += '<div class="selectarea" style="grid-template-columns: 45% 55%;">';

              if (sitemateConfig.actionRequired == true) {
                htmlContent += '<div class="formlabel">Action required</div>';
                if (incident.actionRequired == true) {
                  htmlContent += '<input type="checkbox" name="actionRequired" value=' + incident.actionRequired + ' class="formvalue" style="margin: 5px 0px;" checked/>';
                } else {
                  htmlContent += '<input type="checkbox" name="actionRequired" value=' + incident.actionRequired + ' class="formvalue" style="margin: 5px 0px;" />';
                }
              }

              var actionDate = "";
              if (incident.actionSchedule != null) { actionDate = new Date(incident.actionSchedule).toISOString().split('T')[0]; }
              htmlContent += '<div class="formlabel">Action schedule</div>';
              htmlContent += '<input type="date" name="actionSchedule" value="' + actionDate + '" class="formvalue" style="height: 35px;" />';

              htmlContent += '<div class="formlabel">Action by</div>';
              htmlContent += '<input id="sitemateActorSelect" class="formvalue" list="actorList" >';
              htmlContent += '<div class="selectDiv">';
              htmlContent += '<datalist id="actorList" class="selectBox" >';
              htmlContent += '<option value=0 id="sitemateActorOption_0">Select User</option>';
              for (var user of userIdAndNames) {
                if (incident.actorId == user.id) {
                  htmlContent += '<option value=' + user.id + ' id="sitemateActorOption_' + user.id + '" selected>' + user.id + ' - ' + user.firstName + ' ' + user.lastName + '</option>';
                } else {
                  htmlContent += '<option value=' + user.id + ' id="sitemateActorOption_' + user.id + '">' + user.id + ' - ' + user.firstName + ' ' + user.lastName + '</option>';
                }
              }
              htmlContent += '</datalist>';
              htmlContent += '</div>';

              htmlContent += '<div class="formlabel">Action Data</div>';
              if ((mySitemateIncidents[incidentIndex].actionData != null) && (mySitemateIncidents[incidentIndex].actionData.length > 0)) {
                htmlContent += '<div class="btnStyle" onclick="viewPopupForm(' + sitemateConfig.actionTemplateId + ', \'sitemateFormViewerBox\', ' + TASK_ACTION + ', ' + incidentIndex + ')">VIEW</div>';
              } else {
                htmlContent += '<div class="btnStyle inactive" onclick="viewPopupForm(' + sitemateConfig.actionTemplateId + ', \'sitemateFormViewerBox\', ' + TASK_ACTION + ', ' + incidentIndex + ')">VIEW</div>';
              }

              htmlContent += '</div>';
              htmlContent += '<hr>';
              htmlContent += '<div class="selectarea" style="grid-template-columns: 45% 55%;">';

              if (sitemateConfig.auditRequired == true) {
                htmlContent += '<div class="formlabel">Audit required</div>';
                if (incident.auditRequired == true) {
                  htmlContent += '<input type="checkbox" name="auditRequired" value=' + incident.auditRequired + ' class="formvalue" style="margin: 5px 0px;" checked/>';
                } else {
                  htmlContent += '<input type="checkbox" name="auditRequired" value=' + incident.auditRequired + ' class="formvalue" style="margin: 5px 0px;" />';
                }
              }

              var auditDate = "";
              if (incident.auditSchedule != null) { auditDate = new Date(incident.auditSchedule).toISOString().split('T')[0]; }
              htmlContent += '<div class="formlabel">Audit schedule</div>';
              htmlContent += '<input type="date" name="auditSchedule" value="' + auditDate + '" class="formvalue" style="height: 35px;" />';

              htmlContent += '<div class="formlabel">Auditor</div>';
              htmlContent += '<input id="sitemateAuditorSelect" class="formvalue" list="auditorList" >';
              htmlContent += '<div class="selectDiv">';
              htmlContent += '<datalist id="auditorList" class="selectBox" >';
              htmlContent += '<option value=0 id="sitemateAuditorOption_0">Select User</option>';
              for (var user of userIdAndNames) {
                if (incident.auditorId == user.id) {
                  htmlContent += '<option value=' + user.id + ' id="sitemateAuditorOption_' + user.id + '" selected>' + user.id + ' - ' + user.firstName + ' ' + user.lastName + '</option>';
                } else {
                  htmlContent += '<option value=' + user.id + ' id="sitemateAuditorOption_' + user.id + '">' + user.id + ' - ' + user.firstName + ' ' + user.lastName + '</option>';
                }
              }
              htmlContent += '</datalist>';
              htmlContent += '</div>';

              htmlContent += '<div class="formlabel">Audit Data</div>';
              if ((mySitemateIncidents[incidentIndex].auditData != null) && (mySitemateIncidents[incidentIndex].auditData.length > 0)) {
                htmlContent += '<div class="btnStyle" onclick="viewPopupForm(' + sitemateConfig.auditTemplateId + ', \'sitemateFormViewerBox\', ' + TASK_AUDIT + ', ' + incidentIndex + ')">VIEW</div>';
              } else {
                htmlContent += '<div class="btnStyle inactive" onclick="viewPopupForm(' + sitemateConfig.auditTemplateId + ', \'sitemateFormViewerBox\', ' + TASK_AUDIT + ', ' + incidentIndex + ')">VIEW</div>';
              }

              htmlContent += '</div>';
              htmlContent += '<hr>';
              htmlContent += '<div class="selectarea" style="grid-template-columns: 45% 55%;">';

              htmlContent += '<div class="formlabel">Close Incident</div>';
              htmlContent += '<input type="checkbox" name="closeIncident" value=' + incident.incidentClosed + ' class="formvalue" style="margin: 5px 0px;"/>';

              htmlContent += '<div class="formlabel">Closing Note</div>';
              htmlContent += '<textarea id="closingNote" style="min-height: 100px; width: 100%; margin: auto; resize: vertical;" value=' + mySitemateIncidents[incidentIndex].closingNote + ' ></textarea>';
              htmlContent += '</div>';

              htmlContent += '</div>';

              htmlContent += '<hr>';

              htmlContent += '<div style="width: 100%; margin-top: 15px; display: flex; justify-content: space-around;">';
              htmlContent += '<div class="btnStyle" style="background-color: var(--primary-blue);" onclick="saveIncidentDetail(' + incidentIndex + ')">SAVE</div>';
              htmlContent += '</div>';
              htmlContent += '</div>';

              htmlContent += '<div id="sitemateFormViewerArea" style="padding-bottom: 50px;">';
              htmlContent += '<div id="sitemateFormViewerBox" style="padding-top: 10px;"></div>';
              htmlContent += '<div style="width: 100%; margin-top: 15px; display: flex; justify-content: space-around;">';
              htmlContent += '<div class="btnStyle" style="background-color: var(--primary-blue);" onclick="closeSmPopupArea()">CLOSE</div>';
              htmlContent += '</div>';
              htmlContent += '</div>';

              $('#modulesDisplayArea').html(htmlContent);
              $('#sitemateContentViewerArea').show();
              $('#sitemateFormViewerArea').hide();
              $("#modulesDisplayArea").show();
              $("#modulesMenuArea").hide();
              $("#modulesListArea").hide();
              fixModuleHeight("modulesModuleHeader, footerSection", 20, "modulesDisplayArea");

            } else { // Token expired
              getNewToken("viewIncidentReport(" + incidentIndex + ")");
            }
          }
        }).catch(err => {
          apiRequestFailed(err, "getformtemplate");
        });
      }).catch(err => console.warn("Request aborted due to missing requestOptions.", err));

      //console.log("locations: "+locations);
      //console.log("incident: "+incident);
    }
  }
}

function viewPopupForm(templateId, destin, task, incidentIndex) {
    const data = { token: shared.mCustomerDetailsJSON.token, templateId: templateId };

    buildRequestOptions(constructUrl("/api/getformtemplate"), "GET", data).then(request => {
        Http.request(request).then(res => {
            if (isValidResponse(res, "getformtemplate") && res.data) {
                const parsed = typeof res.data === "string" ? JSON.parse(res.data) : res.data;

                if (parsed.error !== "invalid_token") {  // Check if token is still valid
                    const formTemplate = parsed;
                    viewSitemateForm(formTemplate, destin, task, VIEW, incidentIndex);
                    $('#sitemateFormViewerArea').show();
                    $('#sitemateContentViewerArea').hide();
                } else { // Token expired
                    getNewToken("viewPopupForm(" + templateId + ", '" + destin + "', " + task + ", " + incidentIndex + ")");
                }
            }
        }).catch(err => {
            console.error("getformtemplate failed from server!", err);
        });
    }).catch(err => {
        console.warn("Request aborted due to missing requestOptions.", err);
    });
}

function submitIncidentForm(task) {
    if (blankIncident != null) {
        var selectedLocation = $("#sitemateIncidentLocationSelect").val();
			var newIncident = null;	
        if (selectedLocation != null) {
            newIncident = blankIncident;

            var table = document.getElementById('formTemplateTable_' + task);
            var elems = table.getElementsByClassName("formdata");
            var formValue = '{';
            index = 0;
            for (var elem of elems) {
                if (index > 0) {
                    formValue += ',';
                }
                formValue += '"' + elem.id + '":"' + elem.value + '"';
                index++;
            }
            formValue += '}';

            newIncident.incidentReportData = formValue;
            newIncident.incidentName = $('#sitemateIncidentName').val();

            if (sitemateConfig.allowAnonymousReport == true) {
                if ($('#sitemateIsAnonymous').is(":checked")) {
                    newIncident.userId = 0;
                    newIncident.userName = "";
                    newIncident.userEmail = "";
                    newIncident.userPhone = "";
                }
            }

            for (var loc of sitemateLocations) {
                if (loc.id == selectedLocation) {
                    newIncident.locationId = loc.id;
                    newIncident.locationName = loc.locationName;
                    newIncident.safetyManagerId = loc.safetyManagerId;
                    newIncident.safetyManagerName = loc.safetyManagerName;
                    newIncident.safetyManagerEmail = loc.safetyManagerEmail;
                    newIncident.safetyManagerPhone = loc.safetyManagerPhone;
                    newIncident.hodId = loc.escalationId;
                    newIncident.hodName = loc.escalationName;
                    newIncident.hodEmail = loc.escalationEmail;
                    newIncident.hodPhone = loc.escalationPhone;
                    break;
                }
            }

            newIncident.incidentStatus = "Reported";

            const data = { token: shared.mCustomerDetailsJSON.token, data: JSON.stringify(newIncident) };

            RequestOptions(constructUrl("/api/restsaveincident"), "POST", data).then(request => {
                Http.request(request).then(res => {
                    if (isValidResponse(res, "restsaveincident") && res.data) {
                        const parsed = typeof res.data === "string" ? JSON.parse(res.data) : res.data;

                        if (parsed.error !== "invalid_token") { // Token still valid
                            console.log(parsed);
                            showDialog("Incident report success!", "viewSitemate()");
                        } else { // Token expired
                            getNewToken("submitIncidentForm(" + task + ")");
                        }
                    }
                }).catch(err => {
                    console.error("restsaveincident failed from server!", err);
                });
            }).catch(err => {
                console.warn("Request aborted due to missing requestOptions.", err);
            });

        } else {
            showDialog("Please select Location!");
        }
    }
}

function submitForm(incidentIndex, task) {
	const incident = mySitemateIncidents[incidentIndex];

	const table = document.getElementById("formTemplateTable_" + task);
	const elems = table.getElementsByClassName("formdata");
	let formValue = "{";
	let index = 0;
	for (let elem of elems) {
		if (index > 0) {
			formValue += ",";
		}
		formValue += '"' + elem.id + '":"' + elem.value + '"';
		index++;
	}
	formValue += "}";

	let url = "";
	if (task === TASK_INVESTIGATION) {
		mySitemateIncidents[incidentIndex].investigationData = formValue;
		url = "/api/restsaveincidentinvestigation";
	} else if (task === TASK_ACTION) {
		mySitemateIncidents[incidentIndex].actionData = formValue;
		url = "/api/restsaveincidentaction";
	} else if (task === TASK_AUDIT) {
		mySitemateIncidents[incidentIndex].auditData = formValue;
		url = "/api/restsaveincidentaudit";
	}

	if (url !== "") {
		const data = {
			token: shared.mCustomerDetailsJSON.token,
			id: incident.id,
			data: formValue
		};

		RequestOptions(constructUrl(url), "POST", data)
			.then((request) => {
				Http.request(request)
					.then((res) => {
						if (isValidResponse(res, url)) {
							if (res.error !== "invalid_token") {
								console.log(res);
								showDialog("Save success!", "getMyIncidents()");
							} else {
								getNewToken("submitForm(" + incidentIndex + ", " + task + ")");
							}
						}
					})
					.catch((err) => {
						apiRequestFailed(err, url);
						console.error("submitForm request failed!", err);
					});
			})
			.catch((err) => {
				console.warn("Request aborted due to missing requestOptions.", err);
			});
	}
}

function saveIncidentDetail(incidentIndex) {
	//$('#loadingmessage').show();
	let incident = mySitemateIncidents[incidentIndex];

	if ($("#sitemateCategorySelect").val() !== "") {
		incident.incidentCategory = $("#sitemateCategorySelect").val();
	}
	if ($("#sitematePrioritySelect").val() !== "") {
		incident.incidentPriority = $("#sitematePrioritySelect").val();
	}

	// Investigation
	if ($('input[name="investigationRequired"]').is(":checked")) {
		incident.investigationRequired = true;
		const investigatorId = $("#sitemateInvestigatorSelect").val();
		const userArr = userIdAndNames.filter((v) => investigatorId.indexOf(v.id) > -1);
		if (userArr.length > 0) {
			const user = userArr[0];
			console.log("user: " + JSON.stringify(user));
			incident.investigatorId = user.id;
			incident.investigatorName = user.firstName + " " + user.lastName;
			incident.investigatorEmail = user.email;
			incident.investigatorPhone = user.phone;
		} else {
			incident.investigatorId = 0;
		}
		const dateStr = $('input[name=investigationSchedule]').val();
		if (dateStr.length > 0) {
			const ms = Date.parse(dateStr);
			incident.investigationSchedule = ms;
		}
	} else {
		incident.investigationRequired = false;
	}

	// Action
	if ($('input[name="actionRequired"]').is(":checked")) {
		incident.actionRequired = true;
		const actorId = $("#sitemateActorSelect").val();
		const userArr = userIdAndNames.filter((v) => actorId.indexOf(v.id) > -1);
		if (userArr.length > 0) {
			const user = userArr[0];
			console.log("user: " + JSON.stringify(user));
			incident.actorId = user.id;
			incident.actorName = user.firstName + " " + user.lastName;
			incident.actorEmail = user.email;
			incident.actorPhone = user.phone;
		} else {
			incident.actorId = 0;
		}
		const dateStr = $('input[name=actionSchedule]').val();
		if (dateStr.length > 0) {
			const ms = Date.parse(dateStr);
			incident.actionSchedule = ms;
		}
	} else {
		incident.actionRequired = false;
	}

	// Audit
	if ($('input[name="auditRequired"]').is(":checked")) {
		incident.auditRequired = true;
		const auditorId = $("#sitemateAuditorSelect").val();
		const userArr = userIdAndNames.filter((v) => auditorId.indexOf(v.id) > -1);
		if (userArr.length > 0) {
			const user = userArr[0];
			console.log("user: " + JSON.stringify(user));
			incident.auditorId = user.id;
			incident.auditorName = user.firstName + " " + user.lastName;
			incident.auditorEmail = user.email;
			incident.auditorPhone = user.phone;
		} else {
			incident.auditorId = 0;
		}
		const dateStr = $('input[name=auditSchedule]').val();
		if (dateStr.length > 0) {
			const ms = Date.parse(dateStr);
			incident.auditSchedule = ms;
		}
	} else {
		incident.auditRequired = false;
	}

	// Close Incident
	if ($('input[name="closeIncident"]').is(":checked")) {
		incident.incidentClosed = true;
		incident.incidentStatus = "Closed";
	}
	incident.closingNote = $("#closingNote").val();

	mySitemateIncidents[incidentIndex] = incident;

	const data = {
		token: shared.mCustomerDetailsJSON.token,
		data: JSON.stringify(incident),
	};

	RequestOptions(constructUrl("/api/restsaveincident"), "POST", data)
		.then((request) => {
			Http.request(request)
				.then((res) => {
					if (isValidResponse(res, "restsaveincident")) {
						if (res.error !== "invalid_token") {
							console.log(res);
							showDialog("Save success!", "getMyIncidents()");
						} else {
							getNewToken("saveIncidentDetail(" + incidentIndex + ")");
						}
					}
				})
				.catch((err) => {
					apiRequestFailed(err, "restsaveincident");
					console.error("saveIncidentDetail request failed!", err);
				});
		})
		.catch((err) => {
			console.warn("Request aborted due to missing requestOptions.", err);
		});
}


function viewSmFullScreenImage(that) {
	var htmlContent = '';

	var objectKey = $('#'+that.id.replace('smpreview_','')).val();
	if(objectKey.startsWith(s3PrivateUrl)) {
		objectKey = objectKey.replace(s3PrivateUrl, "");
		let destinId = 'img_fsarea';

		getSignedUrl(objectKey, 10).then(url => {
			if(url.startsWith("https://")) {
				htmlContent += '<div class="fullScreenMenuBar" onclick="closeSmFullScreenImage()"><i class="fas fa-times expandCompressBtn"></i></div>';
				htmlContent += '<div style="width:100%; height: 100%" id="'+that.id+'_fs"><img id="'+that.id+'_fs_image" style="width: 100%; max-height: 100%; object-fit: contain;" src="'+url+'" onerror="this.onerror=null;this.src=\'./img/noimage.jpg\';"></div>';
				$('#'+destinId).html(htmlContent);
				initPinchZoom(that.id+'_fs_image');
			}
		});
		shared.currentState = "viewFullScreenImage";
		$('#'+destinId).show();
	}
}

function closeSmFullScreenImage() {
	shared.currentState = "viewSelectedIncidentReport";
	$('#img_fsarea').hide();
}

/****************************************************************************************************
 Function: backSitemate
 Purpose: Back button handler for siteMate
****************************************************************************************************/

function viewSitemateMenuScreen() {
	shared.currentState = shared.currentSourceState;
	unsavedData = false;
	$('#modulesMenuArea').show();
	$('#modulesListArea').show();
	$('#modulesDisplayArea').hide();
}

function closeSmPopupArea() {
	shared.currentState = shared.currentSourceState;
	unsavedData = false;
	$('#sitemateContentViewerArea').show();
	$('#sitemateFormViewerArea').hide();
}

function closeSitemateDispalayArea() {
	shared.currentState = shared.currentSourceState;
	unsavedData = false;
	$("#modulesDisplayArea").hide();
	$("#modulesMenuArea").show();
	$("#modulesListArea").show();
}

export function backSitemateHandle() {
	if (shared.currentState == "createIncidentReport") {
		if (unsavedData === true) {
			showConfirmDialog({
				message: "Any unsaved data will be lost. Proceed?",
				yesLabel: "Proceed",
				noLabel: "Cancel",
				onYes: () => {
					viewSitemate();
				},
				onNo: () => {
					console.log("❌ User cancelled backSitemateHandle (createIncidentReport)");
				}
			});
		} else {
			viewSitemate();
		}
	} else if (shared.currentState == "departmentsitemateincident") {
		getSitemateDepartments();
	} else if (shared.currentState == "locationsitemateincident") {
		getSitemateLocations();
	} else if (shared.currentState == "categorysitemateincident") {
		getSitemateCategorys();
	} else if (
		shared.currentState == "manageIncident" ||
		shared.currentState == "viewSelectedIncidentReport" ||
		shared.currentState == "performSitemateTask" ||
		shared.currentState == "sitemateincident"
	) {
		if (unsavedData === true) {
			showConfirmDialog({
				message: "Any unsaved data will be lost. Proceed?",
				yesLabel: "Proceed",
				noLabel: "Cancel",
				onYes: () => {
					closeSitemateDispalayArea();
				},
				onNo: () => {
					console.log("❌ User cancelled backSitemateHandle (incident flow)");
				}
			});
		} else {
			closeSitemateDispalayArea();
		}
	} else {
		shared.currentState = "";
		exitSitemate();
	}
}

function closeSitemate() {
	showConfirmDialog({
		message: "Exit SiteMate?",
		yesLabel: "Exit",
		noLabel: "Cancel",
		onYes: () => {
			exitSitemate();
		},
		onNo: () => {
			console.log("❌ User cancelled closeSitemate");
		}
	});
}













window.viewSitemate = viewSitemate;
window.exitSitemate = exitSitemate;
window.getConfigData = getConfigData;
window.displaySitemateMenu = displaySitemateMenu;
window.viewIncidents = viewIncidents;
window.getMyIncidents = getMyIncidents;
window.getIncidentAtListIndex = getIncidentAtListIndex;
window.getSitemateLocations = getSitemateLocations;
window.getSitemateDepartments = getSitemateDepartments;
window.getSitemateCategorys = getSitemateCategorys;
window.searchSitemateDepartmentLocationCategory = searchSitemateDepartmentLocationCategory;
window.getIncidentsAtSelected = getIncidentsAtSelected;
window.getIncidentsAtDepartmentLocationCategory = getIncidentsAtDepartmentLocationCategory;
window.searchSitemateincident = searchSitemateincident;
window.createIncidentReport = createIncidentReport;
window.viewNotificationIncident = viewNotificationIncident;
window.viewIncidentReport = viewIncidentReport;
window.viewSelectedIncidentReport = viewSelectedIncidentReport;
window.getMySitemateTask = getMySitemateTask;
window.viewSitemateForm = viewSitemateForm;
window.selectElemOnchangeInit = selectElemOnchangeInit;
window.performSitemateTask = performSitemateTask;
window.manageIncident = manageIncident;
window.viewPopupForm = viewPopupForm;
window.submitIncidentForm = submitIncidentForm;
window.submitForm = submitForm;
window.saveIncidentDetail = saveIncidentDetail;
window.viewSmFullScreenImage = viewSmFullScreenImage;
window.closeSmFullScreenImage = closeSmFullScreenImage;
window.viewSitemateMenuScreen = viewSitemateMenuScreen;
window.closeSmPopupArea = closeSmPopupArea;
window.closeSitemateDispalayArea = closeSitemateDispalayArea;

