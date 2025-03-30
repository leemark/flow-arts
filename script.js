let img;
let border = -100;
let style = 'kaleidoscope'; // Can be 'kaleidoscope' or 'normal'
let res = 0.007;
let dmp = 0.75;
let pts = [];
let life = 100;
let strokeW = 0.8;
let limit = 2000;
let alpha = 15;
let sides = 10;
let angle;
let pxl;
let kaleidoscopeRotationOffset = 0; // For animated rotation
let isLoading = false;
let isLooping = false;
let canvas;
let controlsTimeout;

// Mouse Interaction parameters
let repulsionRadius = 100;
let repulsionStrength = 0.5; // Adjust as needed

// Sliders refs
let resSlider, resValueSpan;
let dmpSlider, dmpValueSpan;
let alphaSlider, alphaValueSpan;
let limitSlider, limitValueSpan;
let repRadiusSlider, repRadiusValueSpan;
let repStrengthSlider, repStrengthValueSpan;
let sidesSlider, sidesValueSpan;

// Store original values for parameters that get scaled
const ORIGINAL_STROKE_W = 0.8;
const ORIGINAL_LIFE = 100;
const ORIGINAL_BORDER = -100;

// Initialize style selector
document.addEventListener('DOMContentLoaded', function() {
    // Setup style selector
    document.getElementById('styleSelector').addEventListener('change', function() {
        style = this.value;
        if (img) {
            // Restart with new style
            // Don't reset params, just re-setup background and drawing mode
            background(0); // Clear background for new style
            frameCount = 0; // Reset frame count for limit
            // Keep existing particles
            if (isLooping) {
                loop();
            } else {
                noLoop(); // Ensure it's stopped if not looping
            }
        }
    });

    // Setup Sliders
    resSlider = document.getElementById('resSlider');
    resValueSpan = document.getElementById('resValue');
    dmpSlider = document.getElementById('dmpSlider');
    dmpValueSpan = document.getElementById('dmpValue');
    alphaSlider = document.getElementById('alphaSlider');
    alphaValueSpan = document.getElementById('alphaValue');
    limitSlider = document.getElementById('limitSlider');
    limitValueSpan = document.getElementById('limitValue');
    repRadiusSlider = document.getElementById('repRadiusSlider');
    repRadiusValueSpan = document.getElementById('repRadiusValue');
    repStrengthSlider = document.getElementById('repStrengthSlider');
    repStrengthValueSpan = document.getElementById('repStrengthValue');
    sidesSlider = document.getElementById('sidesSlider');
    sidesValueSpan = document.getElementById('sidesValue');

    // Initial slider values
    resSlider.value = res;
    resValueSpan.textContent = parseFloat(res).toFixed(4);
    dmpSlider.value = dmp;
    dmpValueSpan.textContent = parseFloat(dmp).toFixed(2);
    alphaSlider.value = alpha;
    alphaValueSpan.textContent = alpha;
    limitSlider.value = limit;
    limitValueSpan.textContent = limit;
    repRadiusSlider.value = repulsionRadius;
    repRadiusValueSpan.textContent = repulsionRadius;
    repStrengthSlider.value = repulsionStrength;
    repStrengthValueSpan.textContent = parseFloat(repulsionStrength).toFixed(1);
    sidesSlider.value = sides;
    sidesValueSpan.textContent = sides;

    // Slider listeners
    resSlider.addEventListener('input', function() {
        res = parseFloat(this.value);
        resValueSpan.textContent = parseFloat(res).toFixed(4);
    });

    dmpSlider.addEventListener('input', function() {
        dmp = parseFloat(this.value);
        dmpValueSpan.textContent = parseFloat(dmp).toFixed(2);
    });

    alphaSlider.addEventListener('input', function() {
        alpha = parseInt(this.value);
        alphaValueSpan.textContent = alpha;
    });

    limitSlider.addEventListener('input', function() {
        limit = parseInt(this.value);
        limitValueSpan.textContent = limit;
    });

    repRadiusSlider.addEventListener('input', function() {
        repulsionRadius = parseInt(this.value);
        repRadiusValueSpan.textContent = repulsionRadius;
    });

    repStrengthSlider.addEventListener('input', function() {
        repulsionStrength = parseFloat(this.value);
        repStrengthValueSpan.textContent = parseFloat(repulsionStrength).toFixed(1);
    });

    sidesSlider.addEventListener('input', function() {
        sides = parseInt(this.value);
        sidesValueSpan.textContent = sides;
        // Angle needs recalculation, will happen in draw()
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
    // Reset mouse interaction params too
    repulsionRadius = random(50, 200);
    repulsionStrength = random(0.2, 1.0);

    // Update sliders to reflect randomized values
    if (resSlider) { // Check if sliders exist
        resSlider.value = res;
        resValueSpan.textContent = parseFloat(res).toFixed(4);
        dmpSlider.value = dmp;
        dmpValueSpan.textContent = parseFloat(dmp).toFixed(2);
        alphaSlider.value = alpha;
        alphaValueSpan.textContent = alpha;
        limitSlider.value = limit;
        limitValueSpan.textContent = limit;
        repRadiusSlider.value = repulsionRadius;
        repRadiusValueSpan.textContent = repulsionRadius;
        repStrengthSlider.value = repulsionStrength;
        repStrengthValueSpan.textContent = parseFloat(repulsionStrength).toFixed(1);
        sidesSlider.value = sides;
        sidesValueSpan.textContent = sides;
    }
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
            // Load the actual image for processing
            loadImage(event.target.result, 
                // Success callback
                function(loadedImg) {
                    img = loadedImg;
                    resetAndSetup();
                    hideLoading();
                    // Start animation automatically
                    loop();
                    isLooping = true;
                    document.getElementById('startBtn').textContent = 'Pause';
                },
                // Error callback
                function() {
                    alert('Failed to load image. Please try another image.');
                    hideLoading();
                    img = null;
                    noLoop();
                }
            );
        };
        
        reader.onerror = function() {
            alert('Error reading file. Please try again.');
            hideLoading();
            img = null;
            noLoop();
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
    // Create fullscreen canvas
    canvas = createCanvas(windowWidth, windowHeight);
    canvas.parent('canvasContainer');
    
    pxl = min(windowWidth, windowHeight)/400;
    // Scale from original values
    strokeW = ORIGINAL_STROKE_W * pxl;
    life = ORIGINAL_LIFE * pxl;
    border = ORIGINAL_BORDER * pxl;
    
    angleMode(DEGREES);
    angle = 360 / sides;
    background(0);
    pts = [];
    frameCount = 0;

    // Don't start drawing until we have an image
    if (!img) {
        noLoop();
        return;
    }
}

function draw() {
  // Don't draw if no image is loaded
  if (!img) {
    noLoop();
    return;
  }

  // Use ADD blend mode for brighter effects
  blendMode(ADD);
  strokeWeight(strokeW);
  
  // Increment rotation offset for animation
  kaleidoscopeRotationOffset += 0.05; // Adjust speed as desired
  
  // Mouse position (relative for kaleidoscope if needed, but global better for repulsion)
  let mouseVec = createVector(mouseX, mouseY);

  if (style === 'kaleidoscope') {
    angle = 360 / sides; // Recalculate angle in case sides changed
    translate(width / 2, height / 2);
    rotate(angle / 2 + kaleidoscopeRotationOffset); // Add animated offset
    
    for(i=0;i<4;i++){
      pts.push(makept(true));
    }
    
    for (let pt of pts) {
      // Apply mouse repulsion before calculating noise field
      let particlePos = pt.position;
      // If kaleidoscope, particle position is relative to center
      // Transform mouse to particle's coordinate system (approximate - ignores rotation/scale for simplicity)
      let effectiveMouseVec = createVector(mouseX - width / 2, mouseY - height / 2);
      let force = p5.Vector.sub(particlePos, effectiveMouseVec);
      let dist = force.mag();

      if (dist < repulsionRadius * pxl) { // Scale radius too
          let strength = map(dist, 0, repulsionRadius * pxl, repulsionStrength * pxl, 0); // Scale strength
          force.setMag(strength); // Make it point away from mouse
          pt.velocity.add(force);
      }

      let x = pt.position.x;
      let y = pt.position.y;
      let v = new p5.Vector();
      v.x = map(noise(x * res, y * res, 1), 0, 1, -1, 1);
      v.y = map(noise(x * res, y * res, 10), 0, 1, -1, 1);
      pt.velocity.add(v);
      pt.velocity.mult(dmp);
      move(pt);

      // --- Velocity-based size calculation ---
      let speed = pt.velocity.mag();
      // Map speed to a multiplier. Adjust ranges as needed.
      // Faster particles get slightly thicker (e.g., 0.8x to 1.5x base size)
      let maxSpeedForEffect = 5 * pxl; // Max speed expected to influence size
      let speedFactor = constrain(map(speed, 0, maxSpeedForEffect, 0.8, 1.5), 0.8, 1.5);
      let finalStrokeW = pt.strokeW * speedFactor;
      // --- End velocity-based size ---

      // Color shifting based on life
      let lifeFraction = constrain(pt.life / pt.initialLife, 0, 1);
      let currentAlpha = alpha * lifeFraction;
      let currentColor = color(red(pt.color), green(pt.color), blue(pt.color), currentAlpha);
      stroke(currentColor);
      strokeWeight(finalStrokeW); // Use velocity-adjusted stroke weight
      
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
    }
  } else {
    // Normal style - no translation to center
    
    for(i=0;i<4;i++){
      pts.push(makept(false));
    }
    
    for (let pt of pts) {
      // Apply mouse repulsion
      let particlePos = pt.position;
      let force = p5.Vector.sub(particlePos, mouseVec); // Use direct mouse coords
      let dist = force.mag();

      if (dist < repulsionRadius * pxl) {
          let strength = map(dist, 0, repulsionRadius * pxl, repulsionStrength * pxl, 0);
          force.setMag(strength);
          pt.velocity.add(force);
      }

      let x = pt.position.x;
      let y = pt.position.y;
      let v = new p5.Vector();
      v.x = map(noise(x * res, y * res, 1), 0, 1, -1, 1);
      v.y = map(noise(x * res, y * res, 10), 0, 1, -1, 1);
      pt.velocity.add(v);
      pt.velocity.mult(dmp);
      move(pt);

      // --- Velocity-based size calculation ---
      let speed = pt.velocity.mag();
      let maxSpeedForEffect = 5 * pxl; 
      let speedFactor = constrain(map(speed, 0, maxSpeedForEffect, 0.8, 1.5), 0.8, 1.5);
      let finalStrokeW = pt.strokeW * speedFactor;
      // --- End velocity-based size ---

      // Color shifting based on life
      let lifeFraction = constrain(pt.life / pt.initialLife, 0, 1);
      let currentAlpha = alpha * lifeFraction;
      let currentColor = color(red(pt.color), green(pt.color), blue(pt.color), currentAlpha);
      stroke(currentColor);
      strokeWeight(finalStrokeW); // Use velocity-adjusted stroke weight
      
      // Normal style with just one point
      point(x, y);
    }
  }
  
  clean();
  if(frameCount > limit) noLoop();
}

function makept(isKaleidoscope) {
  try {
    // Don't create points if no image is loaded
    if (!img) {
      console.warn('Attempted to create point without image loaded');
      return null;
    }

    let tmp = {
      position: new p5.Vector(
        random(border, width - border),
        random(border, height - border)
      ),
      velocity: new p5.Vector(),
      life: 0, // Will be calculated
      initialLife: 0, // Store initial life for fading
      strokeW: 0, // Will be calculated
      color: color(random(255), random(255), random(255), 20) // Default placeholder
    };
    
    // Safely get color from image with bounds checking
    if (img.width && img.height) {
      let sx = constrain(map(tmp.position.x, 0, width, 0, img.width), 0, img.width - 1);
      let sy = constrain(map(tmp.position.y, 0, height, 0, img.height), 0, img.height - 1);
      
      let imgColor = img.get(sx, sy);
      if (imgColor) {
        tmp.color = color(imgColor); // Base color from image
        tmp.color.setAlpha(alpha); // Set initial alpha

        // Calculate size and life based on brightness
        let brightnessVal = brightness(imgColor); // 0-255 usually

        // Map brightness to stroke weight (e.g., brighter = thicker)
        // Ensure minimum stroke weight is reasonable, like 0.1 * pxl
        tmp.strokeW = map(brightnessVal, 0, 255, max(0.1 * pxl, ORIGINAL_STROKE_W * pxl * 0.5), ORIGINAL_STROKE_W * pxl * 1.5);

        // Map brightness to initial life (e.g., brighter = longer life)
        tmp.initialLife = map(brightnessVal, 0, 255, ORIGINAL_LIFE * pxl * 0.5, ORIGINAL_LIFE * pxl * 1.5);
        tmp.life = tmp.initialLife; // Set current life

      } else {
          // Fallback if color couldn't be read (shouldn't happen with constrain)
          tmp.strokeW = ORIGINAL_STROKE_W * pxl;
          tmp.initialLife = ORIGINAL_LIFE * pxl;
          tmp.life = tmp.initialLife;
          tmp.color.setAlpha(alpha); // Ensure fallback has alpha
      }
    } else {
        // Fallback if no image dimensions (e.g., loading error)
        tmp.strokeW = ORIGINAL_STROKE_W * pxl;
        tmp.initialLife = ORIGINAL_LIFE * pxl;
        tmp.life = tmp.initialLife;
        tmp.color = color(200, 200, 200, alpha); // Default color
    }
    
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
    // Use pts[i].life directly as it's decremented in move()
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

// Add after DOM content loaded event listener
document.addEventListener('mousemove', function() {
    const controls = document.getElementById('controls-overlay');
    controls.style.opacity = '1';
    
    // Clear existing timeout
    if (controlsTimeout) {
        clearTimeout(controlsTimeout);
    }
    
    // Set new timeout to hide controls
    controlsTimeout = setTimeout(() => {
        if (!isLoading) {  // Don't hide if loading
            controls.style.opacity = '0.1';
        }
    }, 3000);
});

// Add after other event listeners
document.addEventListener('keydown', function(e) {
    // Only handle shortcuts if we have an image loaded
    if (!img) return;
    
    switch(e.key.toLowerCase()) {
        case ' ':  // Space bar
            e.preventDefault();
            document.getElementById('startBtn').click();
            break;
        case 'r':  // Restart
            document.getElementById('restartBtn').click();
            break;
        case 's':  // Save (with modifier key)
            if (e.ctrlKey || e.metaKey) {
                e.preventDefault();
                document.getElementById('saveBtn').click();
            }
            break;
        case 'k':  // Toggle kaleidoscope mode
            document.getElementById('styleSelector').value = 
                document.getElementById('styleSelector').value === 'kaleidoscope' ? 'normal' : 'kaleidoscope';
            document.getElementById('styleSelector').dispatchEvent(new Event('change'));
            break;
    }
});