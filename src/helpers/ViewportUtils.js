/**
 * This file contains a funciton to create and manage viewport states.
 */

/**
 * Viewport initializer
 */
export function createInitialViewportState()
{
    return {
        zoom: 1,
        cameraX: 0,
        cameraY: 0,

        minZoom: 0.5,
        maxZoom: 4,
        zoomStep: 0.1
    }
}

/**
 * Applies zoom from a viewport state to a canvas stage
 */
export function applyViewportTransform(viewportState, canvasStage)
{
    const zoom = viewportState.zoom;
    const cameraX = viewportState.cameraX;
    const cameraY = viewportState.cameraY;

    canvasStage.style.transform = `translate(${cameraX}px, ${cameraY}px) scale(${zoom})`;

    canvasStage.style.transformOrigin = "top left";
}

/**
 * Convert screen coordinates to world coordinates
 */
export function screenToWorld(screenX, screenY, viewportState)
{
    const x = (screenX - viewportState.cameraX) / viewportState.zoom;
    const y = (screenY - viewportState.cameraY) / viewportState.zoom;

    return {x, y};
}

/**
 * Clamps camera positioning to avoid out of bounds displays
 */
export function clampCamera(viewportState, viewportWidth, viewportHeight, worldWidth, worldHeight)
{
    const scaledWorldWidth = worldWidth * viewportState.zoom;
    const scaledWorldHeight = worldHeight * viewportState.zoom;

    const minCameraX = Math.min(0,viewportWidth - scaledWorldWidth);
    const minCameraY = Math.min(0, viewportHeight - scaledWorldHeight);

    viewportState.cameraX = Math.max(minCameraX, Math.min(0, viewportState.cameraX));
    viewportState.cameraY = Math.max(minCameraY, Math.min(0, viewportState.cameraY));
}

/**
 * Returns the pointer's position in world space and screen space
 */
export function getPointerData(event, viewport, viewportState)
{
    const rect = viewport.getBoundingClientRect();

    const screen = {x: event.clientX - rect.left, y: event.clientY - rect.top};

    const world = screenToWorld(event.clientX - rect.left, event.clientY - rect.top, viewportState);

    return {world, screen};
}