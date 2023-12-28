# [Intro to Shader Art Coding](https://youtu.be/f4s1h2YETNY)

## In / Out Parameters

`gl_FragCoord` is a `vec2` that specifies the `x` and `y` coordinate values for the current pixel.

`gl_FragColor` is a `vec4` that specifies the `rgba` color value of the current pixel.

## Display Colors

Basic shader structure:

```glsl
// runs once for each pixel
// renders pure red
void main() {
    gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
}
```

![red-box](https://github.com/JaimeStill/shader-studies/assets/14102723/2a0cb2f0-177f-4564-a986-a8e69ca82d58)


## Resolution

To access the resolution of the render area:

```glsl
uniform vec2 u_resolution;

void main() {
    // shader logic
}
```

Normalize `gl_FragCoord` so that the current pixel coordinates are in the range of `0-1` instead of the resolution scale:

```glsl
uniform vec2 u_resolution;

void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution.xy;
}
```

## Swizzling

Swizzling is equivalent to creating a new vector in short hand:

```glsl
u_resolution.xy <=> vec2(u_resolution.x, u_resolution.y);

// can also re-order vector placement
u_resolution.zy <=> vec2(u_resolution.z, u_resolution.y);
```

## UV Coordinates

Use the `x` coordinate to create a horizontal gradient by mapping to the red channel:

```glsl
uniform vec2 u_resolution;

void main() { 
    vec2 uv = gl_FragCoord.xy / u_resolution.xy;

    gl_FragColor = vec4(uv.x, 0.0, 0.0, 1.0);
}
```

![uv-x](https://github.com/JaimeStill/shader-studies/assets/14102723/7d7e9c66-d0ab-48ee-b4f0-73ff6cfb285f)

Map both `uv.x` and `uv.y` to the red and green channels, respectively:

```glsl
uniform vec2 u_resolution;

void main() { 
    vec2 uv = gl_FragCoord.xy / u_resolution.xy;

    gl_FragColor = vec4(uv.x, uv.y, 0.0, 1.0);
}
```

![red-x-green-y](https://github.com/JaimeStill/shader-studies/assets/14102723/700c0a99-dd3b-4d07-9846-54da8cdcb705)

Can be simplified:

```glsl
uniform vec2 u_resolution;

void main() { 
    vec2 uv = gl_FragCoord.xy / u_resolution.xy;

    gl_FragColor = vec4(uv, 0.0, 1.0);
}
```

## Center UVs

To translate the uv coordinate space from `0-1` to `-1-1`:

```glsl
vec2 uv = gl_FragCoord.xy / u_resolution.xy * 2.0 - 1.0;
```

![center-uv](https://github.com/JaimeStill/shader-studies/assets/14102723/4d7cd990-b54c-48dd-be15-86f525cfe8e9)

## `length()`

Calculate the distance of a pixel from the center:

```glsl
float d = length(uv);
```

Mapping `d` to the red channel exposes a radial gradient:

```glsl
gl_FragColor = vec4(d, 0.0, 0.0, 1.0);
```

![radial-gradient](https://github.com/JaimeStill/shader-studies/assets/14102723/6623fb6d-0021-4a42-b76a-3710e9d2565e)

## Fix Aspect Ratio

To fix the aspect ratio and ensure that the radial gradient is always circular:

```glsl
vec2 uv = gl_FragCoord.xy / u_resolution.xy * 2.0 - 1.0;
uv.x *= u_resolution.x / u_resolution.y;
```

![fix-aspect-ratio](https://github.com/JaimeStill/shader-studies/assets/14102723/ab3c32cc-458d-45d4-a3c5-675398cb7186)

This can all be simplified to:

```glsl
vec2 uv = (gl_FragCoord.xy * 2.0 - u_resolution.xy) / u_resolution.y;
```

## Signed Distance Functions

Subtract `0.5` from `d` to represent the [signed distance function](https://iquilezles.org/articles/distfunctions2d/) of a circle with a radius of `0.5` (`length(p) - r`):

```glsl
float d = length(uv);
d -= 0.5;
```

The values are positive outside of the circle's edge, creating a gradient, but they are negative inside of the circle, resulting in black.

Use the absolute value of the distance to convert the negative values to positive, resulting in values moving inward from the edge becoming lighter:

```glsl
float d = length(uv);
d -= 0.5;
d = abs(d);
```

![abs-sdf](https://github.com/JaimeStill/shader-studies/assets/14102723/9647846b-0b52-4800-ba13-0d2a129c26d3)

## `step()`

To achieve a sharper transition, you can use the step function. It accepts two values: a threshold, and a parameter. The output can only have two states. Returns `0` for any value less than the threshold, and `1` for any value greater than or equal to the threshold.

Using `step(0.1, d)`, all `d` values less than `0.1` become `0`, and all other values become `1`.

```glsl
float d = length(uv);
d -= 0.5;
d = abs(d);
d = step(0.1, d);
```

![step](https://github.com/JaimeStill/shader-studies/assets/14102723/58151ea6-0799-42df-8d65-c1339fa144a3)

## `smoothstep()`

If a smoother transition between black and white is desired, utilize the `smoothstep()` function. It takes two threshold parameters as well as a value parameter. The color black is assigned when the value is below the first threshold, and white when it exceeds the second threshold. All values in between are smoothly interpolated.

```glsl
float d = length(uv);
d -= 0.5;
d = abs(d);
d = smoothstep(0.0, 0.1, d);
```

![smoothstep](https://github.com/JaimeStill/shader-studies/assets/14102723/9335cf8c-cc8b-4ed1-b85d-0ac2e4b632d3)

## `sin()` and Time

Instead of subtracting `0.5`, apply `sin(d)` to create a radial repetition of rings. Initially, it will only display a single dot because the *sine* of a value between `0` and `1` is very close to the original value, resulting in minimal change. However, when the frequency of the input value is increased, the oscillating value of the *sin* function , which ranges from `-1 - 1`, is better observed:

```glsl
float d = length(uv);
d = sin(d * 8.0) / 8.0;
d = abs(d);
d = smoothstep(0.0, 0.1, d);
```

![sin](https://github.com/JaimeStill/shader-studies/assets/14102723/c81316f0-5286-4baa-8b02-f1246e57c747)

Note that multiplying the distance by `8` before applying the *sine* function stretches the space and alters the color intensity requiring a corresponding division of the output by the same factor.

An interesting characteristic of the *sine* function is its repetitive nature. Introducing a time component and offsetting the distance before applying the *sine* function creates an infinite loop of rings that continuously shrink towards the center. This can be accomplished with the uniform constant `u_time`. `u_time` is an ever increasing `float` representing the number of seconds that have passed since the beginning of the animation.

```glsl
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
```

[timed-sin.webm](https://github.com/JaimeStill/shader-studies/assets/14102723/6ce285d8-62d2-46d1-bcd2-173c58e324b9)

## 1/x

Now, the focus shifts to improving the visual aspect in colors. Neon colors are preferable, and the inverse function `1/x` is perfect for achieving that aesthetic. Instead of using `smoothstep()` on the `d` value, the inverse of `d` will be used. The screen will become entirely white. This is because `1/x` generates extremely high outputs for low input values that gradually diminish as the values increase. `1/x` can be scaled down to `.1/x` to ensure that the falloff is visible within the desired range of `0-1`.

```glsl
float d = length(uv);

d = sin(d * 8.0 + u_time) / 8.0;
d = abs(d);

d = .1/d;
```

This is still a bit much, so it should be scaled down to `.02` to achieve a pleasant glow:


```glsl
float d = length(uv);

d = sin(d * 8.0 + u_time) / 8.0;
d = abs(d);

d = 0.02/d;
```

[inverse.webm](https://github.com/JaimeStill/shader-studies/assets/14102723/8cdbd2fb-0405-47fa-b19e-e56619a246cb)

## Add Colors

A `vec3` variable named `col` is introduced that initially contains the color red. By multiplying this color variable with the value of `d` and making it the new shader output, the black areas will remain black while the white areas will be tinted with the corresponding color value:

```glsl
void main() {
    vec2 uv = (gl_FragCoord.xy * 2.0 - u_resolution.xy) / u_resolution.y;    
    float d = length(uv);
    vec3 col = vec3(1.0, 0.0, 0.0);

    d = sin(d * 8.0 + u_time) / 8.0;
    d = abs(d);
    d = 0.02/d;

    col *= d;

    gl_FragColor = vec4(col, 1.0);
}
```

[neon-red.webm](https://github.com/JaimeStill/shader-studies/assets/14102723/8d68ad8e-ae18-4824-bb3d-d404e90a6d27)

Here, the calculations are not limited to the `0-1` range so the colors can be intensified by setting certain components in `col` to higher values:

```glsl
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
```

[neon-blue.webm](https://github.com/JaimeStill/shader-studies/assets/14102723/c6ba9a48-4d7f-40fe-8e2e-3e089ec016a4)

In this case, the blue channel has the highest value which produces a vibrant blue tint in the final result.

### `palette()`

To add even more variety to the colors, a `palette()` function can be introduced, as described in [Inigo Quilez Palettes](https://iquilezles.org/articles/palettes/) article:

```glsl
vec3 palette(float t, vec3 a, vec3 b, vec3 c, vec3 d) {
    return a + b * cos(6.28318 * (c * t + d));
}
```

It allows you to create infinitely various color gradients using the power of trigonometry. It produces a color output based on four control parameters of type `vec3`, which are passed as inputs. These parameters dictate the composition of the gradient, enabling you to customize the colors to suit your preferences.

The function may appear complex with its total of 12 input parameters, but you can use the [Cosine gradient generator](http://dev.thi.ng/gradients/) web app to visually create your own palette and transfer the parameters to the `palette()` function:

```glsl
vec3 palette(float t) {
    vec3 a = vec3(0.5, 0.5, 0.5);
    vec3 b = vec3(0.5, 0.5, 0.5);
    vec3 c = vec3(1.0, 1.0, 1.0);
    vec3 d = vec3(0.263, 0.416, 0.557);

    return a + b * cos(6.28318 * (c * t + d));
}
```

With this modification, the constant color can be replaced with the `palette()` function:

```glsl
vec3 col = palette(d);
```

[palette.webm](https://github.com/JaimeStill/shader-studies/assets/14102723/747fde45-d068-4b19-937c-439046556256)

It takes the original distance to the center of the screen as input before any transformations. The call to the `palette()` function can be adjusted by adding a time offset, adding an additional dynamic element, causing the colors to continuously shift and evolve.

## `fract()`

The `fract()` function can be used to introduce spatial repetition. The `fract()` function simply returns the fractional part of its input, extracting only the digits after the decimal point. As a result, it's output ranges from zero to one.

```glsl
vec2 uv = (gl_FragCoord.xy * 2.0 - u_resolution.xy) / u_resolution.y;

uv = fract(uv);
```

[fract-broken.webm](https://github.com/JaimeStill/shader-studies/assets/14102723/afd17fe7-950a-4f35-9a04-de170b9fc6e2)

Even if the space has been repeated, it doesn't render the full circle in each space. To understand this issue, display back only the value of the `uv` variable:

```glsl
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
    vec3 col = palette(d + u_time);

    d = sin(d * 8.0 + u_time) / 8.0;
    d = abs(d);

    d = 0.02/d;

    col *= d;

    gl_FragColor = vec4(uv, 0.0, 1.0);
}
```

![fract-uv](https://github.com/JaimeStill/shader-studies/assets/14102723/2de364ea-d7da-4494-ae51-91fc587788d1)


Repetition was successfully achieved by creating four smaller versions of the original UV coordinates, however each repetition is now confined within the `0-1` range instead of the desired clip space.

To resolve this, the same scaling solution previously implemented can be applied by scaling the UVs first, then subtracting the `0.5` to center them:

```glsl
void main() {
    vec2 uv = (gl_FragCoord.xy * 2.0 - u_resolution.xy) / u_resolution.y;    

    uv *= 2.0;
    uv = fract(uv);
    uv -= 0.5;

    float d = length(uv);
    vec3 col = palette(d + u_time);

    d = sin(d * 8.0 + u_time) / 8.0;
    d = abs(d);

    d = 0.02/d;

    col *= d;

    gl_FragColor = vec4(col, 1.0);
}
```

[fract-uv-scale.webm](https://github.com/JaimeStill/shader-studies/assets/14102723/e42b6aef-1e8a-4feb-9a60-74ec3afef2b6)

All of the UV operations can be simplified into a single line for brevity:

```glsl
uv = fract(uv * 2.0) - 0.5;
```

`d` represents the local distance relative to the center of each repetition, but the original distance to the center of the canvas should be tracked as well. This can be done with a new `vec2` that captures the initial `uv` before reptition is applied:

```glsl
vec2 uv = (gl_FragCoord.xy * 2.0 - u_resolution.xy) / u_resolution.y;
vec2 uv0 = uv;
uv = fract(uv * 2.0) - 0.5;
```

This will allow `d` inside of the `palette()` function call with the length of the original UV coordinates, which breaks the local gradient reptition:

```glsl
vec3 col = palette(length(uv0) + u_time);
```

[frag-global-uv.webm](https://github.com/JaimeStill/shader-studies/assets/14102723/44245151-ed8a-47ce-bb4e-5f9e4a9097b7)

## Iterations

Iterations will be the final touch that gives the composition its fractal appearance. Before proceeding, the code should be slightly refactored for what will follow.

A new `vec3` variable is created called `finalColor` initialized with black.

```glsl
vec2 uv0 = uv;
vec3 finalColor = vec3(0.0);
```

Instead of updating the `col` value directly, the result of the operation will be added to the new color variable:

```glsl
d = 0.02 / d;

finalColor += col * d;
```

Finally, `finalColor` will be output as the result of the shader:

```glsl
gl_FragColor = vec4(finalColor, 1.0);
```

This modification doesn't change the visual, but sets the stage for adding iterations to the composition.

To achieve this, a for loop will be utilized encapsulating the entire color calculation code:

```glsl
for(float i = 0.0; i < 1.0; i++) {
    uv = fract(uv * 2.0) - 0.5;

    float d = length(uv);
    vec3 col = palette(length(uv0) + u_time);

    d = sin(d * 8.0 + u_time) / 8.0;
    d = abs(d);
    d = 0.02 / d;

    finalColor += col * d;
}
```

Currently, this simple loop will not produce any  changes in the visuals as it exits after just one iteration. By increasing the number of iterations, the emergence of additional layers and intricate details can be observed in the fractal pattern:

```glsl
for(float i = 0.0; i < 3.0; i++) {
    uv = fract(uv * 2.0) - 0.5;

    float d = length(uv);
    vec3 col = palette(length(uv0) + u_time);

    d = sin(d * 8.0 + u_time) / 8.0;
    d = abs(d);
    d = 0.02 / d;

    finalColor += col * d;
}
```

[initial-iterations.webm](https://github.com/JaimeStill/shader-studies/assets/14102723/16325db0-d6c6-4149-97a4-b9b4e9e9f868)

As the complexity intensifies, it may become visually overwhelming. To mitigate this, the frequency of the time offset can be reduced:

```glsl
vec3 col = palette(length(uv0) + u_time * 0.4);
```

[calmed-iterations.webm](https://github.com/JaimeStill/shader-studies/assets/14102723/e04a7f54-7fed-459a-821f-406c2159e990)

Iterating this code generates interesting patterns because each iteration involves scaling and repeating the space using the `fract()` function and adds the resulting colors together.

However, the perfect matching of repetitions caused by multiplying by exactly `2` makes these repetitions match up a bit too well.

To introduce more visual interest, this symmetry can be broken by multiplying `uv` inside of `fract()` with a decimal number instead:

```glsl
uv = fract(uv * 1.5) - 0.5;
```

[asymmetric-iterations.webm](https://github.com/JaimeStill/shader-studies/assets/14102723/eb3528d9-dd0d-4da2-9f7c-3e6f0bac1986)

## `exp()`

The `exp()` function can be used to increase the variations further. `d`, the local distance to the center of each repetition, is multiplied by an `exp()` function depending on the global distance to the center of the canvas:

```glsl
float d = length(uv) * exp(-length(uv0));
```

[exp.webm](https://github.com/JaimeStill/shader-studies/assets/14102723/590b9480-9956-4171-8671-3a1c5272f1f5)

To try and understand how this works, you can use the website [Graphtoy](https://graphtoy.com/) that was designed to graph GLSL functions.

Clear the initially loaded graph and set `f1(x,t) = x` as a reference. Set `f2(x,t) = exp(-x)`.

> `exp(-x)` simply flips the horizontal axis of `exp(x)`.

It displays a similar behavior to `1/x` used earlier, but this time doesn't go to infinity at zero. Multiplying the original x by the `exp()` function, it flips the vertical axis and introduces a smooth and distinctive behavior to the final curve: `f2(x,t) = x * exp(-x)` = `length(uv) * exp(-length(uv0))`. This blends well with the other effects in the current animation.

Considering the current brightness, the falloff is further reduced on the inverse function to achieve a more balanced effect:

```glsl
d = 0.01 / d;
```

[balanced-exp.webm](https://github.com/JaimeStill/shader-studies/assets/14102723/1c6913ea-6b65-40c0-b546-b00239dc69d4)

To add additional variation to each layer of the loop, introduce `i` into the calculations. This can be accomplished by adjusting the call to the `palette()` function, resulting in slight color offsets after each iteration:

```glsl
vec3 col = palette(length(uv0) + i * 0.4 + u_time * 0.4);
```

[variable-iterations.webm](https://github.com/JaimeStill/shader-studies/assets/14102723/f6cd0c89-d78f-43be-91fc-021ad2022cb9)

With the improved visual quality, it is appropriate to introduce an additional iteration to enhance the creation of smaller details:

```glsl
for(float i = 0.0; i < 4.0; i++) {
    uv = fract(uv * 1.5) - 0.5;

    float d = length(uv) * exp(-length(uv0));
    vec3 col = palette(length(uv0) + i * 0.4 + u_time * 0.4);

    d = sin(d * 8.0 + u_time) / 8.0;
    d = abs(d);
    d = 0.01 / d;

    finalColor += col * d;
}
```

[add-iteration.webm](https://github.com/JaimeStill/shader-studies/assets/14102723/f5c03a04-3a8e-4eea-bde5-caf9dd75f114)

## `pow()`

The `pow()` function can be used to enhance the overall contrast of the image. When the input ranges from `0 - 1`, the `pow()` function effectively accentuates the darker colors closer to `0` while having a lesser effect on the lighter shades:

```glsl
d = pow(0.01 / d, 2.0);
```

[pow.webm](https://github.com/JaimeStill/shader-studies/assets/14102723/a1102646-d47c-4ac9-bdd7-9de227ad0187)

Although taking the power of `2` may seem excessive, smaller values such as `1.2` can significantly improve the contrast and visual impact of the composition:

```glsl
d = pow(0.01 / d, 1.2);
```

[final.webm](https://github.com/JaimeStill/shader-studies/assets/14102723/f890de9a-59da-42ea-981a-ac63ea083060)

## Final Shader

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

void main() {
    vec2 uv = (gl_FragCoord.xy * 2.0 - u_resolution.xy) / u_resolution.y;
    vec2 uv0 = uv;
    vec3 finalColor = vec3(0.0);

    for(float i = 0.0; i < 4.0; i++) {
        uv = fract(uv * 1.5) - 0.5;

        float d = length(uv) * exp(-length(uv0));
        vec3 col = palette(length(uv0) + i * 0.4 + u_time * 0.4);

        d = sin(d * 8.0 + u_time) / 8.0;
        d = abs(d);
        d = pow(0.01 / d, 1.2);

        finalColor += col * d;
    }

    gl_FragColor = vec4(finalColor, 1.0);
}
```