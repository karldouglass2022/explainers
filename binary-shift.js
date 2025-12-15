(function () {
  const BIT_COUNT = 8;
  const MAX_VALUE = 255;

  // Inputs
  const startValueInput = document.getElementById('startValue');
  const shiftAmountInput = document.getElementById('shiftAmount');
  const shiftAmountLabel = document.getElementById('shiftAmountLabel');
  const directionRadios = document.querySelectorAll('input[name="shiftDirection"]');

  // Bit rows
  const bitWeightsRow = document.getElementById('bitWeightsRow');
  const rowOriginal = document.getElementById('rowOriginal');
  const rowShifted = document.getElementById('rowShifted');
  const rowLost = document.getElementById('rowLost');

  // Pills + meta labels
const shiftStatus = document.getElementById('shiftStatus');
const shiftOverflowItem = document.getElementById('shiftOverflowItem');
const shiftInfoLossItem = document.getElementById('shiftInfoLossItem');

  const startValueLabel = document.getElementById('startValueLabel');
  const resultValueLabel = document.getElementById('resultValueLabel');
  const shiftMathLabel = document.getElementById('shiftMathLabel');

  // Explanation + summary
  const shiftModeLabel = document.getElementById('shiftModeLabel');
  const shiftExplanationMain = document.getElementById('shiftExplanationMain');
  const summaryBinaryOriginal = document.getElementById('summaryBinaryOriginal');
  const summaryBinaryShifted = document.getElementById('summaryBinaryShifted');
  const summaryDenaryOriginal = document.getElementById('summaryDenaryOriginal');
  const summaryDenaryShifted = document.getElementById('summaryDenaryShifted');
  const summaryShiftEffect = document.getElementById('summaryShiftEffect');

  // Buttons (top + bottom)
  const btnApplyShift = document.getElementById('btnApplyShift');
  const btnResetShift = document.getElementById('btnResetShift');
  const btnExample = document.getElementById('btnExample');

  const btnApplyShiftBottom = document.getElementById('btnApplyShiftBottom');
  const btnResetShiftBottom = document.getElementById('btnResetShiftBottom');
  const btnExampleBottom = document.getElementById('btnExampleBottom');

  function clampByte(n) {
    if (isNaN(n)) return 0;
    n = Math.floor(n);
    if (n < 0) return 0;
    if (n > MAX_VALUE) return MAX_VALUE;
    return n;
  }

  function toBinary8(n) {
    return n.toString(2).padStart(BIT_COUNT, '0');
  }

  function buildWeightsRow() {
    const weights = [128, 64, 32, 16, 8, 4, 2, 1];
    bitWeightsRow.innerHTML = '';
    weights.forEach(w => {
      const div = document.createElement('div');
      div.className = 'bit-weight';
      div.textContent = w;
      bitWeightsRow.appendChild(div);
    });
  }

  function buildBitRow(container, binaryString) {
    container.innerHTML = '';
    for (let i = 0; i < BIT_COUNT; i++) {
      const div = document.createElement('div');
      div.className = 'bit-cell';
      div.textContent = binaryString[i] || '0';
      container.appendChild(div);
    }
  }

  function buildLostRow(binaryString, lostIndices) {
    rowLost.innerHTML = '';
    for (let i = 0; i < BIT_COUNT; i++) {
      const div = document.createElement('div');
      div.className = 'bit-cell';
      if (lostIndices.includes(i) && binaryString[i] === '1') {
        div.classList.add('lost-bit');
        div.textContent = '1';
      } else {
        div.textContent = '0';
      }
      rowLost.appendChild(div);
    }
  }

  function getDirection() {
    let dir = 'left';
    directionRadios.forEach(r => {
      if (r.checked) dir = r.value;
    });
    return dir;
  }

  function updateShift() {
    const dir = getDirection();
    const shiftAmount = parseInt(shiftAmountInput.value, 10) || 0;
    const rawStart = parseInt(startValueInput.value, 10);
    const startVal = clampByte(rawStart);
    startValueInput.value = startVal;

    shiftAmountLabel.textContent = shiftAmount.toString();

    const binOriginal = toBinary8(startVal);
    let resultVal = startVal;
    let binShifted = binOriginal;
    let lostIndices = [];
    let overflow = false;
    let infoLoss = false;

    if (shiftAmount === 0) {
      // No movement at all
      resultVal = startVal;
      binShifted = binOriginal;
      lostIndices = [];
    } else if (dir === 'left') {
      const rawShift = startVal << shiftAmount;
      resultVal = rawShift & 0xFF;
      binShifted = toBinary8(resultVal);

      // bits that moved off the left: indices 0..shiftAmount-1
      lostIndices = [];
      for (let i = 0; i < shiftAmount; i++) {
        lostIndices.push(i);
      }
      overflow = lostIndices.some(i => binOriginal[i] === '1');
      infoLoss = false;
    } else {
      // right shift
      resultVal = startVal >> shiftAmount;
      binShifted = toBinary8(resultVal);

      // bits that fell off the right: indices 8-shiftAmount..7
      lostIndices = [];
      for (let i = BIT_COUNT - shiftAmount; i < BIT_COUNT; i++) {
        lostIndices.push(i);
      }
      overflow = false;
      infoLoss = lostIndices.some(i => binOriginal[i] === '1');
    }

    // Update visuals
    buildBitRow(rowOriginal, binOriginal);
    buildBitRow(rowShifted, binShifted);
    buildLostRow(binOriginal, lostIndices);

    // Pills
// Status messages (pill + text)
if (shiftAmount === 0) {
  shiftStatus.style.display = 'none';
  shiftOverflowItem.style.display = 'none';
  shiftInfoLossItem.style.display = 'none';
} else {
  const showAny = overflow || infoLoss;
  shiftStatus.style.display = showAny ? 'flex' : 'none';
  shiftOverflowItem.style.display = overflow ? 'flex' : 'none';
  shiftInfoLossItem.style.display = infoLoss ? 'flex' : 'none';
}


    // Meta labels
    startValueLabel.textContent = startVal.toString();
    resultValueLabel.textContent = resultVal.toString();

    if (dir === 'left') {
      shiftMathLabel.innerHTML =
        shiftAmount === 0
          ? 'Approx: <strong>&times; 1</strong> (no shift)'
          : `Approx: <strong>&times; 2<sup>${shiftAmount}</sup></strong>`;
    } else {
      shiftMathLabel.innerHTML =
        shiftAmount === 0
          ? 'Approx: <strong>&divide; 1</strong> (no shift)'
          : `Approx: <strong>&divide; 2<sup>${shiftAmount}</sup></strong> (integer division)`;
    }

    // Explanation + summary
    updateExplanation(
      dir,
      shiftAmount,
      startVal,
      resultVal,
      binOriginal,
      binShifted,
      overflow,
      infoLoss
    );
  }

  function updateExplanation(
    dir,
    shiftAmount,
    startVal,
    resultVal,
    binOriginal,
    binShifted,
    overflow,
    infoLoss
  ) {
    const modeText = dir === 'left' ? 'Left shift' : 'Right shift';
    shiftModeLabel.innerHTML = `Mode: <strong>${modeText}</strong>`;

    summaryBinaryOriginal.textContent = binOriginal;
    summaryBinaryShifted.textContent = binShifted;
    summaryDenaryOriginal.textContent = startVal.toString();
    summaryDenaryShifted.textContent = resultVal.toString();

    if (shiftAmount === 0) {
      shiftExplanationMain.innerHTML =
        'Shift amount is 0, so the bits do not move. The binary pattern and the denary value both stay the same.';
      summaryShiftEffect.innerHTML =
        'Effect: <strong>No change (shift by 0 bits)</strong>';
      return;
    }

    if (dir === 'left') {
      let text =
        `A left shift by <strong>${shiftAmount}</strong> moves every bit that many places to the left. ` +
        `This usually multiplies the value by <strong>2<sup>${shiftAmount}</sup></strong>.<br><br>` +
        `Here we start with <strong>${startVal}</strong> (${binOriginal}) and get ` +
        `<strong>${resultVal}</strong> (${binShifted}).`;

      if (overflow) {
        text +=
          '<br><br>One or more <strong>1</strong> bits were shifted past the left-hand side, ' +
          'so they are lost. This is an <strong>overflow</strong> in 8 bits.';
      } else {
        text +=
          '<br><br>No 1 bits were shifted off the left-hand side, so there is no overflow in 8 bits.';
      }

      shiftExplanationMain.innerHTML = text;
      summaryShiftEffect.innerHTML =
        `Effect: <strong>Left shift by ${shiftAmount} ≈ &times; 2<sup>${shiftAmount}</sup></strong>`;
    } else {
      let text =
        `A right shift by <strong>${shiftAmount}</strong> moves every bit that many places to the right. ` +
        `This is like dividing by <strong>2<sup>${shiftAmount}</sup></strong> and discarding any remainder.<br><br>` +
        `Here we start with <strong>${startVal}</strong> (${binOriginal}) and get ` +
        `<strong>${resultVal}</strong> (${binShifted}).`;

      if (infoLoss) {
        text +=
          '<br><br>Some <strong>1</strong> bits fell off the right-hand side. That information is lost, ' +
          'so the shift is not exactly reversible.';
      } else {
        text +=
          '<br><br>Only 0s fell off the right-hand side, so no information was lost in this particular example.';
      }

      shiftExplanationMain.innerHTML = text;
      summaryShiftEffect.innerHTML =
        `Effect: <strong>Right shift by ${shiftAmount} ≈ &divide; 2<sup>${shiftAmount}</sup> (rounded down)</strong>`;
    }
  }

  // Example button: pick something that shows overflow / info loss
  function applyExample() {
    const dir = getDirection();
    if (dir === 'left') {
      // e.g. 160 << 2 -> overflow
      startValueInput.value = 160;
      shiftAmountInput.value = 2;
    } else {
      // e.g. 13 >> 2 -> info loss
      startValueInput.value = 13;
      shiftAmountInput.value = 2;
    }
    updateShift();
  }

  function resetShift() {
    startValueInput.value = 13;
    shiftAmountInput.value = 1;
    directionRadios.forEach(r => {
      r.checked = r.value === 'left';
    });
    updateShift();
  }

  // Event wiring
  shiftAmountInput.addEventListener('input', updateShift);
  startValueInput.addEventListener('change', updateShift);

  directionRadios.forEach(radio => {
    radio.addEventListener('change', updateShift);
  });

  btnApplyShift.addEventListener('click', updateShift);
  btnResetShift.addEventListener('click', resetShift);
  btnExample.addEventListener('click', applyExample);

  if (btnApplyShiftBottom) {
    btnApplyShiftBottom.addEventListener('click', updateShift);
  }
  if (btnResetShiftBottom) {
    btnResetShiftBottom.addEventListener('click', resetShift);
  }
  if (btnExampleBottom) {
    btnExampleBottom.addEventListener('click', applyExample);
  }

  // Init
  buildWeightsRow();
  resetShift();
})();
