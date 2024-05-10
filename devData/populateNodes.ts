import { Nodes } from "../src/components/ImageViewer/index.types";

const hasOverlap = (existingPoints: Nodes, newX: number, newY: number) => {
  for (let i = 0; i < existingPoints.length; i++) {
    const existingPoint = existingPoints[i];
    const distance = Math.sqrt(
      (existingPoint.x - newX) ** 2 + (existingPoint.y - newY) ** 2
    );
    const minDistance = 50;
    if (distance < minDistance) return true;
  }
  return false;
};

const nodesNum = process.env.EXPO_PUBLIC_NODES_NUM
  ? parseInt(process.env.EXPO_PUBLIC_NODES_NUM)
  : 0;

const populateNodes = (): Nodes => {
  const nodes = [];
  for (let i = 0; i < nodesNum; i++) {
    let x, y;
    do {
      x = Math.random() * (403 - 10) + 10;
      y = Math.random() * (713 - 188) + 188;
    } while (hasOverlap(nodes, x, y));
    nodes.push({ x, y, note: "" });
  }
  return nodes;
};

export default populateNodes;
