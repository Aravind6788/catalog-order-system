import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  X,
  ZoomIn,
  ZoomOut,
  RotateCw,
  RotateCcw,
  Maximize2,
  Check,
} from "lucide-react";

// Square crop viewport shown on screen (CSS px) and the resolution the final
// image is exported at. Bump OUTPUT_SIZE up if you need higher-res product
// photos; it only affects the exported canvas, not the on-screen editor.
const VIEWPORT_SIZE = 320;
const OUTPUT_SIZE = 900;

const clamp = (val, min, max) => Math.min(Math.max(val, min), max);

/**
 * A self-contained, dependency-free image editor: zoom, pan (drag), rotate
 * in 90° steps, and reset. The square viewport IS the crop — whatever is
 * visible inside it is exactly what gets exported when "Apply" is pressed.
 *
 * Props:
 *  - isOpen: boolean
 *  - imageSrc: string (object URL or remote URL)
 *  - fileName / mimeType: used to name/type the exported file
 *  - onClose(): called on cancel/close, image is discarded
 *  - onApply(blob): called with the cropped image as a Blob
 */
const ImageCropperModal = ({
  isOpen,
  imageSrc,
  fileName = "image.jpg",
  mimeType = "image/jpeg",
  onClose,
  onApply,
}) => {
  const imgRef = useRef(null);
  const dragStart = useRef({ x: 0, y: 0, offX: 0, offY: 0 });

  const [imgNatural, setImgNatural] = useState({ w: 0, h: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0); // 0, 90, 180, 270
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");

  // Reset the editor whenever it's opened with a (possibly new) image
  useEffect(() => {
    if (isOpen) {
      setZoom(1);
      setRotation(0);
      setOffset({ x: 0, y: 0 });
      setImgLoaded(false);
      setError("");
    }
  }, [isOpen, imageSrc]);

  const handleImageLoad = (e) => {
    setImgNatural({ w: e.target.naturalWidth, h: e.target.naturalHeight });
    setImgLoaded(true);
  };

  // "Auto fit" base scale: the whole image is visible inside the square
  // viewport (contain-fit). Zooming in from here is how the user crops.
  const baseScale =
    imgNatural.w && imgNatural.h
      ? Math.min(VIEWPORT_SIZE / imgNatural.w, VIEWPORT_SIZE / imgNatural.h)
      : 1;
  const effectiveScale = baseScale * zoom;
  const displayW = imgNatural.w * effectiveScale;
  const displayH = imgNatural.h * effectiveScale;

  // Keep the image roughly within reach of the viewport in both directions,
  // whether it's larger (cropping in) or smaller (still centered) than it.
  const clampOffset = useCallback(
    (x, y) => {
      const maxX = Math.abs(displayW - VIEWPORT_SIZE) / 2 + VIEWPORT_SIZE / 2;
      const maxY = Math.abs(displayH - VIEWPORT_SIZE) / 2 + VIEWPORT_SIZE / 2;
      return { x: clamp(x, -maxX, maxX), y: clamp(y, -maxY, maxY) };
    },
    [displayW, displayH],
  );

  useEffect(() => {
    setOffset((prev) => clampOffset(prev.x, prev.y));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zoom, rotation, imgNatural]);

  const handlePointerDown = (e) => {
    if (!imgLoaded) return;
    setDragging(true);
    const point = e.touches ? e.touches[0] : e;
    dragStart.current = {
      x: point.clientX,
      y: point.clientY,
      offX: offset.x,
      offY: offset.y,
    };
  };

  const handlePointerMove = (e) => {
    if (!dragging) return;
    const point = e.touches ? e.touches[0] : e;
    const dx = point.clientX - dragStart.current.x;
    const dy = point.clientY - dragStart.current.y;
    setOffset(
      clampOffset(dragStart.current.offX + dx, dragStart.current.offY + dy),
    );
  };

  const handlePointerUp = () => setDragging(false);

  const handleRotate = (dir) => {
    setRotation((prev) => (prev + (dir === "cw" ? 90 : -90) + 360) % 360);
  };

  const handleReset = () => {
    setZoom(1);
    setRotation(0);
    setOffset({ x: 0, y: 0 });
  };

  const handleApply = () => {
    if (!imgRef.current || !imgLoaded) return;
    setProcessing(true);
    setError("");

    try {
      const canvas = document.createElement("canvas");
      canvas.width = OUTPUT_SIZE;
      canvas.height = OUTPUT_SIZE;
      const ctx = canvas.getContext("2d");
      const scaleFactor = OUTPUT_SIZE / VIEWPORT_SIZE;
      const drawW = displayW * scaleFactor;
      const drawH = displayH * scaleFactor;

      // This mirrors exactly what's on screen: move to the viewport's
      // center, rotate around it, then draw the image at its offset
      // position — same order the CSS preview uses, so what you see is
      // what gets exported.
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, OUTPUT_SIZE, OUTPUT_SIZE);
      ctx.save();
      ctx.translate(OUTPUT_SIZE / 2, OUTPUT_SIZE / 2);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.drawImage(
        imgRef.current,
        offset.x * scaleFactor - drawW / 2,
        offset.y * scaleFactor - drawH / 2,
        drawW,
        drawH,
      );
      ctx.restore();

      canvas.toBlob(
        (blob) => {
          setProcessing(false);
          if (!blob) {
            setError(
              "Couldn't process this image. Please try a different file.",
            );
            return;
          }
          onApply(blob);
        },
        mimeType && mimeType.startsWith("image/") ? mimeType : "image/jpeg",
        0.92,
      );
    } catch (err) {
      console.error("Crop export failed:", err);
      setProcessing(false);
      setError(
        "This image couldn't be edited here (likely a cross-origin restriction from where it's hosted). Try re-uploading the file instead.",
      );
    }
  };

  if (!isOpen) return null;

  return (
    <div className="cropper-overlay" onClick={onClose}>
      <div className="cropper-modal" onClick={(e) => e.stopPropagation()}>
        <div className="cropper-header">
          <h3>Adjust image</h3>
          <button className="cropper-icon-btn" onClick={onClose} title="Cancel">
            <X size={20} />
          </button>
        </div>

        <div
          className="cropper-viewport"
          onMouseDown={handlePointerDown}
          onMouseMove={handlePointerMove}
          onMouseUp={handlePointerUp}
          onMouseLeave={handlePointerUp}
          onTouchStart={handlePointerDown}
          onTouchMove={handlePointerMove}
          onTouchEnd={handlePointerUp}
        >
          {!imgLoaded && <div className="cropper-loading">Loading image…</div>}
          <div
            className="cropper-rotate-wrapper"
            style={{ transform: `rotate(${rotation}deg)` }}
          >
            <img
              ref={imgRef}
              src={imageSrc}
              alt="To crop"
              crossOrigin="anonymous"
              onLoad={handleImageLoad}
              draggable={false}
              style={{
                position: "absolute",
                left: VIEWPORT_SIZE / 2 - displayW / 2 + offset.x,
                top: VIEWPORT_SIZE / 2 - displayH / 2 + offset.y,
                width: displayW || 0,
                height: displayH || 0,
                userSelect: "none",
                pointerEvents: "none",
                opacity: imgLoaded ? 1 : 0,
              }}
            />
          </div>
          <div className="cropper-grid" />
        </div>

        {error && <p className="cropper-error">{error}</p>}

        <div className="cropper-controls">
          <button
            type="button"
            className="cropper-icon-btn"
            onClick={() =>
              setZoom((z) => clamp(parseFloat((z - 0.1).toFixed(2)), 1, 4))
            }
            title="Zoom out"
          >
            <ZoomOut size={18} />
          </button>
          <input
            type="range"
            min="1"
            max="4"
            step="0.01"
            value={zoom}
            onChange={(e) => setZoom(parseFloat(e.target.value))}
            className="cropper-slider"
          />
          <button
            type="button"
            className="cropper-icon-btn"
            onClick={() =>
              setZoom((z) => clamp(parseFloat((z + 0.1).toFixed(2)), 1, 4))
            }
            title="Zoom in"
          >
            <ZoomIn size={18} />
          </button>
          <button
            type="button"
            className="cropper-icon-btn"
            onClick={() => handleRotate("ccw")}
            title="Rotate left"
          >
            <RotateCcw size={18} />
          </button>
          <button
            type="button"
            className="cropper-icon-btn"
            onClick={() => handleRotate("cw")}
            title="Rotate right"
          >
            <RotateCw size={18} />
          </button>
          <button
            type="button"
            className="cropper-icon-btn"
            onClick={handleReset}
            title="Reset"
          >
            <Maximize2 size={18} />
          </button>
        </div>

        <div className="cropper-actions">
          <button
            type="button"
            className="cropper-btn-secondary"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="button"
            className="cropper-btn-primary"
            onClick={handleApply}
            disabled={processing || !imgLoaded}
          >
            {processing ? (
              "Applying..."
            ) : (
              <>
                <Check size={16} /> Apply
              </>
            )}
          </button>
        </div>
      </div>

      <style>{`
        .cropper-overlay {
          position: fixed; inset: 0; background: rgba(0,0,0,0.6);
          display: flex; align-items: center; justify-content: center; z-index: 2000;
          padding: 16px;
        }
        .cropper-modal {
          background: white; border-radius: 12px; padding: 20px; width: 400px; max-width: 100%;
          box-shadow: 0 20px 40px rgba(0,0,0,0.3);
        }
        .cropper-header { display:flex; justify-content:space-between; align-items:center; margin-bottom: 12px; }
        .cropper-header h3 { margin:0; font-size: 16px; color:#1e293b; font-weight:600; }
        .cropper-viewport {
          width: ${VIEWPORT_SIZE}px; height: ${VIEWPORT_SIZE}px; max-width:100%; margin: 0 auto;
          position: relative; overflow: hidden; border-radius: 8px; background:#111827;
          cursor: grab; touch-action:none;
        }
        .cropper-viewport:active { cursor: grabbing; }
        .cropper-rotate-wrapper { position:absolute; inset:0; }
        .cropper-loading {
          position:absolute; inset:0; display:flex; align-items:center; justify-content:center;
          color:#9ca3af; font-size:13px; z-index:1;
        }
        .cropper-grid {
          position:absolute; inset:0; pointer-events:none;
          background-image:
            linear-gradient(rgba(255,255,255,0.35) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.35) 1px, transparent 1px);
          background-size: 33.33% 33.33%;
          box-shadow: inset 0 0 0 1px rgba(255,255,255,0.5);
        }
        .cropper-error { color:#dc2626; font-size:13px; margin: 10px 2px 0; }
        .cropper-controls { display:flex; align-items:center; gap:8px; margin-top:16px; flex-wrap:wrap; }
        .cropper-slider { flex:1; min-width: 100px; accent-color:#3b82f6; }
        .cropper-icon-btn {
          border:1px solid #d1d5db; background:#f9fafb; border-radius:6px; width:34px; height:34px;
          display:flex; align-items:center; justify-content:center; cursor:pointer; color:#374151; flex-shrink:0;
        }
        .cropper-icon-btn:hover { background:#f1f5f9; }
        .cropper-actions { display:flex; justify-content:flex-end; gap:10px; margin-top:18px; }
        .cropper-btn-secondary {
          padding:10px 16px; border-radius:8px; border:1px solid #d1d5db; background:white; cursor:pointer; font-weight:500;
        }
        .cropper-btn-primary {
          padding:10px 16px; border-radius:8px; border:none; background:#3b82f6; color:white; cursor:pointer;
          font-weight:500; display:flex; align-items:center; gap:6px;
        }
        .cropper-btn-primary:hover:not(:disabled) { background:#2563eb; }
        .cropper-btn-primary:disabled { background:#9ca3af; cursor:not-allowed; }
      `}</style>
    </div>
  );
};

export default ImageCropperModal;
