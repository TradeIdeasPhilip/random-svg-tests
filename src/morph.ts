import "./style.css";
import rough from "roughjs";
import { getById } from "phil-lib/client-misc";
import { sleep } from "phil-lib/misc";

const svg = getById("main", SVGSVGElement);

/**
 * Extract the path string from the result of a call to rough.js.
 * @param element The output from rough.js.
 * @returns A value appropriate for the _CSS_ `d` _property_ of a `<path>` element.
 * This value will also work in a lot of other _CSS properties_.
 * This uses a slightly different format than the `d` _attribute_ of a `<path>` element.
 * @deprecated Look for `rough.generator` in letters.ts or
 * https://github.com/rough-stuff/rough/wiki/RoughGenerator for a better approach.
 */
function getPath(element: SVGElement) {
  const elements = element.querySelectorAll("path");
  if (elements.length != 1) {
    throw new Error("wtf");
  }
  const pathElement = elements[0];
  svg.append(pathElement);
  const d = getComputedStyle(pathElement).d;
  pathElement.remove();
  return d;
}


async function main() {
  const rc = rough.svg(svg);
  const hidable = ["initial","final"].map(name => getById(name, SVGPathElement));
  do {
    await sleep(5000 + Math.random() * 2000);
    let initialG : SVGGElement;
    let finalG : SVGGElement;
    if (Math.random() < 0.4) {
      initialG = rc.rectangle(0.1, 0.1, 0.8, 0.8, { bowing: 0, roughness: 0, disableMultiStroke: true });
      finalG = rc.rectangle(0.1, 0.1, 0.8, 0.8,{ disableMultiStroke: true });
    }
    else {
      initialG = rc.circle(0.5, 0.5, 0.8, {bowing:0, roughness: 0.0125, disableMultiStroke: true });
      finalG = rc.circle(0.5, 0.5, 0.8, {bowing:0, roughness: 0.1, disableMultiStroke: true });
    }
    svg.style.setProperty("--initial", getPath(initialG));
    svg.style.setProperty("--final", getPath(finalG));  
    const display = (Math.random() < 0.2)?"":"none";
    hidable.forEach(element=>element.style.display = display)
  } while (true);
}
main()

/* Example of the rough path (square, still had multi stroke on):
<path d="M0.01784908497212992 0.109120428093602
        C0.45036573273304464 0.1646536343276679, 0.660087842469274 0.17319018671941558, 0.9306364422565274 0.10382205081710935 
        M0.06651924250171973 0.11549587364550656 
        C0.3888348687826968 0.1161115129107533, 0.5641686887975521 0.09152411109083522, 1.0304051951662827 0.13641844782803578 
        M1.0105519243690935 0.1580320979679602 
        C0.9384737036238814 0.3875858213971585, 1.0701680949917918 0.7338039223624306, 0.954144074293406 1.0604566643352347 
        M1.0001258793486811 0.11826165095991259 
        C0.9591726617872801 0.4108912181884064, 1.0211289714270047 0.8114889273234864, 0.9677246169120872 1.0307728377287884 
        M1.0109931150677716 0.9839050380110578 
        C0.6339803610195472 1.0593569783990604, 0.3122038800488021 0.9597442391806922, 0.1613397571131493 1.0650327819290113 
        M1.0189774810510117 1.0041133688947963 
        C0.756210555808904 1.0405427338044064, 0.47253208010197373 0.9673247774957566, 0.13954687557768827 1.0105132041023261 
        M0.057719119349329974 0.9366099868584091 
        C0.17562285240440223 0.6921515985844382, 0.05099109856192428 0.5099622134979468, 0.12344070202506917 0.10972537589921412 
        M0.08925276494038001 0.9739324403350893 
        C0.10817848858940665 0.7858536328235539, 0.08346285265140028 0.5527922321889711, 0.12045200452916592 0.06914276888721058" 
    stroke="#000" stroke-width="1" fill="none"></path>
*/

/* Example of the cleaned up path:
<path d="M0.1 0.1 
         C0.3135520226644413 0.1, 0.5271040453288827 0.1, 0.9 0.1 
         M0.1 0.1 
         C0.36664657634749653 0.1, 0.6332931526949931 0.1, 0.9 0.1 
         M0.9 0.1 
         C0.9 0.34473189895389367, 0.9 0.5894637979077872, 0.9 0.9 
         M0.9 0.1 
         C0.9 0.38417524288865224, 0.9 0.6683504857773045, 0.9 0.9 
         M0.9 0.9 
         C0.7217332199631353 0.9, 0.5434664399262706 0.9, 0.1 0.9 
         M0.9 0.9 
         C0.6242268669084678 0.9, 0.34845373381693556 0.9, 0.1 0.9 
         M0.1 0.9 
         C0.1 0.6810867173232132, 0.1 0.4621734346464265, 0.1 0.1 
         M0.1 0.9 
         C0.1 0.625102075698988, 0.1 0.3502041513979759, 0.1 0.1" 
      stroke="#000" stroke-width="1" fill="none"></path>
*/
