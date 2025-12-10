(function () {
  const inputA = document.getElementById('inputA');
  const inputB = document.getElementById('inputB');
  const rowA = document.getElementById('rowA');
  const rowB = document.getElementById('rowB');
  const rowResult = document.getElementById('rowResult');
  const carryRow = document.getElementById('carryRow');
  const overflowPill = document.getElementById('overflowPill');

  const overflowBitCell = document.getElementById('overflowBitCell');
  const overflowBitValue = overflowBitCell
    ? overflowBitCell.querySelector('.overflow-bit-value')
    : null;

const btnStart = document.getElementById('btnStart');
const btnRandom = document.getElementById('btnRandom');
const btnOverflowExample = document.getElementById('btnOverflowExample');
const btnNextStep = document.getElementById('btnNextStep');
const btnAutoPlay = document.getElementById('btnAutoPlay');
const btnPause = document.getElementById('btnPause');
const btnInlineReset = document.getElementById('btnInlineReset');


  const stepIndexLabel = document.getElementById('stepIndexLabel');
  const explanationMain = document.getElementById('explanationMain');
  const summaryDecimal = document.getElementById('summaryDecimal');
  const summaryBinary = document.getElementById('summaryBinary');
  const summaryOverflow = document.getElementById('summaryOverflow');

  const teacherModeToggle = document.getElementById('teacherModeToggle');
  const workingPanel = document.getElementById('workingPanel');
  const workingTable = document.getElementById('workingTable');

  let teacherMode = false;

  let currentStep = -1; // -1 = not started
  let steps = [];
  let autoplayTimer = null;
  let bitsA = [], bitsB = [], bitsResult = [];
  let hasOverflow = false;
  let lastOverflowCarry = 0;
  const BIT_COUNT = 8;

  function clampToByte(value) {
    if (isNaN(value)) return 0;
    value = Math.floor(value);
    if (value < 0) return 0;
    if (value > 255) return 255;
    return value;
  }

  function to8BitBinary(value) {
    const bin = value.toString(2);
    return bin.padStart(BIT_COUNT, '0');
  }

  function clearBits(container) {
    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }
  }

  // rowId used so we can keep A/B filled, but leave result row blank initially
  function buildBitCells(container, binaryString, rowId) {
    clearBits(container);
    for (let i = 0; i < BIT_COUNT; i++) {
      const span = document.createElement('div');
      span.className = 'bit-cell';
      let ch;
      if (binaryString) {
        ch = binaryString[i];
      } else if (rowId === 'R') {
        ch = ''; // result row starts blank until Next Bit is pressed
      } else {
        ch = '0';
      }
      span.textContent = ch;
      span.dataset.bitIndex = i.toString();
      span.dataset.rowId = rowId;
      container.appendChild(span);
    }
  }

  // Carry row: 8 badges (one per bit column)
  function buildCarryRow() {
    clearBits(carryRow);
    for (let i = 0; i < BIT_COUNT; i++) {
      const badge = document.createElement('div');
      badge.className = 'carry-badge';
      badge.textContent = ' ';
      badge.dataset.carryIndex = i.toString();
      carryRow.appendChild(badge);
    }
  }

  function updateSummary(a, b, result, binA, binB, binR) {
    summaryDecimal.textContent = `${a} + ${b} = ${result}`;
    summaryBinary.textContent = `${binA} + ${binB} = ${binR}`;
    if (hasOverflow) {
      summaryOverflow.innerHTML = 'Overflow: <strong>Yes – result is bigger than 8 bits.</strong>';
    } else {
      summaryOverflow.innerHTML = 'Overflow: <strong>No – result fits in 8 bits.</strong>';
    }
  }

  // Compute all steps + carries (carries point to the NEXT column to the left)
  function computeSteps(aValue, bValue) {
    const binaryA = to8BitBinary(aValue);
    const binaryB = to8BitBinary(bValue);

    bitsA = binaryA.split('').map(x => parseInt(x, 10));
    bitsB = binaryB.split('').map(x => parseInt(x, 10));
    bitsResult = new Array(BIT_COUNT).fill(0);

    const resultFull = aValue + bValue;
    const binaryResultFull = resultFull.toString(2);
    hasOverflow = binaryResultFull.length > BIT_COUNT;
    const binaryResult = hasOverflow
      ? binaryResultFull.slice(binaryResultFull.length - BIT_COUNT)
      : binaryResultFull.padStart(BIT_COUNT, '0');

    bitsResult = binaryResult.split('').map(x => parseInt(x, 10));

    steps = [];
    let carry = 0;
    const carryValues = new Array(BIT_COUNT).fill(0); // carry INTO each column (0..7)
    let overflowCarry = 0;

    // Work from LSB (index 7) back to MSB (0)
    for (let bitPos = BIT_COUNT - 1; bitPos >= 0; bitPos--) {
      const aBit = bitsA[bitPos];
      const bBit = bitsB[bitPos];
      const sum = aBit + bBit + carry;
      const sumBit = sum % 2;
      const carryOut = sum > 1 ? 1 : 0;

      steps.push({
        bitPos,
        aBit,
        bBit,
        carryIn: carry,
        sumBit,
        carryOut
      });

      // carryOut goes into the NEXT column to the left
      if (carryOut === 1) {
        if (bitPos > 0) {
          // carry goes into bitPos-1
          carryValues[bitPos - 1] = 1;
        } else {
          // carry out of MSB -> overflow
          overflowCarry = 1;
        }
      }

      carry = carryOut;
    }

    lastOverflowCarry = overflowCarry;

    return {
      binaryA,
      binaryB,
      binaryResult,
      resultFull,
      carryValues,
      overflowCarry
    };
  }

  function resetHighlights() {
    const allCells = document.querySelectorAll('.bit-cell');
    allCells.forEach(cell => {
      cell.classList.remove('active', 'result-filled');
    });
    const carryBadges = document.querySelectorAll('.carry-badge');
    carryBadges.forEach(badge => {
      badge.classList.remove('active', 'carry-new');
      badge.textContent = ' ';
    });
  }

  // Decide when a particular carry into column j should be visible
  function shouldCarryBeVisible(columnIndex, uptoStepIndex) {
    // Carry into column 0 comes from step with bitPos 1
    // steps[0] is bitPos 7, steps[1] is 6, ... steps[7] is 0
    // step index for carry INTO column j is:
    // s = BIT_COUNT - 2 - j
    const stepIndexForThisCarry = BIT_COUNT - 2 - columnIndex;
    return uptoStepIndex >= stepIndexForThisCarry;
  }

  function applyCarryValues(carryValues, uptoStepIndex) {
    const badges = document.querySelectorAll('.carry-badge');
    badges.forEach(badge => {
      const idx = parseInt(badge.dataset.carryIndex, 10);
      const value = carryValues[idx];
      badge.classList.remove('carry-new');
      if (uptoStepIndex === -1) {
        badge.classList.remove('active');
        badge.textContent = ' ';
      } else {
        if (value === 1 && shouldCarryBeVisible(idx, uptoStepIndex)) {
          badge.classList.add('active');
          badge.textContent = '1';
        } else {
          badge.classList.remove('active');
          badge.textContent = ' ';
        }
      }
    });
  }

  // Mark the carry that was just created on this step (for the arrow animation)
  function markNewCarryForCurrentStep() {
    const badges = document.querySelectorAll('.carry-badge');
    badges.forEach(b => b.classList.remove('carry-new'));

    if (currentStep < 0 || currentStep >= steps.length) {
      return;
    }

    const step = steps[currentStep];
    if (step.carryOut !== 1) return;

    // This carry goes into the next column to the left: bitPos-1 (if any)
    if (step.bitPos > 0) {
      const targetIndex = step.bitPos - 1;
      const badge = Array.from(badges).find(
        b => parseInt(b.dataset.carryIndex, 10) === targetIndex
      );
      if (badge) {
        badge.classList.add('carry-new');
      }
    }
    // carry out of MSB is overflow; we highlight via overflow pill + OVF bit at the end
  }

  function updateVisualState(stepData, carryValues) {
    resetHighlights();

    // Fill A/B rows
    buildBitCells(rowA, stepData.binaryA, 'A');
    buildBitCells(rowB, stepData.binaryB, 'B');

    // Result row starts blank; we fill bits that have been solved
    buildBitCells(rowResult, null, 'R');

    if (currentStep >= 0) {
      const resultCells = rowResult.querySelectorAll('.bit-cell');
      for (let i = 0; i <= currentStep && i < steps.length; i++) {
        const s = steps[i];
        const bitPos = s.bitPos;
        resultCells[bitPos].textContent = s.sumBit.toString();
        resultCells[bitPos].classList.add('result-filled');
      }
    }

    // Highlight current bit column
    if (currentStep >= 0 && currentStep < steps.length) {
      const bitPos = steps[currentStep].bitPos;
      const activeCells = document.querySelectorAll(
        `.bit-cell[data-bit-index="${bitPos}"]`
      );
      activeCells.forEach(cell => cell.classList.add('active'));
    }

    // Update carries and highlight any new one for this step
    applyCarryValues(carryValues, currentStep);
    markNewCarryForCurrentStep();
  }

  function updateExplanation() {
    if (currentStep === -1) {
      stepIndexLabel.innerHTML =
        'Ready to start. We always add from the <strong>right-most bit</strong> (least significant bit).';
      explanationMain.innerHTML =
        'Press <strong>“Next bit”</strong> to add the least significant bits of A and B with any carry in (starting at 0).';
      if (teacherMode) {
        explanationMain.innerHTML +=
          '<br/><br/><em>Teacher note:</em> Reinforce place value (1, 2, 4, 8, 16, 32, 64, 128) before starting.';
      }
      return;
    }

    if (currentStep >= steps.length) {
      stepIndexLabel.innerHTML =
        '<strong>Finished!</strong> All 8 bits have been added.';
      if (hasOverflow && lastOverflowCarry === 1) {
        explanationMain.innerHTML =
          'The final carry out of the left-most bit is <strong>1</strong>, so we have an overflow. ' +
          'The extra carry is shown as an <strong>overflow bit (OVF)</strong> to the left of the result.';
        if (teacherMode) {
          explanationMain.innerHTML +=
            '<br/><br/><em>Teacher hint:</em> Ask students what the maximum value is with 8 bits (255) and how many bits ' +
            'you would need to store the full result here.';
        }
      } else {
        explanationMain.innerHTML =
          'There is no carry out of the left-most bit, so the 8-bit result is exact with no overflow.';
        if (teacherMode) {
          explanationMain.innerHTML +=
            '<br/><br/><em>Teacher hint:</em> Link this to range of an unsigned 8-bit integer in exam questions.';
        }
      }
      return;
    }

    const step = steps[currentStep];
    const stepNumber = currentStep + 1;
    const direction = currentStep === 0
      ? 'We start at the least significant bit (right-most).'
      : 'We now move one bit to the left.';
    stepIndexLabel.innerHTML =
      `Bit ${stepNumber} of ${BIT_COUNT} – working from right to left.`;

    const eqTotal = step.aBit + step.bBit + step.carryIn;
    const eqText = `${step.aBit} + ${step.bBit} + carry ${step.carryIn} = ${eqTotal}`;

    explanationMain.innerHTML =
      `${direction}<br/><br/>` +
      `At this column we add:<br/>` +
      `<span class="mini-equation">${eqText}</span><br/><br/>` +
      `So we write <strong>${step.sumBit}</strong> in the result for this bit ` +
      `and carry <strong>${step.carryOut}</strong> into the next column to the left.`;

    if (teacherMode) {
      explanationMain.innerHTML +=
        '<br/><br/><em>Teacher prompt:</em> Ask: “Is the total 0, 1, 2 or 3? If it is 2 or 3, what happens to the carry?”';
    }
  }

  function stopAutoplay() {
    if (autoplayTimer !== null) {
      clearInterval(autoplayTimer);
      autoplayTimer = null;
    }
  }

  function renderWorkingTable() {
    if (!teacherMode || !workingTable) return;
    workingTable.innerHTML = '';

    if (currentStep < 0) {
      return;
    }

    for (let i = 0; i <= currentStep && i < steps.length; i++) {
      const step = steps[i];
      const bitPos = step.bitPos; // 7 (LSB) down to 0 (MSB)
      const columnFromRight = i + 1; // 1..8 from rightmost
      const placeLabel =
        bitPos === 7 ? 'LSB' :
        bitPos === 0 ? 'MSB' :
        `bit ${bitPos}`;

      const total = step.aBit + step.bBit + step.carryIn;

      const row = document.createElement('div');
      row.className = 'working-row';

      const bitSpan = document.createElement('span');
      bitSpan.className = 'working-row-bit';
      bitSpan.textContent = `Col ${columnFromRight} (${placeLabel})`;

      const detailSpan = document.createElement('span');
      detailSpan.className = 'working-row-detail';
      detailSpan.textContent =
        `${step.aBit} + ${step.bBit} + carry-in ${step.carryIn} = ${total} ` +
        `→ write ${step.sumBit}, carry ${step.carryOut}`;

      row.appendChild(bitSpan);
      row.appendChild(detailSpan);

      workingTable.appendChild(row);
    }
  }

  function doNextStep() {
    if (currentStep < steps.length) {
      currentStep++;
      updateExplanation();

      const aVal = clampToByte(parseInt(inputA.value, 10));
      const bVal = clampToByte(parseInt(inputB.value, 10));
      const { binaryA, binaryB, binaryResult, resultFull, carryValues, overflowCarry } =
        computeSteps(aVal, bVal);

      // During the calculation: hide overflow UI
      if (currentStep < steps.length) {
        overflowPill.style.display = 'none';
        if (overflowBitCell && overflowBitValue) {
          overflowBitCell.classList.remove('visible');
          overflowBitValue.textContent = '';
        }
      }

      updateVisualState({ binaryA, binaryB, binaryResult, resultFull }, carryValues);
      const resultValue = aVal + bVal;
      updateSummary(aVal, bVal, resultValue, binaryA, binaryB, binaryResult);

      renderWorkingTable();

      if (currentStep >= steps.length) {
        // Finished all bits
        currentStep = steps.length;
        updateExplanation();
        if (hasOverflow && overflowCarry === 1) {
          overflowPill.style.display = 'inline-flex';
          if (overflowBitCell && overflowBitValue) {
            overflowBitValue.textContent = '1';
            overflowBitCell.classList.add('visible');
          }
        } else {
          overflowPill.style.display = 'none';
          if (overflowBitCell && overflowBitValue) {
            overflowBitCell.classList.remove('visible');
            overflowBitValue.textContent = '';
          }
        }
        stopAutoplay();
      }
    }
  }

  function resetWalkthrough() {
    stopAutoplay();
    currentStep = -1;
    const aVal = clampToByte(parseInt(inputA.value, 10));
    const bVal = clampToByte(parseInt(inputB.value, 10));
    inputA.value = aVal;
    inputB.value = bVal;

    const { binaryA, binaryB, binaryResult, resultFull, carryValues } =
      computeSteps(aVal, bVal);

    buildBitCells(rowA, binaryA, 'A');
    buildBitCells(rowB, binaryB, 'B');
    buildBitCells(rowResult, null, 'R'); // blank result row initially
    buildCarryRow();
    applyCarryValues(carryValues, -1);

    // Hide overflow UI until we finish the calculation
    overflowPill.style.display = 'none';
    if (overflowBitCell && overflowBitValue) {
      overflowBitCell.classList.remove('visible');
      overflowBitValue.textContent = '';
    }

    updateSummary(aVal, bVal, resultFull, binaryA, binaryB, binaryResult);
    updateExplanation();

    if (workingTable) {
      workingTable.innerHTML = '';
    }
  }

  // Event handlers
  btnStart.addEventListener('click', () => {
    resetWalkthrough();
  });

  btnNextStep.addEventListener('click', () => {
    doNextStep();
  });

  btnRandom.addEventListener('click', () => {
    const a = Math.floor(Math.random() * 256);
    const b = Math.floor(Math.random() * 256);
    inputA.value = a;
    inputB.value = b;
    resetWalkthrough();
  });

  btnOverflowExample.addEventListener('click', () => {
    // Simple guaranteed overflow: e.g. 200 + 100
    inputA.value = 200;
    inputB.value = 100;
    resetWalkthrough();
  });

  btnAutoPlay.addEventListener('click', () => {
    if (autoplayTimer !== null) return;
    autoplayTimer = setInterval(() => {
      if (currentStep >= steps.length) {
        stopAutoplay();
      } else {
        doNextStep();
      }
    }, 900);
  });

btnPause.addEventListener('click', () => {
  stopAutoplay();
});

btnInlineReset.addEventListener('click', () => {
  resetWalkthrough();
});



  // Teacher mode toggle
  teacherModeToggle.addEventListener('change', () => {
    teacherMode = teacherModeToggle.checked;
    workingPanel.style.display = teacherMode ? 'block' : 'none';
    updateExplanation();
    renderWorkingTable();
  });

  // Recompute if user edits numbers while part way through
  inputA.addEventListener('change', resetWalkthrough);
  inputB.addEventListener('change', resetWalkthrough);

  // Initial set up
  buildCarryRow();
  resetWalkthrough();
})();
