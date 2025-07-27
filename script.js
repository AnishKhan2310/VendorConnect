// Preset user accounts - exactly 3 vendors and 3 wholesalers
const presetUsers = {
    vendor: {
        vendor1: {
            password: 'vendor123',
            name: 'Spice Corner Restaurant',
            contact: '+91-9876543100',
            address: '15 Food Street, Mumbai',
            createdAt: '2024-01-01T00:00:00.000Z'
        },
        vendor2: {
            password: 'vendor123',
            name: 'Quick Bite Stall',
            contact: '+91-9876543101',
            address: '78 Market Road, Delhi',
            createdAt: '2024-01-01T00:00:00.000Z'
        },
        vendor3: {
            password: 'vendor123',
            name: 'Fresh Juice Corner',
            contact: '+91-9876543102',
            address: '32 Commercial Street, Bangalore',
            createdAt: '2024-01-01T00:00:00.000Z'
        }
    },
    wholesaler: {
        wholesaler1: {
            password: 'whole123',
            name: 'Fresh Produce Co.',
            contact: '+91-9876543210',
            address: '123 Market Street, Mumbai',
            createdAt: '2024-01-01T00:00:00.000Z'
        },
        wholesaler2: {
            password: 'whole123',
            name: 'Quality Vegetables Ltd.',
            contact: '+91-9876543211',
            address: '456 Wholesale Market, Delhi',
            createdAt: '2024-01-01T00:00:00.000Z'
        },
        wholesaler3: {
            password: 'whole123',
            name: 'Premium Food Supplies',
            contact: '+91-9876543212',
            address: '789 Food Hub, Bangalore',
            createdAt: '2024-01-01T00:00:00.000Z'
        }
    }
};

// Initialize data with preset users
function initializeData() {
    if (!localStorage.getItem('products')) {
        const initialProducts = [
            {
                id: 1,
                name: 'Fresh Potatoes',
                price: 25.50,
                image: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=300&h=200&fit=crop',
                wholesaler: 'wholesaler1',
                stock: 'in-stock',
                description: 'Fresh farm potatoes, Grade A quality',
                reviews: [],
                createdAt: '2024-01-01T00:00:00.000Z'
            },
            {
                id: 2,
                name: 'Organic Tomatoes',
                price: 35.00,
                image: 'https://images.unsplash.com/photo-1561136594-7f68413e13ca?w=300&h=200&fit=crop',
                wholesaler: 'wholesaler2',
                stock: 'in-stock',
                description: 'Organically grown tomatoes',
                reviews: [],
                createdAt: '2024-01-01T00:00:00.000Z'
            },
            {
                id: 3,
                name: 'Fresh Carrots',
                price: 40.00,
                image: 'https://images.unsplash.com/photo-1445282768818-728615cc910a?w=300&h=200&fit=crop',
                wholesaler: 'wholesaler3',
                stock: 'in-stock',
                description: 'Orange carrots, vitamin rich',
                reviews: [],
                createdAt: '2024-01-01T00:00:00.000Z'
            }
        ];
        localStorage.setItem('products', JSON.stringify(initialProducts));
    }
    
    // Always use preset users
    localStorage.setItem('users', JSON.stringify(presetUsers));
}

// Get data from localStorage
function getUsers() {
    return JSON.parse(localStorage.getItem('users')) || presetUsers;
}

function getProducts() {
    return JSON.parse(localStorage.getItem('products')) || [];
}

function saveProducts(products) {
    console.log('Saving products:', products);
    localStorage.setItem('products', JSON.stringify(products));
    
    // Trigger multiple update events for better sync
    window.dispatchEvent(new CustomEvent('productsUpdated'));
    
    // Broadcast to other tabs
    localStorage.setItem('productsUpdate', Date.now().toString());
    
    console.log('Products saved and events dispatched');
}

// Current user session
let currentUser = null;
let currentUserType = null;
let currentRating = 0;
let currentRatingProduct = null;
let editingProduct = null;

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    initializeData();
    
    // Scroll animations
    initScrollAnimations();
    
    // Check login status and handle redirects
    handleAuthRedirects();
    
    // Handle auth forms
    const loginFormElement = document.getElementById('loginFormElement');
    
    if (loginFormElement) {
        loginFormElement.addEventListener('submit', handleLogin);
    }

    // Load appropriate dashboard
    if (window.location.pathname.includes('vendor-dashboard')) {
        loadVendorDashboard();
        setupVendorEventListeners();
    } else if (window.location.pathname.includes('wholesaler-dashboard')) {
        loadWholesalerDashboard();
        setupWholesalerEventListeners();
    }

    // Set up product form handling
    const productForm = document.getElementById('productForm');
    if (productForm) {
        productForm.addEventListener('submit', handleProductSubmit);
    }
});

// Handle authentication redirects and prevent back button issues - FIXED VERSION
function handleAuthRedirects() {
    const user = localStorage.getItem('currentUser');
    const userType = localStorage.getItem('currentUserType');
    const path = window.location.pathname;
    const onAuthPage = path.includes('-auth.html');
    const onDashPage = path.includes('-dashboard.html');
    
    // Set current user variables
    if (user && userType) {
        currentUser = user;
        currentUserType = userType;
    }

    // ---------- logged-in user ----------
    if (user && userType) {
        // ➊ Same-type auth page → jump to its dashboard
        if (onAuthPage && window.expectedUserType && userType === window.expectedUserType) {
            window.location.replace(
                userType === 'vendor' ? 'vendor-dashboard.html' : 'wholesaler-dashboard.html'
            );
            return;
        }

        // ➋ *Other* auth page → log out silently and let the page show its form
        if (onAuthPage && window.expectedUserType && userType !== window.expectedUserType) {
            localStorage.removeItem('currentUser');
            localStorage.removeItem('currentUserType');
            currentUser = null;
            currentUserType = null;
            return;
        }

        // ➌ Wrong dashboard → forward to the right one
        if (onDashPage) {
            const onVendorDash = path.includes('vendor-dashboard.html');
            const onWholesalerDash = path.includes('wholesaler-dashboard.html');
            
            if (userType === 'vendor' && !onVendorDash) {
                window.location.replace('vendor-dashboard.html');
                return;
            }
            
            if (userType === 'wholesaler' && !onWholesalerDash) {
                window.location.replace('wholesaler-dashboard.html');
                return;
            }
        }
    }

    // ---------- NOT logged-in ----------
    if (!user && onDashPage) {
        window.location.replace('index.html');
        return;
    }
}

// Scroll animations
function initScrollAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, observerOptions);

    document.querySelectorAll('.animate-on-scroll').forEach(el => {
        observer.observe(el);
    });
}

// Mobile menu toggle function
function toggleMobileMenu() {
    const mobileMenu = document.getElementById('mobileNavMenu');
    const isActive = mobileMenu.classList.contains('active');
    
    if (isActive) {
        mobileMenu.classList.remove('active');
        document.body.style.overflow = '';
    } else {
        mobileMenu.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

// Close mobile menu when clicking outside
document.addEventListener('click', function(event) {
    const mobileMenu = document.getElementById('mobileNavMenu');
    const menuToggle = document.querySelector('.mobile-menu-toggle');
    
    if (mobileMenu && mobileMenu.classList.contains('active')) {
        if (!mobileMenu.contains(event.target) && !menuToggle.contains(event.target)) {
            mobileMenu.classList.remove('active');
            document.body.style.overflow = '';
        }
    }
});

// Close mobile menu on window resize
window.addEventListener('resize', function() {
    if (window.innerWidth > 768) {
        const mobileMenu = document.getElementById('mobileNavMenu');
        if (mobileMenu) {
            mobileMenu.classList.remove('active');
            document.body.style.overflow = '';
        }
    }
});

// About modal functions
function showAboutModal() {
    document.getElementById('aboutModal').style.display = 'block';
}

function closeAboutModal() {
    document.getElementById('aboutModal').style.display = 'none';
}

// Handle user login
function handleLogin(e) {
    e.preventDefault();
    
    const username = document.getElementById('loginUsername').value.trim().toLowerCase();
    const password = document.getElementById('loginPassword').value.trim();
    
    const users = getUsers();
    let userFound = false;
    let userType = null;
    
    // Check expected user type first
    if (window.expectedUserType) {
        if (users[window.expectedUserType] && users[window.expectedUserType][username] && 
            users[window.expectedUserType][username].password === password) {
            userFound = true;
            userType = window.expectedUserType;
        }
    } else {
        // Check in both vendor and wholesaler accounts
        for (const type of ['vendor', 'wholesaler']) {
            if (users[type] && users[type][username] && users[type][username].password === password) {
                userFound = true;
                userType = type;
                break;
            }
        }
    }
    
    if (userFound) {
        localStorage.setItem('currentUser', username);
        localStorage.setItem('currentUserType', userType);
        
        showMessage('Login successful! Redirecting...', 'success');
        
        setTimeout(() => {
            if (userType === 'vendor') {
                window.location.replace('vendor-dashboard.html');
            } else {
                window.location.replace('wholesaler-dashboard.html');
            }
        }, 1000);
    } else {
        if (window.expectedUserType) {
            showMessage(`Invalid ${window.expectedUserType} credentials! Please check your username and password.`, 'error');
        } else {
            showMessage('Invalid credentials! Please check your username and password.', 'error');
        }
    }
}

// Show message function
function showMessage(text, type) {
    // Remove existing messages
    const existingMessages = document.querySelectorAll('.message');
    existingMessages.forEach(msg => msg.remove());
    
    const message = document.createElement('div');
    message.className = `message ${type}`;
    message.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
        ${text}
    `;
    
    // Insert at the beginning of the active form
    const activeForm = document.querySelector('.auth-form.active');
    if (activeForm) {
        activeForm.insertBefore(message, activeForm.firstChild);
    }
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        message.remove();
    }, 5000);
}

function logout() {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('currentUserType');
    window.location.replace('index.html');
}

// Global route user function for index.html buttons
function routeUser(targetType, authPage, dashPage) {
    const user = localStorage.getItem('currentUser');
    const userType = localStorage.getItem('currentUserType');

    // Already logged-in with the same role → go straight to its dashboard
    if (user && userType === targetType) {
        window.location.href = dashPage;
        return;
    }

    // Logged-in with the *other* role → flush session, then open the auth page
    if (user && userType !== targetType) {
        localStorage.removeItem('currentUser');
        localStorage.removeItem('currentUserType');
    }
    window.location.href = authPage;
}

// Vendor Dashboard Functions - FIXED VERSION
function loadVendorDashboard() {
    const user = localStorage.getItem('currentUser');
    const userType = localStorage.getItem('currentUserType');
    
    if (!user || userType !== 'vendor') {
        window.location.replace('vendor-auth.html');
        return;
    }
    
    currentUser = user;
    currentUserType = userType;
    
    const users = getUsers();
    const vendorInfo = users.vendor[currentUser];
    
    if (!vendorInfo) {
        localStorage.removeItem('currentUser');
        localStorage.removeItem('currentUserType');
        window.location.replace('vendor-auth.html');
        return;
    }
    
    document.getElementById('vendorName').textContent = vendorInfo.name;
    
    // Update mobile menu user info if it exists
    const mobileVendorName = document.getElementById('mobileVendorName');
    if (mobileVendorName) {
        mobileVendorName.textContent = vendorInfo.name;
    }
    
    displayProducts();
}

function setupVendorEventListeners() {
    // Listen for product updates
    window.addEventListener('productsUpdated', function() {
        console.log('Products updated event received in vendor dashboard');
        displayProducts();
    });
    
    // Listen for storage changes from other tabs
    window.addEventListener('storage', function(e) {
        if (e.key === 'products' || e.key === 'productsUpdate') {
            console.log('Storage change detected in vendor dashboard');
            displayProducts();
        }
    });
}

// Premium filter functions
function setRatingFilter(rating) {
    // Update hidden input
    document.getElementById('qualityFilter').value = rating;
    
    // Update button states
    document.querySelectorAll('.rating-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    document.querySelector(`[data-rating="${rating}"]`).classList.add('active');
    
    // Apply filter
    filterProducts();
}

function resetFilters() {
    document.getElementById('priceSort').value = '';
    document.getElementById('qualityFilter').value = '';
    document.getElementById('searchProduct').value = '';
    
    // Reset rating buttons
    document.querySelectorAll('.rating-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector('[data-rating=""]').classList.add('active');
    
    displayProducts();
}

function displayProducts(filteredProducts = null) {
    const productsGrid = document.getElementById('productsGrid');
    if (!productsGrid) return;
    
    const products = getProducts();
    const productsToShow = filteredProducts || products;
    
    productsGrid.innerHTML = '';
    
    if (productsToShow.length === 0) {
        productsGrid.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 4rem;">
                <i class="fas fa-box-open" style="font-size: 4rem; color: var(--text-secondary); margin-bottom: 1rem;"></i>
                <h3 style="color: var(--text-secondary); margin-bottom: 1rem;">No products available</h3>
                <p style="color: var(--text-secondary);">Products will appear here once wholesalers add them.</p>
            </div>
        `;
        return;
    }
    
    const users = getUsers();
    productsToShow.forEach(product => {
        const wholesaler = users.wholesaler[product.wholesaler];
        if (wholesaler) {
            const productCard = createProductCard(product, wholesaler);
            productsGrid.appendChild(productCard);
        }
    });
}

function createProductCard(product, wholesaler) {
    const card = document.createElement('div');
    card.className = 'product-card';
    
    const avgRating = product.reviews && product.reviews.length > 0 
        ? (product.reviews.reduce((sum, review) => sum + review.rating, 0) / product.reviews.length).toFixed(1)
        : 0;
    
    card.innerHTML = `
        <img src="${product.image || 'https://via.placeholder.com/300x220?text=No+Image'}" alt="${product.name}" class="product-image">
        <div class="product-info">
            <div class="product-name">${product.name}</div>
            <div class="product-price">₹${product.price}/kg</div>
            <div class="product-wholesaler">By: ${wholesaler.name}</div>
            <div class="product-rating">
                <span class="stars">${'★'.repeat(Math.floor(avgRating))}</span>
                <span>(${avgRating}/5) - ${product.reviews ? product.reviews.length : 0} reviews</span>
            </div>
            <div class="stock-status ${product.stock}">${product.stock.replace('-', ' ').toUpperCase()}</div>
            <p>${product.description || 'No description available'}</p>
            <div class="contact-info">
                <strong><i class="fas fa-phone"></i> Contact:</strong> ${wholesaler.contact}<br>
                <strong><i class="fas fa-map-marker-alt"></i> Address:</strong> ${wholesaler.address}
            </div>
            <div class="product-actions">
                <button onclick="openRatingModal(${product.id})" class="btn-secondary glass-btn">
                    <i class="fas fa-star"></i>
                    Rate Wholesaler
                </button>
            </div>
        </div>
    `;
    
    return card;
}

function filterProducts() {
    const priceSort = document.getElementById('priceSort').value;
    const qualityFilter = document.getElementById('qualityFilter').value;
    const searchTerm = document.getElementById('searchProduct').value.toLowerCase();
    
    let filtered = [...getProducts()];
    
    // Search filter
    if (searchTerm) {
        filtered = filtered.filter(product => 
            product.name.toLowerCase().includes(searchTerm) ||
            (product.description && product.description.toLowerCase().includes(searchTerm))
        );
    }
    
    // Quality filter
    if (qualityFilter) {
        filtered = filtered.filter(product => {
            const avgRating = product.reviews && product.reviews.length > 0 
                ? product.reviews.reduce((sum, review) => sum + review.rating, 0) / product.reviews.length
                : 0;
            return avgRating >= parseFloat(qualityFilter);
        });
    }
    
    // Price sorting
    if (priceSort === 'low-high') {
        filtered.sort((a, b) => a.price - b.price);
    } else if (priceSort === 'high-low') {
        filtered.sort((a, b) => b.price - a.price);
    }
    
    displayProducts(filtered);
}

// Rating System
function openRatingModal(productId) {
    currentRatingProduct = productId;
    currentRating = 0;
    document.getElementById('ratingModal').style.display = 'block';
    updateStars();
}

function closeRatingModal() {
    document.getElementById('ratingModal').style.display = 'none';
    document.getElementById('ratingComment').value = '';
    currentRating = 0;
    updateStars();
}

function setRating(rating) {
    currentRating = rating;
    updateStars();
}

function updateStars() {
    const stars = document.querySelectorAll('#ratingStars .star');
    stars.forEach((star, index) => {
        if (index < currentRating) {
            star.classList.add('active');
        } else {
            star.classList.remove('active');
        }
    });
}

function submitRating() {
    if (currentRating === 0) {
        showMessage('Please select a rating', 'error');
        return;
    }
    
    const comment = document.getElementById('ratingComment').value;
    const products = getProducts();
    const product = products.find(p => p.id === currentRatingProduct);
    const users = getUsers();
    const vendorInfo = users.vendor[currentUser];
    
    if (product) {
        if (!product.reviews) {
            product.reviews = [];
        }
        
        product.reviews.push({
            rating: currentRating,
            comment: comment,
            vendor: currentUser,
            vendorName: vendorInfo.name,
            date: new Date().toLocaleDateString()
        });
        
        saveProducts(products);
        closeRatingModal();
        displayProducts();
        showMessage('Thank you for your rating!', 'success');
    }
}

// Wholesaler Dashboard Functions - FIXED VERSION
function loadWholesalerDashboard() {
    const user = localStorage.getItem('currentUser');
    const userType = localStorage.getItem('currentUserType');
    
    console.log('Loading wholesaler dashboard for:', user, userType);
    
    if (!user || userType !== 'wholesaler') {
        console.log('Invalid user or type, redirecting to auth');
        window.location.replace('wholesaler-auth.html');
        return;
    }
    
    currentUser = user;
    currentUserType = userType;
    
    const users = getUsers();
    const wholesalerInfo = users.wholesaler[currentUser];
    
    if (!wholesalerInfo) {
        console.log('Wholesaler info not found');
        localStorage.removeItem('currentUser');
        localStorage.removeItem('currentUserType');
        window.location.replace('wholesaler-auth.html');
        return;
    }
    
    console.log('Wholesaler info loaded:', wholesalerInfo);
    document.getElementById('wholesalerName').textContent = wholesalerInfo.name;
    
    // Update mobile menu user info if it exists
    const mobileWholesalerName = document.getElementById('mobileWholesalerName');
    if (mobileWholesalerName) {
        mobileWholesalerName.textContent = wholesalerInfo.name;
    }
    
    // Force load products after a short delay
    setTimeout(() => {
        displayWholesalerProducts();
    }, 100);
}

function setupWholesalerEventListeners() {
    // Listen for product updates
    window.addEventListener('productsUpdated', function() {
        console.log('Products updated event received in wholesaler dashboard');
        displayWholesalerProducts();
    });
    
    // Listen for storage changes from other tabs
    window.addEventListener('storage', function(e) {
        if (e.key === 'products' || e.key === 'productsUpdate') {
            console.log('Storage change detected in wholesaler dashboard');
            displayWholesalerProducts();
        }
    });
}

function displayWholesalerProducts() {
    console.log('Displaying wholesaler products for:', currentUser);
    
    const wholesalerProducts = document.getElementById('wholesalerProducts');
    if (!wholesalerProducts) {
        console.error('Wholesaler products container not found');
        return;
    }
    
    const products = getProducts();
    console.log('All products:', products);
    
    const myProducts = products.filter(product => product.wholesaler === currentUser);
    console.log('My products:', myProducts);
    
    wholesalerProducts.innerHTML = '';
    
    if (myProducts.length === 0) {
        wholesalerProducts.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 4rem;">
                <i class="fas fa-plus-circle" style="font-size: 4rem; color: var(--primary-color); margin-bottom: 1rem;"></i>
                <h3 style="color: var(--text-primary); margin-bottom: 1rem;">No products yet!</h3>
                <p style="color: var(--text-secondary); margin-bottom: 2rem;">Start by adding your first product to reach vendors.</p>
                <button onclick="showAddProductModal()" class="btn-primary glass-btn">
                    <i class="fas fa-plus"></i>
                    Add Your First Product
                </button>
            </div>
        `;
        return;
    }
    
    myProducts.forEach(product => {
        const productCard = createWholesalerProductCard(product);
        wholesalerProducts.appendChild(productCard);
    });
    
    console.log('Products displayed successfully');
}

function createWholesalerProductCard(product) {
    const card = document.createElement('div');
    card.className = 'wholesaler-product-card';
    
    const avgRating = product.reviews && product.reviews.length > 0 
        ? (product.reviews.reduce((sum, review) => sum + review.rating, 0) / product.reviews.length).toFixed(1)
        : 0;
    
    card.innerHTML = `
        <img src="${product.image || 'https://via.placeholder.com/300x220?text=No+Image'}" alt="${product.name}" class="product-image">
        <div class="product-info">
            <div class="product-name">${product.name}</div>
            <div class="product-price">₹${product.price}/kg</div>
            <div class="product-rating">
                <span class="stars">${'★'.repeat(Math.floor(avgRating))}</span>
                <span>(${avgRating}/5) - ${product.reviews ? product.reviews.length : 0} reviews</span>
            </div>
            <div class="stock-status ${product.stock}">${product.stock.replace('-', ' ').toUpperCase()}</div>
            <p>${product.description || 'No description available'}</p>
            <div class="wholesaler-product-actions">
                <button onclick="editProduct(${product.id})" class="btn-primary glass-btn">
                    <i class="fas fa-edit"></i>
                    Edit
                </button>
                <button onclick="toggleStock(${product.id})" class="btn-secondary glass-btn">
                    <i class="fas fa-${product.stock === 'in-stock' ? 'times' : 'check'}"></i>
                    ${product.stock === 'in-stock' ? 'Out of Stock' : 'In Stock'}
                </button>
                <button onclick="deleteProduct(${product.id})" class="btn-secondary glass-btn" style="background: rgba(239, 68, 68, 0.2); border-color: var(--error-color);">
                    <i class="fas fa-trash"></i>
                    Delete
                </button>
            </div>
        </div>
    `;
    
    return card;
}

// Product Management Functions
function showAddProductModal() {
    editingProduct = null;
    document.getElementById('modalTitle').innerHTML = '<i class="fas fa-plus"></i> Add New Product';
    document.getElementById('productForm').reset();
    const imagePreview = document.getElementById('imagePreview');
    const uploadPlaceholder = document.getElementById('uploadPlaceholder');
    if (imagePreview) imagePreview.style.display = 'none';
    if (uploadPlaceholder) uploadPlaceholder.style.display = 'block';
    document.getElementById('productModal').style.display = 'block';
}

function editProduct(productId) {
    const products = getProducts();
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
    editingProduct = product;
    document.getElementById('modalTitle').innerHTML = '<i class="fas fa-edit"></i> Edit Product';
    document.getElementById('productName').value = product.name;
    document.getElementById('productPrice').value = product.price;
    document.getElementById('productStock').value = product.stock;
    document.getElementById('productDescription').value = product.description || '';
    
    // Show existing image if available
    const imagePreview = document.getElementById('imagePreview');
    const uploadPlaceholder = document.getElementById('uploadPlaceholder');
    if (product.image && imagePreview && uploadPlaceholder) {
        imagePreview.src = product.image;
        imagePreview.style.display = 'block';
        uploadPlaceholder.style.display = 'none';
    }
    
    document.getElementById('productModal').style.display = 'block';
}

function closeProductModal() {
    document.getElementById('productModal').style.display = 'none';
    editingProduct = null;
}

function toggleStock(productId) {
    const products = getProducts();
    const product = products.find(p => p.id === productId);
    if (product) {
        product.stock = product.stock === 'in-stock' ? 'out-of-stock' : 'in-stock';
        saveProducts(products);
        
        const status = product.stock === 'in-stock' ? 'In Stock' : 'Out of Stock';
        showMessage(`Product "${product.name}" marked as ${status}!`, 'success');
        
        // Force refresh displays
        setTimeout(() => {
            displayWholesalerProducts();
        }, 100);
    }
}

function deleteProduct(productId) {
    if (confirm('Are you sure you want to delete this product? This action cannot be undone.')) {
        const products = getProducts();
        const index = products.findIndex(p => p.id === productId);
        if (index > -1) {
            const deletedProduct = products[index];
            products.splice(index, 1);
            saveProducts(products);
            showMessage(`Product "${deletedProduct.name}" has been deleted!`, 'success');
            
            // Force refresh displays
            setTimeout(() => {
                displayWholesalerProducts();
            }, 100);
        }
    }
}

// Image preview function
function previewImage(input) {
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        
        reader.onload = function(e) {
            const imagePreview = document.getElementById('imagePreview');
            const uploadPlaceholder = document.getElementById('uploadPlaceholder');
            if (imagePreview && uploadPlaceholder) {
                imagePreview.src = e.target.result;
                imagePreview.style.display = 'block';
                uploadPlaceholder.style.display = 'none';
            }
        };
        
        reader.readAsDataURL(input.files[0]);
    }
}

// Product form handling
function handleProductSubmit(e) {
    e.preventDefault();
    
    const products = getProducts();
    const productName = document.getElementById('productName').value;
    const price = parseFloat(document.getElementById('productPrice').value);
    const stock = document.getElementById('productStock').value;
    const description = document.getElementById('productDescription').value;
    const imageFile = document.getElementById('productImage').files[0];
    
    let productData = {
        name: productName,
        price: price,
        stock: stock,
        description: description,
        wholesaler: currentUser,
        reviews: []
    };
    
    // Handle image
    if (imageFile) {
        const reader = new FileReader();
        reader.onload = function(e) {
            productData.image = e.target.result;
            saveProduct(productData);
        };
        reader.readAsDataURL(imageFile);
    } else if (editingProduct && editingProduct.image) {
        productData.image = editingProduct.image;
        saveProduct(productData);
    } else {
        saveProduct(productData);
    }
}

function saveProduct(productData) {
    const products = getProducts();
    
    if (editingProduct) {
        // Update existing product
        const index = products.findIndex(p => p.id === editingProduct.id);
        if (index > -1) {
            products[index] = { ...products[index], ...productData };
            saveProducts(products);
            showMessage('Product updated successfully!', 'success');
        }
    } else {
        // Add new product
        productData.id = products.length > 0 ? Math.max(...products.map(p => p.id)) + 1 : 1;
        productData.createdAt = new Date().toISOString();
        products.push(productData);
        saveProducts(products);
        showMessage('Product added successfully!', 'success');
    }
    
    closeProductModal();
    
    // Force refresh displays
    setTimeout(() => {
        displayWholesalerProducts();
    }, 100);
}

// Close modals when clicking outside
window.onclick = function(event) {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });
}
