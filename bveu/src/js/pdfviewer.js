let pdfDoc = null;
let scale = 1.2;  // Initial zoom level
let currentPage = 1;
var container = null;
let pinchStartScale = 1;
let currentPinchScale = 1;
let startDistance = 0;

export function viewPdfFile(url, dest) {
  let htmlContent = `
    <div id="pdfviewertoolbar">
      <button id="zoom-out">➖</button>
      <span id="zoom-level">100%</span>
      <button id="zoom-in">➕</button>
      <button id="fit-width">Fit Width</button>
    </div>
    <div id="pdfviewer-container" style="height:100%;overflow:auto;"><div id="pdf-pages"></div></div>
  `;

  document.getElementById(dest).innerHTML = htmlContent;

  // container = document.getElementById("pdfviewer-container");
  container = document.getElementById("pdf-pages");

  // Zoom In
  // document.getElementById("zoom-in").addEventListener("click", () => {
  //   scale += 0.2;
  //   document.getElementById("zoom-level").textContent = Math.round(scale * 100) + "%";
  //   renderAllPages(container);
  // });

  // Zoom Out
  // document.getElementById("zoom-out").addEventListener("click", () => {
  //   if (scale > 0.4) { // Prevent too small zoom
  //     scale -= 0.2;
  //     document.getElementById("zoom-level").textContent = Math.round(scale * 100) + "%";
  //     renderAllPages(container);
  //   }
  // });

  // Zoom In
document.getElementById("zoom-in").addEventListener("click", () => {
  animateZoom(scale + 0.2);
});

// Zoom Out
document.getElementById("zoom-out").addEventListener("click", () => {
  if (scale > 0.4) animateZoom(scale - 0.2);
});



  // Fit Width
  document.getElementById("fit-width").addEventListener("click", () => {
    if (pdfDoc) {
      pdfDoc.getPage(1).then(page => {
        const viewport = page.getViewport({ scale: 1 });
        const containerWidth = container.clientWidth;
        scale = containerWidth / viewport.width;
        document.getElementById("zoom-level").textContent = Math.round(scale * 100) + "%";
        renderAllPages(container);
      });
    }
  });

    // Update current page number on scroll
  container.addEventListener("scroll", () => {
    let canvases = container.querySelectorAll(".pdfviewer-canvas"); // fixed selector
    canvases.forEach(canvas => {
      let rect = canvas.getBoundingClientRect();
      if (rect.top >= 0 && rect.bottom <= window.innerHeight) {
        currentPage = parseInt(canvas.dataset.pageNumber);
      }
    });
  });

  function getDistance(touches) {
    const dx = touches[0].pageX - touches[1].pageX;
    const dy = touches[0].pageY - touches[1].pageY;
    return Math.sqrt(dx * dx + dy * dy);
  }

  function getMidpoint(touches) {
    return {
      x: (touches[0].pageX + touches[1].pageX) / 2,
      y: (touches[0].pageY + touches[1].pageY) / 2
    };
  }

  // Touch start → begin pinch
  container.addEventListener("touchstart", e => {
    if (e.touches.length === 2) {
      e.preventDefault();
      startDistance = getDistance(e.touches);
      pinchStartScale = scale;
    }
  }, { passive: false });

  // Touch move → live transform
  container.addEventListener("touchmove", e => {
    if (e.touches.length === 2) {
      e.preventDefault();

      const newDistance = getDistance(e.touches);
      currentPinchScale = (newDistance / startDistance) * pinchStartScale;

      const midpoint = getMidpoint(e.touches);

      // Transform the wrapper
      container.style.transition = "none";
      container.style.transformOrigin = `${midpoint.x}px ${midpoint.y}px`;
      container.style.transform = `scale(${currentPinchScale / scale})`;
    }
  }, { passive: false });

  // Touch end → commit zoom and re-render
  container.addEventListener("touchend", e => {
    if (e.touches.length < 2 && startDistance > 0) {
      scale = currentPinchScale; // commit final scale
      startDistance = 0;

      // Reset transform
      container.style.transform = "scale(1)";

      // Update UI zoom level
      document.getElementById("zoom-level").textContent =
        Math.round(scale * 100) + "%";

      // Re-render crisp pages
      container.innerHTML = "";
      for (let num = 1; num <= pdfDoc.numPages; num++) {
        renderPage(num, container);
      }
    }
  });

  // Load PDF
  pdfjsLib.getDocument(url).promise.then(pdf => {
    pdfDoc = pdf;
    renderAllPages(container);
  });
}

// Render all pages
function renderAllPages(container) {
  container.innerHTML = ""; // Clear before rendering
  for (let num = 1; num <= pdfDoc.numPages; num++) {
    renderPage(num, container);
  }
}

// Render a single page
// function renderPage(num, container) {
//   pdfDoc.getPage(num).then(page => {
//     let viewport = page.getViewport({ scale });
//     let canvas = document.createElement("canvas");
//     canvas.id = "pdfviewer-canvas-" + num;
//     canvas.className = "pdfviewer-canvas";
//     let ctx = canvas.getContext("2d");
//     canvas.height = viewport.height;
//     canvas.width = viewport.width;
//     canvas.dataset.pageNumber = num;
//     const wrapper = document.createElement("div");
//     wrapper.className = "pdf-page"; // wrapper for centering
//     wrapper.appendChild(canvas);
//     container.appendChild(wrapper);

//     let renderContext = {
//       canvasContext: ctx,
//       viewport: viewport
//     };
//     // page.render(renderContext);
//      page.render(renderContext).promise.then(() => {
//      console.log(`Page ${num} rendered at scale ${scale}`);
//     });
//   });
// }

function renderPage(num, container) {
  pdfDoc.getPage(num).then(page => {
    let viewport = page.getViewport({ scale });

    let canvas = document.getElementById("pdfviewer-canvas-" + num);
    let wrapper;

    if (!canvas) {
      canvas = document.createElement("canvas");
      canvas.id = "pdfviewer-canvas-" + num;
      canvas.className = "pdfviewer-canvas";
      canvas.dataset.pageNumber = num;

      wrapper = document.createElement("div");
      wrapper.className = "pdf-page";
      wrapper.appendChild(canvas);
      container.appendChild(wrapper);
    }

    let ctx = canvas.getContext("2d");
    canvas.height = viewport.height;
    canvas.width = viewport.width;

    const renderContext = {
      canvasContext: ctx,
      viewport: viewport
    };

    page.render(renderContext).promise.then(() => {
      console.log(`Page ${num} rendered at scale ${scale}`);
    });
  });
}


function animateZoom(newScale) {
  const zoomFactor = newScale / scale;
  

  // Apply smooth transform to wrapper
  container.style.transform = `scale(${zoomFactor})`;

  setTimeout(() => {
    scale = newScale;
    document.getElementById("zoom-level").textContent =
      Math.round(scale * 100) + "%";

    // Reset transform
    container.style.transform = "scale(1)";

    // Re-render at new resolution
    container.innerHTML = "";
    for (let num = 1; num <= pdfDoc.numPages; num++) {
      renderPage(num, container);
    }
  }, 300);
}



