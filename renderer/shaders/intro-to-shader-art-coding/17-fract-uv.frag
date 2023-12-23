#ifdef GL_ES
    precision mediump float;
#endif

uniform vec2 u_resolution;
uniform float u_time;

vec3 palette(float t) {
    vec3 a = vec3(0.5, 0.5, 0.5);
    vec3 b = vec3(0.5, 0.5, 0.5);
    vec3 c = vec3(1.0, 1.0, 1.0);
    vec3 d = vec3(0.263, 0.416, 0.557);

    return a + b * cos(6.28318 * (c * t + d));
}

void main() {
    vec2 uv = (gl_FragCoord.xy * 2.0 - u_resolution.xy) / u_resolution.y;
    uv = fract(uv);
    float d = length(uv);
    vec3 col = palette(d);

    d = sin(d * 8.0 + u_time) / 8.0;
    d = abs(d);
    d = 0.02/d;

    col *= d;

    gl_FragColor = vec4(uv, 0.0, 1.0);
}