#ifdef GL_ES
    precision mediump float;
#endif

uniform vec2 u_resolution;
uniform float u_time;

void main() {
    vec2 uv = (gl_FragCoord.xy * 2.0 - u_resolution.xy) / u_resolution.y;

    float d = length(uv);
    d = sin(d * 8.0 + u_time) / 8.0;
    d = abs(d);
    d = smoothstep(0.0, 0.1, d);

    gl_FragColor = vec4(d, d, d, 1.0);
}