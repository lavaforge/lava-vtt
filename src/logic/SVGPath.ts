import * as paper from "paper";

class SVGPath {
  private path: paper.Path;

  constructor(initialPathData: string) {
    paper.setup(new paper.Size(0, 0));
    this.path = new paper.Path(initialPathData);
  }

  addPath(newPathData: string): void {
    const newPath = new paper.Path(newPathData);
    const combinedPath = this.path.unite(newPath);
    this.path.remove();
    this.path = combinedPath;
  }

  subtractPath(newPathData: string): void {
    const newPath = new paper.Path(newPathData);
    const subtractedPath = this.path.subtract(newPath);
    this.path.remove();
    this.path = subtractedPath;
  }

  getPathData(): string {
    return this.path.pathData;
  }
}
