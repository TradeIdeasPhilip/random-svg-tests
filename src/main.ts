// This is the preferred way to include a css file.
import "./style.css";

import { getById } from "phil-lib/client-misc";

const circle = document.querySelectorAll("circle")[0];

// Damn compiler and unused variables!
console.warn({getById,circle});