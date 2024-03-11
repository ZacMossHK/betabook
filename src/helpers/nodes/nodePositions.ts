export const getCurrentNodePosition = (
  coordinate: number,
  scale: number,
  nodeSizeOffset: number
) => {
  "worklet";
  return coordinate * scale + nodeSizeOffset * scale - nodeSizeOffset;
};

export const getNewNodePosition = (
  dimensionMeasurement: number,
  scale: number,
  imagePositionCoordinate: number,
  eventCoordinate: number,
  nodeSizeOffset: number
) => {
  "worklet";
  /* TODO:  (dimensionMeasurement * scale - dimensionMeasurement) / 2 
  This formulae matches the one from maxDistance, can this be refactored? */
  const imageEdgeOffset =
    (dimensionMeasurement * scale - dimensionMeasurement) / 2 -
    imagePositionCoordinate;
  return (imageEdgeOffset + eventCoordinate) / scale - nodeSizeOffset;
};