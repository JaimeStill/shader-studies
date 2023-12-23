#ifdef GL_ES
    precision mediump float;
#endif

uniform vec2 u_resolution;

void main() {
    vec2 uv = (gl_FragCoord.xy * 2.0 - u_resolution.xy) / u_resolution.y;

    float d = length(uv);
    d -= 0.5;
    d = abs(d);

    gl_FragColor = vec4(d, 0.0, 0.0, 1.0);
}