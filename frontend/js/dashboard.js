// ==========================================================
// FreshGuard Dashboard
// Fully connected to FastAPI + PostgreSQL
// ==========================================================

const API_BASE_URL = "http://127.0.0.1:8000";

let dashboardCharts = {};


// ==========================================================
// PAGE LOAD
// ==========================================================

document.addEventListener("DOMContentLoaded", async () => {

    // ------------------------------------------------------
    // User greeting
    // ------------------------------------------------------

    let user = null;

    try {
        if (typeof MockStore !== "undefined") {
            user = MockStore.getCurrentUser();
        }
    } catch (error) {
        console.warn("MockStore unavailable:", error);
    }

    const titleEl =
        document.getElementById("welcome-title");

    if (titleEl) {

        const hours =
            new Date().getHours();

        let salutation =
            "Good Morning";

        if (
            hours >= 12 &&
            hours < 17
        ) {
            salutation =
                "Good Afternoon";
        }

        if (hours >= 17) {
            salutation =
                "Good Evening";
        }

        const name =
            user?.name || "User";

        titleEl.textContent =
            `${salutation}, ${name}`;
    }


    // ------------------------------------------------------
    // Load everything from backend
    // ------------------------------------------------------

    await loadDashboard();


    // ------------------------------------------------------
    // Load backend alerts
    // ------------------------------------------------------

    await loadDashboardAlerts();
});


// ==========================================================
// MAIN DASHBOARD LOADER
// ==========================================================

async function loadDashboard() {

    try {

        const [
            summaryResponse,
            analyticsResponse
        ] = await Promise.all([

            fetch(
                `${API_BASE_URL}/dashboard/summary`
            ),

            fetch(
                `${API_BASE_URL}/dashboard/analytics`
            )
        ]);


        if (!summaryResponse.ok) {
            throw new Error(
                "Failed to load dashboard summary"
            );
        }

        if (!analyticsResponse.ok) {
            throw new Error(
                "Failed to load dashboard analytics"
            );
        }


        const summary =
            await summaryResponse.json();

        const analytics =
            await analyticsResponse.json();


        // --------------------------------------------------
        // Update statistics
        // --------------------------------------------------

        updateDashboardStats(
            summary
        );


        // --------------------------------------------------
        // Render real charts
        // --------------------------------------------------

        renderDashboardCharts(
            analytics
        );


    } catch (error) {

        console.error(
            "Dashboard loading error:",
            error
        );

        showDashboardError(
            error.message
        );
    }
}


// ==========================================================
// UPDATE STAT CARDS
// ==========================================================

function updateDashboardStats(summary) {

    setText(
        "stat-total-items",
        summary.total_items ?? 0
    );


    setText(
        "stat-fresh-items",
        summary.fresh_items ?? 0
    );


    const warningCount =
        (summary.good_items ?? 0) +
        (summary.acceptable_items ?? 0) +
        (summary.near_spoilage_items ?? 0);


    setText(
        "stat-warning-items",
        warningCount
    );


    setText(
        "stat-spoiled-items",
        summary.spoiled_items ?? 0
    );


    const freshness =
        Number(
            summary.average_freshness ?? 0
        );


    setText(
        "stat-avg-freshness",
        `${freshness.toFixed(2)}%`
    );


    const shelfLife =
        Number(
            summary.average_shelf_life ?? 0
        );


    setText(
        "stat-avg-shelf-life",
        `${shelfLife.toFixed(1)}d`
    );
}


// ==========================================================
// SAFE TEXT SETTER
// ==========================================================

function setText(id, value) {

    const element =
        document.getElementById(id);

    if (element) {
        element.textContent =
            value;
    }
}


// ==========================================================
// CHARTS
// ==========================================================

function renderDashboardCharts(
    analytics
) {

    destroyExistingCharts();


    // ------------------------------------------------------
    // 1. Freshness Trend
    // ------------------------------------------------------

    const trend =
        analytics.freshness_trend || [];


    const trendLabels =
        trend.map(item =>
            formatDate(item.date)
        );


    const trendValues =
        trend.map(item =>
            Number(item.score || 0)
        );


    createLineChart(
        "chart-freshness-trend",
        trendLabels.length
            ? trendLabels
            : ["No Data"],
        trendValues.length
            ? trendValues
            : [0],
        "Average Freshness (%)"
    );


    // ------------------------------------------------------
    // 2. Quality Distribution
    // ------------------------------------------------------

    const quality =
        analytics.quality_distribution || [];


    const qualityLabels =
        quality.map(item =>
            item.status
        );


    const qualityValues =
        quality.map(item =>
            Number(item.count || 0)
        );


    createDoughnutChart(
        "chart-quality-dist",
        qualityLabels.length
            ? qualityLabels
            : ["No Data"],
        qualityValues.length
            ? qualityValues
            : [1]
    );


    // ------------------------------------------------------
    // 3. Spoilage Risk
    // ------------------------------------------------------

    const risk =
        analytics.spoilage_risk || [];


    const riskLabels =
        risk.map(item =>
            item.category
        );


    const riskValues =
        risk.map(item =>
            Number(item.risk || 0)
        );


    createBarChart(
        "chart-spoilage-risk",
        riskLabels.length
            ? riskLabels
            : ["No Data"],
        riskValues.length
            ? riskValues
            : [0],
        "Spoilage Risk (%)"
    );


    // ------------------------------------------------------
    // 4. Shelf-Life Distribution
    // ------------------------------------------------------

    const shelf =
        analytics.shelf_life_distribution || [];


    const shelfLabels =
        shelf.map(item =>
            item.range
        );


    const shelfValues =
        shelf.map(item =>
            Number(item.count || 0)
        );


    createHorizontalBarChart(
        "chart-shelf-life-dist",
        shelfLabels.length
            ? shelfLabels
            : ["No Data"],
        shelfValues.length
            ? shelfValues
            : [0],
        "Batches"
    );


    // ------------------------------------------------------
    // 5. Storage Temperature
    // ------------------------------------------------------

    const temperature =
        analytics.storage_temperature || [];


    renderStorageTemperature(
        temperature
    );


    // ------------------------------------------------------
    // 6. Humidity
    // ------------------------------------------------------

    const humidity =
        analytics.humidity_logs || [];


    renderHumidity(
        humidity
    );
}


// ==========================================================
// CREATE LINE CHART
// ==========================================================

function createLineChart(
    canvasId,
    labels,
    values,
    label
) {

    const canvas =
        document.getElementById(
            canvasId
        );

    if (!canvas) return;


    const ctx =
        canvas.getContext("2d");


    dashboardCharts[
        canvasId
    ] = new Chart(
        ctx,
        {
            type: "line",

            data: {

                labels: labels,

                datasets: [

                    {
                        label: label,

                        data: values,

                        borderColor:
                            "#10b981",

                        backgroundColor:
                            "rgba(16,185,129,0.10)",

                        borderWidth: 3,

                        tension: 0.4,

                        fill: true,

                        pointRadius: 4,

                        pointHoverRadius: 6
                    }
                ]
            },

            options: {

                responsive: true,

                maintainAspectRatio:
                    false,

                plugins: {

                    legend: {
                        display: false
                    },

                    tooltip: {

                        callbacks: {

                            label:
                                function(context) {

                                    return `${context.dataset.label}: ${Number(context.raw).toFixed(2)}%`;
                                }
                        }
                    }
                },

                scales: {

                    y: {

                        beginAtZero: true,

                        max: 100,

                        ticks: {

                            callback:
                                function(value) {

                                    return `${value}%`;
                                }
                        }
                    }
                }
            }
        }
    );
}


// ==========================================================
// DOUGHNUT CHART
// ==========================================================

function createDoughnutChart(
    canvasId,
    labels,
    values
) {

    const canvas =
        document.getElementById(
            canvasId
        );

    if (!canvas) return;


    const ctx =
        canvas.getContext("2d");


    dashboardCharts[
        canvasId
    ] = new Chart(
        ctx,
        {
            type: "doughnut",

            data: {

                labels: labels,

                datasets: [

                    {
                        data: values,

                        backgroundColor: [
                            "#10b981",
                            "#3b82f6",
                            "#eab308",
                            "#f97316",
                            "#ef4444",
                            "#6b7280"
                        ],

                        borderWidth: 1
                    }
                ]
            },

            options: {

                responsive: true,

                maintainAspectRatio:
                    false,

                plugins: {

                    legend: {

                        position: "bottom",

                        labels: {

                            boxWidth: 12
                        }
                    }
                }
            }
        }
    );
}


// ==========================================================
// BAR CHART
// ==========================================================

function createBarChart(
    canvasId,
    labels,
    values,
    label
) {

    const canvas =
        document.getElementById(
            canvasId
        );

    if (!canvas) return;


    const ctx =
        canvas.getContext("2d");


    dashboardCharts[
        canvasId
    ] = new Chart(
        ctx,
        {
            type: "bar",

            data: {

                labels: labels,

                datasets: [

                    {
                        label: label,

                        data: values,

                        backgroundColor:
                            "#10b981",

                        borderRadius: 6
                    }
                ]
            },

            options: {

                responsive: true,

                maintainAspectRatio:
                    false,

                plugins: {

                    legend: {
                        display: false
                    }
                },

                scales: {

                    y: {

                        beginAtZero: true,

                        max: 100,

                        ticks: {

                            callback:
                                function(value) {

                                    return `${value}%`;
                                }
                        }
                    }
                }
            }
        }
    );
}


// ==========================================================
// HORIZONTAL BAR
// ==========================================================

function createHorizontalBarChart(
    canvasId,
    labels,
    values,
    label
) {

    const canvas =
        document.getElementById(
            canvasId
        );

    if (!canvas) return;


    const ctx =
        canvas.getContext("2d");


    dashboardCharts[
        canvasId
    ] = new Chart(
        ctx,
        {
            type: "bar",

            data: {

                labels: labels,

                datasets: [

                    {
                        label: label,

                        data: values,

                        backgroundColor:
                            [
                                "#ef4444",
                                "#f97316",
                                "#eab308",
                                "#10b981"
                            ],

                        borderRadius: 4
                    }
                ]
            },

            options: {

                indexAxis: "y",

                responsive: true,

                maintainAspectRatio:
                    false,

                plugins: {

                    legend: {
                        display: false
                    }
                },

                scales: {

                    x: {

                        beginAtZero: true,

                        ticks: {
                            precision: 0
                        }
                    }
                }
            }
        }
    );
}


// ==========================================================
// STORAGE TEMPERATURE
// ==========================================================

function renderStorageTemperature(
    data
) {

    const canvas =
        document.getElementById(
            "chart-storage-temp"
        );

    if (!canvas) return;


    if (!data.length) {

        showNoChartData(
            canvas,
            "No storage temperature data available"
        );

        return;
    }


    const labels =
        data.map(item =>
            item.time ||
            item.timestamp ||
            item.date
        );


    const values =
        data.map(item =>
            Number(
                item.temperature ??
                item.value ??
                0
            )
        );


    createLineChart(
        "chart-storage-temp",
        labels,
        values,
        "Temperature (°C)"
    );
}


// ==========================================================
// HUMIDITY
// ==========================================================

function renderHumidity(
    data
) {

    const canvas =
        document.getElementById(
            "chart-storage-humidity"
        );

    if (!canvas) return;


    if (!data.length) {

        showNoChartData(
            canvas,
            "No humidity data available"
        );

        return;
    }


    const labels =
        data.map(item =>
            item.time ||
            item.timestamp ||
            item.date
        );


    const values =
        data.map(item =>
            Number(
                item.humidity ??
                item.value ??
                0
            )
        );


    createLineChart(
        "chart-storage-humidity",
        labels,
        values,
        "Humidity (%)"
    );
}


// ==========================================================
// NO DATA MESSAGE
// ==========================================================

function showNoChartData(
    canvas,
    message
) {

    const parent =
        canvas.parentElement;

    if (!parent) return;


    canvas.style.display =
        "none";


    let messageElement =
        parent.querySelector(
            ".dashboard-no-data"
        );


    if (!messageElement) {

        messageElement =
            document.createElement(
                "div"
            );

        messageElement.className =
            "dashboard-no-data";

        messageElement.style.cssText = `
            display:flex;
            align-items:center;
            justify-content:center;
            height:100%;
            min-height:180px;
            color:var(--text-muted,#64748b);
            font-size:0.9rem;
            text-align:center;
        `;

        parent.appendChild(
            messageElement
        );
    }


    messageElement.textContent =
        message;
}


// ==========================================================
// DESTROY OLD CHARTS
// ==========================================================

function destroyExistingCharts() {

    Object.values(
        dashboardCharts
    ).forEach(chart => {

        try {
            chart.destroy();
        } catch (error) {
            console.warn(
                "Chart destroy error:",
                error
            );
        }

    });


    dashboardCharts = {};
}


// ==========================================================
// DASHBOARD ALERTS
// ==========================================================

async function loadDashboardAlerts() {

    const container =
        document.getElementById(
            "dashboard-activity-list"
        );

    if (!container) return;


    try {

        const response =
            await fetch(
                `${API_BASE_URL}/dashboard/alerts`
            );


        if (!response.ok) {

            throw new Error(
                "Failed to load alerts"
            );
        }


        const alerts =
            await response.json();


        renderActivityLog(
            alerts
        );


        renderStorageDiagnostics(
            alerts
        );


    } catch (error) {

        console.error(
            "Alert loading error:",
            error
        );


        container.innerHTML = `
            <div style="
                text-align:center;
                color:var(--text-muted);
                font-size:0.85rem;
                padding:1rem 0;
            ">
                Unable to load recent activities.
            </div>
        `;
    }
}


// ==========================================================
// ACTIVITY LOG
// ==========================================================

function renderActivityLog(
    alerts
) {

    const container =
        document.getElementById(
            "dashboard-activity-list"
        );

    if (!container) return;


    if (
        !Array.isArray(alerts) ||
        alerts.length === 0
    ) {

        container.innerHTML = `
            <div style="
                text-align:center;
                color:var(--text-muted);
                font-size:0.85rem;
                padding:1rem 0;
            ">
                No recent activities.
            </div>
        `;

        return;
    }


    const displayAlerts =
        alerts.slice(0, 4);


    container.innerHTML =
        displayAlerts
            .map(alert => {

                let dotColor =
                    "var(--primary)";


                if (
                    alert.level ===
                    "Critical"
                ) {

                    dotColor =
                        "var(--spoiled)";
                }

                else if (
                    alert.level ===
                    "Warning"
                ) {

                    dotColor =
                        "var(--warning)";
                }


                return `

                    <div class="activity-item">

                        <span
                            class="activity-dot"
                            style="
                                background-color:
                                ${dotColor};
                            "
                        ></span>

                        <div
                            class=
                            "activity-text-wrapper"
                        >

                            <div
                                class=
                                "activity-desc"
                            >

                                <strong>
                                    ${escapeHtml(
                                        alert.target
                                    )}
                                </strong>

                                :
                                ${escapeHtml(
                                    alert.title
                                )}

                            </div>

                            <div
                                class=
                                "activity-time"
                            >

                                ${formatTimestamp(
                                    alert.timestamp
                                )}

                            </div>

                        </div>

                    </div>
                `;
            })
            .join("");
}


// ==========================================================
// STORAGE DIAGNOSTICS
// ==========================================================

function renderStorageDiagnostics(
    alerts
) {

    const container =
        document.getElementById(
            "dashboard-storage-diagnostics"
        );

    if (!container) return;


    // Backend currently does not provide
    // environmental storage alerts.

    const storageAlerts =
        Array.isArray(alerts)
            ? alerts.filter(
                alert =>
                    alert.type ===
                    "Storage Alert"
            )
            : [];


    if (
        storageAlerts.length === 0
    ) {

        container.innerHTML = `

            <div style="
                display:flex;
                align-items:center;
                gap:10px;
                color:var(--primary);
                font-size:0.85rem;
            ">

                <i
                    class=
                    "fa-solid fa-circle-check"
                ></i>

                <span>
                    No storage alerts available.
                </span>

            </div>
        `;

        return;
    }


    container.innerHTML =
        storageAlerts
            .slice(0, 2)
            .map(alert => {

                const borderColor =
                    alert.level ===
                    "Critical"
                        ? "var(--spoiled)"
                        : "var(--warning)";


                return `

                    <div style="
                        padding:8px 12px;
                        border-left:
                            3px solid
                            ${borderColor};
                        background-color:
                            var(--bg-input);
                        border-radius:
                            0
                            var(--radius-sm)
                            var(--radius-sm)
                            0;
                        font-size:0.8rem;
                    ">

                        <span style="
                            font-weight:700;
                            color:${borderColor};
                            text-transform:uppercase;
                            font-size:0.68rem;
                            display:block;
                        ">
                            ${escapeHtml(
                                alert.level
                            )}
                        </span>

                        <span style="
                            color:var(--text-main);
                            font-weight:500;
                        ">
                            ${escapeHtml(
                                alert.title
                            )}
                            -
                            ${escapeHtml(
                                alert.target
                            )}
                        </span>

                    </div>
                `;
            })
            .join("");
}


// ==========================================================
// DATE FORMAT
// ==========================================================

function formatDate(
    value
) {

    if (!value) {
        return "Unknown";
    }


    const date =
        new Date(value);


    if (Number.isNaN(
        date.getTime()
    )) {

        return String(value);
    }


    return date.toLocaleDateString(
        "en-IN",
        {
            day: "2-digit",
            month: "short"
        }
    );
}


// ==========================================================
// TIMESTAMP FORMAT
// ==========================================================

function formatTimestamp(
    value
) {

    if (!value) {
        return "";
    }


    const date =
        new Date(
            String(value).replace(
                " ",
                "T"
            )
        );


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return String(value);
    }


    return date.toLocaleString(
        "en-IN",
        {
            day: "2-digit",
            month: "short",

            hour: "2-digit",
            minute: "2-digit"
        }
    );
}


// ==========================================================
// HTML ESCAPE
// ==========================================================

function escapeHtml(
    value
) {

    return String(
        value ?? ""
    )
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );
}


// ==========================================================
// DASHBOARD ERROR
// ==========================================================

function showDashboardError(
    message
) {

    console.error(
        "Dashboard error:",
        message
    );


    const elements = [

        "stat-total-items",
        "stat-fresh-items",
        "stat-warning-items",
        "stat-spoiled-items",
        "stat-avg-freshness",
        "stat-avg-shelf-life"

    ];


    elements.forEach(id => {

        const element =
            document.getElementById(id);

        if (element) {
            element.textContent =
                "—";
        }

    });
}