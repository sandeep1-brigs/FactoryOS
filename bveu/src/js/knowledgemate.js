import { Filesystem, Directory, Encoding } from "@capacitor/filesystem"
import { Capacitor } from '@capacitor/core';
import { Device } from "@capacitor/device"
import { Http } from '@capacitor-community/http';
import { Network } from '@capacitor/network';
import { App } from '@capacitor/app';
import $ from 'jquery';
import { Browser } from '@capacitor/browser';


import { shared , s3PrivateUrl } from "./globals.js";
import { displaySection , buildRequestOptions , isValidResponse , RequestOptions} from "./capacitor-welcome.js";
import { getMenuBar ,viewHome , getNewToken} from "./settings.js";
import { highlightHeaderTabMenu , constructUrl , showDialog , fixModuleHeight , getSignedUrl , stopAppIdleTimer} from "./utility.js";
import { apiRequestFailed , } from "./auth.js";
import { createList } from "./list.js";



var listItems = [];
var mVisitDetailsJSON = null;
var qSequence = [];
var questionCount = 0;
var testQuestions = {};
var mcqAnswers = [];
var mcqChoices = [];
var testContent = {};
var timeLimit = 0;
var countDownTimer;
var assessmentResult = {};
var classAssessmentResult = [];
var classClickerResults = [];
var classAttendees = [];
// var answerString = "";
var courseContentStatus = null;
var classDetail = null;
var quizState = '';

var courseContent = null;
var runningContentIndex = 0;
var runningContentType;

var miscInfoJson = {"datId":0,"content":[]};
var kmContentAliveInterval = null;
let userOrVisitor = "user";
var allClasses = null;
var InstructorClasses = null;
var studentClasses = null;
var currentClassList = [];

function viewKnowledgemate() {
	shared.currentRunningApp = 'knowledgeMate';
	$('#moduleTitle').html("LEARNING");
	displaySection('modulesSection', 'flex', false, true);
	stopAppIdleTimer();

	//updateAppRuntime("knowledgeMate", "on", "ok");
	displayKnowledgemateMenu();

	$('#modulesMenuArea').show();
	$('#modulesListArea').show();
	$('#modulesDisplayArea').hide();

	if (shared.mCustomerDetailsJSON != null) {
		userOrVisitor = "user";
		let btn = document.getElementById("btnId_view_courses");
		setTimeout(function() {
			btn.click();
		}, 200);

	} else {
		userOrVisitor = "visitor";
	}
}

function closeKnowledgemate() {
    showConfirmDialog({
        message: "Exit KnowledgeMate?",
        yesLabel: "Exit",
        noLabel: "Cancel",
        onYes: () => {
            console.log("✅ User confirmed exit from KnowledgeMate");
            exitKnowledgemate();
        },
        onNo: () => {
            console.log("❌ User cancelled exit from KnowledgeMate");
            // Dialog auto-hides
        }
    });
}

function exitKnowledgemate() {
	stopKmAliveInterval();
	shared.currentState = "";
	qSequence = [];
	questionCount = 0;
	testQuestions = {};
	mcqAnswers = [];
	mcqChoices = [];
	testContent = {};
	timeLimit = 0;
	assessmentResult = {};
	classAssessmentResult = [];
	classClickerResults = [];
	classAttendees = [];
	courseContent = null;
	courseContentStatus = null;
	classDetail = null;
	clearTempCopiedImage();
    exitModules();
}

/****************************************************************************************************
 Function: displayKnowledgemateMenu
 Purpose: Displays Knowledgemate Menu screen
****************************************************************************************************/
function displayKnowledgemateMenu() {
	shared.currentState = "knowledgemateMenu";

	var htmlContent = "";
	
	var knowledgemateScreenSource = null;
	if(shared.mCustomerDetailsJSON != null) {
		knowledgemateScreenSource = shared.cmsJSON.cmsJSONdata.knowledgemateScreen;
	} else {
		knowledgemateScreenSource = shared.cmsJSON.cmsJSONdata.knowledgemateKioskScreen;
	}

	$.each(knowledgemateScreenSource.sectionList, function(key, section) {
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

			htmlContent += '<div class="searchArea"><div class="searchBox" id="knowledgemate_searchbox"></div></div>';

			htmlContent += '</div>';
		}
	});

	$("#modulesMenuArea").html(htmlContent);
}


/**************************************************************** COURSE *************************************************************/
let myCourseType = 'My Course';
function viewCourses(type = 'My Course') {
	$('#knowledgemate_searchbox').html('<input type="search" class="searchInput" id="knowledgemate_course_search_input" placeholder="Search course" /><button class="searchBtn" id="knowledgemate_course_searchbtn" onclick="getCourses()"><span class="material-symbols-outlined" style="font-size: 30px; padding: 5px 0;"></span></button>');
	myCourseType = type;
	getCourses();
}

/******************************************************************************************
Name: viewCourses
Purpose: To view Catalog page - all the courses assigned to the user
******************************************************************************************/

function getCourses(page = 1, size = 50) {
  highlightHeaderTabMenu("menuBtn", "btnId_view_courses");

  let searchStr = $("#knowledgemate_course_search_input").val();
  $('#modulesListArea').addClass('lightBkClass');
  userOrVisitor = "user";
  shared.currentState = "courseList";
  let type = myCourseType;

  if (!shared.mCustomerDetailsJSON) {
    showDialog("You need to login to access this resource!", "viewLogin('menuProcess')");
    return;
  }

  const data = {
    token: shared.mCustomerDetailsJSON.token,
    searchStr: searchStr,
    page: page,
    size: size
  };

  buildRequestOptions(constructUrl("/courses/searchcoursespaginated"), "GET", data)
    .then(request => {
      Http.request(request).then(res => {
        console.log("[getCourses] Raw response:", res);

        if (isValidResponse(res, "searchcoursespaginated") && res.data) {
          let courseJson;
          try {
            courseJson = typeof res.data === "string" ? JSON.parse(res.data) : res.data;
          } catch (e) {
            console.warn("[getCourses] Failed to parse response, using raw data.");
            courseJson = res.data;
          }

          if (courseJson.error !== "invalid_token") {
           
            let htmlContent = '';
            htmlContent += '<div id="knowledgemateCourseArea" class="appFullPage" style="padding-bottom: 30px;">';
            htmlContent += '<div style="padding: 0 10px; display: flex; justify-content: flex-start; flex-wrap: wrap;">';
            htmlContent += '<div class="listBoxActionButton courseListTypeClass" id="courseListType_All" style="border-radius: 5px; padding: 5px 10px; margin: 5px;" onclick="viewCourses(\'All\')">All</div>';
            htmlContent += '<div class="listBoxActionButton courseListTypeClass" id="courseListType_MyCourse" style="border-radius: 5px; padding: 5px 10px; margin: 5px;" onclick="viewCourses(\'My Course\')">My Courses</div>';
            htmlContent += '<div class="listBoxActionButton courseListTypeClass" id="courseListType_Requested" style="border-radius: 5px; padding: 5px 10px; margin: 5px;" onclick="viewCourses(\'Requested\')">Requested</div>';
            htmlContent += '<div class="listBoxActionButton courseListTypeClass" id="courseListType_Available" style="border-radius: 5px; padding: 5px 10px; margin: 5px;" onclick="viewCourses(\'Available\')">Available</div>';
            htmlContent += '</div>';
            htmlContent += '<div id="knowledgemateCourseListArea"></div>';
            htmlContent += '</div>';

            $("#modulesListBox").html(htmlContent);
            fixModuleHeight("modulesModuleHeader, modulesMenuArea, footerSection", 20, "knowledgemateCourseArea");

            let myCourseJson = courseJson;
            let availableCourseJson = null;
            let requestedCourseJson = null;

            if (courseJson.myCourses && courseJson.requestedCourses && courseJson.availableCourses) {
              myCourseJson = courseJson.myCourses;
              availableCourseJson = courseJson.availableCourses;
              requestedCourseJson = courseJson.requestedCourses;
            }

            // === Course Category Rendering ===
            if (type === "All" || type === "My Course") {
              if (myCourseJson && myCourseJson.length > 0) {
                viewCourseList("My Course", myCourseJson, "knowledgemateCourseListArea");
              } else {
                $('#knowledgemateCourseListArea').html('<div style="padding: 10px;">No courses in this category!</div>');
              }
            }

            if (type === "All" || type === "Requested") {
              if (requestedCourseJson && requestedCourseJson.length > 0) {
                viewCourseList("Requested", requestedCourseJson, "knowledgemateCourseListArea");
              } else {
                $('#knowledgemateCourseListArea').html('<div style="padding: 10px;">No courses in this category!</div>');
              }
            }

            if (type === "All" || type === "Available") {
              if (availableCourseJson && availableCourseJson.content && availableCourseJson.content.length > 0) {
                viewCourseList("Available", availableCourseJson, "knowledgemateCourseListArea");
              } else {
                $('#knowledgemateCourseListArea').html('<div style="padding: 10px;">No courses in this category!</div>');
              }
            }

            let str = type.replace(/\s+/g, '');
            $('#courseListType_' + str).addClass("activeAction1");
          } else {
            // Token expired
            getNewToken("viewCourses()");
          }
        }
      }).catch(err => {
        console.error("[getCourses] Request failed!", err);
        apiRequestFailed(err, "searchcoursespaginated");
      });
    })
    .catch(err => {
      console.warn("[getCourses] Request aborted: buildRequestOptions failed.", err);
    });
}

function viewCourseList(type, itemList, destin) {
	var htmlContent = "";
    let item = null;

	listItems = [];

	let items = itemList;
	let pageable = null;
	let totalPages = 1;
	if(type == "Available") {
		items = itemList.content;
		pageable = itemList.pageable;
		totalPages = itemList.totalPages;
	}

	for(var index in items) {
		item = items[index];
		let description = '';
		if(item.description != null) {
			description = '<div>'+item.description+'</div>';
		}

		let image = '';
		if(item.icon != undefined && item.icon != null && item.icon.length > 0) {
			image = item.icon;
		} else {
			image = '<img style="width: 100%;" src="./img/noimage.jpg" />';
		}

		let states = [];
		let actions = [];
		let activeActions = [];
		//let actions = [{"text": "View Audits", "act":"handleAssetQrCode('"+item.codeId+"', 1)"}];
		if(type == "My Course") {
			states.push({"text":type, "type": "successState"});
		} else if(type == "Requested") {
			states.push({"text":type, "type": "warningState"});
		} else if(type == "Available") {
			states.push({"text":type, "type": "infoState"});
		}

		// actions.push({"text": "Archive", "icon": "<span class=\"material-symbols-outlined\" style=\"font-size: 20px;\">library_add</span>",  "actionClass": "activeAction1", "act":"archiveNow('"+contentIdName+"')"});
		// actions.push({"text": "Share", "icon": "<span class=\"material-symbols-outlined\" style=\"font-size: 20px;\">share</span>",  "actionClass": "activeAction1", "act":"shareNow('"+contentIdName+"')"});
		// activeActions.push({"text": "Share"});

		let itemJson = {};

		if(type == "My Course") {
			itemJson = {"id": item.id, "image": image, "title":item.courseName, "description":description, "clickAction":"openCourse('"+item.id+"', \'user\')", "states":states, "actions":actions, "activeActions":activeActions};
		} else if(type == "Requested") {
			itemJson = {"id": item.id, "image": image, "title":item.courseName, "description":description, "clickAction":"alreadyRequested()", "states":states, "actions":actions, "activeActions":activeActions};
		} else if(type == "Available") {
			itemJson = {"id": item.id, "image": image, "title":item.courseName, "description":description, "clickAction":"subscribeCourse('"+item.id+"')", "states":states, "actions":actions, "activeActions":activeActions};
		}
		listItems.push(itemJson);
		if(index == items.length-1) {
			createList("knowledgemate", htmlContent, listItems, pageable, totalPages, destin, "", "getCourses", "cardStyle");
		}
	}
}

function alreadySubscribed(courseId) {
	alert("This course has already been assigned to you!")	
}


function alreadyRequested() {
	alert("You have already submitted request for this course! Once approved, it'll appear in your courses.")	
}

function subscribeCourse(courseId) {
  if (confirm("Subscribe this course?") === true) {
    const data = { token: shared.mCustomerDetailsJSON.token, courseId: courseId };

    RequestOptions(constructUrl("/usercourses/restrequestcoursebyid"), "POST", data)
      .then(request => {
        Http.request(request).then(res => {
          console.log("[subscribeCourse] Raw response:", res);

          if (isValidResponse(res, "restrequestcoursebyid") && res.data) {
            let responseJson;
            try {
              responseJson = typeof res.data === "string" ? JSON.parse(res.data) : res.data;
            } catch (e) {
              console.warn("[subscribeCourse] Failed to parse response, using raw.", e);
              responseJson = res.data;
            }

            if (responseJson && responseJson.error !== "invalid_token") {
              showDialog("Request sent! Once approved, it'll appear in your courses.");
            } else {
              // Token expired
              getNewToken("subscribeCourse(" + courseId + ")");
            }
          }
        }).catch(err => {
          console.error("[subscribeCourse] Request failed!", err);
          apiRequestFailed(err, "restrequestcoursebyid");
        });
      })
      .catch(err => {
        console.warn("[subscribeCourse] Request aborted: buildRequestOptions failed.", err);
      });
  }
}

/******************************************************************************************
Name: openCourse
Purpose: To view Course page - all the course details and content list when user clicks on a course
******************************************************************************************/

 export function openCourse(courseId, userType, visitorId = 0) {
  // $("#modulesListArea").show();
  $("#modulesMenuArea").hide();
  // $("#modulesDisplayArea").hide();
  // fixModuleHeight("modulesModuleHeader, footerSection", 20, "modulesDisplayArea");

  shared.currentState = "courseContent";
  shared.currentSourceState = shared.currentState;

  userOrVisitor = userType;
  //$('#loadingSpinner').show();

  let data = {};
  if ((userType === "visitor") && (mVisitDetailsJSON != null)) {
    data = { token: shared.mVisitDetailsJSON.token, courseId: courseId, userOrVisitor: "visitor" };
  } else if (shared.mCustomerDetailsJSON != null) {
    if (userType === "visitee") {
      data = { token: shared.mCustomerDetailsJSON.token, courseId: courseId, visitorId: visitorId, userOrVisitor: "visitor" };
    } else {
      data = { token: shared.mCustomerDetailsJSON.token, courseId: courseId, userOrVisitor: "user" };
    }
  }

  buildRequestOptions(constructUrl("/courses/getcourseandstatus"), "GET", data)
    .then(request => {
      Http.request(request).then(res => {
        console.log("[openCourse] Raw response:", res);

        if (isValidResponse(res, "getcourseandstatus") && res.data) {
          let responseJson;
          try {
            responseJson = typeof res.data === "string" ? JSON.parse(res.data) : res.data;
          } catch (e) {
            console.warn("[openCourse] Failed to parse response, using raw.", e);
            responseJson = res.data;
          }

          const course = responseJson.course;
          courseContentStatus = responseJson.status;

          if (course.error !== "invalid_token") {
            let htmlContent = "";

            htmlContent += '<div id="knowledgemateCourseTitleArea">';
            htmlContent += '<div class="bannerarea">';
            if (course.primaryImage.length) {
              htmlContent += '<img class="cardStyleImage" style="max-height: 200px;" src=' + course.primaryImage + ' onerror="this.onerror=null;this.src=\'./img/noimage.jpg\';" />';
            }
            htmlContent += '<div class="titleFontClass" style="background-color: rgb(240, 240, 240);">' + course.courseName + '</div>';
            htmlContent += '<div id="courseDescriptionField" class="contentDetailText" style="padding-top: 5px;">' + course.description + '</div>';
            htmlContent += '<div id="courseSpecificationField" class="contentDetailText">' + course.specification + '</div>';
            htmlContent += '</div>';
            htmlContent += '<div class="qpaperfooter" id="courseComplete" style="margin: 0; ">';
            htmlContent += '<div class="contentDetailText" style="color: var(--secondary-cyan);">Course completed</div>';
            htmlContent += '<div class="btnStyle" onclick="viewCertificate()" style="margin-top: 0;">View Certificate</div>';
            htmlContent += '</div>';
            htmlContent += '</div>';

            htmlContent += '<div id="contentListArea" class="appFullPage lightBkClass"><div id="contentListBox" style="padding-bottom: 30px;"></div></div>';

            $("#modulesListBox").html(htmlContent);
            $("#modulesListBox").css("height", "100%");
            fixModuleHeight("modulesModuleHeader, knowledgemateCourseTitleArea, footerSection", 20, "contentListArea");
            $("#modulesListArea").removeClass("lightBkClass");
            $("#courseComplete").hide();

            if (userType !== "visitee" && courseContentStatus == null) {
              createNewUserCourseStatus(course, userType, responseJson.contentList);
            } else {
              viewCourseContent(responseJson.contentList, userType, visitorId);
            }

            miscInfoJson = { datId: course.id, content: [] };
           // updateAppRuntime("knowledgeMate", "on", JSON.stringify(miscInfoJson));

          } else {
            // Token expired
            getNewToken("openCourse(" + courseId + ", '" + userType + "', " + visitorId + ")");
          }
        }
      }).catch(err => {
        console.error("[openCourse] Request failed!", err);
        apiRequestFailed(err, "getcourseandstatus");
      });
    })
    .catch(err => {
      console.warn("[openCourse] Request aborted: buildRequestOptions failed.", err);
    });
}

function getContentInitJson(content) {
	return {"contentId": content.contentId, "contentName": content.contentName, "contentType": content.contentType, "status": 0};
}

function createNewUserCourseStatus(course, userType, courseContent) {
  const data = { token: shared.mCustomerDetailsJSON.token };

  buildRequestOptions(constructUrl("/api/restgetblankusercoursestate"), "GET", data)
    .then(request => {
      Http.request(request).then(res => {
        console.log("[createNewUserCourseStatus] Raw response:", res);

        if (isValidResponse(res, "restgetblankusercoursestate") && res.data) {
          let dataJson;
          try {
            dataJson = typeof res.data === "string" ? JSON.parse(res.data) : res.data;
          } catch (e) {
            console.warn("[createNewUserCourseStatus] Failed to parse response, using raw.", e);
            dataJson = res.data;
          }

          // --- User/visitor assignment (unchanged logic) ---
          if ((userType === "visitor") && (mVisitDetailsJSON != null)) {
            dataJson.userId = mVisitDetailsJSON.id;
            dataJson.userName = mVisitDetailsJSON.userName;
          } else if (shared.mCustomerDetailsJSON != null) {
            dataJson.userId = shared.mCustomerDetailsJSON.id;
            dataJson.userName = shared.mCustomerDetailsJSON.userName;
          }

          // --- Course assignment (unchanged logic) ---
          dataJson.courseId = course.id;
          dataJson.courseName = course.courseName;

          // --- Course state building (unchanged logic) ---
          const courseState = [];
          if (courseContent.length > 0) {
            for (let index = 0; index < courseContent.length; index++) {
              courseState.push(getContentInitJson(courseContent[index]));

              if (index === courseContent.length - 1) { // Last item
                dataJson.courseState = JSON.stringify(courseState);
                saveCourseStatus(userType, dataJson, courseContent);
              }
            }
          } else {
            // Fallback if no content exists
            let contentString = "]}"; // assuming it was pre-built earlier
            dataJson.courseState = contentString;
            saveCourseStatus(userType, dataJson, courseContent);
          }
        }
      }).catch(err => {
        console.error("[createNewUserCourseStatus] Request failed!", err);
        apiRequestFailed(err, "restgetblankusercoursestate");
      });
    })
    .catch(err => {
      console.warn("[createNewUserCourseStatus] Request aborted: buildRequestOptions failed.", err);
    });
}

function saveCourseStatus(userType, courseState, courseContent) {
  let url = "/api/restsaveusercoursestate";
  if (userType === "visitor") {
    url = "/visitorvisits/restsavevisitorcoursestate";
  }

  const data = { courseData: JSON.stringify(courseState) };

  RequestOptions(constructUrl(url), "POST", data)
    .then(request => {
      Http.request(request).then(res => {
        console.log("[saveCourseStatus] Raw response:", res);

        if (isValidResponse(res, url) && res.data) {
          let responseJson;
          try {
            responseJson = typeof res.data === "string" ? JSON.parse(res.data) : res.data;
          } catch (e) {
            console.warn("[saveCourseStatus] Failed to parse response, using raw.", e);
            responseJson = res.data;
          }

          console.log("Content Status save - " + JSON.stringify(responseJson));
          $("#loadingSpinner").hide();

          // Preserve original assignments
          courseContentStatus = courseState;
          viewCourseContent(courseContent, userType);
        }
      }).catch(err => {
        console.error("[saveCourseStatus] Request failed!", err);
        apiRequestFailed(err, url);
      });
    })
    .catch(err => {
      console.warn("[saveCourseStatus] Request aborted: buildRequestOptions failed.", err);
    });
}

function viewCourseContent(items, userType, visitorId=0) {
	let courseState = JSON.parse(courseContentStatus.courseState);

	var htmlContent = "";
	listItems = [];

	//let items = courseContent;
	let pageable = null;
	let totalPages = 1;

	for(var index in items) {
		let item = items[index];
		let description = '';
		if(item.contentDescription != null && item.contentDescription.length > 0) {
			description += '<div>'+item.contentDescription+'</div>';
		}
		//description += '<div> Duration: '+item.contentDuration+'</div>';

		let image = '';
		if(item.contentIcon != undefined && item.contentIcon != null && item.contentIcon.length > 0) {
			image = item.contentIcon;
		} else {
			if(item.contentType == 'Content'){
				//image = '<span class="material-symbols-outlined" style="padding: 0 30%; width: 100%; color:var(--secondary-blue);">box</span>';
				if(item.contentUrl.toLowerCase().includes('.pdf')) {
					image = '<img class="ticketStyleImageIcon" src="./img/icon_pdf.png" onerror="this.onerror=null;this.src=\'./img/noimage.jpg\';" />';
				} else if(item.contentUrl.toLowerCase().includes('.mp4') || item.contentUrl.toLowerCase().includes('youtu')) {
					image = '<img class="ticketStyleImageIcon" src="./img/icon_video.png" onerror="this.onerror=null;this.src=\'./img/noimage.jpg\';" />';
				} else if(item.contentUrl.toLowerCase().includes('.ppt') || item.contentUrl.toLowerCase().includes('presentation')) {
					image = '<img class="ticketStyleImageIcon" src="./img/icon_ppt.png" onerror="this.onerror=null;this.src=\'./img/noimage.jpg\';" />';
				} else if(item.contentUrl.toLowerCase().includes('.doc') || item.contentUrl.toLowerCase().includes('document')) {
					image = '<img class="ticketStyleImageIcon" src="./img/icon_word.png" onerror="this.onerror=null;this.src=\'./img/noimage.jpg\';" />';
				} else if(item.contentUrl.toLowerCase().includes('.xls') || item.contentUrl.toLowerCase().includes('spreadsheet')) {
					image = '<img class="ticketStyleImageIcon" src="./img/icon_excel.png" onerror="this.onerror=null;this.src=\'./img/noimage.jpg\';" />';
				} else if(item.contentUrl.toLowerCase().includes('.png') || item.contentUrl.toLowerCase().includes('.jpg') || item.contentUrl.toLowerCase().includes('.jpeg') || item.contentUrl.toLowerCase().includes('.bmp')) {
					image = '<img class="ticketStyleImageIcon" style="padding: 0 20%;" src="./img/icon_img.png" onerror="this.onerror=null;this.src=\'./img/noimage.jpg\';" />';
				}
			} else {
				image = '<img class="ticketStyleImageIcon" src="./img/icon_quiz.png" onerror="this.onerror=null;this.src=\'./img/noimage.jpg\';" />';
			}
		}

		let states = [];
		let actions = [];
		let activeActions = [];
		let clickAction = "openContent("+index+")";
		
		actions.push({"text":"duration", "content":'<div style="display: flex; align-items: center;"><span class="material-symbols-outlined" style="font-size: 17px;">schedule</span><div style="padding-left:5px;">'+item.contentDuration+'</div></div>'});
		let contentStatus = courseState.contents.find(status => (status.contentId == item.contentId && status.contentType == item.contentType));
		if(contentStatus != undefined) {
			let status = contentStatus.status * 100;
			actions.push({"text":"progress", "content":'<meter id="prg+'+index+'" value="'+status+'" max="100"></meter>'});
			if(status == 100) {
				states.push({"text":"Complete", "type": "successState"});
				if(userType == "visitee") {
					if(item.contentType == "Assessment") {
						clickAction = "getDetailedAssessmentReport("+item.contentId+", "+visitorId+")";
					} else {
						clickAction = "showDialog('Completed!')";
					}
				}
			} else {
				if(userType == "visitee") {
					clickAction = "showDialog('Incomplete!')";
				}
			}
		} else {
			actions.push({"text":"progress", "content":'<meter id="prg+'+index+'" value="0" max="100"></meter>'});
			if(userType == "visitee") {
				clickAction = "showDialog('Incomplete!')";
			}
		}

		
		let itemJson = {"id": item.contentId, "contentType": item.contentType, "title":item.contentName, "image": image, "contentUrl":item.contentUrl, "contentType":item.contentType, "type":item.type, "contentDuration":item.contentDuration, "description":description, "clickAction":clickAction, "states":states, "actions":actions, "activeActions":activeActions};
		listItems.push(itemJson);
		if(index == items.length-1) {
			courseContent = listItems;
			let actionAreaStyle="font-size: 0.8em; justify-content: space-between;";
			createList("knowledgemate", htmlContent, listItems, pageable, totalPages, "contentListBox", "", "", "ticketStyle", actionAreaStyle);
			checkCourseStatus();
		}
	}
}


/**************************************************************** CONTENTs in COURSE *************************************************************/
function openContent(contentIndex) {
	shared.currentState = "viewContent";
	let courseContentData = courseContent[contentIndex];
	if(userOrVisitor == 'kmclass') {
		pauseQuiz();
		quizState = '';
	}
	
	let htmlContent = '';
	htmlContent+= '<div class="lightBkClass" id="knwledgemateContentViewArea">';
		htmlContent+= '<div id="knowledgemateContentDisplayArea">';
			htmlContent+= '<div id="modules_contentViewBox" style="padding-bottom: 50px;"></div>';
		htmlContent+= '</div>';
	htmlContent+= '</div>';
	$("#modulesDisplayArea").html(htmlContent);
	$("#modulesMenuArea").hide();
	$("#modulesListArea").hide();
	$("#modulesDisplayArea").show();
	fixModuleHeight("modulesModuleHeader, footerSection", 20, "modulesDisplayArea");

	// var htmlContent = "";
	if(courseContentData.contentType == "Content") {
		viewContent(courseContentData, 'modules_contentViewBox');
	} else if(courseContentData.contentType == "Assessment") {
		showAssessment(courseContentData.id, false);
	}
	//HighlightList(contentType, contentId);
	startProgressMonitoring();
}

/**************************************************************** CLASSROOM *************************************************************/
let myClassType = 'All';

function viewClasses(type = 'All') {
	$('#knowledgemate_searchbox').html('<input type="search" class="searchInput" id="knowledgemate_class_search_input" placeholder="Search class" /><button class="searchBtn" id="knowledgemate_class_searchbtn" onclick="getClasses()"><span class="material-symbols-outlined" style="font-size: 30px; padding: 5px 0;"></span></button>');
	myClassType = type;
	getClasses();
}

/******************************************************************************************
Name: getClasses
Purpose: opens the list of classes
******************************************************************************************/

function getClasses(page = 1, size = 50) {
  highlightHeaderTabMenu("menuBtn", "btnId_view_classes");
  let searchStr = $("#knowledgemate_class_search_input").val();
  $("#modulesListArea").addClass("lightBkClass");
  if (searchStr == null) searchStr = "";

  userOrVisitor = "user";
  shared.currentState = "classList";
  var type = myClassType;

  if (shared.mCustomerDetailsJSON != null) {
    let htmlContent = "";

    $("#modulesMenuArea").show();
    $("#modulesListArea").show();
    $("#modulesDisplayArea").hide();

    const data = {
      token: shared.mCustomerDetailsJSON.token,
      searchStr: searchStr,
      page: page,
      size: size,
    };

    buildRequestOptions(constructUrl("/kmclasss/searchkmclassspaginated"), "GET", data)
      .then((request) => {
        Http.request(request)
          .then((res) => {
            if (isValidResponse(res, "searchkmclassspaginated") && res.data) {
              const classJson = typeof res.data === "string" ? JSON.parse(res.data) : res.data;

              if (classJson.error !== "invalid_token") {
                // --- Original rendering logic (unchanged) ---
                htmlContent = "";
                htmlContent +=
                  '<div id="knowledgemateClassArea" class="appFullPage" style="padding-bottom: 30px;">';
                htmlContent +=
                  '<div style="padding: 0 10px; display: flex; justify-content: flex-start; flex-wrap: wrap;">';
                htmlContent +=
                  '<div class="listBoxActionButton classListTypeClass" id="classListType_All" style="border-radius: 5px; padding: 5px 10px; margin: 5px;" onclick="viewClasses(\'All\')">All</div>';
                htmlContent +=
                  '<div class="listBoxActionButton classListTypeClass" id="classListType_Instructor" style="border-radius: 5px; padding: 5px 10px; margin: 5px;" onclick="viewClasses(\'Instructor\')">As Instructor</div>';
                htmlContent +=
                  '<div class="listBoxActionButton classListTypeClass" id="classListType_Student" style="border-radius: 5px; padding: 5px 10px; margin: 5px;" onclick="viewClasses(\'Student\')">As Student</div>';
                htmlContent += "</div>";
                htmlContent += '<div id="knowledgemateClassListArea"></div>';
                htmlContent += "</div>";

                $("#modulesListBox").html(htmlContent);
                fixModuleHeight(
                  "modulesModuleHeader, modulesMenuArea, footerSection",
                  20,
                  "knowledgemateClassArea"
                );

                htmlContent = "";
                allClasses = classJson;
                var instructorClasses = null;
                studentClasses = null;

                if (
                  classJson.allKmclasss !== undefined &&
                  classJson.instructorKmclasss !== undefined &&
                  classJson.studentKmclasss !== undefined
                ) {
                  allClasses = classJson.allKmclasss;
                  instructorClasses = classJson.instructorKmclasss;
                  studentClasses = classJson.studentKmclasss;
                }

                if (type === "All") {
                  if (allClasses.content != null && allClasses.content.length > 0) {
                    viewClassList("All", allClasses, "knowledgemateClassListArea");
                  } else {
                    $("#knowledgemateClassListArea").html(
                      '<div style="padding: 10px;">No classes in this category!</div>'
                    );
                  }
                }

                if (type === "Instructor") {
                  if (instructorClasses != null && instructorClasses.length > 0) {
                    viewClassList(
                      "Instructor",
                      instructorClasses,
                      "knowledgemateClassListArea"
                    );
                  } else {
                    $("#knowledgemateClassListArea").html(
                      '<div style="padding: 10px;">No classes in this category!</div>'
                    );
                  }
                }

                if (type === "Student") {
                  if (studentClasses != null && studentClasses.length > 0) {
                    viewClassList("Student", studentClasses, "knowledgemateClassListArea");
                  } else {
                    $("#knowledgemateClassListArea").html(
                      '<div style="padding: 10px;">No classes in this category!</div>'
                    );
                  }
                }

                let str = type.replace(/\s+/g, "");
                $("#classListType_" + str).addClass("activeAction1");
              } else {
                getNewToken("viewClasses()");
              }
            }
          })
          .catch((err) =>
            console.error("Class list fetch failed from server!", err)
          );
      })
      .catch((err) =>
        console.warn("Request aborted due to missing requestOptions.", err)
      );
  } else {
    showDialog(
      "You need to login to access this resource!",
      "viewLogin('menuProcess')"
    );
  }
}

function viewClassList(type, itemList, destin) {
	var htmlContent = "";
	listItems = [];
  let instructorClasses = []; // fill this with data from server
  let studentClasses = [];    // fill this with data from server


	let items = itemList;
	let pageable = null;
	let totalPages = 1;
	if(itemList.pageable != undefined && itemList.pageable != null) {
		items = itemList.content;
		pageable = itemList.pageable;
		totalPages = itemList.totalPages;
	}
	currentClassList = items;

	for(var index in items) {
		let item = items[index];
		let description = '';
		if(item.description != null) {
			description = '<div>'+item.description+'</div>';
		}
		description += '<div style="display: flex; align-items: center;"><span class="material-symbols-outlined" style="font-size: 17px;">menu_book</span><div style="padding-left:5px;">'+item.courseName+'</div></div>'
		description += '<div style="display: flex; align-items: center;"><span class="material-symbols-outlined" style="font-size: 17px;">schedule</span><div style="padding-left:5px;">'+item.courseDuration+'</div></div>'
		description += '<div style="display: flex; align-items: center;"><span class="material-symbols-outlined" style="font-size: 17px;">meeting_room</span><div style="padding-left:5px;">'+item.kmclassroomName+'</div></div>'
		description += '<div style="display: flex; align-items: center;"><span class="material-symbols-outlined" style="font-size: 17px;">interactive_space</span><div style="padding-left:5px;">'+item.trainerFullName+'</div></div>'

		let image = '';
		if(item.courseIcon != undefined && item.courseIcon != null && item.courseIcon.length > 0) {
			image = item.courseIcon;
		} else {
			image = '<img style="width: 100%;" src="./img/training.jpg" />';
		}

		let states = [];
		let actions = [];
		let activeActions = [];
		//let actions = [{"text": "View Audits", "act":"handleAssetQrCode('"+item.codeId+"', 1)"}];
		const instructorExists = instructorClasses.some(kmclass => kmclass.trainerId === item.trainerId);
		if(instructorExists) {
			states.push({"text":"Instructor", "type": "successState"});
		}

		const studentExists = studentClasses.some(kmclass => kmclass.trainerId === item.trainerId);
		if(studentExists) {
			states.push({"text":"Student", "type": "successState"});
		}

		let classDate = "";
		if(item.dateTime == null) {
			classDate = new Date();
		} else {
			classDate = new Date(item.dateTime.replace(' ', 'T'));  // make it ISO-friendly

		}
		const readableDate = classDate.toLocaleString('en-US', {year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true});

		let location = '<a style="display: flex; align-items: center;" href="#" onclick="window.open(\'https://www.google.com/maps?q='+item.kmclassroomLocation+'\', \'_blank\')"><span class="material-symbols-outlined" style="font-size: 17px;">location_on</span> View Location</a>';
		let dateTimeStr = '<div style="display: flex; align-items: center;"><span class="material-symbols-outlined" style="font-size: 17px;">event</span><div style="padding-left:5px;">'+readableDate+'</div></div>'
		actions.push({"text":"time", "content":'<div>'+dateTimeStr+'</div>'},{"text":"location", "content":'<div>'+location+'</div>'});
		// actions.push({"text": "Archive", "icon": "<span class=\"material-symbols-outlined\" style=\"font-size: 20px;\">library_add</span>",  "actionClass": "activeAction1", "act":"archiveNow('"+contentIdName+"')"});
		// actions.push({"text": "Share", "icon": "<span class=\"material-symbols-outlined\" style=\"font-size: 20px;\">share</span>",  "actionClass": "activeAction1", "act":"shareNow('"+contentIdName+"')"});
		// activeActions.push({"text": "Share"});

		let itemJson = {};

		itemJson = {"id": item.id, "image": image, "title":item.kmclassName, "description":description, "clickAction":"openClass("+item.id+", "+item.courseId+", 'user', "+index+")", "states":states, "actions":actions, "activeActions":activeActions};
		listItems.push(itemJson);
		if(index == items.length-1) {
			let actionAreaStyle="font-size: 0.8em; justify-content: space-between;";
			createList("knowledgemate", htmlContent, listItems, pageable, totalPages, destin, "", "getCourses", "cardStyle", actionAreaStyle);
		}
	}
}

/******************************************************************************************
Name: openClass
Purpose: To view Course page - all the course details and content list when user clicks on a course
******************************************************************************************/

function openClass(classId, courseId, userType, classIndex) {
  $("#modulesMenuArea").hide();
  shared.currentState = "classContent";
  shared.currentSourceState = shared.currentState;

  let currentClass = currentClassList[classIndex];
  userOrVisitor = userType;

  let data = {};
  if ((userType == "visitor") && (mVisitDetailsJSON != null)) {
    data = { "token": mVisitDetailsJSON.token, "courseId": courseId, "userOrVisitor": "visitor" };
  } else if (shared.mCustomerDetailsJSON != null) {
    data = { "token": shared.mCustomerDetailsJSON.token, "courseId": courseId, "userOrVisitor": "user" };
  }

  buildRequestOptions(constructUrl("/courses/getcourseandstatus"), "GET", data).then(request1 => {
    Http.request(request1).then(res1 => {
      if (isValidResponse(res1, "getcourseandstatus") && res1.data) {
        const jqXHR = (typeof res1.data === "string" ? JSON.parse(res1.data) : res1.data);
        const course = jqXHR.course;
        courseContentStatus = jqXHR.status;

        if (course.error != "invalid_token") {
          let htmlContent = "";
          htmlContent += '<div id="knowledgemateClassTitleArea">';
          htmlContent += '<div class="bannerarea">';
          if (course.primaryImage.length) {
            htmlContent += '<img class="cardStyleImage" style="max-height: 200px;" src=' + course.primaryImage + ' onerror="this.onerror=null;this.src=\'./img/noimage.jpg\';" />';
          }
          let classDate = currentClass.dateTime == null ? new Date() : new Date(currentClass.dateTime.replace(' ', 'T'));
          const readableDate = classDate.toLocaleString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true });

          let locationStr = '<a href="#" onclick="window.open(\'https://www.google.com/maps?q=' + currentClass.kmclassroomLocation + '\', \'_blank\')"><div style="display: flex; align-items: center;"><span class="material-symbols-outlined" style="font-size: 17px;">location_on</span><div> View location</div></div></a>';
          let dateTimeStr = '<div style="display: flex; align-items: center;"><span class="material-symbols-outlined" style="font-size: 17px;">event</span><div style="padding-left:5px;">' + readableDate + '</div></div>';

          htmlContent += '<div class="titleFontClass" style="background-color: rgb(240, 240, 240);">' + currentClass.kmclassName + '</div>';
          htmlContent += '<div class="contentDetailText" style="padding-top: 5px;">' + currentClass.description + '</div>';
          htmlContent += '<div class="contentDetailText">' + course.description + '</div>';
          htmlContent += '<div class="contentDetailText" style="display: flex; align-items: center;"><span class="material-symbols-outlined" style="font-size: 17px;">meeting_room</span><div style="padding-left:5px;">' + currentClass.kmclassroomName + '</div>' + locationStr + '</div>';
          htmlContent += '<div class="contentDetailText" style="display: flex; align-items: center;"><span class="material-symbols-outlined" style="font-size: 17px;">interactive_space</span><div style="padding-left:5px;">' + currentClass.trainerFullName + '</div></div>';
          htmlContent += '<div class="contentDetailText" style="display: flex; align-items: center;"><span class="material-symbols-outlined" style="font-size: 17px;">menu_book</span><div style="padding-left:5px;">' + course.courseName + '</div></div>';
          htmlContent += '<div class="contentDetailText">' + dateTimeStr + '</div>';
          htmlContent += '<div class="contentDetailText" style="display: flex; align-items: center;"><span class="material-symbols-outlined" style="font-size: 17px;">schedule</span><div style="padding-left:5px;">' + currentClass.courseDuration + '</div></div>';
          htmlContent += '</div>';
          htmlContent += '</div>';

          htmlContent += '<div class="appFullPage lightBkClass" id="classContentListArea">';
          htmlContent += '<div id="chartTabArea" class="headerTabMenuBtnAreaStyle">';
          htmlContent += '<button id="tab_0" class="tabLinks headerTabMenuBtnStyle" data-linkedcontentareaid="chartArea_0" onclick="openTab(event, 0)">Contents</button>';
          htmlContent += '<button id="tab_1" class="tabLinks headerTabMenuBtnStyle" data-linkedcontentareaid="chartArea_1" onclick="openTab(event, 1)">Participants</button>';
          htmlContent += '</div>';
          htmlContent += '<div id="chartDisplayArea" style="box-sizing: border-box; overflow: auto;">';
          htmlContent += '<div id="chartArea_0" class="chartArea" style="height: fit-content; padding-bottom: 30px;" >';
          htmlContent += '<div id="contentListArea" ><div id="contentListBox" style="padding-bottom: 30px;"></div></div>';
          htmlContent += '</div>';
          htmlContent += '<div id="chartArea_1" class="chartArea" style="height: fit-content; padding-bottom: 30px;" >';
          htmlContent += '<div id="kmclassAttendence" onclick="kmclassAttendence()" style="padding: 15px 15px; background-color: var(--secondary-cyan); margin: 10px 20px; color: var(--primary-white); border-radius: 25px; text-align: center; box-shadow: 1px 1px 3px rgba(0, 0, 0, 0.5);">Start Attendence</div>';
          htmlContent += '<div id="participantListBox" style="padding-bottom: 10px;"></div>';
          htmlContent += '</div>';
          htmlContent += '</div>';
          htmlContent += '</div>';

          $("#modulesListBox").html(htmlContent);
          $("#modulesListBox").css('height', '100%');
          fixModuleHeight("modulesModuleHeader, knowledgemateClassTitleArea, footerSection", 20, "classContentListArea");
          $('#modulesListArea').removeClass('lightBkClass');

          if (courseContentStatus == null) {
            createNewUserCourseStatus(course, userType, jqXHR.contentList);
          } else {
            viewCourseContent(jqXHR.contentList, userType);
          }

          // === 2nd call for class details ===
          const data2 = { "token": shared.mCustomerDetailsJSON.token, "kmclassId": classId };
          buildRequestOptions(constructUrl("/kmclassstudentdevices/restgetkmclassdetails"), "GET", data2).then(request2 => {
            Http.request(request2).then(res2 => {
              if (isValidResponse(res2, "restgetkmclassdetails") && res2.data) {
                const jqXHR2 = (typeof res2.data === "string" ? JSON.parse(res2.data) : res2.data);

                if (jqXHR2.error != "invalid_token") {
                  classDetail = jqXHR2;
                  let participantHtml = "";
                  $.each(classDetail.kmclassstudentdevices, function (key, val) {
                    if (val.deviceType == 'clicker') {
                      participantHtml += '<div id="courseParticipant_' + val.deviceType + '_' + val.clickerNumber + '" class="courseParticipants contentDetailText"><div>' + val.studentType + ': ' + val.studentFullName + '</div><div style="font-size: 0.8em;">' + val.deviceType + ': ' + val.clickerNumber + '</div></div>';
                    } else {
                      participantHtml += '<div id="courseParticipant_' + val.deviceType + '_' + val.deviceId + '" class="courseParticipants contentDetailText"><div>' + val.studentType + ': ' + val.studentFullName + '</div><div style="font-size: 0.8em;">' + val.deviceType + ': ' + val.deviceSerial + '</div></div>';
                    }
                    if (key == classDetail.kmclassstudentdevices.length - 1) {
                      $('#participantListBox').html(participantHtml);
                    }
                  });
                } else {
                  getNewToken("openClass(" + classId + ", " + courseId + ", '" + userType + "', " + classIndex + ")");
                }
                initClicker();
              }
            }).catch(err => console.error("restgetkmclassdetails failed", err));
          }).catch(err => console.warn("Request aborted for restgetkmclassdetails", err));

          miscInfoJson = { "datId": course.id, "content": [] };
          //updateAppRuntime("knowledgeMate", "on", JSON.stringify(miscInfoJson));

        } else {
          getNewToken("openClass(" + classId + ", " + courseId + ", '" + userType + "', " + classIndex + ")");
        }
      }
    }).catch(err => console.error("getcourseandstatus failed", err));
  }).catch(err => console.warn("Request aborted for getcourseandstatus", err));
}

/*********************************************************** CLICKER RESPONSES **********************************************************************/

function kmclassAttendence() {
	let text = $('#kmclassAttendence').html();
	if(text == 'Attendence') {
		$('#kmclassAttendence').html('Finish');
		beginQuiz();
		quizState = 'attendence';
	} else {
		$('#kmclassAttendence').html('Attendence');
		clickerStopQuiz();
		quizState = '';
	}
}

function processClickerResponse(clickerNo, val) {
	val = parseInt(val);
	if(quizState == 'attendence') {
		if(val == 7) {
			//$('#courseParticipant_clicker_'+clickerNo).css('color', 'rgb(50, 100, 200)');
			$('#courseParticipant_clicker_'+clickerNo).addClass('clickResponded');

			var existingIndex = classAttendees.findIndex(item => item.clickerNo == clickerNo);
			if(existingIndex == -1) {		// not found in attendance
				var keypadIndex = classDetail.kmclassstudentdevices.findIndex(item => item.clickerNumber == clickerNo);
				if(keypadIndex != -1) {		// found in claass-Students
					let kmclassstudentdevice = classDetail.kmclassstudentdevices[keypadIndex];
					let userType = kmclassstudentdevice.studentType;
					let userId = kmclassstudentdevice.studentId;
					let userName = kmclassstudentdevice.studentFullName;
					let newAttendee = {"clickerNo":clickerNo, "userType":userType, "userId":userId, "userName":userName};
					classAttendees.push(newAttendee);
				}
			}
		}
	} else if(quizState == 'quiz') {
		let newResult = {"clickerNo":clickerNo, "vals":[val]};

		if(val>0 && val<7) {
			$('#courseParticipant_clicker_'+clickerNo).addClass('clickResponded');
			var existingIndex = classClickerResults.findIndex(item => item.clickerNo == clickerNo);
			if(existingIndex != -1) {		// found
				classClickerResults[existingIndex].vals.push(val);
			} else {
				classClickerResults.push(newResult);
			}
		}
	}
}

function pauseQuiz() {
	clickerStopQuiz();
	$('.courseParticipants').removeClass('clickResponded');
}

function beginQuiz() {
	classClickerResults = [];
	clickerStartQuiz();
}



/******************************************************************** COURSE STATUS ******************************************************************** */

var monitorTimer = null;
var contentDuration = 0;

function getContentDuration(durationStr) {
	let duration = 0;
	if((durationStr != null) && (durationStr.length > 0)) {
		// Convert hh:mm:ss to seconds
		var arr = durationStr.split(':');
		if(arr.length == 3) {
			duration = (+arr[0]) * 60 * 60 + (+arr[1]) * 60 + (+arr[2]);
		} else if(arr.length == 2) {
			duration = ((+arr[0]) * 60 + (+arr[1]));
		} else {
			duration = (+arr[0]);
		}
	} else {
		duration = 300;
	}

	return duration;
}

function stopProgressMonitoring() {
	if(monitorTimer != null) {
		clearInterval(monitorTimer);
		monitorTimer = null;
	}
}
// Progress monitoring for time spent on the running content
function startProgressMonitoring() {

	if(monitorTimer != null) {
		clearInterval(monitorTimer);
	}
	
	var vid = document.getElementById("videoFrame");
	if(vid != null) {
		contentDuration = vid.duration;
	} else {
		contentDuration = getContentDuration(courseContent[runningContentIndex].contentDuration);
	}
	
	monitorTimer = setInterval(monitorProgress, 2000);
}

function monitorProgress() {
	var vid = document.getElementById("videoFrame");

	var contJson = JSON.parse(courseContentStatus.courseState);
	let contentStatus = contJson.contents.find(item => item.contentType==="Content" && item.contentId===courseContent[runningContentIndex].id);
	if(contentStatus != undefined) {
		if(contentStatus.status < 1) {
			contentStatus.status = ((contentDuration * contentStatus.status) + 1)/contentDuration;	// in the range of 0 to 1
			//console.log("durationComplete: "+contentStatus.status);
			courseContentStatus.courseState = JSON.stringify(contJson);

			if(vid != null) {
				console.log("Progress: "+vid.currentTime);
				if(contentStatus.status >= 0.8 &&  vid.currentTime >= (vid.duration * 0.8)) {	// 80% of content is run
					clearInterval(monitorTimer);
					updateCourseStatus();
				}
			} else {
				if(contentStatus.status >= 0.8) {
					clearInterval(monitorTimer);
					updateCourseStatus();
				}
			}
		}
	} else {
		contJson.contents.push(getContentInitJson(courseContent[runningContentIndex]));
		courseContentStatus.courseState = JSON.stringify(contJson);
	}
}

// Running course in completed, update status to 1
function checkCourseStatus() {
	let contentCompletedCount = 0;
	var contJson = JSON.parse(courseContentStatus.courseState);
	for(var index in courseContent) {
		var content = courseContent[index];
		var cont = contJson.contents.find(item => (item.contentId == content.id && item.contentType == content.contentType));
		if(cont != null && cont.status == 1) {
			contentCompletedCount++;
		}
		if(index == courseContent.length-1) {
			if(contentCompletedCount == courseContent.length) {		// all the contents has been completed
				$("#courseComplete").show();
			}
		}
	}
}

function updateCourseStatus() {
  if (userOrVisitor != "kmclass") {
    let url = "/api/restsaveusercoursestate";
    if (userOrVisitor == "visitor") {
      url = "/visitorvisits/restsavevisitorcoursestate";
    }
    const data = { "courseData": JSON.stringify(courseContentStatus) };
    RequestOptions(constructUrl(url), "POST", data).then(request => {
      Http.request(request).then(res => {
        if (isValidResponse(res, url) && res.data) {
          console.log("Content Status save - " + JSON.stringify(res.data));
          $("#loadingSpinner").hide();
        }
      }).catch(err => console.error(url + " failed", err));
    }).catch(err => console.warn("Request aborted for " + url, err));
  } else {
    let url = "/api/restsaveclasscoursestate";
    const data = { "courseData": JSON.stringify(courseContentStatus), "classAttendees": JSON.stringify(classAttendees) };
    RequestOptions(constructUrl(url), "POST", data).then(request => {
      Http.request(request).then(res => {
        if (isValidResponse(res, url) && res.data) {
          console.log("Content Status save - " + JSON.stringify(res.data));
          $("#loadingSpinner").hide();
        }
      }).catch(err => console.error(url + " failed", err));
    }).catch(err => console.warn("Request aborted for " + url, err));
  }
  checkCourseStatus();
}

function startKmAliveInterval() {
	if(kmContentAliveInterval != null) {
		clearInterval(kmContentAliveInterval);
	}
	kmContentAliveInterval =  setInterval(updateKmAlive, 10000);
}
function stopKmAliveInterval() {
	if(kmContentAliveInterval != null) {
		clearInterval(kmContentAliveInterval);
		kmContentAliveInterval = null;
	}
}
function updateKmAlive() {
    console.log("Km Alive Ping:");
	//updateAppRuntime("knowledgeMate", "alive", JSON.stringify(miscInfoJson));
}


function HighlightList(contentType, contentId) {
	var contJson = JSON.parse(courseContentStatus.courseState);
	var elements = document.getElementsByClassName("coursecontentlist");
	
	var index = 0;
	for(elem of elements) {

		if(elem.id == 'list_'+contentType+'_'+contentId) {
			// $("#currentPlayingIndicator_"+elem.id).html('<span><i class="far fa-hand-point-right"></i></span>');
			$("#currentPlayingIndicator_"+elem.id).addClass("running");
			$("#currentPlayingContentName_"+elem.id).addClass("running");
			$("#currentPlayingContentDuration_"+elem.id).addClass("running");
		} else {
			$("#currentPlayingIndicator_"+elem.id).html('<span><i class="far fa-square"></i></span>');
			$("#currentPlayingIndicator_"+elem.id).removeClass("running");
			$("#currentPlayingContentName_"+elem.id).removeClass("running");
			$("#currentPlayingContentDuration_"+elem.id).removeClass("running");
		}

		if(contJson.contents[index].status != 0) {
			$("#currentPlayingIndicator_"+elem.id).html('<span><i class="far fa-check-square"></i></span>');
		}
		index++;
	}
}

/******************************************************************** ASSESSMENT in COURSE PAGE ******************************************************************** */

async function shuffleIndex(arrLen) {
	var numberArr = [];
	// Create an array with all the numbers between 0 and the Length
	for(var i=0; i<arrLen; i++) {
		numberArr[i] = i;
	}
	// Generate 2 random index numbers between  0 and the Length, and then switch those two numbers at the indexes
	// do it repeatedly for length times
	for(var i=0; i<arrLen/2; i++) {
		var firstIndex = Math.floor(Math.random() * arrLen);
		var secondIndex = Math.floor(Math.random() * arrLen);
		//console.log("firstIndex: "+firstIndex+", secondIndex: "+secondIndex);
		var tempVal = numberArr[firstIndex];
		numberArr[firstIndex] = numberArr[secondIndex];
		numberArr[secondIndex] = tempVal;
	}
	return numberArr;
}

function showAssessment(id, repeat) {
  // Pause all video players
  const players = document.getElementsByTagName("video");
  for (let player of players) {
    player.pause();
  }

  // Build token + request data
  let data = {};
  if (userOrVisitor === "visitor" && mVisitDetailsJSON != null) {
    data = { token: mVisitDetailsJSON.token, assessmentId: id };
  } else if (shared.mCustomerDetailsJSON != null) {
    data = { token: shared.mCustomerDetailsJSON.token, assessmentId: id };
  }

  // === Step 1: getassessmentbyid ======================================
  buildRequestOptions(constructUrl("/api/getassessmentbyid"), "GET", data)
    .then((request) => {
      Http.request(request)
        .then((res) => {
          if (isValidResponse(res, "getassessmentbyid")) {
            testContent =
              typeof res.data === "string" ? JSON.parse(res.data) : res.data;

            if (testContent.error !== "invalid_token") {
              // === Step 2: check assessment state =====================
              let url = "/api/restgetuserassessmentstate";
              if (userOrVisitor === "visitor") {
                url = "/visitorvisits/restgetvisitorassessmentstate";
              }

              buildRequestOptions(constructUrl(url), "GET", data)
                .then((request1) => {
                  Http.request(request1)
                    .then((res1) => {
                      if (isValidResponse(res1, url)) {
                        const jqXHR1 =
                          typeof res1.data === "string"
                            ? JSON.parse(res1.data)
                            : res1.data;

                        if (
                          jqXHR1 == null ||
                          (jqXHR1 != null &&
                            jqXHR1.error !== "invalid_token" &&
                            jqXHR1.error !== "invalid_user")
                        ) {
                          // test state
                          const takenTest = jqXHR1;

                          let htmlContent = "";
                          htmlContent +=
                            '<div id="contentNameField" class="titleFontClass" style="background-color: rgb(240, 240, 240);">' +
                            testContent.title +
                            "</div>";
                          htmlContent +=
                            '<div id="contentDescriptionField" class="contentDetailText" style="padding-top: 5px;">' +
                            testContent.description +
                            "</div>";

                          if (testContent.timeLimitEnable === true) {
                            htmlContent +=
                              '<div class="contentDetailText" style="display: flex; align-items: center;"><span class="material-symbols-outlined" style="font-size: 17px;">schedule</span><div style="padding-left:5px;">' +
                              testContent.timeLimit +
                              "</div></div>";
                          }

                          htmlContent += '<div id="assessmentBox"></div>';
                          htmlContent +=
                            '<div class="qpaperfooter" id="qPaperFooter"></div>';
                          document.getElementById(
                            "modules_contentViewBox"
                          ).innerHTML = htmlContent;

                          // === Step 3: fetch assessment questions if needed ======
                          if (
                            takenTest == null ||
                            repeat === true ||
                            userOrVisitor === "kmclass"
                          ) {
                            buildRequestOptions(
                              constructUrl("/api/getassessmentquestions"),
                              "GET",
                              data
                            )
                              .then((request2) => {
                                Http.request(request2)
                                  .then((res2) => {
                                    if (
                                      isValidResponse(
                                        res2,
                                        "getassessmentquestions"
                                      )
                                    ) {
                                       var assessmentQuestions =
                                        typeof res2.data === "string"
                                          ? JSON.parse(res2.data)
                                          : res2.data;

                                      testQuestions = assessmentQuestions;
                                      questionCount = 0;
                                      assessmentResult = {};

                                      if (
                                        assessmentQuestions &&
                                        assessmentQuestions.length > 0
                                      ) {
                                        // Footer buttons
                                        let footerHtml = "";
                                        if (testContent.backAllowed === true) {
                                          footerHtml +=
                                            '<div id="assessmentBackBtn" class="btnStyle" onclick="getBackAssessment()">Back <i class="fas fa-arrow-left"></i></div>';
                                        } else {
                                          footerHtml += "<div></div>";
                                        }
                                        if (userOrVisitor === "kmclass") {
                                          footerHtml +=
                                            '<div id="submitBtn" class="btnStyle" onclick="getClassroomAnswers(false)">Next <i class="fas fa-arrow-right"></i></div>';
                                        } else {
                                          footerHtml +=
                                            '<div id="submitBtn" class="btnStyle" onclick="getSubmittedAnswer(false)">Submit <i class="fas fa-arrow-right"></i></div>';
                                        }

                                        document.getElementById(
                                          "qPaperFooter"
                                        ).innerHTML = footerHtml;

                                        // Timer logic
                                        if (testContent.timeLimitEnable) {
                                          const timeArr =
                                            testContent.timeLimit.split(":");
                                          if (timeArr.length > 2) {
                                            timeLimit =
                                              +timeArr[0] * 3600 +
                                              +timeArr[1] * 60 +
                                              +timeArr[2];
                                          } else if (timeArr.length > 1) {
                                            timeLimit =
                                              +timeArr[0] * 60 + +timeArr[1];
                                          } else {
                                            timeLimit = +timeArr[0];
                                          }
                                          countDownTimer = setInterval(
                                            assessmentCountdownTimerHandler,
                                            1000
                                          );
                                        }

                                        // Shuffle sequence and start questions
                                        shuffleIndex(
                                          assessmentQuestions.length
                                        ).then((numArr) => {
                                          qSequence = numArr;
                                          console.log(
                                            "qSequence: " + qSequence
                                          );
                                          getQuestions();
                                        });

                                        miscInfoJson.content[0] = {
                                          id: testContent.id,
                                          name: testContent.assessmentName,
                                          type: "Assessment",
                                        };
                                        // updateAppRuntime(
                                        //   "knowledgeMate",
                                        //   "on",
                                        //   JSON.stringify(miscInfoJson)
                                        // );
                                      }
                                    }
                                  })
                                  .catch((err2) => {
                                    console.error(
                                      "getassessmentquestions failed",
                                      err2
                                    );
                                  });
                              })
                              .catch((err2) => {
                                console.warn(
                                  "Request aborted: getassessmentquestions",
                                  err2
                                );
                              });
                          } else {
                            // Already taken -> show report
                            assessmentResult = JSON.parse(
                              takenTest.assessmentState
                            );
                            showReport(false);
                            document.getElementById(
                              "loadingSpinner"
                            ).style.display = "none";
                          }
                        } else {
                          if (jqXHR1.error === "invalid_token") {
                            getNewToken(`showAssessment(${id}, ${repeat})`);
                          } else {
                            showDialog("ERROR! " + jqXHR1.error);
                          }
                        }
                      }
                    })
                    .catch((err1) => {
                      console.error("restgetuserassessmentstate failed", err1);
                    });
                })
                .catch((err1) => {
                  console.warn("Request aborted: restgetuserassessmentstate", err1);
                });
            } else {
              // Token expired
              getNewToken(`showAssessment(${id}, ${repeat})`);
            }
          }
        })
        .catch((err) => {
          console.error("getassessmentbyid failed", err);
        });
    })
    .catch((err) => {
      console.warn("Request aborted: getassessmentbyid", err);
    });
}


function assessmentCountdownTimerHandler() {
	timeLimit--;
	
	if((timeLimit < 60) && ($("#assessmentTime").hasClass("warningText") == false)) {
		$("#assessmentTime").addClass("warningText");
	}

	var timeStr = new Date(timeLimit*1000).toISOString().substr(11, 8);
	$("#assessmentTime").html(timeStr);
	if(timeLimit == 0) {
		//questionCount = testQuestions.length;
		getSubmittedAnswer(true);
		
		//showReport();
	}
}

function getBackAssessment() {
	if(questionCount > 1) {
		questionCount -= 2;
		getQuestions();
	} else {
		showAssessment(testContent.id, false);
	}
}

function getQuestions() {
  let htmlContent = "";

  if (testContent.oneQuestionAtATime === true || userOrVisitor === "kmclass") {
    let qIndex = questionCount;
    if (testContent.randomizeQuestionSequence === true) {
      qIndex = qSequence[questionCount];
    }

    if (questionCount < testQuestions.length) {
      questionCount++;

      let data = {};
      if (userOrVisitor === "visitor" && mVisitDetailsJSON != null) {
        data = { token: mVisitDetailsJSON.token, questionId: testQuestions[qIndex].questionId };
      } else if (shared.mCustomerDetailsJSON != null) {
        data = { token: shared.mCustomerDetailsJSON.token, questionId: testQuestions[qIndex].questionId };
      }

      buildRequestOptions(constructUrl("/api/getquestionbyid"), "GET", data).then(request => {
        Http.request(request).then(res => {
          if (isValidResponse(res, "getquestionbyid")) {
            const obj = typeof res.data === "string" ? JSON.parse(res.data) : res.data;

            if (obj.error !== "invalid_token") {
              htmlContent += '<div class="assessmentquestioanswerbox">';

              // === Question image ===
              if (obj.questionImage.length > 0) {
                let objectKey = obj.questionImage;
                if (objectKey.startsWith(s3PrivateUrl)) {
                  objectKey = objectKey.replace(s3PrivateUrl, "");
                  getSignedUrl(objectKey, 10).then(url => {
                    if (url.startsWith("http")) {
                      htmlContent += `<img class="assessmentquestion" src="${url}" onerror="this.onerror=null;this.src='./img/noimage.jpg';" />`;
                    }
                  });
                } else {
                  htmlContent += `<img class="assessmentquestion" src="${obj.questionImage}" onerror="this.onerror=null;this.src='./img/noimage.jpg';" />`;
                }
              }

              // === Question text ===
              htmlContent += `<div class="assessmentquestion">${questionCount}. ${obj.questionName}</div>`;

              const choiceArr = obj.choices.split("#");
              let hasAnswer = "";
              let ansArray = [];

              if (assessmentResult != null && assessmentResult.content !== undefined && assessmentResult.content.length >= questionCount) {
                hasAnswer = assessmentResult.content[questionCount - 1].A;
                ansArray = hasAnswer.split("#");
              }

              if (testContent.randomizeAnswerSequence === true) {
                shuffleIndex(choiceArr.length).then(aSequence => {
                  let newChoiceArr = [];

                  for (let i = 0; i < choiceArr.length; i++) {
                    const aIndex = aSequence[i];
                    const choice = choiceArr[aIndex];
                    newChoiceArr.push(choice);

                    if (ansArray.includes(choice)) {
                      if (obj.multipleAnswer) {
                        htmlContent += `<input class="assessmentanswer" type="checkbox" id="q${obj.id}a${aIndex}" name="q${obj.id}" value="${choice}" checked><label for="q${obj.id}a${aIndex}" class="assessmentanswerlabel">${choice}</label><br>`;
                      } else {
                        htmlContent += `<input class="assessmentanswer" type="radio" id="q${obj.id}a${aIndex}" name="q${obj.id}" value="${choice}" checked><label for="q${obj.id}a${aIndex}" class="assessmentanswerlabel">${choice}</label><br>`;
                      }
                    } else {
                      if (obj.multipleAnswer) {
                        htmlContent += `<input class="assessmentanswer" type="checkbox" id="q${obj.id}a${aIndex}" name="q${obj.id}" value="${choice}"><label for="q${obj.id}a${aIndex}" class="assessmentanswerlabel">${choice}</label><br>`;
                      } else {
                        htmlContent += `<input class="assessmentanswer" type="radio" id="q${obj.id}a${aIndex}" name="q${obj.id}" value="${choice}"><label for="q${obj.id}a${aIndex}" class="assessmentanswerlabel">${choice}</label><br>`;
                      }
                    }

                    if (i === choiceArr.length - 1) {
                      mcqChoices[questionCount - 1] = newChoiceArr;
                      mcqAnswers[questionCount - 1] = obj.answers.split("#");
                      htmlContent += "</div>";
                      document.getElementById("assessmentBox").innerHTML = htmlContent;

                      if (userOrVisitor === "kmclass") {
                        beginQuiz();
                        quizState = "quiz";
                      }
                    }
                  }
                });
              } else {
                for (let i = 0; i < choiceArr.length; i++) {
                  const aIndex = i;
                  const choice = choiceArr[aIndex];

                  if (ansArray.includes(choice)) {
                    if (obj.multipleAnswer) {
                      htmlContent += `<input class="assessmentanswer" type="checkbox" id="q${obj.id}a${aIndex}" name="q${obj.id}" value="${choice}" checked><label for="q${obj.id}a${aIndex}" class="assessmentanswerlabel">${choice}</label><br>`;
                    } else {
                      htmlContent += `<input class="assessmentanswer" type="radio" id="q${obj.id}a${aIndex}" name="q${obj.id}" value="${choice}" checked><label for="q${obj.id}a${aIndex}" class="assessmentanswerlabel">${choice}</label><br>`;
                    }
                  } else {
                    if (obj.multipleAnswer) {
                      htmlContent += `<input class="assessmentanswer" type="checkbox" id="q${obj.id}a${aIndex}" name="q${obj.id}" value="${choice}"><label for="q${obj.id}a${aIndex}" class="assessmentanswerlabel">${choice}</label><br>`;
                    } else {
                      htmlContent += `<input class="assessmentanswer" type="radio" id="q${obj.id}a${aIndex}" name="q${obj.id}" value="${choice}"><label for="q${obj.id}a${aIndex}" class="assessmentanswerlabel">${choice}</label><br>`;
                    }
                  }

                  if (i === choiceArr.length - 1) {
                    mcqChoices[questionCount - 1] = choiceArr;
                    mcqAnswers[questionCount - 1] = obj.answers.split("#");
                    htmlContent += "</div>";
                    document.getElementById("assessmentBox").innerHTML = htmlContent;

                    if (userOrVisitor === "kmclass") {
                      beginQuiz();
                      quizState = "quiz";
                    }
                  }
                }
              }
            } else {
              getNewToken("getQuestions()");
            }
          }
        }).catch(err => {
          console.error("getquestionbyid failed", err);
        });
      }).catch(err => {
        console.warn("Request aborted due to missing requestOptions.", err);
      });

    } else {
      if (userOrVisitor === "kmclass") {
        pauseQuiz();
      }
    }
  } else {
    // === Multiple questions case ===
    function nextAjax(idx) {
      let qIndex = idx;
      if (testContent.randomizeQuestionSequence === true) {
        qIndex = qSequence[idx];
      }

      console.log(`qIndex: ${qIndex}, QuestionId: ${testQuestions[qIndex].questionId}, QuestionName: ${testQuestions[qIndex].questionName}`);

      let data = {};
      if (userOrVisitor === "visitor" && mVisitDetailsJSON != null) {
        data = { token: mVisitDetailsJSON.token, questionId: testQuestions[qIndex].questionId };
      } else if (shared.mCustomerDetailsJSON != null) {
        data = { token: shared.mCustomerDetailsJSON.token, questionId: testQuestions[qIndex].questionId };
      }

      buildRequestOptions(constructUrl("/api/getquestionbyid"), "GET", data).then(request => {
        Http.request(request).then(res => {
          if (isValidResponse(res, "getquestionbyid")) {
            const obj = typeof res.data === "string" ? JSON.parse(res.data) : res.data;

            if (obj.error !== "invalid_token") {
              console.log(`QuestionId: ${obj.id}, QuestionName: ${obj.questionName}`);
              questionCount++;

              htmlContent += '<div class="assessmentquestioanswerbox">';

              if (obj.questionImage.length > 0) {
                let objectKey = obj.questionImage;
                if (objectKey.startsWith(s3PrivateUrl)) {
                  objectKey = objectKey.replace(s3PrivateUrl, "");
                  getSignedUrl(objectKey, 10).then(url => {
                    if (url.startsWith("http")) {
                      htmlContent += `<img class="assessmentquestion" src="${url}" onerror="this.onerror=null;this.src='./img/noimage.jpg';">`;
                    }
                  });
                } else {
                  htmlContent += `<img class="assessmentquestion" src="${obj.questionImage}" onerror="this.onerror=null;this.src='./img/noimage.jpg';" />`;
                }
              }

              htmlContent += `<div class="assessmentquestion">${questionCount}. ${obj.questionName}</div>`;
              const choiceArr = obj.choices.split("#");

              if (testContent.randomizeAnswerSequence === true) {
                shuffleIndex(choiceArr.length).then(aSequence => {
                  for (let i = 0; i < choiceArr.length; i++) {
                    const aIndex = aSequence[i];
                    const choice = choiceArr[aIndex];

                    if (obj.multipleAnswer) {
                      htmlContent += `<input class="assessmentanswer" type="checkbox" id="q${obj.id}a${aIndex}" name="q${obj.id}" value="${choice}"><label for="q${obj.id}a${aIndex}" class="assessmentanswerlabel">${choice}</label><br>`;
                    } else {
                      htmlContent += `<input class="assessmentanswer" type="radio" id="q${obj.id}a${aIndex}" name="q${obj.id}" value="${choice}"><label for="q${obj.id}a${aIndex}" class="assessmentanswerlabel">${choice}</label><br>`;
                    }

                    if (i === choiceArr.length - 1) {
                      mcqAnswers[questionCount - 1] = obj.answers.split("#");
                      htmlContent += "</div>";

                      if (idx === testQuestions.length - 1) {
                        document.getElementById("assessmentBox").innerHTML = htmlContent;
                        document.getElementById("loadingSpinner").style.display = "none";
                      } else {
                        nextAjax(idx + 1);
                      }
                    }
                  }
                });
              } else {
                for (let i = 0; i < choiceArr.length; i++) {
                  const aIndex = i;
                  const choice = choiceArr[aIndex];

                  if (obj.multipleAnswer) {
                    htmlContent += `<input class="assessmentanswer" type="checkbox" id="q${obj.id}a${aIndex}" name="q${obj.id}" value="${choice}"><label for="q${obj.id}a${aIndex}" class="assessmentanswerlabel">${choice}</label><br>`;
                  } else {
                    htmlContent += `<input class="assessmentanswer" type="radio" id="q${obj.id}a${aIndex}" name="q${obj.id}" value="${choice}"><label for="q${obj.id}a${aIndex}" class="assessmentanswerlabel">${choice}</label><br>`;
                  }

                  if (i === choiceArr.length - 1) {
                    mcqAnswers[questionCount - 1] = obj.answers.split("#");
                    htmlContent += "</div>";

                    if (idx === testQuestions.length - 1) {
                      document.getElementById("assessmentBox").innerHTML = htmlContent;
                      document.getElementById("loadingSpinner").style.display = "none";
                    } else {
                      nextAjax(idx + 1);
                    }
                  }
                }
              }
            } else {
              getNewToken("getQuestions()");
            }
          }
        }).catch(err => {
          console.error("getquestionbyid failed", err);
        });
      }).catch(err => {
        console.warn("Request aborted due to missing requestOptions.", err);
      });
    }

    nextAjax(0);
  }
}




function getClassroomAnswers(timeout) {
	var score = 0;
	pauseQuiz();
	quizState = '';

	var qIndex = questionCount-1;
	if(testContent.randomizeQuestionSequence == true) {
		qIndex = qSequence[questionCount-1];
	}
	
	if(questionCount <= testQuestions.length) {
		var ansArray = [];
		if(mcqAnswers.length > questionCount-1) {
			ansArray = mcqAnswers[questionCount-1];

			$.each(classClickerResults, function(index, clickerResult) {
				var ansIndex = 0;
				var correctAnswerCount = 0;
				let answerString = '';
				answerString += '{"Q":"'+testQuestions[qIndex].questionName+'",';
				answerString += '"QID":"'+testQuestions[qIndex].questionId+'",';
				console.log("Question: "+testQuestions[qIndex].questionName);
				//var elements = document.getElementsByName('q'+testQuestions[qIndex].questionId);
				answerString += '"A": "';
				
				$.each(clickerResult.vals, function(key, val) {
					if(ansIndex != 0) {
						answerString += '#';
					}
					if(mcqChoices[questionCount-1].length > val-1) {
						answerString += mcqChoices[questionCount-1][val-1];	// clicker values starts from 1
						if(ansArray.includes(mcqChoices[questionCount-1][val-1])) {
							correctAnswerCount++;
						} else {
							correctAnswerCount--;
						}
					} else {
						correctAnswerCount--;
					}

					if(key == clickerResult.vals.length - 1) {	// All results captured for the question

						var weightage = 1;
						if((testContent.variableWeightage == true) && (testQuestions[qIndex].weightage != null)) {
							weightage = testQuestions[qIndex].weightage;
						}

						if(ansIndex == 0) {
							score = 0;
						} else {
							if(correctAnswerCount < 0) {
								correctAnswerCount = 0;
							}
							score = weightage*(correctAnswerCount/ansArray.length);
						}
						answerString += '",'
						answerString += '"RA":"'+mcqAnswers[questionCount-1].join('#')+'",';
						answerString += '"W":'+weightage+',';
						answerString += '"score": '+score+'}';


						var existingIndex = classAssessmentResult.findIndex(item => item.clickerNo == clickerResult.clickerNo);
						if(existingIndex != -1) {		// found
							if(questionCount-1 == 0) {
								assessmentResult = {"content":[]};
							} else {
								assessmentResult = classAssessmentResult[existingIndex];
							}
							let assessmentStateJson = JSON.parse(classAssessmentResult[existingIndex].assessmentResult.assessmentState);
							assessmentStateJson.content[questionCount-1] = JSON.parse(answerString);

							classAssessmentResult[existingIndex].assessmentResult.assessmentState = JSON.stringify(assessmentStateJson);
						} else {		// New
							assessmentResult = {"content":[]};
							assessmentResult.content[questionCount-1] = JSON.parse(answerString);
							var keypadIndex = classDetail.kmclassstudentdevices.findIndex(item => item.clickerNumber == clickerResult.clickerNo);
							kmclassstudentdevice = classDetail.kmclassstudentdevices[keypadIndex];
							let userType = kmclassstudentdevice.studentType;
							let userId = kmclassstudentdevice.studentId;
							let userName = kmclassstudentdevice.studentFullName;
							//let courseId = classDetail.kmclass.courseId;
							//let courseName = classDetail.kmclass.courseName;
							let result = {

								"assessmentResult" : {
									"id": null,
									"userId": userId,
									"userName": userName,
									"assessmentId": testContent.id,
									"assessmentName": testContent.assessmentName,
									"assessmentState": JSON.stringify(assessmentResult)
								},
								"userType": userType,
								"clickerNo": clickerResult.clickerNo, 
								//"courseId": courseId, 
								//"courseName": courseName, 
							};
							classAssessmentResult.push(result);
						}

						if(index == classClickerResults.length-1) {
							if(questionCount == testQuestions.length) {
								//var date = new Date();
								//classAssessmentResult['date'] = date;
								console.log("Answer: "+JSON.stringify(classAssessmentResult));
								showReport(true);
							} else {
								getQuestions();
							}
						}
					}
				});
			});
		}

		/*if(questionCount == testQuestions.length) {
			//var date = new Date();
			//classAssessmentResult['date'] = date;
			console.log("Answer: "+JSON.stringify(classAssessmentResult));
			clickerStopQuiz();
		} else {
			if(timeout == true) {
				for(var idx=questionCount-1; idx<testQuestions.length; idx++) {
					var qIndex = idx;
					if(testContent.randomizeQuestionSequence == true) {
						qIndex = qSequence[idx];
					}
					if(idx == 0) {
						//answerString += '{"content": [';
						assessmentResult = {"content":[]};
					} else {
						//answerString += ',';
					}

					let answerString = '';
					answerString += '{"Q":"'+testQuestions[qIndex].questionName+'",';
					answerString += '"QID":"'+testQuestions[qIndex].questionId+'",';
					answerString += '"A": "",';
					answerString += '"RA":"",';
					answerString += '"W":'+weightage+',';
					answerString += '"score": 0}';

					assessmentResult.content[idx] = JSON.parse(answerString);
					if(idx == testQuestions.length-1) {
						//answerString += '],';
						var date = new Date();
						//answerString += '"date":"'+date+'"}';
						//console.log("Answer String: "+answerString);
						//assessmentResult = JSON.parse(answerString);
						assessmentResult['date'] = date;
						console.log("Answer: "+JSON.stringify(assessmentResult));
						showReport(true);
					}
				}
			} else {
				if(testContent.showResultEach == true && userOrVisitor != 'kmclass') {
					verifyAnswer(score, weightage, ansArray, 'getQuestions');
				} else {
					getQuestions();
				}
			}
		}*/
	}
}

function getSubmittedAnswer(timeout)  {
	var score = 0;

	if(testContent.oneQuestionAtATime == true || userOrVisitor == 'kmclass') {
		var qIndex = questionCount-1;
		if(testContent.randomizeQuestionSequence == true) {
			qIndex = qSequence[questionCount-1];
		}
		
		if(questionCount-1 == 0) {
			//answerString += '{"content": [';
			assessmentResult = {"content":[]};
		} else {
			//answerString += ',';
		}
		
		if(questionCount <= testQuestions.length) {
			let answerString = '';
			answerString += '{"Q":"'+testQuestions[qIndex].questionName+'",';
			answerString += '"QID":"'+testQuestions[qIndex].questionId+'",';
			console.log("Question: "+testQuestions[qIndex].questionName);
			var elements = document.getElementsByName('q'+testQuestions[qIndex].questionId);
			var ansIndex = 0;
			var correctAnswerCount = 0;
			
			answerString += '"A": "';
			var ansArray = [];
			if(mcqAnswers.length > questionCount-1) {
				ansArray = mcqAnswers[questionCount-1];
				$.each(elements, function(key, elem) { 
					if (elem.checked) {
						if(ansIndex != 0) {
							answerString += '#';
						}
						answerString += elem.value;
						if(ansArray.includes(elem.value)) {
							correctAnswerCount++;
						} else {
							correctAnswerCount--;
						}
						ansIndex++;
						//console.log(elem.value + ', ');  	
					}
	
					//if(key == elements.length-1) {
					//	answerString += ']}';
					//}
				});
			}

			var weightage = 1;
			if((testContent.variableWeightage == true) && (testQuestions[qIndex].weightage != null)) {
				weightage = testQuestions[qIndex].weightage;
			}

			if(ansIndex == 0) {
				score = 0;
			} else {
				if(correctAnswerCount < 0) {
					correctAnswerCount = 0;
				}
				score = weightage*(correctAnswerCount/ansArray.length);
			}
			answerString += '",'
			answerString += '"RA":"'+mcqAnswers[questionCount-1].join('#')+'",';
			answerString += '"W":'+weightage+',';
			answerString += '"score": '+score+'}';
			
			assessmentResult.content[questionCount-1] = JSON.parse(answerString);
			
			if(questionCount == testQuestions.length) {
				//answerString += '],';
				var date = new Date();
				//answerString += '"date":"'+date+'"}';
				//console.log("Answer String: "+answerString);
				//assessmentResult = JSON.parse(answerString);
				assessmentResult['date'] = date;
				console.log("Answer: "+JSON.stringify(assessmentResult));

				if(testContent.showResultEach == true && userOrVisitor != 'kmclass') {
					verifyAnswer(score, weightage, ansArray, 'showReport');
				} else {
					showReport(true);
				}

			} else {
				if(timeout == true) {
					for(var idx=questionCount-1; idx<testQuestions.length; idx++) {
						var qIndex = idx;
						if(testContent.randomizeQuestionSequence == true) {
							qIndex = qSequence[idx];
						}
						if(idx == 0) {
							//answerString += '{"content": [';
							assessmentResult = {"content":[]};
						} else {
							//answerString += ',';
						}

						let answerString = '';
						answerString += '{"Q":"'+testQuestions[qIndex].questionName+'",';
						answerString += '"QID":"'+testQuestions[qIndex].questionId+'",';
						answerString += '"A": "",';
						answerString += '"RA":"",';
						answerString += '"W":'+weightage+',';
						answerString += '"score": 0}';

						assessmentResult.content[idx] = JSON.parse(answerString);
						if(idx == testQuestions.length-1) {
							//answerString += '],';
							var date = new Date();
							//answerString += '"date":"'+date+'"}';
							//console.log("Answer String: "+answerString);
							//assessmentResult = JSON.parse(answerString);
							assessmentResult['date'] = date;
							console.log("Answer: "+JSON.stringify(assessmentResult));
							showReport(true);
						}
					}
				} else {
					if(testContent.showResultEach == true && userOrVisitor != 'kmclass') {
						verifyAnswer(score, weightage, ansArray, 'getQuestions');
					} else {
						getQuestions();
					}
				}
			}
		}

	} else {	//testContent.oneQuestionAtATime == false

		for(var idx=0; idx<testQuestions.length; idx++) {
			var qIndex = idx;
			if(testContent.randomizeQuestionSequence == true) {
				qIndex = qSequence[idx];
			}
			
			if(idx == 0) {
				assessmentResult = {"content":[]};
				//answerString += '{"content": [';
			} else {
				//answerString += ',';
			}
			let answerString = '';
			answerString += '{"Q":"'+testQuestions[qIndex].questionName+'",';
			answerString += '"QID":"'+testQuestions[qIndex].questionId+'",';
			//console.log("Question: "+testQuestions[qIndex].questionName);
			var elements = document.getElementsByName('q'+testQuestions[qIndex].questionId);
			var ansIndex = 0;
			var correctAnswerCount = 0;
			
			answerString += '"A": "';
			var ansArray = [];
			if(mcqAnswers.length > idx) {
				ansArray = mcqAnswers[idx];
				$.each(elements, function(key, elem) {
					if (elem.checked) {
						if(ansIndex != 0) {
							answerString += '#';
						}
						answerString += elem.value;
						if(ansArray.includes(elem.value)) {
							correctAnswerCount++;
						} else {
							correctAnswerCount--;
						}
						ansIndex++;
						//console.log(elem.value + ', ');
					}
	
					//if(key == elements.length-1) {
					//	answerString += '"';
					//}
				});
			}
						
			var weightage = 1;
			if((testContent.variableWeightage == true) && (testQuestions[qIndex].weightage != null)) {
				weightage = testQuestions[qIndex].weightage;
			}
			// if no answer selected
			if(ansIndex == 0) {
				score = 0;
			} else {
				if(correctAnswerCount < 0) {
					correctAnswerCount = 0;
				}
				score = weightage*(correctAnswerCount/ansArray.length);
			}
			answerString += '",'
			answerString += '"RA":"'+mcqAnswers[idx].join('#')+'",';
			answerString += '"W":'+weightage+',';
			answerString += '"score": '+score+'}';
			
			assessmentResult.content[idx] = JSON.parse(answerString);
			
			if(idx == testQuestions.length-1) {
				//answerString += '],';
				var date = new Date();
				//answerString += '"date":"'+date+'"}';
				//console.log("Answer String: "+answerString);
				//assessmentResult = JSON.parse(answerString);
				assessmentResult['date'] = date;
				console.log("Answer: "+JSON.stringify(assessmentResult));
				showReport(true);
			}

			//htmlContent += '<hr>';
		}
	}
}

function verifyAnswer(score, weightage, ansArray, callback) {
	let text = '';
	if(score == 0) {
		text += 'Incorrect answer.'; 
	} else if (score < weightage) {
		text += 'Partially correct answer.';
	} else {
		text += 'Correct answer.';
	}
	if(testContent.showCorrectAnswer == true) {
		text += " Right Answer: "+ansArray;
	}
	
	if(callback == 'showReport') {
		showDialog(text, "showReport(true)");
	} else if(callback == 'getQuestions') {
		showDialog(text, "getQuestions()");
	}
}

function showReport(saveData) {
	if (countDownTimer) {
		clearInterval(countDownTimer);
	}

	if (userOrVisitor == 'kmclass') {
		let htmlContent = "";
		htmlContent += '<div id="assessmentReportArea">';
		htmlContent += '<div class="assessmentresulttext">"' + testContent.assessmentName + '" Assessment completed. Please verify your scores individually.</div>';

		if (saveData === true) {
			saveClassAssessmentState();
		}

		htmlContent += '</div>';
		htmlContent += '<div class="qpaperfooter" id="qPaperFooter">';
		htmlContent += '<div id="takeTestBtn" class="btnStyle" onclick="showAssessment(' + testContent.id + ', true)">Take test Again</div>';
		if (testContent.showResultAll === true) {
			htmlContent += '<div id="detailedReportBtn" class="btnStyle" onclick="getDetailedReport()">Test Report</div>';
		}
		htmlContent += '</div>';

		$("#assessmentBox").html(htmlContent);
	} else {
		let percentage = 0;
		let totalScore = 0;
		let totalWeightage = 0;

		for (let count = 0; count < assessmentResult.content.length; count++) {
			if (assessmentResult.content[count] !== undefined) {
				totalScore += assessmentResult.content[count].score;
				if (assessmentResult.content[count].W !== undefined) {
					totalWeightage += assessmentResult.content[count].W;
				}
			}
		}

		if (testContent.variableWeightage === true) {
			if (totalWeightage === 0) {
				if (testQuestions == null) {
					const data = { assessmentId: id };
					const url = "/assessmentquestions/getassessmentquestionsforassessment";

					buildRequestOptions(url, "GET", data).then(request => {
						Http.request(request).then(res => {
							if (isValidResponse(res, "getassessmentquestionsforassessment") && res.data) {
								testQuestions = (typeof res.data === "string" ? JSON.parse(res.data) : res.data);

								for (let idx = 0; idx < testQuestions.length; idx++) {
									let weightage = testQuestions[idx].weightage;
									if (weightage == null) { weightage = 1; }
									totalWeightage += weightage;
								}

								percentage = Math.floor((totalScore / totalWeightage) * 100);
								renderReport(saveData, percentage);
							}
						}).catch(err => {
							console.error("Failed fetching assessment questions!", err);
							$("#loadingSpinner").hide();
						});
					}).catch(err => {
						console.warn("Request aborted due to missing requestOptions.", err);
					});
				} else {
					for (let idx = 0; idx < testQuestions.length; idx++) {
						let weightage = testQuestions[idx].weightage;
						if (weightage == null) { weightage = 1; }
						totalWeightage += weightage;
					}
					percentage = Math.floor((totalScore / totalWeightage) * 100);
					renderReport(saveData, percentage);
				}
			} else {
				percentage = Math.floor((totalScore / totalWeightage) * 100);
				renderReport(saveData, percentage);
			}
		} else {
			percentage = Math.floor((totalScore / assessmentResult.content.length) * 100);
			renderReport(saveData, percentage);
		}
	}
}

function renderReport(saveData, percentage) {
	var htmlContent = "";

	htmlContent += '<div id="assessmentReportArea">';
		var userJson = null;
		if((userOrVisitor == 'visitor') && (mVisitDetailsJSON != null)) {
			userJson = mVisitDetailsJSON;
		} else if(shared.mCustomerDetailsJSON != null) {
			userJson = shared.mCustomerDetailsJSON;
		}

		if(userJson != null) {
			if(percentage < testContent.passMark) {
				htmlContent += '<div class="assessmenttitletext" style="color: rgb(230, 30, 30);">ASSESSMENT FAILED</div>';
				htmlContent += '<div class="assessmentresulttext">Hello '+userJson.firstName+', you have scored less then the pass mark in "'+testContent.assessmentName+'" on '+assessmentResult.date+', with the score of '+percentage+'%.</div>';

				if(saveData == true) {
					saveAssessmentState(0);
				}
				
			} else {
				htmlContent += '<div class="assessmenttitletext" style="color: rgb(400, 220, 0);">ASSESSMENT COMPLETED</div>';
				htmlContent += '<div class="assessmentresulttext">Hello '+userJson.firstName+', you have completed "'+testContent.assessmentName+'" on '+assessmentResult.date+', with the score of '+percentage+'%.</div>';

				if(saveData == true) {
					saveAssessmentState(1);
				}
			}
		}
	htmlContent += '</div>';
	
	htmlContent += '<div class="qpaperfooter" id="qPaperFooter">';
		htmlContent += '<div id="takeTestBtn" class="btnStyle" onclick="showAssessment('+testContent.id+', true)">Take test Again</div>';
		if(testContent.showResultAll == true) {
			htmlContent += '<div id="detailedReportBtn" class="btnStyle" onclick="getDetailedReport()">Test Report</div>';
		}
	htmlContent += '</div>';

	// } else {
	// 	htmlContent += '<div class="assessmenttitletext">Assessment is completed. Thank you for taking the test.</div>';
	// }
	$("#assessmentBox").html(htmlContent);
	
	/*if(saveData == true) {
		saveAssessmentState();
	}*/
}

function saveClassAssessmentState() {
	$("#loadingSpinner").show();

	const data = {
		"token": shared.mCustomerDetailsJSON.token,
		"assessmentdata": JSON.stringify(classAssessmentResult)
	};
	const url2 = "/api/restsaveclassassessmentstate";

	RequestOptions(constructUrl(url2), "POST", data).then(request => {
		Http.request(request).then(res => {
			if (isValidResponse(res, url2) && res.data) {
				console.log("Assessment Answers save: " + JSON.stringify(res.data));

				// Update Course status
				let contJson = JSON.parse(courseContentStatus.courseState);
				let contentStatus = contJson.contents.find(item =>
					item.contentType === "Assessment" &&
					item.contentId === courseContent[runningContentIndex].id
				);

				if (contentStatus !== undefined) {
					contentStatus.status = 0;
				} else {
					contJson.contents.push(getContentInitJson(courseContent[runningContentIndex]));
				}
				courseContentStatus.courseState = JSON.stringify(contJson);
				updateCourseStatus();
			}
			$("#loadingSpinner").hide();
		}).catch(err => {
			apiRequestFailed(err, url2);
			$("#loadingSpinner").hide();
		});
	}).catch(err => {
		console.warn("Request aborted due to missing requestOptions.", err);
		$("#loadingSpinner").hide();
	});
}

function saveAssessmentState(passFail) {
	$("#loadingSpinner").show();

	let data = {};
	if ((userOrVisitor === 'visitor') && (mVisitDetailsJSON != null)) {
		data = { "token": mVisitDetailsJSON.token, "assessmentId": testContent.id };
	} else if (shared.mCustomerDetailsJSON != null) {
		data = { "token": shared.mCustomerDetailsJSON.token, "assessmentId": testContent.id };
	}

	let url1 = "/api/restgetuserassessmentstate";
	let url2 = "/api/restsaveuserassessmentstate";
	if (userOrVisitor === "visitor") {
		url1 = "/visitorvisits/restgetvisitorassessmentstate";
		url2 = "/visitorvisits/restsavevisitorassessmentstate";
	}

	buildRequestOptions(constructUrl(url1), "GET", data).then(request => {
		Http.request(request).then(res => {
			if (isValidResponse(res, url1) && res.data) {
				let dataJson = (typeof res.data === "string" ? JSON.parse(res.data) : res.data);

				if (dataJson != null) {
					dataJson.assessmentState = JSON.stringify(assessmentResult);

					const postData = { "assessmentdata": JSON.stringify(dataJson) };

					RequestOptions(constructUrl(url2), "POST", postData).then(request2 => {
						Http.request(request2).then(res2 => {
							if (isValidResponse(res2, url2)) {
								console.log("Assessment Answers save: " + JSON.stringify(res2.data));
								updateAssessmentCourseStatus(passFail);
							}
							$("#loadingSpinner").hide();
						}).catch(err => {
							apiRequestFailed(err, url2);
							$("#loadingSpinner").hide();
						});
					});
				} else {
					// === Get blank assessment state ===
					let blankData = {};
					if ((userOrVisitor === 'visitor') && (mVisitDetailsJSON != null)) {
						blankData = { "token": mVisitDetailsJSON.token };
					} else if (shared.mCustomerDetailsJSON != null) {
						blankData = { "token": shared.mCustomerDetailsJSON.token };
					}

					buildRequestOptions(constructUrl("/api/restgetblankuserassessmentstate"), "GET", blankData).then(requestBlank => {
						Http.request(requestBlank).then(resBlank => {
							if (isValidResponse(resBlank, "restgetblankuserassessmentstate") && resBlank.data) {
								console.log("Assessment Answers save: " + JSON.stringify(resBlank.data));
								let dataJson = (typeof resBlank.data === "string" ? JSON.parse(resBlank.data) : resBlank.data);

								if ((userOrVisitor === 'visitor') && (mVisitDetailsJSON != null)) {
									dataJson.userId = mVisitDetailsJSON.id;
									dataJson.userName = mVisitDetailsJSON.userName;
								} else if (shared.mCustomerDetailsJSON != null) {
									dataJson.userId = shared.mCustomerDetailsJSON.id;
									dataJson.userName = shared.mCustomerDetailsJSON.userName;
								}
								dataJson.assessmentId = testContent.id;
								dataJson.assessmentName = testContent.assessmentName;
								dataJson.assessmentState = JSON.stringify(assessmentResult);

								const postData = { "assessmentdata": JSON.stringify(dataJson) };

								RequestOptions(constructUrl(url2), "POST", postData).then(request2 => {
									Http.request(request2).then(res2 => {
										if (isValidResponse(res2, url2)) {
											console.log("Assessment Answers save: " + JSON.stringify(res2.data));
											updateAssessmentCourseStatus(passFail);
										}
										$("#loadingSpinner").hide();
									}).catch(err => {
										apiRequestFailed(err, url2);
										$("#loadingSpinner").hide();
									});
								});
							}
						}).catch(err => {
							apiRequestFailed(err, "restgetblankuserassessmentstate");
							$("#loadingSpinner").hide();
						});
					});
				}
			}
		}).catch(err => {
			apiRequestFailed(err, url1);
			$("#loadingSpinner").hide();
		});
	}).catch(err => {
		console.warn("Request aborted due to missing requestOptions.", err);
		$("#loadingSpinner").hide();
	});
}

// 🔹 Helper to update course status
function updateAssessmentCourseStatus(passFail) {
	let contJson = JSON.parse(courseContentStatus.courseState);
	let contentStatus = contJson.contents.find(item =>
		item.contentType === "Assessment" &&
		item.contentId === courseContent[runningContentIndex].id
	);

	if (contentStatus !== undefined) {
		contentStatus.status = passFail;
	} else {
		contJson.contents.push(getContentInitJson(courseContent[runningContentIndex]));
	}
	courseContentStatus.courseState = JSON.stringify(contJson);
	updateCourseStatus();
}

function getDetailedAssessmentReport(assessmentId, visitorId) {
	let data = {};
	let url = "";

	if ((userOrVisitor === 'visitor') && (mVisitDetailsJSON != null)) {
		url = "/visitorvisits/restgetvisitorassessmentstate";
		data = { "token": mVisitDetailsJSON.token, "assessmentId": assessmentId };
	} else if (shared.mCustomerDetailsJSON != null) {
		if (userOrVisitor === 'visitee') {
			url = "/visitorvisits/restgetvisitorassessmentstate";
			data = { "token": shared.mCustomerDetailsJSON.token, "assessmentId": assessmentId, "visitorId": visitorId };
		} else {
			url = "/api/restgetuserassessmentstate";
			data = { "token": shared.mCustomerDetailsJSON.token, "assessmentId": assessmentId };
		}
	}

	buildRequestOptions(constructUrl(url), "GET", data).then(request => {
		Http.request(request).then(res => {
			if (isValidResponse(res, url) && res.data) {
				let jqXHR1 = (typeof res.data === "string" ? JSON.parse(res.data) : res.data);

				if (jqXHR1 == null || (jqXHR1.error !== "invalid_token" && jqXHR1.error !== "invalid_user")) {
					assessmentResult = JSON.parse(jqXHR1.assessmentState);

					let htmlContent = '';
					htmlContent += '<div class="lightBkClass" id="knwledgemateContentViewArea">';
					htmlContent += '<div id="knowledgemateContentDisplayArea">';
					htmlContent += '<div id="modules_contentViewBox">';
					htmlContent += '<div id="assessmentBox"></div>';
					htmlContent += '</div>';
					htmlContent += '</div>';
					htmlContent += '</div>';

					$("#modulesDisplayArea").html(htmlContent);
					$("#modulesMenuArea").hide();
					$("#modulesListArea").hide();
					$("#modulesDisplayArea").show();
					fixModuleHeight("modulesModuleHeader, footerSection", 20, "modulesDisplayArea");

					getDetailedReport();
				} else {
					if (jqXHR1.error === "invalid_token") {
						getNewToken("getDetailedAssessmentReport(" + assessmentId + ")");
					} else {
						showDialog("ERROR! " + jqXHR1.error);
					}
				}
			}
		}).catch(err => {
			apiRequestFailed(err, url);
		});
	}).catch(err => {
		console.warn("Request aborted due to missing requestOptions.", err);
	});
}

function getDetailedReport() {
	var htmlContent = "";
	var date = new Date(assessmentResult.date);
	const readableDate = date.toLocaleString('en-US', {year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true});

	htmlContent += '<div style="width: 100%;">';
		htmlContent += '<div style="font-size: 1.1em;">Date: '+readableDate+'</div>';
		htmlContent += '<div style="display: grid; grid-template-columns: 80% 20%;">';
		for(var index in assessmentResult.content) {
				htmlContent += '<div>';
					let sl = 1 + parseInt(index);
					htmlContent += '<div class="assessmentquestion">'+sl+'. '+assessmentResult.content[index].Q+'</div>';
					htmlContent += '<div class="assessmentanswer">Your Answer: '+assessmentResult.content[index].A.replace("#", ", ")+'</div>';
					if(testContent != null) {
						if(testContent.showCorrectAnswer == true) {
							htmlContent += '<div class="assessmentanswer">Right Answer: '+assessmentResult.content[index].RA.replace("#", ", ")+'</div>';
						}
					}
				htmlContent += '</div>';
				htmlContent += '<div>';
					let score = assessmentResult.content[index].score;
					if(score == 1) {
						htmlContent += '<div style="font-size: 1.5em; color: rgb(0, 200, 0);"><i class="fas fa-check"></i></div>';
					} else if (score == 0) {
						htmlContent += '<div style="font-size: 1.5em; color: rgb(255, 0, 0);"><i class="fas fa-times"></i></div>';
					} else {
						htmlContent += '<div style="font-size: 1.5em; color: rgb(255, 200, 0);"><i class="fas fa-check"></i></div>';
					}
					htmlContent += '<div class="assessmentanswer">Score: '+assessmentResult.content[index].score+'</div>';
				htmlContent += '</div>';


		if(index == assessmentResult.content.length -1) {
			htmlContent += '</div></div>';
				
			htmlContent += '<div class="qpaperfooter" id="qPaperFooter">';
			if(userOrVisitor != 'visitee') {
				htmlContent += '<div id="detailedReportBtn" class="btnStyle" onclick="showReport(false)"><i class="fas fa-arrow-left"></i> Back</div>';
				htmlContent += '<div id="takeTestBtn" class="btnStyle" onclick="showAssessment('+testContent.id+', true)">Take test Again</div>';
			}
			htmlContent += '</div>';
			$("#assessmentBox").html(htmlContent);
			fixModuleHeight("modulesModuleHeader, knowledgemateCourseTitleArea, footerSection", 20, "knowledgemateContentDisplayArea");
		}
	}
}


function viewCertificate() {
  let userJson = shared.mCustomerDetailsJSON;
  shared.currentState = "viewCertificate";

  // Build HTML container
  let htmlContent = `
    <div class="lightBkClass" id="knwledgemateCertificateViewArea">
      <div id="knowledgemateCertificateDisplayArea" style="padding-bottom: 50px;">
        <div id="knowledgemate_certificateViewBox"></div>
      </div>
    </div>
    <div class="qpaperfooter" style="position: absolute; bottom: 40px;">
      <div id="downloadBtn" class="btnStyle" onclick="downloadCertificate()">Download Certificate</div>
      <div id="emailBtn" class="btnStyle" onclick="emailCertificate()">Email Certificate</div>
    </div>
    <div id="certificate" style="position: absolute; top: 0; z-index: -1; width: 1920px; height: 1280px; display: none;">
      <div id="cert" style="width: 100%; height: 100%; position: relative;"></div>
    </div>
  `;

  $("#modulesDisplayArea").html(htmlContent);
  $("#modulesMenuArea").hide();
  $("#modulesListArea").hide();
  $("#modulesDisplayArea").show();
  fixModuleHeight("modulesModuleHeader, footerSection", 20, "modulesDisplayArea");

  $("#loadingSpinner").show();

  if (!shared.mCustomerDetailsJSON) {
    showDialog("You need to login to access this resource!", "viewLogin('menuProcess')");
    return;
  }

  // === Step 1: Fetch config by company key ===
  const configData = { token: shared.mCustomerDetailsJSON.token };
  buildRequestOptions(constructUrl("/knowledgemateconfigs/restgetconfigbycompanykey"), "GET", configData)
    .then(request => Http.request(request))
    .then(res => {
      if (!isValidResponse(res, "restgetconfigbycompanykey")) return;

      const knowledgemateConfigJson = res.data;
      if (knowledgemateConfigJson.error === "invalid_token") {
        return getNewToken("viewCertificate()");
      }

      // === Step 2: Fetch template by ID ===
      const templateData = { templateId: knowledgemateConfigJson.certificateTemplateId };
      return buildRequestOptions(constructUrl("/templates/gettemplatebyid"), "GET", templateData)
        .then(request => Http.request(request));
    })
    .then(res => {
      if (!res || !isValidResponse(res, "gettemplatebyid")) return;

      const dat = res.data;
      if (dat.error === "invalid_token") {
        return getNewToken("viewCertificate()");
      }

      let template = dat.templateData ? JSON.parse(dat.templateData) : null;
      const cartificateElem = document.getElementById('knowledgemate_certificateViewBox');
      const certElem = document.getElementById('cert');
      $(cartificateElem).html("");

      if (!template || !template.sections?.length) {
        $(cartificateElem).html("No Certificate Template data!");
        $("#loadingSpinner").hide();
        return;
      }

      // === Background Image Handling ===
      if (template.backgroundImage && template.backgroundImage.length > 0) {
        if (template.backgroundImage.startsWith('https://')) {
          $(cartificateElem).css({
            'background-image': `url(${template.backgroundImage})`,
            'background-repeat': 'no-repeat',
            'background-size': '100% 100%'
          });
          $(certElem).css({
            'background-image': `url(${template.backgroundImage})`,
            'background-repeat': 'no-repeat',
            'background-size': '100% 100%'
          });
        } else {
          const objectKey = "bveu_resource/bveu_contents/" + template.backgroundImage;
          getSignedUrl(objectKey, 10).then(url => {
            if (url.startsWith('http')) {
              $(cartificateElem).css({
                'background-image': `url(${url})`,
                'background-repeat': 'no-repeat',
                'background-size': '100% 100%'
              });
            }
          });
        }
      }

      // === Recursive Section Rendering ===
      function getNextSection(sectionIndex) {
        const section = template.sections[sectionIndex];
        if (!section) return;

        if (section.sectionStyles) {
          let htmlContent = "";
          section.sectionStyles.forEach((style, idx) => {
            if (idx === section.sectionStyles.length - 1) {
              htmlContent += `<div class="templatesection" id="Contentbox_${sectionIndex}" style="${style.css}border: 1px solid rgba(0,0,0,0.1) !important; display: flex; align-items: center;">`;
            } else {
              htmlContent += `<div style="${style.css}">`;
            }
          });
          section.sectionStyles.forEach(() => (htmlContent += "</div>"));

          if (sectionIndex === template.sections.length - 1) {
            $(cartificateElem).html(htmlContent);
            $('.templatebox').css('outline', 'none');
            scaleCertificateBox();
          } else {
            getNextSection(sectionIndex + 1);
          }
        } else if (section.values && section.type) {
          getEachElem(section).then(elem => {
            elem.style.position = "absolute";
            elem.style.border = "1px solid rgba(0,0,0,0.1) !important;";
            elem.classList.add("templatebox");
            if (!elem.id) elem.id = "Contentbox_" + sectionIndex;

            cartificateElem.appendChild(elem);

            if (elem.classList.contains('templatetextbox')) {
              let text = elem.textContent;
              elem.textContent = text
                .replace('[firstname]', userJson.firstName)
                .replace('[lastname]', userJson.lastName)
                .replace('[course]', courseContentStatus.courseName)
                .replace('[date]', courseContentStatus.modifiedOn.substring(0, 10));
            }

            // Clone for hidden certificate
            const cloneElem = elem.cloneNode(true);
            cloneElem.id = elem.id + "_cert";
            certElem.appendChild(cloneElem);
            if (cloneElem.classList.contains('templatetextbox')) {
              let text = cloneElem.textContent;
              cloneElem.textContent = text
                .replace('[firstname]', userJson.firstName)
                .replace('[lastname]', userJson.lastName)
                .replace('[course]', courseContentStatus.courseName)
                .replace('[date]', courseContentStatus.modifiedOn.substring(0, 10));
            }

            if (sectionIndex === template.sections.length - 1) {
              $('.templatebox').css('outline', 'none');
              scaleCertificateBox();
            } else {
              getNextSection(sectionIndex + 1);
            }
          });
        }
      }

      getNextSection(0);
      $("#loadingSpinner").hide();
    })
    .catch(err => {
      console.error("Certificate loading failed!", err);
      $("#loadingSpinner").hide();
    });
}


function scaleCertificateBox() {
    const container = document.getElementById("knwledgemateCertificateViewArea");
    const box = document.getElementById("knowledgemate_certificateViewBox");

    const baseWidth = 1920;
    const baseHeight = 1080;

    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;

    const scale = Math.min(containerWidth / baseWidth, containerHeight / baseHeight);

    box.style.transform = `scale(${scale})`;

}

async function downloadCertificate() {
    $('#certificate').css('display', 'block');

    const source = document.querySelector("#knowledgemateCertificateDisplayArea");
    const certBox = document.querySelector("#knowledgemate_certificateViewBox");

    // Save original transform
    const originalTransform = certBox.style.transform;

    // Temporarily reset scale
    certBox.style.transform = "scale(1)";
    certBox.style.transformOrigin = "top left";

    // Wait for reflow before rendering
    setTimeout(async () => {
        try {
            const canvas = await html2canvas(source, { useCORS: true, backgroundColor: "#ffffff", scale: 2 });
            const imgData = canvas.toDataURL("image/jpeg", 1.0);

            const pdf = new jsPDF('l', 'pt', [canvas.width, canvas.height]);
            pdf.addImage(imgData, 'JPEG', 0, 0, canvas.width, canvas.height);

            const pdfOutput = pdf.output('arraybuffer'); // Use arraybuffer for Capacitor
            const fileName = "certificate.pdf";

            // Save the PDF using Capacitor Filesystem
            const savedFile = await Filesystem.writeFile({
                path: fileName,
                data: new Uint8Array(pdfOutput),
                directory: Directory.Documents,
                recursive: true
            });

            console.log("PDF saved successfully!", savedFile.uri);

            // Open the PDF using Capacitor Browser
            await Browser.open({ url: savedFile.uri });

        } catch (err) {
            console.error("Failed to generate or save PDF:", err);
        } finally {
            // Restore scale
            certBox.style.transform = originalTransform;
            $('#certificate').css('display', 'none');
        }
    }, 100); // small delay to ensure style is applied
}

// function emailCertificate() {
//     $("#loadingSpinner").show();
//     $('#certificate').css('display', 'block');

//     const currentUser = shared.mCustomerDetailsJSON;
//     const source = document.querySelector("#knowledgemateCertificateDisplayArea");
//     const certBox = document.querySelector("#knowledgemate_certificateViewBox");

//     // Save and temporarily remove transform
//     const originalTransform = certBox.style.transform;
//     certBox.style.transform = "scale(1)";
//     certBox.style.transformOrigin = "top left";

//     // Wait for styles to apply
//     setTimeout(() => {
//         const width = source.getBoundingClientRect().width;
//         const height = source.getBoundingClientRect().height;

//         html2canvas(source, {
//             width: width,
//             height: height,
//             allowTaint: false,
//             useCORS: true,
//             backgroundColor: "#ffffff",
//             scale: 2
//         }).then(canvas => {
//             const imgData = canvas.toDataURL("image/jpeg", 1.0);
//             const pdf = new jsPDF('l', 'pt', [canvas.width, canvas.height]);
//             pdf.addImage(imgData, 'JPEG', 0, 0, canvas.width, canvas.height);
//             const pdfBase64 = pdf.output('datauristring');

//             Email.send({
//                 SecureToken: shared.systemConfiguration.systemInfo.smtpSecureToken,
//                 To: currentUser.email,
//                 From: shared.systemConfiguration.systemInfo.emailSenderUserName,
//                 Subject: "KnowledgeMate Certificate - " + courseContentStatus.courseName,
//                 Body: "Dear " + currentUser.firstName + ",\n\nAttached certificate from KnowledgeMate.",
//                 Attachments: [{
//                     name: "certificate.pdf",
//                     data: pdfBase64
//                 }],
//             }).then(function (message) {
//                 showDialog("Email will be sent to your registered mail ID. If not received, check your junk folder.");
//                 console.log("emailCertificate:", message);

//                 // Cleanup
//                 $('#certificate').css('display', 'none');
//                 $("#loadingSpinner").hide();
//                 certBox.style.transform = originalTransform;
//             });
//         }).catch(err => {
//             console.error("Error generating canvas:", err);
//             $('#certificate').css('display', 'none');
//             $("#loadingSpinner").hide();
//             certBox.style.transform = originalTransform;
//         });
//     }, 100); // delay allows transform to apply
// }



async function emailCertificate() {
    $("#loadingSpinner").show();
    $('#certificate').css('display', 'block');

    const currentUser = shared.mCustomerDetailsJSON;
    const source = document.querySelector("#knowledgemateCertificateDisplayArea");
    const certBox = document.querySelector("#knowledgemate_certificateViewBox");

    // Save and temporarily remove transform
    const originalTransform = certBox.style.transform;
    certBox.style.transform = "scale(1)";
    certBox.style.transformOrigin = "top left";

    // Wait for styles to apply
    setTimeout(async () => {
        try {
            const width = source.getBoundingClientRect().width;
            const height = source.getBoundingClientRect().height;

            const canvas = await html2canvas(source, {
                width: width,
                height: height,
                allowTaint: false,
                useCORS: true,
                backgroundColor: "#ffffff",
                scale: 2
            });

            const imgData = canvas.toDataURL("image/jpeg", 1.0);
            const pdf = new jsPDF('l', 'pt', [canvas.width, canvas.height]);
            pdf.addImage(imgData, 'JPEG', 0, 0, canvas.width, canvas.height);
            const pdfBase64 = pdf.output('datauristring');

            // Send email using SMTP.js (browser compatible)
            await Email.send({
                SecureToken: shared.systemConfiguration.systemInfo.smtpSecureToken,
                To: currentUser.email,
                From: shared.systemConfiguration.systemInfo.emailSenderUserName,
                Subject: "KnowledgeMate Certificate - " + courseContentStatus.courseName,
                Body: "Dear " + currentUser.firstName + ",\n\nAttached certificate from KnowledgeMate.",
                Attachments: [{
                    name: "certificate.pdf",
                    data: pdfBase64
                }],
            });

            showDialog("Email will be sent to your registered mail ID. If not received, check your junk folder.");
            console.log("emailCertificate: Email sent successfully");

        } catch (err) {
            console.error("Error generating canvas or sending email:", err);
        } finally {
            // Cleanup
            $('#certificate').css('display', 'none');
            $("#loadingSpinner").hide();
            certBox.style.transform = originalTransform;
        }
    }, 100); // delay allows transform to apply
}



/******************************************************************** DISPLAYS And MENUS ******************************************************************** */
function showCourseContents() {
	shared.currentState = shared.currentSourceState;
	clearTempCopiedImage();
	var players = document.getElementsByTagName('video');
    for(player of players) {
        player.pause();
    }
	stopProgressMonitoring();
	$("#modulesDisplayArea").html('');
	$('#modulesMenuArea').hide();
	$('#modulesListArea').show();
	$('#modulesDisplayArea').hide();
}


function viewKmclass() {
    $("#kmclassBox").addClass("visible");
    $("#course_about_carrot").addClass("carrot-down");
    $("#kmclassBox").addClass("button-selected");
    
}

function hideKmclassView() {
    $("#kmclassBox").removeClass("visible");
    $("#carrot4").removeClass("carrot-down");
    $("#kmclassBox").removeClass("button-selected");
    
}

function toggleKmclassView() {
	$("#kmclassBox").toggleClass("visible");
    $("#carrot4").toggleClass("carrot-down");
    $("#kmclassBox").toggleClass("button-selected");
}

export function backKnowledgemateHandle() {
	if(shared.currentState == "viewContent" || shared.currentState == "viewCertificate") {
		showCourseContents();
	} else if(shared.currentState == "courseContent") {
		viewCourses(myCourseType);
	} else if(shared.currentState == "classContent") {
		viewClasses(myClassType);
	} else {
		exitKnowledgemate();
	}

	
}



window.viewKnowledgemate = viewKnowledgemate;
window.closeKnowledgemate = closeKnowledgemate;
window.exitKnowledgemate = exitKnowledgemate;
window.displayKnowledgemateMenu = displayKnowledgemateMenu;
window.viewCourses = viewCourses;
window.getCourses = getCourses;
window.viewCourseList = viewCourseList;
window.alreadySubscribed = alreadySubscribed;
window.subscribeCourse = subscribeCourse;
window.alreadyRequested = alreadyRequested;
window.openCourse = openCourse;
window.getContentInitJson = getContentInitJson;
window.createNewUserCourseStatus = createNewUserCourseStatus;
window.saveCourseStatus = saveCourseStatus;
window.viewCourseContent = viewCourseContent;
window.openContent = openContent;
window.viewClasses = viewClasses;
window.getClasses = getClasses;
window.viewClassList = viewClassList;
window.openClass = openClass;
window.kmclassAttendence = kmclassAttendence;
window.processClickerResponse = processClickerResponse;
window.pauseQuiz = pauseQuiz;
window.beginQuiz = beginQuiz;
window.getContentDuration = getContentDuration;
window.startProgressMonitoring = startProgressMonitoring;
window.stopProgressMonitoring = stopProgressMonitoring;
window.monitorProgress = monitorProgress;
window.checkCourseStatus  = checkCourseStatus;
window.updateCourseStatus = updateCourseStatus;
window.startKmAliveInterval = startKmAliveInterval;
window.stopKmAliveInterval = stopKmAliveInterval;
window.updateKmAlive = updateKmAlive;
window.HighlightList = HighlightList;
window.shuffleIndex = shuffleIndex;
window.showAssessment = showAssessment;
window.assessmentCountdownTimerHandler = assessmentCountdownTimerHandler;
window.getBackAssessment = getBackAssessment;
window.getQuestions = getQuestions;
window.getClassroomAnswers = getClassroomAnswers;
window.getSubmittedAnswer = getSubmittedAnswer;
window.verifyAnswer = verifyAnswer;
window.showReport = showReport;
window.renderReport = renderReport;
window.saveClassAssessmentState = saveClassAssessmentState;
window.saveAssessmentState = saveAssessmentState;
window.updateAssessmentCourseStatus = updateAssessmentCourseStatus;
window.getDetailedAssessmentReport = getDetailedAssessmentReport;
window.getDetailedReport = getDetailedReport;
window.viewCertificate = viewCertificate;
window.scaleCertificateBox = scaleCertificateBox;
window.downloadCertificate = downloadCertificate;
window.emailCertificate = emailCertificate;
window.showCourseContents = showCourseContents;
window.viewKmclass = viewKmclass;
window.hideKmclassView = hideKmclassView;
window.toggleKmclassView = toggleKmclassView;
window.backKnowledgemateHandle = backKnowledgemateHandle;
