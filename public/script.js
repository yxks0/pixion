
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
const bucketBtn = document.getElementById("bucketBtn");

let rows = 32;
let cols = 32;

let undoStack = [];
let redoStack = [];

let isEraser = false;
let isBrush = false;
let isBucket = false;
let isEyedropper = false;


function resetTools() {
  isEraser = false;
  isBucket = false;
  isBrush = false;
  isEyedropper = false;
}

function createGrid(size) {
  pixelGrid.innerHTML = "";
  pixelGrid.style.gridTemplateColumns = `repeat(${size}, 20px)`;
  pixelGrid.style.gridTemplateRows = `repeat(${size}, 20px)`;

  for (let i = 0; i < size * size; i++) {
    const cell = document.createElement("div");
    cell.classList.add("cell");
    cell.dataset.index = i;

    cell.addEventListener("click", () => {
      if (isEyedropper) {
        const sampledColor = cell.style.backgroundColor || "rgb(255, 255, 255)";
        const hex = rgbToHex(sampledColor);
        colorPicker.value = hex;
        isEyedropper = false;
        return;
      }

  const newColor = isEraser ? "white" : colorPicker.value;
  saveState();
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

bucketBtn.addEventListener("click", () => {
  resetTools();
  isBucket = true;
});

pixelGrid.addEventListener("click", (e) => {
  if (isBucket && e.target.classList.contains("cell")) {
    const cell = e.target;
    const targetColor = cell.style.backgroundColor || "white";  // Fix here
    const fillColor = colorPicker.value;
    if (targetColor === fillColor) return;
    saveState();
    floodFill(cell, targetColor, fillColor);
  }
});

function floodFill(startCell, targetColor, fillColor) {
  if (!startCell) return;

  const gridSize = rows; // or cols (same for square)
  const cells = document.querySelectorAll(".cell");
  const stack = [startCell];
  const visited = new Set();

  while (stack.length) {
    const current = stack.pop();
    const index = parseInt(current.dataset.index);
    if (visited.has(index)) continue;
    visited.add(index);

    const currentColor = current.style.backgroundColor || "white";  // Fix here

    if (currentColor !== targetColor) continue;

    current.style.backgroundColor = fillColor;

    const x = index % gridSize;
    const y = Math.floor(index / gridSize);

    const neighbors = [];
    if (x > 0) neighbors.push(cells[index - 1]);             // Left
    if (x < gridSize - 1) neighbors.push(cells[index + 1]);  // Right
    if (y > 0) neighbors.push(cells[index - gridSize]);      // Top
    if (y < gridSize - 1) neighbors.push(cells[index + gridSize]); // Bottom

    neighbors.forEach(n => {
      const nColor = n.style.backgroundColor || "white";     // Fix here
      if (nColor === targetColor) {
        stack.push(n);
      }
    });
  }
}


const eyedropperBtn = document.getElementById("eyedropperBtn");

eyedropperBtn.addEventListener("click", () => {
  resetTools();
  isEyedropper = true;
});

function rgbToHex(rgb) {
  const result = rgb.match(/\d+/g);
  if (!result) return "#ffffff";
  return (
    "#" +
    result
      .map(x => {
        const hex = parseInt(x).toString(16);
        return hex.length === 1 ? "0" + hex : hex;
      })
      .join("")
  );
}



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
  const colors = Array.from(document.querySelectorAll(".cell")).map(cell => cell.style.backgroundColor);
  const drawingData = { colors, size: rows };
  const slot = slotSelector.value;
  await window.saveDrawing(slot, drawingData);
});

loadBtn.addEventListener("click", async () => {
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

  const cells = document.querySelectorAll(".cell");
  if (!cells.length) return alert("No drawing to upload!");

  const colors = Array.from(cells).map(cell => cell.style.backgroundColor);
  const drawingData = {
    colors,
    size: rows
  };

  // await addDoc(collection(db, "publicGallery"), {
  //   drawing: drawingData,
  //   name: auth.currentUser.displayName || "Anonymous",
  //   reactions: { like: 0, love: 0, wow: 0 },
  //   comments: []
  // });

  await window.uploadToGallery(drawingData);
});

// uploadGalleryBtn.addEventListener("click", async () => {
//   if (!auth.currentUser) return alert("Please log in first.");

//   const cells = document.querySelectorAll(".cell");
//   if (!cells.length) return alert("No drawing to upload!");

//   const colors = Array.from(cells).map(cell => cell.style.backgroundColor);
//   const title = prompt("Enter a title for your artwork:", "My Art");

//   const drawingData = {
//     title: title || "Untitled",
//     colors,
//     size: rows,
//     userId: auth.currentUser.uid
//   };

//   await addDoc(collection(db, "publicGallery"), {
//     drawing: drawingData,
//     name: auth.currentUser.displayName || "Anonymous",
//     reactions: { like: 0, love: 0, wow: 0 },
//     comments: []
//   });

//   alert("Uploaded to gallery!");
// });

// // Reaction
// await updateDoc(docRef, {
//   [`reactions.${reactionType}`]: increment(1)
// });

// // Comment
// await updateDoc(docRef, {
//   comments: arrayUnion({ user: displayName, text: commentText })
// });







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

// import {
//     doc,
//     getDoc,
//     updateDoc,
//     increment,
//     arrayUnion
//   } from "https://www.gstatic.com/firebasejs/10.x.x/firebase-firestore.js"; // adjust based on your Firebase version

//   import { db } from "./firebase.js";

//   window.getGalleryDocRefById = async (id) => {
//     return doc(db, "publicGallery", id);
//   };

//   window.reactToArtwork = async (docRef, type) => {
//     await updateDoc(docRef, {
//       [`reactions.${type}`]: increment(1)
//     });
//   };

//   window.commentOnArtwork = async (docRef, comment) => {
//     await updateDoc(docRef, {
//       comments: arrayUnion(comment)
//     });
//   };

//   window.loadPublicGallery = async () => {
//   const querySnapshot = await getDocs(collection(db, "publicGallery"));
//   return querySnapshot.docs.map(doc => ({
//     ...doc.data(),
//     id: doc.id
//   }));
// };




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

