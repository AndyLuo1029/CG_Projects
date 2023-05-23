// shader for cube
"use strict";

class CubeLoader {

  constructor(entity, config) {
    this.entity = entity;
    this.gl = config.gl;
    this.enableLight = config.enableLight;
  }

  init() {
    this.initShaders();

    this.initVertexBuffers();

    this.initPerspective();

    return this;
  }

  initShaders() {
    // Vertex shader program
    var VSHADER_SOURCE =
        'attribute vec4 a_Position;\n' +
        'attribute vec4 a_Color;\n' +
        'uniform mat4 u_MvpMatrix;\n' +
        'varying vec4 v_Color;\n' +
        'void main() {\n' +
        '  gl_Position = u_MvpMatrix * a_Position;\n' +
        '  v_Color = a_Color;\n' +
        '}\n';

    // Fragment shader program
    var FSHADER_SOURCE =
        '#ifdef GL_ES\n' +
        'precision mediump float;\n' +
        '#endif\n' +
        'varying vec4 v_Color;\n' +
        'void main() {\n' +
        '  gl_FragColor = v_Color;\n' +
        '}\n';

    // Initialize shaders
    this.program = createProgram(this.gl, VSHADER_SOURCE, FSHADER_SOURCE);
    if (!this.program) {
      console.log('Failed to create program');
    }

    this.gl.useProgram(this.program);
    this.gl.program = this.program;
  }

initVertexBuffers() {
    
    this.verticesColors = new Float32Array(this.entity['vertex']);
    // Indices of the vertices
    this.indices = new Uint8Array(this.entity['index']);
    // Create a buffer object
    this.vertexColorBuffer = this.gl.createBuffer();
    this.indexBuffer = this.gl.createBuffer();
    if (!this.vertexColorBuffer || !this.indexBuffer) {
      console.log("init vertex buffer failed");
    }

    this.FSIZE = this.verticesColors.BYTES_PER_ELEMENT;
    // Assign the buffer object to a_Position and enable the assignment
    this.a_Position = this.gl.getAttribLocation(this.gl.program, 'a_Position');
    if(this.a_Position < 0) {
      console.log('Failed to get the storage location of a_Position');
    }
    
    // Assign the buffer object to a_Color and enable the assignment
    this.a_Color = this.gl.getAttribLocation(this.gl.program, 'a_Color');
    if(this.a_Color < 0) {
      console.log('Failed to get the storage location of a_Color');
    }

  }

  initPerspective() {
    this.gl.clearColor(0.0, 0.0, 0.0, 1.0);
    this.gl.enable(this.gl.DEPTH_TEST);

    // Get the storage location of u_MvpMatrix
    this.u_MvpMatrix = this.gl.getUniformLocation(this.gl.program, 'u_MvpMatrix');
    if (!this.u_MvpMatrix) { 
        console.log('Failed to get the storage location of u_MvpMatrix');
    }

    this.u_MvpMatrix = this.gl.getUniformLocation(this.program, 'u_MvpMatrix');
    this.g_modelMatrix = new Matrix4();
    this.g_modelMatrix.translate(this.entity.translate[0], this.entity.translate[1], this.entity.translate[2]);
    this.g_modelMatrix.scale(this.entity.scale[0], this.entity.scale[1], this.entity.scale[2]);
  }


  render() {
    // Draw the cube
    this.gl.useProgram(this.program);
    
    // Write the vertex coordinates and color to the buffer object
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexColorBuffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, this.verticesColors, this.gl.STATIC_DRAW);
    
    this.gl.vertexAttribPointer(this.a_Position, 3, this.gl.FLOAT, false, this.FSIZE * 6, 0);
    this.gl.enableVertexAttribArray(this.a_Position);

    this.gl.vertexAttribPointer(this.a_Color, 3, this.gl.FLOAT, false, this.FSIZE * 6, this.FSIZE * 3);
    this.gl.enableVertexAttribArray(this.a_Color);

    this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
    this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, this.indices, this.gl.STATIC_DRAW);

    // Set the eye point and the viewing volume
    this.mvpMatrix = Camera.getMatrix();
    this.mvpMatrix.concat(this.g_modelMatrix);

    // Pass the model view projection matrix to u_MvpMatrix
    this.gl.uniformMatrix4fv(this.u_MvpMatrix, false, this.mvpMatrix.elements);

    
    this.gl.uniformMatrix4fv(this.u_ModelMatrix, false, this.g_modelMatrix.elements);

    // Clear color and depth buffer
    // Draw the texture
    this.gl.drawElements(this.gl.TRIANGLES, this.indices.length, this.gl.UNSIGNED_BYTE, 0);
  }
}