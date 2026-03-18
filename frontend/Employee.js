const API_BASE_URL = window.location.hostname === 'localhost' || window.location.protocol === 'file:' ? 'http://localhost:5000' : '';

let applicants = {};

document.addEventListener("DOMContentLoaded", async () => {
    let user = localStorage.getItem("username");
    if(user) {
        let displayUsername = document.getElementById("displayUsername");
        let profileUsername = document.getElementById("profileUsername");
        if(displayUsername) displayUsername.innerText = user;
        if(profileUsername) profileUsername.innerText = user;
    }
    await loadApplications();
});

function showSection(id, btn) {
    document.querySelectorAll(".section").forEach(sec => {
        sec.classList.remove("active");
    });
    document.getElementById(id).classList.add("active");

    // Toggle active class on navbar buttons
    if (btn) {
        document.querySelectorAll(".nav-btn").forEach(navBtn => {
            navBtn.classList.remove("active");
        });
        btn.classList.add("active");
    }

    if (id === 'applications') {
        loadApplications();
    }
    if (id === 'jobs') {
        fetchPostedJobs();
    }
}

function logout(){
    window.location.href="login.html";
}

async function addJob(){
    let company=document.getElementById("company").value;
    let role=document.getElementById("role").value;
    let pack=document.getElementById("package").value;
    let location=document.getElementById("location").value;
    let desc=document.getElementById("description").value;

    if(company==="" || role===""){
        alert("Please fill required fields!");
        return;
    }

    const jobData = { company, title: role, package: pack, location, description: desc };

    try {
        const response = await fetch(`${API_BASE_URL}/api/jobs`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(jobData)
        });

        if (response.ok) {
            alert("Job Posted Successfully!");
            
            // Clear form
            document.getElementById("company").value="";
            document.getElementById("role").value="";
            document.getElementById("package").value="";
            document.getElementById("location").value="";
            document.getElementById("description").value="";

            showSection("jobs");
            // Jobs list will be updated because showSection calls fetchPostedJobs()
        } else {
            alert("Failed to post job");
        }
    } catch (error) {
        console.error("Error posting job:", error);
        alert("Server error. Please try again later.");
    }
}

async function fetchPostedJobs() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/jobs`);
        const jobs = await response.json();
        renderJobsList(jobs);
    } catch (error) {
        console.error("Error fetching jobs:", error);
    }
}

function renderJobsList(jobs) {
    const jobList = document.getElementById("jobList");
    const jobCount = document.getElementById("jobCount");
    if (!jobList) return;

    jobList.innerHTML = "";
    jobCount.innerText = jobs.length;

    jobs.forEach(job => {
        const jobDiv = document.createElement("div");
        jobDiv.className = "job-item";
        jobDiv.innerHTML = `
            <h4>${job.title}</h4>
            <div class='company-name'>🏢 ${job.company}</div>
            <div class='job-details'>
                <span>💰 ${job.package}</span>
                <span>📍 ${job.location}</span>
            </div>
            <div class='job-desc'>${job.description}</div>
            <div class='posted-date'>Posted on: ${job.postedDate}</div>
        `;
        jobList.appendChild(jobDiv);
    });
}

async function loadApplications() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/applications`);
        const storedApps = await response.json();
        
        applicants = {}; // Clear existing
        storedApps.forEach(app => {
            applicants[app.id] = {
                name: app.fullName,
                role: app.jobTitle,
                email: app.email,
                phone: app.phone,
                education: app.education || { university: 'GradGateway University', degree: 'Computer Science', gpa: '8.5' },
                skills: app.skills || ['HTML', 'CSS', 'JavaScript'],
                status: app.status || 'New',
                appliedDate: app.appliedDate,
                resumeFilename: app.resumeFilename
            };
        });

        renderApplicantsList();
    } catch (error) {
        console.error("Error loading applications:", error);
    }
}

function renderApplicantsList() {
    const listContainer = document.querySelector('.applicants-list');
    if (!listContainer) return;

    listContainer.innerHTML = '';
    
    const ids = Object.keys(applicants);
    
    if (ids.length === 0) {
        listContainer.innerHTML = '<div class="no-apps-message">no new applications here</div>';
        const detailDiv = document.getElementById('applicantDetail');
        if (detailDiv) {
            detailDiv.innerHTML = `
                <div class="placeholder-message">
                    <p>no new applications here</p>
                </div>
            `;
        }
        return;
    }

    ids.forEach((id, index) => {
        const app = applicants[id];
        const initials = app.name.split(' ').map(n => n[0]).join('');
        
        const card = document.createElement('div');
        card.className = `app-card`;
        card.onclick = () => viewApplicant(id, card);
        card.innerHTML = `
            <div class="app-avatar">${initials}</div>
            <div class="app-info">
                <h4>${app.name}</h4>
                <p>${app.role}</p>
                <span class="app-meta">Applied ${app.appliedDate}</span>
            </div>
            <span class="status-badge status-${app.status.toLowerCase().replace(' ', '-')}">${app.status}</span>
        `;
        listContainer.appendChild(card);
    });

    // Handle initial detail view if none is active
    if (ids.length > 0 && !document.querySelector('.app-card.active')) {
        const firstCard = listContainer.querySelector('.app-card');
        viewApplicant(ids[0], firstCard);
    }
}

async function updateApplicantStatus(id, newStatus) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/applications/${id}/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus })
        });

        if (response.ok) {
            applicants[id].status = newStatus;
            
            // Refresh the Detail View
            const activeCard = document.querySelector('.app-card.active');
            viewApplicant(id, activeCard);
            
            // Refresh the Sidebar Card Badge
            const sidebarCards = document.querySelectorAll('.app-card');
            sidebarCards.forEach(card => {
                if (card.querySelector('h4').innerText === applicants[id].name) {
                    const badge = card.querySelector('.status-badge');
                    badge.className = `status-badge status-${newStatus.toLowerCase().replace(' ', '-')}`;
                    badge.innerText = newStatus;
                }
            });

            alert(`Applicant marked as ${newStatus}`);
        } else {
            alert("Failed to update status");
        }
    } catch (error) {
        console.error("Error updating status:", error);
        alert("Server error. Please try again later.");
    }
}

function scheduleInterview(id) {
    updateApplicantStatus(id, 'Interview Scheduled');
}

function shortlistApplicant(id) {
    updateApplicantStatus(id, 'Shortlisted');
}

function rejectApplicant(id) {
    if (confirm('Are you sure you want to reject this applicant?')) {
        updateApplicantStatus(id, 'Rejected');
    }
}

function offerJob(id) {
    if (confirm('Send an offer to this applicant?')) {
        updateApplicantStatus(id, 'Offer Extended');
    }
}

async function downloadResume(id) {
    const applicant = applicants[id];
    if (applicant.resumeFilename && applicant.resumeFilename !== 'Resume.pdf') {
        const fileUrl = `${API_BASE_URL}/api/download/${id}`;
        window.open(fileUrl, '_blank');
    } else {
        alert("No resume file available for this applicant.");
    }
}

function viewApplicant(id, element) {
    // Update active state in list
    document.querySelectorAll('.app-card').forEach(card => card.classList.remove('active'));
    if (element) element.classList.add('active');

    // Update Detail View
    const applicant = applicants[id];
    const detailDiv = document.getElementById('applicantDetail');
    
    const initials = applicant.name.split(' ').map(n => n[0]).join('');
    const currentStatus = applicant.status || 'New';

    detailDiv.innerHTML = `
        <div class="detail-header">
            <div class="applicant-profile">
                <div class="avatar-large">${initials}</div>
                <div class="profile-info">
                    <h3>${applicant.name}</h3>
                    <p>${applicant.role}</p>
                    <div class="contact-row">
                        <div class="contact-item">📧 ${applicant.email}</div>
                        <div class="contact-item">📞 ${applicant.phone}</div>
                    </div>
                </div>
            </div>
            <span class="status-badge status-${currentStatus.toLowerCase().replace(' ', '-')}">${currentStatus}</span>
        </div>

        <div class="detail-section">
            <h4>🎓 Education</h4>
            <div class="edu-box">
                <h5>${applicant.education.university}</h5>
                <p>${applicant.education.degree}</p>
                <p class="gpa">GPA: ${applicant.education.gpa} / 10.0</p>
            </div>
        </div>

        <div class="detail-section">
            <h4>🛠 Skills</h4>
            <div class="skill-tags">
                ${applicant.skills.map(skill => `<span class="skill-tag">${skill}</span>`).join('')}
            </div>
        </div>

        <div class="action-bar">
            <button class="btn-primary" onclick="scheduleInterview('${id}')">Schedule Interview</button>
            <button class="btn-secondary" onclick="shortlistApplicant('${id}')">Shortlist</button>
            <button class="btn-primary" style="background: #8b5cf6;" onclick="offerJob('${id}')">Extend Offer</button>
            <button class="btn-outline" onclick="rejectApplicant('${id}')">Reject</button>
            <button class="btn-primary" style="background: #1e293b;" onclick="downloadResume('${id}')">📄 Download Resume</button>
        </div>
    `;
}
