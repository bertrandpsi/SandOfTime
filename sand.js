var ctx;
var backBuffer;
var width, height;
var stats;

var world = [];
var downState = [];
var upState = [];
var particleColors = [[0, 0, 0], [168, 139, 34], [217, 199, 37], [196, 160, 96], [84, 47, 29], [61, 31, 16], [51, 34, 26], [134, 186, 184], [167, 204, 203], [124, 196, 194]]
var particleTypes = [[0], [1, 2, 3], [4, 5, 6], [7, 8, 9]];
var currentType = 1;
var fallingParticle = [1, 2, 3];
var floatingParticle = [7, 8, 9];
var stateGridSize = 10;
var stateWidth, stateHeight;

var mx = null, my = null;

function SetPixel(x, y, c)
{
    if (x < 0 || x >= width || y < 0 || y >= height) // Prevent paint outside of the canvas
        return;
    backBuffer.data[x * 4 + y * width * 4] = c[0];
    backBuffer.data[x * 4 + y * width * 4 + 1] = c[1];
    backBuffer.data[x * 4 + y * width * 4 + 2] = c[2];
    backBuffer.data[x * 4 + y * width * 4 + 3] = 255;
}

function GetPixel(x, y)
{
    if (x < 0 || x >= width || y < 0 || y >= height) // Prevent paint outside of the canvas
        return [0, 0, 0];
    return [backBuffer.data[x * 4 + y * width * 4], backBuffer.data[x * 4 + y * width * 4 + 1], backBuffer.data[x * 4 + y * width + 2]];
}

function Clear()
{
    if (!world || world.length < width * height)
    {
        world = Array(width * height);
        stateWidth = Math.ceil(width / stateGridSize);
        stateHeight = Math.ceil(height / stateGridSize);
        downState = Array(stateWidth * stateHeight);
        upState = Array(stateWidth * stateHeight);
    }
    for (var x = 0; x < downState.length; x++)
    {
        downState[x] = true;
        upState[x] = true;
    }
    for (var x = 0; x < width; x++)
    {
        for (var y = 0; y < height; y++)
        {
            world[x + y * width] = 0;
            SetPixel(x, y, particleColors[0]);
        }
    }
}

function PaintBackbuffer()
{
    ctx.putImageData(backBuffer, 0, 0);
}

function PlaceRandom(cx, cy, radius, possibleTypes)
{
    for (var x = cx - radius; x <= cx + radius; x++)
    {
        for (var y = cy - radius; y <= cy + radius; y++)
        {
            if (x < 0 || x >= width || y < 0 || y >= height - 1)
                continue;
            var a = cx - x;
            var b = cy - y;

            let rpos = Math.sqrt(a * a + b * b) / radius;
            if (Math.random() >= rpos)
            {
                var t = 0;
                if (possibleTypes.length)
                    t = possibleTypes[Math.round(Math.random() * (possibleTypes.length - 1))];
                else
                    t = possibleTypes;
                SetWorld(x, y, t);
                var sx = Math.floor(x / stateGridSize);
                var sy = Math.floor(y / stateGridSize);
                downState[sx + sy * stateWidth] = true;
                upState[sx + sy * stateWidth] = true;
                if (y % stateGridSize == stateGridSize - 1 && sy < stateHeight - 1) // We are at the bottom of the grid block, let's make the next one dirty too
                {
                    downState[sx + (sy + 1) * stateWidth] = true;
                    upState[sx + (sy + 1) * stateWidth] = true;
                }
                if (y % stateGridSize == 0 && sy > 0) // We are at the top of the grid block, let's make the next one dirty too
                {
                    downState[sx + (sy - 1) * stateWidth] = true;
                    upState[sx + (sy - 1) * stateWidth] = true;
                }

                SetPixel(x, y, particleColors[t]);
            }
        }
    }
}

function GetWorld(x, y)
{
    if (x < 0 || x >= width || y < 0 || y >= height)
        return 0;
    return world[x + y * width];
}

function SetWorld(x, y, t)
{
    if (x < 0 || x >= width || y < 0 || y >= height)
        return;
    world[x + y * width] = t;
}

function HandleParticleUp()
{

    // From bottom to top for falling particles
    for (var sy = 0; sy < stateHeight; sy++)
    {
        for (var sx = 0; sx < stateWidth; sx++)
        {
            if (upState[sx + sy * stateWidth] == false)
                continue;
            var isDirty = false;
            for (var by = 0; by < stateGridSize; by++)
            {
                for (var bx = 0; bx < stateGridSize; bx++)
                {
                    var x = sx * stateGridSize + bx;
                    var y = sy * stateGridSize + by;
                    if (y >= height || x >= width)
                        continue;

                    var t = GetWorld(x, y);
                    if (t == 0) // We are free we can handle it
                    {
                        t = GetWorld(x, y + 1); // Just above
                        var tl = GetWorld(x - 1, y + 1); // Left top
                        var tr = GetWorld(x + 1, y + 1); // Left right
                        var modified = false;
                        if (floatingParticle.indexOf(t) != -1) // Must fall
                        {
                            SetWorld(x, y + 1, 0);
                            SetWorld(x, y, t);

                            SetPixel(x, y + 1, particleColors[0]);
                            SetPixel(x, y, particleColors[t]);
                            isDirty = true;
                            modified = true;
                        }
                        else if (floatingParticle.indexOf(tl) != -1)
                        {
                            SetWorld(x - 1, y + 1, 0);
                            SetWorld(x, y, tl);

                            SetPixel(x - 1, y + 1, particleColors[0]);
                            SetPixel(x, y, particleColors[tl]);
                            isDirty = true;

                            //if (bx == 0 && sx > 0) {
                            if (sx > 0)
                            {
                                if (by == 0 && sy < stateHeight - 1)
                                    upState[(sx - 1) + (sy + 1) * stateWidth] = true;
                                upState[(sx - 1) + sy * stateWidth] = true;
                            }
                            modified = true;
                        }
                        else if (floatingParticle.indexOf(tr) != -1 && GetWorld(x + 1, y) != 0)
                        {
                            SetWorld(x + 1, y + 1, 0);
                            SetWorld(x, y, tr);

                            SetPixel(x + 1, y + 1, particleColors[0]);
                            SetPixel(x, y, particleColors[tr]);
                            isDirty = true;

                            if (sx < stateWidth - 1)
                            {
                                if (by == 0 && sy < stateHeight - 1)
                                    upState[(sx + 1) + (sy + 1) * stateWidth] = true;
                                upState[(sx + 1) + sy * stateWidth] = true;
                            }
                            modified = true;
                        }

                        if (modified)
                        {
                            if (bx == 0 && sx > 0)
                                upState[(sx - 1) + sy * stateWidth] = true;
                            if (bx == stateGridSize - 1 && sx < stateWidth - 1)
                                upState[(sx + 1) + sy * stateWidth] = true;
                            if (by == 0 && sy > 0)
                                upState[sx + (sy - 1) * stateWidth] = true;
                            if (by == stateGridSize - 1 && sy < stateHeight - 1)
                                upState[sx + (sy + 1) * stateWidth] = true;
                        }

                    }
                }
            }
            upState[sx + sy * stateWidth] = isDirty;
        }
    }
}

function HandleParticleDown()
{
    // From bottom to top for falling particles
    for (var sy = stateHeight - 1; sy >= 0; sy--)
    {
        for (var sx = 0; sx < stateWidth; sx++)
        {
            if (downState[sx + sy * stateWidth] == false)
                continue;
            var isDirty = false;
            for (var by = stateGridSize - 1; by >= 0; by--)
            {
                for (var bx = 0; bx < stateGridSize; bx++)
                {
                    var x = sx * stateGridSize + bx;
                    var y = sy * stateGridSize + by;
                    if (y >= height || x >= width)
                        continue;

                    var t = GetWorld(x, y);
                    if (t == 0) // We are free we can handle it
                    {
                        t = GetWorld(x, y - 1); // Just above
                        var tl = GetWorld(x - 1, y - 1); // Left top
                        var tr = GetWorld(x + 1, y - 1); // Left right
                        var modified = false;
                        if (fallingParticle.indexOf(t) != -1) // Must fall
                        {
                            SetWorld(x, y - 1, 0);
                            SetWorld(x, y, t);

                            SetPixel(x, y - 1, particleColors[0]);
                            SetPixel(x, y, particleColors[t]);
                            isDirty = true;
                            modified = true;
                        }
                        else if (fallingParticle.indexOf(tl) != -1)
                        {
                            SetWorld(x - 1, y - 1, 0);
                            SetWorld(x, y, tl);

                            SetPixel(x - 1, y - 1, particleColors[0]);
                            SetPixel(x, y, particleColors[tl]);
                            isDirty = true;

                            //if (bx == 0 && sx > 0) {
                            if (sx > 0)
                            {
                                if (by == 0 && sy > 0)
                                    downState[(sx - 1) + (sy - 1) * stateWidth] = true;
                                downState[(sx - 1) + sy * stateWidth] = true;
                            }
                            modified = true;
                        }
                        else if (fallingParticle.indexOf(tr) != -1 && GetWorld(x + 1, y) != 0)
                        {
                            SetWorld(x + 1, y - 1, 0);
                            SetWorld(x, y, tr);

                            SetPixel(x + 1, y - 1, particleColors[0]);
                            SetPixel(x, y, particleColors[tr]);
                            isDirty = true;

                            if (sx < stateWidth - 1)
                            {
                                if (by == 0 && sy > 0)
                                    downState[(sx + 1) + (sy - 1) * stateWidth] = true;
                                downState[(sx + 1) + sy * stateWidth] = true;
                            }
                            modified = true;
                        }

                        if (modified)
                        {
                            if (bx == 0 && sx > 0)
                                downState[(sx - 1) + sy * stateWidth] = true;
                            if (bx == stateGridSize - 1 && sx < stateWidth - 1)
                                downState[(sx + 1) + sy * stateWidth] = true;
                            if (by == 0 && sy > 0)
                                downState[sx + (sy - 1) * stateWidth] = true;
                            if (by == stateGridSize - 1 && sy < stateHeight - 1)
                                downState[sx + (sy + 1) * stateWidth] = true;
                        }

                    }
                }
            }
            downState[sx + sy * stateWidth] = isDirty;
        }
    }
}

function LogicLoop()
{
    if (mx !== null)
    {
        PlaceRandom(mx, my, 10, particleTypes[currentType]);
    }

    for (var i = 0; i < 20; i++)
    {
        HandleParticleDown();
        HandleParticleUp();
    }

    PaintBackbuffer();

    requestAnimationFrame(LogicLoop);
}

function DrawGrid()
{
    // Draw sand optimization grid
    ctx.beginPath(); // Start a new path
    ctx.strokeStyle = "rgba(0,255,0,0.1)";
    for (var x = 0; x < stateWidth; x++)
    {
        ctx.moveTo(x * stateGridSize + 0.5, 0);
        ctx.lineTo(x * stateGridSize + 0.5, height);
    }
    for (var y = 0; y < stateHeight; y++)
    {
        ctx.moveTo(0, y * stateGridSize + 0.5);
        ctx.lineTo(width, y * stateGridSize + 0.5);
    }
    ctx.stroke(); // Render the path    
}

function Resize()
{
    var w = width;
    var h = height;
    document.getElementById("canvas").height = document.body.clientHeight;
    document.getElementById("canvas").width = document.body.clientWidth;
    width = document.body.clientWidth;
    height = document.body.clientHeight;

    // Copy over the world and repaint it
    backBuffer = ctx.createImageData(width, height);
    var newWorld = Array(width * height);
    for (var x = 0; x < width; x++)
    {
        for (var y = 0; y < height; y++)
        {
            if (x < w && y < h)
                newWorld[x + y * width] = world[x + y * w];
            else
                newWorld[x + y * width] = 0;
            SetPixel(x, y, particleColors[newWorld[x + y * width]]);
        }
    }
    world = newWorld;

    // Copy over the world state
    w = stateWidth;
    h = stateHeight;
    stateWidth = Math.ceil(width / stateGridSize);
    stateHeight = Math.ceil(height / stateGridSize);
    var newState = Array(stateWidth * stateHeight);

    for (var x = 0; x < newState.length; x++)
        newState[x] = true;
    downState = newState;
}

function MouseDown(evt)
{
    mx = evt.clientX;
    my = evt.clientY;
    document.getElementById("canvas").addEventListener("mousemove", MouseMove);
}

function MouseMove(evt)
{
    mx = evt.clientX;
    my = evt.clientY;
}

function MouseUp(evt)
{
    document.getElementById("canvas").removeEventListener("mousemove", MouseMove);
    mx = null;
    my = null;
}

function KeyDown(evt)
{
    switch (evt.key)
    {
        case "0": // Clear
            currentType = 0;
            break;
        case "1": // Sand => falling
            currentType = 1;
            break;
        case "2": // Dirt => Fixed
            currentType = 2;
            break;
        case "3": // Air => Floating
            currentType = 3;
            break;
        default:
            break;
    }
}

function Init()
{
    var canvas = document.getElementById("canvas");
    ctx = canvas.getContext("2d");
    canvas.height = document.body.clientHeight;
    canvas.width = document.body.clientWidth;
    width = document.body.clientWidth;
    height = document.body.clientHeight;

    backBuffer = ctx.createImageData(width, height);
    Clear();
    //PlaceRandom(200, 200, 10, 1);
    PaintBackbuffer();

    requestAnimationFrame(LogicLoop);
    addEventListener("resize", Resize);
    canvas.addEventListener("mousedown", MouseDown);
    canvas.addEventListener("mouseup", MouseUp);
    document.addEventListener("keydown", KeyDown);
}

addEventListener("load", Init);