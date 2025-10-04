const express = require("express")
const Donation = require("../models/Donation")
const User = require("../models/User")
const { auth } = require("../middleware/auth")

const router = express.Router()

// @route   GET /api/donations/stats
// @desc    Get donation statistics
// @access  Private
router.get("/stats", auth, async (req, res) => {
  try {
    // Get total donations
    const totalDonationsResult = await Donation.aggregate([
      { $match: { status: "completed" } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ])
    const totalRaised = totalDonationsResult[0]?.total || 0

    // Get total number of donors
    const totalDonors = await Donation.distinct("donor", { status: "completed" }).then((donors) => donors.length)

    // Get recent donations (last 10)
    const recentDonations = await Donation.find({ status: "completed" })
      .populate("donor", "name")
      .sort({ createdAt: -1 })
      .limit(10)
      .lean()

    // Format recent donations
    const formattedRecentDonations = recentDonations.map((donation) => ({
      donor: donation.anonymous ? "Anonymous" : donation.donor.name,
      amount: donation.amount,
      message: donation.message,
      date: donation.createdAt,
      anonymous: donation.anonymous,
    }))

    res.json({
      totalRaised,
      totalDonors,
      recentDonations: formattedRecentDonations,
    })
  } catch (error) {
    console.error("Get donation stats error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// @route   POST /api/donations
// @desc    Create a new donation
// @access  Private
router.post("/", auth, async (req, res) => {
  try {
    const { amount, message, anonymous } = req.body

    if (!amount || amount < 1) {
      return res.status(400).json({ message: "Donation amount must be at least $1" })
    }

    // Generate a unique transaction ID (in real app, this would come from payment processor)
    const transactionId = `txn_${Date.now()}_${req.user.id}`

    const donation = await Donation.create({
      donor: req.user.id,
      amount: Number.parseFloat(amount),
      message: message || "",
      anonymous: anonymous || false,
      transactionId,
      status: "completed", // In real app, this would be "pending" until payment is processed
      processedAt: new Date(),
    })

    res.status(201).json({
      message: "Donation processed successfully",
      donation: {
        id: donation._id,
        amount: donation.amount,
        message: donation.message,
        anonymous: donation.anonymous,
        status: donation.status,
      },
    })
  } catch (error) {
    console.error("Create donation error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// @route   GET /api/donations/my-donations
// @desc    Get user's donation history
// @access  Private
router.get("/my-donations", auth, async (req, res) => {
  try {
    const donations = await Donation.find({ donor: req.user.id }).sort({ createdAt: -1 })

    res.json(donations)
  } catch (error) {
    console.error("Get user donations error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

module.exports = router
