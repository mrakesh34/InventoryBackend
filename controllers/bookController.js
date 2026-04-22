const Book = require('../models/Book');
const { logStockActivity } = require('./stockActivityController');

// ── Shared gallery image sets (Unsplash) ─────────────────────────────────────
const G = {
    python: ['https://images.unsplash.com/photo-1526379095098-d400fd0bf935?w=600&fit=crop', 'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?w=600&fit=crop'],
    js: ['https://images.unsplash.com/photo-1555099962-4199c345e5dd?w=600&fit=crop', 'https://images.unsplash.com/photo-1579468118864-1b9ea3c0db4a?w=600&fit=crop'],
    java: ['https://images.unsplash.com/photo-1588239034647-25783cbfcfc1?w=600&fit=crop', 'https://images.unsplash.com/photo-1516116216624-53e697fedbea?w=600&fit=crop'],
    cpp: ['https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=600&fit=crop', 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=600&fit=crop'],
    systems: ['https://images.unsplash.com/photo-1542831371-29b0f74f9713?w=600&fit=crop', 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&fit=crop'],
    ai: ['https://images.unsplash.com/photo-1677442135703-1787eea5ce01?w=600&fit=crop', 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=600&fit=crop'],
    webdev: ['https://images.unsplash.com/photo-1547658719-da2b51169166?w=600&fit=crop', 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=600&fit=crop'],
    cleancode: ['https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=600&fit=crop', 'https://images.unsplash.com/photo-1504639725590-34d0984388bd?w=600&fit=crop'],
    algo: ['https://images.unsplash.com/photo-1580894894513-541e068a3e2b?w=600&fit=crop', 'https://images.unsplash.com/photo-1587620962725-abab7fe55159?w=600&fit=crop'],
    db: ['https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=600&fit=crop', 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=600&fit=crop'],
    devops: ['https://images.unsplash.com/photo-1667372393119-3d4c48d07fc9?w=600&fit=crop', 'https://images.unsplash.com/photo-1624953587687-daf255b6b80a?w=600&fit=crop'],
};

// ── ISBN cover helper ─────────────────────────────────────────────────────────
const cover = (isbn) => `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg`;

// ── 50 Coding & AI Seed Books ────────────────────────────────────────────────
const dummyBooks = [
    // ── Python ────────────────────────────────────────────────────────────────
    {
        bookTitle: "Python Crash Course, 3rd Edition",
        authorName: "Eric Matthes",
        imageURL: cover('9781718502703'),
        galleryImages: G.python,
        tags: ['python'],
        category: "Programming",
        bookDescription: "A hands-on, project-based introduction to Python. Covers the basics fast and then moves into three real-world projects: a game, a data visualization, and a web app.",
        bookPDFURL: "https://example.com/python-crash-course.pdf",
        price: 29.99, rating: 4.8, stock: 50
    },
    {
        bookTitle: "Automate the Boring Stuff with Python",
        authorName: "Al Sweigart",
        imageURL: cover('9781593279929'),
        galleryImages: G.python,
        tags: ['python'],
        category: "Programming",
        bookDescription: "Learn how to use Python to write programs that do in minutes what would take you hours to do by hand — automating tasks like updating spreadsheets, renaming files, and scraping the web.",
        bookPDFURL: "https://automatetheboringstuff.com/",
        price: 24.99, rating: 4.7, stock: 40
    },
    {
        bookTitle: "Fluent Python, 2nd Edition",
        authorName: "Luciano Ramalho",
        imageURL: cover('9781492056355'),
        galleryImages: G.python,
        tags: ['python'],
        category: "Programming",
        bookDescription: "A deep dive into Python's core language features and libraries. Helps experienced programmers become truly proficient by teaching idiomatic Python patterns, data models, and concurrency.",
        bookPDFURL: "https://example.com/fluent-python.pdf",
        price: 49.99, rating: 4.9, stock: 30
    },
    {
        bookTitle: "Python for Data Analysis, 3rd Edition",
        authorName: "Wes McKinney",
        imageURL: cover('9781098104030'),
        galleryImages: [...G.python, ...G.ai].slice(0, 2),
        tags: ['python', 'ai-ml'],
        category: "Science",
        bookDescription: "The definitive guide to data manipulation with Python by the creator of pandas. Covers NumPy, pandas, Matplotlib, and Jupyter Notebooks for data wrangling and analysis.",
        bookPDFURL: "https://example.com/python-data-analysis.pdf",
        price: 44.99, rating: 4.7, stock: 35
    },
    {
        bookTitle: "Learning Python, 5th Edition",
        authorName: "Mark Lutz",
        imageURL: cover('9781449355739'),
        galleryImages: G.python,
        tags: ['python'],
        category: "Programming",
        bookDescription: "The most comprehensive guide to the Python language. Covers everything from basic syntax to OOP, decorators, generators, and metaclasses with thousands of exercises.",
        bookPDFURL: "https://example.com/learning-python.pdf",
        price: 54.99, rating: 4.5, stock: 28
    },
    // ── JavaScript ────────────────────────────────────────────────────────────
    {
        bookTitle: "You Don't Know JS Yet: Get Started",
        authorName: "Kyle Simpson",
        imageURL: cover('9781492086383'),
        galleryImages: G.js,
        tags: ['javascript'],
        category: "Programming",
        bookDescription: "The modern update to the acclaimed YDKJS series. Explores JavaScript's scope, closures, prototypes and async patterns with depth rarely found in introductory books.",
        bookPDFURL: "https://github.com/getify/You-Dont-Know-JS",
        price: 19.99, rating: 4.8, stock: 45
    },
    {
        bookTitle: "JavaScript: The Good Parts",
        authorName: "Douglas Crockford",
        imageURL: cover('9780596517748'),
        galleryImages: G.js,
        tags: ['javascript'],
        category: "Programming",
        bookDescription: "An authoritative guide to the good parts of JavaScript — the features that help you write elegant, reliable and maintainable code while avoiding the bad parts.",
        bookPDFURL: "https://example.com/js-good-parts.pdf",
        price: 24.99, rating: 4.5, stock: 28
    },
    {
        bookTitle: "Eloquent JavaScript, 4th Edition",
        authorName: "Marijn Haverbeke",
        imageURL: cover('9781718503106'),
        galleryImages: G.js,
        tags: ['javascript'],
        category: "Programming",
        bookDescription: "A modern introduction to programming using JavaScript as the language, covering functions, objects, closures, OOP, the browser DOM, and Node.js with challenging exercises.",
        bookPDFURL: "https://eloquentjavascript.net/",
        price: 22.99, rating: 4.7, stock: 38
    },
    {
        bookTitle: "Programming TypeScript",
        authorName: "Boris Cherny",
        imageURL: cover('9781492037651'),
        galleryImages: G.js,
        tags: ['javascript', 'typescript'],
        category: "Programming",
        bookDescription: "A thorough guide to TypeScript covering the type system, generics, async programming, and how TypeScript improves large-scale JavaScript codebases at companies like Airbnb and Lyft.",
        bookPDFURL: "https://example.com/programming-typescript.pdf",
        price: 34.99, rating: 4.6, stock: 22
    },
    {
        bookTitle: "Learning React, 2nd Edition",
        authorName: "Alex Banks & Eve Porcello",
        imageURL: cover('9781492051725'),
        galleryImages: G.webdev,
        tags: ['javascript', 'web-dev'],
        category: "Programming",
        bookDescription: "A practical guide to building user interfaces with React 18. Covers hooks, context, concurrent features, testing, and modern patterns used in production applications.",
        bookPDFURL: "https://example.com/learning-react.pdf",
        price: 32.99, rating: 4.6, stock: 46
    },
    // ── Java ──────────────────────────────────────────────────────────────────
    {
        bookTitle: "Effective Java, 3rd Edition",
        authorName: "Joshua Bloch",
        imageURL: cover('9780134685991'),
        galleryImages: G.java,
        tags: ['java'],
        category: "Programming",
        bookDescription: "The definitive guide to Java best practices, recommended by Google engineers. Covers 90 concrete and specific items for writing clear, robust, and efficient Java code.",
        bookPDFURL: "https://example.com/effective-java.pdf",
        price: 39.99, rating: 4.9, stock: 60
    },
    {
        bookTitle: "Head First Java, 3rd Edition",
        authorName: "Kathy Sierra & Bert Bates",
        imageURL: cover('9781491910771'),
        galleryImages: G.java,
        tags: ['java'],
        category: "Programming",
        bookDescription: "A learner-friendly book that uses visuals, puzzles, and exercises to teach Java OOP in an engaging, brain-friendly way. Now updated for Java 17.",
        bookPDFURL: "https://example.com/head-first-java.pdf",
        price: 44.99, rating: 4.6, stock: 42
    },
    {
        bookTitle: "Java: The Complete Reference, 13th Edition",
        authorName: "Herbert Schildt",
        imageURL: cover('9781260463552'),
        galleryImages: G.java,
        tags: ['java'],
        category: "Programming",
        bookDescription: "The definitive guide to Java, fully covering Java 17. Covers every aspect of the language including syntax, the JDK, Swing, JavaFX, servlets, and lambda expressions.",
        bookPDFURL: "https://example.com/java-complete-reference.pdf",
        price: 59.99, rating: 4.6, stock: 25
    },
    {
        bookTitle: "Spring Boot in Action",
        authorName: "Craig Walls",
        imageURL: cover('9781617292545'),
        galleryImages: G.java,
        tags: ['java', 'web-dev'],
        category: "Programming",
        bookDescription: "A focused guide to Spring Boot — the framework that makes configuring and building Spring applications faster and easier, covering REST APIs, data access, and security.",
        bookPDFURL: "https://example.com/spring-boot-in-action.pdf",
        price: 39.99, rating: 4.5, stock: 20
    },
    // ── C++ ───────────────────────────────────────────────────────────────────
    {
        bookTitle: "The C++ Programming Language, 4th Edition",
        authorName: "Bjarne Stroustrup",
        imageURL: cover('9780321563842'),
        galleryImages: G.cpp,
        tags: ['cpp'],
        category: "Programming",
        bookDescription: "Written by the creator of C++, this is the definitive reference. Covers every feature in depth — from the basics to move semantics, lambdas, and the standard library.",
        bookPDFURL: "https://example.com/cpp-programming.pdf",
        price: 54.99, rating: 4.7, stock: 32
    },
    {
        bookTitle: "C++ Primer, 5th Edition",
        authorName: "Stanley B. Lippman, Josée Lajoie & Barbara E. Moo",
        imageURL: cover('9780321714114'),
        galleryImages: G.cpp,
        tags: ['cpp'],
        category: "Programming",
        bookDescription: "The most popular introduction to modern C++11. Covers the core language and standard library thoroughly with hundreds of progressively difficult exercises.",
        bookPDFURL: "https://example.com/cpp-primer.pdf",
        price: 49.99, rating: 4.8, stock: 20
    },
    {
        bookTitle: "Effective Modern C++",
        authorName: "Scott Meyers",
        imageURL: cover('9781491903995'),
        galleryImages: G.cpp,
        tags: ['cpp'],
        category: "Programming",
        bookDescription: "42 specific ways to improve your use of C++11 and C++14. Covers move semantics, lambdas, smart pointers, concurrency, and the most important modern C++ features.",
        bookPDFURL: "https://example.com/effective-modern-cpp.pdf",
        price: 47.99, rating: 4.8, stock: 15
    },
    // ── C ─────────────────────────────────────────────────────────────────────
    {
        bookTitle: "The C Programming Language, 2nd Edition",
        authorName: "Brian W. Kernighan & Dennis M. Ritchie",
        imageURL: cover('9780131103627'),
        galleryImages: G.cpp,
        tags: ['c', 'cpp'],
        category: "Programming",
        bookDescription: "The original book on C, written by the language's creators. Still the authoritative reference for C — concise, precise, and full of elegant examples. A classic of computer science.",
        bookPDFURL: "https://example.com/c-programming-language.pdf",
        price: 39.99, rating: 4.9, stock: 55
    },
    // ── Go ────────────────────────────────────────────────────────────────────
    {
        bookTitle: "The Go Programming Language",
        authorName: "Alan A. A. Donovan & Brian W. Kernighan",
        imageURL: cover('9780134190440'),
        galleryImages: G.systems,
        tags: ['go'],
        category: "Programming",
        bookDescription: "The authoritative guide to Go, co-authored by the legendary Brian Kernighan. Covers all essential features and idioms of the Go language  with real-world examples and exercises.",
        bookPDFURL: "https://example.com/go-programming.pdf",
        price: 44.99, rating: 4.8, stock: 30
    },
    {
        bookTitle: "Go in Action",
        authorName: "William Kennedy, Brian Ketelsen & Erik St. Martin",
        imageURL: cover('9781617291784'),
        galleryImages: G.systems,
        tags: ['go'],
        category: "Programming",
        bookDescription: "A practical guide to Go that covers the language specification and standard library with real-world techniques for developing concurrent and networked applications.",
        bookPDFURL: "https://example.com/go-in-action.pdf",
        price: 37.99, rating: 4.7, stock: 18
    },
    // ── Rust ──────────────────────────────────────────────────────────────────
    {
        bookTitle: "The Rust Programming Language, 2nd Edition",
        authorName: "Steve Klabnik & Carol Nichols",
        imageURL: cover('9781718503106'),
        galleryImages: G.systems,
        tags: ['rust'],
        category: "Programming",
        bookDescription: "The official guide to Rust from the core team. Covers ownership, borrowing, lifetimes, concurrency, and everything needed to write safe, fast system-level code.",
        bookPDFURL: "https://doc.rust-lang.org/book/",
        price: 39.99, rating: 4.9, stock: 27
    },
    {
        bookTitle: "Programming Rust, 2nd Edition",
        authorName: "Jim Blandy, Jason Orendorff & Leonora F.S. Tindall",
        imageURL: cover('9781492052548'),
        galleryImages: G.systems,
        tags: ['rust'],
        category: "Programming",
        bookDescription: "A deep exploration of Rust covering the ownership model, traits, generics, concurrency, and async programming for systems programmers who want performance and safety.",
        bookPDFURL: "https://example.com/programming-rust.pdf",
        price: 54.99, rating: 4.8, stock: 14
    },
    // ── SQL & Databases ───────────────────────────────────────────────────────
    {
        bookTitle: "Learning SQL, 3rd Edition",
        authorName: "Alan Beaulieu",
        imageURL: cover('9781492057611'),
        galleryImages: G.db,
        tags: ['sql', 'databases'],
        category: "Programming",
        bookDescription: "A comprehensive introduction to SQL for managing and querying relational databases. Covers all core SQL statements with practical examples using MySQL.",
        bookPDFURL: "https://example.com/learning-sql.pdf",
        price: 29.99, rating: 4.5, stock: 33
    },
    {
        bookTitle: "Designing Data-Intensive Applications",
        authorName: "Martin Kleppmann",
        imageURL: cover('9781449373320'),
        galleryImages: G.db,
        tags: ['databases', 'algorithms'],
        category: "Programming",
        bookDescription: "The must-read guide for engineers building scalable, reliable and maintainable data systems. Covers databases, distributed systems, stream processing, and consistency models.",
        bookPDFURL: "https://example.com/ddia.pdf",
        price: 59.99, rating: 4.9, stock: 40
    },
    // ── Web & Full-Stack ──────────────────────────────────────────────────────
    {
        bookTitle: "Node.js Design Patterns, 3rd Edition",
        authorName: "Mario Casciaro & Luciano Mammino",
        imageURL: cover('9781839214110'),
        galleryImages: G.webdev,
        tags: ['web-dev', 'javascript'],
        category: "Programming",
        bookDescription: "Best practices for Node.js in production. Covers streams, async patterns, microservices, messaging systems and deploying Node.js applications at scale.",
        bookPDFURL: "https://example.com/nodejs-design-patterns.pdf",
        price: 39.99, rating: 4.7, stock: 22
    },
    {
        bookTitle: "Full-Stack React, TypeScript, and Node",
        authorName: "David Choi",
        imageURL: cover('9781839219931'),
        galleryImages: G.webdev,
        tags: ['web-dev', 'javascript', 'typescript'],
        category: "Programming",
        bookDescription: "Build cloud-ready web applications using React 17 with Hooks, TypeScript, and Node.js. Covers full-stack development from authentication to GraphQL APIs.",
        bookPDFURL: "https://example.com/fullstack-react-ts-node.pdf",
        price: 42.99, rating: 4.5, stock: 16
    },
    {
        bookTitle: "Django for Professionals",
        authorName: "William S. Vincent",
        imageURL: cover('9781735467221'),
        galleryImages: [...G.python, ...G.webdev].slice(0, 2),
        tags: ['python', 'web-dev'],
        category: "Programming",
        bookDescription: "Build production-ready Django web applications. Covers custom user models, unit testing, PostgreSQL, Docker, environment variables, and security best practices.",
        bookPDFURL: "https://example.com/django-professionals.pdf",
        price: 34.99, rating: 4.6, stock: 19
    },
    // ── Clean Code & Architecture ─────────────────────────────────────────────
    {
        bookTitle: "Clean Code: A Handbook of Agile Software Craftsmanship",
        authorName: "Robert C. Martin",
        imageURL: cover('9780132350884'),
        galleryImages: G.cleancode,
        tags: ['clean-code'],
        category: "Programming",
        bookDescription: "A handbook of agile software craftsmanship that teaches you how to write code that is clean, readable and maintainable — a must-read for every professional developer.",
        bookPDFURL: "https://example.com/clean-code.pdf",
        price: 34.99, rating: 4.8, stock: 70
    },
    {
        bookTitle: "The Pragmatic Programmer, 20th Anniversary Edition",
        authorName: "David Thomas & Andrew Hunt",
        imageURL: cover('9780135957059'),
        galleryImages: G.cleancode,
        tags: ['clean-code'],
        category: "Programming",
        bookDescription: "A timeless guide to building great software — covering personal responsibility, career development, architecture, and programming techniques that make you a better developer.",
        bookPDFURL: "https://example.com/pragmatic-programmer.pdf",
        price: 37.99, rating: 4.9, stock: 58
    },
    {
        bookTitle: "Design Patterns: Elements of Reusable Object-Oriented Software",
        authorName: "Gang of Four (GoF)",
        imageURL: cover('9780201633610'),
        galleryImages: G.cleancode,
        tags: ['clean-code', 'java'],
        category: "Programming",
        bookDescription: "The classic 'Gang of Four' book cataloguing 23 design patterns that solve recurring software design problems, organised into creational, structural, and behavioural categories.",
        bookPDFURL: "https://example.com/design-patterns.pdf",
        price: 44.99, rating: 4.7, stock: 36
    },
    {
        bookTitle: "Refactoring: Improving the Design of Existing Code, 2nd Edition",
        authorName: "Martin Fowler",
        imageURL: cover('9780134757599'),
        galleryImages: G.cleancode,
        tags: ['clean-code'],
        category: "Programming",
        bookDescription: "The essential guide to refactoring code safely and effectively. Covers 66 refactoring techniques with practical advice on when and how to apply them, updated for modern languages.",
        bookPDFURL: "https://example.com/refactoring.pdf",
        price: 39.99, rating: 4.8, stock: 28
    },
    {
        bookTitle: "A Philosophy of Software Design, 2nd Edition",
        authorName: "John Ousterhout",
        imageURL: cover('9781732102217'),
        galleryImages: G.cleancode,
        tags: ['clean-code'],
        category: "Programming",
        bookDescription: "A comprehensive approach to software design focusing on managing complexity. Covers module design, abstraction, error handling, and naming conventions with clear principles.",
        bookPDFURL: "https://example.com/philosophy-software-design.pdf",
        price: 29.99, rating: 4.7, stock: 22
    },
    // ── Data Structures & Algorithms ──────────────────────────────────────────
    {
        bookTitle: "Introduction to Algorithms (CLRS), 4th Edition",
        authorName: "Cormen, Leiserson, Rivest & Stein",
        imageURL: cover('9780262046305'),
        galleryImages: G.algo,
        tags: ['algorithms'],
        category: "Programming",
        bookDescription: "The gold-standard algorithms textbook. Covers a broad range of algorithms and data structures with rigorous mathematical analysis, used in CS courses worldwide.",
        bookPDFURL: "https://example.com/clrs.pdf",
        price: 79.99, rating: 4.8, stock: 44
    },
    {
        bookTitle: "Cracking the Coding Interview, 6th Edition",
        authorName: "Gayle Laakmann McDowell",
        imageURL: cover('9780984782857'),
        galleryImages: G.algo,
        tags: ['algorithms'],
        category: "Programming",
        bookDescription: "189 programming interview questions and fully-worked solutions. Essential preparation for software engineering interviews at top tech companies like Google, Meta and Amazon.",
        bookPDFURL: "https://example.com/cracking-coding-interview.pdf",
        price: 34.99, rating: 4.9, stock: 65
    },
    {
        bookTitle: "Grokking Algorithms, 2nd Edition",
        authorName: "Aditya Bhargava",
        imageURL: cover('9781617292231'),
        galleryImages: G.algo,
        tags: ['algorithms'],
        category: "Programming",
        bookDescription: "A fully illustrated, friendly guide to algorithms for beginners. Covers binary search, sorting, graphs, dynamic programming and more with memorable visuals and clear examples.",
        bookPDFURL: "https://example.com/grokking-algorithms.pdf",
        price: 29.99, rating: 4.8, stock: 50
    },
    {
        bookTitle: "The Algorithm Design Manual, 3rd Edition",
        authorName: "Steven S. Skiena",
        imageURL: cover('9783030542559'),
        galleryImages: G.algo,
        tags: ['algorithms'],
        category: "Programming",
        bookDescription: "A comprehensive guide to combinatorial algorithms and data structures. Combines rigorous theory with practical war stories from real-world algorithm applications.",
        bookPDFURL: "https://example.com/algorithm-design-manual.pdf",
        price: 59.99, rating: 4.7, stock: 20
    },
    // ── AI / Machine Learning ─────────────────────────────────────────────────
    {
        bookTitle: "Hands-On Machine Learning with Scikit-Learn, Keras & TensorFlow, 3rd Ed.",
        authorName: "Aurélien Géron",
        imageURL: cover('9781098125974'),
        galleryImages: G.ai,
        tags: ['ai-ml', 'python'],
        category: "Science",
        bookDescription: "The go-to practical guide for ML engineers. Covers supervised and unsupervised learning, neural networks, CNNs, RNNs, and deploying  models using popular Python libraries.",
        bookPDFURL: "https://example.com/hands-on-ml.pdf",
        price: 59.99, rating: 4.9, stock: 55
    },
    {
        bookTitle: "Deep Learning",
        authorName: "Ian Goodfellow, Yoshua Bengio & Aaron Courville",
        imageURL: cover('9780262035613'),
        galleryImages: G.ai,
        tags: ['ai-ml'],
        category: "Science",
        bookDescription: "The authoritative textbook on deep learning by three of the field's pioneers. Covers mathematical foundations, feedforward networks, CNNs, RNNs, and modern research topics.",
        bookPDFURL: "https://www.deeplearningbook.org/",
        price: 69.99, rating: 4.8, stock: 38
    },
    {
        bookTitle: "Artificial Intelligence: A Modern Approach, 4th Edition",
        authorName: "Stuart Russell & Peter Norvig",
        imageURL: cover('9780134610993'),
        galleryImages: G.ai,
        tags: ['ai-ml'],
        category: "Science",
        bookDescription: "The leading AI textbook used in universities worldwide. Covers intelligent agents, search, knowledge representation, planning, learning, perception, and robotics comprehensively.",
        bookPDFURL: "https://example.com/aima.pdf",
        price: 89.99, rating: 4.8, stock: 42
    },
    {
        bookTitle: "Python Machine Learning, 3rd Edition",
        authorName: "Sebastian Raschka & Vahid Mirjalili",
        imageURL: cover('9781789955750'),
        galleryImages: [...G.python, ...G.ai].slice(0, 2),
        tags: ['ai-ml', 'python'],
        category: "Science",
        bookDescription: "A comprehensive guide to machine learning and deep learning with Python. Covers classification, regression, text classification, and deep learning with TensorFlow 2 and PyTorch.",
        bookPDFURL: "https://example.com/python-ml.pdf",
        price: 44.99, rating: 4.7, stock: 30
    },
    {
        bookTitle: "Natural Language Processing with Python",
        authorName: "Steven Bird, Ewan Klein & Edward Loper",
        imageURL: cover('9780596516499'),
        galleryImages: G.ai,
        tags: ['ai-ml', 'python'],
        category: "Science",
        bookDescription: "A practical introduction to NLP using Python and the NLTK library. Covers tokenization, POS tagging, chunking, text classification, and building NLP applications.",
        bookPDFURL: "https://www.nltk.org/book/",
        price: 39.99, rating: 4.6, stock: 24
    },
    {
        bookTitle: "Generative Deep Learning, 2nd Edition",
        authorName: "David Foster",
        imageURL: cover('9781098134181'),
        galleryImages: G.ai,
        tags: ['ai-ml'],
        category: "Science",
        bookDescription: "Teaches practitioners how to build generative models — VAEs, GANs, Transformers, normalizing flows, energy-based models, and diffusion models — for images, music and text.",
        bookPDFURL: "https://example.com/generative-deep-learning.pdf",
        price: 54.99, rating: 4.7, stock: 18
    },
    {
        bookTitle: "Designing Machine Learning Systems",
        authorName: "Chip Huyen",
        imageURL: cover('9781098107963'),
        galleryImages: G.ai,
        tags: ['ai-ml'],
        category: "Science",
        bookDescription: "A holistic approach to designing production ML systems. Covers data engineering,  feature engineering, training, serving, monitoring, and ML infrastructure at scale.",
        bookPDFURL: "https://example.com/designing-ml-systems.pdf",
        price: 52.99, rating: 4.8, stock: 33
    },
    {
        bookTitle: "AI Engineering: Building Applications with Foundation Models",
        authorName: "Chip Huyen",
        imageURL: cover('9781098166298'),
        galleryImages: G.ai,
        tags: ['ai-ml'],
        category: "Science",
        bookDescription: "A comprehensive guide to building production applications on top of LLMs and diffusion models. Covers RAG, fine-tuning, agents, prompt engineering, evaluation, and deployment.",
        bookPDFURL: "https://example.com/ai-engineering.pdf",
        price: 55.99, rating: 4.9, stock: 47
    },
    {
        bookTitle: "Deep Learning for Coders with fastai & PyTorch",
        authorName: "Jeremy Howard & Sylvain Gugger",
        imageURL: cover('9781492045526'),
        galleryImages: [...G.python, ...G.ai].slice(0, 2),
        tags: ['ai-ml', 'python'],
        category: "Science",
        bookDescription: "A top-down practical guide to deep learning that gets coders building state-of-the-art models on day one, covering vision, NLP, tabular data and collaborative filtering with fastai.",
        bookPDFURL: "https://example.com/deep-learning-fastai.pdf",
        price: 49.99, rating: 4.8, stock: 29
    },
    {
        bookTitle: "Natural Language Processing with Transformers",
        authorName: "Lewis Tunstall, Leandro von Werra & Thomas Wolf",
        imageURL: cover('9781098103248'),
        galleryImages: G.ai,
        tags: ['ai-ml'],
        category: "Science",
        bookDescription: "A hands-on guide to building NLP applications with Transformers and Hugging Face. Covers BERT, GPT, T5, fine-tuning, text classification, summarization, and question answering.",
        bookPDFURL: "https://example.com/nlp-transformers.pdf",
        price: 52.99, rating: 4.9, stock: 44
    },
    {
        bookTitle: "The Hundred-Page Machine Learning Book",
        authorName: "Andriy Burkov",
        imageURL: cover('9781999579517'),
        galleryImages: G.ai,
        tags: ['ai-ml'],
        category: "Science",
        bookDescription: "A concise yet comprehensive introduction to ML — covers supervised and unsupervised learning, neural networks, ensemble methods and practical tips in under 150 pages.",
        bookPDFURL: "https://example.com/100-page-ml.pdf",
        price: 27.99, rating: 4.7, stock: 52
    },
    {
        bookTitle: "Mathematics for Machine Learning",
        authorName: "Marc Peter Deisenroth, A. Aldo Faisal & Cheng Soon Ong",
        imageURL: cover('9781108470049'),
        galleryImages: G.ai,
        tags: ['ai-ml'],
        category: "Science",
        bookDescription: "Covers the essential mathematical prerequisites for ML: linear algebra, multivariate calculus, probability, and statistics — with ML examples connecting math to real applications.",
        bookPDFURL: "https://mml-book.github.io/",
        price: 42.99, rating: 4.7, stock: 36
    },
    {
        bookTitle: "Reinforcement Learning: An Introduction, 2nd Edition",
        authorName: "Richard S. Sutton & Andrew G. Barto",
        imageURL: cover('9780262039246'),
        galleryImages: G.ai,
        tags: ['ai-ml'],
        category: "Science",
        bookDescription: "The standard reference for reinforcement learning. Covers Markov decision processes, temporal-difference learning, Q-learning, policy gradient methods and deep RL.",
        bookPDFURL: "http://incompleteideas.net/book/the-book.html",
        price: 57.99, rating: 4.8, stock: 21
    },
    // ── DevOps / Cloud ────────────────────────────────────────────────────────
    {
        bookTitle: "Docker: Up & Running, 3rd Edition",
        authorName: "Sean Kane & Karl Matthias",
        imageURL: cover('9781098131821'),
        galleryImages: G.devops,
        tags: ['devops'],
        category: "Programming",
        bookDescription: "A practical guide to shipping reliable and scalable software using Docker containers. Covers containerization, Docker Compose, security, multi-stage builds, and deploying to production.",
        bookPDFURL: "https://example.com/docker-up-running.pdf",
        price: 34.99, rating: 4.6, stock: 38
    },
    {
        bookTitle: "Kubernetes: Up & Running, 3rd Edition",
        authorName: "Brendan Burns, Joe Beda & Kelsey Hightower",
        imageURL: cover('9781098110208'),
        galleryImages: G.devops,
        tags: ['devops'],
        category: "Programming",
        bookDescription: "Written by Kubernetes creators, this guide covers deploying, managing and scaling containerized applications with Kubernetes across any cloud provider.",
        bookPDFURL: "https://example.com/kubernetes-up-running.pdf",
        price: 39.99, rating: 4.7, stock: 26
    },
    // ── Computer Science Fundamentals ─────────────────────────────────────────
    {
        bookTitle: "Structure and Interpretation of Computer Programs (SICP), 2nd Ed.",
        authorName: "Harold Abelson & Gerald Jay Sussman",
        imageURL: cover('9780262510875'),
        galleryImages: G.algo,
        tags: ['algorithms'],
        category: "Programming",
        bookDescription: "The legendary MIT textbook that teaches programming as a discipline of mind. Covers abstraction, recursion, interpreters, and fundamental ideas of computation using Scheme.",
        bookPDFURL: "https://mitpress.mit.edu/sicp/",
        price: 49.99, rating: 4.8, stock: 19
    },
    {
        bookTitle: "Operating Systems: Three Easy Pieces",
        authorName: "Remzi H. Arpaci-Dusseau & Andrea C. Arpaci-Dusseau",
        imageURL: cover('9781985086593'),
        galleryImages: G.systems,
        tags: ['algorithms'],
        category: "Programming",
        bookDescription: "A comprehensive and readable introduction to operating systems covering virtualization, concurrency and persistence — freely available online and beloved at universities worldwide.",
        bookPDFURL: "https://pages.cs.wisc.edu/~remzi/OSTEP/",
        price: 44.99, rating: 4.8, stock: 17
    },
];

// @desc    Seed dummy books
// @route   GET /api/books/seed           — skip if books exist
// @route   GET /api/books/seed?force=true — wipe all books and re-seed
// @access  Public
const seedBooks = async (req, res, next) => {
    try {
        const force = req.query.force === 'true';
        const count = await Book.countDocuments();

        if (count > 0 && !force) {
            return res.json({ message: `Books already seeded. ${count} books exist. Use ?force=true to reset.`, count });
        }
        if (force && count > 0) {
            await Book.deleteMany({});
        }
        const books = await Book.insertMany(dummyBooks);
        res.json({ message: 'Books seeded successfully!', count: books.length });
    } catch (error) {
        next(error);
    }
};

// @desc    Get all books (optionally filter by category)
// @route   GET /api/books
// @access  Public
const getAllBooks = async (req, res, next) => {
    try {
        const filter = {};
        if (req.query.category) {
            filter.category = req.query.category;
        }
        const books = await Book.find(filter).sort({ createdAt: -1 });
        res.json(books);
    } catch (error) {
        next(error);
    }
};

// @desc    Get a single book by ID
// @route   GET /api/books/:id
// @access  Public
const getBookById = async (req, res, next) => {
    try {
        const book = await Book.findById(req.params.id);
        if (!book) {
            res.status(404);
            throw new Error('Book not found');
        }
        res.json(book);
    } catch (error) {
        next(error);
    }
};

// @desc    Upload / create a new book
// @route   POST /api/books
// @access  Private (admin or vendor)
const createBook = async (req, res, next) => {
    try {
        const bookData = { ...req.body };
        // Vendors auto-tag the book with their own _id
        if (req.user && req.user.role === 'vendor') {
            bookData.vendor = req.user._id;
        } else {
            // Admin books are platform books (vendor = null)
            bookData.vendor = null;
        }
        const book = await Book.create(bookData);

        // If an initial stock was set, log a stock_in activity
        if (book.stock > 0) {
            await logStockActivity({
                bookId:      book._id,
                bookTitle:   book.bookTitle,
                type:        'stock_in',
                quantity:    book.stock,
                stockBefore: 0,
                stockAfter:  book.stock,
                performedBy: req.user?.email || req.user?._id || 'system',
                note:        'Initial stock on book creation',
            });
        }

        res.status(201).json(book);
    } catch (error) {
        next(error);
    }
};

// @desc    Update a book by ID
// @route   PATCH /api/books/:id
// @access  Private (admin or book owner vendor)
const updateBook = async (req, res, next) => {
    try {
        const existing = await Book.findById(req.params.id);
        if (!existing) { res.status(404); throw new Error('Book not found'); }
        // Vendor can only edit their own books
        if (req.user.role === 'vendor' && String(existing.vendor) !== String(req.user._id)) {
            res.status(403); throw new Error('Access denied: You can only edit your own books');
        }
        const book = await Book.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        res.json(book);
    } catch (error) {
        next(error);
    }
};

// @desc    Delete a book by ID
// @route   DELETE /api/books/:id
// @access  Private (admin or book owner vendor)
const deleteBook = async (req, res, next) => {
    try {
        const book = await Book.findById(req.params.id);
        if (!book) { res.status(404); throw new Error('Book not found'); }
        // Vendor can only delete their own books
        if (req.user.role === 'vendor' && String(book.vendor) !== String(req.user._id)) {
            res.status(403); throw new Error('Access denied: You can only delete your own books');
        }
        await book.deleteOne();
        res.json({ message: 'Book deleted successfully', id: req.params.id });
    } catch (error) {
        next(error);
    }
};

// @desc    Update book stock and/or low-stock threshold
// @route   PATCH /api/books/:id/stock
// @access  Private (admin for platform books, vendor for own books)
const updateBookStock = async (req, res, next) => {
    try {
        const { stock, lowStockThreshold } = req.body;

        const book = await Book.findById(req.params.id);
        if (!book) { res.status(404); throw new Error('Book not found'); }

        const isVendorBook = book.vendor !== null && book.vendor !== undefined;
        const userRole = req.user.role;

        // Admin cannot touch vendor-owned books' stock
        if (userRole === 'admin' && isVendorBook) {
            res.status(403);
            throw new Error('Admins cannot manage stock for vendor-owned books. Vendors manage their own stock.');
        }

        // Vendor can only touch their own books' stock
        if (userRole === 'vendor' && String(book.vendor) !== String(req.user._id)) {
            res.status(403);
            throw new Error('Access denied: You can only manage stock for your own books.');
        }

        const stockBefore = book.stock ?? 0;
        const updateFields = {};
        if (stock !== undefined) updateFields.stock = Math.max(0, Number(stock));
        if (lowStockThreshold !== undefined) updateFields.lowStockThreshold = Math.max(1, Number(lowStockThreshold));

        const updated = await Book.findByIdAndUpdate(
            req.params.id,
            { $set: updateFields },
            { new: true, runValidators: true }
        );

        const stockAfter = updated.stock;
        const qty = Math.abs(stockAfter - stockBefore);
        const performedBy = req.user?.email || req.user?._id || 'unknown';
        const roleLabel = userRole === 'vendor' ? 'Vendor restock' : 'Admin restock';

        if (qty > 0) {
            await logStockActivity({
                bookId: updated._id,
                bookTitle: updated.bookTitle,
                type: stockAfter >= stockBefore ? 'stock_in' : 'stock_out',
                quantity: qty,
                stockBefore,
                stockAfter,
                performedBy,
                note: `${roleLabel} by ${performedBy}`,
            });
        }

        const isLowStock = updated.stock <= updated.lowStockThreshold;
        res.json({ ...updated.toObject(), isLowStock });
    } catch (error) {
        next(error);
    }
};


// ─── Get My Books (Vendor) ────────────────────────────────────────────────────
// Returns only books owned by the logged-in vendor
const getMyBooks = async (req, res, next) => {
    try {
        const books = await Book.find({ vendor: req.user._id }).sort({ createdAt: -1 });
        res.json(books);
    } catch (error) {
        next(error);
    }
};

// ─── Get Low Stock Books ─────────────────────────────────────────────────────
// Admin: all books at or below threshold | Vendor: only their own
const getLowStockBooks = async (req, res, next) => {
    try {
        const filter = { $expr: { $lte: ['$stock', '$lowStockThreshold'] } };
        if (req.user.role === 'vendor') {
            filter.vendor = req.user._id;
        }
        const books = await Book.find(filter)
            .select('bookTitle stock lowStockThreshold imageURL vendor category')
            .sort({ stock: 1 });
        res.json(books);
    } catch (error) {
        next(error);
    }
};

// ─── Inventory Valuation (Admin) ──────────────────────────────────────────────
// Returns total cost value, total retail value, and per-category breakdown
const getInventoryValuation = async (req, res, next) => {
    try {
        const books = await Book.find({}).select('category stock price costPrice bookTitle').lean();

        let totalCostValue = 0;
        let totalRetailValue = 0;
        const categoryMap = {};

        for (const book of books) {
            const cost   = (book.costPrice || 0) * (book.stock || 0);
            const retail = (book.price     || 0) * (book.stock || 0);
            totalCostValue   += cost;
            totalRetailValue += retail;

            if (!categoryMap[book.category]) {
                categoryMap[book.category] = { category: book.category, bookCount: 0, totalStock: 0, costValue: 0, retailValue: 0 };
            }
            categoryMap[book.category].bookCount++;
            categoryMap[book.category].totalStock  += book.stock || 0;
            categoryMap[book.category].costValue   += cost;
            categoryMap[book.category].retailValue += retail;
        }

        const byCategory = Object.values(categoryMap).sort((a, b) => b.retailValue - a.retailValue);

        res.json({
            totalBooks:       books.length,
            totalCostValue:   parseFloat(totalCostValue.toFixed(2)),
            totalRetailValue: parseFloat(totalRetailValue.toFixed(2)),
            potentialProfit:  parseFloat((totalRetailValue - totalCostValue).toFixed(2)),
            byCategory,
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Rate a book (only buyers with a delivered order)
// @route   PATCH /api/books/:id/rate
// @access  Private (authenticated users only)
const rateBook = async (req, res, next) => {
    try {
        const { rating } = req.body;
        const star = Number(rating);
        if (!star || star < 1 || star > 5) {
            res.status(400); throw new Error('Rating must be between 1 and 5');
        }

        const book = await Book.findById(req.params.id);
        if (!book) { res.status(404); throw new Error('Book not found'); }

        // Order.user is stored as the user's EMAIL string (see Order model)
        const Order = require('../models/Order');
        const deliveredOrder = await Order.findOne({
            user: req.user.email,
            orderStatus: 'Delivered',
            'items.book': book._id,
        });

        if (!deliveredOrder) {
            res.status(403);
            throw new Error('You can only rate books from your delivered orders');
        }

        // Running average: newAvg = (oldAvg * count + newRating) / (count + 1)
        const oldCount  = book.ratingCount || 0;
        const oldRating = book.rating      || 0;
        const newCount  = oldCount + 1;
        const newRating = parseFloat(((oldRating * oldCount + star) / newCount).toFixed(2));

        book.rating      = newRating;
        book.ratingCount = newCount;
        await book.save();

        res.json({ rating: newRating, ratingCount: newCount });
    } catch (error) {
        next(error);
    }
};


module.exports = { seedBooks, getAllBooks, getBookById, createBook, updateBook, deleteBook, updateBookStock, getMyBooks, getLowStockBooks, getInventoryValuation, rateBook };

