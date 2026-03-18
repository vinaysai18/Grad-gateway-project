async function testAPI() {
    console.log("--- Testing Registration ---");
    const regRes = await fetch('http://localhost:5000/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            username: 'Test User',
            email: 'test@rguktrkv.ac.in',
            password: 'password123',
            role: 'student'
        })
    });
    console.log("Registration response:", await regRes.json());

    console.log("\n--- Testing Login ---");
    const loginRes = await fetch('http://localhost:5000/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            email: 'test@rguktrkv.ac.in',
            password: 'password123',
            role: 'student'
        })
    });
    console.log("Login response:", await loginRes.json());

    console.log("\n--- Testing Job Fetching ---");
    const jobsRes = await fetch('http://localhost:5000/api/jobs');
    console.log("Jobs found:", (await jobsRes.json()).length);

    console.log("\n--- Testing Application Submission ---");
    const appRes = await fetch('http://localhost:5000/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            name: 'Test User',
            email: 'test@rguktrkv.ac.in',
            phone: '1234567890',
            jobTitle: 'Software Developer',
            company: 'Infosys'
        })
    });
    const appData = await appRes.json();
    console.log("Application response:", appData);

    console.log("\n--- Testing Application Status Update ---");
    const updateRes = await fetch(`http://localhost:5000/api/applications/${appData.id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'Shortlisted' })
    });
    console.log("Update response:", await updateRes.json());
}

testAPI().catch(console.error);
