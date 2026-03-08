let video;
let poseNet;
let pose;
let skeleton;

let numCaptures = 0;

let brain;

let state = 'waiting';
let targetEmotion;

let eSlider, vSlider;

function delay(time) {
  return new Promise((resolve, reject) => {
    if (isNaN(time)) {
      reject(new Error('delay requires a valid number.'));
    } else {
      setTimeout(resolve, time);
    }
  });
}


async function keyPressed() {
  if (key == 's') {
    brain.saveData();
  } else if (key == 'd') {
    
    let e = eSlider.value();
    let v = vSlider.value();
    
    targetEmotion = [e,v];
    
    console.log("Energy = " + e,"Valence = " + v);
    
    await delay(5000);
    console.log('Collecting');
    state = 'collecting';
    numCaptures++;
    
    await delay(20000);
    console.log('Finished collecting');
    state = 'waiting';
    console.log("Number of captures = " + numCaptures);
    saveCanvas('Pose_image' + numCaptures);
  }


}

function setup() {
  createCanvas(640, 480);
 
  
  eSlider = createSlider(0,100,50);
  vSlider = createSlider(0,100,50);

  
  
  video = createCapture(VIDEO);
  video.hide();
  poseNet = ml5.poseNet(video, modelLoaded);
  poseNet.on('pose', gotPoses);

  let options = {
    inputs: 34,
    task: 'regression',
    debug: true
  }
  brain = ml5.neuralNetwork(options);
}

function gotPoses(poses) {
  // console.log(poses); 
  if (poses.length > 0) {
    pose = poses[0].pose;
    skeleton = poses[0].skeleton;
    if (state == 'collecting') {
      let inputs = [];
      for (let i = 0; i < pose.keypoints.length; i++) {
        let x = pose.keypoints[i].position.x;
        let y = pose.keypoints[i].position.y;
        inputs.push(x);
        inputs.push(y);
      }
      brain.addData(inputs, targetEmotion);
    }
  }

}


function modelLoaded() {
  console.log('poseNet ready');
}

function draw() {
  translate(video.width, 0);
  scale(-1, 1);
  image(video, 0, 0, video.width, video.height);
  background(255, 100);
  
  

  if (pose) {
    for (let i = 0; i < skeleton.length; i++) {
      let a = skeleton[i][0];
      let b = skeleton[i][1];
      strokeWeight(12);
      //console.log(skeleton[i][0].score);
      stroke((skeleton[i][0].score)*255);

      line(a.position.x, a.position.y, b.position.x, b.position.y);
    }
    for (let i = 0; i < pose.keypoints.length; i++) {
      let x = pose.keypoints[i].position.x;
      let y = pose.keypoints[i].position.y;
      fill(0);
      stroke(255);
      ellipse(x, y, 16, 16);
    }
  }
  
    if (state == 'collecting') {
      fill(0, 255, 0);
      noStroke();
      ellipse(50, 50, 50, 50);
    }
  
}

// function text2() {
//   textAlign(CENTER, CENTER);
//   text('Energy = ' + eSlider.value(), 50, height - 20);
//   text('Valence = ' + vSlider.value(), 150, height - 20);
// }