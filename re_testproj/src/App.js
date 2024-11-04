import React from 'react';
import Header from './Header';
import Homepage from './Homepage';
import Billings from './Billings';
import Applications from './Applications';
import Tenant from './Tenant';
import Chat from './Chat';
//import Profile from './Profile';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

function App() {
  return (
    <div className="invoice-page">
      {<Header />}
      <Router>
        <Routes>
        <Route path="/" element={<Homepage />} />
        <Route path="/billing" element={<Billings />} />
        <Route path="/applications" element={<Applications />} />
        <Route path="/tenant" element={<Tenant />} />
        <Route path="/chat" element={<Chat />} />
        <Route path="/back" element={<Homepage />} />
      </Routes>
      </Router>
    </div>
  );
}

export default App;

{/*https://www.w3schools.com/react/react_router.asp#:~:text=An%20application%20can%20have%20multiple%20%3CRoutes%3E.%20Our%20basic */}
{/*https://stackoverflow.com/questions/70551838/how-to-implement-multiple-route-with-single-container-or-layout-in-react-router#:~:text=There%20are%20several%20approaches%20you%20can%20choose%20with */}