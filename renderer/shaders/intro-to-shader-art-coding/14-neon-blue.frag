#ifdef GL_ES
    precision mediump float;
#endif

uniform vec2 u_resolution;
uniform float u_time;

void main() {
    vec2 uv = (gl_FragCoord.xy * 2.0 - u_resolution.xy) / u_resolution.y;
    float d = length(uv);
    vec3 col = vec3(1.0, 2.0, 3.0);

    d = sin(d * 8.0 + u_time) / 8.0;
    d = abs(d);
    d = 0.02/d;

    col *= d;

    gl_FragColor = vec4(col, 1.0);
}