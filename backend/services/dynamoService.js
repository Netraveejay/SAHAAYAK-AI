const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand, GetCommand, QueryCommand, UpdateCommand, DeleteCommand, ScanCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const USERS_TABLE = process.env.USERS_TABLE || 'SahaayakUsers';
const PROFILES_TABLE = process.env.PROFILES_TABLE || 'SahaayakProfiles';
const APPLICATIONS_TABLE = process.env.APPLICATIONS_TABLE || 'SahaayakApplications';
const SCHEMES_TABLE = process.env.SCHEMES_TABLE || 'SahaayakSchemes';

async function createUser(mobile) {
  const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const user = { userId, mobile, createdAt: new Date().toISOString() };
  await docClient.send(new PutCommand({ TableName: USERS_TABLE, Item: user }));
  return user;
}

async function getUserByMobile(mobile) {
  const result = await docClient.send(new ScanCommand({
    TableName: USERS_TABLE,
    FilterExpression: 'mobile = :mobile',
    ExpressionAttributeValues: { ':mobile': mobile }
  }));
  return result.Items?.[0] || null;
}

async function saveProfile(userId, profileData) {
  const profileId = profileData.id || `profile_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const profile = {
    profileId,
    userId,
    ...profileData,
    updatedAt: new Date().toISOString(),
    createdAt: profileData.createdAt || new Date().toISOString()
  };
  await docClient.send(new PutCommand({ TableName: PROFILES_TABLE, Item: profile }));
  return profile;
}

async function getProfiles(userId) {
  const result = await docClient.send(new QueryCommand({
    TableName: PROFILES_TABLE,
    IndexName: 'UserIdIndex',
    KeyConditionExpression: 'userId = :userId',
    ExpressionAttributeValues: { ':userId': userId }
  }));
  return result.Items || [];
}

async function getProfileById(profileId) {
  const result = await docClient.send(new GetCommand({
    TableName: PROFILES_TABLE,
    Key: { profileId }
  }));
  return result.Item || null;
}

async function updateProfile(profileId, updates) {
  const updateExpr = [];
  const attrNames = {};
  const attrValues = {};
  
  Object.keys(updates).forEach((key, idx) => {
    const placeholder = `#attr${idx}`;
    const valuePlaceholder = `:val${idx}`;
    updateExpr.push(`${placeholder} = ${valuePlaceholder}`);
    attrNames[placeholder] = key;
    attrValues[valuePlaceholder] = updates[key];
  });
  
  attrNames['#updatedAt'] = 'updatedAt';
  attrValues[':updatedAt'] = new Date().toISOString();
  updateExpr.push('#updatedAt = :updatedAt');

  await docClient.send(new UpdateCommand({
    TableName: PROFILES_TABLE,
    Key: { profileId },
    UpdateExpression: `SET ${updateExpr.join(', ')}`,
    ExpressionAttributeNames: attrNames,
    ExpressionAttributeValues: attrValues
  }));
}

async function deleteProfile(profileId) {
  await docClient.send(new DeleteCommand({
    TableName: PROFILES_TABLE,
    Key: { profileId }
  }));
}

async function saveApplication(userId, applicationData) {
  const appId = applicationData.id || `app_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const application = {
    applicationId: appId,
    id: appId,
    userId,
    ...applicationData,
    updatedAt: new Date().toISOString(),
    createdAt: applicationData.createdAt || new Date().toISOString()
  };
  await docClient.send(new PutCommand({ TableName: APPLICATIONS_TABLE, Item: application }));
  return application;
}

async function getApplications(userId) {
  const result = await docClient.send(new QueryCommand({
    TableName: APPLICATIONS_TABLE,
    IndexName: 'UserIdIndex',
    KeyConditionExpression: 'userId = :userId',
    ExpressionAttributeValues: { ':userId': userId }
  }));
  return result.Items || [];
}

async function updateApplication(applicationId, updates) {
  const updateExpr = [];
  const attrNames = {};
  const attrValues = {};
  
  Object.keys(updates).forEach((key, idx) => {
    const placeholder = `#attr${idx}`;
    const valuePlaceholder = `:val${idx}`;
    updateExpr.push(`${placeholder} = ${valuePlaceholder}`);
    attrNames[placeholder] = key;
    attrValues[valuePlaceholder] = updates[key];
  });
  
  attrNames['#updatedAt'] = 'updatedAt';
  attrValues[':updatedAt'] = new Date().toISOString();
  updateExpr.push('#updatedAt = :updatedAt');

  await docClient.send(new UpdateCommand({
    TableName: APPLICATIONS_TABLE,
    Key: { applicationId },
    UpdateExpression: `SET ${updateExpr.join(', ')}`,
    ExpressionAttributeNames: attrNames,
    ExpressionAttributeValues: attrValues
  }));
}

async function updateUser(userId, updates) {
  const updateExpr = [];
  const attrNames = {};
  const attrValues = {};
  
  Object.keys(updates).forEach((key, idx) => {
    const placeholder = `#attr${idx}`;
    const valuePlaceholder = `:val${idx}`;
    updateExpr.push(`${placeholder} = ${valuePlaceholder}`);
    attrNames[placeholder] = key;
    attrValues[valuePlaceholder] = updates[key];
  });
  
  attrNames['#updatedAt'] = 'updatedAt';
  attrValues[':updatedAt'] = new Date().toISOString();
  updateExpr.push('#updatedAt = :updatedAt');

  await docClient.send(new UpdateCommand({
    TableName: USERS_TABLE,
    Key: { userId },
    UpdateExpression: `SET ${updateExpr.join(', ')}`,
    ExpressionAttributeNames: attrNames,
    ExpressionAttributeValues: attrValues
  }));
}

async function getAllSchemes() {
  const result = await docClient.send(new ScanCommand({
    TableName: SCHEMES_TABLE
  }));
  return result.Items || [];
}

async function getSchemeById(schemeId) {
  const result = await docClient.send(new GetCommand({
    TableName: SCHEMES_TABLE,
    Key: { schemeId }
  }));
  return result.Item || null;
}

async function saveScheme(schemeData) {
  const scheme = {
    schemeId: schemeData.id || schemeData.schemeId,
    ...schemeData,
    updatedAt: new Date().toISOString(),
    createdAt: schemeData.createdAt || new Date().toISOString()
  };
  await docClient.send(new PutCommand({ TableName: SCHEMES_TABLE, Item: scheme }));
  return scheme;
}

module.exports = {
  createUser,
  getUserByMobile,
  updateUser,
  saveProfile,
  getProfiles,
  getProfileById,
  updateProfile,
  deleteProfile,
  saveApplication,
  getApplications,
  updateApplication,
  getAllSchemes,
  getSchemeById,
  saveScheme
};
