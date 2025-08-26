// assets/js/articles.js

document.addEventListener("DOMContentLoaded", async () => {
  const res = await fetch("/post.php");
  const posts = await res.json();

  const categories = new Set();
  posts.forEach((post) => {
    if (post.category) categories.add(post.category);
  });

  // 加上 All 選項並排序
  const allCategories = ["All", ...Array.from(categories).sort()];

  renderCategoryButtons(allCategories);
  renderPosts(posts); // 預設顯示全部

  const buttons = document.querySelectorAll(".category-button");
  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const selected = btn.dataset.category;
      buttons.forEach((b) => b.classList.remove("bg-blue-500", "text-white"));
      btn.classList.add("bg-blue-500", "text-white");

      const filtered =
        selected === "All"
          ? posts
          : posts.filter((p) => p.category === selected);
      renderPosts(filtered);
    });
  });
});

function renderCategoryButtons(categories) {
  const container = document.getElementById("category-buttons");
  container.innerHTML = "";
  categories.forEach((cat) => {
    const btn = document.createElement("button");
    btn.textContent = cat;
    btn.dataset.category = cat;
    btn.className =
      "category-button px-4 py-2 rounded-full border text-sm hover:bg-blue-100 mr-2 mb-2";
    if (cat === "All") btn.classList.add("bg-blue-500", "text-white");
    container.appendChild(btn);
  });
}

function renderPosts(posts) {
  const container = document.getElementById("articles-container");
  container.innerHTML = "";

  if (posts.length === 0) {
    container.innerHTML =
      '<p class="text-gray-500 text-center">No articles in this category.</p>';
    return;
  }

  posts.forEach((post) => {
    const article = document.createElement("article");
    article.className =
      "bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow";

    article.innerHTML = `
      <div class="flex flex-col gap-6">
        <div class="flex-1">
          <h2 class="text-2xl font-semibold mb-3 text-gray-800 hover:text-blue-600 transition-colors">
            <a href="/post/${post.slug}" class="no-underline">${post.title}</a>
          </h2>
          <p class="text-gray-600 mb-4 leading-relaxed">${post.summary}</p>
          <div class="flex flex-wrap gap-2 mb-4">
            ${post.tags
              .map(
                (tag) =>
                  `<span class="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">${tag}</span>`
              )
              .join("")}
          </div>
          <div class="text-sm text-gray-500">
            <span>${post.date}</span>
          </div>
        </div>
      </div>
    `;

    container.appendChild(article);
  });
}