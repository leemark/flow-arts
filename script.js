let img;
let border = -100;
let res = 0.007;
let dmp = 0.75;
let pts = [];
let life = 100;
let strokeW = 1.4;
let limit = 2000;
let alpha = 15;
let sides;
let angle;
let pxl;
let isLooping = false;

// Reset all animation parameters to initial values
function resetParameters() {
    border = -100;
    res = 0.007;
    dmp = 0.75;
    pts = [];
    life = 100;
    strokeW = 1.4;
    limit = 2000;
    alpha = 15;
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

// Setup file input handling
document.getElementById('imageUpload').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(event) {
            loadImage(event.target.result, function(loadedImg) {
                img = loadedImg;
                resetAndSetup();
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

document.getElementById('saveBtn').addEventListener('click', function() {
    if (canvas) {
        saveCanvas('flow-art', 'jpg');
    }
});

function setup() {
    let ss = min(windowWidth * 0.8, windowHeight * 0.8);
    const canvas = createCanvas(ss, ss);
    canvas.parent('canvasContainer');
    
    pxl = ss/400;
    strokeW = strokeW * pxl;
    life = life * pxl;
    sides = random([8,10,12,14,16]);
    angleMode(DEGREES);
    angle = 360 / sides;
    res += random(-0.005, 0.005);
    dmp += random(-0.05, 0.1);
    limit += int(random(-100, 300));
    alpha += random(-5, 15); 
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