import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';

var mFO_FileSystem; // Placeholder for compatibility
var mFO_DirectoryEntry; // Root Storage Path
var mFO_DirectoryReader; // Folder Dir
var mFO_FileEntry; // File Location
var mFO_RootPath;
var mFO_Folder;
var mFO_FileName;
var mFO_WritterBlob;
var mFO_FileSuccessCallBack;
var mFO_FileFailedCallBack;
var mFo_FileData;
var attachmentList;

// STEP 1: Prepare the File Operation
export async function prepareFileSystem(rootpath, folder, filename, blob, fileSuccessCallBack, fileFailedCallBack) {
    mFO_RootPath = rootpath;
    mFO_Folder = folder;
    mFO_FileName = filename;
    mFO_WritterBlob = blob;
    mFO_FileSuccessCallBack = fileSuccessCallBack;
    mFO_FileFailedCallBack = fileFailedCallBack;

    initFileSystem();
}

// STEP 2: Initialize Filesystem (Capacitor doesn’t require explicit FS init)
async function initFileSystem() {
    try {
        console.log("File Operation: requestFileSystem: Success");
        mFO_FileSystem = true; // just to retain structure
        await getDirectoryEntry();
    } catch (err) {
        console.error("File Operation: requestFileSystem: Failed", err);
        mFO_FileSystem = undefined;
        eval(mFO_FileFailedCallBack);
    }
}

// STEP 3: Access Root Directory (Capacitor handles via Directory & path)
async function getDirectoryEntry() {
    try {
        console.log("File Operation: getDirectoryEntry: Success");
        mFO_DirectoryEntry = mFO_RootPath;
        await getDirectoryReader();
    } catch (err) {
        console.error("File Operation: getDirectoryEntry: Failed", err);
        mFO_DirectoryEntry = undefined;
        eval(mFO_FileFailedCallBack);
    }
}

// STEP 4: Create or Get Folder
async function getDirectoryReader() {
    try {
        await Filesystem.mkdir({
            path: `${mFO_DirectoryEntry}/${mFO_Folder}`,
            directory: Directory.Data,
            recursive: true
        });
        mFO_DirectoryReader = `${mFO_DirectoryEntry}/${mFO_Folder}`;
        console.log("File Operation: getDirectoryReader: Success");
        await getFileEntry();
    } catch (err) {
        if (err.message.includes('already exists')) {
            // Folder already exists
            mFO_DirectoryReader = `${mFO_DirectoryEntry}/${mFO_Folder}`;
            console.log("File Operation: getDirectoryReader: Folder already exists, continuing...");
            await getFileEntry();
        } else {
            console.error("File Operation: getDirectoryReader: Failed", err);
            mFO_DirectoryReader = undefined;
            eval(mFO_FileFailedCallBack);
        }
    }
}

// STEP 5: Get File Entry
async function getFileEntry() {
    try {
        mFO_FileEntry = `${mFO_DirectoryReader}/${mFO_FileName}`;
        console.log("File Operation: getFileEntry: Success");
        await writeLocalFile();
    } catch (err) {
        console.error("File Operation: getFileEntry: Failed", err);
        mFO_FileEntry = undefined;
        eval(mFO_FileFailedCallBack);
    }
}

// STEP 6: Write File
async function writeLocalFile() {
    try {
        // Convert Blob to Base64
        const base64Data = await blobToBase64(mFO_WritterBlob);

        await Filesystem.writeFile({
            path: mFO_FileEntry,
            data: base64Data,
            directory: Directory.Data
        });

        console.log("File Operation: writeLocalFile: Success");
        await readLocalFile();
    } catch (err) {
        console.error("File Operation: writeLocalFile: Failed", err);
        eval(mFO_FileFailedCallBack);
    }
}

// STEP 7: Read File
async function readLocalFile() {
    try {
        const result = await Filesystem.readFile({
            path: mFO_FileEntry,
            directory: Directory.Data
        });

        mFo_FileData = result.data;
        console.log("File Operation: readLocalFile: " + mFo_FileData);
        eval(mFO_FileSuccessCallBack);
    } catch (err) {
        console.error("File Operation: readLocalFile: Failed", err);
        mFo_FileData = undefined;
        eval(mFO_FileFailedCallBack);
    }
}

// STEP 8: Delete File
export async function deleteFile(logFileName) {
    try {
        const path = `${mFO_DirectoryReader}/${logFileName}`;
        await Filesystem.deleteFile({
            path,
            directory: Directory.Data
        });
        console.log("File Operation: deleteLogFile: Deleted!");
    } catch (err) {
        console.error("File Operation: deleteLogFile: Failed", err);
    }
}

// Utility: Blob to Base64
function blobToBase64(blob) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result.split(',')[1]); // only data part
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}
