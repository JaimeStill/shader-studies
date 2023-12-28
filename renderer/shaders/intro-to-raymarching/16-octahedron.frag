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

float sdOctahedron(vec3 p, float s) {
    p = abs(p);
    return (p.x + p.y + p.z - s) * 0.57735027;
}

float map(vec3 p) {
    p.z += u_time * 0.4;

    p.xy = fract(p.xy) - 0.5;
    p.z = mod(p.z, 0.24) - 0.125;

    float box = sdOctahedron(p, 0.15);

    return box;
}

void main() {
    vec2 uv = (gl_FragCoord.xy * 2.0 - u_resolution.xy) / u_resolution.y;

    // initialization
    vec3 ro = vec3(0.0, 0.0, -3.0);
    vec3 rd = normalize(vec3(uv * 1.5, 1.0));
    vec3 col = vec3(0);

    float t = 0.0;

    // ray marching
    for(int i = 0; i < 80; i++) {
        vec3 p = ro + rd * t;
        float d = map(p);

        t += d;

        if (d < 0.001 || t > 100.0) break;
    }

    // coloring
    col = palette(t * 0.04);

    gl_FragColor = vec4(col, 1.0);
}