// POP Store — client-side flow
(function () {
  "use strict";

  const UPI_ID = "8406962570@ybl";
  const PAYEE_NAME = "POP Store";
  const DELIVERY_EMAIL = "rajaansr77@gmail.com";

  // Popularity packs — all based on 50K = ₹60 ratio, with ₹50 flash price for 50K.
  const PACKS = [
    { id: "10k",   pop: "10K",   popNum: 10000,  price: 15,  strike: 20,  tag: null },
    { id: "50k",   pop: "50K",   popNum: 50000,  price: 50,  strike: 60,  tag: "flash", featured: true },
    { id: "100k",  pop: "100K",  popNum: 100000, price: 110, strike: 130, tag: "save" },
    { id: "250k",  pop: "250K",  popNum: 250000, price: 270, strike: 320, tag: "save" },
    { id: "500k",  pop: "500K",  popNum: 500000, price: 520, strike: 620, tag: "save" },
    { id: "1m",    pop: "1M",    popNum: 1000000,price: 999, strike: 1250,tag: "save" }
  ];

  const state = {
    pack: null,
    uid: "",
    ign: "",
    phone: "",
    utr: ""
  };

  // --- Helpers ---
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  function showView(id) {
    $$(".view").forEach(v => v.classList.remove("view-active"));
    const el = document.getElementById("view-" + id);
    if (el) el.classList.add("view-active");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function toast(msg, ms = 1800) {
    const t = $("#toast");
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(toast._t);
    toast._t = setTimeout(() => t.classList.remove("show"), ms);
  }

  function formatINR(n) {
    return "₹" + Number(n).toLocaleString("en-IN");
  }

  function renderPacks() {
    const wrap = $("#packs");
    wrap.innerHTML = PACKS.map(p => {
      const tag = p.tag === "flash"
        ? '<span class="flash">FLASH ₹50</span>'
        : p.tag === "save"
          ? `<span class="save">SAVE ${Math.round((1 - p.price / p.strike) * 100)}%</span>`
          : "";
      return `
        <button class="pack ${p.featured ? "featured" : ""}" data-pack="${p.id}" type="button">
          <span class="glow"></span>
          ${tag}
          <div class="pop">${p.pop}</div>
          <div class="label">Popularity</div>
          <div class="price-row">
            <span class="price">${formatINR(p.price)}</span>
            <span class="strike">${formatINR(p.strike)}</span>
          </div>
        </button>
      `;
    }).join("");

    $$(".pack", wrap).forEach(btn => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-pack");
        state.pack = PACKS.find(p => p.id === id);
        renderDetailsSummary();
        showView("details");
      });
    });
  }

  function renderDetailsSummary() {
    if (!state.pack) return;
    $("#detailsSub").textContent = `Selected: ${state.pack.pop} Popularity • ${formatINR(state.pack.price)}`;
    $("#summaryPack").innerHTML = `
      <span>${state.pack.pop} Popularity Boost</span>
      <b>${formatINR(state.pack.price)}</b>
    `;
  }

  function renderPaymentView() {
    $("#payAmount").textContent = formatINR(state.pack.price);
    const tn = `POP ${state.pack.pop} ${state.uid}`.replace(/[^A-Za-z0-9 ]/g, "").slice(0, 40);
    const upiUrl =
      `upi://pay?pa=${encodeURIComponent(UPI_ID)}` +
      `&pn=${encodeURIComponent(PAYEE_NAME)}` +
      `&am=${encodeURIComponent(state.pack.price)}` +
      `&cu=INR` +
      `&tn=${encodeURIComponent(tn)}`;
    $("#upiLink").setAttribute("href", upiUrl);
  }

  function renderRequestView() {
    const rows = [
      ["Pack",       `${state.pack.pop} Popularity`],
      ["Amount",     formatINR(state.pack.price)],
      ["BGMI UID",   state.uid],
      ["IGN",        state.ign],
      ["WhatsApp",   state.phone],
      ["UTR",        state.utr]
    ];
    $("#orderSummary").innerHTML = rows.map(
      ([k, v]) => `<div class="row"><span>${k}</span><span>${escapeHtml(v)}</span></div>`
    ).join("");
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    })[c]);
  }

  function buildEmail() {
    const orderId = "POP-" + Date.now().toString(36).toUpperCase();
    const subject = `BGMI Popularity Order — ${state.pack.pop} — UID ${state.uid}`;
    const body = [
      `Hello,`,
      ``,
      `Please process my BGMI Popularity order. Details below:`,
      ``,
      `Order ID    : ${orderId}`,
      `Pack        : ${state.pack.pop} Popularity`,
      `Amount Paid : ₹${state.pack.price}`,
      `BGMI UID    : ${state.uid}`,
      `IGN         : ${state.ign}`,
      `WhatsApp    : ${state.phone}`,
      `UPI ID Paid : ${UPI_ID}`,
      `UTR / Txn ID: ${state.utr}`,
      ``,
      `Please confirm once delivery is complete.`,
      ``,
      `Thanks!`
    ].join("\n");

    return { subject, body, orderId };
  }

  function openGmailCompose() {
    const { subject, body } = buildEmail();
    // Prefer Gmail web compose — most reliable for auto-filling subject/body.
    const gmailUrl =
      `https://mail.google.com/mail/?view=cm&fs=1` +
      `&to=${encodeURIComponent(DELIVERY_EMAIL)}` +
      `&su=${encodeURIComponent(subject)}` +
      `&body=${encodeURIComponent(body)}`;

    const win = window.open(gmailUrl, "_blank", "noopener");
    if (!win) {
      // Fallback to mailto: if popup blocked
      window.location.href =
        `mailto:${DELIVERY_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    }
  }

  async function copyRequestDetails() {
    const { subject, body } = buildEmail();
    const text = `To: ${DELIVERY_EMAIL}\nSubject: ${subject}\n\n${body}`;
    try {
      await navigator.clipboard.writeText(text);
      toast("Details copied. Paste into email & send.");
    } catch {
      toast("Copy failed — long-press to copy manually.");
    }
  }

  // --- Init ---
  document.addEventListener("DOMContentLoaded", () => {
    renderPacks();

    // Back buttons
    $$("[data-back]").forEach(btn => {
      btn.addEventListener("click", () => showView(btn.getAttribute("data-back")));
    });

    // Details form
    $("#detailsForm").addEventListener("submit", (e) => {
      e.preventDefault();
      const uid = $("#uid").value.trim();
      const ign = $("#ign").value.trim();
      const phone = $("#phone").value.trim();
      if (!/^\d{6,12}$/.test(uid)) return toast("Enter a valid BGMI UID (digits only).");
      if (ign.length < 2) return toast("Enter your IGN.");
      if (!/^\d{10}$/.test(phone)) return toast("Enter a valid 10-digit WhatsApp number.");
      state.uid = uid;
      state.ign = ign;
      state.phone = phone;
      renderPaymentView();
      showView("payment");
    });

    // UTR submit
    $("#utrForm").addEventListener("submit", (e) => {
      e.preventDefault();
      const utr = $("#utr").value.trim();
      if (!/^[A-Za-z0-9]{8,24}$/.test(utr)) return toast("Enter the UTR from your UPI app.");
      state.utr = utr;
      renderRequestView();
      showView("request");
    });

    // Copy UPI
    $("#copyUpi").addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(UPI_ID);
        const btn = $("#copyUpi");
        btn.textContent = "Copied";
        btn.classList.add("copied");
        setTimeout(() => { btn.textContent = "Copy"; btn.classList.remove("copied"); }, 1500);
      } catch {
        toast("Long-press the UPI ID to copy.");
      }
    });

    // Request button → Gmail compose with auto-filled details
    $("#requestBtn").addEventListener("click", openGmailCompose);
    $("#copyReqBtn").addEventListener("click", copyRequestDetails);

    // Help sheet
    const sheet = $("#helpSheet");
    $("#helpBtn").addEventListener("click", () => sheet.classList.add("open"));
    $$("[data-close-sheet]", sheet).forEach(el =>
      el.addEventListener("click", () => sheet.classList.remove("open"))
    );
  });
})();
