import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Http } from '@capacitor-community/http';
import JSZip from 'jszip';

/*******************************************************************************
Function: getMiniappData
Purpose: Downloads, unzips, and loads a mini-app into a specified container.
*******************************************************************************/
export async function getMiniappData(contentData, destin) {
    const localZipPath = "miniapp.zip";
    const localExtractPath = "miniapp";
    const metaFilePath = `${localExtractPath}/miniapp.json`;

    if (typeof contentData === "string") {
        contentData = JSON.parse(contentData);
    }

    console.log("Checking for existing miniapp metadata...");

    try {
        const metaResult = await Filesystem.readFile({
            path: metaFilePath,
            directory: Directory.Data,
            encoding: Encoding.UTF8
        });

        const existingMeta = JSON.parse(metaResult.data);
        if (existingMeta.timestamp !== contentData.timestamp) {
            console.log("New version found → downloading");
            await downloadAndExtract();
        } else {
            console.log("Using existing miniapp");
            await loadIframe();
        }
    } catch (err) {
        console.log("No miniapp.json found or corrupt → downloading");
        await downloadAndExtract();
    }

    /*******************************************************************************
    Function: saveMetaFile
    Purpose: Writes miniapp metadata to miniapp.json inside localExtractPath.
    *******************************************************************************/
    async function saveMetaFile(meta) {
        try {
            await Filesystem.writeFile({
                path: metaFilePath,
                data: JSON.stringify(meta),
                directory: Directory.Data,
                encoding: Encoding.UTF8,
                recursive: true
            });
            console.log("Meta file saved successfully");
        } catch (err) {
            console.error("Failed to write meta file:", err);
        }
    }

    /*******************************************************************************
    Function: loadIframe
    Purpose: Creates an iframe pointing to the miniapp's index.html.
    *******************************************************************************/
    async function loadIframe() {
        console.log("Loading miniapp page...");

        const container = document.getElementById(destin);
        if (!container) {
            console.error("Destination div not found:", destin);
            return;
        }

        container.innerHTML = "";

        try {
            // List directory contents
            const dirContents = await Filesystem.readdir({
                path: localExtractPath,
                directory: Directory.Data
            });

            console.log("Files and folders in miniapp directory:", dirContents.files);

            // Convert the directory path to a webview URL
            const fileUrlResult = await Filesystem.getUri({
                path: `${localExtractPath}/index.html`,
                directory: Directory.Data
            });

            const iframe = document.createElement("iframe");
            iframe.src = Capacitor.convertFileSrc(fileUrlResult.uri);
            iframe.width = "100%";
            iframe.height = "100%";
            iframe.style.border = "none";

            container.appendChild(iframe);
        } catch (err) {
            console.error("Failed to load miniapp files:", err);
        }
    }

    /*******************************************************************************
    Function: downloadAndExtract
    Purpose: Downloads the miniapp ZIP file, extracts it, updates the meta file,
             and then loads the miniapp iframe.
    *******************************************************************************/
    async function downloadAndExtract() {
        console.log("Downloading zip:", contentData.file);

        const progressContainer = document.getElementById("downloadProgressContainer");
        const progressBar = document.getElementById("downloadProgressBar");
        const progressMessage1 = document.getElementById("progressMessage1");
        const progressMessage2 = document.getElementById("progressMessage2");

        if (progressMessage1) progressMessage1.innerHTML = "Loading latest data... Please wait a moment";
        if (progressContainer && progressBar) {
            progressContainer.style.display = "flex";
            progressBar.style.width = "0%";
        }

        try {
            // Step 1: Download ZIP as a blob
            const response = await Http.downloadFile({
                url: contentData.file,
                filePath: localZipPath,
                directory: Directory.Data
            });

            console.log("Download complete:", response.path);

            if (progressMessage2) progressMessage2.innerHTML = "Download complete. Extracting...";

            // Step 2: Read and unzip
            const zipFile = await Filesystem.readFile({
                path: localZipPath,
                directory: Directory.Data
            });

            const zipData = Uint8Array.from(atob(zipFile.data), c => c.charCodeAt(0));
            const jszip = new JSZip();
            const zip = await jszip.loadAsync(zipData);

            // Extract all files
            for (const [filename, fileObj] of Object.entries(zip.files)) {
                if (fileObj.dir) continue; // Skip directories
                const fileData = await fileObj.async("base64");
                await Filesystem.writeFile({
                    path: `${localExtractPath}/${filename}`,
                    data: fileData,
                    directory: Directory.Data
                });
            }

            console.log("Unzip successful");
            if (progressContainer) progressContainer.style.display = "none";

            // Step 3: Delete ZIP file
            try {
                await Filesystem.deleteFile({
                    path: localZipPath,
                    directory: Directory.Data
                });
                console.log("Zip file deleted successfully");
            } catch (deleteErr) {
                console.error("Failed to delete zip file:", deleteErr);
            }

            // Step 4: Save meta file
            await saveMetaFile(contentData);

            // Step 5: Load the miniapp
            await loadIframe();
        } catch (err) {
            console.error("Download or extraction failed:", err);
            if (progressContainer) progressContainer.style.display = "none";
        }
    }
}
