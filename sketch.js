////////////////// Composition global variables/////////////////////////////
let instrument1, instrument2;
let voices = [];

let currentPreset = 1;
let presets = [
  { name: "Soft Pad",      osc: "sine",     attack: 1.2,   decay: 0.5,  sustain: 0.8, release: 2.0  },
  { name: "Plucked",       osc: "triangle", attack: 0.001, decay: 0.4,  sustain: 0,   release: 0.2  },
  { name: "Brass",         osc: "sawtooth", attack: 0.15,  decay: 0.1,  sustain: 0.9, release: 0.3  },
  { name: "Organ",         osc: "square",   attack: 0.01,  decay: 0.01, sustain: 1.0, release: 0.01 },
  { name: "Marimba/Bell",  osc: "sine",     attack: 0.001, decay: 2.5,  sustain: 0,   release: 0.5  }
];
let filt1;
let effect1, effect2;


let nextN = 1;
let lastN = 1;
let loopCount = 0;

let chordName = 'C';
let pitch1 = 'C4';
let pitch2 = 'C4';
let pitch3 = 'C4';
let pitch4 = 'C4';

let toneCenter = 'C';

let chords = {

  //Standards
  "C": ["C4", "E4", "G4", "E4"],
  "Dm": ["A3", "D4", "F4", "D4"],
  "Em": ["B3", "E4", "G4", "E4"],
  "F": ["C4", "F4", "A4", "F4"],
  "G": ["D4", "G4", "B4", "G4"],
  "Am": ["A4", "C4", "E4", "C4"],
  "Bd": ["B4", "D4", "F4", "D4"],

  // Neutrals
  "Ds": ["A3", "D4", "E4", "D4"],
  "Es": ["E4", "F4", "A4", "B4"],
  "Fs": ["F4", "G4", "B4", "G4"],
  "Gs": ["G4", "A4", "F4", "A4"]
}

let h = 0.51;

//Envelope variables
let envA = 50;
let envD = 200;
let envS = 0.5;
let envR = 400;

// mute
let mute = true;
let firstRun = true;


////////////////// Global global variables/////////////////////////////

let e = 50;
let v = 50;
let energy, valence;

///////////////////////////////////////Aesthetics global
let dot = 0;
let numCaptures = 1;


////////////////// Pose global variables/////////////////////////////
let video;
let poseNet;
let pose;
let skeleton;

let brain; //this is the neural network model

let eSlider, vSlider;

let allIn = false; //is the user entirely in the frame? Checks nose pose and ankle pose.

let ready = false; //this is for confirming model is loaded
let ready1 = false;
let ready2 = false;
let ready3 = false;



function setup() {

  createCanvas(640 * 1.6, 480 * 1.6);

  video = createCapture(VIDEO);
  video.hide();
  poseNet = ml5.poseNet(video, modelLoaded);
  poseNet.on('pose', gotPoses);

  eSlider = createSlider(0, 100, 50);
  vSlider = createSlider(0, 100, 50);

  let options = {
    inputs: 34,
    outputs: 2,
    task: 'regression',
    debug: false
  }

  brain = ml5.neuralNetwork(options);

  const modelInfo = {
    model: 'model/model.json',
    metadata: 'model/model_meta.json',
    weights: 'model/model.weights.bin',
  };

  brain.load(modelInfo, brainLoaded);
  
  //setInterval(takePhoto, 5000);

}

function takePhoto() {
  
  saveCanvas('CreateCalm_' + numCaptures);
  console.log('photo ' + numCaptures + ' taken')
  numCaptures++;
}

function modelLoaded() {

  console.log('poseNet ready');
  ready1 = true;

}


function brainLoaded() {

  console.log('pose predicting ready!');
  predictEmotion();
  ready2 = true;
}

function predictEmotion() {

  if (pose) {
    let inputs = [];
    for (let i = 0; i < pose.keypoints.length; i++) {
      let x = pose.keypoints[i].position.x;
      let y = pose.keypoints[i].position.y;
      inputs.push(x);
      inputs.push(y);
      ready3 = true;
    }
    brain.predict(inputs, gotResult);
  } else {

    setTimeout(predictEmotion, 500);

  }
}


function gotResult(error, results) {

  let e = results[0].value;
  let v = results[1].value;
  eSlider.value(e);
  vSlider.value(v);
  setTimeout(predictEmotion, 100);
}


function gotPoses(poses) {

  if (poses.length > 0) {
    pose = poses[0].pose;
    skeleton = poses[0].skeleton;
  }
  if (pose && pose.keypoints[16].score > 0.6 && pose.keypoints[0].score > 0.6) {
    allIn = true;
  } else {
    allIn = false;
  }
}





function txt() {

  
  strokeWeight(1);
  noStroke();
  fill(220);
  text("Energy =   " + e, 0.5 * width - 60, 755);
  text("Happiness =  " + v, 0.5 * width + 62, 755);

  if (ready == false) {
    textSize(32);
    background(30);
    fill(240 - dot*0.7, 180 - dot,  dot* 2.2 + 20);
    text('LOADING MODELS', width * 0.5, height * 0.5);
    textSize(16);
    fill(dot * 2 + 20, dot+20, 220 - dot);
    ellipse(width * 0.5 - 120 + dot * 2, height * 0.5 + 20, 16, 16)
    fill(0);
    dot++
    dot++
    dot++
    if (dot > 120) {
      dot = 0;
    }
  }

}

function synth1() {

  const gain1 = new Tone.Gain(0.3);

  filt1 = new Tone.Filter({
    type: 'lowpass',
    frequency: 3000,
    rolloff: -12,
    Q: 1,
  });

  effect1 = new Tone.Reverb({
    "decay": 4,
    "wet": 0.4
  });

  let synthOptions = {
    "oscillator": { "type": "triangle" },
    "filter": { "Q": 2, "type": "lowpass", "rolloff": -12 },
    "envelope": { "attack": 0.005, "decay": 3, "sustain": 0, "release": 0.45 },
    "filterEnvelope": { "attack": 0.201, "decay": 0.32, "sustain": 0.9, "release": 3, "baseFrequency": 700, "octaves": 2.3 },
    "volume": 10
  };

  voices = [];
  for (let i = 0; i < 4; i++) {
    let v = new Tone.MonoSynth(synthOptions);
    v.connect(gain1);
    voices.push(v);
  }
  instrument1 = voices[0];

  gain1.connect(filt1);
  filt1.connect(effect1);
  effect1.connect(Tone.Master);

  console.log('Synth loaded!');

}


function transport() {

  Tone.Transport.bpm.value = 100;
  Tone.Transport.loop = true;
  Tone.Transport.loopStart = 0;
  Tone.Transport.loopEnd = "1:0:0";
  Tone.Transport.start();

  console.log('Transport started!');

}



function center() {

  if (h > 0.5) {
    toneCenter = 'C';
  } else {
    toneCenter = 'Am';
  }

}

function loopArp() {

  let toneLoop = new Tone.Loop(function(time) {

    mattsMarkov();
    chordMake();
    loopCount++
    if (loopCount > 16) {
      center();
      chordName = toneCenter;
      loopCount = 0;
    } else if (loopCount == 1) {
      center();
      chordName = toneCenter;
    }

  }, "2n").start(0);

  let beatOffsets = ["0:0:0", "0:1:0", "0:2:0", "0:3:0"];
  for (let i = 0; i < 4; i++) {
    (function(voiceIndex) {
      new Tone.Loop(function(time) {
        let note = chords[chordName][voiceIndex];
        voices[voiceIndex].triggerAttackRelease(note, "1n", time);
      }, "1n").start(beatOffsets[voiceIndex]);
    })(i);
  }


}

function chordMake() {

  if (nextN == 1) {
    chordName = 'C';
  } else if (nextN == 2) {
    chordName = 'Dm';
    if (h > 0.7) {
      chordName = 'Ds';
    }
  } else if (nextN == 3) {
    chordName = 'Em';
    if (h > 0.7) {
      chordName = 'Es';
    }
  } else if (nextN == 4) {
    chordName = 'F';
    if (h < 0.3) {
      chordName = 'Fs';
    }
  } else if (nextN == 5) {
    chordName = 'G';
    if (h < 0.3) {
      chordName = 'Gs';
    }
  } else if (nextN == 6) {
    chordName = 'Am';
  } else if (nextN == 7) {
    chordName = 'Bd';
  }

  //console.log(chordName);
} 

function mattsMarkov() {

  let pHappy = (h * 100);
  //let pSad = (s * 100); 

  lastN = nextN;

  ///////////////////////////////LAST NOTE:Tonic////////////////////////////////

  if (lastN == 1) {
    let r = floor(random(1, 301));

    if (r <= 150) {

      //happy option

      if ((r * 1.5) < pHappy) {

        nextN = 1;

        //sad option

      } else

        nextN = 2;

    }

    if (150 < r <= 250) {

      if (r - 150 < pHappy) {

        nextN = 4;

      } else

        nextN = 3;

    }

    if (r > 250) {

      if (r * 0.5 - 250 < pHappy) {

        nextN = 5;

      } else

        nextN = 6;

    }

  }

  ///////////////////////////////LAST NOTE:ii/////////////////////////////////// 
  else if (lastN == 2) {
    let r = floor(random(1, 301));

    if (r <= 150) {

      //happy option

      if ((r * 1.5) < pHappy) {

        nextN = 1;

        //sad option

      } else

        nextN = 2;

    }

    if (150 < r <= 250) {

      if (r - 150 < pHappy) {

        nextN = 4;

      } else

        nextN = 3;

    }

    if (r > 250) {

      if (r * 0.5 - 250 < pHappy) {

        nextN = 5;

      } else

        nextN = 6;

    }

  }

  ///////////////////////////////LAST NOTE:iii///////////////////////////////////
  else if (lastN == 3) {
    let r = floor(random(1, 301));

    if (r <= 150) {

      //happy option

      if ((r * 1.5) < pHappy) {

        nextN = 1;

        //sad option

      } else

        nextN = 2;

    }

    if (150 < r <= 250) {

      if (r - 150 < pHappy) {

        nextN = 4;

      } else

        nextN = 3;

    }

    if (r > 250) {

      if (r * 0.5 - 250 < pHappy) {

        nextN = 5;

      } else

        nextN = 6;

    }

  }

  ///////////////////////////////LAST NOTE:IV///////////////////////////////////
  else if (lastN == 4) {
    let r = floor(random(1, 301));

    if (r <= 150) {

      //happy option

      if ((r * 1.5) < pHappy) {

        nextN = 1;

        //sad option

      } else

        nextN = 2;

    }

    if (150 < r <= 250) {

      if (r - 150 < pHappy) {

        nextN = 5;

      } else

        nextN = 3;

    }

    if (r > 250) {

      if (r * 0.5 - 250 < pHappy) {

        nextN = 4;

      } else

        nextN = 6;

    }

  }

  ///////////////////////////////LAST NOTE:V///////////////////////////////////
  else if (lastN == 5) {
    let r = floor(random(1, 301));

    if (r <= 150) {

      //happy option

      if ((r * 1.5) < pHappy) {

        nextN = 1;

        //sad option

      } else

        nextN = 2;

    }

    if (150 < r <= 250) {

      if (r - 150 < pHappy) {

        nextN = 4;

      } else

        nextN = 3;

    }

    if (r > 250) {

      if (r * 0.5 - 250 < pHappy) {

        nextN = 5;

      } else

        nextN = 6;

    }

  }

  ///////////////////////////////LAST NOTE:vi///////////////////////////////////
  else if (lastN == 6) {
    let r = floor(random(1, 301));

    if (r <= 150) {

      //happy option

      if ((r * 1.5) < pHappy) {

        nextN = 1;

        //sad option

      } else

        nextN = 2;

    }

    if (150 < r <= 250) {

      if (r - 150 < pHappy) {

        nextN = 4;

      } else

        nextN = 3;

    }

    if (r > 250) {

      if (r * 0.5 - 250 < pHappy) {

        nextN = 5;

      } else

        nextN = 6;

    }

  }

  ///////////////////////////////LAST NOTE:vii///////////////////////////////////
  else if (lastN == 7) {
    let r = floor(random(1, 301));

    if (r <= 150) {

      //happy option

      if ((r * 1.5) < pHappy) {

        nextN = 1;

        //sad option

      } else

        nextN = 2;

    }

    if (150 < r <= 250) {

      if (r - 150 < pHappy) {

        nextN = 4;

      } else

        nextN = 3;

    }

    if (r > 250) {

      if (r * 0.5 - 250 < pHappy) {

        nextN = 5;

      } else

        nextN = 6;

    }

  } else {
    console.log('last note is too big!' + lastNote);
  }


}



function draw() {



  if (ready1 == true && ready2 == true && ready3 == true) {
    ready = true;
  }

  push();
  translate(video.width * 1.6, 0);
  scale(-1.6, 1.6);
  //scale(-1, 1);
  drawingContext.filter = 'grayscale(100%)';
  image(video, 0, 0, video.width, video.height);
  drawingContext.filter = 'none';

  e = eSlider.value();
  v = vSlider.value();


  background(0, 230);

  if (pose) {
    for (let i = 0; i < skeleton.length; i++) {
      let a = skeleton[i][0];
      let b = skeleton[i][1];
      strokeWeight(12);
      stroke(v + 100, 100, 200 - v, 255 * (a.score));
      line(a.position.x, a.position.y, b.position.x, b.position.y);
    }

    for (let i = 5; i < pose.keypoints.length; i++) {
      let x = pose.keypoints[i].position.x;
      let y = pose.keypoints[i].position.y;
      fill(v + 100, 100, 200 - v);
      stroke(v + 100, 100, 200 - v);
      rect(x, y, 16, 16, 0.16 * (100 - e));

    }
    noFill();
   rect(pose.nose.x - 35, pose.nose.y - 80, 70, 80, 0.8 * (100 - e));

  }
  pop();

  if (firstRun) {

    textSize(16);
    fill(220);
    noStroke();
    textAlign(CENTER, CENTER);
    text('Turn on volume => => =>', width * 0.83, 55);


  }

  if (firstRun == false) {

    if (allIn == true) {
      fill(200);
      noStroke();
      textAlign(CENTER, CENTER);
      textSize(16);
      text('Your physically expressed emotion is being turned into music!', width * 0.5, 20);
    } else if (allIn == false) {
      noStroke();
      fill(220);
      textAlign(CENTER, CENTER);
      textSize(16);
      text('Make sure whole body is in frame', width * 0.5, 20);
    }
    
      if (ready == true) {
        textAlign(CENTER, CENTER);

    text('Chord = ' + chordName, 0.2 * width , 755);
    

        

  }

  }

  //composition drawloop

  valence = map(v, 0, 100, 0, 1);
  energy = map(e, 0, 100, 0, 1);
  h = valence;

  
  volumeButton();
  txt();
  drawPresetPanel();

  if (ready == true && firstRun == false) {
    timbre();
    volumeControl();
  }

}

function timbre() {

  let pad   = presets[0]; // energy = 0
  let pluck = presets[1]; // energy = 1

  let attack  = lerp(pad.attack,  pluck.attack,  energy);
  let decay   = lerp(pad.decay,   pluck.decay,   energy);
  let sustain = lerp(pad.sustain, pluck.sustain, energy);
  let release = lerp(pad.release, pluck.release, energy);
  let oscType = energy > 0.5 ? pluck.osc : pad.osc;

  for (let i = 0; i < voices.length; i++) {
    voices[i].oscillator.type    = oscType;
    voices[i].envelope.attack    = attack;
    voices[i].envelope.decay     = decay;
    voices[i].envelope.sustain   = sustain;
    voices[i].envelope.release   = release;
  }

}



function applyPreset(index) {
  currentPreset = index;
  let p = presets[index];
  for (let i = 0; i < voices.length; i++) {
    voices[i].oscillator.type = p.osc;
    voices[i].envelope.attack  = p.attack;
    voices[i].envelope.decay   = p.decay;
    voices[i].envelope.sustain = p.sustain;
    voices[i].envelope.release = p.release;
  }
}

function drawPresetPanel() {
  let panelW = 160;
  let btnH   = 60;
  let btnGap = 12;
  let startY = 100;
  let padX   = 15;

  // panel background
  noStroke();
  fill(20, 20, 20, 200);
  rect(0, startY - 10, panelW, presets.length * (btnH + btnGap) + 50, 8);

  textAlign(LEFT, CENTER);
  textSize(11);
  fill(180);
  noStroke();
  text('SOUND PRESET', padX, startY - 24);

  for (let i = 0; i < presets.length; i++) {
    let bx = padX;
    let by = startY + i * (btnH + btnGap);
    let bw = panelW - padX * 2;

    let isSelected = (i == currentPreset);

    // button background
    noStroke();
    fill(isSelected ? color(80, 60, 140) : color(45, 45, 55));
    rect(bx, by, bw, btnH, 6);

    // label
    fill(isSelected ? 255 : 180);
    textSize(13);
    textAlign(CENTER, CENTER);
    text(presets[i].name, bx + bw / 2, by + btnH / 2);
  }
}

function mousePressed() {

  // preset panel clicks
  if (voices.length > 0) {
    let panelW = 160;
    let btnH   = 60;
    let btnGap = 12;
    let startY = 100;
    let padX   = 15;
    if (mouseX > padX && mouseX < panelW - padX) {
      for (let i = 0; i < presets.length; i++) {
        let by = startY + i * (btnH + btnGap);
        if (mouseY > by && mouseY < by + btnH) {
          applyPreset(i);
          return;
        }
      }
    }
  }

  if (width - 100 < mouseX && mouseX < width && mouseY < 100 && mute == true) {
    mute = false;

    if (firstRun == true) {

      Tone.context.resume();
      synth1();
      mattsMarkov();
      chordMake();
      loopArp()
      transport();
      firstRun = false;
    }

  } else if (width - 100 < mouseX && mouseX < width && mouseY < 100 && mute == false) {
    mute = true;
  }

}

function volumeButton() {

  strokeWeight(3);
  stroke(210);
  noFill();

  if (mute) {
    triangle(width - 60, 55, width - 55, 65, width - 55, 45);
    arc(width - 50, 55, 30, 30, PI + HALF_PI, TWO_PI + HALF_PI);
    arc(width - 50, 55, 20, 20, PI + HALF_PI, TWO_PI + HALF_PI);
    arc(width - 50, 55, 10, 10, PI + HALF_PI, TWO_PI + HALF_PI);
    stroke(255, 40, 40);
    arc(width - 50, 55, 30, 30, QUARTER_PI, PI + QUARTER_PI, CHORD);
    ellipse(width - 50, 55, 30, 30);


  } else if (mute == false) {
    triangle(width - 60, 55, width - 55, 65, width - 55, 45);
    arc(width - 50, 55, 30, 30, PI + HALF_PI, TWO_PI + HALF_PI);
    arc(width - 50, 55, 20, 20, PI + HALF_PI, TWO_PI + HALF_PI);
    arc(width - 50, 55, 10, 10, PI + HALF_PI, TWO_PI + HALF_PI);


  }
}

function volumeControl() {

  if (mute) {

    for (let i = 0; i < voices.length; i++) { voices[i].volume.value = -100; }

  } else if (mute == false) {

    for (let i = 0; i < voices.length; i++) { voices[i].volume.value = -6; }

  }

}