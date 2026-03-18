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
            alert("Invalid Email! Student email must end with @rguktrkv.ac.in");
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

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();

    try {
        let studentId = "";
        if (selectedRole === "student") {
            studentId = studentIdInput.value.trim();
        }
        const response = await fetch(`${API_BASE_URL}/api/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password, role: selectedRole })
        });

        const data = await response.json();

        if (response.ok) {
            localStorage.setItem("email", email);
            localStorage.setItem("username", data.username);
            localStorage.setItem("fullname", data.fullname);
            localStorage.setItem("studentId", data.studentId);
            localStorage.setItem("userRole", selectedRole);
            if (selectedRole === "student") {
                window.location.href = "Student_Dashboard.html";
            } else {
                window.location.href = "Employee_Dashboard.html";
            }
        } else {
            alert(data.message || "Login failed");
        }
    } catch (error) {
        console.error("Error:", error);
        alert("Server error. Please try again later.");
    }
};