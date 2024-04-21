import type { LoreSchema } from 'conduit';
import paper from 'paper';

export function updateFOW(data: LoreSchema<'paperFow'>) {
    let scalePositionQuadruple = getScaleAndPositionFromPathData(data);
    let path: paper.CompoundPath = new paper.CompoundPath(data.svgPath);
    path.fillColor = new paper.Color('black');
    scaleAndPositionPath(path, scalePositionQuadruple);

    paper.project.activeLayer.removeChildren();
    paper.project.activeLayer.addChild(path);
}

function getScaleAndPositionFromPathData(pathData: LoreSchema<'paperFow'>) {
    const { width, height, posX, posY } = pathData.canvas;
    return [width, height, posX, posY];
}

function scaleAndPositionPath(
    path: paper.CompoundPath,
    scalePositionQuadruple: number[] | null,
) {
    if (
        scalePositionQuadruple == null ||
        scalePositionQuadruple[0] == undefined ||
        scalePositionQuadruple[1] == undefined ||
        scalePositionQuadruple[2] == undefined ||
        scalePositionQuadruple[3] == undefined
    )
        return;

    let newCanvasWidth = paper.view.size.width;
    let newCanvasHeight = paper.view.size.height;
    if (newCanvasWidth == undefined || newCanvasHeight == undefined) return;
    let scaleX = newCanvasWidth / scalePositionQuadruple[0];
    let scaleY = newCanvasHeight / scalePositionQuadruple[1];
    let uniformScale = Math.min(scaleX, scaleY);
    path.position = new paper.Point(
        scalePositionQuadruple[2] * scaleX,
        scalePositionQuadruple[3] * scaleY,
    );
    path.scale(uniformScale);
}
