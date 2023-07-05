
/** 
  # Maximum Image Dimension (width or height)
  Images wider or taller than this are scaled down to prevent 
  the number of pixels from getting unweildy.
  
  Adjusting above 100 may be quite slow due to the number of 3D cubes generated
 */
var maxImageDimension = 120;

/* /////////////////////////////////////// */

var renderCalls = [];
function render () {
  requestAnimationFrame( render );
  renderCalls.forEach((callback)=>{ callback(); });
}
render();


/*////////////////////////////////////////*/

function loadFiles(e){
  var files = (e.target.files || e.dataTransfer.files || uploader.files),
      file = files[0],
      reader = new FileReader();
  reader.onload = function(e){
    convertImage(e);
  }
  reader.readAsDataURL(file);
}

// File Uploader
var uploader = document.getElementById('uploader');
uploader.onchange = loadFiles;

// On image click
var imgs = [].slice.call(document.querySelectorAll('img'));
imgs.forEach((img,i)=>{
  img.addEventListener('click',()=>{ buildBoxes.call(img); });
  if ( i === 2 ) { convertImage(img.src); }
  //else if ( i === 1 ) { setTimeout(()=>{ convertImage(img.src); },4500); }
});

// Drag & Drop
var fileDrag = document.createElement('div');
fileDrag.setAttribute('id','drag-and-drop');
fileDrag.innerText = 'Drag & drop an image';

function FileDragReset(e){
  e.preventDefault();
  fileDrag.className = '';
}

function FileDragDrop(e){
  e = e || window.event;
  console.log('reset');
  FileDragReset(e);    
  loadFiles(e);
}

fileDrag.addEventListener("dragleave", FileDragReset);
document.addEventListener("dragenter", function(){ 
  console.log('drag enter');
  fileDrag.className = 'dragenter';
});
document.addEventListener('dragover',function(e){ e.preventDefault(); /* Essential! */ });
document.addEventListener("drop", FileDragDrop);


/*////////////////////////////////////////*/

function convertImage(src,callback){
  var img = new Image();
  img.onload = buildBoxes;
  img.src = ( src.target ? src.target.result : src );
}

// Convert image to canvas ImageData
function imageToData(img) {

  var canvas = document.createElement("canvas"),
      ctx = canvas.getContext("2d"),
      width = img.width,
      height = img.height;

  if ( width + height > maxImageDimension ) {
    let scaleDown = maxImageDimension / Math.max( width, height );
    console.log(width, height);
    width = img.width = Math.floor(img.width *= scaleDown);
    height = img.height = Math.floor(img.height *= scaleDown);
    console.log('Scaled image by ', scaleDown,' to ', width, height);
  }

  canvas.width = width;
  canvas.height = height;
  ctx.drawImage(img, 0, 0, width, height);

  return ctx.getImageData(0,0,width,height);
}

function getColors(img) {
  var colors = {},
      data = img.data,
      len = data.length,
      w = img.width,
      h = img.height,
      x = 0,
      y = 0,
      i = 0,
      color;

  for (; i < len; i+= 4) {
    if ( data[i+3] > 0 ) {
      color = 'rgb('+data[i]+','+data[i+1]+','+data[i+2]+')' //,'+data[i+3]/255+')';
      if ( !colors[color] ) {
        colors[color] = [];
        colors[color].r = data[i];
        colors[color].g = data[i+1];
        colors[color].b = data[i+2];
        colors[color].a = data[i+3] / 255;
        colors[color].y = 0.299*data[i] + 0.587*data[i+1] + 0.114*data[i+2];
      }
      x = (i / 4) % w;
      y = Math.floor((i / 4) / w);
      colors[color].push([x,y]);
    }                      
  }

  return colors;
}

/*////////////////////////////////////////*/

var camera = new THREE.PerspectiveCamera( 80, window.innerWidth / window.innerHeight, 0.1, 800 );
camera.position.z = 30;
camera.position.y = -2;


/*////////////////////////////////////////*/


var pointer = { 
  x: 0, 
  y: 0,
};

document.addEventListener('mousemove', pointerMove);
document.addEventListener('touchmove', pointerMove);

document.body.addEventListener('mouseleave', pointerReset);
document.body.addEventListener('touchcancel', pointerReset);

function pointerReset(e){
  pointer.x = 0.5;
  pointer.y = 0.5;
}

function pointerMove(e){
  let pos = e.touches ? e.touches[0] : e;
  pointer.x = pos.clientX / window.innerWidth;
  pointer.y = pos.clientY / window.innerHeight;
};

let mousePos = { x: 0.5, y: 0.5, _x: 0.5, _y: 0.5 };
function trackMouse(e){
  let pointer = e.touches ? e.touches[0] : e;
  mousePos.x = ( pointer.clientX / window.innerWidth );
  mousePos.y = ( pointer.clientY / window.innerHeight );
};

function ease(current,target,ease){ return current + (target - current) * ( ease || 0.2 ); }
function updateCamera(){
  mousePos._x = ease(mousePos._x || 0.5, mousePos.x, 0.06);
  mousePos._y = ease(mousePos._y || 0.5, mousePos.y, 0.06);
  camera.position.x = (-25 * (mousePos._x - 0.5) * 2);
  camera.position.y = (25 * (mousePos._y - 0.5) * 2);
  camera.lookAt(new THREE.Vector3(0,0,0));
}
updateCamera();

window.addEventListener('mousemove', trackMouse);
renderCalls.push(updateCamera);


/*////////////////////////////////////////*/

var scene = new THREE.Scene();
//scene.fog = new THREE.FogExp2( 0xFFFFFF, 0.01);
scene.fog = new THREE.Fog(0xEEEEEE, 30, 300);

var renderer = new THREE.WebGLRenderer( { antialias: true, alpha: true } );
renderer.setPixelRatio( Math.min(2, window.devicePixelRatio) );// / 14 );
renderer.setSize( window.innerWidth, window.innerHeight );
renderer.setClearColor( 0xFFFFFF );//0x );
renderer.toneMapping = THREE.LinearToneMapping;
renderer.toneMappingExposure = Math.pow( 0.94, 5.0 );

// if ( window.innerWidth > 500 ) {
//   renderer.shadowMap.enabled = true;
//   renderer.shadowMap.type = THREE.PCFShadowMap;
// }

window.addEventListener( 'resize', function () {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize( window.innerWidth, window.innerHeight );
}, false );

document.body.appendChild( renderer.domElement);

renderCalls.push(function(){ renderer.render( scene, camera ); });

/*////////////////////////////////////////*/ 

let orbit = new THREE.OrbitControls(camera, renderer.domElement);
orbit.enableRotate = false;
orbit.enablePan = false;
orbit.enableKeys = false;
orbit.zoomSpeed = 0.6;
orbit.minDistance = 10;

/*////////////////////////////////////////*/

var ambientLight = new THREE.AmbientLight(0x222222);
scene.add(ambientLight);

var hemiLight = new THREE.HemisphereLight( 0xFFF7EB, 0xEBF7FD, 0.3 );
scene.add( hemiLight );

var light = new THREE.SpotLight( 0xffffff );
light.position.y = 40;
light.position.x = 0;
light.position.z = 200;
light.castShadow = true;
light.shadow.mapSize.width = 1024;
light.shadow.mapSize.height = 1024;
light.shadow.camera.near = 1;
light.shadow.camera.far = 800;
light.shadow.camera.fov = 40;
light.power = 2.5;
scene.add(light);

renderCalls.push(()=>{
  light.position.copy(camera.position);
});

var light2 = new THREE.PointLight( 0xffffff );
light2.position.y = 40;
light2.position.x = 0;
light2.position.z = 200;
light2.castShadow = true;
light2.power = 1.5;
scene.add(light);


//var axisHelper = new THREE.AxisHelper( 30 );
// scene.add( axisHelper );
// The X axis is red. The Y axis is green. The Z axis is blue.

/*////////////////////////////////////////*/

var group; 
var animating = false;
var animatingOut = false;

function transitionOut(oldGroup){
  if ( oldGroup ) {

    let tl = new TimelineLite({
      onStart: ()=> { animatingOut = true },
      onComplete: ()=>{ 
        animatingOut = false; 
        scene.remove(oldGroup); 
      }
    });

    oldGroup.traverseVisible((object)=>{
      if ( object.parent === oldGroup ) {
        let speed = 0.75 + Math.random() * 1.25;

        object.material = object.material.clone();

        tl.to(object.material, speed * 0.5, {
          transparent: true,
          opacity: 0,
          ease: 'Power3.easeIn'
        },speed * 0.5);

        tl.to(object.position, speed, {
          z: -200,
          delay: Math.random(),
          ease: 'Power3.easeIn' //Bounce.easeOut
        },0);

      }
    });
  }
}

CustomBounce.create("myBounce", {strength: 0.2, squash:0 });

function transitionIn(newGroup){

  if ( newGroup ) { 

    let tl = new TimelineLite({
      onStart: ()=>{ 
        animating = true;
        scene.add(newGroup);
      },
      onComplete: ()=>{ 
        animating = false; 
        group = newGroup;
      }
    });
    
    tl.addLabel('start',0.5);

    newGroup.traverseVisible((object)=>{
      if ( object.parent === newGroup ) {
        let speed = 0.75 + Math.random() * 1.25;

        tl.from(object.position, speed, {
          z: 40,
          delay: Math.random(),
          ease: 'myBounce'
        },'start');

      }
    });
    
  }
}

/*////////////////////////////////////////*/


var geometry = new THREE.BoxGeometry( 1, 1, 1 );
function makeBox(color, a){
  
  var material = new THREE.MeshPhongMaterial({
    color: color,
    transparent: ( a && a !== 1 ),
    opacity: a,
    shininess: 30,
    emissive: color,
    emissiveIntensity: 0.1,
  });
  
  var cube = new THREE.Mesh( geometry, material );
  cube.castShadow = true;
  cube.receiveShadow = true;
  return cube;
}

function buildBoxes(){
  
  if ( animating ) { return; }

  let img = this;
  let data = imageToData(img);
  let colors = getColors(data);

  // Remove the old group
  transitionOut(group);

  // Create a new group
  let newGroup = new THREE.Group();

  for (var color in colors) {
    let arr = colors[color];
    let i = 0;
    let len = arr.length;
    let cube = makeBox(color, arr.a);

    cube.scale.z = 1 + 1 * (arr.y / 255);

    for ( ; i < len; i++ ){
      let pixel = arr[i];
      let pixelCube = cube.clone();
      pixelCube.position.set(pixel[0] - (img.width/2), -pixel[1] + (img.height/2), 0);
      newGroup.add(pixelCube);

    }
  }

  transitionIn(newGroup);
}

/*////////////////////////////////////////*/


let controls = {
  radius: 4,
  amount: 4.5,
  type: 'attract',

  methods: {
    attract: function(object, pos){
      let dist = distance(object.position, pos);
      object.__position = object.__position || object.position.clone();
      object.position.z = ( dist < controls.radius ? controls.amount * (controls.radius-dist)/controls.radius / object.scale.z : 0 );
    },

    // loosely based on http://jsfiddle.net/225cb9d7/3/
    repel: function(object, pos){
      let x0 = object.position.x;
      let y0 = object.position.y;
      let diffX = pos.x - x0;
      let diffY = pos.y - y0;
      let dist = Math.sqrt( diffX * diffX + diffY * diffY);// + diffZ * diffZ);

      // Save copy of original position
      object.__position = object.__position || object.position.clone();


        let powerx = x0 - ( diffX / dist) * (controls.amount/2) / dist;
        let powery = y0 - ( diffY / dist) * (controls.amount/2) / dist;

        let forcex = ( object.__position.x - x0); //(forcex + ( object.__position.x - x0) / 2) / 2.1;
        let forcey = ( object.__position.y - y0); //(forcey + ( object.__position.y - y0) / 2) / 2.1;

        object.position.x = powerx + forcex;
        object.position.y = powery + forcey;
        object.position.z = ( dist < controls.radius ? -controls.amount * 2 * (controls.radius-dist)/controls.radius / object.scale.z : 0 );

    }
  }
};


var gui = new dat.GUI();
gui.add(controls, 'type', Object.keys(controls.methods));
gui.add(controls, 'radius', 1, 20).step(0.5);
gui.add(controls, 'amount', 0.25, 20).step(0.25);
gui.domElement.style.zIndex = 20;

/*////////////////////////////////////////*/

function distance(pos1, pos2){
  let diffX = pos2.x - pos1.x,
      diffY = pos2.y - pos1.y;//,
  //diffZ = pos2.z - pos1.z;
  return Math.sqrt( diffX * diffX + diffY * diffY);// + diffZ * diffZ);
}

let mouse = new THREE.Vector3();
let raycaster = new THREE.Raycaster();

const TWOPI = Math.PI * 2;

document.addEventListener('mousemove',click);
document.addEventListener('touchmove',click);

function click(e){

  if ( animating || animatingOut || !group ) { return; }

  let pointer = e.touches ? e.touches : [e];

  for (let i = 0, len = pointer.length; i < len; i++){

    let event = pointer[i];
    mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
    mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;

    mouse.unproject( camera );
    let dir = mouse.sub( camera.position ).normalize();
    let dist = -camera.position.z / dir.z;
    let pos = camera.position.clone().add( dir.multiplyScalar( dist ) );

    group.traverseVisible((object)=>{
      if ( object !== group ) {
        controls.methods[controls.type](object, pos);
      }
    });
  }
}

/*////////////////////////////////////////*/
