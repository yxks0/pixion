
const pixelGrid = document.getElementById("pixelGrid");
const colorPicker = document.getElementById("colorPicker");
const clearBtn = document.getElementById("clearBtn");
const brushBtn = document.getElementById("brushBtn");
const eraserBtn = document.getElementById("eraserBtn");
const undoBtn = document.getElementById("undoBtn");
const redoBtn = document.getElementById("redoBtn");
const saveBtn = document.getElementById("saveBtn");
const loadBtn = document.getElementById("loadBtn");
const exportBtn = document.getElementById("exportBtn");
const gridSizeInput = document.getElementById("gridSize");
const resizeBtn = document.getElementById("resizeBtn");

let rows = 32;
let cols = 32;
let isEraser = false;
let undoStack = [];
let redoStack = [];

function createGrid(size) {
  pixelGrid.innerHTML = "";
  pixelGrid.style.gridTemplateColumns = `repeat(${size}, 20px)`;
  pixelGrid.style.gridTemplateRows = `repeat(${size}, 20px)`;

  for (let i = 0; i < size * size; i++) {
    const cell = document.createElement("div");
    cell.classList.add("cell");
    cell.dataset.index = i;

    cell.addEventListener("click", () => {
      const prevColor = cell.style.backgroundColor;
      const newColor = isEraser ? "white" : colorPicker.value;
      saveState(); // Save before changing
      cell.style.backgroundColor = newColor;
    });

    pixelGrid.appendChild(cell);
  }
}

function saveState() {
  const state = Array.from(document.querySelectorAll(".cell")).map(cell => cell.style.backgroundColor);
  undoStack.push(state);
  redoStack = [];
}

function restoreState(state) {
  const cells = document.querySelectorAll(".cell");
  state.forEach((color, i) => {
    cells[i].style.backgroundColor = color;
  });
}

brushBtn.addEventListener("click", () => {
  isEraser = false;
});

eraserBtn.addEventListener("click", () => {
  isEraser = true;
});


const bucketBtn = document.getElementById("bucketBtn");
let isBucket = false;

// Toggle Paint Bucket tool
bucketBtn.addEventListener("click", () => {
  isBucket = true;
  isEraser = false;
});

// Flood Fill Function (Recursive)
// function floodFill(cell, targetColor, fillColor) {
//   if (!cell || cell.style.backgroundColor === fillColor || cell.style.backgroundColor !== targetColor) {
//     return;
//   }

//   cell.style.backgroundColor = fillColor;

//   const index = parseInt(cell.dataset.index);
//   const neighbors = [
//     document.querySelector(`[data-index="${index - 1}"]`), // Left
//     document.querySelector(`[data-index="${index + 1}"]`), // Right
//     document.querySelector(`[data-index="${index - rows}"]`), // Above
//     document.querySelector(`[data-index="${index + rows}"]`), // Below
//   ];

//   neighbors.forEach(neighbor => floodFill(neighbor, targetColor, fillColor));
// }

// // Apply Fill on Click
// pixelGrid.addEventListener("click", (e) => {
//   if (isBucket && e.target.classList.contains("cell")) {
//     const cell = e.target;
//     const targetColor = cell.style.backgroundColor || "white";
//     const fillColor = colorPicker.value;
//     saveState();
//     floodFill(cell, targetColor, fillColor);
//   }
// });

// function resetTools() {
//   isEraser = false;
//   isBucket = false;
// }

// bucketBtn.addEventListener("click", () => {
//   resetTools();
//   isBucket = true;
// });


// Apply Fill on Click
pixelGrid.addEventListener("click", (e) => {
  if (isBucket && e.target.classList.contains("cell")) {
    const cell = e.target;
    const targetColor = cell.style.backgroundColor || "white";
    const fillColor = colorPicker.value;
    saveState();
    floodFill(cell, targetColor, fillColor);
  }
});



undoBtn.addEventListener("click", () => {
  if (undoStack.length > 0) {
    const current = Array.from(document.querySelectorAll(".cell")).map(cell => cell.style.backgroundColor);
    redoStack.push(current);
    const lastState = undoStack.pop();
    restoreState(lastState);
  }
});

redoBtn.addEventListener("click", () => {
  if (redoStack.length > 0) {
    const current = Array.from(document.querySelectorAll(".cell")).map(cell => cell.style.backgroundColor);
    undoStack.push(current);
    const nextState = redoStack.pop();
    restoreState(nextState);
  }
});

clearBtn.addEventListener("click", () => {
  saveState();
  document.querySelectorAll(".cell").forEach(cell => cell.style.backgroundColor = "white");
});

const slotSelector = document.getElementById("slotSelector");

saveBtn.addEventListener("click", async () => {
  // if (!auth.currentUser) return alert("Please log in first.");
  const colors = Array.from(document.querySelectorAll(".cell")).map(cell => cell.style.backgroundColor);
  const drawingData = { colors, size: rows };
  const slot = slotSelector.value;
  await window.saveDrawing(slot, drawingData);
});

loadBtn.addEventListener("click", async () => {
  // if (!auth.currentUser) return alert("Please log in first.");
  const slot = slotSelector.value;
  const data = await window.loadDrawing(slot);
  if (data) {
    rows = data.size;
    createGrid(rows);
    const cells = document.querySelectorAll(".cell");
    data.colors.forEach((color, i) => {
      cells[i].style.backgroundColor = color;
    });
  }
});


const uploadGalleryBtn = document.getElementById("uploadGalleryBtn");

uploadGalleryBtn.addEventListener("click", async () => {
  // if (!auth.currentUser) return alert("Please log in first.");

  const cells = document.querySelectorAll(".cell");
  if (!cells.length) return alert("No drawing to upload!");

  const colors = Array.from(cells).map(cell => cell.style.backgroundColor);
  const drawingData = {
    colors,
    size: rows
  };

  await window.uploadToGallery(drawingData);
});



async function displayGallery() {
  const galleryDiv = document.getElementById("gallery");
  const drawings = await window.loadPublicGallery();

  galleryDiv.innerHTML = ""; // Clear previous

  drawings.forEach(d => {
    const canvas = document.createElement("canvas");
    canvas.width = d.drawing.size;
    canvas.height = d.drawing.size;
    canvas.style.border = "1px solid #ccc";
    canvas.style.margin = "5px";
    canvas.title = `By ${d.name}`;

    const ctx = canvas.getContext("2d");
    d.drawing.colors.forEach((color, i) => {
      const x = i % d.drawing.size;
      const y = Math.floor(i / d.drawing.size);
      ctx.fillStyle = color || "white";
      ctx.fillRect(x, y, 1, 1);
    });

    galleryDiv.appendChild(canvas);
  });
}

// Optionally call it on load
window.addEventListener("load", displayGallery);




resizeBtn.addEventListener("click", () => {
  const size = parseInt(gridSizeInput.value);
  if (size >= 8 && size <= 64) {
    rows = cols = size;
    createGrid(size);
  } else {
    alert("Grid size must be between 8 and 64.");
  }
});

// Export as PNG
exportBtn.addEventListener("click", () => {
  const scaleFactor = 20; // Adjust for higher resolution (increase for better quality)
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  canvas.width = rows * scaleFactor;
  canvas.height = cols * scaleFactor;

  const cells = document.querySelectorAll(".cell");
  cells.forEach((cell, index) => {
    const x = (index % rows) * scaleFactor;
    const y = Math.floor(index / cols) * scaleFactor;

    ctx.fillStyle = cell.style.backgroundColor || "white";
    ctx.fillRect(x, y, scaleFactor, scaleFactor); // Fill correctly
  });

  const link = document.createElement("a");
  link.download = "pixel-art.png";
  link.href = canvas.toDataURL("image/png");
  link.click();
});


// Init
createGrid(rows);

document.getElementById("galleryBtn").addEventListener("click", () => {
  window.location.href = "gallery.html";
});

