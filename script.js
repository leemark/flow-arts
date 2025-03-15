let img;
let border = -100;
let style = 'kaleidoscope'; // Can be 'kaleidoscope' or 'normal'
let res = 0.007;
let dmp = 0.75;
let pts = [];
let life = 100;
let strokeW = 1.4;
let limit = 2000;
let alpha = 15;
let sides = 10;
let angle;
let pxl;
let isLoading = false;
let isLooping = false;
let canvas;

// Store original values for parameters that get scaled
const ORIGINAL_STROKE_W = 1.4;
const ORIGINAL_LIFE = 100;
const ORIGINAL_BORDER = -100;

// Initialize style selector
document.addEventListener('DOMContentLoaded', function() {
    // Setup style selector
    document.getElementById('styleSelector').addEventListener('change', function() {
        style = this.value;
        if (img) {
            // Restart with new style
            setup();
            if (isLooping) {
                loop();
            } else {
                noLoop();
            }
        }
    });
});

// Show loading indicator
function showLoading() {
    isLoading = true;
    document.getElementById('loading-overlay').style.display = 'flex';
}

// Hide loading indicator
function hideLoading() {
    isLoading = false;
    document.getElementById('loading-overlay').style.display = 'none';
}

// Reset all animation parameters using randomized values
function resetParameters() {
    border = ORIGINAL_BORDER;
    res = random(0.003, 0.012);
    dmp = random(0.65, 0.85);
    pts = [];
    // Reset to original values before scaling
    strokeW = ORIGINAL_STROKE_W;
    life = ORIGINAL_LIFE;
    limit = random(1800, 3000);
    alpha = random(10, 25);
    sides = floor(random(5, 16));
    isLooping = false;
    frameCount = 0;
}

// Complete reset and setup with current image
function resetAndSetup() {
    resetParameters();
    if (img) {
        setup();
        noLoop();
        document.getElementById('startBtn').textContent = 'Start Animation';
    }
}

// Update image preview
function updateImagePreview(imgSrc) {
    const previewContainer = document.getElementById('imagePreview');
    previewContainer.innerHTML = '';
    
    const imgPreview = document.createElement('img');
    imgPreview.src = imgSrc;
    previewContainer.appendChild(imgPreview);
}

// Setup file input handling
document.getElementById('imageUpload').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file) {
        // Validate file type
        if (!file.type.match('image.*')) {
            alert('Please select a valid image file.');
            return;
        }
        
        // Check file size (limit to 10MB)
        if (file.size > 10 * 1024 * 1024) {
            alert('Image file is too large. Please select an image smaller than 10MB.');
            return;
        }
        
        showLoading();
        
        const reader = new FileReader();
        reader.onload = function(event) {
            const imgSrc = event.target.result;
            
            // Update image preview
            updateImagePreview(imgSrc);
            
            // Load the actual image for processing
            loadImage(imgSrc, 
                // Success callback
                function(loadedImg) {
                    img = loadedImg;
                    resetAndSetup();
                    hideLoading();
                },
                // Error callback
                function() {
                    alert('Failed to load image. Please try another image.');
                    hideLoading();
                }
            );
        };
        
        reader.onerror = function() {
            alert('Error reading file. Please try again.');
            hideLoading();
        };
        
        reader.readAsDataURL(file);
    }
});

// Setup button controls
document.getElementById('startBtn').addEventListener('click', function() {
    if (!img) {
        alert('Please upload an image first!');
        return;
    }
    if (!isLooping) {
        loop();
        isLooping = true;
        this.textContent = 'Pause';
    } else {
        noLoop();
        isLooping = false;
        this.textContent = 'Start Animation';
    }
});

// Setup restart button
document.getElementById('restartBtn').addEventListener('click', function() {
    if (!img) {
        alert('Please upload an image first!');
        return;
    }
    resetAndSetup();
});

document.getElementById('saveBtn').addEventListener('click', function() {
    if (canvas) {
        saveCanvas('flow-art', 'jpg');
    }
});

function setup() {
    let ss = min(windowWidth * 0.6, windowHeight * 0.8);
    canvas = createCanvas(ss, ss);
    canvas.parent('canvasContainer');
    
    pxl = ss/400;
    // Scale from original values
    strokeW = ORIGINAL_STROKE_W * pxl;
    life = ORIGINAL_LIFE * pxl;
    border = ORIGINAL_BORDER * pxl;
    
    angleMode(DEGREES);
    angle = 360 / sides;
    background(0);
    pts = [];
    frameCount = 0;
}

function draw() {
  blendMode(SCREEN);
  strokeWeight(strokeW);
  
  if (style === 'kaleidoscope') {
    angle = 360 / sides;
    translate(width / 2, height / 2);
    rotate(angle / 2);
  } else {
    // Normal style just centers the drawing
    translate(width / 2, height / 2);
  }
  
  for(i=0;i<4;i++){
    pts.push(makept());
  }
  
  for (let pt of pts) {
    let x = pt.position.x;
    let y = pt.position.y;
    let v = new p5.Vector();
    v.x = map(noise(x * res, y * res, 1), 0, 1, -1, 1);
    v.y = map(noise(x * res, y * res, 10), 0, 1, -1, 1);
    pt.velocity.add(v);
    pt.velocity.mult(dmp);
    move(pt);
    stroke(pt.color);
    
    if (style === 'kaleidoscope') {
      // Kaleidoscope style with multiple rotated copies
      for (let i = 0; i < sides; i++) {
        push();
          rotate(angle * i);
          if (i % 2 == 0) {
            scale(-1, 1);
          }
          scale(.5, .5);
          point(x, y);
        pop();
      }
    } else {
      // Normal style with just one point
      point(x, y);
    }
    
    clean();
  }
  if(frameCount > limit) noLoop();
}

function makept() {
  try {
    let tmp = {
      position: new p5.Vector(
        random(border, width - border),
        random(border, height - border)
      ),
      velocity: new p5.Vector(),
      life: random(0, life),
      color: color(random(255), random(255), random(255), 20)
    };
    
    // Safely get color from image with bounds checking
    let sx = constrain(map(tmp.position.x, 0, width, 0, img.width), 0, img.width - 1);
    let sy = constrain(map(tmp.position.y, 0, height, 0, img.height), 0, img.height - 1);
    
    tmp.color = color(img.get(sx, sy));
    tmp.color.setAlpha(alpha);
    return tmp;
  } catch (error) {
    console.error("Error creating point:", error);
    // Return a fallback point with a default color if there's an error
    return {
      position: new p5.Vector(width/2, height/2),
      velocity: new p5.Vector(),
      life: random(0, life),
      color: color(200, 200, 200, alpha)
    };
  }
}

function move(pt) {
  pt.position.add(pt.velocity);
  pt.life--;
}

function clean() {
  for (let i = pts.length - 1; i >= 0; i--) {
    if (pts[i].life <= 0) {
      pts.splice(i, 1);
    }
  }
}

function windowResized() {
    const wasLooping = isLooping;
    setup();
    if (wasLooping) {
        loop();
    } else {
        noLoop();
    }
}