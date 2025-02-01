const cron = require('node-cron');
const openai = require('openai');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

// Setup OpenAI API key
openai.apiKey = process.env.OPENAI_API_KEY; // Replace with your OpenAI API key

// Project directory
const projectDirectory = path.join(__dirname, 'real-estate-app');

// Persistent file to track the day count (if you want to store this data)
const dayCounterFile = path.join(__dirname, 'dayCounter.json');

// Function to generate code using OpenAI
async function generateCode(prompt, filePath) {
    try {
        const response = await openai.Completion.create({
            model: 'gpt-4o',
            prompt: prompt,
            max_tokens: 1000,
            temperature: 0.7
        });

        const generatedCode = response.choices[0].text.trim();
        const fileFullPath = path.join(projectDirectory, filePath);

        // Ensure the directory exists
        fs.mkdirSync(path.dirname(fileFullPath), { recursive: true });

        // Write the generated code to the file
        fs.writeFileSync(fileFullPath, generatedCode);
        console.log(`Successfully wrote code to ${filePath}`);
    } catch (error) {
        console.error('Error generating code:', error);
    }
}

// Function to commit and push changes to GitHub
async function commitAndPush(commitMessage) {
    try {
        exec('git add .', { cwd: projectDirectory }, (err) => {
            if (err) throw err;
            exec(`git commit -m "${commitMessage}"`, { cwd: projectDirectory }, (err) => {
                if (err) throw err;
                exec('git push origin main', { cwd: projectDirectory }, (err) => {
                    if (err) throw err;
                    console.log('Changes pushed to GitHub');
                });
            });
        });
    } catch (error) {
        console.error('Error committing and pushing changes:', error);
    }
}

// Function to process a batch of prompts and generate code
async function generateCodeBatch(prompts) {
    for (const { prompt, filePath } of prompts) {
        await generateCode(prompt, filePath);
        await commitAndPush(`Automated code generation: Added feature at ${filePath}`);
    }
}

// Load the day counter from a file, or start fresh if the file doesn't exist
function loadDayCounter() {
    try {
        if (fs.existsSync(dayCounterFile)) {
            const data = fs.readFileSync(dayCounterFile, 'utf-8');
            return JSON.parse(data);
        }
    } catch (error) {
        console.error('Error loading day counter:', error);
    }
    return { day: 1 }; // Start with Day 1 if no data exists
}

// Save the current day counter to a file
function saveDayCounter(dayCounter) {
    try {
        fs.writeFileSync(dayCounterFile, JSON.stringify(dayCounter));
    } catch (error) {
        console.error('Error saving day counter:', error);
    }
}

// Example of weekly prompts (this can be dynamically loaded from an external file)
const weeklyPrompts = [
    // **Week 1: Backend Setup**
    [
        {
            prompt: 'Write the initial setup for a Node.js backend with Express, including setting up MongoDB connection, basic property schema, and middleware setup for security (CORS, rate-limiting, etc).',
            filePath: './backend/server.js'
        },
        {
            prompt: 'Set up JWT authentication and bcrypt password hashing for user authentication.',
            filePath: './backend/auth/authController.js'
        }
    ],

    // **Week 2: Backend - Models and API Routes**
    [
        {
            prompt: 'Create MongoDB schema for the Property model including fields for price, location, images, description, user_id (for agent), and amenities.',
            filePath: './backend/models/Property.js'
        },
        {
            prompt: 'Generate API routes for property CRUD operations in Express, use validation with Joi, and include error handling for each route.',
            filePath: './backend/routes/propertyRoutes.js'
        }
    ],

    // **Week 3: User Management and Admin Setup**
    [
        {
            prompt: 'Create User model and implement role-based access control (RBAC).',
            filePath: './backend/models/User.js'
        },
        {
            prompt: 'Implement user registration and login API with JWT authentication.',
            filePath: './backend/auth/userController.js'
        }
    ],

    // **Week 4: Middleware and Real-time Features**
    [
        {
            prompt: 'Set up logging, monitoring, and error handling (using libraries like Winston or Pino).',
            filePath: './backend/middleware/logger.js'
        },
        {
            prompt: 'Implement search functionality for properties (e.g., by price range, location, etc.) with query string parsing.',
            filePath: './backend/routes/searchRoutes.js'
        }
    ],

    // **Week 5: Frontend Setup - Next.js Pages**
    [
        {
            prompt: 'Generate frontend components in Next.js to display property listings, paginate results, and display property details with server-side rendering (SSR).',
            filePath: './frontend/pages/index.js'
        },
        {
            prompt: 'Create a basic landing page and property detail page in Next.js.',
            filePath: './frontend/pages/property/[id].js'
        }
    ],

    // **Week 6: User Authentication in Frontend**
    [
        {
            prompt: 'Write frontend logic using React and Redux for managing user authentication (store JWT in localStorage, login/logout, role-based rendering).',
            filePath: './frontend/store/authSlice.js'
        },
        {
            prompt: 'Add sign-up, login, and user profile pages with frontend validation and API integration.',
            filePath: './frontend/pages/signup.js'
        }
    ],

    // **Week 7: Real-time Features**
    [
        {
            prompt: 'Integrate WebSockets for real-time updates in the frontend for price updates and property status changes.',
            filePath: './frontend/hooks/useWebSocket.js'
        },
        {
            prompt: 'Create a notification system in the frontend to alert users about new properties or price changes.',
            filePath: './frontend/components/Notification.js'
        }
    ],

    // **Week 8: Admin Dashboard**
    [
        {
            prompt: 'Generate the structure for an Admin Dashboard in Next.js to manage users, properties, and analytics, with role-based access control.',
            filePath: './frontend/pages/admin/dashboard.js'
        },
        {
            prompt: 'Create an agent dashboard to manage their properties and bookings.',
            filePath: './frontend/pages/agent/dashboard.js'
        }
    ],

    // **Week 9: Backend Features and Caching**
    [
        {
            prompt: 'Implement rate-limiting middleware for security and prevent brute-force attacks.',
            filePath: './backend/middleware/rateLimiter.js'
        },
        {
            prompt: 'Add email notifications for user registration, property updates, etc.',
            filePath: './backend/services/emailService.js'
        }
    ],

    // **Week 10: CI/CD and Deployment**
    [
        {
            prompt: 'Write GitHub Actions CI/CD pipeline for automated deployment to Heroku (backend) and Vercel (frontend), with SSL setup using Let\'s Encrypt.',
            filePath: './.github/workflows/deploy.yml'
        },
        {
            prompt: 'Set up Docker for both frontend and backend for easy deployment, add Dockerfiles and docker-compose configuration for multi-container setup.',
            filePath: './docker-compose.yml'
        }
    ],

    // **Week 11: Performance Optimization**
    [
        {
            prompt: 'Optimize property search and listings with pagination and efficient queries.',
            filePath: './backend/controllers/propertyController.js'
        },
        {
            prompt: 'Add caching for frequently requested data (e.g., using Redis for property listings).',
            filePath: './backend/utils/cache.js'
        }
    ],

    // **Week 12: Final Touches and Testing**
    [
        {
            prompt: 'Perform load testing and security testing on the backend using tools like Apache JMeter or Artillery.',
            filePath: './test/loadTest.js'
        },
        {
            prompt: 'Write end-to-end tests for user interactions, including registration, login, and property CRUD operations.',
            filePath: './test/e2e/userFlowTest.js'
        },
        {
            prompt: 'Add SEO optimizations for Next.js (meta tags, Open Graph tags, etc.) for better visibility on search engines.',
            filePath: './frontend/pages/_document.js'
        }
    ]
];

// Function to run the task for the current day
async function run() {
    const dayCounter = loadDayCounter();  // Load the current day from the file

    // Get the correct week and day in the weekly prompts
    const currentWeekIndex = Math.floor((dayCounter.day - 1) / 2); // 2 prompts per week
    const currentDayInWeek = (dayCounter.day - 1) % 2;

    // Ensure the current day is within the valid range
    if (currentWeekIndex < weeklyPrompts.length) {
        const prompts = weeklyPrompts[currentWeekIndex];

        // Run the task for the current day
        await generateCodeBatch([prompts[currentDayInWeek]]); // Process today's prompt

        // Increment the day counter
        dayCounter.day += 1;
        if (dayCounter.day > 84) { // After 3 months (12 weeks x 7 days)
            dayCounter.day = 1; // Reset to day 1 or you can stop here
        }

        saveDayCounter(dayCounter); // Save the updated day counter
    }
}

// Schedule the task to run daily at midnight
cron.schedule('0 0 * * *', run);
