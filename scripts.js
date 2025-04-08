// Borrowing history (loaded from localStorage if available)
let borrowedBooks = JSON.parse(localStorage.getItem('borrowedBooks')) || [];
let bookCatalog = [];

// Discover section (static suggestions)
const discoverBooks = [
    { title: "Database System Concepts", author: "Abraham Silberschatz" },
    { title: "Operating System Concepts", author: "Abraham Silberschatz" }
];

// Fetch books from the backend
async function fetchBooks() {
    try {
        const response = await fetch('http://localhost:3000/books');
        if (!response.ok) throw new Error('Network response was not ok');
        bookCatalog = await response.json();
        displayBooks(bookCatalog);
    } catch (err) {
        console.error('Error fetching books:', err);
    }
}

// Display books in search section
function displayBooks(books) {
    const bookList = document.getElementById('book-list');
    bookList.innerHTML = '';
    books.forEach(book => {
        const li = document.createElement('li');
        li.textContent = `${book.title} by ${book.author} (${book.subject})`;
        if (book.available) {
            const borrowBtn = document.createElement('button');
            borrowBtn.textContent = 'Borrow';
            borrowBtn.onclick = () => borrowBook(book.id);
            li.appendChild(borrowBtn);
        } else {
            li.textContent += ' (Borrowed)';
        }
        bookList.appendChild(li);
    });
}

// Search books
function searchBooks() {
    const query = document.getElementById('search').value.toLowerCase();
    const filteredBooks = bookCatalog.filter(book =>
        book.title.toLowerCase().includes(query) ||
        book.author.toLowerCase().includes(query) ||
        book.subject.toLowerCase().includes(query)
    );
    displayBooks(filteredBooks);
}

// Borrow a book
async function borrowBook(bookId) {
    try {
        const response = await fetch(`http://localhost:3000/borrow/${bookId}`, { method: 'POST' });
        if (!response.ok) throw new Error('Failed to borrow book');
        const book = bookCatalog.find(b => b.id === bookId);
        book.available = false;
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 7);
        borrowedBooks.push({
            ...book,
            borrowedDate: new Date().toISOString(),
            dueDate: dueDate.toISOString()
        });
        updateHistory();
        searchBooks();
        saveToStorage();
    } catch (err) {
        console.error('Error borrowing book:', err);
        alert('Could not borrow book. It might already be taken.');
    }
}

// Display borrowing history
function updateHistory() {
    const historyList = document.getElementById('history-list');
    historyList.innerHTML = '';
    borrowedBooks.forEach((book, index) => {
        const dueDate = new Date(book.dueDate);
        const li = document.createElement('li');
        li.innerHTML = `${book.title} by ${book.author} (${book.subject}) - Due: ${dueDate.toLocaleDateString()}`;
        const returnBtn = document.createElement('button');
        returnBtn.textContent = 'Return';
        returnBtn.className = 'return';
        returnBtn.onclick = () => returnBook(index);
        li.appendChild(returnBtn);
        historyList.appendChild(li);
    });
}

// Return a book
async function returnBook(index) {
    try {
        const book = borrowedBooks[index];
        const response = await fetch(`http://localhost:3000/return/${book.id}`, { method: 'POST' });
        if (!response.ok) throw new Error('Failed to return book');
        const catalogBook = bookCatalog.find(b => b.id === book.id);
        catalogBook.available = true;
        borrowedBooks.splice(index, 1);
        updateHistory();
        searchBooks();
        saveToStorage();
    } catch (err) {
        console.error('Error returning book:', err);
        alert('Could not return book. Try again.');
    }
}

// Display discover section
function displayDiscover() {
    const discoverList = document.getElementById('discover-list');
    discoverList.innerHTML = '';
    discoverBooks.forEach(book => {
        const li = document.createElement('li');
        li.textContent = `${book.title} by ${book.author}`;
        discoverList.appendChild(li);
    });
}

// Save to localStorage
function saveToStorage() {
    localStorage.setItem('borrowedBooks', JSON.stringify(borrowedBooks));
}

// Check due dates and simulate reminders
function checkDueDates() {
    const now = new Date();
    borrowedBooks.forEach(book => {
        const dueDate = new Date(book.dueDate);
        const timeDiff = dueDate - now;
        const daysLeft = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
        if (daysLeft <= 1 && daysLeft > 0) {
            alert(`Reminder: "${book.title}" is due tomorrow!`);
        } else if (daysLeft <= 0) {
            alert(`Overdue: "${book.title}" was due on ${dueDate.toLocaleDateString()}!`);
        }
    });
}

// Initial setup
fetchBooks();
updateHistory();
displayDiscover();

// Check due dates every minute
setInterval(checkDueDates, 60000);
checkDueDates();