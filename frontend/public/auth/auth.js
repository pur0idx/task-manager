const BACKEND_URL = "https://api.final-project.xyz";

document.addEventListener('DOMContentLoaded', function() {
    const signinForm = document.getElementById('signin-form');
    const signupForm = document.getElementById('signup-form');
    const switchToSignup = document.getElementById('switch-to-signup');
    const switchToSignin = document.getElementById('switch-to-signin');


    // Check if already logged in
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    if (token && user.username) {
        window.location.href = '/main';
        return;
    }

    // Handle signin form submission
    signinForm.addEventListener('submit', async function(e) {
        e.preventDefault();

        try {
            const username = document.getElementById('signin-username').value;
            const password = document.getElementById('signin-password').value;

            if (!username || !password) {
                throw new Error('Username and password are required');
            }

            const response = await fetch(`${BACKEND_URL}/api/signin`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    username,
                    password
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Login failed');
            }

            if (data.success) {
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));
                window.location.href = '/main';
            } else {
                throw new Error(data.message || 'Login failed');
            }
        } catch (error) {
            console.error('Login error:', error);
            alert(error.message || 'Error during login process');
        }
    });

    // Handle signup form submission
    signupForm.addEventListener('submit', async function(e) {
        e.preventDefault();

        try {
            const username = document.getElementById('signup-username').value;
            const password = document.getElementById('signup-password').value;

            if (!username || !password) {
                throw new Error('Username and password are required');
            }

            const response = await fetch(`${BACKEND_URL}/api/signup`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    username,
                    password
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Registration failed');
            }

            if (data.success) {
                alert('Account created successfully! Please log in.');
                document.querySelector('.signup-form').style.display = 'none';
                document.querySelector('.signin-form').style.display = 'block';
                signupForm.reset();
            } else {
                throw new Error(data.message || 'Registration failed');
            }
        } catch (error) {
            console.error('Signup error:', error);
            alert(error.message || 'Error during sign up');
        }
    });

    // Form switching handlers
    switchToSignup.addEventListener('click', function(e) {
        e.preventDefault();
        document.querySelector('.signin-form').style.display = 'none';
        document.querySelector('.signup-form').style.display = 'block';
    });

    switchToSignin.addEventListener('click', function(e) {
        e.preventDefault();
        document.querySelector('.signup-form').style.display = 'none';
        document.querySelector('.signin-form').style.display = 'block';
    });
});