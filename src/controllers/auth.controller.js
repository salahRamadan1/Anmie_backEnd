import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import User from "../models/User.js";
import AppError from "../utils/AppError.js";
import { catchAsyncError } from "../utils/catchAsync.js";
import { OAuth2Client } from "google-auth-library";
const signToken = (user) => {
    return jwt.sign(
        { id: user._id, role: user.role },
        process.env.JWT_KEY,
        { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
    );
};
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
export const googleLogIn = catchAsyncError(async (req, res, next) => {
    const { credential } = req.body;
    if (!credential) return next(new AppError(req.t.auth.google.missingIdToken, 400));

    let payload;
    try {
        const ticket = await googleClient.verifyIdToken({
            idToken: credential,
            audience: process.env.GOOGLE_CLIENT_ID,
        });
        payload = ticket.getPayload();
    } catch {
        return next(new AppError(req.t.auth.google.invalidToken, 401));
    }

    const { email, email_verified, name, picture, sub } = payload || {};
    if (!email || !email_verified) return next(new AppError(req.t.auth.google.invalidAccount, 401));

    let user = await User.findOne({ email });

    if (user && user.isActive === false) {
        return next(new AppError(req.t.auth.google.accountDisabled, 403));
    }

    let isNew = false;

    if (!user) {
        isNew = true;
        user = await User.create({
            name: name || "User",
            email,
            provider: "google",
            googleSub: sub,
            avatar: { url: picture },
        });
    } else {
        // ✅ حماية: لو googleSub موجود ومختلف
        if (user.googleSub && user.googleSub !== sub) {
            return next(new AppError(req.t.auth.google.accountMismatch, 409));
        }

        const updates = {
            lastLogin: new Date(),
        };

        if (!user.googleSub) updates.googleSub = sub;
        if (!user.avatar?.url && picture) updates["avatar.url"] = picture;

        await User.updateOne({ _id: user._id }, { $set: updates });
        user = await User.findById(user._id); // ✅ re-fetch
    }

    // لو مستخدم جديد: حط lastLogin هنا
    if (isNew) {
        await User.updateOne({ _id: user._id }, { $set: { lastLogin: new Date() } });
    }

    const token = signToken(user);

    res.status(isNew ? 201 : 200).json({
        success: true,
        message: isNew ? req.t.auth.google.registered : req.t.auth.google.loggedIn,
        token,
        user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            avatar: user.avatar,
        },
        ...(isNew && { phone: false }),
    });
});

// ✅ Register
export const register = catchAsyncError(async (req, res, next) => {
    const { name, email, password, phone } = req.body;

    const exists = await User.findOne({ email });
    if (exists) return next(new AppError(req.t.auth.register.emailInUse, 409));

    const user = await User.create({ name, email, password, phone });
    // password اتعمله hash تلقائي من pre save

    const token = signToken(user);

    res.status(201).json({
        success: true,
        message: req.t.auth.register.success,
        token,
        user: { id: user._id, name: user.name, email: user.email, role: user.role },
    });
});

// ✅ Login
export const login = catchAsyncError(async (req, res, next) => {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select("+password");
    if (!user) return next(new AppError(req.t.auth.login.invalidCredentials, 401))
    if (user.provider === "google") {
        return next(new AppError(req.t.auth.login.useGoogle, 401))
    }
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return next(new AppError(req.t.auth.login.invalidCredentials, 401))

    // Update lastLogin
    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    const token = signToken(user);

    res.status(200).json({
        success: true,
        message: req.t.auth.login.success,
        token,
        user: { id: user._id, name: user.name, email: user.email, role: user.role },
    });
});

// // ✅ Me
// export const me = catchAsync(async (req, res) => {
//     res.json({
//         success: true,
//         user: { id: req.user._id, name: req.user.name, email: req.user.email, role: req.user.role },
//     });
// });
