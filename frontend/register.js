const API_BASE_URL = window.location.hostname === 'localhost' || window.location.protocol === 'file:' ? 'http://localhost:5000' : 'https://grad-gateway.onrender.com';

let selectedRole = "student";

const studentBtn = document.getElementById("studentBtn");
const employeeBtn = document.getElementById("employeeBtn");
const emailInput = document.getElementById("email");
const studentIdInput = document.getElementById("studentId");
const fullNameInput = document.getElementById("fullname");

// Email Validation Alert
function validateStudentEmail() {
    const email = emailInput.value.trim();
    if (selectedRole === "student" && email) {
        const studentId = studentIdInput.value.trim();
        if (studentId) {
            const expectedEmail = studentId.toLowerCase() + "@rguktrkv.ac.in";
            if (email !== expectedEmail) {
                alert(`Invalid Email! For Student ID ${studentId}, the email must be ${expectedEmail}`);
                return false;
            }
        } else if (!email.endsWith("@rguktrkv.ac.in")) {
            alert("Invalid Email!");
            return false;
        }
    }
    return true;
}

emailInput.addEventListener("blur", validateStudentEmail);
emailInput.addEventListener("change", validateStudentEmail);

studentBtn.onclick = () => {
    selectedRole = "student";
    studentBtn.classList.add("active");
    employeeBtn.classList.remove("active");
    emailInput.placeholder = "Enter Student Email";
    studentIdInput.style.display = "block";
    studentIdInput.required = true;
    fullNameInput.placeholder = "Enter Full Name";
    fullNameInput.required = true;
};

employeeBtn.onclick = () => {
    selectedRole = "employee";
    employeeBtn.classList.add("active");
    studentBtn.classList.remove("active");
    emailInput.placeholder = "Enter Employee Email";
    studentIdInput.style.display = "none";
    studentIdInput.required = false;
    fullNameInput.placeholder = "Enter Company Representative Name";
    fullNameInput.required = true;
};

document.getElementById("authForm").onsubmit = async function (e) {
    e.preventDefault();

    if (!validateStudentEmail()) return;

    const fullname = fullNameInput.value.trim();
    const email = emailInput.value.trim();
    const password = document.getElementById("password").value.trim();

    if (password.length < 6) {
        alert("Password must be at least 6 characters.");
        return;
    }

    let payload = { email, password, role: selectedRole, fullname };

    if (selectedRole === "student") {
        const studentId = studentIdInput.value.trim();
        payload.studentId = studentId;
        payload.username = studentId; // Use studentId as username for backend
    } else {
        payload.username = fullname; // Use fullname as username for backend
    }

    try {
        const response = await fetch(`${API_BASE_URL}/api/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (response.ok) {
            // Auto-login logic
            localStorage.setItem("username", payload.username);
            localStorage.setItem("fullname", payload.fullname);
            localStorage.setItem("studentId", payload.studentId || "");
            localStorage.setItem("userRole", selectedRole);

            alert("Registration Successful! Redirecting to dashboard...");

            if (selectedRole === "student") {
                window.location.href = "Student_Dashboard.html";
            } else {
                window.location.href = "Employee_Dashboard.html";
            }
        } else {
            alert(data.message || "Registration failed");
        }
    } catch (error) {
        console.error("Error:", error);
        alert("Server error. Please try again later.");
    }
};
