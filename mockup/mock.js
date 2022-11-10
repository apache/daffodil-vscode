"use strict";

function initState() {
    return {
        "bytes_per_line": 8,         // [6, 8]
        "address_numbering": 10,     // [2, 8, 10, 16] | "none"
        "radix": 16,                 // [2, 8, 10, 16]
        "bytes_in_group": 2,         // [1, 2, 4, 8]
        "little_endian": true,       // true | false
        "capitalize_radix": true,    // true | false
        "logical_encoding": "ascii", // "ascii" | "ebcidic" | "none"
        "offset": 0,                 // number
        "length": -1,                // number
        "edit_byte_size": 8,         // [6, 7, 8]
        "edit_encoding": "ascii",    // [2, 8, 10, 16 ] | "ascii" | "ebcidic" | "utf-8" | "utf-16"
        "lsb_higher_offset": true,   // true | false

        "change_count": 0,           // number
        "breakpoint_count": 0,       // number
        "file_byte_count": 0,        // number
        "ascii_byte_count": 0,       // number
    };
}
function syncScroll(from, to) {
    // Scroll the "to" by the same percentage as the "from"
    const sf = from.scrollHeight - from.clientHeight;
    if (sf >= 1) {
        const st = to.scrollHeight - to.clientHeight;
        to.scrollTop = (st / 100) * (from.scrollTop / sf * 100);
    }
}

function makeAddressRange(start, end, stride, radix) {
    let i = start;
    let result = (i * stride).toString(radix);
    for (++i; i < end; ++i) {
        result += "\n" + (i * stride).toString(radix);
    }
    return result;
}

function makeOffsetRange(radix, spread) {
    const s = rad => {
        switch (rad) {
            // @formatter:off
            case 16:
                return "0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0<br/>" +
                       "0 1 2 3 4 5 6 7 8 9 A B C D E F ";
            case 10:
                return "0 0 0 0 0 0 0 0 0 0 1 1 1 1 1 1<br/>" +
                       "0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 ";
            case 8:
                return "0 0 0 0 0 0 0 0 1 1 1 1 1 1 1 1<br/>" +
                       "0 1 2 3 4 5 6 7 0 1 2 3 4 5 6 7 ";
            case 2:
                return "00000000 00111111 11112222 22222233 33333333 44444444 44555555 55556666<br/>" +
                       "01234567 89012345 67890123 45678901 23456789 01234567 89012345 67890123";
            case -2:
                return "00000000<br>" +
                       "01234567";
            // @formatter:on
        }
    };
    return s(radix).replaceAll(" ", "&nbsp;".repeat(spread));
}

function binLen2b64Len(binaryLength) {
    return Math.ceil(4 * (binaryLength / 3) + 3) & ~0x3;
}

// b64Length is the length of the encoded string with padding and paddingLength is the number of trailing padding
// characters on the encoded string
function b34Len2binLen(b64Length, paddingLength) {
    console.assert(b64Length > paddingLength, "base64 length must be greater than the padding length");
    console.assert(b64Length % 4 === 0, "base64 encoded string length must be a multiple of 4");
    console.assert(paddingLength < 4, "padding length must be less than 4");
    return (b64Length * 0.75) - paddingLength;
}

function selectAddressType(addressType) {
    const physical_vw = document.querySelector(".physical_vw");
    const address_vw = document.querySelector(".address_vw");
    const logical_offsets = document.getElementById("logical_offsets");
    const physical_offsets = document.getElementById("physical_offsets");
    const radix = Number.parseInt(addressType.value);
    const data_editor = document.querySelector(".dataEditor");

    if (radix === 2 && !data_editor.classList.contains("binary")) {
        data_editor.classList.add("binary");
        physical_vw.innerHTML = encodeBinary(b642ab(physical_vw.dataset.data));
        physical_offsets.innerHTML = makeOffsetRange(radix, 1);
        address_vw.innerHTML = makeAddressRange(0, Math.ceil(physical_vw.innerHTML.length / physical_vw.innerHTML.indexOf("\n")), 8, 10);
        logical_offsets.innerHTML = makeOffsetRange(radix * -1, 0);
    } else {
        if (data_editor.classList.contains("binary")) {
            data_editor.classList.remove("binary");
        }
        physical_vw.innerHTML = encodeHex(b642ab(physical_vw.dataset.data));
        physical_offsets.innerHTML = makeOffsetRange(radix, 2);
        address_vw.innerHTML = makeAddressRange(0, Math.ceil(physical_vw.innerHTML.length / physical_vw.innerHTML.indexOf("\n")), 16, radix);
        logical_offsets.innerHTML = makeOffsetRange(radix, 0);
    }
}

function isWhitespace(c) {
    return (' \t\n\r\v'.indexOf(c) > -1);
}

function frameSelectedOnWhitespace(selected) {
    let selectionStart = selected.selectionStart;
    let selectionEnd = selected.selectionEnd;

    // Adjust the start to align with the closest beginning of content
    if (selectionStart) {
        if (isWhitespace(selected.value.at(selectionStart))) {
            ++selectionStart;
        } else {
            while (selectionStart && !isWhitespace(selected.value.at(selectionStart - 1))) {
                --selectionStart;
            }
        }
        selected.selectionStart = selectionStart;
    }

    // Adjust the end to align with the closest ending of content
    if (isWhitespace(selected.value.at(selectionEnd))) {
        --selectionEnd;
    } else {
        while (selectionEnd < selected.value.length && !isWhitespace(selected.value.at(selectionEnd + 1))) {
            ++selectionEnd;
        }
    }
    if (selectionEnd < selected.value.length) {
        selected.selectionEnd = ++selectionEnd;
    }

    return selected;
}

function getData(startOffset, endOffset) {
    const data = b642ab(document.getElementById("physical").dataset.data);
    return ab2str(data.slice(startOffset, endOffset));
}

function handleSelected(selected) {
    let selectionStart = selected.selectionStart;
    let selectionEnd = selected.selectionEnd;
    const selectedContent = document.getElementById("selected_content");

    if (selected.id === "physical") {
        selectionStart = selectionStart / 3;
        selectionEnd = (selectionEnd - 2) / 3 + 1;
    }
    const selection = getData(selectionStart, selectionEnd);

    document.getElementById("edit_view").scrollTo(0, 0);
    document.getElementById("selected_offsets").innerHTML = selected.id + ": " + selectionStart + " - " + selectionEnd + ", length: " + (selectionEnd - selectionStart) + "<br/>CRC-32: " + crc32(selection);

    selectedContent.value = selection;
    selectedContent.scrollTo(0, selectedContent.scrollHeight);
}

function makeCRCTable() {
    let c;
    const crcTable = [];
    for (let n = 0; n < 256; n++) {
        c = n;
        for (let k = 0; k < 8; k++) {
            c = ((c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1));
        }
        crcTable[n] = c;
    }
    return crcTable;
}

function crc32(str) {
    const crcTable = window.crcTable || (window.crcTable = makeCRCTable());
    let crc = 0 ^ (-1);
    for (let i = 0; i < str.length; i++) {
        crc = (crc >>> 8) ^ crcTable[(crc ^ str.charCodeAt(i)) & 0xFF];
    }
    return (crc ^ (-1)) >>> 0;
}

function readFile(file) {
    return new Response(file).arrayBuffer();
}

function ab2str(buf) {
    const view = new Uint8Array(buf);
    let result = "";
    for (let i = 0; i < buf.byteLength; ++i) {
        result += String.fromCharCode(view[i]);
    }
    return result;
}

function countAscii(buf) {
    let result = 0;
    const bytes = new Uint8Array(buf);
    const len = bytes.byteLength;
    for (let i = 0; i < len; ++i) {
        if (bytes[i] < 128) {
            ++result;
        }
    }
    return result;
}

function ab2b64(buf) {
    return btoa(
        new Uint8Array(buf)
            .reduce((data, byte) => data + String.fromCharCode(byte), '')
    );
}

function b642ab(base64) {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const result = new Uint8Array(len);
    for (let i = 0; i < len; ++i) {
        result[i] = binaryString.charCodeAt(i);
    }
    return result.buffer;
}


function encodeHex(buf) {
    const bytes = new Uint8Array(buf);
    const len = bytes.byteLength;
    let result = "";
    let i = 0;
    while (true) {
        for (let j = 0; i < len && j < 16; ++j) {
            result += bytes[i++].toString(16).toUpperCase().padStart(2, "0") + " ";
        }
        result = result.slice(0, result.length - 1);
        if (i === len) {
            break;
        }
        result += "\n";
    }
    return result;
}

function encodeBinary(buf) {
    const bytes = new Uint8Array(buf);
    const len = bytes.byteLength;
    let result = "";
    let i = 0;
    while (true) {
        for (let j = 0; i < len && j < 8; ++j) {
            result += bytes[i++].toString(2).toUpperCase().padStart(8, "0") + " ";
        }
        result = result.slice(0, result.length - 1);
        if (i === len) {
            break;
        }
        result += "\n";
    }
    return result;
}

window.onload = () => {
    let currentScrollEvt, scrollSyncTimer;
    const logical_vw = document.querySelector(".logicalView");
    const physical_vw = document.querySelector(".physical_vw");
    const address_vw = document.querySelector(".address_vw");
    const address_type = document.getElementById("address_type");
    physical_vw.addEventListener("select", () => handleSelected(frameSelectedOnWhitespace(physical_vw)));
    logical_vw.addEventListener("select", () => handleSelected(logical_vw));
    address_type.addEventListener("change", () => selectAddressType(address_type));
    physical_vw.onscroll = () => {
        if (!currentScrollEvt || currentScrollEvt === "physical_vw") {
            clearTimeout(scrollSyncTimer);
            currentScrollEvt = "physical_vw";
            syncScroll(physical_vw, address_vw);
            syncScroll(physical_vw, logical_vw);
            scrollSyncTimer = setTimeout(function () {
                currentScrollEvt = null;
            }, 100);
        }
    };
    address_vw.onscroll = () => {
        if (!currentScrollEvt || currentScrollEvt === "address_vw") {
            clearTimeout(scrollSyncTimer);
            currentScrollEvt = "address_vw";
            syncScroll(address_vw, physical_vw);
            syncScroll(address_vw, logical_vw);
            scrollSyncTimer = setTimeout(function () {
                currentScrollEvt = null;
            }, 100);
        }
    };
    logical_vw.onscroll = () => {
        if (!currentScrollEvt || currentScrollEvt === "logical_vw") {
            clearTimeout(scrollSyncTimer);
            currentScrollEvt = "logical_vw";
            syncScroll(logical_vw, address_vw);
            syncScroll(logical_vw, physical_vw);
            scrollSyncTimer = setTimeout(function () {
                currentScrollEvt = null;
            }, 100);
        }
    };
};
