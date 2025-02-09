import "./style.css";
import "./dx.css";
import { getById } from "phil-lib/client-misc";

const WIDTH = 16;
const HEIGHT = 9;HEIGHT;

const equations = [
  "f₀(x) = 1 		f₀(x + dx) = 1",
  "f₁(x) = x		f₁(x + dx)= x + dx",
  "f₂(x) = x²		f₂(x + dx) = x² + 2x · dx + (dx)²",
  "f₃(x) = x³		f₃(x + dx) = x³ + 3x² · dx + 3x · (dx)² + (dx)³",
  "f₄(x) = x⁴		f₄(x + dx) = x⁴ + 4x³ · dx + 6x² · (dx)² + 4x(dx)³ + (dx)⁴",
  "f₄(x) = x⁴		(f₄(x + dx) - f₄(x)) ÷ dx = 4x³ + 6x² · dx + 4x(dx)² + (dx)³",
];

const mainSvg = getById("main", SVGSVGElement);

equations.forEach((equation, index) => {
  const textElement = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "text"
  );
  textElement.textContent = equation;
  const y = mainSvg.createSVGLength();
  y.value = (index + 2) * 1;
  textElement.y.baseVal.initialize(y);
  const x = mainSvg.createSVGLength();
  x.value = WIDTH / 2;
  textElement.x.baseVal.initialize(x);
  // This got moved to the html file statically.
  //mainSvg.append(textElement);
});
