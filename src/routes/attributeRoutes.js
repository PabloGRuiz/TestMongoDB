const express = require('express');
const router = express.Router();
const { getAttributes } = require('../controllers/attributeController');
const { authMiddleware } = require('../middlewares/authMiddleware');

/**
 * @openapi
 * /api/attributes:
 *   get:
 *     summary: Retrieve the global dictionary of active employee attributes
 *     description: Fetches a unique list of all keys and sample values of dynamic attributes already configured in the system. Used for UI autocompletion.
 *     tags:
 *       - Attributes
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of dynamic attributes retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   _id:
 *                     type: string
 *                     example: 60d21b4667d0d8992e610c85
 *                   key:
 *                     type: string
 *                     example: obraSocial
 *                   values:
 *                     type: array
 *                     items:
 *                       type: string
 *                     example: ["OSDE", "Swiss Medical", "Galeno"]
 *       401:
 *         description: Unauthorized - Valid JWT Bearer token is missing or expired
 */
router.get('/', authMiddleware, getAttributes);

module.exports = router;
