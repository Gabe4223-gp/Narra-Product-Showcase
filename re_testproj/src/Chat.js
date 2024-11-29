import React from 'react';
import { Link } from 'react-router-dom';

function ChatPage( { onLogout } ) {
  return (
    <div className="applications-page">
      <h1>Chat</h1>
      <p>Meowwwww</p>
      <Link to="/back"><p>back</p></Link>
    </div>
  );
}

export default ChatPage;