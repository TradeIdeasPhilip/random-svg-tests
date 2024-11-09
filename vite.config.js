import { resolve } from "path";
import { defineConfig } from "vite";

// Help for this config file:
// https://vitejs.dev/config/#config-intellisense

export default defineConfig({
  build: {
    target: "esnext",
    // This works well with GitHub pages.  GitHub can put everything in the docs directory on the web.
    outDir: "docs",
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        spheresDev: resolve(__dirname, "spheres-dev.html"),
        spheresStarfield: resolve(__dirname, "spheres-starfield.html"),
        morph: resolve(__dirname, "morph.html"),
        letters: resolve(__dirname, "letters.html"),
        skyWriting: resolve(__dirname, "sky-writing.html"),
        curves: resolve(__dirname, "curves.html"),
        אֶחָד: resolve(__dirname, "path-debugger.html"),
        /*
        scratch: resolve(__dirname, "scratch.html"),
        topLevel: resolve(__dirname, "top-level.html"),
        internalTableOfContents: resolve(
          __dirname,
          "internal-table-of-contents.html"
        ),
        unlimitedScroll: resolve(__dirname, "unlimited-scroll.html"),
        continuousFontWeight: resolve(__dirname, "continuous-font-weight.html"),*/
      },
    },
  },
  // This is the important part.  The default configuration assumes I have access
  // to the root of the webserver, and each project will share some assets.
  base: "./",
});
