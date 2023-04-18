// PJ2 2023-4-14 19307110374 AndyLuo

// Retrieve <canvas> element
var canvas = document.getElementById('webgl');

// Get the rendering context for WebGL
var gl = getWebGLContext(canvas);
if (!gl) {
  console.log('Failed to get the rendering context for WebGL');
}

// Create two buffer object: store triangles vertices and border vertices
var vertexColorBuffer = gl.createBuffer();  
if (!vertexColorBuffer) {
  console.log('Failed to create the buffer object');
}

var borderBuffer = gl.createBuffer();
  if(!borderBuffer){
    console.log('Failed to create the buffer object');
}

var a_Position, a_Color, xformMatrix, u_xformMatrix, animateID, g_last;
var currentAngle = 0.0, currentScale = 1.0;
var shrink = true, animation = false, inversed = false, border = true;
var identityMatrix = new Matrix4(), StoreMatrix = new Matrix4();
identityMatrix.setIdentity();
StoreMatrix.setIdentity();

function transform(xformMatrix, angle, scaleSize){
  // Create Matrix4 object for the rotation matrix
  xformMatrix = new Matrix4();
  // Set the rotation matrix
  xformMatrix.setRotate(angle, 0, 0, 1);
  xformMatrix.scale(scaleSize, scaleSize, scaleSize);
  gl.uniformMatrix4fv(u_xformMatrix, false, xformMatrix.elements);
  return xformMatrix;
}

// Last time that this function was called
function animate(angle, scaleSize, doShrink) {
  // Calculate the elapsed time
  var now = Date.now();
  var elapsed = now - g_last;
  g_last = now;
  // Update the current rotation angle (adjusted by the elapsed time)
  var newAngle = angle + (ANGLE_STEP * elapsed) / 1000.0;
  var newScaleSize;
  if(doShrink){
    newScaleSize = scaleSize - (SCALE_STEP * elapsed) / 1000.0;
  }
  else{
    newScaleSize = scaleSize + (SCALE_STEP * elapsed) / 1000.0;
    if(newScaleSize >= 1.0){
      newScaleSize = 1.0;
    }
  }
  return [newAngle %= 360, newScaleSize];
}

function drawTriangles(gl, doTransform, angle, scaleSize){
  let tempShader;
  // if doTransform, init with ANIMATION shaders
  if(doTransform){
    tempShader = ANIMATION_VSHADER_SOURCE;
  }
  // else, init with NON_ANIMATION shaders
  else{
    tempShader = VSHADER_SOURCE;
  }

  if (!initShaders(gl, tempShader, FSHADER_SOURCE)) {
    console.log('Failed to intialize shaders.');
    return;
  }

  // Write the positions of vertices to a vertex shader
  var n  = initVertexBuffers(gl);
  if (n < 0) {
    console.log('Failed to set the positions of the vertices');
    return;
  }

  if(doTransform){
    // Pass the rotation matrix to the vertex shader
    u_xformMatrix = gl.getUniformLocation(gl.program, 'u_xformMatrix');
    if (!u_xformMatrix) {
      console.log('Failed to get the storage location of u_xformMatrix');
      return;
    }
    xformMatrix = transform(xformMatrix, angle, scaleSize);
  }
  
  // Draw the triangle
  gl.drawArrays(gl.TRIANGLES, 0, n);
}

function drawLines(gl, doTransform, angle, scaleSize){
  let tempShader;

  if(doTransform){
    tempShader = ANIMATION_LINESHADER_SOURCE;
  }
  else{
    tempShader = LINESHADER_SOURCE;
  }

  // Initialize shaders
  if (!initShaders(gl, tempShader, LINEFSHADER_SOURCE)) {
    console.log('Failed to intialize shaders.');
    return;
  }
  let lineN = initLineBuffers(gl);
  if (lineN < 0) {
    console.log('Failed to set the positions of the vertices');
    return;
  }
  
  if(doTransform){
    // Pass the rotation matrix to the vertex shader
    u_xformMatrix = gl.getUniformLocation(gl.program, 'u_xformMatrix');
    if (!u_xformMatrix) {
      console.log('Failed to get the storage location of u_xformMatrix');
      return;
    }
    xformMatrix = transform(xformMatrix, angle, scaleSize);
  }

  // Draw the border
  gl.drawArrays(gl.LINE_LOOP, 0, lineN);
}

// re-draw the canvas
function draw(gl, doTransform, angle, scaleSize){
  // Clear <canvas>
  gl.clear(gl.COLOR_BUFFER_BIT);
  // firstly draw the triangles
  drawTriangles(gl, doTransform, angle, scaleSize);
  // secondly draw the border
  if(border){
    drawLines(gl, doTransform, angle, scaleSize);
  }
}

function main() {
  // Specify the color for clearing <canvas>
  gl.clearColor(0, 0, 0, 1);

  // Clear <canvas>
  gl.clear(gl.COLOR_BUFFER_BIT);

  // preprocess the vertex_pos and vertex_color
  preprocess();

  // Draw triangles
  drawTriangles(gl, false, undefined, undefined);

  // Draw lines
  drawLines(gl, false, undefined, undefined);

  document.onkeydown = function(ev){keydown(ev, gl)};
}

/*
===================
functions for interactions
===================
*/
currentVertexIndex = undefined;

canvas.addEventListener('mousedown',function(event){
  let temp = transformCanvasToWebgl(event.offsetX, event.offsetY);
  let clickPosX = temp[0];
  let clickPosY = temp[1];
  for( let i=0;i<vertex_pos.length;i++){
      if(calcDistance(clickPosX,clickPosY,vertex_pos[i][0],vertex_pos[i][1]) <= VALID_RANGE){
          // the mousedown event is valid for some vertex
          currentVertexIndex = i;
          return;
      }
  }
});

canvas.addEventListener('mousemove', (event) => {
  // invalid mousemove event
  if (currentVertexIndex == undefined) return;
  // valid move, change the coordinate of vertex
  let temp = transformCanvasToWebgl(event.offsetX, event.offsetY);
  let clickPosX = temp[0];
  let clickPosY = temp[1];
  vertex_pos[currentVertexIndex] = [clickPosX, clickPosY, 0];
  // redraw the canvas
  draw(gl, false, undefined, undefined);
});

// reset the currentVertexIndex
canvas.addEventListener('mouseup', function(event){
    currentVertexIndex = undefined;
});

// reset the currentVertexIndex
canvas.addEventListener('mouseleave', function(event){
    currentVertexIndex = undefined;
});

function keydown(ev, gl) {
  g_last = Date.now(); 
  if(ev.keyCode == 69 && !inversed) {
    // 1. press 'E'(code 69) to switch between edit mode and animation mode
    inversed = true;
    // reset the currentAngle and currentScale
    currentAngle = 0.0;
    currentScale = 1.0;
    if(animation){
      cancelAnimationFrame(animateID);
    }
    else{
      let tempMatrix = new Matrix4();
      tempMatrix.setInverseOf(StoreMatrix);
      resetPosition(tempMatrix);
    }
    animation = false;
    StoreMatrix.setIdentity();
    draw(gl, false, undefined, undefined);
  } 
  else if (ev.keyCode == 84) {
    // 2. press 'T'(code 84) to start and stop the animation
    inversed = false;
    if(animation){
      // stop the animation
      animation = false;
      cancelAnimationFrame(animateID);
      // reset vertices position
      resetPosition(xformMatrix);
    }
    else{
      // start the animation
      animation = true;
      // reset the vertex_pos
      let tempMatrix = new Matrix4();
      tempMatrix.setInverseOf(StoreMatrix);
      resetPosition(tempMatrix);
      var tick = function() {
        if(currentScale <= 0.2){
          shrink = false;
        }
        else if(currentScale >= 1.0){
          shrink = true;
        }
        let tempAnimate = animate(currentAngle, currentScale, shrink);  // Update the rotation angle
        currentAngle = tempAnimate[0];
        currentScale = tempAnimate[1];
        draw(gl, true, currentAngle, currentScale);   // Draw the triangle
        StoreMatrix.set(xformMatrix);
        animateID = requestAnimationFrame(tick, canvas); // Request that the browser calls tick
      };
      tick();
    }
  } 
  else if (ev.keyCode == 66) {
    // 3. press 'B'(code 66) to display and hide the border
    if(border){
      border = false;
    }
    else{
      border = true;
    }
    if(!animation){
      draw(gl, false, undefined, undefined);
    }
  }
}