import { useState } from "react";
import { DeleteStampCommand } from "../classes/DeleteStampCommand";
import { DrawStampCommand } from "../classes/DrawStampCommand";
import { createBoundingBox, isSquareCleared, rebuildStampCanvas, withinBox } from "./BrushUtils";

/**
 * Executes stamp draw/deletion clicks
 */
export function stampPointerDown(editorContextRef, guidePoint, currStamp, worldPointer, selectedStampRef)
{
    const { interactionStateRef, mapStateRef, commandManagerRef, solidContextRef, stampContextRef, overlayContextRef} = editorContextRef.current;

    //Tries to select a stamp for interaction.
    if (interactionStateRef.current.mode === "selection")
        {
            //Find the first stamp that the cursor is over
            const stamp = getPointerStamp(mapStateRef, worldPointer.x, worldPointer.y);

            //Outline Stamp
            if (stamp)
            {
                const boundingBox = createBoundingBox({type: "rectangle", x: stamp.x, y: stamp.y, width: stamp.width, height: stamp.height});

                drawStampSelectionBox(overlayContextRef.current, boundingBox);

                interactionStateRef.current.mode = "selected";
                selectedStampRef.current = stamp;
            }
            
        }

    //Checks if the click is over the stamp, and interaction handle, or outside the stamp.
    else if (interactionStateRef.current.mode === "selected")
    {
        const stamp = selectedStampRef.current;
        const boundingBox = createBoundingBox({type: "rectangle", x: stamp.x, y: stamp.y, width: stamp.width, height: stamp.height});

        //Checks if any handles are being clicked.
        const clickedHandle = getHoveredHandle(worldPointer.x, worldPointer.y, boundingBox);
        
        //Resizing - Handles an interaction handle being clicked.
        if (clickedHandle)
        {
            interactionStateRef.current.mode = "resizing-stamp";
            interactionStateRef.current.activeStampHandle = clickedHandle;

            stampContextRef.current.clearRect(stamp.x, stamp.y, stamp.width, stamp.height);
        }

        //Moving - Handles the stamp being clicked.
        else if (withinBox(worldPointer.x, worldPointer.y, boundingBox))
        {
            //TODO
        }

        //Deselction - Handles clicks that land outside of the stamps.
        else
        {
            interactionStateRef.current.mode = "selection";
            selectedStampRef.current = null;

            //Clears selection box
            overlayContextRef.current.clearRect(0, 0, overlayContextRef.current.canvas.width, overlayContextRef.current.canvas.height);
        }
    }

    else if (interactionStateRef.current.mode === "resizing-stamp")
    {
        let selectedStamp = selectedStampRef.current;
        const activeHandle = interactionStateRef.current.activeStampHandle;

        const resizeDimensions = calculateResizeDimensions(selectedStamp, guidePoint, activeHandle);

        //Replace the old stamp with the new information
        const oldStamp = mapStateRef.current.stamps.find(
            oldStamp => oldStamp.id === selectedStamp.id
        )

        //TODO: Add handling for negative values to just bump x and y
        if (oldStamp)
        {
            oldStamp.x = resizeDimensions.x;
            oldStamp.y = resizeDimensions.y;
            oldStamp.width = resizeDimensions.width;
            oldStamp.height = resizeDimensions.height;
        }

        //Rebuild Stamp Canvas
        //TODO: Optimize to only redraw within stamp area
        rebuildStampCanvas(editorContextRef.current);

        interactionStateRef.current.mode = "selection";
        overlayContextRef.current.clearRect(0, 0, overlayContextRef.current.canvas.width, overlayContextRef.current.canvas.height);
    }

    //TODO: This can be made more efficient by merging with selection funcitonality once complete
    else if(guidePoint)
    {
        //Stamp Deletion
        if (interactionStateRef.current.deletion)
        {
            //Checks all stamps to find a match
            for (let i = mapStateRef.current.stamps.length - 1; i >= 0; i--)
            {
                if (guidePoint.x >= mapStateRef.current.stamps[i].x 
                    && guidePoint.x <= mapStateRef.current.stamps[i].x + mapStateRef.current.stamps[i].width
                    && guidePoint.y >= mapStateRef.current.stamps[i].y
                    && guidePoint.y <= mapStateRef.current.stamps[i].y + mapStateRef.current.stamps[i].height)
                    {
                        const stamp = mapStateRef.current.stamps[i];

                        commandManagerRef.current.execute(
                            new DeleteStampCommand(stamp)
                        );
                    }
            }
        }

        //Draws the stamp
        else
        {
            const stamp = {
                id: crypto.randomUUID(), 
                imagePath: currStamp.image, 
                x: guidePoint.x, 
                y: guidePoint.y, 
                width: currStamp.width, 
                height: currStamp.height
            };

            //Creates a new command that is executed through its own helper, then added to the manager's undo stack.
            commandManagerRef.current.execute(
                new DrawStampCommand(stamp)
            );

            //Clears the redo stack to avoid conflicts
            commandManagerRef.current.clearRedoStack();
        }
    }
}

/**
 * Handles stamp preview drawing
 */
export function stampPointerMove(editorContextRef, guidePoint, stampImg, currStamp, worldPointer, selectedStampRef)
{
    const { interactionStateRef, overlayContextRef, solidContextRef, stampContextRef, viewportRef, overlayCanvasRef} = editorContextRef.current;

    //Handles mouse movement in selection mode
    if (interactionStateRef.current.mode === "selected")
    {
        const stamp = selectedStampRef.current;

        if (stamp)
        {
            const boundingBox = createBoundingBox({type: "rectangle", x: stamp.x, y: stamp.y, width: stamp.width, height: stamp.height});

            //Sets the cursor if over the interacting stamp
            if (withinBox(worldPointer.x, worldPointer.y, boundingBox))
            {
                viewportRef.current.style.cursor = "grab";
            }

            //Reverts the cursor if grabbing and not over the stamp
            else if (viewportRef.current.style.cursor === "grab")
            {
                viewportRef.current.style.cursor = "default";
            }
        }
    }

    //Handles mouse movement in resizing-stamp mode
    else if (interactionStateRef.current.mode === "resizing-stamp")
    {
        const resizeDimensions = calculateResizeDimensions(selectedStampRef.current, worldPointer, interactionStateRef.current.activeStampHandle);

        //Resize preview.
        overlayContextRef.current.drawImage(
            stampImg,
            resizeDimensions.x,
            resizeDimensions.y,
            resizeDimensions.width,
            resizeDimensions.height
        );
    }

    //Handles mouse movement in adding mode
    else if (guidePoint && !interactionStateRef.current.deletion && interactionStateRef.current.mode === "inactive")
    {
        overlayContextRef.current.drawImage(stampImg, guidePoint.x, guidePoint.y, currStamp.width, currStamp.height);        
    }
}

/**
 * Finds the first stamp that the pointer lays over
 */
export function getPointerStamp(mapStateRef, pointerX, pointerY)
{
    const stamps = mapStateRef.current.stamps;

    for (let stampIdx in stamps)
    {
        const boundingBox = createBoundingBox({type: "rectangle", x: stamps[stampIdx].x, y: stamps[stampIdx].y, width: stamps[stampIdx].width, height: stamps[stampIdx].height});

        if (withinBox(pointerX, pointerY, boundingBox))
        {
            return stamps[stampIdx];
        }
    }
}

/**
 * Draws the selection box with interaction handles on the overlay canvas above a given stamp's bounding box.
 */
function drawStampSelectionBox(ctx, boundingBox)
{
    //Setting up landmarks
    const handleCoords = calculateInteractionHandles(boundingBox);

    //Drawing outline
    ctx.save();

    ctx.strokeStyle = "black";
    ctx.lineWidth = 1;

    ctx.strokeRect(handleCoords.left, handleCoords.top, boundingBox.width, boundingBox.height);

    //Drawing interaction handles
    drawInterationHandles(ctx, handleCoords);

    ctx.restore();
}

/**
 * Calculate a boundingBox's interaction handles.
 */
function calculateInteractionHandles(boundingBox)
{
    const left = boundingBox.x;
    const right = boundingBox.x + boundingBox.width;
    const top = boundingBox.y;
    const bottom = boundingBox.y + boundingBox.height;

    const centerX = (left + right) / 2;
    const centerY = (bottom + top) / 2;

    return {left: left, right: right, top: top, bottom: bottom, centerX: centerX, centerY: centerY};
}

/**
 * Draws all the interaction handles for a boundingBox.
 */
function drawInterationHandles(ctx, handleCoords)
{
    drawHandle(ctx, handleCoords.left, handleCoords.top);
    drawHandle(ctx, handleCoords.centerX, handleCoords.top);
    drawHandle(ctx, handleCoords.right, handleCoords.top);

    drawHandle(ctx, handleCoords.left, handleCoords.centerY);
    drawHandle(ctx, handleCoords.right, handleCoords.centerY);

    drawHandle(ctx, handleCoords.left, handleCoords.bottom);
    drawHandle(ctx, handleCoords.centerX, handleCoords.bottom);
    drawHandle(ctx, handleCoords.right, handleCoords.bottom);
}

/**
 * Draws a rectangular interaction handle at a given point on the given canvas. Helper to drawStampSelectionBox.
 */
function drawHandle(ctx, x, y)
{
    const size = 8;

    ctx.save();

    ctx.fillStyle = "white";
    ctx.strokeStyle = "black";

    ctx.fillRect(x - size / 2, y - size / 2, size, size);
    ctx.strokeRect(x - size / 2, y - size / 2, size, size);

    ctx.restore();
}

/**
 * Determines if coordinates lie within the interaction range of an interation handle.
 */
function getHoveredHandle(x, y, boundingBox)
{
    const handlePadding = 12;
    const handleCoords = calculateInteractionHandles(boundingBox);

    //Sets up inmportant coords for one clean check loop.
    const handles = {
        "top-left": {
            x: handleCoords.left,
            y: handleCoords.top
        },
        "top": {
            x: handleCoords.centerX,
            y: handleCoords.top
        },
        "top-right": {
            x: handleCoords.right,
            y: handleCoords.top
        },
        "left": {
            x: handleCoords.left,
            y: handleCoords.centerY
        },
        "right": {
            x: handleCoords.right,
            y: handleCoords.centerY
        },
        "bottom-left": {
            x: handleCoords.left,
            y: handleCoords.bottom
        },
        "bottom": {
            x: handleCoords.centerX,
            y: handleCoords.bottom
        },
        "bottom-right": {
            x: handleCoords.right,
            y: handleCoords.bottom
        }
    };

    //Checks if x & y are within range of any interaction handle.
    for (const [name, handle] of Object.entries(handles)) {
        if (
            x >= handle.x - handlePadding &&
            x <= handle.x + handlePadding &&
            y >= handle.y - handlePadding &&
            y <= handle.y + handlePadding
        ) {
            return name;
        }
    }

    return null;
}

/**
 * Calculates the new dimensions of a resized stamp given the original stamp, the cursor's coordinate for a resize preview
 * or a guide point for a snapping resize commit, and the active handle.
 * Returns an object with the resized dimensions with the format:
 * {x, y, width, height, right, bottom}
 */
function calculateResizeDimensions(stamp, resizePoint, handle)
{
    let x = stamp.x;
    let y = stamp.y;
    let width = stamp.width;
    let height = stamp.height;

    const right = stamp.x + stamp.width;
    const bottom = stamp.y + stamp.height;

    //Sets up resizing to only move one or two edges based on the handle grabbed.
    switch (handle)
    {
        case "top-left":
            x = resizePoint.x;
            y = resizePoint.y;
            width = right - resizePoint.x;
            height = bottom - resizePoint.y;
            break;

        case "top":
            y = resizePoint.y;
            height = bottom - resizePoint.y;
            break;

        case "top-right":
            y = resizePoint.y;
            width = resizePoint.x - stamp.x;
            height = bottom - resizePoint.y;
            break;

        case "left":
            x = resizePoint.x;
            width = right - resizePoint.x;
            break;

        case "right":
            width = resizePoint.x - stamp.x;
            break;

        case "bottom-left":
            x = resizePoint.x;
            width = right - resizePoint.x;
            height = resizePoint.y - stamp.y;
            break;

        case "bottom":
            height = resizePoint.y - stamp.y;
            break;

        case "bottom-right":
            width = resizePoint.x - stamp.x;
            height = resizePoint.y - stamp.y;
            break;
    }

    return {x, y, width, height, right, bottom};
}