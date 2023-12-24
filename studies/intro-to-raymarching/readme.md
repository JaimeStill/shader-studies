# [Intro to Raymarching](https://youtu.be/khblXafu7iA)

## What is Rasterization?

Rasterization pipeline:

1. **Vertex shader** - transforms the vertices of each triangle from 3D world space into 2D screen space projections using the current camera position and orientation.
2. **Rasterization** - uses these screen space vertices to calculate which pixels of the screen, also called fragments, are actually part of the current triangle.
3. **Fragment shader** - processes each of these fragments to calculate their final color displayed ont he screen.

