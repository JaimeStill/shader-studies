# [Intro to Raymarching](https://youtu.be/khblXafu7iA)

## What is Rasterization?

Rasterization pipeline:

1. **Vertex shader** - transforms the vertices of each triangle from 3D world space into 2D screen space projections using the current camera position and orientation.
2. **Rasterization** - uses these screen space vertices to calculate which pixels of the screen, also called fragments, are actually part of the current triangle.
3. **Fragment shader** - processes each of these fragments to calculate their final color displayed on the screen, using information from vertices and external light sources to shade the pixel.

> This is an over-simplification of the 3D rendering pipeline. See [Basic 3D Theory](https://developer.mozilla.org/en-US/docs/Games/Techniques/3D_on_the_web/Basic_theory).

## What is Ray Marching?

All objects are generated procedurally and only uses two triangles. Everything from the camera to the scene is calculated in the Fragment shader.

For each pixel, the direction of a ray originating from the camera and passing through a canvas is calculated. These rays are used to calcluate the intersection with the scene and colorizes each pixel based on what they hit.

The term *ray marching* gets its name from the way it calculates the intersection between a ray and the scene. It uses distance functions to gradually step and march into a scene until an object is hit. They can be used to calculate the distance to every object in the given a position in space. The distance to the closest one is used to safely march the ray in its current direction while being sure not to overshoot any object. This process repeats until the closest distance becomes arbitrarily small, indicating an object has been hit; or the ray extends too far out, indicating nothing was hit.

## Shader Start

In traditional rasterization, the camera and objects are typically defined beforehand and sent as inputs to the rendering pipeline.

In ray marching, there is neither a camera or objects as everything is generated inside of the fragment shader. They will need to be created for each pixel.

The first step is to create a ray origin and direction for each pixel. In order to do so, constants are enumerated that will help represent objects in the world.

Three component vectors will be used to denote points in 3D space. The world's origin is the point located at `0,0,0`. Additionally, three orthogonal axes will form the basis of vector space. `x` and `y` should align with the `x` and `y` axes of the canvas, represented by the `uv` vector. The additional `z` axis will represent the depth from the canvas. These vectors don't actually need to be defined in code, they simply need to be visualized and understood to allow for a more intuitive way of building and interacting with the scene.

The **ray origin** vector, `ro`, corresponds to the camera's current position in the world. It is placed three units behind the origin along the negative `z` axis: `vec3 ro = vec3(0.0, 0.0, -3.0)`.

The **ray direction** vector, `rd`, represents the current pixel's ray direction, initially pointing straight in the `z` direction. Since all rays originate from the same point, giving them the same direction would result in them following identical paths and having the same color. To make each pixel's ray unique, the `uv` vector can be leveraged, which is in clip space directly as the `x` and `y` components of the ray direction. This works because it was decided that the world's origin should be aligned with the `uv` coordinates. This ensures each pixel has a unique ray direction spreading out from the center of the screen and effectively creating a virtual canvas to project the world to. Finally, the ray direction needs to be normalized. Normalization scales the vectors to ensure they all have a length of `1`, which is crucial for accurate distance calculations: `vec3 rd = normalize(vec3(uv, 1.0))`.

The **total distance** float indicates the distance the point has traveled from the camera's origin. This distance increments with each step, starting from `0` and will ultimately store the accumulated distance traveled by the ray across the world: `float t = 0.0`.

Creating a ray origin and travel distance can be seen as the initialization process, and is indicated as such with a comment.

## Ray Marching

The next part will involve the actual ray marching. One step of the algorithm will be defined that will be iterated using a loop until an object is hit. The primary interest lies in determining the position of the current marching point rather than just its distance from the camera.

Calculating the position at each step is straightforward using the current variables. The point, `p`, will initialize at the ray's origin, `ro`, and adds to it the ray direction, `rd`, times the distance traveled, `t`: `vec3 p = ro + rd * t`. This gives a 3D point representing the current position along the ray based on its distance from the ray's origin.

`p` can then be used to compute the distance to the closest object in the scene. It is initially started at the ray origin as `t` is initialized to `0`. Signed distance functions, SDFs, will be used to obtain the distance from a given point in space to a particular shape in the scene.

> Check Inigo Quilez article on [3D Signed Distance Functions](https://iquilezles.org/articles/distfunctions/), which proivdes useful functions and tricks related to ray marching.

To define the objects in the scene, a function is created that takes a 3D point as input and returns the distance to the nearest object in the scene:

```glsl
float map(vec3 p) {
    // distance to a sphere of radius 1
    return length(p) - 1.0;
}
```

For now, this only returns the distance to a single sphere of radius `1.0` located at the origin. This can then be used to get the distance to the scene given the current position along the ray, stored in a new variable `d`: `float d = map(p)`. This value represents the safe distance the point can travel to in any direction without oversteppin an object.

Finally, this distance needs to be added to the variable that keeps track of the total distance traveled from the ray's origin: this is the step where the ray is marched. `t += d`.

The ray marching algorithm should be encapsulated into a for loop with the variable `i` representing the current iteration or ray marching step, set to a max of `80` iterations:

```glsl
for(int i = 0; i < 80; i++) {
    vec3 p = ro + rd * t;
    
    float d = map(p);

    t += d;
}
```

The number of iterations affects both the quality of the result and the performance. Too few iterations might result in rays not having enough iterations to reach an object; too many can significantly impact Shader performance. Typically, this parameter will need to be adjusted to suit your specific scene.

### Rendering the Object

The **color** vector, `col` is initialized to black and will contain the current pixel's color: `vec3 col = vec3(0)`.

It is set as the new output of the shader instead of displaying the `uv` coordinates: `gl_FragColor = vec4(col, 1)`.

The easiest way to visualize something in a ray marched scene is to colorize pixels based on the total distance traveled by the ray, which is stored in the variable `t`. This value is assigned to the red, green, and blue components of the color vector in a *coloring* section, indicated by comment, following the ray marching algorithm: `col = vec3(t)`.

The shader's output color ranges from `0 - 1`. As soon as the ray travels a distance greater than `1`, it will be displayed as white and there will be no variation in color. This is currently happening because the camera is `3` units away from the origin.

To address this, the camera can be moved closer or the distance variable can be divided by an arbitrary number to start seeing details further away: `col = vec3(t * 0.2)`.

> TODO: Insert 01-start.frag image

This rendering can also be referred to as a Z-buffer, or depth-buffer, as each pixel's color represents the distance from the camera to the scene in grayscale value.

Initial shader code:

```glsl
#ifdef GL_ES
precision mediump float;
#endif

uniform vec2 u_resolution;

float map(vec3 p) {
    return length(p) - 1.0;
}

void main() {
    vec2 uv = (gl_FragCoord.xy * 2.0 - u_resolution.xy) / u_resolution.y;

    // initialization
    vec3 ro = vec3(0.0, 0.0, -3.0);
    vec3 rd = normalize(vec3(uv, 1.0));
    vec3 col = vec3(0);

    float t = 0.0;

    // ray marching
    for(int i = 0; i < 80; i++) {
        vec3 p = ro + rd * t;

        float d = map(p);

        t += d;
    }

    // coloring
    col = vec3(t * 0.2);

    gl_FragColor = vec4(col, 1.0);
}
```

### Summary

For each pixel, start by initializing a ray origin `ro`, a ray direction `rd`, and a travel distance `t`. These parameters help calculate an intermediate 3D point representing the current position along the ray. Since the distance is initially set to zero, the point starts at the ray's origin which is the camera's position. From this position, the distance to the closest object in the scene is calculated, which is used to safely march the ray forward. This process can then be repeated until either an object is hit, or the number of iterations is exceeded.

## Optimizations

Currently, every ray goes through all 80 iterations regardless of whether or not an object was hit. Some conditions should be added to the ray marching loop to ensure there are not any unnecessary calculations.

First, a condition is added that instructs the loop to stop if the current distance to an object becomes smaller than a certain threshold, currently set to `0.001`:

```glsl
for (int i = 0; i < 80; i++) {
    vec3 p = ro + rd * t;
    float d = map(p);

    t += d;

    if (d < 0.001) break;
}
```

Different values for this parameter can be expermented with, but if set too high, the ray may stop too far away from an object's surface, making less precise shapes. If set too low, the performance gain may become negligible.

Rays that do not hit an object extend dramatically far into the distance. When calculating the distance traveled at each step, the following details are uncovered:

Iteration | Distance Traveled
----------|------------------
1 | 2.00 m
2 | 2.36 m
5 | 2.81 m
14 | 8.34 m
15 | 13 m
16 | 22 m
20 | 300 m
22 | 1.19 km
40 | 310,702 km (roughly the distance between Earth and the Moon)
80 | 36,109 light-years (roughly a third of the distance of the Milky Way galaxy)

Another condition can be added that halts the loop if the current distance traveled by the ray exceeds a certain value. This distance does not need to be calculated precisely given how fast the ray exits the scene. Instead, it can be set reasonably far away to ensure that objects in the scene won't get clipped or cut off prematurely:

```glsl
for (int i = 0; i < 80; i++) {
    vec3 p = ro + rd * t;
    float d = map(p);

    t += d;

    if (d < 0.001) break;
    if (t > 100.0) break;
}
```

The break conditions can be optimized as:

```glsl
if (d < 0.001 || t > 100.0) break;
```



> If you want to visualize the number of iterations that a ray has gone through, you can set the color for the ray to the loop iterator `i`:
> ```glsl
> for (int i = 0; i < 80; i++) {
>   vec3 p = ro + rd + t;
>   float d = map(p);
>
>   t += d;
>
>   // set color to the iteration count
>   col = vec3(i) / 80.0;
>
>   if (d < 0.001 || t > 100.0) break;
> }
> // coloring
> // comment out to visualize iterations
> // col = vec3(t * 0.02);
>
> gl_FragColor = vec4(col, 1.0);
> ```
> TODO: Insert 02-render-iterations.frag image

This is finally the point where the fundamental ray marching algorithm is fleshed out, which can be very similar to a blank canvas in a 2D case. It serves as the starting point from which you can explore and experiment with ray marching.

One final optimization will be to create a new variable containing the distance to the sphere and call a function that computes its signed distance:

```glsl
float sdSphere(vec3 p, float s) {
    return length(p) - s;
}

float map(vec3 p) {
    float sphere = sdSphere(p, 1.0);
    return sphere;
}
```

## Translation

The positions of objects can be manipulated in the scene by adjusting the input position sent to the distance functions.

A new vector is introduced that represents the sphere's position in 3D space initially set to `0`. It is then subtracted from the input position before being sent to the `sdSphere()` function:

```glsl
float map(vec3 p) {
    vec3 spherePos = vec3(0.0, 0.0, 0.0);
    float sphere = sdSphere(p - spherePos, 1.0);

    return sphere;
}
```

It is now possible to move the sphere in the scene in all three axes defined by adjusting this vector. Setting the first parameter of the vector to `3.0` will move the sphere in the scene to the right three units.

// TODO: Insert 03-translate-x.frag image

This may seem counter-intuitive since the position must be subtracted from the input position. When the subtraction is performed, the canvas is being shifted three units in the negative direction resulting in the scene shifting to the right three units. Because of this behavior, translation and transforms will usually seem inverted in shaders.

It's easy to add real-time movements by including the current time in the object's position. In this case, a *sine* function of time is used to make the sphere's `x` position fluctuate between `-3 - 3`:

```glsl
float map(vec3 p) {
    vec3 spherePos = vec3(sin(u_time) * 3.0, 0.0, 0.0);
    float sphere = sdSphere(p - sherePos, 1.0);

    return sphere;
}
```

// TODO: Insert 04-translate-sin-x.frag video

The distortion observed when the sphere approaches the edges of the screen is inherent to perspective projection, which is implicitly being used. This distortion is connected to the camera's field of view, which indicates the total angle covered by the rays. A larger field of view lets you see more of the scene simultaneously, but also intensifies the distortion.

To control the field of view, multiply the `x` and `y` axes of the ray direction before normalization to influence how the rays are spread:

```glsl
vec3 rd = normalize(vec3(uv * 1.5, 1.0));
```

// TODO: Insert 05-field-of-view.frag video

At this point, another object is added to the scene. A cube of size 75 located at the origin:

```glsl
float sdBox(vec3 p, vec3 b) {
    vec3 q = abs(p) - b;

    return length(max(q, 0.0)) + min(max(q.x, max(q.y, q.z)), 0.0);
}

float map(vec3 p) {
    vec3 spherePos = vec3(sin(u_time) * 3.0, 0.0, 0.0);
    float sphere = sdSphere(p - spherePos, 1.0);
    float box = sdBox(p, vec3(0.75));

    return sphere;

}
```

To combine these shapes, simply return the minimum between the two distances using the `min()` function. This line can be thought of as an operation that unites the two shapes, also called the *union* operator:

```glsl
float map(vec3 p) {
    vec3 spherePos = vec3(sin(u_time) * 3.0, 0.0, 0.0);
    float sphere = sdSphere(p - spherePos, 1.0);
    float box = sdBox(p, vec3(0.75));

    return min(sphere, box);
}
```

// TODO: Insert 07-add-box.frag video

## Operators

If you want to get creative, you can experiment with other operators like the difference or intersection operators to combine shapes in more interesting ways:

```glsl
float opUnion(float d1, float d2) {
    return min(d1, d2);
}

float opSubtraction(float d1, float d2) {
    return max(-d1, d2);
}

float opIntersection(float d1, float d2) {
    return max(d1, d2);
}
```

Additionally, there are smoother versions of these operators that allow for a gradual blending between the shapes:

```glsl
float opSmoothUnion(float d1, float d2, float k) {
    float h = clamp(0.5 + 0.5 * (d2 - d1) / k, 0.0, 1.0);
    return mix(d2, d1, h) - k * h * (1.0 - h);
}

float opSmoothSubtraction(float d1, float d2, float k) {
    float h = clamp(0.5 - 0.5 * (d2 + d1) / k, 0.0, 1.0);
    return mix(d2, -d1, h) + k * h * (1.0 - h);
}

float opSmoothIntersection(float d1, float d2, float k) {
    float h = clamp(0.5 - 0.5 * (d2 - d1) / k, 0.0, 1.0);
    return mix(d2, d1, h) + k * h * (1.0 - h);
}
```

The smooth minimum function, `smin()`, will be used which includes an additional parameter for adjusting the blending allowing a smooth union between the shapes to be created:

```glsl
float smin(float d1, float d2, float k) {
    float h = clamp(0.5 + 0.5 * (d2 - d1) / k, 0.0, 1.0);
    return mix(d2, d1, h) - k * h * (1.0 - h);
}

float map(vec3 p) {
    // vec3 spherePos = vec3(sin(u_time * 3.0), 0.0, 0.0);
    vec3 spherePos = vec3(sin(u_time) * 3.0, 0.0, 0.0);
    float sphere = sdSphere(p - spherePos, 1.0);
    float box = sdBox(p, vec3(0.75));

    return smin(sphere, box, 2.0);
}
```

// TODO: Insert 07-smin.frag video

A ground can be added by creating a new variable `ground` of type `float` that holds the signed distance function to the `xz` plane. Visualizing one ray coming out of the camera, the distance between any point along this ray and the ground is directly determined by the ray's current `y` position, which represents its height above the ground.

The ground should be pushed further down by adding an offset of `0.75` to its distance. Otherwise, you won't see anything as the camera would be at the exact same height as ground and intersecting with it. A positive number is added to move the ground in the negative `y` direction.

It's also possible to smoothly union the ground with the other shapes, this time using a lower blending amount:

```glsl
float map(vec3 p) {
    // vec3 spherePos = vec3(sin(u_time * 3.0), 0.0, 0.0);
    vec3 spherePos = vec3(sin(u_time) * 3.0, 0.0, 0.0);
    float sphere = sdSphere(p - spherePos, 1.0);
    float box = sdBox(p, vec3(0.75));
    float ground = p.y + 0.75;

    return smin(ground, smin(sphere, box, 2.0), 1.0);
}
```

// TODO: Insert 08-ground.frag video

## Scaling

While these two shapes can actually be resized using their input parameters, scaling remains a valuable operation for more complex or grouped objects. The scaling operation can be executed by dividing or multiplying the input position: `float box = sdBox(p * 4.0, vec3(0.75))`. Much like the translation operation, the resulting size change of an object is inversely proportional to the scaling factor.

Scaling actually distorts the metrics and distances within the composition, unlike translation, which can introduce artifacts in the rendering. This can be addressed by counteracting the scaling effect. This involves multiplying the final result of the distance function by the inverse of the scaling factor, or in simpler terms, dividing teh output by the scaling factor: `float box = sdBox(p * 4.0, vec(0.75)) / 4.0`.

// TODO: Insert 09-scale-box.frag video

This adjustment ensure that distances in the scene remain accurate and removes artifacts. As a final note, here the scaling is uniform, but you could also multiply the position by a vector in order to apply a different scale factor for each component.

## Rotation

> Before rotation is introduced, the scaling on the box is removed: `float box = sdBox(p, vec3(0.75))`.

Rotation generally involves the call to an external function as it requires a bit more math. To rotate a point in space, you need to multiply it by a `2x2` rotation matrix in the 2D case:

```glsl
mat2 rot2D(float angle) {
    float s = sin(angle);
    float c = cos(angle);
    return mat2(c, -s, s, c);
}
```

or a `3x3` matrix in the 3D case:

```glsl
mat3 rot3D(vec3 axis, float angle) {
    axis = normalize(axis);
    float s = sin(angle);
    float c = cos(angle);
    float oc = 1.0 - c;

    return mat3(
        oc * axis.x * axis.x + c,
        oc * axis.x * axis.y - axis.z * s,
        oc * axis.z * axis.x + axis.y * s,
        oc * axis.x * axis.y + axis.z * s,
        oc * axis.y * axis.y + c,
        oc * axis.y * axis.z - axis.x * s,
        oc * axis.z * axis.x - axis.y * s,
        oc * axis.y * axis.z + axis.x * s,
        oc * axis.z * axis.z + c
    );
}
```

There is a gap in the complexity of the computations when adding another dimension. Fortunately, in the 3D case, there exists a simpler alternative called the Rodrigues rotation formula, which achieves the same result without using matrices:

```glsl
vec3 rot3D(vec3 p, vec3 axis, float angle) {
    // Rodrigues' rotation formula
    return mix(dot(axis, p) * axis, p, cos(angle))
        + cross(axis, p) * sin(angle);
}
```

> Links to resources on rotation:
> * [How to rotate a vector](https://www.youtube.com/watch?v=7j5yW5QDC2U)
> * [Quaternions and 3D rotation](https://www.youtube.com/watch?v=zjMuIxRvygQ)

The 3D function takes as input a point in space, an axis, and an angle of rotation in radians. The axis is a `vec3` representing the 3D line around which the object will rotate, and it must be normalized. It can be used to rotate objects in any direction.

2D rotation functions can be used even in 3D scenes, and are typically preferred for their speed and simplicity. However, this function only operates on vectors of two components. In order to use it, two comopnents of the 3D point will need to be extracted using swizzling syntax: `p.xz *= rot2D(angle)`. This constrains the rotation to be around the three fundamental axes only, but it can be changed aroudn multiple axes to allow for a greater range of rotation. Once you can visualize the three primary axes in space, using this function to rotate objects becomes quite straightforward.

In the swizzling syntax, the component that is omitted represents the axis around which the object is rotated: `p.xz *= rot2D(angle)` will rotate the object around the `y` axis.

To demonstrate, a copy of the input position `p` is created as `q` in order to rotate that copy only. The rotation is applied to `q` around the `z` axis, using `u_time` to animate the rotation: `q.xy *= rot2D(u_time)`. `q` is then passed to the `sdBox()` function call:

```glsl
mat2 rot2D(float angle) {
    float s = sin(angle);
    float c = cos(angle);
    return mat2(c, -s, s, c);
}

float map(vec3 p) {
    vec3 spherePos = vec3(sin(u_time) * 3.0, 0.0, 0.0);
    float sphere = sdSphere(p - spherePos, 1.0);

    vec3 q = p;
    q.xy *= rot2D(u_time);

    float box = sdBox(q, vec3(0.75));
    float ground = p.y + 0.75;

    return smin(ground, smin(sphere, box, 2.0), 1.0);
}
```

// TODO: Insert 10-rotate-box.frag video

## Order of Operations

One aspect that is crucial in ray marching is the order of operations. If you translate first and then rotate, you'll get a different outcome compared to rotating then translating. This rule applies to most transformations in ray marching. If something isn't behaving as expected, double check the order in which the transformations are applied. It's also important to understand that when transformations are applied to the input point, it maintains that transformation for all future distance functions. This is why a new variable was created to rotate only the box. If the rotation had been conducted on the `p` variable, the ground would have also started to rotate. However the sphere, defined prior to applying rotation, would retain its original movement.

## Camera Rotation

> The section described here is relative to the Shadertoy implementation of `iMouse`. Not all GLSL rendering platforms have the same structure for uniform values. For instance, in the `glsl-canvas` Visual Studio Code extension, `u_mouse` is a `vec2` and only handles movement (`x` and `y`) and not mouse clicks. In the included [renderer](../../renderer/main.js#L63), `u_mouse` is configured to be a `vec3` that with an additional `z` parameter that tracks when the primary mouse button is clicked (`0.0` if pressed, `-1.0` if not pressed).
>
> Consequently, the actual implementation of mouse interactions in the shader files will vary from the video to accomodate the implementation of `u_mouse` locally.

It would be even better to add mouse control for the camera to view the scene from different angles. This can easily be done using the 2D rotation function along with the current position of the mouse.

It's a `vec4(x, y, z, w)` where the first two components represent the current pixel coordinates of the mouse much like the `gl_FragCoord` input parameter. The last two components contain information about the starting position and state of the mouse.

Component | Description
----------|------------
`x` | mouse pixel `x`
`y` | mouse pixel `y`
`z` | drag start `x`
`w` | drag start `y`

State | Check
------|------
mouse down | `u_mouse.z >= 0`
1st frame | `u_mouse.zw >= 0`
mouse up | `u_mouse.zw < 0`

Only the mouse position is needed, which can be extracted with swizzling. The mouse position in clip space can be established by creating a new vector and applying the same transformation as the `uv` coordinates:

```glsl
void main() {
    vec2 uv = (gl_FragCoord.xy * 2.0 - u_resolution.xy) / u_resolution.y;
    vec2 m = (u_mouse.xy * 2.0 - u_resolution.xy) / u_resolution.y;
    // remainder of main()
}
```

This new vector will have a value of `-1, -1` when the mouse is at the bottom left, a value of `1, 1` when the mouse is at the top right, and a value of `0, 0` when the mouse is centered.

The ray's origin and direction can be rotated around the `y` axis. The rotation angle will be determined by the current `x` position of the mouse vector, which needs to be negated:

```glsl
// horizontal camera rotation
ro.xz *= rot2D(-m.x);
rd.xz *= rot2D(-m.x);
```

If only the ray origin is rotated, the camera will rotate around the scene and stay pointed in the same direction. This will not track the objects in the scene causing them to move out of view. Adding rotation to the ray direction will ensure that the camera rotates around the scene and adjusts the rotation of the facing direction to remain pointed at the objects.

For a complete 360° rotation around the scene, the same technique can be applied along the `x` axis, this time using the vertical position of the mouse. The order of operations matters and it's important to place vertical rotation before horizontal rotation:

```glsl
// vertical camera rotation
ro.yz *= rot2D(-m.y);
rd.yz *= rot2D(-m.y);

// horizontal camera rotation
ro.xz *= rot2D(-m.x);
rd.xz *= rot2D(-m.x);
```

You can also scale the mouse vector to control how sensitive the rotation is.

// TODO: Insert 11-camera-rotation.frag video

## Space Repetition

Space repetition is an extremely powerful tool in ray marching which allows an infinite amount of shapes to be rendered while defining just one. The `fract()` function can be used to replicate objects in space. This function returns the fractional part of the input for each component, keeping the result between `0` and `1`:

```glsl
float map(vec3 p) {
    vec3 spherePos = vec3(sin(u_time) * 3.0, 0.0, 0.0);
    float sphere = sdSphere(p - spherePos, 1.0);

    vec3 q = p;

    q = fract(p) - 0.5;

    float box = sdBox(q, vec3(0.1));
    float ground = p.y + 0.75;

    return smin(ground, smin(sphere, box, 2.0), 1.0);
}
```

When the ray is passed through the `fract()` function, the input to the SDF Is always constrained within the unit cell at the origin. From the ray's perspective, this makes the scene appear to contain an infinite number of cubes, each one unit apart from the other.

To achieve more granular control, it's possible to use the `mod()` function instead. It takes an additional parameter that can be used to control the spacing between each repetition. `fract()` is a special case of the `mod()` function: `fract(x) = mod(x, 1.0)`.

The current visualization is missing an important step as the cube is originally located at `0` while the center of repetition is located at `0.5`. This makes every cube extend further than the repeated cell boundaries and it results in them being clipped. This is why `0.5` needs to be subtracted after applying the space repetition function, which translates each cube to the center of its cell and fixes clipping issues.

Finally, the cube is scaled down because it currently has a bigger side length than the distance of repetition , making it fill the entire space.

// TODO: Insert 12-space-repetition.frag video

It is also possible to apply space repetition to individual axes instead of all 3 of them:

```glsl
// only repeat across the x and y axes
q.xy = frag(p.xy) - 5;
```

The intensity of the depth value can be lowered to see further away:

```glsl
col = vec3(t * 0.05);
```

Upward movement can also be added to every box:

```glsl
q.y -= u_time * 0.4;
q = fract(q) - 0.5;
```

Note that the change to `q.y` needs to be added before applying space repetition or else the boxes would clip out of their repetition.

// TODO: Insert 13-vertical-box-movement.frag video

## Getting Creative

Before going any further, the `map()` function is cleaned up to remove all but the repeated box, and movement is changed from the `y` axis to the `z` axis, bringing the boxes towards the camera. Here's the full simplified shader:

```glsl
#ifdef GL_ES
precision mediump float;
#endif

uniform vec2 u_resolution;
uniform float u_time;

float sdBox(vec3 p, vec3 b) {
    vec3 q = abs(p) - b;

    return length(max(q, 0.0)) + min(max(q.x, max(q.y, q.z)), 0.0);
}

float map(vec3 p) {
    p.z += u_time * 0.4;

    p = fract(p) - 0.5;

    float box = sdBox(p, vec3(0.1));

    return box;
}

void main() {
    vec2 uv = (gl_FragCoord.xy * 2.0 - u_resolution.xy) / u_resolution.y;

    // initialization
    vec3 ro = vec3(0.0, 0.0, -3.0);
    vec3 rd = normalize(vec3(uv, 1.0));
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
    col = vec3(t * 0.05);

    gl_FragColor = vec4(col, 1.0);
}
```

// TODO: Insert 14-simplify.frag video

### Colorize

So far, shader has demonstrated how to build a ray marching algorithm and how to play with objects in the scene, but it's still colorized using the depth to the scene, which is a bit boring.

The next easiest way to colorize objects is to pass the depth value as the input to a color gradient function that can convert this linearly increasing value to a color vector:

> This is the same palette function introduced in [Intro to Shader Art Coding](../intro-to-shader-art-coding/readme.md#palette)

```glsl
vec3 palette(float t) {
    vec3 a = vec3(0.5, 0.5, 0.5);
    vec3 b = vec3(0.5, 0.5, 0.5);
    vec3 c = vec3(1.0, 1.0, 1.0);
    vec3 d = vec3(0.263, 0.416, 0.557);

    return a + b * cos(6.28318 * (c * t + d));
}
```

The `palette()` function will be called to calculate the output color and pass the depth as input:

```glsl
// coloring
col = palette(t * 0.04);
```

// TODO: Insert 15-colorize.frag video

### Octahedron

The box distance function is replaced by an octahedron signed distance function. The spacing in the `z` direction will also be decreased to make each shape closer together only in the axis that is parallel to the camera. For that, the space repetition is decomposed into two parts: the `x` and `y` axis will be repeated using `fract()` as before, and the `z` axis will be repated using the `mod()` function with a spacing of `0.25` which is then offset by half of the repetition spacing, which is `0.125`:

> Very interesting pattern is observed if only the space repetition for the `z` axis is omitted!

```glsl
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
```

// TODO: Insert 16-octahedron.frag video

### Color Depth

The current colorization technique makes the objects appear very flat as lighting or occlusionm effects were not implemented. A quick solution would be to incorporate the iteration count from the loop into the `palette()` function. This value actually contains information about the scene as it will increase with distance, but also increase when approaching edges of objects as it will need more steps to travel the scene. If it is extracted from the loop and displayed directly after normalizing, the amount it contains can be seen:

> When using the *glsl-canvas* extension in VS Code, the for loop cannot use the syntax below. A separate integer must be declared just above the `for` loop and initialized to the value of `i` at the very beginning of the iteration.

```glsl
// ray marching
    int i;
    for (i = 0; i < 80; i++) {
        vec3 p = ro + rd * t;
        float d = map(p);

        t += d;

        if (d < 0.001 || t > 100.0) break;
    }

    // coloring
    col = vec3(float(i) / 80.0);
```

This is only a hack because the iteration count is not smooth as opposed to the depth buffer. The lower the iteration count, the more visible the artifacts will be. If multiplied with a very tiny number, the addition stays subtle. The `float` keyword is used to convert the `int`:

```glsl
col = palette(t * 0.04 + float(i) * 0.005);
```

// TODO: Insert 17-index-depth.frag

### Sinusoidal Distortion

Transformation can be applied to the ray itself in order to affect how objects appear in the scene. In this case, a sinusoidal offset is applied to the `y` component of the ray to distort the scene in a unique way. It is added in the main loop before the `map()` function to indicate that it's a scene transformation and not object specific. The `sin()` function is added to the `y` component of the position, `p`, along the ray and the frequency will be determined by the total distance traveled so far, `t`. The amplitude of the waves is also scaled down for a cleaner effect by multiplying the result of the `sin()` functino by `0.35`.

```glsl
// ray marching
int i;
for (i = 0; i < 80; i++) {
    j = i;
    vec3 p = ro + rd * t;
    p.y += sin(t) * 0.35;

    float d = map(p);

    t += d;

    if (d < 0.001 || t > 100.0) break;
}
```

// TODO: Insert 18-sinusoidal-y.frag video

The scene is still defined by a single, undistorted octahedron located at the origin. It's just the rays that were given superpowers to completely ignore the rules of 3D cartesian space and somewhat hallucinate new geometry.

### Mouse Controlled Frequency

The frequency of the sinusoidal distortion along the `y` axis can be controlled using the vertical component of the mouse. It should be going from `0` to `1`, so the `y` component of the mouse clip space transformation needs to be remapped accordingly:

```glsl
p.y += sin*(t * (m.y + 1.0) * 0.5) * 0.35;
```

This allows the frequency of the oscillations to be changed by moving the mouse up and down.

```glsl
#ifdef GL_ES
precision mediump float;
#endif

uniform vec2 u_resolution;
uniform vec3 u_mouse;
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
    p.z = mod(p.z, 0.25) - 0.125;

    float box = sdOctahedron(p, 0.15);

    return box;
}

void main() {
    vec2 uv = (gl_FragCoord.xy * 2.0 - u_resolution.xy) / u_resolution.y;
    vec2 m = (u_mouse.xy * 2.0 - u_resolution.xy) / u_resolution.y;

    // initialization
    vec3 ro = vec3(0.0, 0.0, -3.0);
    vec3 rd = normalize(vec3(uv, 1.0));
    vec3 col = vec3(0);

    float t = 0.0;

    // ray marching
    int i;
    for(i = 0; i < 80; i++) {
        vec3 p = ro + rd * t;

        if(u_mouse.z >= 0.0) {
            p.y += sin(t * (m.y + 1.0) * 0.5) * 0.35;
        } else {            
            p.y += sin(t * 0.5) * 0.15;
        }

        float d = map(p);

        t += d;

        if(d < 0.001 || t > 100.0)
            break;
    }

    // coloring
    col = palette(t * 0.04 + float(i) * 0.005);

    gl_FragColor = vec4(col, 1.0);
}
```

// TODO: Insert 19-mouse-sinusoidal-y.frag video

### Rotational Distortions

The same distortion principle used to control the offset will be used to control the rotation of the ray. The rays should start rotating around the `z` axis the further from the camera they go. This can be done using the previous 2D rotation function:

```glsl
mat2 rot2D(float angle) {
    float s = sin(angle);
    float c = cos(angle);
    return mat2(c, -s, s, c);
}
```

Because the rotation will be around the `z` axis, the `x` and `y` components of the point are extracted: `p.xy *= rot2D(t * 0.2)`. The rotation increases with distance, producing a spiral effect.

```glsl
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

mat2 rot2D(float angle) {
    float s = sin(angle);
    float c = cos(angle);
    return mat2(c, -s, s, c);
}

float sdOctahedron(vec3 p, float s) {
    p = abs(p);
    return (p.x + p.y + p.z - s) * 0.57735027;
}

float map(vec3 p) {
    p.z += u_time * 0.4;

    p.xy = fract(p.xy) - 0.5;
    p.z = mod(p.z, 0.25) - 0.125;

    float box = sdOctahedron(p, 0.15);

    return box;
}

void main() {
    vec2 uv = (gl_FragCoord.xy * 2.0 - u_resolution.xy) / u_resolution.y;

    // initialization
    vec3 ro = vec3(0.0, 0.0, -3.0);
    vec3 rd = normalize(vec3(uv, 1.0));
    vec3 col = vec3(0);

    float t = 0.0;

    // ray marching
    int i;
    for (i = 0; i < 80; i++) {
        vec3 p = ro + rd * t;

        p.xy *= rot2D(t * 0.2);

        float d = map(p);

        t += d;

        if (d < 0.001 || t > 100.0) break;
    }

    // coloring
    col = palette(t * 0.04 + float(i) * 0.005);

    gl_FragColor = vec4(col, 1.0);
}
```

// TODO: Insert 20-spiral-z.frag video

These two transformations actually break the distance calculations similar to the scaling operator. If you distort the space too much, visual artifacts will start to appear.

### Mouse Controlled Spirals

The `x` component of the mouse can be used to control the frequency of the rotation. It will not be remapped, so it ranges from `-1` to `1` from left to right allowing the direction of rotation to be changed.

When the mouse is not pressed, a default behavior should be implemented that simulates moving the mouse in a circle around the scene. This is pretty straightforward using trigonometry. The position of a point along a circle given a radius and an angle is:

```
p = r * vec2(cos(angle), sin(angle))
```

Since the scene is in clip space, the radius is one and time can be used to have an infinite looping rotation.

This can be added by overwriting the value of the mouse vector, `m`, when the mouse is not pressed, which can be detected by checking if the `z` component of `u_mouse` is less than `1`. This addition will fake an endless circular motion of the mouse around the canvas to give a final touch of dynamism to the scene.

```glsl
#ifdef GL_ES
precision mediump float;
#endif

uniform vec2 u_resolution;
uniform vec3 u_mouse;
uniform float u_time;

vec3 palette(float t) {
    vec3 a = vec3(0.5, 0.5, 0.5);
    vec3 b = vec3(0.5, 0.5, 0.5);
    vec3 c = vec3(1.0, 1.0, 1.0);
    vec3 d = vec3(0.263, 0.416, 0.557);

    return a + b * cos(6.28318 * (c * t + d));
}

mat2 rot2D(float angle) {
    float s = sin(angle);
    float c = cos(angle);
    return mat2(c, -s, s, c);
}

float sdOctahedron(vec3 p, float s) {
    p = abs(p);
    return (p.x + p.y + p.z - s) * 0.57735027;
}

float map(vec3 p) {
    p.z += u_time * 0.4;

    p.xy = fract(p.xy) - 0.5;
    p.z = mod(p.z, 0.25) - 0.125;

    float box = sdOctahedron(p, 0.15);

    return box;
}

void main() {
    vec2 uv = (gl_FragCoord.xy * 2.0 - u_resolution.xy) / u_resolution.y;
    vec2 m = (u_mouse.xy * 2.0 - u_resolution.xy) / u_resolution.y;

    // initialization
    vec3 ro = vec3(0.0, 0.0, -3.0);
    vec3 rd = normalize(vec3(uv, 1.0));
    vec3 col = vec3(0);

    float t = 0.0;

    // default circular motion if not clicked
    if (u_mouse.z < 0.0)
        m = vec2(cos(u_time * 0.2), sin(u_time * 0.2));

    // ray marching
    int i;
    for (i = 0; i < 80; i++) {
        vec3 p = ro + rd * t;

        p.xy *= rot2D(t * 0.2 * m.x);
        p.y += sin(t * (m.y + 1.0) * 0.5) * 0.35;

        float d = map(p);

        t += d;

        if (d < 0.001 || t > 100.0) break;
    }

    // coloring
    col = palette(t * 0.04 + float(i) * 0.005);

    gl_FragColor = vec4(col, 1.0);
}
```

// TODO: Insert 21-final.frag video