const validate = (schema) => (req, res, next) => {
  try {
    req.body = schema.parse(req.body);
    next();
  } catch (error) {
    if (error.errors) {
      const friendlyMessages = error.errors.map(err => {
        const fieldName = err.path.join('.');
        let displayName = fieldName;
        if (fieldName === 'fullName') displayName = 'Full Name';
        if (fieldName === 'email') displayName = 'Email Address';
        if (fieldName === 'phone') displayName = 'Phone Number';
        if (fieldName === 'password') displayName = 'Password';
        if (fieldName === 'confirmPassword') displayName = 'Confirm Password';
        if (fieldName === 'vehicleNumber') displayName = 'Car Number';
        if (fieldName === 'licenseNumber') displayName = 'License Number';
        if (fieldName === 'driverContactNumber') displayName = 'Driver Contact';
        if (fieldName === 'currentCity') displayName = 'Current City';
        if (fieldName === 'vehicleModelYear') displayName = 'Vehicle Model & Year';
        if (fieldName === 'aadhaarNumber') displayName = 'Aadhaar Number';
        if (fieldName === 'driverNameIfVendor') displayName = 'Driver Name';
        if (fieldName === 'rcCopyAvailable') displayName = 'RC Copy Available';
        if (fieldName === 'insuranceValidTill') displayName = 'Insurance Validity Date';
        if (fieldName === 'preferredServiceArea') displayName = 'Preferred Service Area';
        if (fieldName === 'previousExperience') displayName = 'Previous Experience';

        if (err.message === 'Required') {
          return `${displayName} is required.`;
        }
        return err.message;
      });

      const combinedMessage = friendlyMessages.join(' | ');

      return res.status(400).json({
        success: false,
        message: combinedMessage,
        errors: error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }))
      });
    }
    next(error);
  }
};

module.exports = validate;
