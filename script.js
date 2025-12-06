// Global conversion constant (1 Liter = 1000 Milliliters)
const ML_PER_LITER = 1000;
const CM_PER_IN = 2.54;

/**
 * Calculates Body Surface Area (BSA) and triggers the next calculation.
 */
function calculateBSA() {   
    let height = parseFloat(document.getElementById('height_input').value) || 0;
    const heightUnit = document.getElementById('height_unit').value;
    let weight = parseFloat(document.getElementById('weight_input').value) || 0;
    const weightUnit = document.getElementById('weight_unit').value;
    let height_cm = height;
    let weight_kg = weight;
    if (heightUnit === 'in') {
        height_cm = height * CM_PER_IN;
    }
    if (weightUnit === 'lb') {
        weight_kg = weight * 0.453592; 
    }
    let bsa_result = 0.00;
    if (height_cm > 0 && weight_kg > 0) {
        const valueInsideRoot = (height_cm * weight_kg) / 3600;
        bsa_result = Math.sqrt(valueInsideRoot);
    }
    const formattedBSA = bsa_result.toFixed(2);
    // Update the BSA result cell in the first table
    document.getElementById('bsa-result').textContent = formattedBSA;
    // AUTO-UPDATE: Set the value of the BSA input in the second table
    document.getElementById('bsa_input').value = formattedBSA;
    calculatePredictedMinuteVentilation(); 
}

/**
 * Calculates Predicted Minute Ventilation (MV) and chains to the third table.
 * Formula: MV (L/min) = BSA (m^2) * Factor (4 for M, 3.5 for F)
 */
function calculatePredictedMinuteVentilation() {
    const bsa = parseFloat(document.getElementById('bsa_input').value) || 0;
    const genderUnit = document.getElementById('gender_unit').value;
    let predictedMVFactor = (genderUnit === 'M') ? 4 : 3.5;
    let predictedMV = bsa * predictedMVFactor;
    const formattedMV = predictedMV.toFixed(2);
    document.getElementById('result-predicted-mv').textContent = formattedMV;
    document.getElementById('predicted-mv-input').value = formattedMV; 
    calculatePredictedRespiratoryRate();
}

/**
 * Calculates the Predicted Respiratory Rate (RR).
 * Formula: RR (breaths/min) = MV (L/min) / TV (L)
 */
function calculatePredictedRespiratoryRate() {
    let predicted_tv = parseFloat(document.getElementById('tidal-volume-predict-input').value) || 0;
    const predicted_mv = parseFloat(document.getElementById('predicted-mv-input').value) || 0;
    const tidalVolumeUnit = document.getElementById('tidal-volume-unit').value;
    if (tidalVolumeUnit == 'mL') {
        predicted_tv = predicted_tv / ML_PER_LITER;
    }
    let predictedRR = 0.00;
    if (predicted_tv > 0 && predicted_mv > 0) {
        predictedRR = predicted_mv / predicted_tv;
    }
    // Update the result cell in the third table
    document.getElementById('result-predicted-rr').textContent = predictedRR.toFixed(2); 
}

/**
 * Calculates the Adjusted Respiratory Rate (RR).
 * Formula: RR_A (breaths/min) = (RR_curr (breaths/min) * PaCo2_curr (mmHg)) / PaCo2_des (mmHg)
 */

function calculateRRAdjustment(){
    let currentRR = parseFloat(document.getElementById('curr-rr-input').value) || 0;
    let currentPaCo2 = parseFloat(document.getElementById('curr-pac02-rr').value) || 0;
    let desiredPaCo2 = parseFloat(document.getElementById('desired-pac02-rr').value) || 0;
    let adjustedRR = 0.00;
    if (currentRR > 0 && currentPaCo2 > 0 && desiredPaCo2 > 0) {
        adjustedRR = (currentRR * currentPaCo2) / desiredPaCo2;
    }
    document.getElementById('result-adjusted-rr').textContent = adjustedRR.toFixed(2);
}

/**
 * Calculates the Tidal Volume (RR).
 * Formula: TV_A (L) = (TV_curr (L) * PaCo2_curr (mmHg)) / PaCo2_des (mmHg)
 */

function calculateTVAdjustment(){
    let currentTV = parseFloat(document.getElementById('curr-tv-input').value) || 0;
    const tidalVolumeUnitIn = document.getElementById('tidal-volume-unit-adj-in').value;
    if (tidalVolumeUnitIn == 'mL'){
        currentTV = currentTV / ML_PER_LITER;
    }
    let currentPaCo2 = parseFloat(document.getElementById('curr-pac02-tv').value) || 0;
    let desiredPaCo2 = parseFloat(document.getElementById('desired-pac02-tv').value) || 0;
    let adjustedTV = 0.00;
    const tidalVolumeUnitOut = document.getElementById('tidal-volume-unit-adj-out').value;
    if (currentTV > 0 && currentPaCo2 > 0 && desiredPaCo2 > 0) {
        adjustedTV = (currentTV * currentPaCo2) / desiredPaCo2;
        if (tidalVolumeUnitOut == 'mL'){
            adjustedTV = adjustedTV * ML_PER_LITER;
        }
    }
    document.getElementById('result-adjusted-tv').textContent = adjustedTV.toFixed(2);
}
// Initialize calculations on load
calculateBSA();
calculateRRAdjustment();
calculateTVAdjustment();