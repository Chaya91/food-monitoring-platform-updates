// FreshGuard Shelf-Life Predictor Controller

document.addEventListener("DOMContentLoaded", () => {
  const tempSlider = document.getElementById("pred-temp");
  const tempLabel = document.getElementById("temp-val-lbl");
  const humSlider = document.getElementById("pred-humidity");
  const humLabel = document.getElementById("humidity-val-lbl");

  // Sync range slider labels
  if (tempSlider && tempLabel) {
    tempSlider.addEventListener("input", (e) => {
      tempLabel.textContent = `${parseFloat(e.target.value).toFixed(1)}°C`;
    });
  }
  if (humSlider && humLabel) {
    humSlider.addEventListener("input", (e) => {
      humLabel.textContent = `${e.target.value}%`;
    });
  }

  // File dropzone refined for shelf-life refinement
  const dropzone = document.getElementById("pred-dropzone");
  const fileInput = document.getElementById("pred-file-input");
  const placeholder = document.getElementById("pred-placeholder");
  const previewFrame = document.getElementById("pred-preview-frame");
  const previewImg = document.getElementById("pred-preview-img");
  const removeBtn = document.getElementById("pred-remove-trigger");

  if (dropzone && fileInput) {
    dropzone.addEventListener("click", (e) => {
      if (removeBtn && !removeBtn.contains(e.target)) {
        fileInput.click();
      }
    });

    fileInput.addEventListener('change', () => {
      if (fileInput.files.length > 0) {
        const reader = new FileReader();
        reader.onload = (e) => {
          previewImg.src = e.target.result;
          placeholder.style.display = "none";
          previewFrame.style.display = "block";
        };
        reader.readAsDataURL(fileInput.files[0]);
      }
    });

    if (removeBtn) {
      removeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        fileInput.value = "";
        previewImg.src = "#";
        previewFrame.style.display = "none";
        placeholder.style.display = "block";
      });
    }
  }

  // Handle Predict button submit
  const form = document.getElementById("shelf-life-form");
  const loader = document.getElementById("forecast-loader");
  const placeholderState = document.getElementById("forecast-placeholder-state");
  const resultCard = document.getElementById("forecast-result-card");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const category = document.getElementById("pred-category").value;
    const packagingType = document.getElementById("pred-packaging").value;
    const storageDuration = parseInt(document.getElementById("pred-duration").value);
    const temperature = parseFloat(tempSlider.value);
    const humidity = parseInt(humSlider.value);

    // Switch views to loader
    placeholderState.style.display = "none";
    resultCard.style.display = "none";
    loader.style.display = "block";

    try {
      const response = await API.predictShelfLife({
        category,
        packagingType,
        storageDuration,
        temperature,
        humidity
      });

      // Populate text outcomes
      document.getElementById("out-shelf-days").textContent = `${response.remainingDays} Days`;
      
      // format expected expiry
      const options = { year: 'numeric', month: 'long', day: 'numeric' };
      const expDateObj = new Date(response.expiryDate);
      document.getElementById("out-expiry-date").textContent = expDateObj.toLocaleDateString('en-US', options);
      
      const riskEl = document.getElementById("out-risk-level");
      riskEl.textContent = response.riskLevel;
      
      // Color coded risk level
      if (response.riskLevel === "High") {
        riskEl.className = "metric-detail-value text-spoiled";
      } else if (response.riskLevel === "Medium") {
        riskEl.className = "metric-detail-value text-near-spoilage";
      } else {
        riskEl.className = "metric-detail-value text-fresh";
      }

      document.getElementById("out-confidence-val").textContent = `${response.confidence}%`;
      document.getElementById("out-confidence-bar").style.width = `${response.confidence}%`;

      // Update instructions text based on parameters
      const instEl = document.getElementById("out-instructions");
      if (temperature > 10 && category !== "Packaged Foods") {
        instEl.textContent = `Lower temperature setting to below 5°C. Storing at ${temperature}°C accelerates organic breathing rate and decreases shelf life by ${Math.round((temperature - 4) * 8)}%.`;
      } else if (humidity > 80) {
        instEl.textContent = `Slightly high moisture risk (${humidity}%). Condensation encourages spore propagation. Increase air-vent circulation or drop zone relative humidity.`;
      } else {
        instEl.textContent = `Environmental variables are stable. Packaging type "${packagingType}" provides suitable barrier protection for the remaining ${response.remainingDays} days.`;
      }

      // Render timeline nodes
      renderTimeline(response.remainingDays);

      // Show outcomes
      loader.style.display = "none";
      resultCard.style.display = "block";

    } catch (err) {
      alert(`Forecast calculation failed: ${err.message}`);
      loader.style.display = "none";
      placeholderState.style.display = "flex";
    }
  });
});

function renderTimeline(days) {
  // Clear previous classes
  const steps = ["step-fresh", "step-good", "step-accept", "step-near", "step-spoiled"];
  steps.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.className = "timeline-step";
  });

  // Activate node based on days
  if (days >= 8) {
    document.getElementById("step-fresh").className = "timeline-step active";
  } else if (days >= 5) {
    document.getElementById("step-good").className = "timeline-step active warning";
  } else if (days >= 3) {
    document.getElementById("step-accept").className = "timeline-step active warning";
  } else if (days >= 1) {
    document.getElementById("step-near").className = "timeline-step active near-spoilage";
  } else {
    document.getElementById("step-spoiled").className = "timeline-step active spoiled";
  }
}
