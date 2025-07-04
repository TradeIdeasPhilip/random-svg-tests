import { PathShape, PathShapeError, QCommand } from "./path-shape";
import "./path-debugger.css";
import { getById } from "phil-lib/client-misc";
import {
  angleBetween,
  assertClass,
  degreesPerRadian,
  initializedArray,
  parseFloatX,
  polarToRectangular,
  radiansPerDegree,
  Random,
} from "phil-lib/misc";

import { createPathDebugger } from "./path-debugger-widget";
import { averageAngle } from "./utility";
import { makeRoughShape } from "./rough-lib";

/**
 * If there are three straight lines in a row, and the middle one is tiny,
 * then delete the middle one.
 * Reconnect the two new loose ends.
 * Use the average of the two points as the new endpoint for each segment.
 * New angle:  Make the new connection smooth
 * Don't overthink it.  There will be an adjustment phase soon.
 *
 * 👆 Update: I didn't actually have 3 straight lines in a row.  Some were
 * almost lines, but with a very tight curve at the end, you could miss
 * it if you weren't looking close.  In any case, I fixed that and
 * related issues.  And I no longer see three lines in a row.  So that
 * specific pattern isn't interesting any more.  But there are still some
 * good ideas in the previous paragraph.
 *
 * 👆 Most of this work was focused on the second `@` in the sky-writing
 * demo.  This pattern is the default if you hit the Display button in the
 * path-debugger. Use the following string to see what that looked like
 * before the recent fixes:
 *
 * ```
 * M 7.1538154883661145,-7.480293555924569 Q 7.409808340073928,-9.27515747446764 5.7630382598450325,-9.210474329718688 Q 1.8464397799298131,-9.056635060083273 3.4070887371081833,-5.56786398895746 Q 4.441931156328437,-3.254513328808433 7.635120807107003,-4.945727924399682 Q 8.681130161494316,-5.499727680359518 7.5166699420259055,-7.517494736600969 Q 7.612031597111727,-6.668370500899633 9.275991236913981,-7.113116162522168 Q 10.152210420235685,-7.987365722393067 11.028429603557388,-8.861615282263966 Q 11.00019693760491,-8.524464788915399 11.000196937604912,-8.524464788915418 Q 8.167041667103442,-10.66703775386983 5.333886396601973,-12.80961071882424 Q -0.5094669437503738,-14.44804090691655 -0.10101514219622686,-6.127466746635721 Q 0.8532776326675772,13.31243723631145 5.699438670360397,-1.8489848221148395 Q 5.949056437321195,-2.6299246812608157 8.202547109648547,-2.847660789138898
 * ```
 * Need to keep track of the requested angles for `QCommand.Angles()`.
 *
 * Need to keep track of the requested smooth vs kink for each connection.
 * Need to preserve this across a lot of perturbations.
 * Mostly because it's simpler to think about if I save it explicitly!
 * A lot of annoying details disappear‼
 *
 * And the same goes for the multiple disconnected segments.
 * But that should be easier.
 *
 * Remaining tiny segments.
 * Should all tiny segments get merged into other segments?
 * Or at least try, but skip any that cause problems.
 * Or maybe when we see another problem,
 * the first thing we should do is check if a nearby merge would help.
 * Easy to merge.
 * Try to spread these out:
 * If there are nothing but short segments, don't start from one end and keep merging to the end.
 * At least try to start in the middle and/or start with the smallest.
 * And merge it with the smaller of its two neighbors.
 * I.e. similar to a Huffman tree.
 * Replace two adjacent segments with one.
 * Try to keep the angles for the two remaining end points.
 *
 * Should we consider segments that were tiny before the move but are bigger now?
 * Maybe in some of the algorithms above,
 * like the three straights in a row and the middle one is tiny, or all tiny segments should be combined.
 * Or maybe consider all of the things that have grown the most.
 * That will cover things that were tiny before growing,
 * and normal things that got huge because of the angles.
 *
 * TO figure out:  How to adjust when the angles just don't match.
 * I've covered some big, obvious things, above.
 * But I'm sure that won't cover all of the cases.
 * I need something more general.
 *
 * Sometimes a segment is mostly straight, but then it bends very sharply right at the end.
 * It's usually a bad thing.
 * It shows that we are under a lot of stress.
 *
 * Good test cases:
 * - Circle with flat sides:
 *   {"commands":[{"command":"Q","x0":3.0397482613119196,"y0":-7.1717540705766565,"x1":4.81268328285394,"y1":-6.589288386002195,"x":6.26320821862227,"y":-5.340026015316788,"creationInfo":{"source":"angles","success":true,"angle":0.7109882368321347,"angle0":0.31742304435950824}},{"command":"Q","x0":6.26320821862227,"y0":-5.340026015316788,"x1":7.361621605383296,"y1":-4.394019174827127,"x":7.403331069415711,"y":-3.054258073674267,"creationInfo":{"source":"angles","success":true,"angle":1.5396743626955207,"angle0":0.7109882368321347}},{"command":"Q","x0":7.403331069415711,"y0":-3.054258073674267,"x1":6.533767497953137,"y1":-2.2638576838044906,"x":5.664203926490562,"y":-1.4734572939347141,"creationInfo":{"source":"angles","success":false,"angle":2.38165259284772,"angle0":1.5396743626955207}},{"command":"Q","x0":5.664203926490562,"y0":-1.4734572939347141,"x1":3.2148239798047102,"y1":0.8542800302675078,"x":3.0510890413979896,"y":0.8500728930197201,"creationInfo":{"source":"angles","success":true,"angle":3.167281805657251,"angle0":2.38165259284772}},{"command":"Q","x0":3.0510890413979896,"y0":0.8500728930197201,"x1":1.997237826533469,"y1":0.8229943919812388,"x":0.5859120698243099,"y":-1.0069418145833655,"creationInfo":{"source":"angles","success":true,"angle":-2.2277550052555948,"angle0":3.167281805657251}},{"command":"Q","x0":0.5859120698243099,"y0":-1.0069418145833655,"x1":0.2791719268109182,"y1":-1.4046635248537493,"x":-0.015132470564148926,"y":-3.570460496835523,"creationInfo":{"source":"angles","success":true,"angle":-1.7058564132673428,"angle0":-2.2277550052555948}},{"command":"Q","x0":-0.015132470564148926,"y0":-3.570460496835523,"x1":-0.2903361814197378,"y1":-5.595694808538939,"x":0.27530034230827594,"y":-6.206635764778011,"creationInfo":{"source":"angles","success":true,"angle":-0.8238844194126949,"angle0":-1.7058564132673428}},{"command":"Q","x0":0.27530034230827594,"y0":-6.206635764778011,"x1":1.0295864653871105,"y1":-7.021336135034216,"x":3.916997055693417,"y":-7.317903010064519,"creationInfo":{"source":"angles","success":true,"angle":-0.10235141448452117,"angle0":-0.8238844194126949}}]}
 *   I have considered keeping the circle or arc command around longer, not turning it into Qs until the last possible moment.
 *   It makes more sense to think about the entire circle rather than 8 or so independent Qs.
 * - Heart with two flat spots, one is tiny:
 *   {"commands":[{"command":"Q","x0":3.408399044091976,"y0":-5.15825470224646,"x1":3.6906572206784634,"y1":-5.249521018650588,"x":3.9087028339449432,"y":-6.065823869646452,"creationInfo":{"source":"angles","success":true,"angle":-1.3097766971619402,"angle0":-0.31273282546981196}},{"command":"Q","x0":3.9087028339449432,"y0":-6.065823869646452,"x1":4.314092066479203,"y1":-7.583489743879447,"x":5.040668147024015,"y":-7.34108850227857,"creationInfo":{"source":"angles","success":true,"angle":0.3220096835010552,"angle0":-1.3097766971619402}},{"command":"Q","x0":5.040668147024015,"y0":-7.34108850227857,"x1":5.531695710389149,"y1":-6.831691694339941,"x":6.022723273754284,"y":-6.322294886401312,"creationInfo":{"source":"angles","success":false,"angle":0.39203708758023426,"angle0":0.3220096835010552}},{"command":"Q","x0":6.022723273754284,"y0":-6.322294886401312,"x1":6.567071053082872,"y1":-6.097240720060475,"x":6.6072056027676185,"y":-5.564734776593305,"creationInfo":{"source":"angles","success":true,"angle":1.4955693492446116,"angle0":0.39203708758023426}},{"command":"Q","x0":6.6072056027676185,"y0":-5.564734776593305,"x1":6.805754771852126,"y1":-2.930380748992259,"x":3.4667012139845763,"y":-0.0637169309443781,"creationInfo":{"source":"angles","success":true,"angle":2.4321696672133566,"angle0":1.4955693492446116}},{"command":"Q","x0":3.4667012139845763,"y0":-0.0637169309443781,"x1":-0.9621256688127977,"y1":-5.014991913173505,"x":-0.15321910324382393,"y":-6.220877919669255,"creationInfo":{"source":"angles","success":true,"angle":-0.9799386520091642,"angle0":-2.300554491567098}},{"command":"Q","x0":-0.15321910324382393,"y0":-6.220877919669255,"x1":0.15019518192345468,"y1":-6.67319597002007,"x":1.4019470600543635,"y":-6.698410727326004,"creationInfo":{"source":"angles","success":true,"angle":-0.02014085072788216,"angle0":-0.9799386520091642}},{"command":"Q","x0":1.4019470600543635,"y0":-6.698410727326004,"x1":1.3966104449381622,"y1":-6.670158397593582,"x":1.391273829821961,"y":-6.641906067861161,"creationInfo":{"source":"angles","success":false,"angle":-1.6238633720733997,"angle0":-0.02014085072788216}},{"command":"Q","x0":1.391273829821961,"y0":-6.641906067861161,"x1":1.3601504060576022,"y1":-7.227847916322192,"x":2.7613712759307996,"y":-6.497484116386847,"creationInfo":{"source":"angles","success":true,"angle":0.4804900597107274,"angle0":-1.6238633720733997}},{"command":"Q","x0":2.7613712759307996,"y0":-6.497484116386847,"x1":3.502394367705576,"y1":-6.111237770229128,"x":3.0748147179510235,"y":-4.997225348170964,"creationInfo":{"source":"angles","success":true,"angle":1.9372766214912982,"angle0":0.4804900597107274}}]}
 * - A D with a flat spot.
 *   This is what inspired the previous paragraph about signs of stress.
 *   {"commands":[{"command":"Q","x0":0.08504480181439637,"y0":-7.365737452069411,"x1":0.8867453973336454,"y1":-5.267383168359556,"x":0.6065177403832094,"y":0.07852749106776616,"creationInfo":{"source":"controlPoints"}},{"command":"Q","x0":0.6065177403832094,"y0":0.07852749106776616,"x1":1.7065859009128854,"y1":-0.0004413719844311159,"x":2.646362696916784,"y":-0.15726088941829158,"creationInfo":{"source":"angles","success":true,"angle":-0.16534543566878485,"angle0":-0.07166250026776302}},{"command":"Q","x0":2.646362696916784,"y0":-0.15726088941829158,"x1":4.7588000008146825,"y1":-0.5097609724328748,"x":4.489742154590289,"y":-1.5850620136092606,"creationInfo":{"source":"angles","success":true,"angle":-1.8159785545546234,"angle0":-0.16534543566878485}},{"command":"Q","x0":4.489742154590289,"y0":-1.5850620136092606,"x1":3.713778711550061,"y1":-3.463380009941157,"x":2.9378152685098335,"y":-5.341698006273053,"creationInfo":{"source":"angles","success":false,"angle":-1.52111186849561,"angle0":-1.8159785545546234}},{"command":"Q","x0":2.9378152685098335,"y0":-5.341698006273053,"x1":3.034324950499833,"y1":-7.282551532206174,"x":2.623351816372373,"y":-7.290849126282819,"creationInfo":{"source":"angles","success":true,"angle":3.1617800239662133,"angle0":-1.52111186849561}},{"command":"Q","x0":2.623351816372373,"y0":-7.290849126282819,"x1":0.06288312401405587,"y1":-7.342545278879843,"x":-0.3957280731082583,"y":-7.090458162486199,"creationInfo":{"source":"angles","success":true,"angle":2.6389989859803267,"angle0":3.1617800239662133}}]}
 * - ° multiple issues.
 *   See previous notes about circles.
 *   This one seems to be so bad because it's so small compared to the amount of randomness.
 *   {"commands":[{"command":"Q","x0":1.3074878868254065,"y0":-7.298051318039721,"x1":1.180949485761018,"y1":-6.754863966520121,"x":1.2613749515433603,"y":-6.73486903549194,"creationInfo":{"source":"angles","success":true,"angle":0.24367416912984868,"angle0":1.7996697658712706}},{"command":"Q","x0":1.2613749515433603,"y0":-6.73486903549194,"x1":1.5361871407384224,"y1":-6.666546760759586,"x":1.5763997163192718,"y":-6.304126347513187,"creationInfo":{"source":"angles","success":true,"angle":1.4602927196682265,"angle0":0.24367416912984868}},{"command":"Q","x0":1.5763997163192718,"y0":-6.304126347513187,"x1":1.8053928976101699,"y1":-4.240299243795437,"x":0.7900905309201919,"y":-4.730710414484906,"creationInfo":{"source":"angles","success":true,"angle":3.5915640792959818,"angle0":1.4602927196682265}},{"command":"Q","x0":0.7900905309201919,"y0":-4.730710414484906,"x1":0.8290247161473351,"y1":-5.251608991626723,"x":0.8679589013744783,"y":-5.772507568768541,"creationInfo":{"source":"angles","success":false,"angle":-2.330569799545297,"angle0":3.5915640792959818}},{"command":"Q","x0":0.8679589013744783,"y0":-5.772507568768541,"x1":0.6902001170491381,"y1":-5.547360344891256,"x":0.512441332723798,"y":-5.322213121013972,"creationInfo":{"source":"angles","success":false,"angle":2.7020909138156206,"angle0":-2.330569799545297}},{"command":"Q","x0":0.512441332723798,"y0":-5.322213121013972,"x1":-1.7373860992435912,"y1":-4.264407306738075,"x":0.020372674562168083,"y":-6.095868712468029,"creationInfo":{"source":"angles","success":true,"angle":-0.8059297194532833,"angle0":2.7020909138156206}},{"command":"Q","x0":0.020372674562168083,"y0":-6.095868712468029,"x1":0.07996721288288139,"y1":-6.157962043221469,"x":-0.0037010775432974596,"y":-6.233988507366647,"creationInfo":{"source":"angles","success":true,"angle":3.8791745856810547,"angle0":-0.8059297194532833}},{"command":"Q","x0":-0.0037010775432974596,"y0":-6.233988507366647,"x1":-4.507923614380182,"y1":-10.326818795334244,"x":0.8749458057460614,"y":-6.997779743321699,"creationInfo":{"source":"angles","success":true,"angle":0.5538757962922658,"angle0":3.8791745856810547}}]}
 *
 */

const input = getById("pathInputElement", HTMLInputElement);
const button = getById("displaySinglePath", HTMLButtonElement);
const errorElement = getById("singlePathErrorMessage", HTMLSpanElement);

const randomSeedInput = getById("randomSeed", HTMLInputElement);
const roughnessInput = getById("roughness", HTMLInputElement);
const displayRoughButton = getById("displayRough", HTMLButtonElement);

const mainPathDebugger = createPathDebugger();
mainPathDebugger.insertBefore("insertPathDebuggerHere");

const secondDebugger = createPathDebugger();
secondDebugger.insertBefore("insertProcessingPathDebuggerHere");
{
  function redraw() {
    const pathShape = mainPathDebugger.pathShape;
    if (!pathShape) {
      secondDebugger.pathShape = undefined;
    } else {
      const selectedIndex = mainPathDebugger.selectedIndex;
      const processingType = assertClass(
        document.querySelector(
          'input[type="radio"][name="processingType"]:checked'
        ),
        HTMLInputElement
      ).value;
      const originalCommands = pathShape.commands;
      switch (processingType) {
        case "select": {
          secondDebugger.pathShape = pathShape;
          secondDebugger.selectedIndex = selectedIndex;
          break;
        }
        case "mergeWithNext": {
          if (
            selectedIndex < 0 ||
            selectedIndex >= originalCommands.length - 1
          ) {
            // Nothing is selected, or the last segment is selected.
            // Display nothing.
            secondDebugger.pathShape = undefined;
          } else {
            const first = originalCommands[selectedIndex];
            const second = originalCommands[selectedIndex + 1];
            if (!(first instanceof QCommand && second instanceof QCommand)) {
              throw new Error("wtf");
            }
            const replacement = QCommand.angles(
              first.x0,
              first.y0,
              first.requestedIncomingAngle,
              second.x,
              second.y,
              second.requestedOutgoingAngle
            );
            secondDebugger.pathShape = new PathShape(
              originalCommands.toSpliced(selectedIndex, 2, replacement)
            );
            secondDebugger.selectedIndex = selectedIndex;
          }
          break;
        }
        case "deleteThenMerge": {
          if (
            selectedIndex < 1 ||
            selectedIndex >= originalCommands.length - 1
          ) {
            // Nothing is selected or the first or last segment is selected.
            // Display nothing.
            secondDebugger.pathShape = undefined;
          } else {
            const before = originalCommands[selectedIndex - 1];
            const toDelete = originalCommands[selectedIndex];
            const after = originalCommands[selectedIndex + 1];
            if (
              !(
                before instanceof QCommand &&
                toDelete instanceof QCommand &&
                after instanceof QCommand
              )
            ) {
              // TODO it seems like this should be implied (or asserted) all at once at the top.
              throw new Error("wtf");
            }
            const xMid = (before.x + after.x0) / 2;
            const yMid = (before.y + after.y0) / 2;
            const angleA = before.requestedOutgoingAngle;
            const angleB = after.requestedIncomingAngle;
            const angleMid = averageAngle(angleA, angleB);
            const newFirst = QCommand.angles(
              before.x0,
              before.y0,
              before.requestedIncomingAngle,
              xMid,
              yMid,
              angleMid
            );
            const newSecond = QCommand.angles(
              xMid,
              yMid,
              angleMid,
              after.x,
              after.y,
              after.requestedOutgoingAngle
            );
            const newCommands = originalCommands.toSpliced(
              selectedIndex - 1,
              3,
              newFirst,
              newSecond
            );
            secondDebugger.pathShape = new PathShape(newCommands);
            secondDebugger.selectedIndex = selectedIndex - 1;
          }
          break;
        }
        case "recreate": {
          const newCommands = originalCommands.map(
            (originalCommand, index, array) => {
              if (index != selectedIndex) {
                return originalCommand;
              } else {
                const previous = array[index - 1];
                const incomingAngle = previous
                  ? previous instanceof QCommand
                    ? previous.requestedOutgoingAngle
                    : previous.outgoingAngle
                  : originalCommand.incomingAngle;
                const next = array[index + 1];
                const outgoingAngle = next
                  ? next instanceof QCommand
                    ? next.requestedIncomingAngle
                    : next.incomingAngle
                  : originalCommand.outgoingAngle;
                const newCommand = QCommand.angles(
                  originalCommand.x0,
                  originalCommand.y0,
                  incomingAngle,
                  originalCommand.x,
                  originalCommand.y,
                  outgoingAngle
                );
                return newCommand;
              }
            }
          );
          secondDebugger.pathShape = new PathShape(newCommands);
          secondDebugger.selectedIndex = selectedIndex;
          break;
        }
        default: {
          throw new Error("wtf");
        }
      }
    }
  }
  mainPathDebugger.listeners.push(redraw);
  document
    .querySelectorAll('input[type="radio"][name="processingType"]')
    .forEach((element) => element.addEventListener("click", redraw));
}

button.addEventListener("click", () => {
  mainPathDebugger.pathShape = undefined;
  const asString = input.value;
  const pathShape = PathShape.fromString(asString);
  mainPathDebugger.pathShape = pathShape;

  //console.log(unkink(pathShape, 2 * radiansPerDegree).rawPath);

  // Do this so it's easy to paste the next text string.
  input.selectionStart = 0;
  input.selectionEnd = Number.MAX_SAFE_INTEGER;
  input.focus();
});

input.addEventListener("keyup", (event) => {
  if (event.code == "Enter") {
    button.click();
    event.preventDefault();
  }
});

{
  let errorClick = () => {};

  const inputListener = () => {
    const d = input.value;
    if (d.trim() === "") {
      input.style.backgroundColor = "";
      button.disabled = true;
      errorElement.innerText = "";
    } else {
      try {
        PathShape.fromString(d);
        button.disabled = false;
        errorElement.innerText = "";
      } catch (reason) {
        if (!(reason instanceof PathShapeError)) {
          throw reason;
        }
        button.disabled = true;
        errorElement.innerText = reason.message;
        errorClick = () => {
          input.focus();
          input.setSelectionRange(d.length - reason.where.length, d.length);
        };
      }
    }
  };
  input.addEventListener("input", inputListener);
  input.value =
    // This is the same as the next row but I used unkink() to clean it up a little bit.
    "M 217.7,147.93 L 212.3274,201.107 Q 211.0302,213.94645 211.0302,228.9 Q 211.0302,255.57274 217.1449,261.14 Q 223.2502,266.6987 231.4119,266.6987 Q 249.1989,266.6987 252.5349,244.2787 L 259.3906,244.2787 Q 253.2759,295.7877 218.4426,295.7877 Q 181.9416,295.7877 181.9416,253.9137 Q 181.9416,233.01008 186.0165,201.2927 L 192.8722,147.9307 L 174.5292,147.9307 Q 159.39785,147.9307 150.8132,153.1189 Q 142.45157,158.17231 135.2492,173.4999 L 128.579,173.4999 Q 134.4619,153.27806 142.66,141.2599 Q 150.8129,129.308 158.224,125.1399 Q 165.80134,120.8783 180.273,120.8783 L 271.433,120.8783 L 271.433,147.9303 L 217.7,147.93";
  // This is a lower case tau that I copied from wikipedia.
  // I had to add new features to PathShape.fromString() for it to understand this string.
  // ("m217.7 147.93-5.3726 53.177q-1.2972 13.896-1.2972 27.793 0 26.496 6.1147 32.24 6.2997 5.5587 14.267 5.5587 17.787 0 21.123-22.42h6.8557q-6.1147 51.509-40.948 51.509-36.501 0-36.501-41.874 0-21.122 4.0749-52.621l6.8557-53.362h-18.343q-15.193 0-23.716 5.1882-8.3378 5.0027-15.564 20.381h-6.6702q5.9292-20.381 14.081-32.24 8.1528-12.044 15.564-16.12 7.4117-4.2616 22.049-4.2616h91.16v27.052z");
  // This is a heart where the recreate option works and helps!
  // '{"commands":[{"command":"Q","x0":3.4887549340077686,"y0":-5.280275296438213,"x1":3.3240358327531427,"y1":-6.603270946497333,"x":3.986127753487767,"y":-6.945992424474607,"creationInfo":{"source":"angles","success":true,"angle":-0.477655307967376,"angle0":-1.69466355563386}},{"command":"Q","x0":3.986127753487767,"y0":-6.945992424474607,"x1":4.480941645468803,"y1":-7.20212505964597,"x":4.909574006894274,"y":-6.919048098782132,"creationInfo":{"source":"angles","success":true,"angle":0.5836648235165767,"angle0":-0.477655307967376}},{"command":"Q","x0":4.909574006894274,"y0":-6.919048098782132,"x1":5.161356230086409,"y1":-6.790075622391445,"x":5.391585826873779,"y":-6.651408910751343,"creationInfo":{"source":"angles","success":true,"angle":0.5421071297267503,"angle0":0.47339017798323246}},{"command":"Q","x0":5.391585826873779,"y0":-6.651408910751343,"x1":6.730367034445631,"y1":-5.845064330167255,"x":7.027256081149708,"y":-5.194728789900199,"creationInfo":{"source":"angles","success":true,"angle":1.1425363287394048,"angle0":0.5421071297267503}},{"command":"Q","x0":7.027256081149708,"y0":-5.194728789900199,"x1":7.754352753646234,"y1":-3.602023324394345,"x":4.193712100677284,"y":0.42449758198971194,"creationInfo":{"source":"angles","success":true,"angle":2.29486772798718,"angle0":1.1425363287394048}},{"command":"Q","x0":4.193712100677284,"y0":0.42449758198971194,"x1":3.518577720366601,"y1":-0.14254705569255727,"x":2.959092378616333,"y":-0.6853286027908325,"creationInfo":{"source":"angles","success":true,"angle":-2.371347368637816,"angle0":-2.4429920947222046}},{"command":"Q","x0":2.959092378616333,"y0":-0.6853286027908325,"x1":2.3354159292244066,"y1":-1.2903847907343782,"x":1.8486189246177673,"y":-1.8415732979774475,"creationInfo":{"source":"angles","success":true,"angle":-2.294238815702362,"angle0":-2.371347368637816}},{"command":"Q","x0":1.8486189246177673,"y0":-1.8415732979774475,"x1":-1.2821837697078784,"y1":-5.386505676828815,"x":1.8393135751921135,"y":-6.893847698517759,"creationInfo":{"source":"angles","success":true,"angle":-0.4498667187414722,"angle0":-2.294238815702362}},{"command":"Q","x0":1.8393135751921135,"y0":-6.893847698517759,"x1":3.5137578853675318,"y1":-7.702421274858965,"x":3.4548192956830346,"y":-6.81906598197989,"creationInfo":{"source":"angles","success":true,"angle":1.6374188551224442,"angle0":-0.4498667187414722}},{"command":"Q","x0":3.4548192956830346,"y0":-6.81906598197989,"x1":3.319461386978055,"y1":-4.790359056217831,"x":3.5514152019515546,"y":-4.386794653044557,"creationInfo":{"source":"angles","success":true,"angle":1.0491403112818258,"angle0":1.6374188551224442}}]}';
  // This is a heart where some of the curves seem to be going backwards!
  // In when they should be going out.
  // And both endpoints of the segment are turned from smooth to rough.
  //'{"commands":[{"command":"Q","x0":3.3834252375489586,"y0":-5.290583568160529,"x1":3.5124925159687312,"y1":-4.91521650454535,"x":3.923523838711351,"y":-6.390972673475774,"creationInfo":{"source":"controlPoints"}},{"command":"Q","x0":3.923523838711351,"y0":-6.390972673475774,"x1":4.1108100128212985,"y1":-6.466342202563827,"x":4.430439233779907,"y":-6.50340723991394,"creationInfo":{"source":"angles","success":true,"angle":-0.11544696419123954,"angle0":-0.38259923659851125}},{"command":"Q","x0":4.430439233779907,"y0":-6.50340723991394,"x1":5.972219790908077,"y1":-6.682196130880309,"x":6.510204512374078,"y":-6.479479922929334,"creationInfo":{"source":"angles","success":true,"angle":0.3603536203789759,"angle0":-0.11544696419123954}},{"command":"Q","x0":6.510204512374078,"y0":-6.479479922929334,"x1":6.939173247993209,"y1":-6.317841660829115,"x":6.641396180151358,"y":-5.547495854436972,"creationInfo":{"source":"angles","success":true,"angle":1.9396542595721606,"angle0":0.3603536203789759}},{"command":"Q","x0":6.641396180151358,"y0":-5.547495854436972,"x1":5.307663756316599,"y1":-2.0971456075334793,"x":3.5016620833773486,"y":0.057679089569650205,"creationInfo":{"source":"angles","success":true,"angle":2.268352878447364,"angle0":1.9396542595721606}},{"command":"Q","x0":3.5016620833773486,"y0":0.057679089569650205,"x1":-0.4130183359576575,"y1":-4.230915592648992,"x":0.06246967653920748,"y":-5.5573408593306795,"creationInfo":{"source":"angles","success":true,"angle":-1.2265929637532862,"angle0":-2.3106449227356665}},{"command":"Q","x0":0.06246967653920748,"y0":-5.5573408593306795,"x1":0.6935031269755637,"y1":-7.317676957784115,"x":1.049137233064081,"y":-6.282651391765099,"creationInfo":{"source":"angles","success":true,"angle":1.2398349909759245,"angle0":-1.2265929637532862}},{"command":"Q","x0":1.049137233064081,"y0":-6.282651391765099,"x1":1.8145243224046117,"y1":-7.238173150017317,"x":1.8376645615343687,"y":-7.062817477932964,"creationInfo":{"source":"angles","success":true,"angle":1.4395926739218026,"angle0":-0.8954368980448406}},{"command":"Q","x0":1.8376645615343687,"y0":-7.062817477932964,"x1":2.032378347714029,"y1":-5.587285325989216,"x":3.069203621414239,"y":-6.475104309626173,"creationInfo":{"source":"angles","success":true,"angle":-0.7081321196429998,"angle0":1.4395926739218026}},{"command":"Q","x0":3.069203621414239,"y0":-6.475104309626173,"x1":2.9496979297966393,"y1":-6.644423797302531,"x":3.1975236237820632,"y":-5.366784833732487,"creationInfo":{"source":"controlPoints"}}]}';
  // This is an @ that got a little too rough.
  //'{"commands":[{"command":"Q","x0":3.3402364362167827,"y0":-3.3007448073623697,"x1":3.9340253985180738,"y1":-4.407606648762401,"x":3.011655728124868,"y":-4.539237903380115,"creationInfo":{"source":"angles","success":true,"angle":-2.9998399305675316,"angle0":-1.0784066014045661}},{"command":"Q","x0":3.011655728124868,"y0":-4.539237903380115,"x1":1.574687929408164,"y1":-4.744307389359313,"x":1.472816111697163,"y":-3.4705009993745333,"creationInfo":{"source":"angles","success":true,"angle":1.6506008096939941,"angle0":-2.9998399305675316}},{"command":"Q","x0":1.472816111697163,"y0":-3.4705009993745333,"x1":2.425601605422024,"y1":-3.103608911097618,"x":3.378387099146885,"y":-2.7367168228207026,"creationInfo":{"source":"angles","success":false,"angle":1.3560482815273174,"angle0":1.6506008096939941}},{"command":"Q","x0":3.378387099146885,"y0":-2.7367168228207026,"x1":3.3100861700748974,"y1":-2.9792037225344936,"x":3.2417852410029093,"y":-3.2216906222482846,"creationInfo":{"source":"angles","success":false,"angle":-1.3703249858538125,"angle0":1.3560482815273174}},{"command":"Q","x0":3.2417852410029093,"y0":-3.2216906222482846,"x1":3.71956498838227,"y1":-3.1350455976774514,"x":4.1973447357616305,"y":-3.048400573106618,"creationInfo":{"source":"angles","success":false,"angle":-0.1010220204226494,"angle0":-0.1456045239311423}},{"command":"Q","x0":4.1973447357616305,"y0":-3.048400573106618,"x1":5.4196689403631035,"y1":-3.172304017662219,"x":5.061868062841531,"y":-4.160669146632123,"creationInfo":{"source":"angles","success":true,"angle":-1.918132677407088,"angle0":-0.1010220204226494}},{"command":"Q","x0":5.061868062841531,"y0":-4.160669146632123,"x1":5.268526125402326,"y1":-4.012893855293418,"x":5.475184187963122,"y":-3.8651185639547148,"creationInfo":{"source":"angles","success":false,"angle":-0.37440229149874305,"angle0":-1.918132677407088}},{"command":"Q","x0":5.475184187963122,"y0":-3.8651185639547148,"x1":16.480296958276732,"y1":-8.189428173637983,"x":2.683828194676533,"y":-6.181870056091758,"creationInfo":{"source":"angles","success":true,"angle":2.997094360451321,"angle0":-0.37440229149874305}},{"command":"Q","x0":2.683828194676533,"y0":-6.181870056091758,"x1":0.1382015495290775,"y1":-5.81144965915722,"x":0.0608453441230225,"y":-3.4844558053025536,"creationInfo":{"source":"angles","success":true,"angle":1.6040270673159511,"angle0":2.997094360451321}},{"command":"Q","x0":0.0608453441230225,"y0":-3.4844558053025536,"x1":-0.040183084485440876,"y1":-0.4453650018892805,"x":2.6303996577439386,"y":-0.5926166531791432,"creationInfo":{"source":"angles","success":true,"angle":-0.055082620605849786,"angle0":1.6040270673159511}},{"command":"Q","x0":2.6303996577439386,"y0":-0.5926166531791432,"x1":3.7388797143957104,"y1":-0.6537364665377791,"x":4.4264871867272255,"y":-0.9672211302345681,"creationInfo":{"source":"angles","success":true,"angle":-0.42775484124811636,"angle0":-0.055082620605849786}}]}';
  inputListener();
  errorElement.parentElement!.addEventListener("click", () => errorClick());
}
{
  const byAngleTable = getById("byAngle", HTMLTableElement);
  const initialOffset = 0; //45 * radiansPerDegree;
  const columnCount = 5;
  const incomingAngles = initializedArray(
    columnCount,
    (n) => initialOffset + (Math.PI * 2 * n) / columnCount
  );
  const rowCount = 3;
  const outgoingAngles = initializedArray(
    rowCount,
    (n) => initialOffset + (Math.PI * 2 * n) / rowCount
  );
  function appendTH(tr: HTMLTableRowElement, angle?: number) {
    const th = document.createElement("th");
    tr.appendChild(th);
    if (angle !== undefined) {
      th.append(
        (angle * degreesPerRadian).toFixed(1) + "° " + angle.toFixed(3)
      );
    }
  }
  {
    const topRow = byAngleTable.insertRow();
    appendTH(topRow);
    incomingAngles.forEach((angle) => {
      appendTH(topRow, angle);
    });
  }
  outgoingAngles.forEach((outgoingAngle, _rowIndex) => {
    const tr = byAngleTable.insertRow();
    appendTH(tr, outgoingAngle);
    incomingAngles.forEach((incomingAngle, _columnIndex) => {
      const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      svg.classList.add("angles");
      const fromX = 0;
      const toX = 1;
      const fromY = 0;
      const toY = 1;
      svg.viewBox.baseVal.x = fromX;
      svg.viewBox.baseVal.y = fromY;
      svg.viewBox.baseVal.width = toX - fromX;
      svg.viewBox.baseVal.height = toY - fromY;
      const td = tr.insertCell();
      td.appendChild(svg);
      function showAngle(angle: number, fromTopLeft: boolean) {
        const line = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "line"
        );
        const length = 0.2;
        const [x1, y1, a1] = fromTopLeft
          ? [fromX, fromY, angle + Math.PI]
          : [toX, toY, angle];
        const end = polarToRectangular(length, a1);
        line.x1.baseVal.value = x1;
        line.x2.baseVal.value = x1 + end.x;
        line.y1.baseVal.value = y1;
        line.y2.baseVal.value = y1 + end.y;
        svg.appendChild(line);
      }
      showAngle(incomingAngle, true);
      showAngle(outgoingAngle, false);
      const path = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "path"
      );
      const qCommand = QCommand.angles(
        fromX,
        fromY,
        incomingAngle,
        toX,
        toY,
        outgoingAngle
      );
      if (qCommand.creationInfo.success) {
        const d = new PathShape([qCommand]).rawPath;
        path.setAttribute("d", d);
        svg.appendChild(path);
        const error =
          Math.abs(angleBetween(incomingAngle, qCommand.incomingAngle)) +
          Math.abs(angleBetween(outgoingAngle, qCommand.outgoingAngle));
        if (error > radiansPerDegree) {
          console.error({
            error,
            degrees: error * degreesPerRadian,
            path,
            inExpected: incomingAngle,
            inFound: qCommand.incomingAngle,
            outExpected: outgoingAngle,
            outFound: qCommand.outgoingAngle,
            qCommand,
          });
          svg.style.backgroundColor = "lightpink";
        } else {
          svg.style.backgroundColor = "rgb(26, 217, 255)";
        }
      } else {
        svg.style.backgroundColor = "hsl(190 100% 85% / 1)";
      }
      svg.addEventListener("click", () => {
        console.log({
          inExpected: incomingAngle,
          inFound: qCommand?.incomingAngle,
          outExpected: outgoingAngle,
          outFound: qCommand?.outgoingAngle,
          qCommand,
        });
        const newCommand = QCommand.angles(
          fromX,
          fromY,
          incomingAngle,
          toX,
          toY,
          outgoingAngle
        );
        console.log(newCommand);
      });
    });
  });
}

button.click();

displayRoughButton.addEventListener("click", () => {
  let seed = randomSeedInput.value;
  if (!Random.seedIsValid(seed)) {
    seed = Random.newSeed();
    randomSeedInput.value = seed;
  }
  const random = Random.create(seed);
  let roughness = parseFloatX(roughnessInput.value);
  if (roughness === undefined || roughness < 0) {
    // TODO gray the button out to avoid this case.
    alert("Invalid roughness");
  } else {
    console.log(roughness);
    const baseString = input.value;
    const baseShape = PathShape.fromString(baseString);
    const roughShape = makeRoughShape(baseShape, roughness, random).after;
    console.log(roughness, baseShape, roughShape);
    mainPathDebugger.pathShape = roughShape;
  }
});

/**
 * Try to remove small, unintentional kinks.  I.e. make the path smoother.
 * @param original Create an unkinked version of this.
 * @param maxError If the difference in the incoming and outgoing angles are less than this,
 * assume that the intent was was to make them identical.
 * I.e. remove any kinks smaller than this.
 * If a kink is larger than this, assume it was intentional and leave it.
 *
 * This value is in radians.
 */
export function unkink(original: PathShape, maxError: number) {
  if (original.commands.length < 2) {
    // Kinks only appear *between* commands.  So there can't be any kinks unless there are at least two commands.
    return original;
  }
  const newCommands = [...original.commands];
  for (let firstIndex = 0; firstIndex < newCommands.length - 1; firstIndex++) {
    const secondIndex = firstIndex + 1;
    const first = newCommands[firstIndex];
    const second = newCommands[secondIndex];
    const difference = angleBetween(first.outgoingAngle, second.incomingAngle);
    const absDifference = Math.abs(difference);
    const minError = radiansPerDegree * 0.000001;
    if (absDifference <= maxError && absDifference > minError) {
      // Try  to remove the kink.
      if (first instanceof QCommand) {
        if (second instanceof QCommand) {
          const newAngle = first.outgoingAngle + difference / 2;
          newCommands[firstIndex] = first.newAngles(undefined, newAngle);
          newCommands[secondIndex] = second.newAngles(newAngle, undefined);
          console.log(
            newCommands[firstIndex].outgoingAngle,
            newCommands[secondIndex].incomingAngle,
            newAngle,
            difference / radiansPerDegree
          );
        } else {
          newCommands[firstIndex] = first.newAngles(
            undefined,
            second.incomingAngle
          );
        }
      } else {
        if (second instanceof QCommand) {
          newCommands[secondIndex] = second.newAngles(
            first.outgoingAngle,
            undefined
          );
        }
      }
    }
  }
  return new PathShape(newCommands);
}

/*
// Import getDataUrl() from utility.ts.
(async () => {
  console.log(await getDataUrl("/Dilbert.png"));
})();
*/
