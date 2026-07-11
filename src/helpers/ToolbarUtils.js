import { rebuildLineCanvas, rebuildSolidCanvas, rebuildStampCanvas } from "./BrushUtils";

/**
 * Handles a call to undo
 */
export function toolbarUndo(commandManagerRef) 
{
    commandManagerRef.current.undo();
}

/**
 * Handles a call to redo
 */
export function toolbarRedo(commandManagerRef)
{
    commandManagerRef.current.redo();
}

/**
 * Handles a call to save
 */
export function toolbarSave(mapStateRef, document)
{
    //Data prep
    const json = JSON.stringify(mapStateRef.current, null, 2);
    const blob = new Blob([json], {type: "application/json"});

    //Creating a tempory link that is automatically clicked
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "map.fog";

    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    URL.revokeObjectURL(url);
}

/**
 * Handles importing a map
 */
export function toolbarImport(event, editorContextRef, mapStateRef)
{
    const file = event.target.files[0];

    if (!file)
    {
        return;
    }

    const reader = new FileReader();

    reader.onload = (e) => 
    {
        try
        {
            const parsed = JSON.parse(e.target.result);

            validateMapState(parsed);

            mapStateRef.current = parsed;

            rebuildFromState(parsed, editorContextRef);
        }
        catch (err)
        {
            console.error("Invalid file", err);
            alert("Failed to load map file");
        }
    };

    reader.readAsText(file);
}

/**
 * Exports the entire map as a PNG
 */
export function toolbarPNGExport(document, editorContextRef)
{
    const {gridCanvasRef, solidCanvasRef, borderCanvasRef, lineCanvasRef, stampCanvasRef } = editorContextRef.current;

    const exportLayers = [
        gridCanvasRef,
        solidCanvasRef,
        borderCanvasRef,
        lineCanvasRef,
        stampCanvasRef
    ]

    //Create an offscreen canvas to transpose all layers to.
    const exportCanvas = document.createElement("canvas");
    const exportCtx = exportCanvas.getContext("2d");

    //Initializing width
    exportCanvas.width = solidCanvasRef.current.width;
    exportCanvas.height = solidCanvasRef.current.height;

    //Transpose all layers in the coorect order
    for (let layer of exportLayers)
    {
        exportCtx.drawImage(layer.current, 0, 0);
    }

    //Convert to PNG
    exportCanvas.toBlob((blob) => {

        //Safety check
        if (!blob) {
            console.error("PNG export failed.");
            return;
        }

        //Create temporary object URL
        const url = URL.createObjectURL(blob);

        //Create download link
        const link = document.createElement("a");

        link.href = url;
        link.download = "map.png";

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        //Clean up memory
        URL.revokeObjectURL(url);

    }, "image/png");
}

/**
 * Rebuilds the editor
 */
const rebuildFromState = (state, editorContextRef) =>
{
    rebuildSolidCanvas(editorContextRef.current);
    rebuildLineCanvas(editorContextRef.current);
    rebuildStampCanvas(editorContextRef.current);
}

/**
 * Checks for basic map traits
 */
const validateMapState = (data) => 
{
    if (!data.version)
    {
        throw new Error("Missing version");
    }
    
    if (!data.shapes)
    {
        throw new Error("Invalid shapes");
    }
}

/*******************************************************************************
 * Resizing Helpers
 *******************************************************************************/

/**
 * Updates the position of every shape, line, and stamp to account for shifting world origin through resizing.
 */
export function shiftGeometry(mapStateRef, dx, dy)
{
    const mapState = mapStateRef.current;

    for (let shape of mapState.shapes)
    {
        translateShape(shape, dx, dy);
    }

    for (let line of mapState.lines)
    {
        translateLine(line, dx, dy);
    }

    for (let stamp of mapState.stamps)
    {
        translateStamp(stamp, dx, dy);
    }
}

/**
 * Shifts the points of a shape based on type and given distance
 */
const translateShape = (shape, dx, dy) =>
{
    switch(shape.type)
    {
        case "rectangle":
            shape.x += dx;
            shape.y += dy;
            break;

        case "circle":
            shape.x += dx;
            shape.y += dy;
            break;

        case "polygon":
            shape.points.forEach(p => {
                p.x += dx;
                p.y += dy;
            });
            break;

        default:
            break;
    }
}

/**
 * Shifts the points of lines based on distance.
 */
const translateLine = (line, dx, dy) =>
{
    line.x1 += dx;
    line.x2 += dx;
    line.y1 += dy;
    line.y2 += dy;
}

/**
 * Shifts the origin of a stamp based on distance
 */
const translateStamp = (stamp, dx, dy) =>
{
    stamp.x += dx;
    stamp.y += dy;
}