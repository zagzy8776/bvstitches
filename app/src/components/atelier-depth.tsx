import { useEffect, useRef } from "react";

type GL = WebGLRenderingContext;

const HERO_IMAGE =
  "https://d2ol7oe51mr4n9.cloudfront.net/user_3JbltxQLnbF9eGRc79IWTBj1wRG/c4089901-ded9-4586-9770-334c8b8a4218.jpg";

const DETAIL_IMAGE =
  "https://d2ol7oe51mr4n9.cloudfront.net/user_3JbltxQLnbF9eGRc79IWTBj1wRG/f4d9144d-7725-4f4c-bf22-f10867657de2.jpg";

const TAPE_IMAGE =
  "https://d2ol7oe51mr4n9.cloudfront.net/user_3JbltxQLnbF9eGRc79IWTBj1wRG/46b4613e-bc7d-4d34-987b-5c59c1f08b26.jpg";

const vertex = `
attribute vec3 aPosition;
attribute vec2 aUv;
uniform float uTime;
uniform vec2 uPointer;
varying vec2 vUv;
void main(){
  vec3 p=aPosition;
  p.x += uPointer.x * 0.018;
  p.y += uPointer.y * 0.014;
  p.z += sin((p.x + uTime * 0.12) * 3.2) * 0.018;
  gl_Position=vec4(p,1.0);
  vUv=aUv;
}`;

const fragment = `
precision mediump float;
varying vec2 vUv;
uniform sampler2D uTexture;
uniform float uTime;
void main(){
  vec2 uv=vUv;
  uv.x += sin((uv.y*4.0+uTime*0.18))*0.003;
  uv.y += sin((uv.x*3.0+uv.y*2.0)+uTime*0.18)*0.002;
  vec4 tex=texture2D(uTexture,uv);
  float edge=min(min(uv.x,1.0-uv.x),min(uv.y,1.0-uv.y));
  float vignette=smoothstep(0.0,0.28,edge);
  gl_FragColor=vec4(tex.rgb,tex.a*vignette);
}`;

function compile(gl: GL, type: number, source: string) {
  const shader = gl.createShader(type);
  if (!shader) throw new Error("Shader creation failed");
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    throw new Error(gl.getShaderInfoLog(shader) || "Shader compile failed");
  }
  return shader;
}

export function AtelierDepth() {
  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cursorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stage = stageRef.current;
    const canvas = canvasRef.current;
    const cursor = cursorRef.current;
    if (!stage || !canvas) return;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    let raf = 0;
    let pointerX = 0;
    let pointerY = 0;
    let targetX = 0;
    let targetY = 0;

    const updatePointer = (event: PointerEvent) => {
      const rect = stage.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      targetX = (event.clientX - rect.left) / rect.width - 0.5;
      targetY = (event.clientY - rect.top) / rect.height - 0.5;
      if (cursor) {
        cursor.style.transform = `translate3d(${event.clientX - rect.left}px,${event.clientY - rect.top}px,0)`;
      }
    };

    stage.addEventListener("pointermove", updatePointer, { passive: true });

    const gl = canvas.getContext("webgl", { alpha: true, antialias: true });
    if (!gl) {
      return () => {
        stage.removeEventListener("pointermove", updatePointer);
      };
    }

    const program = gl.createProgram();
    if (!program) {
      stage.removeEventListener("pointermove", updatePointer);
      return;
    }

    const vertexShader = compile(gl, gl.VERTEX_SHADER, vertex);
    const fragmentShader = compile(gl, gl.FRAGMENT_SHADER, fragment);
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      stage.removeEventListener("pointermove", updatePointer);
      return;
    }

    gl.useProgram(program);

    const vertices = new Float32Array([
      -1,-1,0,0,1, 1,-1,0,1,1, 1,1,0,1,0,
      -1,-1,0,0,1, 1,1,0,1,0, -1,1,0,0,0,
    ]);

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    const position = gl.getAttribLocation(program, "aPosition");
    const uv = gl.getAttribLocation(program, "aUv");
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 3, gl.FLOAT, false, 20, 0);
    gl.enableVertexAttribArray(uv);
    gl.vertexAttribPointer(uv, 2, gl.FLOAT, false, 20, 12);

    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    const image = new Image();
    image.crossOrigin = "anonymous";
    image.src = HERO_IMAGE;

    image.onload = () => {
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        image
      );
    };

    image.onerror = () => {
      stage.dataset.depthImageFailed = "true";
    };

    const timeUniform = gl.getUniformLocation(program, "uTime");
    const pointerUniform = gl.getUniformLocation(program, "uPointer");
    const textureUniform = gl.getUniformLocation(program, "uTexture");

    if (textureUniform) gl.uniform1i(textureUniform, 0);

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const width = Math.round(canvas.clientWidth * dpr);
      const height = Math.round(canvas.clientHeight * dpr);
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }
      gl.viewport(0, 0, width, height);
    };

    const draw = (now: number) => {
      resize();

      if (!reduceMotion) {
        pointerX += (targetX - pointerX) * 0.055;
        pointerY += (targetY - pointerY) * 0.055;
        stage.style.setProperty("--mx", pointerX.toFixed(4));
        stage.style.setProperty("--my", pointerY.toFixed(4));
      }

      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

      if (timeUniform) gl.uniform1f(timeUniform, reduceMotion ? 0 : now * 0.001);
      if (pointerUniform) {
        gl.uniform2f(
          pointerUniform,
          reduceMotion ? 0 : pointerX,
          reduceMotion ? 0 : pointerY
        );
      }

      gl.drawArrays(gl.TRIANGLES, 0, 6);
      raf = requestAnimationFrame(draw);
    };

    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      stage.removeEventListener("pointermove", updatePointer);
      image.onload = null;
      image.onerror = null;
    };
  }, []);

  return (
    <div
      ref={stageRef}
      className="atelier-depth"
      aria-label="BV Stitches interactive atelier depth experience"
    >
      <canvas ref={canvasRef} className="depth-webgl" aria-hidden="true" />
      <div
        className="depth-image depth-base"
        style={{ backgroundImage: `url(${HERO_IMAGE})` }}
        aria-hidden="true"
      />
      <div
        className="depth-image depth-large"
        style={{ backgroundImage: `url(${DETAIL_IMAGE})` }}
        aria-hidden="true"
      />
      <div
        className="depth-image depth-center"
        style={{ backgroundImage: `url(${HERO_IMAGE})` }}
        aria-hidden="true"
      />
      <div
        className="depth-image depth-right"
        style={{ backgroundImage: `url(${TAPE_IMAGE})` }}
        aria-hidden="true"
      />
      <div
        className="depth-image depth-tape"
        style={{ backgroundImage: `url(${DETAIL_IMAGE})` }}
        aria-hidden="true"
      />
      <div
        className="depth-image depth-foreground"
        style={{ backgroundImage: `url(${HERO_IMAGE})` }}
        aria-hidden="true"
      />
      <div className="depth-vignette" aria-hidden="true" />
      <div ref={cursorRef} className="atelier-cursor" aria-hidden="true">
        <span />
      </div>
      <div className="depth-mark" aria-hidden="true">BV / 3D ATELIER</div>
      <div className="depth-caption" aria-hidden="true">Tailoring / Dimension / Detail</div>
    </div>
  );
}
