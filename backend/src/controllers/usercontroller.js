import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { User } from "../models/user.models.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { sendPasswordResetEmail } from "../service/emailService.js";

const sanitizeUser = (userDoc) => {
  if (!userDoc) return null;

  const userObject = typeof userDoc.toObject === "function" ? userDoc.toObject() : { ...userDoc };
  delete userObject.password;
  delete userObject.refreshToken;

  return userObject;
};

const signAccessToken = (user) =>
  jwt.sign(
    {
      sub: user._id.toString(),
      email: user.email,
      username: user.username,
    },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: process.env.ACCESS_TOKEN_EXPIRY || "15m" }
  );

const signRefreshToken = (user) =>
  jwt.sign(
    { sub: user._id.toString() },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: process.env.REFRESH_TOKEN_EXPIRY || "30d" }
  );

const storeRefreshToken = async (user, refreshToken) => {
  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });
};

export const registerUser = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const normalizedEmail = email.trim().toLowerCase();
    // Auto-generate username from email if not provided
    const normalizedUsername = username 
      ? username.trim().toLowerCase() 
      : normalizedEmail.split('@')[0];

    const existingUser = await User.findOne({
      $or: [{ username: normalizedUsername }, { email: normalizedEmail }],
    });

    if (existingUser) {
      return res.status(409).json({ message: "User already exists with that email or username" });
    }

    let avatarUrl = "";
    const avatarPath = req.file?.path || req.files?.avatar?.[0]?.path;

    if (avatarPath) {
      const uploadResult = await uploadOnCloudinary(avatarPath);

      if (!uploadResult || (!uploadResult.url && !uploadResult.secure_url)) {
        return res.status(500).json({ message: "Failed to upload avatar" });
      }

      avatarUrl = uploadResult.secure_url || uploadResult.url || "";
    }

    const user = await User.create({
      username: normalizedUsername,
      email: normalizedEmail,
      password,
      avatar: avatarUrl,
    });

    const accessToken = signAccessToken(user);
    const refreshToken = signRefreshToken(user);
    await storeRefreshToken(user, refreshToken);

    // Set cookies for tokens
    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 15 * 60 * 1000, // 15 minutes
    });

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    });

    return res.status(201).json({
      message: "User registered successfully",
      data: {
        user: sanitizeUser(user),
      },
    });
  } catch (error) {
    console.error("registerUser error", error);
    return res.status(500).json({ message: "Unable to register user", error: error.message });
  }
};

export const loginUser = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!password || (!username && !email)) {
      return res.status(400).json({ message: "Username/email and password are required" });
    }

    const lookup = [];
    if (username) lookup.push({ username: username.trim().toLowerCase() });
    if (email) lookup.push({ email: email.trim().toLowerCase() });

    const user = await User.findOne({ $or: lookup }).select("+password +refreshToken");

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const accessToken = signAccessToken(user);
    const refreshToken = signRefreshToken(user);
    await storeRefreshToken(user, refreshToken);

    // Set cookies for tokens
    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 15 * 60 * 1000, // 15 minutes
    });

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    });

    return res.status(200).json({
      message: "Login successful",
      data: {
        user: sanitizeUser(user),
      },
    });
  } catch (error) {
    console.error("loginUser error", error);
    return res.status(500).json({ message: "Unable to login", error: error.message });
  }
};

export const getCurrentUser = async (req, res) => {
  try {
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({
      message: "User retrieved successfully",
      data: {
        user: sanitizeUser(user),
      },
    });
  } catch (error) {
    console.error("getCurrentUser error", error);
    return res.status(500).json({ message: "Unable to get user", error: error.message });
  }
};

export const logoutUser = async (req, res) => {
  try {
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const user = await User.findById(userId);

    if (user) {
      user.refreshToken = null;
      await user.save({ validateBeforeSave: false });
    }

    // Clear cookies
    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");

    return res.status(200).json({
      message: "Logout successful",
    });
  } catch (error) {
    console.error("logoutUser error", error);
    return res.status(500).json({ message: "Unable to logout", error: error.message });
  }
};

export const updateAvatar = async (req, res) => {
  try {
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const avatarPath = req.file?.path || req.files?.avatar?.[0]?.path;

    if (!avatarPath) {
      return res.status(400).json({ message: "Avatar file is required" });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const uploadResult = await uploadOnCloudinary(avatarPath);

    if (!uploadResult || (!uploadResult.url && !uploadResult.secure_url)) {
      return res.status(500).json({ message: "Failed to upload avatar" });
    }

    user.avatar = uploadResult.secure_url || uploadResult.url || "";
    await user.save({ validateBeforeSave: false });

    return res.status(200).json({
      message: "Avatar updated successfully",
      user: sanitizeUser(user),
    });
  } catch (error) {
    console.error("updateAvatar error", error);
    return res.status(500).json({ message: "Unable to update avatar", error: error.message });
  }
};

// Forgot Password Handler
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const normalizedEmail = email.trim().toLowerCase();
    
    // Find user by email
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      // For security, don't reveal if email exists or not
      return res.status(200).json({
        message: "If an account with this email exists, a password reset link has been sent",
      });
    }

    // Generate a temporary password
    const temporaryPassword = Math.random().toString(36).slice(-12);

    // Hash and update the password in database
    const hashedPassword = await bcrypt.hash(temporaryPassword, 10);
    user.password = hashedPassword;
    await user.save({ validateBeforeSave: false });

    // Send password reset email with temporary password
    try {
      await sendPasswordResetEmail(user.email, user.username, temporaryPassword);
    } catch (emailError) {
      console.error("Failed to send email:", emailError);
      return res.status(500).json({
        message: "Password reset failed. Could not send email. Please try again later.",
        error: emailError.message,
      });
    }

    return res.status(200).json({
      message: "Password reset email sent successfully",
      info: "Check your email for your temporary password",
    });
  } catch (error) {
    console.error("forgotPassword error", error);
    return res.status(500).json({
      message: "Unable to process password reset",
      error: error.message,
    });
  }
};
