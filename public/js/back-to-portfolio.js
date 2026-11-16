(function () {
  if (document.getElementById("back-to-portfolio-btn")) return;

  var portfolioUrl =
    window.__PORTFOLIO_URL__ ||
    (typeof process !== "undefined" && process.env && process.env.PORTFOLIO_URL) ||
    "https://revand-portofolio.vercel.app";

  var btn = document.createElement("a");
  btn.id = "back-to-portfolio-btn";
  btn.href = portfolioUrl;
  btn.setAttribute("aria-label", "Back to Portfolio");
  btn.innerHTML =
    '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 6px;"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>Back to Portfolio';

  Object.assign(btn.style, {
    position: "fixed",
    top: "14px",
    right: "14px",
    zIndex: "99999",
    display: "inline-flex",
    alignItems: "center",
    padding: "8px 14px",
    backgroundColor: "rgba(18, 20, 28, 0.94)",
    color: "#ffffff",
    border: "1px solid rgba(255, 255, 255, 0.25)",
    borderRadius: "9999px",
    fontSize: "12px",
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    fontWeight: "600",
    textDecoration: "none",
    boxShadow: "0 4px 18px rgba(0, 0, 0, 0.45)",
    backdropFilter: "blur(8px)",
    WebkitBackdropFilter: "blur(8px)",
    transition: "all 0.2s ease",
    cursor: "pointer",
  });

  btn.onmouseenter = function () {
    btn.style.backgroundColor = "rgba(35, 40, 55, 0.98)";
    btn.style.borderColor = "rgba(255, 255, 255, 0.5)";
    btn.style.transform = "translateY(-1px)";
  };

  btn.onmouseleave = function () {
    btn.style.backgroundColor = "rgba(18, 20, 28, 0.94)";
    btn.style.borderColor = "rgba(255, 255, 255, 0.25)";
    btn.style.transform = "translateY(0)";
  };

  function appendBtn() {
    if (document.body && !document.getElementById("back-to-portfolio-btn")) {
      document.body.appendChild(btn);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", appendBtn);
  } else {
    appendBtn();
  }
})();
