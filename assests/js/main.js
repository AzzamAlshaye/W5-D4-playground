// main.js
const apiUrl = "https://68219a92259dad2655afc3d3.mockapi.io/images";
const imageUrlInput = document.getElementById("li-image");
const postTextInput = document.getElementById("li-textarea");
const submitBtn = document.getElementById("submit");
const formDiv = document.getElementById("form-div");
const currentUser = localStorage.getItem("username");

function setupNewPostSection() {
  formDiv.innerHTML = ""; // clear anything inside

  if (currentUser) {
    // rebuild form
    const card = document.createElement("div");
    card.className = "form-card";

    const lblText = document.createElement("label");
    lblText.setAttribute("for", "li-textarea");
    lblText.innerText = "Text";
    const inputText = postTextInput; // already in DOM
    inputText.className = "form-control mb-2";

    const lblImg = document.createElement("label");
    lblImg.setAttribute("for", "li-image");
    lblImg.innerText = "Image URL";
    const inputImg = imageUrlInput;
    inputImg.className = "form-control mb-3";

    const btn = submitBtn; // already in DOM
    btn.className = "btn btn-primary w-100 mb-2 fw-semibold";

    card.append(lblText, inputText, lblImg, inputImg, btn);
    formDiv.appendChild(card);
  } else {
    // show prompt to log in
    const card = document.createElement("div");
    card.className = "card text-center p-4";

    const msg = document.createElement("p");
    msg.innerText = "Please log in to add a post.";

    const btn = document.createElement("button");
    btn.className = "btn btn-outline-primary";
    btn.innerText = "Go to Login";
    btn.addEventListener("click", () => {
      window.location.href = "./login.html";
    });

    card.appendChild(msg);
    card.appendChild(btn);
    formDiv.appendChild(card);
  }
}

// hook up submit if logged in
if (currentUser) {
  submitBtn.addEventListener("click", async () => {
    if (!postTextInput.value.trim() || !imageUrlInput.value.trim()) return;
    await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        imageUrl: imageUrlInput.value,
        text: postTextInput.value,
        comments: [],
        owner: currentUser,
      }),
    });
    postTextInput.value = "";
    imageUrlInput.value = "";
    getPosts();
  });
}

// initialize new-post area
setupNewPostSection();

// ── posts & comments ─────────────────────────────────────

async function getPosts() {
  const res = await fetch(apiUrl);
  let posts = await res.json();
  posts = posts.map((p) => ({
    ...p,
    comments: Array.isArray(p.comments) ? p.comments : [],
    owner: p.owner || "",
  }));
  displayPosts(posts);
}

function clearContainer(container) {
  while (container.firstChild) {
    container.removeChild(container.firstChild);
  }
}

function displayPosts(posts) {
  const container = document.getElementById("container-main");
  clearContainer(container);

  posts.forEach((item) => {
    // column wrapper
    const col = document.createElement("div");
    col.className = "col-12 col-sm-6 col-lg-4 mb-4";

    // card
    const card = document.createElement("div");
    card.className = "card h-100 shadow-card";

    // image
    const img = document.createElement("img");
    img.src = item.imageUrl;
    img.className = "card-img-top mx-auto";
    img.style.height = "30rem";
    img.style.objectFit = "cover";

    // body
    const body = document.createElement("div");
    body.className = "card-body d-flex flex-column";

    // text
    const title = document.createElement("h5");
    title.innerText = item.text;
    title.className = "card-title";
    body.appendChild(title);

    // delete button (post owner)
    if (currentUser && item.owner === currentUser) {
      const delBtn = document.createElement("button");
      delBtn.className = "btn btn-danger btn-sm align-self-end mb-2";
      delBtn.innerText = "Delete";
      delBtn.addEventListener("click", async () => {
        if (!confirm("Are you sure you want to delete this post?")) return;
        await fetch(`${apiUrl}/${item.id}`, { method: "DELETE" });
        getPosts();
      });
      body.appendChild(delBtn);
    }

    // comments list
    const commentList = document.createElement("ul");
    commentList.className = "list-group list-group-flush mb-3";
    item.comments.forEach((comm, idx) => {
      const li = document.createElement("li");
      li.className =
        "list-group-item d-flex justify-content-between align-items-center";

      const text = document.createElement("span");
      text.innerText = `${comm.user}: ${comm.text}`;
      li.appendChild(text);

      if (currentUser === comm.user) {
        const cDel = document.createElement("button");
        cDel.className = "btn btn-sm btn-outline-danger ms-2";
        cDel.innerText = "Delete";
        cDel.addEventListener("click", async () => {
          if (!confirm("Are you sure you want to delete this comment?")) return;
          const updated = item.comments.filter((_, i) => i !== idx);
          await fetch(`${apiUrl}/${item.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...item, comments: updated }),
          });
          getPosts();
        });
        li.appendChild(cDel);
      }

      commentList.appendChild(li);
    });
    body.appendChild(commentList);

    // comment form or prompt
    if (currentUser) {
      const commentDiv = document.createElement("div");
      commentDiv.className = "mt-auto";

      const input = document.createElement("input");
      input.type = "text";
      input.className = "form-control form-control-sm mb-1";
      input.placeholder = "Add a comment...";

      const btn = document.createElement("button");
      btn.className = "btn btn-primary btn-sm";
      btn.innerText = "Comment";
      btn.addEventListener("click", async () => {
        if (!input.value.trim()) return;
        const newComment = { user: currentUser, text: input.value.trim() };
        await fetch(`${apiUrl}/${item.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...item,
            comments: [...item.comments, newComment],
          }),
        });
        getPosts();
      });

      commentDiv.append(input, btn);
      body.appendChild(commentDiv);
    } else {
      const alert = document.createElement("div");
      alert.className = "alert alert-info mt-auto";
      alert.innerText = "Please log in to comment.";
      const btn = document.createElement("button");
      btn.className = "btn btn-sm btn-outline-primary ms-2";
      btn.innerText = "Login";
      btn.addEventListener(
        "click",
        () => (window.location.href = "./login.html")
      );
      alert.appendChild(btn);
      body.appendChild(alert);
    }

    // assemble
    card.append(img, body);
    col.appendChild(card);
    container.appendChild(col);
  });
}

// kick things off
getPosts();
