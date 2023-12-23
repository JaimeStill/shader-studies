# Shader Studies

Studying how to generate visuals with [GLSL](https://www.khronos.org/opengl/wiki/OpenGL_Shading_Language).

* [Renderer](./renderer)
    * [Shaders](./renderer/shaders/)
* [References](./references.md)
* [Shader Types](./shader-types.md)
* [Studies](#studies)
* [Working with Shaders Locally](#working-with-shaders-locally)

## [Studies](./studies/)

* [Intro to Shader Art Coding](./studies/intro-to-shader-art-coding/)

## Working With Shaders Locally

Download [Visual Studio Code](https://code.visualstudio.com/) and install the following extensions:

* [glsl-canvas](https://marketplace.visualstudio.com/items?itemName=circledev.glsl-canvas)
* [WebGL GLSL Editor](https://marketplace.visualstudio.com/items?itemName=raczzalan.webgl-glsl-editor)

This will provide you with intellisense, formatting, and a preview canvas that allows you to see your shader rendering in real time:

![vs-code-setup](https://github.com/JaimeStill/shader-studies/assets/14102723/f9040316-4304-4f52-926b-d3870b34fd0b)

Additionally, you can use [Three.js](https://threejs.org/) and [Vite](https://vitejs.dev/) to run your shaders in a browser using the [renderer](./renderer/) project in this repository. The [Readme](./renderer/readme.md) has instructions for using that project to run your shaders:

![renderer-in-browser](https://github.com/JaimeStill/shader-studies/assets/14102723/76b18015-816d-474c-b478-1b3ee132ed14)