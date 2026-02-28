import { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";
import { Link } from "react-router";
import Profile from "./profile";
import "../Stylesheet/editor.css";


const API_URL = process.env.REACT_APP_API_URL || "http://localhost:3000";
const socket = io(API_URL); // Connect to My Backend Server 

// Helper functions for Cursor Preservation
const saveSelection = (containerEl) => {
  if (window.getSelection().rangeCount === 0) return null;
  const range = window.getSelection().getRangeAt(0);
  const preSelectionRange = range.cloneRange();
  preSelectionRange.selectNodeContents(containerEl);
  preSelectionRange.setEnd(range.startContainer, range.startOffset);
  const start = preSelectionRange.toString().length;

  return {
    start: start,
    end: start + range.toString().length
  };
};

const restoreSelection = (containerEl, savedSel) => {
  if (!savedSel) return;
  let charIndex = 0;
  const range = document.createRange();
  range.setStart(containerEl, 0);
  range.collapse(true);
  let nodeStack = [containerEl], node, foundStart = false, stop = false;

  while (!stop && (node = nodeStack.pop())) {
    if (node.nodeType === 3) {
      const nextCharIndex = charIndex + node.length;
      if (!foundStart && savedSel.start >= charIndex && savedSel.start <= nextCharIndex) {
        range.setStart(node, savedSel.start - charIndex);
        foundStart = true;
      }
      if (foundStart && savedSel.end >= charIndex && savedSel.end <= nextCharIndex) {
        range.setEnd(node, savedSel.end - charIndex);
        stop = true;
      }
      charIndex = nextCharIndex;
    } else {
      let i = node.childNodes.length;
      while (i--) {
        nodeStack.push(node.childNodes[i]);
      }
    }
  }

  const sel = window.getSelection();
  sel.removeAllRanges();
  sel.addRange(range);
}



export default function SukhdevEditor() {
  const [showChat, setShowChat] = useState(false);
  const [Typed_data, setTypedData] = useState('Welcome to SukhdevEditor');
  const editorRef = useRef(null);
  const isReceiving = useRef(false);


  const handleInput = () => {
    if (editorRef.current) {
      setTypedData(editorRef.current.innerHTML);
    }
  };

  const applyStyle = (command, value = null) => {
    document.execCommand(command, false, value);
  };

  useEffect(() => {
    // const editor = document.querySelector(".editor-area");
    // Better to use ref
    const editor = editorRef.current;
    if (editor) {
      const handler = () => {
        if (!isReceiving.current) {
          socket.emit('Send_text_data', editor.innerHTML);
        }
      };
      editor.addEventListener('input', handler);
      return () => editor.removeEventListener('input', handler);
    }
  }, []);

  useEffect(() => {
    socket.on("Write_text_data", (data) => {
      // console.log("Data Recieved in write section: ", data);
      const current = editorRef.current?.innerHTML;
      if (data !== current) {
        isReceiving.current = true;
        // console.log(" Updating from other user:", data);
        const saved = saveSelection(editorRef.current);
        editorRef.current.innerHTML = data;
        restoreSelection(editorRef.current, saved);

        setTypedData(data);
        isReceiving.current = false;
      }
    });
    return () => {
      socket.off("Write_text_data");
    };
  }, []);

  // Auto-save every 5 seconds  
  useEffect(() => {
    const interval = setInterval(() => {
      // console.log("Typed data : ",Typed_data);
      if (Typed_data !== "") {
        fetch(`${API_URL}/editor/save_text`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            Text_data: Typed_data
          })
        })
          .then(res => res.json())
          .then(data => {
            console.log("Auto-saved:", data.message);
            // const liveData = editorRef.current?.innerHTML || "";
            // console.log("Live data : ", liveData);
            // socket.emit("Send_text_data", liveData);
          })
          .catch(err => console.error("Error:", err));
      }
      // console.log("Typed data : ",JSON.stringify(Typed_data));
    }, 5000);
    return () => clearInterval(interval); // Cleanup on unmount
  }, [Typed_data]);

  useEffect(() => {
    fetch(`${API_URL}/editor/send_details`, { // On loading page data is written on page
      method: 'GET',
      credentials: 'include', // If you're using cookies
    })
      .then(res => res.json())
      .then(data => {
        let user_name = data.name;
        socket.emit("Connected_to_user", user_name);
        if (editorRef.current) {
          editorRef.current.innerHTML = data.Text_data || "Welcome to SukhdevEditor";
          setTypedData(data.Text_data || "Welcome to SukhdevEditor");
          if (data.Text_data !== "") {
            // console.log("From fethcing data");
            socket.emit("Send_text_data", data.Text_data);
          }
        }
        // let text = data.Text_data;
        // // let parsed_drawing_data = JSON.parse(drawing);
        // setTyped_data(text);
        // console.log("Parsed Data : ", text);
      })
      .catch(err => console.error("Error fetching user data:", err));
  }, []);

  // console.log("Val : ",editorRef.current?.innerHTML);

  return (
    <div className="etherpad-container">
      {/* Toolbar */}
      <div className="toolbar">
        <button onClick={() => applyStyle("bold")}><b>B</b></button>
        <button onClick={() => applyStyle("italic")}><i>I</i></button>
        <button onClick={() => applyStyle("underline")}><u>U</u></button>
        <button onClick={() => applyStyle("undo")}>↺</button>
        <button onClick={() => applyStyle("redo")}>↻</button>
        <button onClick={() => applyStyle("justifyLeft")}>⬅️</button>
        <button onClick={() => applyStyle("justifyCenter")}>⬅️➡️</button>
        <button onClick={() => applyStyle("justifyRight")}>➡️</button>
        <button onClick={() => applyStyle("justifyFull")}>🔲</button>
        <select
          onChange={(e) => {
            const px = e.target.value;
            if (!px) return;

            const selection = window.getSelection();
            if (!selection.rangeCount) return;

            const range = selection.getRangeAt(0);
            // If the selected text is already inside a <span>, just update it
            let parent = range.startContainer.parentNode;
            if (parent && parent.nodeName === "SPAN") {
              parent.style.fontSize = px + "px";
            } else {
              // Otherwise, wrap in a new span
              const span = document.createElement("span");
              span.style.fontSize = px + "px";
              span.appendChild(range.extractContents());
              range.deleteContents();
              range.insertNode(span);
            }
          }}
        >
          <option value="">Select font size</option>
          <option value="8">8px</option>
          <option value="10">10px</option>
          <option value="12">12px</option>
          <option value="14">14px</option>
          <option value="16">16px</option>
          <option value="20">20px</option>
          <option value="24">24px</option>
        </select>

        <input
          type="color"
          onChange={(e) => applyStyle("foreColor", e.target.value)}
          title="Text Color"
          style={{
            marginLeft: "10px",
            width: "30px",
            height: "30px",
            padding: 0,
            border: "none",
            background: "transparent",
            cursor: "pointer",
          }}
        />
        <Link className="Linkdesign" to="/Draw">Draw</Link>
        <button onClick={() => setShowChat(!showChat)}>💬</button>
        <Profile></Profile>
      </div>
      {/* Editor Pane */}
      <div className="editor-wrapper">
        <div
          className="editor-area"
          ref={editorRef}
          contentEditable={true}
          suppressContentEditableWarning={true}
          onInput={handleInput}
        ></div>
        {/* <textarea
          className="editor-area"
          onChange={(e) => setTypedData(e.target.value)}
          contentEditable={true}
          suppressContentEditableWarning={true}
          value={Typed_data}
        /> */}
      </div>
      {/* Chat */}
      {showChat && (
        <div className="chat-box">
          <div className="chat-header">CHAT 💬</div>
          <div className="chat-body">No messages</div>
          <input className="chat-input" placeholder="Type a message..." />
        </div>
      )}
    </div>
  );
}
