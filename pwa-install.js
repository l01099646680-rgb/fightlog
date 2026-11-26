(() => {
  "use strict";

  const button = document.getElementById("pwa-install");
  const help = document.getElementById("pwa-help");
  const message = document.getElementById("pwa-help-text");
  const installNow = document.getElementById("pwa-install-now");
  const standalone = window.matchMedia("(display-mode: standalone)");
  let pendingPrompt = null;
  let installedThisVisit = false;

  function updateVisibility() {
    button.hidden = installedThisVisit || standalone.matches || navigator.standalone === true;
    if (button.hidden && help.open) help.close();
  }

  function installInstructions() {
    if (/SamsungBrowser/i.test(navigator.userAgent)) {
      return "삼성 인터넷 주소창의 설치 아이콘이나 메뉴(☰)의 ‘앱 설치’를 눌러 주세요. 메뉴에 ‘현재 페이지 추가’가 보이면 ‘홈 화면’을 열고 설치 옵션을 확인하세요.";
    }
    if (/iPad|iPhone|iPod/i.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)) {
      return "공유 메뉴에서 ‘홈 화면에 추가’를 선택하세요. ‘웹 앱으로 열기’가 보이면 켠 다음 ‘추가’를 누르세요.";
    }
    if (/Android/i.test(navigator.userAgent)) {
      return "브라우저 메뉴(⋮)에서 ‘앱 설치’를 눌러 주세요. Chrome에서는 ‘홈 화면에 추가’ 또는 ‘설치 및 바로가기 만들기’를 열고 ‘설치’를 선택할 수 있어요.";
    }
    return "브라우저 주소창의 설치 아이콘이나 메뉴의 ‘앱 설치’를 눌러 주세요. 이미 설치했다면 기기의 앱 목록에서 열 수 있어요.";
  }

  function updateHelp() {
    installNow.hidden = !pendingPrompt;
    message.textContent = pendingPrompt ? "아래 ‘설치’를 누르면 기기의 설치 창이 열려요." : installInstructions();
  }

  function showHelp() {
    updateHelp();
    if (typeof help.showModal === "function") {
      if (!help.open) help.showModal();
    } else {
      window.alert(message.textContent);
    }
  }

  async function requestInstall() {
    if (!pendingPrompt) {
      showHelp();
      return;
    }
    const prompt = pendingPrompt;
    pendingPrompt = null;
    if (help.open) help.close();
    button.disabled = true;
    try {
      await prompt.prompt();
      const choice = await prompt.userChoice;
      if (choice.outcome === "accepted") installedThisVisit = true;
    } catch {
      if (!button.hidden) showHelp();
    } finally {
      button.disabled = false;
      updateVisibility();
    }
  }

  window.addEventListener("beforeinstallprompt", event => {
    event.preventDefault();
    pendingPrompt = event;
    if (help.open) updateHelp();
  });
  window.addEventListener("appinstalled", () => {
    installedThisVisit = true;
    pendingPrompt = null;
    updateVisibility();
  });
  if (standalone.addEventListener) standalone.addEventListener("change", updateVisibility);
  button.addEventListener("click", requestInstall);
  installNow.addEventListener("click", requestInstall);
  updateVisibility();

  if ("serviceWorker" in navigator && window.isSecureContext) {
    navigator.serviceWorker.register("./sw.js").catch(() => {
      // The page and its records remain usable when registration is unavailable.
    });
  }
})();
