// Global conversion constant (1 Liter = 1000 Milliliters)
const ML_PER_LITER = 1000;
const CM_PER_IN = 2.54;

/**
 * Helper function to select all text in an input box when focused,
 * ONLY if the current value is '0' or '0.00'.
 * @param {HTMLElement} element - The input element (e.g., document.getElementById('pi_height_input')).
 */
function selectOnFocus(element) {
    // Get the current value and trim any whitespace
    const currentValue = element.value.trim();
    
    // Check if the value is numerically zero (handles '0', '0.0', '0.00', etc.)
    if (parseFloat(currentValue) === 0) {
        element.select();
    }
}

/**
 * Determines which Tidal Volume radio button is selected (6, 7, or 8 ml/kg)
 * and returns its calculated value.
 * If the "Custom" option is selected, it returns the value from the custom input.
 * @returns {number} The selected Tidal Volume in milliliters (mL).
 */
function getSelectedTidalVolume() {
    let selectedTV = 0;
    
    // 1. Get the checked radio button
    const checkedRadio = document.querySelector('input[name="choice"]:checked');

    if (checkedRadio) {
        // 2. Determine the ID of the associated text input field
        let valueElementId = '';
        
        // The value of the radio button corresponds to the value input ID suffix
        if (checkedRadio.value === 'tvoption1') {
            valueElementId = 'tv-value-1'; // 6 ml/kg
        } else if (checkedRadio.value === 'tvoption2') {
            valueElementId = 'tv-value-2'; // 7 ml/kg
        } else if (checkedRadio.value === 'tvoption3') {
            valueElementId = 'tv-value-3'; // 8 ml/kg
        } else if (checkedRadio.value === 'tvoption4') {
            valueElementId = 'tv-value-4'; // Custom input
        }

        // 3. Get the value from the corresponding input field
        const valueElement = document.getElementById(valueElementId);
        if (valueElement) {
            // Use parseFloat to convert the string value to a number
            selectedTV = parseFloat(valueElement.value) || 0;
        }
    }
    return selectedTV;
}

/**
 * Calculates Predicted Ventilator Settings
 */
function calculatePVS(){

    // Gather initial inputs
    let height = parseFloat(document.getElementById('pi_height_input').value) || 0;
    const heightUnit = document.getElementById('pi_height_unit').value;
    let weight = parseFloat(document.getElementById('pi_weight_input').value) || 0;
    const weightUnit = document.getElementById('pi_weight_unit').value;
    let height_cm = height;
    let weight_kg = weight;
    if (heightUnit === 'in') {
        height_cm = height * CM_PER_IN;
    }
    if (weightUnit === 'lb') {
        weight_kg = weight * 0.453592;
    }
    const genderUnit = document.getElementById('pi_gender_unit').value;

    // Calcuate Tidal Volume Selection Zone
    let ibw = 0.00;
    if (height >= 60 && genderUnit == 'M'){
        ibw = 50 + (2.3 * (height - 60));
    } else if (height >= 60 && genderUnit == 'F'){
        ibw = 45.5 + (2.3 * (height - 60));
    } else{ // height less than 60
        ibw = 50 + ((2 * 0.453592) * (height - 60));
    }
    let tv_6mlkg = ibw * 6;
    let tv_7mlkg = ibw * 7;
    let tv_8mlkg = ibw * 8;
    if (height_cm > 0 && weight_kg > 0){
        document.getElementById("tv-value-1").value = tv_6mlkg.toFixed(2);
        document.getElementById("tv-value-2").value = tv_7mlkg.toFixed(2);
        document.getElementById("tv-value-3").value = tv_8mlkg.toFixed(2);
    }
    let predicted_bsa = 0.00;
    if (height_cm > 0 && weight_kg > 0) {
        const valueInsideRoot = (height_cm * weight_kg) / 3600;
        predicted_bsa = Math.sqrt(valueInsideRoot);
    }
    const formattedBSA = predicted_bsa.toFixed(2);
    // Update the BSA result cell in the first table
    document.getElementById('pr-bsa').textContent = formattedBSA;

    // predicted minute ventilation
    let predictedMVFactor = (genderUnit === 'M') ? 4 : 3.5;
    let predicted_mv = 0.00;
    predicted_mv = predicted_bsa * predictedMVFactor;
    const formattedMV = predicted_mv.toFixed(2);
    document.getElementById('pr-mv').textContent = formattedMV;

    // predicted respiratory rate
    const tidalVolume = getSelectedTidalVolume();
    let predicted_rr = 0.00;
    if (tidalVolume > 0 && predicted_mv > 0){
        predicted_rr = predicted_mv / (tidalVolume/1000);
    }
    document.getElementById('pr-rr').textContent = predicted_rr.toFixed(2);
}

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
calculatePVS();
calculateRRAdjustment();
calculateTVAdjustment();