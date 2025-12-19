// Native fetch in Node 18+

async function testPost() {
    try {
        const response = await fetch('http://localhost:3000/api/tickets', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contact_id: 1,
                organization_id: 1,
                device_id: 1,
                subject: "Manual Node Test",
                description: "Testing via node script"
            })
        });

        const data = await response.json();
        console.log("Status:", response.status);
        console.log("Response:", JSON.stringify(data, null, 2));
    } catch (err) {
        console.error("Fetch Error:", err);
    }
}

testPost();
