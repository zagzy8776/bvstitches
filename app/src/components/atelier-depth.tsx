import { useEffect, useRef } from "react";

type GL = WebGLRenderingContext;

type Mesh = {
  vertices: Float32Array;
  indices: Uint16Array;
};

type DrawMesh = Mesh & {
  color: [number, number, number];
};

const vertexShaderSource = `
attribute vec3 aPosition;
attribute vec3 aNormal;

uniform mat4 uProjection;
uniform mat4 uView;
uniform mat4 uModel;

varying vec3 vNormal;
varying vec3 vWorldPosition;

void main() {
  vec4 worldPosition = uModel * vec4(aPosition, 1.0);
  vWorldPosition = worldPosition.xyz;
  vNormal = normalize(mat3(uModel) * aNormal);
  gl_Position = uProjection * uView * worldPosition;
}
`;

const fragmentShaderSource = `
precision mediump float;

uniform vec3 uColor;
uniform vec3 uLightDirection;
uniform vec3 uCameraPosition;
uniform float uMetallic;

varying vec3 vNormal;
varying vec3 vWorldPosition;

void main() {
  vec3 normal = normalize(vNormal);
  vec3 lightDirection = normalize(uLightDirection);
  float diffuse = max(dot(normal, lightDirection), 0.0);
  float rim = pow(1.0 - max(dot(normal, normalize(uCameraPosition - vWorldPosition)), 0.0), 2.2);

  vec3 base = uColor * (0.2 + diffuse * 0.78);
  vec3 highlight = vec3(0.95, 0.82, 0.55) * rim * (0.12 + uMetallic * 0.3);

  gl_FragColor = vec4(base + highlight, 1.0);
}
`;

function compile(gl: GL, type: number, source: string) {
  const shader = gl.createShader(type);
  if (!shader) throw new Error("3D shader creation failed");
  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    throw new Error(gl.getShaderInfoLog(shader) || "3D shader compilation failed");
  }

  return shader;
}

function createProgram(gl: GL) {
  const program = gl.createProgram();
  if (!program) throw new Error("3D program creation failed");

  gl.attachShader(
    program,
    compile(gl, gl.VERTEX_SHADER, vertexShaderSource)
  );
  gl.attachShader(
    program,
    compile(gl, gl.FRAGMENT_SHADER, fragmentShaderSource)
  );
  gl.linkProgram(program);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    throw new Error(gl.getProgramInfoLog(program) || "3D program linking failed");
  }

  return program;
}

function normalize3(x: number, y: number, z: number) {
  const length = Math.hypot(x, y, z) || 1;
  return [x / length, y / length, z / length] as const;
}

function createLathe(profile: Array<[number, number]>, radialSegments = 48): Mesh {
  const vertices: number[] = [];
  const indices: number[] = [];

  for (let yIndex = 0; yIndex < profile.length; yIndex += 1) {
    const [radius, y] = profile[yIndex];
    const previous = profile[Math.max(0, yIndex - 1)];
    const next = profile[Math.min(profile.length - 1, yIndex + 1)];
    const slope = (next[0] - previous[0]) / Math.max(0.0001, next[1] - previous[1]);

    for (let radial = 0; radial < radialSegments; radial += 1) {
      const angle = (radial / radialSegments) * Math.PI * 2;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      const [nx, ny, nz] = normalize3(Math.cos(angle), -slope, Math.sin(angle));

      vertices.push(x, y, z, nx, ny, nz);
    }
  }

  const row = radialSegments;

  for (let yIndex = 0; yIndex < profile.length - 1; yIndex += 1) {
    for (let radial = 0; radial < radialSegments; radial += 1) {
      const nextRadial = (radial + 1) % radialSegments;
      const a = yIndex * row + radial;
      const b = yIndex * row + nextRadial;
      const c = (yIndex + 1) * row + radial;
      const d = (yIndex + 1) * row + nextRadial;
      indices.push(a, c, b, b, c, d);
    }
  }

  return {
    vertices: new Float32Array(vertices),
    indices: new Uint16Array(indices),
  };
}

function createSphere(
  radius: number,
  center: [number, number, number],
  widthSegments = 18,
  heightSegments = 12
): Mesh {
  const vertices: number[] = [];
  const indices: number[] = [];

  for (let y = 0; y <= heightSegments; y += 1) {
    const v = y / heightSegments;
    const phi = v * Math.PI;

    for (let x = 0; x <= widthSegments; x += 1) {
      const u = x / widthSegments;
      const theta = u * Math.PI * 2;
      const nx = Math.sin(phi) * Math.cos(theta);
      const ny = Math.cos(phi);
      const nz = Math.sin(phi) * Math.sin(theta);

      vertices.push(
        center[0] + nx * radius,
        center[1] + ny * radius,
        center[2] + nz * radius,
        nx,
        ny,
        nz
      );
    }
  }

  for (let y = 0; y < heightSegments; y += 1) {
    for (let x = 0; x < widthSegments; x += 1) {
      const row = widthSegments + 1;
      const a = y * row + x;
      const b = a + 1;
      const c = (y + 1) * row + x;
      const d = c + 1;
      indices.push(a, c, b, b, c, d);
    }
  }

  return {
    vertices: new Float32Array(vertices),
    indices: new Uint16Array(indices),
  };
}

function createTorus(
  majorRadius: number,
  minorRadius: number,
  centerY: number,
  radialSegments = 64,
  tubeSegments = 12
): Mesh {
  const vertices: number[] = [];
  const indices: number[] = [];

  for (let radial = 0; radial < radialSegments; radial += 1) {
    const theta = (radial / radialSegments) * Math.PI * 2;

    for (let tube = 0; tube < tubeSegments; tube += 1) {
      const phi = (tube / tubeSegments) * Math.PI * 2;
      const cosPhi = Math.cos(phi);
      const sinPhi = Math.sin(phi);
      const ringRadius = majorRadius + minorRadius * cosPhi;

      const x = Math.cos(theta) * ringRadius;
      const y = centerY + minorRadius * sinPhi;
      const z = Math.sin(theta) * ringRadius;

      const nx = Math.cos(theta) * cosPhi;
      const ny = sinPhi;
      const nz = Math.sin(theta) * cosPhi;

      vertices.push(x, y, z, nx, ny, nz);
    }
  }

  for (let radial = 0; radial < radialSegments; radial += 1) {
    const nextRadial = (radial + 1) % radialSegments;

    for (let tube = 0; tube < tubeSegments; tube += 1) {
      const nextTube = (tube + 1) % tubeSegments;
      const a = radial * tubeSegments + tube;
      const b = nextRadial * tubeSegments + tube;
      const c = radial * tubeSegments + nextTube;
      const d = nextRadial * tubeSegments + nextTube;
      indices.push(a, b, c, c, b, d);
    }
  }

  return {
    vertices: new Float32Array(vertices),
    indices: new Uint16Array(indices),
  };
}

function perspective(fov: number, aspect: number, near: number, far: number) {
  const f = 1 / Math.tan(fov / 2);
  const nf = 1 / (near - far);

  return new Float32Array([
    f / aspect, 0, 0, 0,
    0, f, 0, 0,
    0, 0, (far + near) * nf, -1,
    0, 0, (2 * far * near) * nf, 0,
  ]);
}

function identityMatrix() {
  return new Float32Array([
    1, 0, 0, 0,
    0, 1, 0, 0,
    0, 0, 1, 0,
    0, 0, 0, 1,
  ]);
}

function multiplyMatrix(a: Float32Array, b: Float32Array) {
  const out = new Float32Array(16);

  for (let column = 0; column < 4; column += 1) {
    for (let row = 0; row < 4; row += 1) {
      out[column * 4 + row] =
        a[row] * b[column * 4] +
        a[4 + row] * b[column * 4 + 1] +
        a[8 + row] * b[column * 4 + 2] +
        a[12 + row] * b[column * 4 + 3];
    }
  }

  return out;
}

function translationMatrix(x: number, y: number, z: number) {
  const matrix = identityMatrix();
  matrix[12] = x;
  matrix[13] = y;
  matrix[14] = z;
  return matrix;
}

function rotationX(angle: number) {
  const c = Math.cos(angle);
  const s = Math.sin(angle);

  return new Float32Array([
    1, 0, 0, 0,
    0, c, s, 0,
    0, -s, c, 0,
    0, 0, 0, 1,
  ]);
}

function rotationY(angle: number) {
  const c = Math.cos(angle);
  const s = Math.sin(angle);

  return new Float32Array([
    c, 0, -s, 0,
    0, 1, 0, 0,
    s, 0, c, 0,
    0, 0, 0, 1,
  ]);
}

function rotationZ(angle: number) {
  const c = Math.cos(angle);
  const s = Math.sin(angle);

  return new Float32Array([
    c, s, 0, 0,
    -s, c, 0, 0,
    0, 0, 1, 0,
    0, 0, 0, 1,
  ]);
}

function scaleMatrix(x: number, y: number, z: number) {
  return new Float32Array([
    x, 0, 0, 0,
    0, y, 0, 0,
    0, 0, z, 0,
    0, 0, 0, 1,
  ]);
}

function modelMatrix(
  position: [number, number, number],
  rotation: [number, number, number],
  scale: [number, number, number]
) {
  let matrix = translationMatrix(...position);
  matrix = multiplyMatrix(matrix, rotationY(rotation[1]));
  matrix = multiplyMatrix(matrix, rotationX(rotation[0]));
  matrix = multiplyMatrix(matrix, rotationZ(rotation[2]));
  matrix = multiplyMatrix(matrix, scaleMatrix(...scale));
  return matrix;
}

function inverseCameraZ(z: number) {
  return translationMatrix(0, 0, -z);
}

export function AtelierDepth() {
  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const targetRotation = useRef({ x: 0.08, y: -0.12 });
  const currentRotation = useRef({ x: 0.08, y: -0.12 });

  useEffect(() => {
    const stage = stageRef.current;
    const canvas = canvasRef.current;
    if (!stage || !canvas) return;

    const gl = canvas.getContext("webgl", {
      alpha: true,
      antialias: true,
      premultipliedAlpha: true,
    });

    if (!gl) {
      stage.dataset.webglUnavailable = "true";
      return;
    }

    let program: WebGLProgram;

    try {
      program = createProgram(gl);
    } catch {
      stage.dataset.webglUnavailable = "true";
      return;
    }

    const positionLocation = gl.getAttribLocation(program, "aPosition");
    const normalLocation = gl.getAttribLocation(program, "aNormal");
    const projectionLocation = gl.getUniformLocation(program, "uProjection");
    const viewLocation = gl.getUniformLocation(program, "uView");
    const modelLocation = gl.getUniformLocation(program, "uModel");
    const colorLocation = gl.getUniformLocation(program, "uColor");
    const lightLocation = gl.getUniformLocation(program, "uLightDirection");
    const cameraLocation = gl.getUniformLocation(program, "uCameraPosition");
    const metallicLocation = gl.getUniformLocation(program, "uMetallic");

    const profile: Array<[number, number]> = [
      [0.52, -1.55],
      [0.60, -1.32],
      [0.68, -1.08],
      [0.66, -0.72],
      [0.70, -0.36],
      [0.76, 0.05],
      [0.82, 0.36],
      [1.00, 0.72],
      [1.18, 1.02],
      [1.12, 1.28],
      [0.72, 1.43],
      [0.42, 1.62],
    ];

    const mannequin = createLathe(profile);
    const tape = createTorus(0.67, 0.026, -0.32);
    const shoulderTape = createTorus(0.85, 0.018, 0.38);

    const buttons: Mesh[] = [
      createSphere(0.075, [0, 0, 0], 18, 12),
      createSphere(0.075, [0, 0, 0], 18, 12),
      createSphere(0.075, [0, 0, 0], 18, 12),
      createSphere(0.075, [0, 0, 0], 18, 12),
      createSphere(0.075, [0, 0, 0], 18, 12),
      createSphere(0.075, [0, 0, 0], 18, 12),
    ];

    const floor = createLathe(
      [
        [1.75, -1.68],
        [2.4, -1.66],
      ],
      64
    );

    const meshes: Array<{ mesh: Mesh; color: [number, number, number]; metallic: number }> = [
      { mesh: floor, color: [0.06, 0.09, 0.14], metallic: 0.1 },
      { mesh: mannequin, color: [0.035, 0.075, 0.13], metallic: 0.18 },
      { mesh: tape, color: [0.70, 0.55, 0.27], metallic: 0.78 },
      { mesh: shoulderTape, color: [0.44, 0.34, 0.17], metallic: 0.5 },
      ...buttons.map((mesh) => ({
        mesh,
        color: [0.78, 0.65, 0.36] as [number, number, number],
        metallic: 0.9,
      })),
    ];

    const buffers = meshes.map(({ mesh }) => {
      const vertexBuffer = gl.createBuffer();
      const indexBuffer = gl.createBuffer();

      gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, mesh.vertices, gl.STATIC_DRAW);

      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, mesh.indices, gl.STATIC_DRAW);

      return {
        indexBuffer,
        vertexBuffer,
        count: mesh.indices.length,
      };
    });

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    let animationFrame = 0;
    let destroyed = false;
    let stageRect = stage.getBoundingClientRect();

    const pointerMove = (event: PointerEvent) => {
      if (reduceMotion) return;
      stageRect = stage.getBoundingClientRect();
      const x = (event.clientX - stageRect.left) / Math.max(stageRect.width, 1) - 0.5;
      const y = (event.clientY - stageRect.top) / Math.max(stageRect.height, 1) - 0.5;
      targetRotation.current.y = x * 0.56;
      targetRotation.current.x = 0.12 - y * 0.22;
    };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const width = Math.max(1, Math.round(canvas.clientWidth * dpr));
      const height = Math.max(1, Math.round(canvas.clientHeight * dpr));

      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }

      gl.viewport(0, 0, width, height);
      stageRect = stage.getBoundingClientRect();
    };

    const renderMesh = (
      buffer: (typeof buffers)[number],
      matrix: Float32Array,
      color: [number, number, number],
      metallic: number
    ) => {
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer.vertexBuffer);
      gl.enableVertexAttribArray(positionLocation);
      gl.vertexAttribPointer(positionLocation, 3, gl.FLOAT, false, 24, 0);
      gl.enableVertexAttribArray(normalLocation);
      gl.vertexAttribPointer(normalLocation, 3, gl.FLOAT, false, 24, 12);

      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffer.indexBuffer);

      gl.uniformMatrix4fv(modelLocation, false, matrix);
      gl.uniform3fv(colorLocation, color);
      gl.uniform1f(metallicLocation, metallic);

      gl.drawElements(gl.TRIANGLES, buffer.count, gl.UNSIGNED_SHORT, 0);
    };

    const draw = (now: number) => {
      if (destroyed) return;

      resize();

      const width = canvas.clientWidth || 1;
      const height = canvas.clientHeight || 1;
      const aspect = width / Math.max(1, height);

      currentRotation.current.x +=
        (targetRotation.current.x - currentRotation.current.x) * 0.055;
      currentRotation.current.y +=
        (targetRotation.current.y - currentRotation.current.y) * 0.055;

      if (!reduceMotion) {
        targetRotation.current.y += Math.sin(now * 0.00035) * 0.00045;
      }

      gl.clearColor(0, 0, 0, 0);
      gl.clearDepth(1);
      gl.enable(gl.DEPTH_TEST);
      gl.depthFunc(gl.LEQUAL);
      gl.enable(gl.CULL_FACE);
      gl.cullFace(gl.BACK);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

      gl.useProgram(program);

      const projection = perspective(
        Math.PI / 3.2,
        aspect,
        0.1,
        100
      );
      const view = inverseCameraZ(5.4);

      gl.uniformMatrix4fv(projectionLocation, false, projection);
      gl.uniformMatrix4fv(viewLocation, false, view);
      gl.uniform3f(lightLocation, -0.45, 0.85, 0.58);
      gl.uniform3f(cameraLocation, 0, 0, 5.4);

      const masterRotation: [number, number, number] = [
        currentRotation.current.x,
        currentRotation.current.y,
        0,
      ];

      const floorMatrix = modelMatrix(
        [0, -0.02, 0],
        [0, 0, 0],
        [1, 1, 1]
      );

      renderMesh(
        buffers[0],
        floorMatrix,
        meshes[0].color,
        meshes[0].metallic
      );

      const mannequinMatrix = modelMatrix(
        [0, 0.02, 0],
        masterRotation,
        [1.2, 1.2, 1.2]
      );

      renderMesh(
        buffers[1],
        mannequinMatrix,
        meshes[1].color,
        meshes[1].metallic
      );

      const tapeMatrix = modelMatrix(
        [0, 0, 0],
        [0, currentRotation.current.y * 0.55, 0],
        [1.2, 1.2, 1.2]
      );

      renderMesh(
        buffers[2],
        tapeMatrix,
        meshes[2].color,
        meshes[2].metallic
      );

      const shoulderMatrix = modelMatrix(
        [0, 0, 0],
        [0, currentRotation.current.y * 0.4, 0],
        [1.2, 1.2, 1.2]
      );

      renderMesh(
        buffers[3],
        shoulderMatrix,
        meshes[3].color,
        meshes[3].metallic
      );

      for (let buttonIndex = 0; buttonIndex < buttons.length; buttonIndex += 1) {
        const button = buttons[buttonIndex];
        const side = buttonIndex < 3 ? 1 : -1;
        const row = buttonIndex % 3;

        const matrix = multiplyMatrix(
          translationMatrix(
            side * 0.05,
            0,
            0
          ),
          mannequinMatrix
        );

        const extraRotation = rotationY(side * 0.08);
        const centered = multiplyMatrix(matrix, extraRotation);
        const buttonMatrix = multiplyMatrix(
          centered,
          translationMatrix(0, -row * 0.33 + 0.72, 0.72)
        );

        renderMesh(
          buffers[4 + buttonIndex],
          buttonMatrix,
          meshes[4 + buttonIndex].color,
          meshes[4 + buttonIndex].metallic
        );
      }

      animationFrame = requestAnimationFrame(draw);
    };

    stage.addEventListener("pointermove", pointerMove, { passive: true });
    window.addEventListener("resize", resize);

    resize();
    animationFrame = requestAnimationFrame(draw);

    return () => {
      destroyed = true;
      cancelAnimationFrame(animationFrame);
      stage.removeEventListener("pointermove", pointerMove);
      window.removeEventListener("resize", resize);

      buffers.forEach(({ indexBuffer, vertexBuffer }) => {
        gl.deleteBuffer(indexBuffer);
        gl.deleteBuffer(vertexBuffer);
      });

      gl.deleteProgram(program);
    };
  }, []);

  return (
    <div
      ref={stageRef}
      className="atelier-depth"
      aria-label="Interactive BV Stitches three dimensional atelier sculpture"
    >
      <canvas ref={canvasRef} className="depth-webgl" aria-hidden="true" />
      <div className="depth-vignette" aria-hidden="true" />
      <div className="depth-grid" aria-hidden="true" />
      <div className="depth-mark" aria-hidden="true">BV / 3D ATELIER</div>
      <div className="depth-caption" aria-hidden="true">
        Tailoring / Form / Dimension
      </div>
      <div className="depth-live" aria-hidden="true">
        <span />
        Interactive 3D study
      </div>
    </div>
  );
}
