

// Commands
const GenImg		= 0x01;
const GenChar		= 0x02;
const Match			= 0x03;
const Search		= 0x04;
const MergeModel	= 0x05;
const StoreChar		= 0x06;
const LoadChar		= 0x07;
const UpChar		= 0x08;
const DownChar		= 0x09;
const UpImage		= 0x0A;
const DownImage		= 0x0B;
const DeleteChar	= 0x0C;
const EmptyChar		= 0x0D;
const SetSysPara	= 0x0E;
const ReadSysPara	= 0x0F;
const SetPwd		= 0x12;
const VfyPwd		= 0x13;
const GetRandomCode	= 0x14;
const SetAdder		= 0x15;
const Control		= 0x17;
const WriteNotepad	= 0x18;
const ReadNotepad	= 0x19;
const HiSpeedSearch	= 0x1B;
const TempleteNum	= 0x1D;
const ReadIndexTable= 0x1F;
const Cancel		= 0x30;		// Cancel
const AutoEnroll	= 0x31;		// AutoEnroll
const AutoIdentify	= 0x32;		// AutoIdentify
const GR_Identify	= 0x34;
const AuraLedConfig	= 0x35;		// AuraLedConfig
const CheckSensor	= 0x36;		// CheckSensor 
const GetAlgVer		= 0x39;		// Get the library version
const GetFwVer		= 0x3A;		// Obtaining the Firmware Version
const ReadProdInfo	= 0x3C;		// Reading product Information
const SoftRst		= 0x3D;		// Soft reset
const HandShake		= 0x40;

// Responses
const ERR_Succes             = 0x00  // Instruction processing succeeded.
const ERR_Fail               = 0x01  // Data package Receive Error
const ERR_FpNoDetected       = 0x02  // No fingerprint is entered on the collector
const ERR_GetImgErr          = 0x03  // Failed to input fingerprint image
const ERR_ImgTooDry          = 0x04  // The image is too dry
const ERR_ImgTooWet          = 0x05  // The image is too wet
const ERR_ImgTooRdom         = 0x06  // The image is too messy
const ERR_ImgTooSml          = 0x07  // Too few characteristic points
const ERR_FingNone           = 0x08  // Fingerprints don't match.
const ERR_SerchNone          = 0x09  // Didn't find the fingerprint
const ERR_CharMerge          = 0x0a  // Characteristic merge failure
const ERR_NumOutRange        = 0x0b  // The address serial number of the fingerprint database is out of range
const ERR_CharRead           = 0x0c  // Error reading template from fingerprint database
const ERR_CharUp             = 0x0d  // Uploading features failed
const ERR_PacketNotFollow    = 0x0e  // The module cannot receive subsequent packets
const ERR_ImgUp              = 0x0f  // Uploading image failed
const ERR_CharDel            = 0x10  // Failed to delete a template
const ERR_TempClean          = 0x11  // Failed to clear the fingerprint database
const ERR_Password           = 0x13  // Incorrect password
const ERR_NoImgInBuf         = 0x15  // No valid raw graph in buffer
const ERR_FingerPlacement    = 0x17  // Improper finger placement
const ERR_FlashRead          = 0x18  // Reading FLASH is error
const ERR_RegNum             = 0x1a  // Invalid register number
const ERR_RegConfig          = 0x1b  // Register setting error
const ERR_NotePage           = 0x1c  // The notepad page number is specified incorrectly
const ERR_Com                = 0x1d  // Port operation failure
const ERR_TempFull           = 0x20  // Fingerprint is full


function getResponseMsg(code) {
	switch(code) {
		case ERR_Succes: return "Success";
		case ERR_Fail: return "Error receiving data";
		case ERR_FpNoDetected: return "No finger";
		case ERR_GetImgErr: return "Failed to enroll";
		case ERR_ImgTooDry: return "Image too dry";
		case ERR_ImgTooWet: return "Image too wet";
		case ERR_ImgTooRdom: return "Disorderly fingerprint image";
		case ERR_ImgTooSml: return "Small fingerprint image";
		case ERR_FingNone: return "Finger doesn't match";
		case ERR_SerchNone: return "Failed to find matching fingerprint";
		case ERR_CharMerge: return "Failed to combine";
		case ERR_NumOutRange: return "Invalid PageID";
		case ERR_CharRead: return "Invalid template / Template not present";
		case ERR_CharUp: return "Error uploading template";
		case ERR_PacketNotFollow: return "Error data package";
		case ERR_ImgUp: return "Error uploading image";
		case ERR_CharDel: return "Failed to delete template";
		case ERR_TempClean: return "Failed to clear library";
		case ERR_Password: return "Wrong password!";
		case ERR_NoImgInBuf: return "Invalid primary image";
		case ERR_FingerPlacement: return "Romeve finger and place it correctly";
		case ERR_FlashRead: return "Error writing flash";
		case ERR_RegNum: return "Invalid register number";
		case ERR_RegConfig: return "Register setting error";
		case ERR_NotePage: return "Wrong notepad page";
		case ERR_Com: return "Failed communication port";
		case ERR_TempFull: return "Fingerprint memory full";
		default: return "invalid response: "+code;
	}
}

const CMDPacket = 0x01;		//Command package
const DataPacket = 0x02;	//Data package
const EndPacket = 0x08;		//End  packet
const CharBuf1 = 0x01;		// Character Buffer 1
const CharBuf2 = 0x02;		// Character Buffer 2
const header = [0xEF, 0x01];
const adder = [0xFF, 0xFF, 0xFF, 0xFF];
const packageId = 0x01;

const NONE = 0;
const FPS_SEARCH = 1;
const FPS_SEARCH_PROCESS = 2;
const FPS_ENROLL1 = 3;
const FPS_ENROLL_PROCESS1 = 4;
const FPS_ENROLL_REMOVE = 5;
const FPS_ENROLL2 = 6;
const FPS_ENROLL_PROCESS2 = 7;

let currentFpsCmd = NONE;
let currentFpsState = NONE;
let fpStorePageNo = 0;
let responseCode = null;
let fingerprintScannerOpen = false;
var ertFileData;
var receivedData = [];
var pollFpsTimer = null;
var fpsMonitorTimer = null;
let fpsMonitorTimerCounter = 0;
var usbDevices = null;
