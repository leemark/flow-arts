let img;
let border = -100;
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

// Initialize sliders with default values
document.addEventListener('DOMContentLoaded', function() {
    updateSliderValues();
    
    // Add event listeners for sliders to update displayed values
    document.getElementById('sidesSlider').addEventListener('input', function() {
        document.getElementById('sidesValue').textContent = this.value;
    });
    
    document.getElementById('dampingSlider').addEventListener('input', function() {
        document.getElementById('dampingValue').textContent = this.value;
    });
    
    document.getElementById('resolutionSlider').addEventListener('input', function() {
        document.getElementById('resolutionValue').textContent = parseFloat(this.value).toFixed(3);
    });
    
    document.getElementById('lifeSlider').addEventListener('input', function() {
        document.getElementById('lifeValue').textContent = this.value;
    });
    
    document.getElementById('limitSlider').addEventListener('input', function() {
        document.getElementById('limitValue').textContent = this.value;
    });
    
    document.getElementById('alphaSlider').addEventListener('input', function() {
        document.getElementById('alphaValue').textContent = this.value;
    });
});

// Update slider values to match current parameters
function updateSliderValues() {
    document.getElementById('sidesSlider').value = sides;
    document.getElementById('sidesValue').textContent = sides;
    
    document.getElementById('dampingSlider').value = dmp;
    document.getElementById('dampingValue').textContent = dmp;
    
    document.getElementById('resolutionSlider').value = res;
    document.getElementById('resolutionValue').textContent = res.toFixed(3);
    
    document.getElementById('lifeSlider').value = life;
    document.getElementById('lifeValue').textContent = life;
    
    document.getElementById('limitSlider').value = limit;
    document.getElementById('limitValue').textContent = limit;
    
    document.getElementById('alphaSlider').value = alpha;
    document.getElementById('alphaValue').textContent = alpha;
}

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

// Reset all animation parameters to initial values
function resetParameters() {
    border = -100;
    res = 0.007;
    dmp = 0.75;
    pts = [];
    // Reset to original values before scaling
    strokeW = ORIGINAL_STROKE_W;
    life = ORIGINAL_LIFE;
    limit = 2000;
    alpha = 15;
    sides = 10;
    isLooping = false;
    frameCount = 0;
    updateSliderValues();
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

// Apply settings from sliders
function applySettings() {
    sides = parseInt(document.getElementById('sidesSlider').value);
    dmp = parseFloat(document.getElementById('dampingSlider').value);
    res = parseFloat(document.getElementById('resolutionSlider').value);
    life = parseInt(document.getElementById('lifeSlider').value);
    limit = parseInt(document.getElementById('limitSlider').value);
    alpha = parseInt(document.getElementById('alphaSlider').value);
    
    if (img) {
        // Store current animation state
        const wasLooping = isLooping;
        
        // Restart with new settings
        setup();
        
        // Restore animation state
        if (wasLooping) {
            loop();
            isLooping = true;
            document.getElementById('startBtn').textContent = 'Pause';
        } else {
            noLoop();
        }
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
        showLoading();
        
        const reader = new FileReader();
        reader.onload = function(event) {
            const imgSrc = event.target.result;
            
            // Update image preview
            updateImagePreview(imgSrc);
            
            // Load the actual image for processing
            loadImage(imgSrc, function(loadedImg) {
                img = loadedImg;
                resetAndSetup();
                hideLoading();
            });
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

// Setup apply settings button
document.getElementById('applySettingsBtn').addEventListener('click', function() {
    if (!img) {
        alert('Please upload an image first!');
        return;
    }
    applySettings();
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
    angleMode(DEGREES);
    angle = 360 / sides;
    background(0);
    pts = [];
    frameCount = 0;
}

function draw() {
  blendMode(SCREEN);
  strokeWeight(strokeW);
  angle = 360 / sides;
  translate(width / 2, height / 2);
  rotate(angle / 2);
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
    clean();
  }
  if(frameCount > limit) noLoop();
}

function makept() {
  let tmp = {
    position: new p5.Vector(
      random(border, width - border),
      random(border, height - border)
    ),
    velocity: new p5.Vector(),
    life: random(0, life),
    color: color(random(255), random(255), random(255), 20)
  };
  let sx = map(tmp.position.x, 0, width, 0, img.width);
  let sy = map(tmp.position.y, 0, height, 0, img.height);
  tmp.color = color(img.get(sx, sy));
  tmp.color.setAlpha(alpha);
  return tmp;
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
    setup();
}