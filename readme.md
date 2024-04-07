# Sand Of Time

A smallish JS toy which may or may not become a game at some point.

The idea is to have all the pixels on screen react like a particle. To optimize the performance, we keep a grid of cells which must be handled while the others are keep dormant. Only handled cells will then be checked.

[Test the "game" here](https://bertrandpsi.github.io/SandOfTime/)

On purpose I decided to not use any other library, no JQuery, no premade CSS, just plain vanilla. The loop should in most case run with 60FPS yet in each loop 20 iterrations are done. Maybe in the future particle acceleration will be implemented as well as non vertical movements (like explosions).

With the current level of optimization the code runs fast enough even with a full screen and having particles of the size of the pixel. Yet, if all the screen must be updated (like while doing a flip), the performances will suffer.

This kind of engine could be used for a platformer game where some parts are destructible, and sand could fall and either allow or block the progression.