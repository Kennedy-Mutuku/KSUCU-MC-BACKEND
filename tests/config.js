// Test Configuration
// Update these credentials with your actual super admin account

module.exports = {
    BASE_URL: 'http://localhost:3000',

    // Super Admin Credentials
    // Update these with your actual credentials
    SUPER_ADMIN_EMAIL: 'admin@ksucumcsuperadmin.co.ke',
    SUPER_ADMIN_PASSWORD: 'newsAdmin01q7',

    // Test Settings
    TEST_DELAY_MS: 500, // Delay between tests
    REQUEST_TIMEOUT_MS: 30000 // Request timeout
};

// To use different credentials, either:
// 1. Edit this file directly, OR
// 2. Set environment variables:
//    - TEST_SUPER_ADMIN_EMAIL
//    - TEST_SUPER_ADMIN_PASSWORD

if (process.env.TEST_SUPER_ADMIN_EMAIL) {
    module.exports.SUPER_ADMIN_EMAIL = process.env.TEST_SUPER_ADMIN_EMAIL;
}

if (process.env.TEST_SUPER_ADMIN_PASSWORD) {
    module.exports.SUPER_ADMIN_PASSWORD = process.env.TEST_SUPER_ADMIN_PASSWORD;
}
