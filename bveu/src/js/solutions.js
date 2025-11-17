import { Filesystem, Directory, Encoding } from "@capacitor/filesystem"
import { Capacitor } from '@capacitor/core';
import { Device } from "@capacitor/device"
import { Http } from '@capacitor-community/http';
import { Network } from '@capacitor/network';
import { App } from '@capacitor/app';
import $ from 'jquery';



import { shared } from "./globals";
import { displaySection } from "./capacitor-welcome";
import { showDialog , pauseVideos , highlightHeaderTabMenu , startAppIdleTimer} from "./utility";
import { viewHome , getMenuBar } from "./settings";
import { displayKmkioskScreen } from "./kmkiosk";

var solutionsContents = [];
const FIRE_SAFETY = 0;
const WORKPLACE_SAFETY = 1;
const WORK_PERMIT = 2;
const KMKIOSK = 3;

// function viewSolutions(module) {

// 	if (shared.mCustomerDetailsJSON != null) {
// 		shared.currentRunningApp = 'solutions';
// 		$('#moduleTitle').html("SOLUTIONS");
// 		displaySection('modulesSection', 'flex', true, true);

// 		//updateAppRuntime("solutions", "on", "ok");
// 		displaySolutionsMenu();

// 		$('#modulesMenuArea').show();
// 		$('#modulesListArea').show();
// 		$('#modulesDisplayArea').hide();
// 		if(module == FIRE_SAFETY) {
// 			$("#solutionsSectionBanner").html('<img style="width:100%;object-fit:contain" src="https://bviucp.s3.ap-south-1.amazonaws.com/assets/asset_images/fire-safety.png">');
// 		} else if(module == WORKPLACE_SAFETY) {
// 			$("#solutionsSectionBanner").html('<img style="width:100%;object-fit:contain" src="https://bviucp.s3.ap-south-1.amazonaws.com/assets/asset_images/workplace-safety.png">');
// 		} else if(module == WORK_PERMIT) {
// 			$("#solutionsSectionBanner").html('<img style="width:100%;object-fit:contain" src="https://bviucp.s3.ap-south-1.amazonaws.com/assets/asset_images/work-permit.png">');
// 		}

// 		let btn = document.getElementById("btnId_view_solutionsCourses");
// 			setTimeout(function() {
// 				btn.click();
// 			}, 200);
		
// 	} else { 		
// 		showDialog("You need to login to access this resource!", "viewLogin('menuProcess')");
// 	}
// }

// function closeSolutions() {
// 	showConfirmDialog("Exit Solution?", "exitSolutions()", "closeConfirmDialogBox()");
// }

function viewSolutions(module) {

	if (shared.mCustomerDetailsJSON != null || module === KMKIOSK) {
		shared.currentRunningApp = 'solutions';
		displaySection('modulesSection', 'flex', true, true);

		updateAppRuntime("solutions", "on", "ok");

		if (module === KMKIOSK) {
			$('#moduleTitle').html("TRAINING KIOSK");
			displayKmkioskScreen();
		} else {
			$('#moduleTitle').html("SOLUTIONS");
			displaySolutionsMenu();
		}

		$('#modulesMenuArea').show();
		$('#modulesListArea').show();
		$('#modulesDisplayArea').hide();

		if (module === FIRE_SAFETY) {
			$("#solutionsSectionBanner").html(
				'<img style="width:100%;object-fit:cover;height:-webkit-fill-available;" src="https://bviucp.s3.ap-south-1.amazonaws.com/assets/asset_images/fire-safety.png">'
			);
		} else if (module === WORKPLACE_SAFETY) {
			$("#solutionsSectionBanner").html(
				'<img style="width:100%;object-fit:cover;height:-webkit-fill-available;" src="https://bviucp.s3.ap-south-1.amazonaws.com/assets/asset_images/workplace-safety.png">'
			);
		} else if (module === WORK_PERMIT) {
			$("#solutionsSectionBanner").html(
				'<img style="width:100%;object-fit:cover;height:-webkit-fill-available;" src="https://bviucp.s3.ap-south-1.amazonaws.com/assets/asset_images/work-permit.png">'
			);
		}

		if (module !== KMKIOSK) {
			let btn = document.getElementById("btnId_view_solutionsCourses");
			setTimeout(function () {
				btn.click();
			}, 200);
		}

	} else {
		showDialog("You need to login to access this resource!", "viewLogin('menuProcess')");
	}
}

function exitSolutions() {
	shared.currentState = "";
	pauseVideos();
    $("#modulesSection").css("display", "none");
	//updateAppRuntime("solution", "off", "ok");
	if(shared.mCustomerDetailsJSON == null) {
        console.log("No user logged in");
        startAppIdleTimer();
    }
	$('#modulesMenuArea').html('');
	$('#modulesListBox').html('');
	$('#modulesDisplayArea').html('');
	viewHome();
}

/****************************************************************************************************
 Function: displaySolutionsMenu
 Purpose: Displays Solutions Menu screen
****************************************************************************************************/
function displaySolutionsMenu() {
	var htmlContent = "";
	var solutionsScreenSource = shared.cmsJSON.cmsJSONdata.solutionsScreen;

	$.each(solutionsScreenSource.sectionList, function(key, section) {
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

			htmlContent += '<div class="searchArea"><div class="searchBox" id="solutions_searchbox"></div></div>';

			htmlContent += '</div>';
		}
	});
	$("#modulesMenuArea").html(htmlContent);

}

function getSolutionsAssets() {
	highlightHeaderTabMenu('menuBtn', 'btnId_view_solutionsAssets');
	console.log("Get Solution Assets...");
}

function getSolutionsSops() {
	highlightHeaderTabMenu('menuBtn', 'btnId_view_solutionsSops');
	console.log("Get Solution SOPs...");
}

function getSolutionsCourses() {
	highlightHeaderTabMenu('menuBtn', 'btnId_view_solutionsCourses');
	console.log("Get Solution Courses...");
}

function getSolutionsContents() {
	highlightHeaderTabMenu('menuBtn', 'btnId_view_solutionsContents');
	console.log("Get Solution Contents...");
}

function getSolutionsInspections() {
	highlightHeaderTabMenu('menuBtn', 'btnId_view_solutionsInspections');
	console.log("Get Solution Inspections...");
}

/****************************************************************************************************
 Function: backSolutions
 Purpose: Back button handler for Solution
****************************************************************************************************/
export function backSolutionsHandle() {
	if(shared.currentState == "displayContent") {
		showSolutionsListArea();
	} else if(shared.currentState == "departmentSolutionscontent"){
		getSolutionsDepartments();
	} else if(shared.currentState == "locationSolutionscontent"){
		getSolutionsLocations();
	} else if(shared.currentState == "categorySolutionscontent"){
		getSolutionsCategorys();
	} else {
		shared.currentState = "";
		exitSolutions();
	}
}

window.viewSolutions = viewSolutions; // Make globally accessible for inline HTML calls
window.displaySolutionsMenu = displaySolutionsMenu; // Make globally accessible for inline HTML calls
window.getSolutionsAssets = getSolutionsAssets; // Make globally accessible for inline HTML calls
window.getSolutionsSops = getSolutionsSops; // Make globally accessible for inline HTML calls
window.getSolutionsCourses = getSolutionsCourses; // Make globally accessible for inline HTML calls
window.getSolutionsContents = getSolutionsContents; // Make globally accessible for inline HTML calls
window.getSolutionsInspections = getSolutionsInspections; // Make globally accessible for inline HTML calls
window.exitSolutions = exitSolutions; // Make globally accessible for inline HTML calls
window.backSolutionsHandle = backSolutionsHandle; // Make globally accessible for inline HTML calls