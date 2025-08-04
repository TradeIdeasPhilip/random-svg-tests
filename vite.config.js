import { resolve } from "path";
import { defineConfig } from "vite";

// Help for this config file:
// https://vitejs.dev/config/#config-intellisense

// I copy this file to every new project.
//
// Notice 3 things:
// • The "target" defaults to esnext.
// • Customize the "input" with your html files.
// • The directory structure is perfect for publishing with GitHub Pages.
//
// More details: https://www.youtube.com/watch?v=8VJIBguoneM

export default defineConfig({
  build: {
    target: "esnext",
    // This works well with GitHub pages.  GitHub can put everything in the docs directory on the web.
    outDir: "docs",
    rollupOptions: {
      input: {
        // The property names (e.g. אֶחָד, שְׁנַיִם) are only used in one place (as far as I can tell).
        // Some of the names of _internal_ files will be based on these names.  These are the same
        // files that have hashes in their file names.  A user would never see these unless he was
        // looking at the page source, the dev tools, etc.  I.e. the property names don't matter.
        אֶחָד: resolve(__dirname, "index.html"),
        שְׁנַיִם: resolve(__dirname, "spheres-dev.html"),
        שְׁלֹושָׁה: resolve(__dirname, "spheres-starfield.html"),
        אַרְבָּעָה: resolve(__dirname, "morph.html"),
        חֲמִשָּׁה: resolve(__dirname, "letters.html"),
        שִׁשָּׁה: resolve(__dirname, "sky-writing.html"),
        שִׁבְעָה: resolve(__dirname, "curves.html"),
        שְׁמוֹנָה: resolve(__dirname, "path-debugger.html"),
        תֵשַׁע: resolve(__dirname, "estimate-tangent-line.html"),
        עֶשֶׂר: resolve(__dirname, "show-text.html"),
        十一: resolve(__dirname, "show-text-1.html"),
        δώδεκα: resolve(__dirname, "tau.html"),
        trèz: resolve(__dirname, "bug-splat.html"),
        katërmbëdhjetë: resolve(__dirname, "moon.html"),
        پانزده: resolve(__dirname, "tangent-line-2.html"),
        mẹrindilogun: resolve(__dirname, "dx.html"),
        ʻumikumāhiku: resolve(__dirname, "text-for-derivative.html"),
        अठारह: resolve(__dirname, "parabola-tangent-line.html"),
        девятнадцать: resolve(__dirname, "parametric-path.html"),
        ҩажәа: resolve(__dirname, "complex-fourier-series.html"),
        اکی: resolve(__dirname, "some4.html"),
        "двадцать два": resolve(__dirname, "hershey-fonts-viewer.html"),
        "ಇರ್ವತ್ತ ಮೂಜಿ": resolve(__dirname, "path-to-fourier.html"),
        ಇರ್ವತ್ತನಾಲ್: resolve(__dirname, "fourier-smackdown.html"),
      },
      output: {
        // Disable code splitting by setting manualChunks to an empty object
        // Grok suggested this but it doesn't seem to do anything.
        manualChunks: {},
      },
    },
  },
  // This is the important part.  The default configuration assumes I have access
  // to the root of the webserver, and each project will share some assets.
  base: "./",
});
