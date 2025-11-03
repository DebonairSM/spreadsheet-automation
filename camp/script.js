// Smooth scroll navigation
document.addEventListener('DOMContentLoaded', () => {
    // Smooth scrolling for anchor links
    const anchorLinks = document.querySelectorAll('a[href^="#"]');
    
    anchorLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            const href = link.getAttribute('href');
            
            // Skip if href is just "#"
            if (href === '#') {
                e.preventDefault();
                return;
            }
            
            const targetId = href.substring(1);
            const targetElement = document.getElementById(targetId);
            
            if (targetElement) {
                e.preventDefault();
                const navHeight = document.querySelector('.nav').offsetHeight;
                const targetPosition = targetElement.offsetTop - navHeight - 20;
                
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
    
    // Navigation scroll effect
    const nav = document.querySelector('.nav');
    let lastScroll = 0;
    
    window.addEventListener('scroll', () => {
        const currentScroll = window.pageYOffset;
        
        if (currentScroll > 100) {
            nav.classList.add('scrolled');
        } else {
            nav.classList.remove('scrolled');
        }
        
        lastScroll = currentScroll;
    });
    
    // Intersection Observer for reveal animations
    const revealElements = document.querySelectorAll('.pain-card, .industry-card, .demo-step');
    
    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('reveal', 'active');
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    });
    
    revealElements.forEach(element => {
        element.classList.add('reveal');
        revealObserver.observe(element);
    });
    
    // File upload visual feedback
    const fileInputs = document.querySelectorAll('input[type="file"]');
    
    fileInputs.forEach(input => {
        input.addEventListener('change', (e) => {
            const fileName = e.target.files[0]?.name || 'Choose file...';
            const label = input.nextElementSibling;
            const fileText = label.querySelector('.file-text');
            
            if (fileText) {
                fileText.textContent = fileName;
                fileText.style.color = 'var(--color-text)';
            }
        });
    });
    
    // Form validation and submission handling
    const scanForm = document.getElementById('scanForm');
    const challengeForm = document.getElementById('challengeForm');
    
    if (scanForm) {
        scanForm.addEventListener('submit', handleFormSubmit);
    }
    
    if (challengeForm) {
        challengeForm.addEventListener('submit', handleFormSubmit);
    }
    
    function handleFormSubmit(e) {
        e.preventDefault();
        
        const form = e.target;
        const formData = new FormData(form);
        
        // Basic validation
        const requiredFields = form.querySelectorAll('[required]');
        let isValid = true;
        
        requiredFields.forEach(field => {
            if (!field.value.trim() && field.type !== 'file') {
                isValid = false;
                field.style.borderColor = 'var(--color-danger)';
                
                // Reset border color on input
                field.addEventListener('input', () => {
                    field.style.borderColor = '';
                }, { once: true });
            } else if (field.type === 'file' && field.files.length === 0) {
                isValid = false;
                const label = field.nextElementSibling;
                label.style.borderColor = 'var(--color-danger)';
                
                // Reset border color on change
                field.addEventListener('change', () => {
                    label.style.borderColor = '';
                }, { once: true });
            }
        });
        
        if (!isValid) {
            showNotification('Please fill in all required fields', 'error');
            return;
        }
        
        // Email validation
        const emailInput = form.querySelector('input[type="email"]');
        if (emailInput && !isValidEmail(emailInput.value)) {
            emailInput.style.borderColor = 'var(--color-danger)';
            showNotification('Please enter a valid email address', 'error');
            return;
        }
        
        // File size validation (max 10MB)
        const fileInput = form.querySelector('input[type="file"]');
        if (fileInput && fileInput.files.length > 0) {
            const file = fileInput.files[0];
            const maxSize = 10 * 1024 * 1024; // 10MB
            
            if (file.size > maxSize) {
                showNotification('File size must be less than 10MB', 'error');
                return;
            }
        }
        
        // Show loading state
        const submitButton = form.querySelector('button[type="submit"]');
        const originalText = submitButton.textContent;
        submitButton.textContent = 'Submitting...';
        submitButton.disabled = true;
        
        // Simulate form submission (replace with actual API call)
        setTimeout(() => {
            console.log('Form submitted:', Object.fromEntries(formData));
            
            // Show success message
            showNotification('Thank you! We\'ll analyze your spreadsheet and get back to you within 2 business days.', 'success');
            
            // Reset form
            form.reset();
            
            // Reset file input labels
            const fileLabels = form.querySelectorAll('.file-text');
            fileLabels.forEach(label => {
                label.textContent = 'Choose file...';
                label.style.color = '';
            });
            
            // Reset button
            submitButton.textContent = originalText;
            submitButton.disabled = false;
            
            // Scroll to top of form
            form.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 1500);
    }
    
    function isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
    
    function showNotification(message, type = 'info') {
        // Remove existing notifications
        const existingNotification = document.querySelector('.notification');
        if (existingNotification) {
            existingNotification.remove();
        }
        
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        // Add styles
        notification.style.cssText = `
            position: fixed;
            top: 100px;
            right: 20px;
            padding: 1rem 1.5rem;
            background-color: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#2563eb'};
            color: white;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            z-index: 10000;
            max-width: 400px;
            animation: slideInRight 0.3s ease-out;
            font-weight: 500;
        `;
        
        // Add animation
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideInRight {
                from {
                    transform: translateX(400px);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
            @keyframes slideOutRight {
                from {
                    transform: translateX(0);
                    opacity: 1;
                }
                to {
                    transform: translateX(400px);
                    opacity: 0;
                }
            }
        `;
        document.head.appendChild(style);
        
        // Add to page
        document.body.appendChild(notification);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease-out';
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 5000);
    }
    
    // Split screen transformation effect
    const splitScreen = document.querySelector('.split-screen');
    
    if (splitScreen) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    animateSplitScreen();
                    observer.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.3
        });
        
        observer.observe(splitScreen);
    }
    
    function animateSplitScreen() {
        const splitLeft = document.querySelector('.split-left');
        const splitRight = document.querySelector('.split-right');
        const arrow = document.querySelector('.transform-arrow');
        
        if (splitLeft && splitRight && arrow) {
            splitLeft.style.opacity = '0';
            splitLeft.style.transform = 'translateX(-20px)';
            splitLeft.style.transition = 'all 0.6s ease-out';
            
            splitRight.style.opacity = '0';
            splitRight.style.transform = 'translateX(20px)';
            splitRight.style.transition = 'all 0.6s ease-out';
            
            arrow.style.opacity = '0';
            arrow.style.transform = 'translate(-50%, -50%) scale(0.5)';
            arrow.style.transition = 'all 0.4s ease-out';
            
            setTimeout(() => {
                splitLeft.style.opacity = '1';
                splitLeft.style.transform = 'translateX(0)';
            }, 100);
            
            setTimeout(() => {
                arrow.style.opacity = '1';
                arrow.style.transform = 'translate(-50%, -50%) scale(1)';
            }, 400);
            
            setTimeout(() => {
                splitRight.style.opacity = '1';
                splitRight.style.transform = 'translateX(0)';
            }, 700);
        }
    }
    
    // Excel grid error highlighting
    const excelGrid = document.querySelector('.excel-grid');
    
    if (excelGrid) {
        const errorCell = Array.from(excelGrid.querySelectorAll('.excel-row span'))
            .find(cell => cell.textContent.includes('#REF!'));
        
        if (errorCell) {
            errorCell.style.color = 'var(--color-excel-error)';
            errorCell.style.fontWeight = 'bold';
        }
    }
    
    // Demo step animation on scroll
    const demoSteps = document.querySelectorAll('.demo-step');
    
    if (demoSteps.length > 0) {
        const demoObserver = new IntersectionObserver((entries) => {
            entries.forEach((entry, index) => {
                if (entry.isIntersecting) {
                    setTimeout(() => {
                        entry.target.style.opacity = '0';
                        entry.target.style.transform = 'translateY(20px)';
                        entry.target.style.transition = 'all 0.6s ease-out';
                        
                        setTimeout(() => {
                            entry.target.style.opacity = '1';
                            entry.target.style.transform = 'translateY(0)';
                        }, 50);
                    }, Array.from(demoSteps).indexOf(entry.target) * 200);
                    
                    demoObserver.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.2
        });
        
        demoSteps.forEach(step => {
            demoObserver.observe(step);
        });
    }
    
    // Dashboard cards counter animation
    const dashboardCards = document.querySelectorAll('.card-metric');
    
    if (dashboardCards.length > 0) {
        const cardObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    animateCounter(entry.target);
                    cardObserver.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.5
        });
        
        dashboardCards.forEach(card => {
            cardObserver.observe(card);
        });
    }
    
    function animateCounter(element) {
        const text = element.textContent;
        const hasPercent = text.includes('%');
        const hasHrs = text.includes('hrs');
        const number = parseInt(text.replace(/[^\d]/g, ''));
        
        if (isNaN(number)) return;
        
        const duration = 1000;
        const steps = 30;
        const increment = number / steps;
        let current = 0;
        
        const timer = setInterval(() => {
            current += increment;
            
            if (current >= number) {
                current = number;
                clearInterval(timer);
            }
            
            let displayValue = Math.floor(current).toLocaleString();
            
            if (hasPercent) {
                displayValue += '%';
            } else if (hasHrs) {
                displayValue += 'hrs';
            }
            
            element.textContent = displayValue;
        }, duration / steps);
    }
    
    // Add active state to navigation based on scroll position
    window.addEventListener('scroll', () => {
        const sections = document.querySelectorAll('section[id]');
        const navLinks = document.querySelectorAll('.nav-menu a[href^="#"]');
        
        let currentSection = '';
        
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.offsetHeight;
            const scrollPosition = window.pageYOffset + 200;
            
            if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
                currentSection = section.getAttribute('id');
            }
        });
        
        navLinks.forEach(link => {
            link.classList.remove('active');
            const href = link.getAttribute('href');
            
            if (href === `#${currentSection}`) {
                link.classList.add('active');
            }
        });
    });
});

// Handle page visibility for pausing animations
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        // Pause animations when page is not visible
        document.body.style.animationPlayState = 'paused';
    } else {
        // Resume animations when page becomes visible
        document.body.style.animationPlayState = 'running';
    }
});

// Performance optimization: debounce scroll events
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Log page load performance
window.addEventListener('load', () => {
    if (window.performance && window.performance.timing) {
        const perfData = window.performance.timing;
        const loadTime = perfData.loadEventEnd - perfData.navigationStart;
        console.log(`Page load time: ${loadTime}ms`);
    }
});

