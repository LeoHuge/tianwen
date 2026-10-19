/** Build entry so the static Pages bundle has a JavaScript input. The site itself is the prerendered HTML. */
export default {
  fetch() {
    return new Response("Not found", { status: 404 });
  },
};
