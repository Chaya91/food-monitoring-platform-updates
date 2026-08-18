// FreshGuard AI Freshness Scanning Controller

let currentAnalysisReport = null;

document.addEventListener("DOMContentLoaded", () => {
  // 1. Pre-populate from URL query params
  const urlParams = new URLSearchParams(window.location.search);
  const paramCategory = urlParams.get('category');
  const paramName = urlParams.get('name');

  if (paramCategory) {
    document.getElementById("scan-category").value = paramCategory;
  }
  if (paramName) {
    document.getElementById("scan-food-name").value = paramName;
  }

  // 2. Dropzone listeners
  const dropzone = document.getElementById("analysis-dropzone");
  const fileInput = document.getElementById("scan-file-input");
  const placeholder = document.getElementById("scan-placeholder");
  const previewFrame = document.getElementById("scan-preview-frame");
  const previewImg = document.getElementById("scan-preview-img");
  const removeBtn = document.getElementById("scan-remove-trigger");

  dropzone.addEventListener("click", (e) => {
    if (!removeBtn.contains(e.target)) {
      fileInput.click();
    }
  });

  // Drag & drop
  ['dragenter', 'dragover'].forEach(eventName => {
    dropzone.addEventListener(eventName, (e) => {
      e.preventDefault();
      dropzone.classList.add('dragover');
    }, false);
  });

  ['dragleave', 'drop'].forEach(eventName => {
    dropzone.addEventListener(eventName, (e) => {
      e.preventDefault();
      dropzone.classList.remove('dragover');
    }, false);
  });

  dropzone.addEventListener('drop', (e) => {
    const dt = e.dataTransfer;
    const files = dt.files;
    if (files.length > 0) {
      fileInput.files = files;
      displayPreview(files[0]);
    }
  });

  fileInput.addEventListener('change', () => {
    if (fileInput.files.length > 0) {
      displayPreview(fileInput.files[0]);
    }
  });

  function displayPreview(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      previewImg.src = e.target.result;
      placeholder.style.display = "none";
      previewFrame.style.display = "block";
    };
    reader.readAsDataURL(file);
  }

  removeBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    fileInput.value = "";
    previewImg.src = "#";
    previewFrame.style.display = "none";
    placeholder.style.display = "block";
  });

  // 3. Analysis execution
  const setupForm = document.getElementById("analysis-setup-form");
  const runBtn = document.getElementById("run-analysis-btn");

  const laser = document.getElementById("analysis-laser-light");
  const loaderState = document.getElementById("analysis-loader");
  const placeholderState = document.getElementById("analysis-placeholder-state");
  const resultCard = document.getElementById("analysis-result-card");

  setupForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const category = document.getElementById("scan-category").value;
    const foodName = document.getElementById("scan-food-name").value.trim();

    // Visual loading switch
    placeholderState.style.display = "none";
    resultCard.style.display = "none";
    loaderState.style.display = "block";
    laser.style.display = "block";
    runBtn.disabled = true;

    try {
      // Simulate API analysis
      // Visual variables randomized based on product category
      const details = {};
      
      // Let's bias meat, seafood, bakery towards warning/spoilage if simulated
      if (foodName.toLowerCase().includes("spoiled") || foodName.toLowerCase().includes("bad")) {
        details.visualCondition = 25;
        details.productAgeScore = 15;
      }

      const report = await API.analyzeFreshness(category, foodName, details);
      currentAnalysisReport = report;

      // Render Results
      document.getElementById("res-food-title").textContent = `${report.foodName} Scan`;
      
      const statusBadge = document.getElementById("res-badge-status");
      statusBadge.textContent = report.status;
      statusBadge.className = `badge-status ${report.status.toLowerCase().replace(" ", "-")}`;

      document.getElementById("res-score-val").textContent = `${report.freshnessScore}%`;
      document.getElementById("res-confidence").textContent = `${report.confidence}%`;
      
      const spoilageVal = document.getElementById("res-spoilage");
      spoilageVal.textContent = `${report.spoilageProbability}%`;
      spoilageVal.className = `metric-detail-value text-${report.status.toLowerCase().replace(" ", "-")}`;

      document.getElementById("res-color").textContent = report.visualAnalysis.colorCondition;
      document.getElementById("res-texture").textContent = report.visualAnalysis.textureCondition;
      document.getElementById("res-surface").textContent = report.visualAnalysis.surfaceCondition;
      document.getElementById("res-mold").textContent = report.visualAnalysis.moldDetection;
      document.getElementById("res-bruising").textContent = report.visualAnalysis.bruising;
      document.getElementById("res-damage").textContent = report.visualAnalysis.physicalDamage;

      // Animate SVG circle
      setTimeout(() => {
        const circle = document.getElementById("res-score-circle");
        if (circle) {
          const maxOffset = 402.1;
          const offset = maxOffset - (report.freshnessScore / 100) * maxOffset;
          circle.style.strokeDashoffset = offset;
          
          if (report.freshnessScore >= 80) circle.style.stroke = "var(--primary)";
          else if (report.freshnessScore >= 65) circle.style.stroke = "var(--warning)";
          else if (report.freshnessScore >= 50) circle.style.stroke = "var(--near-spoilage)";
          else circle.style.stroke = "var(--spoiled)";
        }
      }, 100);

      // Hide loading state
      loaderState.style.display = "none";
      laser.style.display = "none";
      resultCard.style.display = "block";

    } catch (err) {
      alert(`Visual analysis failed: ${err.message}`);
      placeholderState.style.display = "flex";
      loaderState.style.display = "none";
      laser.style.display = "none";
    } finally {
      runBtn.disabled = false;
    }
  });

  // Action Buttons
  const saveReportBtn = document.getElementById("res-action-save");
  const viewDeepBtn = document.getElementById("res-action-view");

  saveReportBtn.addEventListener("click", async () => {
    if (!currentAnalysisReport) return;

    // Save as new food item in inventory
    const todayStr = new Date().toISOString().split('T')[0];
    const expiryDays = currentAnalysisReport.remainingShelfLife;
    const expDate = new Date();
    expDate.setDate(expDate.getDate() + expiryDays);
    const expiryDateStr = expDate.toISOString().split('T')[0];

    const foodObj = {
      name: currentAnalysisReport.foodName,
      category: currentAnalysisReport.category,
      batchId: "AI-" + Math.floor(Math.random() * 900 + 100),
      quantity: 1,
      packagingType: "Crate / Loose",
      purchaseDate: todayStr,
      storageDate: todayStr,
      expiryDate: expiryDateStr,
      storageLocation: "Shelf B1",
      temperature: 18.0,
      humidity: 60,
      airCirculation: "Good",
      lightExposure: "Medium",
      visualCondition: currentAnalysisReport.visualAnalysis.bruising === "None" ? 95 : 75,
      storageCondition: 80,
      productAge: 90,
      freshnessScore: currentAnalysisReport.freshnessScore,
      spoilageProbability: currentAnalysisReport.spoilageProbability,
      qualityScore: currentAnalysisReport.freshnessScore,
      shelfLifeRemainingDays: expiryDays,
      status: currentAnalysisReport.status
    };

    try {
      await API.createFood(foodObj);
      
      // Log alert
      const alerts = MockStore.getAlerts();
      alerts.unshift({
        id: "a_ai_" + Date.now().toString().slice(-4),
        type: "Freshness Alert",
        level: currentAnalysisReport.status === "Spoiled" ? "Critical" : currentAnalysisReport.status === "Near Spoilage" ? "Warning" : "Information",
        title: `AI Freshness scan saved`,
        target: `${foodObj.name} Batch #${foodObj.batchId}`,
        details: `Freshness rating of ${currentAnalysisReport.freshnessScore}% logged via neural scanner.`,
        timestamp: "Just now",
        read: false
      });
      MockStore.saveAlerts(alerts);

      alert(`Report saved to inventory: "${currentAnalysisReport.foodName}" successfully registered.`);
      window.location.href = "inventory.html";
    } catch (err) {
      alert(`Save failed: ${err.message}`);
    }
  });

  viewDeepBtn.addEventListener("click", () => {
    if (!currentAnalysisReport) return;
    
    // Save report to sessionStorage to display in freshness-details
    sessionStorage.setItem("fg_temp_analysis", JSON.stringify(currentAnalysisReport));
    window.location.href = "freshness-details.html";
  });
});
