const express = require('express');
const router = express.Router();
const { checkAuth } = require('../middleware/auth');
const axios = require('axios');

const API_BASE = 'http://147.182.155.235/api/v1/admin';


router.get('/', (req, res) => {
  if (req.session.token) return res.redirect('/dashboard');
  const error = req.session.error || null;
  const email = req.session.email || '';
  req.session.error = null; // Clear error after reading
  req.session.email = null; // Clear email after reading
  res.render('login', { error, email, title: 'Login', layout: false });
});


router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const response = await axios.post(`${API_BASE}/login`, { email, password });

    const { token, admin } = response.data.data;
    req.session.token = token;
    req.session.admin = admin;

    res.redirect('/dashboard');
  } catch (err) {
    req.session.error = 'Invalid Credentials';
    req.session.email = req.body.email || '';
    res.redirect('/');
  }
});

router.get('/dashboard', checkAuth, async (req, res) => {
  try {
    const headers = {
      Authorization: `Bearer ${req.session.token}`
    };

    // Fetch dashboard data from single API endpoint
    const response = await axios.get(`${API_BASE}/dashboard`, { headers });

    const data = response.data.data || {};
    console.log("Dashboard Data:", data);
    const totalUsers = data.totalUsers || 0;
    const totalBlocked = data.totalBlockedUsers || 0;
    const totalReported = data.totalReportedUsers || 0; // Assuming typo in API response key
    const subscribeUsers = data.subscribeUsers || 0;

    res.render('dashboard', {
      title: 'Dashboard',
      totalUsers,
      totalBlocked,
      totalReported,
      subscribeUsers
    });

  } catch (err) {
    console.error('Dashboard error:', err.message);
    res.render('dashboard', {
      title: 'Dashboard',
      totalUsers: 0,
      totalBlocked: 0,
      totalReported: 0,
      totalQuestions: 0,
      error: 'Failed to load dashboard data'
    });
  }
});




// Logout Route
router.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/');
  });
});

// Users List Route
router.get('/users', checkAuth, async (req, res) => {
  try {
    const response = await axios.get(`${API_BASE}/users`, {
      headers: {
        Authorization: `Bearer ${req.session.token}`
      },
      params: {
        page: 1,
        limit: 50,
        gender: '',
        minAge: '',
        maxAge: '',
        orientation: '',
        latitude: '',
        longitude: '',
        maxDistance: '',
        search: ''
      }
    });

    // Ensure the response has the 'users' data
    const users = response.data.data.users;

    // Render the users page
    res.render('users', {
      users: users,  // Ensure 'users' is passed as an array
      title: 'User List',
      currentUrl: req.originalUrl,
      token: req.session.token
    });
  } catch (err) {
    res.render('users', {
      error: 'Failed to load users',
      title: 'User List',
      users: []
    });
  }
});

// Reported Users List Route
router.get('/reported-users', checkAuth, async (req, res) => {
  try {
    const response = await axios.get(`${API_BASE}/report/reported-users`, {
      headers: {
        Authorization: `Bearer ${req.session.token}`
      }
    });
    // console.log("Reported Users Response:", response.data);
    const reportedUsers = response.data.data;

    res.render('reported-users', {
      reportedUsers,
      title: 'Reported Users'
    });

  } catch (err) {
    console.error("Error fetching reported users:", err.message);

    res.render('reported-users', {
      reportedUsers: [],
      error: 'Failed to load reported users',
      title: 'Reported Users',
      currentUrl: req.originalUrl
    });
  }
});


// Blocked Users List Route
router.get('/blocked-users', checkAuth, async (req, res) => {
  try {
    const response = await axios.get(`${API_BASE}/block/users`, {
      headers: {
        Authorization: `Bearer ${req.session.token}`
      }
    });

    // Assign response.data.data to blockedUsers
    let blockedUsers = response.data.data;

    // Map each blocked user object to have a 'user' property equal to 'blocked'
    blockedUsers = blockedUsers.map(block => {
      return {
        ...block,
        user: block.blocked
      };
    });

    res.render('blocked-users', {
      blockedUsers,
      title: 'Blocked Users'
    });

  } catch (err) {
    console.error("Error fetching blocked users:", err.message);

    res.render('blocked-users', {
      blockedUsers: [],
      error: 'Failed to load blocked users',
      title: 'Blocked Users',
      currentUrl: req.originalUrl
    });
  }
});

// Content Moderation List Route
router.get('/content-moderation', checkAuth, async (req, res) => {
  try {
    const response = await axios.get(`${API_BASE}/report/content`, {
      headers: {
        Authorization: `Bearer ${req.session.token}`
      }
    });
    const contentModeration = response.data?.message?.data || [];
   
    console.log("Content Moderation Data:", contentModeration);
    

    res.render('content-moderation', {
      contentModeration,
      title: 'Content Moderation',
      token: req.session.token 
    });

  } catch (err) {
    console.error("Error fetching content moderation:", err.message);

    res.render('content-moderation', {
      contentModeration: [],
      error: 'Failed to load content moderation',
      title: 'Content Moderation',
      currentUrl: req.originalUrl
    });
  }
});


router.post('/users/block-toggle', checkAuth, async (req, res) => {
  try {
    const { userId, block } = req.body;

    const response = await axios.post(`${API_BASE}/users/block/${userId}`, {
      block
    }, {
      headers: {
        Authorization: `Bearer ${req.session.token}`,
        'Content-Type': 'application/json'
      }
    });

    res.json(response.data);
  } catch (err) {
    console.error('Error toggling block status:', err.message);
    res.status(500).json({ status: 0, message: 'Failed to toggle block status' });
  }
});

router.get('/revenue', checkAuth, (req, res) => {
  res.render('revenue', { title: 'Revenue' });
});

// router.get('/notifications', checkAuth, (req, res) => {
//   res.render('notifications', { title: 'Notifications' });
// });

// Reported Users List Route
router.get('/notifications', checkAuth, async (req, res) => {
  try {
    const response = await axios.get(`${API_BASE}/notification`, {
      headers: {
        Authorization: `Bearer ${req.session.token}`
      }
    });
    // console.log("Reported Users Response:", response.data);
    const notifications = response.data.data;
    console.log("Notifications Data:", notifications);
    res.render('notifications', {
      notifications,
      title: 'Notifications'
    });

  } catch (err) {
    console.error("Error fetching reported users:", err.message);

    res.render('notifications', {
      notifications: [],
      error: 'Failed to load notifications',
      title: 'Notifications',
      currentUrl: req.originalUrl
    });
  }
});

// Route to render edit user form
router.get('/users/edit/:id', checkAuth, async (req, res) => {
  const userId = req.params.id;
  try {
    const response = await axios.get(`${API_BASE}/get-user`, {
      headers: {
        Authorization: `Bearer ${req.session.token}`
      },
      params: {
        userId: userId  // API expects userId as query param
      }
    });

    const user = response.data.data;
    res.render('users-edit', {
      user: user,
      title: 'Edit User'
    });
  } catch (err) {
    console.error('Error fetching user for edit:', err.message);
    req.session.error = 'User details load nahi ho paye';
    res.redirect('/users');
  }
});

router.post('/users/edit/:id', checkAuth, async (req, res) => {
  const userId = req.params.id;
  const { name, email, gender, age, orientation, is_profile_completed,address,mobile } = req.body;

  console.log('Edit user request body:', req.body);
  try {
    await axios.put(`${API_BASE}/update-user`, {
      name,
      email,
      gender,
      age: age ? parseInt(age) : null,
      orientation,
      is_profile_completed: is_profile_completed === 'true',
      address,
      mobile
    }, {
      headers: {
        Authorization: `Bearer ${req.session.token}`
      },
      params: {
        userId: userId
      }
    });
    req.session.success = 'User successfully updated';
    res.redirect('/users');
  } catch (err) {
    req.session.formData = req.body; // Save form data to repopulate
    res.redirect(`/users/edit/${userId}`);
  }
});

// Subscription List Route
router.get('/subscriptions', checkAuth, async (req, res) => {
  try {
    const response = await axios.get(`${API_BASE}/subscription`, {
      headers: {
        Authorization: `Bearer ${req.session.token}`
      }
    });

    const subscriptions = response.data.data || [];

    res.render('subscriptions', {
      subscriptions,
      title: 'Subscription List',
      currentUrl: req.originalUrl
    });
  } catch (err) {
    console.error("Error fetching subscriptions:", err.message);
    res.render('subscriptions', {
      subscriptions: [],
      error: 'Failed to load subscriptions',
      title: 'Subscription List',
      currentUrl: req.originalUrl
    });
  }
});

// Block/Unblock user route
router.put('/users/block-toggle/:userId', checkAuth, async (req, res) => {
  try {
    const { userId } = req.params;
    const { block } = req.body;

    const response = await axios.put(
      `${API_BASE}/users/block/${userId}`, 
      { block },
      {
        headers: {
          Authorization: `Bearer ${req.session.token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    res.json(response.data);
  } catch (err) {
    console.error('Block toggle error:', err.response?.data || err.message);
    res.status(500).json({ 
      status: 0, 
      message: err.response?.data?.message || 'Failed to toggle block status' 
    });
  }
});


// Content Moderation Update Route (Approve/Reject)
router.put('/content-moderation/update', checkAuth, async (req, res) => {
  try {
    const { id, user_id, action } = req.body;
    
    const response = await axios.put(
      `${API_BASE}/approve_reject_update`,
      {
        id: id,
        user_id: user_id
      },
      {
        headers: {
          Authorization: `Bearer ${req.session.token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    res.json(response.data);
  } catch (err) {
    console.error('Error updating moderation status:', err.message);
    res.status(500).json({
      status: 0,
      message: err.response?.data?.message || 'Failed to update moderation status'
    });
  }
});
module.exports = router;
