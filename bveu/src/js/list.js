import $ from 'jquery';
import { getSignedUrl } from './utility.js';
import { shared, s3PrivateUrl } from './globals.js';

let totalPages = 1;
let currentPage = 1;
let pageActionCallback = null;

/* ============================================================
   CREATE LIST (MAIN EXPORT)
   ============================================================ */
export function createList(
    listType,
    pageTitle,
    listItems,
    pageable,
    pageCount,
    destin,
    onclickAction,
    pageAction,
    displayStyle,
    actionAreaStyle = ''
) {
    let htmlContent = "";

    htmlContent += pageTitle;

    if (!listItems || listItems.length === 0) {
        $("#" + destin).html(htmlContent);
        return;
    }

    /* ---------- GRID START ---------- */
    htmlContent += `<div class="listGridArea" id="listGridArea_${listType}">`;

    listItems.forEach((listItem, index) => {
        const {
            clickAction,
            image,
            title,
            description,
            actions = [],
            activeActions = [],
            states = []
        } = listItem;

        const {
            boxAreaClass,
            imageAreaClass,
            imageStyleClass,
            textAreaClass,
            titleClass,
            descriptionClass
        } = getDisplayClasses(displayStyle);

        htmlContent += `<div class="listBoxArea">`;

        /* CLICK HANDLING */
        let click = "";
        if (clickAction) click = `onclick="${clickAction}"`;
        else if (onclickAction) click = `onclick="${onclickAction}(${index})"`;

        htmlContent += `<div class="${boxAreaClass}" ${click}>`;

        /* IMAGE */
        htmlContent += `<div class="${imageAreaClass}">`;
        if (image && image.startsWith("<")) {
            htmlContent += image;
        } else {
            htmlContent += `
                <img class="listBoxImage ${imageStyleClass}"
                     id="am_list_image_${listItem.id}"
                     data-imageurl="${image}"
                     src="./img/noimage.jpg"
                     onerror="this.onerror=null; this.src='./img/noimage.jpg';">
            `;
        }
        htmlContent += `</div>`;

        /* TEXT AREA */
        htmlContent += `<div class="${textAreaClass}">`;

        /* STATES */
        htmlContent += `<div class="listBoxStateArea">`;
        states.forEach(s => {
            htmlContent += `<div class="stateTextBox ${s.type}">${s.text}</div>`;
        });
        htmlContent += `</div>`;

        htmlContent += `<div class="${titleClass}">${title}</div>`;
        htmlContent += `<div class="${descriptionClass}">${description}</div>`;
        htmlContent += `</div>`; // textArea

        htmlContent += `</div>`; // boxContent

        /* ACTION AREA */
        htmlContent += `<div class="listBoxActionArea" style="${actionAreaStyle}">`;
        actions.forEach(action => {
            if (action.type === "button") {
                let isActive = activeActions.some(a => a.text === action.text);
                let icon = action.icon || action.text;

                htmlContent += `
                    <div class="listBoxActionButton ${isActive ? action.actionClass : ''}"
                        ${isActive ? `onclick="${action.act}"` : ''}>
                        ${icon}
                    </div>`;
            } else if (action.content) {
                htmlContent += `<div>${action.content}</div>`;
            }
        });
        htmlContent += `</div>`; // actionArea

        htmlContent += `</div>`; // listBoxArea
    });

    htmlContent += `</div>`; // listGridArea

    /* ---------- PAGINATION UI ---------- */
    if (pageable) {
        htmlContent += `
            <div class="pagination">
                <button id="pagePrevBtn" class="paginationbutton">Previous</button>
                <select id="pageSelect" class="paginationselect"></select>
                <button id="pageNextBtn" class="paginationbutton">Next</button>
            </div>
        `;
    }

    $("#" + destin).html(htmlContent);

    /* ---------- PAGINATION SETUP ---------- */
    if (pageable) {
        totalPages = pageCount;
        currentPage = pageable.pageNumber + 1;
        pageActionCallback = pageAction; // MUST be a function, not a string

        populatePaginationDropdown();
        updatePaginationButtons();
    }

    /* ---------- LOAD IMAGES ---------- */
    loadListImages(destin);
}

/* ============================================================
   STYLE CLASSES
   ============================================================ */
function getDisplayClasses(style) {
    if (style === "cardStyle") {
        return {
            boxAreaClass: "cardStyleBoxContentArea",
            imageAreaClass: "cardStyleImageArea",
            imageStyleClass: "cardStyleImage",
            textAreaClass: "cardStyleTextArea",
            titleClass: "cardStyleTitle",
            descriptionClass: "cardStyleDescription"
        };
    }

    return {
        boxAreaClass: "ticketStyleBoxContentArea",
        imageAreaClass: "ticketStyleImageArea",
        imageStyleClass: "ticketStyleImage",
        textAreaClass: "ticketStyleTextArea",
        titleClass: "ticketStyleTitle",
        descriptionClass: "ticketStyleDescription"
    };
}

/* ============================================================
   PAGINATION
   ============================================================ */
function populatePaginationDropdown() {
    const pageSelect = document.getElementById("pageSelect");
    pageSelect.innerHTML = "";

    for (let i = 1; i <= totalPages; i++) {
        let option = document.createElement("option");
        option.value = i;
        option.textContent = `Page ${i}`;
        pageSelect.appendChild(option);
    }

    pageSelect.value = currentPage;

    pageSelect.onchange = paginationGoToPage;
    document.getElementById("pagePrevBtn").onclick = () => paginationChangePage(-1);
    document.getElementById("pageNextBtn").onclick = () => paginationChangePage(1);
}

function updatePaginationButtons() {
    document.getElementById("pagePrevBtn").disabled = currentPage === 1;
    document.getElementById("pageNextBtn").disabled = currentPage === totalPages;
}

function paginationChangePage(step) {
    const pageSelect = document.getElementById("pageSelect");

    currentPage += step;
    pageSelect.value = currentPage;

    updatePaginationButtons();

    if (typeof pageActionCallback === "function") {
        pageActionCallback(currentPage, 50);
    }
}

function paginationGoToPage() {
    const pageSelect = document.getElementById("pageSelect");

    currentPage = parseInt(pageSelect.value, 10);
    updatePaginationButtons();

    if (typeof pageActionCallback === "function") {
        pageActionCallback(currentPage, 50);
    }
}

/* ============================================================
   IMAGE HANDLING (SIGNED URL)
   ============================================================ */
function loadListImages(destin) {
    const parent = document.getElementById(destin);
    if (!parent) return;

    const imgs = parent.getElementsByClassName("listBoxImage");
    [...imgs].forEach(async img => {
        let objectKey = img.dataset.imageurl;
        if (!objectKey) return;

        if (objectKey.startsWith(s3PrivateUrl)) {
            objectKey = objectKey.replace(s3PrivateUrl, "");

            try {
                const signed = await getSignedUrl(objectKey, 10);
                if (signed?.startsWith("https://")) img.src = signed;
            } catch (err) {
                console.warn("Image signed URL failed:", err);
            }
        } else {
            img.src = objectKey;
        }
    });
}

/* Make functions available globally if required by old code */
window.createList = createList;
window.paginationChangePage = paginationChangePage;
window.paginationGoToPage = paginationGoToPage;
