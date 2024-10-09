import { DescriptionOfLetter, Font } from "./letters-base";
import { makeLineFont } from "./line-font";
import { PathShape } from "./path-shape";

export class TextLayout {
  restart(x = 5, baseline = this.lineHeight) {
    this.leftMargin = x;
    this.x = x;
    this.baseline = baseline;
  }
  leftMargin = 0;
  rightMargin = 95;
  x = this.leftMargin;
  baseline = 0;
  lineHeight = 7.5;
  carriageReturn() {
    this.x = this.leftMargin;
  }
  lineFeed(lineCount = 1) {
    this.baseline += this.lineHeight * lineCount;
  }
  CRLF() {
    this.carriageReturn();
    this.lineFeed(4 / 3);
  }
  font = makeLineFont(5);
  getDescription(key: string) {
    return this.font.get(key);
  }
  static join(
    letters: {
      readonly x: number;
      readonly baseline: number;
      readonly description: { readonly shape: PathShape };
    }[]
  ) {
    return new PathShape(
      letters.flatMap(
        (letter) =>
          letter.description.shape.translate(letter.x, letter.baseline).commands
      )
    );
  }
  displayText<
    T extends {
      readonly x: number;
      readonly baseline: number;
      readonly description: { readonly shape: PathShape };
      readonly shape?: PathShape;
    }
  >(letters: readonly T[], destination: SVGElement) {
    return letters.map((letter) => {
      const shape = letter.shape??letter.description.shape;
      const element = shape.makeElement();
      destination.appendChild(element);
      element.style.transform = `translate(${letter.x}px,${letter.baseline}px)`;
      return { ...letter, shape, element };
    });
  }
  private static WORD_BREAK = /^(\n+| +|[^ \n]+)(.*)/ms;
  addText(toAdd: string) {
    const invalid = new Set<string>();
    const result: {
      x: number;
      baseline: number;
      description: DescriptionOfLetter;
      char: string;
    }[] = [];
    while (true) {
      const pieces = TextLayout.WORD_BREAK.exec(toAdd);
      if (!pieces) {
        break;
      }
      const thisWord = pieces[1];
      toAdd = pieces[2];
      if (thisWord[0] == "\n") {
        this.carriageReturn();
        this.lineFeed((thisWord.length * 4) / 3);
      } else if (thisWord[0] == " ") {
        this.addSpace(thisWord.length);
      } else {
        /**
         * Position relative to the first character.
         */
        let x = 0;
        /**
         * Placeholder.
         */
        const baseline = 0;
        const wordInfo = [...thisWord].flatMap((char) => {
          const description = this.getDescription(char);
          if (description) {
            const width =
              description.advance + description.fontMetrics.defaultKerning;
            const charInfo = { x, width, baseline, description, char };
            x += width;
            return charInfo;
          } else {
            invalid.add(char);
            return [];
          }
        });
        if (this.x + x > this.rightMargin && this.x > this.leftMargin) {
          this.carriageReturn();
          this.lineFeed();
        }
        wordInfo.forEach((charInfo) => {
          charInfo.x += this.x;
          charInfo.baseline = this.baseline;
          result.push(charInfo);
        });
        this.x += x;
      }
    }
    if (invalid.size > 0) {
      console.warn(invalid);
    }
    return result;
  }
  addSpace(numberOfSpaces = 1) {
    this.x += this.font.get("0")!.fontMetrics.spaceWidth * numberOfSpaces;
  }
  static textToShape(text: string, font: Font) {
    const layout = new TextLayout();
    layout.font = font;
    const a = layout.addText(text);
    const shape = TextLayout.join(a);
    const advance = layout.x; // TODO this is wrong if the text include a \n.
    return { shape, advance };
  }
}

/**
 * This is a simple way to keep track of your current position on the SVG as you
 * write new letters to it.  You can give it single characters as inputs and
 * it do all the work to display them one at a time.
 *
 * See `TextLayout` for a newer version of this interface.  `TextLayout` keeps track
 * of the layout, but does not immediately display anything.  That makes it easier
 * to manipulate the text before you display it.  This class has a version of
 * that functionality, but it got messy, and that's why I wrote `TextLayout`.
 */
export class Writer {
  constructor(readonly element: SVGSVGElement) {}
  leftMargin = 5;
  rightMargin = 95;
  x = this.leftMargin;
  baseline = 10;
  lineHeight = 7.5;
  carriageReturn() {
    this.x = this.leftMargin;
  }
  lineFeed(lineCount = 1) {
    this.baseline += this.lineHeight * lineCount;
  }
  CRLF() {
    this.carriageReturn();
    this.lineFeed(4 / 3);
  }
  font = makeLineFont(5);
  getDescription(key: string) {
    return this.font.get(key);
  }
  /**
   * __Before__ drawing the letter.
   * @deprecated See `showAndAdvance()`
   */
  makeRoom(description: DescriptionOfLetter) {
    if (
      this.x + description.advance > this.rightMargin &&
      this.x > this.leftMargin
    ) {
      this.carriageReturn();
      this.lineFeed();
    }
  }
  /**
   * __After__ drawing the letter.
   * @deprecated See `showAndAdvance()`
   */
  advance(description: DescriptionOfLetter) {
    this.x += description.advance + description.fontMetrics.defaultKerning;
  }
  /**
   * @deprecated See `showAndAdvance()`
   */
  moveToCursor(element: SVGElement) {
    element.style.transform = `translate(${this.x}px,${this.baseline}px)`;
  }
  showAndAdvance(element: SVGElement, advance: number) {
    if (this.x + advance > this.rightMargin && this.x > this.leftMargin) {
      this.carriageReturn();
      this.lineFeed();
    }
    this.element.appendChild(element);
    element.style.transform = `translate(${this.x}px,${this.baseline}px)`;
    this.x += advance;
    return this;
  }
  show1(description: DescriptionOfLetter) {
    this.makeRoom(description);
    const element = description.makeElement();
    this.element.appendChild(element);
    const { x, baseline } = this;
    this.moveToCursor(element);
    this.advance(description);
    return { element, x, baseline };
  }
  splitAndShow1(description: DescriptionOfLetter) {
    this.makeRoom(description);
    const elementInfo = description.makeElements();
    elementInfo.forEach(({ element }) => {
      this.element.appendChild(element);
      this.moveToCursor(element);
    });
    this.advance(description);
    return elementInfo;
  }
  show(message: string) {
    const invalid = new Set<string>();
    const result = [...message].flatMap((char) => {
      const description = this.getDescription(char);
      if (description) {
        const shown = this.show1(description);
        return { ...shown, description, char };
      } else if (char == " ") {
        this.showSpace();
        return [];
      } else {
        invalid.add(char);
        return [];
      }
    });
    if (invalid.size > 0) {
      console.warn(invalid);
    }
    return result;
  }
  splitAndShow(message: string) {
    // This is a really bad interface.  show() vs splitAndShow()
    // I knew that from the beginning.  Now that I've been manipulating paths more I see the answer.
    // One item should be responsible for layout:  Assign an x and y coordinate to each letter and remember where we left off.
    // Another should be responsible for displaying things that are in that format.
    // Some things (like splitting each character to PathSegments) should be done to the the intermediate data structure between those two calls.
    // So the structure will have to be flexible.  E.g. allow for multiple PathSegment objects per record.
    // And other things can consume this data.  E.g. this should be a valid input to a lot of special effects.
    // Or an input to the thing that merges multiple paths into one path.
    // TODO fix this soon.
    const invalid = new Set<string>();
    const result = [...message].flatMap((char) => {
      const description = this.getDescription(char);
      if (description) {
        return this.splitAndShow1(description);
      } else if (char == " ") {
        this.showSpace();
        return [];
      } else {
        invalid.add(char);
        return [];
      }
    });
    if (invalid.size > 0) {
      console.warn(invalid);
    }
    return result;
  }
  /**
   * Advance the cursor.
   *
   * This never directly causes a word wrap.
   * You can have as many spaces as you want after the right margin.
   * @param count How many spaces.  Defaults to 1.  Does not have to be an integer.
   */
  showSpace(count = 1) {
    this.x += this.font.get("0")!.fontMetrics.spaceWidth * count;
    return this;
  }
}
