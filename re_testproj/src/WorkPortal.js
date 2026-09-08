"use client"

import { useState, useEffect, useRef } from "react";
import DatePicker from "react-datepicker";
import { useJsApiLoader, GoogleMap, Marker, InfoWindow } from "@react-google-maps/api";
import axios from "axios";
import "./WorkPortal.css";

// Must live outside the component. A new array on every render makes
// useJsApiLoader think the config changed, so it reloads the Maps script in a
// loop ("LoadScript has been reloaded unintentionally") and isLoaded never
// settles -- which is why the page sat on "Loading map and properties...".
const libraries = ["places"];

const mapContainerStyle = {
  width: "100%",
  height: "400px",
  borderRadius: "12px",
}
/*
const mockRatings = [
  { reviewer: "Anna Reyes", comment: "Great service!", stars: 5 },
  { reviewer: "Mark Tan", comment: "On time and professional.", stars: 4 },
  { reviewer: "Liza G.", comment: "Fair price, will hire again.", stars: 5 },
]
*/

const WorkPortal = () => {
  const [showForm, setShowForm] = useState(false)
  const [ratings, setRatings] = useState([])
  const [showRatings, setShowRatings] = useState(false)
  const [showReviewForm, setShowReviewForm] = useState(false)
  const [calendarView, setCalendarView] = useState(false)
  const [selectedContractor, setSelectedContractor] = useState(null)
  const [selectedDate, setSelectedDate] = useState(null)
  const [selectedTime, setSelectedTime] = useState("")
  const [confirmationMessage, setConfirmationMessage] = useState("")
  const [nameFilter, setNameFilter] = useState("")
  const [ratingFilter, setRatingFilter] = useState("")
  const [priceFilter, setPriceFilter] = useState("")
  const [availabilityFilter, setAvailabilityFilter] = useState("")
  const [alphabeticalFilter, setAlphabeticalFilter] = useState("")
  const [contractors, setContractors] = useState([]);
  const calendarRef = useRef(null);


  //Select Property
  const [properties, setProperties] = useState([])
  const [selectedProperty, setSelectedProperty] = useState(null)

  const defaultLocation = { lat: 14.5995, lng: 120.9842 }; // Manila

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
    libraries,
  })

  //Fetch Contractors from API
  const fetchContractors = async (propertyId) => {
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/api/work-portal/contractors/${propertyId}`);
      const data = await res.json();
      setContractors(data);
    } catch (err) {
      console.error('Failed to fetch contractors:', err);
    }
  };

  useEffect(() => {
    if (selectedProperty?.id) {
      fetchContractors(selectedProperty.id);
    }
  }, [selectedProperty]);  

  const filteredContractors =
  selectedProperty?.location
    ? contractors
        .map((c) => {
          if (!c?.location || !c.location.lat || !c.location.lng) {
            return { ...c, distance: null };
          }
          return {
            ...c,
            distance: getDistanceInKm(selectedProperty.location, c.location),
          };
        })
        .filter((c) =>
          c.name.toLowerCase().includes(nameFilter.toLowerCase()) &&
          (!ratingFilter || c.rating >= ratingFilter) &&
          (!availabilityFilter || c.availability === availabilityFilter)
        )
        .sort((a, b) => {
          // Workers without a price or distance sort last rather than turning
          // the comparison into NaN, which leaves the order arbitrary.
          const num = (v, fallback) =>
            v === null || v === undefined || v === "" || Number.isNaN(Number(v))
              ? fallback
              : Number(v);

          if (priceFilter === "asc") return num(a.price, Infinity) - num(b.price, Infinity);
          if (priceFilter === "desc") return num(b.price, -Infinity) - num(a.price, -Infinity);
          if (alphabeticalFilter === "asc") return a.name.localeCompare(b.name);
          if (alphabeticalFilter === "desc") return b.name.localeCompare(a.name);
          return num(a.distance, Infinity) - num(b.distance, Infinity);
        })
    : []

  const nearestContractor =
  filteredContractors.length > 0
    ? filteredContractors.reduce((nearest, curr) =>
        curr.distance < nearest.distance ? curr : nearest,
        filteredContractors[0]
      )
    : null;

  const handleDeleteWorker = async (contractor) => {
    if (!selectedProperty?.id) return;
    if (!window.confirm(`Remove ${contractor.name}? This also deletes their reviews.`)) return;

    try {
      await axios.delete(
        `${process.env.REACT_APP_API_URL}/api/work-portal/contractors/${selectedProperty.id}/${contractor.id}`
      );
      await fetchContractors(selectedProperty.id);
    } catch (err) {
      console.error('Failed to delete contractor:', err);
      alert(err?.response?.data?.error || 'Failed to remove worker.');
    }
  };

  const handleBookNow = (contractor) => {
    setSelectedContractor(contractor)
    setCalendarView(true)
    setConfirmationMessage("")
    // Scroll after the panel has actually rendered; calling this in the same
    // tick scrolls to where the page *was*, which is why clicking Book Now
    // appeared to do nothing.
    requestAnimationFrame(() => {
      if (calendarRef.current) {
        calendarRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' })
      }
    })
  }

  const handleShowRatings = async (contractor) => {
    setSelectedContractor({ ...contractor });
    setShowRatings(true);
    setShowReviewForm(false);
  
    try {
      const res = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/work-portal/contractors/${selectedProperty.id}/${contractor.id}/ratings`
      );
      setRatings(res.data.ratings || []);
    } catch (err) {
      console.error('Failed to fetch ratings:', err);
      setRatings([]);
    }
  };

  const handleBookingSubmit = () => {
    if (!selectedDate || !selectedTime) {
      alert("Please select both date and time.")
      return
    }

    setConfirmationMessage(
      `Your request has been sent to ${selectedContractor?.name} for ${selectedDate.toDateString()} at ${selectedTime}.`,
    )

    // Reset for demo purposes
    setTimeout(() => {
      setCalendarView(false)
      setSelectedDate(null)
      setSelectedTime("")
      setConfirmationMessage("")
    }, 2500)
  }

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    const form = e.target;
    const reviewer = form.reviewer.value;
    const comment = form.comment.value;
    const stars = parseInt(form.stars.value);
  
    if (!reviewer || !comment || !stars) return;
  
    try {
      await axios.put(
        `${process.env.REACT_APP_API_URL}/api/work-portal/contractors/${selectedProperty.id}/${selectedContractor.id}/ratings`,
        { reviewer, comment, stars }
      );
      form.reset();
      setShowReviewForm(false);
      handleShowRatings(selectedContractor);   // refresh the list inside the modal
      // ...and the cards behind it, whose average rating just changed.
      if (selectedProperty?.id) {
        fetchContractors(selectedProperty.id);
      }
    } catch (err) {
      console.error('Failed to submit review:', err);
      alert('Failed to submit review.');
    }
  };  

  //Fetch Properties from API
  useEffect(() => {
    const fetchAndGeocodeProperties = async () => {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/api/work-portal/properties`);
      const data = await res.json();
      const apiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;
  
      const enrichedProperties = await Promise.all(
        data.map(async (p) => {
          // Attempt to geocode every address
          const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(p.address)}&key=${apiKey}`;
          const response = await fetch(url);
          const geoData = await response.json();
  
          if (geoData.status === 'OK') {
            const { lat, lng } = geoData.results[0].geometry.location;
  
            // Save to backend
            await fetch(`${process.env.REACT_APP_API_URL}/api/work-portal/update-location`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                propertyId: p.id,
                lat,
                lng,
                fallbackAddress: p.address,
              }),
            });
  
            return {
              ...p,
              location: { lat, lng },
            };
          } else {
            // Geocoding failed — fallback to Manila and label
            return {
              ...p,
              location: {
                lat: 14.5995,
                lng: 120.9842,
              },
              address: 'Cannot find address.',
            };
          }
        })
      );
  
      const validProperty = enrichedProperties.find(p => p.location?.lat && p.location?.lng);
      setProperties(enrichedProperties);
      setSelectedProperty(validProperty || null);
    };
  
    fetchAndGeocodeProperties();
  }, []);

  // Google Maps Autocomplete
  useEffect(() => {
    if (!isLoaded) return

    const input = document.getElementById("autocomplete")
    if (!input || !window.google || !window.google.maps || !window.google.maps.places) return

    const autocomplete = new window.google.maps.places.Autocomplete(input, {
      types: ["geocode"],
    })

    autocomplete.addListener("place_changed", () => {
      const place = autocomplete.getPlace()
      if (place.geometry) {
        const { lat, lng } = place.geometry.location
        setSelectedProperty((prev) => ({
          ...prev,
          location: {
            lat: lat(),
            lng: lng(),
          },
        }))
      }
    })
  }, [isLoaded])

  if (!isLoaded || !selectedProperty) {
    return <div>Loading map and properties...</div>;
  }
  
  if (
    !selectedProperty.location ||
    typeof selectedProperty.location.lat !== 'number' ||
    typeof selectedProperty.location.lng !== 'number'
  ) {
    return (
      <div className="fallback-prompt">
        <p>
          We couldn't find a location for this property. Please enter an address:
        </p>
  
        {selectedProperty?.address === 'Cannot find address.' && (
          <p style={{ color: 'red', marginBottom: '10px' }}>
            We could not locate this property automatically. Please enter a corrected address below.
          </p>
        )}
  
        <input
          type="text"
          placeholder="Enter full address"
          onBlur={handleAddressInput}
          className="search-box"
        />
      </div>
    );
  }

  // Find address
  const handleAddressInput = async (e) => {
    const address = e.target.value
    if (!address) return
  
    const apiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`
  
    const response = await fetch(url)
    const data = await response.json()
  
    if (data.status === 'OK') {
      const { lat, lng } = data.results[0].geometry.location
  
      await fetch(`${process.env.REACT_APP_API_URL}/api/work-portal/update-location`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          propertyId: selectedProperty.id,
          lat,
          lng,
          fallbackAddress: address,
        }),
      })
  
      setSelectedProperty({ ...selectedProperty, location: { lat, lng } })
    } else {
      alert('Address not found. Try again.')
    }
  }

  // Function to calculate distance in km
  function getDistanceInKm(loc1, loc2) {
    const R = 6371
    const dLat = (loc2.lat - loc1.lat) * (Math.PI / 180)
    const dLng = (loc2.lng - loc1.lng) * (Math.PI / 180)
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(loc1.lat * (Math.PI / 180)) * Math.cos(loc2.lat * (Math.PI / 180)) * Math.sin(dLng / 2) ** 2
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }

  console.log("isLoaded:", isLoaded);
  console.log("selectedProperty:", selectedProperty);
  console.log("selectedProperty.location:", selectedProperty?.location);
  

  return (
    <div className="work-portal">
      <div className="property-selector">
        <label>Select Property: </label>
        <select
          value={selectedProperty?.id || ""}
          onChange={(e) => {
            const chosen = properties.find((p) => p.id === e.target.value)
            if (chosen?.location?.lat && chosen?.location?.lng) {
              setSelectedProperty(chosen)
            } else {
              alert("This property has no coordinates yet. Please update its location.")
            }
          }}          
        >
          {properties.map((p) => (
            <option key={p.id} value={p.id}>
              {p.propertyName}
            </option>
          ))}
        </select>
      </div>

      {/* Form / Search Header */}
      {!calendarView && (
        <>
          <div className="top-bar">
            <input
              className="search-box"
              placeholder="Find a Maintenance Worker..."
              onChange={(e) => setNameFilter(e.target.value)}
            />
            <button className="property-btn" onClick={() => setShowForm(!showForm)}>
              {showForm ? "Close Form" : "Add a Maintenance Worker"}
            </button>
          </div>

          {/* Collapsible form */}
          {showForm && (
            <form
              className="worker-form"
              onSubmit={async (e) => {
                e.preventDefault();
                const form = e.target;
              
                const name = form.name.value;
                const role = form.role.value;
                const phone = form.phone.value;
                const email = form.email.value;
                const price = form.price.value;
                const availability = form.availability.value;
                const status = form.status.value;
                const description = form.description.value;

                if (!selectedProperty?.id || !name || !role || !phone || !email) return;
              
                try {
                  const response = await axios.put(`${process.env.REACT_APP_API_URL}/api/work-portal/contractors`, {
                    propertyId: selectedProperty.id,
                    name,
                    role,
                    phone,
                    email,
                    price,
                    availability,
                    status,
                    description,
                  });
              
                  if (response.status === 200) {
                    await fetchContractors(selectedProperty.id); // Refresh list
                    form.reset();
                    setShowForm(false);
                  }
                } catch (err) {
                  console.error('Error adding contractor:', err);
                  alert(err?.response?.data?.error || 'Failed to add contractor.');
                }
              }}              
            >
              <input name="name" placeholder="Name" required />
              <input name="role" placeholder="Role" required />
              <input name="phone" placeholder="Phone Number" required />
              <input name="email" placeholder="Email" required />
              <input name="price" type="number" min="0" step="any" placeholder="Rate (₱/hr)" />
              {/* A select, not free text: these values are compared exactly
                  against the availability filter. */}
              <select name="availability" defaultValue="">
                <option value="">Availability</option>
                <option value="Available">Available</option>
                <option value="Busy">Busy</option>
                <option value="Unavailable">Unavailable</option>
              </select>
              <select name="status" defaultValue="">
                <option value="">Status</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
              <input name="description" placeholder="Description (optional)" />
              <button type="submit">Submit Worker</button>
            </form>
          )}

          <div className="address-search">
            <input
              type="text"
              placeholder="Enter address to find nearby workers..."
              id="autocomplete"
              className="search-box"
            />
          </div>

          <div className="filter-controls">
            <select
              value={ratingFilter || ""}
              onChange={(e) => setRatingFilter(e.target.value ? Number(e.target.value) : "")}
            >
              <option value="">All Ratings</option>
              <option value="5">5 ★</option>
              <option value="4">4+ ★</option>
              <option value="3">3+ ★</option>
            </select>
            <select
              value={priceFilter}
              onChange={(e) => {
                setPriceFilter(e.target.value)
                // Two independent sort dropdowns both fed the same comparator,
                // and price was checked first -- so picking Z -> A did nothing
                // while a price sort was active. Selecting one clears the other.
                if (e.target.value) setAlphabeticalFilter("")
              }}
            >
              <option value="">Sort by Price</option>
              <option value="asc">Lowest Price</option>
              <option value="desc">Highest Price</option>
            </select>

            <select value={availabilityFilter} onChange={(e) => setAvailabilityFilter(e.target.value)}>
              <option value="">All Availability</option>
              <option value="Available">Available</option>
              <option value="Busy">Busy</option>
              <option value="Unavailable">Unavailable</option>
            </select>

            <select
              value={alphabeticalFilter}
              onChange={(e) => {
                setAlphabeticalFilter(e.target.value)
                if (e.target.value) setPriceFilter("")
              }}
            >
              <option value="">Sort Alphabetically</option>
              <option value="asc">A → Z</option>
              <option value="desc">Z → A</option>
            </select>
            <p style={{ fontStyle: "italic", color: "#666", margin: "0" }}>
              Click the map or drag the white marker to set your property location.
            </p>
          </div>
        </>
      )}

      {/* Calendar Booking View */}
      {calendarView && (
        <div className="calendar-view" ref={calendarRef}>
          <button onClick={() => setCalendarView(false)} className="back-btn">
            ← Back to Work Portal
          </button>
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
            <select value={selectedTime} onChange={(e) => setSelectedTime(e.target.value)} className="time-select">
              <option value="">Choose time</option>
              <option>9:00 AM</option>
              <option>10:00 AM</option>
              <option>11:00 AM</option>
              <option>1:00 PM</option>
              <option>2:00 PM</option>
              <option>3:00 PM</option>
              <option>4:00 PM</option>
            </select>

            <button onClick={handleBookingSubmit} className="book-btn" style={{ marginTop: "20px" }}>
              Request to book
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

            {ratings.length === 0 ? (
              <p>No Reviews Yet.</p>
            ) : (
              <ul>
                {ratings.map((r, i) => (
                  <li key={i}>
                    <strong>{r.reviewer}:</strong> {r.comment}
                    <span style={{ marginLeft: '10px', color: '#3b82f6' }}>
                      {[...Array(r.stars)].map((_, i) => '★')}
                    </span>
                  </li>
                ))}
              </ul>
            )}

            {showReviewForm && (
              <form className="review-form" onSubmit={handleSubmitReview}>
                <input name="reviewer" placeholder="Your name" required />
                <input name="comment" placeholder="What was the work like?" required />
                <select name="stars" defaultValue="" required>
                  <option value="" disabled>
                    Rating
                  </option>
                  <option value="5">5 ★</option>
                  <option value="4">4 ★</option>
                  <option value="3">3 ★</option>
                  <option value="2">2 ★</option>
                  <option value="1">1 ★</option>
                </select>
                <div className="modal-actions">
                  <button type="submit" className="btn-primary">
                    Submit review
                  </button>
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => setShowReviewForm(false)}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}

            {!showReviewForm && (
              <div className="modal-actions">
                <button className="btn-primary" onClick={() => setShowReviewForm(true)}>
                  Write a review
                </button>
                <button className="btn-secondary" onClick={() => setShowRatings(false)}>
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {!calendarView && (
        <>
          {selectedProperty?.location &&
            typeof selectedProperty.location.lat === 'number' &&
            typeof selectedProperty.location.lng === 'number' &&
            isFinite(selectedProperty.location.lat) &&
            isFinite(selectedProperty.location.lng) && (
              <GoogleMap
                mapContainerStyle={mapContainerStyle}
                center={
                  selectedProperty?.location &&
                  typeof selectedProperty.location.lat === 'number' &&
                  typeof selectedProperty.location.lng === 'number'
                    ? selectedProperty.location
                    : defaultLocation
                }                
                zoom={11}
                onClick={(e) =>
                  setSelectedProperty({
                    ...selectedProperty,
                    location: {
                      lat: e.latLng.lat(),
                      lng: e.latLng.lng(),
                    },
                  })
                }
              >
                {/* Property Marker */}
                <Marker
                  position={selectedProperty.location}
                  icon={{
                    url: "https://img.icons8.com/ios-filled/50/ffffff/marker.png",
                    scaledSize: new window.google.maps.Size(35, 35),
                  }}
                  label="Property"
                  draggable={true}
                  onDragEnd={(e) =>
                    setSelectedProperty({
                      ...selectedProperty,
                      location: {
                        lat: e.latLng.lat(),
                        lng: e.latLng.lng(),
                      },
                    })
                  }
                />

                {/* Contractor Markers */}
                {contractors.map((c) =>
                  c.location?.lat && c.location?.lng ? (
                    <Marker
                      key={c.id}
                      position={c.location}
                      icon={{
                        url: "https://img.icons8.com/ios-filled/50/3b82f6/worker-male.png",
                        scaledSize: new window.google.maps.Size(30, 30),
                      }}
                      onClick={() => setSelectedContractor(c)}
                    />
                  ) : null
                )}

                {contractors.length === 0 && (
                  <p style={{ fontStyle: 'italic', color: '#999' }}>
                    No maintenance workers available yet.
                  </p>
                )}

                {/* Info Window */}
                {selectedContractor?.location?.lat && selectedContractor?.location?.lng && (
                  <InfoWindow
                    position={selectedContractor.location}
                    onCloseClick={() => setSelectedContractor(null)}
                  >
                    <div>
                      <strong>{selectedContractor.name}</strong>
                      <br />
                      {selectedContractor.role}
                      <br />
                      {selectedContractor.price} PHP/hr
                    </div>
                  </InfoWindow>
                )}
              </GoogleMap>
            )}
        </>
      )}

          {nearestContractor && (
            <div className="nearest-info">
              <h3>Nearest Maintenance Worker</h3>
              <p>
                <strong>{nearestContractor.name}</strong> ({nearestContractor.role})
              </p>
              <p>Price: ₱{nearestContractor.price}/hr</p>
              <p>Rating: {nearestContractor.rating} ★</p>
              <p>Phone: {nearestContractor.phone}</p>
              <p>Email: {nearestContractor.email}</p>
              <p>
                Distance: {typeof nearestContractor.distance === 'number'
                  ? `${nearestContractor.distance.toFixed(2)} km`
                  : 'N/A'}
              </p>

              <div className="action-buttons">
                <button className="btn-primary" onClick={() => handleBookNow(nearestContractor)}>
                  Book Now
                </button>
                <button className="btn-secondary" onClick={() => handleShowRatings(nearestContractor)}>
                  See Ratings
                </button>
              </div>
            </div>
          )}

          {/* Contractor Cards */}
          <div className="contractor-card-grid">
          {filteredContractors.map((c, index) => (
            <div className="contractor-card" key={index}>
              <div className="contractor-info">
                <p><strong>{c.name}</strong></p>
                <p>Role: {c.role}</p>
                <p>Description: {c.description}</p>
                <p>Phone: {c.phone}</p>
                <p>Email: {c.email}</p>
                <p>Status: {c.status || '—'}</p>
                <p>Price: {c.price ? `₱${c.price}/hr` : 'Not set'}</p>
                <p>Availability: {c.availability || '—'}</p>
                <p>
                  Distance: {typeof c.distance === 'number' ? `${c.distance.toFixed(2)} km` : 'N/A'}
                </p>
                <div className="rating">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} style={{ color: i < Math.round(c.rating || 0) ? "#3b82f6" : "#d1d5db" }}>
                      ★
                    </span>
                  ))}
                  <span className="review-count">
                    {c.reviewCount
                      ? `${c.rating} (${c.reviewCount} review${c.reviewCount === 1 ? '' : 's'})`
                      : 'No reviews yet'}
                  </span>
                </div>
              </div>
              <div className="contractor-actions">
                <button className="book-btn" onClick={() => handleBookNow(c)}>Book Now</button>
                <button className="ratings-btn" onClick={() => handleShowRatings(c)}>See Ratings</button>
                <button
                  className="delete-worker-btn"
                  onClick={() => handleDeleteWorker(c)}
                  aria-label={`Remove ${c.name}`}
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
    </div>
  )
}

export default WorkPortal
