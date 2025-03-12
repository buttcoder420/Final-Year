const { HashPassword, ComparePassword } = require("../Helper/UserHelper");
const JWT = require("jsonwebtoken");
const UserModel = require("../Model/UserModel");
require("dotenv").config();
const nodemailer = require("nodemailer");
const crypto = require("crypto");

function generateVerificationCode() {
  return crypto.randomBytes(4).toString("hex").toUpperCase(); // Random 4-byte code
}

const sendVerificationEmail = async (email, verificationCode) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Your Verification Code",
    html: `<p>Your verification code is: <strong>${verificationCode}</strong></p>
             <p>Enter this code in the app to verify your email.</p>`,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log("Verification email sent!");
  } catch (error) {
    console.log("Error sending email:", error);
  }
};

// Register user with email verification
const registerUser = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      userName,
      email,
      phoneNumber,
      whatsappNumber,
      address,
      city,
      userField,
      password,
      sellerDetails,
    } = req.body;

    // Validation
    if (
      !firstName ||
      !lastName ||
      !userName ||
      !email ||
      !phoneNumber ||
      !address ||
      !city ||
      !userField ||
      !password
    ) {
      return res.status(400).send({
        success: false,
        message: "All fields are required",
      });
    }

    // Check if user already exists
    const existingUser = await UserModel.findOne({
      $or: [{ email }, { userName }, { phoneNumber }],
    });
    if (existingUser) {
      return res
        .status(400)
        .json({ message: "Email, Username or phone number already exist." });
    }

    // Generate 6-digit verification code
    const verificationCode = Math.floor(
      100000 + Math.random() * 900000
    ).toString();

    // Password Hashing
    const hashedPassword = await HashPassword(password, 10);

    // Seller fields check
    let newUser;
    if (userField === "seller") {
      if (
        !sellerDetails ||
        !sellerDetails.shopLocation ||
        !sellerDetails.deliveryRange ||
        !sellerDetails.dairySource
      ) {
        return res.status(400).json({ message: "All fields are required" });
      }
      newUser = new UserModel({
        firstName,
        lastName,
        userName,
        email,
        phoneNumber,
        whatsappNumber,
        address,
        city,
        userField,
        password: hashedPassword,
        sellerDetails,
        verificationCode: verificationCode,
        isVerified: false,
      });
    } else {
      newUser = new UserModel({
        firstName,
        lastName,
        userName,
        email,
        phoneNumber,
        whatsappNumber,
        address,
        city,
        userField,
        verificationCode: verificationCode,
        isVerified: false,
      });
    }

    // Save user to the database
    await newUser.save();

    // Send verification email
    await sendVerificationEmail(email, verificationCode);

    res.status(201).json({
      message: "User registered! Check your email for the verification code..",
      user: newUser,
    });
  } catch (error) {
    console.error("Error in user registration:", error);
    res.status(500).json({ message: "Server error. Please try again later." });
  }
};

// Verify user after receiving code from email
const verifyEmail = async (req, res) => {
  const { email, code } = req.body; // Token ki jagah code aur email lenge

  try {
    // Find user by email and check if code matches
    const user = await UserModel.findOne({ email, verificationCode: code });

    if (!user) {
      return res
        .status(400)
        .json({ message: "Invalid verification code or email." });
    }

    // Mark the user as verified
    user.isVerified = true;
    user.verificationCode = undefined; // Code remove kar do takay dubara use na ho
    await user.save();

    res
      .status(200)
      .json({ message: "Email successfully verified! You can now log in." });
  } catch (error) {
    console.error("Error in email verification:", error);
    res.status(500).json({ message: "Server error. Please try again later." });
  }
};

// Login user after email verification
const loginUser = async (req, res) => {
  try {
    const { identifier, password } = req.body;

    // Validation
    if (!identifier || !password) {
      return res
        .status(400)
        .json({ success: false, message: "All fields are required" });
    }

    // User find karna using email, username, ya phoneNumber
    const user = await UserModel.findOne({
      $or: [
        { email: identifier },
        { userName: identifier },
        { phoneNumber: identifier },
      ],
    });

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "Invalid credentials" });
    }

    // Check if the user is verified
    if (!user.isVerified) {
      return res.status(401).json({
        success: false,
        message: "Please verify your email before logging in.",
      });
    }

    // Password match karna
    const match = await ComparePassword(password, user.password);
    if (!match) {
      return res.status(401).send({
        success: false,
        message: "Invalid password",
      });
    }

    // Create token
    const token = JWT.sign({ _id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.status(200).json({
      success: true,
      message: "Login successful",
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        userName: user.userName,
        email: user.email,
        phoneNumber: user.phoneNumber,
        city: user.city,
        role: user.role,
      },
      token,
    });
  } catch (error) {
    console.error("Error in user login:", error);
    res.status(500).json({
      success: false,
      message: "Server error. Please try again later.",
    });
  }
};

module.exports = { registerUser, loginUser, verifyEmail };
