import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import style from "../Stylesheet/Login.module.css";
const Login = () => {
  const [email,setEmail] = useState('');
  const [password,setPassword] = useState('');
  const navigate = useNavigate();
  const loginfunction = async(e) => {
    e.preventDefault();
    try {
      const res = await fetch("https://sukhdev-editor-backend.onrender.com/login/login",{
      method : "POST",
      headers: {
          'Content-Type': 'application/json',
      },
      credentials: 'include',
       body: JSON.stringify({email, password }),
    });
    const text = await res.text();
    try {
        const data = JSON.parse(text);
        if (res.status === 200) { // Succesfully Login
          navigate('/editor');
        } else { // failed to Login
          console.log("Failed to login");
          alert(data.message); 
        }
      } catch(e) {
        console.error("Response was not JSON:", e);
      }
    } catch(err) {
      console.log("Login Failed",err);
    }
  }
  return (
    <div className={style.loginWrapper}>
    <div className={style.logincontainer}>
      <div className={style.loginbox}>
        <h2 className={style.logintitle}>Sukh Editors</h2>
        <form className={style.loginform} method = "post" onSubmit={loginfunction}>
          <div className={style.formgroup}>
            <label>Email</label>
            <input 
            type="email" 
            placeholder="you@example.com" 
            value = {email}
            onChange = {(e) => setEmail(e.target.value)}
            required />
          </div>
          <div className={style.formgroup}>
            <label>Password</label>
            <input 
            type="password" 
            placeholder="••••••••" 
            value = {password}
            onChange = {(e) => setPassword(e.target.value)}
            required />
          </div>
          <button type="submit" className={style.loginbutton}>Login</button>
          <p className={style.signuptext}>
            Don’t have an account? <a href="/Signup">Sign up</a>
          </p>
        </form>
      </div>
    </div>
    </div>
  );
};

export default Login;



// Sukhdevvinay9693@gmail.com : 123456


