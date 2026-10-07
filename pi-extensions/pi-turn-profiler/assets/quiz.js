document.querySelectorAll("[data-reveal]").forEach((button) => {
  button.addEventListener("click", () => {
    const answer = document.getElementById(button.dataset.reveal)
    answer?.classList.toggle("visible")
  })
})
