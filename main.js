const canvas = document.getElementById('drawingCanvas');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight - document.querySelector('.toolbar').offsetHeight;

let drawing = false;
let pencilEnabled = false;

const pencil = {
    color: document.getElementById('pencilColor').value,
    size: document.getElementById('pencilSize').value
};

const undoButton = document.getElementById('undo');
const redoButton = document.getElementById('redo');

let paths = []; // To store the drawing paths
let undonePaths = []; // To store undone paths for redo

// Event listeners
canvas.addEventListener('mousedown', startDrawing);
canvas.addEventListener('mousemove', draw);
canvas.addEventListener('mouseup', stopDrawing);
canvas.addEventListener('mouseout', stopDrawing);
canvas.addEventListener("touchstart", (e) => startDrawing(e, true), false);
canvas.addEventListener("touchmove", (e) => draw(e, true), false);
canvas.addEventListener("touchend", stopDrawing, false);

document.getElementById('toggleDraw').addEventListener('click', toggleDrawing);
document.getElementById('pencilColor').addEventListener('change', (e) => pencil.color = e.target.value);
document.getElementById('pencilSize').addEventListener('input', (e) => pencil.size = e.target.value);
const resetButton = document.getElementById('reset');
const saveButton = document.getElementById('save');
const pencilSizeValueDisplay = document.getElementById('pencilSizeValue');
undoButton.addEventListener('click', undoLastPath);
redoButton.addEventListener('click', redoPath);

function startDrawing(e, isTouch = false) {
    if (!pencilEnabled) return;
    e.preventDefault(); // Prevents scrolling for touch events
    drawing = true;

    let clientX = isTouch ? e.touches[0].clientX : e.clientX;
    // Adjust clientY to account for the toolbar offset
    let clientY = (isTouch ? e.touches[0].clientY : e.clientY) - document.querySelector('.toolbar').offsetHeight; 

    paths.push({color: pencil.color, size: pencil.size, data: [{x: clientX, y: clientY}]});
}

function draw(e, isTouch = false) {
    if (!drawing || !pencilEnabled) return;

    let clientX = isTouch ? e.touches[0].clientX : e.clientX;
    // Adjust clientY to account for the toolbar offset here as well
    let clientY = (isTouch ? e.touches[0].clientY : e.clientY) - document.querySelector('.toolbar').offsetHeight; 

    let path = paths[paths.length - 1];
    path.data.push({x: clientX, y: clientY});

    redrawCanvas();
}

function redrawCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear the canvas

    paths.forEach(path => {
        ctx.beginPath();
        ctx.lineWidth = path.size;
        ctx.strokeStyle = path.color;
        path.data.forEach((point, index) => {
            if (index === 0) {
                ctx.moveTo(point.x, point.y);
            } else {
                ctx.lineTo(point.x, point.y);
                ctx.stroke();
            }
        });
        ctx.beginPath(); // Reset for next path
    });
}

function stopDrawing() {
    if (!drawing) return;
    drawing = false;
    undonePaths = []; // Clear redo stack when new paths are added
    updateButtons();
}

function updateButtons() {
    undoButton.disabled = paths.length === 0;
    redoButton.disabled = undonePaths.length === 0;
}

function undoLastPath() {
    if (paths.length === 0) return;
    undonePaths.push(paths.pop());
    redrawCanvas();
    updateButtons();
}

function redoPath() {
    if (undonePaths.length === 0) return;
    paths.push(undonePaths.pop());
    redrawCanvas();
    updateButtons();
}

function toggleDrawing() {
    pencilEnabled = !pencilEnabled;
    document.getElementById('toggleDraw').textContent = pencilEnabled ? 'Disable Drawing' : 'Enable Drawing';
}

function resetCanvas() {
    paths = []; // Clear the paths array
    undonePaths = []; // Clear the undone paths
    ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear the canvas visually
    updateButtons(); // Update buttons' disabled status
}

function saveCanvas() {
  // Temporary canvas to avoid altering the original canvas
  let tmpCanvas = document.createElement('canvas');
  let tmpCtx = tmpCanvas.getContext('2d');
  tmpCanvas.width = canvas.width;
  tmpCanvas.height = canvas.height;

  // Draw a black background
  tmpCtx.fillStyle = '#000';
  tmpCtx.fillRect(0, 0, tmpCanvas.width, tmpCanvas.height);

  // Redraw existing paths on the temporary canvas
  paths.forEach(path => {
    tmpCtx.beginPath();
    tmpCtx.lineWidth = path.size;
    tmpCtx.strokeStyle = path.color;
    path.data.forEach((point, index) => {
      if (index === 0) {
        tmpCtx.moveTo(point.x, point.y);
      } else {
        tmpCtx.lineTo(point.x, point.y);
        tmpCtx.stroke();
      }
    });
    tmpCtx.beginPath(); // Necessary to avoid stroke color mix
  });

  // Create an image of the temporary canvas content
  const image = tmpCanvas.toDataURL('image/png');

  // Create temporary link for downloading the image
  const tempLink = document.createElement('a');
  tempLink.href = image;
  tempLink.download = 'blackboard-drawing.png'; // Name the file

  // Temporarily add link to body and trigger it for download
  document.body.appendChild(tempLink);
  tempLink.click();
  document.body.removeChild(tempLink);
}
// Ensure the initial pencil size display matches the default value
pencilSizeValueDisplay.textContent = `Size: ${pencil.size}`;

resetButton.addEventListener('click', resetCanvas);
saveButton.addEventListener('click', saveCanvas);
document.getElementById('pencilSize').addEventListener('input', (e) => {
    pencil.size = e.target.value;
    pencilSizeValueDisplay.textContent = `Size: ${e.target.value}`; // Update pencil size display
});

// Resize canvas and redraw paths
window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight - document.querySelector('.toolbar').offsetHeight;
    redrawCanvas(); // Redraw paths after resizing
    updateButtons();
});

updateButtons(); // Initial state update
