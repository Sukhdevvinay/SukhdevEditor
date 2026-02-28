import { useEffect, useRef, useState } from 'react';
import { io } from "socket.io-client";
import "../Stylesheet/Draw.css";
import { Link } from 'react-router';
import Profile from './profile';
import {
  Canvas,
  PencilBrush,
  Line,
  Rect,
  Circle,
  Triangle,
  Polygon,
  IText
} from 'fabric';

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:3000";
const socket = io(API_URL);

export default function Draw() {
  const canvasRef = useRef(null);
  const canvasInstance = useRef(null);

  // State for synchronization locking
  const isLocked = useRef(false);

  // UI State
  const selectedColor = useRef('#000000');
  const canvasHeight = useRef(window.innerHeight - 60);
  const [fontSize, setFontSize] = useState(10);
  const [currentColor, setCurrentColor] = useState('#000000');
  const [connectionStatus, setConnectionStatus] = useState("Disconnected");
  const [lastUpdate, setLastUpdate] = useState("Never");

  // --- Helpers ---
  const canvas = () => canvasInstance.current;

  // --- Core Lifecycle ---
  useEffect(() => {
    // 1. Initialize Canvas
    if (canvasInstance.current) {
      canvasInstance.current.dispose();
    }

    const newCanvas = new Canvas(canvasRef.current, {
      width: window.innerWidth,
      height: canvasHeight.current,
      isDrawingMode: false,
    });
    canvasInstance.current = newCanvas;
    console.log("🎨 Canvas Initialized");

    // 2. Define Send Handler (for Listeners)
    const handleLocalUpdate = (e) => {
      // If locked (loading remote data), DO NOT send
      if (isLocked.current) {
        // console.log("🔒 Blocked local update (Locked)");
        return;
      }

      // Prevent loops from internal rendering events
      if (e && e.target && e.target.excludeFromExport) return;

      // console.log("📤 Sending Local Update");
      const data = newCanvas.toJSON();
      socket.emit("Send_Draw_data", JSON.stringify(data));

      fetch(`${API_URL}/Draw/save_draw`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ Draw_data: data })
      }).catch(err => console.error(err));
    };

    // 3. Attach Listeners Function
    const attachListeners = () => {
      // console.log("🔌 Listeners Attached");
      newCanvas.on('object:added', handleLocalUpdate);
      newCanvas.on('object:modified', handleLocalUpdate);
      newCanvas.on('object:removed', handleLocalUpdate);
      newCanvas.on('path:created', handleLocalUpdate);
    };

    // 4. Fetch Initial Data & Load
    const initData = async () => {
      try {
        const res = await fetch(`${API_URL}/Draw/send_details`, {
          method: 'GET',
          credentials: 'include',
        });
        const data = await res.json();

        if (data && data.Draw_data) {
          console.log("📥 Initial Data Received... Loading.");
          isLocked.current = true; // Lock sending
          const parsed = typeof data.Draw_data === 'string' ? JSON.parse(data.Draw_data) : data.Draw_data;

          try {
            await newCanvas.loadFromJSON(parsed);
            newCanvas.renderAll();
            console.log("✅ Initial Data Loaded & Rendered");
          } catch (e) {
            console.error("❌ Error loading initial canvas data:", e);
          } finally {
            isLocked.current = false; // Unlock
            attachListeners(); // ATTACH AFTER LOAD
          }
        } else {
          console.log("ℹ️ No initial data found, starting fresh.");
          attachListeners(); // Attach anyway
        }
      } catch (err) {
        console.error("❌ Error fetching initial data:", err);
        attachListeners(); // Fallback
      }
    };
    initData();

    // 5. Setup Window Resize / Scroll
    const wrapper = document.querySelector(".canvas-container");
    const handleScroll = () => {
      if (!wrapper) return;
      if (wrapper.scrollHeight - (wrapper.scrollTop + wrapper.clientHeight) < 50) {
        canvasHeight.current += 250;
        newCanvas.setHeight(canvasHeight.current);
        newCanvas.getElement().style.height = canvasHeight.current + "px";
        newCanvas.requestRenderAll();
      }
    };
    if (wrapper) wrapper.addEventListener('scroll', handleScroll);


    // 6. Setup Socket Receiver (Sync)
    const handleRemoteUpdate = async (data) => {
      if (!data) return;

      console.log("📥 Remote Update Received");
      setLastUpdate(new Date().toLocaleTimeString());

      isLocked.current = true; // LOCK

      const parsed = typeof data === 'string' ? JSON.parse(data) : data;
      try {
        await newCanvas.loadFromJSON(parsed);
        newCanvas.renderAll();
      } catch (e) {
        console.error("❌ Error in remote update:", e);
      } finally {
        setTimeout(() => {
          isLocked.current = false;
        }, 100);
      }
    };

    // Socket Status
    const onConnect = () => setConnectionStatus("Connected (" + socket.id + ")");
    const onDisconnect = () => setConnectionStatus("Disconnected");

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("Write_Draw_data", handleRemoteUpdate);

    // Check initial
    if (socket.connected) onConnect();

    // Cleanup
    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("Write_Draw_data", handleRemoteUpdate);
      newCanvas.dispose();
      if (wrapper) wrapper.removeEventListener('scroll', handleScroll);
    };
  }, []); // Run ONCE on mount


  // --- Tools Implementation ---

  const switchoffline = () => {
    if (!canvas()) return;
    canvas().isDrawingMode = false;
    canvas().selection = true;
    canvas().off('mouse:down');
    canvas().off('mouse:move');
    canvas().off('mouse:up');
    canvas().defaultCursor = 'default';
  };

  const setPencil = () => {
    if (!canvas()) return;
    canvas().isDrawingMode = true;
    canvas().freeDrawingBrush = new PencilBrush(canvas());
    canvas().freeDrawingBrush.width = 3;
    canvas().freeDrawingBrush.color = selectedColor.current;
  };

  const setHighlighter = () => {
    if (!canvas()) return;
    canvas().isDrawingMode = true;
    canvas().freeDrawingBrush = new PencilBrush(canvas());
    canvas().freeDrawingBrush.width = 15;
    canvas().freeDrawingBrush.color = 'rgba(255, 255, 0, 0.4)';
  };

  const setEraser = () => {
    if (!canvas()) return;
    switchoffline();
    canvas().defaultCursor = 'crosshair';
    canvas().selection = false;
    canvas().forEachObject(o => o.selectable = false);
    canvas().on('mouse:down', (e) => {
      if (e.target) {
        canvas().remove(e.target);
        canvas().requestRenderAll();
      }
    });
  };

  const setCursor = () => {
    if (!canvas()) return;
    switchoffline();
    canvas().forEachObject(o => o.selectable = true);
  };

  // Shapes
  const addShape = (type) => {
    if (!canvas()) return;
    setCursor();

    const props = { left: 100, top: 100, fill: selectedColor.current };
    let shape;

    switch (type) {
      case 'rect': shape = new Rect({ ...props, width: 60, height: 40 }); break;
      case 'square': shape = new Rect({ ...props, width: 50, height: 50 }); break;
      case 'circle': shape = new Circle({ ...props, radius: 30 }); break;
      case 'triangle': shape = new Triangle({ ...props, width: 50, height: 50 }); break;
      case 'line':
        shape = new Line([50, 50, 200, 50], { ...props, fill: undefined, stroke: selectedColor.current, strokeWidth: 4 });
        break;
      case 'rightTriangle':
        shape = new Polygon([{ x: 0, y: 0 }, { x: 0, y: 100 }, { x: 100, y: 100 }], props);
        break;
      case 'text':
        shape = new IText('Type Here', { ...props, fontSize: 24 });
        break;
      default: return;
    }
    canvas().add(shape);
    canvas().setActiveObject(shape);
  };

  const updateColor = (e) => {
    const color = e.target.value;
    setCurrentColor(color);
    selectedColor.current = color;
    if (!canvas()) return;

    canvas().freeDrawingBrush.color = color;
    const active = canvas().getActiveObject();
    if (active) {
      if (active.type === 'line' || active.type === 'path') active.set({ stroke: color });
      else active.set({ fill: color });
      canvas().requestRenderAll();
      canvas().fire('object:modified');
    }
  };

  const updateFontSize = (e) => {
    const size = parseInt(e.target.value);
    setFontSize(size);
    if (!canvas()) return;
    const active = canvas().getActiveObject();
    if (active && (active.type === 'text' || active.type === 'i-text')) {
      active.set('fontSize', size);
      canvas().requestRenderAll();
      canvas().fire('object:modified');
    }
  };

  const copiedRef = useRef(null);
  const handleCopy = () => {
    const active = canvas()?.getActiveObject();
    if (active) active.clone(c => copiedRef.current = c);
  };
  const handlePaste = () => {
    if (copiedRef.current && canvas()) {
      copiedRef.current.clone(cloned => {
        canvas().discardActiveObject();
        cloned.set({ left: cloned.left + 10, top: cloned.top + 10, evented: true });
        if (cloned.type === 'activeSelection') {
          cloned.canvas = canvas();
          cloned.forEachObject(o => canvas().add(o));
          cloned.setCoords();
        } else {
          canvas().add(cloned);
        }
        canvas().setActiveObject(cloned);
        canvas().requestRenderAll();
        canvas().fire('object:added');
      });
    }
  };

  const drawLineMode = () => {
    if (!canvas()) return;
    switchoffline();
    canvas().selection = false;
    let line, isDown;
    canvas().on('mouse:down', (o) => {
      isDown = true;
      const ptr = canvas().getPointer(o.e);
      line = new Line([ptr.x, ptr.y, ptr.x, ptr.y], {
        stroke: selectedColor.current,
        strokeWidth: 4
      });
      canvas().add(line);
    });
    canvas().on('mouse:move', (o) => {
      if (!isDown) return;
      const ptr = canvas().getPointer(o.e);
      line.set({ x2: ptr.x, y2: ptr.y });
      canvas().requestRenderAll();
    });
    canvas().on('mouse:up', () => { isDown = false; canvas().fire('object:modified'); });
  };

  return (
    <>
      <div className="toolbar_draw">
        <Link className="Linkdesign_draw" to="/editor">Editor</Link>
        <button className="tool-button" onClick={setCursor} title="Select">🖱️</button>
        <button className="tool-button" onClick={setPencil} title="Pencil">✏️</button>
        <button className="tool-button" onClick={setHighlighter} title="Highlighter">✏️2</button>
        <button className="tool-button" onClick={setEraser} title="Eraser"> <img src="./Eraser.png" alt="Eraser" width="16" /> </button>

        <select value={fontSize} onChange={updateFontSize}>
          {[10, 12, 14, 16, 20, 24, 32].map(s => <option key={s} value={s}>{s}px</option>)}
        </select>

        <button className="tool-button" onClick={() => addShape('rect')}>▮</button>
        <button className="tool-button" onClick={() => addShape('triangle')}>▲</button>
        <button className="tool-button" onClick={() => addShape('square')}>◼</button>
        <button className="tool-button" onClick={() => addShape('circle')}>⚪</button>
        <button className="tool-button" onClick={drawLineMode}>▬</button>
        <button className="tool-button" onClick={() => addShape('rightTriangle')}>◣</button>
        <button className="tool-button" onClick={() => addShape('text')}>T</button>

        <button className="tool-button" onClick={handleCopy}>C</button>
        <button className="tool-button" onClick={handlePaste}>V</button>

        <input type="color" className="color-picker" value={currentColor} onChange={updateColor} />
        <Profile />
        <div style={{ marginLeft: '10px', fontSize: '10px', color: connectionStatus.includes("Connected") ? 'green' : 'red' }}>
          {connectionStatus} <br /> Last: {lastUpdate}
        </div>
      </div>

      <div className="canvas-container">
        <canvas ref={canvasRef} />
      </div>
    </>
  );
}
