// Navbar.js
import React, { useState, useEffect} from 'react';
import { useNavigate } from 'react-router-dom';
import "../Stylesheet/profile.css"; // You can customize the styling

const Profile = () => {
  const [showDropdown, setShowDropdown] = useState(false);
  const navigate = useNavigate(); 
  const [Userdata,setUserData] = useState(null);
  useEffect(() => {
    const path = window.location.pathname.split('/')[1]; // Gets "editor" or "Draw"
    // console.log("path : ",path);
    fetch(`https://sukhdeveditor-vhwo.onrender.com/${path}/send_details`, {
      method: 'GET',
      credentials: 'include', // If you're using cookies
    })
      .then(res => res.json())
      .then(data => setUserData(data))
      .catch(err => console.error("Error fetching user data:", err));
  }, []);

  const handleLogout = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('https://sukhdeveditor-backend.onrender.com/logout/logout',{
        method : 'GET',
        credentials : 'include'
      });
      const data = await res.json();
      alert(data.message);
      navigate('/logout');
    } catch {
      console.log("Logout Failed");
    }
    navigate('/');
  };
  let First_letter_Name = Userdata?.name?.[0]?.toUpperCase() || "U";
  let email = Userdata?.email || "User@gamil.com";
  return (
    <div className="navbar">
      <div className="profile-container" onClick={() => setShowDropdown(!showDropdown)}>
        <span className= "spanelement">{First_letter_Name}</span>
        {showDropdown && (
          <div className="dropdown-menu">
            <div className= "email">{email}</div>
            <div onClick={handleLogout}>Logout</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;


