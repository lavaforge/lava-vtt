import paper from 'paper';
import type { FogOfWar } from '@base';

export enum Tool {
    FogOfWar,
    Circle,
    Rectangle,
    Arrow,
    Polygon,
}

export const fogOfWarColor = '#000000A0';

type PaperMouseEvent = {
    point: paper.Segment | paper.PointLike | number[];
    event: MouseEvent;
};

/**
 * Resets all event handlers on a Paper.js tool
 * @param paperTool - The Paper.js tool to reset
 */
export function resetPaperTool(paperTool: paper.Tool) {
    paperTool.onMouseUp = () => {};
    paperTool.onMouseDown = () => {};
    paperTool.onMouseDrag = () => {};
    paperTool.onMouseMove = () => {};
}

/**
 * Calculates grid lines based on start and end points
 * @param start - The starting point for calculating grid lines
 * @param end - The ending point for calculating grid lines
 * @returns Object containing horizontal lines, vertical lines, and length
 */
export function gridLines(
    start: paper.Point,
    end: paper.Point,
): {
    h: number[];
    v: number[];
    length: number;
} {
    const hDiff = end.y - start.y;
    const vDiff = end.x - start.x;

    const diff = Math.max(Math.abs(hDiff), Math.abs(vDiff)) / 2;

    const count = 13;
    const before = Math.floor((count - 1) / 2);

    const diffStart = before * -diff;
    const diffs = Array.from({ length: count }, (_, i) => diffStart + i * diff);

    return {
        h: diffs.map((diff) => start.y + diff),
        v: diffs.map((diff) => start.x + diff),
        length: diff * (count - 1),
    };
}

/**
 * Initializes the grid tool for drawing grid lines
 * @param baseViewRef - Reference to the base view component
 */
export function initGridTool(baseViewRef: any) {
    baseViewRef?.activateDrawingLayer();
    const hLines: paper.Path[] = [];
    const vLines: paper.Path[] = [];

    let startPoint: paper.Point;

    function makeLines(currentPoint: paper.Point) {
        const { h, v, length } = gridLines(startPoint, currentPoint);

        h.forEach((y, idx) => {
            hLines[idx] = new paper.Path.Line(
                new paper.Point(startPoint.x - length / 2, y),
                new paper.Point(startPoint.x + length / 2, y),
            );
            hLines[idx].strokeColor = new paper.Color('black');
        });

        v.forEach((x, idx) => {
            vLines[idx] = new paper.Path.Line(
                new paper.Point(x, startPoint.y - length / 2),
                new paper.Point(x, startPoint.y + length / 2),
            );
            vLines[idx].strokeColor = new paper.Color('black');
        });
    }

    function removeLines() {
        hLines.forEach((line) => line.remove());
        hLines.length = 0;
        vLines.forEach((line) => line.remove());
        vLines.length = 0;
    }

    paper.tool.onMouseDown = (event: paper.ToolEvent) => {
        startPoint = event.point;

        makeLines(event.point);
    };

    paper.tool.onMouseDrag = (event: paper.ToolEvent) => {
        removeLines();
        makeLines(event.point);
    };

    paper.tool.onMouseUp = (event: paper.ToolEvent) => {
        hLines.forEach((line) => line.remove());
        vLines.forEach((line) => line.remove());
    };
}

/**
 * Initializes the circle tool for drawing circles in fog of war
 * @param baseViewRef - Reference to the base view component
 * @param paperTool - The Paper.js tool to use
 * @param addFow - Whether to add (true) or remove (false) fog of war
 * @param addPathToFow - Function to add a path to fog of war
 * @param removePathFromFow - Function to remove a path from fog of war
 * @param sendFowUpdate - Function to send fog of war update to server
 */
export function initCircleTool(
    baseViewRef: any,
    paperTool: paper.Tool,
    addFow: boolean,
    addPathToFow: (path: paper.Path) => void,
    removePathFromFow: (path: paper.Path) => void,
    sendFowUpdate: () => void,
) {
    baseViewRef?.activateFowLayer();
    let circle: paper.Path.Circle;
    let startPoint: paper.Point;

    paperTool.onMouseDown = (event: paper.ToolEvent) => {
        startPoint = event.point;
        circle = new paper.Path.Circle(event.point, 10);
        circle.strokeColor = new paper.Color('red');
    };

    paperTool.onMouseDrag = (event: paper.ToolEvent) => {
        let radius = startPoint.getDistance(event.point);
        circle.remove();
        circle = new paper.Path.Circle({
            center: startPoint,
            radius: radius,
            strokeColor: 'red',
        });
    };

    paperTool.onMouseUp = (event: paper.ToolEvent) => {
        circle.closed = true;
        console.log('Circle tool mouse up, addFow:', addFow);

        // Access the baseViewRef to ensure the correct layer is active
        baseViewRef?.activateFowLayer();

        if (addFow) {
            addPathToFow(circle);
        } else {
            removePathFromFow(circle);
        }

        sendFowUpdate();
    };
    paperTool.activate();
}

/**
 * Initializes the rectangle tool for drawing rectangles in fog of war
 * @param baseViewRef - Reference to the base view component
 * @param paperTool - The Paper.js tool to use
 * @param addFow - Whether to add (true) or remove (false) fog of war
 * @param addPathToFow - Function to add a path to fog of war
 * @param removePathFromFow - Function to remove a path from fog of war
 * @param sendFowUpdate - Function to send fog of war update to server
 */
export function initRectangleTool(
    baseViewRef: any,
    paperTool: paper.Tool,
    addFow: boolean,
    addPathToFow: (path: paper.Path) => void,
    removePathFromFow: (path: paper.Path) => void,
    sendFowUpdate: () => void,
) {
    baseViewRef?.activateFowLayer();
    let rectangle: paper.Path.Rectangle;
    let startPoint: paper.Point;

    paperTool.onMouseDown = (event: paper.ToolEvent) => {
        startPoint = event.point;
        rectangle = new paper.Path.Rectangle(startPoint, new paper.Size(1, 1));
        rectangle.strokeColor = new paper.Color('red');
    };

    paperTool.onMouseDrag = (event: paper.ToolEvent) => {
        let endPoint = event.point;
        rectangle.remove();
        rectangle = new paper.Path.Rectangle({
            from: startPoint,
            to: endPoint,
        });
        rectangle.strokeColor = new paper.Color('red');
    };

    paperTool.onMouseUp = (event: paper.ToolEvent) => {
        rectangle.closed = true;
        console.log('Rectangle tool mouse up, addFow:', addFow);

        // Access the baseViewRef to ensure the correct layer is active
        baseViewRef?.activateFowLayer();

        addFow ? addPathToFow(rectangle) : removePathFromFow(rectangle);

        sendFowUpdate();
    };
    paperTool.activate();
}

/**
 * Initializes the arrow tool for drawing arrows
 * @param baseViewRef - Reference to the base view component
 * @param paperTool - The Paper.js tool to use
 * @param sendDrawingUpdate - Function to send drawing update to server
 */
export function initArrowTool(
    baseViewRef: any,
    paperTool: paper.Tool,
    sendDrawingUpdate: () => void,
) {
    baseViewRef?.activateDrawingLayer();
    let arrowShaft: paper.Path;
    let arrowHeadLeft: paper.Path;
    let arrowHeadRight: paper.Path;
    let arrowTip: paper.Path;
    let startPoint: paper.Point;
    let arrowThickness: number = 1;

    paperTool.onMouseDown = (event: paper.ToolEvent) => {
        startPoint = event.point;
        arrowShaft = new paper.Path({
            strokeColor: new paper.Color('red'),
            strokeWidth: 1,
            fillColor: new paper.Color('red'),
        });

        arrowHeadLeft = new paper.Path({
            strokeColor: new paper.Color('red'),
            strokeWidth: 1,
            fillColor: new paper.Color('red'),
        });

        arrowHeadRight = new paper.Path({
            strokeColor: new paper.Color('red'),
            strokeWidth: 1,
            fillColor: new paper.Color('red'),
        });

        arrowTip = new paper.Path({
            strokeColor: new paper.Color('red'),
            strokeWidth: 1,
            fillColor: new paper.Color('red'),
        });
    };

    paperTool.onMouseDrag = (event: paper.ToolEvent) => {
        let endPoint = event.point;
        let arrowLength = startPoint.getDistance(endPoint);
        let thickness = (arrowThickness * arrowLength) / 8;

        let vector = new paper.Point(
            endPoint.x - startPoint.x,
            endPoint.y - startPoint.y,
        );
        let normal = vector
            .normalize()
            .rotate(90, new paper.Point(0, 0))
            .multiply(thickness / 2);

        arrowShaft.removeSegments();
        arrowShaft.addSegments([
            new paper.Segment(startPoint.add(normal)),
            new paper.Segment(endPoint.add(normal)),
            new paper.Segment(endPoint.subtract(normal)),
            new paper.Segment(startPoint.subtract(normal)),
        ]);
        arrowShaft.closed = true;

        let arrowVector = vector.normalize(thickness * 2);
        let arrowHeadLeftVector = arrowVector
            .rotate(145, new paper.Point(0, 0))
            .add(endPoint);
        let arrowHeadRightVector = arrowVector
            .rotate(-145, new paper.Point(0, 0))
            .add(endPoint);

        arrowHeadLeft.removeSegments();
        arrowHeadLeft.addSegments([
            new paper.Segment(endPoint.add(normal)),
            new paper.Segment(arrowHeadLeftVector.add(normal)),
            new paper.Segment(arrowHeadLeftVector.subtract(normal)),
            new paper.Segment(endPoint.subtract(normal)),
        ]);
        arrowHeadLeft.closed = true;

        arrowHeadRight.removeSegments();
        arrowHeadRight.addSegments([
            new paper.Segment(endPoint.add(normal)),
            new paper.Segment(arrowHeadRightVector.add(normal)),
            new paper.Segment(arrowHeadRightVector.subtract(normal)),
            new paper.Segment(endPoint.subtract(normal)),
        ]);
        arrowHeadRight.closed = true;

        let tipVector = vector.normalize(thickness * 0.71); // magic numbers; don't touch
        let arrowTipBaseLeft = tipVector
            .rotate(110, new paper.Point(0, 0))
            .add(endPoint);
        let arrowTipBaseRight = tipVector
            .rotate(-110, new paper.Point(0, 0))
            .add(endPoint);
        let arrowTipPoint = endPoint.add(tipVector);

        arrowTip.removeSegments();
        arrowTip.addSegments([
            new paper.Segment(arrowTipBaseLeft),
            new paper.Segment(arrowTipPoint),
            new paper.Segment(arrowTipBaseRight),
        ]);
        arrowTip.closed = true;
    };

    paperTool.onMouseUp = (event: paper.ToolEvent) => {
        console.log('Arrow tool mouse up');
        sendDrawingUpdate();
    };

    paperTool.activate();
}

/**
 * Initializes the fog tool for freeform drawing in fog of war
 * @param baseViewRef - Reference to the base view component
 * @param paperTool - The Paper.js tool to use
 * @param addFow - Whether to add (true) or remove (false) fog of war
 * @param addPathToFow - Function to add a path to fog of war
 * @param removePathFromFow - Function to remove a path from fog of war
 * @param sendFowUpdate - Function to send fog of war update to server
 */
export function initFogTool(
    baseViewRef: any,
    paperTool: paper.Tool,
    addFow: boolean,
    addPathToFow: (path: paper.Path) => void,
    removePathFromFow: (path: paper.Path) => void,
    sendFowUpdate: () => void,
) {
    console.log('Initializing fog tool, addFow:', addFow);
    baseViewRef?.activateFowLayer();
    let path: paper.Path;
    paperTool.onMouseDown = (event: PaperMouseEvent) => {
        path = new paper.Path();
        path.add(event.point);
    };

    paperTool.onMouseDrag = (event: PaperMouseEvent) => {
        if (path) {
            addFow
                ? (path.strokeColor = new paper.Color('black'))
                : (path.strokeColor = new paper.Color('red'));
            path.add(event.point);
        }
    };

    paperTool.onMouseUp = () => {
        if (!path) return;

        path.closed = true;
        path.simplify();

        console.log('Fog tool mouse up, addFow:', addFow);

        // Access the baseViewRef to ensure the correct layer is active
        baseViewRef?.activateFowLayer();

        if (addFow) {
            addPathToFow(path);
        } else {
            removePathFromFow(path);
        }

        sendFowUpdate();
    };
    paperTool.activate();
}

/**
 * Initializes the polygon tool for drawing polygons in fog of war
 * @param baseViewRef - Reference to the base view component
 * @param paperTool - The Paper.js tool to use
 * @param addFow - Whether to add (true) or remove (false) fog of war
 * @param addPathToFow - Function to add a path to fog of war
 * @param removePathFromFow - Function to remove a path from fog of war
 * @param sendFowUpdate - Function to send fog of war update to server
 */
export function initPolygonTool(
    baseViewRef: any,
    paperTool: paper.Tool,
    addFow: boolean,
    addPathToFow: (path: paper.Path) => void,
    removePathFromFow: (path: paper.Path) => void,
    sendFowUpdate: () => void,
) {
    baseViewRef?.activateFowLayer();
    let path: paper.Path | undefined = undefined;
    paperTool.onMouseUp = (event: PaperMouseEvent) => {
        if (!path) {
            path = new paper.Path();
            path.strokeColor = new paper.Color(addFow ? 'black' : 'red');
            path.add(event.point);
        }
        path.add(event.point);

        if (event.event.button === 2) {
            path.closed = true;
            path.fillColor = new paper.Color('#00000080');
            // path.simplify();

            console.log('Polygon tool right-click, addFow:', addFow);

            // Access the baseViewRef to ensure the correct layer is active
            baseViewRef?.activateFowLayer();

            if (addFow) {
                addPathToFow(path);
            } else {
                removePathFromFow(path);
            }

            sendFowUpdate();

            path = undefined;
        }
    };

    paperTool.onMouseMove = (event: PaperMouseEvent) => {
        if (!path) return;

        path.lastSegment?.remove();
        path.add(event.point);
    };

    paperTool.activate();
}

/**
 * Adds a path to the fog of war by uniting it with existing paths
 * @param path - The path to add to fog of war
 */
export function addPathToFow(path: paper.Path) {
    const activeLayer = paper.project.activeLayer;
    let combinedPath: paper.Path | paper.PathItem = path;
    activeLayer.children.forEach((child) => {
        if (
            child != path &&
            (child instanceof paper.Path ||
                child instanceof paper.CompoundPath ||
                child instanceof paper.PathItem)
        ) {
            console.log('Uniting with child', child);
            combinedPath = combinedPath.unite(child);
        }
    });
    combinedPath.fillColor = new paper.Color(fogOfWarColor);
    combinedPath.strokeColor = new paper.Color(fogOfWarColor);
    activeLayer.removeChildren();
    activeLayer.addChild(combinedPath);
}

/**
 * Removes a path from the fog of war by subtracting it from existing paths
 * @param path - The path to remove from fog of war
 */
export function removePathFromFow(path: paper.Path) {
    const activeLayer = paper.project.activeLayer;
    let substractedPath:
        | paper.CompoundPath
        | paper.PathItem
        | paper.Path
        | paper.Item = path;
    activeLayer.children.forEach((child) => {
        if (
            (child instanceof paper.CompoundPath ||
                child instanceof paper.Path ||
                child instanceof paper.PathItem) &&
            child != path
        ) {
            console.log('Subtracting child', child);
            substractedPath = child.subtract(path);
        }
    });
    activeLayer.removeChildren();
    substractedPath.fillColor = new paper.Color(fogOfWarColor);
    substractedPath.strokeColor = new paper.Color(fogOfWarColor);
    activeLayer.addChild(substractedPath);
}

/**
 * Gets the first child of the active layer if it exists
 * @returns The first child of the active layer or undefined
 */
export function getFirstActiveLayerChild() {
    if (paper.project.activeLayer.children.length == 1)
        return paper.project.activeLayer.children.at(0);
}

/**
 * Gets the currently active paper.js layer
 * @returns The active paper.js layer
 */
export function getActiveLayer() {
    return paper.project.activeLayer;
}
