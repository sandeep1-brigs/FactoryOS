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
import { showDialog , highlightHeaderTabMenu , fixModuleHeight , constructUrl , getSignedUrl , pauseVideos , initPinchZoom , getGeoPosition} from "./utility.js";
import { getMenuBar ,getNewToken } from "./settings.js";
import { exitModules , viewContent } from "./content.js";
import { createList } from "./list.js";
import { apiRequestFailed } from "./auth.js";
import { viewPdfFile } from "./pdfviewer.js";
import { getStyleAttributeInStyles } from "./ert.js";



var qSequence = [];
var questionCount = 0;
var testQuestions = JSON.parse(null);
var testAnswers = [];
var testContent = JSON.parse(null);
var timeLimit = 0;
var countDownTimer;
var assessmentResult = JSON.parse(null);
var answerString = "";
var courseContent = null;
var courseContentStatus = null;

var runningContent;
var runningContentType;
var runningContentId;

/**************************************************************** COURSE *************************************************************/

/******************************************************************************************
Name: viewCourses
Purpose: To view Catalog page - all the courses assigned to the user
******************************************************************************************/

function viewCourses() {
	if (shared.mCustomerDetailsJSON != null) {

		displaySection("catalogSection", "block", true, true);
		$('#loadingmessage').show();

		const courseScreenCMS = shared.cmsJSON.cmsJSONdata.courseScreen;
		const screenWidth = $("#workAreaSection").outerWidth();
		const remWid = (screenWidth - 720 < 0) ? 0 : (screenWidth - 600);
		const widPc = 100 - (remWid / (1200 / 25));
		const windowWidth = screenWidth * widPc / 100;
		let colCount = parseInt(windowWidth / 260);
		if (colCount < 1) colCount = 1;

		const data = { token: shared.mCustomerDetailsJSON.token };

		buildRequestOptions(constructUrl("/api/getcourses"), "GET", data)
			.then(request => {
				Http.request(request).then(res => {
					if (isValidResponse(res, "getCourses")) {
						const courseJson = (typeof res.data === "string") ? JSON.parse(res.data) : res.data;

						if (courseJson.error != "invalid_tolen") { // Check if the token is still valid
							let contentHtml = "";
							if (courseJson.length > 0) {
								contentHtml += '<table class="noborder">';
								contentHtml += '<colgroup>';
								const colPercent = 100 / colCount;
								for (let count = 0; count < colCount; count++) {
									contentHtml += `<col span="1" style="width: ${colPercent}%;">`;
								}
								contentHtml += '</colgroup>';

								$.each(courseJson, function (key, course) {
									if (key % colCount == 0) {
										if (key > 0) contentHtml += '</tr>';
										contentHtml += '<tr class="noborder">';
									}

									contentHtml += `<td class="noborder">
										<div class="catalogticket" id="course_${course.id}" onclick="loadCourse(${course.id})">
											<img class="catalogicon" src="${course.icon.length ? course.icon : courseScreenCMS.courseBanner}">
											<div class="cataloginfoarea">
												<div class="catalogname">${course.courseName}</div>
												<p class="catalogdescription">${course.description}</p>
												<div class="catalogoneline"><b>Authors: </b>${course.authors}</div>
											</div>
										</div>
									</td>`;

									if (key === courseJson.length - 1) {
										contentHtml += '</tr>';
									}
								});

								contentHtml += '</table>';
								$("#yourCatalogArea").html(contentHtml);
								$('#loadingmessage').hide();
							}
						} else { // Token expired
							getNewToken(shared.mCustomerDetailsJSON.userName, shared.mCustomerDetailsJSON.password, "viewCourses()");
						}
					}
				}).catch(err => {
					apiRequestFailed(err, "getCourses");
					$('#loadingmessage').hide();
				});
			})
			.catch(err => {
				console.warn("Request aborted due to missing requestOptions (getcourses).", err);
				$('#loadingmessage').hide();
			});

	} else {
		showDialog("You need to login to access this resource!", "viewLogin('menuProcess')");
	}
}

function loadCourse(id) {
	displaySection("courseSection", "block", true, true);
	$('#loadingmessage').show();

	const data = { token: shared.mCustomerDetailsJSON.token, courseId: id };

	buildRequestOptions(constructUrl("/api/getcoursebyid"), "GET", data)
		.then(request1 => {
			Http.request(request1)
				.then(res => {
					if (isValidResponse(res, "getcoursebyid")) {
						const course = (typeof res.data === "string") ? JSON.parse(res.data) : res.data;

						if (course.error != "invalid_tolen") {
							let contentHtml = "";

							contentHtml += '<div class="bannerarea">';
							if (course.primaryImage?.length) {
								contentHtml += `<img class="catalogpopupbanner" src="${course.primaryImage}">`;
								contentHtml += `<div class="catalogpopupname">${course.courseName}</div>`;
							} else {
								contentHtml += `<div class="catalogpopupname" style="position: inherit;">${course.courseName}</div>`;
							}
							contentHtml += '</div>';

							$("#courseTitleBox").html(contentHtml);

							contentHtml = `
								<div id="courseDescriptionField" class="contentDetailText">${course.description}</div>
								<div id="courseSpecificationField" class="contentDetailText">${course.specification}</div>
							`;
							$("#courseDescriptionBox").html(contentHtml);
							$('#loadingmessage').hide();

							viewAboutCourse();

							// ---- Nested 1: Get course contents ----
							buildRequestOptions(constructUrl("/api/getcoursecontents"), "GET", data)
								.then(request => {
									Http.request(request)
										.then(res => {
											if (isValidResponse(res, "getcoursecontents")) {
												const courseContent = (typeof res.data === "string") ? JSON.parse(res.data) : res.data;

												let defaultContentId = 0;
												let defaultContentType = '';
												let contentHtml = "";
												let contentString = '{"contents":[';
												let contentCount = 0;

												contentHtml += '<table class="noborder">';
												contentHtml += '<colgroup><col span="1" style="width: 10%"><col span="1" style="width: 60%"><col span="1" style="width: 30%"></colgroup>';

												for (const content of courseContent) {
													contentHtml += `
														<tr id="list_${content.contentType}_${content.contentId}" class="noborder coursecontentlist" onclick="viewContent('${content.contentType}',${content.contentId})">
															<td id="currentPlayingIndicator_list_${content.contentType}_${content.contentId}" class="noborder coursecontentlistfont"><span><i class="far fa-square"></i></span></td>
															<td id="currentPlayingContentName_list_${content.contentType}_${content.contentId}" class="noborder coursecontentlistfont"><div>${content.contentName}</div></td>
															<td id="currentPlayingContentDuration_list_${content.contentType}_${content.contentId}" class="noborder coursecontentlistfont">${content.contentDuration}</td>
														</tr>
													`;

													contentString += `{"contentId":${content.contentId},"contentName":"${content.contentName}","contentType":"${content.contentType}","status":0}`;

													contentCount++;
													if (contentCount === courseContent.length) {
														contentHtml += '</table>';
														$("#assessmentContentList").html(contentHtml);
														contentString += ']}';

														// ---- Nested 2: Get user course state ----
														buildRequestOptions(constructUrl("/api/restgetusercoursestate"), "GET", data)
															.then(request => {
																Http.request(request)
																	.then(res => {
																		if (isValidResponse(res, "restgetusercoursestate")) {
																			const userCourse = (typeof res.data === "string") ? JSON.parse(res.data) : res.data;

																			const dataUser = { token: shared.mCustomerDetailsJSON.token };

																			// New user - no prior course state
																			if (userCourse == null) {
																				buildRequestOptions(constructUrl("/api/restgetblankusercoursestate"), "GET", dataUser)
																					.then(request => {
																						Http.request(request)
																							.then(res => {
																								if (isValidResponse(res, "restgetblankusercoursestate")) {
																									let dataJson = (typeof res.data === "string") ? JSON.parse(res.data) : res.data;
																									dataJson.userId = shared.mCustomerDetailsJSON.id;
																									dataJson.userName = shared.mCustomerDetailsJSON.userName;
																									dataJson.courseId = course.id;
																									dataJson.courseName = course.courseName;
																									dataJson.courseState = contentString;

																									courseContentStatus = dataJson;

																									const saveData = { courseData: JSON.stringify(dataJson) };
																									RequestOptions(constructUrl("/api/restsaveusercoursestate"), "POST", saveData)
																										.then(request => {
																											Http.request(request)
																												.then(res => {
																													if (isValidResponse(res, "restsaveusercoursestate")) {
																														console.log("Content Status save - " + JSON.stringify(res.data));
																														$("#loadingSpinner").hide();
																														defaultContentId = courseContent[0].contentId;
																														defaultContentType = courseContent[0].contentType;
																														viewContent(defaultContentType, defaultContentId);
																													}
																												})
																												.catch(err => apiRequestFailed(err, "restsaveusercoursestate"));
																										});
																								}
																							})
																							.catch(err => apiRequestFailed(err, "restgetblankusercoursestate"));
																					});
																			} else {
																				// Existing user course data
																				courseContentStatus = userCourse;
																				let newContentInCourse = false;

																				let oldCourseContentStatus = userCourse;
																				let oldContentStates = JSON.parse(oldCourseContentStatus.courseState);
																				let currentCourseContentStatus = JSON.parse(contentString);

																				let statusIndex = 0;
																				for (const currentContentState of currentCourseContentStatus.contents) {
																					let index = -1;
																					let OldObj = oldContentStates.contents.find(function (item, i) {
																						if ((item.contentType === currentContentState.contentType) && (item.contentId === currentContentState.contentId)) {
																							index = i;
																							return item;
																						}
																					});

																					if (index != -1) {
																						if (OldObj.status != 0) {
																							$(`#currentPlayingIndicator_list_${currentContentState.contentType}_${currentContentState.contentId}`).html('<span><i class="far fa-check-square"></i></span>');
																						} else {
																							$(`#currentPlayingIndicator_list_${currentContentState.contentType}_${currentContentState.contentId}`).html('<span><i class="far fa-square"></i></span>');
																							if (defaultContentId == 0) {
																								defaultContentType = currentContentState.contentType;
																								defaultContentId = currentContentState.contentId;
																							}
																						}
																					} else {
																						newContentInCourse = true;
																						oldContentStates.contents.push(currentContentState);

																						$(`#currentPlayingIndicator_list_${currentContentState.contentType}_${currentContentState.contentId}`).html('<span><i class="far fa-square"></i></span>');
																						if (defaultContentId == 0) {
																							defaultContentType = currentContentState.contentType;
																							defaultContentId = currentContentState.contentId;
																						}
																					}

																					statusIndex++;
																					if (statusIndex === currentCourseContentStatus.contents.length) {
																						if (newContentInCourse) {
																							courseContentStatus.courseState = JSON.stringify(oldContentStates);
																							const updateData = { courseData: JSON.stringify(courseContentStatus) };
																							RequestOptions(constructUrl("/api/restsaveusercoursestate"), "POST", updateData)
																								.then(request => {
																									Http.request(request)
																										.then(res => {
																											if (isValidResponse(res, "restsaveusercoursestate")) {
																												console.log("Content Status updated - " + JSON.stringify(res.data));
																											}
																										})
																										.catch(err => apiRequestFailed(err, "restsaveusercoursestate"));
																								});
																						}

																						if (defaultContentId > 0) {
																							viewContent(defaultContentType, defaultContentId);
																							$("#loadingSpinner").hide();
																						} else {
																							viewCertificate();
																							$("#loadingSpinner").hide();
																						}
																					}
																				}
																			}
																		}
																	})
																	.catch(err => apiRequestFailed(err, "restgetusercoursestate"));
															});
													} else {
														contentString += ',';
													}
												}
											}
										})
										.catch(err => apiRequestFailed(err, "getcoursecontents"));
								});
						} else {
							getNewToken(shared.mCustomerDetailsJSON.userName, shared.mCustomerDetailsJSON.password, `loadCourse(${id})`);
						}
					}
				})
				.catch(err => {
					apiRequestFailed(err, "getcoursebyid");
					$('#loadingmessage').hide();
				});
		})
		.catch(err => {
			console.warn("Request aborted due to missing requestOptions (getcoursebyid).", err);
			$('#loadingmessage').hide();
		});
}

function viewContent(contentType, contentId) {
    $('#loadingmessage').show();
    viewContentOverview();
    hideCourseContentMenu();
    hideAboutCourse();

    let contentHtml = "";

    if (contentType === "Content") {
        $("#assessmentViewArea").css("display", "none");
        $("#contentViewArea").css("display", "block");

        const data = { contentId: contentId };

        buildRequestOptions(constructUrl("/api/restgetcontentbyid"), "GET", data)
        .then((request) => {
            Http.request(request)
            .then((res) => {
                if (isValidResponse(res, "restgetcontentbyid")) {
                    const content = (typeof res.data === "string" ? JSON.parse(res.data) : res.data);

                    if (content.error !== "invalid_tolen") {
                        if (content) {
                            const wid = $("#contentViewBox").width();
                            console.log("Outer Width:", wid);

                            // --- Handle all content types exactly like original ---
                            if (content.type.includes("Youtube")) {
                                let contUrl = content.contentUrl;
                                if (!contUrl.includes("embed")) {
                                    const contArr = contUrl.split("/");
                                    const contId = contArr[contArr.length - 1];
                                    contUrl = "https://www.youtube.com/embed/" + contId;
                                }
                                contentHtml = `
                                    <div class="view-container">
                                        <iframe width="560" height="315" src="${contUrl}" 
                                        title="YouTube video player" frameborder="0" 
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                                        allowfullscreen></iframe>
                                    </div>`;
                                $("#contentViewBox").html(contentHtml);
                            } 
                            else if (content.type.includes("File Video")) {
                                contentHtml = `
                                    <video controls controlsList="nodownload noremoteplayback" id="videoFrame" 
                                    style="width: ${wid}px !important; position: absolute;">
                                        <source src="${content.contentUrl}" type="video/mp4">
                                    </video>`;
                                $("#contentViewBox").html(contentHtml);
                            } 
                            else if (content.type.includes("File PPT")) {
                                let contUrl = content.contentUrl;
                                if (!contUrl.includes("embed")) {
                                    const contArr = contUrl.split("/");
                                    const contId = contArr[5];
                                    contUrl = "https://docs.google.com/presentation/d/" + contId + "/embed";
                                }
                                contentHtml = `<iframe src="${contUrl}" frameborder="0" width="100%" height="100%" allowfullscreen></iframe>`;
                                $("#contentViewBox").html(contentHtml);
                            } 
                            else if (content.type.includes("File PDF")) {
                                contentHtml = `<iframe src="${content.contentUrl}#toolbar=0" style="width:100%; height:100%;" frameborder="0"></iframe>`;
                                $("#contentViewBox").html(contentHtml);
                            } 
                            else if (content.type.includes("HTML")) {
                                contentHtml = content.contentUrl;
                                $("#contentViewBox").html(contentHtml);
                            } 
                            else if (content.type.includes("Image")) {
                                contentHtml = `
                                    <img src="${content.contentUrl}" 
                                    style="object-fit: contain; position: absolute; max-height: 100%; width: 100%;" 
                                    onerror="this.src='../img/noimage.jpg';" 
                                    alt="${content.description}">
                                `;
                                $("#contentViewBox").html(contentHtml);
                            }

                            runningContent = content;
                            runningContentType = "Content";
                            runningContentId = contentId;
                            startProgressMonitoring();
                        }

                        // --- Update content info box ---
                        let contentHtml1 = `
                            <div id="contentNameField" class="titleFontClass">${content.contentName}</div>
                            <div id="contentDescriptionField" class="contentDetailText">${content.description}</div>
                        `;
                        $("#contentDescriptionBox").html(contentHtml1);
                        $('#loadingmessage').hide();
                    } else {
                        // Token expired → regenerate
                        getNewToken(shared.mCustomerDetailsJSON.userName, shared.mCustomerDetailsJSON.password, `viewContent('${contentType}', ${contentId})`);
                    }
                }
            })
            .catch((err) => {
                console.error("restgetcontentbyid failed!", err);
                $('#loadingmessage').hide();
            });
        })
        .catch((err) => {
            console.warn("Request aborted due to missing requestOptions.", err);
            $('#loadingmessage').hide();
        });
    } 
    else if (contentType === "Assessment") {
        showAssessment(contentId, false);
    }

    HighlightList(contentType, contentId);
}

/******************************************************************** COURSE STATUS ******************************************************************** */

var monitorTimer = null;
var contentDuration = 0;
var runningDuration = 0;

// Progress monitoring for time spent on the running content
function startProgressMonitoring() {
	if(monitorTimer != null) {
		clearInterval(monitorTimer);
	}
	
	var vid = document.getElementById("videoFrame");
	if(vid != null) {
		contentDuration = vid.duration;
	} else {
		if((runningContent.contentDuration != null) && (runningContent.contentDuration.length > 0)) {
			// Convert hh:mm:ss to seconds
			var arr = runningContent.contentDuration.split(':');
			if(arr.length == 3) {
				contentDuration = (+arr[0]) * 60 * 60 + (+arr[1]) * 60 + (+arr[2]);
			} else if(arr.length == 2) {
				contentDuration = ((+arr[0]) * 60 + (+arr[1]));
			} else {
				contentDuration = (+arr[0]);
			}
		} else {
			contentDuration = 10;
		}
	}
	runningDuration = 0;
	
	monitorTimer = setInterval(monitorProgress, 1000);
}

function monitorProgress() {
	var vid = document.getElementById("videoFrame");
	if(vid != null) {
		console.log("Progress: "+vid.currentTime);
		if(vid.currentTime >= (vid.duration * 0.8)) {	// 80% of content is run
			clearInterval(monitorTimer);
			updateCourseStatus("Content", runningContent.id, 1);
		}
	} else {
		runningDuration++;
		if(runningDuration >= contentDuration*0.8) {
			clearInterval(monitorTimer);
			updateCourseStatus("Content", runningContent.id, 1);
		}
	}
}

function updateCourseStatus(contentType, contentId, contentStatus) {
    try {
        var contJson = JSON.parse(courseContentStatus.courseState);

        for (var index in contJson.contents) {
            if (
                contJson.contents[index].contentType === contentType &&
                contJson.contents[index].contentId === contentId
            ) {
                // Update content status
                contJson.contents[index].status = contentStatus;

                // Update UI icon
                $("#currentPlayingIndicator_list_" + contJson.contents[index].contentType + "_" + contJson.contents[index].contentId)
                    .html('<span><i class="far fa-check-square"></i></span>');

                // Update the course state
                courseContentStatus.courseState = JSON.stringify(contJson);

                var data = { courseData: JSON.stringify(courseContentStatus) };

                // Build request options (Capacitor-style)
                RequestOptions(constructUrl("/api/restsaveusercoursestate"), "POST", data)
                    .then(request => {
                        Http.request(request)
                            .then(res => {
                                if (isValidResponse(res, "restsaveusercoursestate")) {
                                    console.log("Content Status save - " + JSON.stringify(res));
                                    $("#loadingSpinner").hide();
                                }
                            })
                            .catch(err => {
                                console.error("Content status update failed from server!", err);
                                $("#loadingmessage").hide();
                            });
                    })
                    .catch(err => {
                        console.warn("Request aborted due to missing requestOptions.", err);
                    });

                return false; // stop looping once matched
            }
        }
    } catch (err) {
        console.error("Unexpected error while updating course status!", err);
        $("#loadingmessage").hide();
    }
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
    try {
        $("#contentViewArea").css("display", "none");
        $("#assessmentViewArea").css("display", "block");

        const data = { token: shared.mCustomerDetailsJSON.token, assessmentId: id };

        // Step 1: Get assessment by ID
        buildRequestOptions(constructUrl("/api/getassessmentbyid"), "GET", data)
            .then(request => {
                Http.request(request)
                    .then(res => {
                        if (isValidResponse(res, "getassessmentbyid")) {
                            const responseData = typeof res.data === "string" ? JSON.parse(res.data) : res.data;
                            testContent = responseData;

                            // Token validation check
                            if (testContent.error !== "invalid_tolen") {
                                // Step 2: Get user assessment state
                                buildRequestOptions(constructUrl("/api/restgetuserassessmentstate"), "GET", data)
                                    .then(request2 => {
                                        Http.request(request2)
                                            .then(res2 => {
                                                if (isValidResponse(res2, "restgetuserassessmentstate")) {
                                                    const takenTest = typeof res2.data === "string" ? JSON.parse(res2.data) : res2.data;

                                                    // If new test or repeat mode
                                                    if (takenTest == null || repeat === true) {
                                                        // Step 3: Get assessment questions
                                                        buildRequestOptions(constructUrl("/api/getassessmentquestions"), "GET", data)
                                                            .then(request3 => {
                                                                Http.request(request3)
                                                                    .then(res3 => {
                                                                        if (isValidResponse(res3, "getassessmentquestions")) {
                                                                            const assessmentQuestions = typeof res3.data === "string" ? JSON.parse(res3.data) : res3.data;

                                                                            testQuestions = assessmentQuestions;
                                                                            questionCount = 0;

                                                                            if (assessmentQuestions.length > 0) {
                                                                                let contentHtml = "";
                                                                                contentHtml += '<div id="contentNameField" class="titleFontClass">' + testContent.title + '</div>';
                                                                                contentHtml += '<div id="contentDescriptionField" class="contentDetailText">' + testContent.description + '</div>';
                                                                                $("#contentDescriptionBox").html(contentHtml);

                                                                                contentHtml = "";

                                                                                if (testContent.timeLimitEnable === true) {
                                                                                    contentHtml += '<div id="timeLimitArea">';
                                                                                    contentHtml += '<div id="assessmentTimeText">Time Limit: </div>';
                                                                                    contentHtml += '<div id="assessmentTime">' + testContent.timeLimit + '</div>';
                                                                                    contentHtml += '</div>';
                                                                                }

                                                                                contentHtml += '<div id="assessmentBox"></div>';
                                                                                contentHtml += '<div id="qPaperFooter">';
                                                                                contentHtml += '<div></div>';
                                                                                contentHtml += '<div id="submitBtn" class="btn btn-info rounded-pill submitbtn" style="padding: 8px 30px;" onclick="getSubmittedAnswer()">Submit  <i class="fas fa-arrow-right"></i></div>';
                                                                                contentHtml += '</div>';

                                                                                $("#assessmentViewBox").html(contentHtml);

                                                                                if (testContent.timeLimitEnable === true) {
                                                                                    const timeArr = testContent.timeLimit.split(":");
                                                                                    timeLimit = (+timeArr[0]) * 60 * 60 + (+timeArr[1]) * 60;
                                                                                    countDownTimer = setInterval(assessmentCountdownTimerHandler, 1000);
                                                                                }

                                                                                shuffleIndex(assessmentQuestions.length).then(numArr => {
                                                                                    qSequence = numArr;
                                                                                    console.log("qSequence:", qSequence);
                                                                                    getQuestions();
                                                                                });

                                                                                answerString = "";
                                                                                assessmentResult = JSON.parse(null);
                                                                            }
                                                                        }
                                                                    })
                                                                    .catch(err => {
                                                                        console.error("Failed to load assessment questions!", err);
                                                                        $("#loadingmessage").hide();
                                                                    });
                                                            })
                                                            .catch(err => {
                                                                console.warn("Request aborted for getassessmentquestions.", err);
                                                            });
                                                    } else {
                                                        assessmentResult = JSON.parse(takenTest.assessmentState);
                                                        showReport(false);
                                                        $("#loadingSpinner").hide();
                                                    }
                                                }
                                            })
                                            .catch(err => {
                                                console.error("Failed to get user assessment state!", err);
                                                $("#loadingmessage").hide();
                                            });
                                    })
                                    .catch(err => {
                                        console.warn("Request aborted for restgetuserassessmentstate.", err);
                                    });
                            } else {
                                // Token expired → regenerate and recall
                                getNewToken(shared.mCustomerDetailsJSON.userName, shared.mCustomerDetailsJSON.password, "showAssessment(" + id + ")");
                            }
                        }
                    })
                    .catch(err => {
                        console.error("Failed to get assessment by ID!", err);
                        $("#loadingmessage").hide();
                    });
            })
            .catch(err => {
                console.warn("Request aborted due to missing requestOptions (getassessmentbyid).", err);
            });
    } catch (err) {
        console.error("Unexpected error in showAssessment!", err);
        $("#loadingmessage").hide();
    }
}

function assessmentCountdownTimerHandler() {
	timeLimit--;
	
	if((timeLimit < 60) && ($("#assessmentTime").hasClass("warningText") == false)) {
		$("#assessmentTime").addClass("warningText");
	}

	var timeStr = new Date(timeLimit*1000).toISOString().substr(11, 8);
	$("#assessmentTime").html(timeStr);
	if(timeLimit == 0) {
		questionCount = testQuestions.length;
		getSubmittedAnswer();
		
		//showReport();
	}
}


function getQuestions() {
    var contentHtml = "";

    // Case 1: One question at a time
    if (testContent.oneQuestionAtATime === true) {
        var qIndex = questionCount;
        if (testContent.randomizeQuestionSequence === true) {
            qIndex = qSequence[questionCount];
        }

        if (questionCount < testQuestions.length) {
            questionCount++;

            var data = { token: shared.mCustomerDetailsJSON.token, questionId: testQuestions[qIndex].questionId };

            buildRequestOptions(constructUrl("/api/getquestionbyid"), "GET", data)
                .then(request => {
                    Http.request(request)
                        .then(res => {
                            if (isValidResponse(res, "getquestionbyid")) {
                                var obj = typeof res.data === "string" ? JSON.parse(res.data) : res.data;

                                if (obj.error !== "invalid_tolen") {
                                    // Build question display
                                    contentHtml += '<div class="assessmentquestioanswerbox">';
                                    if (obj.questionImage && obj.questionImage.length > 0) {
                                        contentHtml += '<img class="assessmentquestion" src="' + obj.questionImage + '">';
                                    }
                                    contentHtml += '<div class="assessmentquestion">' + questionCount + ". " + obj.questionName + "</div>";

                                    var choiceArr = obj.choices.split("#");
                                    var aSequence = shuffleIndex(choiceArr.length);
                                    for (var i = 0; i < choiceArr.length; i++) {
                                        var aIndex = i;
                                        if (testContent.randomizeAnswerSequence === true) {
                                            aIndex = aSequence[i];
                                        }
                                        var choice = choiceArr[aIndex];
                                        if (obj.multipleAnswer) {
                                            contentHtml +=
                                                '<input class="assessmentanswer" type="checkbox" id="q' +
                                                obj.id +
                                                "a" +
                                                aIndex +
                                                '" name="q' +
                                                obj.id +
                                                '" value="' +
                                                choice +
                                                '"><label for="q' +
                                                obj.id +
                                                "a" +
                                                aIndex +
                                                '" class="assessmentanswerlabel">' +
                                                choice +
                                                "</label><br>";
                                        } else {
                                            contentHtml +=
                                                '<input class="assessmentanswer" type="radio" id="q' +
                                                obj.id +
                                                "a" +
                                                aIndex +
                                                '" name="q' +
                                                obj.id +
                                                '" value="' +
                                                choice +
                                                '"><label for="q' +
                                                obj.id +
                                                "a" +
                                                aIndex +
                                                '" class="assessmentanswerlabel">' +
                                                choice +
                                                "</label><br>";
                                        }
                                    }

                                    testAnswers[questionCount - 1] = obj.answers;
                                    contentHtml += "</div>";

                                    $("#assessmentBox").html(contentHtml);
                                    $("#loadingmessage").hide();
                                } else {
                                    // Token expired — regenerate
                                    getNewToken(
                                        shared.mCustomerDetailsJSON.userName,
                                        shared.mCustomerDetailsJSON.password,
                                        "getQuestions()"
                                    );
                                }
                            }
                        })
                        .catch(err => {
                            console.error("Failed to load question by ID!", err);
                            $("#loadingmessage").hide();
                        });
                })
                .catch(err => {
                    console.warn("Request aborted for getquestionbyid.", err);
                });
        }

        // Case 2: All questions at once
    } else {
        function nextAjax(idx) {
            var qIndex = idx;
            if (testContent.randomizeQuestionSequence === true) {
                qIndex = qSequence[idx];
            }

            console.log(
                "qIndex: " +
                    qIndex +
                    ", QuestionId: " +
                    testQuestions[qIndex].questionId +
                    ", QuestionName: " +
                    testQuestions[qIndex].questionName
            );

            var data = { token: shared.mCustomerDetailsJSON.token, questionId: testQuestions[qIndex].questionId };

            buildRequestOptions(constructUrl("/api/getquestionbyid"), "GET", data)
                .then(request => {
                    Http.request(request)
                        .then(res => {
                            if (isValidResponse(res, "getquestionbyid")) {
                                var obj = typeof res.data === "string" ? JSON.parse(res.data) : res.data;

                                if (obj.error !== "invalid_tolen") {
                                    console.log("QuestionId:", obj.id, "QuestionName:", obj.questionName);

                                    questionCount++;
                                    contentHtml += '<div class="assessmentquestioanswerbox">';
                                    if (obj.questionImage && obj.questionImage.length > 0) {
                                        contentHtml += '<img class="assessmentquestion" src="' + obj.questionImage + '">';
                                    }
                                    contentHtml += '<div class="assessmentquestion">' + questionCount + ". " + obj.questionName + "</div>";

                                    var choiceArr = obj.choices.split("#");
                                    var aSequence = shuffleIndex(choiceArr.length);
                                    for (var i = 0; i < choiceArr.length; i++) {
                                        var aIndex = i;
                                        if (testContent.randomizeAnswerSequence === true) {
                                            aIndex = aSequence[i];
                                        }
                                        var choice = choiceArr[aIndex];
                                        if (obj.multipleAnswer) {
                                            contentHtml +=
                                                '<input class="assessmentanswer" type="checkbox" id="q' +
                                                obj.id +
                                                "a" +
                                                aIndex +
                                                '" name="q' +
                                                obj.id +
                                                '" value="' +
                                                choice +
                                                '"><label for="q' +
                                                obj.id +
                                                "a" +
                                                aIndex +
                                                '" class="assessmentanswerlabel">' +
                                                choice +
                                                "</label><br>";
                                        } else {
                                            contentHtml +=
                                                '<input class="assessmentanswer" type="radio" id="q' +
                                                obj.id +
                                                "a" +
                                                aIndex +
                                                '" name="q' +
                                                obj.id +
                                                '" value="' +
                                                choice +
                                                '"><label for="q' +
                                                obj.id +
                                                "a" +
                                                aIndex +
                                                '" class="assessmentanswerlabel">' +
                                                choice +
                                                "</label><br>";
                                        }
                                    }

                                    contentHtml += "</div>";
                                    testAnswers[questionCount - 1] = obj.answers;

                                    // Recursively fetch next question
                                    if (idx === testQuestions.length - 1) {
                                        $("#assessmentBox").html(contentHtml);
                                        $("#loadingmessage").hide();
                                    } else {
                                        nextAjax(idx + 1);
                                    }
                                } else {
                                    // Token expired — regenerate
                                    getNewToken(
                                        shared.mCustomerDetailsJSON.userName,
                                        shared.mCustomerDetailsJSON.password,
                                        "getQuestions()"
                                    );
                                }
                            }
                        })
                        .catch(err => {
                            console.error("Failed to load question by ID!", err);
                            $("#loadingmessage").hide();
                        });
                })
                .catch(err => {
                    console.warn("Request aborted for getquestionbyid.", err);
                });
        }

        nextAjax(0);
    }
}

function getSubmittedAnswer() {
	var score = 0;

	if(testContent.oneQuestionAtATime == true) {
		var qIndex = questionCount-1;
		if(testContent.randomizeQuestionSequence == true) {
			qIndex = qSequence[questionCount-1];
		}
		
		if(questionCount-1 == 0) {
			answerString += '{"content": [';
		} else {
			answerString += ',';
		}
		
		if(questionCount <= testQuestions.length) {
			answerString += '{"Q":"'+testQuestions[qIndex].questionName+'",';
			answerString += '"QID":"'+testQuestions[qIndex].questionId+'",';
			console.log("Question: "+testQuestions[qIndex].questionName);
			var elements = document.getElementsByName('q'+testQuestions[qIndex].questionId);
			var ansIndex = 0;
			var correctAnswerCount = 0;
			
			answerString += '"A": "';
			$.each(elements, function(key, elem) { 
				if (elem.checked) {
					if(ansIndex != 0) {
						answerString += '#';
					}
					answerString += elem.value;
					if(testAnswers[questionCount-1].includes(elem.value)) {
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

			if(ansIndex == 0) {
				score = 0;
			} else {
				var ansArray = testAnswers[questionCount-1].split('#');
				if(correctAnswerCount < 0) {
					correctAnswerCount = 0;
				}
				score = (correctAnswerCount/ansArray.length);
			}
			answerString += '",'
			answerString += '"RA":"'+testAnswers[questionCount-1]+'",';
			answerString += '"score": '+score+'}';
			
			if(questionCount == testQuestions.length) {
				answerString += '],';
				var date = new Date();
				answerString += '"date":"'+date+'"}';
				console.log("Answer String: "+answerString);
				assessmentResult = JSON.parse(answerString);
				console.log("Answer: "+JSON.stringify(assessmentResult));
				showReport(true);

			} else {
				getQuestions();
			}
		} 
		

	} else {

		for(var idx=0; idx<testQuestions.length; idx++) {
			var qIndex = idx;
			if(testContent.randomizeQuestionSequence == true) {
				qIndex = qSequence[idx];
			}
			
			if(idx == 0) {
				answerString += '{"content": [';
			} else {
				answerString += ',';
			}
			answerString += '{"Q":"'+testQuestions[qIndex].questionName+'",';
			answerString += '"QID":"'+testQuestions[qIndex].questionId+'",';
			//console.log("Question: "+testQuestions[qIndex].questionName);
			var elements = document.getElementsByName('q'+testQuestions[qIndex].questionId);
			var ansIndex = 0;
			var correctAnswerCount = 0;
			
			answerString += '"A": "';
			$.each(elements, function(key, elem) {
				if (elem.checked) {
					if(ansIndex != 0) {
						answerString += '#';
					}
					answerString += elem.value;
					if(testAnswers[idx].includes(elem.value)) {
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
			
			// if no answer selected
			if(ansIndex == 0) {
				score = 0;
			} else {
				var ansArray = testAnswers[idx].split('#');
				if(correctAnswerCount < 0) {
					correctAnswerCount = 0;
				}
				score = (correctAnswerCount/ansArray.length);
			}
			answerString += '",'
			answerString += '"RA":"'+testAnswers[idx]+'",';
			answerString += '"score": '+score+'}';
			
			if(idx == testQuestions.length-1) {
				answerString += '],';
				var date = new Date();
				answerString += '"date":"'+date+'"}';

				console.log("Answer String: "+answerString);
				assessmentResult = JSON.parse(answerString);
				console.log("Answer: "+JSON.stringify(assessmentResult));
				showReport(true);
			}

			//contentHtml += '<hr>';

		}
	}
}

function showReport(saveData) {
	if(countDownTimer) {
		clearInterval(countDownTimer);
	}

	//$("#resultScreen").css("display", "flex");
	var contentHtml = "";
	if(testContent.showResultAll == true) {
						
		var totalScore = 0;
		for(var count=0; count<assessmentResult.content.length; count++) {
			if(assessmentResult.content[count] != undefined) {
				totalScore += assessmentResult.content[count].score;
			}
		}
		var percentage = Math.floor((totalScore/assessmentResult.content.length)*100);
		contentHtml += '<div id="assessmentReportArea">';
			contentHtml += '<div class="assessmenttitletext">ASSESSMENT COMPLETED</div>';
			contentHtml += '<div class="assessmentresulttext">Hello '+shared.mCustomerDetailsJSON.firstName+', you have completed "'+testContent.assessmentName+'" on '+assessmentResult.date+', with the score of '+percentage+'%.</div>';
		contentHtml += '</div>';
		
		contentHtml += '<div id="qPaperFooter">';
			contentHtml += '<div id="takeTestBtn" class="btn btn-info rounded-pill submitbtn" style="padding: 8px 30px;" onclick="showAssessment('+testContent.id+', true)">Take the test Again <i class="fas fa-redo"></i></div>';
			contentHtml += '<div id="detailedReportBtn" class="btn btn-info rounded-pill submitbtn" style="padding: 8px 30px;" onclick="getDetailedReport()">Detailed Report <i class="far fa-file-alt"></i></div>';
		contentHtml += '</div>';

	} else {
		contentHtml += '<div class="assessmenttitletext">Assessment is completed. Thank you for taking the test.</div>';
	}
	$("#assessmentViewBox").html(contentHtml);
	if(saveData == true) {
		saveAssessmentState();
	}
	
}

function saveAssessmentState() {
    $("#loadingSpinner").show();

    const data = { token: shared.mCustomerDetailsJSON.token, assessmentId: testContent.id };

    // Build GET request for user assessment state
    buildRequestOptions(constructUrl("/api/restgetuserassessmentstate"), "GET", data)
    .then(request => {
        Http.request(request)
        .then(res => {
            if (isValidResponse(res, "restgetuserassessmentstate")) {
                const dataJson = res.data ? (typeof res.data === "string" ? JSON.parse(res.data) : res.data) : null;

                if (dataJson != null) {
                    dataJson.assessmentState = JSON.stringify(assessmentResult);

                    const postData = { assessmentdata: JSON.stringify(dataJson) };
                    RequestOptions(constructUrl("/api/restsaveuserassessmentstate"), "POST", postData)
                    .then(postReq => {
                        Http.request(postReq)
                        .then(saveRes => {
                            if (isValidResponse(saveRes, "restsaveuserassessmentstate")) {
                                console.log("Assessment Answers save: " + JSON.stringify(saveRes));
                                updateCourseStatus("Assessment", testContent.id, 1);
                                $("#loadingSpinner").hide();
                            }
                        })
                        .catch(err => {
                            apiRequestFailed(err, "restsaveuserassessmentstate");
                            $("#loadingmessage").hide();
                        });
                    })
                    .catch(err => console.warn("Request aborted due to missing postRequestOptions.", err));

                } else {
                    // Fetch blank assessment state
                    const blankData = { token: shared.mCustomerDetailsJSON.token };
                    buildRequestOptions(constructUrl("/api/restgetblankuserassessmentstate"), "GET", blankData)
                    .then(blankReq => {
                        Http.request(blankReq)
                        .then(blankRes => {
                            if (isValidResponse(blankRes, "restgetblankuserassessmentstate")) {
                                console.log("Blank Assessment State: " + JSON.stringify(blankRes));

                                let dataJson = typeof blankRes.data === "string" ? JSON.parse(blankRes.data) : blankRes.data;
                                dataJson.userId = shared.mCustomerDetailsJSON.id;
                                dataJson.userName = shared.mCustomerDetailsJSON.userName;
                                dataJson.assessmentId = testContent.id;
                                dataJson.assessmentName = testContent.assessmentName;
                                dataJson.assessmentState = JSON.stringify(assessmentResult);

                                const postData = { assessmentdata: JSON.stringify(dataJson) };
                                RequestOptions(constructUrl("/api/restsaveuserassessmentstate"), "POST", postData)
                                .then(postReq => {
                                    Http.request(postReq)
                                    .then(saveRes => {
                                        if (isValidResponse(saveRes, "restsaveuserassessmentstate")) {
                                            console.log("Assessment Answers save: " + JSON.stringify(saveRes));
                                            updateCourseStatus("Assessment", testContent.id, 1);
                                            $("#loadingSpinner").hide();
                                        }
                                    })
                                    .catch(err => {
                                        apiRequestFailed(err, "restsaveuserassessmentstate");
                                        $("#loadingmessage").hide();
                                    });
                                })
                                .catch(err => console.warn("Request aborted due to missing postRequestOptions.", err));
                            }
                        })
                        .catch(err => {
                            apiRequestFailed(err, "restgetblankuserassessmentstate");
                            $("#loadingmessage").hide();
                        });
                    })
                    .catch(err => console.warn("Request aborted due to missing blankRequestOptions.", err));
                }
            }
        })
        .catch(err => {
            apiRequestFailed(err, "restgetuserassessmentstate");
            $("#loadingmessage").hide();
        });
    })
    .catch(err => console.warn("Request aborted due to missing requestOptions.", err));
}


function getDetailedReport() {
	var contentHtml = "";
	
	contentHtml += '<div>';
		contentHtml += 'Date: '+assessmentResult.date;
	contentHtml += '</div>';

	for(index in assessmentResult.content) {
		contentHtml += '<table class="noborder">';
			contentHtml += '<colgroup><col span="1" style="width: 90%"><col span="1" style="width: 10%"></colgroup>';
			contentHtml += '<tr class="noborder">';
				contentHtml += '<td class="noborder">';
					let sl = 1 + parseInt(index);
					contentHtml += '<div class="assessmentquestion">'+sl+'. '+assessmentResult.content[index].Q+'</div>';
					contentHtml += '<div class="assessmentanswer">Your Answer: '+assessmentResult.content[index].A.replace("#", ", ")+'</div>';
					contentHtml += '<div class="assessmentanswer">Right Answer: '+assessmentResult.content[index].RA.replace("#", ", ")+'</div>';
				contentHtml += '</td>';
				contentHtml += '<td class="noborder">';
					let score = assessmentResult.content[index].score;
					if(score == 1) {
						contentHtml += '<div style="font-size: 3em; color: rgb(0, 200, 0);"><i class="fas fa-check"></i></div>';
					} else if (score == 0) {
						contentHtml += '<div style="font-size: 3em; color: rgb(255, 0, 0);"><i class="fas fa-times"></i></div>';
					} else {
						contentHtml += '<div style="font-size: 3em; color: rgb(255, 200, 0);"><i class="fas fa-check"></i></div>';
					}
					contentHtml += '<div class="assessmentanswer">Score: '+assessmentResult.content[index].score+'</div>';
				contentHtml += '</td>';
			contentHtml += '<tr>';
		contentHtml += '</table>';
	}
	
	contentHtml += '<div id="qPaperFooter">';
		contentHtml += '<div id="detailedReportBtn" class="btn btn-info rounded-pill submitbtn" style="padding: 8px 30px;" onclick="showReport(false)"><i class="fas fa-arrow-left"></i> Back</div>';
		contentHtml += '<div id="takeTestBtn" class="btn btn-info rounded-pill submitbtn" style="padding: 8px 30px;" onclick="showAssessment('+testContent.id+', true)">Take the test Again <i class="fas fa-redo"></i></div>';
	contentHtml += '</div>';
	
	$("#assessmentViewBox").html(contentHtml);
}

function viewCertificate() {

	$("#contentViewArea").css("display", "none");
	$("#assessmentViewArea").css("display", "block");


	var contentHtml = "";

	contentHtml += '<div id="assessmentCertificateArea">';
//		contentHtml += '<img src="https://bviucp.s3.ap-south-1.amazonaws.com/bviu_resource/bviu_contents/certificate_background.jpg" style="width: 100%;"/>';
		contentHtml += '<img src="https://bviucp.s3.ap-south-1.amazonaws.com/bviu_resource/bviu_contents/Certificate-template.png" style="width: 100%;"/>';

		contentHtml += '<div id="certificateTextBox">';
			contentHtml += '<div class="certificatetitletext">Certificate</div>';
			contentHtml += '<div class="certificatetext">Hello '+shared.mCustomerDetailsJSON.firstName+', This is to certify that you have successfully completed the course "'+courseContentStatus.courseName+'".</div>';
		contentHtml += '</div>';
	contentHtml += '</div>';
	
	$("#assessmentViewBox").html(contentHtml);

}

/******************************************************************** DISPLAYS And MENUS ******************************************************************** */

function viewCourseContentMenu() {
    $("#assessmentContentListArea").addClass("visible");
    $("#carrot2").addClass("carrot-down");
    $("#courseContentButton").addClass("button-selected");
}

function hideCourseContentMenu() {
    $("#assessmentContentListArea").removeClass("visible");
    $("#carrot2").removeClass("carrot-down");
    $("#courseContentButton").removeClass("button-selected");
}

function toggleCourseContentMenu() {
    $("#assessmentContentListArea").toggleClass("visible");
    $("#carrot2").toggleClass("carrot-down");
    $("#courseContentButton").toggleClass("button-selected");
}

function viewAboutCourse() {
    $("#courseDescriptionBox").addClass("visible");
    $("#carrot1").addClass("carrot-down");
    $("#aboutCourseButton").addClass("button-selected");
    
}

function hideAboutCourse() {
    $("#courseDescriptionBox").removeClass("visible");
    $("#carrot1").removeClass("carrot-down");
    $("#aboutCourseButton").removeClass("button-selected");
    
}

function toggleAboutCourse() {
    $("#courseDescriptionBox").toggleClass("visible");
    $("#carrot1").toggleClass("carrot-down");
    $("#aboutCourseButton").toggleClass("button-selected");
    
}

function viewContentOverview() {
    $("#contentDescriptionBox").addClass("visible");
    $("#carrot3").addClass("carrot-down");
    $("#contentOverviewButton").addClass("button-selected");
    
}

function hideContentOverview() {
    $("#contentDescriptionBox").removeClass("visible");
    $("#carrot3").removeClass("carrot-down");
    $("#contentOverviewButton").removeClass("button-selected");
    
}

function toggleContentOverview() {
    $("#contentDescriptionBox").toggleClass("visible");
    $("#carrot3").toggleClass("carrot-down");
    $("#contentOverviewButton").toggleClass("button-selected");
    
}


window.viewCourses = viewCourses;
window.loadCourse = loadCourse;
window.viewContent = viewContent;
window.startProgressMonitoring = startProgressMonitoring;
window.monitorProgress = monitorProgress;
window.updateCourseStatus = updateCourseStatus; 
window.HighlightList = HighlightList;
window.shuffleIndex = shuffleIndex;
window.showAssessment = showAssessment;
window.assessmentCountdownTimerHandler = assessmentCountdownTimerHandler;
window.getQuestions = getQuestions;
window.getSubmittedAnswer = getSubmittedAnswer;
window.showReport = showReport;
window.saveAssessmentState = saveAssessmentState;
window.getDetailedReport = getDetailedReport;
window.viewCertificate = viewCertificate;
window.viewCourseContentMenu = viewCourseContentMenu;
window.hideCourseContentMenu = hideCourseContentMenu;
window.toggleCourseContentMenu = toggleCourseContentMenu;
window.viewAboutCourse = viewAboutCourse;
window.hideAboutCourse = hideAboutCourse;
window.toggleAboutCourse = toggleAboutCourse;
window.viewContentOverview = viewContentOverview;
window.hideContentOverview = hideContentOverview;
window.toggleContentOverview = toggleContentOverview;
