function applyRules(data) {
    let status = "normal";
    let irrigation = "off";
    let alert = [];
    let actions = [];
    if (data.moisture < 30) {
        irrigation = "on";
        alert.push("Low moisture detected");
        actions.push("Turn on irrigation");
    }
    if (data.moisture > 70) {
        irrigation = "off";
        alert.push("High moisture detected");
        actions.push("Turn off irrigation");
    }
    if (data.ph < 5.5) {
        status = "acidic";
        alert.push("Acidic soil detected");
        actions.push("Add lime to increase pH");
    }
    if (data.ph > 7.5) {
        status = "alkaline";
        alert.push("Alkaline soil detected");
        actions.push("Add sulfur to decrease pH");
    }
    if (data.temperature > 35) {
        status = "hot";
        alert.push("High temperature detected");
        actions.push("Increase ventilation");
    }
    if (data.temperature < 10) {
        status = "cold";
        alert.push("Low temperature detected");
        actions.push("Increase temperature");
    }
    if (data.humidity > 80) {
        status = "humid";
        alert.push("High humidity detected");
        actions.push("Increase ventilation");
    }
    if (data.humidity < 20) {
        status = "dry";
        alert.push("Low humidity detected");
        actions.push("Decrease ventilation");
    }
    if (data.npk < 10) {
        status = "Low NPK";
        alert.push("Low NPK detected");
        actions.push("Add fertilizer");
    }
    if (data.npk > 50) {
        status = "High NPK";
        alert.push("High NPK detected");
        actions.push("Reduce fertilizer");
    }
    if (data.npk > 10 && data.npk < 50) {
        status = "Normal NPK";
        actions.push("No action needed");
    }
    if (data.moisture > 30 && data.moisture < 70) {
        status = "Normal moisture";
        actions.push("No action needed");
    }
    if (data.ph > 5.5 && data.ph < 7.5) {
        status = "Normal pH";
        actions.push("No action needed");
    }
    if (data.temperature > 10 && data.temperature < 35) {
        status = "Normal temperature";
        actions.push("No action needed");
    }
    if (data.humidity > 20 && data.humidity < 80) {
        status = "Normal humidity";
        actions.push("No action needed");
    }
    return { status, irrigation, alert, actions };
}
module.exports = { applyRules } 