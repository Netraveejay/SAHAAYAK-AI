const { saveProfile, getProfiles, getProfileById, updateProfile, deleteProfile } = require('../services/dynamoService');

function getUserIdFromToken(event) {
  const auth = event.headers?.Authorization || event.headers?.authorization;
  if (!auth) return null;
  const token = auth.replace('Bearer ', '');
  const decoded = Buffer.from(token, 'base64').toString();
  return decoded.split(':')[0];
}

async function listProfiles(event) {
  const userId = getUserIdFromToken(event);
  if (!userId) {
    return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) };
  }
  
  const profiles = await getProfiles(userId);
  return {
    statusCode: 200,
    body: JSON.stringify({ profiles })
  };
}

async function createProfile(event) {
  const userId = getUserIdFromToken(event);
  if (!userId) {
    return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) };
  }
  
  const profileData = JSON.parse(event.body);
  const profile = await saveProfile(userId, profileData);
  
  return {
    statusCode: 201,
    body: JSON.stringify({ profile })
  };
}

async function updateProfileHandler(event) {
  const userId = getUserIdFromToken(event);
  if (!userId) {
    return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) };
  }
  
  const profileId = event.pathParameters?.id;
  const updates = JSON.parse(event.body);
  
  await updateProfile(profileId, updates);
  const profile = await getProfileById(profileId);
  
  return {
    statusCode: 200,
    body: JSON.stringify({ profile })
  };
}

async function deleteProfileHandler(event) {
  const userId = getUserIdFromToken(event);
  if (!userId) {
    return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) };
  }
  
  const profileId = event.pathParameters?.id;
  await deleteProfile(profileId);
  
  return {
    statusCode: 200,
    body: JSON.stringify({ message: 'Profile deleted' })
  };
}

module.exports = {
  listProfiles,
  createProfile,
  updateProfileHandler,
  deleteProfileHandler
};
