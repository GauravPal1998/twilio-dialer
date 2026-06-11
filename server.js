// server.js
// Run: node server.js
// Requires: npm install express twilio dotenv cors

const express = require('express');
const cors = require('cors');
const twilio = require('twilio');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(express.static('public')); // serves index.html

const {
  TWILIO_ACCOUNT_SID,
  TWILIO_AUTH_TOKEN,
  TWILIO_API_KEY_SID,
  TWILIO_API_KEY_SECRET,
  TWILIO_TWIML_APP_SID,
  TWILIO_CALLER_ID, // your Twilio US number, e.g. +1XXXXXXXXXX
} = process.env;

// 1. Generate an access token for the browser dialer
app.get('/token', (req, res) => {
  const identity = req.query.identity || 'gaurav';

  const AccessToken = twilio.jwt.AccessToken;
  const VoiceGrant = AccessToken.VoiceGrant;

  const token = new AccessToken(
    TWILIO_ACCOUNT_SID,
    TWILIO_API_KEY_SID,
    TWILIO_API_KEY_SECRET,
    { identity }
  );

  const voiceGrant = new VoiceGrant({
    outgoingApplicationSid: TWILIO_TWIML_APP_SID,
    incomingAllow: true,
  });

  token.addGrant(voiceGrant);

  res.json({ identity, token: token.toJwt() });
});

// 2. TwiML endpoint - Twilio hits this when the browser places a call
//    This is the "Voice URL" you set on your TwiML App
app.post('/voice', (req, res) => {
  const twiml = new twilio.twiml.VoiceResponse();
  const numberToCall = req.body.To; // sent from the browser dialer

  if (numberToCall) {
    const dial = twiml.dial({ callerId: TWILIO_CALLER_ID });
    dial.number(numberToCall);
  } else {
    twiml.say('No destination number provided.');
  }

  res.type('text/xml');
  res.send(twiml.toString());
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
