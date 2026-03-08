const { createUser, getUserByMobile, updateUser } = require('../services/dynamoService');

async function sendOTP(event) {
  try {
    const { mobile } = JSON.parse(event.body);
    
    if (!mobile || mobile.length !== 10) {
      return {
        statusCode: 400,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ error: 'Invalid mobile number' })
      };
    }
    
    const demoOtp = '123456';
    
    let user = await getUserByMobile(mobile);
    if (!user) {
      user = await createUser(mobile);
    }
    
    await updateUser(user.userId, { otp: demoOtp, otpExpiry: Date.now() + 600000 });
    
    console.log(`Demo OTP for ${mobile}: ${demoOtp}`);
    
    return {
      statusCode: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ 
        success: true,
        message: 'OTP sent successfully',
        demoOTP: demoOtp
      })
    };
  } catch (error) {
    console.error('sendOTP error:', error);
    return {
      statusCode: 500,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ error: 'Failed to send OTP' })
    };
  }
}

async function verifyOTP(event) {
  try {
    const { mobile, otp } = JSON.parse(event.body);
    
    if (!mobile || !otp) {
      return {
        statusCode: 400,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ error: 'Mobile and OTP required' })
      };
    }
    
    if (otp === '123456') {
      let user = await getUserByMobile(mobile);
      if (!user) {
        user = await createUser(mobile);
      }
      
      const token = Buffer.from(`${user.userId}:${Date.now()}`).toString('base64');
      
      return {
        statusCode: 200,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ 
          success: true,
          token, 
          user: {
            userId: user.userId,
            mobile: user.mobile
          }
        })
      };
    }
    
    return {
      statusCode: 401,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ error: 'Invalid OTP' })
    };
  } catch (error) {
    console.error('verifyOTP error:', error);
    return {
      statusCode: 500,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ error: 'Failed to verify OTP' })
    };
  }
}

module.exports = {
  sendOTP,
  verifyOTP
};
