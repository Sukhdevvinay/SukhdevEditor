import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import style from "../Stylesheet/Login.module.css";
import { Link } from 'react-router';
const Signup = () => {
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const navigate = useNavigate();
  const handleSignup = async (e) => {
    e.preventDefault();
    try {   // Sending a data to this end Point after filling this form
      const res = await fetch('https://sukhdev-editor-backend.onrender.com/Signup/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', 
        body: JSON.stringify({ name, email, password }),
      });
      const text = await res.text();
      try { // Now we are try to convert Our text data response form server into JSON format
    //   // Agar json main convert ho gaya toh try chalega 
    //   // Agar koi response se  error aati hain toh woh json main convert nhi hoga and then 
    //   // toh fir woh catch main chala jayega 
        const data = JSON.parse(text);
        if (res.status === 200) { // Succesfully signedup
          navigate('/editor');
        } else { // failed to signedup
          alert(data.message); 
        }
      } catch (e) {
        console.error("Response was not JSON:", e);
      }
    } catch (err) {
      console.log("Signup Error : ", err);
    }
  }
  return (
    <div className={style.loginWrapper}>
      <div className={style.logincontainer}>
        <div className={style.signupheight}>
          <h2 className={style.logintitle}>Sukh Editors</h2>
          <form className={style.loginform} method="post" onSubmit={handleSignup}>
            <div className={style.formgroup}>
              <label>Name</label>
              <input
                type="text"
                placeholder="Sukhdeveditor"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required />
            </div>
            <div className={style.formgroup}>
              <label>Email</label>
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required />
            </div>
            <div className={style.formgroup}>
              <label>Password</label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required />
            </div>
            <button type="submit" className={style.loginbutton}>Sign Up</button>
            <p className={style.signuptext}>
              Have an account? <Link to="/">Login</Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Signup;



