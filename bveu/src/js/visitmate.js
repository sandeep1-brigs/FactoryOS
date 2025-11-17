import { Filesystem, Directory, Encoding } from "@capacitor/filesystem"
import { Capacitor } from '@capacitor/core';
import { Device } from "@capacitor/device"
import { Http } from '@capacitor-community/http';
import { Network } from '@capacitor/network';
import { App } from '@capacitor/app';
import $ from 'jquery';
import { Browser } from '@capacitor/browser';

import { shared } from "./globals";
import { showConfirmDialog , displaySection , buildRequestOptions , RequestOptions , isValidResponse } from "./capacitor-welcome";
import { showDialog , highlightHeaderTabMenu , constructUrl , fixModuleHeight , getSignedUrl , captureImage , startAppIdleTimer} from "./utility";
import {  exitModules } from "./content";
import { apiRequestFailed } from "./auth";
import { createList } from "./list";
import { getMenuBar , getNewToken } from "./settings";
import { openCourse } from "./knowledgemate";

const APPROVE = 0;
const REJECT = 1;
const APP_INDEX = 0;
const STATUS_INDEX = 1;
const VISITKEY_INDEX = 2;
const CODEID_INDEX = 3;
const COURSEID_INDEX = 4;
const VISITID_INDEX = 5;
const COMPANYKEY_INDEX = 6;
let visitmateMode = 'VISITOR';
var unsavedData = false;
var currentVisitmateQRCode = null;
var allUsersVisitorsDepts = null;
var myVisitorVisits = null;
var mVisitDetailsJSON = null;
var mVisitorregistration = null;
var mVisitorinvite = null;
var visitorVisitDetail = null;
let myVisitType = '';
var listItems = [];
let totalPages = 1; 
const dayInMs = 86400000;

function viewVisitmate() {
	shared.currentRunningApp = 'visitMate';
	unsavedData = false;
	$('#moduleTitle').html("VISITORS");
	//updateAppRuntime("visitMate", "on", "ok");
	displaySection('modulesSection', 'flex', false, true);
	$('#modulesMenuArea').show();
	$('#modulesListArea').show();
	$('#modulesDisplayArea').hide();

	if (shared.mCustomerDetailsJSON != null) {
		visitmateMode = 'USER';
	} else {
		visitmateMode = 'VISITOR';
	}
	//$('#loadingmessage').hide();
	displayVisitmateMenu();

	if (shared.mCustomerDetailsJSON != null) {
		let btn = document.getElementById("btnId_view_myvisitors");
		setTimeout(function() {
			btn.click();
		}, 200);
	}		
}

function closeVisitmate() {
    showConfirmDialog({
        message: "Exit VisitMate?",
        yesLabel: "Exit",
        noLabel: "Cancel",
        onYes: () => {
            console.log("✅ User confirmed exit from VisitMate");
            exitVisitmate();
        },
        onNo: () => {
            console.log("❌ User cancelled exit from VisitMate");
        }
    });
}

function exitVisitmate() {
	if(shared.mCustomerDetailsJSON == null) {
        startAppIdleTimer();
    }
	exitModules();
}

function displayVisitmateMenu() {
	
	var htmlContent = "";
	var visitmateScreenSource = null;
	if(visitmateMode = 'USER') {
		visitmateScreenSource = shared.cmsJSON.cmsJSONdata.visitmateScreen;
	} else {
		visitmateScreenSource = shared.cmsJSON.cmsJSONdata.visitmateKioskScreen;
	}

	$.each(visitmateScreenSource.sectionList, function(key, section) {
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

			if(visitmateMode = 'USER') {
				htmlContent += '<div class="searchArea"><div class="searchBox" id="visitmate_searchbox"></div></div>';
				htmlContent += '<div class="searchArea"><div class="searchBox" id="visitmate_months">';
					htmlContent += '<div style="display: flex; padding-bottom: 10px; justify-content: center; align-items: center; flex-wrap: wrap; border-bottom: 1px solid rgba(0,0,0,0.1);">';
						htmlContent += '<label for="myVisitmateMonths" style="font-weight: normal;">From last months</label>';
						htmlContent += '<input type="number" id="myVisitmateMonths" value="0" style="margin: 0 5px; width: 40px;" />';
					htmlContent += '</div>';
				htmlContent += '</div>';
			}

			htmlContent += '</div>';
		}
	});
	$("#modulesMenuArea").html(htmlContent);
}

function handleVisitmateQrCode(code) {
	shared.currentState = "scanVisitmateQRCode";
	
	if(code != null) {

		currentVisitmateQRCode = code.split(' -- ');
		if(currentVisitmateQRCode[APP_INDEX] == 'VISITMATE') {
			if((currentVisitmateQRCode[STATUS_INDEX] == 'REGISTERED') || (currentVisitmateQRCode[STATUS_INDEX] == 'PASSED') || (currentVisitmateQRCode[STATUS_INDEX] == 'APPROVED')) {
				if(visitmateMode == 'USER') {
					viewVisitorRecord(currentVisitmateQRCode[VISITID_INDEX]);
				} else {
					viewVisitorLogin(currentVisitmateQRCode);
					// $("#visitmateFormArea").html('<div class="displayTitleClass">Your registration has not been approved yet!</div>');
				}
			}
		}
	}
}

function viewMyVisitors(type = 'ALL') {
	$('#visitmate_searchbox').html('<input type="search" class="searchInput" id="visitmate_visit_search_input" placeholder="Search course" /><button class="searchBtn" id="visitmate_visit_searchbtn" onclick="getMyVisitors()"><span class="material-symbols-outlined" style="font-size: 30px; padding: 5px 0;"></span></button>');
	myVisitType = type;
	getMyVisitors();
}



// function getMyVisitors(page = 1, size = 50) {
//   shared.currentState = "getMyVisitors";
//   shared.currentSourceState = shared.currentState;
//   unsavedData = false;
//   var type = myVisitType;

//   $('#modulesMenuArea').show();
//   $('#modulesListArea').show();
//   $('#modulesDisplayArea').hide();

//   highlightHeaderTabMenu("menuBtn", "btnId_view_myvisitors");
//   let searchStr = $("#visitmate_visit_search_input").val();
//   var months = $("#myVisitmateMonths").val();
//   if (months == "") {
//     months = 0;
//   }

//   var htmlContent = '';

//   htmlContent += '<div style="padding: 0 10px; display: flex; justify-content: flex-start; flex-wrap: wrap;">';
//   htmlContent += '<div class="listBoxActionButton visitTypeClass" id="visit_ALL" style="border-radius: 5px; padding: 5px 10px; margin: 5px;" onclick="viewMyVisitors(\'ALL\')">All</div>';
//   htmlContent += '<div class="listBoxActionButton visitTypeClass" id="visit_REGISTERED" style="border-radius: 5px; padding: 5px 10px; margin: 5px;" onclick="viewMyVisitors(\'REGISTERED\')">Scheduled</div>';
//   htmlContent += '<div class="listBoxActionButton visitTypeClass" id="visit_TRAINED" style="border-radius: 5px; padding: 5px 10px; margin: 5px;" onclick="viewMyVisitors(\'TRAINED\')">Training Complete</div>';
//   htmlContent += '<div class="listBoxActionButton visitTypeClass" id="visit_VISITING" style="border-radius: 5px; padding: 5px 10px; margin: 5px;" onclick="viewMyVisitors(\'VISITING\')">In Progress</div>';
//   htmlContent += '<div class="listBoxActionButton visitTypeClass" id="visit_VISITED" style="border-radius: 5px; padding: 5px 10px; margin: 5px;" onclick="viewMyVisitors(\'VISITED\')">Completed</div>';
//   htmlContent += '<div class="listBoxActionButton visitTypeClass" id="visit_CANCELLED" style="border-radius: 5px; padding: 5px 10px; margin: 5px;" onclick="viewMyVisitors(\'CANCELLED\')">Cancelled</div>';
//   htmlContent += '<div class="listBoxActionButton visitTypeClass" id="visit_APPROVAL" style="border-radius: 5px; padding: 5px 10px; margin: 5px;" onclick="viewMyVisitors(\'APPROVAL\')">Approval Pending</div>';
//   htmlContent += '<div class="listBoxActionButton visitTypeClass" id="visit_REJECTED" style="border-radius: 5px; padding: 5px 10px; margin: 5px;" onclick="viewMyVisitors(\'REJECTED\')">Rejected</div>';
//   htmlContent += '</div>';
//   htmlContent += '<div id="visitmatevisitListArea"></div>';
//   $('#modulesListBox').html(htmlContent);

//   var htmlContent = '';

//   const data = {
//     "token": shared.mCustomerDetailsJSON.token,
//     "searchStr": searchStr,
//     "months": months,
//     "page": page,
//     "size": size,
//     "visitState": type
//   };

//   const url = "/visitorvisits/searchmyvisitorvisitspaginated";

//   buildRequestOptions(constructUrl(url), "GET", data)
//     .then(request => Http.request(request))
//     .then(res => {
//       if (isValidResponse(res, url)) {
//         const jqXHR = res.data;
//         if (jqXHR.error !== "invalid_token") {
//           myVisitorVisits = jqXHR;

//           listItems = [];

//           var items = myVisitorVisits.content;
//           var pageable = myVisitorVisits.pageable;
//           totalPages = myVisitorVisits.totalPages;

//           if (items.length > 0) {
//             for (var index in items) {
//               let states = [];
//               let actions = [];
//               let activeActions = [];
//               let item = items[index];

//               let startDateStr = new Date(item.visitStartDate);
//               let endDateStr = new Date(item.visitEndDate);
//               const startDate = startDateStr.toLocaleString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true });
//               const endDate = endDateStr.toLocaleString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true });

//               let name = '<div class="title">' + item.visitorName + '</div>';

//               let description = '<div style="display: flex;"><span class="material-symbols-outlined" style="font-size: 20px; padding-right: 10px; color: var(--secondary-cyan);">business_center</span><div>' + item.visitorCompany + '</div></div>';
//               description += '<div style="display: flex;"><span class="material-symbols-outlined" style="font-size: 20px; padding-right: 10px; color: var(--secondary-cyan);">mail</span><a href="mailto:' + item.visitorEmail + '">' + item.visitorEmail + '</a></div>';
//               description += '<div style="display: flex;"><span class="material-symbols-outlined" style="font-size: 20px; padding-right: 10px; color: var(--secondary-cyan);">call</span><a href="tel:' + item.visitorPhone + '">' + item.visitorPhone + '</a></div>';
//               description += '<div>' + startDate + ' - ' + endDate + '</div>';

//               let image = '';
//               if (item.visitorImage != undefined && item.visitorImage != null && item.visitorImage.length > 0) {
//                 image = item.visitorImage;
//               } else {
//                 image = '<span class="material-symbols-outlined ticketStyleMaterializeIcon">assignment_ind</span>';
//               }

//               let visitStatus = "Unknown";
//               if (item.idPrinted == true) {
//                 visitStatus = "Visiting";
//               } else {
//                 visitStatus = item.visitStatus.toLowerCase().trim().split(/\s+/).map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
//               }
//               states.push({ "text": visitStatus, "type": "warningState" });
//               var time = new Date().getTime();
//               if (item.visitEndDate < (time + dayInMs) && item.idPrinted == false) {
//                 states.push({ "text": "Not Visited", "type": "errorState" });
//               }

//               if (item.visitStatus == "APPROVAL") {
//                 actions.push({ "text": "Approve", "type": "button", "actionClass": "activeActionWideBlue", "act": "manageVisitRequest('" + item.id + "', 1)" });
//                 activeActions.push({ "text": "Approve" });
//                 actions.push({ "text": "Reject", "type": "button", "actionClass": "activeActionWideBlue", "act": "manageVisitRequest('" + item.id + "', 0)" });
//                 activeActions.push({ "text": "Reject" });
//               }

//               if (item.courseComplete == true) {
//                 item.visitStatus = "TRAINED";
//               }

//               if (item.visitStatus == "TRAINED" || item.visitStatus == "VISITING") {
//                 actions.push({ "text": "Training Status", "type": "button", "actionClass": "activeActionWideBlue", "act": "getCourseState(" + item.courseId + ", " + item.visitorId + ")" });
//                 activeActions.push({ "text": "Training Status" });
//                 actions.push({ "text": "Visitor Pass", "type": "button", "actionClass": "activeActionWideGreen", "act": "viewVisitorRecord(" + item.id + ", 'pass')" });
//                 activeActions.push({ "text": "Visitor Pass" });
//               }
//               if (item.idPrinted == true) {
//                 actions.push({ "text": "Complete", "type": "button", "actionClass": "activeActionWideOrange", "act": "setVisitStatus(" + item.id + ", 'COMPLETED')" });
//                 activeActions.push({ "text": "Complete" });
//               }

//               let itemJson = { "id": item.id, "image": image, "title": name, "description": description, "clickAction": "viewVisitorRecord(" + item.id + ")", "states": states, "actions": actions, "activeActions": activeActions };
//               listItems.push(itemJson);

//               if (index == items.length - 1) {
//                 createList("visitor", htmlContent, listItems, pageable, totalPages, "visitmatevisitListArea", "", "getMyVisitors", "ticketStyle");
//                 let typeId = type.replace(/\s+/g, '');
//                 $('#visit_' + typeId).addClass("activeAction1");
//               }
//             }
//           } else {
//             htmlContent = '<div style="padding: 20px;">No visitors found for the given duration and filter (' + type + ')!</div>';
//             $('#visitmatevisitListArea').html(htmlContent);
//             let typeId = type.replace(/\s+/g, '');
//             $('#visit_' + typeId).addClass("activeAction1");
//           }

//         } else {
//           getNewToken("getMyVisitors()");
//         }
//       }
//     })
//     .catch(err => {
//       apiRequestFailed(err, url);
//     });
// }

async function getMyVisitors(page = 1, size = 50) {
  try {
    shared.currentState = "getMyVisitors";
    shared.currentSourceState = shared.currentState;
    unsavedData = false;
    const type = myVisitType;

    $("#modulesMenuArea").show();
    $("#modulesListArea").show();
    $("#modulesDisplayArea").hide();

    highlightHeaderTabMenu("menuBtn", "btnId_view_myvisitors");

    const searchStr = $("#visitmate_visit_search_input").val() || "";
    const months = $("#myVisitmateMonths").val() || 0;

    // Build the tab header
    let htmlContent = `
      <div style="padding: 0 10px; display: flex; justify-content: flex-start; flex-wrap: wrap;">
        ${["ALL", "REGISTERED", "TRAINED", "VISITING", "VISITED", "CANCELLED", "APPROVAL", "REJECTED"]
          .map(
            state => `
              <div class="listBoxActionButton visitTypeClass" 
                   id="visit_${state}" 
                   style="border-radius: 5px; padding: 5px 10px; margin: 5px;" 
                   onclick="viewMyVisitors('${state}')">
                   ${state === "REGISTERED" ? "Scheduled" :
                      state === "TRAINED" ? "Training Complete" :
                      state === "VISITING" ? "In Progress" :
                      state === "VISITED" ? "Completed" :
                      state === "CANCELLED" ? "Cancelled" :
                      state === "APPROVAL" ? "Approval Pending" :
                      state === "REJECTED" ? "Rejected" :
                      "All"}
              </div>`
          ).join("")}
      </div>
      <div id="visitmatevisitListArea"></div>
    `;
    $("#modulesListBox").html(htmlContent);

    // ✅ Build URL with query parameters
    const baseUrl = constructUrl("/visitorvisits/searchmyvisitorvisitspaginated");
    const queryParams = new URLSearchParams({
      token: shared.mCustomerDetailsJSON.token,
      searchStr,
      months,
      page,
      size,
      visitState: type,
    }).toString();
    const fullUrl = `${baseUrl}?${queryParams}`;

    // ✅ Build request for GET (no body)
    const request = await buildRequestOptions(fullUrl, "GET");

    const res = await Http.request(request);

    // ✅ Validate the structure of the response
    if (!res || !res.data) {
      console.error("Invalid API response:", res);
      return apiRequestFailed("Empty or malformed response", fullUrl);
    }

    if (!isValidResponse(res, fullUrl)) {
      console.warn(fullUrl, "Failed!");
      return;
    }

    const jqXHR = res.data;

    if (jqXHR.error === "invalid_token") {
      return getNewToken("getMyVisitors()");
    }

    const items = jqXHR.content || [];
    const pageable = jqXHR.pageable || {};
    const totalPages = jqXHR.totalPages || 0;

    if (items.length === 0) {
      $("#visitmatevisitListArea").html(
        `<div style="padding: 20px;">No visitors found for the given duration and filter (${type})!</div>`
      );
      $(`#visit_${type.replace(/\s+/g, "")}`).addClass("activeAction1");
      return;
    }

    // ✅ Build list items dynamically
    const listItems = items.map(item => {
      const states = [];
      const actions = [];
      const activeActions = [];

      const startDate = new Date(item.visitStartDate).toLocaleString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });

      const endDate = new Date(item.visitEndDate).toLocaleString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });

      const name = `<div class="title">${item.visitorName}</div>`;
      let description = `
        <div style="display: flex;">
          <span class="material-symbols-outlined" style="font-size: 20px; padding-right: 10px; color: var(--secondary-cyan);">business_center</span>
          <div>${item.visitorCompany}</div>
        </div>
        <div style="display: flex;">
          <span class="material-symbols-outlined" style="font-size: 20px; padding-right: 10px; color: var(--secondary-cyan);">mail</span>
          <a href="mailto:${item.visitorEmail}">${item.visitorEmail}</a>
        </div>
        <div style="display: flex;">
          <span class="material-symbols-outlined" style="font-size: 20px; padding-right: 10px; color: var(--secondary-cyan);">call</span>
          <a href="tel:${item.visitorPhone}">${item.visitorPhone}</a>
        </div>
        <div>${startDate} - ${endDate}</div>`;

      const image = item.visitorImage?.length
        ? item.visitorImage
        : '<span class="material-symbols-outlined ticketStyleMaterializeIcon">assignment_ind</span>';

      let visitStatus = item.idPrinted ? "Visiting" : capitalizeWords(item.visitStatus || "Unknown");
      states.push({ text: visitStatus, type: "warningState" });

      const now = Date.now();
      if (item.visitEndDate < now + dayInMs && !item.idPrinted) {
        states.push({ text: "Not Visited", type: "errorState" });
      }

      if (item.visitStatus === "APPROVAL") {
        actions.push(
          { text: "Approve", type: "button", actionClass: "activeActionWideBlue", act: `manageVisitRequest('${item.id}', 1)` },
          { text: "Reject", type: "button", actionClass: "activeActionWideBlue", act: `manageVisitRequest('${item.id}', 0)` }
        );
      }

      if (item.courseComplete) item.visitStatus = "TRAINED";

      if (["TRAINED", "VISITING"].includes(item.visitStatus)) {
        actions.push(
          { text: "Training Status", type: "button", actionClass: "activeActionWideBlue", act: `getCourseState(${item.courseId}, ${item.visitorId})` },
          { text: "Visitor Pass", type: "button", actionClass: "activeActionWideGreen", act: `viewVisitorRecord(${item.id}, 'pass')` }
        );
      }

      if (item.idPrinted) {
        actions.push({ text: "Complete", type: "button", actionClass: "activeActionWideOrange", act: `setVisitStatus(${item.id}, 'COMPLETED')` });
      }

      return {
        id: item.id,
        image,
        title: name,
        description,
        clickAction: `viewVisitorRecord(${item.id})`,
        states,
        actions,
        activeActions,
      };
    });

    createList("visitor", "", listItems, pageable, totalPages, "visitmatevisitListArea", "", "getMyVisitors", "ticketStyle");
    $(`#visit_${type.replace(/\s+/g, "")}`).addClass("activeAction1");
  } catch (err) {
    apiRequestFailed(err, "/visitorvisits/searchmyvisitorvisitspaginated");
  }
}

/* Helper: Capitalize words */
function capitalizeWords(str = "") {
  return str
    .toLowerCase()
    .split(/\s+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}






function createVisitor() {
	//$('#loadingmessage').show();
	highlightHeaderTabMenu("menuBtn", "btnId_view_newvisitor");

	shared.currentState = "createVisitor";
	unsavedData = true;

	if (allUsersVisitorsDepts == null) {
		const data = { token: shared.mCustomerDetailsJSON.token };

		buildRequestOptions(constructUrl("/visitorvisits/restgetusersvisitorsdepts"), "GET", data)
			.then(request => {
				Http.request(request)
					.then(res => {
						if (isValidResponse(res, "restgetusersvisitorsdepts")) {
							if (res.data && res.data.error !== "invalid_token") {
								allUsersVisitorsDepts = (typeof res.data === "string" ? JSON.parse(res.data) : res.data);
								createInvitationForm();
							} else {
								getNewToken("createVisitor()");
							}
						}
						//$('#loadingmessage').hide();
					})
					.catch(err => {
						console.error("Server call failed: restgetusersvisitorsdepts", err);
						//$('#loadingmessage').hide();
					});
			})
			.catch(err => {
				console.warn("Request aborted due to missing requestOptions.", err);
				//$('#loadingmessage').hide();
			});
	} else {
		createInvitationForm();
	}
}



function submitInvitation() {
    var visitStartDate = $("#visitStartDate").val();
    var visitEndDate = $("#visitEndDate").val();
    var visitorName = $("#visitorName").val();
    var visitorEmail = $("#visitorEmail").val();
    var visiteeName = $("#visitmateVisiteeSelect").val();
    var visiteeDept = $("#visiteedepartment").val();
    var courseId = $("#visitmateCourseSelect").val();

    var currentTime = new Date().getTime();

    if (visitEndDate < visitStartDate) {
        showDialog("Visit end date/time cannot be earlier than start date/time.");
    } else if (visitEndDate < currentTime) {
        showDialog("Visit end date/time cannot be earlier than current date/time.");
    } else if (
        (visitorName === "") || (visitorEmail === "") ||
        (visiteeName === "") || (visiteeDept === "") ||
        (visitStartDate === "") || (visitEndDate === "")
    ) {
        showDialog("All * marked fields are required!");
    } else if (visitStartDate < currentTime) {
        showConfirmDialog({
            message: "Visit start date/time is older than current date/time. Are you sure?",
            yesLabel: "Proceed",
            noLabel: "Cancel",
            onYes: () => {
                console.log("⚠️ User confirmed outdated start date, proceeding");
                confirmSubmitInvitation();
            },
            onNo: () => {
                console.log("❌ User cancelled outdated start date submission");
            }
        });
    } else if (courseId === "" || courseId === "0") {
        showConfirmDialog({
            message: "No training course has been assigned to the visitor(s). Are you sure?",
            yesLabel: "Proceed",
            noLabel: "Cancel",
            onYes: () => {
                console.log("⚠️ User confirmed submission without course");
                confirmSubmitInvitation();
            },
            onNo: () => {
                console.log("❌ User cancelled submission without course");
            }
        });
    } else {
        confirmSubmitInvitation();
    }
}

export function backVisitmateHandle() {
    if (shared.currentState === "courseContent") {
        viewMyVisitors();
    } else if (shared.currentState === "viewVisitorRecord") {
        viewVisitorListArea();
    } else if ((shared.currentState === "scanVisitmateQRCode") || (shared.currentState === "loadVisitorCourse")) {
        viewMyVisitors();
    } else if (shared.currentState === "createVisitor") {
        if (unsavedData === true) {
            showConfirmDialog({
                message: "Any unsaved data will be lost. Proceed?",
                yesLabel: "Proceed",
                noLabel: "Cancel",
                onYes: () => {
                    console.log("⚠️ User confirmed navigation, losing unsaved data");
                    viewVisitmateMenuScreen();
                },
                onNo: () => {
                    console.log("❌ User cancelled navigation to preserve unsaved data");
                }
            });
        } else {
            viewVisitmateMenuScreen();
        }
    } else {
        exitVisitmate();
    }
}

function createInvitationForm() {
	var htmlContent = '';
	var users = allUsersVisitorsDepts.users;
	var depts = allUsersVisitorsDepts.depts;
	var visitors = allUsersVisitorsDepts.visitors;
	var courses = allUsersVisitorsDepts.courses;

	htmlContent += '<div id="visitorInviteArea" style="padding-bottom: 50px;">';
		htmlContent += '<div class="displayTitleClass" style="border-bottom: 1px solid rgba(0,0,0,0.1);">CREATE INVITATION</div>';

		htmlContent += '<div class="entityGrid">';

			htmlContent += '<div class="selectarea" style="grid-template-columns: 40% 60%;">';
				htmlContent += '<div class="formlabel">Registered Visitor</div>';
				htmlContent += '<input id="visitmateVisitorSelect" class="formvalue" list="registeredVisitorList" >';
				htmlContent += '<div class="selectDiv">';
					// htmlContent += '<select id="visitmateVisitorSelect" class="selectBox" name="visitmateVisitor" >';
					htmlContent += '<datalist id="registeredVisitorList" class="selectBox">';
					htmlContent += '<option value="" >Select Visitor</option>';
					$.each(visitors, function(index, visitor) {
						htmlContent += '<option value="'+visitor.id+' - '+visitor.visitorName+'" data-visitorindex='+index+' id="visitmateVisiteeOption_'+visitor.id+'">'+visitor.visitorName+' ('+visitor.visitorCompany+')</option>';
					});
					// htmlContent += '</select>';
					htmlContent += '</datalist>';
				htmlContent += '</div>';

				htmlContent += '<div class="formlabel">Name *</div>';
				htmlContent += '<input type="text" class="formvalue" id="visitorName" style="padding: 10px; margin: 5px 0;" required/>';

				htmlContent += '<div class="formlabel">Email *</div>';
				htmlContent += '<input type="email" class="formvalue" id="visitorEmail" style="padding: 10px; margin: 5px 0;" required/>';

				htmlContent += '<div class="formlabel">Visitor +Count *</div>';
				htmlContent += '<input type="number" class="formvalue" id="visitorCount" style="padding: 10px; margin: 5px 0;" required/>';

				//htmlContent += '<div class="formlabel">Phone</div>';
				//htmlContent += '<input class="formvalue" id="visitorPhone" style="margin: 5px 0;"/>';

				htmlContent += '<div class="formlabel">Visitee *</div>';
				htmlContent += '<input id="visitmateVisiteeSelect" class="formvalue" list="visitmateVisitee" >';
				htmlContent += '<div class="selectDiv">';
					// htmlContent += '<select id="visitmateVisiteeSelect" class="selectBox" name="visitmateVisitee" required>';
					htmlContent += '<datalist id="visitmateVisitee" class="selectBox">';
					htmlContent += '<option value="" >Select User</option>';
					for(var user of users) {
						var name = '';
						if(user.title != null && user.title.length > 0) {name += user.title+'. '}
						name += user.firstName;
						if(user.middleName != null && user.middleName.length > 0) {name += ' '+user.middleName;}
						if(user.lastName != null && user.lastName.length > 0) {name += ' '+user.lastName;}
						htmlContent += '<option value="'+user.userName+' - '+name+'" id="visitmateVisiteeOption_'+user.id+'">'+user.userName+' - '+name+'</option>';
					}
					// htmlContent += '</select>';
					htmlContent += '</datalist>';
				htmlContent += '</div>';

				htmlContent += '<div class="formlabel">Department *</div>';
				htmlContent += '<input id="visiteedepartment" class="formvalue" list="deptlist" >';
				htmlContent += '<div class="selectDiv" >';
				// htmlContent += '<select id="deptlist" class="selectBox">';
					htmlContent += '<datalist id="deptlist" class="selectBox">';
					htmlContent += '<option value="" ></option>';
					for(var dept of depts) {
						htmlContent += '<option value="'+dept+'" >'+dept+'</option>';
					}
					// htmlContent += '</select>';
					htmlContent += '</datalist>';
					// htmlContent += '<input type="text" id="visiteedepartment" class="formvalue" style="position: absolute; top: 5px; left: 5px; border: none; outline: none; padding: 7px; width: calc(100% - 40px);" required>';
				htmlContent += '</div>';

				htmlContent += '<div class="formlabel">Course *</div>';
				htmlContent += '<input id="visitmateCourseSelect" class="formvalue" list="courseList" >';
				htmlContent += '<div class="selectDiv">';
					htmlContent += '<datalist id="courseList" class="selectBox">';
					htmlContent += '<option value="" >Select Course</option>';
					for(var course of courses) {
						htmlContent += '<option value="'+course.id+'" id="visitmateCourseOption_'+course.id+'">'+course.id+' -- '+course.courseName+'</option>';
					}
					htmlContent += '</datalist>';
				htmlContent += '</div>';

				htmlContent += '<div class="formlabel">Visit Start *</div>';
				htmlContent += '<input type="datetime-local" class="formvalue" id="visitStartDate" style="padding: 10px; margin: 5px 0;" required/>';
				htmlContent += '<div class="formlabel">Visit End *</div>';
				htmlContent += '<input type="datetime-local" class="formvalue" id="visitEndDate" style="padding: 10px; margin: 5px 0;" required/>';

			htmlContent += '</div>';

			htmlContent += '<div style="width: 100%; margin-top: 20px; display: flex; justify-content: space-around; border-top: 1px solid rgba(0,0,0,0.1);"> <div class="btnStyle" id="vmInvitationSubmitBtn" onclick="submitInvitation()">SUBMIT</div></div>';


		htmlContent += '</div>';
	htmlContent += '</div>';

	// $("#visitmateFormArea").html(htmlContent);
	// $("#visitmateMenuArea").hide();
	// $("#visitmateFormArea").show();
	// $("#visitmateListArea").hide();
	// $("#visitmateCourseArea").hide();
	$('#modulesDisplayArea').html(htmlContent);
	$('#modulesMenuArea').hide();
	$('#modulesListArea').hide();
	$('#modulesDisplayArea').show();
	fixModuleHeight('modulesModuleHeader, footerSection','modulesDisplayArea');

	$("#visitmateVisitorSelect").on('input', function(){
		let selectedOption = document.querySelector(`#registeredVisitorList option[value="${this.value}"]`);
		if (selectedOption) {
			let visitorIndex = selectedOption.getAttribute('data-visitorindex');
			$("#visitorName").val(visitors[visitorIndex].visitorName);
			$("#visitorEmail").val(visitors[visitorIndex].visitorEmail);
			$("#visitorPhone").val(visitors[visitorIndex].visitorPhone);
		} else {
			$("#visitorName").val("");
			$("#visitorEmail").val("");
			$("#visitorPhone").val("");
		}
	});

	// $("#visitmateVisitorSelect").on('change', function(){
	// 	var visitorIndex = $('option:selected',this).data('visitorindex');
	// 	if(visitorIndex != undefined) {
	// 		$("#visitorName").val(visitors[visitorIndex].visitorName);
	// 		$("#visitorEmail").val(visitors[visitorIndex].visitorEmail);
	// 		$("#visitorPhone").val(visitors[visitorIndex].visitorPhone);
	// 	} else {
	// 		$("#visitorName").val("");
	// 		$("#visitorEmail").val("");
	// 		$("#visitorPhone").val("");
	// 	}
	// });

	// $("#visitorinput").on('input', function(){
	// });
	// $("#deptlist").on('change', function(){
	// 	var dept = $('option:selected',this).val();
	// 	$('#visiteedepartment').val(dept);
	// 	$('#deptlist').val("");
	// });

}

function confirmSubmitInvitation() {
	//$('#loadingmessage').show();
	var registeredVisitor = $("#visitmateVisitorSelect").val();
	let visitorId = registeredVisitor.split(' - ')[0];
	if (visitorId == "") { visitorId = 0; }

	var visitorName = $("#visitorName").val();
	var visitorEmail = $("#visitorEmail").val();
	var visitorCount = $("#visitorCount").val();
	if (visitorCount == "") { visitorCount = 0; }

	var visiteeName = $("#visitmateVisiteeSelect").val();
	var visiteeDept = $("#visiteedepartment").val();
	var visitStartDate = $("#visitStartDate").val();
	var visitEndDate = $("#visitEndDate").val();
	var courseId = $("#visitmateCourseSelect").val();
	if (courseId == "") { courseId = 0; }

	// Validation
	if ((visitorName == "") || (visitorEmail == "") || (visiteeName == "") || (visiteeDept == "") || (visitStartDate == "") || (visitEndDate == "")) {
		//$('#loadingmessage').hide();
		showDialog("All * marked fields are required!");
	} else {
		const data = {
			token: shared.mCustomerDetailsJSON.token,
			visitorId: visitorId,
			visitorName: visitorName,
			visitorEmail: visitorEmail,
			visitorPhone: "",
			visitorCount: visitorCount,
			visiteeName: visiteeName,
			visiteeDept: visiteeDept,
			visitStartDate: visitStartDate,
			visitEndDate: visitEndDate,
			courseId: courseId
		};

		const apiName = "restsubmitinvitation";
		const urlPath = "/visitorinvites/restsubmitinvitation";

		RequestOptions(constructUrl(urlPath), "POST", data)
			.then(request => {
				Http.request(request)
					.then(res => {
						if (isValidResponse(res, apiName)) {
							const responseData = (typeof res.data === "string" ? JSON.parse(res.data) : res.data);

							if (responseData && responseData.error === undefined) {
								showDialog("Success! Invitation has been mailed.", "viewMyVisitors()");
								unsavedData = false;
							} else if (responseData && responseData.error === "invalid_token") {
								getNewToken("submitInvitation()");
							} else {
								showDialog("ERROR: " + (responseData ? responseData.error : "Unknown error"));
							}
						}
						//$('#loadingmessage').hide();
					})
					.catch(err => {
						// Preserve original fail behavior
						apiRequestFailed(err, apiName);
						//$('#loadingmessage').hide();
					});
			})
			.catch(err => {
				// If building request options failed, call apiRequestFailed as well
				apiRequestFailed(err, apiName);
				//$('#loadingmessage').hide();
			});
	}
}



function viewVisitorRecord(visitId, detailOrPass = 'detail') {
  shared.currentState = "viewVisitorRecord";
  // $("#loadingmessage").show();

  const data = { token: shared.mCustomerDetailsJSON.token, visitId: visitId };

  buildRequestOptions(constructUrl("/visitorvisits/restgetvisitor"), "GET", data)
    .then(request => {
      Http.request(request).then(res => {
        if (isValidResponse(res, "restgetvisitor")) {
          if (res.data?.error !== "invalid_token") {
            // Keep visitor visit detail
            visitorVisitDetail = (typeof res.data === "string" ? JSON.parse(res.data) : res.data);
            displayVisitorDetail(visitorVisitDetail, detailOrPass);
          } else {
            getNewToken(`viewVisitorRecord(${visitId})`);
          }
        }
        // $("#loadingmessage").hide();
      }).catch(err => {
        apiRequestFailed(err, "restgetvisitor");
        // $("#loadingmessage").hide();
      });
    })
    .catch(err => {
      console.warn("Request aborted due to missing requestOptions.", err);
      // $("#loadingmessage").hide();
    });
}

function displayVisitorDetail(visitorVisit, detailOrPass) {
	var visitor = visitorVisit.visitorregistration;
	var visit = visitorVisit.visitorvisit;

	var htmlContent = '';
	htmlContent += '<div id="visitorDetail" style="padding-bottom: 50px; position: relative;">';
	if(detailOrPass == 'detail') { 
		htmlContent += '<div class="displayTitleClass" style="border-bottom: 1px solid rgba(0,0,0,0.1);">VISITOR DETAIL</div>';
	} else {
		htmlContent += '<div class="displayTitleClass" style="border-bottom: 1px solid rgba(0,0,0,0.1);">VISITOR PASS</div>';
	}

	htmlContent += '<div class="entityGrid" style="width: 90%; margin: 0 5%;  grid-template-columns: 49% 49%; grid-column-gap: 2%;">';
		if(visitor != null) {
			htmlContent += '<div style="position: relative; width: 100%; border: 1px solid rgba(0,0,0,0.1); object-fit: contain;">';
				htmlContent += '<img class="visitorImage" id="vmpreview_'+visitor.id+'" width="100%" src="img/noimage.jpg" onerror="this.onerror=null;this.src=\'./img/noimage.jpg\';"></img>';
			htmlContent += '</div>';

			htmlContent += '<div id="vmQrCodeWindow" style="width: 100%; max-height: 300px; display: flex; justify-content: center;">';
				htmlContent += '<div style="padding:10px;">';
					htmlContent += '<div id="vmqrcode"></div>';
				htmlContent += '</div>';
			htmlContent += '</div>';
		}
	htmlContent += '</div>';
	
	htmlContent += '<div class="entityGrid" style="width: 90%; margin: 0 5%;  grid-template-columns: 100%;">';
		htmlContent += '<div style="width: 100%; border-bottom: 1px solid rgb(200, 200, 200);">';
			htmlContent += '<div class="selectarea" style="width: 100%; margin: 10px 0;">';
				if(visitor != null) {
					htmlContent += '<div class="formlabel">Name</div>';
					htmlContent += '<div class="formvalue">'+visitor.visitorName+'</div>';

					htmlContent += '<div class="formlabel">Company</div>';
					htmlContent += '<div class="formvalue">'+visitor.visitorCompany+'</div>';

					if(detailOrPass == 'detail') { 
						htmlContent += '<div class="formlabel">Email</div>';
						htmlContent += '<div class="formvalue">'+visitor.visitorEmail+'</div>';

						htmlContent += '<div class="formlabel">Phone</div>';
						htmlContent += '<div class="formvalue">'+visitor.visitorPhone+'</div>';

						htmlContent += '<div class="formlabel">Address</div>';
						htmlContent += '<div class="formvalue">';
						htmlContent += '<p>'+visitor.address1+'</p>';
						htmlContent += '<p>'+visitor.address2+'</p><p>'+visitor.city+', '+visitor.state+', '+visitor.country+'</p>';
						htmlContent += '<p>'+visitor.zipCode+'</p>';
						htmlContent += '</div>';
					}

					htmlContent += '<div class="formlabel">Blood Group</div>';
					htmlContent += '<div class="formvalue">'+visitor.visitorBloodGroup+'</div>';

					if(detailOrPass == 'detail') { 
						let Str = visit.approved==true?'Yes':'No';
						htmlContent += '<div class="formlabel">Approved</div>';
						htmlContent += '<div class="formvalue">'+Str+'</div>';

						Str = visit.courseComplete==true?'Yes':'No';
						htmlContent += '<div class="formlabel">Course Complete</div>';
						htmlContent += '<div class="formvalue">'+Str+'</div>';

						Str = visit.idPrinted==true?'Yes':'No';
						htmlContent += '<div class="formlabel">Pass Printed</div>';
						htmlContent += '<div class="formvalue">'+Str+'</div>';
					}
				} else {
					htmlContent += '<div class="formlabel">Name</div>';
					htmlContent += '<div class="formvalue">'+visit.visitorName+'</div>';

					htmlContent += '<div class="formlabel">Email</div>';
					htmlContent += '<div class="formvalue">'+visit.visitorEmail+'</div>';
				}


				let startDateStr = new Date(visit.visitStartDate);
				let endDateStr = new Date(visit.visitEndDate);
				const startDate = startDateStr.toLocaleString('en-US', {year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true});
				const endDate = endDateStr.toLocaleString('en-US', {year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true});

				if(detailOrPass == 'detail') { 
					htmlContent += '<div class="formlabel">Visiting Dept</div>';
					htmlContent += '<div class="formvalue">'+visit.visiteeDepartment+'</div>';

					htmlContent += '<div class="formlabel">Visitee</div>';
					htmlContent += '<div class="formvalue">'+visit.visiteeName+'</div>';


					// var startDateStr = new Date(visit.visitStartDate).toString().substring(0,21);
					htmlContent += '<div class="formlabel">Visit Start</div>';
					htmlContent += '<div class="formvalue">'+startDate+'</div>';
		
					// var endDateStr = new Date(visit.visitEndDate).toString().substring(0,21);
					htmlContent += '<div class="formlabel">Visit End</div>';
					htmlContent += '<div class="formvalue">'+endDate+'</div>';
		
				} else {
					htmlContent += '<div class="formlabel">Visitee</div>';
					htmlContent += '<div class="formvalue">'+visit.visiteeName+' ('+visit.visiteeDepartment+')</div>';

					// var startDateStr = new Date(visit.visitStartDate).toString().substring(3,21);
					// var endDateStr = new Date(visit.visitEndDate).toString().substring(3,21);
					htmlContent += '<div class="formlabel">Date</div>';
					htmlContent += '<div class="formvalue">'+startDate+' - '+endDate+'</div>';
				}

				if(detailOrPass == 'detail') { 
					htmlContent += '<div class="formlabel">Visitee Email</div>';
					htmlContent += '<div class="formvalue">'+visit.visiteeEmail+'</div>';

					htmlContent += '<div class="formlabel">Visitee Phone</div>';
					htmlContent += '<div class="formvalue">'+visit.visiteePhone+'</div>';

					htmlContent += '<div class="formlabel">Visit Status</div>';
					htmlContent += '<div class="formvalue">'+visit.visitStatus+'</div>';
				}

			htmlContent += '</div>';
		htmlContent += '</div>';

		if(detailOrPass == 'pass') {
			htmlContent += '<div style="width: 100%;">';
				htmlContent += '<div class="displayTitleClass" style="font-size: 1.3em;">MATERIALS</div>';
				htmlContent += '<div id="materialform" style="width: 100%; margin: 10px 0;">';
				htmlContent += '</div>';
			htmlContent += '</div>';
		}

		htmlContent += '</div>';


	if(detailOrPass == 'detail') { 
		htmlContent += '<div style="width: 100%; margin-top: 5px; display: flex; justify-content: space-around; flex-wrap: wrap;">';
			htmlContent += getMyVisitMateTask(visitor, visit);
		htmlContent += '</div>';
		htmlContent += '<div style="padding: 20px 0;"></div>';
	}
	htmlContent += '</div>';

	htmlContent += '<div id="contentListArea" style="width: 100%; height: 100%; position: absolute; top: 0; padding: 10px; background-color: rgba(0,0,0,0.5); display: none;" onclick="exitVisitmateCourseStateArea()"><div id="contentListBox" style="width: 100%; height: 100%; background-color: white;" ></div></div>';
	

	// $("#moduleDisplayArea").html(htmlContent);
	// $("#visitmateMenuArea").hide();
	// $("#visitmateFormArea").show();
	// $("#visitmateListArea").hide();
	// $("#visitmateCourseArea").hide();

	$('#modulesDisplayArea').html(htmlContent);
	$('#modulesMenuArea').hide();
	$('#modulesListArea').hide();
	$('#modulesDisplayArea').show();
	fixModuleHeight('modulesModuleHeader, footerSection','modulesDisplayArea');

	if(detailOrPass == 'pass') {
		loadVmMaterial();
	}

	if((visitor != null) && (visitor.visitorImage != null) && (visitor.visitorImage.length > 0)) {
		objectKey = visitor.visitorImage;
		if(objectKey.startsWith(s3PrivateUrl)) {
			objectKey = objectKey.replace(s3PrivateUrl, "");
		
			getSignedUrl(objectKey, 10).then(url => {
				if(url.startsWith("https://")) {
					var imageElem = document.getElementById('vmpreview_'+visitor.id);
					imageElem.src = url;
					//$(imageElem).on('click', function() {
					//	viewSmFullScreenImage(this);
					//});
				}
			});
		} else {
			var imageElem = document.getElementById('vmpreview_'+visitor.id);
			imageElem.src = visitor.visitorImage;
		}
	}

	vmqrcode  = new QRCode(document.getElementById("vmqrcode"), {
        width: 150,
        height: 150,
        colorDark: "#000000",
        colorLight: "#ffffff",
        correctLevel: QRCode.CorrectLevel.M
    });

	viewVmQRCode(visitorVisit);
}

function loadVmMaterial() {
	let materialListStr = visitorVisitDetail.visitorvisit.visitorMaterial;
	if(materialListStr != null && materialListStr.length > 0 && materialListStr.startsWith('[')) {
		let materialList = JSON.parse(materialListStr);
		if(materialList.length >= 3) {
			for(index in materialList) {
				let material = materialList[index]
				if(material.name != undefined) {
					addMaterial(material);
				}
			}
		}
	}	
}

function addMaterial(value) {
	let vmMaterialCount = parseInt(document.getElementsByClassName("vmMaterial").length);
	
	var elemDiv = document.createElement('div');
	elemDiv.id = "vmMaterial"+vmMaterialCount;
	elemDiv.classList.add("vmMaterial");
	elemDiv.style.cssText = 'display: flex; width: 100%;';

	var elemInput1 = document.createElement('input');
	elemInput1.id = "vmMaterial"+vmMaterialCount+"_name";
	elemInput1.style.cssText = 'width: 30%; font-weight: bold; border: 1px solid rgb(200, 200, 200); padding: 5px;';
	elemInput1.type = "text";
	elemInput1.placeholder = "Name";
	elemInput1.maxLength = 50;
	if(value != null && value.name != undefined) {
		elemInput1.value = value.name;
	} 

	var elemInput2 = document.createElement('input');
	elemInput2.id = "vmMaterial"+vmMaterialCount+"_qty";
	elemInput2.style.cssText = 'width: 15%; border: 1px solid rgb(200, 200, 200); padding: 5px;';
	elemInput2.type = "number";
	elemInput2.placeholder = "Qty";
	if(value != null && value.qty != undefined) {
		elemInput2.value = value.qty;
	} 

	var elemInput3 = document.createElement('input');
	elemInput3.id = "vmMaterial"+vmMaterialCount+"_detail";
	elemInput3.style.cssText = 'width: 55%; border: 1px solid rgb(200, 200, 200); padding: 5px;';
	elemInput3.type = "text";
	elemInput3.placeholder = "Detail";
	elemInput3.maxLength = 250;
	if(value != null && value.detail != undefined) {
		elemInput3.value = value.detail;
	} 
	
	elemDiv.appendChild(elemInput1);
	elemDiv.appendChild(elemInput2);
	elemDiv.appendChild(elemInput3);
	document.getElementById('materialform').appendChild(elemDiv);
}

function getMyVisitMateTask(visitor, visit) {
	var htmlContent = '';

	if(visitor != null) {
		var time = new Date().getTime();
		if(visit.visitStartDate > (time+dayInMs)) {		// Allow cancellation if the visit is more than 24 hours away
			htmlContent += '<div class="btnStyle" style="background-color:var(--primary-red);" onclick="setVisitStatus('+visit.id+', \'CANCELLED\')">Cancel Visit</div>';
		}
		if(visit.courseComplete == true) {
			visit.visitStatus = "TRAINED";
			htmlContent += '<div class="btnStyle" style="background-color:var(--secondary-green);" onclick="getCourseState('+visit.courseId+', '+visit.visitorId+')">Training Status</div>';
			if(visit.visitStatus != "CANCELLED" && visit.visitStatus != "COMPLETED") {
				htmlContent += '<div class="btnStyle" style="background-color:var(--secondary-cyan);" onclick="viewVisitorRecord('+visit.id+', \'pass\')">Visitor Pass</div>';
			}
		}
		if(visit.idPrinted == true) {
			htmlContent += '<div class="btnStyle" style="background-color:var(--secondary-orange);" onclick="setVisitStatus('+visit.id+', \'COMPLETED\')">Complete Visit</div>';
		}
	} else {
		htmlContent += '<div class="btnStyle" style="background-color:var(--primary-red);" onclick="setVisitStatus('+visit.id+', \'CANCELLED\')">Cancel Visit</div>';
		htmlContent += '<div class="btnStyle" style="background-color:var(--primary-blue);" onclick="setVisitStatus('+visit.id+', \'REMINDED\')">Send Reminder</div>';
	}
	return htmlContent;
}

function getCourseState(courseId, visitorId) {
	openCourse(courseId, 'visitee', visitorId);
}


function setVisitStatus(visitId, visitStatus) {
  const data = { 
    token: shared.mCustomerDetailsJSON.token, 
    visitId: visitId, 
    visitStatus: visitStatus 
  };

  RequestOptions(constructUrl("/visitorvisits/restsubmitvisitstatus"), "POST", data)
    .then(request => {
      Http.request(request).then(res => {
        if (isValidResponse(res, "restsubmitvisitstatus")) {
          const responseData = (typeof res.data === "string" ? JSON.parse(res.data) : res.data);

          if (responseData.error !== "invalid_token") {
            showDialog("Visit updated successfully.", "backVisitmateHandle()");
            // $(".visitmateCheckbox").prop('checked', false);
            // $("#loadingmessage").hide();
          } else {
            // Token expired → regenerate token and retry
            // $("#loadingmessage").hide();
            getNewToken(`setVisitStatus(${visitId}, '${visitStatus}')`);
          }
        }
        // $("#loadingmessage").hide();
      }).catch(err => {
        apiRequestFailed(err, "restsubmitvisitstatus");
        // $("#loadingmessage").hide();
      });
    })
    .catch(err => {
      console.warn("Request aborted due to missing requestOptions.", err);
      // $("#loadingmessage").hide();
    });
}


function submitVisitorCourseComplete() {
  const data = { 
    token: mVisitDetailsJSON.token, 
    visitId: mVisitDetailsJSON.visitorVisitId, 
    visitStatus: "TRAINED" 
  };

  RequestOptions(constructUrl("/visitorvisits/restsubmitvisitstatus"), "POST", data)
    .then(request => {
      Http.request(request).then(res => {
        if (isValidResponse(res, "restsubmitvisitstatus")) {
          const responseData = (typeof res.data === "string" ? JSON.parse(res.data) : res.data);

          if (responseData.error !== "invalid_token") {
            // Success → reload visitor record
            viewVisitorRecord(mVisitDetailsJSON.visitorVisitId);
          } else {
            // Token expired → regenerate token and retry
            // $("#loadingmessage").hide();
            getNewToken("submitVisitorCourseComplete()");
          }
        }
        // $("#loadingmessage").hide();
      }).catch(err => {
        apiRequestFailed(err, "restsubmitvisitstatus");
        // $("#loadingmessage").hide();
      });
    })
    .catch(err => {
      console.warn("Request aborted due to missing requestOptions.", err);
      // $("#loadingmessage").hide();
    });
}

function visitorSelfLogin() {
	var htmlContent = '';
	htmlContent+= '<div class="displayTitleClass" style="border-bottom: 1px solid rgba(0,0,0,0.1);">VISITOR LOGIN</div>';

	htmlContent += '<div style="width: 90%; margin: 20px 5%;">';
		htmlContent += '<input type="text" class="formvalue" id="visitKey" placeholder="Visit Token" style="margin: 10px 0; padding: 10px; text-align: center;" required />';
		htmlContent += '<input type="text" class="formvalue" id="visitorCodeId" placeholder="Visitor Code" style="margin: 10px 0; padding: 10px; text-align: center;" required/>';
		htmlContent += '<input type="password" class="formvalue" id="visitorPassword" placeholder="Password/Pincode" style="margin: 10px 0; padding: 10px; text-align: center;" required/>';
	htmlContent += '</div>';

	htmlContent += '<div style="width: 100%; margin-top: 20px; display: flex; justify-content: space-around; border-top: 1px solid rgba(0,0,0,0.1);"> <div class="btnStyle" id="vmLoginSubmitBtn" onclick="vmSubmitLogin()">SUBMIT</div></div>';

	// $("#visitmateCourseArea").html(htmlContent);
	// $("#visitmateMenuArea").hide();
	// $("#visitmateFormArea").hide();
	// $("#visitmateListArea").hide();
	// $("#visitmateCourseArea").show();

}

function visitorSelfRegistration() {
	// Build form for self registration
	var htmlContent = '';
	htmlContent+= '<div class="displayTitleClass" style="border-bottom: 1px solid rgba(0,0,0,0.1);">VISITOR REGISTRATION</div>';

	htmlContent += '<div style="width: 90%; margin: 20px 5%;">';
		htmlContent += '<label for="vmregvisitkey" style="width: 100%; text-align: center; padding: 5px;">Token</label>';
		htmlContent += '<input type="text" style="width: 100%; text-align: center; padding: 5px;" id="vmregvisitkey" placeholder="Visit Token" pattern=".{4,20}" maxlength="20" title="At least 4 characters." required>';
		htmlContent += '<div style="width: 100%; margin-top: 20px; display: flex; justify-content: space-around; border-top: 1px solid rgba(0,0,0,0.1);"> <div class="btnStyle" id="vmTokenSubmitBtn" onclick="vmSubmitToken()">SUBMIT</div></div>';
	htmlContent += '</div>';

	// $("#visitmateCourseArea").html(htmlContent);
	// $("#visitmateMenuArea").hide();
	// $("#visitmateFormArea").hide();
	// $("#visitmateListArea").hide();
	// $("#visitmateCourseArea").show();
}

function visitorSelfRegistrationDetailForm() {
	// Build form for self registration
	unsavedData = true;
	var htmlContent = '';
	htmlContent+= '<div class="displayTitleClass" style="border-bottom: 1px solid rgba(0,0,0,0.1);">VISITOR REGISTRATION</div>';

	htmlContent += '<div style="width: 90%; margin: 20px 5%;">';
		htmlContent += '<div style="width: 100%; text-align: center; padding: 5px;">Credentials</div>';
		
		htmlContent += '<input type="text" style="width: 100%; text-align: center; padding: 5px; background-color: rgba(0,0,0,0.1); border: none;" id="vmregvisitkey" value="'+mVisitorinvite.visitKey+'" readonly>';

		htmlContent += '<div style="display: flex;">';
			htmlContent += '<input type="password" class="form-control mb-1 ml-4 col-6 rounded-pill" id="vmregpassword" placeholder="Password/Pincode" pattern=".{4,20}" maxlength="20" title="At least 4 characters." required>';
			htmlContent += '<input type="password" class="form-control mb-1 ml-4 col-6 rounded-pill" id="vmregconfirmpassword" placeholder="Confirm Password/Pincode" pattern=".{4,20}" maxlength="20" title="At least 4 characters." required>';
		htmlContent += '</div>';
		htmlContent += '<div id="passworderror" class="errormsg mx-4 mb-1"></div>';	

		htmlContent += '<div class="mx-4 mt-4 mb-2">Visitor Details</div>';
											
		htmlContent += '<input type="text" style="width: 100%; text-align: left; padding: 5px;" id="vmregvisitorname" placeholder="Visitor Name" pattern=".{4,100}" maxlength="100" title="At least 4 characters.">';
		htmlContent += '<input type="text" style="width: 100%; text-align: left; padding: 5px;" id="vmregvisitorbloodgroup" placeholder="Blood Group" maxlength="5">';
		htmlContent += '<input type="text" style="width: 100%; text-align: left; padding: 5px;" id="vmregvisitorcompany" placeholder="Company Name" pattern=".{4,127}" maxlength="100" title="At least 4 characters.">';

		htmlContent += '<div class="mx-4 mt-4 mb-2">Contact Detail</div>';

		htmlContent += '<input type="text" style="width: 100%; text-align: left; padding: 5px;" id="vmregvisitorEmail" placeholder="Email" pattern="[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$" title="Must be a valid Email ID (charcterts@characters.domain)" maxlength="50">';
		htmlContent += '<input type="tel" style="width: 100%; text-align: left; padding: 5px;" id="vmregvisitorphone" placeholder="Phone" pattern=".{6,15}" maxlength="15" required>';
		htmlContent += '<input type="text" style="width: 100%; text-align: left; padding: 5px;" id="vmregaddress1" placeholder="Address1" maxlength="250">';
		htmlContent += '<input type="text" style="width: 100%; text-align: left; padding: 5px;" id="vmregaddress2" placeholder="Address2" maxlength="250">';
		
		htmlContent += '<div style="display: flex;">';
			htmlContent += '<input type="text" style="width: 50%; text-align: left; padding: 5px;" id="vmregcity" placeholder="City" maxlength="50">';
			htmlContent += '<input type="text" style="width: 50%; text-align: left; padding: 5px;" id="vmregstate" placeholder="State" maxlength="50">';
		htmlContent += '</div>';
		htmlContent += '<div style="display: flex;">';
			htmlContent += '<input type="text" style="width: 50%; text-align: left; padding: 5px;" id="vmregcountry" placeholder="Country" maxlength="50">';
			htmlContent += '<input type="text" style="width: 50%; text-align: left; padding: 5px;" id="vmregzipcode" placeholder="PIN Code" maxlength="50">';
		htmlContent += '</div>';

		htmlContent += '<div style="width: 100%; margin-top: 20px; display: flex; justify-content: space-around; border-top: 1px solid rgba(0,0,0,0.1);"> <div class="btnStyle" id="vmRegistrationSubmitBtn" onclick="vmSubmitRegistration()">SUBMIT</div></div>';
	htmlContent += '</div>';

	// $("#visitmateCourseArea").html(htmlContent);
	// $("#visitmateMenuArea").hide();
	// $("#visitmateFormArea").hide();
	// $("#visitmateListArea").hide();
	// $("#visitmateCourseArea").show();
}


function visitorSelfRegistrationImageForm() {
	// Build form for self registration
	unsavedData = true;
	var htmlContent = '';
	htmlContent+= '<div class="displayTitleClass" style="border-bottom: 1px solid rgba(0,0,0,0.1);">VISITOR REGISTRATION</div>';

	htmlContent += '<div style="width: 90%; margin: 20px 5%;">';
		htmlContent += '<div style="width: 100%; text-align: center; padding: 5px;">Visitor Image</div>';
		
		htmlContent += '<div style="position: relative; width: 100%; min-height: 100px; text-align: center;">';
			htmlContent += '<input id="visitorimage" style="display:none;"  />';
			htmlContent += '<img id="vmpreview_visitorimage" style="max-width:100%;" src="img/noimage.jpg" onerror="this.onerror=null;this.src=\'./img/noimage.jpg\';" />';
			htmlContent += '<div id="moduleImageButtonLayer" style="display: flex; align-items: center; justify-content: space-evenly; width: 100%; height: 100%; position: absolute; top: 0;">';
				let fileName = "vm_"+mVisitorregistration.id+"_im.jpg";
				var imageQuality = 60;
				if(shared.systemConfiguration.systemInfo.assetMateImageQuality != undefined) {
					imageQuality = parseInt(shared.systemConfiguration.systemInfo.assetMateImageQuality);
				}
				var imageResolution = 600;
				if(shared.systemConfiguration.systemInfo.assetMateImagePixel != undefined) {
					imageResolution = parseInt(shared.systemConfiguration.systemInfo.assetMateImagePixel);
				}
				
				//const fileName = 'am_'+(assetmateAssetInfo.assetmateasset.id+'_'+assetmateAssetInfo.assetmateasset.codeId+'_'+td.id+'_'+assetmateAssetInfo.assetmatedatainfoList.length).replace(/[-:.]/g,'')+".jpg";
				// htmlContent += '<div class="moduleImageButton" id="cameraButton" onclick="captureImage(\'vmpreview_visitorimage\', '+Camera.PictureSourceType.CAMERA+', \'visitmate_images/\', \''+fileName+'\', '+imageQuality+', '+imageResolution+')"><span><i class="fas fa-camera"></i></span></div>';
				// htmlContent += '<div class="moduleImageButton" id="galleryButton" onclick="captureImage(\'vmpreview_visitorimage\', '+Camera.PictureSourceType.PHOTOLIBRARY+', \'visitmate_images/\', \''+fileName+'\', '+imageQuality+', '+imageResolution+')"><span><i class="fas fa-photo-video"></i></span></div>';
				htmlContent += '<div class="moduleImageButton" id="cameraButton" onclick="captureImage(\'vmpreview_visitorimage\', '+navigator.camera.PictureSourceType.CAMERA+', \'visitmate_images/\', \''+fileName+'\', '+imageQuality+', '+imageResolution+')"><span><i class="fas fa-camera"></i></span></div>';
				htmlContent += '<div class="moduleImageButton" id="galleryButton" onclick="captureImage(\'vmpreview_visitorimage\', '+navigator.camera.PictureSourceType.PHOTOLIBRARY+', \'visitmate_images/\', \''+fileName+'\', '+imageQuality+', '+imageResolution+')"><span><i class="fas fa-photo-video"></i></span></div>';
			htmlContent += '</div>';
		htmlContent += '</div>';
		
		htmlContent += '<div style="width: 100%; text-align: center; padding: 5px;">Attachments</div>';
		htmlContent += '<input type="hidden" id="attachmentcount" value=0 />';

		htmlContent += '<div style="position: relative; width: 100%; min-height: 100px; text-align: center;">';
			htmlContent += '<input id="visitorattimage" style="display:none;" />';
			htmlContent += '<img id="vmpreview_visitorattimage" style="max-width:100%;" src="img/noimage.jpg" onerror="this.onerror=null;this.src=\'./img/noimage.jpg\';" />';
			htmlContent += '<div id="moduleImageA1ButtonLayer" style="display: flex; align-items: center; justify-content: space-evenly; width: 100%; height: 100%; position: absolute; top: 0;">';
				let fileA1Name = "vm_"+mVisitorregistration.id+"_att";
				var imageQuality = 60;
				if(shared.systemConfiguration.systemInfo.assetMateImageQuality != undefined) {
					imageQuality = parseInt(shared.systemConfiguration.systemInfo.assetMateImageQuality);
				}
				var imageResolution = 600;
				if(shared.systemConfiguration.systemInfo.assetMateImagePixel != undefined) {
					imageResolution = parseInt(shared.systemConfiguration.systemInfo.assetMateImagePixel);
				}
				//const fileName = 'am_'+(assetmateAssetInfo.assetmateasset.id+'_'+assetmateAssetInfo.assetmateasset.codeId+'_'+td.id+'_'+assetmateAssetInfo.assetmatedatainfoList.length).replace(/[-:.]/g,'')+".jpg";
				htmlContent += '<div class="moduleImageButton" id="cameraA1Button" onclick="captureVmImage(\'vmpreview_visitorattimage\', '+Camera.PictureSourceType.CAMERA+', \'visitmate_images/\', \''+fileA1Name+'\', '+imageQuality+', '+imageResolution+')"><span><i class="fas fa-camera"></i></span></div>';
				htmlContent += '<div class="moduleImageButton" id="galleryA1Button" onclick="captureVmImage(\'vmpreview_visitorattimage\', '+Camera.PictureSourceType.PHOTOLIBRARY+', \'visitmate_images/\', \''+fileA1Name+'\', '+imageQuality+', '+imageResolution+')"><span><i class="fas fa-photo-video"></i></span></div>';
			htmlContent += '</div>';
		htmlContent += '</div>';
		
		htmlContent += '<input id="visitorattachmenturls" style="display:none;" />';
		
		htmlContent += '<div id="visitorattachmentlist" style="width: 100%; text-align: center;"></div>';

		htmlContent += '<div style="width: 100%; margin-top: 20px; display: flex; justify-content: space-around; border-top: 1px solid rgba(0,0,0,0.1);"> <div class="btnStyle" id="vmRegistrationA1SubmitBtn" onclick="vmSubmitRegistrationImages()">SUBMIT</div></div>';
	htmlContent += '</div>';

	// $("#visitmateCourseArea").html(htmlContent);
	// $("#visitmateMenuArea").hide();
	// $("#visitmateFormArea").hide();
	// $("#visitmateListArea").hide();
	// $("#visitmateCourseArea").show();
}

function loadAttachmentList(url) {

	let fileName = url.split('/').pop(0);

	var htmlContent = $('#visitorattachmentlist').html();
	htmlContent += '<div>'+fileName+'</div>';
	 $('#visitorattachmentlist').html(htmlContent);
	
	let attStr = $("#visitorattachmenturls").val();
	if(attStr.length > 0) {
		attStr += ',';
	}
	attStr += url;
	$("#visitorattachmenturls").val(attStr);

	let attachments = attStr.split(',');
	$('#attachmentcount').val(attachments.length);
}


function vmSubmitToken() {
  let visitKey = $('#vmregvisitkey').val();
  const data = { visitKey: visitKey };

  RequestOptions(constructUrl("/visitorinvites/restsubmitvisitkey"), "POST", data)
    .then(request => {
      Http.request(request).then(res => {
        if (isValidResponse(res, "restsubmitvisitkey")) {
          const responseData = (typeof res.data === "string" ? JSON.parse(res.data) : res.data);

          if (responseData.error === undefined) {
            // ✅ No error
            mVisitorinvite = responseData;
            console.log("Token success! " + mVisitorinvite.visitKey);
            visitorSelfRegistrationDetailForm();
          } else {
            // ⚠️ Handle known errors
            if (responseData.error === "max_count") {
              showDialog("Reached maximum visitor count for this token!");
            } else if (responseData.error === "invalid_token") {
              getNewToken("vmSubmitToken()");
            } else {
              showDialog(responseData.error);
            }
          }
        } else {
          showDialog("Invalid response!");
        }
      }).catch(err => {
        apiRequestFailed(err, "restsubmitvisitkey");
        // $("#loadingmessage").hide();
      });
    })
    .catch(err => {
      console.warn("Request aborted due to missing requestOptions.", err);
      // $("#loadingmessage").hide();
    });
}


function vmSubmitRegistration() {
  // Step 1: Get blank registration
  const data = { visitKey: mVisitorinvite.visitKey };

  buildRequestOptions(constructUrl("/visitorregistrations/getblankvisitorregistration"), "GET", data)
    .then(request => {
      Http.request(request).then(res => {
        if (isValidResponse(res, "getblankvisitorregistration")) {
          let theVisitorregistration = (typeof res.data === "string" ? JSON.parse(res.data) : res.data);

          // Populate registration data
          theVisitorregistration.visitorName = $('#vmregvisitorname').val();
          theVisitorregistration.visitorCompany = $('#vmregvisitorcompany').val();
          theVisitorregistration.password = $('#vmregpassword').val();
          theVisitorregistration.visitorEmail = $('#vmregvisitorEmail').val();
          theVisitorregistration.visitorPhone = $('#vmregvisitorphone').val();
          theVisitorregistration.visitorBloodGroup = $('#vmregvisitorbloodgroup').val();
          theVisitorregistration.address1 = $('#vmregaddress1').val();
          theVisitorregistration.address2 = $('#vmregaddress2').val();
          theVisitorregistration.city = $('#vmregcity').val();
          theVisitorregistration.state = $('#vmregstate').val();
          theVisitorregistration.country = $('#vmregcountry').val();
          theVisitorregistration.zipCode = $('#vmregzipcode').val();

          // Step 2: Submit registration
          const saveData = { 
            visitKey: mVisitorinvite.visitKey, 
            visitorregistration: JSON.stringify(theVisitorregistration) 
          };

          RequestOptions(constructUrl("/visitorinvites/restsavevisitorregistration"), "POST", saveData)
            .then(saveRequest => {
              Http.request(saveRequest).then(saveRes => {
                if (isValidResponse(saveRes, "restsavevisitorregistration")) {
                  const saveResponse = (typeof saveRes.data === "string" ? JSON.parse(saveRes.data) : saveRes.data);

                  if (saveResponse.error === undefined) {
                    mVisitorregistration = saveResponse;
                    console.log("Registration success! visitorId: " + mVisitorregistration.id);
                    visitorSelfRegistrationImageForm();
                  } else {
                    if (saveResponse.error === "invalid_token") {
                      getNewToken("vmSubmitRegistration()");
                    } else {
                      showDialog(saveResponse.error);
                    }
                  }
                } else {
                  showDialog("Error! Could not save visitorregistration.");
                }
              }).catch(err => {
                apiRequestFailed(err, "restsavevisitorregistration");
                // $("#loadingmessage").hide();
              });
            })
            .catch(err => {
              console.warn("Request aborted due to missing requestOptions (save).", err);
              // $("#loadingmessage").hide();
            });

        } else {
          showDialog("Error! Could not receive blank visitorregistration.");
        }
        // $("#loadingmessage").hide();
      }).catch(err => {
        apiRequestFailed(err, "getblankvisitorregistration");
        // $("#loadingmessage").hide();
      });
    })
    .catch(err => {
      console.warn("Request aborted due to missing requestOptions (blank).", err);
      // $("#loadingmessage").hide();
    });
}


function vmSubmitRegistrationImages() {
  mVisitorregistration.visitorImage = $('#visitorimage').val();
  mVisitorregistration.attachments = $('#visitorattachmenturls').val();

  // Submit registration with images
  const data = { 
    visitKey: mVisitorinvite.visitKey, 
    visitorregistration: JSON.stringify(mVisitorregistration) 
  };

  RequestOptions(constructUrl("/visitorinvites/restsavevisitorimage"), "POST", data)
    .then(request => {
      Http.request(request).then(res => {
        if (isValidResponse(res, "restsavevisitorimage")) {
          const responseData = (typeof res.data === "string" ? JSON.parse(res.data) : res.data);

          if (responseData.error === "none") {
            mVisitDetailsJSON = responseData;
            console.log("VisitorVisit enrollment success! visitorvisitId: " + mVisitDetailsJSON.visitorVisitId);
            loadVisitorCourse(mVisitDetailsJSON.courseId, "visitor");
          } else {
            showDialog(responseData.error);
          }
        } else {
          showDialog("Error! Could not save visitorregistration.");
        }
      }).catch(err => {
        apiRequestFailed(err, "restsavevisitorimage");
        // $("#loadingmessage").hide();
      });
    })
    .catch(err => {
      console.warn("Request aborted due to missing requestOptions.", err);
      // $("#loadingmessage").hide();
    });
}

function viewVisitorLogin(visitmateQRCode) {

	var htmlContent = '';
	htmlContent+= '<div class="displayTitleClass" style="border-bottom: 1px solid rgba(0,0,0,0.1);">VISITOR LOGIN</div>';

	htmlContent += '<div style="width: 90%; margin: 20px 5%;">';
		htmlContent += '<input type="text" class="formvalue" id="visitKey" value="'+visitmateQRCode[VISITKEY_INDEX]+'" style="margin: 10px 0; padding: 10px; text-align: center; background-color: rgba(0,0,0,0.1); border: none;" readonly />';
		htmlContent += '<input type="text" class="formvalue" id="visitorCodeId" value="'+visitmateQRCode[CODEID_INDEX]+'" style="margin: 10px 0; padding: 10px; text-align: center; background-color: rgba(0,0,0,0.1); border: none;" readonly/>';
		htmlContent += '<input type="password" class="formvalue" id="visitorPassword" style="margin: 10px 0; padding: 10px;" required/>';
	htmlContent += '</div>';

	htmlContent += '<div style="width: 100%; margin-top: 20px; display: flex; justify-content: space-around; border-top: 1px solid rgba(0,0,0,0.1);"> <div class="btnStyle" id="vmLoginSubmitBtn" onclick="vmSubmitLogin()">SUBMIT</div></div>';

	// $("#visitmateCourseArea").html(htmlContent);
	// $("#visitmateMenuArea").hide();
	// $("#visitmateFormArea").hide();
	// $("#visitmateListArea").hide();
	// $("#visitmateCourseArea").show();
}


function vmSubmitLogin() {
  // $("#loadingmessage").show();

  let visitKey = $("#visitKey").val();
  let visitorCodeId = $("#visitorCodeId").val();
  let pass = $("#visitorPassword").val();

  visitKey = visitKey.toLowerCase();
  visitorCodeId = visitorCodeId.toUpperCase();

  const data = { id: visitorCodeId, pass: pass, visitKey: visitKey };

  RequestOptions(constructUrl("/visitorinvites/restvmlogin"), "POST", data)
    .then(request => {
      Http.request(request).then(res => {
        if (isValidResponse(res, "restvmlogin")) {
          const responseData = (typeof res.data === "string" ? JSON.parse(res.data) : res.data);

          if (responseData.error === "none") {
            // ✅ Login success
            mVisitDetailsJSON = responseData;
            console.log("Login success! ", mVisitDetailsJSON);

            if (mVisitDetailsJSON.courseComplete === true) {
              viewVisitorRecord(mVisitDetailsJSON.visitorVisitId);
            } else {
              loadVisitorCourse(mVisitDetailsJSON.courseId, "visitor");
            }
          } else if (responseData.error === "no_image") {
            mVisitorregistration = responseData.visitorregistration;
            visitorSelfRegistrationImageForm();
          } else {
            // ⚠️ Handle specific errors
            if (responseData.error === "invalid_password") {
              showDialog("Wrong Password!");
            } else if (responseData.error === "invalid_visitor") {
              // 🔄 Updated to use new showConfirmDialog
              showConfirmDialog({
                message: "You are not registered! Register now?",
                yesLabel: "Register",
                noLabel: "Cancel",
                onYes: () => {
                  visitorSelfRegistration();
                },
                onNo: () => {
                  console.log("❌ User cancelled visitor self-registration");
                }
              });
            } else if (responseData.error === "max_count") {
              showDialog("Reached maximum visitor count for this token!");
            } else {
              showDialog(responseData.error);
            }
          }
        } else {
          showDialog("Invalid response!");
        }
        // $("#loadingmessage").hide();
      }).catch(err => {
        apiRequestFailed(err, "restvmlogin");
        // $("#loadingmessage").hide();
      });
    })
    .catch(err => {
      console.warn("Request aborted due to missing requestOptions.", err);
      // $("#loadingmessage").hide();
    });
}

function loadVisitorCourse() {
	shared.currentState = "loadVisitorCourse";
	$("#loadingSpinner").show();

	var htmlContent = '';
	htmlContent+= '<div id="courseTitleArea" ></div>';

	htmlContent+= '<div id="courseMenu" class="coursemenu">';
		htmlContent+= '<div id="aboutCourseButton" onclick="toggleAboutCourse()"><span><i id="course_about_carrot" class="fas fa-chevron-circle-right carrot"></i></span> About this course</div>';
		htmlContent+= '<div id="courseContentButton" onclick="toggleCourseContentMenu()"><span><i id="course_content_carrot" class="fas fa-chevron-circle-right carrot"></i></span> Contents</div>';
	htmlContent+= '</div>';

	htmlContent+= '<div id="courseArea" class="noborder">';
		htmlContent+= '<div id="courseDescriptionBox" class="contentDescriptionClass"></div>';

		htmlContent+= '<div id="contentOverview" class="coursemenu">';
			htmlContent+= '<div id="contentOverviewButton" onclick="toggleContentOverview()"><span><i id="content_overview_carrot" class="fas fa-chevron-circle-right carrot"></i></span> Overview</div>';
		htmlContent+= '</div>';
		htmlContent+= '<div id="contentDescriptopnArea">';
			htmlContent+= '<div id="contentDescriptionBox" class="contentDescriptionClass"></div>';
		htmlContent+= '</div>';

		htmlContent+= '<div class="noborder">';
			htmlContent+= '<div id="visitmateContentDisplayArea" class="noborder aligntop">';
				htmlContent+= '<div id="assessmentViewArea">';
					htmlContent+= '<div id="assessmentViewBox"></div>';
				htmlContent+= '</div>';
				
				htmlContent+= '<div id="knowledgemate_contentViewBox">';
					htmlContent+= '<div id="visitmateContentViewBox" class="view-container"></div>';
				htmlContent+= '</div>';
			htmlContent+= '</div>';
		htmlContent+= '</div>';

		htmlContent+= '<div id="assessmentContentListArea" class="noborder aligntop" onclick="hideCourseContentMenu()">';
			htmlContent+= '<div id="assessmentContentListBox" class="noborder aligntop">';
				htmlContent+= '<div id="assessmentContentId" style="display:none;" th:text="${course.id}"></div>';
				htmlContent+= '<div id="assessmentContentTitle">Contents</div>';
				htmlContent+= '<div id="assessmentContentList"></div>';
			htmlContent+= '</div>';
		htmlContent+= '</div>';
	htmlContent+= '</div>';

	htmlContent+= '<div id="visitmateMessageBox"></div>';
	htmlContent+= '<div style="display: flex; padding-bottom: 30px; width: 100%; justify-content: center;"><button id="courseComplete" class="btnStyle" onclick="submitVisitorCourseComplete()" disabled>Complete Training</button>';
	
	// $("#visitmateCourseArea").html(htmlContent);
	// $("#visitmateMenuArea").hide();
	// $("#visitmateFormArea").hide();
	// $("#visitmateListArea").hide();
	// $("#visitmateCourseArea").show();
	
	if(mVisitDetailsJSON != null) {
		//currentUser = {"id": mVisitDetailsJSON.visitorId, "userName": mVisitDetailsJSON.visitorName, "firstName": mVisitDetailsJSON.visitoFirstName, "other": "visitor"};
		openCourse(mVisitDetailsJSON.courseId, 'visitor');		// Knowledgemate course
	}
}

function viewVisitmateMenuScreen() {
	shared.currentState = "getMyVisitors";
	unsavedData = false;
	$('#modulesMenuArea').show();
	$('#modulesListArea').show();
	$('#modulesDisplayArea').hide();
}

function closeVisitmateCourseStateArea() {
	$('#contentListArea').html('');
	$('#contentListArea').hide();
}
function closeVisitmateAssessmentStateArea() {
	$('#visitmateAssessmentStateArea').html('');
	$('#visitmateAssessmentStateArea').hide();
}


function viewVisitorListArea() {
	shared.currentState = shared.currentSourceState;
	$('#modulesMenuArea').show();
	$('#modulesListArea').show();
	$('#modulesDisplayArea').hide();
}

async function captureVmImage(imageElement, imageSource, folder, fileName, imageQuality, resolution) {
	let attCount = $('#attachmentcount').val();
	attCount++;
	$('#attachmentcount').val(attCount);
	fileName = fileName+'_'+attCount+'.jpg';
	await captureImage(imageElement, imageSource, folder, fileName, imageQuality, resolution);
}
   
/******************************************************************************************
Name: viewVmQRCode
Purpose: Make the visibility SHOW of QR Code view to scan QR Code
******************************************************************************************/
function viewVmQRCode(visitorVisit) {
	var visitor = visitorVisit.visitorregistration;
	var visit = visitorVisit.visitorvisit;

    var dat = 'VISITMATE -- PASSED -- '+visit.visitKey+' -- '+visitor.visitorCodeId+' -- '+visit.courseId+' -- '+visit.id+' -- '+visitor.companyKey;
    vmqrcode.makeCode(dat);
}


window.viewVisitmate = viewVisitmate;
window.closeVisitmate = closeVisitmate;
window.backVisitmateHandle = backVisitmateHandle;
window.getMyVisitors = getMyVisitors;   
window.exitVisitmate = exitVisitmate;
window.displayVisitmateMenu = displayVisitmateMenu;
window.viewVisitorRecord = viewVisitorRecord;
window.handleVisitmateQrCode = handleVisitmateQrCode;
window.viewMyVisitors = viewMyVisitors;
window.createVisitor = createVisitor;
window.submitInvitation = submitInvitation;
window.createInvitationForm = createInvitationForm;
window.confirmSubmitInvitation = confirmSubmitInvitation;
window.displayVisitorDetail = displayVisitorDetail;
window.loadVmMaterial = loadVmMaterial;
window.addMaterial = addMaterial;
window.getMyVisitMateTask = getMyVisitMateTask;
window.getCourseState = getCourseState;
window.setVisitStatus = setVisitStatus;
window.submitVisitorCourseComplete = submitVisitorCourseComplete;
window.visitorSelfLogin = visitorSelfLogin;
window.visitorSelfRegistration = visitorSelfRegistration;
window.visitorSelfRegistrationDetailForm = visitorSelfRegistrationDetailForm;
window.visitorSelfRegistrationImageForm = visitorSelfRegistrationImageForm;
window.loadAttachmentList = loadAttachmentList;
window.vmSubmitToken = vmSubmitToken;
window.vmSubmitRegistration = vmSubmitRegistration;
window.vmSubmitRegistrationImages = vmSubmitRegistrationImages;
window.viewVisitorLogin = viewVisitorLogin;
window.vmSubmitLogin = vmSubmitLogin;
window.loadVisitorCourse = loadVisitorCourse;
window.captureVmImage = captureVmImage;
window.closeVisitmateAssessmentStateArea = closeVisitmateAssessmentStateArea;
window.closeVisitmateCourseStateArea = closeVisitmateCourseStateArea;








