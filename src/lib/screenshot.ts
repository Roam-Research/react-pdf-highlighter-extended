import { PDFViewer } from "pdfjs-dist/types/web/pdf_viewer";
import type { LTWH, Highlight, GhostHighlight } from "../types";
import { isHTMLCanvasElement } from "./pdfjs-dom";
import { scaledPositionToViewport } from "./coordinates";

const getAreaAsPng = (canvas: HTMLCanvasElement, position: LTWH): string => {
  const { left, top, width, height } = position;

  const doc = canvas ? canvas.ownerDocument : null;
  // @TODO: cache this?
  const newCanvas = doc && doc.createElement("canvas");

  if (!newCanvas || !isHTMLCanvasElement(newCanvas)) {
    return "";
  }

  newCanvas.width = width;
  newCanvas.height = height;

  const newCanvasContext = newCanvas.getContext("2d");

  if (!newCanvasContext || !canvas) {
    return "";
  }

  const dpr: number = window.devicePixelRatio;

  newCanvasContext.drawImage(
    canvas,
    left * dpr,
    top * dpr,
    width * dpr,
    height * dpr,
    0,
    0,
    width,
    height,
  );

  return newCanvas.toDataURL("image/png");
};

const screenshot = (position: LTWH, pageNumber: number, viewer: PDFViewer) => {
  return getAreaAsPng(viewer.getPageView(pageNumber - 1).canvas, position);
};

/**
 * Creates a screenshot function that can work with highlights using closure over the viewer.
 *
 * @param viewer - The PDF viewer instance to use for screenshots
 * @returns - A function that takes a highlight and returns a PNG data URL
 */
export const createHighlightScreenshot = (viewer: PDFViewer) => {
  return (highlight: Highlight | GhostHighlight): string => {
    const pageNumber = highlight.position.boundingRect.pageNumber;

    // Convert scaled position to viewport position
    const viewportPosition = scaledPositionToViewport(highlight.position, viewer);

    // Extract LTWH from the boundingRect (remove pageNumber for screenshot function)
    const { left, top, width, height } = viewportPosition.boundingRect;
    const position: LTWH = { left, top, width, height };

    return screenshot(position, pageNumber, viewer);
  };
};

export default screenshot;
