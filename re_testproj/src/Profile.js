import React from 'react';
import { Link } from 'react-router-dom';

const user = {
    name: 'Gabe Payumo',
    avatar: require('./images/squidward.png'),
    imageSize: 50,
  };

function ProfilePage() {
  return (
    <div className="profile-page">
      <h1>Profile</h1>
      <img 
            className="avatar" 
            src={user.avatar}
            alt={'Photo of ' + user.name}
            style={{width: user.imageSize, height: user.imageSize}} />
      <Link to="/back"><p>back</p></Link>
    </div>
  );
}

export default ProfilePage;