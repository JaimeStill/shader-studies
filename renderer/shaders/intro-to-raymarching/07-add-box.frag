#ifdef GL_ES
precision mediump float;
#endif

uniform vec2 u_resolution;
uniform float u_time;

float sdSphere(vec3 p, float s) {
    return length(p) - s;
}

float sdBox(vec3 p, vec3 b) {
    vec3 q = abs(p) - b;

    return length(max(q, 0.0)) + min(max(q.x, max(q.y, q.z)), 0.0);
}

float map(vec3 p) {
    vec3 spherePos = vec3(sin(u_time * 3.0), 0.0, 0.0);
    float sphere = sdSphere(p - spherePos, 1.0);
    float box = sdBox(p, vec3(0.75));

    return min(sphere, box);
}

void main() {
    vec2 uv = (gl_FragCoord.xy * 2.0 - u_resolution.xy) / u_resolution.y;

    // initialization
    vec3 ro = vec3(0.0, 0.0, -3.0);
    vec3 rd = normalize(vec3(uv * 0.7, 1.0));
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
    col = vec3(t * 0.2);

    gl_FragColor = vec4(col, 1.0);
}