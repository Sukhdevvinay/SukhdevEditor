import Editor from "./Component/Editor"
import Draw from "./Component/Draw"
import Login from "./Component/Login"
import Signup from "./Component/Signup"
import { Routes,Route } from "react-router";
function App() {
  return (
    <>
      <Routes>
          <Route path = "/" element = {<Login/>} />;
          <Route path = "/editor" element = {<Editor/>}/> 
          <Route path = "/Draw" element = {<Draw/>}/> 
          <Route path = "/Signup" element = {<Signup/>}/>
          <Route path = "/logout" element = {<Login/>}/>
      </Routes>
    </>
  )
}
export default App;