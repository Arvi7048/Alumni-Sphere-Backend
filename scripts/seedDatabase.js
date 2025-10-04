const mongoose = require("mongoose")
const bcrypt = require("bcryptjs")
require("dotenv").config()

// Import models
const User = require("../models/User")
const Job = require("../models/Job")
const Event = require("../models/Event")
const Story = require("../models/Story")
const Donation = require("../models/Donation")

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })
    console.log("MongoDB Connected")
  } catch (error) {
    console.error("Database connection error:", error.message)
    process.exit(1)
  }
}

const seedUsers = async () => {
  try {
    // Clear existing users
    await User.deleteMany({})

    const salt = await bcrypt.genSalt(10)

    const users = [
      // Admin User
      {
        name: "Admin User",
        email: "arvindgautam7048@gmail.com",
        password: await bcrypt.hash("Arvi@7048", salt),
        role: "admin",
        batch: 2020,
        branch: "Computer Science & AI",
        location: "Greater Noida, UP, India",
        bio: "Platform administrator with extensive experience in alumni relations.",
        company: "Alumni Hub Inc.",
        position: "Platform Administrator",
        linkedin: "https://linkedin.com/in/Arvi7048",
        profileImage: "/placeholder.svg?height=200&width=200",
        isActive: true,
        masterAdmin: true,
      },
      // Regular Users
      {
        name: "John Smith",
        email: "john.smith@email.com",
        password: await bcrypt.hash("password123", salt),
        role: "user",
        batch: 2018,
        branch: "Computer Science",
        location: "New York, NY",
        bio: "Software engineer passionate about building scalable applications and mentoring junior developers.",
        company: "Google",
        position: "Senior Software Engineer",
        linkedin: "https://linkedin.com/in/john-smith",
        github: "https://github.com/johnsmith",
        website: "https://johnsmith.dev",
        profileImage: "/placeholder.svg?height=200&width=200",
        isActive: true,
      },
      {
        name: "Sarah Johnson",
        email: "sarah.johnson@email.com",
        password: await bcrypt.hash("password123", salt),
        role: "user",
        batch: 2019,
        branch: "Information Technology",
        location: "Seattle, WA",
        bio: "Product manager with a focus on user experience and data-driven decision making.",
        company: "Microsoft",
        position: "Senior Product Manager",
        linkedin: "https://linkedin.com/in/sarah-johnson",
        profileImage: "/placeholder.svg?height=200&width=200",
        isActive: true,
      },
      {
        name: "Michael Chen",
        email: "michael.chen@email.com",
        password: await bcrypt.hash("password123", salt),
        role: "user",
        batch: 2017,
        branch: "Electronics",
        location: "Austin, TX",
        bio: "Hardware engineer specializing in IoT devices and embedded systems.",
        company: "Tesla",
        position: "Hardware Engineer",
        linkedin: "https://linkedin.com/in/michael-chen",
        profileImage: "/placeholder.svg?height=200&width=200",
        isActive: true,
      },
      {
        name: "Emily Rodriguez",
        email: "emily.rodriguez@email.com",
        password: await bcrypt.hash("password123", salt),
        role: "user",
        batch: 2020,
        branch: "Mechanical",
        location: "Los Angeles, CA",
        bio: "Mechanical engineer working on sustainable energy solutions and green technology.",
        company: "SpaceX",
        position: "Mechanical Engineer",
        linkedin: "https://linkedin.com/in/emily-rodriguez",
        profileImage: "/placeholder.svg?height=200&width=200",
        isActive: true,
      },
      {
        name: "David Wilson",
        email: "david.wilson@email.com",
        password: await bcrypt.hash("password123", salt),
        role: "user",
        batch: 2016,
        branch: "Civil",
        location: "Chicago, IL",
        bio: "Civil engineer with expertise in infrastructure development and urban planning.",
        company: "AECOM",
        position: "Senior Civil Engineer",
        linkedin: "https://linkedin.com/in/david-wilson",
        profileImage: "/placeholder.svg?height=200&width=200",
        isActive: true,
      },
      {
        name: "Lisa Thompson",
        email: "lisa.thompson@email.com",
        password: await bcrypt.hash("password123", salt),
        role: "user",
        batch: 2021,
        branch: "Biotechnology",
        location: "Boston, MA",
        bio: "Biotechnology researcher focused on developing innovative medical treatments.",
        company: "Moderna",
        position: "Research Scientist",
        linkedin: "https://linkedin.com/in/lisa-thompson",
        profileImage: "/placeholder.svg?height=200&width=200",
        isActive: true,
      },
      {
        name: "Robert Garcia",
        email: "robert.garcia@email.com",
        password: await bcrypt.hash("password123", salt),
        role: "user",
        batch: 2015,
        branch: "Electrical",
        location: "Phoenix, AZ",
        bio: "Electrical engineer specializing in renewable energy systems and smart grid technology.",
        company: "General Electric",
        position: "Lead Electrical Engineer",
        linkedin: "https://linkedin.com/in/robert-garcia",
        profileImage: "/placeholder.svg?height=200&width=200",
        isActive: true,
      },
      {
        name: "Jennifer Lee",
        email: "jennifer.lee@email.com",
        password: await bcrypt.hash("password123", salt),
        role: "user",
        batch: 2019,
        branch: "Chemical",
        location: "Houston, TX",
        bio: "Chemical engineer working in the petrochemical industry with focus on process optimization.",
        company: "ExxonMobil",
        position: "Process Engineer",
        linkedin: "https://linkedin.com/in/jennifer-lee",
        profileImage: "/placeholder.svg?height=200&width=200",
        isActive: true,
      },
      {
        name: "Alex Kumar",
        email: "alex.kumar@email.com",
        password: await bcrypt.hash("password123", salt),
        role: "user",
        batch: 2022,
        branch: "Computer Science",
        location: "San Jose, CA",
        bio: "Recent graduate working as a full-stack developer with interests in AI and machine learning.",
        company: "Meta",
        position: "Software Engineer",
        linkedin: "https://linkedin.com/in/alex-kumar",
        github: "https://github.com/alexkumar",
        profileImage: "/placeholder.svg?height=200&width=200",
        isActive: true,
      },
    ]

    const createdUsers = await User.insertMany(users)
    console.log(`✅ Created ${createdUsers.length} users`)
    return createdUsers
  } catch (error) {
    console.error("❌ Error seeding users:", error.message)
    if (error.errors) {
      Object.keys(error.errors).forEach(key => {
        console.error(`- Field: ${key}, Message: ${error.errors[key].message}`)
      });
    }
    console.error(error.stack)
    throw error; // Re-throw so the main seeder catches and exits
  }
}


const seedJobs = async (users) => {
  try {
    // Clear existing jobs
    await Job.deleteMany({})

    const jobs = [
      {
        title: "Senior Full Stack Developer",
        company: "TechCorp Inc.",
        location: "San Francisco, CA",
        type: "Full-time",
        description: `We are looking for a Senior Full Stack Developer to join our growing team. You will be responsible for developing and maintaining web applications using modern technologies.

Key Responsibilities:
- Develop and maintain web applications using React, Node.js, and MongoDB
- Collaborate with cross-functional teams to define and implement new features
- Write clean, maintainable, and efficient code
- Participate in code reviews and mentor junior developers
- Optimize applications for maximum speed and scalability`,
        requirements: `Required Skills:
- 5+ years of experience in full-stack development
- Proficiency in JavaScript, React, Node.js, and MongoDB
- Experience with RESTful APIs and GraphQL
- Knowledge of version control systems (Git)
- Strong problem-solving skills and attention to detail

Preferred Skills:
- Experience with cloud platforms (AWS, Azure, or GCP)
- Knowledge of containerization (Docker, Kubernetes)
- Familiarity with CI/CD pipelines`,
        salary: "$120,000 - $150,000",
        applicationEmail: "careers@techcorp.com",
        applicationUrl: "https://techcorp.com/careers/senior-fullstack",
        postedBy: users[1]._id, // John Smith
        applicants: [users[2]._id, users[9]._id], // Sarah and Alex applied
      },
      {
        title: "Product Manager - AI/ML",
        company: "InnovateLabs",
        location: "Seattle, WA",
        type: "Full-time",
        description: `Join our AI/ML team as a Product Manager to drive the development of cutting-edge artificial intelligence products.

Key Responsibilities:
- Define product strategy and roadmap for AI/ML products
- Work closely with engineering teams to deliver high-quality products
- Conduct market research and competitive analysis
- Collaborate with stakeholders to gather requirements
- Manage product lifecycle from conception to launch`,
        requirements: `Required Qualifications:
- 3+ years of product management experience
- Strong understanding of AI/ML technologies
- Experience with data-driven decision making
- Excellent communication and leadership skills
- Bachelor's degree in Engineering, Computer Science, or related field

Preferred Qualifications:
- MBA or advanced degree
- Experience in B2B SaaS products
- Technical background in machine learning`,
        salary: "$130,000 - $160,000",
        applicationEmail: "jobs@innovatelabs.com",
        postedBy: users[2]._id, // Sarah Johnson
        applicants: [users[1]._id], // John applied
      },
      {
        title: "Hardware Design Engineer",
        company: "NextGen Electronics",
        location: "Austin, TX",
        type: "Full-time",
        description: `We are seeking a Hardware Design Engineer to join our team developing next-generation electronic devices.

Key Responsibilities:
- Design and develop electronic circuits and systems
- Create schematics and PCB layouts
- Perform circuit analysis and simulation
- Collaborate with firmware and software teams
- Support product testing and validation`,
        requirements: `Required Skills:
- Bachelor's degree in Electrical or Electronics Engineering
- 3+ years of hardware design experience
- Proficiency in CAD tools (Altium Designer, KiCad)
- Knowledge of analog and digital circuit design
- Experience with microcontrollers and embedded systems

Preferred Skills:
- Experience with RF/wireless design
- Knowledge of signal integrity and EMC
- Familiarity with manufacturing processes`,
        salary: "$90,000 - $120,000",
        applicationUrl: "https://nextgenelectronics.com/careers",
        postedBy: users[3]._id, // Michael Chen
        applicants: [users[7]._id], // Robert applied
      },
      {
        title: "DevOps Engineer",
        company: "CloudScale Solutions",
        location: "Remote",
        type: "Remote",
        description: `Join our DevOps team to help build and maintain scalable cloud infrastructure for our clients.

Key Responsibilities:
- Design and implement CI/CD pipelines
- Manage cloud infrastructure on AWS/Azure/GCP
- Automate deployment and monitoring processes
- Ensure system reliability and performance
- Collaborate with development teams on infrastructure needs`,
        requirements: `Required Skills:
- 3+ years of DevOps/SRE experience
- Proficiency with cloud platforms (AWS, Azure, or GCP)
- Experience with containerization (Docker, Kubernetes)
- Knowledge of Infrastructure as Code (Terraform, CloudFormation)
- Scripting skills (Python, Bash, PowerShell)

Preferred Skills:
- Experience with monitoring tools (Prometheus, Grafana)
- Knowledge of security best practices
- Certification in cloud platforms`,
        salary: "$100,000 - $140,000",
        applicationEmail: "devops@cloudscale.com",
        postedBy: users[9]._id, // Alex Kumar
        applicants: [users[1]._id, users[3]._id], // John and Michael applied
      },
      {
        title: "Research Scientist - Biotechnology",
        company: "BioInnovate Labs",
        location: "Boston, MA",
        type: "Full-time",
        description: `We are looking for a Research Scientist to join our biotechnology research team working on breakthrough medical treatments.

Key Responsibilities:
- Conduct research in molecular biology and biotechnology
- Design and execute experiments
- Analyze and interpret research data
- Prepare research reports and publications
- Collaborate with cross-functional research teams`,
        requirements: `Required Qualifications:
- PhD in Biotechnology, Molecular Biology, or related field
- 2+ years of postdoctoral research experience
- Strong background in molecular biology techniques
- Experience with data analysis and statistical software
- Excellent written and verbal communication skills

Preferred Qualifications:
- Experience in drug discovery or development
- Knowledge of regulatory requirements (FDA, EMA)
- Publication record in peer-reviewed journals`,
        salary: "$85,000 - $110,000",
        applicationUrl: "https://bioinnovatelabs.com/careers",
        postedBy: users[6]._id, // Lisa Thompson
        applicants: [],
      },
    ]
  

    const createdJobs = await Job.insertMany(jobs)
    console.log(`✅ Created ${createdJobs.length} job listings`)
    return createdJobs
  
  } catch (error) {
    console.error("Error seeding jobs:", error)
  }
}

const seedEvents = async (users) => {
  try {
    // Clear existing events
    await Event.deleteMany({})

    const events = [
      {
        title: "Annual Alumni Networking Meetup",
        description: `Join us for our annual networking meetup where alumni from all batches come together to share experiences, build connections, and explore collaboration opportunities.

Event Highlights:
- Keynote speech by successful alumni
- Networking sessions by industry
- Panel discussions on career growth
- Refreshments and dinner
- Awards ceremony for outstanding achievements

This is a great opportunity to reconnect with old friends and make new professional connections!`,
        date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        location: "Grand Ballroom, Marriott Hotel, Downtown",
        maxAttendees: 200,
        createdBy: users[0]._id, // Admin
        rsvps: [users[1]._id, users[2]._id, users[3]._id, users[4]._id, users[5]._id],
      },
      {
        title: "Tech Talk: Future of AI and Machine Learning",
        description: `Join us for an exciting tech talk about the future of AI and Machine Learning. Our panel of expert alumni will discuss the latest trends, challenges, and opportunities in the field.

Topics to be covered:
- Current state of AI/ML technology
- Emerging trends and future predictions
- Career opportunities in AI/ML
- Ethical considerations in AI development
- Q&A session with the panel

Perfect for both beginners and experienced professionals!`,
        date: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 days from now
        location: "Virtual Event (Zoom link will be provided)",
        maxAttendees: 100,
        createdBy: users[1]._id, // John Smith
        rsvps: [users[2]._id, users[9]._id, users[0]._id],
      },
      {
        title: "Alumni Startup Pitch Competition",
        description: `Calling all entrepreneur alumni! Present your startup ideas to a panel of investors and successful alumni entrepreneurs.

Competition Details:
- 5-minute pitch presentations
- Q&A session with judges
- Networking with investors and mentors
- Cash prizes for top 3 startups
- Mentorship opportunities for all participants

Whether you're just starting out or looking for your next round of funding, this is the perfect platform to showcase your innovation!`,
        date: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000), // 45 days from now
        location: "Innovation Center, Tech Campus",
        maxAttendees: 50,
        createdBy: users[2]._id, // Sarah Johnson
        rsvps: [users[9]._id, users[1]._id],
      },
      {
        title: "Career Mentorship Workshop",
        description: `A workshop designed to connect recent graduates with experienced alumni for career guidance and mentorship.

Workshop Agenda:
- Speed mentoring sessions
- Resume review and feedback
- Interview preparation tips
- Industry-specific career paths discussion
- Building your professional network

Ideal for recent graduates and early-career professionals looking for guidance and direction.`,
        date: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000), // 20 days from now
        location: "University Alumni Center",
        maxAttendees: 75,
        createdBy: users[4]._id, // Emily Rodriguez
        rsvps: [users[6]._id, users[9]._id, users[8]._id],
      },
      {
        title: "Alumni Golf Tournament",
        description: `Join fellow alumni for a day of golf, networking, and fun! All skill levels welcome.

Event Details:
- 18-hole tournament format
- Breakfast and lunch included
- Prizes for various categories
- Networking reception after the tournament
- Professional golf instruction available

A perfect opportunity to network in a relaxed, outdoor setting while enjoying a great game of golf!`,
        date: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days from now
        location: "Pebble Beach Golf Course",
        maxAttendees: 40,
        createdBy: users[5]._id, // David Wilson
        rsvps: [users[3]._id, users[7]._id],
      },
    ]

    const createdEvents = await Event.insertMany(events)
    console.log(`✅ Created ${createdEvents.length} events`)
    return createdEvents
  } catch (error) {
    console.error("Error seeding events:", error)
  }
}

const seedStories = async (users) => {
  try {
    // Clear existing stories
    await Story.deleteMany({})

    const stories = [
      {
        title: "From Student to Tech Lead: My Journey at Google",
        content: `When I graduated in 2018, I never imagined I would be leading a team of 15 engineers at Google just 6 years later. My journey has been filled with challenges, learning opportunities, and incredible growth.

**The Early Days**
Fresh out of college, I started as a junior developer at a small startup. The learning curve was steep, but I was passionate about coding and eager to make an impact. I spent countless hours learning new technologies, contributing to open-source projects, and building side projects.

**The Breakthrough**
After two years at the startup, I felt ready for a bigger challenge. I applied to several tech companies and was fortunate to receive an offer from Google. The interview process was intense, but all the preparation and hard work paid off.

**Growth at Google**
At Google, I was exposed to large-scale systems and cutting-edge technologies. I worked on projects that impacted millions of users worldwide. The mentorship I received from senior engineers was invaluable, and I made sure to pay it forward by mentoring new hires.

**Leadership Opportunities**
After proving myself as an individual contributor, I was given the opportunity to lead a small team. This transition from engineer to engineering manager was challenging but rewarding. I learned the importance of communication, empathy, and strategic thinking.

**Key Lessons Learned**
1. Never stop learning - Technology evolves rapidly
2. Build strong relationships - Your network is your net worth
3. Take calculated risks - Growth happens outside your comfort zone
4. Give back to the community - Mentoring others is incredibly fulfilling

**Advice for Fellow Alumni**
Don't be afraid to dream big and work towards your goals. The skills and foundation you built during your studies are just the beginning. Stay curious, be persistent, and always be willing to help others along the way.

The alumni network has been instrumental in my success, and I'm always happy to connect with fellow graduates who are looking for guidance or opportunities.`,
        submittedBy: users[1]._id, // John Smith
        likes: [users[2]._id, users[3]._id, users[9]._id, users[0]._id],
        image: "/placeholder.svg?height=400&width=600",
      },
      {
        title: "Building a Sustainable Future: My Work at Tesla",
        content: `As a mechanical engineer working at Tesla, I have the privilege of contributing to the sustainable transportation revolution. Every day, I work on technologies that are helping to reduce our carbon footprint and create a cleaner future for generations to come.

**Why Tesla?**
After graduating in 2020, I was passionate about applying my engineering skills to solve real-world problems. Climate change and environmental sustainability were issues I cared deeply about, and Tesla's mission aligned perfectly with my values.

**The Interview Process**
Getting into Tesla was competitive. The interview process tested not only my technical knowledge but also my problem-solving abilities and cultural fit. I had to demonstrate my passion for sustainable technology and my ability to work in a fast-paced, innovative environment.

**My Role and Responsibilities**
As a mechanical engineer at Tesla, I work on various aspects of vehicle design and manufacturing:
- Thermal management systems for batteries
- Structural optimization for weight reduction
- Manufacturing process improvements
- Quality assurance and testing protocols

**Challenges and Learning**
Working at Tesla has pushed me to think differently about engineering problems. The pace is intense, and the standards are incredibly high. I've learned to:
- Iterate quickly and fail fast
- Think holistically about system integration
- Balance performance, cost, and sustainability
- Collaborate effectively with cross-functional teams

**Impact and Fulfillment**
Knowing that my work directly contributes to reducing greenhouse gas emissions gives me immense satisfaction. Every vehicle that rolls off the production line represents a step towards a more sustainable future.

**The Tesla Culture**
Tesla's culture is unique - it's mission-driven, fast-paced, and innovation-focused. Everyone is encouraged to think like an owner and contribute ideas for improvement. The learning opportunities are endless.

**Advice for Aspiring Engineers**
1. Follow your passion - Work on problems you care about
2. Embrace challenges - They lead to the most growth
3. Stay updated with technology - The field evolves rapidly
4. Network actively - Your alumni connections can open doors
5. Think about impact - Consider how your work affects the world

**Looking Forward**
I'm excited about the future of sustainable technology and Tesla's role in it. From autonomous driving to energy storage solutions, there are countless opportunities to make a positive impact.

To my fellow alumni: if you're passionate about sustainability and engineering excellence, I encourage you to explore opportunities in the clean energy sector. The future is bright, and we need talented engineers to build it!`,
        submittedBy: users[4]._id, // Emily Rodriguez
        likes: [users[1]._id, users[3]._id, users[5]._id, users[7]._id, users[0]._id],
        image: "/placeholder.svg?height=400&width=600",
      },
      {
        title: "From Code to Leadership: My Product Management Journey",
        content: `Transitioning from a software engineer to a product manager was one of the best career decisions I've made. It allowed me to combine my technical background with my passion for solving user problems and driving business impact.

**The Transition**
After working as a software engineer for three years, I realized I was more interested in the "why" behind what we were building rather than just the "how." I wanted to understand user needs, market dynamics, and business strategy.

**Learning Product Management**
The transition wasn't easy. I had to develop new skills:
- User research and data analysis
- Market research and competitive analysis
- Stakeholder management and communication
- Strategic thinking and prioritization
- Cross-functional collaboration

**My Current Role at Microsoft**
As a Senior Product Manager at Microsoft, I lead the development of AI-powered productivity tools. My engineering background gives me credibility with development teams and helps me make better technical trade-offs.

**Key Achievements**
- Launched a feature that increased user engagement by 40%
- Led a cross-functional team of 20+ people
- Drove $10M+ in annual recurring revenue
- Established product-market fit for a new product line

**Skills That Transfer from Engineering**
- Problem-solving and analytical thinking
- Understanding of technical constraints and possibilities
- Ability to communicate with engineering teams
- Data-driven decision making
- Systems thinking

**Advice for Engineers Considering PM**
1. Start by understanding your users better
2. Learn to speak the language of business
3. Develop your communication and presentation skills
4. Get involved in product decisions at your current role
5. Build relationships across different functions

**The Alumni Network Advantage**
The alumni network has been invaluable in my career transition. Fellow alumni provided mentorship, referrals, and insights that helped me navigate the change successfully.

Product management is a rewarding career path that allows you to have significant impact on both users and business outcomes. If you're considering this transition, I'm happy to share more insights and help you on your journey!`,
        submittedBy: users[2]._id, // Sarah Johnson
        likes: [users[1]._id, users[4]._id, users[9]._id],
        image: "/placeholder.svg?height=400&width=600",
      },
      {
        title: "Breaking into Biotech: A Recent Graduate's Success Story",
        content: `Landing my dream job at Moderna as a Research Scientist straight out of graduate school was the culmination of years of hard work, strategic planning, and leveraging the power of our alumni network.

**The Academic Foundation**
During my undergraduate studies in Biotechnology, I focused on building a strong foundation in molecular biology, biochemistry, and research methodologies. I actively participated in research projects and published two papers before graduation.

**Graduate School Journey**
I pursued my PhD with a focus on mRNA technology and vaccine development. Little did I know that this specialization would become incredibly relevant during the COVID-19 pandemic.

**Research Experience**
My doctoral research focused on:
- mRNA stability and delivery mechanisms
- Vaccine efficacy testing in animal models
- Protein expression optimization
- Immunological response analysis

**The Job Search Strategy**
1. **Networking**: I actively engaged with alumni working in biotech
2. **Publications**: Maintained a strong publication record
3. **Conferences**: Presented research at major scientific conferences
4. **Industry Connections**: Completed internships at biotech companies

**Landing the Role at Moderna**
The opportunity at Moderna came through an alumni connection who saw my research presentation at a conference. The interview process was rigorous, involving:
- Technical presentations of my research
- Problem-solving case studies
- Cultural fit assessments
- Multiple rounds with different teams

**Current Work and Impact**
At Moderna, I work on next-generation vaccine platforms. My research contributes to:
- Developing vaccines for emerging infectious diseases
- Improving vaccine stability and storage
- Enhancing immune response profiles
- Reducing manufacturing costs

**Challenges in Biotech**
- Long development timelines
- Regulatory complexity
- High failure rates
- Intense competition
- Ethical considerations

**The Rewards**
Despite the challenges, working in biotech is incredibly fulfilling:
- Direct impact on human health
- Cutting-edge scientific research
- Collaborative environment
- Continuous learning opportunities
- Potential to save lives

**Advice for Aspiring Biotech Professionals**
1. **Build Strong Fundamentals**: Master the core sciences
2. **Gain Research Experience**: Publish and present your work
3. **Network Actively**: Leverage alumni connections
4. **Stay Current**: Follow industry trends and breakthroughs
5. **Be Persistent**: The field is competitive but rewarding

**The Role of Alumni Network**
The alumni network has been instrumental in my success:
- Provided industry insights and trends
- Offered mentorship and career guidance
- Connected me with job opportunities
- Shared experiences and lessons learned

**Looking Ahead**
The future of biotechnology is incredibly exciting. From personalized medicine to gene therapy, there are countless opportunities to make a meaningful impact on human health.

To fellow alumni interested in biotech: the field needs talented, passionate individuals. Don't hesitate to reach out if you'd like to learn more about opportunities in this space!`,
        submittedBy: users[6]._id, // Lisa Thompson
        likes: [users[0]._id, users[2]._id, users[4]._id, users[8]._id],
        image: "/placeholder.svg?height=400&width=600",
      },
    ]

    const createdStories = await Story.insertMany(stories)
    console.log(`✅ Created ${createdStories.length} success stories`)
    return createdStories
  } catch (error) {
    console.error("Error seeding stories:", error)
  }
}

const seedDonations = async (users) => {
  try {
    // Clear existing donations
    await Donation.deleteMany({})

    const donations = [
      {
        donor: users[1]._id, // John Smith
        amount: 500,
        message: "Happy to support the next generation of engineers!",
        anonymous: false,
        transactionId: "txn_001_john_smith",
        status: "completed",
        processedAt: new Date(),
      },
      {
        donor: users[2]._id, // Sarah Johnson
        amount: 1000,
        message: "Investing in the future of our alma mater. Go team!",
        anonymous: false,
        transactionId: "txn_002_sarah_johnson",
        status: "completed",
        processedAt: new Date(),
      },
      {
        donor: users[3]._id, // Michael Chen
        amount: 250,
        message: "",
        anonymous: true,
        transactionId: "txn_003_michael_chen",
        status: "completed",
        processedAt: new Date(),
      },
      {
        donor: users[4]._id, // Emily Rodriguez
        amount: 750,
        message: "For scholarships and student support programs.",
        anonymous: false,
        transactionId: "txn_004_emily_rodriguez",
        status: "completed",
        processedAt: new Date(),
      },
      {
        donor: users[5]._id, // David Wilson
        amount: 300,
        message: "Proud to give back to the institution that shaped my career.",
        anonymous: false,
        transactionId: "txn_005_david_wilson",
        status: "completed",
        processedAt: new Date(),
      },
      {
        donor: users[6]._id, // Lisa Thompson
        amount: 2000,
        message: "Supporting research and innovation in biotechnology.",
        anonymous: false,
        transactionId: "txn_006_lisa_thompson",
        status: "completed",
        processedAt: new Date(),
      },
      {
        donor: users[7]._id, // Robert Garcia
        amount: 400,
        message: "",
        anonymous: true,
        transactionId: "txn_007_robert_garcia",
        status: "completed",
        processedAt: new Date(),
      },
      {
        donor: users[8]._id, // Jennifer Lee
        amount: 600,
        message: "For the engineering scholarship fund.",
        anonymous: false,
        transactionId: "txn_008_jennifer_lee",
        status: "completed",
        processedAt: new Date(),
      },
    ]

    const createdDonations = await Donation.insertMany(donations)
    console.log(`✅ Created ${createdDonations.length} donations`)
    return createdDonations
  } catch (error) {
    console.error("Error seeding donations:", error)
  }
}

const seedDatabase = async () => {
  try {
    console.log("🌱 Starting database seeding...")

    await connectDB()

    const users = await seedUsers()
    const jobs = await seedJobs(users)
    const events = await seedEvents(users)
    const stories = await seedStories(users)
    const donations = await seedDonations(users)

    console.log("\n🎉 Database seeding completed successfully!")
    console.log("\n📋 Summary:")
    console.log(`   Users: ${users?.length || 0}`)
    console.log(`   Jobs: ${jobs?.length || 0}`)
    console.log(`   Events: ${events?.length || 0}`)
    console.log(`   Stories: ${stories?.length || 0}`)
    console.log(`   Donations: ${donations?.length || 0}`)

    console.log("\n🔑 Admin Login Credentials:");
    console.log("   Email: arvindgautam7048@gmail.com");
    console.log("   Password: Arvi@7048");

    console.log("\n👤 Test User Credentials:");
    console.log("   Email: john.smith@email.com");
    console.log("   Password: password123");
    console.log("   (All test users use 'password123' as password)");

    process.exit(0)
  } catch (error) {
    console.error("❌ Error seeding database:", error)
    process.exit(1)
  }
}

// Run the seeding function
seedDatabase()
