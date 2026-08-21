let initialized = false;

export function setupCardPreview() {
  if (initialized || typeof document === "undefined") return;
  initialized = true;

  const preview = document.createElement("div");
  preview.id = "card-preview";
  preview.className = "card-preview";
  preview.hidden = true;
  preview.innerHTML = `
    <div class="card-preview__dialog" role="dialog" aria-modal="true" aria-labelledby="card-preview-title" tabindex="-1">
      <button class="card-preview__close" type="button" aria-label="关闭图片预览">关闭</button>
      <img class="card-preview__image" alt="">
      <p class="card-preview__title" id="card-preview-title"></p>
    </div>
  `;
  document.body.append(preview);

  const image = preview.querySelector(".card-preview__image");
  const title = preview.querySelector(".card-preview__title");
  const closeButton = preview.querySelector(".card-preview__close");
  let activeTrigger = null;

  const closePreview = () => {
    if (preview.hidden) return;

    preview.hidden = true;
    document.body.classList.remove("card-preview-open");
    image.removeAttribute("src");
    activeTrigger?.focus();
    activeTrigger = null;
  };

  const openPreview = (trigger) => {
    activeTrigger = trigger;
    image.src = trigger.dataset.cardSrc;
    image.alt = trigger.dataset.cardAlt;
    title.textContent = trigger.dataset.cardAlt;
    preview.hidden = false;
    document.body.classList.add("card-preview-open");
    closeButton.focus();
  };

  document.addEventListener("click", (event) => {
    const trigger = event.target.closest(".card-preview-trigger");
    if (trigger) {
      openPreview(trigger);
      return;
    }

    if (event.target === preview || event.target.closest(".card-preview__close")) {
      closePreview();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closePreview();
  });
}
