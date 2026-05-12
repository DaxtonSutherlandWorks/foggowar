import { applyViewportTransform, clampCamera, getPointerData } from "./ViewportUtils";

/**
 * Executes a panning click
 */
export function panPointerDown(editorContextRef, pointer)
{
    const { panningStartCameraXRef, panningStartCameraYRef, panningStartScreenXRef, panningStartScreenYRef, viewportRef, viewportStateRef, interactionStateRef} = editorContextRef.current;
    
    panningStartScreenXRef.current = pointer.screen.x;
    panningStartScreenYRef.current = pointer.screen.y;

    panningStartCameraXRef.current = viewportStateRef.current.cameraX;
    panningStartCameraYRef.current = viewportStateRef.current.cameraY;

    interactionStateRef.current.grabbing = true;

    viewportRef.current.style.cursor = "grabbing";
}

/**
 * Handles pointer movement for panning
 */
export function panPointerMove(editorContextRef, pointer)
{
    const { interactionStateRef, panningStartScreenXRef, panningStartScreenYRef, viewportStateRef, panningStartCameraXRef, panningStartCameraYRef, viewportRef, gridCanvasRef, canvasStageRef } = editorContextRef.current;

    if(!interactionStateRef.current.grabbing)
    {
        return;
    }

    //Calculates length of pan
    const panDistanceX = pointer.screen.x - panningStartScreenXRef.current;
    const panDistanceY = pointer.screen.y - panningStartScreenYRef.current;

    //Documents current pan coords
    viewportStateRef.current.cameraX = panningStartCameraXRef.current + panDistanceX;
    viewportStateRef.current.cameraY = panningStartCameraYRef.current + panDistanceY;

    //Takes the current pan coords and forces them to reenter the map if they had gotten out of bounds
    clampCamera(viewportStateRef.current, viewportRef.current.clientWidth, viewportRef.current.clientHeight, gridCanvasRef.current.width, gridCanvasRef.current.height);

    //Updates visuals
    applyViewportTransform(viewportStateRef.current, canvasStageRef.current);
}

/**
 * Handles pointerUp during panning
 */
export function panPointerUp(editorContextRef, event)
{
    const { interactionStateRef, viewportRef} = editorContextRef.current;

    //Aborts if not actively panning
    if (interactionStateRef.current.mode !== "panning" || !interactionStateRef.current.grabbing)
    {
        return;
    }

    interactionStateRef.current.grabbing = false;

    //Exits middle mouse pan mode and returns to previous brush
    if (event.button === 1 && interactionStateRef.current.middlePan)
    {
        interactionStateRef.current.middlePan = false;
        interactionStateRef.current.mode = "inactive";
        viewportRef.current.style.cursor = "default";
        return;
    }

    viewportRef.current.style.cursor = "grab";
}

/**
 * Handles the pointer leaving the canvas during panning
 */
export function panPointerLeave(editorContextRef)
{
    const { interactionStateRef, viewportRef} = editorContextRef.current;

    //Aborts if not actively panning
    if (interactionStateRef.current.mode !== "panning")
    {
        return;
    }

    interactionStateRef.current.grabbing = false;
    viewportRef.current.style.cursor = "grab";
}

/**
 * Handles pointer scrolling
 */
export function zoomPointerWheel(editorContextRef, event)
{
    const { viewportStateRef, viewportRef, canvasStageRef, gridCanvasRef} = editorContextRef.current;
    //Zoom math

    //Translate mouse wheel delta (scroll ammount with direction shown by sign) into a +/-10% factor to use for scaling
    const zoomFactor = event.deltaY < 0 ? 1.1 : 0.9;

    const oldZoom = viewportStateRef.current.zoom;

    let newZoom = oldZoom * zoomFactor;

    //Locks zoom to set max/min
    newZoom = Math.max(
        viewportStateRef.current.minZoom,
        Math.min(
            viewportStateRef.current.maxZoom,
            newZoom
        )
    );

    const pointer = getPointerData(event, viewportRef.current, viewportStateRef.current);

    //Applying transformations

    //Zoom
    viewportStateRef.current.zoom = newZoom;

    //Panning
    viewportStateRef.current.cameraX = pointer.screen.x - (pointer.world.x * newZoom);
    viewportStateRef.current.cameraY = pointer.screen.y - (pointer.world.y * newZoom);

    clampCamera(viewportStateRef.current, viewportRef.current.clientWidth, viewportRef.current.clientHeight, gridCanvasRef.current.width, gridCanvasRef.current.height);

    applyViewportTransform(viewportStateRef.current, canvasStageRef.current);
}