import { Filesystem, Directory, Encoding } from "@capacitor/filesystem"
import { Capacitor } from '@capacitor/core';
import { Device } from "@capacitor/device"
import { Http } from '@capacitor-community/http';
import { Network } from '@capacitor/network';
import { App } from '@capacitor/app';
import $ from 'jquery';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

var unsavedData = false;
var formTemplates = {};
var ertconfig = null;
var allErtMembers = null;
var allErtMemberStates = null;
var allErtTeams = null;
var allErtShifts = null;
var currentFpsState = null;
let selectedMemberUserId = 0;
let selectedMemberName = '';
let selectedMemberMemberId = 0;
let selectedMemberFingerNo = -1;
let registerNewFinger = true;
let fpRegistrationStep = 0;
let currentErtState = '';
var currentFpsState = null;
var _ertStateTimer = null;
var listItems = [];
const TASK_HEADER = 0;
const TASK_FOOTER = 1;
const TASK_BODY = 2;
let fingerprintScannerOpen = false;

import { shared , appUrl } from "./globals";
import { displaySection , buildRequestOptions , isValidResponse} from "./capacitor-welcome";
import { viewHome } from "./settings";
import { showDialog , highlightHeaderTabMenu , constructUrl , startAppIdleTimer , stopAppIdleTimer} from "./utility";


// function viewErt() {
// 	shared.currentRunningApp = 'ert';
// 	$('#moduleTitle').html("ERT");
// 	displaySection('modulesSection', 'flex', false, true);
// 	// displaySection('ertSection', 'flex', false, false);
// 	stopAppIdleTimer();

// 	//updateAppRuntime("ert", "on", "ok");
// 	//initFingerprintScanner();
// 	getERTFile();

// 	$('#modulesMenuArea').show();
// 	$('#modulesListArea').show();
// 	$('#modulesDisplayArea').hide();

// 	if (shared.mCustomerDetailsJSON != null) {
// 		displayErtMenu();
// 		let btn = document.getElementById("btnId_view_members");
// 		setTimeout(function() {
// 			btn.click();
// 		}, 200);

// 	} else {
// 		displayErtScreen();
// 	}
// }

function viewErt() {
	shared.currentRunningApp = 'ert';
	$('#moduleTitle').html("ERT");
	displaySection('modulesSection', 'flex', false, true);
	// displaySection('ertSection', 'flex', false, false);
	closeLoginWindow();

	updateAppRuntime("ert", "on", "ok");
	//initFingerprintScanner();
	// getERTFile();

	$('#modulesMenuArea').show();
	$('#modulesListArea').show();
	$('#modulesDisplayArea').hide();

	if (shared.mCustomerDetailsJSON != null) {
		displayErtMenu();
		let btn = document.getElementById("btnId_view_members");
		setTimeout(function() {
			btn.click();
		}, 200);
	} else {
		displayErtScreen();
	}
}

function closeErt() {
	showConfirmDialog({
		message: "Exit ERT?",
		yesLabel: "Exit",
		noLabel: "Cancel",
		onYes: () => {
			exitErt();
		},
		onNo: () => {
			console.log("❌ User cancelled closeErt");
		}
	});
}


function exitErt() {
    $("#modulesSection").css("display", "none");
	currentFpsState = NONE;
	updateAppRuntime("ERT", "off", "ok");
	stopFpsMonitorTimer();
	stopPollFpsTimer();
	formTemplates = {};
	ertconfig = null;
	allErtMembers = null;
	allErtMemberStates = null;
	allErtTeams = null;
	allErtShifts = null;
	_ertStateTimer = null;
	if(shared.mCustomerDetailsJSON == null) {
        startAppIdleTimer();
    }
	viewHome();
}

function displayErtMenu() {
	currentFpsState = NONE;
	$("#loadingSpinner").hide();
	showErtMenuArea();

	var htmlContent = "";
	var ertScreenSource = shared.cmsJSON.cmsJSONdata.ertScreen;

	$.each(ertScreenSource.sectionList, function(key, section) {
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

			htmlContent += '<div class="searchArea" id="ert_searcharea"><div class="searchBox" id="ert_searchbox"></div></div>';

			htmlContent += '</div>';
		}
	});
	$("#modulesMenuArea").html(htmlContent);

}


function displayErtScreen() {
    const serialNo = shared.deviceSerialNumber;
    $('#loadingSpinner').show();

    Http.get({
        url: appUrl + "/ertdisplays/getertconfigsfordevice",
        params: { deviceSerialno: serialNo }
    })
    .then(response => {
        const ertdisplay = response.data;

        if (ertdisplay && ertdisplay.ertconfigId !== undefined && ertdisplay.ertconfigId > 0) {
            getErtConfig(ertdisplay.ertconfigId, 'ert', '');
        } else {
            $('#loadingSpinner').hide();
            showDialog("This display is not been assigned to display any ERT!", "exitErt()");
        }
    })
    .catch(error => {
        $('#loadingSpinner').hide();
        console.log("error: " + JSON.stringify(error));
    });
}



function getErtConfig(configId, ertOrReg, memberRegOrUnreg) {
    Http.get({
        url: appUrl + "/ertconfigs/getertbyid",
        params: { configId: configId }
    })
    .then(response => {
        const ertData = response.data;

        ertconfig = ertData.ertconfig;
        formTemplates.headerTemplate = ertData.headerFormtemplate;
        formTemplates.footerTemplate = ertData.footerFormtemplate;
        formTemplates.bodyTemplate = ertData.ertFormtemplate;
        allErtTeams = ertData.ertTeams;
        allErtShifts = ertData.ertShifts;

        if (ertconfig.usbScannerEnabled === true) {
            initFingerprintScanner(
                ertconfig.usbScannerSetting.vid,
                ertconfig.usbScannerSetting.pid
            );
        }

        // second API call (nested, same as original jQuery)
        return Http.get({
            url: appUrl + "/ertmembers/getertmembersbyconfigid",
            params: { ertconfigId: ertconfig.id }
        });
    })
    .then(response => {
        const dat = response.data;
        allErtMembers = dat.members;
        allErtMemberStates = dat.states;

        $("#loadingSpinner").hide();

        if (ertOrReg === 'reg' && mCustomerDetailsJSON != null) {
            if (memberRegOrUnreg === 0) {          // members
                showMemberScreen();
            } else if (memberRegOrUnreg === 1) {   // register
                showFpRegistrationScreen(-1);
            } else if (memberRegOrUnreg === 2) {   // unregister
                showFpUnregistrationScreen();
            }
        } else {
            currentFpsState = FPS_SEARCH;
            displayErt();
        }
    })
    .catch(error => {
        console.log("error: " + JSON.stringify(error));
        $("#loadingSpinner").hide();
    });
}



function updateErtMemberStates(configId) {
    Http.get({
        url: appUrl + "/ertmemberstates/getertmemberstatesbyconfigid",
        params: { configId: configId }
    })
    .then(response => {
        const stateData = response.data;

        allErtMemberStates = stateData;
        displayErtScreen();
        $("#loadingSpinner").hide();
    })
    .catch(error => {
        console.log("error: " + JSON.stringify(error));
        $("#loadingSpinner").hide();
    });
}

function getMembers(memberRegOrUnreg) {
    highlightHeaderTabMenu("menuBtn", "btnId_view_members");
    if (memberRegOrUnreg == 0) {
        highlightHeaderTabMenu("menuBtn", "btnId_view_members");
    } else if (memberRegOrUnreg == 1) {
        highlightHeaderTabMenu("menuBtn", "btnId_view_fpregister");
    } else if (memberRegOrUnreg == 2) {
        highlightHeaderTabMenu("menuBtn", "btnId_view_fpunregister");
    }
    fixModuleHeight("modulesModuleHeader, modulesMenuArea, footerSection", 20, "modulesListArea");

    currentErtState = "ertMembers";
    const data = { token: shared.mCustomerDetailsJSON.token };
    const url = "/ertconfigs/restgetertconfigs";

    buildRequestOptions(constructUrl(url), "GET", data)
        .then(request => {
            return Http.request(request);
        })
        .then(response => {
            if (isValidResponse(response, url) && response) {
                if (response.error !== "invalid_token") {
                    if (response.error === "no_privilege") {
                        showDialog("You don't have privilege to execute this task!");
                    } else {
                        let htmlContent = "";
                        let ertConfigs = response;
                        if (ertConfigs && ertConfigs.length > 0) {
                            if (ertConfigs.length === 1) {
                                getSelectedConfig(ertConfigs[0].id, memberRegOrUnreg);
                            } else {
                                htmlContent += '<div style="width: 100%; padding: 10px;">';
                                htmlContent += '<div style="width: 100%; padding: 10px 0; font-size: 1em; text-align: left;">Select ERT for fetching members:</div>';
                                htmlContent += `<select id="selectErtConfig" style="width: 100%; padding: 5px;" onchange="getSelectedConfig(this.value, ${memberRegOrUnreg})">`;
                                htmlContent += '<option value="">Select ERT Configuration</option>';
                                for (let ertConfig of ertConfigs) {
                                    htmlContent += `<option id="opt_${ertConfig.id}" data-id="${ertConfig.id}" value="${ertConfig.id}">${ertConfig.id} -- ${ertConfig.ertconfigName}</option>`;
                                }
                                htmlContent += "</select>";
                                htmlContent += "</div>";
                                $("#modulesListBox").html(htmlContent);
                            }
                        } else {
                            htmlContent += '<div style="width: 100%; padding: 10px;">';
                            htmlContent += '<div style="width: 100%; text align: center;">No ERT configuration found!</div>';
                            htmlContent += "</div>";
                            $("#modulesListBox").html(htmlContent);
                        }
                    }
                } else {
                    // Invalid Token
                    getNewToken(`fpRegister(${memberRegOrUnreg})`);
                }
            }
        })
        .catch(err => {
            apiRequestFailed(err, url);
            console.error("Fetching ERT Members failed!", err);
        });
}

function getSelectedConfig(configId, memberRegOrUnreg) {
	if(configId != null && configId != undefined && configId != "") {
		getErtConfig(configId, 'reg', memberRegOrUnreg);
	}
}

function showMemberScreen(team = 'All') {
	//showmodulesDisplayArea();

	let sortedItems = allErtMembers.sort((a, b) => {
		if (a.userId === b.userId) {
			return a.id - b.id; // sort by id if userId is the same
		}
		return a.userId - b.userId;
	});

	let items = sortedItems;
	if(team != 'All') {
		items = allErtMembers.filter(item => item.ertteamName === team);
	} 
	let distinctUserIds = new Set(items.map(item => item.userId));
	let userCount = distinctUserIds.size;

	var htmlContent = '';
	if(allErtMembers != null && allErtMembers.length > 0) {
		htmlContent += '<div class="searchArea"><div class="searchBox" style="font-size: 1.3em; justify-content: center; text-align: center;">MEMBERS ('+userCount+')</div></div>';

		if(allErtTeams != null && allErtTeams.length > 0) {
			htmlContent += '<div style="padding: 0 10px; display: flex; justify-content: flex-start; flex-wrap: wrap;">';
			htmlContent += '<div class="listBoxActionButton ertTeamClass" id="ertTeam_All" style="border-radius: 5px; padding: 5px 10px; margin: 5px;" onclick="showMemberScreen(\'All\')">All</div>';
			for(let ertTeam of allErtTeams) {
				let teamId = ertTeam.ertteamName.replace(/\s+/g, '');
				htmlContent += '<div class="listBoxActionButton ertTeamClass" id="ertTeam_'+teamId+'" style="border-radius: 5px; padding: 5px 10px; margin: 5px;" onclick="showMemberScreen(\''+ertTeam.ertteamName+'\')">'+ertTeam.ertteamName+'</div>';
			}
			htmlContent += '</div>';
		}

		listItems = [];
		let states = [];

		for(var index in items) {
			
			let item = items[index];

			let description = '<div><a style="color: var(--secondary-cyan); font-size: 1.1em; font-weight: bold;" href="tel:'+item.phone+'">'+item.phone+'</a></div><div>'+item.email+'</div><div>'+item.designation+' ('+item.department+')</div>';
			let fullName = [item.title, item.firstName, item.middleName, item.lastName].filter(part => part && part.trim()).join(" ");

			let image = '';
			if(item.photo != undefined && item.photo != null && item.photo.length > 0) {
				image = item.photo;
			} else {
				image = '<img style="padding: 0 20%; width: 100%;" src="./img/icon_img.png" onerror="this.onerror=null;this.src=\'./img/noimage.jpg\';" />';
			}

			states.push({"text":item.ertteamName, "type": "warningState"});

			let itemJson = {};
			if(index < items.length-1) {
				let nextItem = items[parseInt(index)+1];
				if(item.userId != nextItem.userId) {
					itemJson = {"id": item.id, "image": image, "title":fullName, "description":description, "clickAction":"", "states":states};
					listItems.push(itemJson);
					states = [];
				}
			} else {
				itemJson = {"id": item.id, "image": image, "title":fullName, "description":description, "clickAction":"", "states":states};
				listItems.push(itemJson);
				createList("ert", htmlContent, listItems, null, 1, "modulesListBox", "", "", "ticketStyle");
				let teamId = team.replace(/\s+/g, '');
				$('#ertTeam_'+teamId).addClass("activeAction1");
			}
		}	
    } else {
		htmlContent = '<div>No members found for this ERT configuration!</div>';
		$('#modulesListBox').html(htmlContent);
		showDialog('No members found for this ERT configuration!');
	}
	//$("#modulesDisplayArea").html(htmlContent);


}

function toggleTeamView(index) {
	$('#teamViewArea_'+index).toggle();
	$("#carrot_"+index).toggleClass("carrot-down");
}

function showFpRegistrationScreen(presentPageId) {
	showmodulesDisplayArea();
	selectedMemberUserId = 0;
	selectedMemberName = '';
	selectedMemberMemberId = 0;
	registerNewFinger = true;
	fpRegistrationStep = 0;

	let htmlContent = '';

	if(allErtMembers != null) {

		htmlContent += '<div style="width: 100%; padding: 10px;">';
			htmlContent += '<div id="fpStep0" class="fpStep" style="width: 100%; padding: 5px;">STEP1: Select ERT member for fingerprint registration</div>';
			htmlContent += '<div id="fpStep1" class="fpStep" style="width: 100%; padding: 5px;">STEP1: Select finger</div>';
			if(presentPageId == -1) {
				htmlContent += '<div id="fpStep2" class="fpStep" style="width: 100%; padding: 5px;">STEP2: Scan fingerprint</div>';
				htmlContent += '<div id="fpStep3" class="fpStep" style="width: 100%; padding: 5px;">STEP3: Scan same fingerprint again</div>';
				htmlContent += '<div id="fpStep4" class="fpStep" style="width: 100%; padding: 5px;">STEP4: Done</div>';
			}
			htmlContent += '<hr>';
			htmlContent += '<select id="selectErtMember" style="width: 100%; padding: 5px;" onchange="enableStartButton(this, '+presentPageId+')">';
			htmlContent += '<option value="">Select Member</option>';
			for(var ertMember of allErtMembers) {
				let name = '';
				if(ertMember.title != null && ertMember.title != undefined  && ertMember.title != "") {name += ertMember.title+'. ';}
				name += ertMember.firstName+' ';
				if(ertMember.middleName != null && ertMember.middleName != undefined  && ertMember.middleName != "") {name += ertMember.middleName+' ';}
				if(ertMember.lastName != null && ertMember.lastName != undefined  && ertMember.lastName != "") {name += ertMember.lastName;}
				if(ertMember.employeeId != null && ertMember.employeeId != undefined  && ertMember.employeeId != "") {name += ' ('+ertMember.employeeId+')';}

				var registered = ertFileData.members.find(item => item.userId == ertMember.userId);
				if(registered != null) {		// found
					htmlContent += '<option data-id="'+ertMember.id+'" value="'+ertMember.id+'">'+ertMember.userId+' -- '+name+' -- Registered</option>';
				} else {
					htmlContent += '<option data-id="'+ertMember.id+'" value="'+ertMember.id+'">'+ertMember.userId+' -- '+name+'</option>';
				}
			}
			htmlContent += '</select>';

			htmlContent += '<div style="width: 100%; margin-top: 20px; display: flex; justify-content: space-around;"> <button class="btnStyle disabledBtn" id="fpsStartButton" onclick="startRegistration('+presentPageId+')" disabled>START</button></div>';
			htmlContent += '<hr>';
			htmlContent += '<div id="registrationInstructions" style="width: 100%; margin-top: 20px; padding: 10px; display: none;">';
				htmlContent += '<div id="fpsInstructionImage" style="width: 60%; max-height: 50%; margin: 0 20%; object-fit: contain;"></div>';
				htmlContent += '<div id="fpsInstructionText" style="width: 100%; margin-top: 20px; text-align: center;"></div>';
				htmlContent += '<div style="width: 100%; margin-top: 20px; display: flex; justify-content: space-around;"> <button class="btnStyle disabledBtn" id="fpsDoneButton" onclick="closeRegistration()" disabled>CLOSE</button></div>';
			htmlContent += '</div>';

		htmlContent += '</div>';
    } else {
		htmlContent = '<div>No members found for this device\'s ERT configuration!</div>';
		showDialog('No members found for this device\'s ERT configuration!');
	}
	$("#modulesDisplayArea").html(htmlContent);
	fpHighlightStep(0);
}

function enableStartButton(that, presentPageId) {
	var selectedValue = that.value;
	if(selectedValue != null && selectedValue != "") {
		$('#fpsStartButton').prop('disabled', false);
		$('#fpsStartButton').removeClass('disabledBtn');
	} else {
		$('#fpsStartButton').prop('disabled', true);
		$('#fpsStartButton').addClass('disabledBtn');
		$("#registrationInstructions").hide();
	}
}

function fpHighlightStep(stepCount) {
	$('.fpStep').removeClass('fpCurrentStep');
	$('#fpStep'+stepCount).addClass('fpCurrentStep');
}

function startRegistration(presentPageId) {
	// var selectedOption = $('#selectErtMember').find(":selected").value();
	if(fingerprintScannerOpen == true) {
		var selectedOption = $("#selectErtMember option:selected");
		if(selectedOption != null && selectedOption.length > 0) {
			$('#fpsStartButton').prop('disabled', true);
			$('#fpsStartButton').addClass('disabledBtn');
			$('#selectErtMember').prop('disabled', true);

			$("#registrationInstructions").show();
			let selectedMemberTxt = selectedOption.get(0).text.split(' -- ');
			selectedMemberUserId = selectedMemberTxt[0];
			selectedMemberName = selectedMemberTxt[1];
			selectedMemberMemberId = selectedOption.get(0).value;
			console.log('Selected member UserId: '+selectedMemberUserId+', Name: '+selectedMemberName+', MemberId: '+selectedMemberMemberId);
			selectFinger(presentPageId);
			/*if(selectedMemberTxt.includes('Registered')) {
				showConfirmDialog("Register different finger? If no, same will be overwritten.", "registerNew()", "registerSame()");
			} else {
				registerNew();
			}*/
		} else {
			showDialog("Please select a member to start fingerprint registration!");
		}
	} else {
		$('#fpsStartButton').prop('disabled', true);
		$('#fpsStartButton').addClass('disabledBtn');
		$('#selectErtMember').prop('disabled', true);
		$("#registrationInstructions").show();
		$("#fpsInstructionImage").hide();
		$("#fpsInstructionText").hide();
		$('#fpsDoneButton').prop('disabled', false);
		$('#fpsDoneButton').removeClass('disabledBtn');
		showDialog("ERROR: Fingerprint scanner not initialized. Registration process cannot be performed!");
	}
}

function selectFinger(presentPageId) {
	fpHighlightStep(1);
	showFpsInstruction(0, "Please select finger..");

	let fingerSelectPos = [{"x":50.8, "y":44.3}, {"x":58.5, "y":20.7},{"x":70.1, "y":14.3},{"x":81.3, "y":19.5},{"x":89.5, "y":30.4},{"x":41.7, "y":44.4},{"x":34, "y":20.8},{"x":22.5, "y":14.4},{"x":11.2, "y":19.4},{"x":3.1, "y":30.4}];
	let htmlContent = '';
	for(count=0; count<10; count++) {
		let x = fingerSelectPos[count].x;
		let y = fingerSelectPos[count].y;
		var existingMembers = ertFileData.members.filter(function (item) {return item.userId == selectedMemberUserId;});
		if(existingMembers.length > 0) {
			var sameFinger = existingMembers.findIndex(item => item.fingerNo == count);
			if(sameFinger != -1) {	// member's same finger has been registered
				htmlContent += '<div id="fingerNum_'+count+'" class="fingerSelectBtn" style="top: '+y+'%; left: '+x+'%;" onclick="fingerSelectedConfirm('+count+', '+presentPageId+')";><i class="fas fa-check-circle"></i></div>';
			} else {
				htmlContent += '<div id="fingerNum_'+count+'" class="fingerSelectBtn" style="top: '+y+'%; left: '+x+'%;" onclick="fingerSelected('+count+', '+presentPageId+', true)";></div>';	
			}
		} else {
			htmlContent += '<div id="fingerNum_'+count+'" class="fingerSelectBtn" style="top: '+y+'%; left: '+x+'%;" onclick="fingerSelected('+count+', '+presentPageId+', true)";></div>';
		}
	}
	$('#fingerSelectArea').html(htmlContent);
}


function fingerSelected(selectedFinger, presentPageId, newOrSameFinger) {
	
	console.log("Selected finger: "+selectedFinger);
	$('#fingerNum_'+selectedFinger).css("background-color", "rgba(50, 255, 200, 0.5)");
	selectedMemberFingerNo = selectedFinger;
	if(presentPageId == -1) {
		setTimeout(function() {
			registerNewFinger = newOrSameFinger;
			currentErtState = "ertFpsScan";
			$('#fpsDoneButton').prop('disabled', true);
			$('#fpsDoneButton').addClass('disabledBtn');
			fpsScanSaveFinger();
		}, 200);
	} else {
		updateErtMemberToFile(presentPageId, selectedMemberMemberId, selectedMemberUserId, selectedMemberName, selectedMemberFingerNo);
		console.log("Fingerprint registered at position: "+presentPageId);
		showFpsInstruction(3, "Fingerprint registered successfully");
	}
}

function closeRegistration() {
	currentFpsState = NONE;
	closeDialogBox();
	backErtHandle();
}

function showFpsInstruction(code, text) {
	let htmlContent = '';
	switch(code) {
		case 0:
			$('#fpsDoneButton').prop('disabled', false);
			$('#fpsDoneButton').removeClass('disabledBtn');
			htmlContent += '<div style="position: relative; width: 100%; height: 100%;">';
			htmlContent += '<img style="width: 100%; height: 100%;" src="./img/fps_all.png" >';
			htmlContent += '<div id="fingerSelectArea" style="top: 0; left: 0; width: 100%; height: 100%;"></div>'
			htmlContent += '</div>';
			break;
		case 1:
			htmlContent += '<img style="width: 100%; height: 100%;" src="./img/fps_1.jpg" >';
			break;
		case 2:
			htmlContent += '<img style="width: 100%; height: 100%;" src="./img/fps_2.jpg" >';
			break;
		case 3:
			$('#fpsDoneButton').prop('disabled', false);
			$('#fpsDoneButton').removeClass('disabledBtn');
			currentErtState = "ertRegistration";
			htmlContent += '<img style="width: 100%; height: 100%;" src="./img/fps_3.jpg" >';
			break;
		case 4:
			$('#fpsDoneButton').prop('disabled', false);
			$('#fpsDoneButton').removeClass('disabledBtn');
			currentErtState = "ertRegistration";
			htmlContent += '<img style="width: 100%; height: 100%;" src="./img/fps_4.jpg" >';
			break;
		case 5:
			$('#fpsDoneButton').prop('disabled', false);
			$('#fpsDoneButton').removeClass('disabledBtn');
			break;
		default:
			break;
	}
	$("#fpsInstructionImage").html(htmlContent);
	$("#fpsInstructionText").html(text);
}

function showFpUnregistrationScreen() {
	showmodulesDisplayArea();
	selectedMemberUserId = 0;
	selectedMemberName = '';
	selectedMemberMemberId = 0;
	registerNewFinger = true;
	fpRegistrationStep = 0;

	let htmlContent = '';

	if(ertFileData != null) {

		htmlContent += '<div style="width: 100%; padding: 10px;">';
			htmlContent += '<div style="width: 100%; padding: 5px;">Select ERT member to permanently erase registered fingerprint.</div>';
			htmlContent += '<div style="width: 100%; padding: 5px;">Please note: Once erased, it cannot be reversed.</div>';
			htmlContent += '<select id="selectErtMember" style="width: 100%; margin-top: 20px; padding: 5px;" onchange="enableEraseButton(this)">';
			htmlContent += '<option value="">Select Member</option>';
			for(var member of ertFileData.members) {
				let ertMember = allErtMembers.find(item => item.userId == member.userId);
				if(ertMember != null) {
					let name = '';
					if(ertMember.title != null && ertMember.title != undefined  && ertMember.title != "") {name += ertMember.title+'. ';}
					name += ertMember.firstName+' ';
					if(ertMember.middleName != null && ertMember.middleName != undefined  && ertMember.middleName != "") {name += ertMember.middleName+' ';}
					if(ertMember.lastName != null && ertMember.lastName != undefined  && ertMember.lastName != "") {name += ertMember.lastName;}
					if(ertMember.employeeId != null && ertMember.employeeId != undefined  && ertMember.employeeId != "") {name += ' ('+ertMember.employeeId+')';}

					let fingerVal = member.fingerNo+1;
					htmlContent += '<option data-id="'+member.id+'" value="'+member.pageNo+'">'+member.userId+' -- '+name+' (Finger '+fingerVal+')</option>';
					// var registered = ertFileData.members.find(item => item.userId == ertMember.userId);
					// if(registered != null) {		// found
					// 	htmlContent += '<option data-id="'+ertMember.id+'" value="'+ertMember.id+'">'+ertMember.userId+' -- '+name+' -- Registered finger '+registered.fingerNo+'</option>';
					// }
				}
			}
			htmlContent += '</select>';

			htmlContent += '<div style="width: 100%; margin-top: 20px; display: flex; justify-content: space-around;"> <button class="btnStyle disabledBtn" id="fpsEraseButton" onclick="startUnregistration()" disabled>ERASE</button></div>';
			htmlContent += '<hr>';
			htmlContent += '<div id="unregistrationInstructions" style="width: 100%; margin-top: 20px; padding: 10px; display: none;">';
				htmlContent += '<div id="fpsInstructionText" style="width: 100%; margin-top: 20px; text-align: center;"></div>';
				htmlContent += '<div style="width: 100%; margin-top: 20px; display: flex; justify-content: space-around;"> <button class="btnStyle disabledBtn" id="fpsDoneButton" onclick="closeRegistration()" disabled>DONE</button></div>';
			htmlContent += '</div>';

		htmlContent += '</div>';
    } else {
		htmlContent = '<div>No members found for this ERT configuration!</div>';
		showDialog('No members found for this ERT configuration!');
	}
	$("#modulesDisplayArea").html(htmlContent);
}

function enableEraseButton(that) {
	var selectedValue = that.value;
	if(selectedValue != null && selectedValue != "") {
		$('#fpsEraseButton').prop('disabled', false);
		$('#fpsEraseButton').removeClass('disabledBtn');
	} else {
		$('#fpsEraseButton').prop('disabled', true);
		$('#fpsEraseButton').addClass('disabledBtn');
		$("#registrationInstructions").hide();
	}
}

function eraseFingerprint(pageNo) {
	deleteErtMemberFromFile(pageNo);
}

function displayErt() {
    handleVideoControls();
    // document.onmousemove = function() {
    $(document).on('click touchstart', function() {
        handleVideoControls();
    });

	if(allErtTeams != null) {
		viewErtPreview();
	} else {
		getErtConfigForDevice();
	}
}

function viewErtPreview() {
    $("#loadingSpinner").show();

    var htmlContent = '';
    
    //console.log("formTemplates: " + JSON.stringify(formTemplates));
    var headerTemplateData = formTemplates.headerTemplate.templateData.replace( /[\r\n\t]+/gm, "" );
    var headerTemplateJson = JSON.parse(headerTemplateData);
    var footerTemplateData = formTemplates.footerTemplate.templateData.replace( /[\r\n\t]+/gm, "" );
    var footerTemplateJson = JSON.parse(footerTemplateData);
    var bodyTemplateData = formTemplates.bodyTemplate.templateData.replace( /[\r\n\t]+/gm, "" );
    var bodyTemplateJson = JSON.parse(bodyTemplateData);

	let ertconfigStyle = "";
	if(ertconfig.settings != null && ertconfig.settings!= "" && ertconfig.settings.startsWith("{")) {
		let ertconfigSettings = JSON.parse(ertconfig.settings);
		if(ertconfigSettings.style != undefined) {
			ertconfigStyle = ertconfigSettings.style;
		}
	}

    htmlContent += '<div id="previewFrame" style="height: 100%;'+ertconfigStyle+'">';
        htmlContent += '<div id="ert" style="position: relative; height: 100%;">';
            htmlContent += '<div id="ert_header"></div>';
            htmlContent += '<div id="ert_body"></div>';
            htmlContent += '<div id="ert_footer" style="position: absolute; bottom: 0;"></div>';
        htmlContent += '</div>';
    htmlContent += '</div>';
    
    $("#ertViewerArea").html(htmlContent);
	showErtWorkArea();

    // resizeErtPreview();

    if(allErtMembers != null) { 
        renderErtForm(headerTemplateJson, ertconfig.headerFormData, 'ert_header');
        renderErtBody(bodyTemplateJson, ertconfig.ertFormData, 'ert_body');
        renderErtForm(footerTemplateJson, ertconfig.footerFormData, 'ert_footer');
		fpsScanSearchFinger();
    }
}

function renderErtForm(templateJson, data, destin) {
	$("#loadingSpinner").show();
	var task = TASK_BODY;
	if(destin.includes('footer')) {
		task = TASK_FOOTER;
	} else if(destin.includes('header')) {
		task = TASK_HEADER;
	}
	
	var formDataJson = {};
	if(data !=  null && isJson(data)) {
		formDataJson = JSON.parse(data);
	}
	
	var htmlContent = '';
	
	htmlContent += '<table class="formTemplateTable" id="formTemplateTable_'+destin+'" style="'+templateJson.conf.style+'">';
	
		if(templateJson.tr.length > 0) {
			
			var rowNum = 0;
			htmlContent += '<thead><tr>';
			for(count=0; count<templateJson.conf.cols; count++) {
				//htmlContent += '<th style="width: '+getColumnPxValue(templateJson.conf.colw[count])+'px;"></th>';
				htmlContent += '<th style="width: '+templateJson.conf.colw[count]+'%; height: 1px; line-height: 1px; opacity: 0; border: none; padding: 0;"></th>';
			}
			htmlContent += '</tr></thead>';
			
			htmlContent += '<tbody>';
			for(var tr of templateJson.tr) {
				htmlContent += '<tr>';
				var colNum = 0;
				for(var td of tr.td) {
					
					var newtdid = td.id+'_'+task;
					if(formDataJson[newtdid] == undefined) {formDataJson[newtdid] = '';}
					
					if(td.marged != true) {
						htmlContent += '<td rowspan='+td.rowSpan+' colspan='+td.colSpan+' style="vertical-align: middle;'+getStyleAttributeInStyles(td.style, 'background-color:')+getStyleAttributeInStyles(td.style, 'border:')+'" >';

							if(td.label == undefined) {
								td.label = ""
							}
							
						
							if(td.type.startsWith("text")) {
								htmlContent += '<div class="templatebox '+td.class+'" data-rownum='+rowNum+' data-colnum='+colNum+' id="'+newtdid+'" style="'+td.style+'height:100%;">'+td.value+'</div>';
							} else if(td.type.startsWith("image")) {
								htmlContent += '<div class="templatebox" id="'+newtdid+'" data-rownum='+rowNum+' data-colnum='+colNum+' style="position: relative; width: 100%; min-height: 100px;">';
									htmlContent += '<img id="impreview_'+newtdid+'" style="'+td.style+'" src="'+td.value+'" />';
								htmlContent += '</div>';
							} else if(td.type.startsWith("inputText")) {
								if(td.label != undefined && td.label != "") {
									htmlContent += '<div class="templatelabel" id="label_'+newtdid+'" for="'+td.id+'">'+td.label+'</div>';
								} 
								htmlContent += '<div class="templatebox '+td.class+'" data-label="'+td.label+'" data-rownum='+rowNum+' data-colnum='+colNum+' id="'+newtdid+'" style="'+td.style+'height:100%;" >'+formDataJson[newtdid]+'</div>';
							} else if(td.type.startsWith("inputNumber")) {
								if(td.label != undefined && td.label != "") {
									htmlContent += '<div class="templatelabel" id="label_'+newtdid+'" for="'+td.id+'">'+td.label+'</div>';
								}
								htmlContent += '<div class="templatebox '+td.class+'" data-label="'+td.label+'" data-rownum='+rowNum+' data-colnum='+colNum+' id="'+newtdid+'" style="'+td.style+'height:100%;" >'+formDataJson[newtdid]+'<div>';
							} else if(td.type.startsWith("inputCb")) {
								if(td.label != undefined && td.label != "") {
									htmlContent += '<input type="checkbox" class="templatebox '+td.class+'" data-label="'+td.label+'" data-rownum='+rowNum+' data-colnum='+colNum+' id="'+newtdid+'" style="'+td.style+'height:100%; width: fit-content; margin-right: 20px;" />';
									htmlContent += '<label class="templatelabel" id="label_'+newtdid+'" for="'+td.id+'">'+td.label+'</label>';
								} else {
									htmlContent += '<label class="templatelabel" id="label_'+newtdid+'" for="'+td.id+'">'+td.label+'</label>';
									htmlContent += '<input type="checkbox" class="templatebox '+td.class+'" data-label="'+td.label+'" data-rownum='+rowNum+' data-colnum='+colNum+' id="'+newtdid+'" style="'+td.style+'height:100%;" />';
								}
							} else if(td.type.startsWith("inputDate")) {
								if(td.label != undefined && td.label != "") {
									htmlContent += '<div class="templatelabel" id="label_'+newtdid+'" for="'+td.id+'">'+td.label+'</div>';
								}
								htmlContent += '<div class="templatebox '+td.class+'" data-label="'+td.label+'" data-rownum='+rowNum+' data-colnum='+colNum+' id="'+newtdid+'" style="'+td.style+'height:100%;" >'+formDataJson[newtdid]+'</div>';
							} else if(td.type.startsWith("inputImage")) {
								if(td.label != undefined && td.label != "") {
									htmlContent += '<label class="templatelabel" id="label_'+newtdid+'" for="'+td.id+'">'+td.label+'</label>';
								}
								htmlContent += '<div class="templatebox" id="'+newtdid+'" data-label="'+td.label+'" data-rownum='+rowNum+' data-colnum='+colNum+' style="'+td.style+'position: relative; width: 100%; min-height: 10px;">';
									//if(formDataJson[newtdid] == undefined) {formDataJson[newtdid] = "../img/noimage.jpg";}
									htmlContent += '<img id="impreview_'+newtdid+'" style="'+td.style+'" src="../img/noimage.jpg" />';
								htmlContent += '</div>';
							} else if((td.type.startsWith("inputSingleSelect")) || (td.typ.startsWith("inputMultiSelect"))) {
								if(td.label != undefined && td.label != "") {
									htmlContent += '<label class="templatelabel" id="label_'+newtdid+'" for="'+td.id+'">'+td.label+'</label>';
								}
								htmlContent += '<div class="templatebox" id="'+newtdid+'" data-label="'+td.label+'" data-options="'+td.options+'" data-rownum='+rowNum+' data-colnum='+colNum+' >';
									if((td.options != undefined) && (td.options.length > 0)) {
										var oprionsArr = td.options.split('#');
										for(var index in oprionsArr) {
											if(td.type == "inputMultiSelect") {
												htmlContent += '<input type="checkbox" id="option_'+newtdid+'_'+index+'" name="'+td.id+'" value="'+oprionsArr[index]+'"><label class="templatelabel" for="option_'+newtdid+'_'+index+'" >'+oprionsArr[index]+'</label><br>';
											} else {
												htmlContent += '<input type="radio" id="option_'+newtdid+'_'+index+'" name="'+td.id+'" value="'+oprionsArr[index]+'"><label class="templatelabel" for="option_'+newtdid+'_'+index+'" >'+oprionsArr[index]+'</label><br>';
											}
										}
									}
								htmlContent += '</div>';
							}
						htmlContent += '</td>';
					}
					colNum++;
				}
				htmlContent += '</tr>';
				rowNum++;
			}
			htmlContent += '</tbody>';
		}
	htmlContent += '</table>';

	
	$("#"+destin).html(htmlContent);
	
	$(".templatebox ").css('outline', 'none');
	$(".templatebox ").css('border', 'none');
	//$("#formTemplateTable_"+destin+" td").css('border', 'none');
	
	var trIndex = 0, tdIndex = 0;
	function getNextImageUrl(trIndex, tdIndex) {
		var tr = templateJson.tr[trIndex];
		var td = tr.td[tdIndex];
		var newtdid = templateJson.tr[trIndex].td[tdIndex].id+'_'+task;
		
		if(td.type.startsWith('inputImage')) {
			if(formDataJson[newtdid] != undefined && formDataJson[newtdid].startsWith('http')) {
				var objectKey = formDataJson[newtdid];
				populateTempCopiedImage(document.getElementById("impreview_"+newtdid), objectKey);
				$("#impreview_"+newtdid).css('border', 'none');
			}
		} else if(td.type.startsWith('image')) {
			if(td.value != undefined && td.value != null && td.value.startsWith('http')) {
				var objectKey = td.value;
				populateTempCopiedImage(document.getElementById("impreview_"+newtdid), objectKey);
				$("#impreview_"+newtdid).css('border', 'none');
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
				$("#loadingSpinner").hide();
				resizeErtPreview();
			}
		}
	}
	getNextImageUrl(trIndex, tdIndex);
	
}

function renderErtBody(templateJson, data, destin) {

	let task = TASK_BODY;
	$("#loadingSpinner").show();
	
	let ertBodyHeaderStyle = "";
	if(ertconfig.settings != null && ertconfig.settings!= "" && ertconfig.settings.startsWith("{")) {
		let ertconfigSettings = JSON.parse(ertconfig.settings);
		if(ertconfigSettings.bodyHeaderStyle != undefined) {
			ertBodyHeaderStyle = ertconfigSettings.bodyHeaderStyle;
		}
	}

	var formDataJson = {};
	if(data !=  null && isJson(data)) {
		formDataJson = JSON.parse(data);
	}

	var htmlContent = '';
	
	let colPercentStr = '';
	let colPercent = ((100-(formDataJson.colCount-1))/formDataJson.colCount).toFixed(2)+"% ";
	for(let count=0; count<formDataJson.colCount; count++) {
		colPercentStr += colPercent;
	}
	
	htmlContent += '<div style="display:grid; grid-gap: 0 1%; grid-template-columns:'+colPercentStr+'; width:100%; padding: 0.5em;'+formDataJson.style+'">';
	let colIndex = 0;

	function getNextTeam(ertTeamIndex) {
		let rowIndex = 0;
		let teamMembers = allErtMembers.filter(function(item) {return item.ertteamId == allErtTeams[ertTeamIndex].id;});
					
		htmlContent += '<div id="column_'+colIndex+'" style="width:100%;">';
		htmlContent += '<div style="'+templateJson.conf.style+' '+ertBodyHeaderStyle+'">'+allErtTeams[ertTeamIndex].ertteamName+'</div>';
				
		function getNextTeamMember(teamMemberIndex) {
			let ertMember = teamMembers[teamMemberIndex];
			
			let showMemberDetail = false;
			if(ertconfig.displayOnlyIn) {
				let memberStates = allErtMemberStates.filter(function(item) {return item.userId == ertMember.userId;});
				if(memberStates != null && memberStates.length > 0) {
					memberState = memberStates[0];
					if(memberState.state == 1) {
						showMemberDetail = true;
					}
				}
			} else {
				showMemberDetail = true;
			}
			
			if(showMemberDetail == true) {
				let ertShift = allErtShifts.find(item => item.id == ertMember.ertshiftId);
				let styleStr = "";
				if(ertShift != null && ertShift.settings != null && ertShift.settings.startsWith('{')) {
					let shiftSetting = JSON.parse(ertShift.settings);
					if(shiftSetting.style != undefined && shiftSetting.style != "") {
						styleStr = shiftSetting.style;
					}
				} else {
					let ertTeam = allErtTeams[ertTeamIndex];
					if(ertTeam != null && ertTeam.settings != null && ertTeam.settings.startsWith('{')) {
						let teamSetting = JSON.parse(ertTeam.settings);
						if(teamSetting.style != undefined && teamSetting.style != "") {
							styleStr = teamSetting.style;
						}
					}
				}
				htmlContent += '<table class="formTemplateTable" id="formTemplateTable_'+ertTeamIndex+'_'+teamMemberIndex+'" style="'+templateJson.conf.style+' '+styleStr+'">'	
				//htmlContent += '<table class="formTemplateTable" id="formTemplateTable_'+ertTeamIndex+'_'+teamMemberIndex+'" style="'+templateJson.conf.style+'">'
					htmlContent += '<thead><tr style="">';
					for(count=0; count<templateJson.conf.cols; count++) {
						//htmlContent += '<th style="width: '+getColumnPxValue(templateJson.conf.colw[count])+'px;"></th>';
						htmlContent += '<th style="width: '+templateJson.conf.colw[count]+'%; height: 1px; line-height: 1px; opacity: 0; border: none; padding: 0;"></th>';
					}
					htmlContent += '</tr></thead>';
					
					htmlContent += '<tbody>';
		
					//var cellHeight = ($("#previewFrame").height()-200)/(templateJson.tr.length);
					for(var tr of templateJson.tr) {
						htmlContent += '<tr>';
						var colNum = 0;
						for(var td of tr.td) {
							var rowNum = 0;
							var newtdid = td.id+'_'+ertMember.id;

							htmlContent += '<td rowspan='+td.rowSpan+' colspan='+td.colSpan+' style="vertical-align: middle; border: none;'+getStyleAttributeInStyles(td.style, 'background-color:')+'" >';
								// htmlContent += '<div style="'+td.style+'">';
								htmlContent += '<div>';
									
									
									if(td.type.endsWith('photo') && ertconfig.displayImage) {
										htmlContent += '<img class="ertImgPreview '+td.class+'" data-imgurl="'+ertMember.photo+'" id="impreview_'+newtdid+'" style="'+td.style+' padding: 0;" onerror="this.onerror=null;this.src=\'../img/noimage.jpg\';"/>';

									} else if(td.type.endsWith('title') || td.type.endsWith('firstName') || td.type.endsWith('middleName') || td.type.endsWith('lastName')) {
										let name = '';
										if(ertMember.title != null && ertMember.title != undefined  && ertMember.title != "") {name += ertMember.title+'. ';}
										name += ertMember.firstName+' ';
										if(ertMember.middleName != null && ertMember.middleName != undefined  && ertMember.middleName != "") {name += ertMember.middleName+' ';}
										if(ertMember.lastName != null && ertMember.lastName != undefined  && ertMember.lastName != "") {name += ertMember.lastName;}
										
										htmlContent += '<div class="'+td.class+'" style="'+td.style+'" >'+name+'</div>';
									
									} else if(td.type.endsWith('employeeId') && ertconfig.displayEmployeeId) {
										htmlContent += '<div class="'+td.class+'" style="'+td.style+'" >'+ertMember.employeeId+'</div>';
									
									} else if(td.type.endsWith('phone') && ertconfig.displayPhone) {
										htmlContent += '<div class="'+td.class+'" style="'+td.style+'" >'+ertMember.phone+'</div>';
										
									} else if(td.type.endsWith('email') && ertconfig.displayEmail) {
										htmlContent += '<div class="'+td.class+'" style="'+td.style+'" >'+ertMember.email+'</div>';
										
									} else if(td.type.endsWith('ertSpeciality') && ertconfig.displayErtSpeciality) {
										htmlContent += '<div class="'+td.class+'" style="'+td.style+'" >'+ertMember.ertSpeciality+'</div>';
										
									} else if(td.type.endsWith('designation') || td.type.endsWith('department')) {
										let tempText = '';
										if(ertconfig.displayDesignation) {
											tempText += ertMember.designation;
										}
										if(ertconfig.displayDepartment) {
											if(tempText.length > 0) {
												tempText += ' - ';
											}
											tempText += ertMember.department;
										}
										htmlContent += '<div class="'+td.class+'" style="'+td.style+'" >'+tempText+'</div>';
									
									} else if(td.type.endsWith('ertteamName') || td.type.endsWith('ertshiftName')) {
										let tempText = '';
										if(ertconfig.displayTeam) {
											tempText += ertMember.ertteamName;
										}
										if(ertconfig.displayShift) {
											if(tempText.length > 0) {
												tempText += ' - ';
											}
											tempText += ertMember.ertshiftName;
										}
										htmlContent += '<div class="'+td.class+'" style="'+td.style+'" >'+tempText+'</div>';
										
									} else if(td.type.endsWith('other')) {
										if(ertconfig.displayInOut) {
											htmlContent += '<div class="'+td.class+'" style="'+td.style+' padding: 0;">';
												let memberStates = allErtMemberStates.filter(function(item) {return item.userId == ertMember.userId;});
												if(memberStates != null && memberStates.length > 0) {
													let memberState =  memberStates[0];
													if(memberState.state == 1) {
														htmlContent += '<div class="inoutSign inSign ertMemberIn_'+ertMember.userId+' highlight" id="ertMemberIn_'+ertMember.id+'">IN</div>';
														htmlContent += '<div class="inoutSign outSign ertMemberOut_'+ertMember.userId+'" id="ertMemberOut_'+ertMember.id+'">OUT</div>';
													} else {
														htmlContent += '<div class="inoutSign inSign ertMemberIn_'+ertMember.userId+'" id="ertMemberIn_'+ertMember.id+'">IN</div>';
														htmlContent += '<div class="inoutSign outSign ertMemberOut_'+ertMember.userId+' highlight" id="ertMemberOut_'+ertMember.id+'">OUT</div>';
													}
												} else {
													htmlContent += '<div class="inoutSign inSign ertMemberIn_'+ertMember.userId+'" id="ertMemberIn_'+ertMember.id+'">IN</div>';
													htmlContent += '<div class="inoutSign outSign ertMemberOut_'+ertMember.userId+'" id="ertMemberOut_'+ertMember.id+'">OUT</div>';
												}
											htmlContent += '</div>';
										}
									}
									
									
								htmlContent += '</div>';
							htmlContent += '</td>';
							
							colNum++;
						}
						htmlContent += '</tr>';
						rowNum++;
					}
					htmlContent += '</tbody>';
					
				htmlContent += '</table>';

				rowIndex++;
				
			}	// showMemberDetails
			
			if(teamMemberIndex == teamMembers.length-1) {
				htmlContent += '</div>';
				rowIndex = 0;
				colIndex++;
				
				if(ertTeamIndex ==  allErtTeams.length-1) {
					htmlContent += '</div>';
					$("#"+destin).html(htmlContent);
					$(".templatebox").css('outline', 'none');
					$(".templatebox").css('border', 'none');
					
					loadErtMemberImages();
				} else {
					if(colIndex > formDataJson.colCount) {
						htmlContent += '</div>';
						$("#"+destin).html(htmlContent);
						$(".templatebox").css('outline', 'none');
						$(".templatebox").css('border', 'none');
						
						loadErtMemberImages();
					} else {
						getNextTeam(ertTeamIndex+1);
					}
				}
			} else {
				if(rowIndex == formDataJson.rowCount) {
					htmlContent += '</div>';
					rowIndex = 0;
					colIndex++;
					htmlContent += '<div id="column_'+colIndex+'" style="width:100%;">';
					htmlContent += '<div style="'+templateJson.conf.style+' font-size:2.0em; text-align: center; padding: 0.5em 0;">'+allErtTeams[ertTeamIndex].ertteamName+'</div>';
				}
				getNextTeamMember(teamMemberIndex+1);
				
			}
		}
		
		if(teamMembers.length > 0) {
			getNextTeamMember(0);
		} else {
			htmlContent += '</div>';
			rowIndex = 0;
			colIndex++;
			if(ertTeamIndex ==  allErtTeams.length-1) {
				htmlContent += '</div>';
				$("#"+destin).html(htmlContent);
				$(".templatebox").css('outline', 'none');
				$(".templatebox").css('border', 'none');
				
				loadErtMemberImages();
			} else {
				if(colIndex > formDataJson.colCount) {
					htmlContent += '</div>';
					$("#"+destin).html(htmlContent);
					$(".templatebox").css('outline', 'none');
					$(".templatebox").css('border', 'none');
					
					loadErtMemberImages();
				} else {
					getNextTeam(ertTeamIndex+1);
				}
			}
		}
	}
		
	if(allErtTeams.length > 0) {
		getNextTeam(0);
	}
	
}

function loadErtMemberImages() {
	let imElems = document.getElementsByClassName('ertImgPreview');
	// console.log("Found "+imElems.length+" image elements");
	function getNextImageUrl(imIndex) {
		let elem = imElems[imIndex];
		let imUrl = elem.dataset.imgurl;
		// console.log("Image: "+imUrl);

		if(imUrl != undefined && imUrl.startsWith('http')) {
			console.log("Populating Image: "+imUrl.split('/').pop(0));
			populateImage(elem.id, imUrl);
			$(elem).css('border', 'none');
		}
		
		if(imIndex < imElems.length-1) {
			getNextImageUrl(imIndex+1);
		} else {
			// finished;
			$("#loadingSpinner").hide();
		}
	}
	if(imElems.length > 0) {
		getNextImageUrl(0);
	} else {
		$("#loadingSpinner").hide();
	}
}

function updateErtMemberState(uId, state) {
    const data = { userId: uId, state: state };
    const url = "/ertmemberstates/updateertmemberstate";

    buildRequestOptions(constructUrl(url), "GET", data)
        .then(request => {
            return Http.request(request);
        })
        .then(res => {
            if (isValidResponse(res, "updateertmemberstate")) {
                const obj = res;

                if (obj.error !== "invalid_token") {
                    const existingIndex = allErtMemberStates.findIndex(item => item.userId == uId);
                    if (existingIndex !== -1) {
                        allErtMemberStates[existingIndex].state = state;
                    } else {
                        allErtMemberStates.push(obj);
                    }
                    if (ertconfig.displayOnlyIn) {
                        viewErtPreview();
                    }
                } else {
                    // Token expired
                    getNewToken(`updateErtMemberState(${uId}, ${state})`);
                }
            }
        })
        .catch(err => {
            apiRequestFailed(err, "updateertmemberstate");
            console.error("Updating ERT Member State failed!", err);
        });
}





export function getStyleAttributeInStyles(styles, attr) {
	var returnVal = "";
	var attrIndex = styles.indexOf(attr);
	if(attrIndex != -1) {		// Attribute doesn't exist in the style
		var tempStr = styles.substring(attrIndex, styles.length);
		var endIndex = tempStr.indexOf(';');
		if(endIndex != -1) {		// Attribute doesn't exist in the style
			returnVal = tempStr.substring(0, endIndex+1);
		} else {
			returnVal = tempStr+';';
		}
	}
	return returnVal;
}

function resizeErtPreview() {
    let parent = document.getElementById('modulesSection');
	let fontRatio1 = parent.offsetWidth/1920;
    let fontRatio2 = parent.offsetHeight/1080;
    let fontRatio = fontRatio1;
    if(fontRatio2 < fontRatio1) {
        fontRatio = fontRatio2;
    }
	$("#previewFrame").css('font-size', fontRatio+'em');
	// $("#ert").css('height', screen.height+'px');
	
//	let ertBodyHeight = screen.height - 50;
    let tableHeader = document.getElementById('templatebox_0_0__inputText_2');
    let ertHeader = document.getElementById('ert_header');
    let ertFooter = document.getElementById('ert_footer');

	if(ertHeader != null && ertFooter != null && tableHeader != null) {
        
		let ertBodyHeight = parent.offsetHeight - (ertHeader.offsetHeight + ertFooter.offsetHeight + tableHeader.offsetHeight+20);
        console.log("screen: "+parent.offsetHeight+", header: "+ertHeader.offsetHeight+", Footer: "+ertFooter.offsetHeight+", Table Header: "+tableHeader.offsetHeight+", Body: "+ertBodyHeight);
        $('.ertMemberBlockClass').css('height', (ertBodyHeight/6)+'px');
        $("#ert").css('height', parent.offsetHeight+'px');
	} 
}

export function backErtHandle() {
	/*if(currentErtState == "displayErtProcess" || currentErtState == "displayNewExecution"){
		if(unsavedData == true) {
			showConfirmDialog("Any unsaved data will be lost. Proceed?", "displayErtMenu()", "closeConfirmDialogBox()");
		} else {
			displayErtMenu();
		}
	} */
	if((currentErtState == "ertRegistration")){
		//showErtMenuArea();
		displayErtMenu();
	} else if(currentErtState == "ertFpsScan") {
		showDialog("Back not allowed!");
	} else {
		currentErtState = "";
		unsavedData = false;
		exitErt();
	}
}

function showErtMenuArea() {
	currentErtState = "displayErtMenu";
	$("#modulesMenuArea").show();
	$("#modulesListArea").show();
	$("#modulesDisplayArea").hide()
	$("#ertSection").hide()
}

function showmodulesDisplayArea() {
	currentErtState = "ertRegistration";
	$("#modulesMenuArea").hide()
	$("#modulesListArea").hide()
	$("#modulesDisplayArea").show()
	$("#ertSection").hide()
}

function showErtWorkArea() {
	currentErtState = "ert";
	$("#modulesMenuArea").hide();
	$("#modulesListArea").hide();
	$("#modulesDisplayArea").hide();
	$("#ertSection").show();
}

function startErtStateUpdateTimer() {
	clearTimeout(_ertStateTimer);
	_ertStateTimer = setTimeout(function() {
        updateErtMemberStates();
	}, 180000);
}

function stopErtStateUpdateTimer() {
	clearTimeout(_ertStateTimer);
	_ertStateTimer = null;
}



window.viewErt = viewErt;
window.exitErt = exitErt;
window.getStyleAttributeInStyles = getStyleAttributeInStyles;
window.displayErtMenu = displayErtMenu;
window.displayErtScreen = displayErtScreen;
window.getErtConfig = getErtConfig;
window.updateErtMemberStates = updateErtMemberStates;
window.getMembers = getMembers;
window.getSelectedConfig = getSelectedConfig;
window.updateErtMemberState = updateErtMemberState;
window.showMemberScreen = showMemberScreen;
window.toggleTeamView = toggleTeamView;
window.showFpRegistrationScreen = showFpRegistrationScreen;