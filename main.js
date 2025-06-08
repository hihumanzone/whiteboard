const canvas = document.getElementById('drawingCanvas');
const ctx = canvas.getContext('2d');
const toolbarDiv = document.querySelector('.toolbar'); // Get toolbar reference
const toggleToolbarButton = document.getElementById('toggleToolbar'); // Get button reference

// Initial toolbar state setup - Toolbar starts collapsed
toolbarDiv.classList.add('toolbar-collapsed');
toggleToolbarButton.textContent = "Show Toolbar";

canvas.width = window.innerWidth;
// Calculate initial canvas height based on collapsed toolbar
canvas.height = window.innerHeight; // Toolbar is collapsed, so full height initially

let drawing = false;
let pencilEnabled = false;
let initialClickCoords = null; // Added to store initial click coordinates

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
const fullscreenToggleButton = document.getElementById('fullscreenToggle'); // Added fullscreen button ref
undoButton.addEventListener('click', undoLastPath);
redoButton.addEventListener('click', redoPath);

function startDrawing(e, isTouch = false) {
    if (!pencilEnabled) return;
    e.preventDefault(); // Prevents scrolling for touch events
    drawing = true;

    let clientX = isTouch ? e.touches[0].clientX : e.clientX;
    // Adjust clientY to account for the toolbar offset
    let clientY = (isTouch ? e.touches[0].clientY : e.clientY) - toolbarDiv.offsetHeight;

    initialClickCoords = { x: clientX, y: clientY }; // Store initial click coordinates

    paths.push({color: pencil.color, size: pencil.size, data: [{x: clientX, y: clientY}]});
    redrawCanvas(); // Draw the dot immediately
}

function draw(e, isTouch = false) {
    if (!drawing || !pencilEnabled) return;

    let clientX = isTouch ? e.touches[0].clientX : e.clientX;
    // Adjust clientY to account for the toolbar offset here as well
    let clientY = (isTouch ? e.touches[0].clientY : e.clientY) - toolbarDiv.offsetHeight;

    // Calculate distance from initial click
    const dx = clientX - initialClickCoords.x;
    const dy = clientY - initialClickCoords.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Only draw if moved more than 2 pixels
    if (distance <= 2 && paths[paths.length -1].data.length === 1) { // also check if it's still the first point after the dot
        return;
    }

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
        ctx.fillStyle = path.color; // For filling dots

        if (path.data.length === 1) {
            // Draw a dot
            const point = path.data[0];
            ctx.beginPath(); // Start a new path for the circle
            ctx.arc(point.x, point.y, path.size / 2, 0, 2 * Math.PI);
            ctx.fill();
        } else {
            // Draw a line
            path.data.forEach((point, index) => {
                if (index === 0) {
                    ctx.moveTo(point.x, point.y);
                } else {
                    ctx.lineTo(point.x, point.y);
                }
            });
            ctx.stroke(); // Stroke the path for lines
        }
        // ctx.beginPath(); // Reset for next path - This was causing issues with dot drawing. Moved into specific conditions.
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
    // Display a confirmation dialog
    if (window.confirm("Are you sure you want to reset the canvas? This action cannot be undone.")) {
        paths = []; // Clear the paths array
        undonePaths = []; // Clear the undone paths
        ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear the canvas visually
        updateButtons(); // Update buttons' disabled status
    }
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
    if (toolbarDiv.classList.contains('toolbar-collapsed')) {
        canvas.height = window.innerHeight;
    } else {
        canvas.height = window.innerHeight - toolbarDiv.offsetHeight;
    }
    redrawCanvas(); // Redraw paths after resizing
    updateButtons();
});

// Event listener for the toggle toolbar button
toggleToolbarButton.addEventListener('click', () => {
    toolbarDiv.classList.toggle('toolbar-collapsed');
    if (toolbarDiv.classList.contains('toolbar-collapsed')) {
        toggleToolbarButton.textContent = "Show Toolbar";
        canvas.height = window.innerHeight;
    } else {
        toggleToolbarButton.textContent = "Hide Toolbar";
        // Ensure toolbar has rendered to get correct offsetHeight
        requestAnimationFrame(() => { // Wait for next frame for offsetHeight to be correct
            canvas.height = window.innerHeight - toolbarDiv.offsetHeight;
            redrawCanvas(); // Redraw after height adjustment
        });
    }
    // For immediate collapse, redraw might need to be conditional or also in rAF
    if (toolbarDiv.classList.contains('toolbar-collapsed')) {
         redrawCanvas(); // Redraw immediately if collapsing
    }
});


updateButtons(); // Initial state update
// Initial redraw after setup
redrawCanvas();

// Fullscreen API handling
if (fullscreenToggleButton) {
    fullscreenToggleButton.addEventListener('click', () => {
        if (!document.fullscreenElement &&
            !document.mozFullScreenElement && // Firefox
            !document.webkitFullscreenElement && // Chrome, Safari & Opera
            !document.msFullscreenElement) { // IE/Edge
            if (document.documentElement.requestFullscreen) {
                document.documentElement.requestFullscreen().catch(err => {
                    console.error(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
                });
            } else if (document.documentElement.mozRequestFullScreen) { // Firefox
                document.documentElement.mozRequestFullScreen();
            } else if (document.documentElement.webkitRequestFullscreen) { // Chrome, Safari & Opera
                document.documentElement.webkitRequestFullscreen();
            } else if (document.documentElement.msRequestFullscreen) { // IE/Edge
                document.documentElement.msRequestFullscreen();
            }
            // Button text will be updated by fullscreenchange event
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen().catch(err => {
                    console.error(`Error attempting to disable full-screen mode: ${err.message} (${err.name})`);
                });
            } else if (document.mozCancelFullScreen) { // Firefox
                document.mozCancelFullScreen();
            } else if (document.webkitExitFullscreen) { // Chrome, Safari & Opera
                document.webkitExitFullscreen();
            } else if (document.msExitFullscreen) { // IE/Edge
                document.msExitFullscreen();
            }
            // Button text will be updated by fullscreenchange event
        }
    });

    document.addEventListener('fullscreenchange', updateFullscreenButtonText);
    document.addEventListener('webkitfullscreenchange', updateFullscreenButtonText); // Safari, Chrome
    document.addEventListener('mozfullscreenchange', updateFullscreenButtonText); // Firefox
    document.addEventListener('MSFullscreenChange', updateFullscreenButtonText); // IE/Edge

    function updateFullscreenButtonText() {
        if (document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement) {
            fullscreenToggleButton.textContent = 'Exit Fullscreen';
        } else {
            fullscreenToggleButton.textContent = 'Enter Fullscreen';
        }
    }
    // Initial button text update in case page loads in fullscreen (unlikely but good practice)
    updateFullscreenButtonText();
}
