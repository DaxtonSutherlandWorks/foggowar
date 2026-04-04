/**
 * Contains all the functionality needed to made uniform shapes to be used in the map editor.
 */

/****************************************************
 * Constants
 ****************************************************/
export const SHAPE_TYPES = 
{
    RECTANGLE: "rectangle",
    CIRCLE: "circle",
    POLYGON: "polygon"
};

export const SHAPE_OPERATIONS = 
{
    ADD: "add",
    SUBTRACT: "subtract"
};

/****************************************************
 * Helpers
 ****************************************************/

const isFiniteNumber = (n) => Number.isFinite(n);

/****************************************************
 * Rectangle functions
 ****************************************************/

export function normalizeRectangle(input) 
{
    return {
        id: input.id ?? crypto.randomUUID(),
        type: SHAPE_TYPES.RECTANGLE,

        x: Number(input.x ?? 0),
        y: Number(input.y ?? 0),

        width: Number(input.width ?? 1),
        height: Number(input.height ?? 1),

        operation: input.operation ?? SHAPE_OPERATIONS.ADD
    };
}

export function validateRectangle(shape) 
{
    if (shape.type !== SHAPE_TYPES.RECTANGLE) 
    {
        throw new Error("Invalid rectangle type");
    }

    if (typeof shape.id !== "string") 
    {
        throw new Error("Rectangle must have id");
    }

    if (!isFiniteNumber(shape.x) || !isFiniteNumber(shape.y)) 
    {
        throw new Error("Rectangle x/y must be numbers");
    }

    if (!isFiniteNumber(shape.width) || shape.width <= 0) 
    {
        throw new Error("Rectangle width must be > 0");
    }

    if (!isFiniteNumber(shape.height) || shape.height <= 0) 
    {
        throw new Error("Rectangle height must be > 0");
    }

    if (!Object.values(SHAPE_OPERATIONS).includes(shape.operation)) 
    {
        throw new Error("Invalid rectangle operation");
    }

    return true;
}

export function createRectangle(input) 
{
    const shape = normalizeRectangle(input);
    validateRectangle(shape);
    return shape;
}

/****************************************************
 * Circle functions
 ****************************************************/

export function normalizeCircle(input) 
{
    return {
        id: input.id ?? crypto.randomUUID(),
        type: SHAPE_TYPES.CIRCLE,

        x: Number(input.cx ?? input.x ?? 0),
        y: Number(input.cy ?? input.y ?? 0),

        r: Number(input.radius ?? input.r ?? 1),

        operation: input.operation ?? SHAPE_OPERATIONS.ADD
    };
}

export function validateCircle(shape) 
{
    if (shape.type !== SHAPE_TYPES.CIRCLE) 
    {
        throw new Error("Invalid circle type");
    }

    if (typeof shape.id !== "string") 
    {
        throw new Error("Circle must have id");
    }

    if (!isFiniteNumber(shape.x) || !isFiniteNumber(shape.y)) 
    {
        throw new Error("Circle center must be numbers");
    }

    if (!isFiniteNumber(shape.r) || shape.r <= 0) 
    {
        throw new Error("Circle radius must be > 0");
    }

    if (!Object.values(SHAPE_OPERATIONS).includes(shape.operation)) 
    {
        throw new Error("Invalid circle operation");
    }

    return true;
}

export function createCircle(input) 
{
    const shape = normalizeCircle(input);
    validateCircle(shape);
    return shape;
}

/****************************************************
 * Polygon functions
 ****************************************************/

function cleanPoints(points) 
{
    //Removes duplicates and non-numbers
    return points
        .map(p => ({
            x: Number(p.x ?? 0),
            y: Number(p.y ?? 0)
        }))
        .filter(p => isFiniteNumber(p.x) && isFiniteNumber(p.y))
        .filter((p, i, arr) => {
            if (i === 0) return true;
            const prev = arr[i - 1];
            return p.x !== prev.x || p.y !== prev.y;
        });
}

export function normalizePolygon(input) 
{
    const rawPoints = input.points ?? [];

    const points = cleanPoints(rawPoints);

    return {
        id: input.id ?? crypto.randomUUID(),
        type: SHAPE_TYPES.POLYGON,

        points,

        operation: input.operation ?? SHAPE_OPERATIONS.ADD
    };
}

export function validatePolygon(shape) {
    if (shape.type !== SHAPE_TYPES.POLYGON) 
    {
        throw new Error("Invalid polygon type");
    }

    if (typeof shape.id !== "string") 
    {
        throw new Error("Polygon must have id");
    }

    if (!Array.isArray(shape.points)) 
    {
        throw new Error("Polygon must have points array");
    }

    if (shape.points.length < 3) 
    {
        throw new Error("Polygon must have at least 3 points");
    }

    for (const p of shape.points) 
    {
        if (!isFiniteNumber(p.x) || !isFiniteNumber(p.y)) 
        {
            throw new Error("Invalid polygon point");
        }
    }

    if (!Object.values(SHAPE_OPERATIONS).includes(shape.operation)) 
    {
        throw new Error("Invalid polygon operation");
    }

    return true;
}

export function createPolygon(input) {
    const shape = normalizePolygon(input);
    validatePolygon(shape);
    return shape;
}

/****************************************************
 * Versitile call funcitons
 ****************************************************/

export function normalizeShape(shape) 
{
    switch (shape.type) 
    {
        case SHAPE_TYPES.RECTANGLE:
            return normalizeRectangle(shape);
        case SHAPE_TYPES.CIRCLE:
            return normalizeCircle(shape);
        case SHAPE_TYPES.POLYGON:
            return normalizePolygon(shape);
        default:
            throw new Error(`Unknown shape type: ${shape.type}`);
    }
}

export function validateShape(shape) 
{
    switch (shape.type) 
    {
        case SHAPE_TYPES.RECTANGLE:
            return validateRectangle(shape);
        case SHAPE_TYPES.CIRCLE:
            return validateCircle(shape);
        case SHAPE_TYPES.POLYGON:
            return validatePolygon(shape);
        default:
            throw new Error(`Unknown shape type: ${shape.type}`);
    }
}

export function createShape(input) 
{
    switch (input.type) 
    {
        case SHAPE_TYPES.RECTANGLE:
            return createRectangle(input);
        case SHAPE_TYPES.CIRCLE:
            return createCircle(input);
        case SHAPE_TYPES.POLYGON:
            return createPolygon(input);
        default:
            throw new Error(`Unknown shape type: ${input.type}`);
    }
}