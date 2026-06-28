const { z } = require('zod');

// Schema for user registration
const signupSchema = z.object({
  fullName: z.string().trim().min(1, 'Full name is required').max(100),
  email: z.string().trim().email('Invalid email address').transform(val => val.toLowerCase()),
  phone: z.string().trim().min(1, 'Phone number is required').regex(/^[+]?[\d\s\-().]{7,15}$/, 'Invalid phone number format'),
  role: z.enum(['client', 'driver']),
  password: z.string().min(8, 'Password must be at least 8 characters long')
    .refine(v => /^(?=.*[a-z])(?=.*[A-Z])(?=.*[^a-zA-Z0-9])/.test(v), {
      message: 'Password must contain at least 1 uppercase letter, 1 lowercase letter, and 1 special character.'
    }),
  confirmPassword: z.string().min(8),
  vehicleNumber: z.string().trim().optional(),
  licenseNumber: z.string().trim().optional(),
  rcDocument: z.string().trim().optional(),
  licenseDocument: z.string().trim().optional(),
  aadhaarDocument: z.string().trim().optional(),
  panDocument: z.string().trim().optional(),
  currentCity: z.string().trim().optional(),
  vehicleModelYear: z.string().trim().optional(),
  aadhaarNumber: z.string().trim().optional(),
  driverNameIfVendor: z.string().trim().optional(),
  driverContactNumber: z.string().trim().optional(),
  rcCopyAvailable: z.enum(['Yes', 'No']).optional(),
  insuranceValidTill: z.string().trim().optional(),
  preferredServiceArea: z.string().trim().optional(),
  previousExperience: z.string().trim().optional(),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
}).refine(data => {
  if (data.role === 'driver') {
    const hasRequiredBase = !!(
      data.phone &&
      data.currentCity &&
      data.vehicleNumber &&
      data.vehicleModelYear &&
      data.licenseNumber &&
      data.insuranceValidTill &&
      data.preferredServiceArea &&
      data.licenseDocument &&
      data.rcDocument &&
      data.aadhaarDocument &&
      data.panDocument
    );
    return hasRequiredBase;
  }
  return true;
}, {
  message: "All driver details (Contact Number, Current City, Car Number, Vehicle Model & Year, Driving License Number, Insurance Valid Till, Preferred Service Area, License Document, RC Document, Aadhaar Document, and PAN Document) are required.",
  path: ["role"]
});

// Schema for login
const loginSchema = z.object({
  email: z.string().trim().email('Invalid email address').transform(val => val.toLowerCase()),
  password: z.string().min(1, 'Password is required'),
});

// Passenger details schema for bookings
const passengerDetailsSchema = z.object({
  fullName: z.string().trim().min(1, 'Passenger name is required'),
  email: z.string().trim().email('Invalid passenger email address').transform(val => val.toLowerCase()),
  phone: z.string().trim().min(1, 'Passenger phone is required').regex(/^[+]?[\d\s\-().]{7,15}$/, 'Invalid phone number format'),
  specialInstructions: z.string().trim().optional().default(''),
});

// Schema for ride booking
const rideBookingSchema = z.object({
  pickupLocation: z.string().trim()
    .min(5, 'Pickup location must be at least 5 characters long')
    .refine(val => /[a-zA-Z]/.test(val), { message: 'Pickup location must contain at least one letter' }),
  dropoffLocation: z.string().trim()
    .min(5, 'Dropoff location must be at least 5 characters long')
    .refine(val => /[a-zA-Z]/.test(val), { message: 'Dropoff location must contain at least one letter' }),
  pickupDate: z.string().trim().min(1, 'Pickup date is required'),
  pickupTime: z.string().trim().min(1, 'Pickup time is required'),
  vehicleType: z.string().trim().min(1, 'Vehicle type is required'),
  passengerDetails: passengerDetailsSchema,
  paymentMethod: z.enum(['cash', 'card', 'upi', 'wallet']).optional().default('cash'),
});

// Schema for profile update
const updateProfileSchema = z.object({
  fullName: z.string().trim().optional(),
  email: z.string().trim().email('Invalid email address').transform(val => val.toLowerCase()).optional(),
  phone: z.string().trim().optional(),
  currentPassword: z.string().optional(),
  newPassword: z.string().min(8, 'New password must be at least 8 characters long')
    .refine(v => /^(?=.*[a-z])(?=.*[A-Z])(?=.*[^a-zA-Z0-9])/.test(v), {
      message: 'New password must contain at least 1 uppercase letter, 1 lowercase letter, and 1 special character.'
    }).optional(),
  profilePicture: z.string().optional(),
  vehicleNumber: z.string().trim().optional(),
  licenseNumber: z.string().trim().optional(),
  rcDocument: z.string().optional(),
  licenseDocument: z.string().optional(),
  aadhaarDocument: z.string().optional(),
  panDocument: z.string().optional(),
  currentCity: z.string().trim().optional(),
  vehicleModelYear: z.string().trim().optional(),
  aadhaarNumber: z.string().trim().optional(),
  driverNameIfVendor: z.string().trim().optional(),
  driverContactNumber: z.string().trim().optional(),
  rcCopyAvailable: z.enum(['Yes', 'No']).optional(),
  insuranceValidTill: z.string().trim().optional(),
  preferredServiceArea: z.string().trim().optional(),
  previousExperience: z.string().trim().optional(),
});

// Schema for OTP verification
const otpVerificationSchema = z.object({
  bookingId: z.string().trim().min(1, 'Booking ID is required'),
  otp: z.string().trim().min(1, 'OTP code is required'),
});

// Schema for contact inquiry
const contactInquirySchema = z.object({
  firstName: z.string().trim().min(1, 'First name is required').max(50),
  lastName: z.string().trim().min(1, 'Last name is required').max(50),
  email: z.string().trim().email('Invalid email address').transform(val => val.toLowerCase()),
  phone: z.string().trim().optional(),
  subject: z.string().trim().min(1, 'Subject is required'),
  message: z.string().trim().min(1, 'Message is required').max(1000),
});

module.exports = {
  signupSchema,
  loginSchema,
  rideBookingSchema,
  updateProfileSchema,
  otpVerificationSchema,
  contactInquirySchema,
};
