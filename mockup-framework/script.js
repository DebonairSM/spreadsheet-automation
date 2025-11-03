// Smooth scrolling for navigation
document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', function(e) {
        e.preventDefault();
        const targetId = this.getAttribute('href');
        const targetSection = document.querySelector(targetId);
        
        if (targetSection) {
            targetSection.scrollIntoView({ behavior: 'smooth' });
            
            // Update active nav link
            document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
            this.classList.add('active');
        }
    });
});

// Update active nav on scroll
window.addEventListener('scroll', () => {
    const sections = document.querySelectorAll('.section');
    const navLinks = document.querySelectorAll('.nav-link');
    
    let current = '';
    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.clientHeight;
        if (window.pageYOffset >= sectionTop - 200) {
            current = section.getAttribute('id');
        }
    });
    
    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${current}`) {
            link.classList.add('active');
        }
    });
});

// Interactive Workflow Demo
let currentStep = 1;
let demoData = {
    customer: '',
    amount: '',
    status: ''
};

function updateWorkflowStep(stepNumber) {
    // Update step indicators
    document.querySelectorAll('.step').forEach(step => {
        step.classList.remove('active');
        const stepNum = parseInt(step.getAttribute('data-step'));
        if (stepNum === stepNumber) {
            step.classList.add('active');
        }
    });
    
    // Update demo panels
    document.querySelectorAll('.demo-panel').forEach(panel => {
        panel.classList.add('hidden');
    });
    document.getElementById(`demo-step-${stepNumber}`).classList.remove('hidden');
    
    currentStep = stepNumber;
}

// Step 1: Form submission
document.getElementById('btn-submit')?.addEventListener('click', function() {
    const customer = document.getElementById('input-customer').value || 'Acme Corporation';
    const amount = document.getElementById('input-amount').value || '1250.00';
    const status = document.getElementById('input-status').value || 'Pending';
    
    demoData = { customer, amount, status };
    
    // Simulate form submission
    this.textContent = 'Submitting...';
    this.disabled = true;
    
    setTimeout(() => {
        updateWorkflowStep(2);
    }, 800);
});

// Step 2: Continue after validation
document.getElementById('btn-next-2')?.addEventListener('click', function() {
    updateWorkflowStep(3);
});

// Step 3: Continue after processing
document.getElementById('btn-next-3')?.addEventListener('click', function() {
    updateWorkflowStep(4);
    
    // Animate metrics
    setTimeout(() => {
        animateMetric('metric-orders', 22, 23);
        animateMetric('metric-revenue', 27200, 28450);
    }, 300);
});

// Step 4: Reset demo
document.getElementById('btn-reset')?.addEventListener('click', function() {
    // Reset form
    document.getElementById('input-customer').value = '';
    document.getElementById('input-amount').value = '';
    document.getElementById('input-status').selectedIndex = 0;
    
    const submitBtn = document.getElementById('btn-submit');
    submitBtn.textContent = 'Submit Order';
    submitBtn.disabled = false;
    
    updateWorkflowStep(1);
});

// Animate metric counters
function animateMetric(elementId, start, end) {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    const duration = 1000;
    const startTime = performance.now();
    const isNumber = !isNaN(start);
    
    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        if (isNumber) {
            const current = Math.floor(start + (end - start) * progress);
            element.textContent = current.toLocaleString();
        } else {
            const startNum = parseFloat(start.toString().replace(/[$,]/g, ''));
            const endNum = parseFloat(end.toString().replace(/[$,]/g, ''));
            const current = Math.floor(startNum + (endNum - startNum) * progress);
            element.textContent = '$' + current.toLocaleString();
        }
        
        if (progress < 1) {
            requestAnimationFrame(update);
        }
    }
    
    requestAnimationFrame(update);
}

// Dashboard tabs
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', function() {
        const tabName = this.getAttribute('data-tab');
        
        // Update button states
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        
        // Update content
        document.querySelectorAll('.dashboard-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(`tab-${tabName}`).classList.add('active');
    });
});

// Allow clicking on workflow steps
document.querySelectorAll('.step').forEach(step => {
    step.addEventListener('click', function() {
        const stepNumber = parseInt(this.getAttribute('data-step'));
        updateWorkflowStep(stepNumber);
    });
});

// Reveal animations on scroll
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -100px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Apply reveal animation to cards and metrics
document.querySelectorAll('.card, .metric-box, .chart-box').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(20px)';
    el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    observer.observe(el);
});

// Simulate live updates (optional - for demo purposes)
function simulateLiveUpdates() {
    const metricsToUpdate = [
        { id: 'metric-orders', element: document.getElementById('metric-orders') },
        { id: 'metric-revenue', element: document.getElementById('metric-revenue') },
        { id: 'metric-pending', element: document.getElementById('metric-pending') }
    ];
    
    setInterval(() => {
        metricsToUpdate.forEach(metric => {
            if (metric.element && Math.random() > 0.7) {
                // Randomly update some metrics
                const currentValue = parseInt(metric.element.textContent.replace(/[$,]/g, ''));
                const change = Math.random() > 0.5 ? 1 : -1;
                metric.element.textContent = (currentValue + change).toLocaleString();
                
                // Add flash animation
                metric.element.style.transition = 'transform 0.3s ease';
                metric.element.style.transform = 'scale(1.1)';
                setTimeout(() => {
                    metric.element.style.transform = 'scale(1)';
                }, 300);
            }
        });
    }, 5000);
}

// Uncomment to enable live updates simulation
// simulateLiveUpdates();

// CTA buttons
document.querySelectorAll('.cta-buttons .btn').forEach(btn => {
    btn.addEventListener('click', function() {
        if (this.textContent.includes('Schedule')) {
            alert('This would open your Calendly link or contact form.');
        } else if (this.textContent.includes('Download')) {
            alert('This would download a PDF proposal.');
        }
    });
});

// Add loading state to demo
function showLoading(element) {
    element.style.opacity = '0.6';
    element.style.pointerEvents = 'none';
}

function hideLoading(element) {
    element.style.opacity = '1';
    element.style.pointerEvents = 'auto';
}

// Console log for development
console.log('Interactive Mockup Framework loaded successfully');
console.log('Customize this template for your client needs');

