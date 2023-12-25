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

> TODO: Insert picture of rendered shader.

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
> TODO: Insert shader image

This is finally the point where the fundamental ray marching algorithm is fleshed out, which can be very similar to a blank canvas in a 2D case. It serves as the starting point from which you can explore and experiment with ray marching.

One final optimization will be to create a new variable containing the distance to the sphere and call a function that computes its signed distance:

```
float sdSphere(vec3 p, float s) {
    return length(p) - s;
}

float map(vec3 p) {
    float sphere = sdSphere(p, 1.0);
    return sphere;
}
```

## Translation