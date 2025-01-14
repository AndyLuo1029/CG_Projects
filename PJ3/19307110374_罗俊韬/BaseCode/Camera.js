"use strict";

class Camera {
  static init() {
    Camera.state = {
      posUp: 0, posDown: 0, posLeft: 0, posRight: 0,
      rotUp: 0, rotDown: 0, rotLeft: 0, rotRight: 0,
    };
    Camera.at = new Vector3(CameraPara.at);
    Camera.eye = new Vector3(CameraPara.eye);
    Camera.up = new Vector3(CameraPara.up);
    Camera.fov = CameraPara.fov;
    Camera.near = CameraPara.near;
    Camera.far = CameraPara.far;
  }

  static getMatrix() {
    return new Matrix4()
        .setPerspective(Camera.fov, 1, Camera.near, Camera.far)
        .lookAt(Camera.eye.elements[0], Camera.eye.elements[1], Camera.eye.elements[2],
            Camera.at.elements[0], Camera.at.elements[1], Camera.at.elements[2],
            Camera.up.elements[0], Camera.up.elements[1], Camera.up.elements[2]);
  }

  static move(x, y , position_text,lookat_text) {
    let v = VectorMinus(Camera.eye, Camera.at).normalize();
    let w = VectorCross(v, Camera.up);
    console.log(v + '-----' + w);
    v = VectorMultNum(v, x);
    w = VectorMultNum(w, y);
    v = VectorAdd(v, w);
    Camera.at = VectorMinus(Camera.at, v);
    Camera.eye = VectorMinus(Camera.eye, v);
    position_text.innerHTML = 'position:<b> (' + Camera.eye.elements[0].toFixed(1) + ',' +  Camera.eye.elements[1].toFixed(1) + ',' +  Camera.eye.elements[2].toFixed(1) +')</b>';
    lookat_text.innerHTML = 'look at:<b>(' + Camera.at.elements[0].toFixed(1) + ',' +  Camera.at.elements[1].toFixed(1) + ',' +  Camera.at.elements[2].toFixed(1) +')</b>';
  }

  static rotate(x, y, position_text,lookat_text) {
    let v = VectorMinus(Camera.at, Camera.eye);

    let w = VectorCross(v, Camera.up);
    let up1 = VectorMultNum(Camera.up, -x);
    Camera.at = VectorMinus(Camera.at, up1);
    let right1 = VectorMultNum(w, y)
    Camera.at = VectorAdd(Camera.at, right1);
    v = VectorMinus(Camera.at, Camera.eye);
    Camera.at = VectorAdd(Camera.eye, v.normalize());
    Camera.up = VectorCross(w, v).normalize();
    position_text.innerHTML = 'position:<b> (' + Camera.eye.elements[0].toFixed(1) + ',' +  Camera.eye.elements[1].toFixed(1) + ',' +  Camera.eye.elements[2].toFixed(1) +')</b>';
    lookat_text.innerHTML = 'look at:<b>(' + Camera.at.elements[0].toFixed(1) + ',' +  Camera.at.elements[1].toFixed(1) + ',' +  Camera.at.elements[2].toFixed(1) +')</b>';
  }
}