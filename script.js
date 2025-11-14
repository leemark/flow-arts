// === GLOBAL VARIABLES ===
let img;
let border = -100;
let style = 'normal'; // Can be 'kaleidoscope' or 'normal'
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
let kaleidoscopeRotationOffset = 0;
let animationSpeed = 0.05; // NEW: Configurable animation speed
let currentBlendMode = ADD; // NEW: Configurable blend mode
let isLoading = false;
let isLooping = false;
let canvas;
let controlsTimeout;

// Mouse Interaction parameters
let repulsionRadius = 100;
let repulsionStrength = 0.5;

// Store original values for parameters that get scaled
const ORIGINAL_STROKE_W = 0.8;
const ORIGINAL_LIFE = 100;
const ORIGINAL_BORDER = -100;

// Slider references
let resSlider, resValueSpan;
let dmpSlider, dmpValueSpan;
let alphaSlider, alphaValueSpan;
let limitSlider, limitValueSpan;
let repRadiusSlider, repRadiusValueSpan;
let repStrengthSlider, repStrengthValueSpan;
let sidesSlider, sidesValueSpan;
let animSpeedSlider, animSpeedValueSpan; // NEW

// === UTILITY FUNCTIONS ===

// Show loading indicator
function showLoading() {
    isLoading = true;
    const overlay = document.getElementById('loading-overlay');
    overlay.classList.add('active');
}

// Hide loading indicator
function hideLoading() {
    isLoading = false;
    const overlay = document.getElementById('loading-overlay');
    overlay.classList.remove('active');
}

// Hide welcome overlay
function hideWelcome() {
    const overlay = document.getElementById('welcome-overlay');
    overlay.classList.add('hidden');
}

// Update status bar
function updateStatusBar() {
    // Update frame counter
    document.getElementById('frameCounter').textContent = frameCount;

    // Update particle counter
    document.getElementById('particleCounter').textContent = pts.length;

    // Update animation status
    const statusIndicator = document.getElementById('animStatus');
    const pulseDot = statusIndicator.querySelector('.pulse-dot');
    const statusValue = statusIndicator.querySelector('.status-value');

    if (isLooping) {
        statusValue.textContent = 'Playing';
        pulseDot.classList.add('active');
        pulseDot.classList.remove('paused');
    } else if (img) {
        statusValue.textContent = 'Paused';
        pulseDot.classList.remove('active');
        pulseDot.classList.add('paused');
    } else {
        statusValue.textContent = 'Ready';
        pulseDot.classList.remove('active', 'paused');
    }
}

// Randomize all parameters
function randomizeParameters() {
    res = random(0.003, 0.012);
    dmp = random(0.65, 0.85);
    alpha = random(10, 25);
    sides = floor(random(5, 16));
    repulsionRadius = random(50, 200);
    repulsionStrength = random(0.2, 1.0);
    animationSpeed = random(0.02, 0.15);
    limit = random(1800, 3000);

    // Update all sliders to reflect randomized values
    if (resSlider) {
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
        animSpeedSlider.value = animationSpeed;
        animSpeedValueSpan.textContent = parseFloat(animationSpeed).toFixed(2);
    }
}

// Simple restart - just clear canvas and particles, keep current parameters
function restartAnimation() {
    if (!img) return;

    pts = [];
    frameCount = 0;
    background(0);
    noLoop();
    isLooping = false;

    // Update button text
    const startBtn = document.getElementById('startBtn');
    startBtn.querySelector('span:not(.icon)').textContent = 'Start';

    updateStatusBar();
}

// Handle file upload
function handleImageUpload(file) {
    if (!file) return;

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
    hideWelcome();

    const reader = new FileReader();
    reader.onload = function(event) {
        loadImage(event.target.result,
            // Success callback
            function(loadedImg) {
                img = loadedImg;
                pts = [];
                frameCount = 0;
                setup();
                hideLoading();

                // Start animation automatically
                loop();
                isLooping = true;
                const startBtn = document.getElementById('startBtn');
                startBtn.querySelector('span:not(.icon)').textContent = 'Pause';
                startBtn.querySelector('.icon').textContent = '⏸';
                updateStatusBar();
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

// === DOM CONTENT LOADED - SETUP ALL EVENT LISTENERS ===
document.addEventListener('DOMContentLoaded', function() {
    // === WELCOME OVERLAY ===
    const welcomeImageUpload = document.getElementById('welcomeImageUpload');
    if (welcomeImageUpload) {
        welcomeImageUpload.addEventListener('change', function(e) {
            handleImageUpload(e.target.files[0]);
        });
    }

    const skipWelcome = document.getElementById('skipWelcome');
    if (skipWelcome) {
        skipWelcome.addEventListener('click', function() {
            hideWelcome();
        });
    }

    // === STYLE SELECTOR ===
    const styleSelector = document.getElementById('styleSelector');
    styleSelector.addEventListener('change', function() {
        style = this.value;

        // Show/hide kaleidoscope section
        const kaleidoscopeSection = document.getElementById('kaleidoscope-section');
        if (style === 'kaleidoscope') {
            kaleidoscopeSection.style.display = 'block';
        } else {
            kaleidoscopeSection.style.display = 'none';
        }

        if (img) {
            background(0);
            frameCount = 0;
            pts = [];
            if (isLooping) {
                loop();
            } else {
                noLoop();
            }
        }
    });

    // === BLEND MODE SELECTOR ===
    const blendModeSelector = document.getElementById('blendModeSelector');
    blendModeSelector.addEventListener('change', function() {
        const mode = this.value;
        switch(mode) {
            case 'ADD':
                currentBlendMode = ADD;
                break;
            case 'BLEND':
                currentBlendMode = BLEND;
                break;
            case 'MULTIPLY':
                currentBlendMode = MULTIPLY;
                break;
            case 'SCREEN':
                currentBlendMode = SCREEN;
                break;
            default:
                currentBlendMode = ADD;
        }
    });

    // === SLIDERS SETUP ===
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
    animSpeedSlider = document.getElementById('animSpeedSlider');
    animSpeedValueSpan = document.getElementById('animSpeedValue');

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
    });

    animSpeedSlider.addEventListener('input', function() {
        animationSpeed = parseFloat(this.value);
        animSpeedValueSpan.textContent = parseFloat(animationSpeed).toFixed(2);
    });

    // === FILE UPLOAD (Main Controls) ===
    document.getElementById('imageUpload').addEventListener('change', function(e) {
        handleImageUpload(e.target.files[0]);
    });

    // === BUTTON CONTROLS ===
    document.getElementById('startBtn').addEventListener('click', function() {
        if (!img) {
            alert('Please upload an image first!');
            return;
        }

        const iconSpan = this.querySelector('.icon');
        const textSpan = this.querySelector('span:not(.icon)');

        if (!isLooping) {
            loop();
            isLooping = true;
            iconSpan.textContent = '⏸';
            textSpan.textContent = 'Pause';
        } else {
            noLoop();
            isLooping = false;
            iconSpan.textContent = '▶';
            textSpan.textContent = 'Start';
        }

        updateStatusBar();
    });

    document.getElementById('restartBtn').addEventListener('click', function() {
        if (!img) {
            alert('Please upload an image first!');
            return;
        }
        restartAnimation();
    });

    document.getElementById('randomizeBtn').addEventListener('click', function() {
        if (!img) {
            alert('Please upload an image first!');
            return;
        }
        randomizeParameters();
        restartAnimation();
    });

    document.getElementById('saveBtn').addEventListener('click', function() {
        if (canvas) {
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
            saveCanvas(`flow-art-${timestamp}`, 'jpg');
        }
    });

    // === COLLAPSIBLE SECTIONS ===
    const sectionHeaders = document.querySelectorAll('.section-header');
    sectionHeaders.forEach(header => {
        header.addEventListener('click', function() {
            const sectionName = this.dataset.section;
            const content = document.getElementById(`${sectionName}-content`);

            // Toggle active state
            this.classList.toggle('active');
            content.classList.toggle('active');
        });
    });

    // Open first section by default (Appearance)
    const firstSection = document.querySelector('[data-section="appearance"]');
    const firstContent = document.getElementById('appearance-content');
    if (firstSection && firstContent) {
        firstSection.classList.add('active');
        firstContent.classList.add('active');
    }

    // === HELP BUTTON & SHORTCUTS MODAL ===
    const helpBtn = document.getElementById('helpBtn');
    const shortcutsOverlay = document.getElementById('shortcuts-overlay');
    const closeShortcuts = document.getElementById('closeShortcuts');

    helpBtn.addEventListener('click', function() {
        shortcutsOverlay.classList.add('active');
    });

    closeShortcuts.addEventListener('click', function() {
        shortcutsOverlay.classList.remove('active');
    });

    // Close shortcuts on overlay click
    shortcutsOverlay.addEventListener('click', function(e) {
        if (e.target === shortcutsOverlay) {
            shortcutsOverlay.classList.remove('active');
        }
    });

    // === AUTO-HIDE CONTROLS ===
    const controlsOverlay = document.getElementById('controls-overlay');

    function resetControlsVisibility() {
        controlsOverlay.classList.remove('auto-hide');

        if (controlsTimeout) {
            clearTimeout(controlsTimeout);
        }

        controlsTimeout = setTimeout(() => {
            if (!isLoading) {
                controlsOverlay.classList.add('auto-hide');
            }
        }, 3000);
    }

    // Mouse move
    document.addEventListener('mousemove', resetControlsVisibility);

    // Touch events for mobile
    document.addEventListener('touchstart', resetControlsVisibility);
    document.addEventListener('touchmove', resetControlsVisibility);

    // === KEYBOARD SHORTCUTS ===
    document.addEventListener('keydown', function(e) {
        // Help shortcut works without image
        if (e.key === '?') {
            e.preventDefault();
            shortcutsOverlay.classList.add('active');
            return;
        }

        // Close modal on Escape
        if (e.key === 'Escape') {
            shortcutsOverlay.classList.remove('active');
            return;
        }

        // Other shortcuts require image
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
                const selector = document.getElementById('styleSelector');
                selector.value = selector.value === 'kaleidoscope' ? 'normal' : 'kaleidoscope';
                selector.dispatchEvent(new Event('change'));
                break;
        }
    });

    // Initial setup
    updateStatusBar();

    // Hide kaleidoscope section initially (normal mode is default)
    document.getElementById('kaleidoscope-section').style.display = 'none';
});

// === P5.JS FUNCTIONS ===

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

    updateStatusBar();
}

function draw() {
    // Don't draw if no image is loaded
    if (!img) {
        noLoop();
        return;
    }

    // Use selected blend mode
    blendMode(currentBlendMode);
    strokeWeight(strokeW);

    // Increment rotation offset for animation (using configurable speed)
    kaleidoscopeRotationOffset += animationSpeed;

    // Mouse position
    let mouseVec = createVector(mouseX, mouseY);

    if (style === 'kaleidoscope') {
        angle = 360 / sides; // Recalculate angle in case sides changed
        translate(width / 2, height / 2);
        rotate(angle / 2 + kaleidoscopeRotationOffset);

        for(let i=0;i<4;i++){
            pts.push(makept(true));
        }

        for (let pt of pts) {
            // Apply mouse repulsion
            let particlePos = pt.position;
            let effectiveMouseVec = createVector(mouseX - width / 2, mouseY - height / 2);
            let force = p5.Vector.sub(particlePos, effectiveMouseVec);
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

            // Velocity-based size calculation
            let speed = pt.velocity.mag();
            let maxSpeedForEffect = 5 * pxl;
            let speedFactor = constrain(map(speed, 0, maxSpeedForEffect, 0.8, 1.5), 0.8, 1.5);
            let finalStrokeW = pt.strokeW * speedFactor;

            // Color shifting based on life
            let lifeFraction = constrain(pt.life / pt.initialLife, 0, 1);
            let currentAlpha = alpha * lifeFraction;
            let currentColor = color(red(pt.color), green(pt.color), blue(pt.color), currentAlpha);
            stroke(currentColor);
            strokeWeight(finalStrokeW);

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

        for(let i=0;i<4;i++){
            pts.push(makept(false));
        }

        for (let pt of pts) {
            // Apply mouse repulsion
            let particlePos = pt.position;
            let force = p5.Vector.sub(particlePos, mouseVec);
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

            // Velocity-based size calculation
            let speed = pt.velocity.mag();
            let maxSpeedForEffect = 5 * pxl;
            let speedFactor = constrain(map(speed, 0, maxSpeedForEffect, 0.8, 1.5), 0.8, 1.5);
            let finalStrokeW = pt.strokeW * speedFactor;

            // Color shifting based on life
            let lifeFraction = constrain(pt.life / pt.initialLife, 0, 1);
            let currentAlpha = alpha * lifeFraction;
            let currentColor = color(red(pt.color), green(pt.color), blue(pt.color), currentAlpha);
            stroke(currentColor);
            strokeWeight(finalStrokeW);

            // Normal style with just one point
            point(x, y);
        }
    }

    clean();

    // Update status bar periodically (every 10 frames to reduce overhead)
    if (frameCount % 10 === 0) {
        updateStatusBar();
    }

    if(frameCount > limit) {
        noLoop();
        isLooping = false;
        const startBtn = document.getElementById('startBtn');
        startBtn.querySelector('.icon').textContent = '▶';
        startBtn.querySelector('span:not(.icon)').textContent = 'Start';
        updateStatusBar();
    }
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
            life: 0,
            initialLife: 0,
            strokeW: 0,
            color: color(random(255), random(255), random(255), 20)
        };

        // Safely get color from image with bounds checking
        if (img.width && img.height) {
            let sx = constrain(map(tmp.position.x, 0, width, 0, img.width), 0, img.width - 1);
            let sy = constrain(map(tmp.position.y, 0, height, 0, img.height), 0, img.height - 1);

            let imgColor = img.get(sx, sy);
            if (imgColor) {
                tmp.color = color(imgColor);
                tmp.color.setAlpha(alpha);

                // Calculate size and life based on brightness
                let brightnessVal = brightness(imgColor);

                tmp.strokeW = map(brightnessVal, 0, 255, max(0.1 * pxl, ORIGINAL_STROKE_W * pxl * 0.5), ORIGINAL_STROKE_W * pxl * 1.5);
                tmp.initialLife = map(brightnessVal, 0, 255, ORIGINAL_LIFE * pxl * 0.5, ORIGINAL_LIFE * pxl * 1.5);
                tmp.life = tmp.initialLife;
            } else {
                tmp.strokeW = ORIGINAL_STROKE_W * pxl;
                tmp.initialLife = ORIGINAL_LIFE * pxl;
                tmp.life = tmp.initialLife;
                tmp.color.setAlpha(alpha);
            }
        } else {
            tmp.strokeW = ORIGINAL_STROKE_W * pxl;
            tmp.initialLife = ORIGINAL_LIFE * pxl;
            tmp.life = tmp.initialLife;
            tmp.color = color(200, 200, 200, alpha);
        }

        return tmp;
    } catch (error) {
        console.error("Error creating point:", error);
        return {
            position: new p5.Vector(width/2, height/2),
            velocity: new p5.Vector(),
            life: random(0, life),
            initialLife: life,
            strokeW: ORIGINAL_STROKE_W * pxl,
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
    updateStatusBar();
}
