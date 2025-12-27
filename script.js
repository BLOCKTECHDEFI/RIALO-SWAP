// 1. SELECT ELEMENTS
const connectBtn = document.querySelector(".btn-nav");
const modal = document.getElementById("wallet-modal");
const closeModal = document.getElementById("close-modal");
let userWallet = null;

const tokenModal = document.getElementById("token-modal");
const closeTokenModal = document.getElementById("close-token-modal");
let activeTokenSlot = null;

const switchBtn = document.querySelector(".switch-token");
const swapBtn = document.querySelector(".swap-btn");
const buyInput = document.querySelectorAll(".placeholder")[0];
const sellInput = document.querySelectorAll(".placeholder")[1];

// --- CUSTOM NOTIFICATIONS (TOASTS) ---
function showToast(message, isError = false) {
  const container = document.getElementById("toast-container");
  if (!container) return;
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.style.borderLeft = isError ? "4px solid #ff6b6b" : "4px solid #a9ddd3";
  toast.innerHTML = `<span>${message}</span>`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = "0";
    setTimeout(() => toast.remove(), 500);
  }, 3000);
}

// --- CUSTOM CONFIRMATION MODAL ---
function customConfirm(message) {
  return new Promise((resolve) => {
    const confirmOverlay = document.createElement("div");
    confirmOverlay.className = "confirm-overlay";
    confirmOverlay.innerHTML = `
      <div class="confirm-box">
        <p>${message}</p>
        <div class="confirm-btns">
          <button id="confirm-yes">Yes</button>
          <button id="confirm-no">Cancel</button>
        </div>
      </div>
    `;
    document.body.appendChild(confirmOverlay);

    document.getElementById("confirm-yes").onclick = () => {
      confirmOverlay.remove();
      resolve(true);
    };
    document.getElementById("confirm-no").onclick = () => {
      confirmOverlay.remove();
      resolve(false);
    };
  });
}

// 2. MODAL & DISCONNECT CONTROLS
connectBtn.addEventListener("click", async () => {
  if (userWallet) {
    const logout = await customConfirm(
      "Do you want to disconnect your wallet?"
    );
    if (logout) handleDisconnect();
    return;
  }
  modal.style.display = "flex";
});

closeModal.onclick = () => (modal.style.display = "none");

// 3. WALLET SELECTION LOGIC
document.querySelectorAll(".wallet-option").forEach((btn) => {
  btn.addEventListener("click", async () => {
    const walletType = btn.getAttribute("data-wallet");
    modal.style.display = "none";

    const proceed = await customConfirm(
      `\n\nPlease ensure your wallet is on SOLANA TESTNET.\n\nContinue with ${walletType}?`
    );
    if (proceed) {
      handleWalletConnection(walletType);
    }
  });
});

// 4. CONNECTION HANDLER
async function handleWalletConnection(type) {
  try {
    let publicKey = null;
    if (type === "phantom" || type === "solflare") {
      const provider = window.phantom?.solana || window.solana;
      if (!provider) return showToast(type + " not found!", true);
      const resp = await provider.connect();
      publicKey = resp.publicKey.toString();
    } else if (type === "okx") {
      const okxSolana = window.okxwallet?.solana;
      if (!okxSolana) return showToast("OKX Wallet not found!", true);
      const resp = await okxSolana.connect();
      publicKey = resp.publicKey.toString();
    } else {
      if (!window.ethereum) return showToast(type + " not found!", true);
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });
      publicKey = accounts[0];
    }

    if (publicKey) {
      userWallet = publicKey;
      updateUIOnSuccess();
    }
  } catch (err) {
    showToast("Connection failed", true);
  }
}

function updateUIOnSuccess() {
  connectBtn.innerText = "Connected";
  connectBtn.style.backgroundColor = "#a9ddd3";
  connectBtn.style.color = "#000";
  showToast("Wallet connected successfully!");
}

async function handleDisconnect() {
  userWallet = null;
  connectBtn.innerText = "Connect wallet";
  connectBtn.style.backgroundColor = "";
  document
    .querySelectorAll(".dollars")
    .forEach((el) => (el.innerText = "$0.00"));
  showToast("Wallet disconnected", true);
}

// 5. SWAP LOGIC & TOKEN SELECTION
const RIALO_PRICE = 0.5;

function calculateSwap() {
  const buyVal = parseFloat(buyInput.value) || 0;
  const topToken = document.querySelectorAll(".me h2")[0].innerText;
  const bottomToken = document.querySelectorAll(".me h2")[1].innerText;

  if (topToken === "RIALO" && bottomToken === "USDC") {
    sellInput.value = (buyVal * RIALO_PRICE).toFixed(2);
  } else if (topToken === "USDC" && bottomToken === "RIALO") {
    sellInput.value = (buyVal / RIALO_PRICE).toFixed(2);
  } else {
    sellInput.value = buyVal.toFixed(2);
  }
}

buyInput.addEventListener("input", calculateSwap);

document.querySelectorAll(".me").forEach((btn, index) => {
  btn.onclick = (e) => {
    e.stopPropagation();
    activeTokenSlot = index;
    tokenModal.style.display = "flex";
  };
});

document.querySelectorAll(".token-option-btn").forEach((btn) => {
  btn.onclick = () => {
    const symbol = btn.getAttribute("data-symbol");
    const img = btn.getAttribute("data-img");
    const targetBtn = document.querySelectorAll(".me")[activeTokenSlot];
    targetBtn.querySelector("h2").innerText = symbol;
    targetBtn.querySelector(".rialo-token").src = img;
    tokenModal.style.display = "none";
    calculateSwap();
    showToast("Selected " + symbol);
  };
});

switchBtn.onclick = () => {
  const btns = document.querySelectorAll(".me");
  const topContent = btns[0].innerHTML;
  btns[0].innerHTML = btns[1].innerHTML;
  btns[1].innerHTML = topContent;
  const tempVal = buyInput.value;
  buyInput.value = sellInput.value;
  sellInput.value = tempVal;
  calculateSwap();
};

swapBtn.onclick = async () => {
  if (!userWallet) return showToast("Connect wallet first!", true);
  if (!buyInput.value || buyInput.value <= 0)
    return showToast("Enter an amount!", true);

  const confirmed = await customConfirm(
    "Are you sure you want to execute this swap?"
  );
  if (confirmed) {
    showToast("Swap confirmed on Solana Testnet!");
  }
};
