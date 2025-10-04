const User = require('../models/User');
const Notification = require('../models/Notification');

/**
 * Notify all admin users in-app (notification bar) about a new alumni registration pending approval.
 * @param {Object} newUser - The new user object (pending approval)
 */
async function notifyAdminsOfPendingAlumni(newUser) {
  // Find all active admins
  const admins = await User.find({ role: 'admin', isActive: true });
  if (!admins.length) return;

  const notifications = admins.map(admin => ({
    recipient: admin._id,
    type: 'info',
    title: 'New Alumni Awaiting Approval',
    message: `${newUser.name} has registered and is awaiting your approval.`,
    actionUrl: `/admin-dashboard?tab=users`,
  }));

  await Notification.insertMany(notifications);
}

module.exports = { notifyAdminsOfPendingAlumni };
