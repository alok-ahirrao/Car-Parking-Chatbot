import React, { useState, useEffect, useRef } from 'react'; // Import useRef
import axios from 'axios';
import { TextField, Typography, Container, Avatar, IconButton, Divider } from '@mui/material';
import {Box,FormControl,InputLabel,Select,MenuItem,Button} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import 'react-datepicker/dist/react-datepicker.css';
import DatePicker from 'react-datepicker';
import BotLogo from './7.11.png'; // Adjust the path as needed
import './chatbot.css'; // Import your CSS
import BotProfile from './2.png'; // Adjust the path as needed
// import AttachFileIcon from '@mui/icons-material/AttachFile';
import ImageIcon from '@mui/icons-material/Image'; // Import the image icon

import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';

const Chatbot = () => {
  const [messages, setMessages] = useState([]);
  const [step, setStep] = useState(1);
  const [userName, setUserName] = useState('');
  const [licensePlate, setLicensePlate] = useState('');
  const [existingPlates, setExistingPlates] = useState([]);
  const [selectedPlate, setSelectedPlate] = useState(null);
  const [date, setDate] = useState(new Date());
  const [entryTime, setEntryTime] = useState(null);
  const [exitTime, setExitTime] = useState(null);
  const [bookingDetails, setBookingDetails] = useState(null);
  const [inputText, setInputText] = useState('');
  const jwtToken = localStorage.getItem('token');
  const [uploadedFile, setUploadedFile] = useState(null);
  const [isManualEntry, setIsManualEntry] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentInputContext, setCurrentInputContext] = useState('message'); // Track input context
  const messagesEndRef = useRef(null);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);  // State to manage loading
  const [error, setError] = useState(null); 
  const [selectedLocation, setSelectedLocation] = useState(null);
  useEffect(() => {
      const fetchUserData = async () => {
        try {
          // Fetch user information
          const userResponse = await axios.get('http://localhost:5000/api/auth/me', {
            headers: { Authorization: `Bearer ${jwtToken}` },
          });
          
          // Set the user's name in state
          setUserName(userResponse.data.firstName);
          
          // Add a greeting message if it doesn't already exist in messages
          if (!messages.some(msg => msg.text.includes(`Hello, ${userResponse.data.firstName}!`))) {
            addMessage(`Hello, ${userResponse.data.firstName}! How can I assist you today?`);
          }
          
          // Fetch the user's number plates
          const platesResponse = await axios.get('http://localhost:5000/api/parking/numberplate', {
            headers: { Authorization: `Bearer ${jwtToken}` },
          });
    
          // Set existingPlates to the array from the response or an empty array if it doesn't exist
          setExistingPlates(Array.isArray(platesResponse.data.numberPlates) ? platesResponse.data.numberPlates : []);
          
        } catch (error) {
          // Handle error by adding an error message to the messages array
          addMessage('Error fetching user data.', true);
        }
      };
    
      fetchUserData();
    }, [jwtToken, messages]);
    
    const scrollToBottom = () => {
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
      }
    };
    useEffect(() => {
      scrollToBottom();
    }, [messages]);
    
    
  const addMessage = (text, isUser = false) => {
    setMessages((prevMessages) => [
      ...prevMessages,
      { text, isUser, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) },
    ]);
  };

  const handleOptionClick = (option) => {
    if (option === 'park') {
      setStep(2);
      addMessage('I want to park the car', true);
      addMessage('Please choose your existing license plate:');
    } else if (option === 'help') {
      setStep('help');
      addMessage('You asked for help.');
    }
  };

  const handleLicenseSubmit = async () => {
    if (licensePlate.trim()) {
      try {
        const response = await axios.post(
          'http://localhost:5000/api/parking/numberplate',
          { numberPlate: licensePlate },
          { headers: { Authorization: `Bearer ${jwtToken}` } }
        );
        if (response.status === 201 && response.data.message === 'Number plate added successfully') {
          setSelectedPlate(licensePlate);
          addMessage(`License plate ${licensePlate} registered successfully.`, true);
          setStep(3);
        } else {
          addMessage('Error registering the license plate: ' + (response.data.message || 'Please try again.'), true);
        }
      } catch (error) {
        addMessage('Error registering the license plate: ' + (error.response ? error.response.data.message : 'Please try again.'), true);
      }
    } else {
      addMessage('Please enter a valid license plate number.', true);
    }
  };

  const handleConfirmDetectedPlate = () => {
    setSelectedPlate(licensePlate); // Set the detected license plate as selected
    addMessage(`License plate ${licensePlate} confirmed. Proceeding to the next step.`, false); // Inform the user
    setStep(7); // Move to the next step (entry and exit time selection)
  };
  
  const handleFileUpload = async (event) => {
    if (currentInputContext !== 'licensePlate') {
      addMessage('Please switch to manual entry mode to upload an image.', false);
      return;
    }
  
    const file = event.target.files[0];
    if (!file) {
      addMessage('No file selected. Please try again.', false);
      return;
    }
  
    setUploadedFile(file); // Save the uploaded file to the state
  
    // Prepare the file for sending to the Python microservice
    const formData = new FormData();
    formData.append('image', file);
  
    try {
      // Send the image to the Python microservice for detection
      const response = await axios.post('http://localhost:8000/detect', formData, {
        headers: {
          Authorization: `Bearer ${jwtToken}`, // Pass the JWT token in headers
          'Content-Type': 'multipart/form-data', // Set content type
        },
      });
  
      // Process the detected plate from the response
      const detectedPlate = response.data.detected_plates?.[0]; // Assuming the response contains an array
      if (detectedPlate) {
        setLicensePlate(detectedPlate); // Update the license plate in state
        setInputText(detectedPlate); // Auto-fill detected plate in the input field
        addMessage(`Detected license plate: ${detectedPlate}`, false); // Inform the user
      } else {
        addMessage('No valid license plate detected. Please try again.', false); // Handle case where no plate is detected
      }
    } catch (error) {
      console.error('Error detecting license plate:', error);
      addMessage('Error detecting license plate. Please try again.', false); // Handle errors
    }
  };
  
  
  const handleManualPlateSubmit = async () => {
    if (licensePlate.trim()) {
      try {
        // Send the manually entered license plate to the backend
        const response = await axios.post(
          'http://localhost:5000/api/parking/manual-plate', // The backend endpoint to handle manual plate
          { licensePlate },
          { headers: { Authorization: `Bearer ${jwtToken}` } }
        );
  
        if (response.status === 200) {
          addMessage(`License plate ${licensePlate} registered successfully.`, true);  // Confirmation message
          setSelectedPlate(licensePlate); // Set the selected plate
          setStep(3); // Proceed to the next step (entry and exit time selection)
        } else {
          addMessage(response.data.message, true); // Show the error message from the backend
        }
      } catch (error) {
        addMessage('Error registering the license plate.', true); // Error message
      }
    } else {
      addMessage('Please enter a valid license plate number.', true); // Validation message
    }
  };
  
  
  const handleBookingConfirmation = async (entryDate, exitDate) => {
    // Input Validation
    if (!selectedPlate) {
      addMessage('Please select a license plate before booking.', true);
      return;
    }
  
    if (!entryDate || !exitDate) {
      addMessage('Please select both entry and exit times before confirming.', true);
      return;
    }
  
    if (entryDate >= exitDate) {
      addMessage('Exit time must be later than entry time.', true);
      return;
    }
  
    // Check if selectedLocation is valid
    if (!selectedLocation || !selectedLocation.name) {
      addMessage('Please select a valid location before booking.', true);
      return;
    }
  
    try {
      // Show loading state
      setIsLoading(true);
  
      // API Call
      console.log("Selected Location:", selectedLocation.name);
  
      const response = await axios.post(
        'http://localhost:5000/api/parking/book/date',
        {
          numberPlate: selectedPlate,
          location: selectedLocation.name,
          date,
          entryTime: entryDate.toISOString(),  // Convert Date object to ISO string
          exitTime: exitDate.toISOString(),    // Convert Date object to ISO string
        },
        { headers: { Authorization: `Bearer ${jwtToken}` } }
      );
  
      if (response.status === 200) {
        // Handle successful booking
        setBookingDetails({
          bookingId: response.data.bookingId,
          slotNumber: response.data.slotNumber,
        });
  
        addMessage('Booking successful!', false);
        addMessage(
          `Entry Time: ${entryDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
          true
        );
        addMessage(
          `Exit Time: ${exitDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
          true
        );
        addMessage(`Slot Number: ${response.data.slotNumber}`, false);
  
        setStep(6); // Proceed to the success step
      }
    } catch (error) {
      // Handle errors
      let errorMessage = 'An unexpected error occurred. Please try again.';
      
      if (error.response) {
        // Handle error returned from API
        if (error.response.status === 400) {
          // Handle client-side validation errors
          errorMessage = error.response.data.message || 'There was an issue with your request.';
        } else if (error.response.status === 404) {
          // Handle missing resources (like location not found)
          errorMessage = 'Selected location not found. Please try again.';
        } else if (error.response.status === 500) {
          // Server-side errors
          errorMessage = 'Server error occurred. Please try again later.';
        } else {
          errorMessage = error.response.data.message || 'An unexpected error occurred. Please try again.';
        }
      } else if (error.request) {
        // Handle no response from the server (network errors)
        errorMessage = 'Network error. Please check your connection and try again.';
      } else {
        // Something else caused the error
        errorMessage = error.message || 'An unexpected error occurred.';
      }
  
      addMessage(`Booking failed: ${errorMessage}`, true);
    } finally {
      // Hide loading state
      setIsLoading(false);
    }
  };
  
  
  
  const renderGreeting = () => (
    <Box className="chatbot-container">
      <Typography variant="h6" style={{ color: '#333' }}>What would you like to do?</Typography>
      <Button variant="contained" className="recommendation-button" onClick={() => handleOptionClick('park')}>
        I want to park the car
      </Button>
      <Button variant="outlined" onClick={() => handleOptionClick('help')}>Ask for help</Button>
    </Box>
  );

  const renderHelp = () => (
    <Box className="chatbot-container">
      <Typography variant="h5" style={{ marginBottom: '10px' }}>Help Section</Typography>
      <Typography style={{ color: '#555' }}>This system allows you to manage your parking needs.</Typography>
      <Button variant="contained" onClick={() => setStep(1)} style={{ marginTop: '20px' }}>Back to chatbot page</Button>
      <Divider />
      <Typography style={{ marginTop: '10px', color: '#666' }}>Contact Support: 123-456-7890 or support@gmail.com</Typography>
    </Box>
  );

  const renderLicensePlateSelection = () => {
    const validPlates = Array.from(new Set(existingPlates.filter((plate) => plate && typeof plate === 'string' && plate.trim() !== '')));
  
    return (
      <Box className="license-plate-container">
        {validPlates.length > 0 ? (
          <>
            {validPlates.map((plate, index) => (
              <Button
                key={`${plate}-${index}`}
                className="license-plate-button"
                onClick={() => {
                  setSelectedPlate(plate);
                  addMessage(plate, true); // Add the selected plate as a user message
                  setStep(7); // Proceed to the next step
                }}
              >
                {plate}
              </Button>
            ))}
            {/* Single manual entry button at the end */}
            <Button
              className="license-plate-button"
              onClick={() => {
                handleManualPlateEntry(); // Trigger manual entry context
                setStep('manual-entry'); // Move to manual entry step
              }}
            >
              Enter manually
            </Button>
          </>
        ) : (
          <>
            {/* Display message if no plates exist */}
            <Typography>No valid existing plates found. Please enter your car's license plate number.</Typography>
            {/* Manual entry button shown here as well */}
            <Button
              className="license-plate-button"
              onClick={() => {
                handleManualPlateEntry(); // Trigger manual entry context
                setStep('manual-entry'); // Move to manual entry step
              }}
            >
              Enter manually
            </Button>
          </>
        )}
      </Box>
    );
  };


  const renderManualEntry = () => (
    <Box className="chatbot-container">
      
      <Button
        variant="contained"
        onClick={() => {
          setStep(2); // Go back to plate selection
          addMessage('You have cancelled the manual entry.', false);
          setCurrentInputContext('message'); // Reset input context
        }}
        style={{ marginBottom: '10px' }}
      >
        Cancel
      </Button>
    </Box>
  );


  const renderLocationSelection = () => {
    if (loading) {
      return (
        <Box className="chatbot-container">
          <Typography variant="h6">Loading locations...</Typography>
        </Box>
      );
    }
  
    if (error) {
      return (
        <Box className="chatbot-container">
          <Typography variant="h6" style={{ color: 'red' }}>
            {error}
          </Typography>
        </Box>
      );
    }
  
    // Ensure locations is an array before rendering
    if (!Array.isArray(locations) || locations.length === 0) {
      return (
        <Box className="chatbot-container">
          <Typography variant="h6">No locations available</Typography>
        </Box>
      );
    }
  
    const handleLocationSelect = (locationId) => {
   
      const selectedLocation = locations.find((loc) => loc.id === locationId);
      
      if (selectedLocation) {
        setSelectedLocation(selectedLocation);
        addMessage(selectedLocation.name, true); 
        setStep(3); // Move to the next step
      } else {
        console.error("Location not found");
      }
    };
    return (
      <Box
        className="chatbot-container"
        sx={{ display: 'flex', flexDirection: 'column', gap: 2, position: 'relative', width: '300px' }}
      >
        <Typography variant="h6" style={{ color: '#333' }}>
          Select a Location
        </Typography>
  
        {locations.map((location) => (
          <Button
            key={location.id}
            className="location-button"
            onClick={() => handleLocationSelect(location.id)} // Handle location selection
            sx={{
              padding: '10px',
              borderRadius: '5px',
              backgroundColor: '#f0f0f0',
              border: '1px solid #ccc',
              fontSize: '14px',
              textTransform: 'none',
              ':hover': { backgroundColor: '#ddd' },
            }}
          >
            {location.name}
          </Button>
        ))}
      </Box>
    );
  };
  
  
  
  
  // Example of your fetchLocations function
  const fetchLocations = async () => {
    try {
      // Make the GET request to fetch locations
      const response = await axios.get('http://localhost:5000/api/locations');
      console.log("Fetched locations:", response.data); // Log the response
  
      // Directly set locations from the response data
      setLocations(response.data || []); // If response.data is undefined, use an empty array
      
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch locations');
      setLoading(false);
    }
  };
  
  useEffect(() => {
    if (step === 7) {
      fetchLocations(); // Fetch locations when step 7 is reached
    }
  }, [step]);

  // Function to render location selection dropdown
 
  useEffect(() => {
    if (step === 7) {
      setStep(7);
    }
  }, [step]);

  
  const renderDateInput = () => (
    <Box className="chatbot-container">
      <Typography variant="h5">Proceeding with the following details:</Typography>
      <Typography>Plate Number: {selectedPlate}</Typography>
      <Typography>Booking Date: {date.toLocaleDateString()}</Typography>
    </Box>
  );

 
  
  

    
  
  const renderTimeInput = () => {
    return (
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <Box
          className="time-picker-wrapper"
          sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
            position: 'relative',
            maxWidth: '300px', // Limited width for compact look
            margin: '0 auto',  // Center the form
          }}
        >
          {/* Entry Time Picker */}
          <DateTimePicker
            views={['year', 'month', 'day', 'hours', 'minutes']}
            label="Entry Time"
            value={entryTime}
            onChange={(time) => {
              console.log('Selected entry time:', time);
              setEntryTime(time);
            }}
            ampm={true} // 12-hour format
            minutesStep={15}
            PopperComponent={(props) => (
              <div
                {...props}
                sx={{
                  width: '160px', // Narrower popper for a compact look
                  maxWidth: '160px',
                  maxHeight: '200px',
                  height: 'auto',
                  position: 'absolute',
                  right: 0,
                  top: '100%',
                  zIndex: 1000,
                  overflow: 'auto',
                  boxSizing: 'border-box',
                }}
              />
            )}
            renderInput={(params) => (
              <TextField
                {...params}
                placeholder="Select entry time"
                variant="outlined"
                fullWidth
                sx={{
                  '& .MuiInputBase-root': {
                    height: '40px', // Compact input height
                    borderRadius: '10px', // Rounded corners for modern look
                  },
                  '& .MuiInputBase-input': {
                    fontSize: '14px', // Adjust font size
                  },
                  width: '100%', // Full width
                  borderColor: '#ddd', // Light gray border
                }}
              />
            )}
          />
  
          {/* Exit Time Picker */}
          <DateTimePicker
            views={['year', 'month', 'day', 'hours', 'minutes']}
            label="Exit Time"
            value={exitTime}
            onChange={(time) => {
              console.log('Selected exit time:', time);
              setExitTime(time);
            }}
            ampm={true} // 12-hour format
            minutesStep={15}
            PopperComponent={(props) => (
              <div
                {...props}
                sx={{
                  width: '160px', // Keep popper consistent
                  maxWidth: '160px',
                  maxHeight: '200px',
                  height: 'auto',
                  position: 'absolute',
                  right: 0,
                  top: '100%',
                  zIndex: 1000,
                  overflow: 'auto',
                  boxSizing: 'border-box',
                }}
              />
            )}
            renderInput={(params) => (
              <TextField
                {...params}
                placeholder="Select exit time"
                variant="outlined"
                fullWidth
                sx={{
                  '& .MuiInputBase-root': {
                    height: '40px',
                    borderRadius: '10px', // Rounded corners
                  },
                  '& .MuiInputBase-input': {
                    fontSize: '14px',
                  },
                  width: '100%',
                  borderColor: '#ddd', // Subtle border
                }}
              />
            )}
          />
  
          {/* Confirm Booking Button */}
          <Button
            className="confirm-booking-btn"
            onClick={() => {
              const entryDate = entryTime.toDate();
              const exitDate = exitTime.toDate();
              handleBookingConfirmation(entryDate, exitDate);
            }}
            variant="contained"
            sx={{
              height: '45px', // Button height
              fontSize: '16px', // Button text size
              borderRadius: '10px', // Rounded button corners
              backgroundColor: '#3f51b5', // Modern color
              '&:hover': {
                backgroundColor: '#303f9f', // Hover effect
              },
              padding: '0 20px', // Padding for the button
              marginTop: '16px', // Space between button and inputs
            }}
          >
            Confirm Booking
          </Button>
        </Box>
      </LocalizationProvider>
    );
  };   

  const renderThankYou = () => (
    <Box className="chatbot-container">
      <Typography variant="h5">Thank you for your booking!</Typography>
      <Typography>Your booking details:</Typography>
      <Typography>Location: {selectedLocation.name}</Typography>
      <Typography>Plate Number: {selectedPlate}</Typography>
      <Typography>Booking ID: {bookingDetails?.bookingId}</Typography>
      <Typography>Slot Number: {bookingDetails?.slotNumber}</Typography>
    </Box>
  );

  const handleSendMessage = async (e) => {
    e.preventDefault();
  
    const trimmedInput = inputText.trim();
    if (!trimmedInput) return; // Prevent empty submissions
  
    if (currentInputContext === 'message') {
      // Normal message context
      addMessage(trimmedInput, true);
      setInputText(''); // Clear input field
    } else if (currentInputContext === 'licensePlate') {
      // Handle license plate entry
      addMessage(trimmedInput, true); // Show the entered plate in chat
      setInputText(''); // Clear input
  
      // Save the license plate to the database
      try {
        const response = await axios.post(
          'http://localhost:5000/api/parking/numberplate',
          { numberPlate: trimmedInput },
          { headers: { Authorization: `Bearer ${jwtToken}` } }
        );
  
        if (response.status === 201) {
          // Success: License plate registered
          setSelectedPlate(trimmedInput);
          addMessage(`License plate "${trimmedInput}" registered successfully.`, false);
          setStep(7); // Proceed to the next step
          setCurrentInputContext('message'); // Reset input context
        } else {
          // Server responded with an error
          addMessage(response.data.message || 'Error saving the license plate. Please try again.', false);
        }
      } catch (error) {
        // Network or server error
        console.error('Error registering the license plate:', error);
        addMessage('Error registering the license plate. Please try again later.', false);
      }
    }
  };
  

  const handleManualPlateEntry = () => {
  addMessage('Please type your license plate number or upload an image:', false);
  setCurrentInputContext('licensePlate'); // Set input context to manual entry
};

  useEffect(() => {
    if (step === 7) {
      addMessage('Please select Location:');
    }
  }, [step]);

  useEffect(() => {
    if (step === 3) {
      setStep(4);
    }
  }, [step]);

  return (
    <div className="chatbot-page" style={{ backgroundColor: '#f5f5f5', minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <Container maxWidth="sm">
        <Box className="chatbot-box" style={{ backgroundColor: '#edf0f2', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)', display: 'flex', flexDirection: 'column', height: '80vh' }}>
          
          {/* Chatbot Header with Profile */}
          <Box display="flex" alignItems="center" padding="15px" bgcolor="#010817" color="white" borderRadius="8px 8px 0 0">
            <Avatar src={BotProfile} alt="Bot" style={{ marginRight: '10px', backgroundColor: 'transparent' }} />
            <Typography variant="h6" fontWeight="500" style={{ marginRight: '10px' }}>AstraVision Chatbot</Typography>
            
            {/* Green Dot for Online Status */}
            <Box
              component="span"
              style={{
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                backgroundColor: 'green',
                marginRight: '5px',
              }}
            />
            
            {/* Online Text */}
            <Typography variant="body2" style={{ color: '#d1d1d1' }}>Online</Typography>
          </Box>
          
          {/* Chat Messages Section */}
          <Box className="chatbot-messages" style={{ flex: 1, overflowY: 'auto', padding: '10px', backgroundColor: '#f7f9fc' }}>
            {messages.map((msg, index) => (
              <Box 
                key={index} 
                display="flex" 
                alignItems="flex-start" 
                justifyContent={msg.isUser ? 'flex-end' : 'flex-start'} 
                style={{ marginBottom: '10px', backgroundColor: 'transparent' }}
              >
                {/* Display avatar only for bot messages */}
                {!msg.isUser && (
                  <Avatar 
                    src={BotLogo} 
                    alt="Bot" 
                    className="bot-avatar" 
                    style={{ marginRight: '8px', backgroundColor: 'transparent', border: 'none' }} 
                  />
                )}
                <Box
                  className={`message ${msg.isUser ? 'user' : 'bot'}`}
                  style={{
                    backgroundColor: msg.isUser ? '#E3F2FD' : '#F0F0F0',
                    color: msg.isUser ? '#121212' : '#333',
                    borderRadius: msg.isUser ? '18px 18px 0px 18px' : '0px 18px 18px 18px',
                    padding: '10px',
                    maxWidth: '75%',
                    wordWrap: 'break-word',
                    alignSelf: msg.isUser ? 'flex-end' : 'flex-start',
                    boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
                  }}
                >
                  {/* Check if the message is an image URL */}
                  {msg.text.startsWith('data:image/') || msg.text.startsWith('http') ? (
                    <img 
                      src={msg.text} 
                      alt="Uploaded by user" 
                      style={{ maxWidth: '100%', borderRadius: '10px', marginBottom: '5px' }} 
                    />
                  ) : (
                    <Typography variant="body2" className="message-text">{msg.text}</Typography>
                  )}
                  <Typography variant="caption" className="message-time" style={{ textAlign: 'right', marginTop: '5px' }}>{msg.time}</Typography>
                </Box>
              </Box>
            ))}
            {step === 1 && renderGreeting()}
            {step === 'help' && renderHelp()}
            {step === 2 && renderLicensePlateSelection()}
            {step === 'manual-entry' && renderManualEntry()}
            {step === 3 && renderDateInput()}
            {step === 4 && renderTimeInput()}
            {step === 6 && renderThankYou()}
            {step === 7 && renderLocationSelection()}
          </Box>
    
          {/* Input Container at the Bottom of Chat Box */}
          <Box
            className="chatbot-input-container"
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '10px 15px',
              backgroundColor: '#ffffff',
              border: 'none', // This removes the border
            }}
          >
            <form
              onSubmit={handleSendMessage}
              style={{ flexGrow: 1, display: 'flex', alignItems: 'center' }}
            >
              {/* Image upload button */}
              <IconButton component="label">
                <ImageIcon className="image-icon" style={{ color: '#8c8fa5' }} />
                {/* Hidden input for file selection */}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  style={{ display: 'none' }}
                />
              </IconButton>
  
              <TextField
                variant="outlined"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Type your message..."
                style={{
                  width: '100%',
                  borderRadius: '25px',
                  backgroundColor: '#f1f2f6',
                  paddingLeft: '10px 15px',
                }}
                InputProps={{
                  disableUnderline: true,
                  style: {
                    fontSize: '1rem',
                    border: 'none',
                    boxShadow: 'none',
                    outline: 'none',
                  },
                }}
              />
              <IconButton type="submit">
                <SendIcon className="send-icon" style={{ color: '#001a28' }} />
              </IconButton>
            </form>
          </Box>
        </Box>
      </Container>
    </div>
  );
  
};

export default Chatbot;
