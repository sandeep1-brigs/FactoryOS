import { Filesystem, Directory, Encoding } from "@capacitor/filesystem"
import { Capacitor } from '@capacitor/core';
import { Device } from "@capacitor/device"
import { Http } from '@capacitor-community/http';
import { Network } from '@capacitor/network';
import { App } from '@capacitor/app';
import $ from 'jquery';
import { Browser } from '@capacitor/browser';

import { shared , s3PrivateUrl , s3PublicUrl } from "./globals.js";
import { showDialog, initAppRuntimeMonitor, closeDialogBox, constructUrl, convertVersionVal, fixModuleHeight, startAppIdleTimer, stopAppIdleTimer } from "./utility.js";
import { displaySection, buildRequestOptions, RequestOptions, isValidResponse, showConfirmDialog } from "./capacitor-welcome.js";
import { viewLogin, apiRequestFailed } from "./auth.js";


const hardcodedHelpJson = 
{
    "topics": [
      {
        "title": "Content creation",
        "tag": "content_creation",
        "slides": [
          {
            "image": "/content_creation/content_creation_1.jpg",
            "text": "Select 'Content' from the main menu."
          },
          {
            "image": "/content_creation/content_creation_2.jpg",
            "text": "Click on 'Add New Content +' button on the screen."
          },
          {
            "image": "/content_creation/content_creation_3.jpg",
            "text": "Select the type of content you want to add. In this tutorial content creation from a video file is explained. Creating contens from Image / PDF / Presentation from local disk works in the same way. <br><br>For YouTube videos, simply copy and paste the YouTube video 'share url' in the 'Content data' field."
          },
          {
            "image": "/content_creation/content_creation_4.jpg",
            "text": "Once you click on 'Video file' button, an upload screen pops up. Select / drag and drop the file on the upload widow and click 'Upload' button. <br>Wait till the upload in completed. <br>Once completed, you'll get a link at bottom of the window, then click 'Get URL' button."
          },
          {
            "image": "/content_creation/content_creation_5.jpg",
            "text": "Enter name and description in the respective fields.  Make sure the name and descriptions are easily recognizable since you'll be refering those for your future activity."
          },
          {
            "image": "/content_creation/content_creation_6.jpg",
            "text": "Save the form. <br>Now you'll be able to see the newly created content in the list. Click on the content name and see the preview to verify.<br><br>DONE"
          }
        ]
      },
      {
        "title": "Assign contents to template",
        "tag": "template_content",
        "slides": [
          {
            "image": "/template_content/template_content_1.jpg",
            "text": "Select 'Template Content' from the main menu."
          },
          {
            "image": "/template_content/template_content_2.jpg",
            "text": "Click on 'New Template Content +' button on the screen."
          },
          {
            "image": "/template_content/template_content_3.jpg",
            "text": "Select a template from the drop-down option for which you want to add contents."
          },
          {
            "image": "/template_content/template_content_4.jpg",
            "text": "Type a name and description in the respective fields. Make sure the name and descriptions are easily recognizable since you'll be refering those for your future activity."
          },
          {
            "image": "/template_content/template_content_5.jpg",
            "text": "Click on the 'eye' button beside template data field to assign the contents visually."
          },
          {
            "image": "/template_content/template_content_6.jpg",
            "text": "Click on one of the section in the to select it. You'll be able to see the name of the content that has already been assigned to it (if any)."
          },
          {
            "image": "/template_content/template_content_7.jpg",
            "text": "To assign a content, you can select the catalog (to which the content belongs) from the drom down option, to shorten the content list."
          },
          {
            "image": "/template_content/template_content_8.jpg",
            "text": "Select the content from drop down list. Make sure that correct content name is displaying in the selected section.<br><br>Repeat the same for all the sections. And Save."
          },
          {
            "image": "/template_content/template_content_9.jpg",
            "text": "Save the form. And now you'll be able to see the newly created template-contents in the list. Click on the name to preview.<br><br>DONE"
          }
        ]
      },
      {
        "title": "DigiVeU Scheduling (Device)",
        "tag": "digiveu_schedule",
        "slides": [
          {
            "image": "/digiveu_schedule/template_scheduling_2.jpg",
            "text": "To schedule a DigiVeU template to a display device, first you need to find the serial number of the device. On your device, open BVeU app and select 'About this device' from the navigation menu."
          },
          {
            "image": "/digiveu_schedule/template_scheduling_3.jpg",
            "text": "Note down the device serial number from the device details."
          },
          {
            "image": "/digiveu_schedule/template_scheduling_4.jpg",
            "text": "Log into bveu.in from your desktop/pc, and select 'DigiVeU Schedule' under DigiVeU in main manu."
          },
          {
            "image": "/digiveu_schedule/template_scheduling_5.jpg",
            "text": "Click on 'New Schedule +' button."
          },
          {
            "image": "/digiveu_schedule/template_scheduling_6.jpg",
            "text": "Select the device from the drop down option. You can also type the device name/serial number to filter the options.<br><br>Similarly, select the template you want to assign."
          },
          {
            "image": "/digiveu_schedule/template_scheduling_7.jpg",
            "text": "Enter the Start and End date-time (From when to when you want the template to be displayed) in the respective fields, and Save.<br><br>DONE"
          }
        ]
      },
      {
        "title": "DigiVeU Scheduling (Group)",
        "tag": "digiveu_group_schedule",
        "slides": [
          {
            "image": "/digiveu_group_schedule/bveu_group_schedule_01.jpg",
            "text": "To schedule a DigiVeU template to a group of display device, first you need to group the devices using 'Tag'. If you have already tagged the devices, skip to step 11.<br><br>Else, to find the serial numbers of the devices you want to group. open BVeU app and select 'About this device' from the navigation menu on each of the device."
          },
          {
            "image": "/digiveu_group_schedule/bveu_group_schedule_02.jpg",
            "text": "Note down the device serial numbers from the details."
          },
          {
            "image": "/digiveu_group_schedule/bveu_group_schedule_03.jpg",
            "text": "Log into bveu.in from your desktop/pc, and select 'Tag' under Tag in main manu."
          },
          {
            "image": "/digiveu_group_schedule/bveu_group_schedule_04.jpg",
            "text": "Click on 'Add New Tag +' button."
          },
          {
            "image": "/digiveu_group_schedule/bveu_group_schedule_05.jpg",
            "text": "Enter a tag name and description for the group, keep the name meaningful such as 'CompanyNameLocation' like 'BrigsBangalore' or 'CompanyDepartment' like 'BrigsSales'.<br><br>Save it."
          },
          {
            "image": "/digiveu_group_schedule/bveu_group_schedule_06.jpg",
            "text": "Now you'll be able to see the newly created tag in the table."
          },
          {
            "image": "/digiveu_group_schedule/bveu_group_schedule_07.jpg",
            "text": "To group devices, now we need to tag them. Select 'Devices' from 'Product Management' menu."
          },
          {
            "image": "/digiveu_group_schedule/bveu_group_schedule_08.jpg",
            "text": "From the list of devices locate a device you want to tag."
          },
          {
            "image": "/digiveu_group_schedule/bveu_group_schedule_09.jpg",
            "text": "Click on the Edit symbol for the respective device."
          },
          {
            "image": "/digiveu_group_schedule/bveu_group_schedule_10.jpg",
            "text": "Select the tag(s) you would like the attach to the device, and Save it. <br><br> Repeat step 8 to 10 for all the devices you want to group together."
          },
          {
            "image": "/digiveu_group_schedule/bveu_group_schedule_11.jpg",
            "text": "Once the devices are tagged, you'll be able to schedule them in a group.<br><br>Select 'DigiVeU schedule' under 'DigiVeU' in menu."
          },
          {
            "image": "/digiveu_group_schedule/bveu_group_schedule_12.jpg",
            "text": "Click on the 'New Schedule +' button."
          },
          {
            "image": "/digiveu_group_schedule/bveu_group_schedule_13.jpg",
            "text": "Select 'Tag' radio button for 'Schedule to' field for group scheduling."
          },
          {
            "image": "/digiveu_group_schedule/bveu_group_schedule_14.jpg",
            "text": "Select the tag name(s), This will schedule the template to all the devices grouped with the same Tag name.<br><br>Select the template, start and ending time for the schedule. Save it.<br><br>DONE."
          }
        ]
      }
    ]
  }

let helpSearchStr = "";
var helpJson = null;



async function viewHelp() {
    shared.currentRunningApp = 'help';

    if (!helpJson) {
        const helpFileName = shared.systemConfiguration.cmsInfo.helpFileName;
        const localDir = shared.systemConfiguration.systemInfo.localAppFolderDigiSign;
        const localPath = `${localDir}/${helpFileName}`;
        const remoteUrl = shared.systemConfiguration.systemInfo.cdnURL + shared.systemConfiguration.cmsInfo.helpPath + helpFileName;

        try {
            // Step 1: Try reading the file locally
            const fileResult = await Filesystem.readFile({
                path: localPath,
                directory: Directory.Data,
                encoding: Encoding.UTF8
            });

            helpJson = JSON.parse(fileResult.data);
            console.log("viewHelp: Using local help file");
            stopAppIdleTimer();
            displaySection("helpSection", "block", false, false);
            viewHelpItems();

        } catch (readErr) {
            console.log("viewHelp: Local help not found, downloading new file...", readErr);

            try {
                // Step 2: Download help file using Capacitor HTTP
                const response = await Http.get({ url: remoteUrl });
                const fileData = JSON.stringify(response.data);

                // Step 3: Save file locally
                await Filesystem.writeFile({
                    path: localPath,
                    data: fileData,
                    directory: Directory.Data,
                    encoding: Encoding.UTF8,
                    recursive: true
                });

                console.log("viewHelp: Help file downloaded and saved");
                helpJson = response.data;

                stopAppIdleTimer();
                displaySection("helpSection", "block", false, false);
                viewHelpItems();

            } catch (downloadErr) {
                console.log("viewHelp: Download failed, using fallback JSON", downloadErr);
                await createHelpDataFile(helpFileName);
            }
        }
    } else {
        stopAppIdleTimer();
        displaySection("helpSection", "block", false, false);
        viewHelpItems();
    }
}

/******************************************************************************************
Function: createHelpDataFile
Purpose: Create a default help file if download fails (fallback)
******************************************************************************************/
async function createHelpDataFile(helpFileName) {
    const localDir = shared.systemConfiguration.systemInfo.localAppFolderDigiSign;
    const localPath = `${localDir}/${helpFileName}`;

    try {
        console.log("createHelpDataFile: Writing hardcoded help data...");
        await Filesystem.writeFile({
            path: localPath,
            data: JSON.stringify(hardcodedHelpJson),
            directory: Directory.Data,
            encoding: Encoding.UTF8,
            recursive: true
        });

        helpJson = hardcodedHelpJson;
        stopAppIdleTimer();
        displaySection("helpSection", "block", false, false);
        viewHelpItems();
    } catch (err) {
        console.error("createHelpDataFile: Failed to create help file", err);
    }
}

/******************************************************************************************
UI Rendering Functions (unchanged logic)
******************************************************************************************/
function viewHelpItems() {
    if (helpJson) {
        if (helpJson.topics[0].content === undefined) {
            viewHelp1Items();
        } else {
            viewHelpItemTrees();
        }
    }
}

function viewHelp1Items() {
    shared.currentState = "helpItems";
    var htmlContent = '';
    htmlContent += '<div class="moduleDescriptionClass" style="margin: 10px 0;">Please choose from the topics below.</div>';

    $.each(helpJson.topics, function (topicIndex, topic) {
        let count = topicIndex + 1;
        htmlContent += `<div class="clickable" style="padding: 10px; text-align: left;" onclick="viewHelpDetail(${topicIndex})">${count}. ${topic.title}</div>`;
    });

    $('#helpListArea').html(htmlContent);
    $("#helpMenuArea").hide();
    $("#helpListArea").show();
    $("#helpDetailArea").hide();
}

function viewHelpItemTrees() {
    shared.currentState = "helpItems";

    var htmlContent = '';
    htmlContent += '<div class="moduleDescriptionClass" style="margin: 10px 0;">Please choose from the topics below.</div>';

    $.each(helpJson.topics, function (topicIndex, topic) {
        let count = topicIndex + 1;
        htmlContent += `<div class="clickable topic topic_${topicIndex}" style="padding: 10px; text-align: left;" onclick="expandHelpTopics(${topicIndex})">${count}. ${topic.title}</div>`;
        $.each(topic.content, function (subTopicIndex, subTopic) {
            let count1 = subTopicIndex + 1;
            htmlContent += `<div class="clickable subtopic subtopic_${topicIndex}" style="padding: 5px 0 5px 30px; text-align: left;" onclick="viewHelp2Detail(${topicIndex}, ${subTopicIndex})">${count}.${count1}. ${subTopic.title}</div>`;
        });
    });

    $('#helpListArea').html(htmlContent);
    $("#helpMenuArea").hide();
    $("#helpListArea").show();
    $("#helpDetailArea").hide();

    $('.subtopic').hide();
}

function expandHelpTopics(topicIndex) {
    $('.topic').css('font-weight', 'normal');
    $(`.topic_${topicIndex}`).css('font-weight', 'bold');
    $('.subtopic').hide();
    $(`.subtopic_${topicIndex}`).show();
}

function exitHelp() {
    shared.currentState = "";
    $('#helpSection').css('display', 'none');
    if (shared.mCustomerDetailsJSON == null) {
        startAppIdleTimer();
    }
    viewHome();
}

function viewHelpDetail(topicIndex) {
    shared.currentState = "helpDetail";
    let helpUrl = s3PublicUrl + "assets/help_contents/";
    var helpItem = helpJson.topics[topicIndex];
    var htmlContent = '';

    htmlContent += `<p id="helpTitle" class="nameFontStyle">${helpItem.title}</p>`;
    htmlContent += renderHelpSlides(helpItem.slides, helpItem.title, helpUrl);

    $('#helpDetailArea').html(htmlContent);
    $("#helpMenuArea").hide();
    $("#helpListArea").hide();
    $("#helpDetailArea").show();

    initSliders();
}

function viewHelp2Detail(topicIndex, subTopicIndex) {
    shared.currentState = "helpDetail";
    let helpUrl = s3PublicUrl + "assets/help_contents/";
    var helpItem = helpJson.topics[topicIndex].content[subTopicIndex];
    var htmlContent = '';

    htmlContent += `<p id="helpTitle" class="nameFontStyle">${helpItem.title}</p>`;
    htmlContent += renderHelpSlides(helpItem.slides, helpItem.title, helpUrl);

    $('#helpDetailArea').html(htmlContent);
    $("#helpMenuArea").hide();
    $("#helpListArea").hide();
    $("#helpDetailArea").show();

    initSliders();
}

function renderHelpSlides(slides, title, helpUrl) {
    let html = '<div id="helpContentArea" class="bannerAreaClass">';
    html += '<div class="sliderContentArea" id="sliderContentArea_0">';
    html += '<div class="slider">';
    $.each(slides, function (key, val) {
        var count = key + 1;
        var avifImage = val.image.replace('.jpg', '.avif');
        html += `<div class="slide slide_0">
                    <div class="slideContent">
                        <p style="padding: 10px;">Step - ${count}</p>
                        <picture>
                            <source type="image/avif" srcset="${helpUrl + avifImage}">
                            <img class="cardImage" src="${helpUrl + val.image}" alt="${title} step ${count}" onerror="fallback(this, '${val.image}')" />
                        </picture>
                        <div class="cardTextArea">
                            <p class="cardText">${val.text}</p>
                        </div>
                    </div>
                </div>`;
    });
    html += '</div><div id="bannerNavigationDots_0" class="bannerNavigation bannerNavigation_0"></div></div></div>';
    return html;
}

function initSliders() {
    var sliderElems = document.getElementsByClassName('sliderContentArea');
    for (var slider of sliderElems) {
        var sliderIndex = slider.id.split('_')[1];
        initSlider(sliderIndex, 30, false);
    }
}

function fallback(that, url) {
    that.onerror = null;
    const newSrc = "./img/noimage.jpg";
    that.parentNode.children[0].srcset = newSrc.replace('jpg', 'avif');
    that.src = newSrc;
}

function backHelpHandle() {
    if (shared.currentState == "helpDetail") {
        viewHelpItems();
    } else {
        exitHelp();
    }
}
