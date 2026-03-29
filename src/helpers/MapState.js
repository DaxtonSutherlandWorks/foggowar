/**
 * This file contains a function to create a new map state and functions to operate on it.
 */

/**
 * Returns a default mapState
 */
export function createInitialMapState(mapDimensions, tileSize)
{
    return {
        version: "0.1.1",
        id: crypto.randomUUID(),
        owner: "dev",
        createdAt: new Date(),
        public: true,
        title: "TEST MAP",

        metadata: {
            width: mapDimensions[1] * tileSize,
            height: mapDimensions[0] * tileSize,
            dimensions: mapDimensions
        },

        shapes: [],
        lines: [],
        stamps: []
    };
}

/**
 * Adds a shape to the mapState
 */
export function addShape(state, shape)
{
    state.shapes.push(shape);
}

/**
 * Adds a line to the mapState
 */
export function addLine(state, line)
{
    state.lines.push(line);
}

/**
 * Adds a stamp to the mapState
 */
export function addStamp(state, stamp)
{
    state.stamps.push(stamp);
}

/**
 * Deletes a shape from the mapState
 */
export function deleteShape(state, shape)
{
    state.shapes = state.shapes.filter(s => s.id !== shape.id);
}

/**
 * Deletes a line from the mapState
 */
export function deleteLine(state, line)
{
    state.lines = state.lines.filter(l => l.id !== line.id);
}

/**
 * Deletes a stamp from the mapState
 */
export function deleteStamp(state, stamp)
{
    state.stamps = state.stamps.filter(s => s.id !== stamp.id);
}