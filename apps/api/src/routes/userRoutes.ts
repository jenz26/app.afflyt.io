import { Router } from 'express';
import { Models } from '../models';
import { UserController } from '../controllers/userController';
import { DashboardController } from '../controllers/dashboardController';
import { AnalyticsController } from '../controllers/analyticsController';
import { ConversionController } from '../controllers/conversionController';
import { authenticateJWT } from '../middleware/auth';

export const createUserRoutes = (models: Models): Router => {
  const router = Router();
  const userController = new UserController(models);
  const dashboardController = new DashboardController(models);
  const analyticsController = new AnalyticsController(models);
  const conversionController = new ConversionController(models);

  // Applica autenticazione JWT a tutte le routes user
  router.use(authenticateJWT(models));

  // ===== USER PROFILE MANAGEMENT =====
  router.get('/me', userController.getProfile);
  router.put('/me', userController.updateProfile);

  // ===== API KEYS MANAGEMENT =====
  router.post('/keys', userController.createApiKey);
  router.get('/keys', userController.getApiKeys);
  router.patch('/keys/:keyId', userController.updateApiKey);
  router.delete('/keys/:keyId', userController.deleteApiKey);

  // ===== ✨ NEW v1.8.x: AMAZON TAGS MANAGEMENT =====
  /**
   * @swagger
   * components:
   *   schemas:
   *     AmazonTag:
   *       type: object
   *       properties:
   *         id:
   *           type: string
   *           description: Unique identifier for the Amazon tag
   *         tag:
   *           type: string
   *           description: Amazon Associate Tag (3-20 chars, alphanumeric and hyphens)
   *         marketplace:
   *           type: string
   *           enum: [com, it, de, fr, es, co.uk, ca, com.au, co.jp]
   *           description: Amazon marketplace
   *         name:
   *           type: string
   *           description: User-friendly name for the tag
   *         isDefault:
   *           type: boolean
   *           description: Whether this is the default tag for this marketplace
   *         isActive:
   *           type: boolean
   *           description: Whether the tag is active
   *         createdAt:
   *           type: string
   *           format: date-time
   *         lastUsedAt:
   *           type: string
   *           format: date-time
   *         linksCreated:
   *           type: number
   *           description: Number of links created with this tag
   *         totalClicks:
   *           type: number
   *           description: Total clicks for links with this tag
   *         totalRevenue:
   *           type: number
   *           description: Total revenue for links with this tag
   * 
   * /api/user/amazon-tags:
   *   post:
   *     summary: Create a new Amazon Associate Tag
   *     tags: [Amazon Tags]
   *     security:
   *       - BearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - tag
   *               - marketplace
   *               - name
   *             properties:
   *               tag:
   *                 type: string
   *                 pattern: '^[a-zA-Z0-9\-]{3,20}$'
   *               marketplace:
   *                 type: string
   *                 enum: [com, it, de, fr, es, co.uk, ca, com.au, co.jp]
   *               name:
   *                 type: string
   *                 maxLength: 100
   *               isDefault:
   *                 type: boolean
   *                 default: false
   *     responses:
   *       201:
   *         description: Amazon tag created successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 data:
   *                   type: object
   *                   properties:
   *                     amazonTag:
   *                       $ref: '#/components/schemas/AmazonTag'
   *                 message:
   *                   type: string
   *                 timestamp:
   *                   type: string
   *       400:
   *         description: Validation error or duplicate tag
   *   get:
   *     summary: Get all Amazon Associate Tags for the user
   *     tags: [Amazon Tags]
   *     security:
   *       - BearerAuth: []
   *     responses:
   *       200:
   *         description: List of Amazon tags
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 data:
   *                   type: object
   *                   properties:
   *                     amazonTags:
   *                       type: array
   *                       items:
   *                         $ref: '#/components/schemas/AmazonTag'
   *                 timestamp:
   *                   type: string
   */
  router.post('/amazon-tags', userController.createAmazonTag);
  router.get('/amazon-tags', userController.getAmazonTags);

  /**
   * @swagger
   * /api/user/amazon-tags/{tagId}:
   *   get:
   *     summary: Get Amazon Associate Tag by ID
   *     tags: [Amazon Tags]
   *     security:
   *       - BearerAuth: []
   *     parameters:
   *       - in: path
   *         name: tagId
   *         required: true
   *         schema:
   *           type: string
   *         description: Amazon tag ID
   *     responses:
   *       200:
   *         description: Amazon tag details
   *       404:
   *         description: Amazon tag not found
   *   patch:
   *     summary: Update Amazon Associate Tag
   *     tags: [Amazon Tags]
   *     security:
   *       - BearerAuth: []
   *     parameters:
   *       - in: path
   *         name: tagId
   *         required: true
   *         schema:
   *           type: string
   *     requestBody:
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               tag:
   *                 type: string
   *                 pattern: '^[a-zA-Z0-9\-]{3,20}$'
   *               name:
   *                 type: string
   *                 maxLength: 100
   *               isDefault:
   *                 type: boolean
   *               isActive:
   *                 type: boolean
   *     responses:
   *       200:
   *         description: Amazon tag updated successfully
   *       404:
   *         description: Amazon tag not found
   *   delete:
   *     summary: Delete Amazon Associate Tag
   *     tags: [Amazon Tags]
   *     security:
   *       - BearerAuth: []
   *     parameters:
   *       - in: path
   *         name: tagId
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Amazon tag deleted successfully
   *       404:
   *         description: Amazon tag not found
   */
  router.get('/amazon-tags/:tagId', userController.getAmazonTagById);
  router.patch('/amazon-tags/:tagId', userController.updateAmazonTag);
  router.delete('/amazon-tags/:tagId', userController.deleteAmazonTag);

  // ===== ✨ NEW v1.8.x: CHANNELS MANAGEMENT =====
  /**
   * @swagger
   * components:
   *   schemas:
   *     Channel:
   *       type: object
   *       properties:
   *         id:
   *           type: string
   *           description: Unique identifier for the channel
   *         name:
   *           type: string
   *           description: Channel name
   *         type:
   *           type: string
   *           enum: [website, blog, youtube, instagram, telegram, discord, other]
   *           description: Channel type
   *         url:
   *           type: string
   *           format: uri
   *           description: Channel URL (optional)
   *         description:
   *           type: string
   *           description: Channel description (optional)
   *         isDefault:
   *           type: boolean
   *           description: Whether this is the default channel
   *         isActive:
   *           type: boolean
   *           description: Whether the channel is active
   *         createdAt:
   *           type: string
   *           format: date-time
   *         lastUsedAt:
   *           type: string
   *           format: date-time
   *         linksCreated:
   *           type: number
   *           description: Number of links created for this channel
   *         totalClicks:
   *           type: number
   *           description: Total clicks for links from this channel
   *         totalRevenue:
   *           type: number
   *           description: Total revenue for links from this channel
   *         defaultAmazonTagId:
   *           type: string
   *           description: Default Amazon tag ID for this channel
   * 
   * /api/user/channels:
   *   post:
   *     summary: Create a new channel
   *     tags: [Channels]
   *     security:
   *       - BearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - name
   *               - type
   *             properties:
   *               name:
   *                 type: string
   *                 maxLength: 100
   *               type:
   *                 type: string
   *                 enum: [website, blog, youtube, instagram, telegram, discord, other]
   *               url:
   *                 type: string
   *                 format: uri
   *               description:
   *                 type: string
   *                 maxLength: 500
   *               isDefault:
   *                 type: boolean
   *                 default: false
   *               defaultAmazonTagId:
   *                 type: string
   *     responses:
   *       201:
   *         description: Channel created successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 data:
   *                   type: object
   *                   properties:
   *                     channel:
   *                       $ref: '#/components/schemas/Channel'
   *                 message:
   *                   type: string
   *                 timestamp:
   *                   type: string
   *       400:
   *         description: Validation error or duplicate channel name
   *   get:
   *     summary: Get all channels for the user
   *     tags: [Channels]
   *     security:
   *       - BearerAuth: []
   *     responses:
   *       200:
   *         description: List of channels
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 data:
   *                   type: object
   *                   properties:
   *                     channels:
   *                       type: array
   *                       items:
   *                         $ref: '#/components/schemas/Channel'
   *                 timestamp:
   *                   type: string
   */
  router.post('/channels', userController.createChannel);
  router.get('/channels', userController.getChannels);

  /**
   * @swagger
   * /api/user/channels/{channelId}:
   *   get:
   *     summary: Get channel by ID
   *     tags: [Channels]
   *     security:
   *       - BearerAuth: []
   *     parameters:
   *       - in: path
   *         name: channelId
   *         required: true
   *         schema:
   *           type: string
   *         description: Channel ID
   *     responses:
   *       200:
   *         description: Channel details
   *       404:
   *         description: Channel not found
   *   patch:
   *     summary: Update channel
   *     tags: [Channels]
   *     security:
   *       - BearerAuth: []
   *     parameters:
   *       - in: path
   *         name: channelId
   *         required: true
   *         schema:
   *           type: string
   *     requestBody:
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               name:
   *                 type: string
   *                 maxLength: 100
   *               type:
   *                 type: string
   *                 enum: [website, blog, youtube, instagram, telegram, discord, other]
   *               url:
   *                 type: string
   *                 format: uri
   *               description:
   *                 type: string
   *                 maxLength: 500
   *               isDefault:
   *                 type: boolean
   *               isActive:
   *                 type: boolean
   *               defaultAmazonTagId:
   *                 type: string
   *     responses:
   *       200:
   *         description: Channel updated successfully
   *       404:
   *         description: Channel not found
   *   delete:
   *     summary: Delete channel
   *     tags: [Channels]
   *     security:
   *       - BearerAuth: []
   *     parameters:
   *       - in: path
   *         name: channelId
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Channel deleted successfully
   *       404:
   *         description: Channel not found
   */
  router.get('/channels/:channelId', userController.getChannelById);
  router.patch('/channels/:channelId', userController.updateChannel);
  router.delete('/channels/:channelId', userController.deleteChannel);

  // ===== DASHBOARD LAYOUT MANAGEMENT =====
  router.get('/dashboard-layout', dashboardController.getDashboardLayout);
  router.put('/dashboard-layout', dashboardController.updateDashboardLayout);

  // ===== ANALYTICS ENDPOINTS =====
  router.get('/analytics/summary', analyticsController.getSummary);
  router.get('/analytics/clicks-trend', analyticsController.getClicksTrend);
  router.get('/analytics/revenue-trend', analyticsController.getRevenueTrend);
  router.get('/analytics/distribution/geo', analyticsController.getGeoDistribution);
  router.get('/analytics/distribution/device', analyticsController.getDeviceDistribution);
  router.get('/analytics/distribution/browser', analyticsController.getBrowserDistribution);
  router.get('/analytics/distribution/referer', analyticsController.getRefererDistribution);
  router.get('/analytics/distribution/subid', analyticsController.getSubIdDistribution);
  router.get('/analytics/top-performing-links', analyticsController.getTopPerformingLinks);
  router.get('/analytics/hourly-heatmap', analyticsController.getHourlyHeatmap);

  // ===== USER LINKS MANAGEMENT =====
  // Note: These endpoints maintain backward compatibility while we transition
  router.get('/links', async (req, res) => {
    // Redirect to existing linkController for now, we'll update this
    // This maintains backward compatibility while we transition
    const linkController = require('../controllers/linkController').LinkController;
    const controller = new linkController(models);
    return controller.getLinks(req, res);
  });

  router.get('/links/:hash', async (req, res) => {
    const linkController = require('../controllers/linkController').LinkController;
    const controller = new linkController(models);
    return controller.getLinkByHash(req, res);
  });

  // ===== CONVERSIONS MANAGEMENT =====
  router.get('/conversions', conversionController.getUserConversions);
  router.get('/conversions/stats', conversionController.getConversionStats);
  router.patch('/conversions/:conversionId', conversionController.updateConversionStatus);

  return router;
};