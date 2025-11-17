/******************************************************************************************
This file contains the global parameters which will access in different JS files.
Kindly add this JS in HTML on top of other custom JS file to avoide the refereance error issue(s).
******************************************************************************************/

import $ from 'jquery';
import { getSerialNumber } from './capacitor-welcome.js';

export var chatHTML = "";
export var assistCamPosX = 0;
export var assistCamPosY = 0;
export var assistCamWidth = 0;
export var assistCamHeight = 0;
export var cameraStatus;


/* File Storage access base path */

export var userFirstName = "";
export var upperLevelData = "";

export var defaultSystemConfigPath = "";
export var mCustomerAddressJSON = null;



export var screenWidth = screen.width;
export var screenHeight = screen.height;
// var commonCMS = shared.cmsJSON.cmsJSONdata.common;
export var qrcode;

export var mqttClient = null;


export const appUrl = "https://www.bveu.in";
export const s3PrivateUrl = "https://bveucp.s3.ap-south-1.amazonaws.com/";
export const s3PublicUrl = "https://bviucp.s3.ap-south-1.amazonaws.com/";

/******************************************************************************************
SYSTEM
******************************************************************************************/
// export var appVersion;
// export var releaseInfo;
// export var configVersion;
// export var softAutoUpdate;
// export var configUpdateTime;
// export var systemSleepTime;
// export var systemWakeTime;
// export var primaryColor;
// export var secondaryColor;
// export var developerEmailAddress;
// export var server;
// export var inAppUpdateEnabled;




export var hardcodedSystemConfiguration = {
    systemInfo: {
        softAutoUpdate: false,
        configUpdateTime: "13:30",
        systemSleepTime: "00:00",
        systemWakeTime: "08:00",
        localAppFolderDigiSign: "DigiSign",
        localAppFolderLogs: "Logs",
        developerEmailAddress: "bveusuit@gmail.com",
        contactUsEmailAddress: "info@brigs-espro.com",
        emailHost: "smtp.gmail.com",
        emailSenderUserName: "bveusuit@gmail.com",
        emailSenderUserPassword: "yjttweloodscbkgr",
        gatewayBaseURL: "https://www.bveu.in",
        appIdleTime: 120,
        cdnURL: "https://bviucp.s3.ap-south-1.amazonaws.com/",
        privateCdnURL: "https://bveucp.s3.ap-south-1.amazonaws.com/",
        filePath: "assets/system_config/",
        systemVersion: "1.0.0",
        systemTimestamp: 1574917072073,
        note: "Initial Release",
        adminUser: "Admin",
        adminPassword: "admin",
    },
    cmsInfo: {
        cmsPath: "assets/system_config/",
        cmsFileName: "CMS-00000.json",
        cmsVersion: "1.0.0",
        cmsTimestamp: 1574917072073,
        cmsNote: "Default CMS Release",
        
        cssPath: "assets/system_config/",
        cssFileName: "STYLECSS-00000.css",
        cssVersion: "1.0.0",
        cssTimestamp: 1574917072073,
        cssNote: "Default CSS Styling",
    },
    appInfo: {
        appPath: "assets/app_release/",
        appFileName: "BVeU-10000.apk",
        appVersion: "Playstore Version",
        appTimeStamp: 1574917072073,
        releaseInfo: "Initial Release",
    }
}


export var settingJson = {
    content: [{
            heading: 'Application',
            params: [
                {
                    name: 'Check App Update',
                    variable: '',
                    onClickFunction: 'checkAppUpdate()',
                    onClickText: 'Check',
                },
                {
                    name: 'Check App Update',
                    variable: 'shared.inAppUpdateEnabled',
                    onClickFunction: 'doSettingChange("shared.inAppUpdateEnabled")',
                    onClickText: 'Change',
                },
                {
                    name: 'System configuration Version',
                    variable: 'configVersion',
                },
                {
                    name: 'Application Version',
                    variable: 'appVersion',
                },
                {
                    name: 'Release Information',
                    variable: 'releaseInfo',
                }
            ]
        },
        {
            heading: 'Configurations',
            params: [{
                    name: 'Developer Email Address',
                    variable: 'developerEmailAddress',

                }, {
                    name: 'Create Log',
                    variable: '',
                    onClickFunction: 'createLogFileAndDirectory()',
                    onClickText: 'Create & E-Mail',
                }, {
                    name: 'Software auto-update',
                    variable: 'softAutoUpdate',
                    onClickFunction: 'doSettingChange("visualAssistEnable")',
                    onClickText: 'Change',
                },
                {
                    name: 'Configuration update time',
                    variable: 'configUpdateTime',
                    onClickFunction: 'doSettingChange("visualAssistEnable")',
                    onClickText: 'Change update time',
                },
                {
                    name: 'Configuration Factory Reset',
                    onClickFunction: 'createConfigFile()',
                    onClickText: 'Reset',
                },
                {
                    name: 'Homepage URL',
                    variable: 'server',
                },
                {
                    name: 'Primary color',
                    variable: 'primaryColor',
                },
                {
                    name: 'Secondary color',
                    variable: 'secondaryColor',
                },
                {
                    name: 'System sleep time',
                    variable: 'systemSleepTime',
                    onClickFunction: 'doSettingChange("visualAssistEnable")',
                    onClickText: 'Change',
                },
                {
                    name: 'System wake-up time',
                    variable: 'systemWakeTime',
                    onClickFunction: 'doSettingChange("visualAssistEnable")',
                    onClickText: 'Change',
                }
            ]
        },
        {
            heading: 'System Information',
            params: [{
                    name: 'Device MAC Address',
                    variable: 'deviceMACAddress',
                    onClickFunction: '',
                    onClickText: '',
                },
                {
                    name: 'Device Serial Number',
                    variable: 'deviceSerialNumber',
                    onClickFunction: 'viewQRCode()',
                    onClickText: 'Generate QR Code',
                },
            ]
        },
        {
            heading: 'Contact Information',
            params: [{
                    name: 'Brigs technical support mail-ID: techsupport@brigs-espro.com',
                    variable: '',
                    onClickFunction: '',
                    onClickText: '',
                },
                {
                    name: 'Brigs technical support phone: 012 34 5678',
                    variable: '',
                    onClickFunction: '',
                    onClickText: '',
                },
                {
                    name: 'Designated hardware service provider: SERVICE COMPANY',
                    variable: '',
                    onClickFunction: '',
                    onClickText: '',
                },
                {
                    name: 'Contact Person: Brian Das',
                    variable: '',
                    onClickFunction: '',
                    onClickText: '',
                },
                {
                    name: 'Contact Phone: 076 54 3210',
                    variable: '',
                    onClickFunction: '',
                    onClickText: '',
                },
                {
                    name: 'Contact Mail: brian.das@servicecompany.com',
                    onClickFunction: '',
                    onClickText: '',
                },
            ]
        },
    ]
}


export var hardcodedCmsJSON = {
    ver: "1.0.0",
    cmsJSONdata: {
        cmsId: 1234,
        displayOrientation: "landscape",
        displayWidth: 1080,
        displayHeight: 1920,
        common: {
            primaryColor: "rgba(255,183,0,1.0)",
            secondaryColor: "rgba(30,100,160,1.0)",
            darkPrimaryColor: "rgba(125,90,0,1.0)",
            frameClass1: "frameStyle1",
            frameClass2: "frameStyle2",
            mainBodyHtml: "",

            navMenu: {
                tag: "common_navMenu",
                menuClass: "dropdownMenuStyle",
                menuBtnAreaClass: "navMenuBtnAreaStyle",
                btnClass: "navMenuBtnStyle",
                activeBtnClass: "navMenuActiveBtnStyle",
                btnAfterEffectClass: "navMenuBtnAfterEffectStyle",
                btnTextClass: "navMenuBtnTextStyle",
                activeBtnTextClass: "navMenuActiveBtnTextStyle",
                iconClass: "navMenuIconStyle",
                activeIconClass: "navMenuActiveIconStyle",
                overlayClass: "navMenuOverlayStyle",
                logoPresent: false,
                breadcrumbPresent: false,
                menuPresent: true,
                miniAssistPresent: false,
                assistStyleIndex: 0,
                btnData: [{
                    funct: "viewHome()",
                    tag: "viewHome",
                    intent: "view.home",
                    style: "",
                    activeStyle: "",
                    icon: '<i class="fas fa-home"></i>',
                    activeIcon: '<i class="fas fa-home"></i>',
                    btnText: "Home",
                    activeBtnText: "Home",
                },
                {
                    funct: "viewHelp()",
                    tag: "viewHelp",
                    intent: "view.help",
                    style: "",
                    activeStyle: "",
                    icon: '<i class="fas fa-question-circle"></i>',
                    activeIcon: '<i class="fas fa-question-circle"></i>',
                    btnText: "Help",
                    activeBtnText: "Help",
                },
                {
                    funct: "viewLogin('systemProcess')",
                    tag: "viewSetting",
                    intent: "view.setting",
                    style: "",
                    activeStyle: "",
                    icon: '<i class="fas fa-cog"></i>',
                    activeIcon: '<i class="fas fa-cog"></i>',
                    btnText: "Settings",
                    activeBtnText: "Settings",
                },
                {
                    funct: "viewDeviceInfo()",
                    tag: "viewDeviceInfo",
                    intent: "view.deviceInfo",
                    style: "",
                    activeStyle: "",
                    icon: '<i class="fas fa-tablet-alt"></i>',
                    activeIcon: '<i class="fas fa-tablet-alt"></i>',
                    btnText: "About this device",
                    activeBtnText: "About this device",
                },
                {
                    funct: "viewBveu()",
                    tag: "viewBveu",
                    intent: "view.bveu",
                    style: "",
                    activeStyle: "",
                    icon: '<img style="width: 20px;" src="https://bviucp.s3.ap-south-1.amazonaws.com/bviu_resource/bviu_contents/bveu_logo_mini_gray.png" />',
                    activeIcon: '<img style="width: 20px;" src="https://bviucp.s3.ap-south-1.amazonaws.com/bviu_resource/bviu_contents/bveu_logo_mini_gray.png" />',
                    btnText: "About BVeU",
                    activeBtnText: "About BVeU",
                },
                {
                    funct: "doLogout(false)",
                    tag: "logout",
                    intent: "logout",
                    style: "",
                    activeStyle: "",
                    icon: '<i class="fas fa-sign-out-alt"></i>',
                    activeIcon: '<i class="fas fa-sign-out-alt"></i>',
                    btnText: "Logout",
                    activeBtnText: "Logout",
                },
                {
                    funct: "exitApp()",
                    tag: "exitApp",
                    intent: "exit.app",
                    style: "",
                    activeStyle: "",
                    icon: '<i class="fas fa-door-open"></i>',
                    activeIcon: '<i class="fas fa-door-open"></i>',
                    btnText: "Exit App",
                    activeBtnText: "Exit App",
                }]
            },
            headerMenu: {
                tag: "common_header",
                menuClass: "headerMenuStyle",
                menuBtnAreaClass: "headerMenuBtnAreaStyle",
                btnClass: "headerBtnStyle",
                activeBtnClass: "headerActiveBtnStyle",
                btnAfterEffectClass: "headerBtnAfterEffectStyle",
                btnTextClass: "headerBtnTextStyle",
                activeBtnTextClass: "headerActiveBtnTextStyle",
                iconClass: "headerIconStyle",
                activeIconClass: "headerActiveIconStyle",
                overlayClass: "headerOverlayStyle",
                logoPresent: false,
                breadcrumbPresent: false,
                menuPresent: false,
                miniAssistPresent: false,
                btnData: []
            },
            footerMenu: {
                tag: "common_footer",
                menuClass: "footerMenuStyle",
                menuBtnAreaClass: "footerMenuBtnAreaStyle",
                btnClass: "footerBtnStyle",
                activeBtnClass: "footerActiveBtnStyle",
                btnAfterEffectClass: "footerBtnAfterEffectStyle",
                btnTextClass: "footerBtnTextStyle",
                activeBtnTextClass: "footerActiveBtnTextStyle",
                iconClass: "footerIconStyle",
                activeIconClass: "footerActiveIconStyle",
                overlayClass: "footerOverlayStyle",
                logoPresent: false,
                breadcrumbPresent: false,
                menuPresent: true,
                miniAssistPresent: false,
                btnData: [{
                    funct: "viewHome()",
                    tag: "view.home",
                    intent: "view.home",
                    style: "",
                    activeStyle: "",
                    icon: '<i class="fas fa-home"></i>',
                    activeIcon: '<i class="fas fa-home"></i>',
                    btnText: "Home",
                    activeBtnText: "Home",
                },
                {
                    funct: "viewHelp()",
                    tag: "view.help",
                    intent: "view.help",
                    style: "",
                    activeStyle: "",
                    icon: '<i class="fas fa-info-circle"></i>',
                    activeIcon: '<i class="fas fa-info-circle"></i>',
                    btnText: "Help",
                    activeBtnText: "Help",
                },
                {
                    funct: "contactUs()",
                    tag: "contact.us",
                    intent: "contact.us",
                    style: "",
                    activeStyle: "",
                    icon: '<i class="fas fa-at"></i>',
                    activeIcon: '<i class="fas fa-at"></i>',
                    btnText: "Contact Us",
                    activeBtnText: "Contact Us",
                },
                
                {
                    funct: "toggleNavMenu()",
                    tag: "view.nav",
                    intent: "view.nav",
                    style: "",
                    activeStyle: "",
                    icon: '<i class="fas fa-ellipsis-h"></i>',
                    activeIcon: '<i class="fas fa-ellipsis-h"></i>',
                    btnText: "More",
                    activeBtnText: "More",
                }]
            },
            loadingSpinner: {
                //image: '<img style="height:150px;" src="img/loading7.gif">',
                image: '<i class="fas fa-compact-disc fa-spin"></i>',
                imageClass: "loadingSpinnerImageStyle",
                spinnerClass: "loadingSpinnerStyle",

            },
            logo: {
                image: "./img/bveu-logo.png",
                logoClass: "companyLogoStyle",
            },
            dialogBox: {
                dialogBoxCardClass: "dialogBoxCardStyle",
                dialogBoxTextClass: "dialogBoxTextStyle",
                dialogBoxBackgroundClass: "dialogBoxBackgroundStyle",
                dialogBoxButtonClass: "dialogBoxButtonStyle",
            }
        },

        homeScreen: {
            assistPresent: true,
            assistStyleIndex: 1,
            sectionList: [{
                    content: "height:100%; width:100%;",

                    menuList: [{
                            tag: "home_main",
                            menuClass: "homeMenu1Style",
                            menuBtnAreaClass: "homeMenuBtnAreaStyle",
                            btnClass: "homeMenu homeMenu1BtnStyle",
                            activeBtnClass: "homeMenu homeMenu1ActiveBtnStyle",
                            btnAfterEffectClass: "homeMenu1BtnAfterEffectStyle",
                            btnTextClass: "homeMenu1BtnTextStyle",
                            activeBtnTextClass: "homeMenu1ActiveBtnTextStyle",
                            iconClass: "homeMenu1IconStyle",
                            activeIconClass: "homeMenu1ActiveIconStyle",
                            overlayClass: "homeMenu1OverlayStyle",
                            logoPresent: false,
                            breadcrumbPresent: false,
                            menuPresent: true,
                            miniAssistPresent: false,
                            btnData: [{
                                    funct: "viewCourses()",
                                    tag: "view.course",
                                    intent: "K",
                                    style: "background:rgba(5,100,230,1);",
                                    activeStyle: "",
                                    icon: '<img class="btnLogo" src="./img/icon_knowledgemate.png">',
                                    activeIcon: '<img class="btnLogo" src="./img/icon_knowledgemate.png">',
                                    btnText: "KnowledgeMate",
                                    activeBtnText: "KnowledgeMate",
                                },
                                {
                                    funct: "viewAssetmate()",
                                    tag: "scan.qrcode",
                                    intent: "A",
                                    style: "background:rgba(9,133,50,1);",
                                    activeStyle: "",
                                    icon: '<img class="btnLogo" src="./img/icon_assetmate.png">',
                                    activeIcon: '<img class="btnLogo" src="./img/icon_assetmate.png">',
                                    btnText: "AssetMate",
                                    activeBtnText: "AssetMate",
                                },
                                {
                                    funct: "exitToBanner()",
                                    tag: "view.banner",
                                    intent: "S",
                                    style: "background:rgba(230,100,5,1);",
                                    activeStyle: "",
                                    icon: '<img class="btnLogo" src="./img/icon_digiveu.png">',
                                    activeIcon: '<img class="btnLogo" src="./img/icon_digiveu.png">',
                                    btnText: "DigiVeU",
                                    activeBtnText: "DigiVeU",
                                },
                                {
                                    funct: "viewDocumate()",
                                    tag: "view.documate",
                                    intent: "D",
                                    style: "background:rgba(0,180,120,1);",
                                    activeStyle: "",
                                    icon: '<img class="btnLogo" src="./img/icon_documate.png">',
                                    activeIcon: '<img class="btnLogo" src="./img/icon_documate.png">',
                                    btnText: "DocuMate",
                                    activeBtnText: "DocuMate",
                                },
                                {
                                    funct: "viewVisitmate()",
                                    tag: "view.visitmate",
                                    intent: "V",
                                    style: "background:rgba(9,68,149,1);",
                                    activeStyle: "",
                                    icon: '<img class="btnLogo" src="./img/icon_visitmate.png">',
                                    activeIcon: '<img class="btnLogo" src="./img/icon_visitmate.png">',
                                    btnText: "VisitMate",
                                    activeBtnText: "VisitMate",
                                },
                                {
                                    funct: "viewSitemate()",
                                    tag: "view.sitemate",
                                    intent: "I",
                                    style: "background:rgba(155,0,210,1);",
                                    activeStyle: "",
                                    icon: '<img class="btnLogo" src="./img/icon_sitemate.png">',
                                    activeIcon: '<img class="btnLogo" src="./img/icon_sitemate.png">',
                                    btnText: "SiteMate",
                                    activeBtnText: "SiteMate",
                                },
                                {
                                    funct: "viewLotomate()",
                                    tag: "view.lotomate",
                                    intent: "L",
                                    style: "background:rgba(110,65,65,1);",
                                    activeStyle: "",
                                    icon: '<img class="btnLogo" src="./img/icon_lotomate.png">',
                                    activeIcon: '<img class="btnLogo" src="./img/icon_lotomate.png">',
                                    btnText: "LOTOMate",
                                    activeBtnText: "LOTOMate",
                                }
                            ]
                        }
                    ],
                    overlayList: []
                }
            ]
            
        },
        documateScreen: {
            assistPresent: false,
            assistStyleIndex: 1,
            sectionList: [{
                    content: "height:100%; width:100%;",

                    menuList: [{
                            tag: "documate",
                            menuClass: "homeMenu1Style",
                            menuBtnAreaClass: "homeMenuBtnAreaStyle",
                            btnClass: "homeMenu1BtnStyle",
                            activeBtnClass: "homeMenu1ActiveBtnStyle",
                            btnAfterEffectClass: "homeMenu1BtnAfterEffectStyle",
                            btnTextClass: "homeMenu1BtnTextStyle",
                            activeBtnTextClass: "homeMenu1ActiveBtnTextStyle",
                            iconClass: "homeMenu1IconStyle",
                            activeIconClass: "homeMenu1ActiveIconStyle",
                            overlayClass: "homeMenu1OverlayStyle",
                            logoPresent: false,
                            breadcrumbPresent: false,
                            menuPresent: true,
                            miniAssistPresent: false,
                            btnData: [{
                                    funct: "scanDocumateQRCode()",
                                    tag: "view.docuqrcode",
                                    intent: "",
                                    style: "",
                                    activeStyle: "",
                                    icon: '<i class="fas fa-qrcode"></i>',
                                    activeIcon: '<i class="fas fa-qrcode"></i>',
                                    btnText: "SCAN",
                                    activeBtnText: "SCAN",
                                },
                                {
                                    funct: "displayTags(this)",
                                    tag: "CATEGORY",
                                    intent: "",
                                    style: "",
                                    activeStyle: "",
                                    icon: '<i class="fas fa-list"></i>',
                                    activeIcon: '<i class="fas fa-list"></i>',
                                    btnText: "CATEGORY",
                                    activeBtnText: "CATEGORY",
                                },
                                {
                                    funct: "displayTags(this)",
                                    tag: "LOCATION",
                                    intent: "",
                                    style: "",
                                    activeStyle: "",
                                    icon: '<i class="fas fa-map-marker-alt"></i>',
                                    activeIcon: '<i class="fas fa-map-marker-alt"></i>',
                                    btnText: "LOCATION",
                                    activeBtnText: "LOCATION",
                                },
                                {
                                    funct: "displayTags(this)",
                                    tag: "FUNCTION",
                                    intent: "",
                                    style: "",
                                    activeStyle: "",
                                    icon: '<i class="fas fa-cogs"></i>',
                                    activeIcon: '<i class="fas fa-cogs"></i>',
                                    btnText: "FUNCTION",
                                    activeBtnText: "FUNCTION",
                                },
                                {
                                    funct: "viewArchivedRecordList()",
                                    tag: "view.archivedrecords",
                                    intent: "",
                                    style: "",
                                    activeStyle: "",
                                    icon: '<i class="fas fa-archive"></i>',
                                    activeIcon: '<i class="fas fa-archive"></i>',
                                    btnText: "ARCHIVED",
                                    activeBtnText: "ARCHIVED",
                                },
                                {
                                    funct: "viewSharedRecordList()",
                                    tag: "view.sharedrecords",
                                    intent: "",
                                    style: "",
                                    activeStyle: "",
                                    icon: '<i class="fas fa-share-alt"></i>',
                                    activeIcon: '<i class="fas fa-share-alt"></i>',
                                    btnText: "SHARED",
                                    activeBtnText: "SHARED",
                                }
                            ]
                        }
                    ],
                    overlayList: []
                }
            ]
        },
        assetmateScreen: {
            assistPresent: false,
            assistStyleIndex: 1,
            sectionList: [{
                    content: "height:100%; width:100%;",

                    menuList: [{
                            tag: "assetmate",
                            menuClass: "homeMenu1Style",
                            menuBtnAreaClass: "homeMenuBtnAreaStyle",
                            btnClass: "homeMenu1BtnStyle",
                            activeBtnClass: "homeMenu1ActiveBtnStyle",
                            btnAfterEffectClass: "homeMenu1BtnAfterEffectStyle",
                            btnTextClass: "homeMenu1BtnTextStyle",
                            activeBtnTextClass: "homeMenu1ActiveBtnTextStyle",
                            iconClass: "homeMenu1IconStyle",
                            activeIconClass: "homeMenu1ActiveIconStyle",
                            overlayClass: "homeMenu1OverlayStyle",
                            logoPresent: false,
                            breadcrumbPresent: false,
                            menuPresent: true,
                            miniAssistPresent: false,
                            btnData: [{
                                    funct: "openQRCodeScanner()",
                                    tag: "view.assetqrcode",
                                    intent: "",
                                    style: "",
                                    activeStyle: "",
                                    icon: '<i class="fas fa-qrcode"></i>',
                                    activeIcon: '<i class="fas fa-qrcode"></i>',
                                    btnText: "SCAN",
                                    activeBtnText: "SCAN",
                                },
                                {
                                    funct: "getAudits()",
                                    tag: "get.audits",
                                    intent: "",
                                    style: "",
                                    activeStyle: "",
                                    icon: '<i class="fas fa-list-alt"></i>',
                                    activeIcon: '<i class="fas fa-list-alt"></i>',
                                    btnText: "AUDITS",
                                    activeBtnText: "AUDITS",
                                }
                            ]
                        }
                    ],
                    overlayList: []
                }
            ]
        },
        sitemateScreen: {
            assistPresent: false,
            assistStyleIndex: 1,
            sectionList: [{
                    content: "height:100%; width:100%;",

                    menuList: [{
                            tag: "sitemate",
                            menuClass: "homeMenu1Style",
                            menuBtnAreaClass: "homeMenuBtnAreaStyle",
                            btnClass: "homeMenu1BtnStyle",
                            activeBtnClass: "homeMenu1ActiveBtnStyle",
                            btnAfterEffectClass: "homeMenu1BtnAfterEffectStyle",
                            btnTextClass: "homeMenu1BtnTextStyle",
                            activeBtnTextClass: "homeMenu1ActiveBtnTextStyle",
                            iconClass: "homeMenu1IconStyle",
                            activeIconClass: "homeMenu1ActiveIconStyle",
                            overlayClass: "homeMenu1OverlayStyle",
                            logoPresent: false,
                            breadcrumbPresent: false,
                            menuPresent: true,
                            miniAssistPresent: false,
                            btnData: [{
                                    funct: "createIncidentReport()",
                                    tag: "view.newincident",
                                    intent: "",
                                    style: "",
                                    activeStyle: "",
                                    icon: '<i class="fas fa-notes-medical"></i>',
                                    activeIcon: '<i class="fas fa-notes-medical"></i>',
                                    btnText: "NEW INCIDENT",
                                    activeBtnText: "NEW INCIDENT",
                                },
                                {
                                    funct: "getMyIncidents()",
                                    tag: "view.myincidents",
                                    intent: "",
                                    style: "",
                                    activeStyle: "",
                                    icon: '<i class="fas fa-list"></i>',
                                    activeIcon: '<i class="fas fa-list"></i>',
                                    btnText: "MY INCIDENTS",
                                    activeBtnText: "MY INCIDENTS",
                                }
                            ]
                        }
                    ],
                    overlayList: []
                }
            ]
        },
        visitmateScreen: {
            assistPresent: false,
            assistStyleIndex: 1,
            sectionList: [{
                    content: "height:100%; width:100%;",

                    menuList: [{
                            tag: "visitmate",
                            menuClass: "homeMenu1Style",
                            menuBtnAreaClass: "homeMenuBtnAreaStyle",
                            btnClass: "homeMenu1BtnStyle",
                            activeBtnClass: "homeMenu1ActiveBtnStyle",
                            btnAfterEffectClass: "homeMenu1BtnAfterEffectStyle",
                            btnTextClass: "homeMenu1BtnTextStyle",
                            activeBtnTextClass: "homeMenu1ActiveBtnTextStyle",
                            iconClass: "homeMenu1IconStyle",
                            activeIconClass: "homeMenu1ActiveIconStyle",
                            overlayClass: "homeMenu1OverlayStyle",
                            logoPresent: false,
                            breadcrumbPresent: false,
                            menuPresent: true,
                            miniAssistPresent: false,
                            btnData: [{
                                    funct: "scanVisitmateQRCode()",
                                    tag: "view.visitqrcode",
                                    intent: "",
                                    style: "",
                                    activeStyle: "",
                                    icon: '<i class="fas fa-qrcode"></i>',
                                    activeIcon: '<i class="fas fa-qrcode"></i>',
                                    btnText: "SCAN",
                                    activeBtnText: "SCAN",
                                },
                                {
                                    funct: "createVisitor()",
                                    tag: "view.newvisitor",
                                    intent: "",
                                    style: "",
                                    activeStyle: "",
                                    icon: '<i class="fas fa-envelope"></i>',
                                    activeIcon: '<i class="fas fa-envelope"></i>',
                                    btnText: "INVITE",
                                    activeBtnText: "INVITE",
                                },
                                {
                                    funct: "getMyVisitors()",
                                    tag: "view.myvisitors",
                                    intent: "",
                                    style: "",
                                    activeStyle: "",
                                    icon: '<i class="fas fa-user-friends"></i>',
                                    activeIcon: '<i class="fas fa-user-friends"></i>',
                                    btnText: "MY VISITORS",
                                    activeBtnText: "MY VISITORS",
                                }
                            ]
                        }
                    ],
                    overlayList: []
                }
            ]
        },
        systemScreen: {
            assistPresent: false,
            bannerPresent: false,

            nameFontClass: "nameFontStyle",
            headingFontClass: "headingFontStyle",
            descriptionFontClass: "descriptionFontStyle",
        },
        courseScreen: {
            courseBanner: "https://bviucp.s3.ap-south-1.amazonaws.com/bviu_resource/bviu_contents/training_logo.png",
        }

    }
};

export var shared = {
    appVersion :"",
    releaseInfo : "",
    configVersion : "",
    softAutoUpdate : "",
    configUpdateTime : "",
    systemSleepTime : "",
    systemWakeTime : "",
    primaryColor : "",
    secondaryColor : "",
    developerEmailAddress : "",
    server : "",
    inAppUpdateEnabled : "",
    ROOT_STORAGE_PATH : "",
    deviceSerialNumber :"",
    deviceMACAddress : "",
    systemConfiguration : hardcodedSystemConfiguration,
    cmsJSON : hardcodedCmsJSON,
    currentState : "",
    currentSourceState  : "",
    currentRunningApp : "",
    mCustomerDetailsJSON : null,
};

var app = {
  initialize: function () {
    document.addEventListener('deviceready', this.onDeviceReady.bind(this), false);
  },

  onDeviceReady: function () {
    console.log('Device is ready');
    getSerialNumber(); //  Invoke  function here
  }
};

window.addEventListener('DOMContentLoaded', () => {
  app.initialize();
});

