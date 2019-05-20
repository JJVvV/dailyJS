(function remove() {
  const img = document.querySelector(
    'a > img[src*="wangbase.com/blogimg/asset/"]',
  )

  if (img) {
    img.parentNode.removeChild(img)
  }
}())
