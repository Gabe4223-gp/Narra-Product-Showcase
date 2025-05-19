import React, { useState, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import { useJsApiLoader, GoogleMap, Marker, InfoWindow } from '@react-google-maps/api';
import './WorkPortal.css';

const mapContainerStyle = {
  width: '100%',
  height: '400px',
};

const center = {
  lat: 14.5995, // Manila center
  lng: 120.9842,
};

const mockRatings = [
    { reviewer: 'Anna Reyes', comment: 'Great service!', stars: 5 },
    { reviewer: 'Mark Tan', comment: 'On time and professional.', stars: 4 },
    { reviewer: 'Liza G.', comment: 'Fair price, will hire again.', stars: 5 },
  ];

  const contractors = [
    {
      id: 1,
      name: 'Gabe Payumo',
      role: 'Electrician',
      description: 'Fixes electricity',
      phone: '+63 9175994223',
      email: 'gpayumo99@gmail.com',
      status: 'Verified',
      price: 500,
      availability: 'Available',
      rating: 5,
      location: { lat: 14.6091, lng: 121.0223 }, // Example: QC
    },
    {
      id: 2,
      name: 'Tabaching chong',
      role: 'Fatass plumber',
      description: 'Specializes in clogging your toilet',
      phone: '+63 09152128195',
      email: 'justin@example.com',
      status: 'No Certification',
      price: '5 Hamburgers per second',
      availability: 'Unavailable',
      rating: 3,
      location: { lat: 14.5547, lng: 121.0244 },
    },
  ];

  const mockProperties = [
    {
      id: 1,
      name: 'Tondo Estates',
      location: { lat: 14.6080, lng: 120.9870 }, // Example near Tondo, Manila
    },
    {
      id: 2,
      name: 'Makati Suites',
      location: { lat: 14.5547, lng: 121.0244 }, // Makati
    },
  ];  

const WorkPortal = () => {
  const [showForm, setShowForm] = useState(false);
  const [showRatings, setShowRatings] = useState(false);
  const [calendarView, setCalendarView] = useState(false);
  const [selectedContractor, setSelectedContractor] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState('');
  const [confirmationMessage, setConfirmationMessage] = useState('');
  const [nameFilter, setNameFilter] = useState('');
  const [ratingFilter, setRatingFilter] = useState('');
  const [selectedProperty, setSelectedProperty] = useState(mockProperties[0]);

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
    libraries: ['places'],
  });

  const filteredContractors = contractors
  .map((c) => ({
    ...c,
    distance: getDistanceInKm(selectedProperty.location, c.location),
  }))
  .filter((c) =>
    c.name.toLowerCase().includes(nameFilter.toLowerCase()) &&
    (!ratingFilter || c.rating >= ratingFilter)
  )
  .sort((a, b) => a.distance - b.distance);

  const nearestContractor =
  filteredContractors.length > 0 ? filteredContractors[0] : null;

  const handleBookNow = (contractor) => {
    setSelectedContractor(contractor);
    setCalendarView(true);
  };

  const handleShowRatings = (contractor) => {
    setSelectedContractor(contractor);
    setShowRatings(true);
  };

  const handleBookingSubmit = () => {
    if (!selectedDate || !selectedTime) {
      alert('Please select both date and time.');
      return;
    }

    setConfirmationMessage(
        `Appointment booked with ${selectedContractor?.name} on ${selectedDate.toDateString()} at ${selectedTime}`
      );

    // Reset for demo purposes
    setTimeout(() => {
        setCalendarView(false);
        setSelectedDate(null);
        setSelectedTime('');
        setConfirmationMessage('');
    }, 2500);
  };

  useEffect(() => {
    if (!isLoaded) return;
  
    const input = document.getElementById('autocomplete');
    if (!input || !window.google || !window.google.maps || !window.google.maps.places) return;
  
    const autocomplete = new window.google.maps.places.Autocomplete(input, {
      types: ['geocode'],
    });
  
    autocomplete.addListener('place_changed', () => {
      const place = autocomplete.getPlace();
      if (place.geometry) {
        const { lat, lng } = place.geometry.location;
        setSelectedProperty((prev) => ({
          ...prev,
          location: {
            lat: lat(),
            lng: lng(),
          },
        }));
      }
    });
  }, [isLoaded]);
  if (!isLoaded) return <div>Loading map...</div>;

  function getDistanceInKm(loc1, loc2) {
    const R = 6371;
    const dLat = (loc2.lat - loc1.lat) * (Math.PI / 180);
    const dLng = (loc2.lng - loc1.lng) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(loc1.lat * (Math.PI / 180)) *
      Math.cos(loc2.lat * (Math.PI / 180)) *
      Math.sin(dLng / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  return (
    <div className="work-portal">

      <div className="property-selector">
        <label>Select Property: </label>
        <select
          value={selectedProperty.id}
          onChange={(e) => {
            const chosen = mockProperties.find(p => p.id === Number(e.target.value));
            setSelectedProperty(chosen);
          }}
        >
          {mockProperties.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </div>

      {/* Form / Search Header */}
      {!calendarView && (
        <>
          <div className="top-bar">
            <input className="search-box" placeholder="Find a Maintenance Worker..." />
            <button className="property-btn" onClick={() => setShowForm(!showForm)}>
              {showForm ? 'Close Form' : 'Add a Maintenance Worker'}
            </button>
          </div>

      {/* Collapsible form */}
      {showForm && (
        <form className="worker-form">
          <input placeholder="Name" required />
          <input placeholder="Role" required />
          <input placeholder="Phone Number" required />
          <input placeholder="Email" required />
          <button type="submit">Submit Worker</button>
        </form>
      )}
        </>
      )}

      {/* Calendar Booking View */}
      {calendarView && (
        <div className="calendar-view">
        <button onClick={() => setCalendarView(false)} className="back-btn">← Back to Work Portal</button>
        <h2>Book Appointment with {selectedContractor?.name}</h2>
      
        <div className="booking-form">
          <label>Select a date:</label>
          <DatePicker
            selected={selectedDate}
            onChange={(date) => setSelectedDate(date)}
            dateFormat="MMMM d, yyyy"
            minDate={new Date()}
            placeholderText="Choose date"
            className="datepicker-input"
          />
      
          <label>Select a time:</label>
          <select
            value={selectedTime}
            onChange={(e) => setSelectedTime(e.target.value)}
            className="time-select"
          >
            <option value="">Choose time</option>
            <option>9:00 AM</option>
            <option>10:00 AM</option>
            <option>11:00 AM</option>
            <option>1:00 PM</option>
            <option>2:00 PM</option>
            <option>3:00 PM</option>
            <option>4:00 PM</option>
          </select>
      
          <button onClick={handleBookingSubmit} className="book-btn" style={{ marginTop: '20px' }}>
            Confirm Appointment
          </button>
      
          {confirmationMessage && <p className="confirmation">{confirmationMessage}</p>}
        </div>
      </div>
      )}

      {/* Modal for Ratings */}
      {showRatings && (
        <div className="ratings-modal">
          <div className="modal-content">
            <h3>Ratings for {selectedContractor?.name}</h3>
            <ul>
              {mockRatings.map((r, i) => (
                <li key={i}>
                  <strong>{r.reviewer}:</strong> {r.comment}
                  <span style={{ marginLeft: '10px' }}>
                    {[...Array(r.stars)].map((_, i) => '★')}
                  </span>
                </li>
              ))}
            </ul>
            <button onClick={() => setShowRatings(false)}>Close</button>
          </div>
        </div>
      )}

      <div className="filter-controls">
        <input
          type="text"
          placeholder="Search by name..."
          onChange={(e) => setNameFilter(e.target.value)}
        />
        <select onChange={(e) => setRatingFilter(Number(e.target.value))}>
          <option value="">All Ratings</option>
          <option value="5">5 ★</option>
          <option value="4">4+ ★</option>
          <option value="3">3+ ★</option>
        </select>
      </div>

      <p style={{ fontStyle: 'italic', color: '#666' }}>
        Click the map or drag the white marker to set your property location.
      </p>

      <div className="address-search">
        <input
          type="text"
          placeholder="Enter address..."
          id="autocomplete"
          className="search-box"
        />
      </div>

      {/* Google Map */}
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={selectedProperty.location} // updated to center around property
        zoom={11}
        onClick={(e) =>
          setSelectedProperty({
            ...selectedProperty,
            location: { lat: e.latLng.lat(), lng: e.latLng.lng() },
          })
        }
      >
          {/* Property Marker (green pin) */}
          <Marker
            position={selectedProperty.location}
            icon={{
              url: 'https://img.icons8.com/ios-filled/50/ffffff/marker.png',
              scaledSize: new window.google.maps.Size(35, 35), // optional size tweak
            }}
            label="Property"
            draggable={true}
            onDragEnd={(e) =>
              setSelectedProperty({
                ...selectedProperty,
                location: { lat: e.latLng.lat(), lng: e.latLng.lng() },
              })
            }
          />

          {/* Contractor Markers */}
          {contractors.map((c) => (
            <Marker
            key={c.id}
            position={c.location}
            icon={{
              url: 'https://img.icons8.com/ios-filled/50/1f2937/worker-male.png',
              scaledSize: new window.google.maps.Size(30, 30),
            }}
            onClick={() => setSelectedContractor(c)}
          />
          ))}

          {/* Contractor Info Popup */}
          {selectedContractor && (
            <InfoWindow
              position={selectedContractor.location}
              onCloseClick={() => setSelectedContractor(null)}
            >
              <div>
                <strong>{selectedContractor.name}</strong><br />
                {selectedContractor.role}<br />
                {selectedContractor.price} PHP/hr
              </div>
            </InfoWindow>
          )}

        </GoogleMap>

      {nearestContractor && (
        <div className="nearest-info">
          <h3>Nearest Maintenance Worker</h3>
          <p><strong>{nearestContractor.name}</strong> ({nearestContractor.role})</p>
          <p>Price: ₱{nearestContractor.price}/hr</p>
          <p>Rating: {nearestContractor.rating} ★</p>
          <p>Phone: {nearestContractor.phone}</p>
          <p>Email: {nearestContractor.email}</p>
          <p>Distance: {nearestContractor.distance.toFixed(2)} km</p>
        </div>
      )}

      {/* Contractor Cards */}
      {filteredContractors.map((c, index) => (
        <div className="contractor-card" key={index}>
          <div className="contractor-info">
            <p><strong>{c.name}</strong></p>
            <p>Role: {c.role}</p>
            <p>Description: {c.description}</p>
            <p>Phone: {c.phone}</p>
            <p>Email: {c.email}</p>
            <p>Status: {c.status}</p>
            <p>Price: ₱{c.price}/hr</p>
            <p>Availability: {c.availability}</p>
            <p>Distance: {c.distance.toFixed(2)} km</p>
            <div className="rating">
              {[...Array(5)].map((_, i) => (
                <span key={i} style={{ color: i < c.rating ? '#3b82f6' : 'black' }}>★</span>
              ))}
            </div>
          </div>
          <div className="contractor-actions">
            <button className="book-btn" onClick={() => handleBookNow(c)}>Book Now</button>
            <button className="ratings-btn" onClick={() => handleShowRatings(c)}>See Ratings</button>
          </div>
        </div>
      ))}

    </div>
  );
};

export default WorkPortal;