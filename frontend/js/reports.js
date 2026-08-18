// FreshGuard Reports Controller

let currentPreviewType = "";

const REPORT_GENERATORS = {
  freshness: (foods) => {
    const header = `==================================================\n`;
    const title = `         FRESHGUARD AI FRESHNESS AUDIT REPORT     \n`;
    const date  = `         Generated: ${new Date().toLocaleString()}\n`;
    const line  = `==================================================\n\n`;
    
    let body = `Batch ID | Food Item Name            | Freshness | Classification\n`;
    body    += `----------------------------------------------------------\n`;
    
    foods.forEach(f => {
      const name = f.name.padEnd(25).slice(0, 25);
      body += `${f.batchId.padEnd(8)} | ${name} | ${f.freshnessScore.toString().padEnd(9)} | ${f.status}\n`;
    });

    const total = foods.length;
    const avg = Math.round(foods.reduce((sum, f) => sum + f.freshnessScore, 0) / total);
    
    let footer = `\nSummary:\n`;
    footer    += `Total Batches Audited: ${total}\n`;
    footer    += `Average Platform Freshness Score: ${avg}%\n`;
    
    return header + title + date + line + body + footer;
  },

  "shelf-life": (foods) => {
    let output = `==================================================\n`;
    output    += `       FRESHGUARD PREDICTIVE SHELF-LIFE REPORT   \n`;
    output    += `       Generated: ${new Date().toLocaleString()}\n`;
    output    += `==================================================\n\n`;
    output    += `Batch ID | Food Item Name            | Remaining | Expiry Date\n`;
    output    += `----------------------------------------------------------\n`;

    foods.forEach(f => {
      const name = f.name.padEnd(25).slice(0, 25);
      output += `${f.batchId.padEnd(8)} | ${name} | ${f.shelfLifeRemainingDays.toString().padEnd(3)} days | ${f.expiryDate}\n`;
    });

    const highRisk = foods.filter(f => f.shelfLifeRemainingDays <= 2).length;
    output += `\nSummary:\n`;
    output += `High Spoilage Risk Batches (<= 2 days remaining): ${highRisk}\n`;

    return output;
  },

  inventory: (foods) => {
    let output = `==================================================\n`;
    output    += `          FRESHGUARD INVENTORY QUALITY AUDIT      \n`;
    output    += `          Generated: ${new Date().toLocaleString()}\n`;
    output    += `==================================================\n\n`;
    
    // Group by category
    const categories = {};
    foods.forEach(f => {
      if (!categories[f.category]) categories[f.category] = { count: 0, qty: 0, score: 0 };
      categories[f.category].count += 1;
      categories[f.category].qty += f.quantity;
      categories[f.category].score += f.freshnessScore;
    });

    output += `Category            | Batches | Total Quantity | Avg Freshness\n`;
    output += `--------------------------------------------------------------\n`;

    Object.keys(categories).forEach(cat => {
      const avgFresh = Math.round(categories[cat].score / categories[cat].count);
      output += `${cat.padEnd(19).slice(0, 19)} | ${categories[cat].count.toString().padEnd(7)} | ${categories[cat].qty.toString().padEnd(14)} | ${avgFresh}%\n`;
    });

    output += `\nTotal Inventory Volume: ${foods.reduce((sum, f) => sum + f.quantity, 0)} Units\n`;
    return output;
  },

  waste: (foods) => {
    let output = `==================================================\n`;
    output    += `        FRESHGUARD WASTE MITIGATION AUDIT        \n`;
    output    += `        Generated: ${new Date().toLocaleString()}\n`;
    output    += `==================================================\n\n`;

    const near = foods.filter(f => f.status === "Near Spoilage");
    const spoiled = foods.filter(f => f.status === "Spoiled");

    output += `Spoilage Statistics:\n`;
    output += `- Total Spoiled Batches: ${spoiled.length}\n`;
    output += `- Near Spoilage Batches flagged: ${near.length}\n\n`;

    output += `Near Spoilage Batches Alert List:\n`;
    output += `Batch ID | Item Name            | Location       | Expiry Date\n`;
    output += `----------------------------------------------------------\n`;

    near.forEach(f => {
      const name = f.name.padEnd(20).slice(0, 20);
      output += `${f.batchId.padEnd(8)} | ${name} | ${f.storageLocation.padEnd(14).slice(0, 14)} | ${f.expiryDate}\n`;
    });

    output += `\nAction Items: markdown near spoilage items immediately by 50% or relocate to emergency cooling bins.`;
    return output;
  },

  compliance: (foods) => {
    let output = `==================================================\n`;
    output    += `       FRESHGUARD HACCP TEMPERATURE COMPLIANCE   \n`;
    output    += `       Generated: ${new Date().toLocaleString()}\n`;
    output    += `==================================================\n\n`;

    output += `Location       | Temperature | Humidity | Target Range        | Compliance\n`;
    output += `--------------------------------------------------------------------------\n`;
    
    const zones = [
      { name: "Cold Storage A", temp: "3.8°C", hum: "85%", target: "2.0°C-5.0°C / 80%-90%", stat: "Optimal" },
      { name: "Cold Storage B", temp: "8.2°C", hum: "60%", target: "2.0°C-5.0°C / 70%-80%", stat: "Critical" },
      { name: "Freezer Zone A", temp: "-18.2°C", hum: "45%", target: "-22.0°C--15.0°C / 40%-50%", stat: "Optimal" },
      { name: "Shelf B1", temp: "18.2°C", hum: "62%", target: "15.0°C-22.0°C / 55%-65%", stat: "Optimal" },
      { name: "Shelf C2", temp: "14.5°C", hum: "78%", target: "12.0°C-16.0°C / 60%-70%", stat: "Warning" }
    ];

    zones.forEach(z => {
      output += `${z.name.padEnd(14)} | ${z.temp.padEnd(11)} | ${z.hum.padEnd(8)} | ${z.target.padEnd(20)} | ${z.stat}\n`;
    });

    output += `\nCalibrations Status: HACCP regulations compliance rate logs: 80%`;
    return output;
  }
};

window.viewReportPreview = (reportType) => {
  const foods = MockStore.getFoods() || [];
  const generator = REPORT_GENERATORS[reportType];
  
  if (!generator) return;

  const content = generator(foods);
  currentPreviewType = reportType;

  // Set HTML values
  document.getElementById("preview-title").textContent = `${reportType.toUpperCase()} REPORT PREVIEW`;
  document.getElementById("preview-body-content").textContent = content;

  // Add click download trigger
  document.getElementById("download-from-preview-btn").onclick = () => {
    triggerSimulatedDownload(reportType, 'pdf');
  };

  // Open modal
  document.getElementById("report-preview-modal").classList.add("active");
};

window.closePreviewModal = () => {
  document.getElementById("report-preview-modal").classList.remove("active");
};

// Simulated Export Blob downloader
window.triggerSimulatedDownload = (reportType, format) => {
  const foods = MockStore.getFoods() || [];
  const generator = REPORT_GENERATORS[reportType];
  
  if (!generator) return;

  const textData = generator(foods);
  
  // Create virtual file download
  const blob = new Blob([textData], { type: "text/plain" });
  const url = window.URL.createObjectURL(blob);
  
  const link = document.createElement("a");
  link.href = url;
  link.download = `freshguard_${reportType}_report.${format === 'xlsx' ? 'csv' : 'txt'}`;
  
  document.body.appendChild(link);
  link.click();
  
  // Clean up resource
  setTimeout(() => {
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }, 100);

  alert(`Simulated report generated! Downloaded: "freshguard_${reportType}_report.${format === 'xlsx' ? 'csv' : 'txt'}" successfully.`);
};
