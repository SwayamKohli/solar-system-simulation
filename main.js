// Global Variables
let scene, camera, renderer, clock, controls;
let planets = [];
let stars = [];
let orbitLines = [];
let isPaused = false;
let globalSpeedMultiplier = 1.0;
let showOrbits = true;
let showLabels = true;
let showStars = true;

// Interaction Variables
let raycaster = new THREE.Raycaster();
let mouse = new THREE.Vector2();
let tooltip = document.getElementById("tooltip");
let selectedPlanet = null;

// UI Elements
let loadingScreen = document.getElementById("loading-screen");
let controlPanel = document.getElementById("control-panel");
let infoPanel = document.getElementById("info-panel");

// Performance Variables
let frameCount = 0;
let lastTime = 0;
let fps = 60;

// Planet Information Data
const planetInfo = {
    Mercury: {
        description: "The smallest planet and closest to the Sun. Mercury has extreme temperature variations.",
        distance: "57.9 million km from Sun",
        diameter: "4,879 km",
        day: "58.6 Earth days",
        year: "88 Earth days"
    },
    Venus: {
        description: "Known as Earth's 'twin' due to similar size, but with a toxic atmosphere and extreme heat.",
        distance: "108.2 million km from Sun",
        diameter: "12,104 km",
        day: "243 Earth days",
        year: "225 Earth days"
    },
    Earth: {
        description: "Our home planet, the only known world to harbor life. Has one natural satellite: the Moon.",
        distance: "149.6 million km from Sun",
        diameter: "12,756 km",
        day: "24 hours",
        year: "365.25 days"
    },
    Mars: {
        description: "The 'Red Planet' with polar ice caps and the largest volcano in the solar system.",
        distance: "227.9 million km from Sun",
        diameter: "6,792 km",
        day: "24.6 hours",
        year: "687 Earth days"
    },
    Jupiter: {
        description: "The largest planet, a gas giant with a Great Red Spot and over 80 moons.",
        distance: "778.5 million km from Sun",
        diameter: "142,984 km",
        day: "9.9 hours",
        year: "11.9 Earth years"
    },
    Saturn: {
        description: "Famous for its spectacular ring system, Saturn is a gas giant less dense than water.",
        distance: "1.43 billion km from Sun",
        diameter: "120,536 km",
        day: "10.7 hours",
        year: "29.4 Earth years"
    },
    Uranus: {
        description: "An ice giant that rotates on its side, with faint rings and 27 known moons.",
        distance: "2.88 billion km from Sun",
        diameter: "51,118 km",
        day: "17.2 hours",
        year: "84 Earth years"
    },
    Neptune: {
        description: "The windiest planet with speeds up to 2,100 km/h. It's the furthest known planet from the Sun.",
        distance: "4.5 billion km from Sun",
        diameter: "49,528 km",
        day: "16.1 hours",
        year: "164.8 Earth years"
    }
};

// Initialize the simulation
init();
animate();

function init() {
    // Show loading screen
    showLoadingProgress(0);

    // Scene setup
    scene = new THREE.Scene();
    showLoadingProgress(10);

    // Camera setup
    camera = new THREE.PerspectiveCamera(
        75,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
    );
    camera.position.set(30, 30, 50);
    camera.lookAt(0, 0, 0);
    showLoadingProgress(20);

    // Renderer setup
    renderer = new THREE.WebGLRenderer({
        canvas: document.getElementById("webgl"),
        antialias: true,
        alpha: true
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    showLoadingProgress(30);

    // Lighting setup
    setupLighting();
    showLoadingProgress(40);

    // Create the Sun
    createSun();
    showLoadingProgress(50);

    // Create background stars
    if (showStars) {
        addStars();
    }
    showLoadingProgress(60);

    // Create planets
    createPlanets();
    showLoadingProgress(80);

    // Setup controls and UI
    setupControls();
    setupEventListeners();
    showLoadingProgress(90);

    // Initialize clock
    clock = new THREE.Clock();
    showLoadingProgress(100);

    // Hide loading screen after a short delay
    setTimeout(() => {
        loadingScreen.classList.add('hidden');
    }, 500);

    // Create expand button
    const expandBtn = document.createElement("div");
    expandBtn.className = "panel-expand-btn";
    expandBtn.innerHTML = '<div class="expand-icon"></div>';
    expandBtn.addEventListener("click", toggleControlPanel);
    controlPanel.appendChild(expandBtn);
}

// toggleControlPanel function
function toggleControlPanel() {
    const controlPanel = document.getElementById("control-panel");
    controlPanel.classList.toggle("collapsed");
    const existingHandle = document.querySelector(".expand-handle");
    if (existingHandle) {
        existingHandle.remove();
    }
    // If panel is collapsed, it adds the expand handle
    if (controlPanel.classList.contains("collapsed")) {
        const expandHandle = document.createElement("div");
        expandHandle.className = "expand-handle";
        expandHandle.addEventListener("click", toggleControlPanel);
        document.body.appendChild(expandHandle);
    }
}

function toggleMobileMenu() {
    const controlPanel = document.getElementById("control-panel");
    controlPanel.classList.toggle("mobile-open");

    // Ensures panel is not collapsed when opening on mobile
    if (controlPanel.classList.contains("mobile-open")) {
        controlPanel.classList.remove("collapsed");
        const existingHandle = document.querySelector(".expand-handle");
        if (existingHandle) {
            existingHandle.remove();
        }
    }
}

function showLoadingProgress(percentage) {
    const loadingBar = document.getElementById('loading-bar');
    if (loadingBar) {
        loadingBar.style.width = percentage + '%';
    }
}

function setupLighting() {
    // Ambient light for overall illumination
    const ambientLight = new THREE.AmbientLight(0x404040, 0.3);
    scene.add(ambientLight);

    // Point light at the Sun's position
    const sunLight = new THREE.PointLight(0xffffff, 2, 200);
    sunLight.position.set(0, 0, 0);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 1024;
    sunLight.shadow.mapSize.height = 1024;
    scene.add(sunLight);

    // Additional directional light for better planet visibility
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight.position.set(50, 50, 50);
    scene.add(directionalLight);
}

function createSun() {
    const sunGeometry = new THREE.SphereGeometry(5, 64, 64);
    const sunMaterial = new THREE.MeshBasicMaterial({
        color: 0xff6b35,
        emissive: 0xff6b35,
        emissiveIntensity: 0.3
    });
    const sun = new THREE.Mesh(sunGeometry, sunMaterial);
    sun.castShadow = false;
    sun.receiveShadow = false;
    scene.add(sun);

    // Add glow effect to sun
    const glowGeometry = new THREE.SphereGeometry(5.5, 32, 32);
    const glowMaterial = new THREE.MeshBasicMaterial({
        color: 0xff6b35,
        transparent: true,
        opacity: 0.3
    });
    const sunGlow = new THREE.Mesh(glowGeometry, glowMaterial);
    scene.add(sunGlow);
}

function createPlanets() {
    const planetData = [
        { name: "Mercury", size: 0.5, distance: 8, speed: 0.04, color: 0x8c7853 },
        { name: "Venus", size: 0.9, distance: 12, speed: 0.015, color: 0xffc649 },
        { name: "Earth", size: 1, distance: 16, speed: 0.01, color: 0x6b93d6 },
        { name: "Mars", size: 0.8, distance: 20, speed: 0.008, color: 0xcd5c5c },
        { name: "Jupiter", size: 2.5, distance: 28, speed: 0.002, color: 0xd8ca9d },
        { name: "Saturn", size: 2.2, distance: 36, speed: 0.0015, color: 0xfad5a5 },
        { name: "Uranus", size: 1.8, distance: 44, speed: 0.001, color: 0x4fd0e7 },
        { name: "Neptune", size: 1.7, distance: 50, speed: 0.0008, color: 0x4b70dd }
    ];

    planetData.forEach((data, index) => {
        // Create orbit group
        const orbit = new THREE.Object3D();

        // Create planet geometry and material
        const geometry = new THREE.SphereGeometry(data.size, 32, 32);
        const material = new THREE.MeshStandardMaterial({
            color: data.color,
            roughness: 0.7,
            metalness: 0.1
        });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.x = data.distance;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        mesh.userData = { name: data.name, planetData: data };

        orbit.add(mesh);
        scene.add(orbit);

        // Create orbit line
        if (showOrbits) {
            createOrbitLine(data.distance);
        }

        // Store planet data
        planets.push({
            mesh: mesh,
            orbit: orbit,
            baseSpeed: data.speed,
            currentSpeed: data.speed,
            individualMultiplier: 1.0,
            name: data.name,
            data: data
        });
    });
}

function createOrbitLine(radius) {
    const points = [];
    const segments = 64;
    for (let i = 0; i <= segments; i++) {
        const theta = (i / segments) * Math.PI * 2;
        points.push(new THREE.Vector3(
            Math.cos(theta) * radius,
            0,
            Math.sin(theta) * radius
        ));
    }
    const geometry = new THREE.BufferGeometry().setFromPoints(points);

    // Set orbit line color based on theme
    const isLightTheme = document.body.classList.contains("light");
    const orbitColor = isLightTheme ? 0x333333 : 0xffffff;

    const material = new THREE.LineBasicMaterial({
        color: orbitColor,
        transparent: true,
        opacity: isLightTheme ? 0.3 : 0.2
    });

    const orbitLine = new THREE.Line(geometry, material);
    orbitLines.push(orbitLine);
    scene.add(orbitLine);
}

function addStars() {
    const starGeometry = new THREE.SphereGeometry(0.1, 8, 8);
    const starMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });

    for (let i = 0; i < 1000; i++) {
        const star = new THREE.Mesh(starGeometry, starMaterial);
        star.position.set(
            (Math.random() - 0.5) * 400,
            (Math.random() - 0.5) * 400,
            (Math.random() - 0.5) * 400
        );
        star.scale.setScalar(Math.random() * 0.5 + 0.5);
        stars.push(star);
        scene.add(star);
    }
}

function setupControls() {
    // Panel toggle
    const panelToggle = document.getElementById("panel-toggle");
    panelToggle.addEventListener("click", toggleControlPanel);

    // Main control buttons
    const pauseBtn = document.getElementById("pauseResumeBtn");
    const themeBtn = document.getElementById("themeToggleBtn");
    const resetBtn = document.getElementById("resetViewBtn");

    pauseBtn.addEventListener("click", togglePause);
    themeBtn.addEventListener("click", toggleTheme);
    resetBtn.addEventListener("click", resetView);

    // Global speed control
    const globalSpeedSlider = document.getElementById("globalSpeed");
    const globalSpeedValue = document.getElementById("globalSpeedValue");

    globalSpeedSlider.addEventListener("input", (e) => {
        globalSpeedMultiplier = parseFloat(e.target.value);
        globalSpeedValue.textContent = globalSpeedMultiplier.toFixed(1) + "x";
        updatePlanetSpeeds();
    });

    // Individual planet controls
    const planetControls = document.querySelectorAll(".planet-control");
    planetControls.forEach((control, index) => {
        const slider = control.querySelector(".planet-slider");
        const speedValue = control.querySelector(".planet-speed-value");

        slider.addEventListener("input", (e) => {
            const multiplier = parseFloat(e.target.value);
            planets[index].individualMultiplier = multiplier;
            speedValue.textContent = multiplier.toFixed(1) + "x";
            updatePlanetSpeeds();
        });
    });

    // View toggle buttons
    const showOrbitsBtn = document.getElementById("showOrbitsBtn");
    const showLabelsBtn = document.getElementById("showLabelsBtn");
    const showStarsBtn = document.getElementById("showStarsBtn");

    showOrbitsBtn.addEventListener("click", () => toggleOrbits(showOrbitsBtn));
    showLabelsBtn.addEventListener("click", () => toggleLabels(showLabelsBtn));
    showStarsBtn.addEventListener("click", () => toggleStars(showStarsBtn));

    // Info panel close button
    const infoClose = document.getElementById("info-close");
    infoClose.addEventListener("click", closeInfoPanel);

    // Mobile menu toggle
    const mobileToggle = document.getElementById("mobile-menu-toggle");
    mobileToggle.addEventListener("click", toggleMobileMenu);
}

function setupEventListeners() {
    // Window resize
    window.addEventListener("resize", onWindowResize);

    // Mouse events for interaction
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("click", onMouseClick);

    // Touch events for mobile
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true });
}

function toggleControlPanel() {
    controlPanel.classList.toggle("collapsed");
}

function togglePause() {
    isPaused = !isPaused;
    const pauseBtn = document.getElementById("pauseResumeBtn");
    const btnText = pauseBtn.querySelector(".btn-text");
    const btnIcon = pauseBtn.querySelector(".btn-icon");

    if (isPaused) {
        btnText.textContent = "Resume";
        btnIcon.innerHTML = ""; // Play icon
        btnIcon.style.width = "0";
        btnIcon.style.height = "0";
        btnIcon.style.borderLeft = "16px solid currentColor";
        btnIcon.style.borderTop = "8px solid transparent";
        btnIcon.style.borderBottom = "8px solid transparent";
    } else {
        btnText.textContent = "Pause";
        btnIcon.style.width = "16px";
        btnIcon.style.height = "16px";
        btnIcon.style.border = "none";
        btnIcon.innerHTML = "";
    }
}

function toggleTheme() {
    document.body.classList.toggle("light");
    const themeBtn = document.getElementById("themeToggleBtn");
    const btnText = themeBtn.querySelector(".btn-text");
    if (document.body.classList.contains("light")) {
        btnText.textContent = "Dark Mode";
    } else {
        btnText.textContent = "Light Mode";
    }

    const isLightTheme = document.body.classList.contains("light");
    const orbitColor = isLightTheme ? 0x333333 : 0xffffff;
    orbitLines.forEach(line => {
        line.material.color.set(orbitColor);
        line.material.opacity = isLightTheme ? 0.3 : 0.2;
    });
}

function resetView() {
    camera.position.set(30, 30, 50);
    camera.lookAt(0, 0, 0);

    // Reset all speeds
    globalSpeedMultiplier = 1.0;
    document.getElementById("globalSpeed").value = 1.0;
    document.getElementById("globalSpeedValue").textContent = "1.0x";

    planets.forEach((planet, index) => {
        planet.individualMultiplier = 1.0;
        const control = document.querySelectorAll(".planet-control")[index];
        if (control) {
            control.querySelector(".planet-slider").value = 1.0;
            control.querySelector(".planet-speed-value").textContent = "1.0x";
        }
    });

    updatePlanetSpeeds();
}

function toggleOrbits(button) {
    showOrbits = !showOrbits;
    button.classList.toggle("active");
    orbitLines.forEach(line => {
        line.visible = showOrbits;
    });
}

function toggleLabels(button) {
    showLabels = !showLabels;
    button.classList.toggle("active");
    // Labels implementation would go here
}

function toggleStars(button) {
    showStars = !showStars;
    button.classList.toggle("active");

    stars.forEach(star => {
        star.visible = showStars;
    });
}

function toggleMobileMenu() {
    controlPanel.classList.toggle("mobile-open");
}

function updatePlanetSpeeds() {
    planets.forEach(planet => {
        planet.currentSpeed = planet.baseSpeed * globalSpeedMultiplier * planet.individualMultiplier;
    });
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function onMouseMove(event) {
    // Update mouse coordinates
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    // Update raycaster
    raycaster.setFromCamera(mouse, camera);

    // Check for intersections with planets
    const intersects = raycaster.intersectObjects(planets.map(p => p.mesh));

    if (intersects.length > 0) {
        const intersectedObject = intersects[0].object;
        const planetName = intersectedObject.userData.name;
        showTooltip(event, planetName);
    } else {
        hideTooltip();
    }
}

function onMouseClick(event) {
    // Update mouse coordinates
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    // Update raycaster
    raycaster.setFromCamera(mouse, camera);

    // Check for intersections with planets
    const intersects = raycaster.intersectObjects(planets.map(p => p.mesh));

    if (intersects.length > 0) {
        const intersectedObject = intersects[0].object;
        const planetName = intersectedObject.userData.name;
        showInfoPanel(planetName);
    } else {
        closeInfoPanel();
    }
}

function onTouchStart(event) {
    if (event.touches.length === 1) {
        const touch = event.touches[0];
        onMouseClick({ clientX: touch.clientX, clientY: touch.clientY });
    }
}

function onTouchMove(event) {
    if (event.touches.length === 1) {
        const touch = event.touches[0];
        onMouseMove({ clientX: touch.clientX, clientY: touch.clientY });
    }
}

function showTooltip(event, planetName) {
    const tooltipTitle = tooltip.querySelector(".tooltip-title");
    const tooltipDetails = tooltip.querySelector(".tooltip-details");

    tooltipTitle.textContent = planetName;
    tooltipDetails.textContent = `Click for more information`;

    tooltip.style.left = event.pageX + 15 + "px";
    tooltip.style.top = event.pageY + 15 + "px";
    tooltip.classList.add("active");
}

function hideTooltip() {
    tooltip.classList.remove("active");
}

function showInfoPanel(planetName) {
    const infoTitle = document.getElementById("info-title");
    const infoContent = document.getElementById("info-content");
    const info = planetInfo[planetName];

    if (info) {
        infoTitle.textContent = planetName;
        infoContent.innerHTML = `
            <p>${info.description}</p>
            <div style="margin-top: 16px;">
                <div style="margin-bottom: 8px;"><strong>Distance from Sun:</strong> ${info.distance}</div>
                <div style="margin-bottom: 8px;"><strong>Diameter:</strong> ${info.diameter}</div>
                <div style="margin-bottom: 8px;"><strong>Day Length:</strong> ${info.day}</div>
                <div><strong>Year Length:</strong> ${info.year}</div>
            </div>
        `;
        infoPanel.classList.add("active");
    }
}

function closeInfoPanel() {
    infoPanel.classList.remove("active");
}

function updateFPS() {
    frameCount++;
    const currentTime = performance.now();

    if (currentTime - lastTime >= 1000) {
        fps = Math.round((frameCount * 1000) / (currentTime - lastTime));
        document.getElementById("fps-counter").textContent = fps;
        frameCount = 0;
        lastTime = currentTime;
    }
}

function animate() {
    requestAnimationFrame(animate);

    const delta = clock.getDelta();

    // Update FPS counter
    updateFPS();

    if (!isPaused) {
        // Animate planets
        planets.forEach(planet => {
            planet.orbit.rotation.y += planet.currentSpeed * delta * 100;

            // Add subtle rotation to planets themselves
            planet.mesh.rotation.y += delta * 2;
        });

        // Add subtle twinkling to stars
        stars.forEach((star, index) => {
            if (index % 10 === Math.floor(Date.now() / 100) % 10) {
                star.material.opacity = 0.5 + Math.sin(Date.now() * 0.01 + index) * 0.3;
            }
        });
    }

    renderer.render(scene, camera);
}

// Initialize stats
document.getElementById("object-counter").textContent = "9"; // Sun + 8 planets