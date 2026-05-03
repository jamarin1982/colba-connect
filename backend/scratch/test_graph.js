require('dotenv').config();
const axios = require('axios');

const getGraphToken = async () => {
  const { AZURE_TENANT_ID, AZURE_CLIENT_ID, AZURE_CLIENT_SECRET } = process.env;
  console.log('Testing with:', { AZURE_TENANT_ID, AZURE_CLIENT_ID });
  
  const url = `https://login.microsoftonline.com/${AZURE_TENANT_ID}/oauth2/v2.0/token`;
  const params = new URLSearchParams();
  params.append('client_id', AZURE_CLIENT_ID);
  params.append('scope', 'https://graph.microsoft.com/.default');
  params.append('client_secret', AZURE_CLIENT_SECRET);
  params.append('grant_type', 'client_credentials');

  try {
    const res = await axios.post(url, params);
    console.log('Token obtained successfully');
    return res.data.access_token;
  } catch (err) {
    console.error('Error getting Graph token:', err.response?.data || err.message);
    return null;
  }
};

const testCalendar = async () => {
  const token = await getGraphToken();
  if (!token) return;

  const senderEmail = process.env.EMAIL_SENDER_ID || 'no_responder@grupocolba.com';
  console.log('Testing calendar for:', senderEmail);

  try {
    const url = `https://graph.microsoft.com/v1.0/users/${senderEmail}/calendar`;
    const res = await axios.get(url, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('Calendar accessible:', res.data.name);
  } catch (err) {
    console.error('Error accessing calendar:', err.response?.data || err.message);
  }
};

testCalendar();
