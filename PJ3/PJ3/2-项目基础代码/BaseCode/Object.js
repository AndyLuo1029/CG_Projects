
"use strict";
class ObjectLoader {
  constructor(entity, config) {
    this.gl = config.gl;
    this.entity = entity;
  }

  init() {

    this.initShaders();

    this.initPerspective();

    this.g_objDoc = null;      // The information of OBJ file
    this.g_drawingInfo = null; // The information for drawing 3D model


    // Prepare empty buffer objects for vertex coordinates, colors, and normals
    this.initBuffers();
    if (!this.buffers) {
      console.log('Failed to set the vertex information');
      return;
    }

    // Start reading the OBJ file
    this.readOBJFile(`${this.entity.objFilePath}`, this.buffers, 1, true);

    return this;
  }

  initShaders() {
    // Vertex shader program
    let VSHADER_SOURCE = `
        attribute vec4 a_Position;
        attribute vec4 a_Color;
        attribute vec4 a_Normal;
        uniform mat4 u_MvpMatrix;
        uniform mat4 u_ModelMatrix;
        uniform mat4 u_NormalMatrix;
        uniform vec3 u_Color;
        varying vec4 v_Color;
        varying vec3 varu_Color;
        varying vec3 v_Normal;
        varying vec4 vertexPosition;
        void main() {
          gl_Position = u_MvpMatrix * a_Position;
          v_Color = a_Color;
          varu_Color = u_Color;
          v_Normal = normalize(vec3(u_NormalMatrix * a_Normal));
          vertexPosition = u_ModelMatrix * a_Position;            
        }`;

    // Fragment shader program
    let FSHADER_SOURCE = `
        #ifdef GL_ES
        precision mediump float;
        #endif
        uniform vec3 u_LightColor;
        uniform vec3 u_LightPosition;
        uniform vec3 u_AmbientLight;
        varying vec3 v_Normal;
        varying vec4 v_Color;
        varying vec3 varu_Color;
        uniform vec3 u_LightDirection;
        uniform int u_UseLight;
        varying vec4 vertexPosition;
        void main() {

          float nDotL = max(dot(u_LightDirection, v_Normal), 0.0);
          vec3 u_DiffuseLight = vec3(1.0, 1.0, 1.0);
          vec3 diffuse = u_DiffuseLight * varu_Color * nDotL;
          vec3 ambient = u_AmbientLight * varu_Color;

          if(u_UseLight == 1){
            vec3 normal = normalize(v_Normal);
            vec3 lightDirection = normalize(u_LightPosition - vec3(vertexPosition));
            float nDotL2 = max(dot(lightDirection, normal), 0.0);
            vec3 pointLight = u_LightColor * varu_Color * nDotL2;
            gl_FragColor = vec4(diffuse + ambient + pointLight, v_Color.a);
          }
          else{
            gl_FragColor = vec4(diffuse + ambient, v_Color.a);
          }
        }`;

    // Initialize shaders
    this.program = createProgram(this.gl, VSHADER_SOURCE, FSHADER_SOURCE);
    if (!this.program) {
      console.log('Failed to create program');
      return;
    }

    this.gl.enable(this.gl.DEPTH_TEST);

    // Get the storage locations of attribute and uniform variables
    this.a_Position = this.gl.getAttribLocation(this.program, 'a_Position');
    this.a_Color = this.gl.getAttribLocation(this.program, 'a_Color');
    this.a_Normal = this.gl.getAttribLocation(this.program, 'a_Normal');
    this.u_MvpMatrix = this.gl.getUniformLocation(this.program, 'u_MvpMatrix');
    this.u_NormalMatrix = this.gl.getUniformLocation(this.program, 'u_NormalMatrix');
    this.u_ModelMatrix = this.gl.getUniformLocation(this.program, 'u_ModelMatrix');
    this.u_LightColor = this.gl.getUniformLocation(this.program, 'u_LightColor');
    this.u_LightPosition = this.gl.getUniformLocation(this.program, 'u_LightPosition');
    this.u_UseLight = this.gl.getUniformLocation(this.program, 'u_UseLight');
    

    this.u_LightDirection = this.gl.getUniformLocation(this.program, 'u_LightDirection');
    this.u_AmbientLight = this.gl.getUniformLocation(this.program, 'u_AmbientLight');
    this.u_Color = this.gl.getUniformLocation(this.program, 'u_Color');

    this.gl.useProgram(this.program);
    this.gl.program = this.program;
  }

  initPerspective() {
    this.g_modelMatrix = new Matrix4();
    this.g_normalMatrix = new Matrix4();

    // animation
    this.modelMatrix = new Matrix4();
    this.lastTime = 0;
    this.angle = 0.0;
    this.ANGLE_STEP = 100.0;

    for (let t of this.entity.transform) {
      this.g_modelMatrix[t.type].apply(this.g_modelMatrix, t.content);
    }
  }

  initBuffers() {
    // Create a buffer object, assign it to attribute variables, and enable the assignment
    this.buffers = {
      vertexBuffer: this.gl.createBuffer(),
      normalBuffer: this.gl.createBuffer(),
      colorBuffer: this.gl.createBuffer(),
      indexBuffer: this.gl.createBuffer()
    };
  }

  readOBJFile(fileName, model, scale, reverse) {
    let request = new XMLHttpRequest();

    request.onreadystatechange = () => {
      if (request.readyState === 4 && (request.status == 200 || request.status == 0)) {
        this._onReadOBJFile(request.responseText, fileName, model, scale, reverse);
      }
    };
    request.open('GET', fileName, true);
    request.send();
  }


  _onReadOBJFile(fileString, fileName, o, scale, reverse) {
    let objDoc = new OBJDoc(fileName);  // Create a OBJDoc object
    let result = objDoc.parse(fileString, scale, reverse); // Parse the file
    if (!result) {
      this.g_objDoc = null;
      this.g_drawingInfo = null;
      console.log("OBJ file parsing error.");
      return;
    }
    this.g_objDoc = objDoc;
  }

  render(timestamp, useLight) {
    this.gl.useProgram(this.program);
    this.gl.program = this.program;

    if (this.g_objDoc != null && this.g_objDoc.isMTLComplete()) {
      this.onReadComplete();
    }
    if (!this.g_drawingInfo) return;

    if (this.hasOwnProperty('nextFrame')) {
      this.nextFrame(timestamp);
      this.initPerspective();
    }

    let lightDirection = new Vector3(sceneDirectionLight);
    lightDirection.normalize();
    this.gl.uniform3fv(this.u_LightDirection, lightDirection.elements);
    this.gl.uniform1i(this.u_UseLight, useLight);
    this.gl.uniform3fv(this.u_AmbientLight, new Vector3(sceneAmbientLight).elements);
    this.gl.uniform3f(this.u_LightColor, scenePointLightColor[0],scenePointLightColor[1],scenePointLightColor[2]);
    this.gl.uniform3f(this.u_LightPosition, Camera.eye.elements[0], Camera.eye.elements[1], Camera.eye.elements[2]);

    this.gl.uniform3fv(this.u_Color, new Vector3(this.entity.color).elements);

    this.g_normalMatrix.setInverseOf(this.g_modelMatrix);
    this.g_normalMatrix.transpose();
    this.gl.uniformMatrix4fv(this.u_NormalMatrix, false, this.g_normalMatrix.elements);
    this.gl.uniformMatrix4fv(this.u_ModelMatrix, false, this.g_modelMatrix.elements);

    let g_mvpMatrix = Camera.getMatrix();
    g_mvpMatrix.concat(this.g_modelMatrix);

    if (this.entity.objFilePath.indexOf('bird') > 0) {
      // animation
      // get angle by timestamp
      this.elapsed = timestamp - this.lastTime;
      this.lastTime = timestamp;
      // Update the current rotation angle (adjusted by the elapsed time)
      this.angle = this.angle + (this.ANGLE_STEP * this.elapsed) / 1000.0;
      this.angle %= 360;

      // Set the rotation matrix
      this.modelMatrix.setRotate(this.angle, 0, 1, 0);
      this.modelMatrix.translate(1,Math.sin(this.angle * Math.PI/360), 2);
      g_mvpMatrix.concat(this.modelMatrix);
    }

    this.gl.uniformMatrix4fv(this.u_MvpMatrix, false, g_mvpMatrix.elements);

    // Draw
    this.gl.drawElements(this.gl.TRIANGLES, this.g_drawingInfo.indices.length, this.gl.UNSIGNED_SHORT, 0);
  }

  onReadComplete() {
    // Acquire the vertex coordinates and colors from OBJ file
    this.g_drawingInfo = this.g_objDoc.getDrawingInfo();

    // Write date into the buffer object
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffers.vertexBuffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, this.g_drawingInfo.vertices, this.gl.STATIC_DRAW);

    this.gl.vertexAttribPointer(this.a_Position, 3, this.gl.FLOAT, false, 0, 0);
    this.gl.enableVertexAttribArray(this.a_Position);


    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffers.normalBuffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, this.g_drawingInfo.normals, this.gl.STATIC_DRAW);

    this.gl.vertexAttribPointer(this.a_Normal, 3, this.gl.FLOAT, false, 0, 0);
    this.gl.enableVertexAttribArray(this.a_Normal);


    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffers.colorBuffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, this.g_drawingInfo.colors, this.gl.STATIC_DRAW);

    this.gl.vertexAttribPointer(this.a_Color, 4, this.gl.FLOAT, false, 0, 0);
    this.gl.enableVertexAttribArray(this.a_Color);

    // Write the indices to the buffer object
    this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.buffers.indexBuffer);
    this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, this.g_drawingInfo.indices, this.gl.STATIC_DRAW);

  }
}
