const axios = require('axios');
const colors = require('colors');
const config = require('./config');

// Configuration
const BASE_URL = config.BASE_URL;
const SUPER_ADMIN_EMAIL = config.SUPER_ADMIN_EMAIL;
const SUPER_ADMIN_PASSWORD = config.SUPER_ADMIN_PASSWORD;

let superAdminCookies = '';
let pollingOfficerCookies = '';
let createdOfficerId = '';
let testUserId = '';

// Helper function to extract cookies
function extractCookies(response) {
    const cookies = response.headers['set-cookie'];
    if (cookies) {
        return cookies.map(cookie => cookie.split(';')[0]).join('; ');
    }
    return '';
}

// Test counter
let testsRun = 0;
let testsPassed = 0;
let testsFailed = 0;

function logTest(testName, passed, message = '') {
    testsRun++;
    if (passed) {
        testsPassed++;
        console.log(`✅ ${testName}`.green);
        if (message) console.log(`   ${message}`.gray);
    } else {
        testsFailed++;
        console.log(`❌ ${testName}`.red);
        if (message) console.log(`   Error: ${message}`.red);
    }
}

async function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Test 1: Super Admin Login
async function testSuperAdminLogin() {
    console.log('\n🔐 Testing Super Admin Login...'.cyan);
    try {
        const response = await axios.post(`${BASE_URL}/sadmin/login`, {
            email: SUPER_ADMIN_EMAIL,
            password: SUPER_ADMIN_PASSWORD
        }, {
            withCredentials: true,
            validateStatus: () => true
        });

        if (response.status === 200) {
            superAdminCookies = extractCookies(response);
            logTest('Super Admin Login', true, `Logged in as ${SUPER_ADMIN_EMAIL}`);
            return true;
        } else {
            logTest('Super Admin Login', false, `Status: ${response.status}, Message: ${response.data.message}`);
            return false;
        }
    } catch (error) {
        logTest('Super Admin Login', false, error.message);
        return false;
    }
}

// Test 2: Create Polling Officer
async function testCreatePollingOfficer() {
    console.log('\n👤 Testing Create Polling Officer...'.cyan);
    try {
        const officerData = {
            fullName: 'Test Officer',
            email: `test.officer.${Date.now()}@ksucu.com`,
            phone: `+2547${Math.floor(10000000 + Math.random() * 90000000)}`,
            password: 'TestPassword123'
        };

        const response = await axios.post(`${BASE_URL}/polling-officer/create`, officerData, {
            headers: {
                'Cookie': superAdminCookies
            },
            withCredentials: true,
            validateStatus: () => true
        });

        if (response.status === 201 && response.data.officer) {
            createdOfficerId = response.data.officer.id;
            logTest('Create Polling Officer', true, `Officer created: ${officerData.email}`);
            return { success: true, data: officerData };
        } else {
            logTest('Create Polling Officer', false, `Status: ${response.status}, Message: ${response.data.message}`);
            return { success: false };
        }
    } catch (error) {
        logTest('Create Polling Officer', false, error.message);
        return { success: false };
    }
}

// Test 3: Get All Polling Officers
async function testGetAllOfficers() {
    console.log('\n📋 Testing Get All Polling Officers...'.cyan);
    try {
        const response = await axios.get(`${BASE_URL}/polling-officer/list`, {
            headers: {
                'Cookie': superAdminCookies
            },
            withCredentials: true,
            validateStatus: () => true
        });

        if (response.status === 200 && Array.isArray(response.data)) {
            logTest('Get All Officers', true, `Found ${response.data.length} officer(s)`);
            return true;
        } else {
            logTest('Get All Officers', false, `Status: ${response.status}`);
            return false;
        }
    } catch (error) {
        logTest('Get All Officers', false, error.message);
        return false;
    }
}

// Test 4: Polling Officer Login
async function testPollingOfficerLogin(credentials) {
    console.log('\n🔑 Testing Polling Officer Login...'.cyan);
    try {
        const response = await axios.post(`${BASE_URL}/polling-officer/login`, {
            email: credentials.email,
            password: credentials.password
        }, {
            withCredentials: true,
            validateStatus: () => true
        });

        if (response.status === 200) {
            pollingOfficerCookies = extractCookies(response);
            logTest('Polling Officer Login', true, `Logged in as ${credentials.email}`);
            return true;
        } else {
            logTest('Polling Officer Login', false, `Status: ${response.status}, Message: ${response.data.message}`);
            return false;
        }
    } catch (error) {
        logTest('Polling Officer Login', false, error.message);
        return false;
    }
}

// Test 5: Get Unvoted Users
async function testGetUnvotedUsers() {
    console.log('\n📊 Testing Get Unvoted Users...'.cyan);
    try {
        const response = await axios.get(`${BASE_URL}/polling-officer/unvoted-users`, {
            headers: {
                'Cookie': pollingOfficerCookies
            },
            withCredentials: true,
            validateStatus: () => true
        });

        if (response.status === 200 && Array.isArray(response.data)) {
            logTest('Get Unvoted Users', true, `Found ${response.data.length} unvoted user(s)`);
            // Store first user ID for testing
            if (response.data.length > 0) {
                testUserId = response.data[0]._id;
            }
            return true;
        } else {
            logTest('Get Unvoted Users', false, `Status: ${response.status}`);
            return false;
        }
    } catch (error) {
        logTest('Get Unvoted Users', false, error.message);
        return false;
    }
}

// Test 6: Register New User and Vote
async function testRegisterAndVote() {
    console.log('\n➕ Testing Register New User & Mark as Voted...'.cyan);
    try {
        const newUser = {
            username: `Test User ${Date.now()}`,
            email: `testuser.${Date.now()}@example.com`,
            phone: `+2547${Math.floor(10000000 + Math.random() * 90000000)}`,
            reg: `REG${Date.now()}`,
            course: 'Computer Science',
            yos: '2',
            ministry: 'Media',
            et: 'Technology'
        };

        const response = await axios.post(`${BASE_URL}/polling-officer/register-and-vote`, newUser, {
            headers: {
                'Cookie': pollingOfficerCookies
            },
            withCredentials: true,
            validateStatus: () => true
        });

        if (response.status === 201 && response.data.user) {
            testUserId = response.data.user._id;
            logTest('Register & Vote New User', true, `User created and voted: ${newUser.email}`);
            return true;
        } else {
            logTest('Register & Vote New User', false, `Status: ${response.status}, Message: ${response.data.message}`);
            return false;
        }
    } catch (error) {
        logTest('Register & Vote New User', false, error.message);
        return false;
    }
}

// Test 7: Mark Existing User as Voted
async function testMarkAsVoted() {
    console.log('\n✓ Testing Mark Existing User as Voted...'.cyan);

    // First, get an unvoted user
    try {
        const usersResponse = await axios.get(`${BASE_URL}/polling-officer/unvoted-users`, {
            headers: {
                'Cookie': pollingOfficerCookies
            },
            withCredentials: true
        });

        if (usersResponse.data.length === 0) {
            logTest('Mark Existing User as Voted', true, 'No unvoted users available (All users voted)');
            return true;
        }

        const userId = usersResponse.data[0]._id;

        const response = await axios.post(`${BASE_URL}/polling-officer/mark-voted/${userId}`, {}, {
            headers: {
                'Cookie': pollingOfficerCookies
            },
            withCredentials: true,
            validateStatus: () => true
        });

        if (response.status === 200) {
            logTest('Mark Existing User as Voted', true, `User marked as voted: ${userId}`);
            return true;
        } else {
            logTest('Mark Existing User as Voted', false, `Status: ${response.status}, Message: ${response.data.message}`);
            return false;
        }
    } catch (error) {
        logTest('Mark Existing User as Voted', false, error.message);
        return false;
    }
}

// Test 8: Search User
async function testSearchUser() {
    console.log('\n🔍 Testing Search User...'.cyan);
    try {
        const response = await axios.get(`${BASE_URL}/polling-officer/search-user?query=Test`, {
            headers: {
                'Cookie': pollingOfficerCookies
            },
            withCredentials: true,
            validateStatus: () => true
        });

        if (response.status === 200 && Array.isArray(response.data)) {
            logTest('Search User', true, `Found ${response.data.length} user(s) matching "Test"`);
            return true;
        } else {
            logTest('Search User', false, `Status: ${response.status}`);
            return false;
        }
    } catch (error) {
        logTest('Search User', false, error.message);
        return false;
    }
}

// Test 9: Get Polling Statistics
async function testGetPollingStats() {
    console.log('\n📈 Testing Get Polling Statistics...'.cyan);
    try {
        const response = await axios.get(`${BASE_URL}/polling-officer/stats`, {
            headers: {
                'Cookie': pollingOfficerCookies
            },
            withCredentials: true,
            validateStatus: () => true
        });

        if (response.status === 200 && response.data) {
            const stats = response.data;
            logTest('Get Polling Statistics', true,
                `Total: ${stats.totalUsers}, Voted: ${stats.totalVoted}, Not Voted: ${stats.totalNotVoted}, Completion: ${stats.percentageVoted}%`
            );
            return true;
        } else {
            logTest('Get Polling Statistics', false, `Status: ${response.status}`);
            return false;
        }
    } catch (error) {
        logTest('Get Polling Statistics', false, error.message);
        return false;
    }
}

// Test 10: Update Officer Status (Suspend)
async function testSuspendOfficer() {
    console.log('\n🔒 Testing Suspend Polling Officer...'.cyan);
    if (!createdOfficerId) {
        logTest('Suspend Officer', false, 'No officer ID available');
        return false;
    }

    try {
        const response = await axios.put(
            `${BASE_URL}/polling-officer/status/${createdOfficerId}`,
            { status: 'suspended' },
            {
                headers: {
                    'Cookie': superAdminCookies
                },
                withCredentials: true,
                validateStatus: () => true
            }
        );

        if (response.status === 200) {
            logTest('Suspend Officer', true, 'Officer suspended successfully');
            return true;
        } else {
            logTest('Suspend Officer', false, `Status: ${response.status}, Message: ${response.data.message}`);
            return false;
        }
    } catch (error) {
        logTest('Suspend Officer', false, error.message);
        return false;
    }
}

// Test 11: Verify Suspended Officer Can't Login
async function testSuspendedOfficerLogin(credentials) {
    console.log('\n🚫 Testing Suspended Officer Cannot Login...'.cyan);
    try {
        const response = await axios.post(`${BASE_URL}/polling-officer/login`, {
            email: credentials.email,
            password: credentials.password
        }, {
            withCredentials: true,
            validateStatus: () => true
        });

        if (response.status === 403) {
            logTest('Suspended Officer Login Block', true, 'Suspended officer correctly blocked from login');
            return true;
        } else {
            logTest('Suspended Officer Login Block', false, `Expected 403, got ${response.status}`);
            return false;
        }
    } catch (error) {
        logTest('Suspended Officer Login Block', false, error.message);
        return false;
    }
}

// Test 12: Reactivate Officer
async function testActivateOfficer() {
    console.log('\n✅ Testing Reactivate Polling Officer...'.cyan);
    if (!createdOfficerId) {
        logTest('Activate Officer', false, 'No officer ID available');
        return false;
    }

    try {
        const response = await axios.put(
            `${BASE_URL}/polling-officer/status/${createdOfficerId}`,
            { status: 'active' },
            {
                headers: {
                    'Cookie': superAdminCookies
                },
                withCredentials: true,
                validateStatus: () => true
            }
        );

        if (response.status === 200) {
            logTest('Activate Officer', true, 'Officer reactivated successfully');
            return true;
        } else {
            logTest('Activate Officer', false, `Status: ${response.status}`);
            return false;
        }
    } catch (error) {
        logTest('Activate Officer', false, error.message);
        return false;
    }
}

// Test 13: Get All Voted Users (Super Admin)
async function testGetAllVotedUsers() {
    console.log('\n👥 Testing Get All Voted Users (Super Admin)...'.cyan);
    try {
        const response = await axios.get(`${BASE_URL}/polling-officer/voted-users`, {
            headers: {
                'Cookie': superAdminCookies
            },
            withCredentials: true,
            validateStatus: () => true
        });

        if (response.status === 200 && Array.isArray(response.data)) {
            logTest('Get All Voted Users', true, `Found ${response.data.length} voted user(s)`);
            return true;
        } else {
            logTest('Get All Voted Users', false, `Status: ${response.status}`);
            return false;
        }
    } catch (error) {
        logTest('Get All Voted Users', false, error.message);
        return false;
    }
}

// Test 14: Polling Officer Logout
async function testPollingOfficerLogout() {
    console.log('\n🚪 Testing Polling Officer Logout...'.cyan);
    try {
        const response = await axios.post(`${BASE_URL}/polling-officer/logout`, {}, {
            headers: {
                'Cookie': pollingOfficerCookies
            },
            withCredentials: true,
            validateStatus: () => true
        });

        if (response.status === 200) {
            logTest('Polling Officer Logout', true, 'Officer logged out successfully');
            return true;
        } else {
            logTest('Polling Officer Logout', false, `Status: ${response.status}`);
            return false;
        }
    } catch (error) {
        logTest('Polling Officer Logout', false, error.message);
        return false;
    }
}

// Main test runner
async function runAllTests() {
    console.log('='.repeat(60).blue);
    console.log('🧪 POLLING SYSTEM - AUTOMATED TEST SUITE'.bold.blue);
    console.log('='.repeat(60).blue);
    console.log(`\n📡 Testing against: ${BASE_URL}`.yellow);
    console.log(`⏰ Started at: ${new Date().toLocaleString()}`.yellow);

    let officerCredentials = null;

    // Run tests sequentially
    const superAdminLoggedIn = await testSuperAdminLogin();

    if (superAdminLoggedIn) {
        const officerResult = await testCreatePollingOfficer();
        if (officerResult.success) {
            officerCredentials = officerResult.data;
        }

        await delay(500);
        await testGetAllOfficers();

        if (officerCredentials) {
            await delay(500);
            const officerLoggedIn = await testPollingOfficerLogin(officerCredentials);

            if (officerLoggedIn) {
                await delay(500);
                await testGetUnvotedUsers();
                await delay(500);
                await testRegisterAndVote();
                await delay(500);
                await testMarkAsVoted();
                await delay(500);
                await testSearchUser();
                await delay(500);
                await testGetPollingStats();
                await delay(500);
                await testPollingOfficerLogout();
            }

            // Test suspend/activate flow
            await delay(500);
            await testSuspendOfficer();
            await delay(500);
            await testSuspendedOfficerLogin(officerCredentials);
            await delay(500);
            await testActivateOfficer();
        }

        await delay(500);
        await testGetAllVotedUsers();
    }

    // Print summary
    console.log('\n' + '='.repeat(60).blue);
    console.log('📊 TEST SUMMARY'.bold.blue);
    console.log('='.repeat(60).blue);
    console.log(`\n✅ Tests Passed: ${testsPassed}/${testsRun}`.green);
    console.log(`❌ Tests Failed: ${testsFailed}/${testsRun}`.red);
    console.log(`📈 Success Rate: ${((testsPassed / testsRun) * 100).toFixed(2)}%`.cyan);
    console.log(`\n⏰ Completed at: ${new Date().toLocaleString()}`.yellow);
    console.log('='.repeat(60).blue + '\n');

    // Exit with appropriate code
    process.exit(testsFailed > 0 ? 1 : 0);
}

// Run the tests
runAllTests().catch(error => {
    console.error('\n💥 Fatal Error:'.red.bold, error.message);
    process.exit(1);
});
