const API_BASE_URL = window.location.hostname === 'localhost' || window.location.protocol === 'file:' ? 'http://localhost:5000' : 'https://grad-gateway.onrender.com';

let appliedJobs = [];
let currentJob = "";

document.addEventListener("DOMContentLoaded", async () => {
    let user = localStorage.getItem("username");
    if (user) {
        let displayUsername = document.getElementById("displayUsername");
        let profileUsername = document.getElementById("profileUsername");
        let profileRollNumber = document.getElementById("profileRollNumber");
        let fullname = localStorage.getItem("fullname");
        let studentId = localStorage.getItem("studentId");
        let email = localStorage.getItem("email");
        
        if (displayUsername) displayUsername.innerText = fullname || user;
        if (profileUsername) profileUsername.innerText = fullname || user;
        if (profileRollNumber && studentId) profileRollNumber.innerText = studentId;
        
        let profileEmail = document.querySelector(".profile-email");
        if (profileEmail && email) profileEmail.innerText = email;
    }

    // Fetch jobs and applications from backend
    await fetchJobs();
    await fetchMyApplications();

    // Add listener for resume upload UI
    const resumeUpload = document.getElementById("resumeUpload");
    if (resumeUpload) {
        resumeUpload.addEventListener("change", function() {
            const uploadText = document.querySelector(".upload-text");
            if (this.files && this.files.length > 0) {
                uploadText.innerText = this.files[0].name;
            } else {
                uploadText.innerText = "Click to upload or drag and drop";
            }
        });
    }
});

async function fetchJobs() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/jobs`);
        const jobs = await response.json();
        renderJobs(jobs);
    } catch (error) {
        console.error("Error fetching jobs:", error);
    }
}

async function fetchMyApplications() {
    const userRole = localStorage.getItem("userRole");
    const email = localStorage.getItem("email");
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/applications`);
        const allApplications = await response.json();
        
        // Filter applications for the current student
        const myApps = allApplications.filter(app => app.email === email);
        
        renderApplications(myApps);
    } catch (error) {
        console.error("Error fetching applications:", error);
    }
}

function renderApplications(apps) {
    const appliedList = document.getElementById("appliedList");
    const totalCount = document.getElementById("totalCount");
    const inProgressCount = document.getElementById("inProgressCount");
    const offersCount = document.getElementById("offersCount");
    
    // Also sync with Home page stats if they exist
    const homeAppsCount = document.querySelectorAll(".stat-number")[1]; // "Applications" on home
    const homeInterviewsCount = document.querySelectorAll(".stat-number")[2]; // "Interviews" on home

    if (!appliedList) return;

    appliedList.innerHTML = "";
    const total = apps.length;
    if (totalCount) totalCount.innerText = total;
    if (homeAppsCount) homeAppsCount.innerText = total;
    
    // Calculate stats
    let inProgress = 0;
    let offers = 0;
    let interviews = 0;

    // Update tracking array for Apply Now buttons
    appliedJobs = apps.map(app => app.jobTitle + "-" + app.company);

    apps.forEach(app => {
        const status = app.status.toLowerCase().trim();
        
        // Explicit checks to avoid overlaps
        if (status === 'offer extended' || status === 'hired') {
            offers++;
        } else if (status === 'shortlisted' || status === 'interview scheduled' || status === 'under review' || status === 'in progress') {
            inProgress++;
            if (status === 'interview scheduled') interviews++;
        }

        let row = document.createElement("div");
        row.className = "applied-row";
        row.innerHTML = `
            <div><strong>${app.jobTitle} - ${app.company}</strong></div>
            <div class="status status-${status.replace(/\s+/g, '-')}">${app.status}</div>
        `;
        appliedList.appendChild(row);
    });

    if (inProgressCount) inProgressCount.innerText = inProgress;
    if (offersCount) offersCount.innerText = offers;
    if (homeInterviewsCount) homeInterviewsCount.innerText = interviews;
}

function renderJobs(jobs) {
    const jobsContainer = document.querySelector(".jobs-container");
    if (!jobsContainer) return;
    jobsContainer.innerHTML = "";
    jobs.forEach(job => {
        const card = document.createElement("div");
        card.className = "job-card";
        card.innerHTML = `
            <h3>${job.title}</h3>
            <p>${job.company} - ${job.location}</p>
            <button class="view-btn" onclick="openModal('${job.id}','${job.title}','${job.company}','${job.location}','${job.package}','${job.description}')">
                View Details
            </button>
        `;
        jobsContainer.appendChild(card);
    });
}

function showSection(id, btn) {
    document.querySelectorAll(".section").forEach(sec => sec.classList.remove("active"));
    document.getElementById(id).classList.add("active");

    document.querySelectorAll(".nav-btn").forEach(b => b.classList.remove("active"));
    if (btn) btn.classList.add("active");

    if (id === 'applied') {
        fetchMyApplications();
    }
}

function logout() {
    window.location.href = "login.html"
}

let currentJobId = "";

function openModal(id, title, company, location, pack, desc) {
    currentJobId = id;
    document.getElementById("modalTitle").innerText = title;
    document.getElementById("modalCompany").innerText = company;
    document.getElementById("modalLocation").innerText = location;
    document.getElementById("modalPackage").innerText = pack;
    document.getElementById("modalDesc").innerText = desc;

    // Reset and Pre-fill application form info
    document.getElementById("applyingFor").innerText = title;
    document.getElementById("applyingAt").innerText = company;
    
    // Clear previous inputs
    document.getElementById("fullName").value = "";
    document.getElementById("email").value = "";
    document.getElementById("phone").value = "";
    document.getElementById("resumeUpload").value = "";
    document.getElementById("gradYear").value = "2025";
    
    // Reset resume upload UI text
    const uploadText = document.querySelector(".upload-text");
    if (uploadText) {
        uploadText.innerText = "Click to upload or drag and drop";
    }

    let user = localStorage.getItem("username");
    let fullname = localStorage.getItem("fullname");
    let userEmail = localStorage.getItem("email");
    
    if (user) {
        document.getElementById("fullName").value = fullname || user;
    }
    if (userEmail) {
        document.getElementById("email").value = userEmail;
    } else if (user && user.toLowerCase().includes("kiran")) {
        document.getElementById("email").value = "chakalikiran340@gmail.com";
    }

    currentJob = title + "-" + company;

    // Reset views
    document.getElementById("jobDetails").style.display = "block";
    document.getElementById("applicationForm").style.display = "none";
    document.getElementById("successView").style.display = "none";

    let btn = document.getElementById("applyButton");
    if (appliedJobs.includes(currentJob)) {
        btn.innerText = "Applied ✓";
        btn.classList.add("disabled");
        btn.disabled = true;
    } else {
        btn.innerText = "Apply Now";
        btn.classList.remove("disabled");
        btn.disabled = false;
    }

    document.getElementById("jobModal").style.display = "block";
}

function showApplicationForm() {
    document.getElementById("jobDetails").style.display = "none";
    document.getElementById("applicationForm").style.display = "block";
}

function hideApplicationForm() {
    document.getElementById("jobDetails").style.display = "block";
    document.getElementById("applicationForm").style.display = "none";
}

async function submitApplication() {
    const fullName = document.getElementById("fullName").value;
    const email = document.getElementById("email").value;
    const phone = document.getElementById("phone").value;
    const gradYear = document.getElementById("gradYear").value;
    const resume = document.getElementById("resumeUpload").value;

    if (!fullName || !email || !phone || !resume) {
        alert("Please fill in all details and upload your resume.");
        return;
    }

    const resumeInput = document.getElementById("resumeUpload");
    const resumeFile = resumeInput.files[0];

    const formData = new FormData();
    formData.append('fullName', fullName);
    formData.append('jobId', currentJobId);
    formData.append('email', email);
    formData.append('phone', phone);
    formData.append('gradYear', gradYear);
    formData.append('jobTitle', currentJob.split('-')[0]);
    formData.append('company', currentJob.split('-')[1]);
    formData.append('applicantUser', localStorage.getItem("username"));
    
    if (resumeFile) {
        formData.append('resume', resumeFile);
    }

    try {
        const response = await fetch(`${API_BASE_URL}/api/applications`, {
            method: 'POST',
            body: formData
            // Note: Don't set Content-Type header when using FormData; 
            // the browser will set it automatically with the correct boundary.
        });

        if (response.ok) {
            // Logic for successful application
            await fetchMyApplications(); // Refresh list from backend

            // Show success view
            document.getElementById("applicationForm").style.display = "none";
            document.getElementById("successView").style.display = "block";
            document.getElementById("successJob").innerText = currentJob;
        } else {
            const errorData = await response.json().catch(() => ({}));
            alert("Failed to submit application: " + (errorData.message || response.statusText));
        }
    } catch (error) {
        console.error("Error submitting application:", error);
        alert("Server error. Please make sure the backend is running.");
    }
}

function closeModal() {
    document.getElementById("jobModal").style.display = "none";
}

function switchProfileTab(tab) {
    // Update tabs
    document.querySelectorAll('.profile-tab').forEach(t => t.classList.remove('active'));
    event.currentTarget.classList.add('active');

    // Update content
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    if (tab === 'details') {
        document.getElementById('profile-details-content').classList.add('active');
    } else {
        document.getElementById('profile-resume-content').classList.add('active');
    }
}

function viewResume() {
    switchProfileTab('resume');
}
