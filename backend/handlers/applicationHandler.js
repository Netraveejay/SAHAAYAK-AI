const { saveApplication, getApplications, updateApplication } = require('../services/dynamoService');

function getUserIdFromToken(event) {
  const auth = event.headers?.Authorization || event.headers?.authorization;
  if (!auth) return null;
  const token = auth.replace('Bearer ', '');
  const decoded = Buffer.from(token, 'base64').toString('utf8');
  const userId = decoded.split(':')[0];
  console.log('Token decoded:', decoded, 'UserId:', userId);
  return userId;
}

async function listApplications(event) {
  const userId = getUserIdFromToken(event);
  if (!userId) {
    return { 
      statusCode: 401, 
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'Unauthorized' }) 
    };
  }
  
  const applications = await getApplications(userId);
  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    body: JSON.stringify({ applications })
  };
}

async function createApplication(event) {
  try {
    const userId = getUserIdFromToken(event);
    if (!userId) {
      return { 
        statusCode: 401, 
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'Unauthorized' }) 
      };
    }
    
    const applicationData = JSON.parse(event.body);
    applicationData.status = 'Pending';
    const application = await saveApplication(userId, applicationData);
    
    return {
      statusCode: 201,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ success: true, application })
    };
  } catch (error) {
    console.error('createApplication error:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: error.message || 'Failed to create application' })
    };
  }
}

async function updateApplicationStatus(event) {
  const userId = getUserIdFromToken(event);
  if (!userId) {
    return { 
      statusCode: 401, 
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'Unauthorized' }) 
    };
  }
  
  const applicationId = event.pathParameters?.id;
  const { status } = JSON.parse(event.body);
  
  await updateApplication(applicationId, { status });
  
  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    body: JSON.stringify({ success: true, message: 'Application updated' })
  };
}

module.exports = {
  listApplications,
  createApplication,
  updateApplicationStatus
};
