const { z } = require('zod');

// Schema for user registration
const signupSchema = z.object({
  fullName: z.string().trim().min(1, 'Full name is required').max(100),
  email: z.string().trim().email('Invalid email address').lowercase(),
  phone: z.string().trim().min(1, 'Phone number is required'),
  role: z.enum(['client', 'driver']),
  password: z.string().min(8, 'Password must be at least 8 characters long')
    .refine(v => /^(?=.*[a-zA-Z])(?=.*\d)/.test(v), {
      message: 'Password must be alphanumeric (contain both letters and numbers)'
    }),
  confirmPassword: z.string().min(8),
  vehicleNumber: z.string().trim().optional(),
  licenseNumber: z.string().trim().optional(),
  rcDocument: z.string().trim().optional(),
  licenseDocument: z.string().trim().optional(),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
}).refine(data => {
  if (data.role === 'driver') {
    return !!(data.vehicleNumber && data.licenseNumber && data.rcDocument && data.licenseDocument);
  }
  return true;
}, {
  message: "Vehicle number, license number, RC document, and license document are required for drivers",
  path: ["role"]
});

// Schema for login
const loginSchema = z.object({
  email: z.string().trim().email('Invalid email address').lowercase(),
  password: z.string().min(1, 'Password is required'),
});

// Passenger details schema for bookings
const passengerDetailsSchema = z.object({
  fullName: z.string().trim().min(1, 'Passenger name is required'),
  email: z.string().trim().email('Invalid passenger email address').lowercase(),
  phone: z.string().trim().min(1, 'Passenger phone is required'),
  specialInstructions: z.string().trim().optional().default(''),
});

// Schema for ride booking
const rideBookingSchema = z.object({
  pickupLocation: z.string().trim().min(1, 'Pickup location is required'),
  dropoffLocation: z.string().trim().min(1, 'Dropoff location is required'),
  pickupDate: z.string().trim().min(1, 'Pickup date is required'),
  pickupTime: z.string().trim().min(1, 'Pickup time is required'),
  vehicleType: z.string().trim().min(1, 'Vehicle type is required'),
  passengerDetails: passengerDetailsSchema,
  paymentMethod: z.enum(['cash', 'card', 'upi']).optional().default('cash'),
});

// Schema for profile update
const updateProfileSchema = z.object({
  fullName: z.string().trim().optional(),
  email: z.string().trim().email('Invalid email address').lowercase().optional(),
  phone: z.string().trim().optional(),
  currentPassword: z.string().optional(),
  newPassword: z.string().min(8, 'New password must be at least 8 characters long')
    .refine(v => /^(?=.*[a-zA-Z])(?=.*\d)/.test(v), {
      message: 'New password must be alphanumeric (contain both letters and numbers)'
    }).optional(),
  profilePicture: z.string().optional(),
  vehicleNumber: z.string().trim().optional(),
  licenseNumber: z.string().trim().optional(),
  rcDocument: z.string().optional(),
  licenseDocument: z.string().optional(),
});

// Schema for OTP verification
const otpVerificationSchema = z.object({
  bookingId: z.string().trim().min(1, 'Booking ID is required'),
  otp: z.string().trim().min(1, 'OTP code is required'),
});

module.exports = {
  signupSchema,
  loginSchema,
  rideBookingSchema,
  updateProfileSchema,
  otpVerificationSchema,
};
