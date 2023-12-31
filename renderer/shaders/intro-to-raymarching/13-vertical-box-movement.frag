#ifdef GL_ES
precision mediump float;
#endif

uniform vec2 u_resolution;
uniform vec3 u_mouse;
uniform float u_time;

mat2 rot2D(float angle) {
    float s = sin(angle);
    float c = cos(angle);
    return mat2(c, -s, s, c);
}

float sdSphere(vec3 p, float s) {
    return length(p) - s;
}

float sdBox(vec3 p, vec3 b) {
    vec3 q = abs(p) - b;

    return length(max(q, 0.0)) + min(max(q.x, max(q.y, q.z)), 0.0);
}

float smin(float d1, float d2, float k) {
    float h = clamp(0.5 + 0.5 * (d2 - d1) / k, 0.0, 1.0);
    return mix(d2, d1, h) - k * h * (1.0 - h);
}

float map(vec3 p) {
    vec3 spherePos = vec3(sin(u_time) * 3.0, 0.0, 0.0);
    float sphere = sdSphere(p - spherePos, 1.0);

    vec3 q = p;

    q.y -= u_time * 0.4;

    q = fract(q) - 0.5;

    float box = sdBox(q, vec3(0.1));
    float ground = p.y + 0.75;

    return smin(ground, smin(sphere, box, 1.0), 0.5);
}

void main() {
    vec2 uv = (gl_FragCoord.xy * 2.0 - u_resolution.xy) / u_resolution.y;
    vec2 m = (u_mouse.xy * 2.0 - u_resolution.xy) / u_resolution.y;

    // initialization
    vec3 ro = vec3(0.0, 0.0, -3.0);
    vec3 rd = normalize(vec3(uv * 1.5, 1.0));
    vec3 col = vec3(0);

    float t = 0.0;

    if (u_mouse.z >= 0.0) {
        // vertical camera rotation
        ro.yz *= rot2D(-m.y);
        rd.yz *= rot2D(-m.y);

        // horizontal camera rotation
        ro.xz *= rot2D(-m.x);
        rd.xz *= rot2D(-m.x);
    }

    // ray marching
    for(int i = 0; i < 80; i++) {
        vec3 p = ro + rd * t;
        float d = map(p);

        t += d;

        if (d < 0.001 || t > 100.0) break;
    }

    // coloring
    col = vec3(t * 0.2);

    gl_FragColor = vec4(col, 1.0);
}