/*
===================
original functions
===================
*/

//该函数在一个canvas上绘制一个点
//其中cxt是从canvas中获得的一个2d上下文context
//    x,y分别是该点的横纵坐标
//    color是表示颜色的整形数组，形如[r,g,b]
//    color在这里会本转化为表示颜色的字符串，其内容也可以是：
//        直接用颜色名称:   "red" "green" "blue"
//        十六进制颜色值:   "#EEEEFF"
//        rgb分量表示形式:  "rgb(0-255,0-255,0-255)"
//        rgba分量表示形式:  "rgba(0-255,1-255,1-255,透明度)"
//由于canvas本身没有绘制单个point的接口，所以我们通过绘制一条短路径替代
function drawPoint(cxt,x,y, color){
    //建立一条新的路径
    cxt.beginPath();
    //设置画笔的颜色
    cxt.strokeStyle ="rgb("+color[0] + "," +
                            +color[1] + "," +
                            +color[2] + ")" ;
    //设置路径起始位置
    cxt.moveTo(x,y);
    //在路径中添加一个节点
    cxt.lineTo(x+1,y+1);
    //用画笔颜色绘制路径
    cxt.stroke();
}

//绘制线段的函数绘制一条从(x1,y1)到(x2,y2)的线段，cxt和color两个参数意义与绘制点的函数相同，
function drawLine(cxt,x1,y1,x2,y2,color){
    cxt.beginPath();
    cxt.strokeStyle ="rgba("+color[0] + "," +
                            +color[1] + "," +
                            +color[2] + "," +
                            +255 + ")" ;
    //这里线宽取1会有色差，但是类似半透明的效果有利于debug，取2效果较好
    cxt.lineWidth = 2;
    cxt.moveTo(x1, y1);
    cxt.lineTo(x2, y2);
    cxt.stroke();
}

var c=document.getElementById("myCanvas");
var cxt=c.getContext("2d");

//将canvas坐标整体偏移0.5，用于解决宽度为1个像素的线段的绘制问题，具体原理详见project文档
cxt.translate(0.5, 0.5); 

// Initiate the canvas according to config.js

cxt.width = c.width = canvasSize['maxX'];
cxt.height = c.height = canvasSize['maxY'];

/*
========================================
utility functions and data structure
========================================
*/

class edge {
    constructor(k, b, l, r) {
        this.k = k;
        this.b = b;
        // l and r is left and right endpoint of the line
        this.l = l;
        this.r = r;
    }
}

class rect {
    constructor(index, vIndex, vertices, edges){
        this.index = index;
        this.vIndex = vIndex;
        this.vertices = vertices;
        this.edges = edges;
    }
}

function calcDistance(x1,y1,x2,y2){
    return Math.sqrt(Math.pow((x1-x2),2)+Math.pow((y1-y2),2));
}

function calcSlope(left,right){
    let dy = right[1] - left[1];
    let dx = right[0] - left[0];
    return dy/dx;
}

function getRectVertices(RecIndex){
    let verticeIndexes = polygon[RecIndex];
    let vertices = [];
    for(let i of verticeIndexes){
       vertices.push(vertex_pos[i]); 
    }
    return vertices;
}

// input a rect's all vertices and output y range
function getTopBottom(vertices){
    let top = vertices[0][1];
    let bottom = vertices[0][1];
    for ( let v of vertices){
        top = Math.min(v[1], top);
        bottom = Math.max(v[1], bottom);
    }
    return [top, bottom];
}

// judge if a vertex is Extreme point or not
function judgeIfExtreme(vertex, edges){
    let checkList = [];
    for(let e of edges){
        if(e.l == vertex){
            checkList.push(e.r);
        }
        else if(e.r == vertex){
            checkList.push(e.l);
        }
    }

    if(checkList.length!=2){
        alert("Wrong checkList!");
    }
    
    if((checkList[0][1]>vertex[1]&&checkList[1][1]>vertex[1]) ||
    (checkList[0][1]<vertex[1]&&checkList[1][1]<vertex[1])
    ){
        return true;
    }
    else return false;
}


/*
===================
functions for filling
all functions are designed to apply on a single rect
===================
*/

// calc edge
function calcEdge(vertices){
    // input a rect's all 4 vertex, return rect's edge array
    let edges = []
    for(let i = 0;i < vertices.length;i++){
        let currentV = vertices[i];
        let nextV = vertices[(i+1)%POLY_EDGES];
        let l,r = undefined;
        if(currentV[0]<nextV[0]){
            l = currentV;
            r = nextV;
        }
        else {
            l = nextV;
            r = currentV;
        }
        // calc line slope
        let k = calcSlope(l,r);
        // calc b
        let b = l[1]-k*l[0];
        let tempedge = new edge(k, b, l, r);
        edges.push(tempedge);
    }
    return edges;
}

function calcIntersection(y, edges, vertices){
    // store all the intersection x value
    let intersecArr = [];
    for(let v of vertices){
        if(v[1] == y){
            // the vertex is on the scanning line
            if(judgeIfExtreme(v,edges)){
                // case1: the vertex is Extreme point, push it twice into the array
                intersecArr.push(v[0]);
                intersecArr.push(v[0]);
            }
            else{
                // case2: the vertex is not Extreme point, push it once into the array
                intersecArr.push(v[0]);
            }
        }
    }
    
    let xRange = undefined;
    // let intersectCount = 0;
    for(let e of edges){
        // if the scanline intersects with the edge, we will calculate a x-value between the line two endpoints
        if(isFinite(e.k) && e.k!=0) {
            xRange = [e.l[0], e.r[0]];
            // calc x by this y
            let tempX = (y-e.b)/e.k;
            if(tempX-xRange[0] > ACCURACY_RANGE && xRange[1] - tempX > ACCURACY_RANGE){
                intersecArr.push(tempX);
            }
        }
        else {
            // corner case: the line is vertical
            let topY = Math.min(e.l[1],e.r[1]);
            let bottomY = Math.max(e.l[1],e.r[1]);
            if(bottomY - y > ACCURACY_RANGE && y - topY > ACCURACY_RANGE){
                intersecArr.push(e.l[0]);
            }
        }
    }

    // return the sorted array in ascending order
    return intersecArr.sort(function(a,b){return a-b});
}

// draw the rect vertices
function drawVertex(x,y,r){
    cxt.strokeStyle="rgb("+0 + "," +
                            +0+ "," +
                            +0 + ")" ;
    cxt.fillStyle="#c203fc";
    cxt.beginPath();
    cxt.arc(x,y,r,0,Math.PI*2,true);
    cxt.fill();
    cxt.arc(x,y,r+1,0,Math.PI*2,true);
    cxt.stroke();
    cxt.closePath();
}

// draw one rect, input all its edges
function drawRect(rect){
    let range = getTopBottom(rect.vertices);
    let color = vertex_color[rect.vIndex[0]];
    for(let y=range[0];y<=range[1];y++){
        let intersect = calcIntersection(y, rect.edges, rect.vertices);
        for(let i=0;i<intersect.length;i+=2){
            drawLine(cxt, intersect[i], y, intersect[i+1], y, color);
        }
    }
}


/*
===================
functions for interactions
===================
*/

currentVertexIndex = undefined;

c.addEventListener('mousedown',function(event){
    let clickPosX = event.offsetX;
    let clickPosY = event.offsetY;
    for( let i=0;i<vertex_pos.length;i++){
        if(calcDistance(clickPosX,clickPosY,vertex_pos[i][0],vertex_pos[i][1]) <= VALID_RANGE){
            // the mousedown event is valid for some vertex
            currentVertexIndex = i;
            return;
        }
    }
});

c.addEventListener('mousemove', (event) => {
    // invalid mousemove event
    if (currentVertexIndex == undefined) return;
    // valid move, change the coordinate of vertex
    vertex_pos[currentVertexIndex] = [event.offsetX, event.offsetY, 0];
    draw(currentVertexIndex);
});

// reset the currentVertexIndex
c.addEventListener('mouseup', function(event){
    currentVertexIndex = undefined;
});

// reset the currentVertexIndex
c.addEventListener('mouseleave', function(event){
    currentVertexIndex = undefined;
});


/*
===================
   top functions
===================
*/

function draw(movingVertex){
    // clean the canvas
    cxt.clearRect(0, 0, canvasSize['maxX'], canvasSize['maxY']);
    
    // redraw rects
    if(movingVertex == undefined){
        // draw with default index order
        // default priority: 0 < 1 < 2 < 3
        for(let i=0; i<polygon.length; i++){
            let vertices = getRectVertices(i);
            let edges = calcEdge(vertices);
            let tempRect = new rect(i,polygon[i], vertices, edges);
            drawRect(tempRect);
        }
    }
    else{
        // redraw rects, but according to moving vertex
        // the changed ones have higher priority than others 
        // if the vertex influence more than 1 rect, the default priority is according to the index.
        let redraw = [];
        for(let i=0;i<polygon.length;i++){
            if(polygon[i].includes(movingVertex)){
                redraw.push(i);
            }
        }

        if(redraw.length == 0){
            alert("Invalid redraw array!");
        }

        // add unaffected rectangles indexes
        let unaff = [];
        for(let i=0; i<polygon.length; i++){
            if(!redraw.includes(i)){
                unaff.push(i);
            }
        }
        redraw = unaff.concat(redraw);

        for(let ind of redraw){
            let vertices = getRectVertices(ind);
            let edges = calcEdge(vertices);
            let tempRect = new rect(ind,polygon[ind], vertices, edges);
            drawRect(tempRect);
        }
    }
    

    // read all vertex and draw them
    for(let i=0; i<vertex_pos.length; i++){
        drawVertex(vertex_pos[i][0],vertex_pos[i][1],VALID_RANGE);
    }
}

draw();