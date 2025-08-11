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
const socket = io("https://sukhdeveditor-vhwo.onrender.com", {  // It is connecting to my Backedn Server
  withCredentials: true,
  transports: ['websocket', 'polling']
});

function Draw() {

  const canvasRef = useRef(null);
  const canvasInstance = useRef(null);
  const [fontSize, setFontSize] = useState(10);
  const copiedObjects = useRef(null);
  const selectedColor = useRef('black');
  const canvasHeight = useRef(window.innerHeight - 60);
  const mousedwn = useRef(false);
  const currentLine = useRef(null);

  useEffect(() => {
    // Only create a new Fabric Canvas if it doesn't exist
    if (!canvasInstance.current) {
      const canvas = new Canvas(canvasRef.current);
      canvas.setWidth(window.innerWidth);
      canvas.setHeight(canvasHeight.current);
      canvasInstance.current = canvas;

      // Your scroll and colorPicker event listeners setup...
      const wrapper = document.querySelector(".canvas-container");

      const handleScroll = () => {
        const scrollPosition = wrapper.scrollTop + wrapper.clientHeight;
        const scrollHeight = wrapper.scrollHeight;
        if (scrollHeight - scrollPosition < 50) {
          canvasHeight.current += 250;
          canvas.setHeight(canvasHeight.current);
          canvas.getElement().style.height = canvasHeight.current + "px";
          canvas.requestRenderAll();
        }
      };

      wrapper.addEventListener('scroll', handleScroll);
      wrapper.addEventListener('touchmove', handleScroll);

      const colorPicker = document.querySelector('.color-picker');
      const colorHandler = (e) => {
        canvas.freeDrawingBrush.color = e.target.value;
        selectedColor.current = e.target.value;
        Properties();
      };
      colorPicker.addEventListener('input', colorHandler);

      document.body.tabIndex = 0;
      document.body.focus();
      const keydownHandler = (e) => {
        if (e.ctrlKey && e.key === 'c') Copy();
        if (e.ctrlKey && e.key === 'v') Paste();
      };
      document.addEventListener('keydown', keydownHandler);

      // ✅ Clean up
      return () => {
        if (canvasInstance.current) {
          canvasInstance.current.dispose();
          canvasInstance.current = null;
        }

        wrapper.removeEventListener('scroll', handleScroll);
        wrapper.removeEventListener('touchmove', handleScroll);
        colorPicker.removeEventListener('input', colorHandler);
        document.removeEventListener('keydown', keydownHandler);
      };
    }
  }, []);


  const canvas = () => canvasInstance.current;


  useEffect(() => {
    const interval = setInterval(() => {
      if (canvasInstance) {
        const data = canvasInstance.current.toJSON();
        fetch("https://sukhdeveditor-vhwo.onrender.com/Draw/save_draw", {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ Draw_data: data })
        })
          .then(res => res.json())
          .then(data => console.log("Auto-saved:", data.message))
          .catch(err => console.error("Error:", err));
      }
    }, 5000);
    return () => clearInterval(interval); // Cleanup on unmount
  }, []);

  useEffect(() => {
    fetch('https://sukhdeveditor-vhwo.onrender.com/Draw/send_details', {
      method: 'GET',
      credentials: 'include', // If you're using cookies
    })
      .then(res => res.json())
      .then(data => {
        let drawing = data.Draw_data;
        let parsed_drawing_data = JSON.parse(drawing);
        // console.log("Parsed Data : ", parsed_drawing_data);
        if (parsed_drawing_data != "") { // Fetching Details From Backedn at the first Time of Mounting a Page 
          socket.emit("Send_Draw_data", parsed_drawing_data);
        }
        const fabricCanvas = canvasInstance.current;
        fabricCanvas.loadFromJSON(parsed_drawing_data, () => {
          fabricCanvas.renderAll();
        });
      })
      .catch(err => console.error("Error fetching user data:", err));
  }, []);

  let isReceiving = false;

  // Write a data which is Recieved From another user from socket connection
  useEffect(() => {
    socket.on("Write_Draw_data", (data) => {
      isReceiving = true;
      if (canvasInstance.current && data) {
        canvasInstance.current.loadFromJSON(data, () => {
          canvasInstance.current.renderAll();
          isReceiving = false;
        });
      }
      console.log("Data Recieved : ", data);
    })
  }, []);

  // useEffect(() => {
  //   if (canvasInstance) {
  //     const data = canvasInstance.current.toJSON();
  //     socket.emit("Send_Draw_data", JSON.stringify(data));
  //   }
  // }, []);


  useEffect(() => {
    function sendObject(obj) {
      // console.log("Data is Sendend from function call");
      const canvasData = obj.toJSON();
      socket.emit("Send_Draw_data", canvasData);
    }

    const Draw_area = canvasInstance.current;
    
    if (Draw_area) {
      Draw_area.on('object:added', () => {
        if (isReceiving) return; // prevent echo
        let data = canvasInstance.current;
        sendObject(data);
      });

      // Listen for object modified (moving, scaling, rotating)
      Draw_area.on('object:modified', () => {
        if (isReceiving) return;
        let data = canvasInstance.current;
        sendObject(data);
      });

      // Listen for object removed (deletion)
      Draw_area.on('object:removed', () => {
        if (isReceiving) return;
        let data = canvasInstance.current;
        sendObject(data);
      });
    }
  }, [])




  const switchoffline = () => {
    canvas().off('mouse:down');
    canvas().off('mouse:move');
    canvas().off('mouse:up');
  };

  const updateFontSize = (size) => {
    const active = canvas().getActiveObject();
    if (active && ['text', 'textbox', 'i-text'].includes(active.type)) {
      active.set('fontSize', parseInt(size, 10));
      canvas().requestRenderAll();
    }
  };

  const addText = () => {
    const text = new IText('Type here', {
      left: 100,
      top: 100,
      fontFamily: 'Arial',
      fill: selectedColor.current,
      fontSize: 24,
      editable: true
    });
    canvas().add(text);
    canvas().setActiveObject(text);
    canvas().requestRenderAll();
  };

  const startAddingLine = (pos) => {
    mousedwn.current = true;
    const ptr = canvas().getPointer(pos.e);
    currentLine.current = new Line([ptr.x, ptr.y, ptr.x, ptr.y], {
      stroke: selectedColor.current,
      strokeWidth: 4,
      selectable: true,
      evented: true
    });
    canvas().add(currentLine.current);
    canvas().requestRenderAll();
  };

  const startDrawingLine = (pos) => {
    if (mousedwn.current) {
      const ptr = canvas().getPointer(pos.e);
      currentLine.current.set({ x2: ptr.x, y2: ptr.y });
      canvas().requestRenderAll();
    }
  };

  const stopDrawingLine = () => {
    mousedwn.current = false;
  };

  const erase = () => {
    switchoffline();
    canvas().defaultCursor = 'url("data:image/svg+xml;base64,' + btoa('<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"><rect width="16" height="16" fill="black" /></svg>') + '") 0 0, auto';
    canvas().isDrawingMode = false;
    canvas().selection = false;
    canvas().forEachObject(obj => obj.selectable = false);
    canvas().on('mouse:down', function (e) {
      if (e.target) {
        canvas().remove(e.target);
        canvas().requestRenderAll();
      }
    });
  };

  const drawline = () => {
    canvas().isDrawingMode = false;
    canvas().selection = false;
    switchoffline();
    canvas().on('mouse:down', startAddingLine);
    canvas().on('mouse:move', startDrawingLine);
    canvas().on('mouse:up', stopDrawingLine);
  };

  const cursor = () => {
    canvas().isDrawingMode = false;
    canvas().selection = true;
    canvas().defaultCursor = 'pointer';
    canvas().forEachObject(obj => obj.selectable = true);
    switchoffline();
  };

  const Highlighter = () => {
    const Highlighted_data = [];
    canvas().isDrawingMode = true;
    canvas().freeDrawingBrush = new PencilBrush(canvas());
    canvas().freeDrawingBrush.width = 15;
    canvas().freeDrawingBrush.color = 'rgba(0, 255, 0, 0.3)';
    const onPathCreated = (opt) => Highlighted_data.push(opt.path);
    canvas().on('path:created', onPathCreated);
    const onMouseUp = () => {
      canvas().isDrawingMode = false;
      Highlighted_data.forEach(path => canvas().remove(path));
      canvas().requestRenderAll();
      canvas().off('path:created', onPathCreated);
      canvas().off('mouse:up', onMouseUp);
    };
    canvas().on('mouse:up', onMouseUp);
  };

  const pencil = () => {
    canvas().isDrawingMode = true;
    canvas().freeDrawingBrush = new PencilBrush(canvas());
    canvas().freeDrawingBrush.width = 3;
    switchoffline();
  };

  const drawRect = () => {
    const rect = new Rect({ left: 100, top: 100, fill: selectedColor.current, width: 35, height: 60 });
    canvas().add(rect);
    switchoffline();
  };

  const drawSqr = () => {
    const sqr = new Rect({ left: 250, top: 100, height: 50, width: 50, fill: selectedColor.current });
    canvas().add(sqr);
    switchoffline();
  };

  const drawCircle = () => {
    const circle = new Circle({ left: 250, top: 100, radius: 50, fill: selectedColor.current });
    canvas().add(circle);
    switchoffline();
  };

  const drawTriangle = () => {
    const triangle = new Triangle({ left: 150, top: 150, width: 100, height: 100, fill: selectedColor.current });
    canvas().add(triangle);
    switchoffline();
  };

  const drawRightAngleTriangle = () => {
    const triangle = new Polygon([
      { x: 0, y: 0 }, { x: 0, y: 100 }, { x: 100, y: 100 }
    ], {
      left: 250, top: 180, fill: selectedColor.current, stroke: selectedColor.current, strokeWidth: 1
    });
    canvas().add(triangle);
    switchoffline();
  };

  const Copy = () => {
    const active = canvas().getActiveObject();
    if (active) {
      active.clone(clone => copiedObjects.current = clone);
    }
  };

  const Paste = () => {
    if (copiedObjects.current) {
      copiedObjects.current.clone(clone => {
        canvas().discardActiveObject();
        clone.set({ left: clone.left + 20, top: clone.top + 20 });
        if (clone.type === 'activeSelection') {
          clone.canvas = canvas();
          clone.forEachObject(obj => canvas().add(obj));
          clone.setCoords();
        } else {
          canvas().add(clone);
        }
        canvas().setActiveObject(clone);
        canvas().requestRenderAll();
      });
    }
  };

  const Properties = () => {
    const active = canvas().getActiveObject();
    if (!active) return;
    const applyColor = (obj) => {
      if (obj.type === 'line' || obj.type === 'path') obj.set({ stroke: selectedColor.current });
      else obj.set({ fill: selectedColor.current });
    };
    if (active.type === 'activeSelection') active.forEachObject(applyColor);
    else applyColor(active);
    canvas().requestRenderAll();
  };

  return (
    <>
      <div className="toolbar_draw">
        <Link className="Linkdesign_draw" to="/editor">Editor</Link>
        <button className="tool-button" onClick={cursor}>🖱️</button>
        <button className="tool-button" onClick={pencil}>✏️</button>
        <button className="tool-button" onClick={Highlighter}>✏️2</button>
        <button className="tool-button" onClick={erase}>
          <img src="./Eraser.png" alt="Eraser" />
        </button>
        <select
          id="font-size"
          value={fontSize}
          onChange={(e) => {
            setFontSize(e.target.value);
            updateFontSize(e.target.value);
          }}>
          {[10, 12, 14, 16, 18, 20, 22].map(size => (
            <option key={size} value={size}>{size}px</option>
          ))}
        </select>
        <button className="tool-button" onClick={drawRect}>▮</button>
        <button className="tool-button" onClick={drawTriangle}>▲</button>
        <button className="tool-button" onClick={drawSqr}>◼</button>
        <button className="tool-button" onClick={drawCircle}>⚪</button>
        <button className="tool-button" onClick={drawline}>▬</button>
        <button className="tool-button" onClick={drawRightAngleTriangle}>◣</button>
        <button className="tool-button" onClick={Copy}>C</button>
        <button className="tool-button" onClick={Paste}>V</button>
        <button className="tool-button" onClick={addText}>T</button>
        <input type="color" className="color-picker" title="Pick a color" />
        <Profile></Profile>
      </div>
      <div className="canvas-container">
        <canvas id="canvas" ref={canvasRef} height="1000" />
      </div>
    </>
  );
}


export default Draw;



