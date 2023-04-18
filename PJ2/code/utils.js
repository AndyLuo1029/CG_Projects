// shaders for animation
// Vertex shader program
var ANIMATION_VSHADER_SOURCE =
  'attribute vec4 a_Position;\n' +
  'attribute vec4 a_Color;\n' +
  'varying vec4 v_Color;\n' +
  'uniform mat4 u_xformMatrix;\n' +
  'void main() {\n' +
  '  gl_Position = u_xformMatrix * a_Position;\n' +
  '  v_Color = a_Color;\n' +
  '}\n';

// Vertex line shader program
var ANIMATION_LINESHADER_SOURCE =
  'attribute vec4 a_Position;\n' +
  'uniform mat4 u_xformMatrix;\n' +
  'void main() {\n' +
  '  gl_Position = u_xformMatrix * a_Position;\n' +
  '}\n';

// shaders for interaction (no transform)
// Vertex shader program
var VSHADER_SOURCE =
  'attribute vec4 a_Position;\n' +
  'attribute vec4 a_Color;\n' +
  'varying vec4 v_Color;\n' +
  'void main() {\n' +
  '  gl_Position = a_Position;\n' +
  '  v_Color = a_Color;\n' +
  '}\n';

// Vertex line shader program
var LINESHADER_SOURCE =
  'attribute vec4 a_Position;\n' +
  'void main() {\n' +
  '  gl_Position = a_Position;\n' +
  '}\n';

// Fragment shader program
var FSHADER_SOURCE =
  'precision mediump float;\n' +
  'varying vec4 v_Color;\n' +
  'void main() {\n' +
  '  gl_FragColor = v_Color;\n' +
  '}\n';

// Line fragment shader program
var LINEFSHADER_SOURCE =
  'void main() {\n' +
  '  gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);\n' +
  '}\n';

// Transform canvas coordinate to webgl coordinate
function transformCanvasToWebgl(x, y){
    return [(x/350-1).toPrecision(4), (1-y/350).toPrecision(4)];
}

// calculate the distance between two points
function calcDistance(x1,y1,x2,y2){
    return Math.sqrt(Math.pow((x1-x2),2)+Math.pow((y1-y2),2));
}

// preprocess the data
function preprocess(){
    // read vertex position from config.js
    // change it from canvas coordinate to webgl coordinate
    for(let v of vertex_pos){
        let temp = transformCanvasToWebgl(v[0], v[1]);
        v[0] = temp[0];
        v[1] = temp[1];
    }
    
    // read vertex color from config.js
    // change it from rgb(255) to rgb(1)
    for(let v of vertex_color){
        v[0] = (v[0]/255).toPrecision(3);
        v[1] = (v[1]/255).toPrecision(3);
        v[2] = (v[2]/255).toPrecision(3);
    }
}

// load position and color data of vertices
function loadVertices(){
    let tempList = [];
    for(poly of polygon){
      // split all the vertices into triangles in this order: 0,1,2; 0,2,3
      let order = [0,1,2,0,2,3];
      for(i of order){
        tempList.push(vertex_pos[poly[i]][0]);
        tempList.push(vertex_pos[poly[i]][1]);
        tempList.push(vertex_color[poly[i]][0]);
        tempList.push(vertex_color[poly[i]][1]);
        tempList.push(vertex_color[poly[i]][2]);
      }
    }
    return tempList;
}

function loadBorderVertices(){
    let tempList = [];
    let order = [4,5,8,4,8,7,4,0,1,4,3,0,4,1,5,4,1,2,5,4,7,3,4,7,6,3];
    for(i of order){
    tempList.push(vertex_pos[i][0]);
    tempList.push(vertex_pos[i][1]);
    }
    return tempList;
}

function initVertexBuffers(gl) {
    // read the vertices orders from config.js
    let tempList = loadVertices();
    var verticesColors = new Float32Array(tempList);
    var n = tempList.length/5; // The number of vertices of all triangles
  
    // Bind the buffer object to target
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexColorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, verticesColors, gl.STATIC_DRAW);
  
    var FSIZE = verticesColors.BYTES_PER_ELEMENT;
    //Get the storage location of a_Position, assign and enable buffer
    a_Position = gl.getAttribLocation(gl.program, 'a_Position');
    if (a_Position < 0) {
      console.log('Failed to get the storage location of a_Position');
      return -1;
    }
    gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, FSIZE * 5, 0);
    gl.enableVertexAttribArray(a_Position);  // Enable the assignment of the buffer object
  
    // Get the storage location of a_Position, assign buffer and enable
    a_Color  = gl.getAttribLocation(gl.program, 'a_Color');
    if(a_Color < 0) {
      console.log('Failed to get the storage location of a_Color');
      return -1;
    }
    gl.vertexAttribPointer(a_Color, 3, gl.FLOAT, false, FSIZE * 5, FSIZE * 2);
    gl.enableVertexAttribArray(a_Color);  // Enable the assignment of the buffer object
  
    return n;
  }

// init border program
function initLineBuffers(gl) {
    // get vertices position
    let tempList = loadBorderVertices();
    let borderVertices = new Float32Array(tempList);
    let n = tempList.length/2;
    
    // bind the buffer object to gl
    gl.bindBuffer(gl.ARRAY_BUFFER, borderBuffer);
    // write data into the buffer object
    gl.bufferData(gl.ARRAY_BUFFER, borderVertices, gl.STATIC_DRAW);
    //Get the storage location of a_Position, assign and enable buffer
    a_Position = gl.getAttribLocation(gl.program, 'a_Position');
    if (a_Position < 0) {
      console.log('Failed to get the storage location of a_Position');
      return -1;
    }
    gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_Position);  // Enable the assignment of the buffer object
  
    return n;
  }

function resetPosition(xformMatrix){
    // transforom the vertex_pos when the graph is stoped
    // transform the vertex_pos according to transformation matrix
    for(let i=0;i<vertex_pos.length;i++){
        let tempv = new Vector4([vertex_pos[i][0],vertex_pos[i][1],vertex_pos[i][2],1]);
        tempv = xformMatrix.multiplyVector4(tempv);
        vertex_pos[i] = [tempv.elements[0],tempv.elements[1],tempv.elements[2]];
    }
}