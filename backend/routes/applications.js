const express = require('express');
const router = express.Router();
const { listApplications, createApplication, updateApplicationStatus } = require('../handlers/applicationHandler');

// List all applications for the logged-in user
router.get('/', async (req, res) => {
  const result = await listApplications({ headers: req.headers });
  res.status(result.statusCode).set(result.headers).send(result.body);
});

// Create a new application
router.post('/', async (req, res) => {
  const result = await createApplication({ headers: req.headers, body: JSON.stringify(req.body) });
  res.status(result.statusCode).set(result.headers).send(result.body);
});

// Update application status
router.patch('/:id', async (req, res) => {
  const result = await updateApplicationStatus({ 
    headers: req.headers, 
    body: JSON.stringify(req.body),
    pathParameters: { id: req.params.id }
  });
  res.status(result.statusCode).set(result.headers).send(result.body);
});

module.exports = router;
