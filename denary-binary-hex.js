(function () {
  const denaryInput = document.getElementById('denaryInput');
  const binaryInput = document.getElementById('binaryInput');
  const hexInput = document.getElementById('hexInput');

  const bitWeightsRow = document.getElementById('bitWeightsRow');
  const bitRow = document.getElementById('bitRow');
  
  const bitDenaryRow = document.getElementById('bitDenaryRow');
  const bitRowTotal = document.getElementById('bitRowTotal');


  const highNibbleBits = document.getElementById('highNibbleBits');
  const lowNibbleBits = document.getElementById('lowNibbleBits');
  const highNibbleHex = document.getElementById('highNibbleHex');
  const lowNibbleHex = document.getElementById('lowNibbleHex');
  
  const highNibbleDenary = document.getElementById('highNibbleDenary');
  const lowNibbleDenary = document.getElementById('lowNibbleDenary');

  const modeLabel = document.getElementById('modeLabel');
  const explanationMain = document.getElementById('explanationMain');
  const workingTable = document.getElementById('workingTable');
  const workingNote = document.getElementById('workingNote');

  const summaryDenary = document.getElementById('summaryDenary');
  const summaryBinary = document.getElementById('summaryBinary');
  const summaryHex = document.getElementById('summaryHex');

  const BIT_COUNT = 8;
  const MAX_VALUE = 255;


function attachSelectAllOnFocus(el, blockMouseUp) {
  if (!el) return;

  el.addEventListener('focus', () => {
    setTimeout(() => {
      el.select();
      clearInvalid();
    }, 0);
  });

  if (blockMouseUp) {
    // For text inputs only – do NOT use on number inputs with spinners
    el.addEventListener('mouseup', (e) => {
      e.preventDefault();
    });
  }
}



  // Initialise weights row (128 64 ... 1)
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

  function buildBitRow(binaryString) {
    bitRow.innerHTML = '';
    for (let i = 0; i < BIT_COUNT; i++) {
      const div = document.createElement('div');
      div.className = 'bit-cell';
      div.textContent = binaryString[i] || '0';
      bitRow.appendChild(div);
    }
  }
  
  function buildDenaryRow(binaryString) {
  const weights = [128, 64, 32, 16, 8, 4, 2, 1];
  bitDenaryRow.innerHTML = '';

  for (let i = 0; i < BIT_COUNT; i++) {
    const bit = binaryString[i] === '1' ? 1 : 0;
    const contribution = bit ? weights[i] : 0;

    const div = document.createElement('div');
    div.className = 'bit-denary-cell';
    if (contribution !== 0) {
      div.classList.add('non-zero');
      div.textContent = contribution;
    } else {
      div.textContent = ' ';
    }
    bitDenaryRow.appendChild(div);
  }
}


  function buildNibbleBits(container, nibbleBits) {
    container.innerHTML = '';
    for (let i = 0; i < 4; i++) {
      const div = document.createElement('div');
      div.className = 'nibble-bit-cell';
      div.textContent = nibbleBits[i] || '0';
      container.appendChild(div);
  }
}


  function clampByte(n) {
    if (isNaN(n)) return null;
    n = Math.floor(n);
    if (n < 0 || n > MAX_VALUE) return null;
    return n;
  }

  function toBinary8(n) {
    return n.toString(2).padStart(BIT_COUNT, '0');
  }

  function toHex2(n) {
    return n.toString(16).toUpperCase().padStart(2, '0');
  }

  function clearInvalid() {
    [denaryInput, binaryInput, hexInput].forEach(el =>
      el.classList.remove('invalid')
    );
  }

  function setInvalid(el) {
    clearInvalid();
    el.classList.add('invalid');
  }

  function updateSummary(dec, bin8, hex2) {
    summaryDenary.textContent = dec;
    summaryBinary.textContent = bin8;
    summaryHex.textContent = hex2;
  }

function updateVisual(binary8, hex2) {
  buildBitRow(binary8);

  // NEW: per-bit denary contributions
  buildDenaryRow(binary8);

  // NEW: total denary on the right of the 8-bit row
  const decTotal = parseInt(binary8, 2);
  if (bitRowTotal) {
    bitRowTotal.textContent = decTotal;
  }

  const hiBits = binary8.slice(0, 4);
  const loBits = binary8.slice(4);

  buildNibbleBits(highNibbleBits, hiBits);
  buildNibbleBits(lowNibbleBits, loBits);

  const hiDec = parseInt(hiBits, 2);
  const loDec = parseInt(loBits, 2);

  highNibbleDenary.textContent = hiDec;
  lowNibbleDenary.textContent = loDec;

  highNibbleHex.textContent = hex2[0];
  lowNibbleHex.textContent = hex2[1];
}




  // EXPLANATIONS

  function explainFromDenary(dec, bin8, hex2) {
    modeLabel.textContent = 'Denary → Binary & Hex';
    const n = dec;

    explanationMain.innerHTML =
      `We start with the denary value <strong>${n}</strong> and convert it ` +
      `to binary (base 2) and hexadecimal (base 16).<br><br>` +
      `For binary we repeatedly divide by 2 and record the remainders. ` +
      `For hex we repeatedly divide by 16. The remainders read backwards ` +
      `give the digits.`;

    workingTable.innerHTML = '';

    // Division by 2
    let temp = n;
    let steps2 = [];
    while (temp > 0) {
      const q = Math.floor(temp / 2);
      const r = temp % 2;
      steps2.push({ value: temp, q, r });
      temp = q;
    }
    if (steps2.length === 0) {
      steps2.push({ value: 0, q: 0, r: 0 });
    }

    const row2 = document.createElement('div');
    row2.className = 'working-row';
    const label2 = document.createElement('span');
    label2.className = 'working-row-label';
    label2.textContent = 'Binary:';
    const detail2 = document.createElement('span');
    detail2.className = 'working-row-detail';

    const lines2 = steps2
      .map(s => `${s.value} ÷ 2 = ${s.q} remainder ${s.r}`)
      .join('<br>');
    detail2.innerHTML =
      lines2 +
      `<br><br>Reading the remainders from bottom to top gives <strong>${bin8}</strong>.`;

    row2.appendChild(label2);
    row2.appendChild(detail2);
    workingTable.appendChild(row2);

    // Division by 16
    let temp16 = n;
    let steps16 = [];
    while (temp16 > 0) {
      const q = Math.floor(temp16 / 16);
      const r = temp16 % 16;
      steps16.push({ value: temp16, q, r });
      temp16 = q;
    }
    if (steps16.length === 0) {
      steps16.push({ value: 0, q: 0, r: 0 });
    }

    const row16 = document.createElement('div');
    row16.className = 'working-row';
    const label16 = document.createElement('span');
    label16.className = 'working-row-label';
    label16.textContent = 'Hex:';
    const detail16 = document.createElement('span');
    detail16.className = 'working-row-detail';
    const hexMap = '0123456789ABCDEF';

    const lines16 = steps16
      .map(s => {
        const digit = hexMap[s.r];
        return `${s.value} ÷ 16 = ${s.q} remainder ${s.r} (${digit})`;
      })
      .join('<br>');

    detail16.innerHTML =
      lines16 +
      `<br><br>Reading the hex digits from bottom to top gives <strong>${hex2}</strong>.`;

    row16.appendChild(label16);
    row16.appendChild(detail16);
    workingTable.appendChild(row16);

    workingNote.textContent =
      'This is the standard “repeated division” method used in exam mark schemes.';
  }

  function explainFromBinary(dec, bin8, hex2) {
    modeLabel.textContent = 'Binary → Denary & Hex';

    explanationMain.innerHTML =
      `We start with the 8-bit binary value <strong>${bin8}</strong>. ` +
      `Each bit has a place value (128, 64, 32, 16, 8, 4, 2, 1). ` +
      `We add up the place values where the bit is 1 to get the denary value ` +
      `<strong>${dec}</strong>. Then we convert that denary value into hex.`;

    workingTable.innerHTML = '';

    const weights = [128, 64, 32, 16, 8, 4, 2, 1];
    const rowBin = document.createElement('div');
    rowBin.className = 'working-row';
    const labelBin = document.createElement('span');
    labelBin.className = 'working-row-label';
    labelBin.textContent = 'Place value:';
    const detailBin = document.createElement('span');
    detailBin.className = 'working-row-detail';

    let terms = [];
    for (let i = 0; i < BIT_COUNT; i++) {
      const bit = parseInt(bin8[i], 10);
      if (bit === 1) {
        terms.push(weights[i]);
      }
    }

    detailBin.innerHTML =
      weights
        .map((w, i) => `${bin8[i]} × ${w}`)
        .join(' + ') +
      ` = ${terms.join(' + ')} = <strong>${dec}</strong>`;

    rowBin.appendChild(labelBin);
    rowBin.appendChild(detailBin);
    workingTable.appendChild(rowBin);

    const rowHex = document.createElement('div');
    rowHex.className = 'working-row';
    const labelHex = document.createElement('span');
    labelHex.className = 'working-row-label';
    labelHex.textContent = 'Hex:';
    const detailHex = document.createElement('span');
    detailHex.className = 'working-row-detail';

    const hiBits = bin8.slice(0, 4);
    const loBits = bin8.slice(4);
    const hiVal = parseInt(hiBits, 2);
    const loVal = parseInt(loBits, 2);

    detailHex.innerHTML =
      `Split into nibbles: <strong>${hiBits}</strong> (high) and ` +
      `<strong>${loBits}</strong> (low).<br>` +
      `${hiBits} = ${hiVal} → hex digit ${toHex2(hiVal).slice(-1)}<br>` +
      `${loBits} = ${loVal} → hex digit ${toHex2(loVal).slice(-1)}<br><br>` +
      `So the hex value is <strong>${hex2}</strong>.`;

    rowHex.appendChild(labelHex);
    rowHex.appendChild(detailHex);
    workingTable.appendChild(rowHex);

    workingNote.textContent =
      'This uses the binary place value table, then groups bits into nibbles (4 bits) for hex.';
  }

  function explainFromHex(dec, bin8, hex2) {
    modeLabel.textContent = 'Hex → Binary & Denary';

    const hi = hex2[0];
    const lo = hex2[1];
    const hiVal = parseInt(hi, 16);
    const loVal = parseInt(lo, 16);
    const hiBits = hiVal.toString(2).padStart(4, '0');
    const loBits = loVal.toString(2).padStart(4, '0');

    explanationMain.innerHTML =
      `We start with the hex value <strong>${hex2}</strong>. ` +
      `Each hex digit represents 4 bits (a nibble). ` +
      `We convert each digit to 4-bit binary, then join them to get ` +
      `<strong>${bin8}</strong>, and finally convert that binary to denary ` +
      `<strong>${dec}</strong>.`;

    workingTable.innerHTML = '';

    const rowNibbles = document.createElement('div');
    rowNibbles.className = 'working-row';
    const labelNibbles = document.createElement('span');
    labelNibbles.className = 'working-row-label';
    labelNibbles.textContent = 'Nibbles:';
    const detailNibbles = document.createElement('span');
    detailNibbles.className = 'working-row-detail';

    detailNibbles.innerHTML =
      `${hi} → ${hiBits}<br>` +
      `${lo} → ${loBits}<br><br>` +
      `Join them: <strong>${hiBits}${loBits}</strong> = <strong>${bin8}</strong>`;

    rowNibbles.appendChild(labelNibbles);
    rowNibbles.appendChild(detailNibbles);
    workingTable.appendChild(rowNibbles);

    const weights = [128, 64, 32, 16, 8, 4, 2, 1];
    const rowDec = document.createElement('div');
    rowDec.className = 'working-row';
    const labelDec = document.createElement('span');
    labelDec.className = 'working-row-label';
    labelDec.textContent = 'Denary:';
    const detailDec = document.createElement('span');
    detailDec.className = 'working-row-detail';

    let terms = [];
    for (let i = 0; i < BIT_COUNT; i++) {
      const bit = parseInt(bin8[i], 10);
      if (bit === 1) {
        terms.push(weights[i]);
      }
    }

    detailDec.innerHTML =
      weights
        .map((w, i) => `${bin8[i]} × ${w}`)
        .join(' + ') +
      ` = ${terms.join(' + ')} = <strong>${dec}</strong>`;

    rowDec.appendChild(labelDec);
    rowDec.appendChild(detailDec);
    workingTable.appendChild(rowDec);

    workingNote.textContent =
      'Hex is often converted via 4-bit nibbles: each hex digit maps neatly to one nibble.';
  }

  // CORE UPDATE

  function applyAll(dec, mode) {
    const bin8 = toBinary8(dec);
    const hex2 = toHex2(dec);

    // Update inputs (without triggering loops via events)
    denaryInput.value = dec.toString();
    binaryInput.value = bin8;
    hexInput.value = hex2;

    clearInvalid();
    updateVisual(bin8, hex2);
    updateSummary(dec, bin8, hex2);

    // Explanation
    if (mode === 'denary') {
      explainFromDenary(dec, bin8, hex2);
    } else if (mode === 'binary') {
      explainFromBinary(dec, bin8, hex2);
    } else if (mode === 'hex') {
      explainFromHex(dec, bin8, hex2);
    }
  }

  // INPUT HANDLERS

  function onDenaryChange() {
    const val = clampByte(parseInt(denaryInput.value, 10));
    if (val === null) {
      setInvalid(denaryInput);
      return;
    }
    applyAll(val, 'denary');
  }

  function onBinaryChange() {
    const raw = binaryInput.value.replace(/\s+/g, '');
    if (!/^[01]{1,8}$/.test(raw)) {
      setInvalid(binaryInput);
      return;
    }
    const padded = raw.padStart(BIT_COUNT, '0');
    const dec = clampByte(parseInt(padded, 2));
    if (dec === null) {
      setInvalid(binaryInput);
      return;
    }
    applyAll(dec, 'binary');
  }

  function onHexChange() {
    const raw = hexInput.value.trim().toUpperCase();
    if (!/^[0-9A-F]{1,2}$/.test(raw)) {
      setInvalid(hexInput);
      return;
    }
    const padded = raw.padStart(2, '0');
    const dec = clampByte(parseInt(padded, 16));
    if (dec === null) {
      setInvalid(hexInput);
      return;
    }
    applyAll(dec, 'hex');
  }

  // EVENTS

  denaryInput.addEventListener('change', onDenaryChange);
  binaryInput.addEventListener('change', onBinaryChange);
  hexInput.addEventListener('change', onHexChange);



  // INIT
// INIT
buildWeightsRow();
applyAll(42, 'denary');

// Don’t block mouseup on the number input (spinner arrows need it)
attachSelectAllOnFocus(denaryInput, false);

// Binary & hex are plain text inputs – block mouseup so selection stays
attachSelectAllOnFocus(binaryInput, true);
attachSelectAllOnFocus(hexInput, true);


})();
