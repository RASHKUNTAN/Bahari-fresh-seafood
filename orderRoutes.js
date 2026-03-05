const express = require('express');
const router = express.Router();
const { 
  placeOrder, 
  getUserOrders, 
  getAllOrders, 
  updateOrderStatus 
} = require('../controllers/orderController');

// Place a new order
router.post('/', placeOrder);

// Get orders for a specific user
router.get('/user/:userId', getUserOrders);

// Admin: get all orders
router.get('/', getAllOrders);

// Update order status
router.put('/:id/status', updateOrderStatus);

module.exports = router;

