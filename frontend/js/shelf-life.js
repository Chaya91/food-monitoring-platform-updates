// ============================================================
// FreshGuard - Shelf-Life Prediction Controller
// Connects frontend to the trained ML shelf-life model
// ============================================================

document.addEventListener("DOMContentLoaded", () => {

  // ==========================================================
  // ELEMENTS
  // ==========================================================

  const form = document.getElementById("shelf-life-form");

  const foodTypeEl = document.getElementById("pred-food-type");
  const varietyEl = document.getElementById("pred-variety");

  const categoryEl = document.getElementById("pred-category");
  const packagingEl = document.getElementById("pred-packaging");

  const durationEl = document.getElementById("pred-duration");

  const tempSlider = document.getElementById("pred-temp");
  const tempLabel = document.getElementById("temp-val-lbl");

  const humiditySlider = document.getElementById("pred-humidity");
  const humidityLabel = document.getElementById("humidity-val-lbl");

  const fileInput = document.getElementById("pred-file-input");
  const dropzone = document.getElementById("pred-dropzone");
  const placeholder = document.getElementById("pred-placeholder");
  const previewFrame = document.getElementById("pred-preview-frame");
  const previewImg = document.getElementById("pred-preview-img");
  const removeBtn = document.getElementById("pred-remove-trigger");

  const loader = document.getElementById("forecast-loader");
  const placeholderState =
    document.getElementById("forecast-placeholder-state");

  const resultCard =
    document.getElementById("forecast-result-card");


  // ==========================================================
  // SAFETY CHECK
  // ==========================================================

  if (!form) {
    console.error("Shelf-life form not found.");
    return;
  }


  // ==========================================================
  // TEMPERATURE SLIDER
  // ==========================================================

  if (tempSlider && tempLabel) {

    tempLabel.textContent =
      `${parseFloat(tempSlider.value).toFixed(1)}°C`;

    tempSlider.addEventListener("input", () => {

      const value =
        parseFloat(tempSlider.value);

      tempLabel.textContent =
        `${value.toFixed(1)}°C`;
    });
  }


  // ==========================================================
  // HUMIDITY SLIDER
  // ==========================================================

  if (humiditySlider && humidityLabel) {

    humidityLabel.textContent =
      `${humiditySlider.value}%`;

    humiditySlider.addEventListener("input", () => {

      humidityLabel.textContent =
        `${humiditySlider.value}%`;
    });
  }


  // ==========================================================
  // IMAGE UPLOAD / PREVIEW
  // NOTE:
  // The current shelf-life ML endpoint does NOT use the image.
  // The image is therefore only displayed as an optional UI
  // preview.
  // ==========================================================

  if (dropzone && fileInput) {

    dropzone.addEventListener("click", (event) => {

      if (
        removeBtn &&
        removeBtn.contains(event.target)
      ) {
        return;
      }

      fileInput.click();
    });


    // File selected normally
    fileInput.addEventListener("change", () => {

      if (fileInput.files.length > 0) {

        displayImagePreview(
          fileInput.files[0]
        );
      }
    });


    // Drag enter
    dropzone.addEventListener(
      "dragenter",
      (event) => {

        event.preventDefault();

        dropzone.classList.add("dragover");
      }
    );


    // Drag over
    dropzone.addEventListener(
      "dragover",
      (event) => {

        event.preventDefault();

        dropzone.classList.add("dragover");
      }
    );


    // Drag leave
    dropzone.addEventListener(
      "dragleave",
      () => {

        dropzone.classList.remove("dragover");
      }
    );


    // Drop
    dropzone.addEventListener(
      "drop",
      (event) => {

        event.preventDefault();

        dropzone.classList.remove("dragover");

        const files =
          event.dataTransfer.files;

        if (files.length > 0) {

          try {

            fileInput.files = files;

          } catch (error) {

            console.warn(
              "Could not assign dropped file to input."
            );
          }

          displayImagePreview(files[0]);
        }
      }
    );
  }


  // ==========================================================
  // DISPLAY IMAGE PREVIEW
  // ==========================================================

  function displayImagePreview(file) {

    if (!file.type.startsWith("image/")) {

      alert("Please select an image file.");

      return;
    }

    const reader = new FileReader();

    reader.onload = (event) => {

      if (previewImg) {
        previewImg.src =
          event.target.result;
      }

      if (placeholder) {
        placeholder.style.display =
          "none";
      }

      if (previewFrame) {
        previewFrame.style.display =
          "block";
      }
    };

    reader.readAsDataURL(file);
  }


  // ==========================================================
  // REMOVE IMAGE
  // ==========================================================

  if (removeBtn) {

    removeBtn.addEventListener(
      "click",
      (event) => {

        event.stopPropagation();

        if (fileInput) {
          fileInput.value = "";
        }

        if (previewImg) {
          previewImg.src = "#";
        }

        if (previewFrame) {
          previewFrame.style.display =
            "none";
        }

        if (placeholder) {
          placeholder.style.display =
            "block";
        }
      }
    );
  }


  // ==========================================================
  // FORM SUBMISSION
  // ==========================================================

  form.addEventListener(
    "submit",
    async (event) => {

      event.preventDefault();


      // ------------------------------------------------------
      // READ USER INPUTS
      // ------------------------------------------------------

      const foodType =
        foodTypeEl.value.trim();

      const variety =
        varietyEl.value.trim();

      const category =
        categoryEl.value;

      const packaging =
        packagingEl.value;

      const storageDay =
        parseFloat(durationEl.value);

      const temperature =
        parseFloat(tempSlider.value);

      const humidity =
        parseFloat(humiditySlider.value);


      // ------------------------------------------------------
      // VALIDATION
      // ------------------------------------------------------

      if (!foodType) {

        alert("Please select a food type.");

        return;
      }


      if (!variety) {

        alert("Please enter the food variety.");

        return;
      }


      if (Number.isNaN(storageDay) || storageDay < 0) {

        alert(
          "Storage age must be 0 or greater."
        );

        return;
      }


      if (Number.isNaN(temperature)) {

        alert(
          "Please select a storage temperature."
        );

        return;
      }


      if (Number.isNaN(humidity)) {

        alert(
          "Please select relative humidity."
        );

        return;
      }


      // ======================================================
      // MODEL INPUT
      //
      // The trained model expects exactly these features:
      //
      // Food_Type
      // Variety
      // Initial_Weight_g
      // Current_Weight_g
      // Weight_Loss_percent
      // Storage_Temperature_C
      // Relative_Humidity_percent
      // Storage_Day
      // Storage_Hours
      // CO2_ppm
      // Ethylene_ppm
      // Firmness
      // Color_L
      // Color_a
      // Color_b
      // pH
      // TSS_Brix
      // Mold_Present
      // Bruising
      // Wrinkling
      // Discoloration
      // Yellowing
      // Browning
      // Rot
      // Wilting
      // Sprouting
      // Odor_Change
      // Freshness_Score
      // Spoilage_Score
      // ======================================================


      // ------------------------------------------------------
      // DEFAULT PHYSICAL VALUES
      //
      // The current UI does not collect these 22 additional
      // laboratory/visual measurements.
      //
      // These values allow the trained model to be called
      // without changing the existing UI.
      // ------------------------------------------------------

      const initialWeight = 120;

      const currentWeight = 115;

      const weightLossPercent =
        ((initialWeight - currentWeight) /
          initialWeight) *
        100;


      // ------------------------------------------------------
      // DEFAULT ENVIRONMENTAL / QUALITY VALUES
      // ------------------------------------------------------

      const storageHours = 0;

      const co2 = 400;

      const ethylene = 2;

      const firmness = 5;

      const colorL = 60;

      const colorA = 10;

      const colorB = 40;

      const pH = 5.0;

      const tssBrix = 20;


      // ------------------------------------------------------
      // VISUAL SPOILAGE INDICATORS
      //
      // Default represents a relatively fresh product.
      // ------------------------------------------------------

      const moldPresent = 0;

      const bruising = 0;

      const wrinkling = 0;

      const discoloration = 0;

      const yellowing = 0;

      const browning = 0;

      const rot = 0;

      const wilting = 0;

      const sprouting = 0;

      const odorChange = 0;


      // ------------------------------------------------------
      // FRESHNESS / SPOILAGE SCORES
      // ------------------------------------------------------

      const freshnessScore = 90;

      const spoilageScore = 10;


      // ======================================================
      // COMPLETE ML INPUT
      // ======================================================

      const inputData = {

        Food_Type: foodType,

        Variety: variety,

        Initial_Weight_g:
          initialWeight,

        Current_Weight_g:
          currentWeight,

        Weight_Loss_percent:
          Number(
            weightLossPercent.toFixed(3)
          ),

        Storage_Temperature_C:
          temperature,

        Relative_Humidity_percent:
          humidity,

        Storage_Day:
          storageDay,

        Storage_Hours:
          storageHours,

        CO2_ppm:
          co2,

        Ethylene_ppm:
          ethylene,

        Firmness:
          firmness,

        Color_L:
          colorL,

        Color_a:
          colorA,

        Color_b:
          colorB,

        pH:
          pH,

        TSS_Brix:
          tssBrix,

        Mold_Present:
          moldPresent,

        Bruising:
          bruising,

        Wrinkling:
          wrinkling,

        Discoloration:
          discoloration,

        Yellowing:
          yellowing,

        Browning:
          browning,

        Rot:
          rot,

        Wilting:
          wilting,

        Sprouting:
          sprouting,

        Odor_Change:
          odorChange,

        Freshness_Score:
          freshnessScore,

        Spoilage_Score:
          spoilageScore
      };


      // ======================================================
      // DEBUG
      // ======================================================

      console.log(
        "Shelf-life model input:",
        inputData
      );


      // ======================================================
      // SHOW LOADING STATE
      // ======================================================

      if (placeholderState) {
        placeholderState.style.display =
          "none";
      }

      if (resultCard) {
        resultCard.style.display =
          "none";
      }

      if (loader) {
        loader.style.display =
          "block";
      }


      // Disable button
      const submitButton =
        form.querySelector(
          'button[type="submit"]'
        );

      if (submitButton) {

        submitButton.disabled =
          true;

        submitButton.innerHTML =
          `
          <i class="fa-solid fa-spinner fa-spin"></i>
          Predicting...
          `;
      }


      // ======================================================
      // CALL BACKEND
      // ======================================================

      try {

        /*
         * API.predictShelfLife() sends:
         *
         * POST /predict/shelf-life
         *
         * Content-Type:
         * application/json
         */

        const response =
          await API.predictShelfLife(
            inputData
          );


        console.log(
          "Shelf-life API response:",
          response
        );


        // ====================================================
        // GET RESULT
        // ====================================================

        const remainingDays =
          Number(
            response.remaining_shelf_life_days
          );


        if (
          Number.isNaN(remainingDays)
        ) {

          throw new Error(
            "Backend returned an invalid shelf-life value."
          );
        }


        // ====================================================
        // CALCULATE EXPECTED EXPIRY DATE
        // ====================================================

        const expiryDate =
          new Date();

        expiryDate.setDate(
          expiryDate.getDate() +
          Math.ceil(remainingDays)
        );


        // ====================================================
        // DETERMINE RISK LEVEL
        //
        // This is a UI interpretation of the predicted
        // remaining days. It is NOT a model output.
        // ====================================================

        let riskLevel = "Low";

        if (remainingDays <= 2) {

          riskLevel = "High";

        } else if (remainingDays <= 5) {

          riskLevel = "Medium";
        }


        // ====================================================
        // DISPLAY REMAINING DAYS
        // ====================================================

        const shelfDaysEl =
          document.getElementById(
            "out-shelf-days"
          );

        if (shelfDaysEl) {

          shelfDaysEl.textContent =
            `${remainingDays.toFixed(2)} Days`;
        }


        // ====================================================
        // DISPLAY EXPIRY DATE
        // ====================================================

        const expiryEl =
          document.getElementById(
            "out-expiry-date"
          );

        if (expiryEl) {

          expiryEl.textContent =
            expiryDate.toLocaleDateString(
              "en-US",
              {
                year: "numeric",
                month: "long",
                day: "numeric"
              }
            );
        }


        // ====================================================
        // DISPLAY RISK
        // ====================================================

        const riskEl =
          document.getElementById(
            "out-risk-level"
          );

        if (riskEl) {

          riskEl.textContent =
            riskLevel;


          if (riskLevel === "High") {

            riskEl.className =
              "metric-detail-value text-spoiled";

          } else if (
            riskLevel === "Medium"
          ) {

            riskEl.className =
              "metric-detail-value text-near-spoilage";

          } else {

            riskEl.className =
              "metric-detail-value text-fresh";
          }
        }


        // ====================================================
        // CONFIDENCE
        //
        // IMPORTANT:
        // Your current backend response only returns:
        //
        // remaining_shelf_life_days
        //
        // It does NOT return model confidence.
        //
        // Therefore we don't invent a confidence value.
        // ====================================================

        const confidenceEl =
          document.getElementById(
            "out-confidence-val"
          );

        const confidenceBar =
          document.getElementById(
            "out-confidence-bar"
          );

        if (confidenceEl) {

          confidenceEl.textContent =
            "Model output";
        }

        if (confidenceBar) {

          confidenceBar.style.width =
            "100%";

          confidenceBar.style.opacity =
            "0.5";
        }


        // ====================================================
        // TIMELINE
        // ====================================================

        renderTimeline(
          remainingDays
        );


        // ====================================================
        // ENVIRONMENTAL RECOMMENDATION
        // ====================================================

        const instructionsEl =
          document.getElementById(
            "out-instructions"
          );


        if (instructionsEl) {

          if (remainingDays <= 2) {

            instructionsEl.textContent =
              `High shelf-life risk. The model predicts approximately ${remainingDays.toFixed(
                2
              )} days remaining. Consider improving storage conditions immediately.`;

          } else if (
            remainingDays <= 5
          ) {

            instructionsEl.textContent =
              `Medium shelf-life risk. Approximately ${remainingDays.toFixed(
                2
              )} days remain. Maintain stable temperature and humidity.`;

          } else if (
            temperature > 10
          ) {

            instructionsEl.textContent =
              `Storage temperature is ${temperature.toFixed(
                1
              )}°C. Lowering the temperature may help preserve product quality.`;

          } else if (
            humidity > 80
          ) {

            instructionsEl.textContent =
              `Relative humidity is ${humidity}%. Monitor condensation and maintain good air circulation.`;

          } else {

            instructionsEl.textContent =
              `The trained ML model predicts approximately ${remainingDays.toFixed(
                2
              )} days of remaining shelf life for ${foodType} (${variety}).`;
          }
        }


        // ====================================================
        // SAVE RESULT TO SESSION STORAGE
        // ====================================================

        const shelfLifeResult = {

          foodType:
            response.food_type ||
            foodType,

          variety:
            response.variety ||
            variety,

          remainingShelfLifeDays:
            remainingDays,

          expiryDate:
            expiryDate.toISOString(),

          temperature:
            temperature,

          humidity:
            humidity,

          storageDay:
            storageDay,

          packaging:
            packaging,

          category:
            category,

          modelResponse:
            response,

          predictedAt:
            new Date().toISOString()
        };


        sessionStorage.setItem(
          "fg_shelf_life_result",
          JSON.stringify(
            shelfLifeResult
          )
        );


        // ====================================================
        // SHOW RESULT
        // ====================================================

        if (loader) {
          loader.style.display =
            "none";
        }

        if (resultCard) {
          resultCard.style.display =
            "block";
        }


      } catch (error) {

        console.error(
          "Shelf-life prediction error:",
          error
        );


        alert(
          `Shelf-life prediction failed: ${error.message}`
        );


        if (loader) {
          loader.style.display =
            "none";
        }

        if (placeholderState) {
          placeholderState.style.display =
            "flex";
        }

      } finally {

        // ====================================================
        // RESTORE BUTTON
        // ====================================================

        if (submitButton) {

          submitButton.disabled =
            false;

          submitButton.innerHTML =
            `
            <i class="fa-solid fa-wand-magic-sparkles"></i>
            Predict Shelf Life
            `;
        }
      }

    }
  );
});


// ============================================================
// TIMELINE
// ============================================================

function renderTimeline(days) {

  const steps = [
    "step-fresh",
    "step-good",
    "step-accept",
    "step-near",
    "step-spoiled"
  ];


  // Reset
  steps.forEach((id) => {

    const element =
      document.getElementById(id);

    if (element) {

      element.className =
        "timeline-step";
    }
  });


  // ==========================================================
  // Activate appropriate stage
  // ==========================================================

  if (days >= 8) {

    const element =
      document.getElementById(
        "step-fresh"
      );

    if (element) {

      element.className =
        "timeline-step active";
    }

  } else if (days >= 5) {

    const element =
      document.getElementById(
        "step-good"
      );

    if (element) {

      element.className =
        "timeline-step active warning";
    }

  } else if (days >= 3) {

    const element =
      document.getElementById(
        "step-accept"
      );

    if (element) {

      element.className =
        "timeline-step active warning";
    }

  } else if (days >= 1) {

    const element =
      document.getElementById(
        "step-near"
      );

    if (element) {

      element.className =
        "timeline-step active near-spoilage";
    }

  } else {

    const element =
      document.getElementById(
        "step-spoiled"
      );

    if (element) {

      element.className =
        "timeline-step active spoiled";
    }
  }
}