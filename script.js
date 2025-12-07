// Global conversion constant
const ML_PER_LITER = 1000;
const CM_PER_IN = 2.54;
const KG_PER_LB = 0.453592; // 1 lb = 0.453592 kg

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
            selectedTV = parseFloat(valueElement.value) || 0;
        }
    }
    return selectedTV;
}

/**
 * Calculates Predicted Ventilator Settings
 */
function calculatePVS(){

    // Gather raw inputs
    let height = parseFloat(document.getElementById('pi_height_input').value) || 0;
    const heightUnit = document.getElementById('pi_height_unit').value;
    let weight = parseFloat(document.getElementById('pi_weight_input').value) || 0;
    const weightUnit = document.getElementById('pi_weight_unit').value;
    const genderUnit = document.getElementById('pi_gender_unit').value;
    
    // --- 1. Height and Weight Standardization ---

    // Standardize Height to inches (in) for IBW calculation
    let height_in = height;
    if (heightUnit === 'cm') {
        height_in = height / CM_PER_IN;
    }
    
    // Standardize Height to cm and Weight to kg for BSA calculation
    let height_cm = height;
    let weight_kg = weight;
    if (heightUnit === 'in') {
        height_cm = height * CM_PER_IN;
    }
    if (weightUnit === 'lb') {
        weight_kg = weight * KG_PER_LB;
    }
    
    // --- 2. IBW (Ideal Body Weight) Calculation ---
    let ibw = 0.00;
    
    // IBW must use height in inches (height_in)
    if (height_in > 0) { // Only calculate if height is valid
        if (height_in >= 60) {
            if (genderUnit == 'M') {
                ibw = 50 + (2.3 * (height_in - 60));
            } else if (genderUnit == 'F') {
                ibw = 45.5 + (2.3 * (height_in - 60));
            }
        } else { 
            // For height less than 60 in, use a standardized approach (often the male formula)
            // Sticking to the most direct interpretation of the non-standard formula you provided previously:
            ibw = 50 + ((2 * KG_PER_LB) * (height_in - 60));
        }
    }

    let tv_6mlkg = ibw * 6;
    let tv_7mlkg = ibw * 7;
    let tv_8mlkg = ibw * 8;
    
    // Update the Tidal Volume fields if we have valid inputs
    if (height_in > 0 && weight_kg > 0){
        document.getElementById("tv-value-1").value = tv_6mlkg.toFixed(2);
        document.getElementById("tv-value-2").value = tv_7mlkg.toFixed(2);
        document.getElementById("tv-value-3").value = tv_8mlkg.toFixed(2);
    }

    // --- 3. BSA (Body Surface Area) Calculation ---
    let predicted_bsa = 0.00;
    if (height_cm > 0 && weight_kg > 0) {
        const valueInsideRoot = (height_cm * weight_kg) / 3600;
        predicted_bsa = Math.sqrt(valueInsideRoot);
    }
    const formattedBSA = predicted_bsa.toFixed(2);
    document.getElementById('pr-bsa').textContent = formattedBSA;

    // --- 4. Predicted MV (Minute Ventilation) ---
    let predictedMVFactor = (genderUnit === 'M') ? 4 : 3.5;
    let predicted_mv = predicted_bsa * predictedMVFactor;
    const formattedMV = predicted_mv.toFixed(2);
    document.getElementById('pr-mv').textContent = formattedMV;

    // --- 5. Predicted RR (Respiratory Rate) ---
    const tidalVolume = getSelectedTidalVolume(); // Already in mL
    let predicted_rr = 0.00;
    if (tidalVolume > 0 && predicted_mv > 0){
        // predicted_mv is in L/min, tidalVolume (mL) converted to L
        predicted_rr = predicted_mv / (tidalVolume / ML_PER_LITER);
    }
    document.getElementById('pr-rr').textContent = predicted_rr.toFixed(2);
}

/**
 * Converts the value in the input field based on the old and new unit
 * and then triggers the main calculation.
 * @param {string} inputId - The ID of the input field (e.g., 'pi_height_input').
 * @param {string} unitId - The ID of the unit select (e.g., 'pi_height_unit').
 * @param {number} conversionFactor - The factor for conversion (CM_PER_IN or KG_PER_LB).
 */
function convertUnitAndCalculate(inputId, unitId, conversionFactor) {
    const inputElement = document.getElementById(inputId);
    const unitElement = document.getElementById(unitId);
    let value = parseFloat(inputElement.value) || 0;
    
    const previousUnit = unitElement.getAttribute('data-previous-unit');
    const currentUnit = unitElement.value;

    if (previousUnit && previousUnit !== currentUnit) {
        if (unitId === 'pi_height_unit') {
            // Height: in <-> cm
            if (currentUnit === 'cm' && previousUnit === 'in') {
                value = value * conversionFactor; // inches to cm
            } else if (currentUnit === 'in' && previousUnit === 'cm') {
                value = value / conversionFactor; // cm to inches
            }
        } else if (unitId === 'pi_weight_unit') {
            // Weight: lb <-> kg
            if (currentUnit === 'kg' && previousUnit === 'lb') {
                value = value * conversionFactor; // lb to kg
            } else if (currentUnit === 'lb' && previousUnit === 'kg') {
                value = value / conversionFactor; // kg to lb
            }
        }
        
        inputElement.value = value.toFixed(2);
    }
    
    unitElement.setAttribute('data-previous-unit', currentUnit);

    calculatePVS();
}

/**
 * Calculates the Adjusted Respiratory Rate (RR).
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
 * Calculates the Adjusted Tidal Volume (TV).
 */
function calculateTVAdjustment(){
    let currentTV = parseFloat(document.getElementById('curr-tv-input').value) || 0;
    const tidalVolumeUnitIn = document.getElementById('tidal-volume-unit-adj-in').value;
    
    // Convert TV input to Liters (L) for calculation
    if (tidalVolumeUnitIn == 'mL'){
        currentTV = currentTV / ML_PER_LITER;
    }
    
    let currentPaCo2 = parseFloat(document.getElementById('curr-pac02-tv').value) || 0;
    let desiredPaCo2 = parseFloat(document.getElementById('desired-pac02-tv').value) || 0;
    let adjustedTV = 0.00;
    
    const tidalVolumeUnitOut = document.getElementById('tidal-volume-unit-adj-out').value;
    
    if (currentTV > 0 && currentPaCo2 > 0 && desiredPaCo2 > 0) {
        adjustedTV = (currentTV * currentPaCo2) / desiredPaCo2;
        
        // Convert TV output back to milliliters (mL) if selected
        if (tidalVolumeUnitOut == 'mL'){
            adjustedTV = adjustedTV * ML_PER_LITER;
        }
    }
    document.getElementById('result-adjusted-tv').textContent = adjustedTV.toFixed(2);
}

/**
 * Toggles the visibility of the calculation notes section.
 * @param {HTMLElement} header - The clicked header element (h3).
 */
function toggleNotes(header) {
    const content = header.nextElementSibling;
    
    if (content.style.display === "block") {
        content.style.display = "none";
        header.innerHTML = '&#9432; Equation Notes & Formulas';
    } else {
        content.style.display = "block";
        header.innerHTML = '&#9432; Equation Notes & Formulas (Click to Hide)';
    }
}


// Function to set the initial previous unit data-attribute
function initializeUnitTracking() {
    document.getElementById('pi_height_unit').setAttribute('data-previous-unit', document.getElementById('pi_height_unit').value);
    document.getElementById('pi_weight_unit').setAttribute('data-previous-unit', document.getElementById('pi_weight_unit').value);
}

// Initialize on load
initializeUnitTracking();
calculatePVS();
calculateRRAdjustment();
calculateTVAdjustment();