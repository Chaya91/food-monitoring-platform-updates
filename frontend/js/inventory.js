// ==========================================================
// FreshGuard Inventory Controller
// PostgreSQL / FastAPI Connected Version
// ==========================================================

let inventoryData = [];

let activeFilters = {
  search: "",
  category: "All",
  freshness: "All",
  expiry: "All"
};

const API_BASE_URL = "http://127.0.0.1:8000";


// ==========================================================
// PAGE LOAD
// ==========================================================

document.addEventListener("DOMContentLoaded", async () => {

  // --------------------------------------------------------
  // Add Food button
  // --------------------------------------------------------

  const addFoodBtn =
    document.getElementById("add-food-redirect-btn");

  if (addFoodBtn) {
    addFoodBtn.addEventListener("click", () => {
      window.location.href = "add-food.html";
    });
  }


  // --------------------------------------------------------
  // Load inventory from PostgreSQL
  // --------------------------------------------------------

  await refreshInventory();


  // --------------------------------------------------------
  // Filters
  // --------------------------------------------------------

  setupFilters();


  // --------------------------------------------------------
  // Global navbar search
  // --------------------------------------------------------

  window.InventoryPage = {

    handleSearch: (value) => {

      activeFilters.search =
        value.trim().toLowerCase();

      const localSearch =
        document.getElementById("inventory-search");

      if (localSearch) {
        localSearch.value = value;
      }

      renderTable();
    }

  };

});


// ==========================================================
// LOAD INVENTORY FROM BACKEND
// ==========================================================

async function refreshInventory() {

  try {

    const response = await fetch(
      `${API_BASE_URL}/inventory`
    );

    if (!response.ok) {

      throw new Error(
        `Failed to load inventory (${response.status})`
      );

    }

    const data = await response.json();


    // ------------------------------------------------------
    // Convert PostgreSQL structure into frontend structure
    // ------------------------------------------------------

    inventoryData = data.map(item => ({

      // Database ID
      id: String(item.inventory_id),

      // Database fields
      userId: item.user_id,

      name: item.food_name,

      category: item.category,

      batchId: item.batch_number,

      quantity: item.quantity,

      manufactureDate:
        item.manufacture_date,

      expiryDate:
        item.expiry_date,

      createdAt:
        item.created_at,


      // ----------------------------------------------------
      // Fields not currently returned by /inventory
      // ----------------------------------------------------

      status:
  item.freshness_status || "Not Scanned",

confidence:
  Number(item.confidence ?? 0),

freshnessScore:
  calculateFreshnessScore(
    item.freshness_status,
    Number(item.confidence ?? 0)
  ),

      predictionDate:
        item.prediction_date || null,

      shelfLifeRemainingDays:
        item.shelf_life_remaining_days ??
        calculateRemainingDays(item.expiry_date),

      temperature:
        item.temperature ?? 0,

      humidity:
        item.humidity ?? 0,

      visualCondition:
        item.visual_condition ?? 85,

      productAge:
        item.product_age ?? 75

    }));


    renderTable();

  } catch (error) {

    console.error(
      "Inventory loading error:",
      error
    );

    const tableBody =
      document.getElementById(
        "inventory-table-body"
      );

    if (tableBody) {

      tableBody.innerHTML = `
        <tr>
          <td
            colspan="10"
            style="
              text-align:center;
              color:var(--spoiled);
              padding:3rem 0;
            "
          >
            <i
              class="fa-solid fa-triangle-exclamation"
              style="
                font-size:2rem;
                display:block;
                margin-bottom:1rem;
              "
            ></i>

            Failed to load inventory.

            <br>

            <small>
              Make sure FastAPI is running on
              127.0.0.1:8000
            </small>
          </td>
        </tr>
      `;

    }

  }

}


// ==========================================================
// CALCULATE REMAINING SHELF LIFE
// ==========================================================

function calculateRemainingDays(expiryDate) {

  if (!expiryDate) {
    return 0;
  }

  const today = new Date();

  const expiry =
    new Date(expiryDate);

  const diff =
    expiry - today;

  return Math.max(
    0,
    Math.ceil(
      diff /
      (1000 * 60 * 60 * 24)
    )
  );

}

// ==========================================================
// CALCULATE AI FRESHNESS SCORE
// ==========================================================

function calculateFreshnessScore(status, confidence) {

  const conf = Math.max(
    0,
    Math.min(1, Number(confidence) || 0)
  );

  switch (status) {

    case "Fresh":
      return conf * 100;

    case "Good":
      return conf * 100;

    case "Acceptable":
      return conf * 100;

    case "Warning":
      return (1 - conf) * 100;

    case "Near Spoilage":
      return (1 - conf) * 100;

    case "Spoiled":
      return (1 - conf) * 100;

    case "Not Scanned":
    default:
      return 0;
  }
}
// ==========================================================
// FILTER SETUP
// ==========================================================

function setupFilters() {

  const localSearch =
    document.getElementById(
      "inventory-search"
    );

  const catFilter =
    document.getElementById(
      "filter-category"
    );

  const freshFilter =
    document.getElementById(
      "filter-freshness"
    );

  const expFilter =
    document.getElementById(
      "filter-expiry"
    );


  // --------------------------------------------------------
  // Search
  // --------------------------------------------------------

  if (localSearch) {

    localSearch.addEventListener(
      "input",
      (e) => {

        activeFilters.search =
          e.target.value
            .trim()
            .toLowerCase();

        renderTable();

      }
    );

  }


  // --------------------------------------------------------
  // Category
  // --------------------------------------------------------

  if (catFilter) {

    catFilter.addEventListener(
      "change",
      (e) => {

        activeFilters.category =
          e.target.value;

        renderTable();

      }
    );

  }


  // --------------------------------------------------------
  // Freshness
  // --------------------------------------------------------

  if (freshFilter) {

    freshFilter.addEventListener(
      "change",
      (e) => {

        activeFilters.freshness =
          e.target.value;

        renderTable();

      }
    );

  }


  // --------------------------------------------------------
  // Expiry
  // --------------------------------------------------------

  if (expFilter) {

    expFilter.addEventListener(
      "change",
      (e) => {

        activeFilters.expiry =
          e.target.value;

        renderTable();

      }
    );

  }

}


// ==========================================================
// CATEGORY ICONS
// ==========================================================

const CATEGORY_ICONS = {

  "Fruits": {
    icon: "fa-apple-whole",
    class: "cat-fruits"
  },

  "Vegetables": {
    icon: "fa-carrot",
    class: "cat-vegetables"
  },

  "Dairy Products": {
    icon: "fa-cheese",
    class: "cat-dairy"
  },

  "Meat & Poultry": {
    icon: "fa-drumstick-bite",
    class: "cat-meat"
  },

  "Seafood": {
    icon: "fa-fish",
    class: "cat-seafood"
  },

  "Bakery Products": {
    icon: "fa-bread-slice",
    class: "cat-bakery"
  },

  "Packaged Foods": {
    icon: "fa-box",
    class: "cat-packaged"
  },

  "Beverages": {
    icon: "fa-glass-water",
    class: "cat-beverages"
  }

};


// ==========================================================
// RENDER TABLE
// ==========================================================

function renderTable() {

  const tableBody =
    document.getElementById(
      "inventory-table-body"
    );

  if (!tableBody) {
    return;
  }


  // --------------------------------------------------------
  // Apply filters
  // --------------------------------------------------------

  const filtered =
    inventoryData.filter(item => {

      const name =
        String(item.name || "")
          .toLowerCase();

      const batch =
        String(item.batchId || "")
          .toLowerCase();


      // Search
      const matchesSearch =
        name.includes(
          activeFilters.search
        ) ||

        batch.includes(
          activeFilters.search
        );


      // Category
      const matchesCategory =
        activeFilters.category === "All" ||

        item.category ===
        activeFilters.category;


      // Freshness
      const matchesFreshness =
        activeFilters.freshness === "All" ||

        item.status ===
        activeFilters.freshness;


      // Expiry
      let matchesExpiry = true;

      if (
        activeFilters.expiry !== "All"
      ) {

        const remainingDays =
          calculateRemainingDays(
            item.expiryDate
          );


        if (
          activeFilters.expiry ===
          "Expired"
        ) {

          matchesExpiry =
            remainingDays <= 0;

        }

        else if (
          activeFilters.expiry ===
          "3days"
        ) {

          matchesExpiry =
            remainingDays >= 0 &&
            remainingDays <= 3;

        }

        else if (
          activeFilters.expiry ===
          "7days"
        ) {

          matchesExpiry =
            remainingDays >= 0 &&
            remainingDays <= 7;

        }

      }


      return (
        matchesSearch &&
        matchesCategory &&
        matchesFreshness &&
        matchesExpiry
      );

    });


  // --------------------------------------------------------
  // Empty
  // --------------------------------------------------------

  if (filtered.length === 0) {

    tableBody.innerHTML = `
      <tr>

        <td
          colspan="10"
          style="
            text-align:center;
            color:var(--text-muted);
            padding:3rem 0;
          "
        >

          <i
            class="fa-solid fa-circle-question"
            style="
              font-size:2.5rem;
              margin-bottom:0.75rem;
              display:block;
              opacity:0.5;
            "
          ></i>

          No food records
          matching current criteria.

        </td>

      </tr>
    `;

    return;

  }


  // --------------------------------------------------------
  // Render rows
  // --------------------------------------------------------

  tableBody.innerHTML =
    filtered.map(item => {

      const catMeta =
        CATEGORY_ICONS[item.category] ||
        {
          icon: "fa-utensils",
          class: "cat-packaged"
        };


      

// ========================================================
// STATUS CLASS
// ========================================================

let statusClass = "not-scanned";

switch (item.status) {

  case "Fresh":
    statusClass = "fresh";
    break;

  case "Good":
    statusClass = "good";
    break;

  case "Acceptable":
    statusClass = "acceptable";
    break;

  case "Warning":
    statusClass = "warning";
    break;

  case "Near Spoilage":
    statusClass = "near-spoilage";
    break;

  case "Spoiled":
    statusClass = "spoiled";
    break;

  case "Not Scanned":
  default:
    statusClass = "not-scanned";
    break;
}
      // ----------------------------------------------------
      // Freshness display
      // ----------------------------------------------------

      // --------------------------------------------------------
// Freshness percentage
// --------------------------------------------------------

const freshness = Math.max(
  0,
  Math.min(
    100,
    Number(item.freshnessScore ?? 0)
  )
);


      // ----------------------------------------------------
      // Shelf life
      // ----------------------------------------------------

      const shelfLife =
        calculateRemainingDays(
          item.expiryDate
        );


      // ----------------------------------------------------
      // HTML
      // ----------------------------------------------------

      return `

        <tr>

          <!-- ICON -->

          <td>

            <div
              class="category-icon-frame
              ${catMeta.class}"
            >

              <i
                class="fa-solid
                ${catMeta.icon}"
              ></i>

            </div>

          </td>


          <!-- FOOD NAME -->

          <td
            style="font-weight:600;"
          >
            ${escapeHtml(item.name)}
          </td>


          <!-- CATEGORY -->

          <td>

            <span
              style="
                font-size:0.85rem;
                color:var(--text-muted);
              "
            >
              ${escapeHtml(item.category)}
            </span>

          </td>


          <!-- BATCH -->

          <td>

            <code>
              ${escapeHtml(item.batchId)}
            </code>

          </td>


          <!-- QUANTITY -->

          <td>
            ${item.quantity}
          </td>


          <!-- FRESHNESS -->

          <td>

            <div
              style="
                display:flex;
                align-items:center;
                gap:8px;
                min-width:110px;
              "
            >

              <div
                class="progress-bar-fg"
                style="
                  flex:1;
                  height:6px;
                "
              >

                <div
                  class="progress-bar-fill
                  bg-${statusClass}"
                  style="
                    width:${freshness}%;
                  "
                ></div>

              </div>

              <span
                style="
                  font-size:0.75rem;
                  font-weight:700;
                "
              >
                ${freshness.toFixed(0)}%
              </span>

            </div>

          </td>


          <!-- SHELF LIFE -->

          <td>

            ${shelfLife} days

          </td>


          <!-- EXPIRY -->

          <td
            style="
              font-size:0.85rem;
              font-weight:500;
            "
          >

            ${formatDate(item.expiryDate)}

          </td>


          <!-- STATUS -->

          <td>

            <span
              class="
                badge-status
                ${statusClass}
              "
            >
              ${escapeHtml(item.status)}
            </span>

          </td>


          <!-- ACTIONS -->

          <td
            style="text-align:right;"
          >

            <div
              style="
                display:flex;
                gap:4px;
                justify-content:flex-end;
              "
            >

              <!-- VIEW -->

              <button
                class="table-action-btn"
                title="View details"
                onclick="
                  window.location.href=
                  'food-details.html?id=${item.id}'
                "
              >

                <i
                  class="fa-solid fa-eye"
                ></i>

              </button>


              <!-- EDIT -->

              <button
                class="table-action-btn"
                title="Edit food"
                onclick="
                  openEditModal('${item.id}')
                "
              >

                <i
                  class="
                    fa-solid
                    fa-pen-to-square
                  "
                ></i>

              </button>


              <!-- DELETE -->

              <button
                class="
                  table-action-btn
                  delete
                "
                title="Delete record"
                onclick="
                  deleteFoodRecord(
                    '${item.id}',
                    '${escapeHtml(item.name)}'
                  )
                "
              >

                <i
                  class="
                    fa-solid
                    fa-trash-can
                  "
                ></i>

              </button>

            </div>

          </td>

        </tr>

      `;

    }).join("");

}


// ==========================================================
// EDIT MODAL
// ==========================================================

let currentEditingId = null;


window.openEditModal = (id) => {

  const item =
    inventoryData.find(
      f => f.id === String(id)
    );

  if (!item) {
    return;
  }


  currentEditingId =
    String(id);


  const editId =
    document.getElementById("edit-id");

  const editName =
    document.getElementById("edit-name");

  const editCategory =
    document.getElementById("edit-category");

  const editBatch =
    document.getElementById("edit-batch");

  const editQuantity =
    document.getElementById("edit-quantity");

  const editExpiry =
    document.getElementById("edit-expiry");

  const editTemp =
    document.getElementById("edit-temp");

  const editHumidity =
    document.getElementById("edit-humidity");


  if (editId)
    editId.value = item.id;

  if (editName)
    editName.value = item.name;

  if (editCategory)
    editCategory.value = item.category;

  if (editBatch)
    editBatch.value = item.batchId;

  if (editQuantity)
    editQuantity.value = item.quantity;

  if (editExpiry)
    editExpiry.value =
      normalizeDateForInput(
        item.expiryDate
      );

  if (editTemp)
    editTemp.value =
      item.temperature || 4;

  if (editHumidity)
    editHumidity.value =
      item.humidity || 70;


  const modal =
    document.getElementById(
      "edit-food-modal"
    );

  if (modal) {
    modal.classList.add("active");
  }

};


// ==========================================================
// CLOSE EDIT MODAL
// ==========================================================

window.closeEditModal = () => {

  const modal =
    document.getElementById(
      "edit-food-modal"
    );

  if (modal) {
    modal.classList.remove("active");
  }

  currentEditingId = null;

};


// ==========================================================
// SAVE EDIT
// ==========================================================

document.addEventListener(
  "DOMContentLoaded",
  () => {

    const saveBtn =
      document.getElementById(
        "save-edit-btn"
      );

    if (!saveBtn) {
      return;
    }


    saveBtn.addEventListener(
      "click",
      async () => {

        if (!currentEditingId) {
          return;
        }


        const name =
          document
            .getElementById("edit-name")
            .value
            .trim();


        const category =
          document
            .getElementById("edit-category")
            .value;


        const batchNumber =
          document
            .getElementById("edit-batch")
            .value
            .trim();


        const quantity =
          parseInt(
            document
              .getElementById("edit-quantity")
              .value
          );


        const expiryDate =
          document
            .getElementById("edit-expiry")
            .value;


        if (
          !name ||
          !batchNumber ||
          Number.isNaN(quantity) ||
          quantity < 0 ||
          !expiryDate
        ) {

          alert(
            "Please fill in all required fields."
          );

          return;

        }


        // --------------------------------------------------
        // Get original item
        // --------------------------------------------------

        const originalItem =
          inventoryData.find(
            f =>
              f.id ===
              currentEditingId
          );


        if (!originalItem) {
          return;
        }


        // --------------------------------------------------
        // PUT request to FastAPI
        // --------------------------------------------------

        const body = {

          user_id:
            originalItem.userId || 1,

          food_name:
            name,

          category:
            category,

          batch_number:
            batchNumber,

          quantity:
            quantity,

          manufacture_date:
            originalItem.manufactureDate ||
            new Date()
              .toISOString()
              .split("T")[0],

          expiry_date:
            expiryDate

        };


        try {

          const response =
            await fetch(
              `${API_BASE_URL}/inventory/${currentEditingId}`,
              {
                method: "PUT",

                headers: {
                  "Content-Type":
                    "application/json"
                },

                body:
                  JSON.stringify(body)
              }
            );


          const result =
            await response.json();


          if (!response.ok) {

            throw new Error(
              result.detail ||
              result.error ||
              "Update failed."
            );

          }


          closeEditModal();

          await refreshInventory();


          alert(
            `Successfully updated food record: ${name}`
          );


        } catch (error) {

          console.error(
            "Update error:",
            error
          );

          alert(
            `Error updating record: ${error.message}`
          );

        }

      }
    );

  }
);


// ==========================================================
// DELETE
// ==========================================================

window.deleteFoodRecord =
  async (id, name) => {

    const confirmed =
      confirm(
        `Are you sure you want to delete the food batch record: "${name}"?`
      );


    if (!confirmed) {
      return;
    }


    try {

      const response =
        await fetch(
          `${API_BASE_URL}/inventory/${id}`,
          {
            method: "DELETE"
          }
        );


      const result =
        await response.json();


      if (!response.ok) {

        throw new Error(
          result.detail ||
          result.error ||
          "Delete failed."
        );

      }


      await refreshInventory();


      alert(
        `Food record "${name}" deleted successfully.`
      );


    } catch (error) {

      console.error(
        "Delete error:",
        error
      );

      alert(
        `Error deleting record: ${error.message}`
      );

    }

  };


// ==========================================================
// DATE FORMAT
// ==========================================================

function formatDate(dateString) {

  if (!dateString) {
    return "-";
  }


  const date =
    new Date(dateString);


  if (
    Number.isNaN(
      date.getTime()
    )
  ) {

    return dateString;

  }


  return date.toLocaleDateString(
    "en-GB",
    {
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    }
  );

}


// ==========================================================
// DATE FOR HTML INPUT
// ==========================================================

function normalizeDateForInput(
  dateString
) {

  if (!dateString) {
    return "";
  }


  return String(
    dateString
  ).substring(0, 10);

}


// ==========================================================
// HTML ESCAPE
// ==========================================================

function escapeHtml(value) {

  return String(
    value ?? ""
  )
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

}